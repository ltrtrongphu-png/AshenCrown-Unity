using UnityEngine;
using AshenCrown.Boss;
using AshenCrown.Core;

namespace AshenCrown.RPG
{
    public sealed class RPGBossVisualDirector : MonoBehaviour
    {
        BossController boss;
        Transform visual;
        float intensity=1f;
        float phasePulse;

        void Awake()
        {
            boss=GetComponent<BossController>();
            var v=transform.Find("3D_Boss");
            if(v!=null)visual=v;
        }

        void OnEnable()
        {
            if(boss!=null)
            {
                boss.OnPhaseChanged+=OnPhase;
                boss.OnEnrageStarted+=OnEnrage;
                boss.OnDefeated+=OnDefeated;
                boss.OnAttackTelegraph+=OnTelegraph;
            }
        }

        void OnDisable()
        {
            if(boss==null)return;
            boss.OnPhaseChanged-=OnPhase;
            boss.OnEnrageStarted-=OnEnrage;
            boss.OnDefeated-=OnDefeated;
            boss.OnAttackTelegraph-=OnTelegraph;
        }

        void OnPhase(int index,BossPhase phase){intensity=1f+index*.18f;phasePulse=1f;}
        void OnEnrage(){intensity+=.35f;phasePulse=1.5f;}
        void OnTelegraph(BossAttack attack){phasePulse=1.25f;}
        void OnDefeated(){phasePulse=0f;}

        void Update()
        {
            if(visual==null)return;
            bool reduced=GameSettingsService.Instance!=null&&GameSettingsService.Instance.ReducedMotion;
            float motion=reduced ? .2f : 1f;
            float t=Time.time*motion;
            phasePulse=Mathf.MoveTowards(phasePulse,0f,Time.deltaTime*1.6f);
            visual.localRotation=Quaternion.Euler(Mathf.Sin(t*.5f)*3f,t*(3.5f+intensity*2f),Mathf.Cos(t*.65f)*3f);
            float pulse=1f+Mathf.Sin(t*2f)*(.02f*intensity)+phasePulse*.035f;
            visual.localScale=Vector3.one*pulse;
        }
    }
}