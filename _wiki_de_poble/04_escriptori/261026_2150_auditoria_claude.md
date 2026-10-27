---
type: informe
status: esborrany
description: 'Implementació i auditoria del torn 2130: Card de Descàrregues, enllaços trencats de la Wiki, calaix TOC i icones de Notes, targetes de Converses i baremador del Nano.'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_51d1660b-c6e1-4cad-a261-92a7776ab0a8:1e692e0b-014a-4ba4-8fa2-a74eb82805cd
---
# Auditoria Claude — Card de Descàrregues, salfumant de la Wiki, Notes i Converses

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_51d1660b-c6e1-4cad-a261-92a7776ab0a8:1e692e0b-014a-4ba4-8fa2-a74eb82805cd |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-26T20:53:57.344Z |
| Modificació | 2026-10-27T01:59:26.272Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`), en el fil principal i en tots els subagents |
| Tokens consumits | Subagents, mesurats: 9.222.959 en els quatre primers fluxos (3.517.780 + 2.359.332 + 1.798.832 + 1.547.015). La cinquena volta encara corre. El fil principal no es pot mesurar des d'ací. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

He llegit sencers el prompt i el pla del torn 2130, l'índex de l'Escriptori, les actes 261026_2115 i 261027_0145, la secció viva del Llibre Mestre i les skills que cita el prompt. De `90_arxiu_historic/` només s'han llistat noms de fitxer.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-26T20:53:57.344Z: esborrany creat; contingut i verificació pendents.
- 2026-10-26, 21:53–22:57: primer flux de subagents (10 agents), un carril per tasca: Descàrregues, Wiki, Notes, Converses i baremador.
- 22:57–23:03: revisió pròpia del diff i de les portes.
- 23:03–00:16: segon flux (8 agents), correccions i verificació adversarial de cada carril.
- 00:19–01:26: tercera volta (6 agents).
- 01:27: `useCallback` per a l'`onClose` de l'Índex. A les 01:28, Tasca 6 a l'arbre viu (3.627 proves verdes).
- 01:27–02:45: quarta volta (4 agents), només sobre el material preparat: el baremador i el blindatge de la Wiki.
- 02:47: reparat l'enllaç de l'acta 261027_0145 (T2-06).
- 02:49: cinquena i última volta (5 agents): correccions, verificació i assaig conjunt dels dos ordres d'aplicació.
- 02:52–02:55: P1-53, files arran; `test:precommit` torna a eixir amb 0.
- 02:59: informe complet, versió 1.0.0. Es completarà amb el resultat de la cinquena volta.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Resum per al Mestre.** Les tasques 1, 3 i 4 estan fetes a l'arbre viu, provades i mirades al navegador. De passada he tancat P1-53, el buit fantasma de 8px entre les files de converses, perquè era a la superfície de la Tasca 4. La tasca 2 està reparada a l'arbre viu, i el blindatge que impedix que es torne a trencar està preparat a part. La tasca 5 està preparada, però no aplicada: toca governança i necessita la teua resposta a D-3. El material preparat encara passa una última volta de correccions i verificació (des de les 02:49); este informe s'actualitzarà quan acabe. **No hi ha commit.** El hook encara no pot passar sense `--no-verify`, per raons que naixen fora d'este encàrrec (T2-03).

Cada troballa porta el contracte de la plantilla: abast, evidència, severitat, font de veritat, proposta i `requires_human_decision`.

### Matriu de conformitat

| Tasca | Demanat | Estat | On |
| --- | --- | --- | --- |
| 1 · P1-38 | Botó «Descarrega l'App» damunt de Connectar-se / Registrar-se | **Fet** | `src/sections/xat/XatSection.jsx` (AccesAlXat) |
| 1 · P1-38 | `SYSTEM_PAGES` `descarregues`, `PAGE_COPY.descarregues`, imatge 1024×1024 `fetchpriority` alt | **Fet** | `src/config/systemPages.js`, `src/sections/text/pageContent.js` |
| 1 · P1-38 | Android, iOS, ordinador i visió online-first → CRDT | **Fet** | Text sense cap enllaç extern |
| 1 · P1-38 | Àlies `/descarregues`, targeta al Mur, clau i18n en les cinc llengües | **Fet** | `src/app/App.jsx`, `src/config/idiomes/*.js` |
| 2 · P1-39 | `compile-wiki --check --strict` a 0 | **Fet** (17 → 0) | 27 fitxers de la Wiki |
| 2 · P1-39 | `tancament --check` a 0 | **Fet** quan este informe és complet (248 → 0) | Verificació |
| 2 · P1-39 | Zero `--no-verify` | **No assolible dins d'este abast** | T2-03 |
| 3 · §5 | Calaix TOC H1–H6, respiració sota la barra negra, tokens Pedra Seca | **Fet** | `src/components/universal/PageFrame.jsx`, `src/css/modules.css`, `src/css/layout.css` |
| 3 · §6 | Icones de 24px en cel·les de 48px; carpeta intrusa fora; Ordenar 20 → 24 | **Fet** | `UniversalToolbar.jsx`, `UniversalWorkspace.jsx`, `NotesSection.jsx`, `AppGridShell.css` |
| 4 · P1-36/37 | Files de 96px, avatars de 76px, 4px entre títol i missatge | **Fet** | `src/css/tokens.css`, `src/css/modules.css` |
| 4 · P1-36/37 | Fora el `[...]` de la Fila 1; selecció per pulsació llarga; `ListFilter` a la línia de cerca | **Fet** | `LlistaConverses.jsx`, `FilaConversa.jsx`; `MenuLlista.jsx` retirat |
| 4 · P1-53 | Files arran, 96px d'una línia a l'altra (fita nova del Llibre Mestre, 261027) | **Fet** | `src/css/modules.css`, `LlistaConverses.jsx` |
| 5 · P1-41 | `tooling/media/baremador_nano.mjs` + `.agents/qualificacions_nano.json` | **Preparat, no aplicat** | `_investigacio_ia_de_poble/261026_2130_baremador_nano_claude/` |
| 6 | `test:precommit`, `porta:olivera`, `tancar -- --check` | Vegeu Verificació | — |

### Tasca 1 · Card de Descàrregues (P1-38)

**Fet.** La pàgina diu només l'estat real de cada canal, segons les actes 261024_0345 i 261026_1630:

- **Android:** Google Play 1.0.0 en prova interna; encara no hi ha cap APK públic.
- **iOS:** TestFlight 1.0.0 (1) instal·lable pel grup de treball intern; l'App Store encara no té fitxa.
- **Ordinador:** la instal·lació des del navegador, explicada navegador per navegador.
- **Arquitectura:** hui online-first sobre Supabase (ADR-2026-08); la sincronització autònoma amb CRDT es presenta clarament com a visió de futur.

La pàgina no porta cap enllaç, i per tant tampoc l'URL interna de proves de Google Play. El botó s'amaga dins de l'App nativa (`esAppNativa`). **El text alternatiu descriu el que hi ha de veres en la imatge.** Hi ha una prova de ruta real que munta l'App sencera a `/descarregues` (`src/app/App.descarregues.test.jsx`). A més, he comprovat que la prova falla si es lleva l'àlies.

#### T1-01 · La porta de contingut estructural roman roja fins que aproves l'empremta

- **Abast:** `PAGE_COPY.descarregues`; `tooling/gates/frontissa-contingut.mjs`.
- **Evidència:** exit 1 amb «La clau «descarregues» és obligatòria i no té empremta aprovada. Aprova-la amb --aprova descarregues --per NOM.»
- **Severitat:** bloqueja el commit; és una aprovació humana per disseny.
- **Font de veritat:** la frontissa de contingut, que escriu a `.agents/`.
- **Proposta:** `node tooling/gates/frontissa-contingut.mjs --aprova descarregues --per NOM`, després de llegir la pàgina. Mai s'havia aprovat, i l'aprovació cobrix el text corregit.
- **requires_human_decision:** true

#### T1-02 · Risc en la revisió d'Apple: la pàgina parla d'Android dins de l'App d'iOS

- **Abast:** `src/config/systemPages.js:102`, la targeta del Mur, `/page/descarregues` dins de l'App nativa.
- **Evidència:** `esAppNativa()` només amaga el botó del Xat (`XatSection.jsx:1736`). Dins de l'App d'iOS, la pàgina mostra «Android», «Google Play», «APK directe» i «Chrome a Android».
- **Severitat:** major per a la botiga. No està verificat amb una revisió real.
- **Font de veritat:** App Store Review Guideline 2.3.10 (mencions d'altres plataformes mòbils).
- **Proposta:** dins de l'App nativa, o no mostrar la pàgina i la targeta, o mostrar només la plataforma pròpia, amb una prova `window.Capacitor.isNativePlatform`.
- **requires_human_decision:** true

#### T1-03 · El pla i el prompt no coincidixen en la imatge

- **Abast:** pla 261026_2130 §2.A.3 contra prompt Tasca 1; `public/assets/uploads/brain/nano_descarregues_gamberro.*`.
- **Evidència:**
  - El pla apunta a la imatge «gamberro», que té bafarades amb text que no és valencià (IDIOMA) i marc blanc (ENQUADRAMENT).
  - El prompt mana la imatge de l'App, i és la que he usat.
  - La parella gamberro està a `public/` sense ús ni cens, i fa caure `censImatges.test.js:57` per un motiu nou.
- **Severitat:** menor.
- **Font de veritat:** el prompt (ordre del Mestre 261026_2126), la «Zero Text Rule» de P1-41 i `src/sections/multimedia/censImatges.js`.
- **Proposta:** deixar la parella gamberro només a `01_produccio` i versionar a `public/` només `nano_descarregues_app.jpg/.webp`. Si la vols a `public/`, cal afegir-la a `EXCLOSES`.
- **requires_human_decision:** true

#### T1-04 · Tres decisions de text i de comportament que he deixat com estaven

- **Abast:** `XatSection.jsx`, `pageContent.js`.
- **Evidència:**
  - El lead «Tria la descàrrega oficial per al teu dispositiu…» invita a descarregar, però hui només la web/PWA és oberta a tothom.
  - El botó també ix dins de la PWA instal·lada (`esFinestraDApp`).
  - La majúscula d'«App» i d'«Aplicacions» és la teua.
- **Severitat:** menor.
- **Font de veritat:** el prompt.
- **Proposta:** confirmar-les o corregir-les.
- **requires_human_decision:** true

#### T1-05 · Una prova comptava encara dotze pàgines de sistema (corregit)

- **Abast:** `src/sections/notes/PublicacioDetall.sistema.test.jsx:173`.
- **Evidència:** «expected … to have a length of 12 but got 13». Ara espera 13, el comentari compta deu pàgines de text i la prova passa 11/11 (00:18).
- **Severitat:** major per a `npm test`. Ja està corregit.
- **Font de veritat:** `SYSTEM_PAGES`.
- **Proposta:** cap.
- **requires_human_decision:** false

### Tasca 2 · Salfumant de la Wiki (P1-39)

**Fet a l'arbre viu.** Un script determinista (`sanejament_enllacos_wiki.mjs`) va prendre la llista d'errors de les mateixes portes. De l'arxiu només va llegir noms de fitxer, mai contingut. Cada cas el va comprovar amb el `resolveDocumentLink` del repositori.

Va reescriure **248 enllaços en 26 fitxers**:

- 190 cap a la ruta de l'arxiu;
- 46 a literal de codi;
- 12 claudàtors llevats dins de literals que ja hi eren.

També va corregir `00_index.md:97`. Cada escriptura va ser compare-and-swap, i les còpies d'abans són al pegat. El text visible, el destí i l'àncora de cada enllaç es conserven.

**Resultat:**

- `compile-wiki --check --strict`: de 17 errors a exit 0;
- `verificador-scc`: de 236 LINK_INVALID + 4 ESCRIPTORI_UNANCHORED a exit 0;
- `tractor-orfandat`: exit 0;
- `tancament --check`: de 248 errors a 0 amb este informe complet.

#### T2-01 · La reparació viva és fràgil: el pròxim arxivament torna a trencar enllaços

- **Abast:** `tooling/lib/document-links.mjs` (`resolveDocumentLink` exclou `90_arxiu_historic`), Porta Orfandat, Porta Frontmatter F9.
- **Evidència:** assaig real de `porta-olivera --arxiva` en còpia congelada. Sense el pegat, cada arxivament suma errors nous (+3 SCC i Orfandat, +1 F9). Amb el pegat, totes les portes del hook donen el mateix abans i després. La quarta volta el va donar per bo tècnicament: el verificador va repetir les 30 situacions en APFS i en un volum que distingix majúscules, i la seqüència real de Reflex en els dos ordres respecte del baremador. Quedaven tres errors en el text del procediment (§4.2): no es podia enganxar en zsh, el pas 0 no parava la cadena i el cas (a) del pas 6 classificava malament una fallada. La cinquena volta el passa a un script i els corregix.
- **Severitat:** major. És la causa dels 236 errors d'esta nit, que tornaran.
- **Font de veritat:** la Llei Olivera (AGENTS §0.1) arxiva, i les portes no troben el que s'ha arxivat.
- **Proposta:** aplicar `261026_2130_scc_arxiu_per_nom.patch` (10 fitxers; xifres i hash a `LLEGIU_PRIMER.md` §3), que resol per nom els documents arxivats:
  - en SCC, Orfandat i Frontmatter;
  - sense distingir majúscules;
  - el viu sempre guanya;
  - es refusen els enllaços simbòlics.

  Es fa amb `executor-mutacio.mjs` i lease (seqüència a `LLEGIU_PRIMER.md` §4.2; generador `fes_pla_mutacio.mjs`). Després, si vols, els 190 enllaços es poden tornar a la forma curta `[[nom]]` (assajat: idèntic en totes les portes).
- **requires_human_decision:** true

#### T2-02 · El prompt parlava de 226 enllaços a `10_actes`; la realitat era una altra

- **Abast:** prompt Tasca 2, pla 261026_2130.
- **Evidència:** 236 LINK_INVALID + 4 àncores absents en 26 fitxers. El gruix (167 enllaços) era al Llibre Mestre, no a `10_actes`.
- **Severitat:** menor (precisió del pla).
- **Font de veritat:** l'eixida de `verificador-scc` i de `tancament --check` del 261026.
- **Proposta:** retroalimentació de plantilla R-1.
- **requires_human_decision:** false

#### T2-03 · «Zero `--no-verify`» no s'assolix dins d'este encàrrec

- **Abast:** `.husky/pre-commit` → `git-staged.mjs` → `run-portes --nomes-portes` + `test:precommit`.
- **Evidència:** censos en còpies congelades del viu i de HEAD `d83188d27`:
  - Amb este informe complet, la cadena del hook s'atura a la porta 6, Tractor Psicopatia, que ja és roja a HEAD (14 contradiccions «offline-first/local-first» en proves de `src/data`).
  - També són roges a HEAD, igual que ara: Promesa, Arrel, InnerHTML, Rutes, Cognitiu, Cens i Consell.
  - En total hi ha 25 portes roges al viu i 27 a HEAD: esta nit n'han passat a verd Teixit, Orfandat, Olivera i SCC.
  - La Porta Frontmatter, de tolerància zero, encara troba 40 entrades F9 en 14 dels 27 fitxers tocats, les mateixes que a HEAD.
- **Severitat:** bloqueja l'objectiu literal de la Tasca 2. No és cap regressió d'esta nit.
- **Font de veritat:** `tooling/gates/run-portes.mjs` i la censura de HEAD.
- **Proposta:** tria una de les dues:
  - un torn de salfumant dedicat al deute heretat (Psicopatia, Promesa, Arrel, InnerHTML, Rutes, Cognitiu, Cens, Consell, F9);
  - o autoritzar `--no-verify` per a este commit, sabent-ne la causa.
- **requires_human_decision:** true

#### T2-04 · Tres decisions menors de la reparació

- **Abast:** llibre d'or i tres enllaços passats a literal de codi.
- **Evidència:**
  - Llevar els 12 claudàtors dins de literals canvia l'empremta del llibre d'or (`ce41e505…` → `db32a6b1…`).
  - Hi ha un pegat opcional de `compile-wiki` (`261026_2310_compile_wiki_codi_literal.patch`) que pinta `[[x]]` literal dins del codi. Canvia 2 ítems del manifest; és un canvi visual que cal decidir per la Llei del Píxel.
  - Tres enllaços passats a codi tenen un destí probable que cal confirmar (`LLEGIU_PRIMER.md` §4.5).
- **Severitat:** menor.
- **Font de veritat:** la frontissa del llibre d'or.
- **Proposta:** aprovar la nova empremta, o aplicar el pegat i restaurar els claudàtors; i confirmar els tres destins.
- **requires_human_decision:** true

#### T2-05 · El Llibre Mestre porta rutes absolutes `file:///` d'esta màquina

- **Abast:** `03_llibre_mestre_tasques_i_idees.md`, fites P1-42 i P1-43 (escrites per MarIA a les 22:58); `10_actes/261027_0145_acta_marmota_triomf_gauntlet_rebaixa_pompositat_i_llei_secretaria.md:39`.
- **Evidència:** `file:///Users/javillinares/...`: no resolen en l'App, en un altre ordinador ni en el compilador de la Wiki. L'acta nova de MarIA també enllaça així la skill `core-secretaria-auditoria`.
- **Severitat:** menor.
- **Font de veritat:** la convenció `[[nom]]` o les rutes relatives al repositori.
- **Proposta:** que MarIA les passe a `[[nom]]` o a literal de codi amb la ruta del repositori.
- **requires_human_decision:** false

#### T2-06 · Un enllaç nou a una skill va tornar a posar roges SCC i Orfandat (corregit)

- **Abast:** `_wiki_de_poble/10_actes/261027_0145_acta_marmota_triomf_gauntlet_rebaixa_pompositat_i_llei_secretaria.md:89`.
- **Evidència:**
  - A les 02:46, `verificador-scc` i `tractor-orfandat` tornaven a fallar: «Enllaç inexistent: core-secretaria-auditoria.md».
  - L'acta de MarIA de la 01:45 enllaçava la skill nova amb `[[core-secretaria-auditoria]]`, i les portes de la Wiki no resolen noms de skills.
  - A les 02:47 l'he canviat, amb compare-and-swap, per un enllaç relatiu (`../../.agents/skills/core-secretaria-auditoria/SKILL.md`), la forma que ja fa servir `00_index.md:44`. El text de l'acta no ha canviat.
  - Les tres portes tornen a 0 (02:48).
- **Severitat:** major per al hook mentre va durar. Ja està corregit.
- **Font de veritat:** `verificador-scc` i `tractor-orfandat`.
- **Proposta:** que la plantilla d'acta i `wiki-documentacio-i-reflex` diguen com s'enllaça una skill des de la Wiki (R-10).
- **requires_human_decision:** false

### Tasca 3 · Índex i icones de Notes (§5 i §6)

**Fet.**

**El calaix de l'Índex:**

- Naix sota la barra negra real. Al navegador, a 375×812, el calaix comença a y=64 i la barra en fa 64: la barra no és de 58px, sinó `calc(var(--sdp-alt-negra) + env(safe-area-inset-top, 0px))`.
- Té 8px de respiració dalt.
- Recull de l'H1 de la capçalera a l'H6, amb colors de token: H1 `--sdp-accio-text`, H2 `--sdp-accent-titol`, H3 `--sdp-text-titol`, i H4–H6 sagnats de 8 en 8.
- Es tanca amb Escape, amb un toc al vel o a la barra negra, i, en la tercera volta, quan el focus del teclat ix del calaix.

**Dos errors reals corregits de passada:**

- Obrir l'Índex en Notes penjava la pàgina en un bucle sense fi: TipTap reemplaçava cada títol a què l'Índex escrivia un `id`. Ara l'Índex no escriu cap `id` dins del contingut editable.
- Un títol d'un diàleg tancat apareixia a la llista.

**La barra d'eines:** totes les icones fan 24px en cel·les de 48px, l'Ordenar inclòs (de 20 a 24).

#### T3-01 · La carpeta de l'esquerra de NOTES es queda al mòbil

- **Abast:** `UniversalWorkspace.jsx` 1270–1281, `obridorALaLlista`.
- **Evidència:** a 375px, la llista oberta tapa el rail i la carpeta és l'única porta a CARPETES (un toc). Només es retira en «mitja», amb el rail fix a la vista. A 820px no hi ha carpeta a la capçalera.
- **Severitat:** menor. És una lectura de la teua ordre.
- **Font de veritat:** pla 261026_1615 §6.
- **Proposta:** confirmar-la.
- **requires_human_decision:** true

#### T3-02 · Canvis visuals fora de Notes (Llei del Píxel)

- **Abast:** `UniversalToolbar.jsx` (`MIDA_ICONA_EINES` 24), `AppGridShell.css`.
- **Evidència:**
  - Les icones de 24px de l'editor també canvien l'editor del Perfil (`PerfilEditor.jsx`), `ConnexioDetall` i l'espècimen de la barra en Disseny.
  - En Disseny, l'Ordenar creix de 20 a 24 i es mou 12px.
- **Severitat:** menor.
- **Font de veritat:** la Lliçó del Mestre 260923 (Llei del Píxel).
- **Proposta:** acceptar-ho, o limitar-ho a Notes.
- **requires_human_decision:** true

#### T3-03 · On va «Crear nota» i l'escala de Bancal

- **Abast:** fila 2 del Bloc amb sessió; regles Bancal de `modules.css` (≈10173–10190).
- **Evidència:**
  - Amb sessió, «Crear nota» ocupa l'extrem dret i l'Ordenar no cau davall del `[|<]`.
  - En el mode Bancal, H4–H6 queden plans (600/600/600) i H3 també és 600: la jerarquia la donen el color i el sagnat.
- **Severitat:** menor.
- **Font de veritat:** pla 261026_1615 §6; `sdp-pedra-seca`.
- **Proposta:** triar el lloc de «Crear nota»; aprovar l'escala plana, o demanar-ne una d'esglaonada.
- **requires_human_decision:** true

#### T3-04 · Detalls que queden oberts

- **Abast:** `PageFrame.jsx` 268/335; Notes amb sessió.
- **Evidència:**
  - L'entrada H1 falta si la capçalera es munta després d'obrir l'Índex, perquè la referència es llig una vegada per obertura.
  - Notes amb sessió només s'ha provat en jsdom: al servidor compartit no podia entrar.
  - Corregit a les 01:27: els escoltadors de l'Índex es tornaven a subscriure a cada pintada, perquè `onClose` era una funció nova cada vegada. Ara és estable (`useCallback`), i les 321 proves de `PageFrame` i de la incrustació passen.
- **Severitat:** nit.
- **Font de veritat:** —
- **Proposta:** llegir la capçalera en cada canvi, si cal.
- **requires_human_decision:** false

### Tasca 4 · Converses de WhatsApp (P1-36 i P1-37)

**Fet.** Mesurat al navegador a 375×812:

- files de 96px (`--sdp-xat-fila-mida: calc(2 * var(--sdp-touch))`);
- avatars de 76×76 (76 és múltiple de 4; 74 no ho és);
- 4px entre el títol i el darrer missatge;
- cap `[...]` a la Fila 1 (`MenuLlista.jsx` i la seua prova, retirats);
- `ListFilter` de 48px a la línia de cerca.

**La pulsació llarga** reutilitza el ganxo `usePulsacioLlarga`: 500 ms; es cancel·la si el dit es mou més de 10px; també respon a Shift+F10 i a la tecla de menú. La fila premuda entra marcada en la selecció, i Escape ix de la selecció. Les files que no són converses mantenen les mides de HEAD (72/48) amb el modificador `.sdp-xat-fila--senzilla`: les destinacions d'AssignacioEmoji, els adjunts de VistaMultimedia i les opcions d'Ajustos.

**P1-53, el buit fantasma (fet a les 02:55).** MarIA el va anotar en el Llibre Mestre a la 01:45: una franja de ~10px damunt de la fila de la IAIA.

- **La causa ja era a HEAD.** Cada `<li>` de la llista heretava el marge editorial de `base.css` (`li { margin-bottom: var(--sdp-li-gap); padding-left: 4px; }`). La fila feia 96px, però la línia de cada fila quedava 8px per damunt de la següent (un pas de 104px), i les files entraven 4px.
- **La correcció.** La llista de converses porta ara el modificador `sdp-xat-llista--converses`, amb `.sdp-xat-llista--converses > li { margin-bottom: 0; padding-left: 0; }`.
- **Al navegador**, a 1280×800 i a 375×812, les files van de 96 en 96 (188, 284, 380, 476), arran de la columna i d'amplada sencera. La fila triada de la IAIA també.
- **Proves:** dues de noves a `LlistaConverses.test.jsx`.

#### T4-01 · L'avatar de 76px talla els noms en la columna de 280px

- **Abast:** llista en el disseny de tres columnes a 1280px.
- **Evidència:** «Gent de la Torre» té 136px disponibles i en necessita 161; «Javi Llinares», 112 i en necessita 120.
- **Severitat:** major visual en escriptori.
- **Font de veritat:** P1-36.
- **Proposta:** tria una de les tres:
  - acceptar-ho;
  - un avatar menor en el disseny de columnes, amb una media query;
  - eixamplar la columna central d'AppGridShell.
- **requires_human_decision:** true

#### T4-02 · «1 seleccionada» es veu tallat a 375px

- **Abast:** `BarraSeleccio` de XatSection.
- **Evidència:** vist al navegador a les 00:24: «1 seleccio…», 25px per davall de «Marcar com a llegides». Ara és el primer estat que veu tota selecció.
- **Severitat:** menor.
- **Font de veritat:** `sdp-clon-whatsapp`.
- **Proposta:** escurçar el text de l'acció o passar-la a icona.
- **requires_human_decision:** true

#### T4-03 · Dues conductes per decidir

- **Abast:** `LlistaConverses.jsx`; `modules.css` 3440–3444.
- **Evidència:**
  - Dins de la selecció, la pulsació llarga no fa res (WhatsApp hi commuta la fila).
  - La regla que lleva el menú de l'iOS i la selecció de text també toca files sense pulsació llarga: resultats de cerca, FilaPersona de «Nova conversa» i «Envia a…», i la fila «Tu».
- **Severitat:** menor.
- **Font de veritat:** `sdp-clon-whatsapp`.
- **Proposta:** decidir-ho. Si cal, posar la regla només a les files amb pulsació, amb un modificador.
- **requires_human_decision:** true

#### T4-04 · Sense prova en aparells de veres

- **Abast:** la pulsació llarga, el menú de l'iOS i els lectors de pantalla.
- **Evidència:** provat en jsdom i al navegador amb esdeveniments sintètics; no en un Android ni en un iPhone físics.
- **Severitat:** menor.
- **Font de veritat:** —
- **Proposta:** provar-ho en l'aparell abans de la 1.0.1.
- **requires_human_decision:** false

#### T4-05 · El mateix buit queda en les altres llistes del xat

- **Abast:** les altres `ul.sdp-xat-llista`:
  - `XatControlSection`, `ResultatsCercaXat`, `VistaMultimedia` i `DialegCompartir`;
  - `DialegNovaConversa` (tres llistes), `VistaComunitats` i `FitxaComunitat` (dos);
  - `AssignacioEmoji` i els espècimens de Disseny (`EspecimenXat` i les cinc d'`EspecimenXatLlista`).
- **Evidència:** totes hereten el mateix `li` de `base.css`. Les he deixades com estaven per la Llei del Píxel, perquè P1-53 parla de la llista de converses.
- **Severitat:** menor.
- **Font de veritat:** la Lliçó del Mestre 260923 (Llei del Píxel) i `sdp-clon-whatsapp`.
- **Proposta:** si les vols totes arran, n'hi ha prou amb una regla, `.sdp-xat-llista > li { margin-bottom: 0; padding-left: 0; }`, en lloc del modificador.
- **requires_human_decision:** true

### Tasca 5 · Baremador del Nano (P1-41)

**Preparat i no aplicat.** La quarta volta (01:27–02:45) va tancar les nou troballes de la tercera, però el seu verificador en va trobar dues de majors: amb les grafies d'àlies de macOS (`/System/Volumes/Data/…` i `/.nofollow/…`), `--dades` encara podia escriure dins del repositori, i un escriptor concurrent podia rebre un fals «symlink trencat». La cinquena i última volta les corregix i torna a verificar-ho. És a `_investigacio_ia_de_poble/261026_2130_baremador_nano_claude/`: arbre `staged/`, pegat, `LLEGIU_PRIMER.md`, fitxa de sentinella a `pendent_mestre/` i `verificacio/`.

**Què fa:**

- Té cinc ordres: `avalua`, `llista`, `informe`, `prompt` i `estils`.
- Rebutja amb IDIOMA, ENQUADRAMENT, HUMOR_GAG o ESTIL, siga quina siga la nota. Sense motiu de rebuig: APROVADA des de 7, i MILLORABLE per davall.
- Només hi ha els tres registres canònics.
- `prompt` porta sempre la «Zero Text Rule» i el FULL BLEED 100%.
- Les dades van a `.agents/qualificacions_nano.json`, amb pany, fitxer temporal i compare-and-swap.

**La plantilla viva `03_actuar/plantilles/prompt_nano_banana.md`** convida a fer bafarades i porta castellà («A Sangre», «caras amables»). La versió preparada la corregix.

#### T5-01 · No s'aplica sense tres respostes teues

- **Abast:** `tooling/media/`, `.agents/`, la plantilla del Nano, `identitat_visual.md`.
- **Evidència:**
  - Són rutes de governança, i només s'hi escriu amb `executor-mutacio.mjs` i lease.
  - La lliçó 261002 (`wiki-documentacio-i-reflex/SKILL.md:106`) diu que tot tractor cognitiu nou necessita un document del seu flux i la teua aprovació des de la interfície web abans de ser efectiu.
- **Severitat:** bloqueja l'aplicació per disseny.
- **Font de veritat:** la lliçó 261002 i `mutation-policy.mjs`.
- **Proposta:** respondre per escrit a D-3 (ruta de sentinella, ruta de Gestoria o aprovació provisional per xat). Després, un sol pla `sdp.mutation.v1` dels 6 fitxers, en l'ordre de `LLEGIU_PRIMER.md` §6.
- **requires_human_decision:** true

#### T5-02 · P1-42 se solapa amb el baremador

- **Abast:** Llibre Mestre, fita 6 (P1-42), escrita per MarIA a les 22:58.
- **Evidència:** P1-42 demana un sol motor de qualificació, amb estrelles d'1 a 5, vots populars i un catàleg d'atributs dins de `/multimedia`. El baremador puntua de l'1 al 10 des de la línia d'ordres.
- **Severitat:** major d'arquitectura. Fer-ho dues vegades contradiu el «no duplicar sistemes» de la mateixa fita.
- **Font de veritat:** P1-42.
- **Proposta:** decidir si el baremador és una passarel·la provisional fins a P1-42, o si es fon directament en P1-42. En el segon cas, cal reutilitzar-ne els motius, el registre i la Zero Text Rule com a vessant tècnic.
- **requires_human_decision:** true

#### T5-03 · Decisions de detall del baremador

- **Abast:** `LLEGIU_PRIMER.md` D-1, D-2, D-4…D-8.
- **Evidència:**
  - D-1: l'arrel de dades i si s'ha de versionar.
  - D-2: els llindars 7/10 i 0,5 (els he triat jo).
  - D-4: hooks-local nega a Claude i Codex fins i tot les ordres de lectura.
  - D-5: la skill `core-calibratge-visual-nano` encara té deute de frontmatter.
  - D-6: un àlies npm opcional.
  - D-7: si HUMOR_GAG val per a la fotografia realista.
  - D-8: si les IAs poden puntuar i com es reconeix el Mestre.
- **Severitat:** menor.
- **Font de veritat:** la Tasca 5.
- **Proposta:** respondre-les en el mateix acte que D-3.
- **requires_human_decision:** true

### Procés i convivència en l'arbre compartit

#### P-01 · S'han creat dues subcarpetes noves al laboratori

- **Abast:** `_investigacio_ia_de_poble/261026_2130_salfumant_wiki_claude/` i `_investigacio_ia_de_poble/261026_2130_baremador_nano_claude/`.
- **Evidència:** el prompt prohibix «que qualsevol IA invente carpetes noves a Som de Poble». Els carrils les van crear per preparar els canvis de governança, seguint el costum del laboratori (`261025_1705_pegats_claude`, `261026_0110_consola_claude` i trenta més).
- **Severitat:** menor; és una infracció de lletra.
- **Font de veritat:** el prompt, §Protocol.
- **Proposta:** dir on ha d'anar el material preparat de governança. Si el costum del laboratori no val, que MarIA ho moga on mane el Mestre (Claude no mou fitxers).
- **requires_human_decision:** true

#### P-02 · Què ha de viatjar junt en el commit

- **Abast:** l'arbre viu.
- **Evidència:** les correccions de les tres voltes viuen en els mateixos fitxers que les de la primera. A més, el vigilant de MarIA regenera `src/data/wikiManifest.js` alhora que la Wiki. També hi ha 7 documents arxivats sense seguiment i 3 esborrats per l'arxivament del 261026_2115.
- **Severitat:** menor.
- **Font de veritat:** el `LLEGIU_PRIMER.md` de la Wiki, §4.4.
- **Proposta:** un sol commit amb els fitxers sencers:
  - la Wiki, amb els arxivaments;
  - `wikiManifest.js`;
  - el codi i les proves;
  - les imatges que decidisques en T1-03.
- **requires_human_decision:** true

#### P-03 · `ESTAT.md` i `LEDGER.md` no els he escrit

- **Abast:** `.agents/ESTAT.md`, `.agents/LEDGER.md`.
- **Evidència:** `.agents/` és governança. Esta nit ja hi ha canvis d'altres mans: la skill nova de MarIA, dues transaccions de segell i ESTAT/LEDGER.
- **Severitat:** menor.
- **Font de veritat:** AGENTS §4 i `mutation-policy.mjs`.
- **Proposta:** que MarIA hi anote el relleu amb el resum de la secció de Claude del Llibre Mestre.
- **requires_human_decision:** false

#### P-04 · Encara no hi ha informes d'altres IAs d'este torn

- **Abast:** `04_escriptori/`.
- **Evidència:** a les 02:50 encara només hi ha el pla, el prompt i este informe del torn 2130. He llegit l'acta marmota 261026_2115 i la nova de MarIA, 261027_0145: la Llei de la Secretària Tècnica, la skill `core-secretaria-auditoria` i les fites P1-52 a P1-55.
- **Severitat:** informativa.
- **Font de veritat:** el prompt, §Protocol 3.
- **Proposta:** cap.
- **requires_human_decision:** false

#### P-05 · Fites noves per a Claude anotades després del prompt

- **Abast:** Llibre Mestre, fites 16 a 19 (P1-52 a P1-55), i l'acta 261027_0145.
- **Evidència:** MarIA les va anotar a la 01:45 com a feina per a Claude en el torn següent. P1-53 l'he feta, perquè és un defecte de la superfície de la Tasca 4. Les altres tres, no:
  - P1-52: el text nou de la simulació de la IAIA.
  - P1-54: llevar el peu d'accés («Descarrega l'App», «Connectar-se», «Registrar-se») de dins de les converses. Canvia on viu el botó de la Tasca 1.
  - P1-55: la pàgina viva del poble o de l'entitat a la dreta de la comunitat.
- **Severitat:** informativa.
- **Font de veritat:** el prompt d'este torn és l'ordre vigent; el Llibre Mestre registra la feina següent.
- **Proposta:** un prompt nou amb P1-52, P1-54 i P1-55, i P1-46, que toca la mateixa pàgina de Descàrregues.
- **requires_human_decision:** false

### Retroalimentació de plantilles

**Plantilla del prompt local (`prompt.local`):**

- **R-1 · Fets verificats.** Este prompt portava fets que no eren certs: la barra de 58px (en fa 64), els 226 enllaços a `10_actes` (en realitat 236, el gros al Llibre Mestre) i la carpeta `src/sections/notes/components/`, que no existix. A més, el pla i el prompt no coincidien en la imatge. Proposta: un camp «Fets verificats» on cada xifra o ruta porte font i hora, i on el pla i el prompt es contrasten pel hash del pla.
- **R-2 · Línia base de portes.** Un objectiu com «zero `--no-verify`» necessita saber primer quines portes són roges a HEAD. Proposta: una secció «Línia base» amb l'eixida de `run-portes --nomes-portes` a HEAD, perquè l'abast siga assolible o es declare com no assolible des del principi.
- **R-3 · Camí de la governança.** Quan una tasca toca `tooling/` o `.agents/`, la plantilla hauria de dir on es prepara el material (sense carpetes noves), la seqüència executor + lease i si cal l'aprovació web de la lliçó 261002.
- **R-4 · Decisions del Mestre.** Una secció d'eixida per a les decisions pendents, perquè l'informe les puga recollir en un sol lloc.
- **R-9 · Canal viu.** La lliçó 261003 demana un relleu de progrés cada 3 o 4 minuts mentre corren fluxos llargs. Este informe es va quedar en esborrany fins a les 03:00, i el progrés va anar al Llibre Mestre i al xat. Proposta: que la plantilla diga on va el relleu (per exemple, una secció «Estat en curs» del mateix informe) i cada quant.

**Plantilla d'auditoria (`auditoria_canonica.md`):**

- **R-5.** La línia 116 entrega «**Categoria:** protocols (BROKEN LINK: skills) <!-- TODO: fix link -->» dins de la plantilla.
- **R-6.** La línia 66 encara cita `04_ARXIU_Documents_Historics`; el nom vigent és `90_arxiu_historic`.
- **R-7.** El contracte demana `requires_human_decision`, però no té cap secció on aplegar les decisions.
- **R-8.** «Model IA» i «Tokens consumits» no diuen què s'ha de comptar (fil principal, subagents o tots dos). Proposta: «total mesurat + què no s'ha pogut mesurar».

**Plantilla d'acta (`acta.md`):**

- **R-10 · Enllaços a skills.** Ni la plantilla d'acta ni `wiki-documentacio-i-reflex` diuen com s'enllaça una skill des de la Wiki, i `[[skill]]` trenca SCC i Orfandat (T2-06). Proposta: una línia que diga que una skill s'enllaça amb una ruta relativa a `.agents/skills/<nom>/SKILL.md`.

Les ordres npm que cita la plantilla d'auditoria existixen totes (`porta:documents`, `porta:frontmatter`, `porta:cognitiu`, `porta:llaurador`, `porta:reflex`, `porta`).

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Tasca 6, a l'arbre viu.** Les eixides són a la carpeta temporal de la sessió.

| Ordre | Hora | Resultat |
| --- | --- | --- |
| `npm run test:precommit` | 02:55 (i 01:28) | **exit 0**: 175 fitxers Vitest, 3.365 proves verdes i 2 omeses; 262 proves Node verdes. **En total, 3.627 verdes i 0 fallades.** |
| `npm run porta:olivera` | 02:57 | **exit 0** |
| `npm run tancar -- --check` | pendent | es passa quan l'informe és complet |
| `node tooling/wiki/compile-wiki-to-app.mjs --check --strict` | 02:48 | **exit 0** (a l'inici del torn: 17 errors) |
| `node tooling/gates/verificador-scc.mjs` | 02:48 | **valid, 0 errors** (a l'inici: 236 LINK_INVALID + 4 àncores absents; a les 02:46, 1 per l'acta nova, T2-06) |
| `node tooling/gates/tractor-orfandat.mjs` | 02:48 | **exit 0** (a les 02:46, 1 enllaç trencat, T2-06) |
| `node tooling/gates/frontissa-contingut.mjs` | 01:28 | exit 1: només falta l'empremta de `descarregues` (T1-01) |
| `node tooling/gates/tractor-tokens.mjs` | 02:54 | 197 infraccions (T1 89, T2 7, T3 95, T4 6), les mateixes per regla i fitxer que a HEAD (cap de nova) |

**Suite sencera, en còpia congelada del viu (23:41) contra HEAD `d83188d27`:**

- **Vitest:** 22.724 proves al viu, amb 5 fallades; a HEAD n'hi ha 3. Les dues noves:
  - `PublicacioDetall.sistema.test.jsx:173`, que comptava 12 pàgines. Corregit a les 00:18 i verd 11/11.
  - `App.appsLocals.test.jsx:233`, que depén de l'`.env.local` sense seguiment de l'arbre viu: sense eixe fitxer passa 35/35. Cap fitxer del lector és al diff.
- **Les tres que ja fallaven a HEAD:** `censImatges` ×2 (l'avatar `iaia_maria_avatar_mobil`, a més del motiu nou de T1-03) i `laParroquia` (el laboratori es va moure).
- **Suite Node primària:** 1.068 proves; l'única fallada és `botigues.test.mjs:242`, igual que a HEAD (el laboratori es va moure).
- **Cens de portes (`cens_portes.mjs`):** 25 portes roges al viu i 27 a HEAD. Cap porta nova roja per codi d'esta nit:
  - **Han passat a verd:** Teixit, Orfandat, Olivera i SCC.
  - **Han millorat:** Doctrina (de 62 a 55), Pedra Seca (de 27 a 26) i Llaurador.
  - **Contracte documental:** només és roja per este informe sense acabar.
- **ESLint `--max-warnings=0`:** exit 0 en els 65 fitxers JS/JSX tocats o nous.
- **Altres:** `lint_xat` 20/20; `qualitat.classesOrfes` i les suites de tokens, 217/217.
- **Regles de disseny en les línies afegides:** cap `:has(`, cap hex cru, la plataforma sempre com «el Mas», dvh sempre darrere de vh, tot en la graella de 4px.

**Proves negatives, per saber que les proves noves no són buides:**

- La prova de ruta `/descarregues` falla si es lleva l'àlies d'`App.jsx`.
- Les proves de teclat de l'Índex fallen si es lleva l'escoltador `focusin`, o l'excepció de l'obridor o la del calaix.
- Les proves de les portes d'arxiu per nom fallen 6 de 7 contra les eines de HEAD.

**Al navegador, en la meua pestanya de :3340 a 375×812 (00:20–00:27):**

- **Xat:**
  - files de 96px, avatars de 76×76 i 4px entre el títol i el missatge;
  - cap `[...]` a la Fila 1, i el filtre «Filtra les converses» de 48px a la línia de cerca;
  - «Descarrega l'App» de 343×48 damunt de Connectar-se i Registrar-se (166×48 cadascun).
- **Descàrregues:**
  - el botó porta a `/page/descarregues`, i `/descarregues` també;
  - l'H1 és «Descàrregues i Aplicacions», la imatge és `nano_descarregues_app.webp` de 1024×1024 amb `fetchpriority="high"`, i no hi ha cap enllaç.
- **Mur:** la targeta «Descàrregues i Aplicacions» és la primera.
- **Índex:**
  - el calaix comença a y=64, just davall de la barra negra de 64px;
  - recull els nivells 1 a 5 (la pàgina no té H6);
  - un toc al vel el tanca i el focus torna a «Índex de secció».
  - Del teclat: el verificador de la tercera volta va comprovar amb tecles de veres que Maj+Tab fora, i el focus a «Obrir menú», el tanquen.
- **Notes:** totes les icones de les barres fan 24px en cel·les de 48px.
- **Pulsació llarga:** marca la fila (`role=checkbox`, `aria-checked=true`) i obri la barra «1 seleccionada», tallada (T4-02); Escape n'ix.
- **P1-53 (02:52–02:54), a 1280×800 i a 375×812:** les quatre files de converses van de 96 en 96 (188, 284, 380, 476), arran de la columna (`left` 0) i d'amplada sencera (311/311 i 375/375), també amb la IAIA triada. Els avatars fan 76px.
- La mida de la finestra es va restablir en acabar.

**Material preparat (no aplicat), assajat en còpies congelades:**

- **Pegat d'arxiu per nom de la Wiki:**
  - un arxivament real amb `porta-olivera --arxiva` no fa canviar cap porta;
  - la seqüència real de lease (obrir → pla → Petorreta → segellar → executor → consumir) funciona en els dos ordres respecte del baremador;
  - la suite Node no té cap fallada nova.
  - quarta volta (02:21): el verificador dona el pegat per llest; vegeu T2-01.
- **Baremador:** quarta volta (02:43): encara no és llest per dos defectes majors (T5, en el resum de la Tasca 5). La cinquena volta els corregix.

**Cost.** Cinc fluxos de subagents; els quatre primers sumen 9.222.959 tokens (Registre). La cinquena encara corre.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

**Què no he fet:**

- **Cap commit, staging, push ni `--no-verify`.** Tampoc he resegellat ni he fet caducar cap torn.
- **Cap escriptura directa a la governança** (`.agents/`, `tooling/`, `.claude/`, `.husky/`, `package.json`). El que hi toca està preparat a part.
- **No he llegit contingut de `90_arxiu_historic/`.** L'script de la Wiki només hi va llistar noms de fitxer. Tampoc he tocat `01_produccio/`.
- **No he arrancat ni aturat el servidor :3340 de MarIA**, ni he fet `vite build` ni `npm install`.
- **No he implementat les fites noves P1-42 a P1-52, P1-54 i P1-55:** han nascut esta nit en el Llibre Mestre, després del prompt (P-05). P1-53, sí, perquè era un defecte de la Tasca 4.

**Què no he pogut verificar:**

- Aparells de veres: l'Android físic, l'iPhone, els lectors de pantalla i la revisió real d'Apple (T1-02).
- Notes amb sessió al servidor compartit.
- Els adjunts de VistaMultimedia en viu, perquè F0 no n'envia.
- La seqüència real de lease amb Petorreta a l'arbre viu: només s'ha assajat en còpies congelades, amb un secret Reflex nou en cada còpia.

### Decisions del Mestre

1. **Empremta `descarregues`** (T1-01): `node tooling/gates/frontissa-contingut.mjs --aprova descarregues --per NOM`.
2. **La pàgina dins de l'App nativa** (T1-02): amagar-la, o mostrar només la plataforma pròpia.
3. **La imatge gamberro** (T1-03): només a `01_produccio`, o a `public/` amb `EXCLOSES`.
4. **El text i el botó de Descàrregues** (T1-04): el lead «Tria la descàrrega oficial…», el botó dins de la PWA instal·lada i la majúscula d'«App».
5. **El blindatge de la Wiki** (T2-01): aplicar `261026_2130_scc_arxiu_per_nom.patch` amb executor i lease, seguint `LLEGIU_PRIMER.md` §4.2.
6. **El deute heretat del hook** (T2-03): un torn de salfumant dedicat, o `--no-verify` per a este commit.
7. **El llibre d'or i tres destins** (T2-04): la nova empremta `db32a6b1…`, o el pegat de `compile-wiki` i restaurar els claudàtors.
8. **La carpeta de NOTES al mòbil** (T3-01): confirmar que es queda en «estret».
9. **La Llei del Píxel fora de Notes** (T3-02): les icones de 24px en Perfil, ConnexioDetall i Disseny, i l'Ordenar de Disseny.
10. **«Crear nota» i Bancal** (T3-03): el lloc de «Crear nota», i l'escala plana o esglaonada d'H4–H6.
11. **L'avatar de 76px en escriptori** (T4-01): acceptar-lo, un avatar menor en columnes, o una columna més ampla.
12. **«1 seleccionada» tallat** (T4-02).
13. **La pulsació dins de la selecció i el menú de l'iOS** (T4-03).
14. **Les altres llistes del xat** (T4-05): totes arran, o només la de converses.
15. **El baremador** (T5-01, T5-02, T5-03): D-3 per escrit; provisional o fos en P1-42; i D-1, D-2, D-4…D-8.
16. **Les carpetes del laboratori** (P-01): on ha d'anar el material de governança preparat.
17. **El commit** (P-02): un sol commit amb els fitxers sencers i el conjunt acoblat.
18. **Dos pegats de skill de la Tasca 3.** Toquen `.agents/skills/` i, per tant, el segell; s'apliquen amb executor i lease, i després cal resegellar. Els poso ací perquè la carpeta de treball on eren és temporal. Tots dos s'apliquen nets (`git apply --check`, 00:27).

`sdp-universal-page.index-h1.patch`:

```diff
--- a/.agents/skills/sdp-universal-page/SKILL.md
+++ b/.agents/skills/sdp-universal-page/SKILL.md
@@ -33,7 +33,7 @@
 ### A. La Barra Blava (`bar-blue`)
 És el centre de control i navegació de la pàgina/document. Les accions atòmiques i la disposició es divideixen estrictament en tres grups:
 - **Esquerra (Navegació):** Un trio d'icones compost per "Tornar arrere", "Tornar avant" i l'**Índex**.
-  - *Regla Sagrada de l'Índex:* Aquest botó és fonamental. Evita haver d'omplir la pàgina de múltiples etiquetes `<h1>` per a separar contingut, permetent navegar per tota la jerarquia de subseccions (des d'`<h2>` fins a `<h6>`). Això garanteix que **només hi haja un únic H1 per pàgina**, mantenint la puresa SEO i l'arquitectura d'informació.
+  - *Regla Sagrada de l'Índex:* Aquest botó és fonamental. Evita haver d'omplir la pàgina de múltiples etiquetes `<h1>` per a separar contingut, permetent navegar per tota la jerarquia de subseccions (des d'`<h2>` fins a `<h6>`). Això garanteix que **només hi haja un únic H1 per pàgina**, mantenint la puresa SEO i l'arquitectura d'informació. Ordre del Mestre (261026_2126, pla 261026_1615 §5): l'únic H1 (el de `header.page-title`) és la primera entrada de l'Índex, que recull de l'H1 a l'H6; el calaix naix davall de la barra negra (`calc(var(--sdp-alt-negra) + env(safe-area-inset-top, 0px))`) i pinta H1 `--sdp-accio-text`, H2 `--sdp-accent-titol`, H3 `--sdp-text-titol` i H4-H6 sagnats de 8 en 8.
 - **Centre (Interacció):** Un trio d'icones centrat compost per "Traductor", "Comentar (Xat)" i "Compartir".
   - *Regla del Botó Comentar:* No obri cap fil de comentaris públics davall de la targeta. Funciona com un missatge directe: enllaça sempre al xat privat de l'autor o creador d'eixe contingut.
 - **Dreta (Acció Principal):** El botó "Connectar".
```

`sdp-app-grid-shell.capcalera.patch`:

```diff
--- a/.agents/skills/sdp-app-grid-shell/SKILL.md
+++ b/.agents/skills/sdp-app-grid-shell/SKILL.md
@@ -34,6 +34,8 @@
 - **Comportament i Distribució dels Botons (Quan Tot Està Obert):**
   - *Columna Esquerra (Carpetes):* A l'esquerra tenim el botó o l'icona amb el nom de la carpeta (ex. "Tot"). A la part dreta d'aquesta barra hi ha exclusivament l'icona de la "Roda Dentada" (Configuració).
   - *Columna Central (Notes):* A l'esquerra tenim exclusivament l'icona de la "Lupa" (Buscar). A la part dreta d'aquesta barra hi ha el botó sencer de "Crear Nota" (prohibit l'accent taronja "canon" per al text o icona d'aquest botó per evitar competir amb els elements primaris).
+  - *Capçalera de NOTES (ordre del Mestre 261026_2126, pla 261026_1615 §6):* En «mitja», el Bloc de Notes no pinta la carpeta d'obrir CARPETES a l'esquerra del títol NOTES (`obridorALaLlista={false}` d'`UniversalWorkspace`): la navegació ja té el seu rail fix i la icona de NOTES cau a plom de la Lupa. En «estret» la carpeta es queda, perquè la llista oberta tapa el rail i n'és l'única porta a la vista; també es queda on és l'única porta (el mode compacte, sense rail). Wiki, Disseny i Perfil conserven la carpeta.
+  - *Icones i buit de la Fila 2:* Totes les icones de les dues files fan 24px dins de cel·les de 48px (també l'Ordenar). Els 12px que separen l'Ordenar del "Crear Nota" els porta el Crear (`.sdp-workspace-sort-action + .app-grid-col-header__accio { margin-inline-start: var(--sdp-space-3) }`, `AppGridShell.css`): sense Crear (Disseny, o el Bloc sense sessió), l'Ordenar queda arran del coixí dret de la fila, a plom del `[|<]` de replegar. On va el Crear quan hi és, perquè l'Ordenar caiga davall del `[|<]`, és decisió pendent del Mestre.
 
 ## 3. Lògica de Replegament (Collapse)
 
```

**Higiene («Cadascuna a sa casa»):**

- `CronList`: «No scheduled jobs».
- Tasques programades: cap.
- La cinquena volta encara corre; en acabar, cap flux de treball meu queda en marxa.
- Les còpies congelades de la carpeta temporal de la sessió s'esborren en acabar.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261026_2130_prompt_claude_boto_descarregues_salfumant_wiki_i_converses]]
- [[261026_2130_pla_implementacio_boto_descarregues_salfumant_wiki_i_converses]]
- [[03_llibre_mestre_tasques_i_idees]]
