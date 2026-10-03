using UnityEngine;

namespace AshenCrown.Presentation
{
    /// <summary>
    /// Creates a dependency-free 3D Ashen Crown showcase at runtime.
    /// A real prefab can be assigned to modelPrefab; the procedural relic is the fallback.
    /// </summary>
    public sealed class AshenCrown3DShowcase : MonoBehaviour
    {
        [Header("Optional production model")]
        public GameObject modelPrefab;

        [Header("Presentation")]
        [SerializeField] float rotationSpeed = 18f;
        [SerializeField] float bobAmplitude = 0.08f;
        [SerializeField] float bobSpeed = 1.4f;
        [SerializeField] Color metalColor = new Color(0.12f, 0.10f, 0.09f);
        [SerializeField] Color emberColor = new Color(0.86f, 0.28f, 0.08f);

        Transform modelRoot;
        Vector3 basePosition;

        void Start()
        {
            modelRoot = new GameObject("AshenCrown_ModelRoot").transform;
            modelRoot.SetParent(transform, false);

            if (modelPrefab != null)
                Instantiate(modelPrefab, modelRoot);
            else
                BuildProceduralCrown();

            basePosition = modelRoot.localPosition;
        }

        void Update()
        {
            if (modelRoot == null) return;
            modelRoot.Rotate(Vector3.up, rotationSpeed * Time.deltaTime, Space.World);
            modelRoot.localPosition = basePosition + Vector3.up * (Mathf.Sin(Time.time * bobSpeed) * bobAmplitude);
        }

        void BuildProceduralCrown()
        {
            var baseMat = CreateMaterial(metalColor, 0.15f);
            var emberMat = CreateMaterial(emberColor, 2.5f);

            CreatePrimitive(PrimitiveType.Cylinder, "CrownBase", new Vector3(0, 0.05f, 0), new Vector3(1.7f, .18f, 1.7f), baseMat);
            CreatePrimitive(PrimitiveType.Cylinder, "CrownRing", new Vector3(0, 0.18f, 0), new Vector3(1.12f, .06f, 1.12f), baseMat);

            for (int i = 0; i < 8; i++)
            {
                float a = i * Mathf.PI * 2f / 8f;
                Vector3 p = new Vector3(Mathf.Cos(a) * 0.78f, 0.52f, Mathf.Sin(a) * 0.78f);
                var spike = CreatePrimitive(PrimitiveType.Cube, "CrownSpike", p, new Vector3(.22f, .9f, .22f), baseMat);
                spike.transform.localRotation = Quaternion.Euler(-18f, -a * Mathf.Rad2Deg, 0f);
            }

            var ember = CreatePrimitive(PrimitiveType.Sphere, "LastEmber", new Vector3(0, .78f, 0), new Vector3(.32f, .32f, .32f), emberMat);
            var lightGo = new GameObject("EmberLight");
            lightGo.transform.SetParent(modelRoot, false);
            lightGo.transform.localPosition = ember.transform.localPosition;
            var light = lightGo.AddComponent<Light>();
            light.type = LightType.Point;
            light.color = emberColor;
            light.intensity = 2.2f;
            light.range = 5f;
        }

        GameObject CreatePrimitive(PrimitiveType type, string name, Vector3 position, Vector3 scale, Material material)
        {
            var go = GameObject.CreatePrimitive(type);
            go.name = name;
            go.transform.SetParent(modelRoot, false);
            go.transform.localPosition = position;
            go.transform.localScale = scale;
            go.GetComponent<Renderer>().sharedMaterial = material;
            return go;
        }

        Material CreateMaterial(Color color, float emission)
        {
            var shader = Shader.Find("Standard");
            var material = new Material(shader) { color = color };
            if (material.HasProperty("_Metallic")) material.SetFloat("_Metallic", .78f);
            if (material.HasProperty("_Glossiness")) material.SetFloat("_Glossiness", .72f);
            if (material.HasProperty("_EmissionColor"))
            {
                material.EnableKeyword("_EMISSION");
                material.SetColor("_EmissionColor", color * emission);
            }
            return material;
        }
    }
}
