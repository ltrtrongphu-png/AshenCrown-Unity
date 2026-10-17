using UnityEngine;

namespace AshenCrown.Core
{
    /// <summary>Persistent frame driver for TimeScaleService; kept in a matching source file.</summary>
    [AddComponentMenu("")]
    public sealed class TimeScaleServiceDriver : MonoBehaviour
    {
        void Awake()
        {
            TimeScaleService.RegisterDriver(this);
        }

        void Update()
        {
            TimeScaleService.TickDriver(this, Time.unscaledTime);
        }

        void OnDestroy()
        {
            TimeScaleService.UnregisterDriver(this);
        }
    }
}
