using UnityEngine;
namespace AshenCrown.Online
{
    public sealed class SupabaseAuthUI:MonoBehaviour
    {
        public string email="";public string password="";
        void OnGUI(){var auth=SupabaseAuthService.Instance;if(auth==null)return;GUILayout.BeginArea(new Rect(Screen.width-330,20,300,240),GUI.skin.box);GUILayout.Label("ASHEN CROWN • ACCOUNT");if(auth.CurrentUser==null){GUILayout.Label("Email");email=GUILayout.TextField(email);GUILayout.Label("Password");password=GUILayout.PasswordField(password,'*');if(GUILayout.Button("LOGIN"))auth.Login(email,password);if(GUILayout.Button("REGISTER"))auth.Register(email,password);GUILayout.Label("Cloud save enabled when Supabase is configured.");}else{GUILayout.Label("Signed in: "+auth.CurrentUser.email);if(GUILayout.Button("LOG OUT"))auth.Logout();}GUILayout.EndArea();}
    }
}