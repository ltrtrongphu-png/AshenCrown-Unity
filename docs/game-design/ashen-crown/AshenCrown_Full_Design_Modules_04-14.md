# ASHEN CROWN: THE LAST EMBER
## Full Design Pack — Modules 4–14

**Status:** Design proposal for review; not yet merged into the repository.  
**Product constraints:** indie scope; 40-hour main campaign; mature dark fantasy; 3D third-person Soulslike; primarily solo; cosmetic-only monetization; EN/VI/JA/KO/ZH UI; target 60 FPS at 1080p on a defined target PC, subject to profiling.  
**Workflow:** all repository changes remain deferred and will be batched into one final PR only after the design package and validators are reviewed.

### Tags
- `[CANON]`: taken from the existing project Bible/data.
- `[NEW]`: proposed new content.
- `[REVISED]`: proposal to resolve or change an existing rule; requires review where noted.

### Cross-module technical rules
1. 3D models are real-time game assets, not 2D illustrations. Character/equipment/NPC briefs target rigged meshes, materials, LODs and animation reuse.
2. Player standard height is 2.42 Unity units; Ashen Regent is 3.15 units. Appearance presets must not change hitbox, combat reach or camera collision.
3. Do not claim performance is proven until target-device profiling. Budgets below are authoring guardrails.
4. No paid power, loot boxes or gameplay stats on cosmetics. Social features are post-campaign and asynchronous in the indie MVP.
5. The existing campaign has ten named chapters. Module 2's proposed five-act grouping is retained as a planning structure, not a replacement for the chapter IDs.
6. Character Creator appearance changes are free, including later edits at Sanctuary. Character name is display text and must never become a localization key or gameplay ID.

---

# MODULE 4 — PLAYER KIT: ARCHETYPES, WEAPONS, SKILLS, MASTERY

## 4.1 Combat contract
[CANON] Existing combat actions remain the foundation: four-hit light combo, charged heavy, dodge with i-frames, block/parry (~0.20 s reference window), perfect dodge (~0.10 s reference window with slow-time reward), poise/stagger, execute, lock-on and Q/E/R skills. Boss phase 3 may contain `requiresPerfectDodge`; its tell must be unmistakable.

[NEW] Baseline combat should communicate three decisions at all times: **commit** (heavy/skill), **defend** (block/parry/dodge), or **reposition**. No build gets an unconditional answer to all three. Proposed numbers are tuning starting points to verify in playtests, not live telemetry.

### Core attributes (soft caps)
| Attribute | Primary effect | First soft cap | Second soft cap | Trade-off |
|---|---|---:|---:|---|
| Vigor | Max HP; small stagger resistance | 30 | 50 | Low direct damage contribution |
| Endurance | Max stamina and stamina recovery | 25 | 40 | Diminishing returns beyond recovery comfort |
| Might | Heavy weapon scaling and poise damage | 30 | 50 | Heavier weapons cost more stamina |
| Finesse | Fast weapon damage, recovery frames (limited) | 30 | 50 | Cannot shorten recovery below weapon minimum |
| Ember | Skill potency and Ember-resource capacity | 30 | 50 | Skill use still has punish windows/cost |
| Resolve | Guard efficiency, status resistance and focus | 25 | 40 | Does not grant universal damage reduction |

Starting baseline is 12 in each attribute. Origin applies a total of +3 distributed points and one passive; it does not lock an archetype. Respec at the Quiet Forge costs `150 × current character level + 2 × highest owned gear upgrade level` Essence, with one free respec after Chapter 2. Values are provisional balance assumptions.

## 4.2 Five archetypes
| ID / Name | Fantasy & preferred kit | Start spread (VIG/END/MIG/FIN/EMB/RES) | Passive | Weakness / mastery identity |
|---|---|---|---|---|
| `archetype.hearthguard` — Hearthguard | Hold ground, counterattack, survive boss pressure; sword + shield or greatblade | 15/14/15/10/10/13 | Guarding a readable hit refunds 4 stamina once per 3 s | Slow reposition; M1 brace, M5 counter heavy, M10 guard-break, M20 ally-free sanctuary stance cosmetic + move variant |
| `archetype.ashrunner` — Ashrunner | Fast punish windows; paired blades or curved sword | 11/16/10/16/10/12 | First light hit after a perfect dodge costs 10% less stamina | Fragile under sustained pressure; M1 quickstep, M5 bleedless mark, M10 chain reset on stagger, M20 precision finisher |
| `archetype.emberweaver` — Emberweaver | Skill weaving and status control; staff/sigil blade | 10/12/9/12/17/15 | Skill hit restores 2 Ember, once per 4 s | Weak basic-attack poise; M1 spark, M5 tether, M10 charged cast, M20 delayed echo cast |
| `archetype.gravebound` — Gravebound | Slow, high-poise trades; hammer or greatblade | 16/12/17/8/10/12 | Charged heavy gains 8% poise damage while above 70% stamina | Vulnerable during wind-up; M1 anchor, M5 armor-break, M10 grounded counter, M20 committed finisher |
| `archetype.tideveil` — Tideveil | Spacing, traps, defensive feints; spear or short blade + focus | 12/14/10/15/13/13 | First dodge through a telegraphed attack builds 1 Veil charge, max 2 | Lower burst unless a tell is read; M1 feint, M5 snare, M10 retreat strike, M20 two-step counter |

Mastery rewards unlock techniques and expression, not mandatory raw-stat power. All archetypes can equip all weapons; archetype is a recommended build label, not a class prison.

## 4.3 Weapon families (8)
Numbers use a relative tuning scale, not final damage values. `Speed` is strike cadence (1–5), `Reach` is relative (1–5), `Poise` is poise damage (1–5), stamina is cost per standard attack. All weapons retain a readable recovery window.
| Weapon ID / family | Speed | Reach | Base stamina | Poise | Guard / parry behavior | Signature trick |
|---|---:|---:|---:|---:|---|---|
| `weapon.ember_sabre` — Sabre | 4 | 3 | 16 | 2 | Standard parry window | Light combo finisher grants short reposition step |
| `weapon.ash_greatblade` — Greatblade | 2 | 4 | 28 | 5 | Heavy guard, poor recovery | Charged heavy cracks enemy poise but can be interrupted |
| `weapon.namekeeper_spear` — Spear | 3 | 5 | 19 | 3 | Long-range poke; weak close turn | Perfect-dodge counter extends safe spacing, not damage multiplicatively |
| `weapon.twin_veils` — Twin blades | 5 | 2 | 13 | 1 | Weak guard; best quickstep | Finisher adds a short mark that improves next interrupt only |
| `weapon.registry_mace` — Mace | 2 | 2 | 24 | 5 | Strong against shields/armor | Heavy attack deals extra poise damage to guarding foes |
| `weapon.tidebow` — Tide bow | 3 | 5 | 12 per shot | 1 | Aim slows movement; no universal lock-on hit | Charged shot interrupts weak ranged tells; ammo/resource constrained |
| `weapon.glass_focus` — Focus blade | 3 | 3 | 17 | 2 | Converts a portion of a well-timed block into Ember | Heavy finisher leaves a brief delayed resonance; can miss moving targets |
| `weapon.hollow_maul` — Maul | 1 | 4 | 32 | 5 | Cannot safely cancel committed swing | Perfect dodge empowers next single blow; misses lose the benefit |

### Weapon tuning rules
- Light-attack combo total damage should fall within ±10% between fully supported archetypes at the same item level, except where risk/recovery differs.
- Long reach must trade off recovery, startup or guard ability; do not combine top reach and top DPS.
- Ranged weapons require line-of-sight, ammo/Essence economy and exposure while aiming; they cannot replace melee encounters wholesale.
- Every move has `startup`, `active`, `recovery`, `stamina_cost`, `poise_damage`, `hitstop_profile` and `cancel_rules` data fields.

## 4.4 Q/E/R skill catalogue (18)
Cost is in Ember unless noted. Cooldown begins on activation; interrupted casts refund 50% only if interrupted before the active frame. Values are initial tuning targets.
| ID / Slot | Skill & effect | Cost / cooldown | Risk / counterplay |
|---|---|---|---|
| `skill.q.ember_lance` / Q | Fast straight projectile; modest poise damage | 12 / 8 s | Blockable; narrow line, poor against clustered targets |
| `skill.q.hollow_step` / Q | Short blink-step through a normal melee tell; not a substitute for `requiresPerfectDodge` | 16 / 14 s | Fixed distance; can end in a hazard |
| `skill.q.name_mark` / Q | Mark one target; next interrupt reveals a brief stagger opportunity | 10 / 12 s | Mark does not increase damage against bosses by itself |
| `skill.q.cinder_ring` / Q | Short-range ring pushes light enemies | 18 / 16 s | Weak against elites/bosses; startup is punishable |
| `skill.q.tide_pin` / Q | Low-damage tether slows a target briefly | 14 / 15 s | Boss duration reduced; target can resist after repeated use |
| `skill.q.glass_echo` / Q | Repeat the last light attack at reduced potency after a delay | 20 / 18 s | Echo uses old aim vector and can miss |
| `skill.e.guard_pulse` / E | Brief directional guard; successful timed contact grants poise | 18 / 12 s | Rear attacks bypass; late activation costs full resource |
| `skill.e.ashweave` / E | Short damage-reduction weave while moving | 16 / 14 s | No attacking during the strongest frame; cannot tank a full boss combo |
| `skill.e.perfect_resonance` / E | Rewards a manually timed perfect dodge with a small resource refund | 10 / 20 s | Requires player timing; no auto-dodge |
| `skill.e.warmth_anchor` / E | Place a small ground anchor that restores stamina faster while nearby | 22 / 24 s | Stationary area; destroyed or irrelevant if player moves |
| `skill.e.veil_counter` / E | Counter after a successful block/parry | 12 / 10 s | If no successful defense occurs, skill does nothing except consume the cost |
| `skill.e.hollow_lantern` / E | Reveal hidden traces and certain enemy feints for a short duration | 14 / 25 s | Utility skill occupies a combat slot; does not reveal every secret |
| `skill.r.last_spark` / R | High-commit single target burst | 28 / 24 s | Long wind-up; interruptible, not best in every encounter |
| `skill.r.starfall_trace` / R | Delayed area strike on marked ground | 32 / 28 s | Clear floor tell; mobile foes can leave area |
| `skill.r.namekeeper_vow` / R | Temporary poise stability, but stamina recovery falls | 26 / 30 s | Defensive window can trap an overly aggressive player |
| `skill.r.tidebreak` / R | Breaks a hazard object or weak barrier; moderate combat impact | 20 / 22 s | Low direct boss damage; utility opportunity cost |
| `skill.r.crown_fracture` / R | Bonus poise damage to an enemy whose guard was just broken | 30 / 26 s | Requires a setup; weak vs enemies that do not guard |
| `skill.r.memory_release` / R | Release stored traces to heal a small amount after a confirmed execute | 25 / 35 s | No execute means no heal; healing is not available on demand |

## 4.5 Mastery — 60-node structure
[NEW] Six themed tracks × ten nodes = 60 node IDs, with each track containing 4 passives, 3 technique modifiers, 2 side-grade techniques and 1 capstone. Tracks: `mastery.guard`, `mastery.precision`, `mastery.ember`, `mastery.poise`, `mastery.exploration`, `mastery.weaponcraft`. Unlock points at character levels 3, 5, 7, then every 2 levels to 25; track capstone requires track ranks 1/3/5/7/9. No node may add more than 8% permanent damage; most nodes alter timing, cost, target conditions or utility. Respec is allowed at the Quiet Forge with the cost formula in §4.1. Mastery IDs are stable and localized via keys.

## 4.6 Relics (20, side-grades)
| ID / Relic | Effect | Cost / exclusion |
|---|---|---|
| `relic.open_hand_seal` — Open Hand Seal | Successful parry grants a small amount of Essence only once per enemy encounter | Cannot stack with other Essence-on-parry relic |
| `relic.hearth_memory` — Hearth Memory | Healing consumables restore less HP but also clear one minor status | Mutually exclusive with strong heal relic |
| `relic.bellglass_fragment` — Bellglass Fragment | Perfect dodge slows nearby minor enemies briefly | Reduced effect in boss arenas |
| `relic.tideglass_compass` — Tideglass Compass | Shows next tide transition on exploration HUD | No combat stat bonus |
| `relic.memory_thread` — Memory Thread | Codex discoveries recover a small amount of skill resource once per region | Does not trigger from repeatedly opening entries |
| `relic.hollow_lantern` — Hollow Lantern | Highlights environmental traps when standing still | Cannot reveal hidden enemies through walls |
| `relic.emberleaf_charm` — Emberleaf Charm | First status application per rest has shorter duration | Does not prevent status entirely |
| `relic.sanctuary_sigil` — Sanctuary Sigil | Fast travel to Sanctuary from designated safe points only | Cannot be used in combat/arenas |
| `relic.warmth_crystal` — Warmth Crystal | Execute restores a little stamina instead of HP | Mutually exclusive with Memory Release-focused relic |
| `relic.ashweave_cloak` — Ashweave Cloak | Perfect dodge reduces next ranged hit damage | No benefit to melee hits |
| `relic.astral_seed` — Astral Seed | Skills that miss refund 10% cost, once per 12 s | No extra damage |
| `relic.nightglass_vial` — Nightglass Vial | A charged heavy reveals an enemy weak point briefly | Weak point is informational; no multiplicative damage bonus |
| `relic.starpetal` — Starpetal | Resting with unspent consumables yields a small exploration hint | No combat effect |
| `relic.choir_ribbon` — Choir Ribbon | Sound cues for parry windows are slightly clearer | Accessibility-oriented, not a stat buff |
| `relic.resonance_pearl` — Resonance Pearl | After a skill hit, next light attack applies extra poise damage | Once per 5 s; not stackable |
| `relic.district_ledger` — District Ledger | Faction notices show reward and consequence before acceptance | UI/quest utility only |
| `relic.future_lens` — Future Lens | Shows one likely boss pattern after repeated failures | Hint only; does not slow boss automatically |
| `relic.depth_map` — Depth Map | Reduces penalty from one environmental hazard class | No reduction to direct boss damage |
| `relic.legacy_codex` — Legacy Codex | Carries one optional Codex clue into NG+ | No new stat or ending by itself |
| `relic.crown_of_embers` — Crown of Embers | Once per boss phase, surviving a lethal hit leaves 1 HP and disables Ember skills briefly | Endgame side-grade; cannot stack with other lethal-prevention effects |

## 4.7 Prestige & NG+
- **Prestige unlock:** after campaign completion and optional mastery threshold; never required to finish story or earn core achievements.
- **Reset:** character level and spendable mastery points; all gear, cosmetics, learned recipes, Codex and Collection retained. A player may opt to keep one build snapshot to avoid repetitive menu work.
- **Earn:** `Legacy Ash` = `floor(total chapter boss completions / 2) + floor(total unique Codex categories / 5)`, capped at 20 per cycle. Use it for side-grade relic slots and cosmetic hub variants, not raw damage.
- **NG+ story:** chapter progress and world choices reset to a new cycle; Codex, cosmetics, discovered shortcuts knowledge and player appearance remain. New dialogue treats prior cycle as echo, not a requirement to remember every prior scene.
- **No reset of paid cosmetics**, and no weekly login requirement.

## 4.8 Eight build recipes
| Build | Weapon / Q-E-R | Relics | Strength | Weakness / counter |
|---|---|---|---|---|
| Bell Counter | Sabre / Name Mark–Veil Counter–Crown Fracture | Bellglass, Open Hand, Choir Ribbon | Punishes readable strings | Weak against delayed feints and ground traps |
| Hearthwall | Sword+shield or Greatblade / Cinder Ring–Guard Pulse–Namekeeper Vow | Hearth Memory, Depth Map, Sanctuary Sigil | Stable defense | Slow objective movement; status pressure remains dangerous |
| Ash Needle | Twin blades / Hollow Step–Perfect Resonance–Last Spark | Emberleaf, Resonance Pearl, Nightglass | Fast punish and mobility | Low poise and weak sustained guard |
| Tide Surveyor | Spear / Tide Pin–Hollow Lantern–Tidebreak | Tideglass, Hollow Lantern, Starpetal | Exploration and spacing | Lower burst; weak in cramped rooms |
| Glass Conductor | Focus blade / Glass Echo–Warmth Anchor–Starfall Trace | Memory Thread, Astral Seed, Future Lens | Skill timing and area control | Resource-limited; mobile bosses evade delayed strikes |
| Grave Hammer | Maul / Name Mark–Guard Pulse–Crown Fracture | Warmth Crystal, Nightglass, Depth Map | High poise pressure | Long startup, punishable misses |
| Registry Breaker | Mace / Cinder Ring–Veil Counter–Tidebreak | Open Hand, District Ledger, Resonance Pearl | Breaks guards and shields | Low reach; mobile ranged targets are hard |
| Memory Keeper | Spear or Focus / Hollow Lantern–Memory Release–Namekeeper Vow | Legacy Codex, Memory Thread, Choir Ribbon | Utility, clue discovery, safer execute support | Less raw burst; reward depends on execution access |

### Module 4 quality checks
- **Consistency:** preserves existing Q/E/R and dodge/parry contract; `requiresPerfectDodge` cannot be bypassed by a skill.
- **Dominant strategies:** ranged kiting, parry-only, and high-poise trade builds must each face explicit counters: line-of-sight, delayed/area attacks, and recovery punish windows.
- **Fantasy:** “I am the bearer of an ember, learning a fighting language that reflects how I choose to face danger.”
- **Cohesion:** relics and techniques connect to ember/name/record motifs and tactical choices.
- **Scope cuts:** MVP = 4 weapons, 9 skills, 8 relics, 24 mastery nodes; Vertical Slice = 6/12/14/42; Full = listed 8/18/20/60. All share the same schemas.
- **Ethics:** no paid power or arbitrary grind gates.
- **Self-score:** 4/5; improve after combat telemetry and boss playtest.

---

# MODULE 5 — BESTIARY & BOSSES

## 5.1 Enemy archetypes (8+)
| Archetype ID | Combat role / tell | Player response / counter |
|---|---|---|
| `enemy_role.minion` | Basic melee pressure, one clear wind-up | Learn spacing, parry or dodge |
| `enemy_role.ranged` | Projectile; shoulders/weapon glow or sound charge | Break line of sight, time dodge, close distance |
| `enemy_role.elite` | Stronger moveset, delayed follow-up | Read full string before punishing |
| `enemy_role.f lanker` — Flanker | Circles outside camera; footstep cue | Lock-on swap, use arena edge, avoid tunnel vision |
| `enemy_role.shieldbearer` — Shieldbearer | Shield angle and audible brace | Heavy/poise attack, flank or bait attack recovery |
| `enemy_role.summoner` — Summoner | Channels at a visible anchor | Interrupt channel or destroy anchor |
| `enemy_role.hazard_layer` — Hazard-layer | Places floor glyph / cracks ground | Leave marked ground before detonation |
| `enemy_role.ambusher` — Ambusher | Environmental cue before emerging | Check sound/lantern clues; do not punish blind corners |
| `enemy_role.support` — Witness Keeper | Heals or shields allies with a tether | Break tether or prioritize support |
| `enemy_role.duelist` — Duelist | Feints, punish attempts to heal | Wait for committed move, do not heal in neutral |

Every lethal attack must have: visible tell for at least the intended reaction window, audio cue, recovery/counter opportunity, and a non-color-only signal. Boss attacks that require perfect dodge must have a unique sound plus silhouette/ground cue.

## 5.2 Regional bestiary — 6 entries per region
Names are final design candidates; each enemy has two-line lore, archetype, primary tell/counter and drop family. All character rigs/materials should be reused where silhouette allows. Drops are families, not final percentages (see Module 7).

### Sanctuary (hub outskirts / optional combat pockets)
| Enemy | Archetype | Lore / tell / counter | Drop family |
|---|---|---|---|
| Name-Scraped Pilgrim | Minion | A traveler whose plaque is blank. Raises empty hands before striking; parry the second beat. | Essence, Ash Scrap |
| Cinder Rat Swarm | Flanker | Feeds on discarded charms. Ash trail gathers before lunge; area push counters. | Rat Ash, Bitter Seed |
| Wall-Hollow Scribe | Ranged | Copies forbidden records on walls. Quill glints before needle projectile; break sightline. | Ink Resin |
| Faded Bell Guard | Shieldbearer | Patrols the old gate without knowing whom it serves. Shield tilts before shove; heavy guard-break. | Bent Brass |
| Hearthless Shade | Ambusher | Mimics the posture of people who left. A missing footstep gives it away; lantern reveals approach. | Memory Fleck |
| Ash Ledger Wraith | Support | Keeps repeating one unpaid debt. Tether to a ledger glows/pulses; break tether. | Registry Thread |

### Ashen March
| Enemy | Archetype | Lore / tell / counter | Drop family |
|---|---|---|---|
| March Husk | Minion | Carries a cracked road sign as a weapon. Drags it before overhead swing; dodge sideways. | Road Iron |
| Ember-Ration Thief | Flanker | Steals warmth from abandoned camps. Scratches ground twice before dash; guard the exit. | Warmth Crystal shard |
| Cinder Sling Scout | Ranged | Uses smoldering stones to herd travelers. Sling rotates before release; close through cover. | Sling Cord |
| March Bailiff | Shieldbearer | Enforces tolls on roads erased from maps. Planting foot signals shield charge; bait into wall. | Registry Plate |
| Ash-Maw Burrower | Ambusher | Hunts below burnt grass. Soil swells in a line; move off trail. | Burrow Claw |
| Road-Brand Zealot | Duelist | Believes scars are legal testimony. Blade feint followed by thrust; punish the thrust recovery. | Brand Sigil |

### Hollow Reach
| Enemy | Archetype | Lore / tell / counter | Drop family |
|---|---|---|---|
| Hollow Dredger | Minion | Digs through submerged homes for names. Wet scrape before swing; parry slow arc. | Dredge Iron |
| Bell-Touched Midge | Flanker | Swarms only when the bell resonates. Audible chirp grows before rush; ring attack counters. | Resonance Dust |
| Silt Cantor | Ranged | Sings through a mask of river silt. Inhale animation before pulse; interrupt or break LOS. | Choir Reed |
| Drowned Gatekeeper | Shieldbearer | Holds a gate whose key is forgotten. Water pressure vents before shove; step to dry ledge. | Gate Brass |
| Underbank Lurker | Ambusher | Hides under collapsed planks. Three bubbles signal emergence; avoid plank lane. | Silt Hide |
| Bell-Skein Binder | Summoner | Strings fragments into false memories. Tether knots flash in sequence; sever active knot. | Bellglass Chip |

### Veil Sea
| Enemy | Archetype | Lore / tell / counter | Drop family |
|---|---|---|---|
| Saltworn Deckhand | Minion | A crew member still follows an absent captain. Salt crust sheds before a cleave; counter second swing. | Salt Iron |
| Tide-Cut Skimmer | Flanker | Runs along waterline at low tide. Leaves a V wake before dash; move inland. | Tide Scale |
| Archive Needlefish | Ranged | Guards fragments of the drowned archive. Fin flashes before bolt; block or approach diagonally. | Glass Fin |
| Anchor Priest | Support | Binds allies to a sunk anchor. Chain hum before shield; interrupt anchor channel. | Anchor Chain |
| Floodstep Mimic | Hazard-layer | Copies the rhythm of a rising tide. Puddle squares darken before eruption; exit marked cells. | Tideglass Sand |
| Wreck Diver | Duelist | Protects a ship manifest that no longer matches the crew. Feint at recovery; wait out delayed thrust. | Diving Buckle |

### Crownlands
| Enemy | Archetype | Lore / tell / counter | Drop family |
|---|---|---|---|
| Registry Bailiff | Shieldbearer | Carries law on a shield face. Stamp click before shield rush; guard-break on recovery. | Registry Plate |
| District Provost | Duelist | Turns witness statements into dueling codes. Raises sleeve before feint; react to blade, not sleeve. | District Seal |
| Crown Ledger Adept | Ranged | Fires ink-hard slivers. Pen stroke brightens before shot; strafe across line. | Ink Resin |
| Signet Hound | Flanker | Tracks forged insignia rather than scent. Sniffs a marked object before charge; discard line of sight. | Signet Tooth |
| Royal Thread Weaver | Summoner | Sews patrols to shared orders. Thread bridge is targetable; sever bridge. | Royal Thread |
| Quorum Golem | Elite | Made from votes that canceled each other. Knees lock before sweep; punish its pivot. | Vote Stone |

### Choir of Ash
| Enemy | Archetype | Lore / tell / counter | Drop family |
|---|---|---|---|
| Nameless Cantor | Ranged | Sings to an audience that is no longer present. Inhale and head tilt before sound cone; break cone. | Choir Reed |
| Ribbonbound Penitent | Minion | Wears ribbons with no owners' names. Ribbon tightens before strike; dodge away from knot. | Choir Ribbon |
| Ash Psalm Carrier | Support | Carries a chorus in a sealed chest. Chest pulses before heal; interrupt carrier. | Resonance Dust |
| Procession Breaker | Elite | Guards the ritual road. Staff scrapes three times before slam; punish third recovery. | Ashwood Staff |
| Memory Eater | Ambusher | Consumes echoes from abandoned rooms. Room audio drops before appearance; lantern helps detect. | Memory Fleck |
| Choir Bellwright | Hazard-layer | Sets resonant floor plates. Plate hum escalates in two steps; leave ring before third. | Bellglass Chip |

### Glass Expanse
| Enemy | Archetype | Lore / tell / counter | Drop family |
|---|---|---|---|
| Prism Husk | Minion | A body caught in a failed reflection. Glints at shoulder before slash; strike the unarmored side. | Prism Shard |
| Future Stalker | Flanker | Attacks where the player stood a moment ago. Glass footprint appears; change direction after tell. | Future Lens sliver |
| Observatory Needle | Ranged | Fires a refracted beam. Lens aligns with floor line before shot; move off line. | Lens Fragment |
| Starless Anchor | Shieldbearer | Refuses to be moved by gravity. Anchor pins light to ground; attack exposed wrist after slam. | Starless Ore |
| Probability Scribe | Summoner | Copies one recent player action. Duplicated stance signals copy; vary attack/defense rhythm. | Prism Note |
| Glass Horizon Beast | Hazard-layer | Makes a false horizon that swallows footing. Horizon line tilts before field shift; retreat to cracked stone. | Horizon Scale |

### Shared encounter spawn rule
Each region uses 3–5 enemy types in a combat pocket. Never combine two summoners and a ranged elite in a narrow arena unless a destructible anchor or guaranteed cover exists. At most one high-attention ambusher per encounter. Elite modifiers and Expedition seed may add difficulty, never remove counterplay.

## 5.3 Boss roster (12)
All bosses use a 3-phase narrative/combat arc unless noted; expected times are Standard difficulty targets, to be validated via playtests. Required perfect dodge attacks use both a distinct audio cue and a ground/silhouette tell.
| Chapter / Boss | Arena signature | Phase 1 → 2 → 3 | Signature rule / perfect-dodge notes | Guaranteed reward |
|---|---|---|---|---|
| 1 / Bell Warden | Bell chamber; sound waves cross floor | Guarded melee → bell echoes → name-strike | Perfect-dodge-only bell shear shown by a triple ripple and missing third tone | Bellglass Fragment, first boss Codex |
| 2 / The Hollow Caller | Flooded causeway | Slow drag → false voices → moving safe islands | Sound points away from real body; lantern reveals source | Hollow Lantern |
| 3 / The Drowned Index | Library stacks shift at tide | Ink blades → rising water → rotating archive lanes | Floor map previews lane change before each rotation | Drowned Archive Seal |
| 4 / The Quorum Without Faces | Council square | Three coordinated guards → split vote pattern → overlapping orders | Break an exposed banner to interrupt coordinated combo | Crownless Signet |
| 5 / The Sleepless Gardener | Star garden | Root sweeps → memory blossoms → field of sleep zones | Blossom color has shape/audio backup; avoid marked ring | Starpetal |
| 6 / Prior's Echo (Caldrin's rite construct) | Choir amphitheatre | Chord pulses → copied silhouettes → silence field | Destroy visible resonators, don't damage an invulnerable center | Choir Ribbon |
| 7 / The Winter Steward | Snowed Sanctuary approach | Resource denial → wind lanes → ration choice mid-fight | Wind-up includes cloth and snow direction; shelter breaks projectile lanes | Warmth Crystal |
| 8 / The Glass Astrologer | Rotating observatory | Beam geometry → duplicated attack forecasts → broken horizon | The true strike is indicated by a stable shadow, not brightest reflection | Glass Astrolabe |
| 9 / The Depthless Witness | Starless abyss platform | Gravity tugs → memory clone → falling fragments | Stable stone telegraphed by cracks; no invisible floor kills | Starless Relic |
| 10 / Ashen Regent | Crown registry arena | The Law → The Revision → The Last Record | Each phase changes a world rule and reveals one truth; final choice need not require killing | Crown of Embers; ending flag |
| Optional / Veyra Kest, Final Measure | Duel ground at Ashen March | Test defense → test adaptation → disarm or surrender | Not lethal on surrender branch; counterplay through reading her feint | Open Hand Seal variant/cosmetic |
| Expedition / The Echo Engine | Modular arena generated from validated tiles | Guard trial → hazard trial → mirrored pattern | Deterministic seed; attack tells persist despite modifiers | Expedition-exclusive cosmetic + tier reward |

### Boss implementation contract
Each attack data entry includes `id`, `windup_seconds`, `active_seconds`, `recovery_seconds`, `damage_type`, `poise_damage`, `targeting_rule`, `telegraph_vfx`, `telegraph_sfx`, `counter_action`, `requiresPerfectDodge`, `phase_gate`. Boss transitions happen on health threshold and one completed signature pattern, never on a timer alone. Standard target duration: 4–7 minutes per major boss; expected deaths are a telemetry goal, not a punishment formula.

## 5.4 Ten encounter templates
1. **Read corridor:** one minion plus one shieldbearer; teaches guard-break.
2. **Ranged crossfire:** two ranged on separate elevations with guaranteed cover.
3. **Flanker reveal:** one flanker and a visible sound clue; teaches camera discipline.
4. **Anchor interruption:** summoner and one defender; destroy/interrupt anchor first.
5. **Hazard rhythm:** hazard-layer plus a slow minion; floor telegraph is the primary lesson.
6. **Elite duel:** single elite with enough space for lock-on and free camera.
7. **Tide migration:** timed low-tide lane with an optional battle; never force a long wait without alternate route.
8. **Ritual shutdown:** multiple visible resonators; each disabled element reduces attacks.
9. **Boss add phase:** add wave is bounded and only during recovery; no adds during required-dodge tutorial.
10. **Choice aftermath:** combat can be avoided with evidence/quest flag; reward shifts from combat material to lore/faction standing.

## 5.5 Expedition modifiers (20, seeded)
| ID / Modifier | Rule | Difficulty weight | Counterplay |
|---|---|---:|---|
| `mod.tide_bound` | Enemies near water have stronger poise | 2 | Pull them to dry ground |
| `mod.bell_echo` | One light-attack sound repeats as a decoy | 1 | Trust animation, not echo alone |
| `mod.registry_order` | Enemies coordinate target changes | 2 | Break line of sight and isolate |
| `mod.glass_refraction` | Some projectiles bend once | 2 | Avoid straight-line retreat |
| `mod.ash_wind` | Directional gust affects projectiles | 1 | Read cloth/debris direction |
| `mod.low_warmth` | Healing is reduced slightly; stamina unchanged | 2 | Use defense and safe rooms |
| `mod.strong_memory` | Elite repeats its last basic string once | 2 | Change timing rather than repeating same answer |
| `mod.silent_floor` | Ground hazards lose one audio layer, visual remains | 2 | High-contrast pattern and vibration cue remain |
| `mod.shared_guard` | Shield units protect adjacent unit | 2 | Flank or poise-break shieldbearer |
| `mod.summoner_choir` | Summoner anchor has one extra segment | 3 | Visible segment count and safe interruption windows |
| `mod.short_recovery` | Minion recovery reduced by a small fixed amount | 2 | Do not add to boss or tutorial encounters |
| `mod.ember_tax` | First skill after each rest costs +10% | 1 | Cost shown before entering |
| `mod.long_shadow` | Ambusher detection window shorter but never invisible | 2 | Sound cue remains; lantern counters |
| `mod.frail_armor` | Player armor poise contribution lowered; damage unchanged | 2 | Side-grade to active defense |
| `mod.grounded` | Dodging repeatedly in place briefly builds less distance | 1 | Move laterally / reposition |
| `mod.name_drift` | One optional clue is relocated deterministically | 1 | Codex/map tracker retains clue category |
| `mod.prism_pair` | First ranged shot splits after a visible lens flash | 2 | Attack the lens carrier or leave lane |
| `mod.crowded_records` | More breakable props, not more enemies | 1 | Environmental clutter is non-colliding outside marked cover |
| `mod.iron_oath` | Elite blocks more light hits; heavies still work | 2 | Change move choice; no damage immunity |
| `mod.last_tone` | Final attack in a boss string gets an extra audio motif | 1 | Fairness aid for repeated runs, not a speed increase |

### Module 5 quality checks
- **Fairness:** `requiresPerfectDodge` is never hidden behind color alone; every lethal move has a counter and clear cue.
- **Cohesion:** enemy/boss designs use records, names, bells, tides, memory and Crown control.
- **Scope cuts:** MVP 3 bosses/12 enemy variants; Vertical Slice 6 bosses/24 variants; Full 12 bosses/42 regional types.
- **Self-score:** 4/5; timing, drop tables and target PC cost must be validated in the actual build.

# MODULE 6 — ITEMIZATION, CRAFTING, COSMETICS

## 6.1 Eight equipment slots and item power
[CANON] Keep eight equipment slots and tiers: Broken, Common, Uncommon, Rare, Epic, Legendary, Mythic, Ascendant. The eight slots are: Main Hand, Off Hand/Focus, Head, Chest, Hands, Legs, Relic A, Relic B. Weapon-specific handling may leave Off Hand empty; a focus weapon can occupy Off Hand when compatible.

`item_level` is a bounded integer from 1–60. At each 10-level band, item base power rises gradually; rarity adds affixes/behavior, not an unlimited multiplier. Proposed base-stat multiplier by rarity: Broken 0.70, Common 1.00, Uncommon 1.07, Rare 1.15, Epic 1.24, Legendary 1.34, Mythic 1.42, Ascendant 1.45 plus a defining gameplay rule. Ascendant's advantage over Mythic is identity/behavior rather than a raw power cliff.

For a base stat `S0` at item level `L`, use `S(L)=round(S0 × (1 + 0.018 × (L-1)) × rarity_multiplier)`. Because this gives a modest linear climb, encounter scaling should not require endless item level. Use fixed enemy archetype baselines plus chapter-band tuning.

| Tier | Item level range | Affix slots | Upgrade cap | Design rule |
|---|---:|---:|---:|---|
| Broken | 1–10 | 0 | +2 | Salvage/tutorial; not sold as a trap |
| Common | 1–20 | 0 | +4 | Stable baseline |
| Uncommon | 1–30 | 1 | +6 | First build expression |
| Rare | 1–40 | 2 | +8 | Mid-campaign build direction |
| Epic | 1–50 | 2 + 1 utility | +10 | Trade-off affixes appear |
| Legendary | 1–60 | 3 | +12 | Unique trait or controlled interaction |
| Mythic | 20–60 | 3 + 1 behavior | +12 | Build-shaping, constrained behavior |
| Ascendant | 40–60 | 2 + identity trait | +12 | One defining rule; no stacked universal multipliers |

### Drop and anti-bad-luck rule (initial target)
- Common/Uncommon gear is routine; Rare is a normal campaign progression target; Epic/Legendary should be attainable from bosses and chosen contracts.
- Pity is per eligible reward source and item tier, not global: after 5 eligible boss/Expedition rewards without Rare+, next reward has a guaranteed Rare+; after 8 eligible sources without Epic+, next reward has guaranteed Epic+; after 12 sources without a Legendary, first eligible Legendary source guarantees one. Pity counters are visible in item-source details and never require spending money.
- Duplicates convert to crafting materials; unique quest rewards are never permanently lost. Boss signature items are guaranteed at least once from the corresponding narrative encounter.

## 6.2 Affix pool (60)
Ranges are initial tuning envelopes. Group exclusions must prevent one item from rolling two affixes that solve the same weakness or amplify the same mechanic without opportunity cost.

### Offense (1–20)
| ID | Affix | Effect range | Minimum tier / exclusion |
|---|---|---|---|
| `affix.heavy_commit` | Committed Force | +4–8% charged-heavy poise damage | Rare / no other heavy-poise affix |
| `affix.light_chain` | Fourth Stroke | +3–6% combo finisher damage | Uncommon / combo group |
| `affix.parry_edge` | Answering Edge | +3–7% counter damage after parry | Rare / counter group |
| `affix.dodge_puncture` | Passing Point | +3–7% next-hit poise after perfect dodge | Rare / counter group |
| `affix.skill_focus` | Ember Channel | +4–8% skill potency, +3–6% skill cost | Epic / always paired cost |
| `affix.ranged_tension` | Drawn Thread | +4–7% charged projectile impact; slower aim by 3–5% | Rare / ranged group |
| `affix.armor_break` | Registry Splitter | +5–10% damage to guarding non-boss enemies | Uncommon / guard group |
| `affix.execute_window` | Opened Ledger | +2–4% execute window duration | Epic / utility combat group |
| `affix.first_strike` | Unrecorded First | +4–8% first hit after entering combat; no bonus after reset exploit | Rare / opener group |
| `affix.low_health` | Last Ember | +5–9% poise damage below 30% HP | Epic / high-risk group |
| `affix.marked_target` | Witness Mark | +3–6% against a marked target | Rare / mark group |
| `affix.boss_rhythm` | Phase Reader | +3–5% damage only after avoiding a full boss string | Mythic / boss group |
| `affix.status_pressure` | Soot Binding | +4–8% buildup; −3–6% direct damage | Rare / status trade-off |
| `affix.backstep` | Ash Step | +3–6% strike after a retreat dodge | Uncommon / mobility group |
| `affix.two_handed` | Long Promise | +4–9% two-handed poise damage; −4–7% guard stability | Rare / guard exclusion |
| `affix.weakpoint` | Prism Cut | Reveals weak point longer by 0.2–0.5 s | Epic / information group |
| `affix.interrupt` | Broken Cadence | +4–8% interrupt pressure on telegraphed enemies | Uncommon / no boss-stagger stack |
| `affix.ember_return` | Banked Spark | Successful skill hit restores 1–3 resource, once per 6 s | Legendary / resource exclusion |
| `affix.charge_speed` | Held Breath | Charge startup −3–6%, charge cost +4–8% | Epic / charge exclusion |
| `affix.falter_finisher` | Final Clause | Finisher deals +4–8% to staggered targets, basic damage −2–4% | Legendary / finisher group |

### Defense (21–35)
| ID | Affix | Effect range | Minimum tier / exclusion |
|---|---|---|---|
| `affix.vitality_trade` | Stubborn Pulse | +3–6% max HP; −2–4% stamina recovery | Uncommon / HP group |
| `affix.poise_guard` | Rooted Hem | +4–8% poise stability while blocking; dodge distance −2–5% | Rare / guard group |
| `affix.status_cinder` | Ash Filter | −5–10% status buildup; healing item cost +3–6% | Uncommon / status group |
| `affix.projectile_guard` | Bent Signet | −4–8% projectile damage while moving laterally | Rare / ranged defense |
| `affix.perfect_dodge` | Narrow Margin | Perfect-dodge window +0.005–0.015 s; stamina recovery −3–5% | Mythic / maximum timing capped globally |
| `affix.parry_stability` | Held Line | Missed parry costs less stamina; successful parry reward unchanged | Rare / parry group |
| `affix.execute_resist` | Unbroken Witness | Minor enemies deal less execute follow-up damage; bosses unaffected | Uncommon / PvE defense |
| `affix.hazard_tread` | Dry Sole | −8–15% hazard buildup; −2–4% sprint speed | Uncommon / exploration defense |
| `affix.lethal_grace` | Final Breath | Once per rest, survive a normal hit at 1 HP; disable skill use for 8 s | Ascendant only / no lethal-prevention stack |
| `affix.healing_trade` | Bitter Remedy | Healing +6–10%; use animation +5–8% longer | Rare / healing group |
| `affix.recovery_guard` | Afterimage Guard | Reduce damage during recovery by 3–6%; stamina cost +2–4% | Legendary / recovery group |
| `affix.crit_resist` | Dull Mirror | Reduces enemy burst/crit bonus by 4–8%; normal damage unchanged | Rare / burst defense |
| `affix.fall_grace` | Cartographer's Knot | Less fall damage in marked traversal areas; no combat effect | Common / traversal |
| `affix.allyless` | Solitary Oath | +4–7% guard stability when no summon/NPC help is present | Epic / future companion-safe |
| `affix.low_stamina` | Thin Reserve | At low stamina, next guard absorbs slightly more; recovery slows | Rare / stamina group |

### Utility, exploration and system (36–60)
| ID | Affix | Effect range | Minimum tier / exclusion |
|---|---|---|---|
| `affix.essence_find` | Ledger Dust | +3–6% Essence from first-time elite per region only | Uncommon / economy cap |
| `affix.salvage` | Reclaimed Rivet | +5–10% salvage material on duplicate items | Rare / salvage group |
| `affix.codex_trace` | Unfiled Trace | Nearby lore clue hint radius +5–10% | Uncommon / exploration utility |
| `affix.shortcut` | Road Witness | Revealed shortcut gives a one-time small Essence bonus | Rare / once-per-shortcut flag |
| `affix.contract` | Signed Route | +3–7% contract completion reward, not paid currency | Epic / contract group |
| `affix.craft_yield` | Spare Stitch | 3–6% chance for one common material extra | Rare / common materials only |
| `affix.upgrade_discount` | Forge Mark | 3–5% reduced upgrade cost on this item only | Legendary / one item only |
| `affix.reputation` | Open Ledger | First faction quest in a region gives small extra reputation | Rare / first-time only |
| `affix.tide_timer` | Tide Reader | Tide-transition UI hint arrives 2–4 s earlier | Uncommon / UI utility |
| `affix.sound_clarity` | Clear Tone | Clearer parry/telegraph audio mix | Common / accessibility utility |
| `affix.camera_stability` | True Horizon | Slightly steadier lock-on transition | Uncommon / camera utility |
| `affix.item_insight` | Assayer's Edge | Shop previews display affix group compatibility | Rare / UI utility |
| `affix.rare_pity` | Patient Record | Adds one pity count after boss reward without Rare+; capped per weekly? No weekly cap for campaign | Epic / source-tied |
| `affix.world_event` | Event Witness | Small extra material from first world event per region | Rare / first-time flag |
| `affix.expedition_seed` | Seed Keeper | Shows Expedition seed and modifier list before entering | Common / UI utility |
| `affix.death_retrieval` | Returning Thread | Reduces lost Essence on first defeat before retrieval | Rare / no death-farming benefit |
| `affix.safe_rest` | Quiet Hearth | First rest in a newly discovered region grants one Codex hint | Uncommon / exploration |
| `affix.dialogue_insight` | Listening Stone | Adds a non-spoiler dialogue intent marker | Rare / UI utility |
| `affix.cosmetic_echo` | Ashen Reflection | Cosmetic idle trace after a flawless encounter | Epic / cosmetic only |
| `affix.inventory_space` | Folded Map | Adds one utility pouch slot, not equipment slots | Rare / inventory cap |
| `affix.status_read` | Clear Witness | Status buildup bars become numerical in settings | Common / accessibility |
| `affix.camera_distance` | Distant Lantern | Saves preferred camera distance by weapon family | Common / setting utility |
| `affix.respec_refund` | Unwritten Point | One-time discount on a respec; no compounding | Legendary / account-bound |
| `affix.collection` | Curator's Thread | First collection record in each region gives a hint | Rare / first-time only |
| `affix.hub_rest` | Hearthbound Stitch | Sanctuary interactions consume fewer menu transitions; no stat effect | Epic / UX only |

## 6.3 Six sets (3–5 pieces)
| Set | 2-piece bonus | 3-piece bonus | 5-piece bonus / cost |
|---|---|---|---|
| Hearthbound | Heal clears a minor status after a delay | Perfect dodge restores small stamina | Once per boss phase, block a hazard tick; direct damage unchanged. Costs offensive affix slots. |
| Tide Cartographer | Tide hazard warning extended | Spear/focus attacks regain small resource on a marked weak point | Traversal shortcut can be used once in a combat pocket if the route is safe; no boss skip. |
| Namekeeper | Codex clue radius increased | Execute records a clue about that enemy | Reveals one alternate interpretation of a boss record; no damage boost. |
| Crownless | Guard-break rewards a short movement window | Heavy hit to guarders improves next parry readability | A broken enemy command banner can disable one non-boss support tether. |
| Choir of Ash | Sound cues easier to separate | Perfect dodge delays minor enemy recovery | One time per rest, survive a non-lethal stagger chain; no stun immunity. |
| Glass Observatory | Reveals ranged attack paths a moment sooner | Hitting a marked weak point reduces next skill cost | Delayed echo skill may target a second marked area at reduced effect; misses still cost resources. |

## 6.4 Thirty unique Legendary/Mythic/Ascendant items
| ID / item | Defining effect | Source / constraint |
|---|---|---|
| `unique.bellkeeper_edge` Bellkeeper's Edge | Parry counter has a distinct bell cue and extra poise, not extra raw damage | Bell Warden; parry timing still required |
| `unique.hollow_lantern_plus` Lantern of the Caller | Highlights the real source among audio decoys | Hollow Caller; exploration utility |
| `unique.drowned_index` Indexer's Knife | Light finisher marks a rotating arena lane | Drowned Index; no damage multiplier |
| `unique.crownless_signet` Signet Without a Crown | Breaking a guard briefly interrupts command banners | Quorum Without Faces; low boss effect |
| `unique.starpetal_staff` Sleepless Petal | Delayed skill zones gain a readable ring | Sleepless Gardener; slow setup |
| `unique.choir_ribbon_weapon` Ribbon of the Last Tone | Parry sound is clearer; perfect dodge grants tiny resource refund, cooldown-gated | Choir boss; accessibility side-grade |
| `unique.winter_steward` Steward's Ladle | Healing item also warms in a cold hazard at reduced healing | Chapter 7 boss; no extra stock |
| `unique.glass_astrolabe` Astrolabe of the Uncertain | Shows one likely attack lane after two repeats | Chapter 8 boss; hint only |
| `unique.starless_maul` Maul of the Depthless | Charged heavy anchors minor enemies briefly | Chapter 9 boss; high stamina cost |
| `unique.crown_of_embers` Crown of Embers | Once per phase, lethal hit leaves 1 HP and disables skills for 8 s | Regent; unique final relic, no stack |
| `unique.vowbreaker` Vowbreaker's Mace | Stronger vs shields, slower against unguarded targets | Veyra branch; side-grade |
| `unique.tideglass_bow` Bow of Low Tide | Charged shot pins a hazard trigger rather than a target | Neris quest; one shot resource cost |
| `unique.ashrunner_wraps` Wraps of the Ashrunner | Retreat-dodge light strike costs less stamina | Mastery challenge; requires timing |
| `unique.registry_plate` Plate of the Signed Order | Makes enemy guard stance easier to identify | Tovan quest; defensive utility |
| `unique.namekeeper_thread` Thread of Maelin | Once per region, recovers one optional lost clue marker | Maelin quest; no automatic completion |
| `unique.sables_vial` Sable's Last Vial | Healing trades amount for short status cleanse | Sable quest; consumable not infinite |
| `unique.jun_glass` Jun's Proof Lens | Shows difference between verified and disputed Codex evidence | Jun quest; lore utility |
| `unique.veyras_edge` Kest's Edge | Combo finisher after a correctly read feint gains poise | Veyra duel; no benefit if feint misread |
| `unique.caldrin_hymnal` Hymnal of Silence | Interrupts visible resonance plates more efficiently | Caldrin quest; reduced direct damage |
| `unique.unwritten_mask` Guest's Unwritten Mask | Adds a cosmetic name-less reflection to the idle preview | Hidden quest; cosmetic/collection only |
| `unique.road_marker` Last Road Marker | First newly discovered shortcut grants small stamina resource on next encounter | Orren quest; once per shortcut |
| `unique.emberleaf` Emberleaf Charm | First status per rest shorter; subsequent applications normal | Story item craft; low tier |
| `unique.prism_note` Prism Note Focus | Echo skill targets remembered location, not tracked enemy | Glass Expanse; risky versus mobile enemy |
| `unique.royal_thread` Royal Thread Buckle | Breaking tethered support line yields brief counter window | Crownlands; utility |
| `unique.resonance_pearl` Pearl of Resonance | After skill hit, next light hit has extra poise | Expedition; once per 5 s |
| `unique.depth_map` Depth Map Case | Reduces one selected hazard type after map read | Veil Sea; configure at rest |
| `unique.hollow_compass` Compass of the Unheard | Points toward one undiscovered bell clue, never quest-critical objective | Optional Codex set |
| `unique.hearth_memory` Hearth Memory Pendant | Execute restores stamina rather than HP | Sable/Lyra chain; execution-based |
| `unique.legacy_codex` Legacy Codex | One optional Codex clue persists as an echo in NG+ | Hidden ending path; no direct power |
| `unique.crownless_banner` Banner of the Uncounted | Breaking a command banner leaves a visible non-damaging afterimage that helps track the support tether once | Crownlands optional challenge; visual counterplay only |

## 6.5 Story key items (31) and chapter 9–10 callbacks
All are unique, non-tradable key/story items unless stated. Callback means the item affects a line, scene, clue or ending flag; no essential item may be permanently lost by selling/salvage.
| Item | Type / gameplay effect / source | Trade? / callback |
|---|---|---|
| Sanctuary Sigil | Key item; unlocks Sanctuary hub routes, Chapter 1 | No; defines final hub state in Ch10 |
| Emberleaf Charm | Relic/consumable; helps resist first status per rest | No; Ch9 reveals who made it |
| Tideglass Compass | Exploration tool; indicates tide transitions after discovery | No; Ch9 marks a disputed waterway |
| Open Hand Seal | Quest token; opens Veyra peaceful duel resolution | No; Ch10 enables a nonlethal confrontation variant |
| Hearthbound Vow | Quest token; tracks aid promised to Sanctuary | No; Ch10 adds residents if vow was kept |
| Bellglass Fragment | Key lore; plays the missing third-tone clue | No; Ch9 confirms bell record inconsistency |
| Memory Thread | Lore/crafting reagent; binds two related Codex clues | No; Ch10 can preserve one public memory |
| Hollow Lantern | Tool; reveals selected hidden traces and false audio source | No; Ch9 shows a source missed in first cycle |
| Drowned Archive Seal | Key item; opens secured archive route | No; Ch10 alters archive access |
| Pearl of Recall | Relic/material; shows a sensory memory echo once per region | No; Ch9 provides a disputed witness image |
| Crownless Signet | Faction key; negotiates district access | No; Ch10 changes district autonomy scene |
| District Ledger | Key document; tracks public faction evidence | No; Ch9 names who authored the order |
| Royal Thread | Craft/relic; reveals visible command tether | No; Ch10 determines if Registry command system survives |
| Starpetal | Craft/story token; identifies memory-garden source | No; Ch9 can return or preserve memories |
| Nightglass Vial | Consumable/tool; briefly highlights weak-point clues | No; Ch10 reflects on what was deliberately hidden |
| Astral Seed | Crafting reagent; skill-resource utility | No; Ch9 affects future-vision dialogue |
| Choir Ribbon | Faction token; opens Choir rite dialogue | No; Ch10 sets ritual memorial scene |
| Namekeeper Token | Faction token; accesses names-wall archive | No; Ch10 sets memorial access policy |
| Resonance Pearl | Craft/relic; reveals sound-linked devices | No; Ch9 helps distinguish real bell source |
| Warmth Crystal | Resource; fuels a Sanctuary survival decision | No; Ch10 changes winter-victim memorial |
| Ashweave Cloak | Armor/cosmetic template; enables an ash-trail reveal | No; Ch9 highlights a recorded escape route |
| Hearth Memory | Story relic; unlocks a family testimony | No; Ch10 changes Lyra/Sable epilogue detail |
| Future Lens | Tool; reveals a probable attack path after repeats | No; Ch9 contrasts prediction vs choice |
| Glass Astrolabe | Key/relic; resolves a constellation puzzle | No; Ch10 affects how prophecy is archived |
| Prism Note | Lore note; presents two conflicting visual readings | No; Ch9 clue to evidence reliability |
| Starless Relic | Relic; marks depth boundary in optional content | No; Ch9 affects hidden ending eligibility |
| Echo Crownlet | Cosmetic/key; captures an afterimage of the Crown | No; Ch10 cosmetic reflection varies by ending |
| Depth Map | Exploration item; charts hazard-safe zones | No; Ch9 unlocks a route with an alternative cost |
| Dawn Sigil | Ending key; records the final choice | No; Ch10 final UI and ending ID |
| Legacy Codex | Lore collection; preserves an optional clue into NG+ | No; unlocks one hidden-epilogue variant |
| Crown of Embers | Final boss unique; once-per-phase survival side-grade | No; its state indicates one of the Regent's final consequences |

## 6.6 Fifteen consumables
| ID | Effect / limit | Craft source |
|---|---|---|
| `consumable.ember_draught` | Restore 35% HP; carry 3 | Emberleaf + clean water |
| `consumable.bitter_tonic` | Clear minor status, restore 10% HP; carry 2 | Bitter Seed + salt |
| `consumable.stamina_salt` | Restore 40% stamina once; carry 2 | Salt Iron + herb |
| `consumable.soot_bomb` | Briefly obscure ranged enemy line of sight; carry 3 | Ash Powder + cloth |
| `consumable.tide_flare` | Reveals underwater path/hazard for 15 s; carry 2 | Tideglass Sand + resin |
| `consumable.resonance_chime` | Activates sound-based world mechanism; no combat damage; carry 2 | Bellglass Chip + wire |
| `consumable.prism_shard` | Throws a short-lived decoy glint to draw a ranged shot; carry 3 | Prism Shard + resin |
| `consumable.warmth_pack` | Reduces cold hazard buildup for 45 s; carry 2 | Wool + Warmth Crystal dust |
| `consumable.poise_balm` | Next guard increases poise stability for 10 s; carry 1 | Herb + Iron Filings |
| `consumable.ember_oil` | Adds modest fire buildup to weapon for 20 s; carry 2 | Emberleaf + animal fat equivalent, stylized/non-graphic |
| `consumable.archive_ink` | Marks one clue surface for return navigation; carry 2 | Ink Resin + paper strip |
| `consumable.name_thread` | Reveals a name trace near a wall; carry 2 | Memory Thread fragment |
| `consumable.dry_boots` | Negates one small tide-floor slip; carry 1 | Hide + resin |
| `consumable.hollow_bell` | Distracts a non-boss ambusher; carry 2 | Bent Brass + Bellglass dust |
| `consumable.last_spark` | Emergency resource restore of 15 Ember, then skill costs +10% for 10 s; carry 1 | Astral Seed + Ash Powder |

## 6.7 Crafting system — 40 recipes
Each recipe has `id`, `inputs[]`, `output`, `station`, `unlock_flag`, `craft_time_seconds` (0 in a menu-based MVP), and `salvage_value`. Material names are canonical resource IDs. Recipes 01–03 preserve existing recipe keys.
| ID | Inputs → output | Station / unlock |
|---|---|---|
| `recipe.ember_core` | 3 Ember Shard + 2 Ash Scrap → 1 Ember Core | Quiet Forge / available early |
| `recipe.healing_relic` | 1 Ember Core + 2 Bitter Seed → 1 Healing Relic | Quiet Forge / Lyra intro |
| `recipe.star_relic` | 2 Prism Shard + 1 Astral Seed → 1 Star Relic | Quiet Forge / Chapter 5 |
| `recipe.ember_draught` | Bitter Seed + Clean Water + cloth filter → Ember Draught | Hearth Kitchen / Sable |
| `recipe.bitter_tonic` | Bitter Seed + Salt Iron dust → Bitter Tonic | Hearth Kitchen / Ch1 |
| `recipe.stamina_salt` | Salt Iron + herb bundle → Stamina Salt | Hearth Kitchen / Ch2 |
| `recipe.soot_bomb` | Ash Powder + cloth → Soot Bomb ×2 | Quiet Forge / Ch1 |
| `recipe.tide_flare` | Tideglass Sand + Ink Resin → Tide Flare | Tide Archive / Ch3 |
| `recipe.resonance_chime` | Bellglass Chip + wire → Resonance Chime | Quiet Forge / Bell Warden defeated |
| `recipe.prism_shard_decoy` | Prism Shard + Resin → Prism Decoy ×2 | Glass Chamber / Ch8 |
| `recipe.warmth_pack` | wool + Warmth Dust → Warmth Pack | Hearth Kitchen / Ch7 |
| `recipe.poise_balm` | Iron Filings + herb → Poise Balm | Quiet Forge / practice lesson |
| `recipe.ember_oil` | Emberleaf + binder → Ember Oil | Quiet Forge / Ch2 |
| `recipe.archive_ink` | Ink Resin + paper → Archive Ink ×2 | Tide Archive / Jun |
| `recipe.name_thread` | Memory Fleck + thread → Name Thread | Namekeepers' Wall / Maelin |
| `recipe.dry_boots` | Hide + resin → Dry Boots token | Quiet Forge / Neris |
| `recipe.hollow_bell` | Bent Brass + Resonance Dust → Hollow Bell | Quiet Forge / Hollow Reach |
| `recipe.last_spark` | Astral Seed + Ash Powder → Last Spark | Glass Chamber / Ch8 |
| `recipe.ash_ingot` | 3 Ash Scrap → Ash Ingot | Quiet Forge / Ch1 |
| `recipe.registry_plate` | Registry Plate + Ash Ingot → Registry Guard Plate | Quiet Forge / Ch4 |
| `recipe.tideglass_lens` | Tideglass Sand + Glass Fin → Tideglass Lens | Tide Archive / Ch3 |
| `recipe.prism_note` | Ink Resin + Prism Shard → Prism Note | Glass Chamber / Ch8 |
| `recipe.bellglass_fragment` | 2 Bellglass Chip + Memory Fleck → Bellglass Fragment | Namekeepers / Ch2 |
| `recipe.royal_thread` | 2 Royal Thread + cloth → Royal Thread Buckle | Quiet Forge / Ch4 |
| `recipe.choir_ribbon` | Choir Reed + thread → Choir Ribbon | Choir Loft / Ch6 |
| `recipe.warmth_crystal` | Warmth Dust + Prism Shard → Warmth Crystal | Hearth Kitchen / Ch7 |
| `recipe.nightglass_vial` | Nightglass Sand + glass → Nightglass Vial | Glass Chamber / Ch5 |
| `recipe.ashweave_patch` | Ash Cloth + thread → Ashweave Patch | Quiet Forge / Ch6 |
| `recipe.tide_rope` | Tide Scale + rope fiber → Tide Rope | Quiet Forge / Ch3 |
| `recipe.ledger_case` | Paper + Registry Plate → Ledger Case | Sanctuary workbench / Tovan |
| `recipe.memory_pearl` | Memory Fleck ×3 + glass → Pearl of Recall (one-time story item excluded from re-craft) | Namekeepers / Ch5 |
| `recipe.depth_map` | Ink Resin + tide chart → Depth Map | Cartographer's Table / Ch3 |
| `recipe.glass_astrolabe` | Prism Shard ×2 + compass gear → Glass Astrolabe | Glass Chamber / Ch8 |
| `recipe.astral_seed_refine` | Astral Seed + Ember Core → Refined Astral Seed | Glass Chamber / NG+ optional |
| `recipe.signet_polish` | Crownless Signet + polishing grit → cosmetic Signet finish | Quiet Forge / cosmetic only |
| `recipe.relic_repair` | 2 Essence + 1 Ash Scrap → repair one Broken relic's condition if condition systems enabled | Quiet Forge / optional system; disable if durability is not implemented |
| `recipe.salvage_bundle` | duplicate item + 1 Essence → material bundle based on item tier | Quiet Forge / automatic salvage alternative |
| `recipe.expedition_token` | three region marks → one optional Expedition entry token | Cartographer's Table / post-campaign |
| `recipe.cosmetic_dye_ash` | Ash Powder + plant dye → one dye shade | Quiet Forge / appearance menu |
| `recipe.namekeepers_plaque` | 2 Ash Scrap + 1 Memory Thread fragment → 1 Namekeepers wall plaque cosmetic | Sanctuary workbench / Maelin quest |

### Module 6 quality checks
- **Economy:** no story key item is salvageable; guaranteed unique boss rewards stay obtainable.
- **Dominant-strategy test:** damage affixes are limited and paired with costs/conditions; exploration and accessibility affixes remain viable but are not mandatory.
- **Cohesion:** items point back to characters, locations, record-keeping and the Crown.
- **Scope cuts:** MVP 15 core affixes, 12 consumables, 15 recipes, 3 sets; full target uses all lists above.
- **Self-score:** 4/5 pending probability and cost simulation in Module 7.

---

# MODULE 7 — ECONOMY & BALANCE

## 7.1 Currency and resource contract
| Resource | Sources | Sinks | Must not do |
|---|---|---|---|
| Essence | enemies, first-time discoveries, boss rewards, salvage | upgrade, respec, craft fees | Cannot buy gameplay power with real money |
| Cinder | optional world events, expedition side objectives | cosmetics earned in game, select hub variants | Must not overlap with paid premium currency; no expiry |
| Journey Points | campaign, contracts, seasonal objectives | seasonal reward track (10 milestones) | No daily streak loss |
| Reputation | quest choices, world-state actions | faction thresholds unlock dialogue, recipes, cosmetics | Never block main campaign completion |
| Craft materials | region nodes, enemies, recycling duplicates | recipes and equipment variants | No recipe may require a material from an inaccessible future zone without alternate source |
| Legacy Ash | optional Prestige cycle | side-grade relic slot/cosmetic Sanctuary echo | No raw DPS per Prestige stack |

## 7.2 Target flow (planning targets per cumulative playtime)
These are targets for a Standard player following main quests and some exploration; validate with a simulation and playtest. Not claims about live telemetry.
| Playtime checkpoint | Essence earned cumulative | Essence spent cumulative | Expected state |
|---|---:|---:|---|
| 1 h | 1,200–1,800 | 400–900 | One main weapon +2 to +3, enough healing supplies |
| 5 h | 6,000–9,000 | 4,000–6,500 | Main weapon +4 to +5, first Rare target |
| 10 h | 14,000–20,000 | 11,000–16,000 | One clear build direction, no need to farm repeat enemy loops |
| 25 h | 42,000–60,000 | 35,000–50,000 | One main weapon around +8; side-grade build possible |
| 40 h | 80,000–115,000 | 68,000–95,000 | Campaign complete with one developed and one experimental build |
| 50 h | 110,000–155,000 | 94,000–130,000 | NG+/Expedition experimentation, cosmetic collection underway |
| 100 h | 230,000–330,000 | 200,000–280,000 | Collection/mastery focus; no power requirement to continue |

Cinder is a long-run optional cosmetic currency: target 1–3 per optional world event and 3–6 per high-tier Expedition room set, so an earned cosmetic requires a handful of sessions, not a login streak. Seasonal rewards remain recoverable after the season through a catch-up route.

## 7.3 XP formula and level curve
`XP_to_next(L) = round(100 + 22L + 3.1L^2)` for levels 1–59. Soft power cap is level 60. Boss/quest XP is awarded once per completion flag; replay rewards are reduced to discourage trivial farming. Use a fixed reward table rather than scaling every enemy indefinitely.
| Level | XP to next | Cumulative XP at level start | Level | XP to next | Cumulative XP at level start |
|---:|---:|---:|---:|---:|---:|
| 1 | 125 | 0 | 31 | 3,761 | 42,542 |
| 2 | 156 | 125 | 32 | 3,978 | 46,303 |
| 3 | 194 | 281 | 33 | 4,202 | 50,281 |
| 4 | 238 | 475 | 34 | 4,432 | 54,483 |
| 5 | 288 | 713 | 35 | 4,668 | 58,915 |
| 6 | 344 | 1,001 | 36 | 4,910 | 63,583 |
| 7 | 406 | 1,345 | 37 | 5,158 | 68,493 |
| 8 | 474 | 1,751 | 38 | 5,412 | 73,651 |
| 9 | 549 | 2,225 | 39 | 5,673 | 79,063 |
| 10 | 630 | 2,774 | 40 | 5,940 | 84,736 |
| 11 | 717 | 3,404 | 41 | 6,213 | 90,676 |
| 12 | 810 | 4,121 | 42 | 6,492 | 96,889 |
| 13 | 910 | 4,931 | 43 | 6,778 | 103,381 |
| 14 | 1,016 | 5,841 | 44 | 7,070 | 110,159 |
| 15 | 1,128 | 6,857 | 45 | 7,368 | 117,229 |
| 16 | 1,246 | 7,985 | 46 | 7,672 | 124,597 |
| 17 | 1,370 | 9,231 | 47 | 7,982 | 132,269 |
| 18 | 1,500 | 10,601 | 48 | 8,298 | 140,251 |
| 19 | 1,637 | 12,101 | 49 | 8,621 | 148,549 |
| 20 | 1,780 | 13,738 | 50 | 8,950 | 157,170 |
| 21 | 1,929 | 15,518 | 51 | 9,285 | 166,120 |
| 22 | 2,084 | 17,447 | 52 | 9,626 | 175,405 |
| 23 | 2,246 | 19,531 | 53 | 9,974 | 185,031 |
| 24 | 2,414 | 21,777 | 54 | 10,328 | 195,005 |
| 25 | 2,588 | 24,191 | 55 | 10,688 | 205,333 |
| 26 | 2,768 | 26,779 | 56 | 11,054 | 216,021 |
| 27 | 2,954 | 29,547 | 57 | 11,426 | 227,075 |
| 28 | 3,146 | 32,501 | 58 | 11,804 | 238,501 |
| 29 | 3,345 | 35,647 | 59 | 12,189 | 250,305 |
| 30 | 3,550 | 38,992 | 60 | — | 262,494 |

Cumulative values are rough guideposts and should be generated from the formula in the build; the table must be validated by the data export script so hand-maintained discrepancies do not ship.

## 7.4 Drop targets by source
| Source | Broken/Common | Uncommon | Rare | Epic | Legendary | Mythic | Ascendant |
|---|---:|---:|---:|---:|---:|---:|---:|
| Normal enemy eligible drop | 18% | 7% | 2% | 0.4% | 0.05% | 0% | 0% |
| Elite | 8% | 25% | 10% | 3% | 0.4% | 0% | 0% |
| Main boss reward | 0% | 10% | 35% | 35% | 20% | 0% | 0% |
| Expedition tier 1–5 | 0% | 15% | 40% | 30% | 15% | 0% | 0% |
| Expedition tier 6–10 | 0% | 5% | 30% | 35% | 25% | 5% | 0% |
| Expedition tier 11–15 | 0% | 0% | 20% | 35% | 30% | 13% | 2% |
| Expedition tier 16–20 | 0% | 0% | 10% | 30% | 35% | 20% | 5% |
| Weekly contract reward | 0% | 10% | 40% | 35% | 15% | 0% | 0% |

These are rarity distributions for the reward slot, not guaranteed per-kill drop chances. Each row sums to 100%. Ascendant is limited to selected high-tier/first-time sources; one must not grind low-level mobs for it.

### Expected timing targets
- First Rare: before/around Chapter 2 for a typical player; guaranteed Rare or choice token before Chapter 3 if RNG has been unkind.
- First Epic: mid-campaign around Chapters 4–5 through story/contract paths.
- First Legendary: guaranteed signature Legendary-equivalent boss or quest reward around Chapters 6–8, though a random drop can come sooner.
- Mythic/Ascendant: optional endgame/NG+; not required for any campaign ending.

## 7.5 Difficulty modes
| Setting | Damage received | Enemy HP | Stamina recovery | Parry reference window | Perfect dodge reference window | Drop changes |
|---|---:|---:|---:|---:|---:|---|
| Story | 0.70× | 0.90× | 1.15× | 0.23 s | 0.12 s | Same key rewards; slightly more common materials |
| Standard | 1.00× | 1.00× | 1.00× | 0.20 s | 0.10 s | Baseline |
| Ashen | 1.15× | 1.12× | 0.95× | 0.20 s | 0.10 s | Cosmetic/record rewards only, no exclusive power |

Do not secretly lower enemy intelligence in Story. Telegraphs stay clear across difficulties. Difficulty may be changed at Sanctuary; the game explains effects and does not shame the player.

## 7.6 Simulation acceptance tests
Use a seeded Monte Carlo test of at least 100,000 simulated reward paths per source/difficulty. Acceptance criteria:
1. At least 95% of Standard campaign paths can upgrade one chosen main weapon to +10 or its tier-appropriate equivalent by Chapter 4 without farming the same encounter more than three times.
2. At least 90% acquire a Rare item by Chapter 3; pity guarantees the remaining eligible paths.
3. No required story gate depends on a random drop.
4. Median Essence balance never falls below the cost of a basic healing refill plus a single modest upgrade after a normal boss reward.
5. No cosmetic can be obtained only by waiting for a particular real-world day; rotating content retains a catch-up path.

### Module 7 quality checks
- **Cohesion:** every resource sink supports combat, exploration, records or customization.
- **Dominant strategy:** farming a low-tier source is inferior to first-time exploration and level-appropriate activity; high power cannot be purchased.
- **Self-score:** 3.5/5 pending Monte Carlo execution and in-game economy telemetry. The formulas are implementable, but the numbers are provisional targets.

---

# MODULE 8 — CORE LOOP, SANCTUARY, META-PROGRESSION

## 8.1 The three loops
| Loop | Duration | Actions / decision | Reward / natural stopping point |
|---|---|---|---|
| Core | 30 s–5 min | Read tell → commit/defend/reposition → loot or investigate trace | Skill mastery, Essence, one clue; stop at a checkpoint or discovered truth |
| Session | 30–90 min | Choose a route, complete 1–2 quests, explore a pocket, return to Sanctuary | Story/faction flag, new shortcut, materials; explicit “safe to stop” point |
| Meta | Weekly/seasonal but optional | Select a contract or Expedition modifier, experiment with another build | Cosmetic, mastery progress, Collection; no streak loss if missed |

## 8.2 Sanctuary building progression (12)
| Building | Unlock / cost target | Gameplay purpose | Visible change / NPC |
|---|---|---|---|
| Ember Hall | Ch1; free | Rest, save, difficulty and Appearance access | Firepit lit / Lyra |
| Namekeepers' Wall | Ch1; 1,000 Essence + 2 Memory Flecks | Review recovered names, display choice records | New engraved panels / Maelin |
| Quiet Forge | Ch1; 1,500 Essence + Ash Ingot | Upgrade/salvage/craft | Forge tools and sparks / Orren's smith contact or designated Forge NPC |
| Cartographer's Table | Ch1; route quest | Region map, shortcuts, Expeditions | Maps and pins / Orren |
| Tide Archive Room | Ch3; Archive Seal | Lore comparison, tide chart | Shelves and drying racks / Jun, Neris |
| Reliquary | Ch2; Bellglass | Relic loadout and relic lore | Glass cases / The Seer as consultant |
| Practice Yard | Ch1; tutorial | Training dummies, combat drill, revisit tutorial | Clear silhouettes and target types / Veyra if trust route unlocked |
| Hearth Kitchen | Ch1; 800 Essence | Consumables and survival supply | Warm lights / Sable |
| Choir Loft | Ch6; quest outcome | Resonance/codex audio playback | Hanging ribbons / optional Maelin interaction |
| Glass Chamber | Ch8; Astrolabe | Build compare, mastery preview, future clue review | Lens array / Jun or Seer scene |
| Collection Gallery | Ch2; first Collection item | View boss records, cosmetics, found relics | Static display proxies, not full sim / curator role |
| Friends' Echo Gallery | Post-campaign only | Asynchronous friend profile/Sanctuary echo preview; no co-op commitment in MVP | Small projection frames / no permanently simulated visitors |

### Sanctuary state model
Store separate state groups: `physical_state` (buildings, lights, props), `social_state` (NPC presence/dialogue flags), `historical_state` (public/private record policy, winter ration choice, ending legacy). Rebuild only changed props/variants; do not duplicate the entire Sanctuary scene for each combination. `Friends' Echo Gallery` is disabled until campaign completion and must be opt-in, privacy-controlled and nonessential.

## 8.3 NG+, Prestige and Cycle
- NG+ replays the ten-chapter narrative with altered lines, recovered clue echoes and selected boss pattern variants. It does not require the player to repeat tutorials unless requested.
- First cycle sets the canonical world choice flags; NG+ creates `cycle_index` and `echo_flags`. Previous choices are readable in Codex but the player can choose differently.
- Prestige unlocks cosmetics, hub variants, optional relic slot side-grades and mastery goals. No escalating raw-damage requirement.
- Expedition tiers 1–20 are seed-deterministic per run ID; the player sees the seed and modifier list before commitment.

## 8.4 Mastery tracks 1–20
| Track | 1 / 5 / 10 / 15 / 20 reward types |
|---|---|
| Weapon mastery | New move variant / weapon idle / technique side-grade / mastery challenge / cosmetic weapon finish |
| Build mastery | Loadout slot / trait interaction / training challenge / title / portrait frame |
| Expedition mastery | Room clue / modifier selection preview / hub trophy / higher challenge cosmetic / seed inscription |
| Faction mastery | Dialogue access / recipe / banner / unique quest scene / cosmetic uniform variant |
| Lore mastery | Codex comparison / voice playback / Gallery plaque / hidden environmental trace / NG+ echo line |

Every track has one meaningful reward each five ranks, with small intermediate collection tokens. Mastery rank must not require repeating an identical contract dozens of times.

## 8.5 Eighty achievements (IDs and criteria)
| # | ID / Achievement | Criteria |
|---:|---|---|
| 1 | `ach.first_spark` First Spark | Finish tutorial combat |
| 2 | `ach.first_parry` First Answer | Land first successful parry |
| 3 | `ach.perfect_step` Perfect Step | Perfect-dodge a telegraphed attack |
| 4 | `ach.stagger_execute` Opened Record | Execute an eligible staggered enemy |
| 5 | `ach.no_heavy_needed` Measured Force | Defeat one elite without charged heavy |
| 6 | `ach.guard_break` Break the Seal | Break a shieldbearer's guard |
| 7 | `ach.skill_weave` Three Marks | Use Q, E and R in one encounter |
| 8 | `ach.first_boss` The Bell Falls | Defeat Bell Warden |
| 9 | `ach.bell_without_panic` Hear the Gap | Avoid the Bell Warden's signature hit |
| 10 | `ach.hollow_answer` Answer Below | Finish Chapter 2 |
| 11 | `ach.archive_open` Beneath the Record | Open Drowned Archive |
| 12 | `ach.archive_sealed` Let It Rest | Seal the Drowned Archive |
| 13 | `ach.archive_public` No Locked Truth | Publish the Drowned Archive records |
| 14 | `ach.district_united` One City | Choose unified Crownlands |
| 15 | `ach.district_free` Many Voices | Choose district independence |
| 16 | `ach.garden_return` Return the Memory | Return the Garden memory collection |
| 17 | `ach.garden_preserve` Keep the Bloom | Preserve the Garden memory collection |
| 18 | `ach.choir_names` Hear the Names | Resolve Chapter 6 identity choice |
| 19 | `ach.winter_sanctuary` Keep the Hearth | Prioritize Sanctuary during winter |
| 20 | `ach.winter_distribute` Share the Warmth | Distribute winter resources more broadly |
| 21 | `ach.future_trust` A Possible Dawn | Trust a future vision |
| 22 | `ach.future_reject` No Prophecy | Reject the prophecy |
| 23 | `ach.depth_accept` Bear the Weight | Accept consequences in Chapter 9 |
| 24 | `ach.depth_rewrite` Rewrite One Page | Rewrite a memory in Chapter 9 |
| 25 | `ach.new_dawn_old` Keep the Frame | Choose to retain the old world structure |
| 26 | `ach.new_dawn_new` Make the Dawn | Choose to build a new order |
| 27 | `ach.all_chapters` Ten Chapters | Complete all ten chapters |
| 28 | `ach.regent_survive` The Last Record | Resolve Ashen Regent encounter |
| 29 | `ach.hidden_story` The Unwritten Page | Unlock hidden story ending |
| 30 | `ach.ngplus` Echo Cycle | Complete NG+ final chapter |
| 31 | `ach.first_rare` A Better Edge | Obtain first Rare item |
| 32 | `ach.first_epic` The Weight of Things | Obtain first Epic item |
| 33 | `ach.first_legendary` A Story in Steel | Obtain first Legendary item |
| 34 | `ach.upgrade_ten` Made to Last | Upgrade a main weapon to +10 |
| 35 | `ach.salvage_ten` Reclaimed | Salvage ten eligible duplicates |
| 36 | `ach.craft_ten` Quiet Forge | Craft ten recipes |
| 37 | `ach.all_weapon_families` Eight Ways | Use all eight weapon families |
| 38 | `ach.relic_pair` Two Keepsakes | Equip two relics with distinct triggers |
| 39 | `ach.no_heal_boss` Hold the Line | Win one boss without using healing |
| 40 | `ach.no_death_pocket` Clean Route | Clear an optional combat pocket without death |
| 41 | `ach.ashrunner_master` One Breath | Reach Ashrunner mastery 10 |
| 42 | `ach.hearthguard_master` Keep Standing | Reach Hearthguard mastery 10 |
| 43 | `ach.emberweaver_master` Spark Logic | Reach Emberweaver mastery 10 |
| 44 | `ach.gravebound_master` Heavy Promise | Reach Gravebound mastery 10 |
| 45 | `ach.tideveil_master` Read the Tide | Reach Tideveil mastery 10 |
| 46 | `ach.all_mastery_tracks` Skilled Witness | Reach mastery rank 5 in all tracks |
| 47 | `ach.sanctuary_half` Half a Home | Restore six Sanctuary facilities |
| 48 | `ach.sanctuary_all` Hearth Rebuilt | Restore all twelve Sanctuary facilities |
| 49 | `ach.friend_echo` Echoes Together | View a friend's shared post-campaign echo, if opted in |
| 50 | `ach.appearance_saved` Your Own Ember | Create and save a character appearance |
| 51 | `ach.appearance_again` Changed Reflection | Change appearance at Sanctuary |
| 52 | `ach.origin_witness` Road Witness | Finish the Origin-specific first shortcut clue |
| 53 | `ach.origin_ashbound` Ashbound | Finish the Origin-specific first poise clue |
| 54 | `ach.origin_archivist` Quiet Archivist | Finish the Origin-specific Codex clue |
| 55 | `ach.sable_arc` Living Names | Complete Sable's character arc |
| 56 | `ach.neris_arc` Empty Berth | Complete Neris's character arc |
| 57 | `ach.tovan_arc` Signed Responsibility | Resolve Tovan's final order |
| 58 | `ach.maelin_arc` Unforced Memory | Resolve Maelin's archive choice |
| 59 | `ach.jun_arc` Contradiction Kept | Complete Jun's evidence quest |
| 60 | `ach.veyra_arc` No Clean Victory | Resolve Veyra's final challenge |
| 61 | `ach.caldrin_arc` End the Rite | Resolve Caldrin's final ritual |
| 62 | `ach.guest_arc` Unwritten Guest | Finish the Guest's hidden quest |
| 63 | `ach.faction_registry` Registry Standing | Reach Trusted with Crown Registry |
| 64 | `ach.faction_namekeepers` Names Kept | Reach Trusted with Namekeepers |
| 65 | `ach.faction_cartographers` Find the Road | Reach Trusted with Ash Cartographers |
| 66 | `ach.faction_tide` Under the Water | Reach Trusted with Tide Archive |
| 67 | `ach.faction_glass` Read the Horizon | Reach Trusted with Glass Observers |
| 68 | `ach.codex_20` Twenty Traces | Unlock 20 Codex entries |
| 69 | `ach.codex_40` Pattern Emerges | Unlock 40 Codex entries |
| 70 | `ach.codex_80` Archive Without End | Unlock 80 Codex entries |
| 71 | `ach.world_events_5` Witness to Change | Complete five distinct World Events |
| 72 | `ach.world_events_12` Changing World | Complete all twelve World Event types |
| 73 | `ach.contracts_10` A Signed Route | Complete ten distinct contracts |
| 74 | `ach.contracts_30` Thirty Witnesses | Complete all thirty contract templates |
| 75 | `ach.expedition_5` Beyond the Gate | Clear Expedition tier 5 |
| 76 | `ach.expedition_10` Deeper Record | Clear Expedition tier 10 |
| 77 | `ach.expedition_15` No Easy Echo | Clear Expedition tier 15 |
| 78 | `ach.expedition_20` End of the Spiral | Clear Expedition tier 20 |
| 79 | `ach.collection_half` Curator | Register half of the Collection set |
| 80 | `ach.collection_all` Nothing Forgotten | Complete the defined core Collection registry |

## 8.6 Thirty weekly contract templates
Rotate at most 3 active contracts per week: one combat, one story/lore, one exploration; completing all is optional. No contract expires a unique item or essential quest.
| ID | Type / title | Objective / narrative beat |
|---|---|---|
| `contract.c01` | Combat — A Bell in the Dust | Defeat two bell-touched enemies; learn how resonance draws danger |
| `contract.c02` | Combat — Shield with a Name | Break three shieldbearer guards; recover the names on their plates |
| `contract.c03` | Combat — No Second Verse | Interrupt one summoner before its second channel |
| `contract.c04` | Combat — Stay on Dry Stone | Clear a tide pocket without standing in a marked hazard |
| `contract.c05` | Combat — Read the Feint | Defeat a duelist after baiting its committed thrust |
| `contract.c06` | Combat — One Clean Answer | Land three parries in an optional encounter |
| `contract.c07` | Combat — Broken Banner | Disable a command banner and defeat its guardians |
| `contract.c08` | Combat — Echo Engine | Complete an Expedition room with one modifier active |
| `contract.c09` | Combat — No Panic | Survive a boss string with no healing used in that string |
| `contract.c10` | Combat — Tools, Not Power | Win with one utility skill equipped |
| `contract.c11` | Lore — The Clerk's Margin | Find a note that contradicts a Registry order |
| `contract.c12` | Lore — Someone Heard It | Collect two independent bell witnesses |
| `contract.c13` | Lore — Ink Under Water | Compare a submerged entry with its dry copy |
| `contract.c14` | Lore — The Garden's Empty Bed | Discover who was removed from a Garden memory record |
| `contract.c15` | Lore — Three Names, One Hand | Link three signatures across factions |
| `contract.c16` | Lore — The Quiet Procession | Observe a Choir ritual without killing its participants where feasible |
| `contract.c17` | Lore — A Missing Timestamp | Find Jun's three inconsistent dates |
| `contract.c18` | Lore — The Last Ration | Read the winter ration board and speak to Sable |
| `contract.c19` | Lore — What the Lens Saw | Compare two Observatory readings |
| `contract.c20` | Lore — The Page Left Open | Find one hidden Guest clue; no random drop gate |
| `contract.c21` | Explore — Shortcut Without a Sign | Find a safe route around a flooded gate |
| `contract.c22` | Explore — Dry Room | Locate one optional safe pocket in Veil Sea |
| `contract.c23` | Explore — The Road Orren Cut | Find the missing line in Orren's map |
| `contract.c24` | Explore — Name on the Wall | Add a verified witness name to Sanctuary |
| `contract.c25` | Explore — Starpetal Loop | Trace the Garden constellation path |
| `contract.c26` | Explore — Bellglass Tone | Find all tones of a three-part sound clue |
| `contract.c27` | Explore — The Old Boundary | Follow the depth map to a safe overlook |
| `contract.c28` | Explore — District by District | Visit all active district notice boards |
| `contract.c29` | Explore — A Room for the Living | Help Sable inspect a potential clinic site |
| `contract.c30` | Explore — Glass Returns the Sky | Align an optional mirror puzzle and record the result |

## 8.7 Four seasons and ten milestone reward model
Seasonal content is cosmetic/lore-sidegrade and never required for campaign endings. Ten milestones cost a total of 1,000 Journey Points; earn 100 per milestone, no escalating requirement, carry-forward catch-up quest after season end.
| Season | Theme / seasonal boss / temporary Expedition room | Milestone rewards (10) |
|---|---|---|
| Season I — The Missing Tone | Bell echoes; boss echo variant; Bell chamber tiles | 1 dye, 2 emote/idle, 3 Gallery plaque, 4 Essence, 5 lantern cosmetic, 6 title, 7 recipe material, 8 banner, 9 weapon finish, 10 full Bell Echo set |
| Season II — Water Keeps Copies | Tidal archive; drowned index echo; flooded library tiles | tide dye, boat idle, Codex plaque, material cache, mask finish, title, map frame, banner, weapon trail cosmetic, full Drowned Archive set |
| Season III — The City of Votes | District records; Quorum echo; council square tiles | district dye, gesture, plaque, Essence, signet finish, title, frame, banner, armor overlay, full Crownless set |
| Season IV — The Unwritten Horizon | Unwritten Guest echoes; Echo Engine variant; glass observatory tiles | ash dye, mask accent, archive plaque, material cache, robe finish, title, star frame, hub sculpture, weapon finish, full Unwritten Horizon set |

### Module 8 quality checks
- **Ethics:** no login streaks, no paid power, no expiration of core content; friend echo is post-campaign, opt-in and noncompetitive.
- **Scope:** hub variants should use modular prop swaps rather than duplicated scenes; asynchronous social is MVP only after the campaign is complete.
- **Self-score:** 4/5; validate reward cadence and hub memory budget.

# MODULE 9 — QUEST DESIGN & STORY STRUCTURE

## 9.1 Quest implementation contract
Every quest is a data asset with: `id`, `chapter_id`, `type`, `giver_id`, `prerequisites[]`, `objectives[]` (Talk/Kill/Collect/Explore/Boss plus `target_id`, `count`, optional order), `choice_nodes[]`, `world_flags_set[]`, `reward_ids[]`, `dialogue_key`, `failure_recovery`, `availability_policy`. IDs are immutable once shipped. Main quests are never permanently missable; side quests can be missed narratively but their core crafting materials have an alternate source.

**40-hour campaign allocation:** approximately 21 hours main quests (40 main quests averaging about 30 minutes), 7 hours important side quests (30 side quests averaging 12–18 minutes), 5 hours exploration/Codex, 5 hours boss retry/build/Sanctuary management, and about 2 hours of transitions/travel/menu planning. This sums to the 40-hour target as a planning budget, with natural player variance. Player route variance is expected; this is planning arithmetic, not a completion guarantee.

## 9.2 Ten-chapter quest matrix (4 main + 3 side quests each)
The IDs below are implementation-ready quest records at outline level. All have repeatable investigation/return-to-hub recovery unless marked as a timed encounter; a missed interaction cannot hard-lock the campaign. Dialogue keys map to localization assets in Module 13. The `choice/flag` column specifies consequential state. A main objective always includes a Talk/Explore/Collect/Kill/Boss step as named.

### Chapter 1 — The Last Ember (Sanctuary, target ~2.0 h main path)
| ID / Type | Giver / objectives | Choice & world flag | Reward | Key line (EN / VI) / recovery |
|---|---|---|---|---|
| `quest.c01.m01_wake` Main | Lyra; Talk Lyra, Explore ember site, Collect 1 trace | Protect Sanctuary or seek truth → `c01_priority=hearth/truth` | Sanctuary Sigil, first healing consumable | “The ember remembers what the village cannot.” / “Tàn lửa nhớ điều ngôi làng không còn nhớ.” Reinspect site after rest |
| `quest.c01.m02_wall` Main | Maelin; Explore 3 damaged names, Talk survivor | Seal village evidence or expose it → `village_record=sealed/public` | Namekeeper Token | “A name can shelter someone, or summon a hunter.” / “Một cái tên có thể che chở ai đó, hoặc gọi thợ săn đến.” Any missing clue has an alternate wall fragment |
| `quest.c01.m03_road` Main | Orren; Explore blocked road, defeat 1 Name-Scraped Pilgrim, Talk Orren | Trust map or follow bell trace → `c01_route=map/bell` | Road marker, shortcut | “I removed the road to keep someone alive.” / “Tôi xóa con đường để giữ một người sống.” Return to map table to reselect route |
| `quest.c01.m04_first_bell` Main/Boss | Lyra; Explore bell approach, Boss Bell Warden | Break bell mount or preserve fragment → `bell_mount=broken/preserved` | Bellglass Fragment | “The third tone never came.” / “Âm thứ ba chưa bao giờ vang lên.” Boss retry from checkpoint |
| `quest.c01.s01_last_cup` Side | Sable; Collect 3 clean water and Talk 2 residents | Deliver to clinic vs water store → `c01_water=clinic/store` | Ember Draught recipe | “Warmth is a choice made in public.” / “Hơi ấm là lựa chọn được đưa ra trước mọi người.” Water nodes respawn at alternate site |
| `quest.c01.s02_empty_plaque` Side | Maelin; Explore blank plaque, inspect 2 handwriting samples | Add unknown mark or leave blank → `plaque_marked` bool | Codex entry, Cinder | “A blank is not an invitation to invent.” / “Khoảng trống không phải lời mời bịa ra.” Retry after next hub state |
| `quest.c01.s03_practice` Side | Veyra or Practice Yard; train dodge, parry, guard-break | Optional challenge; no story lock → `tutorial_drills_seen` set | Practice badge, small Essence | “Read the body, not the promise.” / “Đọc chuyển động, đừng đọc lời hứa.” Drill can be restarted anytime |

### Chapter 2 — The Bell Beneath Hollow (Hollow Reach, target ~1.9 h main path)
| ID / Type | Giver / objectives | Choice & world flag | Reward | Key line / recovery |
|---|---|---|---|---|
| `quest.c02.m01_sound` Main | The Seer; Explore 3 sound echoes | Silence bell or find caller → `c02_bell=quiet/caller` | Hollow Lantern | “A voice is not proof of a person.” / “Một giọng nói không chứng minh có một người.” Echoes can be revisited |
| `quest.c02.m02_underbank` Main | Orren; Explore underbank, defeat Underbank Lurker | Mark dangerous route or open route → `underbank_route=marked/open` | Tideglass Sand | “The map was afraid before I was.” / “Bản đồ đã sợ trước cả tôi.” Alternate ledge provides clue |
| `quest.c02.m03_witness` Main | Sable; Talk 2 witnesses, Collect 1 Memory Fleck | Publish testimony or anonymize it → `c02_witness=public/private` | Memory Thread | “A witness must survive their own truth.” / “Nhân chứng phải sống sót qua sự thật của chính họ.” Revisit Sanctuary clinic |
| `quest.c02.m04_bellroot` Main/Boss | Lyra; Boss Hollow Caller, Explore bell root | Destroy root or isolate sound → `bell_root=destroyed/isolated` | Resonance Pearl | “The caller was never where the echo pointed.” / “Kẻ gọi chưa bao giờ ở nơi tiếng vọng chỉ tới.” Boss retry available |
| `quest.c02.s01_candle_line` Side | Maelin; place 3 candles at name fragments | Public ritual or private ritual → `candle_rite=public/private` | Choir Ribbon fragment | “Light does not restore a name; it shows where it was lost.” / “Ánh sáng không trả lại tên; nó cho thấy tên đã mất ở đâu.” Revisit three altars |
| `quest.c02.s02_dredger_tools` Side | Orren; Collect 4 Dredge Iron | Return tools or repurpose them → `dredger_tools=returned/repurposed` | Forge materials | “A tool remembers the hand, not its order.” / “Công cụ nhớ bàn tay, không nhớ mệnh lệnh.” Material alternatives from elites |
| `quest.c02.s03_three_tones` Side | The Seer; identify 2 of 3 sound motifs | Trust the missing tone or record all → `c02_tone_reading=gap/all` | Bellglass lore entry | “The silence is part of the measure.” / “Khoảng lặng cũng là một phần của nhịp.” Audio clue can be replayed in Codex |

### Chapter 3 — Veil of Tides (Hollow Reach / Veil Sea, target ~2.0 h main path)
| ID / Type | Giver / objectives | Choice & flag | Reward | Key line / recovery |
|---|---|---|---|---|
| `quest.c03.m01_dive` Main | Neris; Explore tide gate, use tide cycle once | Wait for tide or spend flare → `c03_entry=patient/flare` | Tideglass Compass | “The sea keeps copies, not answers.” / “Biển giữ bản sao, không giữ câu trả lời.” Wait route always reopens |
| `quest.c03.m02_manifest` Main | Jun; Collect 3 manifest fragments, Talk Neris | Treat record as verified or disputed → `manifest_status=verified/disputed` | Drowned Archive Seal | “The date is clear. The people are not.” / “Ngày tháng rõ ràng. Con người thì không.” Missing fragment can be obtained from a side cache |
| `quest.c03.m03_archive_policy` Main | Jun and Maelin; Explore archive stacks, Talk 2 witnesses | Seal or publish files → `archive_policy=sealed/public` | Archive access; faction standings | “A locked truth is still a choice.” / “Sự thật bị khóa vẫn là một lựa chọn.” Policy selectable before leaving region |
| `quest.c03.m04_drowned_index` Main/Boss | Neris; Boss Drowned Index | Save archive copy or rescue trapped witness → `c03_priority=archive/witness` | Indexer's Knife / guaranteed quest token | “The file survived. Did its witness?” / “Hồ sơ sống sót. Còn nhân chứng thì sao?” Boss retry; witness branch can be revisited via rescue route |
| `quest.c03.s01_low_tide` Side | Neris; Explore low tide route | Leave marker for future travelers or take material → `low_tide_marker` bool | Tide Rope recipe | “A safe road is a promise to strangers.” / “Con đường an toàn là lời hứa với người xa lạ.” Route remains discoverable |
| `quest.c03.s02_jun_timestamp` Side | Jun; inspect 3 timestamp sources | Publish inconsistency or continue study → `timestamp_report=public/held` | Prism Note | “Do not smooth a contradiction into a lie.” / “Đừng mài phẳng mâu thuẫn thành lời nói dối.” Re-read archive records |
| `quest.c03.s03_salt_debt` Side | Sable; deliver salt supplies to divers or clinic | `c03_supplies=divers/clinic` | Warmth/medicine materials | “Every route has someone waiting at the end.” / “Cuối mỗi con đường đều có người đang chờ.” Alternate cache if one recipient unavailable |

### Chapter 4 — The Crownless City (Crownlands, target ~2.1 h main path)
| ID / Type | Giver / objectives | Choice & flag | Reward | Key line / recovery |
|---|---|---|---|---|
| `quest.c04.m01_quorum` Main | Tovan; Talk 3 district delegates | Seek one central vote or independent district votes → `district_model=unified/independent` | District Ledger | “Order is not the same as consent.” / “Trật tự không đồng nghĩa với đồng thuận.” Return to board to choose before lock-in |
| `quest.c04.m02_signet` Main | Orren; Explore signet trail, defeat Quorum Golem | Publicly identify forged signet or retain as leverage → `signet_handling=public/held` | Crownless Signet | “The seal is real. The authority may not be.” / “Con dấu là thật. Quyền lực đứng sau nó chưa chắc.” Evidence has alternate location |
| `quest.c04.m03_registry_order` Main | Tovan and Jun; Collect signed order, Talk both | Tovan accepts responsibility or blames predecessor → `tovan_response=owns/deflects` | Royal Thread | “My seal is on the order.” / “Con dấu của tôi nằm trên mệnh lệnh đó.” Quest cannot fail due to faction standing |
| `quest.c04.m04_quorum_boss` Main/Boss | Tovan; Boss Quorum Without Faces | Break command banner or defeat guards directly → `quorum_resolution=disrupt/defeat` | Royal Thread Buckle | “A vote without faces is only a weapon.” / “Cuộc bỏ phiếu không có gương mặt chỉ là một thứ vũ khí.” Restart from plaza checkpoint |
| `quest.c04.s01_public_board` Side | Maelin; add 3 verified public notices | Public wall or private ledger → `notice_policy=public/private` | Cinder, faction rep | “People need the record before the rumor.” / “Người dân cần hồ sơ trước lời đồn.” Any notice can be found later |
| `quest.c04.s02_toll_road` Side | Orren; defeat or negotiate with a road bailiff | Clear road or formalize a safe toll → `road_toll=clear/formal` | Shortcut / Essence | “A road should not demand a name as payment.” / “Con đường không nên bắt người ta trả bằng tên.” Combat or dialogue path both progress |
| `quest.c04.s03_tovan_order_copy` Side | Tovan; find his old signature | Return copy privately or post it → `tovan_copy=private/public` | Registry Plate | “Do not destroy the evidence because it hurts.” / “Đừng hủy bằng chứng chỉ vì nó gây đau.” Copy is available in archive fallback |

### Chapter 5 — Garden of Sleeping Stars (Crownlands, target ~2.2 h main path)
| ID / Type | Giver / objectives | Choice & flag | Reward | Key line / recovery |
|---|---|---|---|---|
| `quest.c05.m01_garden_entry` Main | The Seer; solve 3 constellation clues | Let memory play or interrupt it → `garden_first_contact=play/interrupt` | Starpetal | “Wonder is not evidence, but it can point toward it.” / “Kỳ diệu không phải bằng chứng, nhưng có thể chỉ đường đến bằng chứng.” Puzzle replay available |
| `quest.c05.m02_sleeping_names` Main | Maelin; match 3 memory objects to names | Return memories or preserve them as echoes → `garden_memory=returned/preserved` | Pearl of Recall | “A memory kept by force becomes another cage.” / “Ký ức bị giữ bằng cưỡng ép sẽ thành chiếc lồng khác.” No unique item can be lost |
| `quest.c05.m03_nightglass` Main | Sable; explore a memory with two witnesses | Disclose full memory or redact identities → `garden_disclosure=full/redacted` | Nightglass Vial | “The hurt is real even when the picture is wrong.” / “Nỗi đau là thật, dù hình ảnh có thể sai.” Replay at Gallery |
| `quest.c05.m04_gardener` Main/Boss | The Seer; Boss Sleepless Gardener | Break all root anchors or accept one memory's loss → `garden_boss=roots/sacrifice` | Starpetal Staff | “A garden cannot be saved by keeping every bloom asleep.” / “Không thể cứu khu vườn bằng cách giữ mọi bông hoa ngủ mãi.” Retry from garden checkpoint |
| `quest.c05.s01_missing_bed` Side | Jun; inspect empty plant bed and two records | Keep contradiction or select best-supported account → `bed_record=contradiction/best_supported` | Codex clue | “The empty space belongs in the archive too.” / “Khoảng trống cũng thuộc về kho lưu trữ.” Evidence can be revisited |
| `quest.c05.s02_sleepless_watch` Side | Veyra; survive an optional duel lesson | Show restraint or pursue a full win → `veyra_first_duel=restraint/win` | Training token / cosmetic progress | “Know when a fight has told you enough.” / “Hãy biết khi nào trận đấu đã nói đủ.” Retry with no penalty |
| `quest.c05.s03_starpetal_path` Side | Orren; locate 3 petal marks | Restore path markers or collect fragments → `starpath=restored/fragments` | Starpetal material | “A path can be remembered even when nobody walks it.” / “Một lối đi vẫn có thể được ghi nhớ dù chẳng ai bước trên đó.” Clue trail remains active |

### Chapter 6 — The Nameless Choir (Choir of Ash, target ~2.0 h main path)
| ID / Type | Giver / objectives | Choice & flag | Reward | Key line / recovery |
|---|---|---|---|---|
| `quest.c06.m01_procession` Main | Maelin; observe rite, collect 2 ribbons | Join to learn or remain outside as witness → `choir_stance=join/witness` | Choir Ribbon | “A chorus can hold a name or drown it.” / “Hợp xướng có thể giữ một cái tên, hoặc nhấn chìm nó.” Can observe from safe ledge |
| `quest.c06.m02_caldrin_doctrine` Main | Caldrin; Talk, inspect 3 ritual objects | Argue from testimony or destroy a resonator → `caldrin_approach=testimony/force` | Resonance Pearl | “Silence is not peace if nobody chose it.” / “Im lặng không phải bình yên nếu chẳng ai được lựa chọn.” Alternate dialogue path if object destroyed |
| `quest.c06.m03_name_chamber` Main | The Seer; Explore identity chamber | Restore names or follow the player's own voice → `identity_path=restore/self` | Namekeeper Token | “You can return a name without owning the person.” / “Bạn có thể trả lại một cái tên mà không sở hữu người mang nó.” Door can reopen from checkpoint |
| `quest.c06.m04_rite_boss` Main/Boss | Maelin; resolve Prior's Echo | Disable resonance plates or use testimony route → `rite_resolution=plates/testimony` | Hymnal of Silence | “Do not absolve the living by erasing their acts.” / “Đừng tha bổng người sống bằng cách xóa bỏ hành động của họ.” Boss retry; testimony route requires clues, not RNG |
| `quest.c06.s01_ribbon_names` Side | Maelin; pair 3 ribbons to plaques | Public archive vs private wall → `ribbon_policy=public/private` | Choir cosmetic | “A ribbon without a name is still a trace.” / “Dải ruy băng không tên vẫn là dấu vết.” Re-pairing is allowed |
| `quest.c06.s02_caldrin_witness` Side | Sable; interview 2 former followers | Protect identities or publish accounts → `caldrin_witnesses=protected/published` | Codex entries | “A confession should not become another weapon.” / “Lời thú nhận không nên trở thành một thứ vũ khí khác.” Revisit after main resolution |
| `quest.c06.s03_silent_floor` Side | Neris; navigate resonance floor | Mark safe tiles for travelers or disable floor permanently → `choir_floor=marked/disabled` | Resonance Dust | “The safest warning is one everyone can read.” / “Cảnh báo an toàn nhất là thứ ai cũng đọc được.” Reset puzzle at any rest |

### Chapter 7 — Ashfall Winter (Choir of Ash / Sanctuary route, target ~2.0 h main path)
| ID / Type | Giver / objectives | Choice & flag | Reward | Key line / recovery |
|---|---|---|---|---|
| `quest.c07.m01_rations` Main | Lyra and Sable; inspect ration ledger, talk 3 residents | Prioritize Sanctuary or distribute supplies broadly → `winter_rations=hub/broad` | Warmth Crystal | “There is no arithmetic that makes every loss fair.” / “Không phép tính nào khiến mọi mất mát trở nên công bằng.” Decision preview before lock-in |
| `quest.c07.m02_wind_route` Main | Orren; explore two shelter routes | Secure the short route or open two longer routes → `winter_routes=short/two_safe` | Ashweave Cloak | “A shortcut matters only if people can reach it.” / “Đường tắt chỉ có ý nghĩa nếu người ta đến được đó.” Both routes can be completed |
| `quest.c07.m03_clinic` Main | Sable; collect supplies and protect clinic | Keep medicine central or send mobile kit → `clinic_policy=central/mobile` | Sable quest flag | “The one dose is a choice, not a verdict.” / “Một liều thuốc là lựa chọn, không phải lời phán quyết.” Supplies have alternate caches |
| `quest.c07.m04_steward` Main/Boss | Lyra; Boss Winter Steward | Break wind machine or use shelter cycle → `winter_boss=machine/shelter` | Steward's Ladle | “The cold keeps no ledger of who deserved warmth.” / “Cái lạnh không ghi ai xứng đáng được sưởi ấm.” Retry allowed; no timed death outside telegraphed zones |
| `quest.c07.s01_last_dose` Side | Sable; take one dose to either clinic or outpost | `last_dose=clinic/outpost` | Recipe unlock, not unique power | “One dose cannot answer every grief.” / “Một liều thuốc không thể giải đáp mọi nỗi đau.” Other recipient is not killed automatically |
| `quest.c07.s02_winter_names` Side | Maelin; record names of missing residents | Publish names or preserve privately → `winter_name_list=public/private` | Namekeeper wall panel | “A list can comfort the living and endanger them.” / “Danh sách có thể an ủi người sống, cũng có thể khiến họ gặp nguy hiểm.” Can write list later |
| `quest.c07.s03_firebreak` Side | Veyra; disable 3 ember spreaders | Fight the guards or lure them away → `firebreak=force/lure` | Veyra trust flag, materials | “Protecting a place is not the same as owning it.” / “Bảo vệ một nơi không đồng nghĩa với sở hữu nó.” Enemies respawn only after rest |

### Chapter 8 — The Glass Observatory (Glass Expanse, target ~2.1 h main path)
| ID / Type | Giver / objectives | Choice & flag | Reward | Key line / recovery |
|---|---|---|---|---|
| `quest.c08.m01_lens` Main | The Seer; align 3 observation lenses | Trust one future or reject all forecasts → `forecast_policy=trust/reject` | Future Lens | “A likely future is still not a command.” / “Tương lai có khả năng xảy ra vẫn không phải mệnh lệnh.” Puzzle retakes are free |
| `quest.c08.m02_two_skies` Main | Jun; compare 2 prism readings | Publish uncertainty or publish best-supported reading → `future_report=uncertain/best` | Glass Astrolabe | “A clear reflection can still omit the room.” / “Phản chiếu rõ ràng vẫn có thể bỏ sót căn phòng.” Both reports remain in Codex |
| `quest.c08.m03_guest_trace` Main | The Unwritten Guest (optional gate not main-critical); find 3 repeated marks | Pursue identity or allow departure → `guest_contact=questioned/released` | Prism Note, hidden quest progress | “Not every unrecorded thing is lost.” / “Không phải điều gì chưa được ghi lại cũng đã mất.” If missed, marks remain after returning |
| `quest.c08.m04_astrologer` Main/Boss | The Seer; Boss Glass Astrologer | Trust stable shadow or destroy lens array → `observatory_resolution=read/break` | Glass Astrolabe | “The lens described a future. It did not choose it.” / “Thấu kính mô tả tương lai. Nó không chọn tương lai.” Boss retry from platform checkpoint |
| `quest.c08.s01_failed_prediction` Side | The Seer; find a prediction that failed | Preserve evidence or correct public record → `prediction_record=preserved/corrected` | Codex entry | “A failed prediction is evidence too.” / “Một lời tiên đoán sai cũng là bằng chứng.” Record can be found in Gallery later |
| `quest.c08.s02_observer_marks` Side | Jun; register 3 instrument marks | Return instruments or make a public exhibit → `observer_instruments=returned/exhibit` | Gallery object | “Tools should make seeing clearer, not make a witness smaller.” / “Công cụ phải giúp nhìn rõ hơn, không làm nhân chứng nhỏ bé đi.” Instruments not permanently missable |
| `quest.c08.s03_glass_path` Side | Orren; map a shifting horizon route | Map it once or install a permanent marker → `glass_path=map/marker` | Route hint | “The horizon moved. The rock did not.” / “Đường chân trời đã dịch chuyển. Tảng đá thì không.” Repeat puzzle available |

### Chapter 9 — The Starless Depths (Glass Expanse, target ~2.2 h main path)
| ID / Type | Giver / objectives | Choice & flag | Reward | Key line / recovery |
|---|---|---|---|---|
| `quest.c09.m01_descent` Main | Orren; follow Depth Map, cross 2 safe platforms | Accept the cost marker or search for another path → `depth_entry=accepted/alternate` | Depth Map update | “The safe path still asks for something.” / “Lối an toàn vẫn đòi hỏi một cái giá.” Alternate route is longer but guaranteed |
| `quest.c09.m02_witness_echo` Main | The Unwritten Guest / Maelin; compare 3 witness traces | Accept consequences or rewrite one memory → `c09_memory=accept/rewrite` | Legacy Codex fragment | “A rewritten memory changes the living, not only the past.” / “Ký ức viết lại làm thay đổi người sống, không chỉ quá khứ.” All clues can be reviewed before choice |
| `quest.c09.m03_last_record` Main | Jun and Tovan; validate Regent records | Publish full evidence or keep names private → `regent_record=public/protected` | District Ledger final record | “The evidence is complete. Its meaning is still disputed.” / “Bằng chứng đã đầy đủ. Ý nghĩa của nó vẫn còn tranh cãi.” Use archive fallback for missed fragments |
| `quest.c09.m04_depthless` Main/Boss | The Seer; Boss Depthless Witness | Accept consequence or rewrite echo during arena break → `depth_boss=accept/rewrite` | Starless Relic | “The depth is not empty. It is full of what we would not name.” / “Vực sâu không trống rỗng. Nó đầy những điều ta không dám gọi tên.” Checkpoint between arena stages |
| `quest.c09.s01_royal_hand` Side | Tovan; inspect the order's author chain | Name Tovan publicly or keep responsible names protected → `royal_hand=public/protected` | Registry stance, Codex | “Responsibility should have a name.” / “Trách nhiệm cần có một cái tên.” Recovery record at Registry archive |
| `quest.c09.s02_last_berth` Side | Neris; identify one missing crew member from conflicting records | Mark unknown or choose best-supported identity → `berth_identity=unknown/best_supported` | Neris arc finale | “An honest unknown is kinder than a false return.” / “Một điều chưa rõ nhưng trung thực còn nhân hậu hơn một sự trở về giả tạo.” Reopen evidence board |
| `quest.c09.s03_unwritten_page` Side | The Unwritten Guest; link 3 clues from 3 NPC lines | Tell a fixed story or leave final page open → `guest_page=closed/open` | Hidden ending prerequisite | “The page is yours to read, not yours to own.” / “Trang giấy là để bạn đọc, không phải để bạn sở hữu.” Clues are recoverable before final boss |

### Chapter 10 — The New Dawn (Sanctuary, target ~2.5 h main path including final boss/ending)
| ID / Type | Giver / objectives | Choice & flag | Reward | Key line / recovery |
|---|---|---|---|---|
| `quest.c10.m01_return` Main | Lyra; return to Sanctuary, speak to 3 NPCs | Restore old structure or establish new order → `dawn_order=old/new` | Dawn Sigil | “Home is the part of the world we agree to keep.” / “Nhà là phần thế giới ta cùng đồng ý giữ lại.” Talk queue resumes after rest |
| `quest.c10.m02_hearing` Main | Maelin, Jun, Tovan; present evidence set | Public hearing or witness protection council → `dawn_hearing=public/protected` | Legacy Codex | “No record can choose what the living do next.” / “Không hồ sơ nào có thể chọn thay người sống sẽ làm gì tiếp.” Missing optional clue affects nuance, not access |
| `quest.c10.m03_final_vow` Main | The Seer; confirm three chosen world flags | Keep past framework or distribute authority → `dawn_legacy=preserve/disperse` | Ending scene preparation | “A new dawn is not an erasure of yesterday.” / “Bình minh mới không phải việc xóa bỏ ngày hôm qua.” All core flags can be reviewed at Hall |
| `quest.c10.m04_regent` Main/Boss/Finale | Ashen Regent; resolve three phases and final interaction | Break Crown / rewrite Record / disperse Memory → `ending_id=break_crown/rewrite_record/disperse_memory` | Crown of Embers, ending ID | “The Crown can hold the record. It cannot make it just.” / “Vương miện có thể giữ hồ sơ. Nó không thể biến hồ sơ thành công bằng.” Final phase retry; ending choice is explicit and confirmed |
| `quest.c10.s01_wall_final` Side | Maelin; decide final Namekeepers' Wall policy | Public memorial vs controlled archive → `ending_wall=public/controlled` | Wall scene / Cosmetic | “Remember freely; never as a debt.” / “Hãy tự do ghi nhớ, đừng biến nó thành món nợ.” Can resolve before final interaction |
| `quest.c10.s02_clinic_future` Side | Sable; place the clinic for the next generation | Sanctuary clinic vs mobile clinic → `ending_clinic=hub/mobile` | Sable epilogue flag | “Build a room where the living can return.” / “Hãy dựng một nơi người sống có thể quay về.” Revisit clinic board |
| `quest.c10.s03_last_page` Side/Hidden | The Unwritten Guest; meet Codex/relationship conditions and choose to leave one page open | Hidden story eligible → `hidden_ending_ready=true` | Hidden epilogue scene, cosmetic mask | “Let the next witness finish the sentence.” / “Hãy để nhân chứng tiếp theo viết nốt câu ấy.” No random drop or paid gate |

## 9.3 Ending set (5)
| Ending ID | Conditions | Final scene | NPC/world outcomes |
|---|---|---|---|
| `ending.break_crown` — Break the Crown | Defeat Regent; choose to break Registry mechanism | Names return in fragments; no single authority controls them | Lyra rebuilds the hub as community; Maelin opens public wall if flags allow; Tovan loses command authority; Caldrin is held accountable if alive; Regent's fate is resolved by final phase choice |
| `ending.rewrite_record` — Rewrite the Record | Defeat/resolve Regent; spend evidence and choose one carefully bounded correction | One foundational record changes, not every loss | Neris accepts uncertainty; Jun records what changed; Tovan's order can be disclosed or sealed; characters remember different details based on testimony flags |
| `ending.disperse_memory` — Disperse Memory | Choose to distribute memory outside one Crown/system | No central Registry; communities maintain local witnesses | Maelin and Jun establish distributed archives; Sanctuary may lose centralized protection; Sable's clinic placement affects survival details |
| `ending.ashen_sanctuary` — The Hearth Holds | Protect Sanctuary above broader disclosure, based on Chapter 1/7 choices and final vote | Sanctuary survives as a protected refuge, but some records remain sealed | Lyra becomes keeper; some factions remain wary; no NPC deaths are automatically caused solely by an earlier optional omission |
| `ending.hidden_story` — The Unwritten Page | Unlock Guest's quest, key Codex set, and three character arcs; choose to leave one account unresolved | Final page contains an unrecorded witness account; camera stays on empty place where name should be | The Guest leaves; Codex adds an intentionally open entry; NG+ gains an echo, not a required explanation |

NG+ reframes endings through new dialogue and record echoes, never invalidates the chosen outcome. Ending conditions must be displayed as story themes, not a spoiler checklist. No ending locks core weapons, core accessibility settings or main achievement completion.

### Module 9 quality checks
- **Choice fairness:** every big choice lists immediate benefit, cost and who disagrees in the final UI; no “good/evil” score.
- **Callback coverage:** Chapter 1 flags return in Ch4/7/10; Ch3 in Ch5/9/10; Ch4 in Ch9/10; Ch5 in Ch9/10; Ch6 in Ch10; Ch7 in Ch10; Ch8 in Ch9/10; Ch9 sets ending/NG+ echo.
- **Self-score:** 4/5 at outline level; dialogue nodes, exact objective triggers and reward values must pass schema validation in Module 14.

# MODULE 10 — CODEX, LORE & ENVIRONMENTAL STORYTELLING

## 10.1 Codex categories and unlock contract
Categories: `world`, `character`, `faction`, `region`, `enemy`, `boss`, `item`, `mystery`, `mechanic`, `history`. Entries unlock by first discovery, completing a named encounter/quest, reading a unique item, or hearing a unique line. The UI distinguishes **verified**, **disputed** and **echo** records; it never silently overwrites an earlier account. 87 sample entries below contain two short sentences in EN and VI. This is initial localization copy and requires linguistic review before shipping.

## 10.2 Codex entries (87 EN + VI entries; minimum target is 80)
| ID / Title / Category | Unlock | EN text (2 sentences) | VI text (2 sentences) |
|---|---|---|---|
| `codex.world.crown` Crown Registry / world | Reach Sanctuary wall | The Crown began as a promise that every name would be recorded. The promise became a claim that only recorded lives mattered. | Vương miện khởi đầu bằng lời hứa rằng mọi cái tên sẽ được ghi lại. Lời hứa ấy biến thành tuyên bố rằng chỉ những sinh mạng có hồ sơ mới đáng kể. |
| `codex.world.ember` The Last Ember / world | Finish Ch1 intro | An Ember keeps a trace, not a complete person. It can reveal what was taken, but it cannot choose what must return. | Tàn lửa giữ lại dấu vết, không giữ trọn một con người. Nó có thể hé lộ điều đã bị lấy đi, nhưng không thể quyết định điều gì phải trở về. |
| `codex.world.name_layers` Three Layers of a Name / world | Compare two name records | A Living Self remembers from within. A Witness Name survives in other people, while the Crown Record survives as an official claim. | Bản ngã sống ghi nhớ từ bên trong. Tên trong lời chứng tồn tại trong ký ức người khác, còn hồ sơ của Vương miện tồn tại như một tuyên bố chính thức. |
| `codex.world.erasure` Tiers of Erasure / world | Find three blank plaques | A record may vanish before a witness forgets. When both fail, the remaining trace may be the only evidence that a life had a place here. | Hồ sơ có thể biến mất trước khi nhân chứng quên đi. Khi cả hai đều thất bại, dấu vết còn lại có thể là bằng chứng duy nhất rằng một đời người từng hiện diện nơi này. |
| `codex.world.magic_cost` The Cost of Holding / world | Use first Memory Thread | Holding a trace spends attention, warmth or a piece of certainty. Magic is strongest when its cost is named rather than hidden. | Giữ một dấu vết tiêu tốn sự chú tâm, hơi ấm hoặc một phần chắc chắn. Ma thuật mạnh nhất khi cái giá của nó được gọi tên thay vì che giấu. |
| `codex.world.death` Ember Anchors / world | Rest at first checkpoint | An anchor preserves the bearer's route, not every object in the world. Returning is a gameplay rule; it does not mean every death can be undone for every character. | Mốc tàn lửa giữ lại hành trình của người mang nó, không giữ mọi vật thể trong thế giới. Việc trở lại là quy tắc gameplay; nó không có nghĩa mọi cái chết của mọi nhân vật đều có thể đảo ngược. |
| `codex.world.registry` The Registry's First Law / history | Find Registry seal | The Registry treats consistency as proof of truth. Its oldest documents show that consistency was designed by people with power. | Registry coi sự nhất quán là bằng chứng của sự thật. Những văn bản cũ nhất cho thấy sự nhất quán đã được thiết kế bởi những người nắm quyền. |
| `codex.world.missing_tone` The Missing Third Tone / mystery | Listen to bell three times | Two notes can imply a third when a listener expects completion. The gap is a clue, not a supernatural command to obey. | Hai nốt có thể gợi ra nốt thứ ba khi người nghe mong đợi sự hoàn chỉnh. Khoảng trống là manh mối, không phải mệnh lệnh siêu nhiên phải tuân theo. |
| `codex.world.village` Village Without a Record / mystery | Find village wall | The village was removed from official record and from many witnesses. The remaining Ember proves an omission, but not the full shape of what happened. | Ngôi làng bị xóa khỏi hồ sơ chính thức và khỏi ký ức của nhiều nhân chứng. Tàn lửa còn lại chứng minh có một sự thiếu vắng, nhưng không cho biết đầy đủ chuyện đã xảy ra. |
| `codex.world.crown_fall` If the Crown Breaks / mystery | Finish Ch9 | A system can collapse faster than trust can be rebuilt. The final choice decides who carries responsibility after the record changes. | Một hệ thống có thể sụp đổ nhanh hơn niềm tin được dựng lại. Lựa chọn cuối quyết định ai sẽ gánh trách nhiệm sau khi hồ sơ thay đổi. |
| `codex.region.sanctuary` Sanctuary / region | Enter hub | Sanctuary is a shelter maintained by people who disagree about what safety means. Its walls change as residents decide what to remember publicly. | Sanctuary là nơi trú ẩn được duy trì bởi những người bất đồng về ý nghĩa của an toàn. Tường thành đổi khác khi cư dân quyết định điều gì nên được ghi nhớ công khai. |
| `codex.region.ashen_march` Ashen March / region | Enter region | The March keeps the shapes of roads that no longer lead to the same places. Travellers mark safety with signs, knots and stories. | Ashen March giữ lại hình dáng những con đường không còn dẫn đến cùng một nơi. Lữ khách đánh dấu sự an toàn bằng biển báo, nút dây và câu chuyện. |
| `codex.region.hollow` Hollow Reach / region | Enter region | Water carries sound through rooms whose names were removed. The bell's apparent direction is often a poor guide to its source. | Nước mang âm thanh qua những căn phòng đã mất tên. Hướng tiếng chuông dường như phát ra thường dẫn sai về nguồn thật. |
| `codex.region.veil` Veil Sea / region | Enter Veil Sea | The tide exposes routes and buries others without judging who needs them. A safe crossing depends on timing and a plan to return. | Thủy triều để lộ lối đi này và chôn lấp lối khác mà không phán xét ai cần chúng. Vượt biển an toàn phụ thuộc vào thời điểm và kế hoạch quay lại. |
| `codex.region.crownlands` Crownlands / region | Enter Crownlands | The districts are linked by law, trade and disagreement. Their future depends on how authority is distributed, not on a single banner. | Các quận được nối với nhau bằng luật pháp, thương mại và bất đồng. Tương lai của họ phụ thuộc vào cách phân chia quyền lực, không phải một lá cờ duy nhất. |
| `codex.region.choir` Choir of Ash / region | Enter Choir of Ash | Its songs preserve patterns even when singers no longer share the same names. Resonance can comfort a crowd or pressure it into silence. | Bài hát nơi đây giữ lại nhịp điệu dù người hát không còn chung tên gọi. Cộng hưởng có thể an ủi đám đông hoặc ép họ im lặng. |
| `codex.region.glass` Glass Expanse / region | Enter Glass Expanse | The horizon reflects possible futures without confirming any of them. Stable stone matters more than the brightest image. | Chân trời phản chiếu những tương lai có thể xảy ra nhưng không xác nhận tương lai nào. Đá vững chắc quan trọng hơn hình ảnh sáng nhất. |
| `codex.region.depths` Starless Depths / region | Descend in Ch9 | The Depths contain traces people refused to file. Their emptiness is an interpretation, not an observable fact. | Vực Sâu chứa những dấu vết mà người ta từ chối ghi vào hồ sơ. Sự trống rỗng của nó là cách diễn giải, không phải sự thật có thể quan sát. |
| `codex.character.lyra` Lyra / character | First conversation | Lyra believes a refuge must protect the living before explaining the past. Her hardest choices begin when those duties conflict. | Lyra tin nơi trú ẩn phải bảo vệ người sống trước khi giải thích quá khứ. Những lựa chọn khó nhất bắt đầu khi hai trách nhiệm ấy xung đột. |
| `codex.character.orren` Orren / character | First map interaction | Orren removed a route because he feared where it led. The omission saved someone once and trapped others later. | Orren xóa một tuyến đường vì sợ nơi nó dẫn tới. Sự thiếu vắng ấy từng cứu một người và sau đó giam hãm những người khác. |
| `codex.character.seer` The Seer / character | First vision | The Seer sees probabilities, not commands from fate. Each forecast fails to describe a choice that has not yet been made. | The Seer nhìn thấy xác suất, không phải mệnh lệnh của định mệnh. Mỗi lời tiên đoán đều thiếu một lựa chọn chưa được đưa ra. |
| `codex.character.eda` Eda Vey / character | Find Eda item clue | The name Eda Vey survives in an item trace. The connection to the Bell Warden remains disputed until the player finds corroborating evidence. | Cái tên Eda Vey sống sót trong dấu vết của một vật phẩm. Mối liên hệ với Bell Warden vẫn còn tranh cãi cho tới khi người chơi tìm được bằng chứng xác nhận. |
| `codex.character.bellwarden` Bell Warden / character | Defeat Bell Warden | The Warden guards a bell that calls from the wrong direction. Its records omit the name of the person who first tied it there. | Bell Warden canh giữ chiếc chuông phát tiếng gọi sai hướng. Hồ sơ của nó bỏ trống tên người đầu tiên đã buộc chuông tại đó. |
| `codex.character.regent` Ashen Regent / character | Find first Regent record | The Regent believes a stable record prevents cruelty from multiplying. The method grants order to some people by making others difficult to remember. | Ashen Regent tin hồ sơ ổn định ngăn sự tàn nhẫn lan rộng. Phương pháp ấy đem lại trật tự cho một số người bằng cách khiến những người khác khó được ghi nhớ. |
| `codex.character.sable` Sable Rook / character | Finish Sable quest 1 | Sable keeps medicine for people whose names she may never learn. She fears that a good intention can conceal an unjust choice. | Sable giữ thuốc cho những người có thể cô sẽ không bao giờ biết tên. Cô sợ thiện ý có thể che giấu một lựa chọn bất công. |
| `codex.character.neris` Neris Vale / character | Finish Neris quest 1 | Neris trusts the tide more than a promise, because the tide reveals its timing. Her missing family record remains unresolved by a single recovered object. | Neris tin thủy triều hơn lời hứa, vì thủy triều cho thấy thời điểm của nó. Hồ sơ gia đình thất lạc của cô không thể được giải quyết chỉ bằng một vật tìm lại. |
| `codex.character.tovan` Tovan Rusk / character | Inspect signed order | Tovan signed an order he still believes prevented a greater collapse. His responsibility cannot be removed by proving he had a reason. | Tovan ký một mệnh lệnh mà ông vẫn tin đã ngăn một cuộc sụp đổ lớn hơn. Trách nhiệm của ông không biến mất chỉ vì chứng minh được ông có lý do. |
| `codex.character.maelin` Maelin Thrice / character | Visit Namekeepers' Wall | Maelin preserves names without claiming to restore the lives behind them. She fears the memorial could become a list for hunters. | Maelin gìn giữ những cái tên mà không tuyên bố có thể phục hồi những cuộc đời đằng sau chúng. Bà sợ đài tưởng niệm có thể biến thành danh sách cho kẻ săn đuổi. |
| `codex.character.jun` Jun Sorya / character | Compare two records | Jun trusts methods that reveal their uncertainty. His most difficult discovery is that accurate records can still fail to tell the whole truth. | Jun tin các phương pháp bộc lộ rõ sự bất định của mình. Phát hiện khó khăn nhất của ông là hồ sơ chính xác vẫn có thể không kể hết sự thật. |
| `codex.character.veyra` Veyra Kest / character | First duel | Veyra tests how people respond to power rather than whether they can win every fight. She respects a deliberate choice to stop. | Veyra thử cách con người phản ứng với quyền lực, không chỉ việc họ có thắng mọi trận đấu hay không. Cô tôn trọng lựa chọn dừng lại có chủ ý. |
| `codex.character.caldrin` Prior Caldrin Bale / character | Find ritual book | Caldrin believes removing painful identities can stop cycles of revenge. The silence he imposes does not erase the harm that came before it. | Caldrin tin xóa bỏ danh tính đau đớn có thể chấm dứt vòng báo thù. Sự im lặng ông áp đặt không xóa được tổn hại đã xảy ra. |
| `codex.character.guest` The Unwritten Guest / mystery | Find first Guest mark | The Guest appears in places where accounts contradict one another. No single witness can prove who the Guest is. | The Guest xuất hiện ở những nơi lời kể mâu thuẫn nhau. Không nhân chứng đơn lẻ nào có thể chứng minh họ là ai. |
| `codex.faction.registry` Crown Registry / faction | Registry checkpoint | The Registry values continuity and centralized accountability. Its danger begins when record-keeping becomes the authority to decide who exists socially. | Registry coi trọng tính liên tục và trách nhiệm tập trung. Nguy cơ xuất hiện khi việc lưu hồ sơ biến thành quyền quyết định ai được thừa nhận trong xã hội. |
| `codex.faction.namekeepers` Namekeepers / faction | Visit Wall | The Namekeepers protect names through testimony and ritual. Some members argue that privacy is also a form of protection. | Namekeepers bảo vệ tên gọi bằng lời chứng và nghi thức. Một số thành viên cho rằng quyền riêng tư cũng là một hình thức bảo vệ. |
| `codex.faction.cartographers` Ash Cartographers / faction | Orren route quest | Cartographers draw where people survived, not only where terrain exists. Their maps include uncertainty and warning marks. | Ash Cartographers vẽ nơi con người sống sót, không chỉ nơi địa hình tồn tại. Bản đồ của họ ghi rõ sự bất định và dấu cảnh báo. |
| `codex.faction.tide` Tide Archive / faction | Enter archive | The Archive stores records that water would otherwise destroy. Its keepers disagree about whether every record should be public. | Tide Archive lưu những hồ sơ mà nước sẽ phá hủy. Những người giữ kho bất đồng về việc liệu mọi hồ sơ có nên được công khai. |
| `codex.faction.glass` Glass Observers / faction | Complete lens puzzle | The Observers compare forecasts rather than worship a single vision. Their instruments cannot remove responsibility from the observer. | Glass Observers so sánh dự báo thay vì tôn thờ một viễn cảnh duy nhất. Công cụ của họ không thể gỡ bỏ trách nhiệm của người quan sát. |
| `codex.item.sigil` Sanctuary Sigil / item | Pick up Sigil | The Sigil marks a place where people agreed to shelter one another. It is not proof that every resident agrees on the future. | Sigil đánh dấu nơi mọi người đồng ý che chở lẫn nhau. Nó không chứng minh rằng mọi cư dân đều đồng ý về tương lai. |
| `codex.item.compass` Tideglass Compass / item | Obtain compass | The Compass points to a changing route rather than a fixed destination. Its readings must be checked against the tide. | La bàn chỉ tới một tuyến đường thay đổi chứ không phải điểm đến cố định. Cần kiểm tra chỉ dẫn của nó theo thủy triều. |
| `codex.item.thread` Memory Thread / item | Craft/use thread | A thread binds two traces for comparison. It cannot decide which memory deserves to survive. | Sợi Ký Ức nối hai dấu vết để đối chiếu. Nó không thể quyết định ký ức nào xứng đáng được giữ lại. |
| `codex.item.lantern` Hollow Lantern / item | Use lantern | The Lantern helps distinguish a sound from its source. It reveals selected traces but never every secret. | Đèn Lồng Rỗng giúp phân biệt âm thanh với nguồn phát. Nó hé lộ một số dấu vết, không phải mọi bí mật. |
| `codex.item.pearl` Pearl of Recall / item | Obtain pearl | The Pearl gives one impression, not an objective recording. A witness may remember the same scene differently. | Viên Ngọc Hồi Tưởng đưa ra một ấn tượng, không phải bản ghi khách quan. Nhân chứng có thể nhớ cùng một cảnh theo cách khác. |
| `codex.item.signet` Crownless Signet / item | Obtain signet | The signet authenticates an old office, not the morality of its actions. Its authority changes when districts choose independence. | Ấn Tín Không Vương Miện xác thực một chức vụ cũ, không xác thực đạo đức của hành động. Quyền lực của nó đổi khác khi các quận chọn độc lập. |
| `codex.item.starpetal` Starpetal / item | Pick up petal | The petal holds a scent-memory from the sleeping garden. It fades when treated as evidence without a witness. | Cánh Sao giữ một ký ức mùi hương từ khu vườn ngủ. Nó phai đi nếu bị xem như bằng chứng mà không có nhân chứng. |
| `codex.item.warmth` Warmth Crystal / item | Obtain crystal | The crystal stores heat from a place that survived winter. It cannot determine who should receive that warmth first. | Tinh Thể Hơi Ấm lưu nhiệt từ nơi sống sót qua mùa đông. Nó không thể quyết định ai nên nhận hơi ấm trước. |
| `codex.item.future_lens` Future Lens / item | Use lens | The Lens makes one likely path easier to see. Looking through it does not remove the cost of choosing. | Thấu Kính Tương Lai giúp nhìn rõ một lối đi có khả năng xảy ra. Nhìn qua nó không làm biến mất cái giá của việc lựa chọn. |
| `codex.item.legacy` Legacy Codex / item | Find Legacy fragment | The Codex stores interpretations as well as facts. Later readers may add evidence without erasing earlier uncertainty. | Codex lưu cả diễn giải lẫn sự kiện. Người đọc sau có thể thêm bằng chứng mà không xóa đi sự bất định trước đó. |
| `codex.enemy.pilgrim` Name-Scraped Pilgrim / enemy | Defeat first pilgrim | The pilgrim attacks signs and plaques more often than people. A missing name changed its route before it changed its memory. | Kẻ Hành Hương Bị Cạo Tên thường tấn công biển báo và bia tên hơn là con người. Một cái tên mất tích đã đổi đường đi của nó trước khi đổi ký ức. |
| `codex.enemy.summoner` Bell-Skein Binder / enemy | Defeat binder | The Binder knots resonant fragments into false direction. Breaking the active knot interrupts the pattern. | Kẻ Buộc Âm Chuông thắt các mảnh cộng hưởng thành hướng giả. Phá nút đang hoạt động sẽ ngắt quy luật đó. |
| `codex.enemy.wreck` Wreck Diver / enemy | Defeat diver | The diver protects a manifest that no longer matches the ship's crew. The inconsistency is a clue, not a random loot bonus. | Thợ Lặn Xác Tàu bảo vệ bản kê không còn khớp với thủy thủ đoàn. Sự bất nhất là manh mối, không phải phần thưởng loot ngẫu nhiên. |
| `codex.enemy.quorum` Quorum Golem / enemy | Defeat golem | Its stone bodies were built from votes that canceled each other. The joints lock before a wide sweep. | Cơ thể đá của nó được tạo từ những lá phiếu triệt tiêu lẫn nhau. Các khớp khóa lại trước đòn quét rộng. |
| `codex.enemy.memory_eater` Memory Eater / enemy | Observe/defeat | The creature consumes echoes from abandoned rooms. A sudden drop in room sound can precede its arrival. | Sinh vật ăn các tiếng vọng trong phòng bỏ hoang. Âm thanh căn phòng đột ngột giảm có thể báo trước nó xuất hiện. |
| `codex.enemy.prism_husk` Prism Husk / enemy | Defeat husk | The Husk moves toward the brightest reflection it can see. Its exposed side appears where the reflection breaks. | Khối Lăng Kính tiến về phản chiếu sáng nhất mà nó thấy. Phần sườn lộ ra ở nơi phản chiếu bị đứt đoạn. |
| `codex.boss.bell` Bell Warden / boss | Defeat Bell Warden | The Warden's signature attack removes the expected third tone. Its warning is a triple ripple with a deliberate gap. | Đòn đặc trưng của Warden bỏ mất nốt thứ ba mà người nghe mong đợi. Cảnh báo của nó là ba vòng gợn với một khoảng ngắt có chủ ý. |
| `codex.boss.caller` Hollow Caller / boss | Defeat Caller | Its voice is routed through the water and walls. The correct counter begins with locating the body rather than chasing the sound. | Giọng nó truyền qua nước và tường. Cách đối phó đúng bắt đầu bằng tìm thân thể, không phải đuổi theo tiếng gọi. |
| `codex.boss.index` Drowned Index / boss | Defeat Index | The Index shifts shelves to defend incompatible copies of one record. Its floor pattern previews the next safe lane. | Index dịch chuyển kệ để bảo vệ các bản sao không tương thích của cùng một hồ sơ. Họa tiết dưới sàn báo trước làn an toàn tiếp theo. |
| `codex.boss.quorum` Quorum Without Faces / boss | Defeat Quorum | It speaks in overlapping decisions and cannot act when its banner is cut. The banner is a real encounter objective, not decoration. | Nó nói bằng những quyết định chồng chéo và không thể hành động khi biểu ngữ bị cắt. Biểu ngữ là mục tiêu thật của trận chiến, không phải vật trang trí. |
| `codex.boss.gardener` Sleepless Gardener / boss | Defeat Gardener | The Gardener keeps memories asleep to preserve their beauty. Each root anchor is a choice to maintain that sleep. | Người Làm Vườn giữ ký ức trong giấc ngủ để bảo tồn vẻ đẹp. Mỗi neo rễ là một lựa chọn duy trì giấc ngủ ấy. |
| `codex.boss.prior_echo` Prior's Echo / boss | Resolve Chapter 6 | The Echo repeats doctrine without the uncertainty of a living person. Disabling visible resonators changes the fight. | Tiếng Vọng của Prior lặp lại giáo lý mà không có sự bất định của người sống. Vô hiệu hóa các bộ cộng hưởng nhìn thấy được sẽ thay đổi trận đánh. |
| `codex.boss.winter` Winter Steward / boss | Defeat Steward | The Steward rationed warmth as if it were a neutral calculation. Wind direction and shelter positions can be read before danger arrives. | Steward phân phối hơi ấm như thể đó là phép tính trung lập. Hướng gió và vị trí trú ẩn có thể được đọc trước khi nguy hiểm đến. |
| `codex.boss.astrologer` Glass Astrologer / boss | Defeat Astrologer | The Astrologer trusts stable shadows more than bright reflections. A forecast can guide action without excusing its result. | Nhà Chiêm Tinh Kính tin bóng ổn định hơn phản chiếu sáng. Dự báo có thể định hướng hành động nhưng không miễn trách nhiệm cho kết quả. |
| `codex.boss.depthless` Depthless Witness / boss | Defeat Witness | The Witness draws strength from discarded testimony. The cracked stone marks a stable position when gravity shifts. | Nhân Chứng Vô Đáy lấy sức mạnh từ lời chứng bị loại bỏ. Đá nứt đánh dấu vị trí vững khi trọng lực đổi hướng. |
| `codex.boss.regent` Ashen Regent / boss | Complete final boss | The Regent wants a stable record because chaos harms the vulnerable first. The player decides whether stability can exist without one owner of memory. | Regent muốn hồ sơ ổn định vì hỗn loạn thường làm người yếu thế tổn thương trước. Người chơi quyết định liệu ổn định có thể tồn tại mà không cần một chủ nhân duy nhất của ký ức. |
| `codex.mystery.village` What Was the Village? / mystery | Three village clues | The remaining Ember proves that a place and its people were erased from record. It does not prove that one version of the village is complete. | Tàn lửa còn lại chứng minh một nơi chốn và cư dân đã bị xóa khỏi hồ sơ. Nó không chứng minh một phiên bản ngôi làng nào là đầy đủ. |
| `codex.mystery.caller` Who Calls Beneath Hollow? / mystery | Bell + Caller clues | The sound is routed through an old resonance network. The identity of its first caller remains disputed across witnesses. | Âm thanh truyền qua một mạng cộng hưởng cổ. Danh tính người gọi đầu tiên vẫn bị tranh cãi giữa các nhân chứng. |
| `codex.mystery.protection` Does the Crown Protect? / mystery | Registry and survivor evidence | The Crown prevented some conflicts by controlling the record. The same control made many harms difficult to contest. | Vương miện ngăn một số xung đột bằng cách kiểm soát hồ sơ. Chính sự kiểm soát ấy khiến nhiều tổn hại khó bị chất vấn. |
| `codex.mystery.memory` Why Do Memories Conflict? / mystery | Pearl + two witness records | Memory is partial and shaped by fear, repetition and what a person could bear. Disagreement alone does not establish deceit. | Ký ức không trọn vẹn và bị định hình bởi nỗi sợ, sự lặp lại và điều một người có thể chịu đựng. Bất đồng tự nó không chứng minh sự gian dối. |
| `codex.mystery.regent_fear` What Does the Regent Fear? / mystery | Three Regent records | The Regent fears that no shared record will remain to restrain violence. The final choice tests whether shared responsibility can replace centralized control. | Regent sợ sẽ không còn hồ sơ chung để kiềm chế bạo lực. Lựa chọn cuối thử xem trách nhiệm chung có thể thay thế kiểm soát tập trung hay không. |
| `codex.mechanic.parry` Parry / mechanic | Tutorial parry | A parry is a narrow timing commitment, not a permanent shield. A missed parry should cost stamina and time but remain readable. | Parry là cam kết về thời điểm hẹp, không phải lá chắn vĩnh viễn. Parry hụt nên tốn thể lực và thời gian nhưng vẫn phải đọc được. |
| `codex.mechanic.perfect_dodge` Perfect Dodge / mechanic | Tutorial perfect dodge | A perfect dodge passes through a clearly telegraphed attack at a strict moment. Some phase-three attacks cannot be solved by an ordinary roll. | Né hoàn hảo lách qua đòn được báo hiệu rõ tại đúng thời điểm nghiêm ngặt. Một số đòn ở pha ba không thể xử lý bằng lăn né thông thường. |
| `codex.mechanic.poise` Poise / mechanic | First stagger | Poise determines whether a committed action can be interrupted. High poise changes the trade, not the need to read danger. | Poise quyết định một hành động đang thực hiện có bị ngắt hay không. Poise cao làm thay đổi cuộc trao đổi đòn, không xóa nhu cầu đọc nguy hiểm. |
| `codex.mechanic.execute` Execute / mechanic | First execute | An execute is available only after a clear stagger state. It rewards opening a window rather than raw damage alone. | Execute chỉ dùng được khi trạng thái choáng đã rõ ràng. Nó thưởng cho việc tạo cơ hội, không chỉ cho sát thương thuần. |
| `codex.mechanic.lockon` Lock-on / mechanic | Enable lock-on | Lock-on supports target focus but can narrow environmental awareness. Free camera is useful when the arena itself is the threat. | Khóa mục tiêu giúp tập trung vào đối thủ nhưng có thể thu hẹp nhận thức môi trường. Camera tự do hữu ích khi chính đấu trường là mối nguy. |
| `codex.mechanic.essence` Essence / mechanic | First upgrade | Essence converts exploration and conflict into upgrades. It is not a premium-money proxy and cannot be bought for cash. | Essence chuyển khám phá và chiến đấu thành nâng cấp. Nó không phải tiền tệ cao cấp giả dạng và không thể mua bằng tiền thật. |
| `codex.mechanic.origin` Origins / mechanic | Create first character | Origins shape the first hours with small passive and relationship hooks. They do not lock weapons, endings or major quest lines. | Origin định hình những giờ đầu qua nội tại nhỏ và móc quan hệ. Chúng không khóa vũ khí, kết thúc hoặc tuyến nhiệm vụ chính. |
| `codex.mechanic.creator` Character Creator / mechanic | Save appearance | Appearance is assembled from compatible real-time 3D presets. Cosmetic choices never alter combat hitboxes or damage. | Ngoại hình được lắp từ các preset 3D thời gian thực tương thích. Lựa chọn thẩm mỹ không bao giờ thay đổi hitbox hoặc sát thương. |
| `codex.history.first_registry` The First Registry / history | Read first old record | The Registry began as a shared ledger after widespread loss. Its growth concentrated decisions into fewer hands. | Registry bắt đầu như sổ chung sau những mất mát rộng lớn. Khi phát triển, nó tập trung các quyết định vào ít người hơn. |
| `codex.history.hollow_fall` Fall of Hollow Kingdom / history | Complete Chapter 2 | Hollow fell after its bell network was used to guide people into unsafe places. Later accounts disagree about whether the misuse was planned. | Hollow sụp đổ sau khi mạng chuông được dùng để dẫn người vào nơi nguy hiểm. Các bản kể sau bất đồng về việc sự lạm dụng ấy có được lên kế hoạch hay không. |
| `codex.history.sanctuary_rekindled` Sanctuary Rekindled / history | Complete Ch1 | The shelter was rekindled by people who could not agree on the village's fate. Their disagreement became the first law of the new hall. | Nơi trú ẩn được nhóm người nhóm lửa lại dù họ không thống nhất về số phận ngôi làng. Bất đồng của họ trở thành luật đầu tiên của đại sảnh mới. |
| `codex.history.last_revision` The Last Revision / history | Reach Ch9 | The last revision did not remove all traces; it changed which traces were treated as reliable. The player is asked to choose what authority should follow. | Lần chỉnh sửa cuối không xóa mọi dấu vết; nó thay đổi dấu vết nào được xem là đáng tin. Người chơi phải quyết định quyền lực nào sẽ xuất hiện tiếp theo. |
| `codex.history.new_dawn` New Dawn / history | Complete Ch10 | A dawn is not a clean slate. It is a decision about what the next generation must be allowed to question. | Bình minh không phải trang giấy trắng. Đó là quyết định về những điều thế hệ sau phải được phép chất vấn. |
| `codex.story.road_marker` The Last Marker / item | Complete Orren arc | The marker records where a traveller stopped feeling safe. Its meaning changes when the road becomes public again. | Cột mốc ghi lại nơi lữ khách ngừng cảm thấy an toàn. Ý nghĩa của nó thay đổi khi con đường được mở công khai trở lại. |
| `codex.story.empty_berth` The Empty Berth / mystery | Finish Neris side quest | The ship's berth remains empty in every verified record. A name offered without supporting evidence is recorded as disputed, not accepted as fact. | Khoang tàu vẫn trống trong mọi hồ sơ đã xác minh. Một cái tên được đưa ra mà không có bằng chứng sẽ được ghi là tranh cãi, không được nhận làm sự thật. |
| `codex.story.signed_order` The Signed Order / history | Complete Tovan side quest | The order bears Tovan's seal and the date of a public crisis. Its rationale does not erase its consequences. | Mệnh lệnh mang con dấu của Tovan và ngày xảy ra khủng hoảng công khai. Lý do của nó không xóa đi hậu quả. |
| `codex.story.quiet_rite` The Quiet Rite / history | Resolve Caldrin | The rite used silence to keep a community from fighting over memory. It also took away the community's chance to disagree. | Nghi thức dùng im lặng để ngăn cộng đồng đánh nhau vì ký ức. Nó cũng lấy mất cơ hội bất đồng của cộng đồng. |
| `codex.story.guest_page` The Page Left Open / hidden | Finish Guest chain | The page contains no official name, only a statement by a witness who chooses not to be recorded. Its absence is a deliberate choice, not missing data. | Trang giấy không có tên chính thức, chỉ có lời của một nhân chứng chọn không được ghi vào hồ sơ. Sự vắng mặt ấy là lựa chọn có chủ ý, không phải dữ liệu bị thiếu. |
| `codex.story.crown_choice` The Crown's Three Ends / ending | Complete final choice | Breaking, rewriting or dispersing the record creates different responsibilities. None restores every loss or absolves every character. | Phá vỡ, viết lại hoặc phân tán hồ sơ tạo ra những trách nhiệm khác nhau. Không lựa chọn nào phục hồi mọi mất mát hay miễn tội cho tất cả nhân vật. |

## 10.3 Twenty environmental storytelling scenes
| ID / Region | Nonverbal scene and player discovery |
|---|---|
| `env.sanctuary.01` | A row of shoes facing a blank wall; new shoes appear after residents choose to open the Namekeepers' Wall. |
| `env.sanctuary.02` | A meal table with one place setting removed; its place returns only when the player publishes a witness name. |
| `env.sanctuary.03` | A map pin with a scratched road; Orren's quest adds a hand-drawn alternative route. |
| `env.ashen.01` | Road signs point to the same village from different directions; lantern reveals one sign was rotated, not magically moved. |
| `env.ashen.02` | A ration board with tally marks but no names; Sable's choice changes the count without a cutscene. |
| `env.ashen.03` | An abandoned cart is loaded with empty name plaques, suggesting someone evacuated records, not belongings. |
| `env.hollow.01` | Bell ropes end above water; their shadows point opposite the audible sound. |
| `env.hollow.02` | A child's drawing shows three rings, but only two bells in the room; inspect audio clue to unlock entry. |
| `env.hollow.03` | A guard's boots are dry on a flooded floor, implying the guard was placed there after the water rose. |
| `env.veil.01` | Ship manifests repeat one berth number with different names, grounding Neris's uncertainty. |
| `env.veil.02` | A dry line on a pillar reveals the previous tide height; route puzzle uses it as a timing cue. |
| `env.veil.03` | Archive shelves are chained to prevent drift; one chain is cut only after the player chooses public release. |
| `env.crownlands.01` | Three district banners cast one shared shadow over a council table; after independence choice, the shadows separate. |
| `env.crownlands.02` | A quill sits beside a stamped order with an unfinished signature; Tovan's quest adds the final ink line. |
| `env.crownlands.03` | Statues have polished blank faces where names were removed; one optional plaque contains tool marks matching Registry tools. |
| `env.choir.01` | Ribbons are tied to empty chairs, not to people; new ribbons appear when witness privacy is chosen. |
| `env.choir.02` | A procession's footprints circle around a silent bell without approaching it. |
| `env.choir.03` | Resonance plates have visible repairs from failed attempts, teaching safe order without a tutorial panel. |
| `env.glass.01` | One observatory lens is covered, yet its shadow still indicates the sun's position. |
| `env.glass.02` | A broken mirror reflects the arena from an old layout, hinting that the world state was revised. |

## 10.4 Forty ambient barks (English source; localization keys shared)
These are short environmental lines, not full quest dialogue. Use state variants so the same NPC does not repeat a bark more than once per safe-area visit.
| ID | Speaker / state | EN bark |
|---|---|---|
| `bark.lyra.safe_01` | Lyra / hub calm | “Leave your weapon by the fire if you need a moment.” |
| `bark.lyra.low_01` | Lyra / low Sanctuary supplies | “Count what remains before promising what we can give.” |
| `bark.lyra.good_01` | Lyra / resident rescued | “Someone has a place at the table again.” |
| `bark.orren.map_01` | Orren / map use | “The blank part is where I stopped trusting myself.” |
| `bark.orren.shortcut_01` | Orren / shortcut opened | “Mark it for the next traveller.” |
| `bark.orren.bad_01` | Orren / route unsafe | “The ground changed. The warning did not.” |
| `bark.seer.vision_01` | Seer / vision ready | “A possibility has arrived. It has not asked permission.” |
| `bark.seer.fail_01` | Seer / prediction contradicted | “Good. The future has been questioned.” |
| `bark.maelin.wall_01` | Maelin / wall visit | “Read the names at your own pace.” |
| `bark.maelin.private_01` | Maelin / protected archive | “Not every memorial must be public.” |
| `bark.sable.clinic_01` | Sable / clinic | “Wash your hands before you touch the bandages.” |
| `bark.sable.shortage_01` | Sable / supply shortage | “I can explain the count. I cannot make it larger.” |
| `bark.neris.tide_01` | Neris / tide low | “The channel is open. Keep a way back.” |
| `bark.neris.tide_high` | Neris / tide rising | “Leave the lower steps before the water covers them.” |
| `bark.tovan.record_01` | Tovan / archive | “The seal confirms the order, not its virtue.” |
| `bark.tovan.public_01` | Tovan / record published | “Then let the districts read what I signed.” |
| `bark.jun.dispute_01` | Jun / disputed clue | “I have marked the contradiction, not resolved it.” |
| `bark.jun.verify_01` | Jun / second source | “One source can be mistaken. Two can disagree honestly.” |
| `bark.veyra.duel_01` | Veyra / duel start | “Watch the recovery, not the flourish.” |
| `bark.veyra.stop_01` | Veyra / duel stopped | “Enough. You knew where to stop.” |
| `bark.caldrin.rite_01` | Caldrin / ritual | “Listen to what the silence asks of you.” |
| `bark.caldrin.rite_end` | Caldrin / ritual ended | “Now they must answer without the chorus.” |
| `bark.guest.appear_01` | Guest / first sighting | “You found the place, not the account.” |
| `bark.guest.leave_01` | Guest / leaving | “Leave room for what you do not know.” |
| `bark.blacksmith.upgrade` | Forge / upgrade | “A stronger edge still needs a steady hand.” |
| `bark.gallery.collection` | Gallery / item placed | “The object is here. Its owner may not be.” |
| `bark.namewall.new` | Wall / new name | “Someone will read this later.” |
| `bark.practice.parry` | Practice Yard / success | “Again, until the sound and motion agree.” |
| `bark.practice.fail` | Practice Yard / failure | “You were early. That is useful to know.” |
| `bark.expedition.start` | Expedition / start | “The seed is fixed. Your choices are not.” |
| `bark.expedition.exit` | Expedition / safe exit | “You may stop here and keep what you earned.” |
| `bark.resident.warmth` | Resident / winter flag | “Someone brought warmth past the wall.” |
| `bark.resident.public_record` | Resident / public record | “I saw my family's name on the wall.” |
| `bark.resident.private_record` | Resident / private record | “Thank you for not making us a public warning.” |
| `bark.tide_archive` | Archive / entry | “Let the pages dry before you judge them.” |
| `bark.choir_loft` | Choir Loft / visit | “The missing note can be heard only when the room is quiet.” |
| `bark.glass_chamber` | Glass Chamber / visit | “The bright reflection is not always the true one.” |
| `bark.regent_echo` | Post-boss / Gallery | “An order ends. Its consequences keep walking.” |
| `bark.friend_echo` | Friends' Echo Gallery / post-campaign | “This echo was shared by its owner. It is not a live visit.” |
| `bark.forgekeeper.edge` | Forgekeeper / item upgrade | “A sound edge buys you time, not certainty.” |

### Module 10 quality checks
- **Canon:** the Codex can show disputed accounts rather than erase contradictions; no entry makes an unresolved mystery falsely certain.
- **Scope:** 80 entries share the same data structure; optional text/audio playback uses localization keys and no per-entry special UI.
- **Self-score:** 4/5; copy needs native-language editing, and unlock references require cross-ID validation.

---

# MODULE 11 — UX, ONBOARDING, ACCESSIBILITY

## 11.1 FTUE: first 30 minutes
| Time | Player action / scene | Teaches through action | Acceptance criterion |
|---|---|---|---|
| 0–3 min | Character Creator: presentation, face/hair/skin, outfit, Origin and display name | Establish agency, previews and confirmation; no long lore wall | 90% of usability-test players complete without external instruction; save/load appearance passes |
| 3–5 min | Walk from ember chamber into Sanctuary threshold | Camera, movement, interact, look at a name plaque | At least 85% find the first interaction within 60 s; objective marker is optional but clear |
| 5–8 min | A low-risk Pilgrim advances; player attacks, guards and retreats | Basic attack and stamina | At least 80% can land a combo and identify stamina depletion |
| 8–11 min | Practice Yard introduces dodge against a slow, telegraphed sweep | Dodge i-frames and spacing | First death not forced; retry is immediate and free |
| 11–14 min | One isolated enemy repeats an attack string | Parry timing; one on-screen timing hint after two misses | At least 70% land one practice parry after optional hint |
| 14–17 min | Enemy poise breaks; player can execute or choose to step away | Poise/stagger/execute | Clear visual state and contextual prompt; no execution required to advance |
| 17–20 min | Orren's map offers two routes, one safer and longer | Route choice, shortcut discovery, optional exploration | Route choice is previewed; no surprise irreversible lock |
| 20–24 min | First sound puzzle and optional Codex entry | Environmental clue and audio accessibility counterpart | Every sound clue has visual/text caption alternative |
| 24–27 min | Bell Warden approach, visible signature tell before boss | Boss warning, checkpoint, loadout check | Boss has at least one fair opening and clear retreat point |
| 27–30 min | First attempt against Bell Warden or choice to train first | Boss cadence, healing, loss/recovery rule | Player can choose to attempt or prepare; no failure penalty beyond standard resource loop |

## 11.2 Teaching advanced combat
- **Perfect Dodge:** introduced in Practice Yard against one slow sweep, then verified later against a distinct, clearly signaled attack. A failed attempt shows timing hint only on request or after repeated failure.
- **Poise and Execute:** one optional encounter with a visual poise bar and clear stagger pose. Do not make execute mandatory to beat any boss.
- **Q/E/R:** unlock one skill at a time through a short practice challenge; later slots are explained by action prompts, not a full-screen wall of text.
- **Lock-on:** introduced in a two-enemy encounter; compare lock-on and free camera when a flanker appears. Never force lock-on for a puzzle requiring environmental awareness.
- **Boss `requiresPerfectDodge`:** signal by a unique sound motif, a distinct body pose and ground/silhouette cue; show the tutorial hint before the first lethal occurrence, and allow the player to review it at Practice Yard.

## 11.3 Death, retries and adaptive assistance
- After two consecutive deaths at a boss checkpoint, offer three dismissible hints: “review the tell”, “try a defensive/reposition tool” and “check equipment/consumables”. No automatic stat reduction.
- After four consecutive deaths, optionally offer a practice shadow encounter with reduced damage and no unique reward, then return to the unchanged boss.
- Player may dismiss all help permanently or re-enable from Accessibility/Combat Assist.
- No “you are bad” language, no hidden Easy mode and no exclusive story content in Ashen difficulty.
- Death recovery clearly lists what is retained and what is dropped. Essential quest items, story progress and unlocked shortcuts never disappear.

## 11.4 HUD/menu layout
- **Gameplay HUD:** HP, stamina, selected Q/E/R skills and cooldown/resource, lock-on marker, boss name/phase, interaction prompt, subtitle captions. Hide nonessential status icons when inactive.
- **Navigation:** objective title plus optional compass hint; no mandatory GPS path. Codex tracks discovered clues and flags certainty status (verified/disputed/echo).
- **Inventory:** compare current and new item side-by-side with damage, recovery, poise, stamina and affix cost; visually identify side-grades rather than ranking by one green number.
- **Quest log:** separate main, character, faction, exploration; each shows next actionable objective and consequences known to the player, not spoilers.
- **Toast priorities:** critical gameplay state first, quest/choice results second, collection/XP third. Batch low-value pickups; no screen-covering spam.

## 11.5 Accessibility checklist
| Area | Requirement |
|---|---|
| Color vision | Every telegraph uses silhouette/shape/motion plus optional color; color is never the only clue |
| Motion | Camera shake, hit-stop, motion blur and slow-time intensity individually adjustable; reduce screen flash |
| Subtitles | On by default for dialogue; speaker label, sound cue captioning, size 80–150%, background opacity and line spacing |
| Input | Full remapping for keyboard/controller, hold/toggle options for lock-on and sprint; input conflicts validation |
| Combat assist | Optional parry/perfect-dodge window adjustment up to +30% in Story/Assist mode; displayed as an explicit setting, not hidden |
| One-handed feasibility | Prioritize remapping and hold/toggle; do not promise full one-hand ergonomics until tested |
| Hearing | Captions for relevant enemy direction/motif, independent music/ambience/effects/voice sliders |
| Reading | Plain-language option hints; no essential lore solely in tiny texture text |
| Photosensitivity | Avoid repeated high-frequency flashes; warning before intensity; swap strong flashes for pulses |
| Cognitive | Journal recap, quest step labels, pause in single-player, tutorial replay, confirmation before irreversible choice |
| Content warnings | Mature themes of grief, coercive authority, identity erasure and non-graphic violence disclosed before campaign |

## 11.6 Controller and web-demo notes
- Gamepad: consistent face-button confirm/back prompt, trigger-compatible heavy attack, stick-click lock-on optional; all mapping settings serialized.
- Web demo: keyboard/mouse default with a compact controller hint; touch controls only if the existing web build is explicitly supported on mobile. Do not claim a mobile-ready control scheme before device QA.
- UI text keys must not be composed from player display names or uncontrolled input. Font fallback required for EN/VI/JA/KO/ZH.

## 11.7 Character Creator integration (carry-forward)
The Creator added in Module 3 is the first FTUE step and uses real-time 3D preset assembly: Male/Female/Neutral presentation, body presets under shared 2.42-unit rig, face/skin/hair/eyes/scar/facial-hair presets, outfit color and the three Origins. Presets have free reset and free edit at Sanctuary. Appearance data saves by stable preset IDs plus `appearance_schema_version`, not by regenerating meshes. No cosmetic slider changes hitbox or combat stats.

### Module 11 quality checks
- **Acceptance metrics:** tutorial completion, parry comprehension, time-to-first-shortcut, boss retry behavior, accessibility-setting retention and character-save integrity are instrumented in opt-in/transparent telemetry.
- **Self-score:** 4/5; user tests and platform input QA are required to raise confidence. The 30-minute sequence is a target plan, not measured results.

# MODULE 12 — LIVE-OPS, RETENTION & ETHICAL MONETIZATION

## 12.1 Twelve-month content plan
The calendar is a planning template; launches may shift without removing earned rewards. One major seasonal theme per quarter with two lighter monthly World Events in that quarter. All story-critical content stays permanent. Every seasonal track gets a catch-up path in the following season.
| Month | Major/minor content | Hub/world change | Core reward type |
|---|---|---|---|
| 1 | Launch: The Missing Tone; World Event `we.bellglass_echo` | Bell ropes appear in Gallery | Free campaign launch cosmetic, Codex |
| 2 | Event: Roads Remember (`we.road_marker`) | New map pins in Sanctuary | Dye + Essence |
| 3 | Season I finale: Bell Echo boss variant | Bellglass display changes | Cosmetic set / title |
| 4 | Season II: Water Keeps Copies begins | Tide chart room set-dressing | Tide dye, archive plaque |
| 5 | Event: Empty Berth (`we.empty_berth`) | Ship manifest on board | Cosmetic buckle |
| 6 | Season II finale: Drowned Index echo | Archive exhibits update | Costume finish |
| 7 | Season III: City of Votes begins | District banners reflect player flag | District armor overlay |
| 8 | Event: The Public Ledger (`we.public_ledger`) | Notice board state update | Cinder, title |
| 9 | Season III finale: Quorum echo | Gallery plaque | Cosmetic signet finish |
| 10 | Season IV: Unwritten Horizon begins | Glass Chamber lens variant | Mask accent, title |
| 11 | Event: The Page Left Open (`we.open_page`) | Blank page appears only if opted into lore discovery | Lore echo / cosmetic |
| 12 | Season IV finale: Echo Engine variant; annual archive | Sanctuary Gallery shows year recap | Full seasonal cosmetic catch-up option |

## 12.2 Twelve World Event types
| ID | Activation condition | World/enemy/loot change | Ethics rule |
|---|---|---|---|
| `we.bellglass_echo` | Chapter 2 complete | Resonance traces appear in Hollow Reach | Can be completed in any order during active window; later catch-up remains |
| `we.road_marker` | Shortcut discovered in 2 regions | Cartographer clue route | Not a required route |
| `we.empty_berth` | Neris quest progress ≥ 1 | Manifest fragments appear in Veil Sea | Does not randomly kill or replace NPCs |
| `we.public_ledger` | Chapter 4 complete | District boards show new order copies | State comes from story flags; event does not override choice |
| `we.starpetal_fall` | Chapter 5 complete | Optional garden puzzle variant | Cosmetic/lore reward only |
| `we.choir_silence` | Chapter 6 complete | Resonance plate encounter appears | Visual cue remains even with reduced audio |
| `we.warmth_exchange` | Chapter 7 complete | Resource route with two recipient choices | No timed failure with permanent loss |
| `we.failed_forecast` | Chapter 8 complete | Alternate Glass Expanse clue | Forecast never becomes guaranteed spoiler |
| `we.unwritten_trace` | Guest clue found | Hidden environmental marks appear | Remains available after season |
| `we.cinder_route` | Post-campaign | Optional Expedition material path | No exclusive power reward |
| `we.friend_echo_gallery` | Campaign complete and social opt-in | Friends' echo/gallery entry | Private by default; owner chooses what is shared |
| `we.anniversary_archive` | One year after launch (calendar-controlled) | Gallery review of player choices | No login streak, no exclusive story ending |

## 12.3 Cosmetic-only commerce
- Revenue target model: premium purchase or a free base game with cosmetic-only optional store; no hybrid assumption should be implemented before product decision.
- Store categories: outfit overlay, weapon finish, hair accessory, idle gesture, title/frame, Sanctuary prop variant. Every cosmetic must be previewable on a character model before purchase and must state platform/account entitlements clearly.
- Do not sell: stats, Origin, respec, skill slot, inventory power, pity boost, campaign branch, ending, exclusive Codex truth, or social ranking advantage.
- No loot boxes, random paid rewards, rotating-item pressure, expiring purchased content or “limited-time only” exclusives. Seasonal cosmetics may return through catch-up tracks.
- Appearance base controls and color options remain free; store items can be applied to already-owned gear via transmog and never alter material values used by gameplay.

## 12.4 Health metrics and guardrails
Collect only aggregated/consented gameplay telemetry needed for quality. Data retention/privacy policy must be defined before instrumenting accounts.
| Metric | Desired band (initial hypothesis) | Warning threshold | Response |
|---|---|---|---|
| D1 return | 25–40% | <20% across a meaningful sample | Review first-session friction and crash-free starts, not add login rewards |
| D7 return | 10–22% | <8% | Inspect boss spikes, unfinished objectives, and usability; do not add FOMO |
| D30 return | 5–12% | <4% | Check whether endgame has meaningful optional variety |
| Main-chapter completion | 65–80% reach Ch3; 35–55% complete campaign | >20% unexplained drop between chapters | Review pacing, not gate story content behind grind |
| First-boss completion | 70–90% after repeated attempts | <60% with high abandonment | Improve tells, practice and hint clarity; don't silently nerf |
| Median session | 30–90 min | >3 h sessions paired with negative feedback or low stop rate | Add clear stopping points and safe exit |
| Death/retry | Highly variable by boss | One attack causes >40% of deaths in broad playtest | Recheck telegraph/counter/arena geometry |
| Crash-free session | >99% target after stable release | <98.5% | Block content release and profile first |
| Premium refund/complaint rate | Monitor, no target invented | Unusual spike per platform | Audit disclosure, preview and entitlement UI |

These are target bands to test, not actual performance or market forecasts. Small sample sizes should not be used to make strong decisions.

## 12.5 Community features and security
- Friends' Echo Gallery is asynchronous and opt-in after campaign completion. A shared echo is a sanitized profile/appearance/selected gallery view, not a live visit, co-op actor or player-written text stream in MVP.
- Public name submissions are not enabled by default. If player display names ever appear in-world, validate length/Unicode, strip control characters, moderate abuse, escape rendering and provide report/block controls.
- Because client-held saves can be modified, do not create authoritative leaderboards with economic prizes until server validation exists. Competitive leaderboard is out of MVP scope.
- User-generated messages and world signs are out of MVP; an authored fixed set of developer-reviewed “witness notes” may simulate community warmth without moderation risk.

### Module 12 quality checks
- No daily streaks, battle-pass punishment, paid power, loot boxes or core story expiration.
- Seasonal event rewards have catch-up routes; missed time does not invalidate a player's build.
- **Self-score:** 4/5; retention thresholds need live sample data and privacy/security review before launch.

---

# MODULE 13 — LOCALIZATION & TONE (EN / VI / JA / KO / ZH)

## 13.1 Style guide
| Language | Voice / grammar rules | Character naming and UI specifics |
|---|---|---|
| English (EN) | Short, controlled sentences; metaphors grounded in names, records, heat, water and sound. Avoid overusing archaic fantasy diction. | Keep all proper names; Title Case for chapter names, sentence case for buttons. “the Ember-Bearer” is a role, not a personal name. |
| Vietnamese (VI) | Mature, restrained; avoid melodrama. NPC pronouns depend on relationship and scene; neutral system copy uses “bạn”. | Keep Ashen Crown, Ember, Crown, Sanctuary and IDs stable; glossary dictates consistent terms. Use compact button verbs. |
| Japanese (JA) | Literary restraint; avoid making every line sound like a prophecy. Distinguish formal Registry speech from intimate Sanctuary speech. | Keep proper-name romanization in Latin only if UI product convention chooses it; otherwise use approved katakana consistently. Do not mix forms within one screen. |
| Korean (KO) | Differentiate official Registry formality from colloquial survivor speech. Avoid excessive honorific switching within a branch. | Stable transliteration table for character names; use compact noun labels on item buttons. |
| Chinese Simplified (ZH) | Concise and readable; keep record/name metaphors consistent; avoid unnecessary classical language. | Use simplified characters in default ZH locale; preserve exact IDs in data, not displayed names. |

### Core term policies
- Do not translate stable character/place/proper names in data IDs; display-name localization uses keys such as `npc.lyra.name`.
- `Ember` is a narrative object and should not be conflated with ordinary “fire”; `Crown` refers to the system and its symbol depending on context.
- `Essence`, `Cinder`, `Poise`, `Parry`, `Perfect Dodge`, `Execute`, `Mastery`, `Prestige`, `New Game Plus` require glossary mapping; never translate them differently in different menu categories without a context note.
- A literal blank/name deletion must be described with care; prefer “erased from the record” unless the scene confirms actual physical/existential erasure.
- UI key convention: `domain.type.id.variant` where useful, e.g. `quest.c01.m01_wake.line01`, `ui.creator.presentation.neutral`, `item.tideglass_compass.name`.
- Name entry accepts Unicode but strips control characters, bidi override characters and line breaks. Render all user-supplied text as text, never markup.
- Target maximum widths: buttons 16 Latin characters (allow wrapping if necessary), short labels 24 Latin characters, tooltips 120 characters per paragraph; CJK counts are measured by pixel width rather than codepoints. Main dialogue subtitle line target is 42 Latin characters or 20 CJK glyphs, max 2 lines before a deliberate pause.

## 13.2 Glossary (80 terms, EN / VI / JA / KO / ZH)
Translations below are proposed terminology; native-language editorial review is required before release.
| # | EN | VI | JA (proposed) | KO (proposed) | ZH (proposed) |
|---:|---|---|---|---|---|
| 1 | Ember | Tàn lửa | 残り火 | 잔불 | 余烬 |
| 2 | Crown | Vương miện | 王冠 | 왕관 | 王冠 |
| 3 | Sanctuary | Nơi trú ẩn | サンクチュアリ | 안식처 | 避难所 |
| 4 | Essence | Tinh chất | エッセンス | 정수 | 精华 |
| 5 | Cinder | Tro tàn | 燃え殻 | 잿가루 | 炭烬 |
| 6 | Poise | Thế trụ | 強靭度 | 강인도 | 强韧度 |
| 7 | Parry | Đỡ phản công | パリィ | 패리 | 弹反 |
| 8 | Perfect Dodge | Né hoàn hảo | ジャスト回避 | 퍼펙트 회피 | 完美闪避 |
| 9 | Execute | Kết liễu | 処刑 | 처형 | 处决 |
| 10 | Stagger | Choáng thế trụ | 体勢崩し | 자세 붕괴 | 失衡 |
| 11 | Lock-on | Khóa mục tiêu | ロックオン | 타깃 고정 | 锁定目标 |
| 12 | Free Camera | Camera tự do | フリーカメラ | 자유 카메라 | 自由镜头 |
| 13 | Third-Person | Góc nhìn thứ ba | 三人称視点 | 3인칭 시점 | 第三人称视角 |
| 14 | Mastery | Tinh thông | 熟練度 | 숙련도 | 精通 |
| 15 | Prestige | Tái lập tinh thông | プレステージ | 프레스티지 | 巅峰重置 |
| 16 | New Game Plus | Chơi lại nâng cao | ニューゲームプラス | 뉴 게임 플러스 | 新游戏+ |
| 17 | Relic | Di vật | 遺物 | 유물 | 遗物 |
| 18 | Affix | Thuộc tính phụ | 付与効果 | 부가 옵션 | 词缀 |
| 19 | Ascendant | Thăng hoa | 超越級 | 초월 등급 | 超越级 |
| 20 | Mythic | Thần thoại | 神話級 | 신화 등급 | 神话级 |
| 21 | Legendary | Huyền thoại | 伝説級 | 전설 등급 | 传奇级 |
| 22 | Epic | Sử thi | 英雄級 | 영웅 등급 | 史诗级 |
| 23 | Rare | Hiếm | レア | 희귀 | 稀有 |
| 24 | Uncommon | Ít gặp | アンコモン | 고급 | 优良 |
| 25 | Common | Thường | コモン | 일반 | 普通 |
| 26 | Broken | Hư hỏng | 破損 | 파손 | 破损 |
| 27 | Upgrade | Nâng cấp | 強化 | 강화 | 强化 |
| 28 | Salvage | Phân rã | 解体 | 분해 | 分解 |
| 29 | Crafting | Chế tác | クラフト | 제작 | 制作 |
| 30 | Recipe | Công thức | レシピ | 제작법 | 配方 |
| 31 | Codex | Thư mục ký lục | 記録簿 | 기록집 | 图鉴 |
| 32 | World Flag | Cờ thế giới | ワールドフラグ | 월드 플래그 | 世界标记 |
| 33 | Reputation | Danh tiếng phe | 評判 | 평판 | 声望 |
| 34 | Faction | Phe phái | 勢力 | 세력 | 阵营 |
| 35 | Contract | Hợp đồng | 契約 | 계약 | 委托 |
| 36 | Seasonal Journey | Hành trình mùa | シーズンジャーニー | 시즌 여정 | 赛季旅程 |
| 37 | Journey Points | Điểm hành trình | ジャーニーポイント | 여정 포인트 | 旅程点数 |
| 38 | World Event | Sự kiện thế giới | ワールドイベント | 월드 이벤트 | 世界事件 |
| 39 | Expedition | Viễn chinh | 遠征 | 원정 | 远征 |
| 40 | Modifier | Biến thể luật | 修正要素 | 변형 규칙 | 规则修正项 |
| 41 | Checkpoint | Điểm hồi sinh | チェックポイント | 체크포인트 | 检查点 |
| 42 | Boss Phase | Pha boss | ボスフェーズ | 보스 페이즈 | 首领阶段 |
| 43 | Enrage | Cuồng nộ | 激昂状態 | 격노 상태 | 狂暴状态 |
| 44 | Telegraph | Dấu báo đòn | 攻撃予兆 | 공격 예고 | 攻击预警 |
| 45 | Wind-up | Thời gian lấy đà | 溜め動作 | 준비 동작 | 前摇 |
| 46 | Active Frames | Khung trúng đòn | 攻撃判定時間 | 공격 판정 시간 | 有效帧 |
| 47 | Recovery | Hồi đòn | 硬直時間 | 후딜레이 | 后摇 |
| 48 | Stamina | Thể lực | スタミナ | 스태미나 | 精力 |
| 49 | Vigor | Sinh lực | 生命力 | 생명력 | 生命力 |
| 50 | Endurance | Sức bền | 持久力 | 지구력 | 耐力 |
| 51 | Might | Sức mạnh | 筋力 | 근력 | 力量 |
| 52 | Finesse | Khéo léo | 技量 | 기량 | 灵巧 |
| 53 | Resolve | Ý chí | 意志 | 의지 | 意志 |
| 54 | Emberweaver | Người dệt tàn lửa | 残り火の紡ぎ手 | 잔불 직조자 | 余烬编织者 |
| 55 | Hearthguard | Vệ binh bếp lửa | 炉火の守り手 | 화로 수호자 | 炉火守卫 |
| 56 | Ashrunner | Kẻ chạy tro | 灰走り | 잿길 주자 | 灰烬疾行者 |
| 57 | Gravebound | Kẻ buộc với mộ | 墓縛り | 무덤 결속자 | 墓缚者 |
| 58 | Tideveil | Màn triều | 潮の帳 | 물결 장막 | 潮幕 |
| 59 | Origin | Nền tảng | 出自 | 출신 | 出身 |
| 60 | Character Creator | Tạo nhân vật | キャラクター作成 | 캐릭터 생성 | 角色创建 |
| 61 | Body Presentation | Biểu hiện hình thể | 身体表現 | 신체 표현 | 身体呈现 |
| 62 | Preset | Mẫu dựng sẵn | プリセット | 프리셋 | 预设 |
| 63 | Appearance | Ngoại hình | 外見 | 외형 | 外观 |
| 64 | Transmog | Đổi diện mạo trang bị | 外見変更 | 외형 변경 | 外观幻化 |
| 65 | Cosmetic | Vật phẩm thẩm mỹ | 外見アイテム | 꾸미기 아이템 | 外观物品 |
| 66 | Accessibility | Khả năng tiếp cận | アクセシビリティ | 접근성 | 无障碍 |
| 67 | Assist Mode | Chế độ hỗ trợ | アシストモード | 보조 모드 | 辅助模式 |
| 68 | Subtitle | Phụ đề | 字幕 | 자막 | 字幕 |
| 69 | Hitbox | Vùng va chạm | ヒットボックス | 히트박스 | 判定框 |
| 70 | Level of Detail (LOD) | Mức chi tiết mô hình | 詳細度 | 디테일 단계 | 细节层级 |
| 71 | Draw Call | Lệnh vẽ | ドローコール | 드로 콜 | 绘制调用 |
| 72 | Frame Budget | Ngân sách khung hình | フレーム予算 | 프레임 예산 | 帧预算 |
| 73 | Profiler | Công cụ đo hiệu năng | プロファイラー | 프로파일러 | 性能分析器 |
| 74 | Frame Rate | Tốc độ khung hình | フレームレート | 프레임률 | 帧率 |
| 75 | Cloud Save | Lưu đám mây | クラウドセーブ | 클라우드 저장 | 云存档 |
| 76 | Save Slot | Ô lưu | セーブスロット | 저장 슬롯 | 存档位 |
| 77 | Verified Record | Hồ sơ đã xác minh | 検証済み記録 | 검증된 기록 | 已核实记录 |
| 78 | Disputed Record | Hồ sơ còn tranh cãi | 異論のある記録 | 논쟁 중인 기록 | 有争议的记录 |
| 79 | Echo Record | Hồ sơ vọng âm | 残響記録 | 잔향 기록 | 回响记录 |
| 80 | The Unwritten Guest | Vị khách chưa được ghi tên | 未記載の客人 | 기록되지 않은 손님 | 未被记载的访客 |

## 13.3 Twenty UI strings in five languages
| Key | EN | VI | JA | KO | ZH |
|---|---|---|---|---|---|
| `ui.creator.title` | Create Your Ember-Bearer | Tạo người mang Ember | エンバー・ベアラーを作成 | 엠버 베어러 만들기 | 创建余烬承载者 |
| `ui.creator.presentation` | Presentation | Biểu hiện | 表現 | 표현 | 外观呈现 |
| `ui.creator.male` | Male | Nam | 男性 | 남성 | 男性 |
| `ui.creator.female` | Female | Nữ | 女性 | 여성 | 女性 |
| `ui.creator.neutral` | Neutral | Trung tính | 中性的 | 중립 | 中性 |
| `ui.creator.randomize` | Randomize | Ngẫu nhiên | ランダム | 무작위 | 随机 |
| `ui.creator.reset` | Reset category | Đặt lại nhóm này | この項目をリセット | 항목 초기화 | 重置此项 |
| `ui.creator.origin` | Background | Nền tảng | 出自 | 出신 | 出身背景 |
| `ui.creator.confirm` | Begin the Last Ember | Bắt đầu Tàn Lửa Cuối Cùng | 最後の残り火を始める | 마지막 잔불 시작 | 开始最后的余烬 |
| `ui.creator.unsaved` | Discard unsaved changes? | Bỏ thay đổi chưa lưu? | 未保存の変更を破棄しますか？ | 저장하지 않은 변경을 버릴까요? | 放弃未保存的更改？ |
| `ui.combat.parry_hint` | Press at the moment of impact | Nhấn đúng lúc đòn chạm tới | 攻撃が当たる瞬間に押す | 공격이 닿는 순간 누르기 | 在攻击命中瞬间按下 |
| `ui.combat.perfect_dodge` | Evade at the final tell | Né vào tín hiệu cuối cùng | 最後の予兆で回避 | 마지막 예고 순간 회피 | 在最后预警时闪避 |
| `ui.quest.disputed` | Disputed record | Hồ sơ còn tranh cãi | 異論のある記録 | 논쟁 중인 기록 | 有争议的记录 |
| `ui.quest.verified` | Verified record | Hồ sơ đã xác minh | 検証済み記録 | 검증된 기록 | 已核实记录 |
| `ui.save.success` | Appearance saved | Đã lưu ngoại hình | 外見を保存しました | 외형 저장 완료 | 外观已保存 |
| `ui.save.failure` | Could not save. Try again. | Không thể lưu. Hãy thử lại. | 保存できませんでした。もう一度お試しください。 | 저장하지 못했습니다. 다시 시도하세요. | 保存失败，请重试。 |
| `ui.access.reduce_motion` | Reduce motion | Giảm chuyển động | モーションを軽減 | 움직임 줄이기 | 减少动态效果 |
| `ui.access.captions` | Show sound captions | Hiện phụ đề âm thanh | 音の字幕を表示 | 효과음 자막 표시 | 显示声音字幕 |
| `ui.choice.confirm` | This choice changes the world | Lựa chọn này sẽ thay đổi thế giới | この選択は世界を変えます | 이 선택은 세계를 바꿉니다 | 此选择将改变世界 |
| `ui.social.echo_privacy` | Share this echo with friends? | Chia sẻ dấu vọng này với bạn bè? | この残響をフレンドに共有しますか？ | 이 잔향을 친구와 공유할까요? | 要与好友分享此回响吗？ |

### Module 13 quality checks
- All five locales have an initial terminology map and 20 sample UI strings; this is a draft, not a substitute for native editorial review.
- Character names/IDs remain stable; runtime strings reference localization keys.
- **Self-score:** 3.5/5; JA/KO/VI honorific and nuance review is mandatory before production lock.

# MODULE 14 — STRUCTURED DATA EXPORT & VALIDATION

## 14.1 ID and schema rules
- IDs use lowercase `snake_case` under a stable domain prefix, e.g. `weapon.ember_sabre`, `quest.c01.m01_wake`, `npc.lyra`, `codex.world.ember`.
- IDs are never localized. User display names never become IDs. Once shipped, an ID is deprecated with a migration alias; it is never silently repurposed.
- Localized strings use keys such as `quest.c01.m01_wake.line01`; every shipped UI key must have EN/VI/JA/KO/ZH values.
- Cross-file references must be exact IDs. No dangling `giver_id`, `reward_id`, `item_id`, `faction_id`, `dialogue_key` or prerequisite references.
- Gameplay data must be deterministic where seeded, server-safe where account-related, and tolerant of unknown optional keys for forward compatibility.

## 14.2 Proposed asset file layout
```text
AshenCrownDesignData/
  schema/
    item.schema.json
    quest.schema.json
    dialogue.schema.json
    enemy.schema.json
    boss.schema.json
    faction.schema.json
    localization.schema.json
  data/
    items.csv
    affixes.csv
    sets.json
    recipes.json
    archetypes.json
    weapons.json
    skills.json
    mastery_nodes.json
    relics.json
    enemies.json
    bosses.json
    quests.json
    dialogue.json
    factions.json
    codex.csv
    contracts.json
    season_template.json
    expedition_modifiers.json
    achievements.csv
    economy.csv
    xp_curve.csv
    drop_tables.json
    creator_presets.json
    unique_items.json
    story_items.json
    consumables.json
    enemy_archetypes.json
    world_events.json
    live_ops_calendar.json
    environment_scenes.json
    barks.csv
    endings.json
    targets.json
    localization_sample.csv
  validation/
    validation_checklist.md
    validation_report.json
```

## 14.3 Minimal importer data contracts

### Item schema (illustrative JSON Schema)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "ashencrown.item.schema.json",
  "type": "object",
  "required": ["id", "nameKey", "type", "tier", "flags"],
  "properties": {
    "id": {"type": "string", "pattern": "^[a-z0-9]+(\\.[a-z0-9_]+)+$"},
    "nameKey": {"type": "string", "minLength": 3},
    "type": {"enum": ["weapon", "armor", "relic", "key_item", "consumable", "material", "cosmetic"]},
    "slot": {"type": ["string", "null"]},
    "tier": {"enum": ["Broken", "Common", "Uncommon", "Rare", "Epic", "Legendary", "Mythic", "Ascendant"]},
    "levelReq": {"type": "integer", "minimum": 1, "maximum": 60},
    "baseStats": {"type": "object"},
    "affixSlots": {"type": "integer", "minimum": 0, "maximum": 4},
    "sources": {"type": "array", "items": {"type": "string"}},
    "flags": {"type": "array", "items": {"type": "string"}}
  },
  "additionalProperties": false
}
```

### Quest schema (illustrative JSON Schema)
```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "ashencrown.quest.schema.json",
  "type": "object",
  "required": ["id", "chapter_id", "type", "objectives", "world_flags_set", "rewards", "availability_policy"],
  "properties": {
    "id": {"type": "string", "pattern": "^quest\\.c[0-9]{2}\\.[a-z0-9_]+$"},
    "chapter_id": {"type": "string"},
    "type": {"enum": ["main", "side", "character", "faction", "hidden"]},
    "giver_id": {"type": ["string", "null"]},
    "prerequisites": {"type": "array", "items": {"type": "string"}},
    "objectives": {"type": "array", "minItems": 1, "items": {"type": "object", "required": ["kind", "target_id", "count"], "properties": {"kind": {"enum": ["Talk", "Kill", "Collect", "Explore", "Boss"]}, "target_id": {"type": "string"}, "count": {"type": "integer", "minimum": 1}}}},
    "world_flags_set": {"type": "array", "items": {"type": "string"}},
    "rewards": {"type": "array", "items": {"type": "string"}},
    "dialogue_key": {"type": "string"},
    "availability_policy": {"enum": ["permanent", "optional_missable", "post_campaign"]}
  },
  "additionalProperties": false
}
```

### Dialogue node schema (illustrative)
```json
{
  "id": "dialogue.lyra.c01_opening.01",
  "speaker_id": "npc.lyra",
  "text_key": "dialogue.lyra.c01_opening.line01",
  "choices": [
    {"id": "protect_sanctuary", "label_key": "choice.c01.protect.label", "condition": null, "effects": ["c01_priority=hearth"]},
    {"id": "seek_truth", "label_key": "choice.c01.truth.label", "condition": null, "effects": ["c01_priority=truth"]}
  ],
  "next_node_ids": [],
  "skip_policy": "preserve_choice_flags"
}
```

## 14.4 Character Creator preset contract
```json
{
  "schema_version": 1,
  "rig_id": "rig.ashen_sentinel_humanoid",
  "height_units": 2.42,
  "body_presentation_options": ["male", "female", "neutral"],
  "body_preset_ids": ["body_a", "body_b", "body_c"],
  "face_preset_ids": ["face_01", "face_02", "face_03", "face_04", "face_05", "face_06"],
  "skin_tone_ids": ["skin_01", "skin_02", "skin_03", "skin_04", "skin_05", "skin_06", "skin_07", "skin_08"],
  "hair_style_ids": ["hair_01", "hair_02", "hair_03", "hair_04", "hair_05", "hair_06", "hair_07", "hair_08"],
  "hair_color_ids": ["hair_color_01", "hair_color_02", "hair_color_03", "hair_color_04", "hair_color_05", "hair_color_06", "hair_color_07", "hair_color_08"],
  "eye_preset_ids": ["eyes_01", "eyes_02", "eyes_03", "eyes_04", "eyes_05", "eyes_06"],
  "scar_preset_ids": ["scar_none", "scar_01", "scar_02", "scar_03"],
  "origin_ids": ["road_witness", "ashbound", "quiet_archivist"],
  "paid_options": false,
  "appearance_changes_cost": 0,
  "changes_hitbox": false
}
```

## 14.5 Validation checklist
1. **IDs:** all IDs unique across their domain; no punctuation inconsistencies; no spaces inside IDs.
2. **References:** every quest giver, reward, item, recipe input/output, enemy drop, boss reward, faction and dialogue key exists.
3. **Quest solvability:** every main quest has at least one valid path; objective prerequisites form a directed acyclic graph; no main quest requires a side quest marked missable.
4. **Branch behavior:** each major choice sets a flag used downstream; every flag has a default and migration behavior.
5. **Probabilities:** each drop distribution sums to 1 within `1e-6`; pity is deterministic per source and does not reset on reload exploitation.
6. **Economy:** no item sells for more than total craft input value in a repeatable loop; no infinite Essence/Cinder loop across salvage/craft; refund and respec costs are checked.
7. **Localization:** every UI/dialogue key includes EN/VI/JA/KO/ZH; no visible missing-key token in build; placeholder variables match in all locales.
8. **3D assets:** all Creator presets use the same compatible rig and 2.42-unit height; body/hair/gear meshes pass clipping checks with all supported armor families; no appearance option changes hitboxes.
9. **Performance:** profile creator preview and representative combat with low/high settings; record CPU/GPU frame times, allocations, draw calls, visible skinned meshes and memory. 60 FPS is an acceptance target, not assumed success.
10. **Accessibility:** every lethal enemy telegraph has a visual cue independent of color; subtitles and sound captions map to valid keys; settings persist across save/load.
11. **Save migration:** unknown cosmetic preset safely falls back without deleting quest data; schema version upgrades are idempotent.
12. **Privacy/security:** no untrusted user text inserted as HTML; Friends' Echo fields are shared only by explicit opt-in; client-held results are not used for authoritative competition.

## 14.6 Validation status for this design pass
- **Designed in this document:** archetypes, 8 weapon families, 18 skill concepts, 60-node mastery rule, 20 relic concepts, 8 sample builds, 10 enemy-role concepts, 42 regional enemy briefs, 12 boss concepts, 20 Expedition modifiers, 60 affix candidates, six sets, 30 unique gear concepts, 31 story item specs, 15 consumables, 40 recipes, the 70 campaign quest outlines, five endings, 80 Codex entries, 20 environmental scenes, 40 barks, 12 World Events, 30 contract templates, 80 achievements, 80-term glossary, 20 UI strings, and Character Creator schema.
- **Not yet validated by tools/runtime:** balance Monte Carlo, quest-graph solvability against actual engine IDs, real localization files, Unity import, rig/mesh clipping, controller QA, CPU/GPU performance and 60 FPS goal.
- **Required next production action:** convert/merge the final reviewed design data into the actual game schema, run reference validators, profile the Unity/Web demo and only then open one consolidated PR. Do not merge early modules or partial data separately.

## Final Canon Ledger additions (Modules 4–14)
| Key | Status | New or clarified canon |
|---|---|---|
| `KIT-ATTRIBUTES` | `[NEW]` | Six attributes: Vigor, Endurance, Might, Finesse, Ember, Resolve; levels 1–60; soft caps documented |
| `KIT-ARCHETYPES` | `[NEW]` | Hearthguard, Ashrunner, Emberweaver, Gravebound, Tideveil; archetypes are recommendations, not hard classes |
| `KIT-WEAPONS` | `[NEW]` | Eight families, each with defined timing/risk identity |
| `KIT-SKILLS` | `[NEW]` | 18 Q/E/R skills with cost/cooldown and counterplay |
| `KIT-MASTERY` | `[NEW]` | 60 mastery nodes across six tracks |
| `ITEM-ECONOMY` | `[NEW]` | Tier multiplier and item-level formula proposed; requires simulation |
| `CURRENCY` | `[NEW]` | Essence, Cinder, Journey Points, Reputation, Craft Materials and Legacy Ash have separated sources/sinks; no paid power |
| `QUEST-MATRIX` | `[NEW]` | 4 main + 3 side quest outlines per chapter (70 total) with world flags and callbacks |
| `ENDINGS` | `[NEW]` | Break the Crown, Rewrite the Record, Disperse Memory, The Hearth Holds, The Unwritten Page |
| `CODEX` | `[NEW]` | 87 bilingual EN/VI entries plus 20 environment scenes and 40 English bark source lines |
| `CREATOR` | `[NEW]` | First-session real-time 3D Character Creator; three presentation options; modular preset pipeline; free editing |
| `PERF-ACCEPTANCE` | `[NEW]` | 60 FPS at 1080p remains a target; requires target-hardware profile and frame-time report |
| `MONETIZATION` | `[CANON]` | Cosmetic-only; no loot boxes, no pay-to-win, no core-story FOMO |
| `SOCIAL` | `[NEW]` | Friends' Echo Gallery is post-campaign, opt-in asynchronous MVP scope; no live co-op/PvP commitment |
| `ED A-BW` | `[REVISED — not approved]` | Eda Vey = Bell Warden remains an unresolved proposal and must not be treated as locked fact without approval |

## Final producer assessment
This is a **full design pass at specification/outline level**, not a guarantee that all gameplay content is production-polished. Deep item balancing, complete final dialogue for all 70 quests, final JA/KO/ZH literary editing, asset authoring, automated reference validation, real-device performance testing and Unity integration remain production tasks. The next step should be a schema validation and a vertical slice, not a large implementation merge before the data is proven.