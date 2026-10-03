using UnityEngine;
using AshenCrown.Core;
using AshenCrown.Customization;
using AshenCrown.Performance;

namespace AshenCrown.UI
{
    public sealed class SettingsHUD : MonoBehaviour
    {
        bool open;
        Rect window = new Rect(24, 24, 430, 560);

        void Update()
        {
            if (Input.GetKeyDown(KeyCode.F1))
            {
                open = !open;
                Cursor.visible = open;
                Cursor.lockState = open ? CursorLockMode.None : CursorLockMode.Locked;
            }
        }

        void OnGUI()
        {
            if (!open) return;
            window = GUI.Window(7101, window, DrawWindow, "ASHEN CROWN  •  SETTINGS");
        }

        void DrawWindow(int id)
        {
            var settings = GameSettingsService.Instance;
            var appearance = CharacterAppearanceSystem.Instance;
            GUILayout.BeginVertical("box");
            GUILayout.Label("Gameplay & Accessibility", GUI.skin.GetStyle("boldLabel"));
            if (settings != null)
            {
                bool reduced = GUILayout.Toggle(settings.ReducedMotion, " Reduced Motion");
                if (reduced != settings.ReducedMotion) settings.SetReducedMotion(reduced);
                bool subtitles = GUILayout.Toggle(settings.Subtitles, " Subtitles");
                if (subtitles != settings.Subtitles) settings.SetSubtitles(subtitles);
                GUILayout.Label("Master Volume");
                float volume = GUILayout.HorizontalSlider(settings.MasterVolume, 0f, 1f);
                if (Mathf.Abs(volume - settings.MasterVolume) > 0.01f) settings.SetMasterVolume(volume);
            }

            GUILayout.Space(10);
            GUILayout.Label("Graphics");
            GUILayout.BeginHorizontal();
            if (GUILayout.Button("30 FPS")) PerformanceDirector.Instance?.SetTargetFps(30);
            if (GUILayout.Button("60 FPS")) PerformanceDirector.Instance?.SetTargetFps(60);
            if (GUILayout.Button("120 FPS")) PerformanceDirector.Instance?.SetTargetFps(120);
            GUILayout.EndHorizontal();
            if (GUILayout.Button("Balanced Shadows")) PerformanceDirector.Instance?.ConfigureShadows(true);
            if (GUILayout.Button("Disable Shadows")) PerformanceDirector.Instance?.ConfigureShadows(false);

            GUILayout.Space(10);
            GUILayout.Label("Character Appearance");
            if (appearance != null)
            {
                GUILayout.Label("Presets");
                GUILayout.BeginHorizontal();
                if (GUILayout.Button("Ash")) appearance.SetPreset(0);
                if (GUILayout.Button("Ember")) appearance.SetPreset(1);
                if (GUILayout.Button("Void")) appearance.SetPreset(2);
                if (GUILayout.Button("Royal")) appearance.SetPreset(3);
                GUILayout.EndHorizontal();

                GUILayout.Label("Body Scale");
                float scale = GUILayout.HorizontalSlider(appearance.Data.bodyScale, 0.9f, 1.1f);
                if (Mathf.Abs(scale - appearance.Data.bodyScale) > 0.002f) appearance.SetBodyScale(scale);

                GUILayout.BeginHorizontal();
                if (GUILayout.Button("Skin A")) appearance.SetSkinPreset(0);
                if (GUILayout.Button("Skin B")) appearance.SetSkinPreset(1);
                if (GUILayout.Button("Skin C")) appearance.SetSkinPreset(2);
                if (GUILayout.Button("Skin D")) appearance.SetSkinPreset(3);
                GUILayout.EndHorizontal();
                GUILayout.BeginHorizontal();
                if (GUILayout.Button("Hair A")) appearance.SetHairPreset(0);
                if (GUILayout.Button("Hair B")) appearance.SetHairPreset(1);
                if (GUILayout.Button("Hair C")) appearance.SetHairPreset(2);
                if (GUILayout.Button("Hair D")) appearance.SetHairPreset(3);
                GUILayout.EndHorizontal();
                GUILayout.BeginHorizontal();
                if (GUILayout.Button("Outfit A")) appearance.SetOutfitPreset(0);
                if (GUILayout.Button("Outfit B")) appearance.SetOutfitPreset(1);
                if (GUILayout.Button("Outfit C")) appearance.SetOutfitPreset(2);
                if (GUILayout.Button("Outfit D")) appearance.SetOutfitPreset(3);
                GUILayout.EndHorizontal();
            }

            GUILayout.Space(12);
            if (GUILayout.Button("CLOSE")) open = false;
            GUI.DragWindow();
            GUILayout.EndVertical();
        }
    }
}
