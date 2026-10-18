# Save format and migration policy

## Current contracts

| Client | Storage | Current version | Notes |
|---|---|---:|---|
| Unity C# | `Application.persistentDataPath/ashen_crown_save.json` plus `.tmp` and `.bak` | `AshenSaveData.version = 5` | SHA-256 checksum detects corruption/partial writes; it is not a keyed authenticity check. |
| Browser | `localStorage['ashen-crown-3d']` | `saveVersion = 5` | Web cloud sync stores the object in `player_web_saves.save_json`; preserve key and object shape. |

## Unity v5 fields

The serializable `AshenSaveData` contract includes language/preferences, unlocked skills, inventory, progression, world state/events, active/completed quests, reputation, codex IDs, long-term engagement, equipment, loot, appearance, timestamps/reason, and checksum. Treat new fields as a schema change if they affect compatibility or restore behavior.

The current save loader uses temporary write + backup recovery and accepts legacy saves whose checksum is empty. The checksum is SHA-256 without a secret key; it detects accidental corruption, not cheating.

## Browser cloud schema

Migration `002_player_web_saves.sql` defines:

- `user_id`: primary key and foreign key to `auth.users(id)` with cascade on account deletion.
- `save_json`: JSONB payload under a 256 KiB database-size check.
- `updated_at`: timestamp for conflict decisions.
- `version`: integer; defaults to 5.

RLS policies only allow authenticated users to select/insert/update their own row. No anonymous access or explicit delete policy is added. The browser upsert sends version 5 and no longer sends the removed `save_text` column to this table.

Unity migration 001 remains separate: `player_saves` stores both `save_json` and `save_text` for the existing Unity client.

## Future schema changes

Do not switch either contract to v6 without a reviewed migration plan. Required work for a future change:

1. Capture a real v5 fixture in `Assets/Tests/Fixtures/` and `tests/fixtures/`.
2. Write a pure migration function and idempotence/round-trip tests.
3. Verify old fixtures load after migration and new saves reload correctly.
4. Define local/cloud conflict behavior before overwriting user data.
5. Update this document and the security review with the new version and rollback path.


## Encrypted local-save rollout

- The browser keeps the current key `ashen-crown-3d` and the save-object schema at v5, but the stored value is now an `ASHEN-AESGCM-v1:` envelope containing a random 96-bit IV and AES-256-GCM ciphertext.
- The non-extractable AES-GCM `CryptoKey` is stored separately in IndexedDB (`ashen-crown-local-keyring-v1`); it is not stored beside the ciphertext in localStorage. Saves are verified after each write.
- On the first run after this change, any plaintext save at `ashen-crown-3d` and all `ashen-crown-3d.backup.*` copies are intentionally deleted rather than migrated. An unreadable/tampered encrypted envelope is also cleared. A fresh encrypted v5 save is then created as the player progresses.
- A browser-local keyring means clearing site data, losing IndexedDB, or moving only the localStorage ciphertext to another device makes that local save unrecoverable. This is deliberate rather than silently writing plaintext. Optional signed-in cloud backup remains an in-memory v5 payload sent to the existing Supabase table; localStorage itself stores only ciphertext.


- Boot also sweeps old plaintext backup keys even when the primary key is missing or already encrypted. If a current valid encrypted record exists, removing stale backups does not delete its keyring entry.
