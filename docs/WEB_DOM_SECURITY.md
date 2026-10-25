# Browser DOM sink audit

Scope: the Three.js browser game in play.js, including save-derived inventory, equipment, journal, and archive views. Browser local/cloud saves are player-controlled input, even when loaded through the encrypted local-save adapter. Encryption protects confidentiality/integrity at rest for a device key; it does not make imported, legacy, or remote application data trusted.

## Rendering invariant

1. Do not concatenate free-form save, inventory, journal, account, or remote text into HTML.
2. For text-only fields, use textContent or an appropriate DOM property.
3. When a string must be rendered as part of an HTML template, run it through escapeHtml in that exact text/attribute context and constrain values used as CSS classes, URLs, numeric styles, and selectors to allow-listed values.
4. Run saved inventory records through sanitizeItemRecord before using their fields. The sanitizer bounds strings and array sizes, allow-lists item types/rarities/IDs, and clamps numeric stats. It is normalization, not the final HTML encoding step.
5. Bound log-entry count/length before displaying saved journal content. HTML-encode it again at the DOM sink; do not rely on string cleanup as an XSS defense.

## Source-to-sink inventory

The 24 innerHTML writes present in this review fall into these groups:

| Sink group | Data source | Guard and disposition |
|---|---|---|
| NPC nameplate skeleton | Constant b/small skeleton | Person name and role are assigned later through textContent; no saved string is interpolated into the skeleton |
| Encounter HUD skeleton | Constant HUD elements | Warden label and HP are assigned through textContent / bounded percentage style |
| System menu: role, skills, base/settings | Constant ROLE_DEFS, MAPS, hard-coded labels, normalized numeric state | Role/appearance/quality are allow-listed; skill names are escaped; save-derived free-form strings are not used as menu HTML |
| Shop shell and stock cards | Constant HTML shell and hard-coded SHOP_STOCK | Merchant title uses textContent; stock names/type/rarity/descriptions are source constants, not player inventory data |
| Journal: story | Saved state.log entries | Entries are capped to 80 lines and 1,000 characters per line; each is passed through escapeHtml at render time |
| Journal: people/world/campaign | NPC/gate definitions and campaign data | NPC/gate/campaign text is escaped; reputation and counts are numeric |
| Archive: rank/achievements/challenges | Normalized numeric progression and constant goal descriptions | Progress/style values are derived from bounded numeric state; free-form descriptions are escaped |
| Archive: collection/items | Saved inventory | Inventory is normalized by sanitizeItemRecord; item name, type, rarity, attrs, stat keys and icon text are escaped at the HTML sink; rarity/type are allow-listed |
| Equipment slot buttons | Saved equipment name | refreshEquipment escapes slot/name before rebuilding markup; tooltip is assigned as a DOM property |
| Inventory cards | Saved inventory | sanitizeItemRecord then escapeHtml for name/type/rarity/attrs/stats; action indices are numeric |
| World map | Hard-coded map labels/coordinates | Labels and CSS values are constants; no save string is interpolated |
| Touch controls / owner console skeleton | Constant HTML skeleton | Runtime values are assigned through DOM properties or escaped in the diagnostic renderer |

Interactive dialogue speaker/text/choices use textContent and generated buttons, not an HTML-string sink. Owner diagnostic rows pass both labels and values through escapeHtml.

## Regression coverage

tests/e2e/xss-safety.mjs seeds a local v5 save with HTML/event-handler payloads in item name, item attributes, equipment name and journal history, then exercises inventory, equipment, journal and archive screens in Chromium. It asserts the payload remains readable text, no payload-created IMG/SVG nodes exist, and no handler executes.

tests/web/save-utils.test.mjs also verifies that saved journal entries have control characters removed and are bounded to 1,000 characters. This is a memory/display-size guard; escapeHtml remains required at the DOM sink.

## Limits

- The audit and regression target the browser DOM paths exercised above. They do not validate Unity C# UI, live Supabase responses, browser extensions, or every third-party script.
- An escaped DOM sink is not a substitute for CSP, dependency review, and authorization checks.
- The browser save remains client-controlled. This work prevents stored markup from becoming executable DOM; it does not make progression or rewards authoritative.
