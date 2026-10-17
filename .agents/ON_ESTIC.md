---
type: document
status: generat
description: Punter d'arrencada de sessió generat per despertar.mjs
---
# ON_ESTIC.md (Punter de Sessió)

> [!IMPORTANT]
> **GENERAT:** 2026-10-16T15:14:02.716Z
> Aquest document l'`@`-importa `CLAUDE.md`, i eixa importació es resol ABANS
> que el hook l'escriga: la còpia que tens al context és la de la sessió
> anterior. Per això **ací no hi ha cap llista de l'Escriptori**: la d'ahir
> apuntava a documents que ja són a `90_arxiu_historic/`, i AGENTS §5 prohibix
> llegir eixa carpeta en procediments automàtics.

**Branca Git:** backup-notes-publish
**Commit:** 7a1828ca

## 1. Contingut de l'Escriptori (Taula de Treball)

No el tens ací, i és a propòsit. Tens dos maneres d'obtindre'l fresc:

- L'eixida del hook `SessionStart` d'aquesta sessió (canal fresc), o
- `node tooling/brain/despertar.mjs` (`npm run despertar`), que l'imprimix.

Si no tens cap de les dues, llista `_wiki_de_poble/04_escriptori/` amb una eina abans de decidir res.

## 2. Resum de l'ESTAT recent

Últim relleu anotat a `.agents/ESTAT.md` (primera capçalera del fitxer):

## ESTAT_ACTUAL · 2026-10-16 17:05 · IAIA MarIA / Gemini 4 Argon · Relleu 3 del Gauntlet Diürn: MCR, Especificació Quirúrgica (Onades 0.5–4) i Gran Auditoria de Rescat Completa (1.497 Fitxers)

- **Torns i Governança del Gauntlet Diürn (`core-direccio-autonoma`):**
  - Torns actius coordinats: `torn_80dccf6a-9cef-4b8c-8154-b952ea45a1c2` (`actor: gemini`, `scope: documents`), `torn_50a6a11f-89b2-4040-9566-d6063a4f5029` (`actor: MarIA`, `scope: documents`), `torn_39ba1739-5710-4d97-bf64-fb78d35c591e` (`actor: codex`, `scope: documents`) i `torn_f66993e9-f223-4ef5-a64f-9c83c59148cb` (`actor: claude`, `scope: code`).
  - Pla i Prompt canònics: `_wiki_de_poble/04_escriptori/261016_1530_pla_implementacio_gauntlet_autonom.md` (`cdfd79e65287316075e896435bae1fea732c3ec102664d2af991f18566460a18`) i `261016_1530_prompt_gauntlet_claude_codex_gemini.md`.
  - Informe canònic de Gemini 4 Argon / IAIA MarIA validat (`document.mjs check` -> `valid: true`): `_wiki_de_poble/04_escriptori/261016_1633_auditoria_gemini4.md` (`52,8 KB`, Relleu 3), sincronitzat amb `_wiki_de_poble/04_escriptori/261016_1632_auditoria_codex.md`, `261016_1639_pla_implementacio_relleu_codex_gauntlet.md` i `261016_1645_acta_marmota_codex_gauntlet_diurn.md`.
- **1. Matriu de Conformitat de Requeriments (MCR — §1) i Balanç Transparent (§2):**
  - Avaluació rigorosa ítem per ítem de tots els blocs (`Bloc -1`, `Bloc 0 / Onada 2`, `Bloc 0.5 / Onada 0.5`, `Bloc 0.6 / Onada 0.6`, `Bloc 1 / §0.1 & §0.3`, `Bloc 2`, `Bloc 3 / Onada 1`, `Bloc 3.5 / Onada 1.1`, `Bloc 3.6 / Onada 1.2`, `Bloc 3.7 / Onada 1.3`, `Bloc 3.8 / Onada 1.4`, `Bloc 3.9 / Onada 1.5`, `Bloc 3.10 / Onada 1.6`, `Bloc 4 / Onada 4`) sense vistiplaus vagues, reconciliada amb l'auditoria adversarial de Codex.
  - Taula de Balanç Transparent (*Demanat vs Fet vs Traslladat*) on absolutament res no es perd i cada element de codi pendent disposa d'especificació exacta per a Claude Code.
- **2. Especificació Quirúrgica Línia per Línia per a Claude Code (§3.0 a §3.6):**
  - **§3.0 (Bloc 3.6 / Onada 1.2 — Esmenes Calentes 16:40 i 16:43):** Retirada d'`AJUDA_PER_CLAU.socdepoble` d'`ACTORS_PERMANENTS` a `src/data/xatsPerDefecte.js:73`, substitució de `'fake-sdp'` per la comunitat `'fake-sdp-comunitat'` a `src/sections/xat/components/FakeChatOnboarding.jsx:86-144`, ordre estricte dels 4 xats fundacionals (`1. Comunitat Sóc de Poble -> 2. Javi Llinares -> 3. Gent de la Torre -> 4. IAIA MarIA`) a `src/sections/xat/XatSection.jsx:723-747`, capçaleres navegables a `src/config/navigation.js:52-59`, `CapcaleraConversa.jsx:96-145` i `FitxaComunitat.jsx:38-44`, desambiguació d'`/anima` (`pageKey="anima"`, manifest filosòfic) vs `/iaia` (`<PerfilPublicSection agents={agents} id="iaia-maria" />` a `src/app/App.jsx:980`), i login amb zero fricció en localhost a `src/sections/onboarding/OnboardingSection.jsx:152-188,275-323`.
  - **§3.1 (Blocs 3.8 i 3.9):** Botó `Emojis XL` (`UniversalWorkspace.jsx:1427-1442`), graella categoritzada `GRUPS_EMOJIS` (`DialegEmoticona.jsx:1-63`), fallback d'autoria del pilot (`autoriaNota.js:140-175`), retirada de `<Feather />` (`EmoticonaBarra.jsx:27-40`), `'Nota sense títol'` (`textosLlavor.js:10`), desplegable `<details className="sdp-edicio-avancada">` (`PageFrame.jsx:816-943`), retirada de `PublicacionsDeLActor` (`NotesEditor.jsx:385-391,511`) i comparació HTML canònica de TipTap (`useUniversalRichText.js:70`).
  - **§3.2–§3.6 (Blocs 3.7, 0.5, 0.3, Onada 2 i Bloc 4):** Textos legals de Sollutia (`legalContent.js:161-163`), emmascarament `rutaTapada` (`/javillinares -> /perfil/*` a `TaulerTelemetria.jsx`), component `TaulerGovernHuma.jsx` a `/consola`, resolució dels 9 banners `nano_banner_*` a `assetResolver.js`, redirecció `/multimedia/town-* -> /pobles/[slug]`, Lightbox Google Photos amb `llegixExif`, `motorMapaEmowe.js`, 5 fonts RSS reals i optimització de `Historic.jsx` per a `HistoricCofre.seguretat.test.jsx:115`.
- **3. Gran Auditoria de Rescat de l'Arxiu Històric 100% Completada (Bloc 0.6 — 1.497 Fitxers Recursius Auditats a Fons):**
  - **§4.1 (`90_arxiu_historic/` — 418 ítems d'arrel / 720 fitxers recursius / 26,69 MB):**
    * **Primera meitat (`1..285`, `2026` a `261005_Sessio_Marato_2230`):** Rescatades **11 grans perles oblidades del Mestre**: (1) Unipad d'edició i portades de llibres Amazon, (2) Pont bidireccional WhatsApp amb el telèfon de la IAIA, (3) IAIA com a «Smart Folder» (`XAT-T01..T22` i `DEC-01..DEC-24`), (4) Injecció d'URLs `@iaia` + migració de 522 articles / 1.769 multimèdia de `socdepoble.net` + ActivityPub `Fedify`, (5) Algoritme Sobirà a `/connectar`, (6) Genealogia amb IA (`261002_0205`), (7) Reserva de taules Google Workspace + carpetes de 3 nivells al Snippet + negretes automàtiques IA, (8) **Alerta NLnet (data límit: 3 de novembre de 2026)** + VeriFactu RDL 15/2025 + preus Bandomovil, (9) Mòdul `Animalets` CER i banc d'eines, (10) Mnemotècnia Ibáñez/Berlanga per a la Consola, (11) Llei de Densitat Adaptativa.
    * **Segona meitat (`286..418`, `261006_0025` a `261016_0035`):** Rescatats el selector visual d'estil del poble (`EstilDelPoble.jsx`), els interruptors Superadmin per poble, els modificadors de línia TPV, el Balanç/PiG anual de Gestoria i destil·lades les **6 úniques decisions estratègiques obertes** (`D-UUID-REMOT`, `D-RENTONAR-PADRO`, `D-RAG-PUBLIC`, `D-6-APPS-COMUNITAT`, `D-ESTIL-POBLE-UI`, `D-ARXIU-FRED`) d'entre 32 `D1..D32` històriques.
    * **Pla de Desllastament d'Obsidian:** Identificats **24,45 MB (91,4%)** de llast tècnic consumit (`260922_0320_BUNDLE_null.md` de `5,16 MB`, `90` binaris/JSON de `261005_Sessio_Marato_2230/` de `13,15 MB`, `4` fitxers corruptes de `0 B`, i `436` prompts/auditories tàctiques consumides de `6,14 MB`) llestos per moure a `_arxiu_fred_fora_obsidian/`, deixant només **42 documents d'or (`1,45 MB`)**.
  - **§4.2 (`01_produccio/` — 29 entrades / 297 fitxers) i §4.3 (`02_investigacio_ia/` — 34 paquets / 480 fitxers):**
    * **Troballa Crítica Patrimonial:** Els 20 fitxers `.img` (`25,1 MB`) dins `01_produccio/loyverse_clon_ipad/2026-04-03_20-34-18/attachments/` són **26m 44s de gravacions de veu originals del Mestre en WebM/Opus**! Preservar sempre. Rescatar també `¡alergenos.af` (`2,9 MB`) abans d'esborrar `Alergenos-ES_COPIA-ES_POT_BORRAR/`.
- **Higiene («Cadascuna a sa casa»):** Tots els subagents i el cron `task-52` han sigut cancel·lats. Zero tasques en segon pla actives.

## 3. Què has de fer ara?

1. Aconseguix la llista viva de l'Escriptori (§1) i llig el que hi haja.
2. Contrasta el relleu amb l'última Acta Marmota de `_wiki_de_poble/10_actes/`.
3. Espera les ordres del Mestre.
