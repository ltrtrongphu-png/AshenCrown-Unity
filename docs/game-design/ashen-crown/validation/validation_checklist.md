# Validation checklist

Status: generated from the design document; **not runtime-validated**.

## Automated counts
- archetypes: 5
- weapons: 8
- skills: 18
- relics: 20
- affixes: 60
- sets: 6
- recipes: 40
- unique_items: 30
- story_items: 31
- consumables: 15
- achievements: 80
- contracts: 30
- seasons: 4
- expedition_modifiers: 20
- codex_entries: 87
- localization_sample_rows: 20
- bosses: 12
- regional_enemies: 42
- enemy_archetypes: 10
- environment_scenes: 20
- ambient_barks: 40
- endings: 5
- quest_outlines: 70
- dialogue_seed_nodes: 70
- factions: 5
- characters: 14
- mastery_nodes: 60
- world_events: 12
- live_ops_months: 12
- targets: 93
- items_csv_records: 104

## Must resolve before repository PR
- Bind each stable symbolic target ID in `targets.json` to a concrete scene trigger, enemy prefab or interactable in the game data.
- Assign final gear tiers and instance-level base stats for each unique item before shipping drop tables.
- Validate all `giver_id`, reward, item, dialogue, faction and prerequisite references against actual repository IDs.
- Run JSON schema validation and ensure JSON/CSV are UTF-8 and parse correctly.
- Check each probability table sums to 100%.
- Run a quest-graph solver; prove every main quest path can complete from a fresh save.
- Native review for EN/VI/JA/KO/ZH strings.
- Test every supported Character Creator preset combination with body/armor/weapon animations and confirm hitbox does not change.
- Profile build on agreed 1080p target PC; 60 FPS is an acceptance goal only after CPU/GPU/frame-time measurements.
- Confirm Eda Vey/Bell Warden relation and other `[REVISED]` items with project owner.

## Automated validation performed for this export
- Parsed all exported JSON/CSV files.
- Checked the listed JSON schemas for quests, dialogue, enemies, bosses, factions and normalized `items.csv` rows.
- Checked duplicate IDs in major collections and checked the quest prerequisite graph for cycles.
- Checked quest prerequisites, symbolic objective target references and quest reward item references.
- Checked sample localization keys for non-empty EN/VI/JA/KO/ZH values.
- Checked normalized reward-slot distributions sum to 100%.
- These checks do **not** test Unity/Web gameplay, asset binding, real GPU/CPU performance, native localization quality or balance in live play.