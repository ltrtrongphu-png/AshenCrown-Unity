# Contributing to Ashen Crown

## Working rules

- Preserve Unity 2021.3 LTS compatibility and the legacy Input Manager unless a deliberate migration is reviewed.
- Preserve save version 5 and public gameplay APIs unless a migration/shim and tests are part of the same change.
- Keep Unity runtime changes separate from browser-only changes when practical.
- Do not commit `Library/`, `Temp/`, `Obj/`, `Build*/`, `node_modules/`, `dist/`, local environment files, or credentials.
- Never commit Supabase service-role keys, OpenAI credentials, refresh tokens, passwords, or user saves.
- Do not claim a scene, Editor compile, runtime performance number, browser smoke test, or RLS property passed unless a real command/test produced evidence.

## Web change validation

```sh
npm install --ignore-scripts --no-audit --no-fund
node tools/build-web.mjs
```

The build includes source syntax checks and enforces the browser artifact allow-list. Run the GitHub Web CI workflow on the PR and include its result in the report. Security CI audits runtime dependencies and scans for committed secrets.

## Unity change validation

1. Open the repository root in Unity 2021.3 LTS or compatible newer LTS.
2. Set Active Input Handling to Input Manager (Old) or Both.
3. Run **Ashen Crown → Create Sandbox Scene** from the Editor menu.
4. Inspect Console; then test EditMode and PlayMode when appropriate.
5. Attach test output and profiler captures for performance claims.

The licensed Unity workflow is manual. It cannot run EditMode tests unless the required Unity licensing secret is configured.

## Pull request template

- Goal and changed systems/files
- Before → after measurements (or clearly mark unmeasured metrics)
- Exact test commands and results
- **VERIFIED**: commands + relevant output
- **NOT VERIFIED**: Editor/browser/Supabase requirements not tested
- Save/public API impact
- Risks and rollback plan

No project license is currently declared. Until the owner chooses one, contributors must not assume a redistribution license for the source or generated art.
