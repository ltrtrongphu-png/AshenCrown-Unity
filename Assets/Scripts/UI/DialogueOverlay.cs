using UnityEngine;
using AshenCrown.Dialogue;
using AshenCrown.Localization;

namespace AshenCrown.UI
{
    public sealed class DialogueOverlay:MonoBehaviour
    {
        GUIStyle box,title,body,button;bool initialized;
        void Start(){if(DialogueSystem.Instance!=null){DialogueSystem.Instance.DialogueStarted+=OnStarted;DialogueSystem.Instance.DialogueEnded+=OnEnded;}enabled=false;}
        void OnDestroy(){if(DialogueSystem.Instance!=null){DialogueSystem.Instance.DialogueStarted-=OnStarted;DialogueSystem.Instance.DialogueEnded-=OnEnded;}}
        void OnStarted(string npc,string speaker,string text){enabled=true;}void OnEnded(){enabled=false;}
        void EnsureStyles(){if(initialized)return;initialized=true;box=new GUIStyle(GUI.skin.box){fontSize=18,wordWrap=true};title=new GUIStyle(GUI.skin.label){fontSize=22,fontStyle=FontStyle.Bold};body=new GUIStyle(GUI.skin.label){fontSize=18,wordWrap=true};button=new GUIStyle(GUI.skin.button){fontSize=16,wordWrap=true};}
        void OnGUI(){if(DialogueSystem.Instance==null||!DialogueSystem.Instance.IsOpen)return;EnsureStyles();var node=DialogueSystem.Instance.ActiveNode;var loc=LocalizationService.Instance;float w=Mathf.Min(720,Screen.width-40),h=Mathf.Min(320,Screen.height-40);Rect p=new Rect((Screen.width-w)/2,Screen.height-h-20,w,h);GUI.Box(p,GUIContent.none,box);GUILayout.BeginArea(new Rect(p.x+20,p.y+16,p.width-40,p.height-32));GUILayout.Label(loc!=null?loc.Get(node.speakerKey):node.speakerKey,title);GUILayout.Space(8);GUILayout.Label(loc!=null?loc.Get(node.textKey):node.textKey,body);GUILayout.FlexibleSpace();for(int i=0;i<node.choices.Count;i++){string s=loc!=null?loc.Get(node.choices[i].textKey):node.choices[i].textKey;if(GUILayout.Button(s,button,GUILayout.MinHeight(42)))DialogueSystem.Instance.Choose(i);}GUILayout.EndArea();}
    }
}