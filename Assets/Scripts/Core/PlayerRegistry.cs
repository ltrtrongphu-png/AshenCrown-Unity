using System;
using AshenCrown.Player;

namespace AshenCrown.Core
{
    /// <summary>
    /// Single-player runtime registry. Components bind to the current PlayerCombatSystem
    /// instead of caching a GameObject found by tag once at startup.
    /// </summary>
    public static class PlayerRegistry
    {
        public static PlayerCombatSystem CurrentPlayer { get; private set; }
        public static event Action<PlayerCombatSystem> PlayerChanged;

        [RuntimeInitializeOnLoadMethod(UnityEngine.RuntimeInitializeLoadType.SubsystemRegistration)]
        static void ResetStatics()
        {
            CurrentPlayer = null;
            PlayerChanged = null;
        }

        public static void Register(PlayerCombatSystem player)
        {
            if (player == null) return;
            if (CurrentPlayer == player) return;
            CurrentPlayer = player;
            PlayerChanged?.Invoke(player);
        }

        public static void Unregister(PlayerCombatSystem player)
        {
            if (CurrentPlayer != player) return;
            CurrentPlayer = null;
            PlayerChanged?.Invoke(null);
        }
    }
}
