using UnityEngine;

namespace AshenCrown.Core
{
    /// <summary>Optional trigger placed in a scene to define a respawn checkpoint.</summary>
    [RequireComponent(typeof(Collider))]
    public sealed class CheckpointAnchor : MonoBehaviour
    {
        [SerializeField] Transform respawnPoint;

        void Reset()
        {
            var col = GetComponent<Collider>();
            col.isTrigger = true;
        }

        void OnTriggerEnter(Collider other)
        {
            if (other.GetComponentInParent<AshenCrown.Player.PlayerCombatSystem>() == null) return;
            if (PlayerRespawnDirector.Instance == null) return;
            PlayerRespawnDirector.Instance.SetCheckpoint(respawnPoint != null ? respawnPoint : transform);
        }
    }
}
