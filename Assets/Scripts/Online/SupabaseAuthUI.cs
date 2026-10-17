using UnityEngine;
using AshenCrown.Save;

namespace AshenCrown.Online
{
    public sealed class SupabaseAuthUI : MonoBehaviour
    {
        public string email = "";
        public string password = "";

        string status = "";
        SupabaseAuthService subscribedService;

        void OnEnable()
        {
            SubscribeIfReady();
        }

        void Update()
        {
            // Bootstrap creates the service before the UI in the normal path, but retry
            // subscription if scenes or test setup change that order.
            SubscribeIfReady();
        }

        void OnDisable()
        {
            Unsubscribe();
        }

        void SubscribeIfReady()
        {
            var service = SupabaseAuthService.Instance;
            if (service == null || subscribedService == service)
                return;

            Unsubscribe();
            subscribedService = service;
            subscribedService.Error += HandleError;
            subscribedService.EmailConfirmationRequired += HandleEmailConfirmation;
            subscribedService.SignedIn += HandleSignedIn;
            subscribedService.SignedOut += HandleSignedOut;
        }

        void Unsubscribe()
        {
            if (subscribedService == null)
                return;

            subscribedService.Error -= HandleError;
            subscribedService.EmailConfirmationRequired -= HandleEmailConfirmation;
            subscribedService.SignedIn -= HandleSignedIn;
            subscribedService.SignedOut -= HandleSignedOut;
            subscribedService = null;
        }

        void HandleError(string message)
        {
            status = message ?? "The request failed. Please retry.";
        }

        void HandleEmailConfirmation(AuthUser user)
        {
            status = "Account created. Check your email to confirm the address before signing in.";
            password = "";
        }

        void HandleSignedIn(AuthUser user)
        {
            status = "Signed in. Cloud saves are available while the session is valid.";
            password = "";
        }

        void HandleSignedOut(AuthUser user)
        {
            status = "Signed out.";
        }

        void OnGUI()
        {
            var auth = SupabaseAuthService.Instance;
            if (auth == null)
                return;

            var saves = SaveLoadSystem.Instance;
            bool showConflict = saves != null && saves.HasCloudConflict;
            float panelHeight = showConflict ? 420f : 330f;
            GUILayout.BeginArea(new Rect(Screen.width - 330, 20, 300, panelHeight), GUI.skin.box);
            GUILayout.Label("ASHEN CROWN • ACCOUNT");

            if (auth.CurrentUser == null)
            {
                GUILayout.Label("Email");
                email = GUILayout.TextField(email);
                GUILayout.Label("Password");
                password = GUILayout.PasswordField(password, '*');

                if (GUILayout.Button("LOGIN"))
                    auth.Login(email, password);
                if (GUILayout.Button("REGISTER"))
                    auth.Register(email, password);

                GUILayout.Label("Cloud save enabled when Supabase is configured.");
            }
            else
            {
                GUILayout.Label("Signed in: " + auth.CurrentUser.email);
                if (GUILayout.Button("LOG OUT"))
                    auth.Logout();
            }

            if (showConflict)
            {
                GUILayout.Space(8);
                GUILayout.Label("CLOUD SAVE CONFLICT");
                GUILayout.Label("Local: " + saves.PendingLocalSaveTime);
                GUILayout.Label("Cloud: " + saves.PendingCloudSaveTime);
                GUILayout.Label("Choose which journey to keep. The local journey is backed up before cloud restore.");
                if (GUILayout.Button("USE CLOUD (BACK UP LOCAL)"))
                    saves.ResolveCloudConflict(true);
                if (GUILayout.Button("KEEP LOCAL"))
                    saves.ResolveCloudConflict(false);
            }

            if (saves != null && !string.IsNullOrWhiteSpace(saves.CloudSaveStatus))
                GUILayout.Label(saves.CloudSaveStatus);
            if (!string.IsNullOrWhiteSpace(status))
                GUILayout.Label(status);

            GUILayout.EndArea();
        }
    }
}
