# Auditoria mecànica del Brain

Arrel: `.`

## Mètriques

- `files`: `7939`
- `bytes`: `351426637`
- `code_files`: `84`
- `missing_relative_imports`: `1`
- `missing_asset_references`: `14`
- `bare_imports`: `{"@google/genai": 2, "baileys": 2, "dompurify": 3, "dotenv": 1, "lucide-react": 16, "qrcode-terminal": 1, "react": 26, "react-dom": 2, "react-router-dom": 14}`
- `legacy_mirror_pairs`: `13`
- `legacy_mirror_drift`: `0`
- `markdown_files`: `119`
- `active_markdown_files`: `1`
- `wikilinks`: `791`
- `broken_wikilinks`: `61`
- `active_orphans`: `0`
- `document_states`: `{"<missing>": 1}`
- `findings_by_severity`: `{"critical": 2, "high": 18, "low": 25, "medium": 2873}`

## Troballes

### [CRITICAL] security.secret-value — `.wwebjs_auth/session/WasmTtsEngine/20260723.1/voices.json:1615`

Possible secret incrustat; el valor s'ha omés de l'informe.

Evidència: `pattern=openai-key`

Acció: Revoca'l, elimina'l de la font i usa variables d'entorn/secret manager.

### [CRITICAL] code.import-missing — `src/PedraSecaEmbed.jsx:38`

Import relatiu no resolt.

Evidència: `./css/index.css?inline`

Acció: Restaura el mòdul o elimina la branca morta.

### [HIGH] code.asset-missing — `/assets/images/nano_anima_mas_ibanez_v3_1781060081431.webp`

Asset referenciat però absent del paquet auditat.

Acció: Inclou l'asset o substitueix la referència per una URL/asset real.

### [HIGH] code.asset-missing — `/assets/images/nano_porta_del_mas.png`

Asset referenciat però absent del paquet auditat.

Acció: Inclou l'asset o substitueix la referència per una URL/asset real.

### [HIGH] code.asset-missing — `/assets/images/nano_porta_masia_roure_1774195469079.png`

Asset referenciat però absent del paquet auditat.

Acció: Inclou l'asset o substitueix la referència per una URL/asset real.

### [HIGH] code.asset-missing — `/assets/images/towns/`

Asset referenciat però absent del paquet auditat.

Acció: Inclou l'asset o substitueix la referència per una URL/asset real.

### [HIGH] code.asset-missing — `/assets/img/aplec_danses_1774952191348.png`

Asset referenciat però absent del paquet auditat.

Acció: Inclou l'asset o substitueix la referència per una URL/asset real.

### [HIGH] code.asset-missing — `/assets/img/art_trellat_farmer_1774708525806.png`

Asset referenciat però absent del paquet auditat.

Acció: Inclou l'asset o substitueix la referència per una URL/asset real.

### [HIGH] code.asset-missing — `/assets/img/art_trellat_v2_1774708257858.png`

Asset referenciat però absent del paquet auditat.

Acció: Inclou l'asset o substitueix la referència per una URL/asset real.

### [HIGH] code.asset-missing — `/assets/img/hero_panoramic_landscape_1774710654078.png`

Asset referenciat però absent del paquet auditat.

Acció: Inclou l'asset o substitueix la referència per una URL/asset real.

### [HIGH] code.asset-missing — `/assets/img/hero_panoramic_rural_view_1774720664221.png`

Asset referenciat però absent del paquet auditat.

Acció: Inclou l'asset o substitueix la referència per una URL/asset real.

### [HIGH] code.asset-missing — `/assets/img/hero_serrella_comic_1774709602282.png`

Asset referenciat però absent del paquet auditat.

Acció: Inclou l'asset o substitueix la referència per una URL/asset real.

### [HIGH] code.asset-missing — `/assets/img/nano_mel_font_roja_1774216345755.png`

Asset referenciat però absent del paquet auditat.

Acció: Inclou l'asset o substitueix la referència per una URL/asset real.

### [HIGH] code.asset-missing — `/assets/img/nano_mercat_llaurador_1774197050578.png`

Asset referenciat però absent del paquet auditat.

Acció: Inclou l'asset o substitueix la referència per una URL/asset real.

### [HIGH] code.asset-missing — `/assets/img/nano_oli_oliva_1774198089084.png`

Asset referenciat però absent del paquet auditat.

Acció: Inclou l'asset o substitueix la referència per una URL/asset real.

### [HIGH] code.asset-missing — `/assets/uploads/grup/soc-de-poble/pobles/pi-del-pla-verd/02-fitxa-arbre.jpg`

Asset referenciat però absent del paquet auditat.

Acció: Inclou l'asset o substitueix la referència per una URL/asset real.

### [HIGH] wiki.frontmatter-missing — `_wiki_de_poble/04_arquitectura_disseny/model_arquitectonic_pedra_seca_dola.md`

Document actiu sense frontmatter.

Acció: Afig l'esquema canònic mínim.

### [HIGH] security.html-injection-sink — `src/sections/disseny/DesignSection.jsx:970`

Punt d'injecció HTML; exigeix dades estructurades o sanitització robusta.

Acció: Elimina dangerouslySetInnerHTML per a dades remotes/usuari; renderitza nodes React.

### [HIGH] security.html-injection-sink — `src/sections/disseny/DesignSection.jsx:1029`

Punt d'injecció HTML; exigeix dades estructurades o sanitització robusta.

Acció: Elimina dangerouslySetInnerHTML per a dades remotes/usuari; renderitza nodes React.

### [HIGH] security.html-injection-sink — `src/sections/text/TextSection.jsx:29`

Punt d'injecció HTML; exigeix dades estructurades o sanitització robusta.

Acció: Elimina dangerouslySetInnerHTML per a dades remotes/usuari; renderitza nodes React.

### [MEDIUM] hygiene.exact-duplicate — `.husky/_/pre-rebase`

Fitxers exactament duplicats.

Evidència: `.husky/_/pre-rebase | .husky/_/pre-applypatch | .husky/_/pre-auto-gc | .husky/_/pre-merge-commit | .husky/_/post-commit | .husky/_/applypatch-msg | .husky/_/prepare-commit-msg | .husky/_/post-checkout | .husky/_/post-applypatch | .husky/_/post-rewrite | .husky/_/commit-msg | .husky/_/pre-push | .husky/_/post-merge | .husky/_/pre-commit`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/device-list-228127372525586.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/device-list-228127372525586.json | bot/.iaia_auth/device-list-228127372525586.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/identity-key-228127372525586_1.0.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/identity-key-228127372525586_1.0.json | bot/.iaia_auth/identity-key-228127372525586_1.0.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/identity-key-4037973909609_1.0.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/identity-key-4037973909609_1.0.json | bot/.iaia_auth/identity-key-4037973909609_1.0.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-100240459886665_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-100240459886665_reverse.json | bot/.iaia_auth/lid-mapping-100240459886665_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-100631134126258_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-100631134126258_reverse.json | bot/.iaia_auth/lid-mapping-100631134126258_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-100781558616312_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-100781558616312_reverse.json | bot/.iaia_auth/lid-mapping-100781558616312_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-10088928555215_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-10088928555215_reverse.json | bot/.iaia_auth/lid-mapping-10088928555215_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-100944767406172_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-100944767406172_reverse.json | bot/.iaia_auth/lid-mapping-100944767406172_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-101108043255940_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-101108043255940_reverse.json | bot/.iaia_auth/lid-mapping-101108043255940_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-101137956995296_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-101137956995296_reverse.json | bot/.iaia_auth/lid-mapping-101137956995296_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-101206659747935_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-101206659747935_reverse.json | bot/.iaia_auth/lid-mapping-101206659747935_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-101412868472941_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-101412868472941_reverse.json | bot/.iaia_auth/lid-mapping-101412868472941_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-101412952383575_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-101412952383575_reverse.json | bot/.iaia_auth/lid-mapping-101412952383575_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-101730796749037_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-101730796749037_reverse.json | bot/.iaia_auth/lid-mapping-101730796749037_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-102280820961346_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-102280820961346_reverse.json | bot/.iaia_auth/lid-mapping-102280820961346_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-10230679257119_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-10230679257119_reverse.json | bot/.iaia_auth/lid-mapping-10230679257119_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-102508202557612_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-102508202557612_reverse.json | bot/.iaia_auth/lid-mapping-102508202557612_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-10265005453488_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-10265005453488_reverse.json | bot/.iaia_auth/lid-mapping-10265005453488_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-102899145281660_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-102899145281660_reverse.json | bot/.iaia_auth/lid-mapping-102899145281660_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-103208080900239_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-103208080900239_reverse.json | bot/.iaia_auth/lid-mapping-103208080900239_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-103659086032993_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-103659086032993_reverse.json | bot/.iaia_auth/lid-mapping-103659086032993_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-103689167597715_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-103689167597715_reverse.json | bot/.iaia_auth/lid-mapping-103689167597715_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-103697723965583_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-103697723965583_reverse.json | bot/.iaia_auth/lid-mapping-103697723965583_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-103702018920550_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-103702018920550_reverse.json | bot/.iaia_auth/lid-mapping-103702018920550_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-103809460244502_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-103809460244502_reverse.json | bot/.iaia_auth/lid-mapping-103809460244502_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-104543882842190_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-104543882842190_reverse.json | bot/.iaia_auth/lid-mapping-104543882842190_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-105093621923885_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-105093621923885_reverse.json | bot/.iaia_auth/lid-mapping-105093621923885_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-105239734657147_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-105239734657147_reverse.json | bot/.iaia_auth/lid-mapping-105239734657147_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-105888274710782_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-105888274710782_reverse.json | bot/.iaia_auth/lid-mapping-105888274710782_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-106249035227249_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-106249035227249_reverse.json | bot/.iaia_auth/lid-mapping-106249035227249_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-106356459745389_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-106356459745389_reverse.json | bot/.iaia_auth/lid-mapping-106356459745389_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-106760186638347_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-106760186638347_reverse.json | bot/.iaia_auth/lid-mapping-106760186638347_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-107202434040025_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-107202434040025_reverse.json | bot/.iaia_auth/lid-mapping-107202434040025_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-10724717912072_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-10724717912072_reverse.json | bot/.iaia_auth/lid-mapping-10724717912072_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-107533146538134_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-107533146538134_reverse.json | bot/.iaia_auth/lid-mapping-107533146538134_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-107666324115692_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-107666324115692_reverse.json | bot/.iaia_auth/lid-mapping-107666324115692_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-108447974555871_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-108447974555871_reverse.json | bot/.iaia_auth/lid-mapping-108447974555871_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-108800161886359_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-108800161886359_reverse.json | bot/.iaia_auth/lid-mapping-108800161886359_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-109642042617946_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-109642042617946_reverse.json | bot/.iaia_auth/lid-mapping-109642042617946_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-109650682859668_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-109650682859668_reverse.json | bot/.iaia_auth/lid-mapping-109650682859668_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-10969346482191_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-10969346482191_reverse.json | bot/.iaia_auth/lid-mapping-10969346482191_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-109727975473382_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-109727975473382_reverse.json | bot/.iaia_auth/lid-mapping-109727975473382_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-109925510463628_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-109925510463628_reverse.json | bot/.iaia_auth/lid-mapping-109925510463628_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-110105932656659_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-110105932656659_reverse.json | bot/.iaia_auth/lid-mapping-110105932656659_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-110286187032653_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-110286187032653_reverse.json | bot/.iaia_auth/lid-mapping-110286187032653_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-110582623690988_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-110582623690988_reverse.json | bot/.iaia_auth/lid-mapping-110582623690988_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-110659882737678_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-110659882737678_reverse.json | bot/.iaia_auth/lid-mapping-110659882737678_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-110797388832849_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-110797388832849_reverse.json | bot/.iaia_auth/lid-mapping-110797388832849_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-111265456357606_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-111265456357606_reverse.json | bot/.iaia_auth/lid-mapping-111265456357606_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-111420142317718_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-111420142317718_reverse.json | bot/.iaia_auth/lid-mapping-111420142317718_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-111437238296663_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-111437238296663_reverse.json | bot/.iaia_auth/lid-mapping-111437238296663_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-111574744322135_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-111574744322135_reverse.json | bot/.iaia_auth/lid-mapping-111574744322135_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-111686329606350_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-111686329606350_reverse.json | bot/.iaia_auth/lid-mapping-111686329606350_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-11201425739870_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-11201425739870_reverse.json | bot/.iaia_auth/lid-mapping-11201425739870_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-112322035105805_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-112322035105805_reverse.json | bot/.iaia_auth/lid-mapping-112322035105805_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-112369799827638_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-112369799827638_reverse.json | bot/.iaia_auth/lid-mapping-112369799827638_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-112575522054244_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-112575522054244_reverse.json | bot/.iaia_auth/lid-mapping-112575522054244_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-112837481468113_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-112837481468113_reverse.json | bot/.iaia_auth/lid-mapping-112837481468113_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-112987771793495_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-112987771793495_reverse.json | bot/.iaia_auth/lid-mapping-112987771793495_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-113456023867497_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-113456023867497_reverse.json | bot/.iaia_auth/lid-mapping-113456023867497_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-113584839385233_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-113584839385233_reverse.json | bot/.iaia_auth/lid-mapping-113584839385233_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-113709443756054_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-113709443756054_reverse.json | bot/.iaia_auth/lid-mapping-113709443756054_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-113743837040813_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-113743837040813_reverse.json | bot/.iaia_auth/lid-mapping-113743837040813_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-114293576077364_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-114293576077364_reverse.json | bot/.iaia_auth/lid-mapping-114293576077364_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-114310655267054_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-114310655267054_reverse.json | bot/.iaia_auth/lid-mapping-114310655267054_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-11441843212416_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-11441843212416_reverse.json | bot/.iaia_auth/lid-mapping-11441843212416_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-11446305968241_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-11446305968241_reverse.json | bot/.iaia_auth/lid-mapping-11446305968241_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-114916262445119_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-114916262445119_reverse.json | bot/.iaia_auth/lid-mapping-114916262445119_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-114950689284294_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-114950689284294_reverse.json | bot/.iaia_auth/lid-mapping-114950689284294_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-115246974955606_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-115246974955606_reverse.json | bot/.iaia_auth/lid-mapping-115246974955606_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-115276955779230_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-115276955779230_reverse.json | bot/.iaia_auth/lid-mapping-115276955779230_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-115375823970518_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-115375823970518_reverse.json | bot/.iaia_auth/lid-mapping-115375823970518_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-115431675269171_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-115431675269171_reverse.json | bot/.iaia_auth/lid-mapping-115431675269171_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-115521752146045_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-115521752146045_reverse.json | bot/.iaia_auth/lid-mapping-115521752146045_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-116015723708436_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-116015723708436_reverse.json | bot/.iaia_auth/lid-mapping-116015723708436_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-116187522404559_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-116187522404559_reverse.json | bot/.iaia_auth/lid-mapping-116187522404559_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-116299191566485_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-116299191566485_reverse.json | bot/.iaia_auth/lid-mapping-116299191566485_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-116372256387196_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-116372256387196_reverse.json | bot/.iaia_auth/lid-mapping-116372256387196_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-116479563411690_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-116479563411690_reverse.json | bot/.iaia_auth/lid-mapping-116479563411690_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-116612824834144_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-116612824834144_reverse.json | bot/.iaia_auth/lid-mapping-116612824834144_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-116737278255206_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-116737278255206_reverse.json | bot/.iaia_auth/lid-mapping-116737278255206_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-116866127253607_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-116866127253607_reverse.json | bot/.iaia_auth/lid-mapping-116866127253607_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-116943587676327_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-116943587676327_reverse.json | bot/.iaia_auth/lid-mapping-116943587676327_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-117089566203904_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-117089566203904_reverse.json | bot/.iaia_auth/lid-mapping-117089566203904_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-117467439448184_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-117467439448184_reverse.json | bot/.iaia_auth/lid-mapping-117467439448184_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-11755543609422_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-11755543609422_reverse.json | bot/.iaia_auth/lid-mapping-11755543609422_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-117617813651566_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-117617813651566_reverse.json | bot/.iaia_auth/lid-mapping-117617813651566_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-117738005639370_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-117738005639370_reverse.json | bot/.iaia_auth/lid-mapping-117738005639370_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-117875562004727_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-117875562004727_reverse.json | bot/.iaia_auth/lid-mapping-117875562004727_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-118824682713191_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-118824682713191_reverse.json | bot/.iaia_auth/lid-mapping-118824682713191_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-119181265649683_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-119181265649683_reverse.json | bot/.iaia_auth/lid-mapping-119181265649683_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-119198260965511_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-119198260965511_reverse.json | bot/.iaia_auth/lid-mapping-119198260965511_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-119340246519854_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-119340246519854_reverse.json | bot/.iaia_auth/lid-mapping-119340246519854_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-119473256284310_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-119473256284310_reverse.json | bot/.iaia_auth/lid-mapping-119473256284310_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-120164930584622_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-120164930584622_reverse.json | bot/.iaia_auth/lid-mapping-120164930584622_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-120190415183907_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-120190415183907_reverse.json | bot/.iaia_auth/lid-mapping-120190415183907_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-120216151437556_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-120216151437556_reverse.json | bot/.iaia_auth/lid-mapping-120216151437556_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-12021798068381_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-12021798068381_reverse.json | bot/.iaia_auth/lid-mapping-12021798068381_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-120641386741800_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-120641386741800_reverse.json | bot/.iaia_auth/lid-mapping-120641386741800_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-120735859237021_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-120735859237021_reverse.json | bot/.iaia_auth/lid-mapping-120735859237021_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-121053753905201_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-121053753905201_reverse.json | bot/.iaia_auth/lid-mapping-121053753905201_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-121126818729986_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-121126818729986_reverse.json | bot/.iaia_auth/lid-mapping-121126818729986_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-121216996237404_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-121216996237404_reverse.json | bot/.iaia_auth/lid-mapping-121216996237404_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-121822653735087_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-121822653735087_reverse.json | bot/.iaia_auth/lid-mapping-121822653735087_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-122745937522934_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-122745937522934_reverse.json | bot/.iaia_auth/lid-mapping-122745937522934_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-122814623420609_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-122814623420609_reverse.json | bot/.iaia_auth/lid-mapping-122814623420609_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-1228411027650_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-1228411027650_reverse.json | bot/.iaia_auth/lid-mapping-1228411027650_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-12317982990525_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-12317982990525_reverse.json | bot/.iaia_auth/lid-mapping-12317982990525_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-123433232945282_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-123433232945282_reverse.json | bot/.iaia_auth/lid-mapping-123433232945282_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-123506180227155_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-123506180227155_reverse.json | bot/.iaia_auth/lid-mapping-123506180227155_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-123531966844933_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-123531966844933_reverse.json | bot/.iaia_auth/lid-mapping-123531966844933_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-123824158834722_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-123824158834722_reverse.json | bot/.iaia_auth/lid-mapping-123824158834722_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-123828252450881_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-123828252450881_reverse.json | bot/.iaia_auth/lid-mapping-123828252450881_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-123905612218436_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-123905612218436_reverse.json | bot/.iaia_auth/lid-mapping-123905612218436_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-123974264586325_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-123974264586325_reverse.json | bot/.iaia_auth/lid-mapping-123974264586325_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-124296487784699_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-124296487784699_reverse.json | bot/.iaia_auth/lid-mapping-124296487784699_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-124451005976614_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-124451005976614_reverse.json | bot/.iaia_auth/lid-mapping-124451005976614_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-124974958432333_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-124974958432333_reverse.json | bot/.iaia_auth/lid-mapping-124974958432333_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-125082852667644_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-125082852667644_reverse.json | bot/.iaia_auth/lid-mapping-125082852667644_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-125155430908023_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-125155430908023_reverse.json | bot/.iaia_auth/lid-mapping-125155430908023_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-125408766857404_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-125408766857404_reverse.json | bot/.iaia_auth/lid-mapping-125408766857404_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-126066031108191_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-126066031108191_reverse.json | bot/.iaia_auth/lid-mapping-126066031108191_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-126375704965367_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-126375704965367_reverse.json | bot/.iaia_auth/lid-mapping-126375704965367_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-126435297620176_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-126435297620176_reverse.json | bot/.iaia_auth/lid-mapping-126435297620176_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-126559818104884_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-126559818104884_reverse.json | bot/.iaia_auth/lid-mapping-126559818104884_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-127109573910721_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-127109573910721_reverse.json | bot/.iaia_auth/lid-mapping-127109573910721_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-12773249527822_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-12773249527822_reverse.json | bot/.iaia_auth/lid-mapping-12773249527822_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-127775327408319_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-127775327408319_reverse.json | bot/.iaia_auth/lid-mapping-127775327408319_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-127861226762344_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-127861226762344_reverse.json | bot/.iaia_auth/lid-mapping-127861226762344_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-127973281788142_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-127973281788142_reverse.json | bot/.iaia_auth/lid-mapping-127973281788142_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-128071646605381_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-128071646605381_reverse.json | bot/.iaia_auth/lid-mapping-128071646605381_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-128088876781730_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-128088876781730_reverse.json | bot/.iaia_auth/lid-mapping-128088876781730_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-128359879180498_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-128359879180498_reverse.json | bot/.iaia_auth/lid-mapping-128359879180498_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-128539898716277_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-128539898716277_reverse.json | bot/.iaia_auth/lid-mapping-128539898716277_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-12924177375451_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-12924177375451_reverse.json | bot/.iaia_auth/lid-mapping-12924177375451_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-129338829750301_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-129338829750301_reverse.json | bot/.iaia_auth/lid-mapping-129338829750301_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-129433251901671_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-129433251901671_reverse.json | bot/.iaia_auth/lid-mapping-129433251901671_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-129450364682378_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-129450364682378_reverse.json | bot/.iaia_auth/lid-mapping-129450364682378_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-129746784522248_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-129746784522248_reverse.json | bot/.iaia_auth/lid-mapping-129746784522248_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-130309458763927_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-130309458763927_reverse.json | bot/.iaia_auth/lid-mapping-130309458763927_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-130408175915255_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-130408175915255_reverse.json | bot/.iaia_auth/lid-mapping-130408175915255_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-130528518897769_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-130528518897769_reverse.json | bot/.iaia_auth/lid-mapping-130528518897769_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-130747897778237_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-130747897778237_reverse.json | bot/.iaia_auth/lid-mapping-130747897778237_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-130863425658950_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-130863425658950_reverse.json | bot/.iaia_auth/lid-mapping-130863425658950_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-130910737453092_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-130910737453092_reverse.json | bot/.iaia_auth/lid-mapping-130910737453092_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-131043881447436_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-131043881447436_reverse.json | bot/.iaia_auth/lid-mapping-131043881447436_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-131181253238908_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-131181253238908_reverse.json | bot/.iaia_auth/lid-mapping-131181253238908_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-131262891184377_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-131262891184377_reverse.json | bot/.iaia_auth/lid-mapping-131262891184377_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-131288778420442_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-131288778420442_reverse.json | bot/.iaia_auth/lid-mapping-131288778420442_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-132224980647995_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-132224980647995_reverse.json | bot/.iaia_auth/lid-mapping-132224980647995_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-133006631149688_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-133006631149688_reverse.json | bot/.iaia_auth/lid-mapping-133006631149688_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-133363096653892_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-133363096653892_reverse.json | bot/.iaia_auth/lid-mapping-133363096653892_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-133367542616146_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-133367542616146_reverse.json | bot/.iaia_auth/lid-mapping-133367542616146_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-133590780268696_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-133590780268696_reverse.json | bot/.iaia_auth/lid-mapping-133590780268696_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-134741898612894_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-134741898612894_reverse.json | bot/.iaia_auth/lid-mapping-134741898612894_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-134978037928098_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-134978037928098_reverse.json | bot/.iaia_auth/lid-mapping-134978037928098_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-135085462450399_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-135085462450399_reverse.json | bot/.iaia_auth/lid-mapping-135085462450399_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-135106920489038_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-135106920489038_reverse.json | bot/.iaia_auth/lid-mapping-135106920489038_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-13567919165656_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-13567919165656_reverse.json | bot/.iaia_auth/lid-mapping-13567919165656_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-135944825004252_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-135944825004252_reverse.json | bot/.iaia_auth/lid-mapping-135944825004252_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-136073187430625_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-136073187430625_reverse.json | bot/.iaia_auth/lid-mapping-136073187430625_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-136421448933520_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-136421448933520_reverse.json | bot/.iaia_auth/lid-mapping-136421448933520_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-136588700958851_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-136588700958851_reverse.json | bot/.iaia_auth/lid-mapping-136588700958851_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-136653008052335_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-136653008052335_reverse.json | bot/.iaia_auth/lid-mapping-136653008052335_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-136683190235252_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-136683190235252_reverse.json | bot/.iaia_auth/lid-mapping-136683190235252_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-136829084909681_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-136829084909681_reverse.json | bot/.iaia_auth/lid-mapping-136829084909681_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-137010178212056_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-137010178212056_reverse.json | bot/.iaia_auth/lid-mapping-137010178212056_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-137576509898979_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-137576509898979_reverse.json | bot/.iaia_auth/lid-mapping-137576509898979_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-137615181349014_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-137615181349014_reverse.json | bot/.iaia_auth/lid-mapping-137615181349014_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-137670965633130_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-137670965633130_reverse.json | bot/.iaia_auth/lid-mapping-137670965633130_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-137915845882091_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-137915845882091_reverse.json | bot/.iaia_auth/lid-mapping-137915845882091_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-137946447507638_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-137946447507638_reverse.json | bot/.iaia_auth/lid-mapping-137946447507638_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-138242280161349_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-138242280161349_reverse.json | bot/.iaia_auth/lid-mapping-138242280161349_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-138319572787204_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-138319572787204_reverse.json | bot/.iaia_auth/lid-mapping-138319572787204_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-138654546669667_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-138654546669667_reverse.json | bot/.iaia_auth/lid-mapping-138654546669667_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-138688906440762_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-138688906440762_reverse.json | bot/.iaia_auth/lid-mapping-138688906440762_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-138886542029032_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-138886542029032_reverse.json | bot/.iaia_auth/lid-mapping-138886542029032_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-138890769915970_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-138890769915970_reverse.json | bot/.iaia_auth/lid-mapping-138890769915970_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-138916522897589_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-138916522897589_reverse.json | bot/.iaia_auth/lid-mapping-138916522897589_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-139380412923962_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-139380412923962_reverse.json | bot/.iaia_auth/lid-mapping-139380412923962_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-139397542490164_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-139397542490164_reverse.json | bot/.iaia_auth/lid-mapping-139397542490164_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-139487820648562_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-139487820648562_reverse.json | bot/.iaia_auth/lid-mapping-139487820648562_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-139526324383882_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-139526324383882_reverse.json | bot/.iaia_auth/lid-mapping-139526324383882_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-139535031758996_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-139535031758996_reverse.json | bot/.iaia_auth/lid-mapping-139535031758996_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-139547933462591_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-139547933462591_reverse.json | bot/.iaia_auth/lid-mapping-139547933462591_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-139660022050836_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-139660022050836_reverse.json | bot/.iaia_auth/lid-mapping-139660022050836_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-139771288506532_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-139771288506532_reverse.json | bot/.iaia_auth/lid-mapping-139771288506532_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-139917166391498_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-139917166391498_reverse.json | bot/.iaia_auth/lid-mapping-139917166391498_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-139968856993934_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-139968856993934_reverse.json | bot/.iaia_auth/lid-mapping-139968856993934_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-13997315256533_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-13997315256533_reverse.json | bot/.iaia_auth/lid-mapping-13997315256533_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-14005905186906_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-14005905186906_reverse.json | bot/.iaia_auth/lid-mapping-14005905186906_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-140462627229773_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-140462627229773_reverse.json | bot/.iaia_auth/lid-mapping-140462627229773_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-140694656139425_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-140694656139425_reverse.json | bot/.iaia_auth/lid-mapping-140694656139425_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-140776226967667_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-140776226967667_reverse.json | bot/.iaia_auth/lid-mapping-140776226967667_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-140956649160709_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-140956649160709_reverse.json | bot/.iaia_auth/lid-mapping-140956649160709_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-14096200147157_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-14096200147157_reverse.json | bot/.iaia_auth/lid-mapping-14096200147157_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-141055500521519_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-141055500521519_reverse.json | bot/.iaia_auth/lid-mapping-141055500521519_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-141429129105530_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-141429129105530_reverse.json | bot/.iaia_auth/lid-mapping-141429129105530_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-141519239512114_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-141519239512114_reverse.json | bot/.iaia_auth/lid-mapping-141519239512114_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-141579469758707_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-141579469758707_reverse.json | bot/.iaia_auth/lid-mapping-141579469758707_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-141871376547960_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-141871376547960_reverse.json | bot/.iaia_auth/lid-mapping-141871376547960_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-141897263788281_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-141897263788281_reverse.json | bot/.iaia_auth/lid-mapping-141897263788281_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-142253729251367_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-142253729251367_reverse.json | bot/.iaia_auth/lid-mapping-142253729251367_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-142386806149287_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-142386806149287_reverse.json | bot/.iaia_auth/lid-mapping-142386806149287_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-142958070337557_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-142958070337557_reverse.json | bot/.iaia_auth/lid-mapping-142958070337557_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-143323142553605_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-143323142553605_reverse.json | bot/.iaia_auth/lid-mapping-143323142553605_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-143340976775412_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-143340976775412_reverse.json | bot/.iaia_auth/lid-mapping-143340976775412_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-143464910073887_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-143464910073887_reverse.json | bot/.iaia_auth/lid-mapping-143464910073887_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-14405387423950_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-14405387423950_reverse.json | bot/.iaia_auth/lid-mapping-14405387423950_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-145298911404126_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-145298911404126_reverse.json | bot/.iaia_auth/lid-mapping-145298911404126_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-145745604784167_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-145745604784167_reverse.json | bot/.iaia_auth/lid-mapping-145745604784167_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-145792832692476_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-145792832692476_reverse.json | bot/.iaia_auth/lid-mapping-145792832692476_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-145831386714162_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-145831386714162_reverse.json | bot/.iaia_auth/lid-mapping-145831386714162_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-14590037516382_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-14590037516382_reverse.json | bot/.iaia_auth/lid-mapping-14590037516382_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-146273768333368_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-146273768333368_reverse.json | bot/.iaia_auth/lid-mapping-146273768333368_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-146351312613600_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-146351312613600_reverse.json | bot/.iaia_auth/lid-mapping-146351312613600_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-146759166758964_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-146759166758964_reverse.json | bot/.iaia_auth/lid-mapping-146759166758964_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-146789248274604_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-146789248274604_reverse.json | bot/.iaia_auth/lid-mapping-146789248274604_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-147025488302272_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-147025488302272_reverse.json | bot/.iaia_auth/lid-mapping-147025488302272_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-147764105199711_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-147764105199711_reverse.json | bot/.iaia_auth/lid-mapping-147764105199711_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-147923052539963_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-147923052539963_reverse.json | bot/.iaia_auth/lid-mapping-147923052539963_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-148240997601290_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-148240997601290_reverse.json | bot/.iaia_auth/lid-mapping-148240997601290_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-148515808378944_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-148515808378944_reverse.json | bot/.iaia_auth/lid-mapping-148515808378944_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-148683932827742_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-148683932827742_reverse.json | bot/.iaia_auth/lid-mapping-148683932827742_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-148713678884909_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-148713678884909_reverse.json | bot/.iaia_auth/lid-mapping-148713678884909_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-148747652726908_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-148747652726908_reverse.json | bot/.iaia_auth/lid-mapping-148747652726908_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-149117003141137_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-149117003141137_reverse.json | bot/.iaia_auth/lid-mapping-149117003141137_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-149533765959932_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-149533765959932_reverse.json | bot/.iaia_auth/lid-mapping-149533765959932_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-149542255210610_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-149542255210610_reverse.json | bot/.iaia_auth/lid-mapping-149542255210610_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-149623943471208_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-149623943471208_reverse.json | bot/.iaia_auth/lid-mapping-149623943471208_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-149658236092664_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-149658236092664_reverse.json | bot/.iaia_auth/lid-mapping-149658236092664_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-149675466326018_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-149675466326018_reverse.json | bot/.iaia_auth/lid-mapping-149675466326018_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-149963564679404_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-149963564679404_reverse.json | bot/.iaia_auth/lid-mapping-149963564679404_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-150010389893153_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-150010389893153_reverse.json | bot/.iaia_auth/lid-mapping-150010389893153_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-150474330259501_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-150474330259501_reverse.json | bot/.iaia_auth/lid-mapping-150474330259501_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-150582241296580_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-150582241296580_reverse.json | bot/.iaia_auth/lid-mapping-150582241296580_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-150723505475646_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-150723505475646_reverse.json | bot/.iaia_auth/lid-mapping-150723505475646_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-150839385661574_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-150839385661574_reverse.json | bot/.iaia_auth/lid-mapping-150839385661574_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-150989709541416_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-150989709541416_reverse.json | bot/.iaia_auth/lid-mapping-150989709541416_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-151075592126576_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-151075592126576_reverse.json | bot/.iaia_auth/lid-mapping-151075592126576_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-151247323705567_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-151247323705567_reverse.json | bot/.iaia_auth/lid-mapping-151247323705567_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-151715542261890_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-151715542261890_reverse.json | bot/.iaia_auth/lid-mapping-151715542261890_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-15182709453054_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-15182709453054_reverse.json | bot/.iaia_auth/lid-mapping-15182709453054_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-151990470492185_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-151990470492185_reverse.json | bot/.iaia_auth/lid-mapping-151990470492185_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-152149384294479_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-152149384294479_reverse.json | bot/.iaia_auth/lid-mapping-152149384294479_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-15234467143762_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-15234467143762_reverse.json | bot/.iaia_auth/lid-mapping-15234467143762_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-152346868858922_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-152346868858922_reverse.json | bot/.iaia_auth/lid-mapping-152346868858922_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-15268726202514_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-15268726202514_reverse.json | bot/.iaia_auth/lid-mapping-15268726202514_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-152948113977395_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-152948113977395_reverse.json | bot/.iaia_auth/lid-mapping-152948113977395_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-153631533834388_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-153631533834388_reverse.json | bot/.iaia_auth/lid-mapping-153631533834388_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-153759845998724_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-153759845998724_reverse.json | bot/.iaia_auth/lid-mapping-153759845998724_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-153845795668104_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-153845795668104_reverse.json | bot/.iaia_auth/lid-mapping-153845795668104_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-153858730909698_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-153858730909698_reverse.json | bot/.iaia_auth/lid-mapping-153858730909698_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-153880507764890_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-153880507764890_reverse.json | bot/.iaia_auth/lid-mapping-153880507764890_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-154060594381010_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-154060594381010_reverse.json | bot/.iaia_auth/lid-mapping-154060594381010_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-154112201126107_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-154112201126107_reverse.json | bot/.iaia_auth/lid-mapping-154112201126107_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-154584630710360_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-154584630710360_reverse.json | bot/.iaia_auth/lid-mapping-154584630710360_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-155039897227289_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-155039897227289_reverse.json | bot/.iaia_auth/lid-mapping-155039897227289_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-15504982945988_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-15504982945988_reverse.json | bot/.iaia_auth/lid-mapping-15504982945988_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-155228775137528_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-155228775137528_reverse.json | bot/.iaia_auth/lid-mapping-155228775137528_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-15530735980731_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-15530735980731_reverse.json | bot/.iaia_auth/lid-mapping-15530735980731_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-155391983931568_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-155391983931568_reverse.json | bot/.iaia_auth/lid-mapping-155391983931568_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-155546569179174_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-155546569179174_reverse.json | bot/.iaia_auth/lid-mapping-155546569179174_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-155714056155181_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-155714056155181_reverse.json | bot/.iaia_auth/lid-mapping-155714056155181_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-155748432654495_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-155748432654495_reverse.json | bot/.iaia_auth/lid-mapping-155748432654495_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-155868708511998_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-155868708511998_reverse.json | bot/.iaia_auth/lid-mapping-155868708511998_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-15599338008756_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-15599338008756_reverse.json | bot/.iaia_auth/lid-mapping-15599338008756_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-156220946145488_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-156220946145488_reverse.json | bot/.iaia_auth/lid-mapping-156220946145488_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-156397023010894_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-156397023010894_reverse.json | bot/.iaia_auth/lid-mapping-156397023010894_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-156620411695259_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-156620411695259_reverse.json | bot/.iaia_auth/lid-mapping-156620411695259_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-157036939579571_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-157036939579571_reverse.json | bot/.iaia_auth/lid-mapping-157036939579571_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-157054153048318_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-157054153048318_reverse.json | bot/.iaia_auth/lid-mapping-157054153048318_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-157084234588269_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-157084234588269_reverse.json | bot/.iaia_auth/lid-mapping-157084234588269_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-157127100346426_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-157127100346426_reverse.json | bot/.iaia_auth/lid-mapping-157127100346426_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-157152853422099_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-157152853422099_reverse.json | bot/.iaia_auth/lid-mapping-157152853422099_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-157191625539770_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-157191625539770_reverse.json | bot/.iaia_auth/lid-mapping-157191625539770_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-157337570525401_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-157337570525401_reverse.json | bot/.iaia_auth/lid-mapping-157337570525401_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-157449306824717_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-157449306824717_reverse.json | bot/.iaia_auth/lid-mapping-157449306824717_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-157762822603003_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-157762822603003_reverse.json | bot/.iaia_auth/lid-mapping-157762822603003_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-157827230388348_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-157827230388348_reverse.json | bot/.iaia_auth/lid-mapping-157827230388348_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-158020470370307_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-158020470370307_reverse.json | bot/.iaia_auth/lid-mapping-158020470370307_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-158308317028510_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-158308317028510_reverse.json | bot/.iaia_auth/lid-mapping-158308317028510_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-158389837545553_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-158389837545553_reverse.json | bot/.iaia_auth/lid-mapping-158389837545553_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-158522998272075_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-158522998272075_reverse.json | bot/.iaia_auth/lid-mapping-158522998272075_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-159047051391128_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-159047051391128_reverse.json | bot/.iaia_auth/lid-mapping-159047051391128_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-159953188868287_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-159953188868287_reverse.json | bot/.iaia_auth/lid-mapping-159953188868287_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-160000450273447_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-160000450273447_reverse.json | bot/.iaia_auth/lid-mapping-160000450273447_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-160125104951497_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-160125104951497_reverse.json | bot/.iaia_auth/lid-mapping-160125104951497_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-160275462357236_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-160275462357236_reverse.json | bot/.iaia_auth/lid-mapping-160275462357236_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-160309771772111_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-160309771772111_reverse.json | bot/.iaia_auth/lid-mapping-160309771772111_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-160335558373525_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-160335558373525_reverse.json | bot/.iaia_auth/lid-mapping-160335558373525_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-160992587714715_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-160992587714715_reverse.json | bot/.iaia_auth/lid-mapping-160992587714715_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-161108635713675_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-161108635713675_reverse.json | bot/.iaia_auth/lid-mapping-161108635713675_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-161173060210929_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-161173060210929_reverse.json | bot/.iaia_auth/lid-mapping-161173060210929_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-16123324031040_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-16123324031040_reverse.json | bot/.iaia_auth/lid-mapping-16123324031040_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-161336235413696_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-161336235413696_reverse.json | bot/.iaia_auth/lid-mapping-161336235413696_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-161357710278722_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-161357710278722_reverse.json | bot/.iaia_auth/lid-mapping-161357710278722_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-161495082078286_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-161495082078286_reverse.json | bot/.iaia_auth/lid-mapping-161495082078286_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-161589722362065_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-161589722362065_reverse.json | bot/.iaia_auth/lid-mapping-161589722362065_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-161993466101779_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-161993466101779_reverse.json | bot/.iaia_auth/lid-mapping-161993466101779_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-162023497322504_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-162023497322504_reverse.json | bot/.iaia_auth/lid-mapping-162023497322504_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-16204945219704_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-16204945219704_reverse.json | bot/.iaia_auth/lid-mapping-16204945219704_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-162281144999955_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-162281144999955_reverse.json | bot/.iaia_auth/lid-mapping-162281144999955_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-162547365892288_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-162547365892288_reverse.json | bot/.iaia_auth/lid-mapping-162547365892288_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-162620430639271_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-162620430639271_reverse.json | bot/.iaia_auth/lid-mapping-162620430639271_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-162732099792912_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-162732099792912_reverse.json | bot/.iaia_auth/lid-mapping-162732099792912_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-162890996781220_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-162890996781220_reverse.json | bot/.iaia_auth/lid-mapping-162890996781220_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-16303729430687_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-16303729430687_reverse.json | bot/.iaia_auth/lid-mapping-16303729430687_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-16351108288753_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-16351108288753_reverse.json | bot/.iaia_auth/lid-mapping-16351108288753_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-163518800248899_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-163518800248899_reverse.json | bot/.iaia_auth/lid-mapping-163518800248899_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-163767186940136_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-163767186940136_reverse.json | bot/.iaia_auth/lid-mapping-163767186940136_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-163990609125432_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-163990609125432_reverse.json | bot/.iaia_auth/lid-mapping-163990609125432_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-164196633342015_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-164196633342015_reverse.json | bot/.iaia_auth/lid-mapping-164196633342015_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-165382027497478_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-165382027497478_reverse.json | bot/.iaia_auth/lid-mapping-165382027497478_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-165601154740263_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-165601154740263_reverse.json | bot/.iaia_auth/lid-mapping-165601154740263_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-165850279620840_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-165850279620840_reverse.json | bot/.iaia_auth/lid-mapping-165850279620840_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-165897524220015_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-165897524220015_reverse.json | bot/.iaia_auth/lid-mapping-165897524220015_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-16634559332460_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-16634559332460_reverse.json | bot/.iaia_auth/lid-mapping-16634559332460_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-166391479025788_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-166391479025788_reverse.json | bot/.iaia_auth/lid-mapping-166391479025788_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-166554637451291_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-166554637451291_reverse.json | bot/.iaia_auth/lid-mapping-166554637451291_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-166631913304206_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-166631913304206_reverse.json | bot/.iaia_auth/lid-mapping-166631913304206_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-166683486486608_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-166683486486608_reverse.json | bot/.iaia_auth/lid-mapping-166683486486608_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-166838172389389_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-166838172389389_reverse.json | bot/.iaia_auth/lid-mapping-166838172389389_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-16698899964091_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-16698899964091_reverse.json | bot/.iaia_auth/lid-mapping-16698899964091_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-167052803322068_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-167052803322068_reverse.json | bot/.iaia_auth/lid-mapping-167052803322068_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-167069983187172_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-167069983187172_reverse.json | bot/.iaia_auth/lid-mapping-167069983187172_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-167143064764617_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-167143064764617_reverse.json | bot/.iaia_auth/lid-mapping-167143064764617_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-167168901693450_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-167168901693450_reverse.json | bot/.iaia_auth/lid-mapping-167168901693450_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-167203110392042_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-167203110392042_reverse.json | bot/.iaia_auth/lid-mapping-167203110392042_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-167246177521912_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-167246177521912_reverse.json | bot/.iaia_auth/lid-mapping-167246177521912_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-167430844375161_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-167430844375161_reverse.json | bot/.iaia_auth/lid-mapping-167430844375161_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-167439467806727_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-167439467806727_reverse.json | bot/.iaia_auth/lid-mapping-167439467806727_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-168126595510363_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-168126595510363_reverse.json | bot/.iaia_auth/lid-mapping-168126595510363_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-168190952890605_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-168190952890605_reverse.json | bot/.iaia_auth/lid-mapping-168190952890605_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-168203955220639_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-168203955220639_reverse.json | bot/.iaia_auth/lid-mapping-168203955220639_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-168311279120570_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-168311279120570_reverse.json | bot/.iaia_auth/lid-mapping-168311279120570_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-168771427819649_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-168771427819649_reverse.json | bot/.iaia_auth/lid-mapping-168771427819649_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-168951447347288_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-168951447347288_reverse.json | bot/.iaia_auth/lid-mapping-168951447347288_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-16900797034625_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-16900797034625_reverse.json | bot/.iaia_auth/lid-mapping-16900797034625_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-16913631559726_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-16913631559726_reverse.json | bot/.iaia_auth/lid-mapping-16913631559726_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-169230385328356_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-169230385328356_reverse.json | bot/.iaia_auth/lid-mapping-169230385328356_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-169238924922919_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-169238924922919_reverse.json | bot/.iaia_auth/lid-mapping-169238924922919_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-169625488720052_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-169625488720052_reverse.json | bot/.iaia_auth/lid-mapping-169625488720052_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-169698603864077_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-169698603864077_reverse.json | bot/.iaia_auth/lid-mapping-169698603864077_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-170514513457204_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-170514513457204_reverse.json | bot/.iaia_auth/lid-mapping-170514513457204_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-170536156065849_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-170536156065849_reverse.json | bot/.iaia_auth/lid-mapping-170536156065849_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-171253281337356_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-171253281337356_reverse.json | bot/.iaia_auth/lid-mapping-171253281337356_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-171450849845298_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-171450849845298_reverse.json | bot/.iaia_auth/lid-mapping-171450849845298_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-171618487775326_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-171618487775326_reverse.json | bot/.iaia_auth/lid-mapping-171618487775326_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-17184281600041_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-17184281600041_reverse.json | bot/.iaia_auth/lid-mapping-17184281600041_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-172090833543398_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-172090833543398_reverse.json | bot/.iaia_auth/lid-mapping-172090833543398_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-172241190948947_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-172241190948947_reverse.json | bot/.iaia_auth/lid-mapping-172241190948947_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-172520397357282_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-172520397357282_reverse.json | bot/.iaia_auth/lid-mapping-172520397357282_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-172859699765345_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-172859699765345_reverse.json | bot/.iaia_auth/lid-mapping-172859699765345_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-173070052495393_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-173070052495393_reverse.json | bot/.iaia_auth/lid-mapping-173070052495393_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-173336340521143_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-173336340521143_reverse.json | bot/.iaia_auth/lid-mapping-173336340521143_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-173495237513329_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-173495237513329_reverse.json | bot/.iaia_auth/lid-mapping-173495237513329_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-173624271077438_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-173624271077438_reverse.json | bot/.iaia_auth/lid-mapping-173624271077438_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-174238401073401_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-174238401073401_reverse.json | bot/.iaia_auth/lid-mapping-174238401073401_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-17424934027266_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-17424934027266_reverse.json | bot/.iaia_auth/lid-mapping-17424934027266_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-174457377284156_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-174457377284156_reverse.json | bot/.iaia_auth/lid-mapping-174457377284156_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-174706502176980_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-174706502176980_reverse.json | bot/.iaia_auth/lid-mapping-174706502176980_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-174762890371187_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-174762890371187_reverse.json | bot/.iaia_auth/lid-mapping-174762890371187_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-175208962994214_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-175208962994214_reverse.json | bot/.iaia_auth/lid-mapping-175208962994214_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-176626402885744_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-176626402885744_reverse.json | bot/.iaia_auth/lid-mapping-176626402885744_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-176823887466541_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-176823887466541_reverse.json | bot/.iaia_auth/lid-mapping-176823887466541_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-177038619066400_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-177038619066400_reverse.json | bot/.iaia_auth/lid-mapping-177038619066400_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-177116549259407_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-177116549259407_reverse.json | bot/.iaia_auth/lid-mapping-177116549259407_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-177163156381768_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-177163156381768_reverse.json | bot/.iaia_auth/lid-mapping-177163156381768_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-17742593835100_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-17742593835100_reverse.json | bot/.iaia_auth/lid-mapping-17742593835100_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-177446640975907_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-177446640975907_reverse.json | bot/.iaia_auth/lid-mapping-177446640975907_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-177712878612564_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-177712878612564_reverse.json | bot/.iaia_auth/lid-mapping-177712878612564_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-178601987207230_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-178601987207230_reverse.json | bot/.iaia_auth/lid-mapping-178601987207230_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-178640708997318_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-178640708997318_reverse.json | bot/.iaia_auth/lid-mapping-178640708997318_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-178679246282906_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-178679246282906_reverse.json | bot/.iaia_auth/lid-mapping-178679246282906_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-178722447573246_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-178722447573246_reverse.json | bot/.iaia_auth/lid-mapping-178722447573246_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-178988618141866_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-178988618141866_reverse.json | bot/.iaia_auth/lid-mapping-178988618141866_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-179061531918509_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-179061531918509_reverse.json | bot/.iaia_auth/lid-mapping-179061531918509_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-179551879622838_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-179551879622838_reverse.json | bot/.iaia_auth/lid-mapping-179551879622838_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-18002428478.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-18002428478.json | bot/.iaia_auth/lid-mapping-18002428478.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-180053669335189_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-180053669335189_reverse.json | bot/.iaia_auth/lid-mapping-180053669335189_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-180178206626039_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-180178206626039_reverse.json | bot/.iaia_auth/lid-mapping-180178206626039_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-180195436838932_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-180195436838932_reverse.json | bot/.iaia_auth/lid-mapping-180195436838932_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-180199698247803_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-180199698247803_reverse.json | bot/.iaia_auth/lid-mapping-180199698247803_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-180487997943853_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-180487997943853_reverse.json | bot/.iaia_auth/lid-mapping-180487997943853_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-180521921441860_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-180521921441860_reverse.json | bot/.iaia_auth/lid-mapping-180521921441860_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-180835353391251_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-180835353391251_reverse.json | bot/.iaia_auth/lid-mapping-180835353391251_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-181110248108082_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-181110248108082_reverse.json | bot/.iaia_auth/lid-mapping-181110248108082_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-181733085458493_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-181733085458493_reverse.json | bot/.iaia_auth/lid-mapping-181733085458493_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-181806150221998_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-181806150221998_reverse.json | bot/.iaia_auth/lid-mapping-181806150221998_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-181848965644516_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-181848965644516_reverse.json | bot/.iaia_auth/lid-mapping-181848965644516_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-182390131556393_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-182390131556393_reverse.json | bot/.iaia_auth/lid-mapping-182390131556393_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-182669304402071_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-182669304402071_reverse.json | bot/.iaia_auth/lid-mapping-182669304402071_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-182720894390444_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-182720894390444_reverse.json | bot/.iaia_auth/lid-mapping-182720894390444_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-183141868298278_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-183141868298278_reverse.json | bot/.iaia_auth/lid-mapping-183141868298278_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-183197686067323_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-183197686067323_reverse.json | bot/.iaia_auth/lid-mapping-183197686067323_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-18334363285.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-18334363285.json | bot/.iaia_auth/lid-mapping-18334363285.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-18361018806385_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-18361018806385_reverse.json | bot/.iaia_auth/lid-mapping-18361018806385_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-183738768048260_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-183738768048260_reverse.json | bot/.iaia_auth/lid-mapping-183738768048260_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-184237034614813_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-184237034614813_reverse.json | bot/.iaia_auth/lid-mapping-184237034614813_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-184335802097911_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-184335802097911_reverse.json | bot/.iaia_auth/lid-mapping-184335802097911_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-185272121729225_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-185272121729225_reverse.json | bot/.iaia_auth/lid-mapping-185272121729225_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-185345236848883_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-185345236848883_reverse.json | bot/.iaia_auth/lid-mapping-185345236848883_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-185598623117379_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-185598623117379_reverse.json | bot/.iaia_auth/lid-mapping-185598623117379_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-185813304352788_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-185813304352788_reverse.json | bot/.iaia_auth/lid-mapping-185813304352788_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-185830517805116_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-185830517805116_reverse.json | bot/.iaia_auth/lid-mapping-185830517805116_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-186156952100912_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-186156952100912_reverse.json | bot/.iaia_auth/lid-mapping-186156952100912_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-186238506127415_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-186238506127415_reverse.json | bot/.iaia_auth/lid-mapping-186238506127415_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-186539120279594_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-186539120279594_reverse.json | bot/.iaia_auth/lid-mapping-186539120279594_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-186844012650629_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-186844012650629_reverse.json | bot/.iaia_auth/lid-mapping-186844012650629_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-186955849552045_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-186955849552045_reverse.json | bot/.iaia_auth/lid-mapping-186955849552045_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-187458343948485_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-187458343948485_reverse.json | bot/.iaia_auth/lid-mapping-187458343948485_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-187617240973508_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-187617240973508_reverse.json | bot/.iaia_auth/lid-mapping-187617240973508_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-18772241042.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-18772241042.json | bot/.iaia_auth/lid-mapping-18772241042.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-187771842998299_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-187771842998299_reverse.json | bot/.iaia_auth/lid-mapping-187771842998299_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-188179898474692_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-188179898474692_reverse.json | bot/.iaia_auth/lid-mapping-188179898474692_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-188450313613463_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-188450313613463_reverse.json | bot/.iaia_auth/lid-mapping-188450313613463_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-188476720955547_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-188476720955547_reverse.json | bot/.iaia_auth/lid-mapping-188476720955547_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-188841189191703_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-188841189191703_reverse.json | bot/.iaia_auth/lid-mapping-188841189191703_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-188871203676414_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-188871203676414_reverse.json | bot/.iaia_auth/lid-mapping-188871203676414_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-188888534495324_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-188888534495324_reverse.json | bot/.iaia_auth/lid-mapping-188888534495324_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-189120378884308_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-189120378884308_reverse.json | bot/.iaia_auth/lid-mapping-189120378884308_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-189167589957722_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-189167589957722_reverse.json | bot/.iaia_auth/lid-mapping-189167589957722_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-189176179859601_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-189176179859601_reverse.json | bot/.iaia_auth/lid-mapping-189176179859601_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-189348129583258_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-189348129583258_reverse.json | bot/.iaia_auth/lid-mapping-189348129583258_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-189382371885135_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-189382371885135_reverse.json | bot/.iaia_auth/lid-mapping-189382371885135_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-189438290309303_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-189438290309303_reverse.json | bot/.iaia_auth/lid-mapping-189438290309303_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-189696038715393_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-189696038715393_reverse.json | bot/.iaia_auth/lid-mapping-189696038715393_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-189820492075184_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-189820492075184_reverse.json | bot/.iaia_auth/lid-mapping-189820492075184_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-189936523284510_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-189936523284510_reverse.json | bot/.iaia_auth/lid-mapping-189936523284510_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-190563504631906_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-190563504631906_reverse.json | bot/.iaia_auth/lid-mapping-190563504631906_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-19069755461790_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-19069755461790_reverse.json | bot/.iaia_auth/lid-mapping-19069755461790_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-191250649116736_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-191250649116736_reverse.json | bot/.iaia_auth/lid-mapping-191250649116736_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-191315073618157_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-191315073618157_reverse.json | bot/.iaia_auth/lid-mapping-191315073618157_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-191667244114073_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-191667244114073_reverse.json | bot/.iaia_auth/lid-mapping-191667244114073_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-19173129323.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-19173129323.json | bot/.iaia_auth/lid-mapping-19173129323.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-191766028402830_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-191766028402830_reverse.json | bot/.iaia_auth/lid-mapping-191766028402830_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-192006680793116_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-192006680793116_reverse.json | bot/.iaia_auth/lid-mapping-192006680793116_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-192066776772834_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-192066776772834_reverse.json | bot/.iaia_auth/lid-mapping-192066776772834_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-192084074078211_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-192084074078211_reverse.json | bot/.iaia_auth/lid-mapping-192084074078211_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-192341671469102_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-192341671469102_reverse.json | bot/.iaia_auth/lid-mapping-192341671469102_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-192423208742915_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-192423208742915_reverse.json | bot/.iaia_auth/lid-mapping-192423208742915_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-192676745998340_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-192676745998340_reverse.json | bot/.iaia_auth/lid-mapping-192676745998340_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-192891393699957_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-192891393699957_reverse.json | bot/.iaia_auth/lid-mapping-192891393699957_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-193406739464419_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-193406739464419_reverse.json | bot/.iaia_auth/lid-mapping-193406739464419_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-193694535798803_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-193694535798803_reverse.json | bot/.iaia_auth/lid-mapping-193694535798803_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-194033871794331_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-194033871794331_reverse.json | bot/.iaia_auth/lid-mapping-194033871794331_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-194592100077571_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-194592100077571_reverse.json | bot/.iaia_auth/lid-mapping-194592100077571_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-195017368985777_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-195017368985777_reverse.json | bot/.iaia_auth/lid-mapping-195017368985777_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-195330851250337_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-195330851250337_reverse.json | bot/.iaia_auth/lid-mapping-195330851250337_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-195335246893290_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-195335246893290_reverse.json | bot/.iaia_auth/lid-mapping-195335246893290_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-195597105664118_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-195597105664118_reverse.json | bot/.iaia_auth/lid-mapping-195597105664118_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-19580789502096_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-19580789502096_reverse.json | bot/.iaia_auth/lid-mapping-19580789502096_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-195906494324872_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-195906494324872_reverse.json | bot/.iaia_auth/lid-mapping-195906494324872_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-195979559071874_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-195979559071874_reverse.json | bot/.iaia_auth/lid-mapping-195979559071874_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-196207024578686_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-196207024578686_reverse.json | bot/.iaia_auth/lid-mapping-196207024578686_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-196344497074323_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-196344497074323_reverse.json | bot/.iaia_auth/lid-mapping-196344497074323_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-19645230764271_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-19645230764271_reverse.json | bot/.iaia_auth/lid-mapping-19645230764271_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-196988826026087_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-196988826026087_reverse.json | bot/.iaia_auth/lid-mapping-196988826026087_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-197134838198287_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-197134838198287_reverse.json | bot/.iaia_auth/lid-mapping-197134838198287_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-197427449573414_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-197427449573414_reverse.json | bot/.iaia_auth/lid-mapping-197427449573414_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-197671725854858_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-197671725854858_reverse.json | bot/.iaia_auth/lid-mapping-197671725854858_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-19774180433990_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-19774180433990_reverse.json | bot/.iaia_auth/lid-mapping-19774180433990_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-197779049718014_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-197779049718014_reverse.json | bot/.iaia_auth/lid-mapping-197779049718014_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-198105383317661_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-198105383317661_reverse.json | bot/.iaia_auth/lid-mapping-198105383317661_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-198156922962067_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-198156922962067_reverse.json | bot/.iaia_auth/lid-mapping-198156922962067_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-198212757536878_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-198212757536878_reverse.json | bot/.iaia_auth/lid-mapping-198212757536878_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-198307397820622_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-198307397820622_reverse.json | bot/.iaia_auth/lid-mapping-198307397820622_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-198582242144312_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-198582242144312_reverse.json | bot/.iaia_auth/lid-mapping-198582242144312_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-199484067815543_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-199484067815543_reverse.json | bot/.iaia_auth/lid-mapping-199484067815543_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-199617329291278_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-199617329291278_reverse.json | bot/.iaia_auth/lid-mapping-199617329291278_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-199789379596485_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-199789379596485_reverse.json | bot/.iaia_auth/lid-mapping-199789379596485_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-199999547797517_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-199999547797517_reverse.json | bot/.iaia_auth/lid-mapping-199999547797517_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-200020972277799_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-200020972277799_reverse.json | bot/.iaia_auth/lid-mapping-200020972277799_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-200115495108634_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-200115495108634_reverse.json | bot/.iaia_auth/lid-mapping-200115495108634_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-200467766370363_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-200467766370363_reverse.json | bot/.iaia_auth/lid-mapping-200467766370363_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-200815591608512_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-200815591608512_reverse.json | bot/.iaia_auth/lid-mapping-200815591608512_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-200862752370784_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-200862752370784_reverse.json | bot/.iaia_auth/lid-mapping-200862752370784_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-201416853450864_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-201416853450864_reverse.json | bot/.iaia_auth/lid-mapping-201416853450864_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-201704582697000_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-201704582697000_reverse.json | bot/.iaia_auth/lid-mapping-201704582697000_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-202078228066493_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-202078228066493_reverse.json | bot/.iaia_auth/lid-mapping-202078228066493_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-202765674524859_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-202765674524859_reverse.json | bot/.iaia_auth/lid-mapping-202765674524859_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-203229346459801_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-203229346459801_reverse.json | bot/.iaia_auth/lid-mapping-203229346459801_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-203718905573475_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-203718905573475_reverse.json | bot/.iaia_auth/lid-mapping-203718905573475_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-203847838519304_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-203847838519304_reverse.json | bot/.iaia_auth/lid-mapping-203847838519304_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-203890838474777_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-203890838474777_reverse.json | bot/.iaia_auth/lid-mapping-203890838474777_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-204101308653745_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-204101308653745_reverse.json | bot/.iaia_auth/lid-mapping-204101308653745_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-204122766753828_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-204122766753828_reverse.json | bot/.iaia_auth/lid-mapping-204122766753828_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-204135651606697_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-204135651606697_reverse.json | bot/.iaia_auth/lid-mapping-204135651606697_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-204157126443066_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-204157126443066_reverse.json | bot/.iaia_auth/lid-mapping-204157126443066_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-204324647006418_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-204324647006418_reverse.json | bot/.iaia_auth/lid-mapping-204324647006418_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-204423397642384_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-204423397642384_reverse.json | bot/.iaia_auth/lid-mapping-204423397642384_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-204470642331653_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-204470642331653_reverse.json | bot/.iaia_auth/lid-mapping-204470642331653_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-204483493662826_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-204483493662826_reverse.json | bot/.iaia_auth/lid-mapping-204483493662826_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-205054690779385_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-205054690779385_reverse.json | bot/.iaia_auth/lid-mapping-205054690779385_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-205578760650982_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-205578760650982_reverse.json | bot/.iaia_auth/lid-mapping-205578760650982_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-205716199628959_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-205716199628959_reverse.json | bot/.iaia_auth/lid-mapping-205716199628959_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-205716216406180_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-205716216406180_reverse.json | bot/.iaia_auth/lid-mapping-205716216406180_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-20624500068410_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-20624500068410_reverse.json | bot/.iaia_auth/lid-mapping-20624500068410_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-206291859464196_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-206291859464196_reverse.json | bot/.iaia_auth/lid-mapping-206291859464196_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-206360411136088_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-206360411136088_reverse.json | bot/.iaia_auth/lid-mapping-206360411136088_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-20654531280937_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-20654531280937_reverse.json | bot/.iaia_auth/lid-mapping-20654531280937_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-20658876616881_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-20658876616881_reverse.json | bot/.iaia_auth/lid-mapping-20658876616881_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-207120670670914_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-207120670670914_reverse.json | bot/.iaia_auth/lid-mapping-207120670670914_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-207185095221308_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-207185095221308_reverse.json | bot/.iaia_auth/lid-mapping-207185095221308_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-207464184164466_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-207464184164466_reverse.json | bot/.iaia_auth/lid-mapping-207464184164466_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-207764848693306_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-207764848693306_reverse.json | bot/.iaia_auth/lid-mapping-207764848693306_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-207859304378445_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-207859304378445_reverse.json | bot/.iaia_auth/lid-mapping-207859304378445_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-20804939022378_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-20804939022378_reverse.json | bot/.iaia_auth/lid-mapping-20804939022378_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-208692595163362_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-208692595163362_reverse.json | bot/.iaia_auth/lid-mapping-208692595163362_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-208782739173441_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-208782739173441_reverse.json | bot/.iaia_auth/lid-mapping-208782739173441_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-20890754510903_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-20890754510903_reverse.json | bot/.iaia_auth/lid-mapping-20890754510903_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-209349708406793_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-209349708406793_reverse.json | bot/.iaia_auth/lid-mapping-209349708406793_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-209393043914832_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-209393043914832_reverse.json | bot/.iaia_auth/lid-mapping-209393043914832_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-209521423159335_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-209521423159335_reverse.json | bot/.iaia_auth/lid-mapping-209521423159335_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-20976687419584_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-20976687419584_reverse.json | bot/.iaia_auth/lid-mapping-20976687419584_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-209770631958569_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-209770631958569_reverse.json | bot/.iaia_auth/lid-mapping-209770631958569_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-210195867250863_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-210195867250863_reverse.json | bot/.iaia_auth/lid-mapping-210195867250863_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-210260275019880_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-210260275019880_reverse.json | bot/.iaia_auth/lid-mapping-210260275019880_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-210719786160340_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-210719786160340_reverse.json | bot/.iaia_auth/lid-mapping-210719786160340_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-211102071795866_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-211102071795866_reverse.json | bot/.iaia_auth/lid-mapping-211102071795866_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-211226558750726_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-211226558750726_reverse.json | bot/.iaia_auth/lid-mapping-211226558750726_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-21140030414967_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-21140030414967_reverse.json | bot/.iaia_auth/lid-mapping-21140030414967_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-211445568561201_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-211445568561201_reverse.json | bot/.iaia_auth/lid-mapping-211445568561201_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-21182795538627_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-21182795538627_reverse.json | bot/.iaia_auth/lid-mapping-21182795538627_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-212042585747702_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-212042585747702_reverse.json | bot/.iaia_auth/lid-mapping-212042585747702_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-21234402201631_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-21234402201631_reverse.json | bot/.iaia_auth/lid-mapping-21234402201631_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-212472166367378_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-212472166367378_reverse.json | bot/.iaia_auth/lid-mapping-212472166367378_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-212536607698976_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-212536607698976_reverse.json | bot/.iaia_auth/lid-mapping-212536607698976_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-21264567631928_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-21264567631928_reverse.json | bot/.iaia_auth/lid-mapping-21264567631928_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-213163639361770_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-213163639361770_reverse.json | bot/.iaia_auth/lid-mapping-213163639361770_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-213803488780400_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-213803488780400_reverse.json | bot/.iaia_auth/lid-mapping-213803488780400_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-214026978066633_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-214026978066633_reverse.json | bot/.iaia_auth/lid-mapping-214026978066633_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-214048419389672_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-214048419389672_reverse.json | bot/.iaia_auth/lid-mapping-214048419389672_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-214169181753482_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-214169181753482_reverse.json | bot/.iaia_auth/lid-mapping-214169181753482_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-214469292650608_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-214469292650608_reverse.json | bot/.iaia_auth/lid-mapping-214469292650608_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-214529438933176_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-214529438933176_reverse.json | bot/.iaia_auth/lid-mapping-214529438933176_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-214645369528468_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-214645369528468_reverse.json | bot/.iaia_auth/lid-mapping-214645369528468_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-214761400713360_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-214761400713360_reverse.json | bot/.iaia_auth/lid-mapping-214761400713360_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-214976065220665_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-214976065220665_reverse.json | bot/.iaia_auth/lid-mapping-214976065220665_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-215319629058246_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-215319629058246_reverse.json | bot/.iaia_auth/lid-mapping-215319629058246_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-215951056335076_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-215951056335076_reverse.json | bot/.iaia_auth/lid-mapping-215951056335076_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-216045612711962_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-216045612711962_reverse.json | bot/.iaia_auth/lid-mapping-216045612711962_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-216109919801398_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-216109919801398_reverse.json | bot/.iaia_auth/lid-mapping-216109919801398_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-216410684977162_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-216410684977162_reverse.json | bot/.iaia_auth/lid-mapping-216410684977162_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-216526565204101_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-216526565204101_reverse.json | bot/.iaia_auth/lid-mapping-216526565204101_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-216638922166360_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-216638922166360_reverse.json | bot/.iaia_auth/lid-mapping-216638922166360_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-217145023680603_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-217145023680603_reverse.json | bot/.iaia_auth/lid-mapping-217145023680603_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-217213776691409_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-217213776691409_reverse.json | bot/.iaia_auth/lid-mapping-217213776691409_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-217518702608516_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-217518702608516_reverse.json | bot/.iaia_auth/lid-mapping-217518702608516_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-217669127131185_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-217669127131185_reverse.json | bot/.iaia_auth/lid-mapping-217669127131185_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-217677683544089_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-217677683544089_reverse.json | bot/.iaia_auth/lid-mapping-217677683544089_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-218034048364647_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-218034048364647_reverse.json | bot/.iaia_auth/lid-mapping-218034048364647_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-218102834954292_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-218102834954292_reverse.json | bot/.iaia_auth/lid-mapping-218102834954292_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-218150180266218_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-218150180266218_reverse.json | bot/.iaia_auth/lid-mapping-218150180266218_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-218235945369694_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-218235945369694_reverse.json | bot/.iaia_auth/lid-mapping-218235945369694_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-218240190038072_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-218240190038072_reverse.json | bot/.iaia_auth/lid-mapping-218240190038072_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-218411988729997_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-218411988729997_reverse.json | bot/.iaia_auth/lid-mapping-218411988729997_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-218433547432019_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-218433547432019_reverse.json | bot/.iaia_auth/lid-mapping-218433547432019_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-218523657883743_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-218523657883743_reverse.json | bot/.iaia_auth/lid-mapping-218523657883743_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-219039137816652_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-219039137816652_reverse.json | bot/.iaia_auth/lid-mapping-219039137816652_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-219060696518799_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-219060696518799_reverse.json | bot/.iaia_auth/lid-mapping-219060696518799_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-21913007046875_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-21913007046875_reverse.json | bot/.iaia_auth/lid-mapping-21913007046875_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-219176643915852_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-219176643915852_reverse.json | bot/.iaia_auth/lid-mapping-219176643915852_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-220100498075758_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-220100498075758_reverse.json | bot/.iaia_auth/lid-mapping-220100498075758_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-220503822311441_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-220503822311441_reverse.json | bot/.iaia_auth/lid-mapping-220503822311441_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-220873122406446_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-220873122406446_reverse.json | bot/.iaia_auth/lid-mapping-220873122406446_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-220946019438692_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-220946019438692_reverse.json | bot/.iaia_auth/lid-mapping-220946019438692_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-221057755664589_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-221057755664589_reverse.json | bot/.iaia_auth/lid-mapping-221057755664589_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-22119199043596_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-22119199043596_reverse.json | bot/.iaia_auth/lid-mapping-22119199043596_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-221195211399202_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-221195211399202_reverse.json | bot/.iaia_auth/lid-mapping-221195211399202_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-221285388910783_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-221285388910783_reverse.json | bot/.iaia_auth/lid-mapping-221285388910783_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-221891566559300_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-221891566559300_reverse.json | bot/.iaia_auth/lid-mapping-221891566559300_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-222591058993323_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-222591058993323_reverse.json | bot/.iaia_auth/lid-mapping-222591058993323_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-222818742616300_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-222818742616300_reverse.json | bot/.iaia_auth/lid-mapping-222818742616300_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-223166685270022_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-223166685270022_reverse.json | bot/.iaia_auth/lid-mapping-223166685270022_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-22334433923144_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-22334433923144_reverse.json | bot/.iaia_auth/lid-mapping-22334433923144_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-223368515215475_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-223368515215475_reverse.json | bot/.iaia_auth/lid-mapping-223368515215475_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-223806467657742_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-223806467657742_reverse.json | bot/.iaia_auth/lid-mapping-223806467657742_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-224261784490236_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-224261784490236_reverse.json | bot/.iaia_auth/lid-mapping-224261784490236_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-224395029119142_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-224395029119142_reverse.json | bot/.iaia_auth/lid-mapping-224395029119142_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-224588285931615_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-224588285931615_reverse.json | bot/.iaia_auth/lid-mapping-224588285931615_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-225326902812787_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-225326902812787_reverse.json | bot/.iaia_auth/lid-mapping-225326902812787_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-225361346441276_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-225361346441276_reverse.json | bot/.iaia_auth/lid-mapping-225361346441276_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-225550425682067_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-225550425682067_reverse.json | bot/.iaia_auth/lid-mapping-225550425682067_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-226151553310897_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-226151553310897_reverse.json | bot/.iaia_auth/lid-mapping-226151553310897_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-226400728567891_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-226400728567891_reverse.json | bot/.iaia_auth/lid-mapping-226400728567891_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-226598313807992_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-226598313807992_reverse.json | bot/.iaia_auth/lid-mapping-226598313807992_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-226666949427400_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-226666949427400_reverse.json | bot/.iaia_auth/lid-mapping-226666949427400_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-226714160476226_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-226714160476226_reverse.json | bot/.iaia_auth/lid-mapping-226714160476226_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-226778668896503_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-226778668896503_reverse.json | bot/.iaia_auth/lid-mapping-226778668896503_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-226912400076923_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-226912400076923_reverse.json | bot/.iaia_auth/lid-mapping-226912400076923_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-22707542462697_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-22707542462697_reverse.json | bot/.iaia_auth/lid-mapping-22707542462697_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-227384276049939_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-227384276049939_reverse.json | bot/.iaia_auth/lid-mapping-227384276049939_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-227444405628941_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-227444405628941_reverse.json | bot/.iaia_auth/lid-mapping-227444405628941_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-227702137196679_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-227702137196679_reverse.json | bot/.iaia_auth/lid-mapping-227702137196679_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-228101502054578_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-228101502054578_reverse.json | bot/.iaia_auth/lid-mapping-228101502054578_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-228127372525586_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-228127372525586_reverse.json | bot/.iaia_auth/lid-mapping-228127372525586_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-22819463237657_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-22819463237657_reverse.json | bot/.iaia_auth/lid-mapping-22819463237657_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-228419430256703_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-228419430256703_reverse.json | bot/.iaia_auth/lid-mapping-228419430256703_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-22849309900933_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-22849309900933_reverse.json | bot/.iaia_auth/lid-mapping-22849309900933_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-228539639038143_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-228539639038143_reverse.json | bot/.iaia_auth/lid-mapping-228539639038143_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-22879341166721_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-22879341166721_reverse.json | bot/.iaia_auth/lid-mapping-22879341166721_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-228883639066643_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-228883639066643_reverse.json | bot/.iaia_auth/lid-mapping-228883639066643_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-228913217319004_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-228913217319004_reverse.json | bot/.iaia_auth/lid-mapping-228913217319004_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-228943416271037_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-228943416271037_reverse.json | bot/.iaia_auth/lid-mapping-228943416271037_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-229102195875909_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-229102195875909_reverse.json | bot/.iaia_auth/lid-mapping-229102195875909_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-22913835081959_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-22913835081959_reverse.json | bot/.iaia_auth/lid-mapping-22913835081959_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-229630476816632_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-229630476816632_reverse.json | bot/.iaia_auth/lid-mapping-229630476816632_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-229974241988645_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-229974241988645_reverse.json | bot/.iaia_auth/lid-mapping-229974241988645_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-230090055118894_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-230090055118894_reverse.json | bot/.iaia_auth/lid-mapping-230090055118894_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-2302186405894_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-2302186405894_reverse.json | bot/.iaia_auth/lid-mapping-2302186405894_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-230223215866043_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-230223215866043_reverse.json | bot/.iaia_auth/lid-mapping-230223215866043_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-230545439097073_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-230545439097073_reverse.json | bot/.iaia_auth/lid-mapping-230545439097073_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-231069341233265_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-231069341233265_reverse.json | bot/.iaia_auth/lid-mapping-231069341233265_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-231099439575094_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-231099439575094_reverse.json | bot/.iaia_auth/lid-mapping-231099439575094_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-231392067743870_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-231392067743870_reverse.json | bot/.iaia_auth/lid-mapping-231392067743870_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-231404331860100_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-231404331860100_reverse.json | bot/.iaia_auth/lid-mapping-231404331860100_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-231627737268252_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-231627737268252_reverse.json | bot/.iaia_auth/lid-mapping-231627737268252_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-232405092819180_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-232405092819180_reverse.json | bot/.iaia_auth/lid-mapping-232405092819180_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-232633145495669_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-232633145495669_reverse.json | bot/.iaia_auth/lid-mapping-232633145495669_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-232701378478194_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-232701378478194_reverse.json | bot/.iaia_auth/lid-mapping-232701378478194_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-232843162738747_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-232843162738747_reverse.json | bot/.iaia_auth/lid-mapping-232843162738747_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-233057894326428_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-233057894326428_reverse.json | bot/.iaia_auth/lid-mapping-233057894326428_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-233199712080017_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-233199712080017_reverse.json | bot/.iaia_auth/lid-mapping-233199712080017_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-233332772212905_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-233332772212905_reverse.json | bot/.iaia_auth/lid-mapping-233332772212905_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-233676487041155_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-233676487041155_reverse.json | bot/.iaia_auth/lid-mapping-233676487041155_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-233869659885611_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-233869659885611_reverse.json | bot/.iaia_auth/lid-mapping-233869659885611_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-233886806196428_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-233886806196428_reverse.json | bot/.iaia_auth/lid-mapping-233886806196428_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-234084475375747_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-234084475375747_reverse.json | bot/.iaia_auth/lid-mapping-234084475375747_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-234449446904022_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-234449446904022_reverse.json | bot/.iaia_auth/lid-mapping-234449446904022_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-23446293581901_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-23446293581901_reverse.json | bot/.iaia_auth/lid-mapping-23446293581901_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-234646965117051_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-234646965117051_reverse.json | bot/.iaia_auth/lid-mapping-234646965117051_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-235235409174703_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-235235409174703_reverse.json | bot/.iaia_auth/lid-mapping-235235409174703_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-236330575499460_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-236330575499460_reverse.json | bot/.iaia_auth/lid-mapping-236330575499460_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-236330659389654_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-236330659389654_reverse.json | bot/.iaia_auth/lid-mapping-236330659389654_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-236360824823890_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-236360824823890_reverse.json | bot/.iaia_auth/lid-mapping-236360824823890_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-236811695685852_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-236811695685852_reverse.json | bot/.iaia_auth/lid-mapping-236811695685852_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-236824630972444_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-236824630972444_reverse.json | bot/.iaia_auth/lid-mapping-236824630972444_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-237129489715381_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-237129489715381_reverse.json | bot/.iaia_auth/lid-mapping-237129489715381_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-237219684024500_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-237219684024500_reverse.json | bot/.iaia_auth/lid-mapping-237219684024500_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-237868291219692_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-237868291219692_reverse.json | bot/.iaia_auth/lid-mapping-237868291219692_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-238147346677990_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-238147346677990_reverse.json | bot/.iaia_auth/lid-mapping-238147346677990_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-238190480900270_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-238190480900270_reverse.json | bot/.iaia_auth/lid-mapping-238190480900270_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-238297771204663_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-238297771204663_reverse.json | bot/.iaia_auth/lid-mapping-238297771204663_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-238362212487226_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-238362212487226_reverse.json | bot/.iaia_auth/lid-mapping-238362212487226_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-238409524187391_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-238409524187391_reverse.json | bot/.iaia_auth/lid-mapping-238409524187391_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-238718728302675_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-238718728302675_reverse.json | bot/.iaia_auth/lid-mapping-238718728302675_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-239070831767732_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-239070831767732_reverse.json | bot/.iaia_auth/lid-mapping-239070831767732_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-239659225497633_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-239659225497633_reverse.json | bot/.iaia_auth/lid-mapping-239659225497633_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-239710848954584_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-239710848954584_reverse.json | bot/.iaia_auth/lid-mapping-239710848954584_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-239775307043057_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-239775307043057_reverse.json | bot/.iaia_auth/lid-mapping-239775307043057_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-239831158403276_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-239831158403276_reverse.json | bot/.iaia_auth/lid-mapping-239831158403276_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-240354976596015_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-240354976596015_reverse.json | bot/.iaia_auth/lid-mapping-240354976596015_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-240552578646257_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-240552578646257_reverse.json | bot/.iaia_auth/lid-mapping-240552578646257_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-240780748804216_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-240780748804216_reverse.json | bot/.iaia_auth/lid-mapping-240780748804216_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-24086344368248_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-24086344368248_reverse.json | bot/.iaia_auth/lid-mapping-24086344368248_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-240952044171349_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-240952044171349_reverse.json | bot/.iaia_auth/lid-mapping-240952044171349_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-241605013467369_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-241605013467369_reverse.json | bot/.iaia_auth/lid-mapping-241605013467369_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-241634876887217_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-241634876887217_reverse.json | bot/.iaia_auth/lid-mapping-241634876887217_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-241755186315504_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-241755186315504_reverse.json | bot/.iaia_auth/lid-mapping-241755186315504_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-241780956094665_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-241780956094665_reverse.json | bot/.iaia_auth/lid-mapping-241780956094665_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-242171747807473_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-242171747807473_reverse.json | bot/.iaia_auth/lid-mapping-242171747807473_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-242450937450622_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-242450937450622_reverse.json | bot/.iaia_auth/lid-mapping-242450937450622_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-242622719389847_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-242622719389847_reverse.json | bot/.iaia_auth/lid-mapping-242622719389847_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-242863338172640_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-242863338172640_reverse.json | bot/.iaia_auth/lid-mapping-242863338172640_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-243507600089323_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-243507600089323_reverse.json | bot/.iaia_auth/lid-mapping-243507600089323_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-243735132659909_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-243735132659909_reverse.json | bot/.iaia_auth/lid-mapping-243735132659909_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-243924144787695_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-243924144787695_reverse.json | bot/.iaia_auth/lid-mapping-243924144787695_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-243942012514468_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-243942012514468_reverse.json | bot/.iaia_auth/lid-mapping-243942012514468_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-244581224456434_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-244581224456434_reverse.json | bot/.iaia_auth/lid-mapping-244581224456434_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-244740272480408_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-244740272480408_reverse.json | bot/.iaia_auth/lid-mapping-244740272480408_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-244744466780342_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-244744466780342_reverse.json | bot/.iaia_auth/lid-mapping-244744466780342_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-245019394969628_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-245019394969628_reverse.json | bot/.iaia_auth/lid-mapping-245019394969628_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-245049476518079_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-245049476518079_reverse.json | bot/.iaia_auth/lid-mapping-245049476518079_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-245122490990609_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-245122490990609_reverse.json | bot/.iaia_auth/lid-mapping-245122490990609_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-245204028264629_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-245204028264629_reverse.json | bot/.iaia_auth/lid-mapping-245204028264629_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-245320025956354_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-245320025956354_reverse.json | bot/.iaia_auth/lid-mapping-245320025956354_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-245770963968177_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-245770963968177_reverse.json | bot/.iaia_auth/lid-mapping-245770963968177_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-245938434129940_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-245938434129940_reverse.json | bot/.iaia_auth/lid-mapping-245938434129940_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-24657457635414_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-24657457635414_reverse.json | bot/.iaia_auth/lid-mapping-24657457635414_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-246771825565926_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-246771825565926_reverse.json | bot/.iaia_auth/lid-mapping-246771825565926_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-246943506813155_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-246943506813155_reverse.json | bot/.iaia_auth/lid-mapping-246943506813155_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-246990902431859_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-246990902431859_reverse.json | bot/.iaia_auth/lid-mapping-246990902431859_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-247445984415776_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-247445984415776_reverse.json | bot/.iaia_auth/lid-mapping-247445984415776_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-247622111608858_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-247622111608858_reverse.json | bot/.iaia_auth/lid-mapping-247622111608858_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-247738293870662_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-247738293870662_reverse.json | bot/.iaia_auth/lid-mapping-247738293870662_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-247862612984052_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-247862612984052_reverse.json | bot/.iaia_auth/lid-mapping-247862612984052_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-248433927573633_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-248433927573633_reverse.json | bot/.iaia_auth/lid-mapping-248433927573633_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-24846469726348_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-24846469726348_reverse.json | bot/.iaia_auth/lid-mapping-24846469726348_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-248743114842357_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-248743114842357_reverse.json | bot/.iaia_auth/lid-mapping-248743114842357_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-249095251820754_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-249095251820754_reverse.json | bot/.iaia_auth/lid-mapping-249095251820754_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-249365885136950_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-249365885136950_reverse.json | bot/.iaia_auth/lid-mapping-249365885136950_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-249516225769635_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-249516225769635_reverse.json | bot/.iaia_auth/lid-mapping-249516225769635_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-249520520716450_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-249520520716450_reverse.json | bot/.iaia_auth/lid-mapping-249520520716450_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-249610765390049_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-249610765390049_reverse.json | bot/.iaia_auth/lid-mapping-249610765390049_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-249791153983518_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-249791153983518_reverse.json | bot/.iaia_auth/lid-mapping-249791153983518_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-250160437264504_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-250160437264504_reverse.json | bot/.iaia_auth/lid-mapping-250160437264504_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-250392399089709_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-250392399089709_reverse.json | bot/.iaia_auth/lid-mapping-250392399089709_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-250435248066633_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-250435248066633_reverse.json | bot/.iaia_auth/lid-mapping-250435248066633_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-25104117403748_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-25104117403748_reverse.json | bot/.iaia_auth/lid-mapping-25104117403748_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-251066776047866_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-251066776047866_reverse.json | bot/.iaia_auth/lid-mapping-251066776047866_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-251113936822274_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-251113936822274_reverse.json | bot/.iaia_auth/lid-mapping-251113936822274_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-251603512733778_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-251603512733778_reverse.json | bot/.iaia_auth/lid-mapping-251603512733778_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-251882735964208_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-251882735964208_reverse.json | bot/.iaia_auth/lid-mapping-251882735964208_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-251891325874303_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-251891325874303_reverse.json | bot/.iaia_auth/lid-mapping-251891325874303_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-252690173038663_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-252690173038663_reverse.json | bot/.iaia_auth/lid-mapping-252690173038663_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-252715909267558_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-252715909267558_reverse.json | bot/.iaia_auth/lid-mapping-252715909267558_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-25280328556554_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-25280328556554_reverse.json | bot/.iaia_auth/lid-mapping-25280328556554_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-253072441925758_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-253072441925758_reverse.json | bot/.iaia_auth/lid-mapping-253072441925758_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-253467612463113_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-253467612463113_reverse.json | bot/.iaia_auth/lid-mapping-253467612463113_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-253725193039893_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-253725193039893_reverse.json | bot/.iaia_auth/lid-mapping-253725193039893_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-253832667910278_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-253832667910278_reverse.json | bot/.iaia_auth/lid-mapping-253832667910278_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-253982891057373_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-253982891057373_reverse.json | bot/.iaia_auth/lid-mapping-253982891057373_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-254657301618888_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-254657301618888_reverse.json | bot/.iaia_auth/lid-mapping-254657301618888_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-254734560714990_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-254734560714990_reverse.json | bot/.iaia_auth/lid-mapping-254734560714990_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-25537959432375_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-25537959432375_reverse.json | bot/.iaia_auth/lid-mapping-25537959432375_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-25547170177133_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-25547170177133_reverse.json | bot/.iaia_auth/lid-mapping-25547170177133_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-255529247068361_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-255529247068361_reverse.json | bot/.iaia_auth/lid-mapping-255529247068361_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-256538480533729_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-256538480533729_reverse.json | bot/.iaia_auth/lid-mapping-256538480533729_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-256667312718060_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-256667312718060_reverse.json | bot/.iaia_auth/lid-mapping-256667312718060_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-256942224236784_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-256942224236784_reverse.json | bot/.iaia_auth/lid-mapping-256942224236784_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-257440490766424_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-257440490766424_reverse.json | bot/.iaia_auth/lid-mapping-257440490766424_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-257998802952322_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-257998802952322_reverse.json | bot/.iaia_auth/lid-mapping-257998802952322_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-258557199024291_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-258557199024291_reverse.json | bot/.iaia_auth/lid-mapping-258557199024291_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-258570083938390_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-258570083938390_reverse.json | bot/.iaia_auth/lid-mapping-258570083938390_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-258801961840873_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-258801961840873_reverse.json | bot/.iaia_auth/lid-mapping-258801961840873_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-259025300140215_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-259025300140215_reverse.json | bot/.iaia_auth/lid-mapping-259025300140215_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-259493384478840_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-259493384478840_reverse.json | bot/.iaia_auth/lid-mapping-259493384478840_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-259570744189141_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-259570744189141_reverse.json | bot/.iaia_auth/lid-mapping-259570744189141_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-259635202281517_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-259635202281517_reverse.json | bot/.iaia_auth/lid-mapping-259635202281517_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-259854312693847_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-259854312693847_reverse.json | bot/.iaia_auth/lid-mapping-259854312693847_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-260206449655845_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-260206449655845_reverse.json | bot/.iaia_auth/lid-mapping-260206449655845_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-260326624887007_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-260326624887007_reverse.json | bot/.iaia_auth/lid-mapping-260326624887007_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-260455591358595_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-260455591358595_reverse.json | bot/.iaia_auth/lid-mapping-260455591358595_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-260489816838217_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-260489816838217_reverse.json | bot/.iaia_auth/lid-mapping-260489816838217_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-261018064298096_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-261018064298096_reverse.json | bot/.iaia_auth/lid-mapping-261018064298096_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-261443249279107_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-261443249279107_reverse.json | bot/.iaia_auth/lid-mapping-261443249279107_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-261456167706720_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-261456167706720_reverse.json | bot/.iaia_auth/lid-mapping-261456167706720_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-261941599723593_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-261941599723593_reverse.json | bot/.iaia_auth/lid-mapping-261941599723593_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-262164854100078_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-262164854100078_reverse.json | bot/.iaia_auth/lid-mapping-262164854100078_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-262504156532841_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-262504156532841_reverse.json | bot/.iaia_auth/lid-mapping-262504156532841_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-262646024679469_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-262646024679469_reverse.json | bot/.iaia_auth/lid-mapping-262646024679469_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-2628603920627_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-2628603920627_reverse.json | bot/.iaia_auth/lid-mapping-2628603920627_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-262972291170345_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-262972291170345_reverse.json | bot/.iaia_auth/lid-mapping-262972291170345_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-262998044209177_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-262998044209177_reverse.json | bot/.iaia_auth/lid-mapping-262998044209177_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-263019602964680_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-263019602964680_reverse.json | bot/.iaia_auth/lid-mapping-263019602964680_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-263324595949793_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-263324595949793_reverse.json | bot/.iaia_auth/lid-mapping-263324595949793_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-263586488295553_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-263586488295553_reverse.json | bot/.iaia_auth/lid-mapping-263586488295553_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-263741207793711_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-263741207793711_reverse.json | bot/.iaia_auth/lid-mapping-263741207793711_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-263818500432119_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-263818500432119_reverse.json | bot/.iaia_auth/lid-mapping-263818500432119_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-264424644415523_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-264424644415523_reverse.json | bot/.iaia_auth/lid-mapping-264424644415523_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-264441304248465_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-264441304248465_reverse.json | bot/.iaia_auth/lid-mapping-264441304248465_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-264776210985096_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-264776210985096_reverse.json | bot/.iaia_auth/lid-mapping-264776210985096_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-264836390903992_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-264836390903992_reverse.json | bot/.iaia_auth/lid-mapping-264836390903992_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-26491475775507_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-26491475775507_reverse.json | bot/.iaia_auth/lid-mapping-26491475775507_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-265192873185431_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-265192873185431_reverse.json | bot/.iaia_auth/lid-mapping-265192873185431_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-265209985949748_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-265209985949748_reverse.json | bot/.iaia_auth/lid-mapping-265209985949748_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-265265937936447_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-265265937936447_reverse.json | bot/.iaia_auth/lid-mapping-265265937936447_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-265386180243651_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-265386180243651_reverse.json | bot/.iaia_auth/lid-mapping-265386180243651_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-265716892700852_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-265716892700852_reverse.json | bot/.iaia_auth/lid-mapping-265716892700852_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-265751185387554_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-265751185387554_reverse.json | bot/.iaia_auth/lid-mapping-265751185387554_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-266099195179060_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-266099195179060_reverse.json | bot/.iaia_auth/lid-mapping-266099195179060_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-266124914643130_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-266124914643130_reverse.json | bot/.iaia_auth/lid-mapping-266124914643130_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-266309531091074_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-266309531091074_reverse.json | bot/.iaia_auth/lid-mapping-266309531091074_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-266855059066967_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-266855059066967_reverse.json | bot/.iaia_auth/lid-mapping-266855059066967_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-267099788288066_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-267099788288066_reverse.json | bot/.iaia_auth/lid-mapping-267099788288066_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-267164145733712_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-267164145733712_reverse.json | bot/.iaia_auth/lid-mapping-267164145733712_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-267452009181419_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-267452009181419_reverse.json | bot/.iaia_auth/lid-mapping-267452009181419_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-267516383342786_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-267516383342786_reverse.json | bot/.iaia_auth/lid-mapping-267516383342786_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-267675330695402_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-267675330695402_reverse.json | bot/.iaia_auth/lid-mapping-267675330695402_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-267769853542568_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-267769853542568_reverse.json | bot/.iaia_auth/lid-mapping-267769853542568_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-267834227740878_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-267834227740878_reverse.json | bot/.iaia_auth/lid-mapping-267834227740878_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-268040486789126_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-268040486789126_reverse.json | bot/.iaia_auth/lid-mapping-268040486789126_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-268173647552654_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-268173647552654_reverse.json | bot/.iaia_auth/lid-mapping-268173647552654_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-26921039585280_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-26921039585280_reverse.json | bot/.iaia_auth/lid-mapping-26921039585280_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-269776240824555_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-269776240824555_reverse.json | bot/.iaia_auth/lid-mapping-269776240824555_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-269814224412791_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-269814224412791_reverse.json | bot/.iaia_auth/lid-mapping-269814224412791_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-27049955692544_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-27049955692544_reverse.json | bot/.iaia_auth/lid-mapping-27049955692544_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-270617886650468_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-270617886650468_reverse.json | bot/.iaia_auth/lid-mapping-270617886650468_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-270698937339956_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-270698937339956_reverse.json | bot/.iaia_auth/lid-mapping-270698937339956_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-270883738374205_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-270883738374205_reverse.json | bot/.iaia_auth/lid-mapping-270883738374205_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-270896623276261_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-270896623276261_reverse.json | bot/.iaia_auth/lid-mapping-270896623276261_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-27092737638603_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-27092737638603_reverse.json | bot/.iaia_auth/lid-mapping-27092737638603_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-270973848825953_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-270973848825953_reverse.json | bot/.iaia_auth/lid-mapping-270973848825953_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-271042652147858_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-271042652147858_reverse.json | bot/.iaia_auth/lid-mapping-271042652147858_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-271055721619628_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-271055721619628_reverse.json | bot/.iaia_auth/lid-mapping-271055721619628_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-271085601837209_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-271085601837209_reverse.json | bot/.iaia_auth/lid-mapping-271085601837209_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-271205760290890_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-271205760290890_reverse.json | bot/.iaia_auth/lid-mapping-271205760290890_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-271330465296617_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-271330465296617_reverse.json | bot/.iaia_auth/lid-mapping-271330465296617_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-271467770060808_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-271467770060808_reverse.json | bot/.iaia_auth/lid-mapping-271467770060808_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-272227962503301_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-272227962503301_reverse.json | bot/.iaia_auth/lid-mapping-272227962503301_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-272301077590148_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-272301077590148_reverse.json | bot/.iaia_auth/lid-mapping-272301077590148_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-272348255137806_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-272348255137806_reverse.json | bot/.iaia_auth/lid-mapping-272348255137806_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-272442677272612_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-272442677272612_reverse.json | bot/.iaia_auth/lid-mapping-272442677272612_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-272601708503291_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-272601708503291_reverse.json | bot/.iaia_auth/lid-mapping-272601708503291_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-272734785421406_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-272734785421406_reverse.json | bot/.iaia_auth/lid-mapping-272734785421406_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-272992517025793_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-272992517025793_reverse.json | bot/.iaia_auth/lid-mapping-272992517025793_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-273400572453105_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-273400572453105_reverse.json | bot/.iaia_auth/lid-mapping-273400572453105_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-273542188937465_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-273542188937465_reverse.json | bot/.iaia_auth/lid-mapping-273542188937465_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-273645335269448_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-273645335269448_reverse.json | bot/.iaia_auth/lid-mapping-273645335269448_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-27367699390583_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-27367699390583_reverse.json | bot/.iaia_auth/lid-mapping-27367699390583_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-27384929587280_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-27384929587280_reverse.json | bot/.iaia_auth/lid-mapping-27384929587280_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-273907294707898_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-273907294707898_reverse.json | bot/.iaia_auth/lid-mapping-273907294707898_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-274113486680135_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-274113486680135_reverse.json | bot/.iaia_auth/lid-mapping-274113486680135_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-274405594783954_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-274405594783954_reverse.json | bot/.iaia_auth/lid-mapping-274405594783954_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-27470677995659_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-27470677995659_reverse.json | bot/.iaia_auth/lid-mapping-27470677995659_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-275238734557364_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-275238734557364_reverse.json | bot/.iaia_auth/lid-mapping-275238734557364_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-276261473632288_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-276261473632288_reverse.json | bot/.iaia_auth/lid-mapping-276261473632288_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-276450066346060_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-276450066346060_reverse.json | bot/.iaia_auth/lid-mapping-276450066346060_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-27685543759959_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-27685543759959_reverse.json | bot/.iaia_auth/lid-mapping-27685543759959_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-27698328006887_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-27698328006887_reverse.json | bot/.iaia_auth/lid-mapping-27698328006887_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-2770421698578_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-2770421698578_reverse.json | bot/.iaia_auth/lid-mapping-2770421698578_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-277107078893651_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-277107078893651_reverse.json | bot/.iaia_auth/lid-mapping-277107078893651_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-277596772298830_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-277596772298830_reverse.json | bot/.iaia_auth/lid-mapping-277596772298830_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-277656851447815_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-277656851447815_reverse.json | bot/.iaia_auth/lid-mapping-277656851447815_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-278193655267366_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-278193655267366_reverse.json | bot/.iaia_auth/lid-mapping-278193655267366_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-278240916717653_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-278240916717653_reverse.json | bot/.iaia_auth/lid-mapping-278240916717653_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-278477391564964_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-278477391564964_reverse.json | bot/.iaia_auth/lid-mapping-278477391564964_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-278670413398071_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-278670413398071_reverse.json | bot/.iaia_auth/lid-mapping-278670413398071_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-278872343990425_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-278872343990425_reverse.json | bot/.iaia_auth/lid-mapping-278872343990425_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-278902425542660_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-278902425542660_reverse.json | bot/.iaia_auth/lid-mapping-278902425542660_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-279061272211624_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-279061272211624_reverse.json | bot/.iaia_auth/lid-mapping-279061272211624_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-279469277352075_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-279469277352075_reverse.json | bot/.iaia_auth/lid-mapping-279469277352075_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-279486423687261_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-279486423687261_reverse.json | bot/.iaia_auth/lid-mapping-279486423687261_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-279598176719060_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-279598176719060_reverse.json | bot/.iaia_auth/lid-mapping-279598176719060_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-279933200904252_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-279933200904252_reverse.json | bot/.iaia_auth/lid-mapping-279933200904252_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-279980411981942_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-279980411981942_reverse.json | bot/.iaia_auth/lid-mapping-279980411981942_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-279989018746897_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-279989018746897_reverse.json | bot/.iaia_auth/lid-mapping-279989018746897_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-280148016365782_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-280148016365782_reverse.json | bot/.iaia_auth/lid-mapping-280148016365782_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-280255306670212_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-280255306670212_reverse.json | bot/.iaia_auth/lid-mapping-280255306670212_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-280401318813838_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-280401318813838_reverse.json | bot/.iaia_auth/lid-mapping-280401318813838_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-280581707411477_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-280581707411477_reverse.json | bot/.iaia_auth/lid-mapping-280581707411477_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-280826487029841_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-280826487029841_reverse.json | bot/.iaia_auth/lid-mapping-280826487029841_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-281041201790979_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-281041201790979_reverse.json | bot/.iaia_auth/lid-mapping-281041201790979_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-281333360267402_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-281333360267402_reverse.json | bot/.iaia_auth/lid-mapping-281333360267402_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-28355525136639_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-28355525136639_reverse.json | bot/.iaia_auth/lid-mapping-28355525136639_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-28939573575809_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-28939573575809_reverse.json | bot/.iaia_auth/lid-mapping-28939573575809_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-29176031629549_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-29176031629549_reverse.json | bot/.iaia_auth/lid-mapping-29176031629549_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-2942102978767_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-2942102978767_reverse.json | bot/.iaia_auth/lid-mapping-2942102978767_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-29691192864905_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-29691192864905_reverse.json | bot/.iaia_auth/lid-mapping-29691192864905_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-29764224061602_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-29764224061602_reverse.json | bot/.iaia_auth/lid-mapping-29764224061602_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-29824320028910_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-29824320028910_reverse.json | bot/.iaia_auth/lid-mapping-29824320028910_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-29854435131407_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-29854435131407_reverse.json | bot/.iaia_auth/lid-mapping-29854435131407_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-30344061399081_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-30344061399081_reverse.json | bot/.iaia_auth/lid-mapping-30344061399081_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-30357030174864_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-30357030174864_reverse.json | bot/.iaia_auth/lid-mapping-30357030174864_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-30382766444784_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-30382766444784_reverse.json | bot/.iaia_auth/lid-mapping-30382766444784_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-30546126184455_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-30546126184455_reverse.json | bot/.iaia_auth/lid-mapping-30546126184455_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-30683347079346_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-30683347079346_reverse.json | bot/.iaia_auth/lid-mapping-30683347079346_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-30722505109681_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-30722505109681_reverse.json | bot/.iaia_auth/lid-mapping-30722505109681_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-30816826597618_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-30816826597618_reverse.json | bot/.iaia_auth/lid-mapping-30816826597618_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-31228875030597_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-31228875030597_reverse.json | bot/.iaia_auth/lid-mapping-31228875030597_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-31237448147043_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-31237448147043_reverse.json | bot/.iaia_auth/lid-mapping-31237448147043_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-31576784162987_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-31576784162987_reverse.json | bot/.iaia_auth/lid-mapping-31576784162987_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-31612589893.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-31612589893.json | bot/.iaia_auth/lid-mapping-31612589893.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-31623995244609_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-31623995244609_reverse.json | bot/.iaia_auth/lid-mapping-31623995244609_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-31627477687.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-31627477687.json | bot/.iaia_auth/lid-mapping-31627477687.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-31651464426.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-31651464426.json | bot/.iaia_auth/lid-mapping-31651464426.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-31890316742903_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-31890316742903_reverse.json | bot/.iaia_auth/lid-mapping-31890316742903_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-31899292594373_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-31899292594373_reverse.json | bot/.iaia_auth/lid-mapping-31899292594373_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-32306928603191_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-32306928603191_reverse.json | bot/.iaia_auth/lid-mapping-32306928603191_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-32362612183255_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-32362612183255_reverse.json | bot/.iaia_auth/lid-mapping-32362612183255_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-3238606721238_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-3238606721238_reverse.json | bot/.iaia_auth/lid-mapping-3238606721238_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-32475980511.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-32475980511.json | bot/.iaia_auth/lid-mapping-32475980511.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-32477989975.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-32477989975.json | bot/.iaia_auth/lid-mapping-32477989975.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-32762044108895_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-32762044108895_reverse.json | bot/.iaia_auth/lid-mapping-32762044108895_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-33651236540505_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-33651236540505_reverse.json | bot/.iaia_auth/lid-mapping-33651236540505_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-33678299533.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-33678299533.json | bot/.iaia_auth/lid-mapping-33678299533.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-33683734637.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-33683734637.json | bot/.iaia_auth/lid-mapping-33683734637.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-33694152671444_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-33694152671444_reverse.json | bot/.iaia_auth/lid-mapping-33694152671444_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-33728445296782_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-33728445296782_reverse.json | bot/.iaia_auth/lid-mapping-33728445296782_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-33749470662.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-33749470662.json | bot/.iaia_auth/lid-mapping-33749470662.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-33805704421446_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-33805704421446_reverse.json | bot/.iaia_auth/lid-mapping-33805704421446_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-33878785966177_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-33878785966177_reverse.json | bot/.iaia_auth/lid-mapping-33878785966177_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-33883013783686_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-33883013783686_reverse.json | bot/.iaia_auth/lid-mapping-33883013783686_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-33994750058522_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-33994750058522_reverse.json | bot/.iaia_auth/lid-mapping-33994750058522_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-3414650044531_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-3414650044531_reverse.json | bot/.iaia_auth/lid-mapping-3414650044531_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34329707180242_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34329707180242_reverse.json | bot/.iaia_auth/lid-mapping-34329707180242_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600209505.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600209505.json | bot/.iaia_auth/lid-mapping-34600209505.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600225092.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600225092.json | bot/.iaia_auth/lid-mapping-34600225092.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600308470.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600308470.json | bot/.iaia_auth/lid-mapping-34600308470.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600320358.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600320358.json | bot/.iaia_auth/lid-mapping-34600320358.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600417980.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600417980.json | bot/.iaia_auth/lid-mapping-34600417980.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600458455.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600458455.json | bot/.iaia_auth/lid-mapping-34600458455.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600505232.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600505232.json | bot/.iaia_auth/lid-mapping-34600505232.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600524779.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600524779.json | bot/.iaia_auth/lid-mapping-34600524779.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600548319.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600548319.json | bot/.iaia_auth/lid-mapping-34600548319.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600549454.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600549454.json | bot/.iaia_auth/lid-mapping-34600549454.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600631783.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600631783.json | bot/.iaia_auth/lid-mapping-34600631783.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600668805.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600668805.json | bot/.iaia_auth/lid-mapping-34600668805.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600691610.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600691610.json | bot/.iaia_auth/lid-mapping-34600691610.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600719104.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600719104.json | bot/.iaia_auth/lid-mapping-34600719104.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600785966.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600785966.json | bot/.iaia_auth/lid-mapping-34600785966.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34600943135.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34600943135.json | bot/.iaia_auth/lid-mapping-34600943135.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34601981409.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34601981409.json | bot/.iaia_auth/lid-mapping-34601981409.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34602157071.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34602157071.json | bot/.iaia_auth/lid-mapping-34602157071.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34602442856.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34602442856.json | bot/.iaia_auth/lid-mapping-34602442856.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34602445190.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34602445190.json | bot/.iaia_auth/lid-mapping-34602445190.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34603482787.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34603482787.json | bot/.iaia_auth/lid-mapping-34603482787.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34603607514.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34603607514.json | bot/.iaia_auth/lid-mapping-34603607514.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34603681746.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34603681746.json | bot/.iaia_auth/lid-mapping-34603681746.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34603878406.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34603878406.json | bot/.iaia_auth/lid-mapping-34603878406.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34604115879.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34604115879.json | bot/.iaia_auth/lid-mapping-34604115879.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34604242491.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34604242491.json | bot/.iaia_auth/lid-mapping-34604242491.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34605025321.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34605025321.json | bot/.iaia_auth/lid-mapping-34605025321.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34605042525.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34605042525.json | bot/.iaia_auth/lid-mapping-34605042525.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34605082071.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34605082071.json | bot/.iaia_auth/lid-mapping-34605082071.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34605089228.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34605089228.json | bot/.iaia_auth/lid-mapping-34605089228.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34605111871.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34605111871.json | bot/.iaia_auth/lid-mapping-34605111871.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34605168455.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34605168455.json | bot/.iaia_auth/lid-mapping-34605168455.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34605245622.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34605245622.json | bot/.iaia_auth/lid-mapping-34605245622.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34605458437.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34605458437.json | bot/.iaia_auth/lid-mapping-34605458437.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34605479205.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34605479205.json | bot/.iaia_auth/lid-mapping-34605479205.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34605485869.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34605485869.json | bot/.iaia_auth/lid-mapping-34605485869.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34605840414.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34605840414.json | bot/.iaia_auth/lid-mapping-34605840414.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34605863840.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34605863840.json | bot/.iaia_auth/lid-mapping-34605863840.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34605954634.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34605954634.json | bot/.iaia_auth/lid-mapping-34605954634.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606009084.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606009084.json | bot/.iaia_auth/lid-mapping-34606009084.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606022577.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606022577.json | bot/.iaia_auth/lid-mapping-34606022577.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606023325.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606023325.json | bot/.iaia_auth/lid-mapping-34606023325.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606076538.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606076538.json | bot/.iaia_auth/lid-mapping-34606076538.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606102073.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606102073.json | bot/.iaia_auth/lid-mapping-34606102073.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606134931.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606134931.json | bot/.iaia_auth/lid-mapping-34606134931.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606143931.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606143931.json | bot/.iaia_auth/lid-mapping-34606143931.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606174293.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606174293.json | bot/.iaia_auth/lid-mapping-34606174293.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606215594.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606215594.json | bot/.iaia_auth/lid-mapping-34606215594.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606240655.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606240655.json | bot/.iaia_auth/lid-mapping-34606240655.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606277479.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606277479.json | bot/.iaia_auth/lid-mapping-34606277479.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606297940.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606297940.json | bot/.iaia_auth/lid-mapping-34606297940.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606318066.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606318066.json | bot/.iaia_auth/lid-mapping-34606318066.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606394297.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606394297.json | bot/.iaia_auth/lid-mapping-34606394297.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606424723.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606424723.json | bot/.iaia_auth/lid-mapping-34606424723.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606460469.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606460469.json | bot/.iaia_auth/lid-mapping-34606460469.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606599945.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606599945.json | bot/.iaia_auth/lid-mapping-34606599945.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606602625.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606602625.json | bot/.iaia_auth/lid-mapping-34606602625.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606618798.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606618798.json | bot/.iaia_auth/lid-mapping-34606618798.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606664698.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606664698.json | bot/.iaia_auth/lid-mapping-34606664698.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606682485.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606682485.json | bot/.iaia_auth/lid-mapping-34606682485.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606715733.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606715733.json | bot/.iaia_auth/lid-mapping-34606715733.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606732001.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606732001.json | bot/.iaia_auth/lid-mapping-34606732001.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606859808.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606859808.json | bot/.iaia_auth/lid-mapping-34606859808.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606915787.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606915787.json | bot/.iaia_auth/lid-mapping-34606915787.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606957499.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606957499.json | bot/.iaia_auth/lid-mapping-34606957499.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606959361.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606959361.json | bot/.iaia_auth/lid-mapping-34606959361.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606966879.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606966879.json | bot/.iaia_auth/lid-mapping-34606966879.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34606986685.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34606986685.json | bot/.iaia_auth/lid-mapping-34606986685.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607155288.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607155288.json | bot/.iaia_auth/lid-mapping-34607155288.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607232467.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607232467.json | bot/.iaia_auth/lid-mapping-34607232467.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607238236.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607238236.json | bot/.iaia_auth/lid-mapping-34607238236.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607255119.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607255119.json | bot/.iaia_auth/lid-mapping-34607255119.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607291736.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607291736.json | bot/.iaia_auth/lid-mapping-34607291736.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607293219.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607293219.json | bot/.iaia_auth/lid-mapping-34607293219.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607293422.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607293422.json | bot/.iaia_auth/lid-mapping-34607293422.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607333311.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607333311.json | bot/.iaia_auth/lid-mapping-34607333311.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607373295.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607373295.json | bot/.iaia_auth/lid-mapping-34607373295.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607374513.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607374513.json | bot/.iaia_auth/lid-mapping-34607374513.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607390461.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607390461.json | bot/.iaia_auth/lid-mapping-34607390461.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607442690.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607442690.json | bot/.iaia_auth/lid-mapping-34607442690.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607461932.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607461932.json | bot/.iaia_auth/lid-mapping-34607461932.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607514822.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607514822.json | bot/.iaia_auth/lid-mapping-34607514822.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607608621.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607608621.json | bot/.iaia_auth/lid-mapping-34607608621.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607634619.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607634619.json | bot/.iaia_auth/lid-mapping-34607634619.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607637751.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607637751.json | bot/.iaia_auth/lid-mapping-34607637751.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607738410.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607738410.json | bot/.iaia_auth/lid-mapping-34607738410.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607749989.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607749989.json | bot/.iaia_auth/lid-mapping-34607749989.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607803413.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607803413.json | bot/.iaia_auth/lid-mapping-34607803413.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607847316.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607847316.json | bot/.iaia_auth/lid-mapping-34607847316.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607902235.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607902235.json | bot/.iaia_auth/lid-mapping-34607902235.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607921086.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607921086.json | bot/.iaia_auth/lid-mapping-34607921086.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607928799.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607928799.json | bot/.iaia_auth/lid-mapping-34607928799.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34607960383.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34607960383.json | bot/.iaia_auth/lid-mapping-34607960383.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34608033505.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34608033505.json | bot/.iaia_auth/lid-mapping-34608033505.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34608075592.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34608075592.json | bot/.iaia_auth/lid-mapping-34608075592.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34608131913.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34608131913.json | bot/.iaia_auth/lid-mapping-34608131913.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34608199443.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34608199443.json | bot/.iaia_auth/lid-mapping-34608199443.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34608274257.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34608274257.json | bot/.iaia_auth/lid-mapping-34608274257.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34608274904.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34608274904.json | bot/.iaia_auth/lid-mapping-34608274904.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34608375133.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34608375133.json | bot/.iaia_auth/lid-mapping-34608375133.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34608767176.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34608767176.json | bot/.iaia_auth/lid-mapping-34608767176.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609201278.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609201278.json | bot/.iaia_auth/lid-mapping-34609201278.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609232790.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609232790.json | bot/.iaia_auth/lid-mapping-34609232790.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609424504.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609424504.json | bot/.iaia_auth/lid-mapping-34609424504.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609574950.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609574950.json | bot/.iaia_auth/lid-mapping-34609574950.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609604260.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609604260.json | bot/.iaia_auth/lid-mapping-34609604260.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609627581.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609627581.json | bot/.iaia_auth/lid-mapping-34609627581.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609630857.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609630857.json | bot/.iaia_auth/lid-mapping-34609630857.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609631104.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609631104.json | bot/.iaia_auth/lid-mapping-34609631104.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609653894.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609653894.json | bot/.iaia_auth/lid-mapping-34609653894.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609674502.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609674502.json | bot/.iaia_auth/lid-mapping-34609674502.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609674601.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609674601.json | bot/.iaia_auth/lid-mapping-34609674601.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609674701.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609674701.json | bot/.iaia_auth/lid-mapping-34609674701.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609723451.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609723451.json | bot/.iaia_auth/lid-mapping-34609723451.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609741666.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609741666.json | bot/.iaia_auth/lid-mapping-34609741666.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609775376.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609775376.json | bot/.iaia_auth/lid-mapping-34609775376.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34609988846.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34609988846.json | bot/.iaia_auth/lid-mapping-34609988846.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610011686.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610011686.json | bot/.iaia_auth/lid-mapping-34610011686.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610065847.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610065847.json | bot/.iaia_auth/lid-mapping-34610065847.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610221486.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610221486.json | bot/.iaia_auth/lid-mapping-34610221486.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610230593.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610230593.json | bot/.iaia_auth/lid-mapping-34610230593.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610260454.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610260454.json | bot/.iaia_auth/lid-mapping-34610260454.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610282443.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610282443.json | bot/.iaia_auth/lid-mapping-34610282443.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610299239.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610299239.json | bot/.iaia_auth/lid-mapping-34610299239.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610339902.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610339902.json | bot/.iaia_auth/lid-mapping-34610339902.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610361329.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610361329.json | bot/.iaia_auth/lid-mapping-34610361329.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610379664.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610379664.json | bot/.iaia_auth/lid-mapping-34610379664.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610402717.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610402717.json | bot/.iaia_auth/lid-mapping-34610402717.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610469447.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610469447.json | bot/.iaia_auth/lid-mapping-34610469447.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610488900.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610488900.json | bot/.iaia_auth/lid-mapping-34610488900.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610535135.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610535135.json | bot/.iaia_auth/lid-mapping-34610535135.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610543982.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610543982.json | bot/.iaia_auth/lid-mapping-34610543982.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610574515.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610574515.json | bot/.iaia_auth/lid-mapping-34610574515.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610694647.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610694647.json | bot/.iaia_auth/lid-mapping-34610694647.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610870735.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610870735.json | bot/.iaia_auth/lid-mapping-34610870735.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34610885448.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34610885448.json | bot/.iaia_auth/lid-mapping-34610885448.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34611091442.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34611091442.json | bot/.iaia_auth/lid-mapping-34611091442.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34611168958.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34611168958.json | bot/.iaia_auth/lid-mapping-34611168958.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34611317256.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34611317256.json | bot/.iaia_auth/lid-mapping-34611317256.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34611600322.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34611600322.json | bot/.iaia_auth/lid-mapping-34611600322.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34613683645.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34613683645.json | bot/.iaia_auth/lid-mapping-34613683645.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34614182567.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34614182567.json | bot/.iaia_auth/lid-mapping-34614182567.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34615119443.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34615119443.json | bot/.iaia_auth/lid-mapping-34615119443.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34615148856.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34615148856.json | bot/.iaia_auth/lid-mapping-34615148856.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34615159767.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34615159767.json | bot/.iaia_auth/lid-mapping-34615159767.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34615272726.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34615272726.json | bot/.iaia_auth/lid-mapping-34615272726.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34615512760.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34615512760.json | bot/.iaia_auth/lid-mapping-34615512760.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34615569010.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34615569010.json | bot/.iaia_auth/lid-mapping-34615569010.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34615920885.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34615920885.json | bot/.iaia_auth/lid-mapping-34615920885.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34615952574.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34615952574.json | bot/.iaia_auth/lid-mapping-34615952574.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616031911.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616031911.json | bot/.iaia_auth/lid-mapping-34616031911.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616057748.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616057748.json | bot/.iaia_auth/lid-mapping-34616057748.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616090543.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616090543.json | bot/.iaia_auth/lid-mapping-34616090543.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616190872.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616190872.json | bot/.iaia_auth/lid-mapping-34616190872.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616235480.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616235480.json | bot/.iaia_auth/lid-mapping-34616235480.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616258177.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616258177.json | bot/.iaia_auth/lid-mapping-34616258177.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616296762.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616296762.json | bot/.iaia_auth/lid-mapping-34616296762.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616298406.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616298406.json | bot/.iaia_auth/lid-mapping-34616298406.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616310177.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616310177.json | bot/.iaia_auth/lid-mapping-34616310177.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616488398.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616488398.json | bot/.iaia_auth/lid-mapping-34616488398.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616529057.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616529057.json | bot/.iaia_auth/lid-mapping-34616529057.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616545918.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616545918.json | bot/.iaia_auth/lid-mapping-34616545918.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616599089.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616599089.json | bot/.iaia_auth/lid-mapping-34616599089.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616641553.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616641553.json | bot/.iaia_auth/lid-mapping-34616641553.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616652245.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616652245.json | bot/.iaia_auth/lid-mapping-34616652245.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616731750.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616731750.json | bot/.iaia_auth/lid-mapping-34616731750.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616752300.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616752300.json | bot/.iaia_auth/lid-mapping-34616752300.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616760989.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616760989.json | bot/.iaia_auth/lid-mapping-34616760989.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616775834.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616775834.json | bot/.iaia_auth/lid-mapping-34616775834.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616775946.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616775946.json | bot/.iaia_auth/lid-mapping-34616775946.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616787030.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616787030.json | bot/.iaia_auth/lid-mapping-34616787030.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616818760.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616818760.json | bot/.iaia_auth/lid-mapping-34616818760.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616819090.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616819090.json | bot/.iaia_auth/lid-mapping-34616819090.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616840177.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616840177.json | bot/.iaia_auth/lid-mapping-34616840177.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616896147.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616896147.json | bot/.iaia_auth/lid-mapping-34616896147.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616910200.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616910200.json | bot/.iaia_auth/lid-mapping-34616910200.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616910202.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616910202.json | bot/.iaia_auth/lid-mapping-34616910202.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616961216.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616961216.json | bot/.iaia_auth/lid-mapping-34616961216.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34616976274.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34616976274.json | bot/.iaia_auth/lid-mapping-34616976274.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34617011205.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34617011205.json | bot/.iaia_auth/lid-mapping-34617011205.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34617059367.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34617059367.json | bot/.iaia_auth/lid-mapping-34617059367.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34617173752.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34617173752.json | bot/.iaia_auth/lid-mapping-34617173752.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34617211738.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34617211738.json | bot/.iaia_auth/lid-mapping-34617211738.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34617219646.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34617219646.json | bot/.iaia_auth/lid-mapping-34617219646.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34617260967.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34617260967.json | bot/.iaia_auth/lid-mapping-34617260967.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34617441455.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34617441455.json | bot/.iaia_auth/lid-mapping-34617441455.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34617673137.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34617673137.json | bot/.iaia_auth/lid-mapping-34617673137.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34617685692.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34617685692.json | bot/.iaia_auth/lid-mapping-34617685692.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34617712383.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34617712383.json | bot/.iaia_auth/lid-mapping-34617712383.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34617743607.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34617743607.json | bot/.iaia_auth/lid-mapping-34617743607.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34617857233.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34617857233.json | bot/.iaia_auth/lid-mapping-34617857233.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618025185.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618025185.json | bot/.iaia_auth/lid-mapping-34618025185.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618161993.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618161993.json | bot/.iaia_auth/lid-mapping-34618161993.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618171060.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618171060.json | bot/.iaia_auth/lid-mapping-34618171060.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618200763.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618200763.json | bot/.iaia_auth/lid-mapping-34618200763.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618217526.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618217526.json | bot/.iaia_auth/lid-mapping-34618217526.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618223174.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618223174.json | bot/.iaia_auth/lid-mapping-34618223174.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618279918.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618279918.json | bot/.iaia_auth/lid-mapping-34618279918.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618446796.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618446796.json | bot/.iaia_auth/lid-mapping-34618446796.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618468209.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618468209.json | bot/.iaia_auth/lid-mapping-34618468209.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618644206.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618644206.json | bot/.iaia_auth/lid-mapping-34618644206.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618714543.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618714543.json | bot/.iaia_auth/lid-mapping-34618714543.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618766649.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618766649.json | bot/.iaia_auth/lid-mapping-34618766649.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618791613.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618791613.json | bot/.iaia_auth/lid-mapping-34618791613.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618847153.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618847153.json | bot/.iaia_auth/lid-mapping-34618847153.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618884089.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618884089.json | bot/.iaia_auth/lid-mapping-34618884089.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618945143.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618945143.json | bot/.iaia_auth/lid-mapping-34618945143.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34618984062.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34618984062.json | bot/.iaia_auth/lid-mapping-34618984062.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619013690.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619013690.json | bot/.iaia_auth/lid-mapping-34619013690.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619031833.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619031833.json | bot/.iaia_auth/lid-mapping-34619031833.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619048417.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619048417.json | bot/.iaia_auth/lid-mapping-34619048417.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619051650.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619051650.json | bot/.iaia_auth/lid-mapping-34619051650.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619065715.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619065715.json | bot/.iaia_auth/lid-mapping-34619065715.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619068946.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619068946.json | bot/.iaia_auth/lid-mapping-34619068946.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619124914.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619124914.json | bot/.iaia_auth/lid-mapping-34619124914.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619177104.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619177104.json | bot/.iaia_auth/lid-mapping-34619177104.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619186971.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619186971.json | bot/.iaia_auth/lid-mapping-34619186971.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619188852.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619188852.json | bot/.iaia_auth/lid-mapping-34619188852.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619196725.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619196725.json | bot/.iaia_auth/lid-mapping-34619196725.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619221558.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619221558.json | bot/.iaia_auth/lid-mapping-34619221558.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619247860.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619247860.json | bot/.iaia_auth/lid-mapping-34619247860.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619251074.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619251074.json | bot/.iaia_auth/lid-mapping-34619251074.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619368616.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619368616.json | bot/.iaia_auth/lid-mapping-34619368616.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619446179.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619446179.json | bot/.iaia_auth/lid-mapping-34619446179.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619476436.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619476436.json | bot/.iaia_auth/lid-mapping-34619476436.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619526444.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619526444.json | bot/.iaia_auth/lid-mapping-34619526444.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619603072.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619603072.json | bot/.iaia_auth/lid-mapping-34619603072.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619624431.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619624431.json | bot/.iaia_auth/lid-mapping-34619624431.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619648523.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619648523.json | bot/.iaia_auth/lid-mapping-34619648523.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619652727.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619652727.json | bot/.iaia_auth/lid-mapping-34619652727.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619692079.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619692079.json | bot/.iaia_auth/lid-mapping-34619692079.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34619948207.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34619948207.json | bot/.iaia_auth/lid-mapping-34619948207.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620007180.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620007180.json | bot/.iaia_auth/lid-mapping-34620007180.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620049073.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620049073.json | bot/.iaia_auth/lid-mapping-34620049073.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620114719.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620114719.json | bot/.iaia_auth/lid-mapping-34620114719.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620114891.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620114891.json | bot/.iaia_auth/lid-mapping-34620114891.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620126967.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620126967.json | bot/.iaia_auth/lid-mapping-34620126967.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620206880.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620206880.json | bot/.iaia_auth/lid-mapping-34620206880.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620234683.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620234683.json | bot/.iaia_auth/lid-mapping-34620234683.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620298875.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620298875.json | bot/.iaia_auth/lid-mapping-34620298875.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620337306.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620337306.json | bot/.iaia_auth/lid-mapping-34620337306.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620350901.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620350901.json | bot/.iaia_auth/lid-mapping-34620350901.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620383255.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620383255.json | bot/.iaia_auth/lid-mapping-34620383255.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620445221.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620445221.json | bot/.iaia_auth/lid-mapping-34620445221.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620445482.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620445482.json | bot/.iaia_auth/lid-mapping-34620445482.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620458797.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620458797.json | bot/.iaia_auth/lid-mapping-34620458797.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620476907.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620476907.json | bot/.iaia_auth/lid-mapping-34620476907.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620509205.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620509205.json | bot/.iaia_auth/lid-mapping-34620509205.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620554378.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620554378.json | bot/.iaia_auth/lid-mapping-34620554378.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620733260.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620733260.json | bot/.iaia_auth/lid-mapping-34620733260.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620745423.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620745423.json | bot/.iaia_auth/lid-mapping-34620745423.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620751989.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620751989.json | bot/.iaia_auth/lid-mapping-34620751989.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620809670.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620809670.json | bot/.iaia_auth/lid-mapping-34620809670.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620839394.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620839394.json | bot/.iaia_auth/lid-mapping-34620839394.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620895990.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620895990.json | bot/.iaia_auth/lid-mapping-34620895990.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620915284.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620915284.json | bot/.iaia_auth/lid-mapping-34620915284.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620934499.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620934499.json | bot/.iaia_auth/lid-mapping-34620934499.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34620937745.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34620937745.json | bot/.iaia_auth/lid-mapping-34620937745.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34621375486.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34621375486.json | bot/.iaia_auth/lid-mapping-34621375486.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622007325.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622007325.json | bot/.iaia_auth/lid-mapping-34622007325.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622016852.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622016852.json | bot/.iaia_auth/lid-mapping-34622016852.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622036396.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622036396.json | bot/.iaia_auth/lid-mapping-34622036396.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622054413.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622054413.json | bot/.iaia_auth/lid-mapping-34622054413.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622089681.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622089681.json | bot/.iaia_auth/lid-mapping-34622089681.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622092577.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622092577.json | bot/.iaia_auth/lid-mapping-34622092577.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622140328.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622140328.json | bot/.iaia_auth/lid-mapping-34622140328.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622180432.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622180432.json | bot/.iaia_auth/lid-mapping-34622180432.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622218739.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622218739.json | bot/.iaia_auth/lid-mapping-34622218739.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622244092.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622244092.json | bot/.iaia_auth/lid-mapping-34622244092.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622303042.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622303042.json | bot/.iaia_auth/lid-mapping-34622303042.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622436272.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622436272.json | bot/.iaia_auth/lid-mapping-34622436272.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622519212.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622519212.json | bot/.iaia_auth/lid-mapping-34622519212.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622583456.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622583456.json | bot/.iaia_auth/lid-mapping-34622583456.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622585871.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622585871.json | bot/.iaia_auth/lid-mapping-34622585871.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622594078.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622594078.json | bot/.iaia_auth/lid-mapping-34622594078.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622594211.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622594211.json | bot/.iaia_auth/lid-mapping-34622594211.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622760636.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622760636.json | bot/.iaia_auth/lid-mapping-34622760636.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622897085.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622897085.json | bot/.iaia_auth/lid-mapping-34622897085.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34622949372.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34622949372.json | bot/.iaia_auth/lid-mapping-34622949372.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34623155833.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34623155833.json | bot/.iaia_auth/lid-mapping-34623155833.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34623343225.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34623343225.json | bot/.iaia_auth/lid-mapping-34623343225.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34624572846.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34624572846.json | bot/.iaia_auth/lid-mapping-34624572846.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34625033785.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34625033785.json | bot/.iaia_auth/lid-mapping-34625033785.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34625257315.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34625257315.json | bot/.iaia_auth/lid-mapping-34625257315.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34625457314.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34625457314.json | bot/.iaia_auth/lid-mapping-34625457314.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34625485203.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34625485203.json | bot/.iaia_auth/lid-mapping-34625485203.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34625495893.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34625495893.json | bot/.iaia_auth/lid-mapping-34625495893.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34625542783.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34625542783.json | bot/.iaia_auth/lid-mapping-34625542783.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34625661593.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34625661593.json | bot/.iaia_auth/lid-mapping-34625661593.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34625849314.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34625849314.json | bot/.iaia_auth/lid-mapping-34625849314.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34625854969.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34625854969.json | bot/.iaia_auth/lid-mapping-34625854969.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34625951891.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34625951891.json | bot/.iaia_auth/lid-mapping-34625951891.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626029736.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626029736.json | bot/.iaia_auth/lid-mapping-34626029736.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626029859.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626029859.json | bot/.iaia_auth/lid-mapping-34626029859.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626130955.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626130955.json | bot/.iaia_auth/lid-mapping-34626130955.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626141806.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626141806.json | bot/.iaia_auth/lid-mapping-34626141806.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626214788.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626214788.json | bot/.iaia_auth/lid-mapping-34626214788.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626244907.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626244907.json | bot/.iaia_auth/lid-mapping-34626244907.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626283863.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626283863.json | bot/.iaia_auth/lid-mapping-34626283863.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626291767.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626291767.json | bot/.iaia_auth/lid-mapping-34626291767.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626298097.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626298097.json | bot/.iaia_auth/lid-mapping-34626298097.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626341718.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626341718.json | bot/.iaia_auth/lid-mapping-34626341718.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626366531.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626366531.json | bot/.iaia_auth/lid-mapping-34626366531.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626397402.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626397402.json | bot/.iaia_auth/lid-mapping-34626397402.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626424337.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626424337.json | bot/.iaia_auth/lid-mapping-34626424337.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626452801.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626452801.json | bot/.iaia_auth/lid-mapping-34626452801.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626463479.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626463479.json | bot/.iaia_auth/lid-mapping-34626463479.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626467836.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626467836.json | bot/.iaia_auth/lid-mapping-34626467836.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626500711.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626500711.json | bot/.iaia_auth/lid-mapping-34626500711.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626504433.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626504433.json | bot/.iaia_auth/lid-mapping-34626504433.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626510338.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626510338.json | bot/.iaia_auth/lid-mapping-34626510338.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626584717.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626584717.json | bot/.iaia_auth/lid-mapping-34626584717.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626585373.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626585373.json | bot/.iaia_auth/lid-mapping-34626585373.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626606330.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626606330.json | bot/.iaia_auth/lid-mapping-34626606330.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626622951.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626622951.json | bot/.iaia_auth/lid-mapping-34626622951.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626627877.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626627877.json | bot/.iaia_auth/lid-mapping-34626627877.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626669850.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626669850.json | bot/.iaia_auth/lid-mapping-34626669850.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626692872.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626692872.json | bot/.iaia_auth/lid-mapping-34626692872.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626708708.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626708708.json | bot/.iaia_auth/lid-mapping-34626708708.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626718334.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626718334.json | bot/.iaia_auth/lid-mapping-34626718334.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626743996.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626743996.json | bot/.iaia_auth/lid-mapping-34626743996.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626744043.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626744043.json | bot/.iaia_auth/lid-mapping-34626744043.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626773300.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626773300.json | bot/.iaia_auth/lid-mapping-34626773300.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626794428.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626794428.json | bot/.iaia_auth/lid-mapping-34626794428.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626797207.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626797207.json | bot/.iaia_auth/lid-mapping-34626797207.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626808973.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626808973.json | bot/.iaia_auth/lid-mapping-34626808973.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626876498.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626876498.json | bot/.iaia_auth/lid-mapping-34626876498.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626899313.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626899313.json | bot/.iaia_auth/lid-mapping-34626899313.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626947478.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626947478.json | bot/.iaia_auth/lid-mapping-34626947478.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34626981078.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34626981078.json | bot/.iaia_auth/lid-mapping-34626981078.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34627075005.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34627075005.json | bot/.iaia_auth/lid-mapping-34627075005.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34627125939.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34627125939.json | bot/.iaia_auth/lid-mapping-34627125939.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34627239208.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34627239208.json | bot/.iaia_auth/lid-mapping-34627239208.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34627274286.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34627274286.json | bot/.iaia_auth/lid-mapping-34627274286.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34627306505.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34627306505.json | bot/.iaia_auth/lid-mapping-34627306505.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34627403017.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34627403017.json | bot/.iaia_auth/lid-mapping-34627403017.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34627411184.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34627411184.json | bot/.iaia_auth/lid-mapping-34627411184.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34627513942.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34627513942.json | bot/.iaia_auth/lid-mapping-34627513942.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34627680325.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34627680325.json | bot/.iaia_auth/lid-mapping-34627680325.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34627808833.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34627808833.json | bot/.iaia_auth/lid-mapping-34627808833.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34627809828.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34627809828.json | bot/.iaia_auth/lid-mapping-34627809828.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628039568.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628039568.json | bot/.iaia_auth/lid-mapping-34628039568.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628052482.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628052482.json | bot/.iaia_auth/lid-mapping-34628052482.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628060148.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628060148.json | bot/.iaia_auth/lid-mapping-34628060148.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628118582.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628118582.json | bot/.iaia_auth/lid-mapping-34628118582.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628213612.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628213612.json | bot/.iaia_auth/lid-mapping-34628213612.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628247658.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628247658.json | bot/.iaia_auth/lid-mapping-34628247658.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628299934.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628299934.json | bot/.iaia_auth/lid-mapping-34628299934.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628407901.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628407901.json | bot/.iaia_auth/lid-mapping-34628407901.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628410580.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628410580.json | bot/.iaia_auth/lid-mapping-34628410580.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628411649.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628411649.json | bot/.iaia_auth/lid-mapping-34628411649.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628449982.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628449982.json | bot/.iaia_auth/lid-mapping-34628449982.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628472395.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628472395.json | bot/.iaia_auth/lid-mapping-34628472395.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628488610.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628488610.json | bot/.iaia_auth/lid-mapping-34628488610.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628533745.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628533745.json | bot/.iaia_auth/lid-mapping-34628533745.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628557922.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628557922.json | bot/.iaia_auth/lid-mapping-34628557922.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628614233.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628614233.json | bot/.iaia_auth/lid-mapping-34628614233.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628632992.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628632992.json | bot/.iaia_auth/lid-mapping-34628632992.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628689465.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628689465.json | bot/.iaia_auth/lid-mapping-34628689465.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628693248.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628693248.json | bot/.iaia_auth/lid-mapping-34628693248.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628788629.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628788629.json | bot/.iaia_auth/lid-mapping-34628788629.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34628813187.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34628813187.json | bot/.iaia_auth/lid-mapping-34628813187.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629013319.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629013319.json | bot/.iaia_auth/lid-mapping-34629013319.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629020049.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629020049.json | bot/.iaia_auth/lid-mapping-34629020049.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629028707.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629028707.json | bot/.iaia_auth/lid-mapping-34629028707.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629042003.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629042003.json | bot/.iaia_auth/lid-mapping-34629042003.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629049950.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629049950.json | bot/.iaia_auth/lid-mapping-34629049950.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629071350.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629071350.json | bot/.iaia_auth/lid-mapping-34629071350.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629113321.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629113321.json | bot/.iaia_auth/lid-mapping-34629113321.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629127585.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629127585.json | bot/.iaia_auth/lid-mapping-34629127585.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629172792.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629172792.json | bot/.iaia_auth/lid-mapping-34629172792.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629214146.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629214146.json | bot/.iaia_auth/lid-mapping-34629214146.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629283100.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629283100.json | bot/.iaia_auth/lid-mapping-34629283100.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629332422.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629332422.json | bot/.iaia_auth/lid-mapping-34629332422.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629348545.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629348545.json | bot/.iaia_auth/lid-mapping-34629348545.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629351006.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629351006.json | bot/.iaia_auth/lid-mapping-34629351006.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629359750.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629359750.json | bot/.iaia_auth/lid-mapping-34629359750.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629386638.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629386638.json | bot/.iaia_auth/lid-mapping-34629386638.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629430148.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629430148.json | bot/.iaia_auth/lid-mapping-34629430148.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629509546.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629509546.json | bot/.iaia_auth/lid-mapping-34629509546.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629575489.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629575489.json | bot/.iaia_auth/lid-mapping-34629575489.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629604475.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629604475.json | bot/.iaia_auth/lid-mapping-34629604475.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629629149.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629629149.json | bot/.iaia_auth/lid-mapping-34629629149.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629635696.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629635696.json | bot/.iaia_auth/lid-mapping-34629635696.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629687302.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629687302.json | bot/.iaia_auth/lid-mapping-34629687302.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629717620.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629717620.json | bot/.iaia_auth/lid-mapping-34629717620.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629761418.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629761418.json | bot/.iaia_auth/lid-mapping-34629761418.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629788828.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629788828.json | bot/.iaia_auth/lid-mapping-34629788828.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629816802.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629816802.json | bot/.iaia_auth/lid-mapping-34629816802.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629894678.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629894678.json | bot/.iaia_auth/lid-mapping-34629894678.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629951161.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629951161.json | bot/.iaia_auth/lid-mapping-34629951161.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34629991970.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34629991970.json | bot/.iaia_auth/lid-mapping-34629991970.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630034671.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630034671.json | bot/.iaia_auth/lid-mapping-34630034671.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630037391.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630037391.json | bot/.iaia_auth/lid-mapping-34630037391.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630053828.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630053828.json | bot/.iaia_auth/lid-mapping-34630053828.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630073609.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630073609.json | bot/.iaia_auth/lid-mapping-34630073609.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630128994.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630128994.json | bot/.iaia_auth/lid-mapping-34630128994.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630203649.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630203649.json | bot/.iaia_auth/lid-mapping-34630203649.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630207219.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630207219.json | bot/.iaia_auth/lid-mapping-34630207219.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630215162.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630215162.json | bot/.iaia_auth/lid-mapping-34630215162.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630242604.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630242604.json | bot/.iaia_auth/lid-mapping-34630242604.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630250832.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630250832.json | bot/.iaia_auth/lid-mapping-34630250832.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630277366.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630277366.json | bot/.iaia_auth/lid-mapping-34630277366.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630333618.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630333618.json | bot/.iaia_auth/lid-mapping-34630333618.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630349192.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630349192.json | bot/.iaia_auth/lid-mapping-34630349192.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630375064.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630375064.json | bot/.iaia_auth/lid-mapping-34630375064.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630490687.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630490687.json | bot/.iaia_auth/lid-mapping-34630490687.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630603782.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630603782.json | bot/.iaia_auth/lid-mapping-34630603782.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630641123.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630641123.json | bot/.iaia_auth/lid-mapping-34630641123.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630646490.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630646490.json | bot/.iaia_auth/lid-mapping-34630646490.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630657052.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630657052.json | bot/.iaia_auth/lid-mapping-34630657052.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630667575.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630667575.json | bot/.iaia_auth/lid-mapping-34630667575.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630685427.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630685427.json | bot/.iaia_auth/lid-mapping-34630685427.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630692211.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630692211.json | bot/.iaia_auth/lid-mapping-34630692211.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630815221.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630815221.json | bot/.iaia_auth/lid-mapping-34630815221.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630838581.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630838581.json | bot/.iaia_auth/lid-mapping-34630838581.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630858343.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630858343.json | bot/.iaia_auth/lid-mapping-34630858343.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630936146.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630936146.json | bot/.iaia_auth/lid-mapping-34630936146.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630951019.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630951019.json | bot/.iaia_auth/lid-mapping-34630951019.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630974760.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630974760.json | bot/.iaia_auth/lid-mapping-34630974760.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34630990497.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34630990497.json | bot/.iaia_auth/lid-mapping-34630990497.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34631819112.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34631819112.json | bot/.iaia_auth/lid-mapping-34631819112.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34632269502.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34632269502.json | bot/.iaia_auth/lid-mapping-34632269502.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34633055529.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34633055529.json | bot/.iaia_auth/lid-mapping-34633055529.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34633211091.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34633211091.json | bot/.iaia_auth/lid-mapping-34633211091.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34633260509.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34633260509.json | bot/.iaia_auth/lid-mapping-34633260509.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34633302849.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34633302849.json | bot/.iaia_auth/lid-mapping-34633302849.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34633379119.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34633379119.json | bot/.iaia_auth/lid-mapping-34633379119.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34633439021.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34633439021.json | bot/.iaia_auth/lid-mapping-34633439021.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34633482712.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34633482712.json | bot/.iaia_auth/lid-mapping-34633482712.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34633501787.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34633501787.json | bot/.iaia_auth/lid-mapping-34633501787.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34633560067.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34633560067.json | bot/.iaia_auth/lid-mapping-34633560067.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34633655231.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34633655231.json | bot/.iaia_auth/lid-mapping-34633655231.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34633746428.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34633746428.json | bot/.iaia_auth/lid-mapping-34633746428.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34633860666.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34633860666.json | bot/.iaia_auth/lid-mapping-34633860666.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34634300318.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34634300318.json | bot/.iaia_auth/lid-mapping-34634300318.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34634413443.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34634413443.json | bot/.iaia_auth/lid-mapping-34634413443.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34634860567.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34634860567.json | bot/.iaia_auth/lid-mapping-34634860567.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34635082813.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34635082813.json | bot/.iaia_auth/lid-mapping-34635082813.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34635120743.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34635120743.json | bot/.iaia_auth/lid-mapping-34635120743.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34635162828.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34635162828.json | bot/.iaia_auth/lid-mapping-34635162828.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34635199531.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34635199531.json | bot/.iaia_auth/lid-mapping-34635199531.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34635355785.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34635355785.json | bot/.iaia_auth/lid-mapping-34635355785.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34635438325.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34635438325.json | bot/.iaia_auth/lid-mapping-34635438325.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34635459375.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34635459375.json | bot/.iaia_auth/lid-mapping-34635459375.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34635463382.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34635463382.json | bot/.iaia_auth/lid-mapping-34635463382.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34635472919.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34635472919.json | bot/.iaia_auth/lid-mapping-34635472919.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34635477489.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34635477489.json | bot/.iaia_auth/lid-mapping-34635477489.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34635654029.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34635654029.json | bot/.iaia_auth/lid-mapping-34635654029.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34635775664.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34635775664.json | bot/.iaia_auth/lid-mapping-34635775664.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636000763.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636000763.json | bot/.iaia_auth/lid-mapping-34636000763.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636002012.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636002012.json | bot/.iaia_auth/lid-mapping-34636002012.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636031277.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636031277.json | bot/.iaia_auth/lid-mapping-34636031277.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636180441.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636180441.json | bot/.iaia_auth/lid-mapping-34636180441.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636184054.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636184054.json | bot/.iaia_auth/lid-mapping-34636184054.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636259217.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636259217.json | bot/.iaia_auth/lid-mapping-34636259217.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636408618.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636408618.json | bot/.iaia_auth/lid-mapping-34636408618.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636444016.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636444016.json | bot/.iaia_auth/lid-mapping-34636444016.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636444135.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636444135.json | bot/.iaia_auth/lid-mapping-34636444135.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636461702.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636461702.json | bot/.iaia_auth/lid-mapping-34636461702.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636492357.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636492357.json | bot/.iaia_auth/lid-mapping-34636492357.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636503176.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636503176.json | bot/.iaia_auth/lid-mapping-34636503176.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636525642.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636525642.json | bot/.iaia_auth/lid-mapping-34636525642.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636579271.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636579271.json | bot/.iaia_auth/lid-mapping-34636579271.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636650210.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636650210.json | bot/.iaia_auth/lid-mapping-34636650210.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636674428.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636674428.json | bot/.iaia_auth/lid-mapping-34636674428.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636680185.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636680185.json | bot/.iaia_auth/lid-mapping-34636680185.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636681187.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636681187.json | bot/.iaia_auth/lid-mapping-34636681187.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636717149.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636717149.json | bot/.iaia_auth/lid-mapping-34636717149.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636754032.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636754032.json | bot/.iaia_auth/lid-mapping-34636754032.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636759451.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636759451.json | bot/.iaia_auth/lid-mapping-34636759451.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636837083.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636837083.json | bot/.iaia_auth/lid-mapping-34636837083.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636837943.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636837943.json | bot/.iaia_auth/lid-mapping-34636837943.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636838946.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636838946.json | bot/.iaia_auth/lid-mapping-34636838946.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34636923692.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34636923692.json | bot/.iaia_auth/lid-mapping-34636923692.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34637016518.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34637016518.json | bot/.iaia_auth/lid-mapping-34637016518.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34637122488.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34637122488.json | bot/.iaia_auth/lid-mapping-34637122488.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34637211450.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34637211450.json | bot/.iaia_auth/lid-mapping-34637211450.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34637443458.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34637443458.json | bot/.iaia_auth/lid-mapping-34637443458.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34637447776.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34637447776.json | bot/.iaia_auth/lid-mapping-34637447776.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34637547124.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34637547124.json | bot/.iaia_auth/lid-mapping-34637547124.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34637700152.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34637700152.json | bot/.iaia_auth/lid-mapping-34637700152.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34637867433.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34637867433.json | bot/.iaia_auth/lid-mapping-34637867433.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34637867434.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34637867434.json | bot/.iaia_auth/lid-mapping-34637867434.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34638164509.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34638164509.json | bot/.iaia_auth/lid-mapping-34638164509.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34638278144.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34638278144.json | bot/.iaia_auth/lid-mapping-34638278144.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34638473884.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34638473884.json | bot/.iaia_auth/lid-mapping-34638473884.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34638492475.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34638492475.json | bot/.iaia_auth/lid-mapping-34638492475.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34638497448.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34638497448.json | bot/.iaia_auth/lid-mapping-34638497448.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34638572937.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34638572937.json | bot/.iaia_auth/lid-mapping-34638572937.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34638672284.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34638672284.json | bot/.iaia_auth/lid-mapping-34638672284.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34638739018.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34638739018.json | bot/.iaia_auth/lid-mapping-34638739018.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34638762397.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34638762397.json | bot/.iaia_auth/lid-mapping-34638762397.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639050580.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639050580.json | bot/.iaia_auth/lid-mapping-34639050580.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639106243.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639106243.json | bot/.iaia_auth/lid-mapping-34639106243.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639131402.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639131402.json | bot/.iaia_auth/lid-mapping-34639131402.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639138897.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639138897.json | bot/.iaia_auth/lid-mapping-34639138897.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639225163.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639225163.json | bot/.iaia_auth/lid-mapping-34639225163.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639241485.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639241485.json | bot/.iaia_auth/lid-mapping-34639241485.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639266324.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639266324.json | bot/.iaia_auth/lid-mapping-34639266324.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639310185.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639310185.json | bot/.iaia_auth/lid-mapping-34639310185.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639356759.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639356759.json | bot/.iaia_auth/lid-mapping-34639356759.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639356856.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639356856.json | bot/.iaia_auth/lid-mapping-34639356856.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639529980.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639529980.json | bot/.iaia_auth/lid-mapping-34639529980.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639532919.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639532919.json | bot/.iaia_auth/lid-mapping-34639532919.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639593469.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639593469.json | bot/.iaia_auth/lid-mapping-34639593469.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639618706.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639618706.json | bot/.iaia_auth/lid-mapping-34639618706.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639629626.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639629626.json | bot/.iaia_auth/lid-mapping-34639629626.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639636461.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639636461.json | bot/.iaia_auth/lid-mapping-34639636461.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639640994.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639640994.json | bot/.iaia_auth/lid-mapping-34639640994.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639674921.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639674921.json | bot/.iaia_auth/lid-mapping-34639674921.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639684471.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639684471.json | bot/.iaia_auth/lid-mapping-34639684471.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639686810.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639686810.json | bot/.iaia_auth/lid-mapping-34639686810.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639689644.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639689644.json | bot/.iaia_auth/lid-mapping-34639689644.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639694764.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639694764.json | bot/.iaia_auth/lid-mapping-34639694764.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639706226.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639706226.json | bot/.iaia_auth/lid-mapping-34639706226.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639710852.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639710852.json | bot/.iaia_auth/lid-mapping-34639710852.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639733733.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639733733.json | bot/.iaia_auth/lid-mapping-34639733733.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639743267.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639743267.json | bot/.iaia_auth/lid-mapping-34639743267.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639821893.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639821893.json | bot/.iaia_auth/lid-mapping-34639821893.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639841675.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639841675.json | bot/.iaia_auth/lid-mapping-34639841675.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34639888612.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34639888612.json | bot/.iaia_auth/lid-mapping-34639888612.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34640028945.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34640028945.json | bot/.iaia_auth/lid-mapping-34640028945.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34640131990.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34640131990.json | bot/.iaia_auth/lid-mapping-34640131990.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34642109718.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34642109718.json | bot/.iaia_auth/lid-mapping-34642109718.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34642227032.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34642227032.json | bot/.iaia_auth/lid-mapping-34642227032.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34643104770.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34643104770.json | bot/.iaia_auth/lid-mapping-34643104770.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34643652898.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34643652898.json | bot/.iaia_auth/lid-mapping-34643652898.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34643893616.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34643893616.json | bot/.iaia_auth/lid-mapping-34643893616.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34643965502.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34643965502.json | bot/.iaia_auth/lid-mapping-34643965502.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34643972536.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34643972536.json | bot/.iaia_auth/lid-mapping-34643972536.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34644220885.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34644220885.json | bot/.iaia_auth/lid-mapping-34644220885.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34644237408.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34644237408.json | bot/.iaia_auth/lid-mapping-34644237408.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34644239628.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34644239628.json | bot/.iaia_auth/lid-mapping-34644239628.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34644307133.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34644307133.json | bot/.iaia_auth/lid-mapping-34644307133.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34644442436.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34644442436.json | bot/.iaia_auth/lid-mapping-34644442436.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34644520251.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34644520251.json | bot/.iaia_auth/lid-mapping-34644520251.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34645128315.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34645128315.json | bot/.iaia_auth/lid-mapping-34645128315.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34645243670.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34645243670.json | bot/.iaia_auth/lid-mapping-34645243670.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34645488631.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34645488631.json | bot/.iaia_auth/lid-mapping-34645488631.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34645761570.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34645761570.json | bot/.iaia_auth/lid-mapping-34645761570.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34645800073.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34645800073.json | bot/.iaia_auth/lid-mapping-34645800073.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34645905885.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34645905885.json | bot/.iaia_auth/lid-mapping-34645905885.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34645965724.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34645965724.json | bot/.iaia_auth/lid-mapping-34645965724.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34645967295.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34645967295.json | bot/.iaia_auth/lid-mapping-34645967295.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646097442.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646097442.json | bot/.iaia_auth/lid-mapping-34646097442.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646108805.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646108805.json | bot/.iaia_auth/lid-mapping-34646108805.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646124530.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646124530.json | bot/.iaia_auth/lid-mapping-34646124530.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646143043.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646143043.json | bot/.iaia_auth/lid-mapping-34646143043.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646191353.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646191353.json | bot/.iaia_auth/lid-mapping-34646191353.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646196117.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646196117.json | bot/.iaia_auth/lid-mapping-34646196117.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646196363.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646196363.json | bot/.iaia_auth/lid-mapping-34646196363.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646210830.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646210830.json | bot/.iaia_auth/lid-mapping-34646210830.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646214150.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646214150.json | bot/.iaia_auth/lid-mapping-34646214150.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646325378.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646325378.json | bot/.iaia_auth/lid-mapping-34646325378.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646329784.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646329784.json | bot/.iaia_auth/lid-mapping-34646329784.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646330549.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646330549.json | bot/.iaia_auth/lid-mapping-34646330549.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646330708.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646330708.json | bot/.iaia_auth/lid-mapping-34646330708.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646342941.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646342941.json | bot/.iaia_auth/lid-mapping-34646342941.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646379180.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646379180.json | bot/.iaia_auth/lid-mapping-34646379180.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646380458.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646380458.json | bot/.iaia_auth/lid-mapping-34646380458.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646405533.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646405533.json | bot/.iaia_auth/lid-mapping-34646405533.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646464735.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646464735.json | bot/.iaia_auth/lid-mapping-34646464735.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646562026.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646562026.json | bot/.iaia_auth/lid-mapping-34646562026.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646616235.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646616235.json | bot/.iaia_auth/lid-mapping-34646616235.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646644298.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646644298.json | bot/.iaia_auth/lid-mapping-34646644298.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646699965.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646699965.json | bot/.iaia_auth/lid-mapping-34646699965.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646707751.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646707751.json | bot/.iaia_auth/lid-mapping-34646707751.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646729875.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646729875.json | bot/.iaia_auth/lid-mapping-34646729875.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646733169.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646733169.json | bot/.iaia_auth/lid-mapping-34646733169.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646762396.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646762396.json | bot/.iaia_auth/lid-mapping-34646762396.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646769466.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646769466.json | bot/.iaia_auth/lid-mapping-34646769466.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646803922.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646803922.json | bot/.iaia_auth/lid-mapping-34646803922.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646814960.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646814960.json | bot/.iaia_auth/lid-mapping-34646814960.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646864460.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646864460.json | bot/.iaia_auth/lid-mapping-34646864460.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646899942.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646899942.json | bot/.iaia_auth/lid-mapping-34646899942.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646911160.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646911160.json | bot/.iaia_auth/lid-mapping-34646911160.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646917468.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646917468.json | bot/.iaia_auth/lid-mapping-34646917468.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646944448.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646944448.json | bot/.iaia_auth/lid-mapping-34646944448.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34646944640.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34646944640.json | bot/.iaia_auth/lid-mapping-34646944640.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34647079215.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34647079215.json | bot/.iaia_auth/lid-mapping-34647079215.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34647084079.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34647084079.json | bot/.iaia_auth/lid-mapping-34647084079.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34647220908.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34647220908.json | bot/.iaia_auth/lid-mapping-34647220908.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34647370716.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34647370716.json | bot/.iaia_auth/lid-mapping-34647370716.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34647446424.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34647446424.json | bot/.iaia_auth/lid-mapping-34647446424.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34647507796.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34647507796.json | bot/.iaia_auth/lid-mapping-34647507796.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34647508108.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34647508108.json | bot/.iaia_auth/lid-mapping-34647508108.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34647578206.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34647578206.json | bot/.iaia_auth/lid-mapping-34647578206.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34647704965.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34647704965.json | bot/.iaia_auth/lid-mapping-34647704965.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34647734264.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34647734264.json | bot/.iaia_auth/lid-mapping-34647734264.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34647740642.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34647740642.json | bot/.iaia_auth/lid-mapping-34647740642.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34647855626.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34647855626.json | bot/.iaia_auth/lid-mapping-34647855626.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34647874223.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34647874223.json | bot/.iaia_auth/lid-mapping-34647874223.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34647948015.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34647948015.json | bot/.iaia_auth/lid-mapping-34647948015.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34647949511.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34647949511.json | bot/.iaia_auth/lid-mapping-34647949511.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34648123865.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34648123865.json | bot/.iaia_auth/lid-mapping-34648123865.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34648143224.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34648143224.json | bot/.iaia_auth/lid-mapping-34648143224.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34648277918.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34648277918.json | bot/.iaia_auth/lid-mapping-34648277918.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34648294503.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34648294503.json | bot/.iaia_auth/lid-mapping-34648294503.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34648634721.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34648634721.json | bot/.iaia_auth/lid-mapping-34648634721.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34648722808.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34648722808.json | bot/.iaia_auth/lid-mapping-34648722808.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649023928.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649023928.json | bot/.iaia_auth/lid-mapping-34649023928.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649059376.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649059376.json | bot/.iaia_auth/lid-mapping-34649059376.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649116151.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649116151.json | bot/.iaia_auth/lid-mapping-34649116151.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649124101.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649124101.json | bot/.iaia_auth/lid-mapping-34649124101.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649177593.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649177593.json | bot/.iaia_auth/lid-mapping-34649177593.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649178385.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649178385.json | bot/.iaia_auth/lid-mapping-34649178385.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649182294.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649182294.json | bot/.iaia_auth/lid-mapping-34649182294.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649231874.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649231874.json | bot/.iaia_auth/lid-mapping-34649231874.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649280230.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649280230.json | bot/.iaia_auth/lid-mapping-34649280230.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649288039.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649288039.json | bot/.iaia_auth/lid-mapping-34649288039.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649299287.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649299287.json | bot/.iaia_auth/lid-mapping-34649299287.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649299609.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649299609.json | bot/.iaia_auth/lid-mapping-34649299609.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649313601.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649313601.json | bot/.iaia_auth/lid-mapping-34649313601.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649344875.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649344875.json | bot/.iaia_auth/lid-mapping-34649344875.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649370378.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649370378.json | bot/.iaia_auth/lid-mapping-34649370378.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649393379.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649393379.json | bot/.iaia_auth/lid-mapping-34649393379.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649403011.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649403011.json | bot/.iaia_auth/lid-mapping-34649403011.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649440550.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649440550.json | bot/.iaia_auth/lid-mapping-34649440550.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649501580.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649501580.json | bot/.iaia_auth/lid-mapping-34649501580.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649600458.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649600458.json | bot/.iaia_auth/lid-mapping-34649600458.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649656357.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649656357.json | bot/.iaia_auth/lid-mapping-34649656357.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649692593.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649692593.json | bot/.iaia_auth/lid-mapping-34649692593.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649765402.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649765402.json | bot/.iaia_auth/lid-mapping-34649765402.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649786633.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649786633.json | bot/.iaia_auth/lid-mapping-34649786633.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649792151.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649792151.json | bot/.iaia_auth/lid-mapping-34649792151.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649818755.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649818755.json | bot/.iaia_auth/lid-mapping-34649818755.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649936880.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649936880.json | bot/.iaia_auth/lid-mapping-34649936880.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34649992517.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34649992517.json | bot/.iaia_auth/lid-mapping-34649992517.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650064409.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650064409.json | bot/.iaia_auth/lid-mapping-34650064409.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650074166.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650074166.json | bot/.iaia_auth/lid-mapping-34650074166.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650111128.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650111128.json | bot/.iaia_auth/lid-mapping-34650111128.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650129453.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650129453.json | bot/.iaia_auth/lid-mapping-34650129453.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650150596.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650150596.json | bot/.iaia_auth/lid-mapping-34650150596.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650151554.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650151554.json | bot/.iaia_auth/lid-mapping-34650151554.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650204307.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650204307.json | bot/.iaia_auth/lid-mapping-34650204307.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650233851.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650233851.json | bot/.iaia_auth/lid-mapping-34650233851.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650270413.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650270413.json | bot/.iaia_auth/lid-mapping-34650270413.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650351183.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650351183.json | bot/.iaia_auth/lid-mapping-34650351183.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650358089.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650358089.json | bot/.iaia_auth/lid-mapping-34650358089.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650364522.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650364522.json | bot/.iaia_auth/lid-mapping-34650364522.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650408697.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650408697.json | bot/.iaia_auth/lid-mapping-34650408697.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650443129.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650443129.json | bot/.iaia_auth/lid-mapping-34650443129.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650535801.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650535801.json | bot/.iaia_auth/lid-mapping-34650535801.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650549819.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650549819.json | bot/.iaia_auth/lid-mapping-34650549819.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650587344.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650587344.json | bot/.iaia_auth/lid-mapping-34650587344.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650673363.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650673363.json | bot/.iaia_auth/lid-mapping-34650673363.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650693215.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650693215.json | bot/.iaia_auth/lid-mapping-34650693215.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650793409.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650793409.json | bot/.iaia_auth/lid-mapping-34650793409.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650852381.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650852381.json | bot/.iaia_auth/lid-mapping-34650852381.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650916459.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650916459.json | bot/.iaia_auth/lid-mapping-34650916459.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650919559.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650919559.json | bot/.iaia_auth/lid-mapping-34650919559.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650960802.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650960802.json | bot/.iaia_auth/lid-mapping-34650960802.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34650979734.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34650979734.json | bot/.iaia_auth/lid-mapping-34650979734.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34651053503.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34651053503.json | bot/.iaia_auth/lid-mapping-34651053503.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34651185209.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34651185209.json | bot/.iaia_auth/lid-mapping-34651185209.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34651309953.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34651309953.json | bot/.iaia_auth/lid-mapping-34651309953.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34651491482.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34651491482.json | bot/.iaia_auth/lid-mapping-34651491482.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34651628024.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34651628024.json | bot/.iaia_auth/lid-mapping-34651628024.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34651684648.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34651684648.json | bot/.iaia_auth/lid-mapping-34651684648.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34651761570.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34651761570.json | bot/.iaia_auth/lid-mapping-34651761570.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34651768055.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34651768055.json | bot/.iaia_auth/lid-mapping-34651768055.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34651780809.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34651780809.json | bot/.iaia_auth/lid-mapping-34651780809.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34651866040.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34651866040.json | bot/.iaia_auth/lid-mapping-34651866040.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34651883265.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34651883265.json | bot/.iaia_auth/lid-mapping-34651883265.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34652080838.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34652080838.json | bot/.iaia_auth/lid-mapping-34652080838.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34652082454.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34652082454.json | bot/.iaia_auth/lid-mapping-34652082454.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34652094922.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34652094922.json | bot/.iaia_auth/lid-mapping-34652094922.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34652482210.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34652482210.json | bot/.iaia_auth/lid-mapping-34652482210.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34652696239.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34652696239.json | bot/.iaia_auth/lid-mapping-34652696239.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34652794775.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34652794775.json | bot/.iaia_auth/lid-mapping-34652794775.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34652931710.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34652931710.json | bot/.iaia_auth/lid-mapping-34652931710.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34653051042.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34653051042.json | bot/.iaia_auth/lid-mapping-34653051042.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34653080816.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34653080816.json | bot/.iaia_auth/lid-mapping-34653080816.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34653122726.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34653122726.json | bot/.iaia_auth/lid-mapping-34653122726.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34653175532.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34653175532.json | bot/.iaia_auth/lid-mapping-34653175532.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34653249097.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34653249097.json | bot/.iaia_auth/lid-mapping-34653249097.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34653467984.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34653467984.json | bot/.iaia_auth/lid-mapping-34653467984.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34653539069.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34653539069.json | bot/.iaia_auth/lid-mapping-34653539069.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34653543692.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34653543692.json | bot/.iaia_auth/lid-mapping-34653543692.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34653614649.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34653614649.json | bot/.iaia_auth/lid-mapping-34653614649.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34653651552.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34653651552.json | bot/.iaia_auth/lid-mapping-34653651552.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34653752199.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34653752199.json | bot/.iaia_auth/lid-mapping-34653752199.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34653850530.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34653850530.json | bot/.iaia_auth/lid-mapping-34653850530.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34653960448.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34653960448.json | bot/.iaia_auth/lid-mapping-34653960448.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34654367279.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34654367279.json | bot/.iaia_auth/lid-mapping-34654367279.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34654485275.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34654485275.json | bot/.iaia_auth/lid-mapping-34654485275.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34654557753.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34654557753.json | bot/.iaia_auth/lid-mapping-34654557753.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34654568317.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34654568317.json | bot/.iaia_auth/lid-mapping-34654568317.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34654584889.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34654584889.json | bot/.iaia_auth/lid-mapping-34654584889.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34654735303.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34654735303.json | bot/.iaia_auth/lid-mapping-34654735303.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34654791277.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34654791277.json | bot/.iaia_auth/lid-mapping-34654791277.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34654877702.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34654877702.json | bot/.iaia_auth/lid-mapping-34654877702.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34654941741.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34654941741.json | bot/.iaia_auth/lid-mapping-34654941741.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34654945735.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34654945735.json | bot/.iaia_auth/lid-mapping-34654945735.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34654969521.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34654969521.json | bot/.iaia_auth/lid-mapping-34654969521.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34655123993.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34655123993.json | bot/.iaia_auth/lid-mapping-34655123993.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34655220081.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34655220081.json | bot/.iaia_auth/lid-mapping-34655220081.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34655289725.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34655289725.json | bot/.iaia_auth/lid-mapping-34655289725.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34655317790.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34655317790.json | bot/.iaia_auth/lid-mapping-34655317790.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34655364235.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34655364235.json | bot/.iaia_auth/lid-mapping-34655364235.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34655468008.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34655468008.json | bot/.iaia_auth/lid-mapping-34655468008.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34655531597.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34655531597.json | bot/.iaia_auth/lid-mapping-34655531597.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34655776882.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34655776882.json | bot/.iaia_auth/lid-mapping-34655776882.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34655789000.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34655789000.json | bot/.iaia_auth/lid-mapping-34655789000.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34655816296.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34655816296.json | bot/.iaia_auth/lid-mapping-34655816296.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34655940526.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34655940526.json | bot/.iaia_auth/lid-mapping-34655940526.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34655952623.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34655952623.json | bot/.iaia_auth/lid-mapping-34655952623.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34655967672.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34655967672.json | bot/.iaia_auth/lid-mapping-34655967672.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34655981264.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34655981264.json | bot/.iaia_auth/lid-mapping-34655981264.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34656281986.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34656281986.json | bot/.iaia_auth/lid-mapping-34656281986.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34656541247.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34656541247.json | bot/.iaia_auth/lid-mapping-34656541247.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34656608387.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34656608387.json | bot/.iaia_auth/lid-mapping-34656608387.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34656650320.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34656650320.json | bot/.iaia_auth/lid-mapping-34656650320.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34656683196.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34656683196.json | bot/.iaia_auth/lid-mapping-34656683196.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34656926806.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34656926806.json | bot/.iaia_auth/lid-mapping-34656926806.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34656937608.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34656937608.json | bot/.iaia_auth/lid-mapping-34656937608.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34656938398.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34656938398.json | bot/.iaia_auth/lid-mapping-34656938398.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34656968468.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34656968468.json | bot/.iaia_auth/lid-mapping-34656968468.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34656982819.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34656982819.json | bot/.iaia_auth/lid-mapping-34656982819.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34657088909.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34657088909.json | bot/.iaia_auth/lid-mapping-34657088909.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34657283627.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34657283627.json | bot/.iaia_auth/lid-mapping-34657283627.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34657336609.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34657336609.json | bot/.iaia_auth/lid-mapping-34657336609.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34657341218.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34657341218.json | bot/.iaia_auth/lid-mapping-34657341218.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34657451858.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34657451858.json | bot/.iaia_auth/lid-mapping-34657451858.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34657544410.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34657544410.json | bot/.iaia_auth/lid-mapping-34657544410.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34657640756.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34657640756.json | bot/.iaia_auth/lid-mapping-34657640756.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34657657286.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34657657286.json | bot/.iaia_auth/lid-mapping-34657657286.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34657910840.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34657910840.json | bot/.iaia_auth/lid-mapping-34657910840.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34658182715.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34658182715.json | bot/.iaia_auth/lid-mapping-34658182715.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34658233885.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34658233885.json | bot/.iaia_auth/lid-mapping-34658233885.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34658348218.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34658348218.json | bot/.iaia_auth/lid-mapping-34658348218.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34658606383.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34658606383.json | bot/.iaia_auth/lid-mapping-34658606383.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34658762816.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34658762816.json | bot/.iaia_auth/lid-mapping-34658762816.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34658994369.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34658994369.json | bot/.iaia_auth/lid-mapping-34658994369.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659040729.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659040729.json | bot/.iaia_auth/lid-mapping-34659040729.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659070794.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659070794.json | bot/.iaia_auth/lid-mapping-34659070794.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659079371.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659079371.json | bot/.iaia_auth/lid-mapping-34659079371.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659090298.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659090298.json | bot/.iaia_auth/lid-mapping-34659090298.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659107850.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659107850.json | bot/.iaia_auth/lid-mapping-34659107850.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659115932.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659115932.json | bot/.iaia_auth/lid-mapping-34659115932.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659131727.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659131727.json | bot/.iaia_auth/lid-mapping-34659131727.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659138245.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659138245.json | bot/.iaia_auth/lid-mapping-34659138245.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659210339.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659210339.json | bot/.iaia_auth/lid-mapping-34659210339.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659287706.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659287706.json | bot/.iaia_auth/lid-mapping-34659287706.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659337612.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659337612.json | bot/.iaia_auth/lid-mapping-34659337612.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659367390.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659367390.json | bot/.iaia_auth/lid-mapping-34659367390.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659386129.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659386129.json | bot/.iaia_auth/lid-mapping-34659386129.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659417866.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659417866.json | bot/.iaia_auth/lid-mapping-34659417866.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659471245.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659471245.json | bot/.iaia_auth/lid-mapping-34659471245.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659490548.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659490548.json | bot/.iaia_auth/lid-mapping-34659490548.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659544422.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659544422.json | bot/.iaia_auth/lid-mapping-34659544422.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659599339.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659599339.json | bot/.iaia_auth/lid-mapping-34659599339.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659627999.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659627999.json | bot/.iaia_auth/lid-mapping-34659627999.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659672019.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659672019.json | bot/.iaia_auth/lid-mapping-34659672019.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659704122.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659704122.json | bot/.iaia_auth/lid-mapping-34659704122.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659759359.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659759359.json | bot/.iaia_auth/lid-mapping-34659759359.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659789526.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659789526.json | bot/.iaia_auth/lid-mapping-34659789526.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659799431.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659799431.json | bot/.iaia_auth/lid-mapping-34659799431.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659887711.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659887711.json | bot/.iaia_auth/lid-mapping-34659887711.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659890843.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659890843.json | bot/.iaia_auth/lid-mapping-34659890843.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659932463.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659932463.json | bot/.iaia_auth/lid-mapping-34659932463.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659943263.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659943263.json | bot/.iaia_auth/lid-mapping-34659943263.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34659966856.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34659966856.json | bot/.iaia_auth/lid-mapping-34659966856.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660050927.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660050927.json | bot/.iaia_auth/lid-mapping-34660050927.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660088121.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660088121.json | bot/.iaia_auth/lid-mapping-34660088121.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660165583.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660165583.json | bot/.iaia_auth/lid-mapping-34660165583.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660187695.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660187695.json | bot/.iaia_auth/lid-mapping-34660187695.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660270964.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660270964.json | bot/.iaia_auth/lid-mapping-34660270964.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660322524.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660322524.json | bot/.iaia_auth/lid-mapping-34660322524.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660322547.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660322547.json | bot/.iaia_auth/lid-mapping-34660322547.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660347777.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660347777.json | bot/.iaia_auth/lid-mapping-34660347777.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660464910.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660464910.json | bot/.iaia_auth/lid-mapping-34660464910.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660518967.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660518967.json | bot/.iaia_auth/lid-mapping-34660518967.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660566349.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660566349.json | bot/.iaia_auth/lid-mapping-34660566349.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660581946.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660581946.json | bot/.iaia_auth/lid-mapping-34660581946.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660656187.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660656187.json | bot/.iaia_auth/lid-mapping-34660656187.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660745150.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660745150.json | bot/.iaia_auth/lid-mapping-34660745150.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660745313.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660745313.json | bot/.iaia_auth/lid-mapping-34660745313.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660810237.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660810237.json | bot/.iaia_auth/lid-mapping-34660810237.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660826970.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660826970.json | bot/.iaia_auth/lid-mapping-34660826970.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660939605.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660939605.json | bot/.iaia_auth/lid-mapping-34660939605.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660960732.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660960732.json | bot/.iaia_auth/lid-mapping-34660960732.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660983531.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660983531.json | bot/.iaia_auth/lid-mapping-34660983531.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660986993.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660986993.json | bot/.iaia_auth/lid-mapping-34660986993.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34660987847.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34660987847.json | bot/.iaia_auth/lid-mapping-34660987847.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34661204457.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34661204457.json | bot/.iaia_auth/lid-mapping-34661204457.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34661480449.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34661480449.json | bot/.iaia_auth/lid-mapping-34661480449.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34661639514.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34661639514.json | bot/.iaia_auth/lid-mapping-34661639514.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34661741204.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34661741204.json | bot/.iaia_auth/lid-mapping-34661741204.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34661940763.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34661940763.json | bot/.iaia_auth/lid-mapping-34661940763.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34662024309.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34662024309.json | bot/.iaia_auth/lid-mapping-34662024309.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34662068683.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34662068683.json | bot/.iaia_auth/lid-mapping-34662068683.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34663789595.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34663789595.json | bot/.iaia_auth/lid-mapping-34663789595.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34664028286.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34664028286.json | bot/.iaia_auth/lid-mapping-34664028286.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34664131723.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34664131723.json | bot/.iaia_auth/lid-mapping-34664131723.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34664535243.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34664535243.json | bot/.iaia_auth/lid-mapping-34664535243.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34664710502.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34664710502.json | bot/.iaia_auth/lid-mapping-34664710502.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34664794465.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34664794465.json | bot/.iaia_auth/lid-mapping-34664794465.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34665135705.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34665135705.json | bot/.iaia_auth/lid-mapping-34665135705.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34665273541.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34665273541.json | bot/.iaia_auth/lid-mapping-34665273541.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34665289724.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34665289724.json | bot/.iaia_auth/lid-mapping-34665289724.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34665400608.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34665400608.json | bot/.iaia_auth/lid-mapping-34665400608.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34665637900.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34665637900.json | bot/.iaia_auth/lid-mapping-34665637900.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34665830723.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34665830723.json | bot/.iaia_auth/lid-mapping-34665830723.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34666149421.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34666149421.json | bot/.iaia_auth/lid-mapping-34666149421.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34666199668.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34666199668.json | bot/.iaia_auth/lid-mapping-34666199668.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34666226253.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34666226253.json | bot/.iaia_auth/lid-mapping-34666226253.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34666271027.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34666271027.json | bot/.iaia_auth/lid-mapping-34666271027.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34666361750.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34666361750.json | bot/.iaia_auth/lid-mapping-34666361750.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34666564847.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34666564847.json | bot/.iaia_auth/lid-mapping-34666564847.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34666579757.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34666579757.json | bot/.iaia_auth/lid-mapping-34666579757.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34666684512.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34666684512.json | bot/.iaia_auth/lid-mapping-34666684512.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34666790654.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34666790654.json | bot/.iaia_auth/lid-mapping-34666790654.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34666803267.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34666803267.json | bot/.iaia_auth/lid-mapping-34666803267.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34666843130.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34666843130.json | bot/.iaia_auth/lid-mapping-34666843130.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34666864083.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34666864083.json | bot/.iaia_auth/lid-mapping-34666864083.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34667136662.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34667136662.json | bot/.iaia_auth/lid-mapping-34667136662.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34667314228.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34667314228.json | bot/.iaia_auth/lid-mapping-34667314228.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34667410311.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34667410311.json | bot/.iaia_auth/lid-mapping-34667410311.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34667491316.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34667491316.json | bot/.iaia_auth/lid-mapping-34667491316.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34667506960.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34667506960.json | bot/.iaia_auth/lid-mapping-34667506960.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34667535244.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34667535244.json | bot/.iaia_auth/lid-mapping-34667535244.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34667535246.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34667535246.json | bot/.iaia_auth/lid-mapping-34667535246.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34667593639.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34667593639.json | bot/.iaia_auth/lid-mapping-34667593639.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34667616328.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34667616328.json | bot/.iaia_auth/lid-mapping-34667616328.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34667701794.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34667701794.json | bot/.iaia_auth/lid-mapping-34667701794.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34667707778.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34667707778.json | bot/.iaia_auth/lid-mapping-34667707778.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34667763152.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34667763152.json | bot/.iaia_auth/lid-mapping-34667763152.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34667860269.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34667860269.json | bot/.iaia_auth/lid-mapping-34667860269.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34667904277.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34667904277.json | bot/.iaia_auth/lid-mapping-34667904277.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34668512550.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34668512550.json | bot/.iaia_auth/lid-mapping-34668512550.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34668571311.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34668571311.json | bot/.iaia_auth/lid-mapping-34668571311.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669079328.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669079328.json | bot/.iaia_auth/lid-mapping-34669079328.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669110927.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669110927.json | bot/.iaia_auth/lid-mapping-34669110927.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669176708.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669176708.json | bot/.iaia_auth/lid-mapping-34669176708.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669187585.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669187585.json | bot/.iaia_auth/lid-mapping-34669187585.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669194110.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669194110.json | bot/.iaia_auth/lid-mapping-34669194110.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669196156.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669196156.json | bot/.iaia_auth/lid-mapping-34669196156.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669319131.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669319131.json | bot/.iaia_auth/lid-mapping-34669319131.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669446953.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669446953.json | bot/.iaia_auth/lid-mapping-34669446953.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669459266.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669459266.json | bot/.iaia_auth/lid-mapping-34669459266.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669528177.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669528177.json | bot/.iaia_auth/lid-mapping-34669528177.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669708901.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669708901.json | bot/.iaia_auth/lid-mapping-34669708901.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669747926.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669747926.json | bot/.iaia_auth/lid-mapping-34669747926.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669771352.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669771352.json | bot/.iaia_auth/lid-mapping-34669771352.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669803007.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669803007.json | bot/.iaia_auth/lid-mapping-34669803007.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669822686.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669822686.json | bot/.iaia_auth/lid-mapping-34669822686.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669947617.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669947617.json | bot/.iaia_auth/lid-mapping-34669947617.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669989870.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669989870.json | bot/.iaia_auth/lid-mapping-34669989870.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34669996025.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34669996025.json | bot/.iaia_auth/lid-mapping-34669996025.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34670225122.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34670225122.json | bot/.iaia_auth/lid-mapping-34670225122.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34670244525.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34670244525.json | bot/.iaia_auth/lid-mapping-34670244525.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34670325387.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34670325387.json | bot/.iaia_auth/lid-mapping-34670325387.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34670330353.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34670330353.json | bot/.iaia_auth/lid-mapping-34670330353.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34670342800.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34670342800.json | bot/.iaia_auth/lid-mapping-34670342800.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34670434785.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34670434785.json | bot/.iaia_auth/lid-mapping-34670434785.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34670456056.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34670456056.json | bot/.iaia_auth/lid-mapping-34670456056.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34670490534.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34670490534.json | bot/.iaia_auth/lid-mapping-34670490534.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34670491644.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34670491644.json | bot/.iaia_auth/lid-mapping-34670491644.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34670611066.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34670611066.json | bot/.iaia_auth/lid-mapping-34670611066.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34670935620.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34670935620.json | bot/.iaia_auth/lid-mapping-34670935620.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34670972161.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34670972161.json | bot/.iaia_auth/lid-mapping-34670972161.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34671177294.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34671177294.json | bot/.iaia_auth/lid-mapping-34671177294.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34672369803.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34672369803.json | bot/.iaia_auth/lid-mapping-34672369803.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34672449164.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34672449164.json | bot/.iaia_auth/lid-mapping-34672449164.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34673684569.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34673684569.json | bot/.iaia_auth/lid-mapping-34673684569.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34673785854.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34673785854.json | bot/.iaia_auth/lid-mapping-34673785854.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34674002095.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34674002095.json | bot/.iaia_auth/lid-mapping-34674002095.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34675093505.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34675093505.json | bot/.iaia_auth/lid-mapping-34675093505.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34675143892.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34675143892.json | bot/.iaia_auth/lid-mapping-34675143892.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34675343403.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34675343403.json | bot/.iaia_auth/lid-mapping-34675343403.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34675556546.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34675556546.json | bot/.iaia_auth/lid-mapping-34675556546.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34675628707.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34675628707.json | bot/.iaia_auth/lid-mapping-34675628707.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34675677802.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34675677802.json | bot/.iaia_auth/lid-mapping-34675677802.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34675694092.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34675694092.json | bot/.iaia_auth/lid-mapping-34675694092.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34675802600.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34675802600.json | bot/.iaia_auth/lid-mapping-34675802600.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34675834526.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34675834526.json | bot/.iaia_auth/lid-mapping-34675834526.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34675950159.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34675950159.json | bot/.iaia_auth/lid-mapping-34675950159.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34675983503.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34675983503.json | bot/.iaia_auth/lid-mapping-34675983503.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676022695.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676022695.json | bot/.iaia_auth/lid-mapping-34676022695.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676053943.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676053943.json | bot/.iaia_auth/lid-mapping-34676053943.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676071959.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676071959.json | bot/.iaia_auth/lid-mapping-34676071959.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676108376.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676108376.json | bot/.iaia_auth/lid-mapping-34676108376.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676126228.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676126228.json | bot/.iaia_auth/lid-mapping-34676126228.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676166732.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676166732.json | bot/.iaia_auth/lid-mapping-34676166732.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676171796.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676171796.json | bot/.iaia_auth/lid-mapping-34676171796.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676209487.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676209487.json | bot/.iaia_auth/lid-mapping-34676209487.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676232046.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676232046.json | bot/.iaia_auth/lid-mapping-34676232046.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676247820.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676247820.json | bot/.iaia_auth/lid-mapping-34676247820.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676299851.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676299851.json | bot/.iaia_auth/lid-mapping-34676299851.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676302088.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676302088.json | bot/.iaia_auth/lid-mapping-34676302088.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676356614.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676356614.json | bot/.iaia_auth/lid-mapping-34676356614.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676445735.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676445735.json | bot/.iaia_auth/lid-mapping-34676445735.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676493126.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676493126.json | bot/.iaia_auth/lid-mapping-34676493126.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676521179.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676521179.json | bot/.iaia_auth/lid-mapping-34676521179.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676558276.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676558276.json | bot/.iaia_auth/lid-mapping-34676558276.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676573060.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676573060.json | bot/.iaia_auth/lid-mapping-34676573060.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676593385.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676593385.json | bot/.iaia_auth/lid-mapping-34676593385.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676628615.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676628615.json | bot/.iaia_auth/lid-mapping-34676628615.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676768788.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676768788.json | bot/.iaia_auth/lid-mapping-34676768788.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676780773.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676780773.json | bot/.iaia_auth/lid-mapping-34676780773.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676837896.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676837896.json | bot/.iaia_auth/lid-mapping-34676837896.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676879641.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676879641.json | bot/.iaia_auth/lid-mapping-34676879641.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676904461.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676904461.json | bot/.iaia_auth/lid-mapping-34676904461.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34676917507.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34676917507.json | bot/.iaia_auth/lid-mapping-34676917507.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677079308.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677079308.json | bot/.iaia_auth/lid-mapping-34677079308.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677172258.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677172258.json | bot/.iaia_auth/lid-mapping-34677172258.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677291811.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677291811.json | bot/.iaia_auth/lid-mapping-34677291811.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677312418.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677312418.json | bot/.iaia_auth/lid-mapping-34677312418.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677322093.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677322093.json | bot/.iaia_auth/lid-mapping-34677322093.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677425840.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677425840.json | bot/.iaia_auth/lid-mapping-34677425840.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677429222.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677429222.json | bot/.iaia_auth/lid-mapping-34677429222.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677457073.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677457073.json | bot/.iaia_auth/lid-mapping-34677457073.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677460459.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677460459.json | bot/.iaia_auth/lid-mapping-34677460459.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677604286.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677604286.json | bot/.iaia_auth/lid-mapping-34677604286.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677735521.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677735521.json | bot/.iaia_auth/lid-mapping-34677735521.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677771251.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677771251.json | bot/.iaia_auth/lid-mapping-34677771251.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677810314.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677810314.json | bot/.iaia_auth/lid-mapping-34677810314.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677810894.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677810894.json | bot/.iaia_auth/lid-mapping-34677810894.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677829306.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677829306.json | bot/.iaia_auth/lid-mapping-34677829306.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34677887904.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34677887904.json | bot/.iaia_auth/lid-mapping-34677887904.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34678273113.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34678273113.json | bot/.iaia_auth/lid-mapping-34678273113.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34678332864.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34678332864.json | bot/.iaia_auth/lid-mapping-34678332864.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34678379240.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34678379240.json | bot/.iaia_auth/lid-mapping-34678379240.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34678454245.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34678454245.json | bot/.iaia_auth/lid-mapping-34678454245.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34678600778.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34678600778.json | bot/.iaia_auth/lid-mapping-34678600778.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34678656239.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34678656239.json | bot/.iaia_auth/lid-mapping-34678656239.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34678696960.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34678696960.json | bot/.iaia_auth/lid-mapping-34678696960.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34678754117.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34678754117.json | bot/.iaia_auth/lid-mapping-34678754117.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34678767682.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34678767682.json | bot/.iaia_auth/lid-mapping-34678767682.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34678788244.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34678788244.json | bot/.iaia_auth/lid-mapping-34678788244.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34678972935.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34678972935.json | bot/.iaia_auth/lid-mapping-34678972935.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34678978978.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34678978978.json | bot/.iaia_auth/lid-mapping-34678978978.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679010408.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679010408.json | bot/.iaia_auth/lid-mapping-34679010408.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679015964.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679015964.json | bot/.iaia_auth/lid-mapping-34679015964.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679046464.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679046464.json | bot/.iaia_auth/lid-mapping-34679046464.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679067641.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679067641.json | bot/.iaia_auth/lid-mapping-34679067641.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679189694.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679189694.json | bot/.iaia_auth/lid-mapping-34679189694.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679199359.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679199359.json | bot/.iaia_auth/lid-mapping-34679199359.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679255346.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679255346.json | bot/.iaia_auth/lid-mapping-34679255346.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679266182.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679266182.json | bot/.iaia_auth/lid-mapping-34679266182.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679286346.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679286346.json | bot/.iaia_auth/lid-mapping-34679286346.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679325904.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679325904.json | bot/.iaia_auth/lid-mapping-34679325904.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679343176.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679343176.json | bot/.iaia_auth/lid-mapping-34679343176.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679374067.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679374067.json | bot/.iaia_auth/lid-mapping-34679374067.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679378219.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679378219.json | bot/.iaia_auth/lid-mapping-34679378219.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679458181.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679458181.json | bot/.iaia_auth/lid-mapping-34679458181.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679458182.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679458182.json | bot/.iaia_auth/lid-mapping-34679458182.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679458414.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679458414.json | bot/.iaia_auth/lid-mapping-34679458414.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679465175.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679465175.json | bot/.iaia_auth/lid-mapping-34679465175.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679465176.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679465176.json | bot/.iaia_auth/lid-mapping-34679465176.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679474399.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679474399.json | bot/.iaia_auth/lid-mapping-34679474399.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679475378.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679475378.json | bot/.iaia_auth/lid-mapping-34679475378.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679498823.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679498823.json | bot/.iaia_auth/lid-mapping-34679498823.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679523067.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679523067.json | bot/.iaia_auth/lid-mapping-34679523067.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679533881.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679533881.json | bot/.iaia_auth/lid-mapping-34679533881.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679590542.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679590542.json | bot/.iaia_auth/lid-mapping-34679590542.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679600359.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679600359.json | bot/.iaia_auth/lid-mapping-34679600359.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679616866.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679616866.json | bot/.iaia_auth/lid-mapping-34679616866.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679651958.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679651958.json | bot/.iaia_auth/lid-mapping-34679651958.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679690892.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679690892.json | bot/.iaia_auth/lid-mapping-34679690892.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679733073.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679733073.json | bot/.iaia_auth/lid-mapping-34679733073.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679811286.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679811286.json | bot/.iaia_auth/lid-mapping-34679811286.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679834232.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679834232.json | bot/.iaia_auth/lid-mapping-34679834232.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679922619.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679922619.json | bot/.iaia_auth/lid-mapping-34679922619.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34679999741.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34679999741.json | bot/.iaia_auth/lid-mapping-34679999741.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34680100280.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34680100280.json | bot/.iaia_auth/lid-mapping-34680100280.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34680232871.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34680232871.json | bot/.iaia_auth/lid-mapping-34680232871.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34680248662.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34680248662.json | bot/.iaia_auth/lid-mapping-34680248662.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34680350585.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34680350585.json | bot/.iaia_auth/lid-mapping-34680350585.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34680362052.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34680362052.json | bot/.iaia_auth/lid-mapping-34680362052.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34680375918.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34680375918.json | bot/.iaia_auth/lid-mapping-34680375918.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34680495140.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34680495140.json | bot/.iaia_auth/lid-mapping-34680495140.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34680529487.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34680529487.json | bot/.iaia_auth/lid-mapping-34680529487.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34680571834.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34680571834.json | bot/.iaia_auth/lid-mapping-34680571834.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34680671700.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34680671700.json | bot/.iaia_auth/lid-mapping-34680671700.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34680747414.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34680747414.json | bot/.iaia_auth/lid-mapping-34680747414.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34680868352.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34680868352.json | bot/.iaia_auth/lid-mapping-34680868352.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34680922887.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34680922887.json | bot/.iaia_auth/lid-mapping-34680922887.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34682254946.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34682254946.json | bot/.iaia_auth/lid-mapping-34682254946.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34682463201.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34682463201.json | bot/.iaia_auth/lid-mapping-34682463201.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34682858380.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34682858380.json | bot/.iaia_auth/lid-mapping-34682858380.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34683620976.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34683620976.json | bot/.iaia_auth/lid-mapping-34683620976.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34684316608.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34684316608.json | bot/.iaia_auth/lid-mapping-34684316608.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34685286413.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34685286413.json | bot/.iaia_auth/lid-mapping-34685286413.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34685389359.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34685389359.json | bot/.iaia_auth/lid-mapping-34685389359.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34685872650.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34685872650.json | bot/.iaia_auth/lid-mapping-34685872650.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686028836.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686028836.json | bot/.iaia_auth/lid-mapping-34686028836.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686042127.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686042127.json | bot/.iaia_auth/lid-mapping-34686042127.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686046621.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686046621.json | bot/.iaia_auth/lid-mapping-34686046621.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686094963.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686094963.json | bot/.iaia_auth/lid-mapping-34686094963.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686100657.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686100657.json | bot/.iaia_auth/lid-mapping-34686100657.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686107589.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686107589.json | bot/.iaia_auth/lid-mapping-34686107589.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686129305.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686129305.json | bot/.iaia_auth/lid-mapping-34686129305.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686148959.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686148959.json | bot/.iaia_auth/lid-mapping-34686148959.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686159666.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686159666.json | bot/.iaia_auth/lid-mapping-34686159666.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686167537.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686167537.json | bot/.iaia_auth/lid-mapping-34686167537.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686212042.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686212042.json | bot/.iaia_auth/lid-mapping-34686212042.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686227656.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686227656.json | bot/.iaia_auth/lid-mapping-34686227656.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686254153.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686254153.json | bot/.iaia_auth/lid-mapping-34686254153.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686269867.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686269867.json | bot/.iaia_auth/lid-mapping-34686269867.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686288874.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686288874.json | bot/.iaia_auth/lid-mapping-34686288874.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686385567.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686385567.json | bot/.iaia_auth/lid-mapping-34686385567.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686419121.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686419121.json | bot/.iaia_auth/lid-mapping-34686419121.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686433548.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686433548.json | bot/.iaia_auth/lid-mapping-34686433548.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686448206.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686448206.json | bot/.iaia_auth/lid-mapping-34686448206.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686489107.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686489107.json | bot/.iaia_auth/lid-mapping-34686489107.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686504195.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686504195.json | bot/.iaia_auth/lid-mapping-34686504195.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686510564.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686510564.json | bot/.iaia_auth/lid-mapping-34686510564.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686531179.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686531179.json | bot/.iaia_auth/lid-mapping-34686531179.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686586081.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686586081.json | bot/.iaia_auth/lid-mapping-34686586081.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686632060.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686632060.json | bot/.iaia_auth/lid-mapping-34686632060.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686702831.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686702831.json | bot/.iaia_auth/lid-mapping-34686702831.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686772266.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686772266.json | bot/.iaia_auth/lid-mapping-34686772266.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686796806.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686796806.json | bot/.iaia_auth/lid-mapping-34686796806.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686812403.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686812403.json | bot/.iaia_auth/lid-mapping-34686812403.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686827013.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686827013.json | bot/.iaia_auth/lid-mapping-34686827013.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686869021.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686869021.json | bot/.iaia_auth/lid-mapping-34686869021.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34686913078.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34686913078.json | bot/.iaia_auth/lid-mapping-34686913078.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687049298.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687049298.json | bot/.iaia_auth/lid-mapping-34687049298.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687061195.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687061195.json | bot/.iaia_auth/lid-mapping-34687061195.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687073756.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687073756.json | bot/.iaia_auth/lid-mapping-34687073756.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687398502.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687398502.json | bot/.iaia_auth/lid-mapping-34687398502.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687401430.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687401430.json | bot/.iaia_auth/lid-mapping-34687401430.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687409583.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687409583.json | bot/.iaia_auth/lid-mapping-34687409583.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687410734.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687410734.json | bot/.iaia_auth/lid-mapping-34687410734.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687458933.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687458933.json | bot/.iaia_auth/lid-mapping-34687458933.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687491610.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687491610.json | bot/.iaia_auth/lid-mapping-34687491610.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687501747.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687501747.json | bot/.iaia_auth/lid-mapping-34687501747.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687501748.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687501748.json | bot/.iaia_auth/lid-mapping-34687501748.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687534869.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687534869.json | bot/.iaia_auth/lid-mapping-34687534869.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687551086.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687551086.json | bot/.iaia_auth/lid-mapping-34687551086.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687629939.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687629939.json | bot/.iaia_auth/lid-mapping-34687629939.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687730445.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687730445.json | bot/.iaia_auth/lid-mapping-34687730445.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34687914190.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34687914190.json | bot/.iaia_auth/lid-mapping-34687914190.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34688900274.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34688900274.json | bot/.iaia_auth/lid-mapping-34688900274.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34689049521.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34689049521.json | bot/.iaia_auth/lid-mapping-34689049521.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34689113816.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34689113816.json | bot/.iaia_auth/lid-mapping-34689113816.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34689433966.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34689433966.json | bot/.iaia_auth/lid-mapping-34689433966.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34689623295.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34689623295.json | bot/.iaia_auth/lid-mapping-34689623295.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34689636376.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34689636376.json | bot/.iaia_auth/lid-mapping-34689636376.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34690000860.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34690000860.json | bot/.iaia_auth/lid-mapping-34690000860.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34690010786.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34690010786.json | bot/.iaia_auth/lid-mapping-34690010786.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34690089324.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34690089324.json | bot/.iaia_auth/lid-mapping-34690089324.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34690102691.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34690102691.json | bot/.iaia_auth/lid-mapping-34690102691.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34690204478.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34690204478.json | bot/.iaia_auth/lid-mapping-34690204478.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34690293329.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34690293329.json | bot/.iaia_auth/lid-mapping-34690293329.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34690671883.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34690671883.json | bot/.iaia_auth/lid-mapping-34690671883.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34690671885.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34690671885.json | bot/.iaia_auth/lid-mapping-34690671885.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34690758127.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34690758127.json | bot/.iaia_auth/lid-mapping-34690758127.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34690849967.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34690849967.json | bot/.iaia_auth/lid-mapping-34690849967.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34691255716.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34691255716.json | bot/.iaia_auth/lid-mapping-34691255716.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34691491340.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34691491340.json | bot/.iaia_auth/lid-mapping-34691491340.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34691590897.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34691590897.json | bot/.iaia_auth/lid-mapping-34691590897.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34691593877.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34691593877.json | bot/.iaia_auth/lid-mapping-34691593877.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34691901818.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34691901818.json | bot/.iaia_auth/lid-mapping-34691901818.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34692166537.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34692166537.json | bot/.iaia_auth/lid-mapping-34692166537.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34692193390.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34692193390.json | bot/.iaia_auth/lid-mapping-34692193390.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34692569534.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34692569534.json | bot/.iaia_auth/lid-mapping-34692569534.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34693025585.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34693025585.json | bot/.iaia_auth/lid-mapping-34693025585.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34693561040.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34693561040.json | bot/.iaia_auth/lid-mapping-34693561040.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34694408143.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34694408143.json | bot/.iaia_auth/lid-mapping-34694408143.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34694493621.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34694493621.json | bot/.iaia_auth/lid-mapping-34694493621.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34695745703.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34695745703.json | bot/.iaia_auth/lid-mapping-34695745703.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34695783429.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34695783429.json | bot/.iaia_auth/lid-mapping-34695783429.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34695815992.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34695815992.json | bot/.iaia_auth/lid-mapping-34695815992.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696007053.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696007053.json | bot/.iaia_auth/lid-mapping-34696007053.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696077868.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696077868.json | bot/.iaia_auth/lid-mapping-34696077868.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696104090.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696104090.json | bot/.iaia_auth/lid-mapping-34696104090.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696116473.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696116473.json | bot/.iaia_auth/lid-mapping-34696116473.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696169657.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696169657.json | bot/.iaia_auth/lid-mapping-34696169657.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696194003.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696194003.json | bot/.iaia_auth/lid-mapping-34696194003.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696214899.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696214899.json | bot/.iaia_auth/lid-mapping-34696214899.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696239987.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696239987.json | bot/.iaia_auth/lid-mapping-34696239987.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696288285.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696288285.json | bot/.iaia_auth/lid-mapping-34696288285.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696301396.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696301396.json | bot/.iaia_auth/lid-mapping-34696301396.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696351278.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696351278.json | bot/.iaia_auth/lid-mapping-34696351278.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696384361.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696384361.json | bot/.iaia_auth/lid-mapping-34696384361.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696417721.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696417721.json | bot/.iaia_auth/lid-mapping-34696417721.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696446133.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696446133.json | bot/.iaia_auth/lid-mapping-34696446133.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696473619.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696473619.json | bot/.iaia_auth/lid-mapping-34696473619.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696523356.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696523356.json | bot/.iaia_auth/lid-mapping-34696523356.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696538282.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696538282.json | bot/.iaia_auth/lid-mapping-34696538282.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696556989.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696556989.json | bot/.iaia_auth/lid-mapping-34696556989.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696561445.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696561445.json | bot/.iaia_auth/lid-mapping-34696561445.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696638963.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696638963.json | bot/.iaia_auth/lid-mapping-34696638963.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696640407.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696640407.json | bot/.iaia_auth/lid-mapping-34696640407.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696827105.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696827105.json | bot/.iaia_auth/lid-mapping-34696827105.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696863468.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696863468.json | bot/.iaia_auth/lid-mapping-34696863468.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696908084.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696908084.json | bot/.iaia_auth/lid-mapping-34696908084.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696908088.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696908088.json | bot/.iaia_auth/lid-mapping-34696908088.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696934108.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696934108.json | bot/.iaia_auth/lid-mapping-34696934108.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696934417.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696934417.json | bot/.iaia_auth/lid-mapping-34696934417.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34696953920.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34696953920.json | bot/.iaia_auth/lid-mapping-34696953920.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34697313722.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34697313722.json | bot/.iaia_auth/lid-mapping-34697313722.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34697898860.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34697898860.json | bot/.iaia_auth/lid-mapping-34697898860.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34697990501.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34697990501.json | bot/.iaia_auth/lid-mapping-34697990501.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34698998279.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34698998279.json | bot/.iaia_auth/lid-mapping-34698998279.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699019545.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699019545.json | bot/.iaia_auth/lid-mapping-34699019545.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699073382.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699073382.json | bot/.iaia_auth/lid-mapping-34699073382.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699078439.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699078439.json | bot/.iaia_auth/lid-mapping-34699078439.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699105557.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699105557.json | bot/.iaia_auth/lid-mapping-34699105557.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699183856.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699183856.json | bot/.iaia_auth/lid-mapping-34699183856.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699285351.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699285351.json | bot/.iaia_auth/lid-mapping-34699285351.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699307045.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699307045.json | bot/.iaia_auth/lid-mapping-34699307045.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699313721.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699313721.json | bot/.iaia_auth/lid-mapping-34699313721.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699320396.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699320396.json | bot/.iaia_auth/lid-mapping-34699320396.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699380461.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699380461.json | bot/.iaia_auth/lid-mapping-34699380461.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699396883.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699396883.json | bot/.iaia_auth/lid-mapping-34699396883.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699453472.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699453472.json | bot/.iaia_auth/lid-mapping-34699453472.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699453473.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699453473.json | bot/.iaia_auth/lid-mapping-34699453473.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699471335.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699471335.json | bot/.iaia_auth/lid-mapping-34699471335.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699504247.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699504247.json | bot/.iaia_auth/lid-mapping-34699504247.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699528477.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699528477.json | bot/.iaia_auth/lid-mapping-34699528477.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699628880.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699628880.json | bot/.iaia_auth/lid-mapping-34699628880.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699647308.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699647308.json | bot/.iaia_auth/lid-mapping-34699647308.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699706885.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699706885.json | bot/.iaia_auth/lid-mapping-34699706885.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699722711.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699722711.json | bot/.iaia_auth/lid-mapping-34699722711.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699753205.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699753205.json | bot/.iaia_auth/lid-mapping-34699753205.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699848027.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699848027.json | bot/.iaia_auth/lid-mapping-34699848027.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699857741.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699857741.json | bot/.iaia_auth/lid-mapping-34699857741.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699863567.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699863567.json | bot/.iaia_auth/lid-mapping-34699863567.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699877326.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699877326.json | bot/.iaia_auth/lid-mapping-34699877326.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699944174.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699944174.json | bot/.iaia_auth/lid-mapping-34699944174.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699954103.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699954103.json | bot/.iaia_auth/lid-mapping-34699954103.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699965348.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699965348.json | bot/.iaia_auth/lid-mapping-34699965348.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34699977003.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34699977003.json | bot/.iaia_auth/lid-mapping-34699977003.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34722201063.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34722201063.json | bot/.iaia_auth/lid-mapping-34722201063.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34722222081.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34722222081.json | bot/.iaia_auth/lid-mapping-34722222081.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34722265609.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34722265609.json | bot/.iaia_auth/lid-mapping-34722265609.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34722331841.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34722331841.json | bot/.iaia_auth/lid-mapping-34722331841.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34722372435.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34722372435.json | bot/.iaia_auth/lid-mapping-34722372435.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34722589600.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34722589600.json | bot/.iaia_auth/lid-mapping-34722589600.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34722611341.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34722611341.json | bot/.iaia_auth/lid-mapping-34722611341.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34722668155.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34722668155.json | bot/.iaia_auth/lid-mapping-34722668155.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34722687086.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34722687086.json | bot/.iaia_auth/lid-mapping-34722687086.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34722738666.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34722738666.json | bot/.iaia_auth/lid-mapping-34722738666.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34722757859.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34722757859.json | bot/.iaia_auth/lid-mapping-34722757859.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34742093922.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34742093922.json | bot/.iaia_auth/lid-mapping-34742093922.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34883841855502_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34883841855502_reverse.json | bot/.iaia_auth/lid-mapping-34883841855502_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34913801194.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34913801194.json | bot/.iaia_auth/lid-mapping-34913801194.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34958661048.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34958661048.json | bot/.iaia_auth/lid-mapping-34958661048.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34964250058.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34964250058.json | bot/.iaia_auth/lid-mapping-34964250058.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34965103250.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34965103250.json | bot/.iaia_auth/lid-mapping-34965103250.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34965107000.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34965107000.json | bot/.iaia_auth/lid-mapping-34965107000.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34965331131.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34965331131.json | bot/.iaia_auth/lid-mapping-34965331131.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34965532038.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34965532038.json | bot/.iaia_auth/lid-mapping-34965532038.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34965590764.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34965590764.json | bot/.iaia_auth/lid-mapping-34965590764.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34965671987.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34965671987.json | bot/.iaia_auth/lid-mapping-34965671987.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34965869070.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34965869070.json | bot/.iaia_auth/lid-mapping-34965869070.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34986079601.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34986079601.json | bot/.iaia_auth/lid-mapping-34986079601.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-34986112202.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-34986112202.json | bot/.iaia_auth/lid-mapping-34986112202.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-3509055410247_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-3509055410247_reverse.json | bot/.iaia_auth/lid-mapping-3509055410247_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-35115753320589_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-35115753320589_reverse.json | bot/.iaia_auth/lid-mapping-35115753320589_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-3521906765908_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-3521906765908_reverse.json | bot/.iaia_auth/lid-mapping-3521906765908_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-353867339612.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-353867339612.json | bot/.iaia_auth/lid-mapping-353867339612.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-35489499336878_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-35489499336878_reverse.json | bot/.iaia_auth/lid-mapping-35489499336878_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-36082188046442_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-36082188046442_reverse.json | bot/.iaia_auth/lid-mapping-36082188046442_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-36275478392958_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-36275478392958_reverse.json | bot/.iaia_auth/lid-mapping-36275478392958_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-36395619999839_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-36395619999839_reverse.json | bot/.iaia_auth/lid-mapping-36395619999839_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-36430030074058_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-36430030074058_reverse.json | bot/.iaia_auth/lid-mapping-36430030074058_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-36683382788318_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-36683382788318_reverse.json | bot/.iaia_auth/lid-mapping-36683382788318_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-36868099952812_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-36868099952812_reverse.json | bot/.iaia_auth/lid-mapping-36868099952812_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-36971162427456_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-36971162427456_reverse.json | bot/.iaia_auth/lid-mapping-36971162427456_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-36984466727041_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-36984466727041_reverse.json | bot/.iaia_auth/lid-mapping-36984466727041_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-3702899372278_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-3702899372278_reverse.json | bot/.iaia_auth/lid-mapping-3702899372278_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-3706590347287_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-3706590347287_reverse.json | bot/.iaia_auth/lid-mapping-3706590347287_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-37298066477109_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-37298066477109_reverse.json | bot/.iaia_auth/lid-mapping-37298066477109_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-37739961548980_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-37739961548980_reverse.json | bot/.iaia_auth/lid-mapping-37739961548980_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-38044853874882_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-38044853874882_reverse.json | bot/.iaia_auth/lid-mapping-38044853874882_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-38079263932462_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-38079263932462_reverse.json | bot/.iaia_auth/lid-mapping-38079263932462_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-38190949883924_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-38190949883924_reverse.json | bot/.iaia_auth/lid-mapping-38190949883924_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-38375683801191_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-38375683801191_reverse.json | bot/.iaia_auth/lid-mapping-38375683801191_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-38560249991298_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-38560249991298_reverse.json | bot/.iaia_auth/lid-mapping-38560249991298_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-3874228289604_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-3874228289604_reverse.json | bot/.iaia_auth/lid-mapping-3874228289604_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-38796557086881_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-38796557086881_reverse.json | bot/.iaia_auth/lid-mapping-38796557086881_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-39114401394826_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-39114401394826_reverse.json | bot/.iaia_auth/lid-mapping-39114401394826_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-39247495049313_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-39247495049313_reverse.json | bot/.iaia_auth/lid-mapping-39247495049313_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-39449492766895_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-39449492766895_reverse.json | bot/.iaia_auth/lid-mapping-39449492766895_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-395338317913_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-395338317913_reverse.json | bot/.iaia_auth/lid-mapping-395338317913_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-39685615259710_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-39685615259710_reverse.json | bot/.iaia_auth/lid-mapping-39685615259710_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-39994920042499_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-39994920042499_reverse.json | bot/.iaia_auth/lid-mapping-39994920042499_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-40054999240949_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-40054999240949_reverse.json | bot/.iaia_auth/lid-mapping-40054999240949_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-40325666058484_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-40325666058484_reverse.json | bot/.iaia_auth/lid-mapping-40325666058484_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-4037973909609_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-4037973909609_reverse.json | bot/.iaia_auth/lid-mapping-4037973909609_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-40463021154469_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-40463021154469_reverse.json | bot/.iaia_auth/lid-mapping-40463021154469_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-40488740589587_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-40488740589587_reverse.json | bot/.iaia_auth/lid-mapping-40488740589587_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-40686258778255_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-40686258778255_reverse.json | bot/.iaia_auth/lid-mapping-40686258778255_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-40746421862423_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-40746421862423_reverse.json | bot/.iaia_auth/lid-mapping-40746421862423_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-41210311888979_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-41210311888979_reverse.json | bot/.iaia_auth/lid-mapping-41210311888979_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-41274887377015_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-41274887377015_reverse.json | bot/.iaia_auth/lid-mapping-41274887377015_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-41425026736232_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-41425026736232_reverse.json | bot/.iaia_auth/lid-mapping-41425026736232_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-41767282731.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-41767282731.json | bot/.iaia_auth/lid-mapping-41767282731.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-42030684184722_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-42030684184722_reverse.json | bot/.iaia_auth/lid-mapping-42030684184722_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-42133780209692_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-42133780209692_reverse.json | bot/.iaia_auth/lid-mapping-42133780209692_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-42468754092147_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-42468754092147_reverse.json | bot/.iaia_auth/lid-mapping-42468754092147_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-42704977309860_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-42704977309860_reverse.json | bot/.iaia_auth/lid-mapping-42704977309860_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-43160730390570_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-43160730390570_reverse.json | bot/.iaia_auth/lid-mapping-43160730390570_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-43211699552264_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-43211699552264_reverse.json | bot/.iaia_auth/lid-mapping-43211699552264_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-43761472135365_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-43761472135365_reverse.json | bot/.iaia_auth/lid-mapping-43761472135365_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-44057858470134_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-44057858470134_reverse.json | bot/.iaia_auth/lid-mapping-44057858470134_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-44409978630272_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-44409978630272_reverse.json | bot/.iaia_auth/lid-mapping-44409978630272_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-44676283428941_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-44676283428941_reverse.json | bot/.iaia_auth/lid-mapping-44676283428941_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-447495722588.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-447495722588.json | bot/.iaia_auth/lid-mapping-447495722588.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-447803566354.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-447803566354.json | bot/.iaia_auth/lid-mapping-447803566354.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-447882701554.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-447882701554.json | bot/.iaia_auth/lid-mapping-447882701554.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-45389331857577_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-45389331857577_reverse.json | bot/.iaia_auth/lid-mapping-45389331857577_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-45449478193271_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-45449478193271_reverse.json | bot/.iaia_auth/lid-mapping-45449478193271_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-45599936245882_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-45599936245882_reverse.json | bot/.iaia_auth/lid-mapping-45599936245882_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-45642651029734_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-45642651029734_reverse.json | bot/.iaia_auth/lid-mapping-45642651029734_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-45921840681150_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-45921840681150_reverse.json | bot/.iaia_auth/lid-mapping-45921840681150_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-45986416209942_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-45986416209942_reverse.json | bot/.iaia_auth/lid-mapping-45986416209942_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-46149440376954_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-46149440376954_reverse.json | bot/.iaia_auth/lid-mapping-46149440376954_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-46192440438870_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-46192440438870_reverse.json | bot/.iaia_auth/lid-mapping-46192440438870_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-46192457154579_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-46192457154579_reverse.json | bot/.iaia_auth/lid-mapping-46192457154579_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-4639202218226_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-4639202218226_reverse.json | bot/.iaia_auth/lid-mapping-4639202218226_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-46420073689288_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-46420073689288_reverse.json | bot/.iaia_auth/lid-mapping-46420073689288_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-46454433439957_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-46454433439957_reverse.json | bot/.iaia_auth/lid-mapping-46454433439957_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-46548956262543_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-46548956262543_reverse.json | bot/.iaia_auth/lid-mapping-46548956262543_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-46566438088735_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-46566438088735_reverse.json | bot/.iaia_auth/lid-mapping-46566438088735_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-46600411959544_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-46600411959544_reverse.json | bot/.iaia_auth/lid-mapping-46600411959544_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-46888275415204_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-46888275415204_reverse.json | bot/.iaia_auth/lid-mapping-46888275415204_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-46909683200202_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-46909683200202_reverse.json | bot/.iaia_auth/lid-mapping-46909683200202_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-47249069457609_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-47249069457609_reverse.json | bot/.iaia_auth/lid-mapping-47249069457609_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-47511129587748_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-47511129587748_reverse.json | bot/.iaia_auth/lid-mapping-47511129587748_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-47549650100409_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-47549650100409_reverse.json | bot/.iaia_auth/lid-mapping-47549650100409_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-47691736346866_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-47691736346866_reverse.json | bot/.iaia_auth/lid-mapping-47691736346866_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-48249696186446_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-48249696186446_reverse.json | bot/.iaia_auth/lid-mapping-48249696186446_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-48443137478755_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-48443137478755_reverse.json | bot/.iaia_auth/lid-mapping-48443137478755_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-48717981835476_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-48717981835476_reverse.json | bot/.iaia_auth/lid-mapping-48717981835476_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-491707768310.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-491707768310.json | bot/.iaia_auth/lid-mapping-491707768310.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-49486764224761_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-49486764224761_reverse.json | bot/.iaia_auth/lid-mapping-49486764224761_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-49542850416837_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-49542850416837_reverse.json | bot/.iaia_auth/lid-mapping-49542850416837_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-49692838760483_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-49692838760483_reverse.json | bot/.iaia_auth/lid-mapping-49692838760483_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-49894836432917_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-49894836432917_reverse.json | bot/.iaia_auth/lid-mapping-49894836432917_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-50114399850609_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-50114399850609_reverse.json | bot/.iaia_auth/lid-mapping-50114399850609_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-50281450623034_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-50281450623034_reverse.json | bot/.iaia_auth/lid-mapping-50281450623034_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-51093014859790_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-51093014859790_reverse.json | bot/.iaia_auth/lid-mapping-51093014859790_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-51359235764280_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-51359235764280_reverse.json | bot/.iaia_auth/lid-mapping-51359235764280_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-51672768348326_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-51672768348326_reverse.json | bot/.iaia_auth/lid-mapping-51672768348326_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-51879027429482_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-51879027429482_reverse.json | bot/.iaia_auth/lid-mapping-51879027429482_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-52067972460649_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-52067972460649_reverse.json | bot/.iaia_auth/lid-mapping-52067972460649_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-5215511314708.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-5215511314708.json | bot/.iaia_auth/lid-mapping-5215511314708.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-52518910472379_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-52518910472379_reverse.json | bot/.iaia_auth/lid-mapping-52518910472379_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-52677841018946_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-52677841018946_reverse.json | bot/.iaia_auth/lid-mapping-52677841018946_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-52832476651731_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-52832476651731_reverse.json | bot/.iaia_auth/lid-mapping-52832476651731_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-53317858283718_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-53317858283718_reverse.json | bot/.iaia_auth/lid-mapping-53317858283718_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-53674273427504_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-53674273427504_reverse.json | bot/.iaia_auth/lid-mapping-53674273427504_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-53679222689985_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-53679222689985_reverse.json | bot/.iaia_auth/lid-mapping-53679222689985_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-53841760415838_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-53841760415838_reverse.json | bot/.iaia_auth/lid-mapping-53841760415838_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-54760900141188_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-54760900141188_reverse.json | bot/.iaia_auth/lid-mapping-54760900141188_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-5609328013504_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-5609328013504_reverse.json | bot/.iaia_auth/lid-mapping-5609328013504_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-56169783656470_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-56169783656470_reverse.json | bot/.iaia_auth/lid-mapping-56169783656470_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-56272879644888_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-56272879644888_reverse.json | bot/.iaia_auth/lid-mapping-56272879644888_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-56517592121520_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-56517592121520_reverse.json | bot/.iaia_auth/lid-mapping-56517592121520_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-56633505890513_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-56633505890513_reverse.json | bot/.iaia_auth/lid-mapping-56633505890513_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-56676573040816_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-56676573040816_reverse.json | bot/.iaia_auth/lid-mapping-56676573040816_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-56753815351455_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-56753815351455_reverse.json | bot/.iaia_auth/lid-mapping-56753815351455_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-56861223080143_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-56861223080143_reverse.json | bot/.iaia_auth/lid-mapping-56861223080143_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-57054513393893_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-57054513393893_reverse.json | bot/.iaia_auth/lid-mapping-57054513393893_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-57114609320062_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-57114609320062_reverse.json | bot/.iaia_auth/lid-mapping-57114609320062_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-573202388073.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-573202388073.json | bot/.iaia_auth/lid-mapping-573202388073.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-57595595329588_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-57595595329588_reverse.json | bot/.iaia_auth/lid-mapping-57595595329588_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-57750247731232_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-57750247731232_reverse.json | bot/.iaia_auth/lid-mapping-57750247731232_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-57780346085476_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-57780346085476_reverse.json | bot/.iaia_auth/lid-mapping-57780346085476_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-57990765887643_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-57990765887643_reverse.json | bot/.iaia_auth/lid-mapping-57990765887643_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-58587732824168_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-58587732824168_reverse.json | bot/.iaia_auth/lid-mapping-58587732824168_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-58639205302406_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-58639205302406_reverse.json | bot/.iaia_auth/lid-mapping-58639205302406_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-58755236499550_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-58755236499550_reverse.json | bot/.iaia_auth/lid-mapping-58755236499550_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-58755320434806_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-58755320434806_reverse.json | bot/.iaia_auth/lid-mapping-58755320434806_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-5879894122599_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-5879894122599_reverse.json | bot/.iaia_auth/lid-mapping-5879894122599_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-58905610694691_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-58905610694691_reverse.json | bot/.iaia_auth/lid-mapping-58905610694691_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-59146128908379_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-59146128908379_reverse.json | bot/.iaia_auth/lid-mapping-59146128908379_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-59193675530323_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-59193675530323_reverse.json | bot/.iaia_auth/lid-mapping-59193675530323_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-59231961149512_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-59231961149512_reverse.json | bot/.iaia_auth/lid-mapping-59231961149512_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-59536886992976_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-59536886992976_reverse.json | bot/.iaia_auth/lid-mapping-59536886992976_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-59605640073255_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-59605640073255_reverse.json | bot/.iaia_auth/lid-mapping-59605640073255_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-59756031029346_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-59756031029346_reverse.json | bot/.iaia_auth/lid-mapping-59756031029346_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-60108084097142_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-60108084097142_reverse.json | bot/.iaia_auth/lid-mapping-60108084097142_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-60194117697652_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-60194117697652_reverse.json | bot/.iaia_auth/lid-mapping-60194117697652_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-60391585505446_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-60391585505446_reverse.json | bot/.iaia_auth/lid-mapping-60391585505446_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-60572544589856_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-60572544589856_reverse.json | bot/.iaia_auth/lid-mapping-60572544589856_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-60748134912081_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-60748134912081_reverse.json | bot/.iaia_auth/lid-mapping-60748134912081_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-60885573840899_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-60885573840899_reverse.json | bot/.iaia_auth/lid-mapping-60885573840899_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-60937767755778_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-60937767755778_reverse.json | bot/.iaia_auth/lid-mapping-60937767755778_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-60967228588053_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-60967228588053_reverse.json | bot/.iaia_auth/lid-mapping-60967228588053_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-60971389305065_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-60971389305065_reverse.json | bot/.iaia_auth/lid-mapping-60971389305065_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-6120345194702_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-6120345194702_reverse.json | bot/.iaia_auth/lid-mapping-6120345194702_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-61241955504172_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-61241955504172_reverse.json | bot/.iaia_auth/lid-mapping-61241955504172_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-61422411219055_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-61422411219055_reverse.json | bot/.iaia_auth/lid-mapping-61422411219055_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-61452635507.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-61452635507.json | bot/.iaia_auth/lid-mapping-61452635507.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-61624291455106_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-61624291455106_reverse.json | bot/.iaia_auth/lid-mapping-61624291455106_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-61714519339062_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-61714519339062_reverse.json | bot/.iaia_auth/lid-mapping-61714519339062_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-62440385560820_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-62440385560820_reverse.json | bot/.iaia_auth/lid-mapping-62440385560820_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-62951520256189_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-62951520256189_reverse.json | bot/.iaia_auth/lid-mapping-62951520256189_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-63024467599500_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-63024467599500_reverse.json | bot/.iaia_auth/lid-mapping-63024467599500_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-6309340557524_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-6309340557524_reverse.json | bot/.iaia_auth/lid-mapping-6309340557524_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-63342228049928_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-63342228049928_reverse.json | bot/.iaia_auth/lid-mapping-63342228049928_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-63806134874257_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-63806134874257_reverse.json | bot/.iaia_auth/lid-mapping-63806134874257_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-63866214051868_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-63866214051868_reverse.json | bot/.iaia_auth/lid-mapping-63866214051868_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-6395273416830_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-6395273416830_reverse.json | bot/.iaia_auth/lid-mapping-6395273416830_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-6421026463843_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-6421026463843_reverse.json | bot/.iaia_auth/lid-mapping-6421026463843_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-64278581235849_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-64278581235849_reverse.json | bot/.iaia_auth/lid-mapping-64278581235849_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-64351578918952_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-64351578918952_reverse.json | bot/.iaia_auth/lid-mapping-64351578918952_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-64699521597591_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-64699521597591_reverse.json | bot/.iaia_auth/lid-mapping-64699521597591_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-65459663720530_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-65459663720530_reverse.json | bot/.iaia_auth/lid-mapping-65459663720530_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-65476810002499_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-65476810002499_reverse.json | bot/.iaia_auth/lid-mapping-65476810002499_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-65652937232495_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-65652937232495_reverse.json | bot/.iaia_auth/lid-mapping-65652937232495_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-65717412094062_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-65717412094062_reverse.json | bot/.iaia_auth/lid-mapping-65717412094062_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-66048057446462_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-66048057446462_reverse.json | bot/.iaia_auth/lid-mapping-66048057446462_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-66224268558521_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-66224268558521_reverse.json | bot/.iaia_auth/lid-mapping-66224268558521_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-66700993110175_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-66700993110175_reverse.json | bot/.iaia_auth/lid-mapping-66700993110175_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-66825513648333_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-66825513648333_reverse.json | bot/.iaia_auth/lid-mapping-66825513648333_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-66907134795988_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-66907134795988_reverse.json | bot/.iaia_auth/lid-mapping-66907134795988_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-67027410640901_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-67027410640901_reverse.json | bot/.iaia_auth/lid-mapping-67027410640901_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-67143408292086_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-67143408292086_reverse.json | bot/.iaia_auth/lid-mapping-67143408292086_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-67169178120318_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-67169178120318_reverse.json | bot/.iaia_auth/lid-mapping-67169178120318_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-67955140362333_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-67955140362333_reverse.json | bot/.iaia_auth/lid-mapping-67955140362333_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-68148313206944_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-68148313206944_reverse.json | bot/.iaia_auth/lid-mapping-68148313206944_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-68371685072952_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-68371685072952_reverse.json | bot/.iaia_auth/lid-mapping-68371685072952_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-68646546214996_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-68646546214996_reverse.json | bot/.iaia_auth/lid-mapping-68646546214996_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-68827001958458_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-68827001958458_reverse.json | bot/.iaia_auth/lid-mapping-68827001958458_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-68874816978987_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-68874816978987_reverse.json | bot/.iaia_auth/lid-mapping-68874816978987_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-6910770192535_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-6910770192535_reverse.json | bot/.iaia_auth/lid-mapping-6910770192535_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-69226299674651_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-69226299674651_reverse.json | bot/.iaia_auth/lid-mapping-69226299674651_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-69290824867949_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-69290824867949_reverse.json | bot/.iaia_auth/lid-mapping-69290824867949_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-69874873282588_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-69874873282588_reverse.json | bot/.iaia_auth/lid-mapping-69874873282588_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-69892120309899_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-69892120309899_reverse.json | bot/.iaia_auth/lid-mapping-69892120309899_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-6992357794033_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-6992357794033_reverse.json | bot/.iaia_auth/lid-mapping-6992357794033_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-70046688759934_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-70046688759934_reverse.json | bot/.iaia_auth/lid-mapping-70046688759934_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-70252830429316_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-70252830429316_reverse.json | bot/.iaia_auth/lid-mapping-70252830429316_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-70437681758451_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-70437681758451_reverse.json | bot/.iaia_auth/lid-mapping-70437681758451_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-71038926876693_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-71038926876693_reverse.json | bot/.iaia_auth/lid-mapping-71038926876693_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-71164017770597_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-71164017770597_reverse.json | bot/.iaia_auth/lid-mapping-71164017770597_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-71270838341639_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-71270838341639_reverse.json | bot/.iaia_auth/lid-mapping-71270838341639_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-71271073190127_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-71271073190127_reverse.json | bot/.iaia_auth/lid-mapping-71271073190127_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-71373800128705_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-71373800128705_reverse.json | bot/.iaia_auth/lid-mapping-71373800128705_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-71429785694395_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-71429785694395_reverse.json | bot/.iaia_auth/lid-mapping-71429785694395_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-71695922647233_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-71695922647233_reverse.json | bot/.iaia_auth/lid-mapping-71695922647233_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-7280053469288_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-7280053469288_reverse.json | bot/.iaia_auth/lid-mapping-7280053469288_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-72829894672531_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-72829894672531_reverse.json | bot/.iaia_auth/lid-mapping-72829894672531_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-72980285640957_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-72980285640957_reverse.json | bot/.iaia_auth/lid-mapping-72980285640957_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-73186309861576_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-73186309861576_reverse.json | bot/.iaia_auth/lid-mapping-73186309861576_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-73766096883817_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-73766096883817_reverse.json | bot/.iaia_auth/lid-mapping-73766096883817_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-74054446911706_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-74054446911706_reverse.json | bot/.iaia_auth/lid-mapping-74054446911706_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-74328804687928_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-74328804687928_reverse.json | bot/.iaia_auth/lid-mapping-74328804687928_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-74590747369558_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-74590747369558_reverse.json | bot/.iaia_auth/lid-mapping-74590747369558_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-74985985065210_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-74985985065210_reverse.json | bot/.iaia_auth/lid-mapping-74985985065210_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-75295172333757_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-75295172333757_reverse.json | bot/.iaia_auth/lid-mapping-75295172333757_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-75711717056535_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-75711717056535_reverse.json | bot/.iaia_auth/lid-mapping-75711717056535_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-7593602859119_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-7593602859119_reverse.json | bot/.iaia_auth/lid-mapping-7593602859119_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-75952335909092_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-75952335909092_reverse.json | bot/.iaia_auth/lid-mapping-75952335909092_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-76368947728614_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-76368947728614_reverse.json | bot/.iaia_auth/lid-mapping-76368947728614_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-764521013467_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-764521013467_reverse.json | bot/.iaia_auth/lid-mapping-764521013467_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-76497763192940_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-76497763192940_reverse.json | bot/.iaia_auth/lid-mapping-76497763192940_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-76690952843415_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-76690952843415_reverse.json | bot/.iaia_auth/lid-mapping-76690952843415_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-76914391797917_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-76914391797917_reverse.json | bot/.iaia_auth/lid-mapping-76914391797917_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-76936034406440_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-76936034406440_reverse.json | bot/.iaia_auth/lid-mapping-76936034406440_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-77257972424820_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-77257972424820_reverse.json | bot/.iaia_auth/lid-mapping-77257972424820_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-77476998996161_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-77476998996161_reverse.json | bot/.iaia_auth/lid-mapping-77476998996161_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-77571454722241_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-77571454722241_reverse.json | bot/.iaia_auth/lid-mapping-77571454722241_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-77799155101899_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-77799155101899_reverse.json | bot/.iaia_auth/lid-mapping-77799155101899_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-7795483091056_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-7795483091056_reverse.json | bot/.iaia_auth/lid-mapping-7795483091056_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-78005380632755_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-78005380632755_reverse.json | bot/.iaia_auth/lid-mapping-78005380632755_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-78069670907913_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-78069670907913_reverse.json | bot/.iaia_auth/lid-mapping-78069670907913_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-7834104258598_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-7834104258598_reverse.json | bot/.iaia_auth/lid-mapping-7834104258598_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-78456301826107_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-78456301826107_reverse.json | bot/.iaia_auth/lid-mapping-78456301826107_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-78769867989112_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-78769867989112_reverse.json | bot/.iaia_auth/lid-mapping-78769867989112_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-7911480766585_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-7911480766585_reverse.json | bot/.iaia_auth/lid-mapping-7911480766585_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-79182067413179_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-79182067413179_reverse.json | bot/.iaia_auth/lid-mapping-79182067413179_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-79366834897011_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-79366834897011_reverse.json | bot/.iaia_auth/lid-mapping-79366834897011_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-7945857290460_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-7945857290460_reverse.json | bot/.iaia_auth/lid-mapping-7945857290460_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-79461273886834_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-79461273886834_reverse.json | bot/.iaia_auth/lid-mapping-79461273886834_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-79521336275099_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-79521336275099_reverse.json | bot/.iaia_auth/lid-mapping-79521336275099_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-79770545066198_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-79770545066198_reverse.json | bot/.iaia_auth/lid-mapping-79770545066198_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-79946705834081_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-79946705834081_reverse.json | bot/.iaia_auth/lid-mapping-79946705834081_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-80247202558137_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-80247202558137_reverse.json | bot/.iaia_auth/lid-mapping-80247202558137_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-80255926693892_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-80255926693892_reverse.json | bot/.iaia_auth/lid-mapping-80255926693892_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-80852809695299_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-80852809695299_reverse.json | bot/.iaia_auth/lid-mapping-80852809695299_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-80960234238194_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-80960234238194_reverse.json | bot/.iaia_auth/lid-mapping-80960234238194_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-81247929925810_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-81247929925810_reverse.json | bot/.iaia_auth/lid-mapping-81247929925810_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-81381124231282_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-81381124231282_reverse.json | bot/.iaia_auth/lid-mapping-81381124231282_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-81677426643163_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-81677426643163_reverse.json | bot/.iaia_auth/lid-mapping-81677426643163_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-81926668972112_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-81926668972112_reverse.json | bot/.iaia_auth/lid-mapping-81926668972112_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-82566619070681_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-82566619070681_reverse.json | bot/.iaia_auth/lid-mapping-82566619070681_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-82742712782878_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-82742712782878_reverse.json | bot/.iaia_auth/lid-mapping-82742712782878_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-82764137242654_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-82764137242654_reverse.json | bot/.iaia_auth/lid-mapping-82764137242654_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-82772710453398_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-82772710453398_reverse.json | bot/.iaia_auth/lid-mapping-82772710453398_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-82901626560541_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-82901626560541_reverse.json | bot/.iaia_auth/lid-mapping-82901626560541_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-83090605084731_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-83090605084731_reverse.json | bot/.iaia_auth/lid-mapping-83090605084731_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-83210780311724_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-83210780311724_reverse.json | bot/.iaia_auth/lid-mapping-83210780311724_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-83219303145528_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-83219303145528_reverse.json | bot/.iaia_auth/lid-mapping-83219303145528_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-83331039424676_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-83331039424676_reverse.json | bot/.iaia_auth/lid-mapping-83331039424676_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-83348236038390_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-83348236038390_reverse.json | bot/.iaia_auth/lid-mapping-83348236038390_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-84185855328490_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-84185855328490_reverse.json | bot/.iaia_auth/lid-mapping-84185855328490_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-84409092947998_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-84409092947998_reverse.json | bot/.iaia_auth/lid-mapping-84409092947998_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-84610973233229_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-84610973233229_reverse.json | bot/.iaia_auth/lid-mapping-84610973233229_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-84692493701237_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-84692493701237_reverse.json | bot/.iaia_auth/lid-mapping-84692493701237_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-84769803079683_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-84769803079683_reverse.json | bot/.iaia_auth/lid-mapping-84769803079683_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-85207873003553_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-85207873003553_reverse.json | bot/.iaia_auth/lid-mapping-85207873003553_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-85482784481357_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-85482784481357_reverse.json | bot/.iaia_auth/lid-mapping-85482784481357_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-85663189884960_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-85663189884960_reverse.json | bot/.iaia_auth/lid-mapping-85663189884960_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-85663273754690_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-85663273754690_reverse.json | bot/.iaia_auth/lid-mapping-85663273754690_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-85671729471601_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-85671729471601_reverse.json | bot/.iaia_auth/lid-mapping-85671729471601_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-85770647912671_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-85770647912671_reverse.json | bot/.iaia_auth/lid-mapping-85770647912671_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-85787710386222_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-85787710386222_reverse.json | bot/.iaia_auth/lid-mapping-85787710386222_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-85921508638800_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-85921508638800_reverse.json | bot/.iaia_auth/lid-mapping-85921508638800_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-86058377154626_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-86058377154626_reverse.json | bot/.iaia_auth/lid-mapping-86058377154626_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-86191470862389_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-86191470862389_reverse.json | bot/.iaia_auth/lid-mapping-86191470862389_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-87029073346684_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-87029073346684_reverse.json | bot/.iaia_auth/lid-mapping-87029073346684_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-87415653978171_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-87415653978171_reverse.json | bot/.iaia_auth/lid-mapping-87415653978171_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-87587301621843_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-87587301621843_reverse.json | bot/.iaia_auth/lid-mapping-87587301621843_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-87991213137960_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-87991213137960_reverse.json | bot/.iaia_auth/lid-mapping-87991213137960_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-88373381312518_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-88373381312518_reverse.json | bot/.iaia_auth/lid-mapping-88373381312518_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-88742765310196_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-88742765310196_reverse.json | bot/.iaia_auth/lid-mapping-88742765310196_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-88957446520919_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-88957446520919_reverse.json | bot/.iaia_auth/lid-mapping-88957446520919_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-89043362656445_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-89043362656445_reverse.json | bot/.iaia_auth/lid-mapping-89043362656445_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-89125017391359_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-89125017391359_reverse.json | bot/.iaia_auth/lid-mapping-89125017391359_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-89370417717333_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-89370417717333_reverse.json | bot/.iaia_auth/lid-mapping-89370417717333_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-89605986599124_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-89605986599124_reverse.json | bot/.iaia_auth/lid-mapping-89605986599124_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-89653315125257_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-89653315125257_reverse.json | bot/.iaia_auth/lid-mapping-89653315125257_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-89717689348252_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-89717689348252_reverse.json | bot/.iaia_auth/lid-mapping-89717689348252_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-89795015491821_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-89795015491821_reverse.json | bot/.iaia_auth/lid-mapping-89795015491821_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-89816456785942_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-89816456785942_reverse.json | bot/.iaia_auth/lid-mapping-89816456785942_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-89966814191832_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-89966814191832_reverse.json | bot/.iaia_auth/lid-mapping-89966814191832_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-90288970301441_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-90288970301441_reverse.json | bot/.iaia_auth/lid-mapping-90288970301441_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-90318967963704_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-90318967963704_reverse.json | bot/.iaia_auth/lid-mapping-90318967963704_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-90465063973020_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-90465063973020_reverse.json | bot/.iaia_auth/lid-mapping-90465063973020_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-90692579799123_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-90692579799123_reverse.json | bot/.iaia_auth/lid-mapping-90692579799123_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-90778512691279_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-90778512691279_reverse.json | bot/.iaia_auth/lid-mapping-90778512691279_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-90950294573265_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-90950294573265_reverse.json | bot/.iaia_auth/lid-mapping-90950294573265_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-9127426281511_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-9127426281511_reverse.json | bot/.iaia_auth/lid-mapping-9127426281511_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-9144153198827_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-9144153198827_reverse.json | bot/.iaia_auth/lid-mapping-9144153198827_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-91586016878826_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-91586016878826_reverse.json | bot/.iaia_auth/lid-mapping-91586016878826_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-91835192086687_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-91835192086687_reverse.json | bot/.iaia_auth/lid-mapping-91835192086687_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-91950988411051_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-91950988411051_reverse.json | bot/.iaia_auth/lid-mapping-91950988411051_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-92522336514158_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-92522336514158_reverse.json | bot/.iaia_auth/lid-mapping-92522336514158_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-92745674809557_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-92745674809557_reverse.json | bot/.iaia_auth/lid-mapping-92745674809557_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-93656174301317_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-93656174301317_reverse.json | bot/.iaia_auth/lid-mapping-93656174301317_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-93875301560557_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-93875301560557_reverse.json | bot/.iaia_auth/lid-mapping-93875301560557_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-93909510303872_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-93909510303872_reverse.json | bot/.iaia_auth/lid-mapping-93909510303872_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-94055807582440_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-94055807582440_reverse.json | bot/.iaia_auth/lid-mapping-94055807582440_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-94223126786275_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-94223126786275_reverse.json | bot/.iaia_auth/lid-mapping-94223126786275_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-94515100688456_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-94515100688456_reverse.json | bot/.iaia_auth/lid-mapping-94515100688456_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-94837189677173_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-94837189677173_reverse.json | bot/.iaia_auth/lid-mapping-94837189677173_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-95309770285258_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-95309770285258_reverse.json | bot/.iaia_auth/lid-mapping-95309770285258_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-95318242791606_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-95318242791606_reverse.json | bot/.iaia_auth/lid-mapping-95318242791606_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-95374077362340_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-95374077362340_reverse.json | bot/.iaia_auth/lid-mapping-95374077362340_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-95434324373599_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-95434324373599_reverse.json | bot/.iaia_auth/lid-mapping-95434324373599_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-95619393790103_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-95619393790103_reverse.json | bot/.iaia_auth/lid-mapping-95619393790103_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-9569254297820_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-9569254297820_reverse.json | bot/.iaia_auth/lid-mapping-9569254297820_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-95717674774710_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-95717674774710_reverse.json | bot/.iaia_auth/lid-mapping-95717674774710_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-95799413334085_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-95799413334085_reverse.json | bot/.iaia_auth/lid-mapping-95799413334085_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-95850919362591_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-95850919362591_reverse.json | bot/.iaia_auth/lid-mapping-95850919362591_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-95919605330119_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-95919605330119_reverse.json | bot/.iaia_auth/lid-mapping-95919605330119_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-96022768394246_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-96022768394246_reverse.json | bot/.iaia_auth/lid-mapping-96022768394246_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-9616549228623_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-9616549228623_reverse.json | bot/.iaia_auth/lid-mapping-9616549228623_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-9642285518927_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-9642285518927_reverse.json | bot/.iaia_auth/lid-mapping-9642285518927_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-96675469205581_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-96675469205581_reverse.json | bot/.iaia_auth/lid-mapping-96675469205581_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-96812908151011_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-96812908151011_reverse.json | bot/.iaia_auth/lid-mapping-96812908151011_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-96971822002403_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-96971822002403_reverse.json | bot/.iaia_auth/lid-mapping-96971822002403_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-97019049824436_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-97019049824436_reverse.json | bot/.iaia_auth/lid-mapping-97019049824436_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-98672712917107_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-98672712917107_reverse.json | bot/.iaia_auth/lid-mapping-98672712917107_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-98681218932765_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-98681218932765_reverse.json | bot/.iaia_auth/lid-mapping-98681218932765_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-98823019954407_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-98823019954407_reverse.json | bot/.iaia_auth/lid-mapping-98823019954407_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-98900295843904_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-98900295843904_reverse.json | bot/.iaia_auth/lid-mapping-98900295843904_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-99020571697311_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-99020571697311_reverse.json | bot/.iaia_auth/lid-mapping-99020571697311_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-99505852706968_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-99505852706968_reverse.json | bot/.iaia_auth/lid-mapping-99505852706968_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-99518871785713_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-99518871785713_reverse.json | bot/.iaia_auth/lid-mapping-99518871785713_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/lid-mapping-99613243641895_reverse.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/lid-mapping-99613243641895_reverse.json | bot/.iaia_auth/lid-mapping-99613243641895_reverse.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.iaia_auth/tctoken-__index.json`

Fitxers exactament duplicats.

Evidència: `.iaia_auth/tctoken-__index.json | bot/.iaia_auth/tctoken-__index.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.sdp-reflex/bootstrap/260825_0022_PROMPT_Teixidora_Automatitzada_Generacio_Massiva_De_Taxonomia_I_Sinapsis.md`

Fitxers exactament duplicats.

Evidència: `.sdp-reflex/bootstrap/260825_0022_PROMPT_Teixidora_Automatitzada_Generacio_Massiva_De_Taxonomia_I_Sinapsis.md | .sdp-reflex/bootstrap/260825_0128_PROMPT_Teixidora_Automatitzada_Generacio_Massiva_De_Taxonomia_I_Sinapsis.md | .sdp-reflex/bootstrap/260825_0023_PROMPT_Teixidora_Automatitzada_Generacio_Massiva_De_Taxonomia_I_Sinapsis.md`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.wiki-safety/20260714_210751292Z/originals/04_ARXIU_Documents_Historics/Sessio_260714/260714_1444_ACTA_Purga_Enllacos_Fantasma.md.bak`

Fitxers exactament duplicats.

Evidència: `.wiki-safety/20260714_210751292Z/originals/04_ARXIU_Documents_Historics/Sessio_260714/260714_1444_ACTA_Purga_Enllacos_Fantasma.md.bak | .wiki-safety/20260714_210751292Z/originals/04_ARXIU_Documents_Historics/Sessio_260714/260714_1437_ACTA_Purga_Enllacos_Fantasma.md.bak`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.wiki-safety/20260714_210751292Z/originals/05_Escriptori_Soc_de_Poble/260709_0951_DOC_Bundle_Wiki_Sencera_i_Codi_Per_Codex.md.bak`

Fitxers exactament duplicats.

Evidència: `.wiki-safety/20260714_210751292Z/originals/05_Escriptori_Soc_de_Poble/260709_0951_DOC_Bundle_Wiki_Sencera_i_Codi_Per_Codex.md.bak | .wiki-safety/20260714_210751292Z/originals/04_ARXIU_Documents_Historics/Sessio_260712/260709_0951_DOC_Bundle_Wiki_Sencera_i_Codi_Per_Codex.md.bak | .wiki-safety/20260714_210751292Z/quarantine/04_ARXIU_Documents_Historics/Sessio_260712/260709_0951_DOC_Bundle_Wiki_Sencera_i_Codi_Per_Codex.md`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.wiki-safety/20260714_210936778Z/originals/00_SER_Brain_Identitat/C.md.bak`

Fitxers exactament duplicats.

Evidència: `.wiki-safety/20260714_210936778Z/originals/00_SER_Brain_Identitat/C.md.bak | .wiki-safety/20260714_210936778Z/quarantine/00_SER_Brain_Identitat/C.md | .wiki-safety/20260714_210849595Z/originals/00_SER_Brain_Identitat/C.md.bak | .wiki-safety/20260714_210849595Z/quarantine/00_SER_Brain_Identitat/C.md | .wiki-safety/20260714_210933425Z/originals/00_SER_Brain_Identitat/C.md.bak | .wiki-safety/20260714_210933425Z/quarantine/00_SER_Brain_Identitat/C.md | .wiki-safety/20260714_210855124Z/originals/00_SER_Brain_Identitat/C.md.bak | .wiki-safety/20260714_210855124Z/quarantine/00_SER_Brain_Identitat/C.md | .wiki-safety/20260714_210751292Z/originals/02_ACTUAR_Maquina_Tecnica/skills/iaia-maria-core/references/01_identitat_iaia/iaia_maria.md.bak | bot/var/baileys-runtime/outbound-attempts.jsonl | bot/var/bot_var.backup.socdepoble/baileys-runtime/outbound-attempts.jsonl | .wwebjs_auth/session/first_party_sets.db-journal | .wwebjs_auth/session/Default/Safe Browsing Cookies-journal | .wwebjs_auth/session/Default/ServerCertificate-journal | .wwebjs_auth/session/Default/heavy_ad_intervention_opt_out.db-journal | .wwebjs_auth/session/Default/Shortcuts-journal | .wwebjs_auth/session/Default/SharedStorage-wal | .wwebjs_auth/session/Default/Favicons-journal | .wwebjs_auth/session/Default/Affiliation Database-journal | .wwebjs_auth/session/Default/Network Action Predictor-journal | .wwebjs_auth/session/Default/Account Web Data-journal | .wwebjs_auth/session/Default/History-journal | .wwebjs_auth/session/Default/Login Data For Account-journal | .wwebjs_auth/session/Default/Trust Tokens-journal | .wwebjs_auth/session/Default/Web Data-journal | .wwebjs_auth/session/Default/Top Sites-journal | .wwebjs_auth/session/Default/Login Data-journal | .wwebjs_auth/session/segmentation_platform/ukm_db-wal | .wwebjs_auth/session/GPUPersistentCache/GPUCache/JJSXBCRJVEXH5LTPGVFMEBRAY3EZ63OB/cache.journal | .wwebjs_auth/session/Default/Session Storage/LOCK | .wwebjs_auth/session/Default/Session Storage/LOG | .wwebjs_auth/session/Default/Session Storage/LOG.old | .wwebjs_auth/session/Default/GCM Store/LOCK | .wwebjs_auth/session/Default/GCM Store/LOG | .wwebjs_auth/session/Default/chrome_cart_db/LOCK | .wwebjs_auth/session/Default/chrome_cart_db/LOG | .wwebjs_auth/session/Default/chrome_cart_db/LOG.old | .wwebjs_auth/session/Default/VideoDecodeStats/LOCK | .wwebjs_auth/session/Default/VideoDecodeStats/LOG | .wwebjs_auth/session/Default/WebStorage/QuotaManager-journal | .wwebjs_auth/session/Default/AutofillStrikeDatabase/LOCK | .wwebjs_auth/session/Default/AutofillStrikeDatabase/LOG | .wwebjs_auth/session/Default/AutofillStrikeDatabase/LOG.old | .wwebjs_auth/session/Default/Site Characteristics Database/LOCK | .wwebjs_auth/session/Default/Site Characteristics Database/LOG | .wwebjs_auth/session/Default/PersistentOriginTrials/LOCK | .wwebjs_auth/session/Default/PersistentOriginTrials/LOG | .wwebjs_auth/session/Default/PersistentOriginTrials/LOG.old | .wwebjs_auth/session/Default/Extension Scripts/LOCK | .wwebjs_auth/session/Default/Extension Rules/LOCK | .wwebjs_auth/session/Default/discounts_db/LOCK | .wwebjs_auth/session/Default/discounts_db/LOG | .wwebjs_auth/session/Default/discounts_db/LOG.old | .wwebjs_auth/session/Default/Shared Dictionary/db-journal | .wwebjs_auth/session/Default/Extension State/LOCK | .wwebjs_auth/session/Default/Extension State/LOG | .wwebjs_auth/session/Default/commerce_subscription_db/LOCK | .wwebjs_auth/session/Default/commerce_subscription_db/LOG | .wwebjs_auth/session/Default/commerce_subscription_db/LOG.old | .wwebjs_auth/session/Default/discount_infos_db/LOCK | .wwebjs_auth/session/Default/discount_infos_db/LOG | .wwebjs_auth/session/Default/discount_infos_db/LOG.old | .wwebjs_auth/session/Default/BudgetDatabase/LOCK | .wwebjs_auth/session/Default/BudgetDatabase/LOG | .wwebjs_auth/session/Default/BudgetDatabase/LOG.old | .wwebjs_auth/session/Default/shared_proto_db/LOCK | .wwebjs_auth/session/Default/AutofillAiModelCache/LOCK | .wwebjs_auth/session/Default/AutofillAiModelCache/LOG | .wwebjs_auth/session/Default/AutofillAiModelCache/LOG.old | .wwebjs_auth/session/Default/ClientCertificates/LOCK | .wwebjs_auth/session/Default/ClientCertificates/LOG | .wwebjs_auth/session/Default/ClientCertificates/LOG.old | .wwebjs_auth/session/Default/parcel_tracking_db/LOCK | .wwebjs_auth/session/Default/parcel_tracking_db/LOG | .wwebjs_auth/session/Default/parcel_tracking_db/LOG.old | .wwebjs_auth/session/Default/Segmentation Platform/SegmentInfoDB/LOCK | .wwebjs_auth/session/Default/Segmentation Platform/SegmentInfoDB/LOG | .wwebjs_auth/session/Default/Segmentation Platform/SegmentInfoDB/LOG.old | .wwebjs_auth/session/Default/Segmentation Platform/SignalStorageConfigDB/LOCK | .wwebjs_auth/session/Default/Segmentation Platform/SignalStorageConfigDB/LOG | .wwebjs_auth/session/Default/Segmentation Platform/SignalStorageConfigDB/LOG.old | .wwebjs_auth/session/Default/Segmentation Platform/SignalDB/LOCK | .wwebjs_auth/session/Default/Segmentation Platform/SignalDB/LOG | .wwebjs_auth/session/Default/Segmentation Platform/SignalDB/LOG.old | .wwebjs_auth/session/Default/Local Storage/leveldb/LOCK | .wwebjs_auth/session/Default/Sync Data/LevelDB/LOCK | .wwebjs_auth/session/Default/Sync Data/LevelDB/LOG | .wwebjs_auth/session/Default/shared_proto_db/metadata/LOCK | .wwebjs_auth/session/Default/shared_proto_db/metadata/LOG | .wwebjs_auth/session/Default/shared_proto_db/metadata/LOG.old | .wwebjs_auth/session/Default/Service Worker/Database/LOCK | .wwebjs_auth/session/Default/Service Worker/Database/LOG | .wwebjs_auth/session/Default/IndexedDB/https_web.whatsapp.com_0.indexeddb.leveldb/LOCK | _wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_prompt_iso.md | public/assets/pages/05_events/.keep | public/assets/pages/04_pobles/.keep | public/assets/pages/02_mur/.keep | public/assets/pages/08_bloc_de_notes/.keep | public/assets/pages/07_multimedia/.keep | public/assets/pages/06_mapa/.keep | public/assets/pages/03_mercat/.keep | public/assets/pages/01_chat/.keep | _templates/gestoria_base/01_Identitat_Legal/.gitkeep | _templates/gestoria_base/02_Facturacio/.gitkeep | _templates/gestoria_base/00_Tauler_Central/.gitkeep | _templates/gestoria_base/03_Burocracia/.gitkeep | _templates/gestoria_base/90_Arxiu_Historic/.gitkeep | _templates/gestoria_base/03_Projectes_Actius/.gitkeep | _templates/gestoria_base/04_Eines_de_Pedra_Seca/.gitkeep`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.wwebjs_auth/session/Default/DawnGraphiteCache/data_0`

Fitxers exactament duplicats.

Evidència: `.wwebjs_auth/session/Default/DawnGraphiteCache/data_0 | .wwebjs_auth/session/Default/GPUCache/data_0 | .wwebjs_auth/session/Default/DawnWebGPUCache/data_0`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.wwebjs_auth/session/Default/DawnGraphiteCache/data_2`

Fitxers exactament duplicats.

Evidència: `.wwebjs_auth/session/Default/DawnGraphiteCache/data_2 | .wwebjs_auth/session/Default/GPUCache/data_2 | .wwebjs_auth/session/Default/DawnWebGPUCache/data_2`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.wwebjs_auth/session/Default/DawnGraphiteCache/data_3`

Fitxers exactament duplicats.

Evidència: `.wwebjs_auth/session/Default/DawnGraphiteCache/data_3 | .wwebjs_auth/session/Default/GPUCache/data_3 | .wwebjs_auth/session/Default/DawnWebGPUCache/data_3`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.wwebjs_auth/session/Default/Extension Scripts/000003.log`

Fitxers exactament duplicats.

Evidència: `.wwebjs_auth/session/Default/Extension Scripts/000003.log | .wwebjs_auth/session/Default/Extension Rules/000003.log`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.wwebjs_auth/session/Default/Login Data`

Fitxers exactament duplicats.

Evidència: `.wwebjs_auth/session/Default/Login Data | .wwebjs_auth/session/Default/Login Data For Account`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.wwebjs_auth/session/Default/Session Storage/CURRENT`

Fitxers exactament duplicats.

Evidència: `.wwebjs_auth/session/Default/Session Storage/CURRENT | .wwebjs_auth/session/Default/GCM Store/CURRENT | .wwebjs_auth/session/Default/Site Characteristics Database/CURRENT | .wwebjs_auth/session/Default/Extension Scripts/CURRENT | .wwebjs_auth/session/Default/Extension Rules/CURRENT | .wwebjs_auth/session/Default/Extension State/CURRENT | .wwebjs_auth/session/Default/shared_proto_db/CURRENT | .wwebjs_auth/session/Default/Local Storage/leveldb/CURRENT | .wwebjs_auth/session/Default/Sync Data/LevelDB/CURRENT | .wwebjs_auth/session/Default/shared_proto_db/metadata/CURRENT | .wwebjs_auth/session/Default/Service Worker/Database/CURRENT | .wwebjs_auth/session/Default/IndexedDB/https_web.whatsapp.com_0.indexeddb.leveldb/CURRENT`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.wwebjs_auth/session/Default/Session Storage/MANIFEST-000001`

Fitxers exactament duplicats.

Evidència: `.wwebjs_auth/session/Default/Session Storage/MANIFEST-000001 | .wwebjs_auth/session/Default/GCM Store/MANIFEST-000001 | .wwebjs_auth/session/Default/Extension Scripts/MANIFEST-000001 | .wwebjs_auth/session/Default/Extension Rules/MANIFEST-000001 | .wwebjs_auth/session/Default/Extension State/MANIFEST-000001 | .wwebjs_auth/session/Default/shared_proto_db/MANIFEST-000001 | .wwebjs_auth/session/Default/Sync Data/LevelDB/MANIFEST-000001 | .wwebjs_auth/session/Default/shared_proto_db/metadata/MANIFEST-000001 | .wwebjs_auth/session/Default/Service Worker/Database/MANIFEST-000001 | .wwebjs_auth/session/Default/Site Characteristics Database/lost/MANIFEST-000001`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.wwebjs_auth/session/Default/Shared Dictionary/cache/index`

Fitxers exactament duplicats.

Evidència: `.wwebjs_auth/session/Default/Shared Dictionary/cache/index | .wwebjs_auth/session/Default/Service Worker/ScriptCache/index | .wwebjs_auth/session/Default/Service Worker/CacheStorage/0bf6ab7f94a21cdc9c1649f884333ec20f40a544/afd0a2e4-51bf-455c-a1dd-6995a1a8b296/index | .wwebjs_auth/session/Default/Service Worker/CacheStorage/0bf6ab7f94a21cdc9c1649f884333ec20f40a544/02ee916c-9251-498d-8586-cd3bf7d3037b/index | .wwebjs_auth/session/Default/Service Worker/CacheStorage/0bf6ab7f94a21cdc9c1649f884333ec20f40a544/f57c496f-0316-40ff-aa4f-2798c1df5b34/index`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.wwebjs_auth/session/Default/SharedStorage`

Fitxers exactament duplicats.

Evidència: `.wwebjs_auth/session/Default/SharedStorage | .wwebjs_auth/session/GPUPersistentCache/GPUCache/JJSXBCRJVEXH5LTPGVFMEBRAY3EZ63OB/cache.db`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.wwebjs_auth/session/GraphiteDawnCache/f_000001`

Fitxers exactament duplicats.

Evidència: `.wwebjs_auth/session/GraphiteDawnCache/f_000001 | .wwebjs_auth/session/GraphiteDawnCache/f_000002`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `.wwebjs_auth/session/TrustTokenKeyCommitments/2026.3.23.1/LICENSE`

Fitxers exactament duplicats.

Evidència: `.wwebjs_auth/session/TrustTokenKeyCommitments/2026.3.23.1/LICENSE | .wwebjs_auth/session/FirstPartySetsPreloaded/2025.7.24.0/LICENSE | .wwebjs_auth/session/CertificateRevocation/10676/LICENSE | .wwebjs_auth/session/CertificateRevocation/10678/LICENSE`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] wiki.basename-duplicate — `_wiki_de_poble/00_INDEX.md`

Nom base duplicat: els wikilinks poden ser ambigus.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_INDEX.md:29`

Wikilink sense objectiu resoluble.

Evidència: `260811_0512_ACTA_MARMOTA_Fortalesa_ShadowDOM`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_INDEX.md:32`

Wikilink sense objectiu resoluble.

Evidència: `00_INDEX_ARXIU`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_INDEX.md:40`

Wikilink sense objectiu resoluble.

Evidència: `RONDA_A_decisions`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_INDEX.md:44`

Wikilink sense objectiu resoluble.

Evidència: `260809_0530_ACTA_SESSIO_Auditoria_Pedra_Seca`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_INDEX.md:45`

Wikilink sense objectiu resoluble.

Evidència: `260813_0410_PETORRETA_RESTAURACIO_UI`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_INDEX.md:46`

Wikilink sense objectiu resoluble.

Evidència: `260813_0455_ACTA_MARMOTA_Restauracio_UI_i_WordPress`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_INDEX.md:47`

Wikilink sense objectiu resoluble.

Evidència: `260813_0725_ACTA_MARMOTA_Sanejament_Pedra_Seca`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/CULTURA.md`

L'ancoratge automàtic apareix 5 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/CULTURA.md:76`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/CULTURA.md:80`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/CULTURA.md:109`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/CULTURA.md:149`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/CULTURA.md:153`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/GENOMA.md`

L'ancoratge automàtic apareix 133 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/GENOMA.md:31`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/GENOMA.md:2013`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/GENOMA.md:2017`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/GENOMA.md:2070`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/GENOMA.md:2074`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/GENOMA.md:2163`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/GENOMA.md:2167`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/GENOMA.md:2180`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/GENOMA.md:2251`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/GENOMA.md:2338`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context.md`

L'ancoratge automàtic apareix 138 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context.md:31`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context.md:2013`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context.md:2017`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context.md:2070`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context.md:2074`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context.md:2163`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context.md:2167`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context.md:2180`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context.md:2251`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context.md:2338`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context_pack.md`

L'ancoratge automàtic apareix 6 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context_pack.md:360`

Wikilink sense objectiu resoluble.

Evidència: `00_INDEX_CONSELL_SUBVENCIO`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context_pack.md:366`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context_pack.md:413`

Wikilink sense objectiu resoluble.

Evidència: `260727_1405_DOCUMENT_Esborrany_Correu_Sollutia_Sobre_Arquitectura_Carpetes`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context_pack.md:414`

Wikilink sense objectiu resoluble.

Evidència: `260727_1944_PETORRETA_Bot_WhatsApp_Robust`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context_pack.md:415`

Wikilink sense objectiu resoluble.

Evidència: `260728_0219_PETORRETA_IAIA_50k_Consell`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context_pack.md:416`

Wikilink sense objectiu resoluble.

Evidència: `260728_0220_PETORRETA_IAIA_50k_Consell_FULL`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context_pack.md:417`

Wikilink sense objectiu resoluble.

Evidència: `260728_0245_RESPOSTA_QWEN_Subvencio`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context_pack.md:527`

Wikilink sense objectiu resoluble.

Evidència: `00_INDEX_QUARANTENA`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context_pack.md:531`

Wikilink sense objectiu resoluble.

Evidència: `260805_0430_SUPER_BRIEFING_Auditoria_Pedra_Seca`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context_pack.md:638`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context_pack.md:645`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context_pack.md:652`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_AGENTS_I_SKILLS_MIRROR/sdp_master_context_pack.md:683`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/00_BIOS.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_BIOS.md:38`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_BIOS.md:43`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md:18`

Wikilink sense objectiu resoluble.

Evidència: `00_INDEX_ARXIU`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md:64`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/01_IDENTITAT.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/01_IDENTITAT.md:34`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/01_IDENTITAT.md:42`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/01_IDENTITAT.md:47`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/02_EQUIP_IA.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/00_SER_Brain_Identitat/02_EQUIP_IA.md:65`

Wikilink sense objectiu resoluble.

Evidència: `00_INDEX_CONSELL_SUBVENCIO`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/02_EQUIP_IA.md:100`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/02_EQUIP_IA.md:105`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/02_GENOTIP.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/02_GENOTIP.md:29`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/02_GENOTIP.md:34`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/03_Consola_Termodinamica.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/03_Consola_Termodinamica.md:66`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/03_Consola_Termodinamica.md:71`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/CORE_Registre_Automillora.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/CORE_Registre_Automillora.md:46`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/CORE_Registre_Automillora.md:51`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/DOC_Logos_Oficials.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/DOC_Logos_Oficials.md:39`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/DOC_Logos_Oficials.md:44`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/DOC_Taula_Mestra.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/DOC_Taula_Mestra.md:12`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/DOC_Taula_Mestra.md:17`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/Soci_Sollutia.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Soci_Sollutia.md:228`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Soci_Sollutia.md:233`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/a11y_debugging.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/a11y_debugging.md:92`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/a11y_debugging.md:93`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/a11y_debugging.md:98`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/chrome_devtools.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/chrome_devtools.md:52`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/chrome_devtools.md:53`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/chrome_devtools.md:58`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/chrome_extensions.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/chrome_extensions.md:324`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/chrome_extensions.md:325`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/chrome_extensions.md:330`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/debug_optimize_lcp.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/debug_optimize_lcp.md:127`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/debug_optimize_lcp.md:128`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/debug_optimize_lcp.md:133`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/google_antigravity_sdk.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/google_antigravity_sdk.md:97`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/google_antigravity_sdk.md:98`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/google_antigravity_sdk.md:103`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/memory_leak_debugging.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/memory_leak_debugging.md:54`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/memory_leak_debugging.md:55`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/memory_leak_debugging.md:60`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/modern_web_guidance.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/modern_web_guidance.md:79`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/modern_web_guidance.md:80`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/modern_web_guidance.md:85`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/troubleshooting.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/troubleshooting.md:97`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/troubleshooting.md:98`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/Sollutia/troubleshooting.md:103`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/anatomia_cognitiva.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/anatomia_cognitiva.md:31`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/anatomia_cognitiva.md:36`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/antigravity.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/antigravity.md:26`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/antigravity.md:31`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/connectors_mcp_disseny.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/connectors_mcp_disseny.md:52`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/connectors_mcp_disseny.md:57`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/el_projecte.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/el_projecte.md:60`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/el_projecte.md:65`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/identitat_visual.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/identitat_visual.md:63`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/identitat_visual.md:68`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/00_SER_Brain_Identitat/perfil_psiquiatric.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/perfil_psiquiatric.md:74`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/00_SER_Brain_Identitat/perfil_psiquiatric.md:79`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/01_SABER_Cultura_Coneixement/00_visio_i_pilars.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/00_visio_i_pilars.md:40`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/00_visio_i_pilars.md:45`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/01_SABER_Cultura_Coneixement/01_trellat.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/01_trellat.md:39`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/01_trellat.md:44`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/Coneixement.md:7`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/Govern.md:7`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/Graf.md:7`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/Identitat.md:7`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/01_SABER_Cultura_Coneixement/Llibre_Blanc_Produccio_Pedra_Seca.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/Llibre_Blanc_Produccio_Pedra_Seca.md:62`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/Llibre_Blanc_Produccio_Pedra_Seca.md:67`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/Maquina.md:7`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/Sistema_Immunitari.md:49`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_L_Anima.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_L_Anima.md:38`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_L_Anima.md:43`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_La_Forja.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_La_Forja.md:36`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_La_Forja.md:41`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_Protocol_Lazaro.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_Protocol_Lazaro.md:37`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_Protocol_Lazaro.md:42`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_Sistema_Nervios.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_Sistema_Nervios.md:41`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/codex_huma/Arquitectura_Sistema_Nervios.md:46`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/01_SABER_Cultura_Coneixement/connexio_radical.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/connexio_radical.md:28`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/01_SABER_Cultura_Coneixement/connexio_radical.md:33`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/00_arquitectura_tecnica_unificada.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/00_arquitectura_tecnica_unificada.md:81`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/00_arquitectura_tecnica_unificada.md:107`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/00_arquitectura_tecnica_unificada.md:112`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/00_plantilles.md`

L'ancoratge automàtic apareix 3 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/00_plantilles.md:25`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/00_plantilles.md:30`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/00_plantilles.md:31`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/00_plantilles.md:36`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_acta_unica.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_acta_unica.md:43`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_acta_unica.md:48`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_acta_unica.md:49`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_brainstorming.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_brainstorming.md:45`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_brainstorming.md:50`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_brainstorming.md:51`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_branding.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_branding.md:47`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_branding.md:52`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_branding.md:53`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_creador_skills.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_creador_skills.md:47`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_creador_skills.md:52`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_creador_skills.md:53`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_doc_to_app.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_doc_to_app.md:46`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_doc_to_app.md:51`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_doc_to_app.md:52`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_modo_produccion.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_modo_produccion.md:42`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_modo_produccion.md:47`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_modo_produccion.md:48`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_planificacio.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_planificacio.md:39`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_planificacio.md:44`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_planificacio.md:45`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_skill_trellat.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_skill_trellat.md:32`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_skill_trellat.md:37`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/07_plantilles/plantilla_skill_trellat.md:38`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/SDP_LOCK.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/SDP_LOCK.md:43`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/SDP_LOCK.md:48`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/obsidian_plugins/Homepage.md:24`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/obsidian_plugins/Plugins.md:213`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/plantilles/PLANTILLA_ISO_SDP.md:150`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/AUDITORIA_CANONICA.md`

L'ancoratge automàtic apareix 3 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/AUDITORIA_CANONICA.md:80`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/AUDITORIA_CANONICA.md:85`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/AUDITORIA_CANONICA.md:86`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/AUDITORIA_CANONICA.md:91`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/MOTOR_OFFLINE.md`

L'ancoratge automàtic apareix 3 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/MOTOR_OFFLINE.md:89`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/MOTOR_OFFLINE.md:94`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/MOTOR_OFFLINE.md:95`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/MOTOR_OFFLINE.md:100`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/a11y_seo_trellat.md`

L'ancoratge automàtic apareix 3 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/a11y_seo_trellat.md:52`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/a11y_seo_trellat.md:57`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/a11y_seo_trellat.md:58`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/a11y_seo_trellat.md:63`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/futur_adaptacio.md`

L'ancoratge automàtic apareix 3 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/futur_adaptacio.md:58`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/futur_adaptacio.md:63`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/futur_adaptacio.md:64`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/futur_adaptacio.md:69`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/index_trellat.md`

L'ancoratge automàtic apareix 3 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/index_trellat.md:62`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/index_trellat.md:67`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/index_trellat.md:68`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/index_trellat.md:73`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/seguretat_execucio.md`

L'ancoratge automàtic apareix 3 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/seguretat_execucio.md:95`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/seguretat_execucio.md:100`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/seguretat_execucio.md:101`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/seguretat_execucio.md:106`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/self_repair.md`

L'ancoratge automàtic apareix 3 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/self_repair.md:81`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/self_repair.md:86`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/self_repair.md:87`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/self_repair.md:92`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro_execucio.md`

L'ancoratge automàtic apareix 3 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro_execucio.md:47`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro_execucio.md:75`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro_execucio.md:87`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro_execucio.md:92`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro_execucio.md:93`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/skills/successio_lazaro_execucio.md:98`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/DOC_Governanca.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/DOC_Governanca.md:56`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/DOC_Governanca.md:61`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/ESTANDARD_Pedra_Seca.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/ESTANDARD_Pedra_Seca.md:190`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/ESTANDARD_Pedra_Seca.md:195`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/ESTANDARD_Tokens_Pedra_Seca.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/ESTANDARD_Tokens_Pedra_Seca.md:83`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/ESTANDARD_Tokens_Pedra_Seca.md:88`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/ESTANDARD_UI_Universal.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/ESTANDARD_UI_Universal.md:189`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/ESTANDARD_UI_Universal.md:194`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/FORJA_TO_CORE.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/FORJA_TO_CORE.md:51`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/FORJA_TO_CORE.md:56`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.anchor-duplicated — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/LLEI_05_Privacitat.md`

L'ancoratge automàtic apareix 2 vegades.

Acció: Normalitza'l a una única aparició o elimina este ritual redundant.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/LLEI_05_Privacitat.md:87`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/LLEI_05_Privacitat.md:92`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/PLA_DIRECTOR_Legal_i_Subvencions.md:10`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/PLA_DIRECTOR_Legal_i_Subvencions.md:82`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/03_GOVERNAR_Normativa_Regles/PLA_DIRECTOR_Viabilitat_Economica.md:85`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.frontmatter-key-missing — `_wiki_de_poble/04_arquitectura_disseny/model_arquitectonic_pedra_seca_dola.md`

Falta la clau de frontmatter 'estat'.

### [MEDIUM] wiki.frontmatter-key-missing — `_wiki_de_poble/04_arquitectura_disseny/model_arquitectonic_pedra_seca_dola.md`

Falta la clau de frontmatter 'tipus'.

### [MEDIUM] wiki.frontmatter-key-missing — `_wiki_de_poble/04_arquitectura_disseny/model_arquitectonic_pedra_seca_dola.md`

Falta la clau de frontmatter 'description'.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:7`

Wikilink sense objectiu resoluble.

Evidència: `00_INDEX_QUARANTENA`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:12`

Wikilink sense objectiu resoluble.

Evidència: `260823_1211_ACTA_Sintesi_Auditoria_Consell`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:13`

Wikilink sense objectiu resoluble.

Evidència: `260824_0209_ACTA_Sintesi_Auditoria_Pedra_Seca_Extrema`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:16`

Wikilink sense objectiu resoluble.

Evidència: `260821_0731_ACTA_MARMOTA_Tancament_Sessio_Wordpress_SEO_Escalat`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:17`

Wikilink sense objectiu resoluble.

Evidència: `260824_0100_ACTA_MARMOTA_Pla_Immediat_Seient_Cinc`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:18`

Wikilink sense objectiu resoluble.

Evidència: `260824_0412_ACTA_MARMOTA_Recuperacio_Disseny_i_Explicacio_Forense`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:19`

Wikilink sense objectiu resoluble.

Evidència: `260824_0552_ACTA_MARMOTA_Sublimacio_i_Neteja_Final`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:22`

Wikilink sense objectiu resoluble.

Evidència: `260824_0320_BRIEFING_Sollutia_Routing`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:25`

Wikilink sense objectiu resoluble.

Evidència: `260823_1150_PETORRETA_Auditoria_Global_Codi`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:26`

Wikilink sense objectiu resoluble.

Evidència: `260823_1330_PETORRETA_Auditoria_Inversa`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:27`

Wikilink sense objectiu resoluble.

Evidència: `260823_2145_PETORRETA_Alineacio_HTML`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:28`

Wikilink sense objectiu resoluble.

Evidència: `260823_2150_PETORRETA_Alineacio_HTML`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:29`

Wikilink sense objectiu resoluble.

Evidència: `260824_0154_PROMPT_Auditoria_Pedra_Seca_Extrema`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:30`

Wikilink sense objectiu resoluble.

Evidència: `260824_0158_BUNDLE_Codi_Complet_Absolut_Sollutia_Pedra_Seca`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:31`

Wikilink sense objectiu resoluble.

Evidència: `260824_0211_BUNDLE_Mini_Auditoria_Mistral_Vibe`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:32`

Wikilink sense objectiu resoluble.

Evidència: `260824_0320_PETORRETA_Router_Sollutia`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:42`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:43`

Wikilink sense objectiu resoluble.

Evidència: `260824_1438_PETORRETA_Auditoria_Inversa_i_Skills`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:44`

Wikilink sense objectiu resoluble.

Evidència: `260824_1438_BUNDLE_Auditoria_Global_Sollutia`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:45`

Wikilink sense objectiu resoluble.

Evidència: `260824_1450_ACTA_Auditoria_Arquitectura_Per_Gemini`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:46`

Wikilink sense objectiu resoluble.

Evidència: `260824_1451_ACTA_Auditoria_Arquitectura_Per_Grok`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:47`

Wikilink sense objectiu resoluble.

Evidència: `260824_1452_ACTA_Auditoria_Arquitectura_Per_Perplexity`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:48`

Wikilink sense objectiu resoluble.

Evidència: `260824_1459_ACTA_Auditoria_Arquitectura_Per_Dola`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:49`

Wikilink sense objectiu resoluble.

Evidència: `260824_1502_ACTA_Auditoria_Arquitectura_Per_Z`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:50`

Wikilink sense objectiu resoluble.

Evidència: `260824_1505_ACTA_Auditoria_Arquitectura_Per_Claude_P1`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:51`

Wikilink sense objectiu resoluble.

Evidència: `260824_1507_ACTA_Auditoria_Arquitectura_Per_Kimi`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:52`

Wikilink sense objectiu resoluble.

Evidència: `260824_1508_ACTA_Auditoria_Arquitectura_Per_Copilot`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:53`

Wikilink sense objectiu resoluble.

Evidència: `260824_1510_ACTA_Auditoria_Arquitectura_Per_Qwen`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:54`

Wikilink sense objectiu resoluble.

Evidència: `260824_1517_ACTA_Auditoria_Arquitectura_Per_Claude_P2`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:55`

Wikilink sense objectiu resoluble.

Evidència: `260824_1520_ACTA_Auditoria_Arquitectura_Per_Codex`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:56`

Wikilink sense objectiu resoluble.

Evidència: `260824_1531_PETORRETA_Reestructuracio_Cervell`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:58`

Wikilink sense objectiu resoluble.

Evidència: `260824_1550_ACTA_Proposta_Reestructuracio_Gemini`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:59`

Wikilink sense objectiu resoluble.

Evidència: `260824_1555_ACTA_Proposta_Reestructuracio_Copilot`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:60`

Wikilink sense objectiu resoluble.

Evidència: `260824_1556_ACTA_Proposta_Reestructuracio_Grok`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:61`

Wikilink sense objectiu resoluble.

Evidència: `260824_1556_ACTA_Proposta_Reestructuracio_Vibe`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:62`

Wikilink sense objectiu resoluble.

Evidència: `260824_1557_ACTA_Proposta_Reestructuracio_Perplexity`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:63`

Wikilink sense objectiu resoluble.

Evidència: `260824_1558_ACTA_Proposta_Reestructuracio_Kimi`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:64`

Wikilink sense objectiu resoluble.

Evidència: `260824_1559_ACTA_Proposta_Reestructuracio_Dola`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:65`

Wikilink sense objectiu resoluble.

Evidència: `260824_1600_ACTA_Proposta_Reestructuracio_Deepseek`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:66`

Wikilink sense objectiu resoluble.

Evidència: `260824_1601_ACTA_Proposta_Reestructuracio_Z`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:67`

Wikilink sense objectiu resoluble.

Evidència: `260824_1604_ACTA_Proposta_Reestructuracio_Codex`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:68`

Wikilink sense objectiu resoluble.

Evidència: `260824_1606_ACTA_Subagent_TimeMachine_Codex`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:69`

Wikilink sense objectiu resoluble.

Evidència: `260824_1607_ACTA_Subagent_Dependenices_Codex`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:70`

Wikilink sense objectiu resoluble.

Evidència: `260824_1612_ACTA_Proposta_Reestructuracio_Qwen`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-broken — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_INDEX_ESCRIPTORI.md:71`

Wikilink sense objectiu resoluble.

Evidència: `260824_1615_ACTA_Veredicte_Final_Claude`

Acció: Crea un MOC/nota real o substitueix l'enllaç per text/ruta de fitxer.

### [MEDIUM] wiki.link-ambiguous — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/260826_0415_PETORRETA_Auditoria_Global.md:20`

Wikilink amb més d'un objectiu possible.

Evidència: `_wiki_de_poble/00_INDEX.md | _wiki_de_poble/00_SER_Brain_Identitat/00_INDEX.md`

### [MEDIUM] hygiene.exact-duplicate — `assets/img/aplec_danses_1774952191348.png`

Fitxers exactament duplicats.

Evidència: `assets/img/aplec_danses_1774952191348.png | public/assets/uploads/brain/aplec_danses_1774952191348.png | wordpress-plugin/assets/img/aplec_danses_1774952191348.png | wordpress-plugin/assets/uploads/brain/aplec_danses_1774952191348.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `assets/img/art_trellat_farmer_1774708525806.png`

Fitxers exactament duplicats.

Evidència: `assets/img/art_trellat_farmer_1774708525806.png | public/assets/uploads/brain/art_trellat_farmer_1774708525806.png | public/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-trellat-v3.png | wordpress-plugin/assets/img/art_trellat_farmer_1774708525806.png | wordpress-plugin/assets/uploads/brain/art_trellat_farmer_1774708525806.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-trellat-v3.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `assets/img/art_trellat_v2_1774708257858.png`

Fitxers exactament duplicats.

Evidència: `assets/img/art_trellat_v2_1774708257858.png | public/assets/uploads/brain/art_trellat_v2_1774708257858.png | wordpress-plugin/assets/img/art_trellat_v2_1774708257858.png | wordpress-plugin/assets/uploads/brain/art_trellat_v2_1774708257858.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `assets/img/hero_panoramic_landscape_1774710654078.png`

Fitxers exactament duplicats.

Evidència: `assets/img/hero_panoramic_landscape_1774710654078.png | public/assets/uploads/brain/hero_panoramic_landscape_1774710654078.png | wordpress-plugin/assets/img/hero_panoramic_landscape_1774710654078.png | wordpress-plugin/assets/uploads/brain/hero_panoramic_landscape_1774710654078.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `assets/img/hero_panoramic_rural_view_1774720664221.png`

Fitxers exactament duplicats.

Evidència: `assets/img/hero_panoramic_rural_view_1774720664221.png | public/assets/uploads/brain/hero_panoramic_rural_view_1774720664221.png | public/assets/uploads/brain/nano_astronauta_esmorzar_1773441997380.png | public/assets/uploads/empresa/soc-de-poble/posts/el-projecte/exemple-de-poble-001.png | wordpress-plugin/assets/img/hero_panoramic_rural_view_1774720664221.png | wordpress-plugin/assets/uploads/brain/hero_panoramic_rural_view_1774720664221.png | wordpress-plugin/assets/uploads/brain/nano_astronauta_esmorzar_1773441997380.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/el-projecte/exemple-de-poble-001.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `assets/img/hero_serrella_comic_1774709602282.png`

Fitxers exactament duplicats.

Evidència: `assets/img/hero_serrella_comic_1774709602282.png | public/assets/uploads/brain/hero_serrella_comic_1774709602282.png | public/assets/uploads/avatars/avatar_samir_comic.png | public/assets/uploads/gent/avatars/avatar_samir_comic.png | wordpress-plugin/assets/img/hero_serrella_comic_1774709602282.png | wordpress-plugin/assets/uploads/brain/hero_serrella_comic_1774709602282.png | wordpress-plugin/assets/uploads/avatars/avatar_samir_comic.png | wordpress-plugin/assets/uploads/gent/avatars/avatar_samir_comic.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `assets/img/nano_mel_font_roja_1774216345755.png`

Fitxers exactament duplicats.

Evidència: `assets/img/nano_mel_font_roja_1774216345755.png | public/assets/uploads/brain/nano_mel_font_roja_1774216345755.png | wordpress-plugin/assets/img/nano_mel_font_roja_1774216345755.png | wordpress-plugin/assets/uploads/brain/nano_mel_font_roja_1774216345755.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `assets/img/nano_mercat_llaurador_1774197050578.png`

Fitxers exactament duplicats.

Evidència: `assets/img/nano_mercat_llaurador_1774197050578.png | public/assets/uploads/brain/nano_mercat_llaurador_1774197050578.png | wordpress-plugin/assets/img/nano_mercat_llaurador_1774197050578.png | wordpress-plugin/assets/uploads/brain/nano_mercat_llaurador_1774197050578.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `assets/img/nano_oli_oliva_1774198089084.png`

Fitxers exactament duplicats.

Evidència: `assets/img/nano_oli_oliva_1774198089084.png | public/assets/uploads/brain/nano_oli_oliva_1774198089084.png | wordpress-plugin/assets/img/nano_oli_oliva_1774198089084.png | wordpress-plugin/assets/uploads/brain/nano_oli_oliva_1774198089084.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `assets/img/que-es-socdepoble-1.jpg`

Fitxers exactament duplicats.

Evidència: `assets/img/que-es-socdepoble-1.jpg | wordpress-plugin/assets/img/que-es-socdepoble-1.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `assets/img/que-es-socdepoble-2.jpg`

Fitxers exactament duplicats.

Evidència: `assets/img/que-es-socdepoble-2.jpg | wordpress-plugin/assets/img/que-es-socdepoble-2.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `assets/img/que-es-socdepoble-3.jpg`

Fitxers exactament duplicats.

Evidència: `assets/img/que-es-socdepoble-3.jpg | wordpress-plugin/assets/img/que-es-socdepoble-3.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `assets/img/que-es-socdepoble-4.jpg`

Fitxers exactament duplicats.

Evidència: `assets/img/que-es-socdepoble-4.jpg | wordpress-plugin/assets/img/que-es-socdepoble-4.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.runtime-state — `bot/var/baileys-runtime/owner.lock`

Estat efímer de runtime empaquetat amb el codi.

Acció: Elimina'l del repositori i afig bot/var/ a .gitignore.

### [MEDIUM] hygiene.exact-duplicate — `bot/var/baileys-runtime/owner.lock.stale-1785878078098`

Fitxers exactament duplicats.

Evidència: `bot/var/baileys-runtime/owner.lock.stale-1785878078098 | bot/var/bot_var.backup.socdepoble/baileys-runtime/owner.lock.stale-1785878078098`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.runtime-state — `bot/var/baileys-runtime/owner.lock.stale-1785878078098`

Estat efímer de runtime empaquetat amb el codi.

Acció: Elimina'l del repositori i afig bot/var/ a .gitignore.

### [MEDIUM] hygiene.exact-duplicate — `bot/var/baileys-runtime/owner.lock.stale-1786025129869`

Fitxers exactament duplicats.

Evidència: `bot/var/baileys-runtime/owner.lock.stale-1786025129869 | bot/var/bot_var.backup.socdepoble/baileys-runtime/owner.lock`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.runtime-state — `bot/var/baileys-runtime/owner.lock.stale-1786025129869`

Estat efímer de runtime empaquetat amb el codi.

Acció: Elimina'l del repositori i afig bot/var/ a .gitignore.

### [MEDIUM] hygiene.exact-duplicate — `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/1cffcfea6289b238f16a5f24b8223423cd18beadf4974d0f7134239982f27256.json`

Fitxers exactament duplicats.

Evidència: `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/1cffcfea6289b238f16a5f24b8223423cd18beadf4974d0f7134239982f27256.json | bot/var/baileys-runtime/inbound-ledger/1cffcfea6289b238f16a5f24b8223423cd18beadf4974d0f7134239982f27256.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/238e52ebac094db739aa4b7ae6837766412da36d758437c7d20fb82c5ec83a1f.json`

Fitxers exactament duplicats.

Evidència: `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/238e52ebac094db739aa4b7ae6837766412da36d758437c7d20fb82c5ec83a1f.json | bot/var/baileys-runtime/inbound-ledger/238e52ebac094db739aa4b7ae6837766412da36d758437c7d20fb82c5ec83a1f.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/24fc32d92af8b7e4a25ef75fff10ab338a3e2c4cd6a50c1a7321b05dca79d473.json`

Fitxers exactament duplicats.

Evidència: `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/24fc32d92af8b7e4a25ef75fff10ab338a3e2c4cd6a50c1a7321b05dca79d473.json | bot/var/baileys-runtime/inbound-ledger/24fc32d92af8b7e4a25ef75fff10ab338a3e2c4cd6a50c1a7321b05dca79d473.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/3c5a6de62c9995d136dea9d612c99c6f46690a0b76b825630852fd66fd80426c.json`

Fitxers exactament duplicats.

Evidència: `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/3c5a6de62c9995d136dea9d612c99c6f46690a0b76b825630852fd66fd80426c.json | bot/var/baileys-runtime/inbound-ledger/3c5a6de62c9995d136dea9d612c99c6f46690a0b76b825630852fd66fd80426c.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/6f6553f26d5f2f9556c95039af44e2847bb818ed4481d96502da365c8d25271a.json`

Fitxers exactament duplicats.

Evidència: `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/6f6553f26d5f2f9556c95039af44e2847bb818ed4481d96502da365c8d25271a.json | bot/var/baileys-runtime/inbound-ledger/6f6553f26d5f2f9556c95039af44e2847bb818ed4481d96502da365c8d25271a.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/888c0ae6309764dd66cdf5b680352b09dff990dd880503afb67345a2fb326c68.json`

Fitxers exactament duplicats.

Evidència: `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/888c0ae6309764dd66cdf5b680352b09dff990dd880503afb67345a2fb326c68.json | bot/var/baileys-runtime/inbound-ledger/888c0ae6309764dd66cdf5b680352b09dff990dd880503afb67345a2fb326c68.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/912d6069b171120ca75cda0ca591d054551380fafafb99c45f80b526bcbb757a.json`

Fitxers exactament duplicats.

Evidència: `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/912d6069b171120ca75cda0ca591d054551380fafafb99c45f80b526bcbb757a.json | bot/var/baileys-runtime/inbound-ledger/912d6069b171120ca75cda0ca591d054551380fafafb99c45f80b526bcbb757a.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/a9b989a780e356f866ef63eb0a016f77730226263edd4e306836bad152a1f931.json`

Fitxers exactament duplicats.

Evidència: `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/a9b989a780e356f866ef63eb0a016f77730226263edd4e306836bad152a1f931.json | bot/var/baileys-runtime/inbound-ledger/a9b989a780e356f866ef63eb0a016f77730226263edd4e306836bad152a1f931.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/ad4000a71be0d5e969b10313b9c183d40534766d44eb1fee78ee5991353fc347.json`

Fitxers exactament duplicats.

Evidència: `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/ad4000a71be0d5e969b10313b9c183d40534766d44eb1fee78ee5991353fc347.json | bot/var/baileys-runtime/inbound-ledger/ad4000a71be0d5e969b10313b9c183d40534766d44eb1fee78ee5991353fc347.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/d7262243a413d0f49241147e95e53baa898b62be8b7465bcbf6e50ae5041eb85.json`

Fitxers exactament duplicats.

Evidència: `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/d7262243a413d0f49241147e95e53baa898b62be8b7465bcbf6e50ae5041eb85.json | bot/var/baileys-runtime/inbound-ledger/d7262243a413d0f49241147e95e53baa898b62be8b7465bcbf6e50ae5041eb85.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/ed80b76fbf1785a12d190945b5a4b0efda173308d42f4ff624b6c45d098ce08c.json`

Fitxers exactament duplicats.

Evidència: `bot/var/bot_var.backup.socdepoble/baileys-runtime/inbound-ledger/ed80b76fbf1785a12d190945b5a4b0efda173308d42f4ff624b6c45d098ce08c.json | bot/var/baileys-runtime/inbound-ledger/ed80b76fbf1785a12d190945b5a4b0efda173308d42f4ff624b6c45d098ce08c.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.runtime-state — `bot/var/bot_var.backup.socdepoble/baileys-runtime/owner.lock`

Estat efímer de runtime empaquetat amb el codi.

Acció: Elimina'l del repositori i afig bot/var/ a .gitignore.

### [MEDIUM] hygiene.runtime-state — `bot/var/bot_var.backup.socdepoble/baileys-runtime/owner.lock.stale-1785878078098`

Estat efímer de runtime empaquetat amb el codi.

Acció: Elimina'l del repositori i afig bot/var/ a .gitignore.

### [MEDIUM] hygiene.exact-duplicate — `bot/var/memoria/memoria_episodica_11e4ca4888ae8134800f55ba.json`

Fitxers exactament duplicats.

Evidència: `bot/var/memoria/memoria_episodica_11e4ca4888ae8134800f55ba.json | bot/var/bot_var.backup.socdepoble/memoria/memoria_episodica_11e4ca4888ae8134800f55ba.json`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/events/nano_sessio_treball.png`

Fitxers exactament duplicats.

Evidència: `public/assets/events/nano_sessio_treball.png | public/assets/uploads/avatars/nano_sessio_treball.png | wordpress-plugin/assets/uploads/avatars/nano_sessio_treball.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/fotos/el-viatjant.png`

Fitxers exactament duplicats.

Evidència: `public/assets/fotos/el-viatjant.png | public/assets/uploads/avatars/el-viatjant.png | public/assets/uploads/gent/avatars/el-viatjant.png | wordpress-plugin/assets/uploads/avatars/el-viatjant.png | wordpress-plugin/assets/uploads/gent/avatars/el-viatjant.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/fotos/iaia-maria.png`

Fitxers exactament duplicats.

Evidència: `public/assets/fotos/iaia-maria.png | public/assets/uploads/avatars/iaia_comic_matriarch.png | public/assets/uploads/gent/avatars/iaia_comic_matriarch.png | public/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-iaia-v4.png | wordpress-plugin/assets/uploads/avatars/iaia_comic_matriarch.png | wordpress-plugin/assets/uploads/gent/avatars/iaia_comic_matriarch.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-iaia-v4.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/fotos/javi-llinares-perfil-1200px.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/fotos/javi-llinares-perfil-1200px.jpg | public/assets/uploads/avatars/javi-llinares-foto_perfil-01.jpg | public/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1200px.jpg | wordpress-plugin/assets/uploads/avatars/javi-llinares-foto_perfil-01.jpg | wordpress-plugin/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1200px.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/img/pi-pla-verd.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/img/pi-pla-verd.jpg | wordpress-plugin/assets/img/pi-pla-verd.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/soc_de_poble_ibanez.png`

Fitxers exactament duplicats.

Evidència: `public/assets/soc_de_poble_ibanez.png | public/assets/system/brand/logo.png | wordpress-plugin/assets/system/brand/logo.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/system/icons/icon-orange.svg`

Fitxers exactament duplicats.

Evidència: `public/assets/system/icons/icon-orange.svg | wordpress-plugin/assets/system/icons/icon-orange.svg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/towns/la-torre-de-les-macanes/1.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/towns/la-torre-de-les-macanes/1.jpg | public/assets/uploads/poble/la-torre-de-les-macanes/img-la-torre-de-les-ma-anes-main.jpg | wordpress-plugin/assets/uploads/poble/la-torre-de-les-macanes/img-la-torre-de-les-ma-anes-main.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/towns/penaguila/1.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/towns/penaguila/1.jpg | public/assets/uploads/poble/penaguila/img-pen-guila-main.jpg | wordpress-plugin/assets/uploads/poble/penaguila/img-pen-guila-main.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/.DS-Store | wordpress-plugin/assets/uploads/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/ajuntament/la-torre-de-les-macanes/avatar/IMG_20200904_143451.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/ajuntament/la-torre-de-les-macanes/avatar/IMG_20200904_143451.jpg | wordpress-plugin/assets/uploads/ajuntament/la-torre-de-les-macanes/avatar/IMG_20200904_143451.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/avatars/andreu-soler-comic.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/avatars/andreu-soler-comic.png | public/assets/uploads/gent/avatars/andreu-soler-comic.png | public/assets/uploads/ia/07-andreu-soler-capatas/avatars/andreu-soler-comic.png | wordpress-plugin/assets/uploads/avatars/andreu-soler-comic.png | wordpress-plugin/assets/uploads/gent/avatars/andreu-soler-comic.png | wordpress-plugin/assets/uploads/ia/07-andreu-soler-capatas/avatars/andreu-soler-comic.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/avatars/avatar-marc-comic.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/avatars/avatar-marc-comic.png | public/assets/uploads/gent/avatars/avatar-marc-comic.png | public/assets/uploads/ia/15-marc-el-gall-el-temps/avatars/avatar-marc-comic.png | wordpress-plugin/assets/uploads/avatars/avatar-marc-comic.png | wordpress-plugin/assets/uploads/gent/avatars/avatar-marc-comic.png | wordpress-plugin/assets/uploads/ia/15-marc-el-gall-el-temps/avatars/avatar-marc-comic.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/avatars/beatriz-ortega-comic.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/avatars/beatriz-ortega-comic.png | public/assets/uploads/gent/avatars/beatriz-ortega-comic.png | public/assets/uploads/ia/04-beatriz-ortega-mestra/avatars/beatriz-ortega-comic.png | wordpress-plugin/assets/uploads/avatars/beatriz-ortega-comic.png | wordpress-plugin/assets/uploads/gent/avatars/beatriz-ortega-comic.png | wordpress-plugin/assets/uploads/ia/04-beatriz-ortega-mestra/avatars/beatriz-ortega-comic.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/avatars/carla-soriano_comic.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/avatars/carla-soriano_comic.png | public/assets/uploads/gent/avatars/carla-soriano_comic.png | public/assets/uploads/ia/05-carla-soriano-doctora/avatars/carla-soriano-ibanez.png | wordpress-plugin/assets/uploads/avatars/carla-soriano_comic.png | wordpress-plugin/assets/uploads/gent/avatars/carla-soriano_comic.png | wordpress-plugin/assets/uploads/ia/05-carla-soriano-doctora/avatars/carla-soriano-ibanez.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/avatars/elena-popova-comic.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/avatars/elena-popova-comic.png | public/assets/uploads/gent/avatars/elena-popova-comic.png | public/assets/uploads/ia/08-elena-popova-music/avatars/elena-popova-comic.png | wordpress-plugin/assets/uploads/avatars/elena-popova-comic.png | wordpress-plugin/assets/uploads/gent/avatars/elena-popova-comic.png | wordpress-plugin/assets/uploads/ia/08-elena-popova-music/avatars/elena-popova-comic.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/avatars/flash-comic.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/avatars/flash-comic.png | public/assets/uploads/gent/avatars/flash-comic.png | public/assets/uploads/ia/13-flash-carter/avatars/flash-comic.png | wordpress-plugin/assets/uploads/avatars/flash-comic.png | wordpress-plugin/assets/uploads/gent/avatars/flash-comic.png | wordpress-plugin/assets/uploads/ia/13-flash-carter/avatars/flash-comic.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/avatars/joan-batiste-comic.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/avatars/joan-batiste-comic.png | public/assets/uploads/gent/avatars/joan-batiste-comic.png | public/assets/uploads/ia/09-joan-batiste-arxiver/avatars/joan-batiste-comic.png | wordpress-plugin/assets/uploads/avatars/joan-batiste-comic.png | wordpress-plugin/assets/uploads/gent/avatars/joan-batiste-comic.png | wordpress-plugin/assets/uploads/ia/09-joan-batiste-arxiver/avatars/joan-batiste-comic.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/avatars/mixa-comic.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/avatars/mixa-comic.png | public/assets/uploads/gent/avatars/mixa-comic.png | public/assets/uploads/ia/14-la-mixa-gestora/avatars/mixa-comic.png | wordpress-plugin/assets/uploads/avatars/mixa-comic.png | wordpress-plugin/assets/uploads/gent/avatars/mixa-comic.png | wordpress-plugin/assets/uploads/ia/14-la-mixa-gestora/avatars/mixa-comic.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/avatars/nano-banana-comic.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/avatars/nano-banana-comic.png | public/assets/uploads/gent/avatars/nano-banana-comic.png | public/assets/uploads/ia/02-nano-banana-artiste/avatars/nano-banana-comic.png | public/assets/uploads/empresa/soc-de-poble/posts/el-projecte/nano-banana.png | wordpress-plugin/assets/uploads/avatars/nano-banana-comic.png | wordpress-plugin/assets/uploads/gent/avatars/nano-banana-comic.png | wordpress-plugin/assets/uploads/ia/02-nano-banana-artiste/avatars/nano-banana-comic.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/el-projecte/nano-banana.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/avatars/nano_cita_metge.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/avatars/nano_cita_metge.png | wordpress-plugin/assets/uploads/avatars/nano_cita_metge.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/avatars/nano_escola_comic.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/avatars/nano_escola_comic.png | public/assets/uploads/gent/avatars/nano_escola_comic.png | wordpress-plugin/assets/uploads/avatars/nano_escola_comic.png | wordpress-plugin/assets/uploads/gent/avatars/nano_escola_comic.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/avatars/nano_salut_comic.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/avatars/nano_salut_comic.png | public/assets/uploads/gent/avatars/nano_salut_comic.png | wordpress-plugin/assets/uploads/avatars/nano_salut_comic.png | wordpress-plugin/assets/uploads/gent/avatars/nano_salut_comic.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/avatars/nano_simbiosi_sobirana.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/avatars/nano_simbiosi_sobirana.png | wordpress-plugin/assets/uploads/avatars/nano_simbiosi_sobirana.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/avatars/pepica-vall-comic.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/avatars/pepica-vall-comic.png | public/assets/uploads/gent/avatars/pepica-vall-comic.png | public/assets/uploads/ia/06-pepica-la-vall-cuinera/avatars/pepica-vall-comic.png | wordpress-plugin/assets/uploads/avatars/pepica-vall-comic.png | wordpress-plugin/assets/uploads/gent/avatars/pepica-vall-comic.png | wordpress-plugin/assets/uploads/ia/06-pepica-la-vall-cuinera/avatars/pepica-vall-comic.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/avatars/vicent-ferris-comic.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/avatars/vicent-ferris-comic.png | public/assets/uploads/gent/avatars/vicent-ferris-comic.png | public/assets/uploads/ia/03-vicent-ferris-agronom/avatars/vicent-ferris-comic.png | wordpress-plugin/assets/uploads/avatars/vicent-ferris-comic.png | wordpress-plugin/assets/uploads/gent/avatars/vicent-ferris-comic.png | wordpress-plugin/assets/uploads/ia/03-vicent-ferris-agronom/avatars/vicent-ferris-comic.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/brain/avatar_ratoli_comic_1778960942888.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/brain/avatar_ratoli_comic_1778960942888.png | public/assets/uploads/avatars/avatar-ratoli-comic.png | public/assets/uploads/ia/12-el-ratoli-informatic/avatars/avatar-ratoli-comic.png | wordpress-plugin/assets/uploads/brain/avatar_ratoli_comic_1778960942888.png | wordpress-plugin/assets/uploads/avatars/avatar-ratoli-comic.png | wordpress-plugin/assets/uploads/ia/12-el-ratoli-informatic/avatars/avatar-ratoli-comic.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/brain/beatriz_somriure_1774195114538.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/brain/beatriz_somriure_1774195114538.png | wordpress-plugin/assets/uploads/brain/beatriz_somriure_1774195114538.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/brain/collita_pomes_valencia_1779774496548.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/brain/collita_pomes_valencia_1779774496548.png | public/assets/uploads/ajuntament/la-torre-de-les-macanes/post/collita-poma-local.png | wordpress-plugin/assets/uploads/brain/collita_pomes_valencia_1779774496548.png | wordpress-plugin/assets/uploads/ajuntament/la-torre-de-les-macanes/post/collita-poma-local.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/brain/ibanez_design_system_1780246898431.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/brain/ibanez_design_system_1780246898431.png | wordpress-plugin/assets/uploads/brain/ibanez_design_system_1780246898431.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/brain/media__1775376768839.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/brain/media__1775376768839.jpg | wordpress-plugin/assets/uploads/brain/media__1775376768839.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/brain/media__1775516493101.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/brain/media__1775516493101.jpg | wordpress-plugin/assets/uploads/brain/media__1775516493101.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/brain/nano-banana_arxiver_1774284589999.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/brain/nano-banana_arxiver_1774284589999.png | wordpress-plugin/assets/uploads/brain/nano-banana_arxiver_1774284589999.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/brain/nano_agricola_mas_1773539958988.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/brain/nano_agricola_mas_1773539958988.png | wordpress-plugin/assets/uploads/brain/nano_agricola_mas_1773539958988.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/brain/nano_mixa_socis_1774215027069.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/brain/nano_mixa_socis_1774215027069.png | wordpress-plugin/assets/uploads/brain/nano_mixa_socis_1774215027069.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/brain/nano_pedra_seca_1777089570387.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/brain/nano_pedra_seca_1777089570387.png | wordpress-plugin/assets/uploads/brain/nano_pedra_seca_1777089570387.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/brain/thermodynamics_ai_hardware_1775882083812.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/brain/thermodynamics_ai_hardware_1775882083812.png | public/assets/uploads/brain/cuc-de-pi-poster.png | wordpress-plugin/assets/uploads/brain/thermodynamics_ai_hardware_1775882083812.png | wordpress-plugin/assets/uploads/brain/cuc-de-pi-poster.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/companies/mercat/aitana.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/companies/mercat/aitana.png | wordpress-plugin/assets/uploads/companies/mercat/aitana.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/companies/mercat/camiseta_portada.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/companies/mercat/camiseta_portada.png | public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/06-group-tshirt.png | wordpress-plugin/assets/uploads/companies/mercat/camiseta_portada.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/06-group-tshirt.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/companies/mercat/flowers_bouquet.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/companies/mercat/flowers_bouquet.png | wordpress-plugin/assets/uploads/companies/mercat/flowers_bouquet.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/companies/mercat/generic_market.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/companies/mercat/generic_market.png | wordpress-plugin/assets/uploads/companies/mercat/generic_market.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/.DS-Store | wordpress-plugin/assets/uploads/empresa/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/.DS-Store | wordpress-plugin/assets/uploads/empresa/soc-de-poble/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/mercat/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/mercat/.DS-Store | wordpress-plugin/assets/uploads/empresa/soc-de-poble/mercat/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/01-chica-jersey.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/02-samarreta-socdepoble-roly-plom-oscur-1024px.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/02-samarreta-socdepoble-roly-plom-oscur-1024px.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/02-samarreta-socdepoble-roly-plom-oscur-1024px.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/03-young-man-tshirt.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/03-young-man-tshirt.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/03-young-man-tshirt.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/04-iaia-tshirt.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/04-iaia-tshirt.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/04-iaia-tshirt.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/05-samarreta-socdepoble-muntanya.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/05-samarreta-socdepoble-muntanya.jpg | wordpress-plugin/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/05-samarreta-socdepoble-muntanya.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/07-rustic-detail.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/07-rustic-detail.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/07-rustic-detail.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/08-javi-llinares-perfil-1024px.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/08-javi-llinares-perfil-1024px.jpg | wordpress-plugin/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/08-javi-llinares-perfil-1024px.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/samarreta-socdepoble-verd-638px.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/samarreta-socdepoble-verd-638px.jpg | wordpress-plugin/assets/uploads/empresa/soc-de-poble/mercat/samarreta-soc-de-poble/samarreta-socdepoble-verd-638px.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/posts/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/posts/.DS-Store | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/posts/disseny/1-header.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/posts/disseny/1-header.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/disseny/1-header.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/posts/disseny/2-sidebar.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/posts/disseny/2-sidebar.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/disseny/2-sidebar.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/posts/disseny/3-content.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/posts/disseny/3-content.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/disseny/3-content.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/posts/disseny/4-secction-header.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/posts/disseny/4-secction-header.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/disseny/4-secction-header.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/posts/disseny/5-section-media.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/posts/disseny/5-section-media.jpg | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/disseny/5-section-media.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/posts/disseny/6-section-capucha-identidad.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/posts/disseny/6-section-capucha-identidad.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/disseny/6-section-capucha-identidad.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/posts/disseny/7-section-title-decoration.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/posts/disseny/7-section-title-decoration.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/disseny/7-section-title-decoration.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/posts/el-projecte/antigravity-badge.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/posts/el-projecte/antigravity-badge.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/el-projecte/antigravity-badge.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-codig-v3.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-codig-v3.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-codig-v3.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-sobirania-v2.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-sobirania-v2.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/el-projecte/art-sobirania-v2.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/posts/el-projecte/el-projecte.epub`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/posts/el-projecte/el-projecte.epub | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/el-projecte/el-projecte.epub`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/posts/el-projecte/presentacio.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/posts/el-projecte/presentacio.jpg | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/el-projecte/presentacio.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/posts/genotip/portada_genotip.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/posts/genotip/portada_genotip.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/genotip/portada_genotip.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/empresa/soc-de-poble/posts/iaies-mundials/portada_iaies.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/empresa/soc-de-poble/posts/iaies-mundials/portada_iaies.png | wordpress-plugin/assets/uploads/empresa/soc-de-poble/posts/iaies-mundials/portada_iaies.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/gent/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/gent/.DS-Store | wordpress-plugin/assets/uploads/gent/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/gent/javi-llinares/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/gent/javi-llinares/.DS-Store | wordpress-plugin/assets/uploads/gent/javi-llinares/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1600px.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1600px.jpg | wordpress-plugin/assets/uploads/gent/javi-llinares/avatars/javi-llinares-perfil-1600px.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/grup/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/grup/.DS-Store | public/assets/uploads/gent/javi-llinares/posts/.DS-Store | public/assets/uploads/gent/javi-llinares/avatars/.DS-Store | public/assets/uploads/grup/el-rentonar/posts/.DS-Store | public/assets/uploads/ia/01-iaia-matriarca/avatars/.DS-Store | public/assets/uploads/ia/05-carla-soriano-doctora/posts/.DS-Store | public/assets/uploads/ia/02-nano-banana-artiste/posts/.DS-Store | wordpress-plugin/assets/uploads/grup/.DS-Store | wordpress-plugin/assets/uploads/gent/javi-llinares/posts/.DS-Store | wordpress-plugin/assets/uploads/gent/javi-llinares/avatars/.DS-Store | wordpress-plugin/assets/uploads/grup/el-rentonar/posts/.DS-Store | wordpress-plugin/assets/uploads/ia/01-iaia-matriarca/avatars/.DS-Store | wordpress-plugin/assets/uploads/ia/05-carla-soriano-doctora/posts/.DS-Store | wordpress-plugin/assets/uploads/ia/02-nano-banana-artiste/posts/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/grup/el-rentonar/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/grup/el-rentonar/.DS-Store | wordpress-plugin/assets/uploads/grup/el-rentonar/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/grup/el-rentonar/avatars/logo-rentonar-socdepoble-1600-c.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/grup/el-rentonar/avatars/logo-rentonar-socdepoble-1600-c.jpg | wordpress-plugin/assets/uploads/grup/el-rentonar/avatars/logo-rentonar-socdepoble-1600-c.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/ia/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/ia/.DS-Store | wordpress-plugin/assets/uploads/ia/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/ia/05-carla-soriano-doctora/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/ia/05-carla-soriano-doctora/.DS-Store | wordpress-plugin/assets/uploads/ia/05-carla-soriano-doctora/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/ia/05-carla-soriano-doctora/posts/post-carla-salut.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/ia/05-carla-soriano-doctora/posts/post-carla-salut.png | wordpress-plugin/assets/uploads/ia/05-carla-soriano-doctora/posts/post-carla-salut.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/ia/06-pepica-la-vall-cuinera/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/ia/06-pepica-la-vall-cuinera/.DS-Store | wordpress-plugin/assets/uploads/ia/06-pepica-la-vall-cuinera/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/ia/06-pepica-la-vall-cuinera/posts/post-pepica-cuina.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/ia/06-pepica-la-vall-cuinera/posts/post-pepica-cuina.png | wordpress-plugin/assets/uploads/ia/06-pepica-la-vall-cuinera/posts/post-pepica-cuina.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/ia/10-joanet-serra-xiquet/avatars/joanet-serra-comic.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/ia/10-joanet-serra-xiquet/avatars/joanet-serra-comic.png | wordpress-plugin/assets/uploads/ia/10-joanet-serra-xiquet/avatars/joanet-serra-comic.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/ia/11-tio-colau-viajant/avatars/tio-colau-comic.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/ia/11-tio-colau-viajant/avatars/tio-colau-comic.png | wordpress-plugin/assets/uploads/ia/11-tio-colau-viajant/avatars/tio-colau-comic.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/ia/15-marc-el-gall-el-temps/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/ia/15-marc-el-gall-el-temps/.DS-Store | wordpress-plugin/assets/uploads/ia/15-marc-el-gall-el-temps/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/ia/15-marc-el-gall-el-temps/posts/post-gall-meteo.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/ia/15-marc-el-gall-el-temps/posts/post-gall-meteo.png | wordpress-plugin/assets/uploads/ia/15-marc-el-gall-el-temps/posts/post-gall-meteo.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/.DS-Store | wordpress-plugin/assets/uploads/poble/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/ademus/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/ademus/.DS-Store | wordpress-plugin/assets/uploads/poble/ademus/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/aiora/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/aiora/.DS-Store | wordpress-plugin/assets/uploads/poble/aiora/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/alacant/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/alacant/.DS-Store | wordpress-plugin/assets/uploads/poble/alacant/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/alacant/summary.txt`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/alacant/summary.txt | wordpress-plugin/assets/uploads/poble/alacant/summary.txt`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/albocasser/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/albocasser/.DS-Store | wordpress-plugin/assets/uploads/poble/albocasser/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/alcoi/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/alcoi/.DS-Store | wordpress-plugin/assets/uploads/poble/alcoi/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/alcoleja/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/alcoleja/.DS-Store | wordpress-plugin/assets/uploads/poble/alcoleja/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/alzira/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/alzira/.DS-Store | wordpress-plugin/assets/uploads/poble/alzira/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/alzira/summary.txt`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/alzira/summary.txt | wordpress-plugin/assets/uploads/poble/alzira/summary.txt`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/banyeres-de-mariola/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/banyeres-de-mariola/.DS-Store | wordpress-plugin/assets/uploads/poble/banyeres-de-mariola/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/barcelona/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/barcelona/.DS-Store | wordpress-plugin/assets/uploads/poble/barcelona/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/benialfaqui/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/benialfaqui/.DS-Store | wordpress-plugin/assets/uploads/poble/benialfaqui/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/benialfaqui/summary.txt`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/benialfaqui/summary.txt | wordpress-plugin/assets/uploads/poble/benialfaqui/summary.txt`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/benidorm/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/benidorm/.DS-Store | wordpress-plugin/assets/uploads/poble/benidorm/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/benidorm/summary.txt`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/benidorm/summary.txt | wordpress-plugin/assets/uploads/poble/benidorm/summary.txt`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/benifallim/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/benifallim/.DS-Store | wordpress-plugin/assets/uploads/poble/benifallim/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/benifallim/summary.txt`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/benifallim/summary.txt | wordpress-plugin/assets/uploads/poble/benifallim/summary.txt`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/benimassot/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/benimassot/.DS-Store | wordpress-plugin/assets/uploads/poble/benimassot/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/benimassot/img-benimassot-main.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/benimassot/img-benimassot-main.jpg | wordpress-plugin/assets/uploads/poble/benimassot/img-benimassot-main.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/bunyol/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/bunyol/.DS-Store | wordpress-plugin/assets/uploads/poble/bunyol/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/castello-de-la-plana/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/castello-de-la-plana/.DS-Store | wordpress-plugin/assets/uploads/poble/castello-de-la-plana/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/cirat/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/cirat/.DS-Store | wordpress-plugin/assets/uploads/poble/cirat/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/cocentaina/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/cocentaina/.DS-Store | wordpress-plugin/assets/uploads/poble/cocentaina/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/cullera/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/cullera/.DS-Store | wordpress-plugin/assets/uploads/poble/cullera/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/denia/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/denia/.DS-Store | wordpress-plugin/assets/uploads/poble/denia/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/elda/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/elda/.DS-Store | wordpress-plugin/assets/uploads/poble/elda/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/elda/summary.txt`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/elda/summary.txt | wordpress-plugin/assets/uploads/poble/elda/summary.txt`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/elx/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/elx/.DS-Store | wordpress-plugin/assets/uploads/poble/elx/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/elx/summary.txt`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/elx/summary.txt | wordpress-plugin/assets/uploads/poble/elx/summary.txt`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/enguera/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/enguera/.DS-Store | wordpress-plugin/assets/uploads/poble/enguera/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/gandia/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/gandia/.DS-Store | wordpress-plugin/assets/uploads/poble/gandia/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/girona/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/girona/.DS-Store | wordpress-plugin/assets/uploads/poble/girona/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/iatova/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/iatova/.DS-Store | wordpress-plugin/assets/uploads/poble/iatova/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/la-torre-de-les-macanes/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/la-torre-de-les-macanes/.DS-Store | wordpress-plugin/assets/uploads/poble/la-torre-de-les-macanes/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/la-torre-de-les-macanes/DSC01197.JPG`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/la-torre-de-les-macanes/DSC01197.JPG | wordpress-plugin/assets/uploads/poble/la-torre-de-les-macanes/DSC01197.JPG`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/la-torre-de-les-macanes/P_20161028_153325_SRES.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/la-torre-de-les-macanes/P_20161028_153325_SRES.jpg | wordpress-plugin/assets/uploads/poble/la-torre-de-les-macanes/P_20161028_153325_SRES.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/la-torre-de-les-macanes/gentdelatorre-logo-bn-q.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/la-torre-de-les-macanes/gentdelatorre-logo-bn-q.png | wordpress-plugin/assets/uploads/poble/la-torre-de-les-macanes/gentdelatorre-logo-bn-q.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/la-torre-de-les-macanes/gentdelatorre-logo-bn-r-trans.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/la-torre-de-les-macanes/gentdelatorre-logo-bn-r-trans.png | wordpress-plugin/assets/uploads/poble/la-torre-de-les-macanes/gentdelatorre-logo-bn-r-trans.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/la-torre-de-les-macanes/gentdelatorre-logo-bn-r.png`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/la-torre-de-les-macanes/gentdelatorre-logo-bn-r.png | wordpress-plugin/assets/uploads/poble/la-torre-de-les-macanes/gentdelatorre-logo-bn-r.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/la-torre-de-les-macanes/toponim-la-torre-de-les-macanes-2048px.jpg`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/la-torre-de-les-macanes/toponim-la-torre-de-les-macanes-2048px.jpg | wordpress-plugin/assets/uploads/poble/la-torre-de-les-macanes/toponim-la-torre-de-les-macanes-2048px.jpg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/la-torre/summary.txt`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/la-torre/summary.txt | wordpress-plugin/assets/uploads/poble/la-torre/summary.txt`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/lliria/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/lliria/.DS-Store | wordpress-plugin/assets/uploads/poble/lliria/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/llucena/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/llucena/.DS-Store | wordpress-plugin/assets/uploads/poble/llucena/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/morella/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/morella/.DS-Store | wordpress-plugin/assets/uploads/poble/morella/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/ontinyent/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/ontinyent/.DS-Store | wordpress-plugin/assets/uploads/poble/ontinyent/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/oriola/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/oriola/.DS-Store | wordpress-plugin/assets/uploads/poble/oriola/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/paterna/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/paterna/.DS-Store | wordpress-plugin/assets/uploads/poble/paterna/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/penaguila/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/penaguila/.DS-Store | wordpress-plugin/assets/uploads/poble/penaguila/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/relleu/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/relleu/.DS-Store | wordpress-plugin/assets/uploads/poble/relleu/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/requena/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/requena/.DS-Store | wordpress-plugin/assets/uploads/poble/requena/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/sagunt/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/sagunt/.DS-Store | wordpress-plugin/assets/uploads/poble/sagunt/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/sella/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/sella/.DS-Store | wordpress-plugin/assets/uploads/poble/sella/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/sogorb/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/sogorb/.DS-Store | wordpress-plugin/assets/uploads/poble/sogorb/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/sogorb/summary.txt`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/sogorb/summary.txt | wordpress-plugin/assets/uploads/poble/sogorb/summary.txt`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/tibi/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/tibi/.DS-Store | wordpress-plugin/assets/uploads/poble/tibi/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/torrent/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/torrent/.DS-Store | wordpress-plugin/assets/uploads/poble/torrent/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/valencia/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/valencia/.DS-Store | wordpress-plugin/assets/uploads/poble/valencia/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/vilareal/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/vilareal/.DS-Store | wordpress-plugin/assets/uploads/poble/vilareal/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/villena/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/villena/.DS-Store | wordpress-plugin/assets/uploads/poble/villena/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/villena/summary.txt`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/villena/summary.txt | wordpress-plugin/assets/uploads/poble/villena/summary.txt`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/vinaros/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/vinaros/.DS-Store | wordpress-plugin/assets/uploads/poble/vinaros/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/xabia/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/xabia/.DS-Store | wordpress-plugin/assets/uploads/poble/xabia/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/xativa/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/xativa/.DS-Store | wordpress-plugin/assets/uploads/poble/xativa/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/xelva/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/xelva/.DS-Store | wordpress-plugin/assets/uploads/poble/xelva/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `public/assets/uploads/poble/xixona/.DS-Store`

Fitxers exactament duplicats.

Evidència: `public/assets/uploads/poble/xixona/.DS-Store | wordpress-plugin/assets/uploads/poble/xixona/.DS-Store`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `src/assets/fonts/noto-sans.css`

Fitxers exactament duplicats.

Evidència: `src/assets/fonts/noto-sans.css | wordpress-plugin/assets/fonts/noto-sans.css`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `src/assets/fonts/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7duw.woff2`

Fitxers exactament duplicats.

Evidència: `src/assets/fonts/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7duw.woff2 | wordpress-plugin/assets/fonts/o-0bIpQlx3QUlC5A4PNB6Ryti20_6n1iPHjc5a7duw.woff2`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `src/assets/img/ibanez_pedra_seca_design_1780873465211.png`

Fitxers exactament duplicats.

Evidència: `src/assets/img/ibanez_pedra_seca_design_1780873465211.png | assets/img/ibanez_pedra_seca_design_1780873465211.png | public/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.png | wordpress-plugin/assets/img/ibanez_pedra_seca_design_1780873465211.png | wordpress-plugin/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.png`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `src/assets/ui/logo-socdepoble-cuadrat-verd.svg`

Fitxers exactament duplicats.

Evidència: `src/assets/ui/logo-socdepoble-cuadrat-verd.svg | public/assets/system/ui/logo-socdepoble-cuadrat-verd.svg | public/assets/uploads/empresa/soc-de-poble/avatars/logo-socdepoble-cuadrat-verd.svg | wordpress-plugin/assets/system/ui/logo-socdepoble-cuadrat-verd.svg | wordpress-plugin/assets/uploads/empresa/soc-de-poble/avatars/logo-socdepoble-cuadrat-verd.svg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `src/assets/ui/logo-socdepoble-rect-blanc.svg`

Fitxers exactament duplicats.

Evidència: `src/assets/ui/logo-socdepoble-rect-blanc.svg | src/assets/ui/logo-socdepoble-rect.svg | public/assets/system/ui/logo-socdepoble-rect-blanc.svg | public/assets/system/ui/logo-socdepoble-rect.svg | wordpress-plugin/assets/system/ui/logo-socdepoble-rect-blanc.svg | wordpress-plugin/assets/system/ui/logo-socdepoble-rect.svg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `src/assets/ui/logo-socdepoble-rect-negre.svg`

Fitxers exactament duplicats.

Evidència: `src/assets/ui/logo-socdepoble-rect-negre.svg | assets/img/logo-socdepoble-rect-negre.svg | public/assets/system/ui/logo-socdepoble-rect-negre.svg | wordpress-plugin/assets/img/logo-socdepoble-rect-negre.svg | wordpress-plugin/assets/system/ui/logo-socdepoble-rect-negre.svg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [MEDIUM] hygiene.exact-duplicate — `src/assets/ui/vite_motor.svg`

Fitxers exactament duplicats.

Evidència: `src/assets/ui/vite_motor.svg | public/assets/system/ui/vite_motor.svg | wordpress-plugin/assets/system/ui/vite_motor.svg`

Acció: Conserva una font canònica i genera o enllaça la resta.

### [LOW] hygiene.junk — `.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `.agents/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `.agents/cervells/inicial_2026-08-24T21-26-15-657Z/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `.immunitari/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `.wiki-safety/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `_wiki_de_poble/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `_wiki_de_poble/.obsidian/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `_wiki_de_poble/00_SER_Brain_Identitat/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `_wiki_de_poble/02_ACTUAR_Maquina_Tecnica/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `_wiki_de_poble/05_Escriptori_Soc_de_Poble/00_Bandeja_d_Entrada/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `_wiki_de_poble/90_arxiu_historic/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `assets/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `bot/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `bot/var/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `public/assets/uploads/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `scripts/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `src/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `src/components/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `src/sections/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `tooling/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `tooling/wiki/.!33842!.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `tooling/wiki/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `wordpress-plugin/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.

### [LOW] hygiene.junk — `wordpress-plugin/assets/.DS_Store`

Artefacte local que no ha d'entrar al repositori.

Acció: Mou-lo a paperera i ignora'l en Git/ZIP.
