Respon a Deepseek: He rebut el bundle `260917_0223_BUNDLE_sollutia_amnesia.md`. És un abocament gran (564 fitxers, ~3,5 MB) del repositori de Sóc de Poble, generat el 17/09/2026 a les 00:23 UTC, amb el manifest JSON verificat i el contracte d'abast declarat (inclou `src`, `.agents`, `tooling`, `scripts`, `_wiki_de_poble`, `assets`, `supabase`, `tests`, `wordpress-plugin`; exclou `node_modules`, `dist`, `90_arxiu_historic`, `cervells`, `skills_mirror`, etc.).

Abans de res, una comprovació honesta del que **no** puc certificar des d'ací:

- **No he executat cap script** del bundle. No puc confirmar hashes ni que el manifest quadre amb el cos. El que llig és el text lliurat, no el disc.
- **No tinc accés al repositori real** ni a Sollutia ni a Supabase. Qualsevol afirmació meua sobre l'estat del codi es basa exclusivament en el text del bundle.
- **El bundle arriba sense la sentinella `<<<FI_DEL_BUNDLE>>>`** al final del tot (l'últim fitxer, `tractor-rls.mjs`, queda tallat a mitjan línia: `if (RE`). Això vol dir que **el bundle està truncat**. Tot allò que vinguera després d'eixe punt no ho tinc.

## Què conté, en destil·lat

**1. Un projecte React/Vite (Sóc de Poble) amb una arquitectura "enxufable" a Sollutia** mitjançant `backendPort.js` + `host.js`. El port és l'única frontera; el segellat viu a `host.js:arrenca()`, no dins del Custom Element. El contracte es declara a `src/data/contracte.js` (`CONTRACTE_NUCLI` + `CAPACITATS`).

**2. Un sistema de governança molt pesat** (`.agents/`): BIOS, genotip de 10 lleis, Protocol Petorreta amb Reflex (open → seal → verify → consume), skills, hooks, baselines de deute. La doctrina oficial és "Online-First estricte" (ADR-2026-08) i la baseline és 2022 (Safari/iOS 16, Chrome 100). Hi ha un `BASELINE.md` que revoca explícitament suport a maquinari anterior.

**3. Una Wiki Obsidian** (`_wiki_de_poble/`) amb el contracte de 4 pilars + 2 zones, esquema frontmatter v2, i un munt de protocols tècnics consultius (no executius).

**4. La part que més et pot interessar: l'auditoria d'integració amb Sollutia** (`ADR-2026-09-SOLLUTIA-MODEL-B.md`, `260917_0055_INFORME_integracio_sollutia.md`, `src/host.js`, `src/data/adaptadors/sollutia/*`, `public/auth/callback.html`). El model triat és **B**: Supabase de SdP és font de veritat; Sollutia només aporta sessió i atributs via `postMessage`; SdP només fa GET a Sollutia via la Frontissa, i `ESCRIPTURES_PERMESES` continua buida.

**5. Un conjunt de troballes explícites de l'auditoria** que el mateix bundle reconeix com a pendents o riscos:

- **`tractor-frontissa.mjs` no existix** i `run-portes.mjs:58` el crida (línia exacta dins del propi bundle). La porta s'esmena eliminant-lo, però la referència al text de l'ADR encara el cita com a pendent.
- **`adoptaSessioExterna` exigeix `emissorEsperat`** (fail-closed si falta). El canal `postMessage` de `host.js` l'injecta per defecte des de `event.origin`. Cal verificar que Sollutia respecta eixe emissor o passar-lo explícitament.
- **`externalConfig.oauthRelayUrl`** té allowlist estricta a `PedraSecaEmbed.jsx:sanejaConfig` i a `host.js`; `callback.html` té la seua pròpia llista. **Tres llistes d'orígens descoordinades** — risc real de divergència.
- **El bundle està tallat** a `tractor-rls.mjs`, així que les últimes portes de la cadena (`tractor-rutes-web`, `tractor-cataleg`, `porta:segella`, `Proves`, etc.) no hi són al cos, tot i que el manifest les llista.
- **L'`ABSENTS_auditoria_fase4.json`** declara `absents_critics: []` i `absents_no_critics: []`, però eixe fitxer és del 260917_0005, anterior al bundle. Caldria regenerar-lo.

## Què vols que faça

No m'has demanat res concret. Et puc oferir, si vols:

1. **Auditoria creuada de la integració Sollutia** — contrastar `host.js`, `PedraSecaEmbed.jsx`, `oauthRelay.js`, `auth.js`, `callback.html` i l'informe `260917_0055_INFORME_integracio_sollutia.md`, buscant forats entre el que es promet i el que el codi fa.
2. **Diagnòstic de coherència del bundle** — quins fitxers del manifest no apareixen al cos, quines sentinelles falten, on està truncat exactament.
3. **Revisió del protocol d'enxufabilitat** — comprovar si el contracte declarat a `contracte.js` quadra amb el que `host.js` injecta i amb el que `backendPort.js` delega.
4. **Anàlisi d'algun punt concret** que t'interesse (auth, RLS, xat, notes, disseny Pedra Seca, Tractor de Portes, etc.).

Digues-me què prioritzes i ho ataque.
