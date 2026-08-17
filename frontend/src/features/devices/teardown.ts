import {stopScreenMirror} from '@/features/screen/api'
import {stopShell} from '@/features/shell/api'

// Stops every live session tied to deviceId (screen mirror, shell). Safe
// to call for any deviceId, connected or not — the backend no-ops each
// Stop call when deviceId isn't the currently active session (see
// Service.Stop in the screen/shell Go services), so this never disturbs
// an unrelated device's session.
export async function stopDeviceSessions(deviceId: string) {
  await Promise.allSettled([stopScreenMirror(deviceId), stopShell(deviceId)])
}
