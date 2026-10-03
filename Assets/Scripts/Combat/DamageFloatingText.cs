using UnityEngine;

namespace AshenCrown.Combat
{
    /// <summary>
    /// Chữ sát thương bay lên rồi mờ dần. Không cần prefab: Spawn() tự tạo TextMesh
    /// (không phụ thuộc TextMeshPro). Billboard luôn hướng về camera.
    /// </summary>
    public class DamageFloatingText : MonoBehaviour
    {
        const float Lifetime = 0.9f;
        static Font font;

        TextMesh textMesh;
        Color baseColor;
        float age;
        Vector3 drift;

        public static void Spawn(Vector3 position, string text, Color color, float scale = 1f)
        {
            if (font == null) font = Font.CreateDynamicFontFromOSFont("Arial", 48);

            var go = new GameObject("FloatingText");
            go.transform.position = position;

            var tm = go.AddComponent<TextMesh>();
            tm.text = text;
            tm.font = font;
            tm.characterSize = 0.08f * scale;
            tm.fontSize = 64;
            tm.anchor = TextAnchor.MiddleCenter;
            tm.color = color;
            go.GetComponent<MeshRenderer>().sharedMaterial = font.material;

            var ft = go.AddComponent<DamageFloatingText>();
            ft.textMesh = tm;
            ft.baseColor = color;
            ft.drift = new Vector3(Random.Range(-0.4f, 0.4f), 1.6f, 0f);
        }

        void Update()
        {
            age += Time.deltaTime;
            transform.position += drift * Time.deltaTime;
            drift.y = Mathf.Max(0.3f, drift.y - 2f * Time.deltaTime);

            float a = 1f - Mathf.Clamp01((age - Lifetime * 0.5f) / (Lifetime * 0.5f));
            textMesh.color = new Color(baseColor.r, baseColor.g, baseColor.b, a);
            if (age >= Lifetime) Destroy(gameObject);
        }

        void LateUpdate()
        {
            if (Camera.main != null) transform.rotation = Camera.main.transform.rotation;
        }
    }
}
