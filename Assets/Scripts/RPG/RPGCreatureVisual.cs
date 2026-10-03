using UnityEngine;
using AshenCrown.Core;
using AshenCrown.RPG;

namespace AshenCrown.RPG
{
    public sealed class RPGCreatureVisual : MonoBehaviour
    {
        [SerializeField] Animator animator;
        Transform visual;
        RPGCreatureDefinition definition;
        Vector3 baseScale;

        public void Build(RPGCreatureDefinition data)
        {
            definition = data;
            baseScale = Vector3.one * data.scale;
            transform.localScale = baseScale;
            if (visual != null) Destroy(visual.gameObject);

            visual = new GameObject("3D_" + data.kind).transform;
            visual.SetParent(transform, false);

            CreateCore(data);
            CreateEyes(data);
            CreateAura(data);

            animator = GetComponentInChildren<Animator>();
        }

        void CreateCore(RPGCreatureDefinition d)
        {
            PrimitiveType shape = d.kind == RPGCreatureKind.Wisp ? PrimitiveType.Sphere :
                                  d.kind == RPGCreatureKind.Brute || d.kind == RPGCreatureKind.Guardian ? PrimitiveType.Capsule :
                                  PrimitiveType.Capsule;
            var body = GameObject.CreatePrimitive(shape);
            body.transform.SetParent(visual, false);
            body.transform.localScale = d.kind == RPGCreatureKind.Wisp ? Vector3.one*.7f : new Vector3(.72f,1.05f,.72f);
            Apply(body.GetComponent<Renderer>(), d.coreColor);

            if (d.kind == RPGCreatureKind.Beast || d.kind == RPGCreatureKind.Stalker)
            {
                var head = GameObject.CreatePrimitive(PrimitiveType.Sphere);
                head.transform.SetParent(visual,false);
                head.transform.localPosition = Vector3.up*.72f;
                head.transform.localScale = Vector3.one*.58f;
                Apply(head.GetComponent<Renderer>(), Color.Lerp(d.coreColor,Color.white,.18f));
            }

            if (d.kind == RPGCreatureKind.Aberration)
            {
                for(int i=0;i<3;i++)
                {
                    var orb=GameObject.CreatePrimitive(PrimitiveType.Sphere);
                    orb.transform.SetParent(visual,false);
                    orb.transform.localPosition=Quaternion.Euler(0,i*120f,0)*Vector3.forward*.72f+Vector3.up*.25f;
                    orb.transform.localScale=Vector3.one*.18f;
                    Apply(orb.GetComponent<Renderer>(),Color.Lerp(d.coreColor,Color.white,.35f));
                }
            }
        }

        void CreateEyes(RPGCreatureDefinition d)
        {
            if (d.kind == RPGCreatureKind.Wisp) return;
            for(int side=-1;side<=1;side+=2)
            {
                var eye=GameObject.CreatePrimitive(PrimitiveType.Sphere);
                eye.transform.SetParent(visual,false);
                eye.transform.localPosition=new Vector3(.19f*side,.72f,.38f);
                eye.transform.localScale=Vector3.one*.09f;
                Apply(eye.GetComponent<Renderer>(),Color.white,true);
            }
        }

        void CreateAura(RPGCreatureDefinition d)
        {
            if (!d.elite && d.kind != RPGCreatureKind.Wisp && d.kind != RPGCreatureKind.Aberration) return;
            var aura=GameObject.CreatePrimitive(PrimitiveType.Sphere);
            aura.transform.SetParent(visual,false);
            aura.transform.localScale=Vector3.one*1.45f;
            Apply(aura.GetComponent<Renderer>(),d.coreColor,true);
            if (d.kind == RPGCreatureKind.Wisp)
            {
                var ps=aura.AddComponent<ParticleSystem>();
                var main=ps.main; main.startColor=d.coreColor; main.startSize=.06f; main.startLifetime=1.1f;
                var em=ps.emission; em.rateOverTime=8f;
            }
        }

        void Apply(Renderer r,Color color,bool transparent=false)
        {
            if(r==null)return;
            var m=new Material(Shader.Find("Standard"));
            m.color=transparent?new Color(color.r,color.g,color.b,.1f):color;
            if(transparent){m.SetFloat("_Mode",3);m.SetInt("_SrcBlend",(int)UnityEngine.Rendering.BlendMode.SrcAlpha);m.SetInt("_DstBlend",(int)UnityEngine.Rendering.BlendMode.OneMinusSrcAlpha);m.SetInt("_ZWrite",0);m.EnableKeyword("_ALPHABLEND_ON");m.renderQueue=3000;}
            m.EnableKeyword("_EMISSION");m.SetColor("_EmissionColor",color*(transparent?1.2f:0.35f));
            r.material=m;
        }

        void Update()
        {
            if(visual==null||definition==null)return;
            bool reduced=GameSettingsService.Instance!=null&&GameSettingsService.Instance.ReducedMotion;
            float motion=reduced ? .15f : 1f;
            float t=Time.time*motion;
            float hover=definition.kind==RPGCreatureKind.Wisp ? .12f : .035f;
            visual.localPosition=Vector3.up*Mathf.Sin(t*1.8f)*hover;
            visual.localRotation=Quaternion.Euler(Mathf.Sin(t*.7f)*2f,t*(definition.elite?8f:4f),Mathf.Cos(t*.5f)*2f);
            float pulse=1f+Mathf.Sin(t*2.4f)*(definition.elite ? .025f : .012f);
            visual.localScale=Vector3.one*pulse;
            if(animator!=null)animator.speed=motion;
        }
    }
}
