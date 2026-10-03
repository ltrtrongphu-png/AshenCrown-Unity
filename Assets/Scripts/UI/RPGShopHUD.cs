using UnityEngine;

namespace AshenCrown.UI
{
    public sealed class RPGShopHUD : MonoBehaviour
    {
        bool open;
        Vector2 scroll;

        void Update()
        {
            if (Input.GetKeyDown(KeyCode.B)) open = !open;
            if (Input.GetKeyDown(KeyCode.R) && open && AshenCrown.Progression.RPGShopSystem.Instance != null)
                AshenCrown.Progression.RPGShopSystem.Instance.Refresh();
        }

        void OnGUI()
        {
            if (!open || AshenCrown.Progression.RPGShopSystem.Instance == null) return;

            var shop = AshenCrown.Progression.RPGShopSystem.Instance;
            float w = Mathf.Min(720f, Screen.width - 40f);
            float h = Mathf.Min(620f, Screen.height - 80f);
            Rect window = new Rect((Screen.width - w) * .5f, (Screen.height - h) * .5f, w, h);
            GUI.Box(window, "");

            GUILayout.BeginArea(new Rect(window.x + 22f, window.y + 18f, window.width - 44f, window.height - 36f));
            GUILayout.BeginHorizontal();
            GUILayout.Label("SANCTUARY MERCHANT", HeaderStyle());
            GUILayout.FlexibleSpace();
            GUILayout.Label("Ashen Coins: " + shop.Currency, ValueStyle());
            GUILayout.EndHorizontal();

            GUILayout.Space(8f);
            GUILayout.Label("Relics rotate in stock. Press R to refresh the catalogue.", MutedStyle());
            GUILayout.Space(10f);

            scroll = GUILayout.BeginScrollView(scroll, false, true);
            for (int i = 0; i < shop.Offers.Count; i++)
            {
                var offer = shop.Offers[i];
                GUILayout.BeginVertical(GUI.skin.box);
                GUILayout.BeginHorizontal();
                GUILayout.Label(offer.title + "  [" + offer.tier + "]", HeaderStyle());
                GUILayout.FlexibleSpace();
                GUILayout.Label(offer.price + " coins", ValueStyle());
                GUILayout.EndHorizontal();
                GUILayout.Label(offer.description, MutedStyle());
                GUILayout.BeginHorizontal();
                GUILayout.Label(offer.stock > 0 ? "IN STOCK" : "SOLD OUT", MutedStyle());
                GUILayout.FlexibleSpace();
                GUI.enabled = offer.stock > 0 && shop.Currency >= offer.price;
                if (GUILayout.Button("PURCHASE", GUILayout.Width(130f), GUILayout.Height(28f)))
                    shop.Purchase(i);
                GUI.enabled = true;
                GUILayout.EndHorizontal();
                GUILayout.EndVertical();
                GUILayout.Space(6f);
            }
            GUILayout.EndScrollView();

            GUILayout.Space(8f);
            GUILayout.Label("B: close   •   R: refresh", MutedStyle());
            GUILayout.EndArea();
        }

        GUIStyle HeaderStyle()
        {
            var s = new GUIStyle(GUI.skin.label) { fontSize = 18, fontStyle = FontStyle.Bold };
            return s;
        }

        GUIStyle ValueStyle()
        {
            var s = new GUIStyle(GUI.skin.label) { fontSize = 16, fontStyle = FontStyle.Bold };
            return s;
        }

        GUIStyle MutedStyle()
        {
            var s = new GUIStyle(GUI.skin.label) { fontSize = 13 };
            s.wordWrap = true;
            return s;
        }
    }
}
