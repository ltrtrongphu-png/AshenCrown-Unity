/**
 * Keep one latest cloud-save snapshot per active account. A snapshot is copied
 * at enqueue time so gameplay mutations cannot modify an in-flight upload.
 * This queue is intentionally in-memory; it never persists user data or tokens.
 */
function cloneSave(save) {
  if (!save || typeof save !== 'object' || Array.isArray(save)) return null;
  try {
    const encoded = JSON.stringify(save);
    if (!encoded) return null;
    const copy = JSON.parse(encoded);
    return copy && typeof copy === 'object' && !Array.isArray(copy) ? copy : null;
  } catch {
    return null;
  }
}

export class CloudSaveQueue {
  #pending = null;

  get hasPending() {
    return this.#pending !== null;
  }

  enqueue(userId, save) {
    if (typeof userId !== 'string' || userId.length === 0) return false;
    const copy = cloneSave(save);
    if (!copy) return false;
    this.#pending = { userId, save: copy };
    return true;
  }

  take(userId) {
    if (!this.#pending) return null;
    if (typeof userId !== 'string' || userId.length === 0 || this.#pending.userId !== userId) {
      // Never let stale work for one account spill into another account.
      this.#pending = null;
      return null;
    }
    const snapshot = this.#pending;
    this.#pending = null;
    return { userId: snapshot.userId, save: cloneSave(snapshot.save) };
  }

  retry(snapshot, currentUserId) {
    if (!snapshot || typeof snapshot.userId !== 'string' ||
        !snapshot.userId || snapshot.userId !== currentUserId) return false;
    const copy = cloneSave(snapshot.save);
    if (!copy) return false;

    // A newer save queued while the request was in flight wins over the failed
    // older snapshot. Never replace newer same-account progress with stale data.
    if (this.#pending?.userId === currentUserId) return true;
    if (this.#pending && this.#pending.userId !== currentUserId) this.#pending = null;
    this.#pending = { userId: snapshot.userId, save: copy };
    return true;
  }

  clearForUser(userId) {
    const activeUserId = typeof userId === 'string' && userId.length > 0 ? userId : null;
    if (this.#pending && this.#pending.userId !== activeUserId) this.#pending = null;
  }

  clear() {
    this.#pending = null;
  }
}
