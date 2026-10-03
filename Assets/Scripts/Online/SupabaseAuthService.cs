using System;
using System.Collections;
using UnityEngine;
using UnityEngine.Networking;
namespace AshenCrown.Online
{
    [Serializable]sealed class AuthResponse{public string access_token;public string refresh_token;public AuthUser user;}
    [Serializable]public sealed class AuthUser{public string id;public string email;}
    public sealed class SupabaseAuthService:MonoBehaviour
    {
        public static SupabaseAuthService Instance{get;private set;} public event Action<AuthUser> SignedIn,SignedUp,SignedOut;public event Action<string>Error;
        public SupabaseConfig Config;public string AccessToken{get;private set;}public AuthUser CurrentUser{get;private set;}string refreshToken;
        void Awake(){if(Instance!=null&&Instance!=this){Destroy(gameObject);return;}Instance=this;DontDestroyOnLoad(gameObject);if(Config==null)Config=Resources.Load<SupabaseConfig>("SupabaseConfig");}
        public void Register(string email,string password){StartCoroutine(Auth("signup",email,password));} public void Login(string email,string password){StartCoroutine(Auth("token?grant_type=password",email,password));}
        IEnumerator Auth(string endpoint,string email,string password)
        {
            if(Config==null||string.IsNullOrWhiteSpace(Config.projectUrl)||string.IsNullOrWhiteSpace(Config.publishableKey)){Error?.Invoke("Supabase is not configured.");yield break;}
            var body=JsonUtility.ToJson(new Credentials{email=email,password=password});
            using(var req=new UnityWebRequest(Config.projectUrl.TrimEnd('/')+"/auth/v1/"+endpoint,"POST"))
            {req.uploadHandler=new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(body));req.downloadHandler=new DownloadHandlerBuffer();req.SetRequestHeader("Content-Type","application/json");req.SetRequestHeader("apikey",Config.publishableKey);yield return req.SendWebRequest();if(req.result!=UnityWebRequest.Result.Success){Error?.Invoke(req.downloadHandler.text);yield break;}var r=JsonUtility.FromJson<AuthResponse>(req.downloadHandler.text);AccessToken=r.access_token;refreshToken=r.refresh_token;CurrentUser=r.user;if(endpoint=="signup")SignedUp?.Invoke(CurrentUser);else SignedIn?.Invoke(CurrentUser);}
        }
        public void Logout(){AccessToken=null;refreshToken=null;CurrentUser=null;SignedOut?.Invoke();}
        public IEnumerator SaveCloud(string json)
        {
            if(Config==null||!Config.autoCloudSave||CurrentUser==null||string.IsNullOrWhiteSpace(AccessToken))yield break;
            var payload="{\"user_id\":"+JsonUtility.ToJson(CurrentUser.id)+",\"save_json\":"+json+",\"save_text\":"+JsonUtility.ToJson(json)+"}";
            using(var req=new UnityWebRequest(Config.projectUrl.TrimEnd('/')+"/rest/v1/player_saves?on_conflict=user_id","POST"))
            {req.uploadHandler=new UploadHandlerRaw(System.Text.Encoding.UTF8.GetBytes(payload));req.downloadHandler=new DownloadHandlerBuffer();req.SetRequestHeader("Content-Type","application/json");req.SetRequestHeader("apikey",Config.publishableKey);req.SetRequestHeader("Authorization","Bearer "+AccessToken);req.SetRequestHeader("Prefer","resolution=merge-duplicates,return=minimal");yield return req.SendWebRequest();if(req.result!=UnityWebRequest.Result.Success)Error?.Invoke("Cloud save failed: "+req.downloadHandler.text);}
        }
        public IEnumerator LoadCloud(Action<string> onLoaded)
        {
            if(Config==null||CurrentUser==null||string.IsNullOrWhiteSpace(AccessToken)){onLoaded?.Invoke(null);yield break;}
            var url=Config.projectUrl.TrimEnd('/')+"/rest/v1/player_saves?select=save_text&user_id=eq."+UnityWebRequest.EscapeURL(CurrentUser.id)+"&limit=1";
            using(var req=UnityWebRequest.Get(url))
            {
                req.SetRequestHeader("apikey",Config.publishableKey);req.SetRequestHeader("Authorization","Bearer "+AccessToken);
                yield return req.SendWebRequest();
                if(req.result!=UnityWebRequest.Result.Success){Error?.Invoke("Cloud load failed: "+req.downloadHandler.text);onLoaded?.Invoke(null);yield break;}
                var rows=JsonUtility.FromJson<CloudRows>("{\"rows\":"+req.downloadHandler.text+"}");
                onLoaded?.Invoke(rows!=null&&rows.rows!=null&&rows.rows.Length>0?rows.rows[0].save_text:null);
            }
        }
        [Serializable]sealed class Credentials{public string email;public string password;}
        [Serializable]sealed class CloudRow{public string save_text;}
        [Serializable]sealed class CloudRows{public CloudRow[] rows;}
    }
}