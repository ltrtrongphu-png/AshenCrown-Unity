using UnityEngine;
using AshenCrown.Core;
using AshenCrown.Combat;
using AshenCrown.Player;

namespace AshenCrown.UI
{
    [DisallowMultipleComponent]
    [DefaultExecutionOrder(900)]
    public sealed class CinematicHUDDirector : MonoBehaviour
    {
        static CinematicHUDDirector instance;

        PlayerCombatSystem combat;
        PlayerMovementAndCamera movement;
        PlayerStamina stamina;
        HealthAndDamageSystem health;
        HUDPresentationSettings presentationSettings;

        float scanTimer;
        float messageTimer;
        const float MessageDuration = 0.8f;
        string message;
        string targetName = "";
        GUIStyle title;
        GUIStyle label;
        GUIStyle tiny;
        GUIStyle key;
        GUIStyle bar;
        GUIStyle messageStyle;

        readonly Rect playerRect = new Rect(28f, 28f, 326f, 118f);
        readonly Rect targetRect = new Rect(0f, 28f, 330f, 84f);
        readonly Rect actionRect = new Rect(0f, 0f, 292f, 58f);

        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Install()
        {
            if (instance != null) return;
            var existing = FindObjectOfType<CinematicHUDDirector>();
            if (existing != null) { instance = existing; return; }
            var go = new GameObject("Ashen Crown Cinematic HUD");
            instance = go.AddComponent<CinematicHUDDirector>();
            DontDestroyOnLoad(go);
        }

        void Update()
        {
            scanTimer -= Time.unscaledDeltaTime;
            messageTimer = Mathf.MoveTowards(messageTimer, 0f, Time.unscaledDeltaTime);
            if (scanTimer > 0f && combat != null) return;
            scanTimer = 0.5f;
            RebindPlayer();
        }

        void RebindPlayer()
        {
            var next = FindObjectOfType<PlayerCombatSystem>();
            if (next == combat) return;

            Unbind();
            combat = next;
            if (combat == null) return;

            movement = combat.GetComponent<PlayerMovementAndCamera>();
            stamina = combat.GetComponent<PlayerStamina>();
            health = combat.GetComponent<HealthAndDamageSystem>();
            presentationSettings = GetComponent<HUDPresentationSettings>();
            if (presentationSettings == null) presentationSettings = gameObject.AddComponent<HUDPresentationSettings>();

            combat.OnPerfectDodge += ShowPerfectDodge;
            combat.OnParry += ShowParry;
            combat.OnSkillCast += ShowSkill;
            combat.OnChargeFull += ShowCharge;
            combat.OnHitConfirmed += ShowHit;
            if (movement != null) movement.OnLockOnChanged += ShowTarget;
            if (health != null) health.OnDeath += ShowDeath;
        }

        void Unbind()
        {
            if (combat != null)
            {
                combat.OnPerfectDodge -= ShowPerfectDodge;
                combat.OnParry -= ShowParry;
                combat.OnSkillCast -= ShowSkill;
                combat.OnChargeFull -= ShowCharge;
                combat.OnHitConfirmed -= ShowHit;
            }
            if (movement != null) movement.OnLockOnChanged -= ShowTarget;
            if (health != null) health.OnDeath -= ShowDeath;
        }

        void OnDestroy() => Unbind();

        void ShowPerfectDodge() => SetMessage("PERFECT DODGE", 1f);
        void ShowParry(GameObject _) => SetMessage("PARRY", 1f);
        void ShowCharge() => SetMessage("HEAVY • FULL CHARGE", 0.9f);
        void ShowHit(DamageResult result, DamageInfo info)
        {
            if (result.finalDamage <= 0f) return;
            SetMessage(result.critical ? "CRITICAL • " + Mathf.RoundToInt(result.finalDamage) : "HIT • " + Mathf.RoundToInt(result.finalDamage), 0.7f);
        }
        void ShowSkill(int index) => SetMessage(index == 2 ? "SOUL HARVEST" : index == 0 ? "VOID THRUST" : "ASHEN ERUPTION", 0.9f);
        void ShowDeath() => SetMessage("FALLEN • RETURNING TO EMBER", 1.4f);

        void ShowTarget(IDamageable target)
        {
            targetName = target == null ? "" : target.Transform.name.ToUpperInvariant();
            if (target != null) SetMessage("LOCK-ON • " + targetName, 0.65f);
        }

        void SetMessage(string value, float duration)
        {
            message = value ?? "";
            messageTimer = Mathf.Clamp(duration, 0.1f, 4f);
        }

        void EnsureStyles()
        {
            if (title != null) return;
            title = new GUIStyle(GUI.skin.label) { fontStyle = FontStyle.Bold, fontSize = 15, alignment = TextAnchor.UpperLeft };
            label = new GUIStyle(GUI.skin.label) { fontSize = 10, alignment = TextAnchor.UpperLeft };
            tiny = new GUIStyle(GUI.skin.label) { fontSize = 8, alignment = TextAnchor.UpperLeft };
            key = new GUIStyle(GUI.skin.box) { fontSize = 11, fontStyle = FontStyle.Bold, alignment = TextAnchor.MiddleCenter };
            bar = new GUIStyle(GUI.skin.box) { margin = new RectOffset(0, 0, 0, 0), padding = new RectOffset(0, 0, 0, 0) };
            messageStyle = new GUIStyle(title) { alignment = TextAnchor.MiddleCenter, fontSize = 18 };
        }

        void OnGUI()
        {
            EnsureStyles();

            bool reduced = presentationSettings != null ? presentationSettings.ReducedMotion :
                GameSettingsService.Instance != null && GameSettingsService.Instance.ReducedMotion;
            float alpha = presentationSettings != null ? presentationSettings.UIAlpha : 1f;
            float scale = presentationSettings != null ? presentationSettings.UIScale : 1f;

            Matrix4x4 previousMatrix = GUI.matrix;
            Color previousColor = GUI.color;
            GUI.matrix = Matrix4x4.TRS(Vector3.zero, Quaternion.identity, new Vector3(scale, scale, 1f));

            float width = Screen.width / Mathf.Max(0.01f, scale);
            float height = Screen.height / Mathf.Max(0.01f, scale);

            DrawPlayer(alpha);
            DrawTarget(width, alpha);
            DrawReticle(width, height, alpha, reduced);
            DrawActions(width, height, alpha);
            DrawMessage(width, height, alpha, reduced);

            GUI.matrix = previousMatrix;
            GUI.color = previousColor;
        }

        void DrawPanel(Rect rect, float alpha)
        {
            GUI.color = new Color(0.035f, 0.027f, 0.022f, 0.78f * alpha);
            GUI.Box(rect, GUIContent.none, bar);
            GUI.color = new Color(0.78f, 0.45f, 0.25f, 0.38f * alpha);
            GUI.DrawTexture(new Rect(rect.x, rect.y, rect.width, 1f), Texture2D.whiteTexture);
        }

        void DrawPlayer(float alpha)
        {
            if (health == null) return;
            DrawPanel(playerRect, alpha);
            GUI.color = new Color(0.92f, 0.87f, 0.81f, alpha);
            GUI.Label(new Rect(44f, 38f, 220f, 20f), "EMBERBOUND", title);
            GUI.color = new Color(0.72f, 0.64f, 0.55f, alpha);
            GUI.Label(new Rect(44f, 59f, 240f, 16f), combat != null ? GetStateLabel() : "EXPLORING", label);
            DrawMeter(new Rect(44f, 79f, 292f, 8f), health.Health01, new Color(0.68f, 0.18f, 0.16f), alpha);
            if (stamina != null)
                DrawMeter(new Rect(44f, 92f, 292f, 6f), stamina.Normalized, new Color(0.73f, 0.52f, 0.27f), alpha);
            if (combat != null)
                DrawMeter(new Rect(44f, 104f, 292f, 6f), combat.UltimateGauge01, new Color(0.45f, 0.30f, 0.73f), alpha);
        }

        void DrawTarget(float width, float alpha)
        {
            if (movement == null || !movement.IsLockedOn || movement.LockOnTarget == null) return;
            IDamageable target = movement.LockOnTarget;
            var targetHealth = target.Transform.GetComponentInParent<HealthAndDamageSystem>();
            if (targetHealth == null) return;

            Rect rect = targetRect;
            rect.x = (width - rect.width) * 0.5f;
            DrawPanel(rect, alpha);
            GUI.color = new Color(0.92f, 0.87f, 0.81f, alpha);
            GUI.Label(new Rect(rect.x + 18f, rect.y + 12f, rect.width - 36f, 16f),
                string.IsNullOrEmpty(targetName) ? target.Transform.name.ToUpperInvariant() : targetName, title);
            DrawMeter(new Rect(rect.x + 18f, rect.y + 40f, rect.width - 36f, 7f), targetHealth.Health01, new Color(0.62f, 0.14f, 0.12f), alpha);
            DrawMeter(new Rect(rect.x + 18f, rect.y + 52f, rect.width - 36f, 5f), targetHealth.Poise01, new Color(0.56f, 0.52f, 0.38f), alpha);
        }

        void DrawMeter(Rect rect, float value, Color fillColor, float alpha)
        {
            GUI.color = new Color(0.08f, 0.065f, 0.055f, 0.88f * alpha);
            GUI.Box(rect, GUIContent.none, bar);
            GUI.color = new Color(fillColor.r, fillColor.g, fillColor.b, alpha);
            GUI.DrawTexture(new Rect(rect.x, rect.y, rect.width * CinematicHUDMath.ClampBar(value), rect.height), Texture2D.whiteTexture);
        }

        void DrawReticle(float width, float height, float alpha, bool reduced)
        {
            float cx = width * 0.5f;
            float cy = height * 0.5f;
            float pulse = reduced ? 0f : Mathf.Sin(Time.unscaledTime * 4f) * 0.5f;
            GUI.color = new Color(0.86f, 0.66f, 0.43f, Mathf.Clamp01(0.62f + pulse * 0.12f) * alpha);
            GUI.DrawTexture(new Rect(cx - 1f, cy - 8f, 2f, 16f), Texture2D.whiteTexture);
            GUI.DrawTexture(new Rect(cx - 8f, cy - 1f, 16f, 2f), Texture2D.whiteTexture);
        }

        void DrawActions(float width, float height, float alpha)
        {
            if (combat == null) return;
            Rect rect = actionRect;
            rect.x = width - rect.width - 28f;
            rect.y = height - rect.height - 68f;
            DrawPanel(rect, alpha);

            const int count = 3;
            for (int i = 0; i < count; i++)
            {
                float x = rect.x + 12f + i * 90f;
                GUI.color = new Color(0.10f, 0.075f, 0.06f, alpha);
                GUI.Box(new Rect(x, rect.y + 9f, 42f, 38f), i == 0 ? "Q" : i == 1 ? "E" : "R", key);
                GUI.color = new Color(0.80f, 0.72f, 0.63f, alpha);
                GUI.Label(new Rect(x + 47f, rect.y + 10f, 34f, 16f), i == 0 ? "VOID" : i == 1 ? "ERUPT" : "SOUL", tiny);
                float cd = i < 2 ? combat.GetSkillCooldown01(i) : (combat.UltimateReady ? 0f : 1f - combat.UltimateGauge01);
                GUI.color = new Color(0.58f, 0.47f, 0.35f, alpha);
                GUI.Label(new Rect(x + 47f, rect.y + 27f, 40f, 14f), cd <= 0.001f ? "READY" : Mathf.CeilToInt(cd * 100f) + "%", tiny);
            }
        }

        void DrawMessage(float width, float height, float alpha, bool reduced)
        {
            if (string.IsNullOrEmpty(message) || messageTimer <= 0f) return;
            float life = reduced ? 1f : CinematicHUDMath.Pulse(messageTimer, MessageDuration);
            GUI.color = new Color(0.92f, 0.82f, 0.68f, life * alpha);
            GUI.Label(new Rect(0f, height * 0.68f, width, 32f), message, messageStyle);
        }

        string GetStateLabel()
        {
            if (combat.IsDeadState) return "FALLEN";
            if (combat.IsHurt) return "STAGGERED";
            if (combat.IsDodging) return "DODGE";
            if (combat.IsBlocking) return "GUARD";
            if (combat.IsCharging) return "CHARGING";
            if (combat.IsAttacking) return "ATTACK • " + combat.ActionProgress01.ToString("0%");
            return movement != null && movement.IsSprinting ? "SPRINTING" : "EXPLORING";
        }
    }
}