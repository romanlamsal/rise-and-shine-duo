import { dlopen, FFIType, type FFITypeOrString } from "bun:ffi"

// The DLL that contains the SetSuspendState function
const dllName = "powrprof.dll"

// The Windows API function signature
// BOOLEAN SetSuspendState(
//   [in] BOOLEAN bHibernate,
//   [in] BOOLEAN bForce,
//   [in] BOOLEAN bWakeupEventsDisabled
// );

// BOOLEAN is a 1-byte non-zero value for TRUE, 0 for FALSE. In FFI, this
// is typically mapped to a 32-bit integer (i32) on Windows due to calling conventions.
const {
    symbols: { SetSuspendState },
} = dlopen(dllName, {
    SetSuspendState: {
        // Arguments: [bHibernate, bForce, bWakeupEventsDisabled]
        args: [
            FFIType.i32, // BOOLEAN
            FFIType.i32, // BOOLEAN
            FFIType.i32, // BOOLEAN
        ] as FFITypeOrString[],
        // Return value: BOOLEAN (non-zero on success, zero on failure)
        returns: FFIType.i32,
    },
})

/**
 * Attempts to put the Windows PC into Sleep Mode (Ruhemodus).
 * NOTE: This requires the Bun process to be running with Administrator privileges.
 *
 * @returns {number} The return value of the API call (non-zero means success).
 */
export function putPCIntoRuhemodus(): number {
    // Parameters for SetSuspendState:

    // 1. bHibernate: FALSE (0) for Sleep Mode, TRUE (1) for Hibernate Mode.
    const bHibernate = 0 // 0 = Sleep Mode (Ruhemodus)

    // 2. bForce: FALSE (0) is generally fine. TRUE (1) forces the suspend.
    // We use 0 (FALSE) to allow applications to save state gracefully.
    const bForce = 0

    // 3. bWakeupEventsDisabled: FALSE (0) allows wake events (e.g., mouse/keyboard).
    // TRUE (1) disables them. We typically keep them enabled.
    const bWakeupEventsDisabled = 0

    console.log("Attempting to call SetSuspendState for Sleep Mode (Ruhemodus)...")

    // Call the native Windows function
    const result = SetSuspendState(bHibernate, bForce, bWakeupEventsDisabled)

    return result
}

// --- Execution ---
/*try {
    const success = putPCIntoRuhemodus()

    if (success !== 0) {
        // The system is now entering sleep mode, so this message may not display before it sleeps.
        console.log("✅ SetSuspendState returned success. PC should now be entering Sleep Mode.")
    } else {
        // If it failed, it's almost certainly a lack of permissions (requires SeShutdownPrivilege)
        console.error("❌ SetSuspendState failed (returned 0). You likely need to run this script as Administrator.")
    }
} catch (e) {
    console.error("An error occurred during FFI execution:", e)
}*/
