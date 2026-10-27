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
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-26T20:53:57.344Z |
| Modificació | 2026-10-27T07:31:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (`claude-opus-5-5`), en el fil principal i en tots els subagents |
| Tokens consumits | Subagents, mesurats: 16.228.175 en deu fluxos (els quatre primers, 9.222.959; la cinquena volta, 1.818.566; la sisena, 1.783.875; les dues verificacions dels retocs, 1.034.329; el debat del carnet, 1.338.382; el paquet de consens, 1.030.064). El fil principal no es pot mesurar des d'ací. |

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
- 02:49–04:31: cinquena volta (5 agents), sobre el material preparat.
- 02:52–02:55: P1-53, files arran; `test:precommit` torna a eixir amb 0.
- 02:59: informe complet, versió 1.0.0.
- 04:40–06:08: sisena volta, de tancament (5 agents): un corrector i un verificador per lliurable, i l'assaig conjunt.
- 05:20–05:57: l'acta 0520 de MarIA i les auditories de Gemini (0550) i de Codex (0650) sobre la ronda 5.
- 06:13: ordres del Mestre al xat: quatre retocs i el baremador com a paquet d'estudi.
- 06:15–06:21: els quatre retocs a l'arbre viu, amb proves; 06:21, `test:precommit` a 0.
- 06:23–06:27: dos arranjaments mecànics en documents d'altres mans perquè el tancament tornara a 0 (P-07).
- 06:22–06:44: primera verificació dels retocs (3 agents), en còpies congelades.
- 06:46–06:48: tancades la cerca i les connexions, i el coixí de Multimèdia, amb proves noves.
- 06:49–07:13: segona verificació (2 agents); a les 07:13, tancat el selector de targetes de Notes.
- 06:52–07:43: el debat del carnet (7 agents), a petició del xat.
- 07:30: entregues de Gemini i de Codex amb propostes per a P1-54, P1-55 i P1-58.
- 07:33–08:15: validació contra el codi viu i paquet de consens (5 agents).
- 08:05: l'arxivament de MarIA trenca 8 enllaços; 08:28, reconduïts a l'arxiu (P-07).
- 08:31: versió 1.1.0.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Resum per al Mestre.** Les tasques 1, 3 i 4 estan fetes a l'arbre viu i provades. La 2 està reparada a l'arbre viu, i el blindatge que impedix que es torne a trencar està preparat a part, llest per a aplicar amb un script. La 5 queda com a paquet d'estudi, com vas decidir al xat a les 06:13. Després de llegir les auditories de Gemini (0550) i de Codex (0650), he aplicat els quatre retocs que vas manar:

- Descàrregues ja no ix dins de l'App nativa: ni targeta, ni ruta, ni cerca, ni connexió;
- la parella gamberro ja no és a `public/`;
- el reinici del `li` és de totes les llistes del xat;
- l'Índex llig la capçalera a cada reconstrucció.

`test:precommit` i `porta:olivera` ixen amb 0 (precommit a les 08:18, Olivera a les 08:29). `tancar -- --check` va tornar a 0 a les 06:25; a les 08:29 ix amb 1 només pel rebut que li falta a l'informe 0730 de Gemini, que no és d'este torn (P-07). **No hi ha commit.** El hook encara no pot passar sense `--no-verify` (T2-03), i el tancament propi del torn espera el relleu de MarIA (P-03 i P-06). Els retocs no s'han pogut mirar al navegador: el servidor :3340 estava aturat, i no l'he arrancat. Dues voltes de verificació adversarial en còpies congelades hi van trobar tres camins més i un efecte de costat, i també estan tancats. Hi ha una troballa nova per a tu: el Full de ruta i l'Avís legal també nomenen Google Play i Android dins de l'App (T1-06).

Cada troballa porta el contracte de la plantilla: abast, evidència, severitat, font de veritat, proposta i `requires_human_decision`.

### Matriu de conformitat

| Tasca | Demanat | Estat | On |
| --- | --- | --- | --- |
| 1 · P1-38 | Botó «Descarrega l'App» damunt de Connectar-se / Registrar-se | **Fet** | `src/sections/xat/XatSection.jsx` (AccesAlXat) |
| 1 · P1-38 | `SYSTEM_PAGES` `descarregues`, `PAGE_COPY.descarregues`, imatge 1024×1024 `fetchpriority` alt | **Fet** | `src/config/systemPages.js`, `src/sections/text/pageContent.js` |
| 1 · P1-38 | Android, iOS, ordinador i visió online-first → CRDT | **Fet** | Text sense cap enllaç extern |
| 1 · P1-38 | Àlies `/descarregues`, targeta al Mur, clau i18n en les cinc llengües | **Fet** | `src/app/App.jsx`, `src/config/idiomes/*.js` |
| 1 · G1-01, G5-01 | Dins de l'App nativa, ni targeta, ni pàgina, ni cerca, ni connexió (ordre del Mestre, 261027) | **Fet** | `src/config/systemPages.js` (`nomesWeb`, `esPaginaVisible`), `src/sections/mur/targetesMur.js`, `src/sections/detail/PageDetailSection.jsx`, `src/sections/search/useCercaGlobal.js`, `src/sections/text/paginaDeText.js`, `src/sections/notes/NotesEditor.jsx` |
| 2 · P1-39 | `compile-wiki --check --strict` a 0 | **Fet** (17 → 0) | 27 fitxers de la Wiki |
| 2 · P1-39 | `tancament --check` a 0 | **Fet** (248 → 0; a les 06:11 tornava a 1 per documents d'altres mans, i a les 06:25 torna a 0: P-07) | Verificació |
| 2 · P1-39 | Zero `--no-verify` | **No assolible dins d'este abast** | T2-03 |
| 3 · §5 | Calaix TOC H1–H6, respiració sota la barra negra, tokens Pedra Seca | **Fet** | `src/components/universal/PageFrame.jsx`, `src/css/modules.css`, `src/css/layout.css` |
| 3 · §6 | Icones de 24px en cel·les de 48px; carpeta intrusa fora; Ordenar 20 → 24 | **Fet** | `UniversalToolbar.jsx`, `UniversalWorkspace.jsx`, `NotesSection.jsx`, `AppGridShell.css` |
| 3 · G3-01 | L'Índex llig la capçalera a cada reconstrucció (ordre del Mestre, 261027) | **Fet** | `src/components/universal/PageFrame.jsx` |
| 4 · P1-36/37 | Files de 96px, avatars de 76px, 4px entre títol i missatge | **Fet** | `src/css/tokens.css`, `src/css/modules.css` |
| 4 · P1-36/37 | Fora el `[...]` de la Fila 1; selecció per pulsació llarga; `ListFilter` a la línia de cerca | **Fet** | `LlistaConverses.jsx`, `FilaConversa.jsx`; `MenuLlista.jsx` retirat |
| 4 · P1-53 | Files arran, 96px d'una línia a l'altra; des de les 06:17, en totes les llistes del xat (G2-01, ordre del Mestre) | **Fet** | `src/css/modules.css` |
| 5 · P1-41 | `tooling/media/baremador_nano.mjs` + `.agents/qualificacions_nano.json` | **Paquet d'estudi**: no s'activa (decisió del Mestre, 261027) | `_investigacio_ia_de_poble/261026_2130_baremador_nano_claude/` |
| 6 | `test:precommit`, `porta:olivera`, `tancar -- --check` | **exit 0** les dues primeres (precommit a les 08:18, Olivera a les 08:29); `tancar`, 0 a les 06:25 i 1 a les 08:29 pel rebut de l'informe 0730 de Gemini (P-07) | Verificació |

### Tasca 1 · Card de Descàrregues (P1-38)

**Fet.** La pàgina diu només l'estat real de cada canal, segons les actes 261024_0345 i 261026_1630:

- **Android:** Google Play 1.0.0 en prova interna; encara no hi ha cap APK públic.
- **iOS:** TestFlight 1.0.0 (1) instal·lable pel grup de treball intern; l'App Store encara no té fitxa.
- **Ordinador:** la instal·lació des del navegador, explicada navegador per navegador.
- **Arquitectura:** hui online-first sobre Supabase (ADR-2026-08); la sincronització autònoma amb CRDT es presenta clarament com a visió de futur.

La pàgina no porta cap enllaç, i per tant tampoc l'URL interna de proves de Google Play. Dins de l'App nativa (`esAppNativa`) no hi ha ni el botó, ni la targeta, ni la pàgina (T1-02). **El text alternatiu descriu el que hi ha de veres en la imatge.** Hi ha una prova de ruta real que munta l'App sencera a `/descarregues` (`src/app/App.descarregues.test.jsx`). A més, he comprovat que la prova falla si es lleva l'àlies.

#### T1-01 · La porta de contingut estructural esperava l'empremta (resolt)

- **Abast:** `PAGE_COPY.descarregues`; `tooling/gates/frontissa-contingut.mjs`.
- **Evidència:** exit 1 amb «La clau «descarregues» és obligatòria i no té empremta aprovada. Aprova-la amb --aprova descarregues --per NOM.»
- **Severitat:** bloqueja el commit; és una aprovació humana per disseny.
- **Font de veritat:** la frontissa de contingut, que escriu a `.agents/`.
- **Proposta:** `node tooling/gates/frontissa-contingut.mjs --aprova descarregues --per NOM`, després de llegir la pàgina. Mai s'havia aprovat, i l'aprovació cobrix el text corregit.
- **Estat (06:11):** resolt. `.agents/contingut_estructural.json` porta l'empremta de `descarregues` aprovada per «Javi» el 2026-10-27 (fitxer escrit a les 02:31:04), i la porta ix amb 0 (15/15). Els retocs de les 06:15 no toquen `PAGE_COPY.descarregues`, que és el que l'empremta cobrix.
- **requires_human_decision:** false

#### T1-02 · La pàgina parlava d'Android dins de l'App d'iOS (corregit)

- **Abast:** `src/config/systemPages.js:102`, la targeta del Mur, `/page/descarregues` dins de l'App nativa.
- **Evidència:** `esAppNativa()` només amaga el botó del Xat (`XatSection.jsx:1736`). Dins de l'App d'iOS, la pàgina mostra «Android», «Google Play», «APK directe» i «Chrome a Android».
- **Severitat:** major per a la botiga. No està verificat amb una revisió real.
- **Font de veritat:** App Store Review Guideline 2.3.10 (mencions d'altres plataformes mòbils).
- **Proposta:** dins de l'App nativa, o no mostrar la pàgina i la targeta, o mostrar només la plataforma pròpia, amb una prova `window.Capacitor.isNativePlatform`.
- **Estat (06:15–06:17):** corregit per ordre del Mestre (G1-01 de Gemini i G5-01 de Codex):
  - el descriptor de `descarregues` porta `nomesWeb: true`, i ho decidix `esPaginaVisible`, pura, a `systemPages.js`;
  - `targetesDeSistema` la filtra dins de l'App nativa, i hi passen el Mur, el Calendari i `usePaginesDelSistema` (Notes, la fitxa, el poble i `PublicacioDetall`);
  - `PageDetailSection` porta `/page/descarregues` a l'inici, i l'àlies `/descarregues` hi va a parar;
  - la primera verificació (06:22–06:44) va trobar dos camins més, i els he tancat a les 06:46: la cerca global (`useCercaGlobal.js`), que n'indexava el cos i en mostrava fragments amb «Android» i «Google Play», i el lector de connexions de Notes i la targeta incrustada (`paginaDeRuta`, a `paginaDeText.js`); la segona (06:49–07:13), un altre, el selector de targetes de l'editor de Notes (`NotesEditor.jsx`), tancat a les 07:13;
  - proves noves a `systemPages.test.js`, `targetesMur.test.js`, `PageDetailSection.descarregues.test.jsx`, `SearchSection.test.jsx`, `paginaDeText.test.js`, `NotesEditor.targetes.test.jsx` i `App.descarregues.test.jsx`, que munta l'App de veres amb les pàgines reals i un control a la web. Els verificadors van matar tots els mutants dels fitxers del retoc (11 de 11 en dues voltes). Forçar `nativa: false` al Mur ara ho veu la prova de l'App; al Calendari, encara no.
  - Queden llistes que només en diuen el títol, sense cap plataforma: l'assignador d'emojis de Disseny, la taxonomia de superadmin i el cens de l'Arxiu visual.
- **requires_human_decision:** false

#### T1-03 · El pla i el prompt no coincidixen en la imatge (resolt)

- **Abast:** pla 261026_2130 §2.A.3 contra prompt Tasca 1; `public/assets/uploads/brain/nano_descarregues_gamberro.*`.
- **Evidència:**
  - El pla apunta a la imatge «gamberro», que té bafarades amb text que no és valencià (IDIOMA) i marc blanc (ENQUADRAMENT).
  - El prompt mana la imatge de l'App, i és la que he usat.
  - La parella gamberro està a `public/` sense ús ni cens, i fa caure `censImatges.test.js:57` per un motiu nou.
- **Severitat:** menor.
- **Font de veritat:** el prompt (ordre del Mestre 261026_2126), la «Zero Text Rule» de P1-41 i `src/sections/multimedia/censImatges.js`.
- **Proposta:** deixar la parella gamberro només a `01_produccio` i versionar a `public/` només `nano_descarregues_app.jpg/.webp`. Si la vols a `public/`, cal afegir-la a `EXCLOSES`.
- **Estat (06:14):** per ordre del Mestre, la parella ja no és a `public/`. Abans he comprovat amb `cmp` que les dues còpies de `01_produccio` són idèntiques byte a byte. No tenien seguiment a git; per això no les he esborrades: les he mogudes a la Paperera del sistema (`~/.Trash/nano_descarregues_gamberro_public_261027.jpg` i `.webp`), d'on es poden recuperar. Ara `censImatges.test.js` només falla per l'avatar `iaia_maria_avatar_mobil`, com a HEAD.
- **requires_human_decision:** false

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

#### T1-06 · El Full de ruta i l'Avís legal també nomenen Google Play i Android dins de l'App

- **Abast:** `PAGE_COPY.roadmap` (`src/sections/text/pageContent.js:162`) i `legalContent.js:180`, a `/roadmap` i a `/legal`, que són dins de l'App nativa (la targeta del Mur del Full de ruta, i la cerca).
- **Evidència:** el verificador de la primera volta ho va trobar fora de l'abast del retoc. El Full de ruta diu que Sóc de Poble no es descarrega de l'App Store ni de Google Play; l'Avís legal parla de l'aplicació per a Android i iPhone. A més, la frase del Full de ruta ja no quadra amb TestFlight i amb la prova interna de Google Play.
- **Severitat:** major per a la revisió d'Apple, la mateixa regla 2.3.10. No l'he tocat: és text teu, i l'empremta de la frontissa cobrix `PAGE_COPY`.
- **Font de veritat:** App Store Review Guideline 2.3.10; les actes 261024_0345 i 261026_1630.
- **Proposta:** reescriure la frase del Full de ruta (i, si cal, la de l'Avís legal), o una variant per a l'App nativa.
- **requires_human_decision:** true

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
- `tancament --check`: de 248 errors a 0 amb este informe complet (a les 06:11 tornava a 1 per documents d'altres mans; a les 06:25, 0: P-07).

#### T2-01 · La reparació viva és fràgil: el pròxim arxivament torna a trencar enllaços

- **Abast:** `tooling/lib/document-links.mjs` (`resolveDocumentLink` exclou `90_arxiu_historic`), Porta Orfandat, Porta Frontmatter F9.
- **Evidència:** assaig real de `porta-olivera --arxiva` en còpia congelada. Sense el pegat, cada arxivament suma errors nous (+3 SCC i Orfandat, +1 F9). Amb el pegat, totes les portes del hook donen el mateix abans i després. La cinquena volta (02:49–04:31) el va passar a un script (`aplica_amb_executor.sh`) i en va corregir els tres errors de procediment. La sisena (04:40–06:08) en va tancar les huit troballes del verificador. Ara el script diagnostica un executor mort per un senyal, diu quanta part del pegat ja és als fitxers i para si ja és aplicat sencer. El verificador de la sisena el dona per llest tècnicament: 44 còpies, quatre senyals en quatre moments i la recuperació impresa enganxada en zsh. Quedaven dos buits menors de la guia de recuperació i tres detalls (§4.2, §3.8): pgrep no distingix un pany viu d'un de mort, i una mort dins de `active.lock` del Reflex no es diagnostica.
- **Severitat:** major. És la causa dels 236 errors d'esta nit, que tornaran.
- **Font de veritat:** la Llei Olivera (AGENTS §0.1) arxiva, i les portes no troben el que s'ha arxivat.
- **Proposta:** aplicar `261026_2130_scc_arxiu_per_nom.patch` (10 fitxers, +398 −14; hash i hores a `LLEGIU_PRIMER.md` §6), que resol per nom els documents arxivats:
  - en SCC, Orfandat i Frontmatter;
  - sense distingir majúscules;
  - el viu sempre guanya;
  - es refusen els enllaços simbòlics.

  Es fa amb `bash ../_investigacio_ia_de_poble/261026_2130_salfumant_wiki_claude/aplica_amb_executor.sh`, des de l'arrel de `socdepoble.org`, una lease cada vegada; `--compile-codi` és opcional i va després (seqüència a `LLEGIU_PRIMER.md` §4.2). Mentre corre, cap altra mà ha d'escriure a `src/`, `tooling/`, `tests/`, `.agents/` ni a la Wiki. Després, si vols, els 190 enllaços es poden tornar a la forma curta `[[nom]]` (assajat: idèntic en totes les portes).
- **Defecte obert (G5-02 de Codex):** amb un document viu i un d'arxivat del mateix nom, SCC i Orfandat resolen al viu, però Teixit i Llaurador, que compten els arxivats en el seu catàleg, diuen «Enllaç ambigu». «El viu sempre guanya» no val igual en totes les portes. El `LLEGIU_PRIMER.md` (§5) ja ho registrava com a residu, i Codex ho ha reproduït. Hui no hi ha cap homònim així al viu. Proposta: compartir el catàleg i la precedència entre les portes abans d'aplicar-lo, o aplicar-lo sabent-ho.
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
  - Des que una altra mà va reconciliar l'esquema (05:05, T2-07), el Frontmatter ix amb 1 per eixa tolerància zero: a les 06:11 marca deute F9 («Vincles») en 22 fitxers modificats de la Wiki, que són els d'esta reparació. El pegat i les opcions del `LLEGIU_PRIMER.md` §4.5 el rebaixen.
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
- **Proposta:** aprovar la nova empremta, o aplicar el pegat i restaurar els claudàtors; i confirmar els tres destins. A les 06:28, Gemini va reformar el llibre d'or per P1-63 (`261027_0730_reforma_editorial_gemini.md`): l'empremta torna a canviar, i la decisió s'ha de prendre sobre el text nou.
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

#### T2-07 · La Porta Frontmatter va eixir amb 2 de les 02:32 a les 05:05, per un canvi d'una altra mà a l'esquema (resolt)

- **Abast:** `tooling/wiki/schema.json` (modificat a les 02:32:22, sense commit) i el pany de migració de la Porta Frontmatter.
- **Evidència:**
  - El diff afig l'etiqueta `nano` a la llista d'etiquetes permeses. No és canvi meu: no he escrit res a `tooling/`.
  - Des d'aleshores, `node tooling/wiki/tractor-frontmatter.mjs` ix amb 2: «El pany de migració no quadra amb l'esquema real» (declarat `e05b10cd…`, real `95c166fa…`). Comprovat a les 04:36.
  - La porta forma part del hook, que per tant no pot passar mentre dure, siga quin siga el commit.
  - Per això els assajos del blindatge de la Wiki van comptar F9 en còpies amb el `schema.json` de HEAD.
- **Severitat:** major per al hook.
- **Font de veritat:** `tractor-frontmatter.mjs`, que demana `--segella-esquema` per reconciliar-ho.
- **Proposta:** que qui va afegir l'etiqueta, o el Mestre, reconcilie el pany amb `node tooling/wiki/tractor-frontmatter.mjs --segella-esquema` (per executor i lease, perquè és governança), o que desfaça el canvi.
- **Estat:** resolt per una altra mà a les 05:05:01. `tooling/wiki/schema-cutover.lock.json` declara ara l'esquema real (`95c166fa…`): Codex ho comprova, i l'acta 0520 de MarIA (§4) diu que el va reconciliar amb `npm run porta:frontmatter`. Des d'aleshores la porta ix amb 1, per la tolerància zero de T2-03.
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
  - Corregit a les 06:19, per ordre del Mestre (G3-01 de Gemini): l'Índex llig la capçalera a cada reconstrucció i, des que la veu, n'observa el text. Una capçalera que es munta després d'obrir-lo hi entra amb el pròxim canvi del cos. Prova nova a `PageFrame.indexTitol.test.jsx`. El verificador en va matar els cinc mutants i va comptar 30 reconstruccions per 30 tecles al títol editable: cap bucle. Queda un detall: si la capçalera es lleva o se substituïx amb l'Índex obert i sense cap canvi del cos, el títol vell hi seguix fins al pròxim canvi; la vella continua observada, sense cap bucle.
  - Notes amb sessió només s'ha provat en jsdom: al servidor compartit no podia entrar.
  - Corregit a les 01:27: els escoltadors de l'Índex es tornaven a subscriure a cada pintada, perquè `onClose` era una funció nova cada vegada. Ara és estable (`useCallback`), i les 321 proves de `PageFrame` i de la incrustació passen.
- **Severitat:** nit.
- **Font de veritat:** —
- **Proposta:** cap. G5-07 de Codex, un canvi de text dins d'un `strong` d'un títol que no reconstruïx l'Índex, és anterior al torn i queda al Llibre Mestre.
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
- **La correcció.** Primer, només en la llista de converses, amb un modificador. Des de les 06:17, per ordre del Mestre (G2-01), la regla és de la classe mare, `:where(.sdp-xat-llista) > li { margin-bottom: 0; padding-left: 0; }` (T4-05), i el modificador ja no hi és.
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

#### T4-05 · El mateix buit quedava en les altres llistes del xat (corregit)

- **Abast:** les altres `ul.sdp-xat-llista`:
  - `XatControlSection`, `ResultatsCercaXat`, `VistaMultimedia` i `DialegCompartir`;
  - `DialegNovaConversa` (tres llistes), `VistaComunitats` i `FitxaComunitat` (dos);
  - `AssignacioEmoji` i els espècimens de Disseny (`EspecimenXat` i les cinc d'`EspecimenXatLlista`).
- **Evidència:** totes hereten el mateix `li` de `base.css`. Les he deixades com estaven per la Llei del Píxel, perquè P1-53 parla de la llista de converses.
- **Severitat:** menor.
- **Font de veritat:** la Lliçó del Mestre 260923 (Llei del Píxel) i `sdp-clon-whatsapp`.
- **Proposta:** si les vols totes arran, n'hi ha prou amb una regla, `.sdp-xat-llista > li { margin-bottom: 0; padding-left: 0; }`, en lloc del modificador.
- **Estat (06:17):** fet per ordre del Mestre. Canvien tretze llistes: `XatControlSection`, `ResultatsCercaXat`, `DialegCompartir`, `VistaComunitats`, `VistaMultimedia`, les dos de `FitxaComunitat`, `EspecimenXat` i les cinc d'`EspecimenXatLlista`. A cada una, la fila puja 8px i entra 4px menys. Les quatre que també són `.sdp-xat-targeta` (les tres de `DialegNovaConversa` i la d'`AssignacioEmoji`) ja anaven arran. La primera verificació va trobar un efecte de costat: la regla pesava més que `.sdp-xat-multimedia__item` i llevava els 16px de l'esquerra a les files d'Enllaços de Multimèdia. Des de les 06:46 és `:where(.sdp-xat-llista) > li`, que pesa com el `li` sol: torna el coixí d'eixes files i no canvia cap altra llista. La prova mira l'última declaració per a eixe selector i que la regla siga dins de `@layer components`; un shorthand o un altre selector que tornara el marge no el veu. La segona verificació ho confirma amb un motor de cascada i amb Chromium sense pantalla: de 210 `<li>`, només canvien les 6 files d'Enllaços, que tornen als 16px. No s'ha mirat al navegador de l'App (Límits).
- **requires_human_decision:** false

### Tasca 5 · Baremador del Nano (P1-41)

**Paquet d'estudi, no aplicat.** La cinquena volta (02:49–04:31) i la sisena (04:40–06:08) en van tancar les troballes majors: les grafies d'àlies de macOS, el fals «symlink trencat», els secrets enganxats i els camins absoluts. El verificador de la sisena el dona per llest tècnicament, amb tres detalls menors oberts (`LLEGIU_PRIMER.md` §8). **Decisió del Mestre (xat, 06:13): no s'activa com a motor paral·lel.** Queda com a paquet d'estudi per a fondre'n la lògica pura en P1-42 (T5-02). És a `_investigacio_ia_de_poble/261026_2130_baremador_nano_claude/`: arbre `staged/`, pegat, `LLEGIU_PRIMER.md`, fitxa de sentinella a `pendent_mestre/` i `verificacio/`.

**Què fa:**

- Té cinc ordres: `avalua`, `llista`, `informe`, `prompt` i `estils`.
- Rebutja amb IDIOMA, ENQUADRAMENT, HUMOR_GAG o ESTIL, siga quina siga la nota. Sense motiu de rebuig: APROVADA des de 7, i MILLORABLE per davall.
- Només hi ha els tres registres canònics.
- `prompt` porta sempre la «Zero Text Rule» i el FULL BLEED 100%.
- Les dades van a `.agents/qualificacions_nano.json`, amb pany, fitxer temporal i compare-and-swap.

**La plantilla viva `03_actuar/plantilles/prompt_nano_banana.md`** convida a fer bafarades i porta castellà («A Sangre», «caras amables»). La versió preparada la corregix.

#### T5-01 · No s'aplicava sense tres respostes teues (decidit: no s'activa)

- **Abast:** `tooling/media/`, `.agents/`, la plantilla del Nano, `identitat_visual.md`.
- **Evidència:**
  - Són rutes de governança, i només s'hi escriu amb `executor-mutacio.mjs` i lease.
  - La lliçó 261002 (`wiki-documentacio-i-reflex/SKILL.md:106`) diu que tot tractor cognitiu nou necessita un document del seu flux i la teua aprovació des de la interfície web abans de ser efectiu.
- **Severitat:** bloqueja l'aplicació per disseny.
- **Font de veritat:** la lliçó 261002 i `mutation-policy.mjs`.
- **Proposta:** respondre per escrit a D-3 (ruta de sentinella, ruta de Gestoria o aprovació provisional per xat). Després, un sol pla `sdp.mutation.v1` dels 6 fitxers, en l'ordre de `LLEGIU_PRIMER.md` §6.
- **Estat:** decidit al xat (06:13): no s'activa. D-3 ja no bloqueja res, i el paquet queda al laboratori.
- **requires_human_decision:** false

#### T5-02 · P1-42 se solapa amb el baremador (decidit: fondre'l en P1-42)

- **Abast:** Llibre Mestre, fita 6 (P1-42), escrita per MarIA a les 22:58.
- **Evidència:** P1-42 demana un sol motor de qualificació, amb estrelles d'1 a 5, vots populars i un catàleg d'atributs dins de `/multimedia`. El baremador puntua de l'1 al 10 des de la línia d'ordres.
- **Severitat:** major d'arquitectura. Fer-ho dues vegades contradiu el «no duplicar sistemes» de la mateixa fita.
- **Font de veritat:** P1-42.
- **Proposta:** decidir si el baremador és una passarel·la provisional fins a P1-42, o si es fon directament en P1-42. En el segon cas, cal reutilitzar-ne els motius, el registre i la Zero Text Rule com a vessant tècnic.
- **Estat:** Gemini (G5-01) i Codex (G5-05) proposen fondre'l, i el Mestre ho ha decidit (xat, 06:13). Per a la fusió, cal tindre en compte T5-04.
- **requires_human_decision:** false

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
- **Proposta:** respondre les que encara valguen quan es fonga en P1-42; D-1 i D-8 hi pesen més.
- **requires_human_decision:** true

#### T5-04 · La nota d'una IA desplaça la del Mestre en el resum (defecte trobat per Codex)

- **Abast:** `staged/tooling/media/baremador_nano.mjs:690-697` (`vigents`), dins del paquet d'estudi.
- **Evidència:** `vigents()` agrupa només per `imatge.sha256`, i guanya la qualificació més recent, siga de qui siga. Codex ho reproduïx (G5-03): el Mestre posa un 10 a les 00:00, `ia:claude` un 1 a la 01:00, i `informe()` sense filtre dona una sola qualificació vigent, amb mitjana 1. Ho he confirmat llegint el codi.
- **Severitat:** major per al calibratge humà, si mai s'activa. Hui no té efecte: no està aplicat.
- **Font de veritat:** P1-41 (el calibratge del Mestre) i P1-42 (la votació i l'agregació comunes).
- **Proposta:** en la fusió amb P1-42, la vigència per avaluador i una agregació explícita per context; mai «l'últim que escriu guanya».
- **requires_human_decision:** true (D-8: el paper de les notes d'IA)

### Contrast amb les auditories de Gemini (0550) i de Codex (0650)

Totes dues auditen la ronda 5 a l'arbre viu, sense tocar `src/`. Coincidixen en quasi tot; on discrepen, he comprovat el fet jo mateix. Les ordres del Mestre de les 06:13 en resolen quatre.

| Troballa | Qui | El meu contrast | Estat |
| --- | --- | --- | --- |
| L'App d'iOS mostra Android, Google Play i l'APK | G1-01, G5-01 | Cert: és T1-02. Amagar només el botó no bastava | **Corregit** (T1-02) |
| La parella gamberro, fora del cens | G1-02, G5-08 | Cert (T1-03). Però no feia caure `test:precommit`, com diu G1-02: eixa suite no executa `censImatges.test.js`, i passava amb 3.627 verdes a les 02:55 i a les 06:21. Té raó Codex | **Corregit** (T1-03) |
| El peu d'accés dins de les converses obertes | G1-03 | Cert; és P1-54, una fita posterior al prompt (P-05) | Pendent (P1-54) |
| Les files fan 97px | G2-01 | No: fan 96px, amb la vora dins de la caixa. Codex ho ha mesurat, i jo a les 02:54 | — |
| El buit en les altres llistes del xat | G2-01 | Era T4-05. Codex ho veia com una ampliació d'abast; el Mestre ho ha manat | **Corregit** (T4-05) |
| Noms tallats a 1280px i «1 seleccionada» | G2-02 | Són T4-01 i T4-02; les xifres de Gemini quadren amb les meues | Decisió (T4-01, T4-02) |
| La pulsació dins de la selecció i `user-select` | G2-03 | És T4-03 | Decisió (T4-03) |
| La capçalera que es munta tard | G3-01 | Cert; era el primer detall de T3-04 | **Corregit** (T3-04) |
| Bancal aplana H3–H6 | G3-02 | És T3-03 | Decisió (T3-03) |
| Icones de 24px fora de Notes | G3-03 | És T3-02 | Decisió (T3-02) |
| El blindatge de la Wiki | G4-01, G5-02 | D'acord a aplicar-lo, però no és «resilient, net i segur» en tot: un homònim viu i arxivat divergix entre portes. Té raó Codex | Defecte obert (T2-01) |
| `file:///` i l'esquema | G4-02 | Les rutes absolutes són T2-05. L'esquema ja estava reconciliat a les 05:05 (T2-07): a les 05:50 l'afirmació de Gemini era vella | Pendent (T2-05) |
| El baremador, un segon sistema | G5-01, G5-05 | D'acord: no s'activa, i es fon en P1-42. «Trenca `turns.mjs`» és massa: Codex ho limita a una escriptura durant una instantània, i jo no ho he comprovat. Les 1.576 línies venen de sis voltes de contenció del sistema de fitxers, que sobre Supabase desapareix | **Decidit** (T5-01, T5-02) |
| L'última nota guanya | G5-03 | Cert; ho he confirmat al codi | Defecte obert (T5-04) |
| El tancament, roig a les 05:57 | G5-04 | Cert, per documents d'altres mans; a les 06:25 torna a 0 | **Corregit** (P-07) |
| Les xifres dels 248 enllaços | G5-06 | Cert: 190 reconduïts, 46 passats a codi i 12 claudàtors. Els 46 ja no es poden seguir; la llista, amb el text d'abans i el de després, és a `261026_2210_informe_sanejament_viu.json` (categoria «b») | Precisat ací |
| `compilador_wiki.mjs` no existix | G5-06 | Cert: el pla 0535 el cita; l'eina és `compile-wiki-to-app.mjs` | R-11 |
| Un text dins d'un `strong` d'un títol | G5-07 | Cert i anterior al torn; fora de les ordres d'avui | Llibre Mestre |

### Paquet de consens per al relleu: P1-54, P1-55 i P1-58

Gemini (§5, propostes A–C) i Codex (§9 A–C) van proposar solucions. Tres validadors les han contrastades amb el codi viu el 2026-10-27, en lectura. La base és Codex; de Gemini queden la intenció de P1-55 i l'ordre de P1-58. Arbre compartit: el relleu rellig cada fitxer i localitza el codi per patró.

#### P1-54 · Cap peu d'accés dins d'una conversa

**Consens** (Codex §9 A, sense `!activeThread`, redundant amb `!threadId`):

- `XatSection.jsx` (línia orientativa 1267) passa a `const peuDAcces = senseSessio && esAterratge ? (`, amb `esAterratge = !threadId && !comunitatId && !vista && !amb && !sobre`.
- `vista`, no `vistaActiva`, que naix més avall (línia orientativa 1393): petaria per TDZ.
- Sense `!connectionContext`: tancar «Nova conversa» deixa `?context=` i el peu no tornaria.
- Fora `peu={senseSessio ? <AccesAlXat … /> : null}` de `<Conversa>` (línia orientativa 1544) i els dos usos sempre nuls (línies orientatives 1407 i 1509). Sense efectes ni CSS.
- Es reescriuen els comentaris XAT-1 i d'`AccesAlXat`, que encara el posen fora de l'aterratge.

**Què es descarta i per què:**

- La doble instància de Gemini no existix: avui n'hi ha una (`XatSection.avatars.test.jsx:397-398`). El seu `peu={null}` arregla els fils, però no la comunitat, les vistes ni els trànsits (`?amb=`, `?sobre=`, `sdp-per-defecte:*`).
- La línia «Vols participar?» al compositor: `esConversaDelsAgents` no existix, i trencaria XAT-4 (`XatSection.actorsPermanents.test.jsx:560`).

**Proves:** en una còpia, el pegat de Codex dona 6 roigs esperats sobre 1.301, tots a `XatSection.avatars.test.jsx`. `:388` es partix (aterratge, una parella; `fake-javi`, `fake-iaia` i un canal de comunitat, zero); `:417` queda a l'aterratge; `:464` i `:493` passen a zero. Noves: trànsits, tornada a `/xat` i amb sessió. `:436` i `:479`, iguals.

**Decisió del Mestre:** aterratge estricte (recomanat) o tota pantalla sense conversa. L'estricte revertix XATR-1 (Gauntlet 261022_0225): el convidat d'una comunitat perd l'accés fins a P1-55.

#### P1-55 · La pàgina viva de la comunitat a la dreta

**Consens** (arquitectura de Codex §9 B):

- `rightColumn`: abans de `<ColumnaDretaBuida t={t} seo={seoXat} />` (línia orientativa 1589), una branca `comunitatId` amb `ColumnaDretaDeLaComunitat`, germana de `ColumnaDretaBuida` i dins del shell.
- La mateixa porta d'estret: la columna sempre és muntada, i el mòbil no ha de carregar res.
- Nou `src/sections/xat/components/FitxaVivaDeComunitat.jsx`, amb `lazyRoute`. Entitat: `FitxaPublica` amb `chrome="context"` i un hook `usePerfilPublic` extret de la ruta. Poble: `VistaDelPoble`, nova a `ItemDetailSection.jsx`, sense `useSEO` ni `useParams`.
- `export` de `fitxaDelSubjecte` (`xatDelPoble.js:45`), que ja troba el poble remot (UUID i `/pobles/<slug>`).
- P1-54 primer, o junts: és el mateix bloc.

**Què es descarta i per què:** `esPortadaDelPoble`, `esComunitatDelProjecte`, `DetailSection`, `slugFix` i `tipusFix` no existixen. Incrustar `PerfilPublicSection` o `ItemDetailSection` afegiria un `useSEO` posterior, que guanya (`seoHead.js:83`) i pren el títol i el canonical de `/xat`.

**Proves:** `XatSection.pes.test.js` prohibix quatre mòduls més, i un `vi.mock` de `FitxaVivaDeComunitat` protegix les proves amb `?comunitat=`. Noves: el títol continua «Xat», un fil obert guanya, a 375px no es munta i el poble remot es troba. Les 13 suites de `PerfilPublicSection`, iguals.

**Decisió del Mestre:** els botons de xat de la vista incrustada; què es mostra si la comunitat no es troba (mai el poble pilot); la tauleta; la fase mòbil.

#### P1-58 · La fitxa s'edita damunt de l'H1 (amb P1-57)

**Consens** (lloc de Codex §9 C, ordre de tots dos; Grau 1, opcional):

- `PageFrame.jsx`: prop `despresAutoria = null`, germana nova entre `{showOrangeBar && (` i `<header className="page-title" ref={capcaleraRef}>` (línia orientativa 1014): fora de la capçalera i de l'`article` que observa l'Índex.
- `UniversalEditorShell.jsx`: `posicioEdicioAvancada = 'cos'` per defecte. Amb `'despres-autoria'`, el calaix puja i `{desplegable}` (línia orientativa 634) queda nul al seu lloc: TipTap no es remunta. Ordre: capçalera, identitat, logotip, classificació.
- `PerfilEditor.jsx`: `posicioEdicioAvancada: 'despres-autoria'`, vora `edicioAvancada: true`; Notes, no.
- `.sdp-pagina-despres-autoria` (`utilities.css`) torna el coixí lateral.

**Què es descarta i per què:**

- Dins de `.page-intro`: és a l'`article`, davall de l'H1, i l'Índex n'indexaria els títols.
- Llevar `!esPilot` (`PerfilEditor.jsx:857`) desfaria la guarda de l'auditoria 261007: una pujada sobreescriuria el `logo_url` del pilot, que també és el seu avatar, i la fitxa pública mostraria el logotip fix.

**Proves:** sense canvis, `UniversalEditorShell.edicioAvancada`, `DocumentEditor.edicioAvancada`, `PerfilEditor.test.jsx:900-908` (pilot), `PageFrame.indexTitol` i `PageFrame.peuDePagina`. Noves: `PageFrame.despresAutoria.test.jsx`, la posició nova al shell (mateix node de ProseMirror) i l'ordre al Perfil.

**Fora de la primera entrega:** el contracte d'imatges (P1-57 a P1-59: avatar d'organització propi, que és Grau 2; logotip editable del pilot; enquadrament versionat; A4 sencer).

**Decisió del Mestre:** si Notes també puja; la junta amb la barra taronja (captures a 375, 820 i 1280px); la matriu de rols d'imatge (IDEA-44, P1-59).

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
  - les imatges que decidisques en T1-03;
  - `src/data/wikiManifest.js` regenerat amb `node tooling/wiki/compile-wiki-to-app.mjs` després de la reforma del llibre d'or i d'El Projecte de Gemini (06:28), que no l'ha regenerat.
- **requires_human_decision:** true

#### P-03 · `ESTAT.md` i `LEDGER.md` no els he escrit

- **Abast:** `.agents/ESTAT.md`, `.agents/LEDGER.md`.
- **Evidència:** `.agents/` és governança. Esta nit ja hi ha canvis d'altres mans: la skill nova de MarIA, dues transaccions de segell i ESTAT/LEDGER. Sense el relleu, `tancament.mjs --check --turn-id` d'este torn ix amb 1 (04:36): diu que falta el relleu del torn en tots dos fitxers.
- **Severitat:** menor.
- **Font de veritat:** AGENTS §4 i `mutation-policy.mjs`.
- **Proposta:** que MarIA hi anote el relleu amb el resum de la secció de Claude del Llibre Mestre. Des de l'arxivament de les 08:05, el tancament del torn també diu «Pla absent o modificat»: el pla vinculat al torn ja és a l'arxiu, i el relleu ho ha de reconéixer.
- **requires_human_decision:** false

#### P-04 · Informes d'altres IAs sobre este torn

- **Abast:** `04_escriptori/`.
- **Evidència:** a les 02:50 només hi havia el pla, el prompt i este informe. Des de les 05:20 hi ha l'acta 0520 de MarIA, el pla i el prompt 0535 de l'auditoria, i les auditories de Gemini (0550) i de Codex (0650). A les 07:30, la reforma editorial de Gemini i la solució Open Graph de Codex, amb les seues propostes per a P1-54, P1-55 i P1-58. Les he llegides senceres; el contrast i el paquet de consens són a les seccions anteriors.
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
- **Proposta:** un prompt nou amb P1-52, P1-54 i P1-55, i P1-46, que toca la mateixa pàgina de Descàrregues. De 03:00 a 04:13, MarIA ha anotat també P1-56 a P1-59 (la targeta proposada, els cartells A4, l'edició avançada de la fitxa i la doctrina persona, empresa i grup); tampoc són d'este prompt.
- **requires_human_decision:** false

#### P-06 · El tancament del torn marca dues imatges de `01_produccio` que no he posat jo

- **Abast:** `_wiki_de_poble/04_escriptori/01_produccio/nano_descarregues_app.jpg` i `.webp`.
- **Evidència:**
  - `tancament.mjs --check --turn-id` d'este torn les marca com a «Zona humana modificada» (04:36).
  - Totes dues es van crear a les 21:46:17, un minut després d'obrir-se el torn (21:45:17), al mateix temps que les còpies idèntiques de `public/assets/uploads/brain/` que fa servir la pàgina de Descàrregues.
  - No són meues: la primera escriptura meua fora de la carpeta temporal és la creació d'este informe, a les 21:53:57, i cap agent meu ha escrit a `01_produccio`.
- **Severitat:** menor; impedix tancar el torn tal com està.
- **Font de veritat:** `tooling/documental/turns.mjs`, que compara la zona humana amb l'inventari d'obertura del torn.
- **Proposta:** que el relleu que escriga MarIA (P-03) reconega les dues imatges com del Mestre, o de qui les va posar.
- **requires_human_decision:** true

#### P-07 · Dos arranjaments en documents d'altres mans perquè el tancament tornara a 0

- **Abast:** `_wiki_de_poble/04_escriptori/261027_0550_auditoria_gemini.md` i `_wiki_de_poble/00_index.md`.
- **Evidència:**
  - A les 06:11, `tancar -- --check`, SCC i Orfandat ixien amb 1, per cinc enllaços inexistents de l'informe de Gemini (`[[...]]`, `[[nom]]` dues vegades, `[[x]]` i `[[nom_document]]`) i per l'acta 0520 de MarIA, que no tenia cap enllaç entrant.
  - Els cinc ja anaven entre accents greus. El lector d'enllaços (`tooling/lib/document-links.mjs:7`) els veia perquè un literal amb dos accents greus a cada costat, fet per a mostrar `nom` amb els seus, li desquadrava la resta del document. L'he passat a un literal senzill, (`nom`): només es perd la vista dels accents greus de dins.
  - Desquadrat, també amagava un enllaç de veres a un document que no existix enlloc, `261027_0145_acta_marmota_auditoria_forense_bessons`. L'he passat a literal de codi, com els 46 de la Tasca 2.
  - L'acta 0520 l'he ancorada a `00_index.md`, damunt de la 0145, com les altres actes.
  - Tot amb compare-and-swap i una còpia d'abans a la carpeta temporal. A les 06:25, `tancar`, SCC i Orfandat tornen a 0.
- **Severitat:** major per al tancament mentre va durar. Ja està corregit.
- **Segona vegada (08:05–08:28):** l'arxivament de les 08:05 (acta 0805 de MarIA) va moure al fons de l'arxiu el prompt i el pla d'este torn i les auditories 0550 i 0650, i va trencar 8 enllaços: dos d'este informe, tres del Llibre Mestre, i un de cada informe de les 07:30. És la fragilitat de T2-01. Els he reconduït a `../90_arxiu_historic/`, com els 190 de la Tasca 2, amb el text visible igual i compare-and-swap.
- **Font de veritat:** `verificador-scc`, `tractor-orfandat` i `tancament.mjs`.
- **Queda obert:** l'informe 0550 de Gemini porta el rebut d'este informe (`sdp:torn_51d1660b-…:1e692e0b-…`), i `document.mjs check` el dona per invàlid: «Rebut absent o vinculat a un altre document». Este informe continua vàlid. El 0730 de Gemini, arribat després, no porta cap rebut («cal un rebut persistent emés per document.mjs context»). Des de l'arxivament de les 08:05 el 0550 ja no compta; a les 08:29, `tancar -- --check` ix amb 1 només pel rebut del 0730. Un rebut propi només el pot fer qui va crear el document, amb `document.mjs`.
- **Proposta:** que Gemini o MarIA li donen un rebut propi, i que el lector d'enllaços tracte els literals amb més d'un accent greu com fa CommonMark.
- **requires_human_decision:** false

### Debat: com es mesura l'autonomia (la teoria del carnet de conduir helicòpters)

L'autonomia es pot **matematicar**, però no amb una nota única de maduresa. Es mesura per l'espai on cada mà vola **sense topar**, en tres superfícies: `src/`, documents i governança. El carnet puja amb un **pla de vol** declarat, tancaments verificats i preguntes ben calibrades, i baixa amb les col·lisions que causa. El Grau 2 de P1-62 no és cap nivell: és la **torre** de control (fita 26 del Llibre Mestre). Els números informen; no autoritzen.

#### Consens de les tres IAs

- **Grau 2 és la torre,** no un nivell: bases de dades, seguretat, esborrats i governança esperen l'**aprovació humana** (P1-62, Gemini §4, Codex §9).
- **Un carnet per àmbit:** un marge CSS ben resolt no acredita una migració (Codex §9).
- **La contigüitat té precedent:** P1-53 (Llibre Mestre, Gemini).
- **El Llibre Mestre és el mapa compartit,** però una **fita escrita** no prova la implementació, i una **prova verda** pot protegir el comportament vell: a P1-54, `XatSection.avatars.test.jsx:388` i `:417` volen el peu d'accés dins d'un fil (`:417`, d'esta nit).
- **On discrepem.** Gemini: Grau 1 és «actues i ho deixes polit sense preguntar». Esta nit, T4-05 (13 llistes, **superfície compartida**) va esperar el Mestre per la **Llei del Píxel**. Codex: iniciativa és preparar **bones decisions** i eixides reversibles. Claude: **mesurar-ho**.

| Nivell | Què pot tocar | Què declara abans | Com es guanya | Com es perd |
|---|---|---|---|---|
| A · Aprenent | Documents amb rebut propi; la resta, propostes | Un torn propi | És el sòl | No es perd: s'hi baixa |
| B · Copilot | Grau 1 dins de les rutes declarades | `own` de cada ruta | Torn propi i rebuts vàlids | Escriptura invisible (a A), intrusió o més de 60 min de roig causat |
| C · Contigüitat | B, 3 rutes veïnes (cas P1-53) i arranjaments mecànics amb CAS en documents aliens | Rutes veïnes al relleu; avís a l'amo | 10 torns verificats, pla de vol ≥ 0,9 i impulsivitat ≤ 0,2; ho ratifica el Mestre | Les faltes de B: torna a B |
| Grau 2 (no és nivell) | Bases de dades, seguretat, governança, patrons de Pedra Seca, zona humana, esborrats i commits | Els fitxers exactes i l'aprovació humana registrada | Mai: s'aprova cada acció | Sense aprovació, a A en tot |

Un **canvi visual** amb més de tres consumidors fora de la superfície és sempre **proposta** (Llei del Píxel).

#### Sis mètriques

- **Tancament verificat:** torns amb `verify` i `close` / torns oberts; no compten l'`expire-close` (`tooling/documental/turns.mjs:224`) ni el `deliver-close`.
- **Pla de vol:** escriptures en rutes amb `own` anterior a l'mtime / escriptures de la mà (historial dels torns, traça d'Antigravity).
- **Atribució:** canvis amb un registre que nomena l'escriptor / canvis a l'inventari (`tooling/documental/turns.mjs:29-30` i rebuts).
- **Roig causat:** Σ (verd − canvi causant) per porta roja a una altra mà (mtimes i informes: `run-portes.mjs` no guarda resultats).
- **Canal de Grau 2:** escriptures de governança per `executor-mutacio.mjs` / escriptures de governança (`tooling/gates/mutation-policy.mjs:6`).
- **Calibratge:** impulsivitat = false que el Mestre va decidir / false; soldat = true resolts amb «obvi, fes-ho» / true (`requires_human_decision`).

#### Esta nit, amb números

- **Tancaments:** 5 verificats en 414 torns (l'últim `verify`, el 29-09), 3 `deliver-close` sense porta i 378 per caducitat; la Consola en dona 386 per tancats (`src/sections/consola/mapa/construeixMapa.js:794-795`). Esta nit, 4 oberts i 0 tancats.
- **Col·lisions:** 0 a `src/` (70 fitxers, una mà). Les rutes de dues mans o més (almenys 5) són documents o governança.
- **Espai aeri:** 15 de 18 torns vius eren fantasma; 47 de 60 escriptures d'Antigravity van caure en rutes de torns de Codex quiets entre 3,0 i 22,9 h.
- **Roig causat:** entre 168 i 279 minuts, reconstruïts; 152,7 de Frontmatter, per `tooling/wiki/schema.json` i el seu pany, fora de l'executor.
- **Atribució i Grau 2:** només 9 de 120 canvis (7,5 %) els declarava un torn, no sempre el de qui escriu; 27 etiquetes d'actor per a uns 4 agents. Codex, 3 de 3 per l'executor; cap lease ni transacció no registra l'aprovació.
- **Calibratge:** el Mestre va decidir les 5 retencions de Claude tal com les proposava; T3-04 duia false. Gemini va marcar false 5 ítems que va decidir el Mestre o que altres mans marcaven true.

En **mode avís**, Claude i Codex quedarien en B: Claude, sense **tancament verificat**, perquè el relleu és governança; Codex, amb 27 rutes en **torns fantasma**. Gemini quedaria en A, sense torn propi viu. MarIA no es pot puntuar: la traça d'Antigravity no té actor. El conjunt l'ha muntat el carril de Claude: una **altra mà** l'ha de tornar a puntuar.

#### Protocol de col·lisions

- **Pla de vol:** torn propi i `document.mjs own` per a cada ruta abans d'escriure-la; ja accepta `src/` (`tooling/documental/turns.mjs:307-315`). Els IDs de troballa porten el prefix de l'autor.
- **Ruta ocupada:** si la reclama una altra mà activa en els últims 60 minuts, avís a l'amo o proposta. Quieta més de 120, és fantasma, i el nivell C hi escriu amb avís.
- **Pistes compartides:** el Llibre Mestre, els índexs, `ESTAT.md` i `LEDGER.md` no es reclamen; s'editen per fragments o per l'executor.
- **Una pista de governança:** una sola lease Reflex activa (`tooling/wiki/reflex_petorreta.mjs:1018-1023`), i mentre dura ningú escriu a la wiki. Qui mou una base compartida ho anuncia.

#### El primer pas

Tres mesuradors de **només lectura** (`espai_aeri.mjs`, `intrusions.mjs` i `licencia.mjs`) es guarden a `/private/tmp/claude-501/-Users-javillinares-Documents-Antigravity-Som-de-Poble/0a4ded4c-44ad-4889-96b0-fa372efeb61b/scratchpad/r8_debat/` (carpeta **temporal**: es perd en reiniciar). Proposta: córrer-los set nits a cada tancament, en **mode avís** com `.agents/olivera-fase.json`, amb la taula a l'informe. És reversible: n'hi ha prou de parar-los. Una **casa permanent** a `tooling/` seria **governança**: la decidix el Mestre (executor i lease Reflex).

#### Els límits del número

Cap número mesura el **judici**. Si 13 llistes havien d'anar arran, o si sobra una negreta, és **gust** i **Llei del Píxel**: ho decidix el Mestre. Davant del mateix roig, Codex va deixar l'acta òrfena i Claude la va ancorar: totes dues tries són legítimes. I hi ha **Goodhart**: callar protegix la nota, i declarar a l'engròs infla el pla de vol. Per això el Mestre ratifica les pujades, i les errades de dues mans van a la plataforma, **sense culpables**. I la **telemetria d'Umami**, que segons el xat ja mesura visites reals, compta **persones**, no mans: pot dir si P1-54 fa entrar més convidats, però no qui ha tocat què.

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

**Pla i prompt de l'auditoria creuada (0535):**

- **R-11 · Ordres que existixen.** El pla 0535 mana `node tooling/wiki/compilador_wiki.mjs --check --strict`, que no existix (Codex, G5-06); l'eina és `compile-wiki-to-app.mjs`. Proposta: que el pla i el prompt comproven les ordres que citen abans de lliurar-se.
- **R-12 · Rebut propi.** Un informe nou naix amb `document.mjs create`, que li dona el seu rebut; copiar el `reflex` d'un altre document el deixa invàlid (P-07). Proposta: que la plantilla ho diga a la secció de l'acte reflex.

Les ordres npm que cita la plantilla d'auditoria existixen totes (`porta:documents`, `porta:frontmatter`, `porta:cognitiu`, `porta:llaurador`, `porta:reflex`, `porta`).

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Tasca 6, a l'arbre viu.** Les eixides són a la carpeta temporal de la sessió.

| Ordre | Hora | Resultat |
| --- | --- | --- |
| `npm run test:precommit` | 08:18 (i 06:49, 06:21, 02:55, 01:28) | **exit 0**: 175 fitxers Vitest, 3.365 proves verdes i 2 omeses; 262 proves Node verdes. **En total, 3.627 verdes i 0 fallades.** |
| `npm run porta:olivera` | 08:29 | **exit 0** |
| `npm run tancar -- --check` | 08:29 | exit 1, només pel rebut que li falta a l'informe 0730 de Gemini (P-07); les huit comprovacions internes passen, SCC inclosa |
| `node tooling/gates/tancament.mjs --check --turn-id torn_51d1660b…` | 08:29 | exit 1: falta el relleu del torn a ESTAT i LEDGER (P-03), i marca dues imatges de `01_produccio` que va posar una altra mà a les 21:46 (P-06) |
| `node tooling/wiki/tractor-frontmatter.mjs` | 08:29 | exit 1: tolerància zero de F9 en 22 fitxers modificats de la Wiki (T2-03); de les 02:32 a les 05:05, exit 2 pel pany de l'esquema (T2-07) |
| `node tooling/wiki/compile-wiki-to-app.mjs --check --strict` | 08:29 | **exit 0** (a l'inici del torn: 17 errors) |
| `node tooling/gates/verificador-scc.mjs` | 08:29 | **valid, 0 errors** (a l'inici: 236 LINK_INVALID + 4 àncores absents; a les 02:46, 1 per l'acta nova, T2-06; a les 06:11, 6 per documents d'altres mans, P-07) |
| `node tooling/gates/tractor-orfandat.mjs` | 08:29 | **exit 0** (a les 02:46, 1 enllaç trencat, T2-06; a les 06:11, 5 i un orfe, P-07) |
| `node tooling/gates/frontissa-contingut.mjs` | 08:29 | **exit 0**: 15/15; l'empremta de `descarregues` és aprovada (T1-01) |
| `node tooling/gates/tractor-tokens.mjs` | 02:54 | 197 infraccions (T1 89, T2 7, T3 95, T4 6), les mateixes per regla i fitxer que a HEAD (cap de nova) |
| Vitest de `src/sections`, `src/config`, `src/app`, `src/css` i `src/components` | 08:19 | 18.431 verdes, 7 omeses i 26 fallades, cap dels retocs: 22 d'`App.appsLocals` per l'identificador d'Umami de l'`.env.local` sense seguiment, canviat a les 07:03 per una altra mà (amb `VITE_UMAMI_WEBSITE_ID` buit només per a la prova, 34 de 35 verdes); 1 d'`App.appsLocals` que ja depenia d'eixe fitxer; `censImatges` ×2 (l'avatar, com a HEAD) i `laParroquia` (com a HEAD) |
| `src/components/universal` i `LlistaConverses.test.jsx` | 06:20 | 145 fitxers, 2.005 verdes |
| `src/sections/multimedia/censImatges.test.js` | 06:14 | 9 verdes i 2 fallades, només per l'avatar `iaia_maria_avatar_mobil` (com a HEAD) |
| ESLint `--max-warnings=0`, els díhuit fitxers JS/JSX dels retocs | 07:14 | **exit 0** |

**Els retocs del Mestre (06:15–06:21), verificats en còpies congelades:** dues voltes adversarials (06:22–06:44, 3 agents; 06:49–07:13, 2 agents), en còpies congelades amb un secret Reflex nou i sense llegir l'arxiu ni `01_produccio`. Van trobar tres camins més de Descàrregues dins de l'App (la cerca, les connexions i el selector de targetes de Notes) i el coixí perdut de les files d'Enllaços de Multimèdia; tots quatre estan tancats i provats, i les dues voltes van confirmar que els fitxers vius eren els verificats. Queden com a detalls: títols sense cap plataforma en l'assignador d'emojis, la taxonomia i el cens; el títol vell si la capçalera es lleva amb l'Índex obert; i que la prova de la llista no veu un shorthand. Fora de l'abast: el Full de ruta i l'Avís legal (T1-06).

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
- Els retocs de les 06:15 no s'han pogut mirar al navegador: el servidor :3340 estava aturat (Límits).

**Material preparat (no aplicat), assajat en còpies congelades:**

- **Pegat d'arxiu per nom de la Wiki:**
  - un arxivament real amb `porta-olivera --arxiva` no fa canviar cap porta;
  - la seqüència real de lease (obrir → pla → Petorreta → segellar → executor → consumir) funciona en els dos ordres respecte del baremador;
  - la suite Node no té cap fallada nova.
  - sisena volta (05:21–05:51): el verificador el dona per llest; dos buits menors de la guia de recuperació (T2-01).
- **Baremador:** sisena volta (05:21–05:54): llest tècnicament, sense cap fuga ni escapada; tres detalls menors oberts (`/.VOL/…`, formes d'URL d'un camí, quatre mutants). No s'activa (decisió del Mestre).
- **Tots dos junts:** assaig conjunt de la sisena volta (06:01–06:03), amb els fitxers finals: els dos ordres (Wiki i baremador, i al revés) ixen amb 0, 0 i 0, el segell `ae58ddf0` no canvia, cap residu, 155/155 proves. A l'arbre viu (06:08) els tres pegats passen `git apply --check` contra HEAD `d83188d27`.

**Cost.** Deu fluxos de subagents: 16.228.175 tokens (Registre).

<!-- SDP:SECTION auditoria.s6 -->
## Límits

**Què no he fet:**

- **Cap commit, staging, push ni `--no-verify`.** Tampoc he resegellat ni he fet caducar cap torn.
- **Cap escriptura directa a la governança** (`.agents/`, `tooling/`, `.claude/`, `.husky/`, `package.json`). El que hi toca està preparat a part.
- **No he llegit contingut de `90_arxiu_historic/`.** L'script de la Wiki només hi va llistar noms de fitxer. Tampoc he escrit a `01_produccio/`. Un verificador de la cinquena volta hi pot haver llegit fitxers .md amb un `grep` de només lectura sobre la Wiki viva, del qual només va traure un recompte; la sisena volta ja excloïa la carpeta de tota cerca.
- **No he arrancat ni aturat el servidor :3340 de MarIA**, ni he fet `vite build` ni `npm install`. A les 06:15 estava aturat, i per això els retocs no s'han mirat al navegador.
- **He tocat dos documents d'altres mans** (P-07): l'informe de Gemini i `00_index.md`, de manera mecànica i amb còpia d'abans. No he tocat el rebut de l'informe de Gemini.
- **No he corregit G5-07 de Codex**: és anterior al torn i no és entre les ordres de les 06:13.
- **No he implementat les fites noves P1-42 a P1-52, P1-54 i P1-55:** han nascut esta nit en el Llibre Mestre, després del prompt (P-05). P1-53, sí, perquè era un defecte de la Tasca 4.

**Què no he pogut verificar:**

- Aparells de veres: l'Android físic, l'iPhone, els lectors de pantalla i la revisió real d'Apple (T1-02).
- Notes amb sessió al servidor compartit.
- Els quatre retocs al navegador: el servidor :3340 estava aturat, i és compartit.
- Els adjunts de VistaMultimedia en viu, perquè F0 no n'envia.
- La seqüència real de lease amb Petorreta a l'arbre viu: només s'ha assajat en còpies congelades, amb un secret Reflex nou en cada còpia.

### Decisions del Mestre

1. **Empremta `descarregues`** (T1-01). **Resolt:** aprovada per «Javi» el 2026-10-27.
2. **La pàgina dins de l'App nativa** (T1-02). **Decidit (06:13):** amagar-la; fet.
3. **La imatge gamberro** (T1-03). **Decidit (06:13):** fora de `public/`; fet.
4. **El text i el botó de Descàrregues** (T1-04): el lead «Tria la descàrrega oficial…», el botó dins de la PWA instal·lada i la majúscula d'«App».
5. **El blindatge de la Wiki** (T2-01): aplicar `261026_2130_scc_arxiu_per_nom.patch` amb executor i lease, amb `aplica_amb_executor.sh`, seguint `LLEGIU_PRIMER.md` §4.2, i amb les altres mans aturades mentre corre. Abans, decidir sobre G5-02 (T2-01).
6. **El deute heretat del hook** (T2-03): un torn de salfumant dedicat, o `--no-verify` per a este commit.
7. **El llibre d'or i tres destins** (T2-04): la nova empremta `db32a6b1…`, o el pegat de `compile-wiki` i restaurar els claudàtors.
8. **La carpeta de NOTES al mòbil** (T3-01): confirmar que es queda en «estret».
9. **La Llei del Píxel fora de Notes** (T3-02): les icones de 24px en Perfil, ConnexioDetall i Disseny, i l'Ordenar de Disseny.
10. **«Crear nota» i Bancal** (T3-03): el lloc de «Crear nota», i l'escala plana o esglaonada d'H4–H6.
11. **L'avatar de 76px en escriptori** (T4-01): acceptar-lo, un avatar menor en columnes, o una columna més ampla.
12. **«1 seleccionada» tallat** (T4-02).
13. **La pulsació dins de la selecció i el menú de l'iOS** (T4-03).
14. **Les altres llistes del xat** (T4-05). **Decidit (06:13):** totes arran; fet.
15. **El baremador** (T5-01 a T5-04). **Decidit (06:13):** no s'activa, i es fondrà en P1-42. Quan toque: D-1, D-8 i T5-04.
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

19. **L'esquema del frontmatter** (T2-07): reconciliar el pany amb `--segella-esquema` o desfer l'etiqueta `nano`. Ho ha de fer qui la va afegir, o tu. **Resolt** per una altra mà a les 05:05.
20. **El tancament d'este torn** (P-03, P-06): el relleu de MarIA a ESTAT i LEDGER, i reconéixer les dues imatges de `01_produccio`.
21. **El Full de ruta i l'Avís legal dins de l'App** (T1-06): reescriure les frases que nomenen Google Play i Android, o una variant per a l'App nativa.

**Higiene («Cadascuna a sa casa»):**

- `CronList`: «No scheduled jobs».
- Tasques programades: cap.
- Cap flux de treball meu queda en marxa.
- Les còpies congelades de la carpeta temporal de la sessió s'esborren en acabar.
- A la carpeta temporal del sistema queden 657 carpetes de proves de 22:00 a 03:41 (`logs-`, `mapa-`, `vigilancia-`, `home-`, `frontissa-`…), que no puc atribuir amb certesa. El permís del sistema em va negar esborrar-ne les 86 d'un verificador de la cinquena volta: són teues de decidir.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[../90_arxiu_historic/261026_2130_prompt_claude_boto_descarregues_salfumant_wiki_i_converses|261026_2130_prompt_claude_boto_descarregues_salfumant_wiki_i_converses]]
- [[../90_arxiu_historic/261026_2130_pla_implementacio_boto_descarregues_salfumant_wiki_i_converses|261026_2130_pla_implementacio_boto_descarregues_salfumant_wiki_i_converses]]
- [[03_llibre_mestre_tasques_i_idees]]
