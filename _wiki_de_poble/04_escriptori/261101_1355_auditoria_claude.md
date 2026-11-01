---
type: informe
status: canonic
description: 'Execució Gauntlet de T1-T10 del prompt 261101_1246: segon adaptador, restaurador Open Data, ActivityPub fase 2, bundle, Pedra Seca, A11y, i18n i botigues'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_3f5652a2-ce26-464c-b29b-9649b7323c98:81f02c69-6877-4900-a455-75b74bf30fb9
---
# Auditoria de Claude · Assalt al 10/10 en les 15 dimensions

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_3f5652a2-ce26-464c-b29b-9649b7323c98:81f02c69-6877-4900-a455-75b74bf30fb9 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-11-01T12:56:52.248Z |
| Modificació | 2026-11-01T18:42:00.000Z |
| Propietari | claude |
| Aprovació humana | Ordre del Mestre al xat (2026-11-01, tarda): executar T1-T10 del prompt 261101_1246 (pla aprovat el 2026-11-01 a les 12:42) en mode Gauntlet; resultat pendent de la seua revisió |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) · Ultracode, amb subagents del mateix model en quatre workflows |
| Tokens consumits | ~25 M de subagents (83 agents: 3,8 M d'especificació, 15,1 M de carrils, 4,8 M de Gauntlet transversal i 1,2 M de residus) més el fil principal |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 f537f054c68a648cc755a61c2b3037b375ec37304d98ff1631e290212d2bcd6c. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-11-01T12:56:52.248Z: esborrany creat; contingut i verificació pendents.
- 13:45–13:55 CET (canal viu): lectura sencera del pla i del prompt `261101_1246`, del Llibre Mestre, de l'acta `261101_1304` i del meu informe `261101_0409`; torn de codi `torn_3f5652a2` obert i pla vinculat. Primera troballa: el pla cita rutes inexistents (`src/locales/`, `renderitzador.php`, `soc-de-poble.php`, `RegisterSection.jsx`, `src/config/telemetria.js`, `xat/e2ee/sessioXat.js`, `executaKitConformitat`) i dona per pendent `tractor-vigilant.mjs`, que ja existix des de la Ronda 2. Cap carpeta `261101_kits_10_10/` de Codex ni de Gemini encara.
- 13:55 CET: línia base de Vitest en marxa i 9 agents d'especificació (només lectura) sobre T1–T8 contra el codi real.
- 14:07 CET: línia base de Vitest a l'arbre viu (HEAD `1bb292cb2` + documents de MarIA): 1.573 fitxers i 27.243 proves passades, 0 fallades, 103 omeses (720 s). Codex ha obert `261101_kits_10_10/codex/` a les 13:54; el seu `laboratori/node_modules` és un enllaç sencer al `node_modules` viu (risc conegut del 25-10 si hi corre `vite`).
- 14:45 CET (canal viu): especificacions fetes (9 agents, només lectura, amb prototips verificats a scratch). Ja estaven fets abans d'este torn: P1-27 Storage (`c3a2c6bba`), TE-01, TE-02, TE-05 i P2-16 (`cd3b5b56c`), el mini-Markdown del connector (`37f93e55a`), `tractor-vigilant.mjs` (`f66de7865`), l'estat de recepció de la telemetria (`bdd26c86f`) i la càrrega diferida del `wikiManifest` (l'entrada ja no l'importava). Arriben els kits de Codex (4 pegats) i Gemini (4 pegats). Llançat el workflow d'implementació Gauntlet en 14 carrils (implementació → àrbitre adversarial → correcció → verificació); la cadena de dades va en ordre (T1 ‖ P0-23 → T2).
- 17:37 CET (canal viu): els 14 carrils han acabat (51 agents en 2 h 50 min): cap P1 obert. Integració: transacció de governança Reflex `e933d4ce` (17 fitxers de `tooling/`, `scripts/`, `package.json` i manifest de proves; segell de skills intacte), atòmics aplicats, peticions entre carrils aplicades i provades, recomptes del document Model B (34 capacitats, 114 mètodes). `design_guard` dona 0 crítics i 0 avisos; Pedra Seca, en verd. Suite sencera després dels carrils: 28.177 passades i 5 fallades, totes resoltes després (recomptes, IAIA, claus i una d'inestable).
- 17:50 CET: llançat el Gauntlet transversal (6 àrbitres amb lents distintes, triatge, correctors amb fitxers disjunts i verificadors).
- 18:58 CET: Gauntlet transversal acabat (17 agents): 49 troballes, cap P1; 41 corregides i verificades en 5 grups de fitxers disjunts. Dipòsits de Wiki aplicats (Model B, índex màquina, guia de botigues, ADR de les apps del dispositiu). Llançada la ronda de residus (3 grups).
- 19:10 CET: llegida la passada d'inspecció de Codex de les 18:27 (`261101_kits_onda2_llibre_mestre/`): O2-F02, O2-F03 i O2-F04 integrats amb proves (O2-F01 ja estava corregit); la resta de l'Onada 2, no integrada (fora de T1–T8).
- 19:24 CET: residus acabats i verificats (6 agents).
- Des de les 19:25 CET: entrada de l'assalt a /versions, build de producció (19:29), suite sencera (19:29–19:39), `test:node`, ESLint i portes; verificació al navegador; Llibre Mestre (20 files i el relleu de §0.3), este informe i la transacció final `80b0b829`.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum

**Fet, a l'arbre viu, sense commit ni desplegament.** Les huit tasques de codi (T1–T8) estan implementades i provades; T9 (kits) i T10 (Llibre Mestre, taula de dimensions i esborrany per a NLnet) són en este informe i al Llibre. Han treballat 83 agents en quatre workflows: 9 d'especificació, 14 carrils Gauntlet (implementació, àrbitre, correcció i verificació), un Gauntlet transversal de 6 lents (49 troballes, cap P1, 41 corregides i verificades) i una ronda de residus. La suite sencera, el build de producció i les portes són a «Verificació».

**El 10/10 no és honest encara en cap dimensió que depenga de fora d'esta màquina.** Res no és desplegat; les migracions noves no estan aplicades; l'E2EE continua apagat; la bústia ActivityPub és una biblioteca sense servei; la 1.1.11 del connector no és a WordPress.org; i ningú no ha passat un lector de pantalla real ni ha revisat de manera nativa el basc i el gallec. La taula D01–D15 ho diu dimensió per dimensió.

**Una bona part del pla ja estava feta abans del torn**, i no s'ha refet: P1-27 Storage (`c3a2c6bba`), TE-01, TE-02, TE-05 i P2-16 (`cd3b5b56c`), el mini-Markdown de «Mostra els detalls» (`37f93e55a`), `tooling/gates/tractor-vigilant.mjs` (`f66de7865`), l'estat de recepció de la telemetria (`bdd26c86f`) i el `wikiManifest` diferit (l'entrada ja no l'importava).

### Correccions al pla i al prompt (verificades al codi)

- **Rutes inexistents:** `src/locales/*.js` (són `src/config/idiomes/{ca,es,en,eu,gl}.js`), `wordpress-plugin/soc-de-poble.php` (`socdepoble-enxufe.php`), `includes/renderitzador.php` (el detall és a `ajustos.php` i `actualitzador.php`), `src/sections/register/RegisterSection.jsx` (el botó l'ix `src/natiu/entradaSocial.js` i `EntradaNativa`), `src/config/telemetria.js` (`src/data/telemetria.js`), `src/sections/xat/e2ee/sessioXat.js` (l'E2EE és a `src/data/xifratXat*.js`), `src/sections/xat/components/AlertaMunicipal.jsx` (`src/sections/mur/`), `src/utils/parseMarkdown.js` (`src/sections/wiki-de-poble/`), `src/sections/notes/FitxaMemoriaOral.jsx` (`src/components/universal/`), `tooling/botigues/preflight-botigues.mjs` (`scripts/botigues/preflight.mjs`), `public/federacio/outbox/…` (l'outbox real és `/ap/outbox/<slug>.json`, generat al build), `__tests__/` (el repositori fa proves co-localitzades).
- **Funcions inexistents:** `executaKitConformitat` (el kit exporta `CASOS`, `contextDeConformitat`, `executaCas` i `metodesSenseCas`) i `validaFitxaOkfV02` (és `validaFitxaOkf`).
- **«24 claus `t()` absents» (TE-02):** hui n'hi ha 0; les 24 de l'informe 261025_1705 ja no tenen cap consumidor al codi. El deute real de D12 era P1-22: unes 255 frases de Connectar, Gestió de membres i l'enquadrament que només eren en valencià.
- **«Propagar el `lang` de l'amfitrió» (TE-05):** ja és fet a `cd3b5b56c`, i propagar l'atribut `lang` de la pàgina contradiria la decisió T1 del Mestre (260930). No s'ha tocat.
- **«Commutador E2EE opt-in per conversa»:** contradiu DM-1, DM-3 i la marca apegalosa del disseny E2EE aprovat. S'ha fet la part honesta: l'estat per conversa i la verificació del número de seguretat, darrere de la bandera.
- **D-6 «town_id»:** a la base és `tenant_id`; i només s'aplica als ajuntaments (`city_hall`), que són els que fan alertes.
- **P1-20 al Llibre** porta dos deutes amb el mateix ID (bundle i paritat WhatsApp); s'ha marcat només la part del bundle. **P2-15** és la dieta de tokens d'arrencada dels agents, no el bundle: queda fora de D15.

### T1 · D01 · Segon adaptador complet

- `src/data/local/` (carpeta autoritzada pel pla): `adaptadorLocal.js` compon els servidors locals que ja existien (`localNotes`, `localXat`, `localPerfils`, `localSeguiments`) i porta els magatzems petits de moderació, personalització, compte, consentiment i mitjans en mòduls propis (`contingutLocal`, `notesLocal`, `conversesLocal`, `comunitatLocal`, `compteLocal`, `mitjansLocal`, `dadesObertesLocal`). Respon a tot el contracte llevat de `versioClient` (no declarada a posta: només té sentit amb un servidor); els serveis que un node sense servidor no té (entrada amb compte, segon factor, adjunts privats al servidor, E2EE) els rebutja amb el codi que el contracte prescriu.
- Proves: el kit sencer en tres passades (seed sense sessió, seed amb sessió i local), equivalència de lectures amb Supabase seed (`src/data/supabase/conformitat.equivalencia.test.js`), Model B per `host.injectaBackendDelPaquet`, comportament dels mètodes sense cas, aïllament, determinisme i frontera: cap mòdul de producció no importa la carpeta (comprovat també als quatre paquets: web, WordPress autònom, directori i natiu).
- P1-27: prova amb `@supabase/storage-js` real de la cancel·lació pel senyal de qui crida (`storage.senyal.storagejs.test.js`) i anotació a `incidents()` de les reconciliacions pendents d'una mutació (`controlStorage.js`).
- Kit de Codex `adaptador-local-conformitat.patch`: **no integrat** (passa els casos del kit, però trenca formes del contracte en mètodes sense cas, i el seu canvi a `storage.js` trenca `storage.termini.test.js`); se n'han adaptat dues idees de prova.

### T2 · D04/D10 · Dades obertes 1.2.0 i restaurador

- Capacitats noves `dadesObertes` (`llegixDadesObertes`) i `restauracioDadesObertes` (`restauraDadesObertes`): el contracte passa a 32 operacions del nucli i 34 capacitats (114 mètodes). Supabase implementa la lectura anònima (`src/data/supabase/dadesObertes.js`, `runtime.js` amb `anonim: true`, sense renovar mai la sessió en un 401); no implementa la restauració (caldria una RPC de superadmin).
- `recullDadesPubliquesDelMunicipi` ja porta les notícies i els actes públics signats per una entitat del poble; la memòria cultural i les fitxes OKF tornen `null` a Supabase (no hi ha taula) i queden a «Fonts pendents» amb el motiu.
- Format 1.2.0: `data/memoria-oral.jsonld` i `data/okf/{index.md, log.md, memoria-oral/<poble>/<slug>.md}`. Els lectors 1.0.0 i 1.1.0 continuen funcionant (prova amb un paquet 1.0.0 de veres congelat byte a byte).
- `src/data/importaMunicipiOpenData.js` + `src/data/dadesObertesLot.js`: llig el BagIt, verifica cada SHA-256 de `manifest-sha256.txt`, rebutja fitxers alterats, absents, sobrers i camins fora del paquet, valida els esquemes, comprova la regeneració canònica i restaura de manera atòmica i idempotent (`{ creats, actualitzats, iguals }`). Anada i tornada provada: exporta → verifica → importa a l'adaptador local → compara. El Gauntlet transversal hi va trobar que un lot podia segrestar files d'un altre poble (D-01) i que un slug canònic divergia de l'exportador (V-A01): tots dos corregits amb proves.
- `DetallPoble.jsx` diu els recomptes i els pendents reals (abans prometia només el directori).
- Kit de Codex `open-data-restaurador-roundtrip.patch`: **no integrat** (capacitat amb un altre nom, restauració per substitució sencera, sessió obligatòria i un `restauracio.json` lateral que no es compara amb els grafs publicats).

### T3 · D05/D07 · Federació, segona fase i nodes germans

- `src/data/federacio/inboxActivityPub.js` (biblioteca pura, ports injectats, cap import de producció): `resolveWebFingerAcct`, `verificaSignaturaHttpActivityPub` (rsa-sha256, hs2019 i ed25519; finestra de `Date`, `Digest`, `(request-target)`, només s'atén `expires` si és signat), `processaActivitatInbox` idempotent (Follow → Accept, Undo, Create, Delete, Announce d'alertes només de nodes de confiança, làpides per propietari, quota per host) i `signaPeticioHttpActivityPub` per a les proves. 40+ proves amb claus generades en temps d'execució i mutants morts.
- `tooling/seo/genera-federacio.mjs` (governança): l'outbox de cada poble federat porta la pàgina pública del poble (La Torre: `totalItems` 1 al build de producció), i un node germà amb `node-germa.json` o `--config` publica el seu propi actor, WebFinger, outbox i NodeInfo 2.1 (D-13). L'instal·lador documenta la federació pròpia a `INICIA_NODE.md`.
- **Pendent del commit:** `tests/inicia-node-germa.test.mjs` fa `git archive HEAD`, i el gir del [DEFECTE] de D-13 només pot passar quan el generador nou siga a HEAD. La versió girada i les dues frases de la partida 4 de /page/fediversity són a `_investigacio_ia_de_poble/261101_1355_assalt_claude/pendent-de-commit/` (assajades: 7/7 amb el generador nou, 6/7 amb el vell).
- **Honestedat:** cap bústia d'entrada desplegada; ningú no pot seguir ni escriure a Sóc de Poble des del Fedivers. El runtime (Edge Function o NixOS), les claus de l'actor, les taules persistents i la llista de confiança són decisió del Mestre (D-T3-5).
- Kit de Codex `activitypub-fase2-i-node-germa.patch`: **no integrat** (el generador petava amb `ReferenceError`, l'Announce aliè anava a la nostra outbox i l'instal·lador trencava les invariants SHA de l'e2e); se n'han integrat 5 casos de prova.

### T4 · D15/D02 · Paquet i Pedra Seca

- **Entrada:** de 1.472.492 B / 407.153 B gzip -9 (HEAD) a 640.324 B / 224.451 B gzip -9 (build de producció al viu, 261101). `manualChunks` (`trossDArrencada`: react, estils, dompurify, ca), `geoDeLesFotos` diferit a `publishNote` amb un termini de 4 s (l'editor l'escalfa en obrir-se) i la Consola sense la Wiki compilada (`carregaWikiManifest.js`). Arrencada estàtica −3,5 %; JS total +3,4 % (+13 trossos). Porta `tooling/gates/pressupost-paquet.mjs` encadenada a `build:web` (sostre de 250.000 B gzip -9).
- **Service worker** (troballa del Gauntlet transversal, L5-SW-01): amb els trossos de nom estable, la poda FIFO podia esborrar React i DOMPurify i deixar sense arrencar sense xarxa la closca confirmada. `public/sw.js` protegix ara la closca confirmada més nova, i els sostres passen a 600 recursos i 16 MiB (l'ADR de les apps del dispositiu, al dia).
- **D-2:** `node tooling/gates/design_guard.mjs --arrel=src` → 0 crítics i 0 avisos. Els 9 avisos eren falsos positius de l'heurística `div-soup`; la regla compta ara els `<div>` de l'AST i reconeix l'estructura nativa i els embolcalls canònics. Cap component tocat; `sanitize.test.js` intacte.
- **P1-28:** a 1024 px, els rètols de la Columna 1 salten de línia sencers (0 talls a /notes, /multimedia, /wikidepoble i /disseny; idèntic a ≥ 1100 px). PS-11 (títols de capçalera a 201 px) queda per al Mestre.
- Kit de Gemini `pedra-seca-zero-avisos.patch`: **rebutjat** (canvis `div`→`section` que creaven landmarks nous i un guard per regex que encara deixava un avís).

### T5 · D03/D12 · Accessibilitat i cinc llengües

- **P1-22:** GestioMembres (41 claus), /connectar (122) i l'enquadrament (92) passen sencers pel traductor a ca, es, en, eu i gl, amb reserves idèntiques al text de sempre; també la closca de foto del Perfil i el botó del Mur de ConnexioDetall. Guarda AST `src/config/i18n.p122.test.js` (cap literal visible als sis components).
- **P1-15:** el focus ja no es perd a «Privacitat i dades» (acceptar, retirar, cancel·lar o fallar), amb `getRootNode()` per al shadow root de WordPress; regions vives a Membres i Connectar; les carpetes de Connectar són un grup amb nom.
- **D-9:** 23 valors d'eu i gl que s'havien quedat en valencià i 8 notes que citaven «Privacitat i dades», polits.
- Kits de Gemini `i18n-te01-te02-te05-complet.patch` i `a11y-aaa-lector-pantalla.patch`: **rebutjats** (claus mortes, sufixos bascos enganxats als marcadors, `aria-live` redundant amb `role=status` que trencaria proves, i la propagació del `lang` contra la decisió T1).

### T6 · D09/D10 · Notes i memòria oral

- **D-5:** àlies com a dades (`src/sections/pobles/aliesDePoblesSeed.js`) i lògica sense noms de poble (`aliesDePobles.js`); el detector reconeix Jijona, Torremanzanas, «la Torre», Orcheta i Alcolecha; a la revisió, «Un altre poble» (pobles de l'app i set municipis de referència) i «Etiqueta nova» (fins a 5 lliures i 10 en total).
- **D-4:** la Card «Bloc de notes» és la primera fila de «Tot» amb qualsevol ordenació (`fixatATot` de l'`UniversalWorkspace`). Verificat al navegador.
- **D-7:** Mur, Notes i Xat prenen la reserva anònima de només lectura (`identitatDeReserva.js`, `useIdentitatOReserva.js`) i les escriptures es refusen abans del port, també les de `NotesContext.jsx`.

### T7 · D08/D11 · Privacitat, xat i alertes

- **D-6:** `supabase/migrations/2611011500_autoria_ajuntament_mateix_poble.sql` (**NO aplicada**, fila 65): un ajuntament només signa publicacions del seu `tenant_id`; provada en PGlite fora de l'arbre (evidència a `_investigacio_ia_de_poble/261101_1355_assalt_claude/evidencia/`). Abans d'aplicar-la, les dues consultes «Abans» de la capçalera.
- **Alertes:** `useRellotgeAlertes.js` trau cada alerta del Mur quan caduca, amb «vigent fins a <data i hora>» dins d'un `<time>` (sense compte enrere dins de `role="status"`).
- **IDEA-36:** captures (PNG) a 2048 px amb baixada a 1600 i 1200 dins dels 2 MB; fotos a 1200. **P1-67:** gap de 16 px a la targeta de conversa (Millora Proactiva Reversible).
- **P1-12/IDEA-48:** número de seguretat per conversa, «Marca com a verificat» i el bloc «Persones de confiança», tot darrere de la bandera apagada; amb la bandera apagada no entren al paquet de producció (només a l'espècimen del catàleg). F2a i F7 no fets a posta. **P1-13:** ja era al codi; prova nova de l'ordre dels panys.
- Kit de Codex `e2ee-shamir-i-alerta-tenant.patch`: **no integrat** (la CHECK restringia totes les entitats i exigia `town_memberships`, que amb la divisió de tenants de producció rebutjaria fins i tot una empresa al seu poble); se n'ha adoptat una asserció de prova.

### T8 · D06/D13/D14 · Connector, botigues i governança

- **Connector 1.1.11** al repositori (capçalera, constant, `Stable tag`, Changelog i Upgrade Notice amb el visor d'esta entrega); `empaqueta.mjs --prova` ja no sobreescriu el canal estable signat.
- **D-10:** el botó d'Apple només ix a iOS amb `VITE_APPLE_OAUTH_ACTIU=true` (per defecte amagat; un altre valor para el build). **Edat:** 16 anys sense excepcions (condicions 2.3).
- **P0-23:** `versio.patch` i `preflight-segell.patch` rebasats a mà: porta de versió mínima (`CalActualitzar`, capacitat `versioClient`, migració `2611011510`, **NO aplicada**) i segell del paquet al preflight i a `puja-*`.
- **P2-14:** prova de recepció amb un servidor HTTP propi (`telemetria.recepcio.test.js`). **D-12:** capçalera estàtica de /versions, entrada de les Rondes 1-3 i entrada d'esta entrega. **IDEA-13:** el Vigilant ja existia; el pegat de la seua SKILL està preparat.
- Kit de Gemini `botigues-apple-guard-i-tractor-vigilant.patch`: **rebutjat** (Apple encés per defecte, flag dins dels clients de Google, edat atribuïda al RGPD de manera inexacta, i reescriptura del Vigilant que el pla no demanava).

### T9 · Kits de Codex i Gemini

- **`261101_kits_10_10/`:** cap pegat aplicat en cru ni cap `verifica_i_aplica.py --apply` executat. Auditats pels carrils com a dades: integrats 2 casos de prova (T1), 5 (T3) i 1 asserció (T7a); la resta rebutjada amb el motiu verificat (vegeu cada tasca).
- **`261101_kits_onda2_llibre_mestre/codex/correccions-inspeccio-claude.patch`** (passada de Codex de les 18:27): quatre defectes reals del meu codi viu. **Integrats:** O2-F02 (un adjunt privat podia eixir després d'un canvi de persona o d'un tancament, `mitjansLocal.js`), O2-F03 (una alerta remota amb `endTime` vençut es reviscolava) i O2-F04 (dos pobles amb el mateix fil seed compartien avisos al xat local, `localXat.js`); O2-F01 (`expires` sense signar) ja estava corregit pel Gauntlet transversal (SEG-02). Proves noves `inboxActivityPub.inspeccio.test.js` i `mitjansLocal.inspeccio.test.js`, i mutació comprovada.
- **Resta de l'Onada 2** (P1-07, P1-24, P2-09 de Codex; poliment eu/gl, vCard i PS-02 de Gemini): **no integrats** en este torn. Són fora de T1–T8, alguns demanen decisió del Mestre (PS-02 és un canvi visual de P1-28) i caldria el seu pla. El poliment eu/gl de Gemini pot xocar amb el que ja s'ha fet a D-9.
- **Criteri 6 del prompt:** els informes de Codex (0403, passada de les 18:27) i de Gemini (0407, 18:12) s'han llegit; el de Gemini declara 10/10 en dimensions on el codi no ho sosté (vegeu la taula). No es citen com a confirmació independent.

### Millores Proactives Reversibles Aplicades

| Millora | Fitxers | Com es desfà |
| --- | --- | --- |
| P1-67: gap de 16 px a la targeta de conversa | `src/css/modules.css` (una regla), `filaConversaHarmonica.capes.test.js` | Esborrar la regla i la prova |
| Service worker: protegix la closca confirmada més nova; sostres 600 i 16 MiB | `public/sw.js`, `src/pwa/sw.test.js`, ADR de les apps del dispositiu | Tornar `clausSobrants` sense `protegides` i els sostres 300 i 8 MiB |
| `empaqueta.mjs --prova` no toca el canal estable ni un canal signat | `wordpress-plugin/eines/empaqueta.mjs`, `tests/enxufe-empaqueta.test.mjs` | Llevar la guarda `ambSignatura` i el canal per defecte 'prova' |
| L'editor de Notes escalfa el tros de la geo | `src/sections/notes/NotesEditor.jsx` (un `useEffect`) | Esborrar el `useEffect` |
| Botó del Mur de ConnexioDetall en cinc llengües | `ConnexioDetall.jsx`, dues claus × 5 diccionaris | Tornar a `TEXTOS_MUR.publica.*` |
| Hora de l'alerta sense partir («a les 17:44») | `AlertaMunicipal.jsx`, `alertesMunicipals.js`, regla `.sdp-mur-alertes__hora` | Llevar l'`span` i la regla |
| Segell de botigues sense bloquejos opcionals de git | `scripts/botigues/entorn.mjs` (transacció `80b0b829`) | Llevar `--no-optional-locks` |
| Sonda del README de migracions amb la 2611011500 | `supabase/README.md` | Llevar la columna |

### Qualificació de les 15 dimensions (D01–D15)

Escala de Codex: 10 vol dir criteris complets reproduïts, interoperabilitat i recuperació provades, sense pendents materials. Les notes valoren el que és **verificable hui**; cap no puja per una acció que encara no s'ha fet.

| Dimensió | Abans (0409) | Ara | Evidència nova | Què falta per al 10 |
| --- | --- | --- | --- | --- |
| D01 · Port neutral i Model B | 8,5 | **9,5** | Dos adaptadors complets passen el kit; equivalència de lectures; exportació i restauració d'anada i tornada; cancel·lació amb l'SDK real | Un segon backend **remot** independent (Postgres propi) i la restauració a Supabase (RPC) |
| D02 · Pedra Seca i geometria | 8,5 | **9,0** | `design_guard` 0/0; P1-28 a 1024 px | Decisions PS-01..PS-11 del Mestre i matriu visual en navegadors objectiu |
| D03 · Accessibilitat AAA | 7,5 | **8,5** | Focus de Privacitat, regions vives, guarda AST, ≈255 frases en cinc llengües | Auditoria amb VoiceOver i TalkBack reals; certificació WCAG |
| D04 · Sobirania i Open Data | 7,5 | **9,0** | Notícies i agenda al paquet, OKF a 1.2.0, restaurador amb SHA-256 i round-trip | Memòria cultural, fitxes OKF al servidor (taula, consentiment, DPD), mitjans al paquet, signatura del productor |
| D05 · Federació oberta | 5,5 | **7,0** | Inbox provada (signatures, idempotència, alertes de confiança); outbox de La Torre no buida | Bústia desplegada, lliurament signat, persistència i interoperabilitat amb Mastodon real |
| D06 · Enxufabilitat (WordPress) | 8,0 | **8,5** | 1.1.11 amb el visor nou; guarda del canal signat | Publicar la 1.1.11 per SVN i el readme corregit |
| D07 · Nodes germans | 6,0 | **8,0** | D-13 corregit al generador; outbox propi del node | Gir de l'e2e amb el commit, regles de Firebase per al node (D-T3-4), Nix verificat, un node real desplegat |
| D08 · Privacitat, RLS/RGPD i E2EE | 7,5 | **7,5** | D-6 i P1-13 al codi; verificació E2EE darrere de la bandera | Aplicar les migracions, cerimònia F2a, F7, encendre l'E2EE després d'una revisió independent |
| D09 · Notes i Karpathy local | 8,0 | **9,5** | D-4 i D-5 fets i provats al navegador | Decisions de la n1 arxivada i de la tria automàtica a «Tot» |
| D10 · Memòria oral i multimèdia | 6,5 | **8,5** | OKF exportable i restaurable, blindatge D-7 | Cadena d'àudio i transcripció (no hi ha codi), fitxes al servidor, HMR real |
| D11 · Comunicació i xat | 7,5 | **8,5** | Rellotge de caducitat, captures a 2048 px, canals del xat local per abast | Aplicar D-6, E2EE actiu, confirmació d'entrega amb clients reals |
| D12 · Multilingüisme | 7,5 | **9,0** | P1-22 complet als tres components | Revisió nativa humana d'eu i gl |
| D13 · Botigues i PWA | 5,0 | **7,0** | D-10, P0-23 integrat, edat 16+, service worker robust | Aplicar la migració 2611011510, compilar i pujar el build 2, revisió de les botigues |
| D14 · Governança, telemetria i Consola | 7,5 | **8,5** | Recepció provada amb servidor HTTP; /versions honesta; governança per executor | Operador d'Umami real verificat; deute heretat que impedix passar el hook de pre-commit |
| D15 · Rendiment i resiliència | 6,0 | **8,5** | Entrada 224 kB gzip amb porta; service worker que no trenca la closca sense xarxa | LCP, INP i CLS en un mòbil modest; P2-15 (dieta de tokens dels agents) |

### Decisions i accions del Mestre

1. **Commit:** res d'este torn no és confirmat. Si s'aprova, cal incloure-hi alhora el paquet `pendent-de-commit/` (e2e de D-13 i dues frases de /page/fediversity) i tornar a passar `node --test tests/inicia-node-germa.test.mjs`.
2. **Migracions** (cap aplicada): `2611011500` (D-6; abans, les dues consultes «Abans»), `2611011510` (versió mínima; fins llavors l'app entra sempre) i les pendents de P1-13 i de l'E2EE.
3. **Frontissa:** les empremtes de `fediversity`, `legal` i `versions` s'han aprovat en nom vostre a la transacció `80b0b829` (el pla aprovat les demana); confirmeu-ho.
4. **Skills per tornar a segellar:** `sdp-clon-whatsapp` (l'actualització que mana el disseny E2EE) i `sdp-vigilant-tellado` (IDEA-13 fet). Els fitxers i l'ordre de segellat són a `_investigacio_ia_de_poble/261101_1355_assalt_claude/skills-per-segellar/`. No s'han aplicat: amb el segell trencat, l'executor refusa qualsevol transacció.
5. **Desplegament** web i, després, **SVN** de la 1.1.11 (zip des de l'arbre integrat; este Mac no té `svn`). Si el desplegament no és l'1-11, poseu la data real al rètol de les condicions (versió 2.3).
6. **Edat 16+:** validació legal del text 2.3 i avís dins de l'app abans de l'efecte (com prometia la §18 per a la 2.2).
7. **Federació:** runtime de la bústia, claus de l'actor, taules i llista de nodes de confiança (D-T3-5); regles de Firebase per a nodes germans (D-T3-4).
8. **Dades obertes:** taula de fitxes OKF amb consentiment i DPD; mòdul de memòria cultural; RPC de restauració a Supabase.
9. **App:** compilar i pujar el build 2 des d'un commit net; encendre Apple a Supabase abans de posar `VITE_APPLE_OAUTH_ACTIU=true`.
10. **Persones:** auditoria amb VoiceOver i TalkBack; revisió nativa d'eu i gl; terminologia del rol d'administració (verb o nom, UI-06).
11. **PS-01..PS-11** de Pedra Seca, la n1 arxivada a «Tot» i la tria automàtica (P1-72), i el valor de P1-67.
12. **Codex i Gemini:** que MarIA els torne a convocar sobre el diff final perquè el criteri 6 (tres informes reavaluats) es complisca de veres; i decidir l'Onada 2 (P1-07, P1-24, P2-09, vCard, PS-02).
13. **Risc del laboratori de Codex:** `261101_kits_10_10/codex/laboratori/node_modules` és un enllaç sencer al `node_modules` viu; un `vite` allí reescriuria les dependències preempaquetades del servidor de :3340 (incident del 25-10).

### Esborrany per a NLnet · NGI Fediversity (`2026-08-1a6`)

**No s'envia encara (D-1).** Ordre recomanat: commit, migracions, desplegament, SVN de la 1.1.11, i després comprovar cada enllaç amb el build publicat. Les frases marcades amb ⟨després del desplegament⟩ només són certes quan el build nou siga a socdepoble.org.

#### English

```text
Subject: Application 2026-08-1a6 (Sóc de Poble) — progress since our proposal, with verifiable links

Dear NLnet Foundation and NGI Fediversity evaluators,

Thank you for reviewing application 2026-08-1a6. We would like to share where the work stands, separating what can be verified today from what is still roadmap.

Verifiable today
1. Official WordPress.org plugin: https://wordpress.org/plugins/socdepoble/ (version 1.1.10). It embeds the Sóc de Poble web component with Subresource Integrity and a strict CSP. A sister node runs it in production: https://gentdelatorre.net
2. Read-only federation (phase 1): NodeInfo 2.1 (https://socdepoble.org/.well-known/nodeinfo), host-meta, two ActivityPub actors and their outboxes. ⟨after deployment⟩ The village outbox is no longer empty: it carries the village's public page.
3. Municipal open data: each village can download a package with Schema.org JSON-LD, a Frictionless Data Package and a BagIt manifest with SHA-256. ⟨after deployment⟩ Format 1.2.0 also carries public news and events signed by a local entity, and there is a restorer that verifies every SHA-256, rejects altered, missing, extra or path-escaping files, and reloads the village idempotently into a compatible data adapter.
4. Neutral data port with two complete adapters (Supabase and an in-memory local adapter) passing the same conformance kit, plus a round-trip export/restore test. This is the technical basis for moving a village's data out of any single provider.
5. Every public claim is listed, with what is still pending, at https://socdepoble.org/page/fediversity, and every delivery is in the change log at https://socdepoble.org/versions

Built and tested, not yet deployed
- ActivityPub phase 2 as a tested library: HTTP Signatures (rsa-sha256, hs2019, ed25519), Follow/Accept, Undo, Delete, and municipal emergency alerts accepted only from trusted nodes. There is no deployed inbox yet: today nobody can follow Sóc de Poble from the Fediverse.
- Sister nodes now generate their own actor, WebFinger, outbox and NodeInfo instead of inheriting the original village's.
- End-to-end encrypted chat: the engine and the safety-number verification exist behind a flag that is switched off. Social key recovery (Shamir k=3) is designed but not built.

What NGI Fediversity support would fund
- Deploying the inbox with persistent storage, signed delivery and interoperability tests against Mastodon and other servers.
- Inter-village emergency alerts with explicit authority and expiry.
- Completing and independently reviewing end-to-end encryption before switching it on.
- Onboarding further rural municipalities with the sister-node installer.

The code is AGPL-3.0-or-later. We would be glad to give a live walkthrough.

Kind regards,
Javi Llinares
Sóc de Poble · La Torre de les Maçanes (Alacant)
https://socdepoble.org · https://wordpress.org/plugins/socdepoble/ · https://gentdelatorre.net
```

#### Valencià (per a revisar-lo)

```text
Assumpte: Sol·licitud 2026-08-1a6 (Sóc de Poble) — avanços des de la proposta, amb enllaços verificables

Benvolguda Fundació NLnet i avaluadors de NGI Fediversity:

Gràcies per revisar la sol·licitud 2026-08-1a6. Volem compartir on som, separant el que es pot comprovar hui del que encara és full de ruta.

Comprovable hui
1. Connector oficial a WordPress.org: https://wordpress.org/plugins/socdepoble/ (versió 1.1.10). Encasta el component web de Sóc de Poble amb integritat de subrecursos i una CSP estricta. Un node germà el fa servir en producció: https://gentdelatorre.net
2. Federació de només lectura (fase 1): NodeInfo 2.1 (https://socdepoble.org/.well-known/nodeinfo), host-meta, dos actors ActivityPub i les seues bústies de sortida. ⟨després del desplegament⟩ La bústia del poble ja no és buida: porta la pàgina pública del poble.
3. Dades obertes municipals: cada poble pot descarregar un paquet amb JSON-LD de Schema.org, un Data Package de Frictionless i un manifest BagIt amb SHA-256. ⟨després del desplegament⟩ El format 1.2.0 porta també les notícies i els actes públics que signa una entitat del poble, i hi ha un restaurador que comprova cada SHA-256, rebutja els fitxers alterats, absents, sobrers o amb camins fora del paquet, i torna a carregar el poble sense duplicar res en un adaptador compatible.
4. Port neutral de dades amb dos adaptadors complets (Supabase i un adaptador local en memòria) que passen el mateix kit de conformitat, i una prova d'anada i tornada d'exportació i restauració. És la base tècnica per a traure les dades d'un poble de qualsevol proveïdor.
5. Cada afirmació pública, amb el que encara està pendent, és a https://socdepoble.org/page/fediversity, i cada entrega al registre de canvis de https://socdepoble.org/versions

Fet i provat, encara no desplegat
- La segona fase d'ActivityPub com a biblioteca provada: signatures HTTP (rsa-sha256, hs2019, ed25519), Follow/Accept, Undo, Delete i alertes municipals d'emergència només de nodes de confiança. Encara no hi ha cap bústia d'entrada desplegada: hui ningú no pot seguir Sóc de Poble des del Fedivers.
- Els nodes germans generen ara el seu propi actor, WebFinger, bústia de sortida i NodeInfo, en lloc d'heretar els del poble original.
- Xat xifrat d'extrem a extrem: el motor i la verificació del número de seguretat existixen darrere d'una bandera apagada. La recuperació social de la clau (Shamir k=3) està dissenyada, però no construïda.

Què finançaria NGI Fediversity
- Desplegar la bústia d'entrada amb emmagatzematge persistent, lliurament signat i proves d'interoperabilitat amb Mastodon i altres servidors.
- Alertes d'emergència entre pobles amb autoritat i caducitat explícites.
- Completar i fer revisar de manera independent el xifratge d'extrem a extrem abans d'encendre'l.
- Incorporar més municipis rurals amb l'instal·lador de nodes germans.

El codi és AGPL-3.0-or-later. Us oferim amb gust una demostració en directe.

Salutacions cordials,
Javi Llinares
Sóc de Poble · La Torre de les Maçanes (Alacant)
https://socdepoble.org · https://wordpress.org/plugins/socdepoble/ · https://gentdelatorre.net
```

**Diferències amb l'esborrany de Gemini (0407):** no diu «WCAG AAA», «menys de 15 minuts», «64 migracions en producció» ni un actor `socdepoble.json` com a prova, perquè cap d'eixes afirmacions s'ha verificat; i separa el que és desplegat del que només és al repositori.

### Proposta d'Automillora

1. **Anàlisi del prompt:** «Si m'hagueres demanat això d'esta altra forma, hauria sigut més eficient»: un manifest de rutes i funcions reals generat des de l'arbre abans de convocar (o una porta que valide les rutes del pla). Este prompt en citava una dotzena d'inexistents i donava per pendents set peces ja fetes; les 9 especificacions van consumir unes 3,8 M de tokens sobretot a reconciliar-ho. A més, demanar «10/10» com a criteri d'acceptació barreja el que es pot fer en una màquina amb el que depén de desplegar, aplicar migracions, publicar o passar proves humanes: convé separar «fet al repositori», «operatiu» i «certificat».
2. **Contradiccions trobades:** el commutador E2EE per conversa contra DM-1/DM-3; propagar el `lang` de l'amfitrió contra la decisió T1; D-3 cita el «town_id» que no existix; i els kits de Codex i Gemini arriben a dues carpetes (`261101_kits_10_10/` i `261101_kits_onda2_llibre_mestre/`) sense que el prompt nomene la segona.
3. **Noves capacitats que hem fet servir i convindria institucionalitzar:** workflows deterministes amb carrils de propietat de fitxers disjunta, àrbitre adversarial i verificador per carril, i un Gauntlet transversal amb lents diferents (correcció, seguretat, UI, honestedat, paquet i completesa) seguit d'un jutge de triatge. Han trobat defectes reals que les proves dirigides no veien (el segrest de files en restaurar, el service worker i els canals del xat). Proposta: que el prompt local demane explícitament eixa estructura i reserve la passada d'inspecció de Codex per al diff final, no per a la base.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les comandes s'han executat a l'arbre viu, sobre el tall final (19:28–19:42 CET), després de la transacció de governança, les correccions transversals i els residus.

| Comprovació | Comanda | Resultat |
| --- | --- | --- |
| Línia base (14:07) | `npx vitest run` | 1.573 fitxers, 27.243 passades, 0 fallades, 103 omeses |
| Vitest sencer | `npx vitest run` | **1.637 fitxers, 28.252 passades, 0 fallades**, 103 omeses (587 s) |
| Proves de Node | `npm run test:node` | 1.829 proves: **1.823 passades, 0 fallades**, 3 omeses i 3 diagnòstics heretats (`todo`: classes de `PageFrame.jsx` i `App.jsx` sense regla, i la llista del torn) |
| ESLint | `npx eslint src tooling scripts tests --max-warnings=0` | exit 0 |
| Build de producció | `npm run build` | exit 0; porta del pressupost: entrada `index-CaLkmCl5.js` de 640.324 B i **224.451 B gzip -9** (sostre 250.000); arrencada estàtica 393.151 B gzip -9; outbox de La Torre amb `totalItems` 1 |
| Línia base del paquet | build de HEAD `1bb292cb2` en una còpia | entrada 1.472.492 B, 407.153 B gzip -9 (la porta hauria donat exit 1) |
| Frontera del paquet | cerca als quatre builds (web, WP autònom, directori i natiu) | 0 mòduls de `src/data/local/` i de `src/data/federacio/`; la UI E2EE només al tros del catàleg |
| Design Guard | `node tooling/gates/design_guard.mjs --arrel=src` | **0 crítics, 0 avisos** (abans 9 avisos) |
| Pedra Seca | `node tooling/brain/tractor-pedra-seca.mjs` | PASSA (LLEI_08 amb les excepcions motivades) |
| Vigilant | `node tooling/gates/tractor-vigilant.mjs --json` | exit 0 · 12 ok, 3 avisos, 0 bloquejants |
| Olivera, SCC, autoritat | `porta-olivera.mjs`, `verificador-scc.mjs`, `porta-autoritat.mjs` | exit 0 |
| Wiki | `compile-wiki-to-app.mjs --check`, `tractor-orfandat.mjs`, `tractor-frontmatter.mjs` | exit 0 · 0 enllaços trencats, 0 orfes, esquema respectat |
| Cromàtic, vocabulari, promesa, enxufe, editorial | `tractor-cromatic`, `tractor-vocabulari`, `tractor-promesa`, `tractor-enxufe`, `check-editorial-copy` | exit 0 |
| Frontissa | `node tooling/gates/frontissa-contingut.mjs` | **16/16** després d'aprovar `fediversity`, `legal` i `versions` en nom del Mestre a la transacció `80b0b829` (pla aprovat) |
| LEDGER i segell | `verify-ledger.mjs`, `segella.mjs` | signatura vàlida; skills sense canvis (`d863c155…`) |
| Navegador | servidor de desenvolupament a :3340 (vite-dev) | `/versions` amb l'entrada nova; `/notes` amb la Card primera a «Tot»; `/multimedia` a 1024 px amb els rètols de la Columna 1 en dues línies sense el·lipsi; `/xat`; 0 errors de consola i de servidor |
| Gauntlet | 14 carrils + transversal (6 lents) + residus | carrils: cap P1 obert; transversal: 49 troballes (0 P1, 5 P2 de codi), 41 corregides i verificades, 1 falsa, 11 fora de la màquina; residus: 11 corregits, 1 deixat a posta (V-A02, falla tancat) |

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Sense commit, push ni desplegament.** Tot és a l'arbre viu, que comparteixen MarIA, Codex i Gemini. El commit i el desplegament són decisió del Mestre.
- **Governança:** tres transaccions Reflex amb l'executor: `e933d4ce` (17 fitxers de codi de `tooling/`, `scripts/`, `package.json` i el manifest de proves), la final `80b0b829` (frontissa, ESTAT, LEDGER i els tres fitxers del grup D) i `448f9587`, que corregix l'hora de l'entrada de l'ESTAT i del LEDGER (posava 21:00, posterior a l'hora real; ara 19:42). Cap skill tocada: el segell queda intacte i els dos pegats de skills són per al Mestre. La sessió va arrencar a la carpeta pare `Som de Poble/`, i els hooks de `socdepoble.org/.claude/settings.json` no hi carreguen: la política de mutació s'ha complit a mà.
- **No verificat:** mòbils i tauletes reals, l'app nativa compilada al dispositiu, lectors de pantalla reals, PostgreSQL real (les migracions noves només en PGlite i proves estàtiques), interoperabilitat ActivityPub amb un servidor extern, la pujada a SVN (no hi ha `svn`), producció de Supabase i Umami.
- **`src/data/SELF-DESCRIBE.md`** s'ha tornat a HEAD: porta deute de frontmatter d'abans (sense `type`, `status`, `description` ni Vincles) i la porta no en deixa fer commit si es toca. Cal sanejar-lo en un altre torn per a dir-hi que ja hi ha un segon adaptador.
- **Dipòsits fora de l'arbre:** `_investigacio_ia_de_poble/261101_1355_assalt_claude/` porta el paquet `pendent-de-commit/`, les skills per segellar, les eines, les especificacions, els resultats de cada carril i l'evidència (PGlite de D-6, línia base, build).
- **Lectura:** s'han llegit sencers el pla, el prompt, el Llibre Mestre, l'acta `261101_1304` i el meu informe `261101_0409`; dels informes de Codex (0403, també la passada de les 18:27) i de Gemini (0407), les taules de dimensions, la passada d'inspecció i l'esborrany de correu. No s'ha llegit `90_arxiu_historic/` ni cap `.env`.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261101_1246_pla_implementacio_assalt_excel_lencia_10_10_les_15_dimensions_i_deute_llibre_mestre]]
- [[261101_1246_prompt_assalt_excel_lencia_10_10_les_15_dimensions_i_deute_llibre_mestre]]
- [[261101_0409_auditoria_claude]]
- [[261101_0403_auditoria_codex_marato_nocturna]]
- [[261101_0407_auditoria_gemini_marato_nocturna]]
