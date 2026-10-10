# Ashen Crown Security Review

Review target: browser story demo, browser save handling, Supabase account and save integration, and Vercel static deployment configuration.

## Changes in this branch

- Escape player-controlled strings before rendering saved inventory and journal data into HTML; normalize saved items and cap the inventory size.
- Bound the loaded level by the chapter cap, clamp equipment stats/currencies/skill ranks, and reject unknown gear types from equip slots.
- Keep the Supabase publishable key in the browser only; the application does not use a service-role key.
- Use the existing `player_web_saves` table with row-level security. Policies observed on the connected project constrain SELECT, INSERT and UPDATE with `auth.uid() = user_id`.
- Restrict the deployment with CSP and related security headers; allow only the configured Supabase project origin in `connect-src`.
- Make account UI errors and player email content text-only, avoiding HTML interpolation of authentication messages.

## Remaining trust boundary

The browser game is single-player and its state remains client controlled. A player can edit localStorage or submit a fabricated JSON save for their own account. RLS prevents a player from reading or writing another user's save row, but it cannot certify the truth of a player's level, loot, quest completion, or currency. Do not treat client-reported game data as authoritative for leaderboards, competitive play, purchases, trading, or real-money rewards without server-side validation.

## Validation status

Static source syntax and deployment-allow-list checks were run against this branch. The connected Supabase project's security advisor returned no lint findings at the time of inspection, and RLS policies were read directly from the project. A full browser sign-up/confirmation/reset/cloud-restore journey and a Unity Editor compile have not been executed in this environment.

## Release checklist

1. Confirm the production and preview website URLs in Supabase Auth URL Configuration; allow the redirect URLs used by email confirmation and password reset.
2. Confirm the project's email-confirmation policy and configure production SMTP if required.
3. On the deployed preview, test registration, email confirmation, sign-in, sign-out, password reset, saving, restore on a clean browser profile, and simultaneous sessions.
4. In two test accounts, verify that each account can only access its own `player_web_saves` row.
5. Before any competitive online feature, move level, quest, loot and reward validation to a trusted server or database function.
