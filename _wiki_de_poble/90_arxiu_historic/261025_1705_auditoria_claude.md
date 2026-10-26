---
type: informe
status: esborrany
description: Auditoria adversarial de Claude amb 20 agents sobre el Llibre Mestre, el port, les proves, Pedra Seca, el xat, WordPress, botigues, IAIA i la porta Olivera, amb verificació creuada
tags:
  - auditoria
visibility: private
reflex: sdp:torn_08793431-2505-4da7-8248-15e373802748:760d0870-d139-4aa6-8b83-46ad14a13c54
---
# Gauntlet de l'habitabilitat del Mas electrònic: auditoria i obra de Claude

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

**Dictamen.** El Mas electrònic té bons fonaments, però hui no està a 10 en cap mòdul. Ho he mesurat amb 10 auditors i 10 verificadors adversarials: 104 troballes, cap refutada.

En este torn he aplicat a l'arbre viu 52 fitxers d'obra. Cada carril l'ha revisat un agent adversarial fresc, i després un revisor creuat ha mirat les interaccions entre carrils. A l'arbre viu, el precommit dona 3.151 Vitest i 259 Node, cap fallada; la suite sencera, en la còpia integrada, només falla en el deute que ja hi havia.

**No hi ha commit:** el decidiu vós. El que toca zones que Claude no escriu va en pegats a la carpeta satèl·lit.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_08793431-2505-4da7-8248-15e373802748:760d0870-d139-4aa6-8b83-46ad14a13c54 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T16:05:33.588Z |
| Modificació | 2026-10-25T20:25:00.000Z |
| Propietari | claude |
| Aprovació humana | pendent del Mestre (commit, migració 2610251930 i decisions de la secció 14) |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), Claude Code a l'app d'escriptori |
| Tokens consumits | Subagents: ~10,05 M en 41 agents. Auditoria: 4,56 M. Obra: 5,24 M. Revisió creuada: 0,25 M. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **16:00Z.** Instantània congelada de l'arbre viu: HEAD `b842160ac` més el `vite.config.js` de MarIA, que no té commit. No hi havia cap altra obra de codi en curs.
- **16:05Z.** Esborrany creat amb el torn `torn_08793431` (claude/code).
- **16:01Z–17:31Z.** Workflow d'auditoria `wf_404c845a`: 10 dimensions, i per a cada una un auditor i un verificador que intenta refutar-lo. Tot s'ha fet en clons; no s'ha escrit res a l'arbre viu.
- **17:36Z.** He llegit sencers Gemini 1645, Codex 1701, el pla i el prompt de les 16:45, l'Acta Marmota de les 16:00 i el Llibre Mestre (versió de les 17:15).
- **17:45Z–19:50Z.** Workflow d'obra `wf_8627bcd4`: 7 carrils de fitxers disjunts, cadascun amb implementació, revisió adversarial i correcció.
- **17:55Z.** Relleu provisional d'este informe. He corregit 4 files sobremarcades del Llibre Mestre i hi he afegit una nota a la capçalera.
- **19:49Z–20:05Z.** Integració dels 5 pegats que van a l'arbre viu en una còpia comuna. La suite sencera, el precommit, ESLint, la porta d'enxufe, el build i la cadena primària de Node hi passen.
  - Un revisor creuat hi ha trobat un defecte: `tests/backend_consolidacio.test.mjs` no injectava l'import nou de `storage.js`. Està corregit i verificat.
- **20:06Z.** Obra aplicada a l'arbre viu. Els 52 fitxers són idèntics byte a byte als de la còpia verificada.
  - Precommit viu en verd.
  - Navegador real a :3340: Notes, /connectar i /xat, sense errors de consola.
  - Fitxers declarats al torn amb `document.mjs own`.
- **20:20Z.** El Llibre Mestre porta les capes finals de P1-15, P1-20, P1-09, P0-23, P0-24, P1-24 i P2-12, i les files noves P1-25 a P1-28.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum per al Mestre

- **Notes mesurades:**

  | Port | Proves | Pedra Seca | Xat | WordPress | Botigues | IAIA | Porta Olivera |
  | --- | --- | --- | --- | --- | --- | --- | --- |
  | 8,5 (no 9,5) | 7 | 8,5 | 5,5 | 6,5 | 6 | 3 | 6 |

  Cada nota porta els criteris per a arribar al 10 (secció 1).
- **La depuració del Llibre Mestre que va fer MarIA no era correcta.**
  - P0-22, P1-16 i P1-22 no eren FET, i havien desaparegut 29 codis de deute que encara són vius. Ja ho he corregit al Llibre.
  - «P1-18 ReDoS» no existix: P1-18 és el servei d'Apple, que continua obert, i el ReDoS és P1-21.
- **El pla presentava com a nou el que ja existix:** veu, vídeo de 20 MB, «llegit», resposta citada i View Transitions. Gemini i Codex hi coincidixen.
- **Fet en codi en este torn:**
  - Reproductor de veu amb velocitat 1×/1,5×/2×, una sola nota sonant alhora i posició recordada.
  - Cronòmetre i avisos a la gravadora, i progrés real de la pujada.
  - P1-15 tancat en codi.
  - El Mas ja no ensenya errors crus, i Storage té terminis.
  - El connector de WordPress funciona des de la 5.8, però la capçalera no l'he tocada: és decisió vostra.
  - El botó Arrere d'Android ja torna a la pantalla d'abans.
  - El crash de Notes, corregit d'arrel.
  - La suite sencera passa un 36 % més de pressa.
- **La IAIA hui no raona.** És un bibliotecari honest sobre 49 documents tècnics: 0 de 8 preguntes de cultura. El bot de WhatsApp no arranca. L'explicació clara és a la secció 9.
- **El crash de Notes el va causar, molt probablement, una còpia de proves del meu torn anterior** (secció 11). Ho assumisc. He corregit la recepta i he posat un pany perquè no torne a passar.

### 1. Les notes dels mòduls, mesurades

| Mòdul | El pla diu | Mesurat | Què falta per al 10 (criteri comprovable) |
| --- | --- | --- | --- |
| Port neutral | 9,5 | **8,5** | Guarda de forma i termini al nucli del port; una barrera per proveïdor; el kit cobrix els 96 mètodes (hui en falten 40); una prova de resposta hostil, tardana, enorme i offline per lectura. P1-15 i Storage, fets en este torn. |
| Bateria de proves | 9,5 | **7** | La suite sencera en verd 3 vegades seguides (hui està roja per `censImatges` ×2); precommit que cobrisca la privacitat, la moderació de la interfície i els adjunts; cobertura mesurada; CI a la branca de treball. La velocitat, feta en este torn: 791 s → 503 s. |
| Pedra Seca | 8,5 | **8,5** | Fosa real entre vistes; placeholder ≥ 4,5:1; capçalera de taula distingible (hui ΔE 1,00); CONNECTAR sencer a 360 px; un sol primari per vista. El trinquet de la reixeta, fet en este torn. |
| Xat WhatsApp | 10 | **5,5** | Quota decidida (hui són 20 MB per a tota la vida); migració d'adjunts aplicada; reaccions, editar, esborrar per a tots, «entregat», push i documents; gravar mantenint premut. El reproductor, el cronòmetre i el progrés, fets en este torn. |
| WordPress | — | **6,5** | Un sol zip `socdepoble` 1.2.0 amb el sòl que decidiu; camí per a les instal·lacions 1.1.x. El codi ja funciona des de la 5.8. |
| Botigues | — | **6** | Build 2 des d'un commit segellat; porta de versió mínima (pegat); Apple activat o el botó retirat; prova tancada de 14 dies a Play; enllaços universals. Arrere d'Android, fet en este torn. |
| IAIA | — | **3** | Corpus de cultura i d'ús amb preguntes d'or; capa de raonament al servidor; canal oficial de WhatsApp; política de privacitat veraç. |
| Porta Olivera | — | **6** | Consum detectat pel cicle de vida, sense bloquejar els torns dels altres (pegat revisat). |
| Llibre Mestre (depuració) | — | **5** | Registre de fets, 0 SHA fora de HEAD, 0 enllaços morts i 0 codis perduts, amb una prova mecànica que ho vigile. |

### 2. Llibre Mestre: què es pot depurar i què no

He revisat fila per fila les matrius i les 31 idees, contra HEAD i amb proves.

**Es poden passar a «fet»:**
- **P1-17, P1-19 i P1-21:** 335 proves dirigides.
- **P1-14:** sí que té commit (`1c6bd64cd`).

**No eren FET; ja les he tornat a PARCIAL al Llibre:**
- **P0-22.** El segell de skills està trencat a HEAD (`6faf0aa1` contra `4a1546c3`) i el hook no pot passar. La CI només corre en main i en PR. L'acta citada és un esborrany. I la suite sencera és roja.
- **P1-16.** Les taules del catàleg ja estan contingudes, però la capçalera i les files parelles tenen ΔE 1,00 en mode clar. Les taules Markdown de la Wiki no tenen ni focus ni nom.
- **P1-22.** Continuen oberts:
  - TE-02: 24 claus que no són en cap diccionari;
  - TE-05: el natiu i WordPress no passen l'idioma;
  - TE-01: la baixa del compte, amb el text i la data fixos;
  - la validació legal i la revisió de parlants nadius d'eusquera i gallec.

**P1-20** havia perdut la llista de bretxes del xat. L'he restaurada (XC-03b, XC-05 a XC-09, XU-02/04/09/10/11) i hi he afegit les noves (XAT-01/02/04/09).

**Zero Oblit:**
- Desaparegut del Llibre amb la reescriptura: 29 codis de deute, 3 enllaços morts cap a `261025_0200_implementacio_claude` i 5 SHA que no són a la història de HEAD (`4d67f7ab`, `32eabf12`, `218433ff`, `cefc12ab` i `e39246c5`). Este últim no existix.
- **Proposta, que és decisió vostra:** una secció «Registre de fets» amb una línia per fila tancada (commit, prova i font) i les matrius només amb el que és obert. Les 31 idees es conserven amb el seu ID. Una prova mecànica vigilaria que no hi haja cap SHA fora de HEAD, cap enllaç mort ni cap codi perdut.

### 3. Port neutral (8,5 mesurat)

**L'arquitectura és sòlida:** el port es valida en instal·lar, es congela en arrencar i va per capacitats. Les portes Enxufe i Frontissa ixen en verd, i passen 256 proves.

**Fet en este torn (arbre viu, sense commit):**
- **P1-15 (PN-03).** Una resposta tardana d'una entitat ja no s'escriu a l'altra (`TriaTitular` porta un comptador de la tria vigent). Les claus de `useTitularDeConnexio` i de `useFitxaDeConnexio` porten ara el backend, la persona que mira, el tipus i l'id.
- **PN-02.**
  - `ErrorBoundary` ja no pinta el text cru de l'error fora de DEV.
  - Mur i CoreContent només accepten llistes d'objectes.
  - `mergeById` ja no fon en un sol element tots els que no tenen id.
- **PN-04.** Totes les crides de Storage tenen termini: les pujades, segons la mida; la resta, 12 s. storage-js 2.112.4 no accepta senyal a `upload`, `createSignedUrl` ni `remove`: la vista es desbloqueja, però la petició pot continuar per davall.
  - Decisió de doctrina per revisar: el temps esgotat de Storage porta el codi «inabastable», i `runtime.js` diu que un temps esgotat no ho és.

**Pendent:**
- PN-01: guardes de forma i termini al nucli del port (pegat proposat).
- Una barrera per proveïdor.
- Els 40 mètodes sense cas al kit.
- PN-06: encendre la Frontissa, que té els formats de descriptor desajustats i la captura sintètica.
- PN-09: dades sense xarxa en obrir l'app, que és una decisió de privacitat.

### 4. Bateria de proves (7 mesurat)

**El comptatge del pla era exacte:** 3.391 proves. Després d'esta obra el precommit en fa 3.410 (3.151 Vitest i 259 Node), cap fallada, en 22 s. Però el precommit només és el 14 % de les proves.

- **BP-01.** La suite sencera (22.436 proves) està roja a HEAD des de `1c6bd64cd`: `censImatges` falla ×2 per un duplicat idèntic de `iaia_maria_avatar_mobil.png` a `/assets/fotos/`, que ningú no referencia. Retirar-lo o declarar-lo és decisió vostra.
- **BP-02, fet.** L'optimitzador de Vitest per a `lucide-react` baixa la suite sencera de 791 s a **503 s**, amb 2 workers i el mateix resultat.
  - No he pujat a 4 workers: el revisor va demostrar que, amb les altres IA provant alhora, tres proves amb esperes d'1 s cauen (`PublicacioDetall.sistema`, `NotesSection.lector:294` i `lector261024:193`). Primer cal endurir-les.
- **BP-04 a BP-10, pendents:**
  - El precommit tria les proves pel nom de fitxer; hi ha un pegat d'ampliació proposat.
  - No es mesura la cobertura.
  - El bot no té cap prova.
  - Les migracions només es comproven llegint-ne el text.
  - La CI no corre a la branca de treball i no hi ha pre-push.
  - Hi ha 9 laboratoris saltats.
  - 80 fitxers tornen a passar ESLint dins de Vitest.

### 5. Pedra Seca (8,5 confirmat)

**La base és bona:**
- cap dels 228 buits verticals mesurats cau fora de la reixeta de 4 px;
- 14 rutes no desborden a 385 ni a 375 px;
- tot el text passa de 4,5:1.

**Per la Llei del Píxel no he tocat cap valor visual.** Ho deixe tot com a decisió vostra, amb mesura, i amb pegat on n'hi ha:
- **PS-01.** La fosa entre vistes fotografia la pàgina vella (li falta `flushSync`), i només dos accessos l'activen. Hi ha pegat.
- **PS-02.** El placeholder fa 3,91:1 en clar i 2,94:1 en fosc; el del compositor del xat, 3,49:1 en fosc. Hi ha pegat.
- **PS-03.** La capçalera de taula té ΔE 1,00.
- **PS-04.** CONNECTAR queda retallat a 385, 375 i 360 px als espais amb rail.
- **PS-07.** A /pobles hi ha 9 botons primaris.
- **PS-10.** El Mur ensenya la primera publicació a 698 px.
- **PS-06.** El ritme de 8 s'ha d'aplicar només entre blocs, i dins dels components s'han de mantindre 4 i 12.

**Fet:** el trinquet de la reixeta de 4 px (`src/css/reixetaEspaiat.capes.test.js`). Llista els 21 literals que ja hi ha fora de la reixeta i falla amb qualsevol de nou. No canvia cap píxel.

### 6. Xat estil WhatsApp (5,5 mesurat)

**Ja existia:**
- veu amb MediaRecorder, que grava a 26-31 kbit/s reals;
- vídeo de 10 s com a màxim, al bucket privat;
- quota de 20.000.000 bytes;
- «enviat» i «llegit», sobre `xat_participants`;
- resposta citada.

Ho he comprovat en Chrome real gravant, escoltant i enviant.

**Fet en este torn (arbre viu, sense commit, amb 25 proves noves):**
- **Reproductor de veu.**
  - Una pastilla de velocitat, 1× → 1,5× → 2×, de 48 px, amb nom accessible i decimals segons la llengua. Es recorda tota la sessió.
  - Només una nota sona alhora.
  - Recorda on s'havia quedat cada nota, separat per persona.
  - Verificat a 280–414 px sense desbordar.
- **Gravadora.**
  - Cronòmetre visible (`role="timer"`) i avisos quan queden 1 minut i 10 segons.
  - Avís quan s'atura sola, als 5 minuts o per mida. Abans s'aturava en silenci.
- **Pujada.** Progrés real amb `<progress>`, gràcies a XHR `upload.onprogress`. Manté el termini, la cancel·lació i la traducció d'errors.
  - **Risc per decidir:** XHR seguix les redireccions i no les pot vetar com feia el `fetch` amb `redirect:'error'`. Està documentat al port i al contracte.

**Pendent:**
- **XAT-01.** La quota de 20 MB és per a tota la vida.
- **XAT-02.** Els adjunts depenen de la migració `2610220240`, marcada «NO aplicada», i en mode llavor estan apagats.
- **XAT-04 i XAT-10.** Falten reaccions, editar, esborrar per a tots, reenviar, «escrivint…», presència i «entregat». El «llegit» arriba amb fins a 25 s de retard.
- **XAT-05.** Falta push.
- **XAT-09.** Falten documents, compressió i pòster.
- **Interacció:**
  - gravar mantenint premut;
  - encadenar notes, que a iOS cal provar-ho en un iPhone;
  - una pujada que sobrevisca al canvi de fil.

### 7. WordPress: la versió per a instal·lacions antigues (6,5 mesurat)

**El PHP és net:** cap sintaxi de PHP 8. «Requires PHP: 7.4» es manté.

**Fet en este torn (arbre viu, sense commit):**
- **WP-02.** El bloc té un `render_callback` compartit amb `render.php`. De la 5.8 a la 6.0 eixia buit.
- **WP-03.** Hi ha traduccions per davall de la 6.5, a través de `gettext_socdepoble`, i respecten `plugin_locale` i les altres fonts. També hi ha una reserva per a `ca_valencia`.
- **WP-07.** Una prova nova té la taula de les versions on naix cada API que usa el plugin. Falla si el sòl baixa per davall d'una API cridada sense guarda.

**La capçalera continua en 6.5:**
- El zip universal del 23/10 exigix la 6.6, perquè usa el React del nucli (WP-01).
- La 5.8 només és possible amb el React dins del paquet.
- **Eixa és la decisió d'arrel (secció 14).** Va lligada a dues coses més: la numeració 1.2.0 (el 1.1.9 el porten dos productes diferents) i el camí de les instal·lacions 1.1.x (el canal `/enxufe/stable.json` no s'ha publicat mai).

### 8. Botigues d'Apple i Google (6 mesurat)

**Ja es complixen els requisits d'octubre de 2026.** El marc «iOS 18+ / Android 15+» no és el que demanen les botigues:
- Xcode 27.1 amb `iphoneos27.1` (Apple vol Xcode 26 o més des del 28-04-2026);
- targetSdk 36 (Google el vol des del 31-08-2026);
- cap `.so`;
- manifests de privacitat a tots els SDK.

Els mínims d'iOS 16 i API 24 s'han de mantindre per als mòbils vells. Codex hi coincidix.

**El problema són els binaris:**
- **BOT-A1.** Porten el paquet web d'abans de set commits, i el build 1 ja està gastat a App Store Connect.
- **BOT-A3.** Apple està apagat al servidor, però l'app n'ensenya el botó.
- **BOT-A5.** L'APK beta és depurable i està signada amb la clau Debug.
- **BOT-A7.** Google Play exigix una prova tancada amb 12 provadors durant 14 dies.
- **BOT-A8.** Els enllaços universals són buits.

**Fet en este torn:**
- **BOT-A9, a l'arbre viu.** `MainActivity.java` registra un `OnBackPressedCallback` sense cap dependència nova: torna arrere dins del WebView o, si no pot, deixa fer el sistema. Compila sense xarxa, però **no s'ha provat en cap mòbil**.
- **BOT-A2, en pegat.** Porta de versió mínima: migració `2610251930` NO aplicada, pantalla «Cal actualitzar» amb el focus anunciat, i falla oberta. Els scripts de pujada paren si `--build` no coincidix amb `VERSIO_CLIENT_NATIU`.
- **BOT-A4, en pegat.** `dist-natiu/segell.json`. El preflight i `puja-*` paren si el paquet no és del commit HEAD, i ho contrasten dins de l'AAB i de l'App.app.

### 9. D'on trau la IAIA la intel·ligència (explicat per al Mestre)

**Hui la IAIA no raona.** A l'app fa de bibliotecari amb fitxer de targetes. Busca les paraules de la pregunta en els documents públics de la Wiki que porta l'app, en tria com a molt tres i en copia un trosset amb l'enllaç. No inventa res, no envia la pregunta a cap empresa i funciona sense cobertura.

Però la prestatgeria són **49 documents, tots sobre com està feta l'aplicació**. En una bateria de 20 preguntes:
- de cultura (Fadrins, Sant Gregori, tomaques, pericana…), n'encerta 0 de 8;
- d'ús de l'app, 0 de 8;
- del projecte, 4 de 4.

A «Què és un marge de pedra seca?» respon amb el sistema de disseny. En mode real, ningú no contesta al fil «IAIA MarIA»: és el xat públic de /iaia amb el nom canviat.

**El bot de WhatsApp (`bot/`)** sí que usava un model de llenguatge, Gemini de Google, amb la clau al servidor. Hui no arranca, per cinc causes:
- busca la identitat en fitxers que ja no existixen;
- ningú no li genera l'índex;
- si l'hi donàrem, la cerca peta;
- la imatge Docker no porta ni la Wiki ni l'eina de cerca;
- les dependències no estan instal·lades.

A més, usa Baileys, que imita WhatsApp Web i pot fer bloquejar el número.

**Les tres capes, en paraules de casa:**

1. **Memòria (el rebost):** la cultura del poble i les instruccions d'ús, escrites per persones, amb font i data.
2. **Raonament (la veu):** un model de llenguatge que agafa els trossos de la memòria i els conta en valencià, sense eixir-se'n. Ha de viure en una funció nostra de Supabase, i mai dins de l'app: així cap clau no arriba a cap mòbil. Si falla, la IAIA torna a la capa 1.
3. **Finestra (on se la troba):** l'app, la web i un número de WhatsApp propi.

| Capa | Hui | Planificat |
| --- | --- | --- |
| Memòria | Cerca local sobre 49 documents tècnics; 0 de cultura | Càpsules culturals i fitxes «Com es fa…» amb font, i preguntes d'or que les proven |
| Raonament | Res a l'app; Gemini només al bot, que no arranca | Una funció «iaia» al servidor: primer l'extracte i després la redacció, amb sostre de despesa |
| Finestra app | Respon en demo; en real, ningú | La funció escriu al fil com a IA, amb etiqueta i botó de denunciar |
| Finestra WhatsApp | Baileys, aturat des de l'estiu | Una SIM pròpia amb l'API oficial de Meta, o res |
| Privacitat | Diu Google, Anthropic i OpenAI, i no és cert | La llista exacta dels proveïdors reals |

**Costos (ordre de magnitud):**
- La memòria costa 0 € per pregunta, però costa temps de persones.
- El raonament costa entre 0,3 i 8 $ per cada 1.000 preguntes, segons el model i la llargària del context.
- WhatsApp oficial té 1.000 respostes de servei gratis al mes per número des de l'1-10-2026. Els avisos que enviem nosaltres costen uns cèntims cadascun.

**Riscos:**
- No s'ha d'usar mai el vostre número personal. El pla de les 16:45 el proposa (línia 102), i amb Baileys el perdríeu.
- Article 50 de la llei europea d'IA, en vigor des del 2-8-2026: cal dir clarament que es parla amb una IA. El bot vell no ho deia i guardava memòria dels veïns amb un «opt-in implícit».
- Google Play exigix poder denunciar el contingut generat per IA, i hui no es pot.
- A Espanya, Meta ha de permetre els assistents d'IA a l'API oficial des del 13-05-2026.

**Contrast:**
- **Gemini** descriu la capa 1 com si ja tinguera receptes i refranys i respongués en menys de 20 ms. Dona per feta la funció `iaia`, que no existix.
- **Codex** hi coincidix: hi ha dos circuits separats i la cadena del bot està trencada.

### 10. Porta Olivera: per què l'Escriptori no es neteja sol

**El diagnòstic del prompt és correcte, però curt.**
- `ranci()` (`porta-olivera.mjs:218-221`) només mira la data.
- A més, `draft-write` declara viu, sense motiu, cada document que naix dins de «## Activitat en curs». Per tant, **cap document creat pel circuit pot ser ranci mai** (OLV-01).
- Ho he reproduït amb les dades reals de les 15:41–15:53Z: l'onada 0545, consumida, era damunt la taula i la porta en verd.

**El pegat revisat (`olivera.patch`, no aplicat):**
- Reutilitza el motor de vida, com proposa Codex.
- Acredita el consum quan coincidixen tres coses: l'última acta posterior el cita en el cos sense mantindre'l viu; el document és la mateixa versió que va llegir l'acta; i cada auditoria es lliga al seu propi prompt.
- En «avis» només avisa, i no bloqueja el tancament de ningú. Afig `--arxiva --consumits --sec`.
- La prova del 261025 llista exactament els 5 documents de l'onada 0545 i res de l'onada 1645.
- Inclou el pegat de la skill i una proposta per a l'AGENTS §0.1.
- **El revisor va tombar dues coses del primer esborrany,** i les he corregides:
  - feia de la proposta mecànica una resolució de l'Acte Reflex;
  - acreditava cites de relleu.

**No hi estic d'acord amb dos punts:**
- **La CONV-09 de Gemini, que arxiva per hora:** una onada posterior no acredita el consum.
- **Bloquejar tots els torns mentre quede un consumit.**

### 11. El crash de Notes: la causa real, i la meua part

- **No hi ha cap React duplicat al disc** (V-01). Hi ha una sola còpia de React 18.3.1. El build ix idèntic amb el canvi de MarIA i sense, i el pre-empaquetat en fred també.
- **El símptoma va desaparéixer** perquè editar `vite.config.js` obliga Vite a refer la memòria cau. La de hui es va regenerar 1 s després de l'edició.
- **La causa probable (V-02):**
  - `@tiptap_react.js` importava `chunk-ZA76AL47.js`, la signatura d'una arrel situada a 9 nivells per davall de `/`.
  - A les 06:25, un harness del **meu torn anterior** (sessió `d1eaa9cc`) va arrancar un Vite real des d'una còpia amb `node_modules` enllaçat sencer a l'arbre viu.
  - Per això el `cacheDir` per defecte apuntava a la memòria cau del Mas.
  - Hi ha un buit entre les 06:25 i les 15:36 sense explicar.
- **L'àlies absolut de MarIA posava una trampa** (V-04): `react-dom/server` prenia, dins del navegador, la versió de Node.
- **Fet en este torn (arbre viu, sense commit):**
  - fora els dos àlies;
  - `dedupe` i `include` es queden, cadascun amb el seu motiu;
  - `cacheDirPropi`: cada arrel té la seua memòria cau, i una còpia enllaçada escriu fora de l'arbre viu.

  El servidor del 3340 ja usa `node_modules/.vite/848ebfbe44eb`, i Notes obri sense errors. Hi ha 5 proves a `tests/vite-empremta-dev.test.mjs`.
- **Recepta per a totes les IAs:** `node_modules` ha de ser una carpeta real amb un enllaç per paquet, i mai s'ha d'arrancar Vite en una còpia sense una memòria cau pròpia. La meua memòria ja ho diu.
- **Pols:** `node_modules/.node_modules-EfRQ4h50` és un enllaç a si mateix. L'heu d'esborrar vós.

### 12. Obra de Claude en este torn

**Mètode.** El treball s'ha fet en 7 carrils de fitxers disjunts, cada un en un clon propi, amb tres passos: implementació, revisió adversarial fresca i correcció. Tots els carrils han passat revisió. Després:
- he integrat en una còpia comuna els 5 pegats que van a l'arbre viu;
- un revisor creuat hi ha trobat un defecte, que he corregit;
- he passat la verificació completa;
- he aplicat l'obra a l'arbre viu, que no s'havia mogut des de la instantània.

**A l'arbre viu (52 fitxers, +2.172/−134, sense commit, declarats al torn `torn_08793431`):**

| Carril | Fitxers principals | Què fa |
| --- | --- | --- |
| xat | `AdjuntXat.jsx`/`.css`, `ControlsAdjunt.jsx`, `Bombolla.jsx`, `adjuntLocal.js`, `XatContext.jsx`, `src/data/xatMultimedia.js`, `src/data/supabase/xatMultimedia.js`, 5 diccionaris | Velocitat, nota exclusiva i represa; cronòmetre i avisos de la gravadora; progrés de la pujada |
| port | `GestioMembres.jsx`, `useTitularDeConnexio.js`, `useFitxaDeConnexio.js`, `ConnectarSection.jsx`, `ErrorBoundary.jsx`, `MurContext.jsx`, `CoreContentContext.jsx`, `mapejadorSeccions.js`, `storage.js`, `contracte.js` (comentari) | P1-15, cap error cru, guardes de llista, `mergeById`, terminis de Storage, «Element sense títol» a /connectar |
| infra | `vite.config.js`, `tests/vite-empremta-dev.test.mjs`, `src/css/reixetaEspaiat.capes.test.js` | Crash de Notes d'arrel, memòria cau pròpia, optimitzador de Vitest i trinquet de la reixeta |
| wp | `includes/marcatge.php`, `includes/idioma.php`, `includes/bloc/render.php`, proves i fixture PHP | El bloc i les traduccions funcionen des de la 5.8; prova del sòl d'APIs |
| natiu | `MainActivity.java` | El botó Arrere d'Android |
| revisió creuada | `tests/backend_consolidacio.test.mjs` | Injecta l'import nou de `storage.js` a la prova aïllada |

**En pegat** (`Som de Poble/_investigacio_ia_de_poble/261025_1705_pegats_claude/`, amb `LLEGIU_PRIMER.md`). A les 20:50 s'aplicaven nets sobre l'arbre amb l'obra viva:

- **Revisats:**
  - `olivera.patch`, `core-higiene-escriptori.patch` i `agents-0.1.patch`;
  - `preflight-segell.patch`;
  - `versio.patch`, amb la migració `2610251930` NO aplicada.
- **Esborranys verificats, no revisats com a codi:**
  - `proposta_view-transitions.diff`;
  - `proposta_placeholder-sdp.diff`;
  - `proposta_formes-del-port_PN-01.diff`;
  - `proposta_precommit-ampliacio.patch`.

**Riscos que heu de conéixer:**
- **XHR i redireccions:** la pujada amb progrés no pot vetar una redirecció.
- **Temps esgotat de Storage:** porta el codi «inabastable», i és una qüestió de doctrina per revisar.
- **Arrere d'Android:** no s'ha provat en cap mòbil.
- **El canvi de `vite.config.js`:**
  - ha reiniciat el servidor del 3340 i ha mogut la memòria cau. `node_modules/.vite/deps` i `node_modules/.vite/vitest` queden orfes, fora de git, i es poden esborrar.
  - Conté també les línies de MarIA que no tenen commit (`dedupe` i `include`): han d'entrar en el mateix commit.
- **La capçalera del WordPress continua en 6.5:** fins que no decidiu el sòl, WordPress no deixarà activar el plugin de la 5.8 a la 6.4.

### 13. Contrast amb Gemini i Codex

**Coincidim tots tres en:**
- la veu i les View Transitions ja existents;
- el vídeo de 10 s;
- els documents i les reaccions pendents;
- P1-18 obert;
- P1-15;
- el marc de les botigues: SDK 26+ i API 36.

| Punt | Gemini | Codex | Claude (amb evidència) |
| --- | --- | --- | --- |
| Crash de Notes | «elimina d'arrel» amb `dedupe` | En cita la correcció | No hi havia React duplicat. La causa és la memòria cau escrita per una còpia (secció 11). Gemini verifica una llista `include` que no és la del fitxer. |
| Llibre Mestre | Compactat i «certificat» | Conservar deutes i un registre curt | 3 FET sobremarcats i 29 codis perduts. Corregit al Llibre. |
| IAIA capa 1 | Cultura i receptes, < 20 ms | Dos circuits; bot trencat | 0 de 8 en cultura; corpus tècnic |
| Olivera | CONV-09 per hora | Consum acreditat, no per data | Coincidim amb Codex; pegat revisat i lliurat |
| Pedra Seca | View Transitions fetes | Fetes | Existixen, però fotografien la pàgina vella (PS-01) |
| Proves | 9,6 | Precommit verd | 7: la suite sencera és roja a HEAD |
| WordPress | Capçalera 5.8 «amb total seguretat» | Cal `render_callback` i una prova real | `render_callback` i traduccions fets. El sòl depén de la variant de React (decisió vostra). |

### 14. Decisions que són vostres

1. **Commit.** 52 fitxers a l'arbre viu, amb les línies de MarIA a `vite.config.js`. El hook no pot passar per deute heretat (segell de skills). Teniu dues opcions:
   - commit amb índex temporal i `--no-verify`, si així ho decidiu;
   - resegellar primer.
2. **Llibre Mestre.**
   - Crear la secció «Registre de fets»?
   - Recuperar `261025_0200_implementacio_claude` a l'arxiu, o reapuntar-ne els 3 enllaços?
3. **WordPress.** Hi ha dos camins:
   - React dins del paquet: sòl a la **5.8**, el 93,8 % dels llocs, amb el risc que WordPress.org demane el React del nucli;
   - React del nucli: sòl a la **6.6**, el 87,0 % dels llocs.

   A més: numerar la identitat `socdepoble` com a 1.2.0? I quantes instal·lacions 1.1.x reals hi ha?
4. **Xat.**
   - Quota: per fitxer, per mes o per a tota la vida? I cada persona podrà esborrar els seus adjunts?
   - Durada màxima del vídeo.
   - Quins documents es poden enviar.
   - Proveïdor de push i què pot dir l'avís.
   - «Escrivint…» i «última connexió».
   - S'ha aplicat ja la migració `2610220240`?
   - XHR o la redirecció vetada (sense percentatge).
5. **Botigues.**
   - Apple: activar-lo sencer abans del build 2, o retirar-ne el botó?
   - Retirar l'APK beta i decidir qui són els 12 provadors.
   - Aplicar `versio.patch` i `preflight-segell.patch` abans del build 2. Les migracions `2610241400…`, només després.
   - Les imatges «Ibáñez».
6. **IAIA.**
   - Què ha de fer primer: cultura, ajuda d'ús o totes dues.
   - Qui escriu les càpsules.
   - Una funció `supabase/functions/iaia`, amb quin proveïdor i amb quin sostre de despesa.
   - WhatsApp oficial amb una SIM pròpia, o esperar.
   - Què fem amb `bot/`.
   - Corregir ja els apartats 11 i 14 de la política de privacitat.
   - Esborrar les dades de veïns que queden a `bot/var`.
7. **Port.**
   - PN-01: la guarda de forma, i un termini general de 45 s.
   - El codi del temps esgotat de Storage.
   - Quan s'encén la Frontissa.
8. **Pedra Seca (Llei del Píxel).** Cada punt té pegat i mesura:
   - placeholder;
   - capçalera de taula;
   - fosa real entre vistes;
   - CONNECTAR a 360 px;
   - un sol primari a /pobles;
   - el Mur en mòbil;
   - el ritme de 8 només entre blocs.
9. **Proves.**
   - Autoritzar `@vitest/coverage-v8` i PGlite.
   - CI a totes les branques i pre-push.
   - Arxivar els laboratoris saltats.
   - Retirar el duplicat de `censImatges`.
   - Endurir les tres proves fràgils i pujar a 4 workers.
10. **Olivera.**
    - Aplicar el pegat en «avis»?
    - Podar l'índex, que té 1.056 línies?
11. **Seguretat, fora d'abast.** `ps` mostra en clar, en els arguments d'alguns servidors MCP, una contrasenya de base de dades i claus d'API. No les hem copiades enlloc. Convé passar-les a variables d'entorn o a fitxers protegits, i canviar-les.

### 15. Retroalimentació a la plantilla `prompt_local`

- Afegir a cada petició l'estat «existent / parcial / proposat / desplegat». Este prompt demanava dissenyar coses que ja existien.
- Usar l'ID canònic de deute, verificat contra el Llibre: P1-18 no és el ReDoS.
- Incloure per a totes les IAs la recepta de còpies: `node_modules` ha de ser una carpeta real, mai un enllaç sencer.
- Les hores dels documents: `16:45:00.000Z` no són les 16:45 a València. Hui València és UTC+1.
- Quan el Mestre corregix un hàbit, com el nom «el Mas electrònic» (àudio d'hui), el prompt l'ha de citar com a norma perquè arribe a totes les IAs.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| Instantània contra l'arbre viu | 0 diferències en src, tests, supabase, tooling, scripts, bot, android i wordpress-plugin, abans d'aplicar res (20:06Z) |
| Pegat combinat a l'arbre viu | `git apply --check` OK. Aplicat. 52 de 52 fitxers idèntics byte a byte a la còpia verificada |
| Precommit (arbre viu) | 165 fitxers, 3.151 Vitest i 259 Node, cap fallada, 22,2 s |
| Suite sencera (còpia integrada) | 22.436 proves: 22.325 passen, 109 saltades i 2 fallen (`censImatges` ×2, la mateixa fallada que a HEAD). 503 s amb 2 workers, contra 791 s abans |
| Cadena primària de Node (còpia integrada) | 601 proves: 600 passen. La que falla, `enxufe-empaqueta`, necessita `wordpress-plugin/builds/`, que la còpia no porta. Els 4 hooks passen 18/18 amb `.claude` i `.codex` |
| ESLint (`src tooling scripts tests --max-warnings=0`) | 0 |
| Porta d'enxufe | Verda: «El port és abastable, el contracte quadra» |
| Build de producció | Correcte; 1 sol `rendererPackageName:"react-dom"`; amb el pegat d'infra, la llista de fitxers i els SHA de 312 JS són idèntics als de la base |
| Revisió adversarial de l'obra | 7 carrils revisats i corregits. 1 revisor creuat: 1 defecte (corregit) i cap altre |
| Auditoria adversarial | 104 troballes: 76 confirmades i 28 parcials (amb la correcció aplicada), cap refutada, i 49 omissions afegides pels verificadors |
| Navegador real (:3340) | Notes amb l'editor, /connectar amb «Element sense títol» i /xat: cap error de consola. La memòria cau nova és en ús. El reproductor de veu, verificat a l'arnés de Chrome del carril, a 280–414 px |
| Porta Olivera | 0 |
| `tancament.mjs --check` (torn `torn_08793431`) | Invàlid: 1.394 incidències. Heretades: segell (`6faf0aa1` contra `4a1546c3`), Wiki i SCC. Pròpies del torn reutilitzat: el pla vinculat de les 00:45, ja arxivat; documents de Claude arxivats sense relleu per una altra mà; el relleu del LEDGER, que Claude no pot escriure. No es tanca el torn. |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **No he fet:** cap commit ni cap push; cap migració aplicada; cap desplegament; cap binari compilat ni signat; no he arrancat el bot ni he enviat cap missatge.
- **Zones que Claude no toca:** no ha mogut cap fitxer de l'Escriptori. No ha escrit `tooling/`, `scripts/`, `.agents/` (ni ESTAT ni LEDGER), `package.json` ni el lock; el que hi toca va en pegat. Per la mateixa raó, MarIA ha d'anotar el relleu a l'ESTAT i al LEDGER.
- **Proves que no he fet:** en un iPhone o un Android reals, amb PostgreSQL concurrent, amb un WordPress 5.8 real (l'arnés PHP és simulat) ni amb PHP 7.4.
- **Mode llavor:** els adjunts del xat estan apagats, i per això el reproductor no es pot provar al servidor del Mas.
- **Correcció d'hàbit:** el Mestre ha fixat el nom «el Mas electrònic» (àudio d'hui). Claude el respecta en tots els textos, però no pot anotar la lliçó a `.agents/skills`: l'ha d'anotar MarIA.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261025_1645_pla_implementacio_habitabilitat_mas_xat_total_i_excelencia_10]]
- [[261025_1645_prompt_claude_gemini_codex_habitabilitat_mas_xat_total_i_excelencia_10]]
- [[261025_1645_auditoria_gemini]]
- [[261025_1701_auditoria_codex]]
- [[261025_1600_acta_marmota_triomf_gauntlet_loop_xat_fluid_i_blindatge_wp]]
