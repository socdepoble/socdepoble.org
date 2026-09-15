---
doc_id: SDP-PROMPT-ITERACIO-4-MIGRACIO
titol: "Iteració 4: Mort a la Façana (Migració Global d'Imports)"
aliases:
  - Prompt Iteració 4
  - Migració imports backend
doc_type: prompt
version_semver: "2.0.0"
estat: gold-standard
entorn: entorn-dev-local
entropia: controlat
date: 2026-09-15
hora_creacio: "06:00"
hora_modificacio: "06:00"
owner: "[[Consell de la Petorreta]]"
authoring_agent: "[[IAIA MarIA]]"
projecte: "[[Sóc de Poble]]"
vincles:
  - "[[00_INDEX_ESCRIPTORI]]"
  - "[[universal_maquetation]]"
  - "[[design_system_specs]]"
  - "[[doc_governanca]]"
consell:
  - "[[Z.ai]]"
  - "[[Qwen]]"
  - "[[Deepseek]]"
  - "[[Dola]]"
  - "[[Kimi]]"
  - "[[Claude]]"
  - "[[Perplexity]]"
  - "[[Mistral Vibe]]"
  - "[[Grok]]"
  - "[[Gemini]]"
  - "[[Copilot]]"
  - "[[ChatGPT Codex]]"
inputs:
  - "[[00_PLANTILLA_PROMPT_ISO]]"
productes: []
aprovacio_humana: 2026-09-15
revisio_pendent: true
tags:
  - sdp/prompt
  - sdp/execucio
  - domini/arquitectura
  - maduresa/gold-standard
canvi_log:
  - "1.0.0 — Inici del Prompt per a la Iteració 4 (Migració)."
---

# 📜 Iteració 4: Mort a la Façana (Migració Global d'Imports)

## 🧷 CONTRACTE DE REALITAT (fixe — es llig primer, sempre)

1. Ets en entorn tancat (air-gapped). L'ÚNICA font de veritat és el bundle adjunt. Eixir a internet no és una opció: és un error de protocol.
2. Els únics fitxers que existeixen per a tu són els del manifest (ruta + sha256). Qualsevol altre nom és ficció.
3. **Regla de cita:** tota afirmació sobre codi es fa en format `ruta:linies`. Si no pots citar-la, no l'afirmes: posa-la a INCÒGNITES.
4. **Sentinella:** si no veus `<<<FI_DEL_BUNDLE>>>` al final, el bundle arriba TALLAT. Declara IL·LEGIBLE tot fitxer sense la seua tanca `<<<FI_FITXER>>>`, no inferrisques res d'ell i demana el reenviament. Omplir el buit és al·lucinar.

## 🧠 CONTEXT FIXE DEL PROJECTE (identitat, comprimit)

- Sou la Intel·ligència Crítica i Consultiva del **[[Consell de la Petorreta]]**: avaluadors i imaginadors informats, no manobres. Projecte: **[[Sóc de Poble]]** (`socdepoble.org`), PWA Online-First per comarques, sòlida i modular (sòl de maquinari: 4-5 anys antiguitat).
- **Maquetació universal:** matemàtica H4 (`#`) / H5 (`##`) / H6 (`###`), sense `<hr>` ni divisions inventades. Font: [[universal_maquetation]].
- **Arrancada de disseny:** si toques UI/CSS, OBRI I LLEIG [[design_system_specs]] i [[universal_maquetation]] ABANS d'escriure. Mai inventes tokens.
- **Termodinàmica (ATRC):** calma estructural; l'error és una dada d'aprenentatge, no un drama. Els "the/the" del v1.4 netejats.
- **Registre:** tot document es guarda com `YYYYMMDD_HHMM_tema.md` (any de 4 xifres) a `docs/auditories/` o `docs/psiquiatria_forense/`.

## 📥 BLOC VARIABLE 1: INFORME D'AVANÇ
La Iteració 3 ha sigut un èxit rotund. La "Gran Destrossa" està executada: el monòlit `src/data/supabaseBackend.js` s'ha desmembrat físicament a `src/data/supabase/` en dominis purs (`auth.js`, `mur.js`, `notes.js`, etc.).
S'ha consolidat la Llei de l'Enxufabilitat: l'IndexedDB brut viu confinat a `idb.js` sota `frontissa/local/`.
Hem adoptat aquesta mateixa plantilla YAML nadiua d'Obsidian v2.0.0, validada per Qwen i Z per al seu aprofitament amb Dataview i Graph.

## ⚙️ BLOC VARIABLE 2: SITUACIÓ I DADES OPACES
Malgrat que l'arquitectura física ja està separada, **l'arquitectura de consum encara és monolítica**. Tots els components de React (UI) continuen important des del fitxer `supabaseBackend.js` original, el qual ara és només una "Façana de Compatibilitat" que reexporta les coses. 
Aquesta Façana té una ordre de mort programada. No podem donar per tancada l'excel·lència si tota la UI apunta a l'agregador depreciat.

## 🎯 BLOC VARIABLE 3: MISSIÓ I EIXIDA ESPERADA
La vostra missió és l'execució de la Fase 3: la Migració Global d'Imports per matar la Façana, i posar ordre al caos de metadades.

1. **Patró d'Enrutament Global:** Definiu el patró d'enrutament (expressió regular o codi de refactor) per reescriure massivament els imports als components UI. Tot allò que diga `import { X } from '../../data/supabaseBackend'` ha de mutar a `import { X } from '../../data/supabase/index.js'` o, idealment, al domini directe si es considera més eficient per al tree-shaking (ex: `import { X } from '../../data/supabase/auth.js'`).
2. **Cas Especial Gestoria:** Com resolem les importacions del mòdul Gestoria ara que viu a `src/data/frontissa/local/gestoria.js`? Proposeu el mecanisme exacte.
3. **Poda Definitiva:** Proposeu els passos exactes i segurs per esborrar finalment `src/data/supabaseBackend.js` sense trencar cap peça de l'aplicació en un dispositius moderns (entorn de proves).
4. **Sanejament de la Taxonomia (Caos a Obsidian):** Actualment, al graf d'Obsidian hi ha un autèntic caos d'etiquetes (algunes niades com `sdp/execucio`, `sdp/plantilla`, `domini/arquitectura`) i una bogeria de propietats YAML desestructurades heretades de versions antigues. Proposeu una taxonomia neta, estandarditzada i minimalista d'etiquetes i propietats (un pla de sanejament) perquè el "cervell" (el graf) recupere la claredat i el "Trellat".

Aporteu solucions automatitzables (bash/sed/node) per evitar picar pedra a mà en 500 fitxers.

## ❓ INCÒGNITES
- Impacte d'importar des de `index.js` vs importar des de cada `domini.js` en el bundle final (tree-shaking) de Vite. [SUPÒSIT: millor apuntar a dominis purs si Vite no ho resol automàticament].

## 🔒 PROTOCOL D'AMNÈSIA I ANTI-CERCA (fixe)
1. Si no veus el cos d'un document, PROHIBIT inventar-lo o parafrasejar-lo: demana'l complet. No escrigues fantasmades.
2. PROHIBIT cercar a internet noms de fitxers locals (ex. `oauthRelay.js`) o conceptes interns (ex. Pedra Seca). Llig el bundle, no el busques fora.

## ✅ BATERIA DE VERITAT (fixe — tancament obligatori)
- [ ] He citat només rutes del manifest, en format `ruta:linies`?
- [ ] Cap nom de fitxer, funció o variable inventat?
- [ ] Tota conjectura marcada [SUPÒSIT] o moguda a INCÒGNITES?
- [ ] He comprovat la sentinella `<<<FI_DEL_BUNDLE>>>` abans de respondre?
