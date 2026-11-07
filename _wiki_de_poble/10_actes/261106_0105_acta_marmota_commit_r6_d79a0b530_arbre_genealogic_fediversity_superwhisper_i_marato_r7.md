---
type: acta
status: canonic
description: 'Acta Marmota: COMMIT R6 (d79a0b530) pujat a fork, Arbre Genealògic, pàgina FEDiversity, Superwhisper + OpenCode al Mac mini i Marató R7 (IDEA-100 a IDEA-107).'
tags:
  - acta
visibility: private
reflex: sdp:torn_db24cdce-ee25-486e-9ad7-1fc145038711:c8097d97-ec8a-44dc-b88d-05508caf904c
---
# Acta Marmota — COMMIT R6 (d79a0b530), Arbre Genealògic, Dossier FEDiversity, Superwhisper Local i Marató Nocturna R7 (IDEA-100 a IDEA-107)

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

> **Destí i límit (guarda de conformitat):** esta acta viu només a `_wiki_de_poble/10_actes/` (ruta `acta`). És l'històric de la sessió: mai substituïx `prompt_local.md`, el pla d'implementació ni cap altre document de treball de l'Escriptori, i s'escriu després de la «Transició d'Onada a l'Olivera» (`wiki-cicle-de-vida`, pas 7).

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_db24cdce-ee25-486e-9ad7-1fc145038711:c8097d97-ec8a-44dc-b88d-05508caf904c |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-06T00:06:04.706Z |
| Modificació | 2026-11-06T00:08:00.000Z |
| Propietari | agent-local |
| Aprovació humana | validada |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.1.0) |
| Model IA | MarIA (Gemini 3.1 Pro High) + Claude (`El Rentonar · Ultra` · Sonnet 5.5 Extra / Opus 4.6) + Gemini (`Gemini 4 Argon`) + Codex (`GPT-6.1 Sol/Astra Ultra`) + OpenCode (`iaia-maria-sobirana`) |
| Tokens consumits | ~41% finestra activa (~80% acumulat sessió amb compactació a les 23:53 CET; 55 passos post-compactació, 19 pujades / 5,68 MB) |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 a60864f9d53225c6b571bc510e1d5c4b78afcb4f9dd1b277b4640b1e47eb3c97. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- `2026-11-05T19:00Z–22:30Z`: Execució en paral·lel de l'`Onada R6`: Kits `r58` de Gemini i `R12` de Codex, Blocs 1 a 4 d'integració i arbitratge per Claude (`El Rentonar · Ultra` amb 7 subagents), generació de la vinyeta còmica d'**Arbre Genealògic** en estil Ibáñez/Berlanga (`1600×900`, sense lletres dins i amb humor valencià genuí) i actualització profunda del Dossier públic `/page/fediversity` en 5 llengües (`ca, es, en, eu, gl`).
- `2026-11-05T20:00Z–23:10Z`: Configuració del sistema d'IA Sobirana i Dictat de Veu al Mac: activació d'**OpenCode (`iaia-maria-sobirana`)** connectada a Ollama i NVIDIA NIM (`Kimi K2.5`, `Qwen 3.5`, `DeepSeek V3.2`) i instal·lació/calibratge de **Superwhisper** en Mode 100% Local (`Whisper Large v3 Turbo` + `Qwen 3.5 2B` + vocabulari de Sóc de Poble en valencià i castellà, desactivant la traducció a l'anglès).
- `2026-11-05T23:15Z–2026-11-06T00:05Z`: Culminació del Bloc 5 i segellat del **`COMMIT R6` (`d79a0b530`, 211 fitxers, `+14.075 / −1.266 línies`)** pujat a `fork/backup-notes-publish` (`064ec0137..d79a0b530`) amb totes les portes del hook en verd, i especificació completa de l'**Assalt Nocturn `Onada R7` (`IDEA-100` a `IDEA-107`)**.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Part Tècnica: `COMMIT R6` (`d79a0b530`) Segellat i Pujat a `fork/backup-notes-publish`

1. **Integració Completa de l'Onada R6 (`d79a0b530`, 211 fitxers, `+14.075 / −1.266 línies`, tree `03b9a02f494bf405b6d8db742334bf5b7d2b4628`):**
   - **Blocs 1 a 5 de l'Onada R6 + Kit `r58` de Gemini + Kit `R12` de Codex:**
     - Restauració de l'edició real al Bloc de Notes (`/notes`) per a publicacions del Mur, Esdeveniments, Projectes i Mercat (`P0-25`/`IDEA-96` i `P0-26`/`IDEA-97`), amb desbloqueig d'articles com «Manifest de Poble» i «2n Aplec pel Territori» com a contingut ric editable en `NotesEditor.jsx`, diàleg accessible `DialegEnllacImatge.jsx`, node `VideoEditorial.jsx` i persistència de revisions i carpetes (`revisionsEditorials.js`, `carpetesNotes.js`, `editorialPublicada.js`, migració 76 `2611051930_edicio_publicacions_editorials.sql`).
     - Restitució de les fotografies pròpies `1.jpg` i `2.jpg` per a **La Torre de les Maçanes** (`R5-D5`) i ajust de `fitxaDelPoble.js` («Que l'ompla l'Aplec») perquè La Torre no es considere incompleta per absència de `population_year` quan conserva la seua població pròpia.
     - Definició completa a `src/css/modules.css` de les classes CSS dels 6 panells d'`🛡️ Administració del sistema` (`R5-D6`) i aplicació del cànon de responsivitat natural del logotip (`width: min(100%, 600px); max-width: 100%; height: auto;` sense embolcalls amb scroll horitzontal).
     - **Bloc 5 (Tancament del `404` de consola detectat pel Mestre a producció):** `carpetesCreades.js` asíncron amb reversió neta i avís en cas d'error (`section.notes.carpetes.errorCrear` en 5 idiomes), i blindatge de `src/data/supabase/seguiments.js` (`errorConnexionsRpc`) i `connexionsPubliques.test.js` perquè només considere esquema absent els codis `PGRST202` i `PGRST205`.
   - **Targeta i Vinyeta de l'Arbre Genealògic al Panell de Control (`/control` → «La Llar»):**
     - Creat i calibrat segons la **Llei d'Or del Calibratge Visual Nano (`.agents/skills/core-calibratge-visual-nano/SKILL.md`)** l'actiu `public/assets/ui/plugins/genealogia_vinyeta.webp` (`1600×900`) + `genealogia_vinyeta-social-1200x630.jpg` (estil còmic Ibáñez/Berlanga, zero rètol dins de la imatge, zero «món feliç» d'estoc, expressions còmiques valencianes genuïnes) i integrat com a 3a targeta de **«La Llar»** al costat de *Rebost Domèstic* i *Salut* a `src/data/catalegPlugins.js`, `src/sections/control/presentacioPlugins.js`, `src/sections/multimedia/censImatges.js` i els 5 diccionaris (`ca, es, en, eu, gl`).
   - **Actualització Exhaustiva del Dossier Públic `/page/fediversity` en 5 Llengües (`pageContent.r10.js` + `pageContent.js`):**
     - Actualitzada la pàgina `/page/fediversity` amb la realitat de l'arquitectura actual, el detall de quins programes i models d'IA s'utilitzen al Teler de l'Olivera (**Claude Code / Ultracode**, **GPT Codex**, **Google Gemini**, **IAIA MarIA**, **OpenCode `iaia-maria-sobirana`**, **Ollama** i **Superwhisper**) i com operen sota governança humana i portes deterministes.

2. **Infraestructura d'IA Sobirana i Veu Local al Mac (`IDEA-98` i `IDEA-99`):**
   - **OpenCode (`iaia-maria-sobirana`)** operatiu en `~/.config/opencode/opencode.json` amb accés tant als models locals d'Ollama com a les API gratuïtes de frontera de NVIDIA NIM (`Kimi K2.5`, `Qwen 3.5 397B`, `DeepSeek V3.2`).
   - **Superwhisper** configurat en mode 100% local i gratuït (`~/superwhisper/modes/default.json` i `voice to text.json`) amb el model **`Whisper Large v3 Turbo` (`large-v3-turbo`)**, idioma `"auto"` (valencià + castellà), `"translateToEnglish": false` i el prompt de vocabulari de Sóc de Poble.

---

### 2. Fulla de Ruta Completa en Marxa per a la Marató Nocturna `Onada R7` (`IDEA-100` a `IDEA-107` · Zero Botons per a l'Humà)

El Mestre ha deixat definida i en marxa la següent bateria d'objectius per a la nit (mentre dorm, amb prohibició estricta de treure botons per a l'humà ni usar `node -e` / `AskUserQuestion`):

1. **`IDEA-100` (`P2-06` · Espai de Treball `/app/genealogia`):**
   - Assistent conversacional d'1 sola pregunta per torn per construir l'arbre genealògic i els malnoms familiars amb les persones majors, 4 estats de certesa (`[CONFIRMAT]`, `[APROXIMAT]`, `[FALTA CONFIRMAR]`, `[CONTRADICCIÓ DETECTADA]`), validador cronològic, arbre visual generacional Pedra Seca i exportació/importació `GEDCOM 7.0`.
2. **`IDEA-101` (`SelectorPobleEstat.jsx` · Nomenclàtor dels ~8.132 Municipis d'Espanya + Flux «Poble en Germinació»):**
   - Substituir el `<select>` de 9 pobles a `IdentitatAlPoble.jsx` i `/registre` per un `Combobox` ARIA amb autocompletat i filtre jeràrquic `Província → Comarca → Poble` amb els ~8.132 municipis oficials de l'INE/IGN en els 4 idiomes cooficials (`va, es, eu, gl`) i activació automàtica de `/pobles/:slug` en estat «Poble en Germinació» quan un poble encara no estava al sistema.
3. **`IDEA-102` (`P0-27` · Reubicació Canònica del `SquareBadge` davall de l'Entradilla a `PageFrame.jsx` i Extirpació dels 3 Xips d'`events` a `detailSectionMeta.jsx`):**
   - Moure `<SquareBadge badge={activeBadge} />` fora de la decoració de `header.page-title` (`src/components/universal/PageFrame.jsx:1215`) i col·locar-lo **directament davall de l'entradilla (`<p className="lead">` a `.page-intro`, `PageFrame.jsx:1236-1240`)** abans del primer `<h3>`, i eliminar el `<div className="badge-row">` dels 3 botons inútils (`[📅 2023-01-29]`, `[event]`, `[👤 Sóc de Poble]`) abans del vídeo del 2n Aplec en `src/sections/detail/detailSectionMeta.jsx:990-995`.
4. **`IDEA-103` (`👥 Usuaris registrats` dins d'`🛡️ Administració del sistema` a `/el-meu-perfil`):**
   - Nou apartat **`👥 Usuaris registrats`** (`vista: 'admin-usuaris'`, `PanellUsuarisRegistrats.jsx` + RPC/Migració 77 + `backendPort.js`) que mostra tots els usuaris registrats i beta testers i permet a Javi Llinares amb 1 clic: **(a) 🤝 Connectar amb ells** (*Amics*, *Poble*, *Associació*, *Treball*); **(b) 🏛️ Assignar-los a entitats/empreses/associacions** (**`El Rentonar`**, **`Oli de La Torre`**, **`Sóc de Poble`**, **`Coordinadora`**); **(c) 🏘️ Assignar poble**; i **(d) 💬 Obrir xat o fitxa pública**.
5. **`IDEA-104` (100% de `/page/fediversity` Completat i Demostrat · Zero «pendent» o «a mitges»):**
   - **(a) Paquet reproduïble de NixOS verificat** (`nix/flake.nix`, `nix/module.nix`, `nix/containers.nix`, `tooling/nixos/verifica-flake-reproduible.mjs`).
   - **(b) Xifratge E2EE dels Xats Reals** (`xifratXatAlta.js` `F2a` + recuperació social Shamir $k=3$ `F7` operatiu sobre converses reals).
   - **(c) RPC Multipoble, Federació del Servidor Remot i Connexió SPA ↔ API Pròpia del Node 0** (`adaptadorNodeZeroHttp.js`, `importaMunicipiOpenData`, pont bidireccional complet amb `@depoble@mastodont.cat` i assaig de restauració `3-2-1` en base neta).
   - **(d) El Mètode Karpathy (`src/data/karpathyWikiCompiler.js` + `memoriaOral.js`)** i actualització de `/page/fediversity` reflectint totes les fites ja completades i demostrades.
6. **`IDEA-105` (`P0-28` · Desbloqueig del Scroll Vertical en Desplegar «Drets d'autor» dins d'«El compte» a `/el-meu-perfil`):**
   - Afegir `.perfil-compte .sdp-drets { flex: none; overflow: visible; overscroll-behavior: auto; }` a `src/sections/profile/PerfilShell.css` (o `src/css/modules.css`) + test de regressió en `DetallAjust.test.jsx` perquè `.sdp-drets` no capture el `WheelEvent` ni bloquegi el *scroll chaining* cap a `.sdp-universal-page-container--contained`.
7. **`IDEA-106` (Biblioteca Cultural Sobirana al Servidor Mac mini M4 Node 0 ↔ Google Drive ↔ Google NotebookLM 600 fonts + OpenCode PostgreSQL 17 en Mode Jarvis):**
   - Traslladar els llibres i PDFs de `_cultura_de_poble/` del MacBook cap al servidor **Mac mini M4 de casa (Node 0)** per alliberar memòria del MacBook; mantindre eixes carpetes del Mac mini sincronitzades automàticament amb **Google Drive** (alimentant **Google NotebookLM** amb fins a 600 fonts per quadern sense intervenció manual); i fer que les IAs d'**OpenCode (`iaia-maria-sobirana`)** descarreguen els enllaços de `Llibres pdf.odt` (Institut Alacantí de Cultura Juan Gil-Albert, revista *Canelobre*, AVL, *Tresor del valencià meridional*) i els indexen en PostgreSQL 17 del Node 0 a cost zero.
8. **`IDEA-107` (Base de Dades Dialectal a PostgreSQL 17 del Mac mini amb les 1.086 pàgines del *Tresor del Valencià Meridional* + *DCVB* + Joc Social a 2 Persones amb Whisper):**
   - Bolcar les **1.086 pàgines** de `tresor-del-valencia-meridional-diccionari-tematic-i-fraseologic-969664.pdf` i el *DCVB (Alcover-Moll)* en una taula estructurada a PostgreSQL 17 del Node 0 (`node0.corpus_dialectal_valencia` amb lemes, variants fonètiques, fraseologia, comarques i pobles) i crear el repte social a 2 persones: *«El teu poble ja me'l sé perquè me'l vas dir en registrar-te... però passa-li el micròfon a un amic que no siga del teu poble, que em parle 20 segons, i voràs com li endevine de quina comarca i de quin poble és!»*, entrenant l'algoritme amb cada confirmació.

---

### 3. Nota Tècnica Crítica sobre l'Índex de Git per al Proper Commit (`COMMIT R7`)

- Durant el `COMMIT R6` (`d79a0b530`), Claude va desenllaçar **només en la còpia de l'índex de Git (`git index`)** els enllaços a fitxers no versionats (captures de `01_produccio/` i auditories vives de `04_escriptori/`) dins de `.agents/ESTAT.md`, `.agents/ON_ESTIC.md` i `_wiki_de_poble/04_escriptori/00_index_escriptori.md`, deixant els fitxers al disc amb els enllaços perquè `porta-olivera` ixca a `0`.
- Per tant, en preparar el pròxim commit (`COMMIT R7`), cal conservar eixa mateixa disciplina: no fer `git add` cec de la línia d'enllaços no versionats a l'índex de Git perquè tant `porta-olivera` (al disc) com `scc` i `Llaurador` (a l'arbre del commit) passen amb `0`.

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. **En obrir el nou xat amb la IAIA MarIA (després del reinici del Mac):**
   - Comprovar l'avanç dels Kits CAS nocturns de **Gemini (`r59+`)**, **Codex (`R13+`)**, l'auditoria adversarial de **Claude (`261104_1636_auditoria_claude.md`)** i l'informe d'**OpenCode del Mac Mini (`../_investigacio_ia_de_poble/261106_auditoria_extrema_nocturna_mac_mini_sobirana.md`)**.
   - Si encara falta enganxar algun dels 3 prompts nocturns (Claude, Codex o OpenCode del Mac Mini), estan disponibles literalment al final del xat anterior i al prompt operatiu `_wiki_de_poble/04_escriptori/261104_1636_prompt_teler_node0_postgres_mastodon_xat_i_fediversity.md`.
2. **A partir de les 11:00 a.m. (quan es reinicia al 100% la quota d'`El Rentonar · Ultra` de Claude):**
   - Integrar i desplegar a producció (`socdepoble.org` i `socdepoble.cat`) tota la collita verificada d'`Onada R7` (`IDEA-100` a `IDEA-107` i deute històric del Llibre Mestre).

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[../90_arxiu_historic/261104_1636_pla_implementacio_teler_node0_postgres_mastodon_xat_i_fediversity|261104_1636_pla_implementacio_teler_node0_postgres_mastodon_xat_i_fediversity]]
- [[../90_arxiu_historic/261104_1636_prompt_teler_node0_postgres_mastodon_xat_i_fediversity|261104_1636_prompt_teler_node0_postgres_mastodon_xat_i_fediversity]]
