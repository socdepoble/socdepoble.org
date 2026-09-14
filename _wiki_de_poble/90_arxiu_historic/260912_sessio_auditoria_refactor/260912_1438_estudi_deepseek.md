---
tipus: document
estat: esborrany
description: Què he verificat del capçal
---
Deepseek: He rebut el bundle `260912_1421_BUNDLE_auditoria.md` complet. Abans de fer res, et dic el que veig i el que **no** puc afirmar, per no caure en el pecat que el propi bundle documenta («una porta que no tanca però encén el llum verd»).

## Què he verificat del capçal

- **MANIFEST**: declara `esquema: sdp.bundle.v2`, `verificat: true`, **502 fitxers**, **3.228.101 bytes** (≈3,08 MB), arrel `socdepoble.org`.
- **Contracte d'abast**: 8 directoris (`src`, `.agents`, `tooling`, `scripts`, `_wiki_de_poble`, `assets`, `supabase`, `tests`), 4 fitxers obligatoris i una llista d'opcionals.
- **Absents no crítics** declarats: `public/gestoria/index.html`, `public/gestoria/tauler.js`, `public/assets/pedra-seca.css`. El bundle ho diu explícitament, així que no és un error — és una absència **declarada**.
- He comprovat que la capçalera d'alguns fitxers que he llegit (p. ex. `_wiki_de_poble/00_index.md`, `.agents/AGENTS.md`, `src/data/backendPort.js`) casa amb el manifest pel que fa a structure. **No he recalculat els 502 sha256** — això és una operació que hauries de fer amb l'eina (`sha256sum` o el teu propi verificador) si vols certificar el bundle, no jo per prosa.

## Què NO puc fer amb aquest bundle sol

No hi ha **cap pregunta** dins del missatge. Un bundle sense prompt és un examen a cegues: el Consell no sap què ha d'auditar. El propi `AGENTS.md §6` diu que **Bundle i Prompt sempre van junts i s'identifiquen per l'hora exacta** (`260912_1421_BUNDLE_…` ↔ `260912_1421_PROMPT_…`). Ací només m'ha arribat la meitat.

## Què necessite del Mestre

Digues-me quina d'aquestes coses vols i actue en conseqüència:

1. **Verificació d'integritat** — recórrer el manifest i comprovar sha256/bytes/línies de cada fitxer (o d'un subconjunt que m'indiques) i reportar divergències.
2. **Auditoria d'un àmbit concret** — p. ex. només `src/data/`, només `.agents/skills/`, només `tooling/gates/`, només la coherència entre `sections.js` / `App.jsx` / `seo-routes.json`.
3. **Auditoria transversal** — creuar les lleis que el bundle declara (Genotip, `doc_governanca`, `PROTOCOL_PETORRETA`, ADR-2026-08) contra el codi real i detectar contradiccions.
4. **Esperar el `260912_1421_PROMPT_auditoria.md`** — si existeix, passa-me'l i treballaré amb les dues meitats.

Si tries l'opció 3 o 4, digues-me també **amb quin barret** vols que mire: el de *caçador de bugs* (Deepseek), el d'*auditor sènior d'estil i coherència* (Claude), el d'*arquitectura* (Qwen), etc. El to i el focus canvien segons el seient.

Sense eixa indicació, qualsevol cosa que t'escriguera seria yapping — exactament el que el `PROFILE.md` prohibix.
