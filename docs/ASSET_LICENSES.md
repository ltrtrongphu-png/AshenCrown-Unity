# Asset licenses and provenance

Last reviewed: 2026-10-18

This redesign adds no third-party illustration, stock image, sound, or model. Atmospheric effects are CSS-generated. The logo and GLB files listed below already existed in the repository; their presence in Git is not, by itself, proof of redistribution rights.

## Assets used by the web experience

| Asset | Source / author | License status | Usage |
|---|---|---|---|
| `assets/ashen-crown-logo.svg` | Existing repository asset: [source file](https://github.com/ltrtrongphu-png/AshenCrown-Unity/blob/main/assets/ashen-crown-logo.svg). No author or license notice is embedded in the file or recorded elsewhere in the repository at review time. | **Unverified — owner confirmation required before public/commercial release.** | Site mark, favicon, manifest icon, share preview. |
| `Assets/Models/Characters/AshenSentinel.glb` | Existing generated character model. The repository includes `tools/generate_ashen_production_assets.py`; see [model notes](https://github.com/ltrtrongphu-png/AshenCrown-Unity/tree/main/Assets/Models). | **Generated asset provenance is partly documented, but no explicit asset license was found. Confirm ownership and redistribution rights before release.** | Interactive model preview on the landing page. |
| `Assets/Models/Bosses/AshenRegent.glb` | Existing generated boss model. The repository includes `tools/generate_ashen_production_assets.py`; see [model notes](https://github.com/ltrtrongphu-png/AshenCrown-Unity/tree/main/Assets/Models). | **Generated asset provenance is partly documented, but no explicit asset license was found. Confirm ownership and redistribution rights before release.** | Described in the character showcase; not newly embedded as a second viewer. |
| Cormorant Garamond | Christian Thalmann and the Cormorant Project Authors; [upstream project](https://github.com/CatharsisFonts/Cormorant) and [Google Fonts entry](https://fonts.google.com/specimen/Cormorant+Garamond). | SIL Open Font License 1.1 (OFL). | Display headings, with Georgia/Times fallback. |
| DM Sans | DM Sans Project Authors; [upstream project](https://github.com/googlefonts/dm-fonts) and [Google Fonts entry](https://fonts.google.com/specimen/DM+Sans). | SIL Open Font License 1.1 (OFL). | Body and interface text, with system sans-serif fallback. |

## Source and distribution notes

- Google Fonts serves the two listed font families remotely. The site retains system-font fallbacks when network font loading fails.
- Social preview metadata points at the repository's existing SVG logo. Some social platforms may not render SVG previews consistently; verify the production URL and preview behaviour before launch.
- No unverified asset was added during this redesign. The logo and GLB entries are recorded as **unverified** rather than assigning them an assumed license.
- Before any public or commercial release, record the asset owner, explicit license or permission, and source URL for each unverified model/logo. Replace or remove an asset if appropriate rights cannot be confirmed.
