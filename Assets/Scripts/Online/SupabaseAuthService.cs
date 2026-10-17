using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;
using AshenCrown.Save;

namespace AshenCrown.Online
{
    [Serializable]
    sealed class AuthResponse
    {
        public string access_token;
        public string refresh_token;
        public int expires_in;
        public AuthUser user;
    }

    [Serializable]
    public sealed class AuthUser
    {
        public string id;
        public string email;
    }

    public sealed class SupabaseAuthService : MonoBehaviour
    {
        const int RequestTimeoutSeconds = 15;

        public static SupabaseAuthService Instance { get; private set; }

        public event Action<AuthUser> SignedIn;
        public event Action<AuthUser> SignedUp;
        public event Action<AuthUser> SignedOut;
        public event Action<AuthUser> EmailConfirmationRequired;
        public event Action<string> Error;

        public SupabaseConfig Config;
        public string AccessToken { get; private set; }
        public AuthUser CurrentUser { get; private set; }

        string refreshToken;
        DateTime tokenExpiresAtUtc;
        bool refreshInProgress;

        void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
            if (Config == null)
                Config = Resources.Load<SupabaseConfig>("SupabaseConfig");
        }

        void OnDestroy()
        {
            if (Instance == this)
                Instance = null;
        }

        public void Register(string email, string password)
        {
            StartCoroutine(Auth("signup", email, password));
        }

        public void Login(string email, string password)
        {
            StartCoroutine(Auth("token?grant_type=password", email, password));
        }

        IEnumerator Auth(string endpoint, string email, string password)
        {
            if (!HasValidConfig())
            {
                Error?.Invoke("Supabase is not configured.");
                yield break;
            }

            string body = JsonUtility.ToJson(new Credentials { email = email, password = password });
            using (var req = CreateJsonRequest(Config.projectUrl.TrimEnd('/') + "/auth/v1/" + endpoint, "POST", body))
            {
                yield return req.SendWebRequest();

                if (req.result != UnityWebRequest.Result.Success)
                {
                    Error?.Invoke(MapRequestError(req.responseCode, "Authentication"));
                    yield break;
                }

                AuthResponse response;
                try
                {
                    response = JsonUtility.FromJson<AuthResponse>(req.downloadHandler.text);
                }
                catch (ArgumentException)
                {
                    Error?.Invoke("The authentication service returned an invalid response.");
                    yield break;
                }

                if (response == null)
                {
                    Error?.Invoke("The authentication service returned an empty response.");
                    yield break;
                }

                CurrentUser = response.user;

                // Supabase can return a user without a session when email confirmation is enabled.
                if (endpoint == "signup" && string.IsNullOrWhiteSpace(response.access_token))
                {
                    AccessToken = null;
                    refreshToken = null;
                    tokenExpiresAtUtc = DateTime.MinValue;
                    if (CurrentUser == null)
                    {
                        Error?.Invoke("The registration response did not include a user. Please retry.");
                        yield break;
                    }
                    EmailConfirmationRequired?.Invoke(CurrentUser);
                    yield break;
                }

                if (string.IsNullOrWhiteSpace(response.access_token) || CurrentUser == null)
                {
                    ClearSession();
                    Error?.Invoke("Authentication did not return a valid session. Check your email and password.");
                    yield break;
                }

                AccessToken = response.access_token;
                refreshToken = response.refresh_token;
                tokenExpiresAtUtc = DateTime.UtcNow.AddSeconds(Math.Max(60, response.expires_in));

                if (endpoint == "signup")
                    SignedUp?.Invoke(CurrentUser);
                else
                    SignedIn?.Invoke(CurrentUser);
            }
        }

        public void Logout()
        {
            AuthUser previousUser = CurrentUser;
            ClearSession();
            SignedOut?.Invoke(previousUser);
        }

        IEnumerator RefreshSessionIfNeeded(bool forceRefresh = false)
        {
            if (string.IsNullOrWhiteSpace(AccessToken))
                yield break;

            // Refresh shortly before expiry. The refresh token remains in memory only;
            // a secure cross-platform persistence adapter is still required for restart recovery.
            if (!forceRefresh && DateTime.UtcNow < tokenExpiresAtUtc.AddSeconds(-60))
                yield break;

            if (string.IsNullOrWhiteSpace(refreshToken))
            {
                ClearSession();
                Error?.Invoke("Your session expired. Please sign in again.");
                yield break;
            }

            if (refreshInProgress)
            {
                while (refreshInProgress)
                    yield return null;
                yield break;
            }

            refreshInProgress = true;
            string body = JsonUtility.ToJson(new RefreshCredentials { refresh_token = refreshToken });
            using (var req = CreateJsonRequest(
                Config.projectUrl.TrimEnd('/') + "/auth/v1/token?grant_type=refresh_token",
                "POST",
                body))
            {
                yield return req.SendWebRequest();
                refreshInProgress = false;

                if (req.result != UnityWebRequest.Result.Success)
                {
                    if (req.responseCode == 400 || req.responseCode == 401)
                        ClearSession();
                    Error?.Invoke(MapRequestError(req.responseCode, "Session refresh"));
                    yield break;
                }

                AuthResponse response = JsonUtility.FromJson<AuthResponse>(req.downloadHandler.text);
                if (response == null || string.IsNullOrWhiteSpace(response.access_token))
                {
                    ClearSession();
                    Error?.Invoke("Your session could not be refreshed. Please sign in again.");
                    yield break;
                }

                AccessToken = response.access_token;
                if (!string.IsNullOrWhiteSpace(response.refresh_token))
                    refreshToken = response.refresh_token;
                if (response.user != null)
                    CurrentUser = response.user;
                tokenExpiresAtUtc = DateTime.UtcNow.AddSeconds(Math.Max(60, response.expires_in));
            }
        }

        public IEnumerator SaveCloud(string json)
        {
            if (!HasValidConfig() || !Config.autoCloudSave || CurrentUser == null || string.IsNullOrWhiteSpace(json))
                yield break;

            yield return RefreshSessionIfNeeded();
            if (CurrentUser == null || string.IsNullOrWhiteSpace(AccessToken))
                yield break;

            AshenSaveData saveData;
            try
            {
                saveData = JsonUtility.FromJson<AshenSaveData>(json);
            }
            catch (ArgumentException)
            {
                Error?.Invoke("Cloud save skipped because the local save is invalid.");
                yield break;
            }

            if (saveData == null || Encoding.UTF8.GetByteCount(json) > 180000)
            {
                Error?.Invoke("Cloud save skipped because the local save is invalid or too large.");
                yield break;
            }

            var payload = new CloudSaveEnvelope
            {
                user_id = CurrentUser.id,
                save_json = saveData,
                save_text = json
            };
            string body = JsonUtility.ToJson(payload);
            string url = Config.projectUrl.TrimEnd('/') + "/rest/v1/player_saves?on_conflict=user_id";
            bool succeeded;
            long responseCode;

            using (var req = CreateJsonRequest(url, "POST", body))
            {
                req.SetRequestHeader("Authorization", "Bearer " + AccessToken);
                req.SetRequestHeader("Prefer", "resolution=merge-duplicates,return=minimal");
                yield return req.SendWebRequest();
                succeeded = req.result == UnityWebRequest.Result.Success;
                responseCode = req.responseCode;
            }

            // A server-side 401 may arrive before the local expiry clock. Refresh once,
            // then retry exactly once to avoid both silent loss and unbounded retry loops.
            if (!succeeded && responseCode == 401)
            {
                yield return RefreshSessionIfNeeded(true);
                if (CurrentUser != null && !string.IsNullOrWhiteSpace(AccessToken))
                {
                    using (var retry = CreateJsonRequest(url, "POST", body))
                    {
                        retry.SetRequestHeader("Authorization", "Bearer " + AccessToken);
                        retry.SetRequestHeader("Prefer", "resolution=merge-duplicates,return=minimal");
                        yield return retry.SendWebRequest();
                        succeeded = retry.result == UnityWebRequest.Result.Success;
                        responseCode = retry.responseCode;
                    }
                }
            }

            if (!succeeded)
                Error?.Invoke(MapRequestError(responseCode, "Cloud save"));
        }

        public IEnumerator LoadCloud(Action<string> onLoaded)
        {
            if (Config == null || CurrentUser == null)
            {
                onLoaded?.Invoke(null);
                yield break;
            }

            yield return RefreshSessionIfNeeded();
            if (CurrentUser == null || string.IsNullOrWhiteSpace(AccessToken))
            {
                onLoaded?.Invoke(null);
                yield break;
            }

            string url = Config.projectUrl.TrimEnd('/') + "/rest/v1/player_saves?select=save_text&user_id=eq."
                + UnityWebRequest.EscapeURL(CurrentUser.id) + "&limit=1";
            string responseText;
            long responseCode;
            bool succeeded;

            using (var req = UnityWebRequest.Get(url))
            {
                req.timeout = RequestTimeoutSeconds;
                req.SetRequestHeader("apikey", Config.publishableKey);
                req.SetRequestHeader("Authorization", "Bearer " + AccessToken);
                yield return req.SendWebRequest();
                succeeded = req.result == UnityWebRequest.Result.Success;
                responseCode = req.responseCode;
                responseText = req.downloadHandler != null ? req.downloadHandler.text : "";
            }

            if (!succeeded && responseCode == 401)
            {
                yield return RefreshSessionIfNeeded(true);
                if (CurrentUser != null && !string.IsNullOrWhiteSpace(AccessToken))
                {
                    using (var retry = UnityWebRequest.Get(url))
                    {
                        retry.timeout = RequestTimeoutSeconds;
                        retry.SetRequestHeader("apikey", Config.publishableKey);
                        retry.SetRequestHeader("Authorization", "Bearer " + AccessToken);
                        yield return retry.SendWebRequest();
                        succeeded = retry.result == UnityWebRequest.Result.Success;
                        responseCode = retry.responseCode;
                        responseText = retry.downloadHandler != null ? retry.downloadHandler.text : "";
                    }
                }
            }

            if (!succeeded)
            {
                Error?.Invoke(MapRequestError(responseCode, "Cloud load"));
                onLoaded?.Invoke(null);
                yield break;
            }

            CloudRows rows;
            try
            {
                rows = JsonUtility.FromJson<CloudRows>("{\"rows\":" + responseText + "}");
            }
            catch (ArgumentException)
            {
                rows = null;
            }

            onLoaded?.Invoke(rows != null && rows.rows != null && rows.rows.Length > 0
                ? rows.rows[0].save_text
                : null);
        }

        bool HasValidConfig()
        {
            return Config != null
                && !string.IsNullOrWhiteSpace(Config.projectUrl)
                && !string.IsNullOrWhiteSpace(Config.publishableKey);
        }

        UnityWebRequest CreateJsonRequest(string url, string method, string body)
        {
            var req = new UnityWebRequest(url, method);
            req.timeout = RequestTimeoutSeconds;
            req.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(body));
            req.downloadHandler = new DownloadHandlerBuffer();
            req.SetRequestHeader("Content-Type", "application/json");
            req.SetRequestHeader("apikey", Config.publishableKey);
            return req;
        }

        static string MapRequestError(long statusCode, string operation)
        {
            if (statusCode == 400 || statusCode == 401 || statusCode == 403)
                return operation + " was rejected. Check your account details and permissions.";
            if (statusCode == 429)
                return operation + " was rate-limited. Please wait a moment and retry.";
            if (statusCode >= 500)
                return operation + " is temporarily unavailable. Please retry later.";
            return operation + " failed because of a network or configuration error.";
        }

        void ClearSession()
        {
            AccessToken = null;
            refreshToken = null;
            tokenExpiresAtUtc = DateTime.MinValue;
            CurrentUser = null;
        }

        [Serializable]
        sealed class Credentials
        {
            public string email;
            public string password;
        }

        [Serializable]
        sealed class RefreshCredentials
        {
            public string refresh_token;
        }

        [Serializable]
        sealed class CloudSaveEnvelope
        {
            public string user_id;
            public AshenSaveData save_json;
            public string save_text;
        }

        [Serializable]
        sealed class CloudRow
        {
            public string save_text;
        }

        [Serializable]
        sealed class CloudRows
        {
            public CloudRow[] rows;
        }
    }
}
