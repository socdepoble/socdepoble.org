---
type: informe
status: actiu
description: Execució de Claude Code del Bloc H (P1-66 a P1-69, residus de l'onada 1 i idees 40, 32, 33 i 41) sobre el commit cd3b5b56c.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_74bad4b9-c817-4dca-96b8-eb6ff86a0da4:ef4918d2-f8a6-44c3-aa96-6f2fc8142e71
---
# Onada 2 de Claude: Bloc H del pla 261028_1526 sobre cd3b5b56c

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_74bad4b9-c817-4dca-96b8-eb6ff86a0da4:ef4918d2-f8a6-44c3-aa96-6f2fc8142e71 |
| Versió del document | 1.1.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-28T19:20:32.803Z |
| Modificació | 2026-10-28T23:30:00Z |
| Propietari | claude |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (Claude Code), amb subagents de workflow del mateix model |
| Tokens consumits | Comptador exacte no disponible; no s'estima |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-28T19:20:32.803Z: esborrany creat; contingut i verificació pendents.

2026-10-28T23:30:00Z (1.1.0): Bloc H tancat i verificat, commit `e36606db2` i push, paquet de WordPress.org regenerat; disseny de P1-12 i decisions del Mestre.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Relleu de progrés (canal viu), 2026-10-28 20:25.** Torn `torn_74bad4b9-c817-4dca-96b8-eb6ff86a0da4`, ara amb el pla viu lligat (SHA `0e89ef82…`; el que citava el missatge del Mestre, `ae5b15df…`, ja no és el del disc). Base: **`cd3b5b56c`**, pujat a `fork/backup-notes-publish`. Corre un reconeixement de només lectura del Bloc H en sis grups: compositor (P1-66), tipografia (P1-67), perfil i poble (P1-68), PWA (P1-69), residus de l'onada 1 i idees 40, 32, 33 i 41. **P1-69** és al prompt viu però no al missatge del Mestre: es consultarà abans de picar-lo. La font variable de P1-67 ja està baixada a una carpeta fora de l'arbre i verificada (59.936 B, SHA-256 `28a840bc…`, la mateixa de `FONTS_LOCALS.txt`), amb el seu `OFL.txt`. El canvi de perfils de P1-68 portarà una **migració nova sense aplicar**, amb un backfill genèric i cap nom de persona dins del SQL.

**Relleu de progrés, 2026-10-28 21:15.** El Mestre va aprovar **P1-69** en xat. També va demanar la **regeneració del paquet de WordPress.org** al tancament i, quan Codex va publicar el QA v2.0.0 (`261028_1611_auditoria_codex.md`), hi va afegir **QA-01** i **QA-02**.

En marxa, cadascuna amb implementació, dues revisions adversarials, correcció i verificació:
- les línies del compositor (P1-66), la tipografia (P1-67), el perfil i el poble (P1-68) i les idees 40 i 41;
- la de residus (C28-02/QA-03, C28-07/QA-04, Emowe M1, M2 i C1).

Fet:
- **QA-01**:
  - `buildSocialManifest` exporta `llegixSnapshot` (fitxer regular `.json` de 8 MiB com a màxim), i les dues CLI la compartixen.
  - `prerenderSocial` rep `publicSnapshot` i el passa al manifest; la CLI accepta `--snapshot`.
  - Un ús o un snapshot dolents ixen com a rebut JSON.
  - El test nou fa servir una publicació sintètica del Mur, per l'API i per la CLI. Comprova:
    - la publicació pública té el seu fitxer;
    - una imatge d'un altre origen porta la targeta genèrica;
    - la privada i la pendent no tenen fitxer;
    - cap `NO_EXPORTAR` arriba a `dist/`;
    - un snapshot enllaçat o `.txt` es refusa.
  - Amb el prerender vell, el test falla. En una còpia d'assaig passen 58 de 58 (`tooling/seo`).
  - Són camins de governança: s'aplicaran amb l'executor al tancament.
- **QA-02**: `centreDelGrup` calcula la longitud amb mitjana circular, amb la mitjana aritmètica de reserva per als punts antipodals. Té un test en els dos ordres.

**Incident de l'orquestració.** La primera línia de P1-69 va rebre els paràmetres com a text, i a l'agent li arribaren «undefined».
- Sense especificació, va fer QA-01 i QA-02 pel seu compte. QA-02 el va deixar a l'arbre viu.
- L'he revisat i el conserve, perquè és correcte.
- El seu QA-01 no s'aplica (la carpeta queda marcada com a superada); d'ell n'he pres dos casos de test.
- La línia de P1-69 torna a córrer amb els paràmetres bé, i l'script ara refusa uns paràmetres incomplets.

**P1-12 (E2EE), encarregat pel Mestre per a després del Bloc H, 2026-10-28 21:30.** Abans de picar res, he llegit l'especificació GM2-09 de Gemini (`261028_1614_auditoria_gemini.md`, línies 229–455), el QA v2.0.0 de Codex, que no conté cap revisió d'E2EE, i els tres blindatges de MarIA.

En la lectura apareixen quatre punts que cal resoldre abans d'implementar:
- **Ni GM2-09 ni els blindatges tenen defensa contra els membres fantasma** ni fixació de claus TOFU.
- **El sobre amb només parella efímera (ECIES) perd l'autenticació de qui l'envia:** qualsevol que tinga la clau pública del destinatari, el servidor inclòs, pot plantar una clau de fil.
- **El text proposat per a la interfície («ni Sóc de Poble ni l'administrador poden llegir-los mai») promet més del que el disseny garantix,** perquè el servidor servix el JavaScript de l'aplicació web.
- **GM2-09 declara `requires_human_decision: false`, però hi ha decisions que són del Mestre:**
  - l'historial antic en clar;
  - la pèrdua de la frase de recuperació;
  - els clients desplegats amb el contracte vell (APK, iOS i el paquet de WordPress.org que es prepara ara);
  - la moderació de denúncies;
  - els xats on parla una entitat.

Corre un reconeixement de només lectura, sense cap escriptura a l'arbre: el servidor, la capa de dades, la interfície i l'estat, les plataformes (WebCrypto i IndexedDB a la web, la PWA, Capacitor i l'incrustat de WordPress) i la moderació amb els textos legals. Damunt, dos dissenys independents, una revisió criptogràfica adversarial de GM2-09 i dels blindatges, dues crítiques per disseny i una síntesi amb les decisions per al Mestre. El codi de P1-12 començarà quan el Bloc H estiga tancat i el paquet de WordPress.org fet.

**Relleu de progrés, 2026-10-28 22:10.**

**Lliçó del Mestre i carpetes errants:**
- A dos carrils del Bloc H (h_tipografia a les 21:20 i la revisió visual d'h_idees a les 21:49), un Chrome headless sense `--disk-cache-dir` i amb el repositori com a carpeta de treball va deixar a l'arrel una carpeta literal `./~/Downloads` (memòria cau de 40 KB). Les dues són a la quarantena del projecte, `.sdp-paperera/quarantena-261028_2141_cau-chrome-home-tilde/`, ignorada per Git: es traslladen, no s'esborren (AGENTS §5).
- La lliçó del Mestre és a `sdp-workflow` (Lliçons del Mestre, 261028), amb la seua línia `correcció` al LEDGER, per l'executor. El segell de skills verifica: `f210378d`.
- Els encàrrecs nous als carrils ja copien la regla.

**Decisions del Mestre per a P1-12**, preses en dues rondes:
- **Activació:** esperar, mai en clar.
- **Recuperació:** 6 paraules obligatòries.
- **Historial:** el que ja és en clar es queda, amb una línia divisòria.
- **Denúncies:** qui denuncia aporta el text.
- **Dispositius:** una clau per persona.
- **Abast, rectificat a les 22:00:** va xifrada tota conversa privada. Inclou persona ↔ persona, persona ↔ entitat (amb sobres per al veí i per a cada owner/admin; un gestor nou rep la clau d'un owner/admin des del client) i qualsevol grup privat.
- **IDEA-48:** cercle obert de confiança, amb Shamir k = 3 sobre GF(2⁸), fragments embolcallats per a cada amic i recuperació sense espera quan tres amics confirmen.
- **Mitigacions que no contradiuen la decisió:**
  - el re-embolcallat per a un gestor nou és explícit, mai automàtic;
  - el veí veu qui pot llegir la conversa en nom de l'entitat;
  - es reparteix una clau de recuperació, i la clau recomposta es valida contra la pública registrada;
  - els aparells antics reben un avís;
  - es demana confirmar per veu o en persona.
- **Riscos que el Mestre ha de conéixer:**
  - amb k = 3 fix i molts amics, tres d'ells que es posen d'acord, o tres comptes robats, poden recompondre la clau;
  - sense espera, qui robe el compte pot intentar l'engany abans que la persona ho veja.

**Carrils del Bloc H tancats amb verificació PASS:**
- **h_tipografia (P1-67):**
  - En falta el preload del woff2 variable a `index.html`, que l'afig l'orquestrador.
  - El corrector va estendre els 16px al menú de la bombolla, que era a 20 px, per la regla de no fer cap menú més gran que el principal. Cal confirmar-ho.
  - Les pestanyes de contingut (`.sdp-pestanyes`) encara no són SemiCondensed, i la decisió del Mestre les inclou.
- **h_residus:** QA-02, QA-03, QA-04, M1, M2 i C1. `javac -Xlint:all` passa sense avisos, i el termini de consulta d'Android és de 5 s, no de 2 s.
- **h_pwa (P1-69):**
  - Fa 60 proves i maten tots els mutants.
  - Queda per afegir una línia de guarda per al navegador intern d'Android (`; wv)`) quan sí que ofereix l'esdeveniment.
  - Resten per confirmar dos textos: «Afegeix» i «Arxiu».

Continuen el compositor (P1-66), el perfil (P1-68) i les idees.

**Relleu de progrés, 2026-10-28 22:35.** Ja han tancat també dos carrils més.

**h_idees (IDEA-40a/b i IDEA-41)** passa: 112 proves pròpies i tots els mutants morts. El verificador només fallava pel que és de l'orquestrador, i ja està integrat:
- el test del Lector, que ara cita `--sdp-verd`;
- **Proposa Card:** la normalització té un memo propi per cos, perquè amb un cos de 2 MB cada tecla del títol tornava a analitzar-lo sencer (~65 ms). El test nou falla amb el codi vell (300.100 caràcters analitzats per tecla);
- l'espècimen 7 del catàleg, amb el semàfor de la targeta de veres.

**h_compositor (P1-66)** passa:
- 154 proves i 32 de 33 mutants morts (l'altre és equivalent);
- estalvi vertical: −151 px en repòs i −187 px sense gravació, mesurat a Chrome headless;
- el corrector va tancar el doble toc d'«Envia» que obria el micròfon.

**Integració de l'orquestrador:**
- **Semàfor de la Consola:** el carril d'idees el pintava amb `:has()`, que `tests/lint_xat` i `lint_logica_usuari` prohibixen i que Chrome 100–104 no coneix.
  - Ara el quadrat porta el to com a `data-semafor`: UniversalCard accepta un `semafor` opcional, només amb `exit`, `avis` o `error` i només als quadrats personalitzats.
  - Les regles de modules.css seleccionen eixe atribut. Els dos lints passen 37 de 37.
- **PWA:** guarda del navegador integrat d'Android també quan escolta l'esdeveniment.
- **Font:** preload del woff2 variable a `index.html`.
- **Pestanyes de contingut** en SemiCondensed, per la decisió del Mestre («pestanyes»).
- **Compositor:** fora les tres regles òrfenes d'`AdjuntXat.css`, i el focus torna al + quan es tanca el menú amb el mateix + (Safari).

Tot té proves. Falten el perfil (P1-68), les claus i18n, QA-01 per l'executor i la versió del catàleg.

**Relleu de progrés, 2026-10-28 23:15.** Els sis carrils del Bloc H estan integrats.

**h_perfil (P1-68):** passa la verificació.
- La migració `2610282100_usuari_i_poble_canonic.sql` **no està aplicada**: porta una sola línia «-- NO aplicada…» i 42 proves estàtiques.
- Les regles del client i del SQL donen el mateix en 158 noms sintètics (0 diferències a PGlite), i 41 de 41 mutants moren.
- El corrector va tancar la troballa bloquejant: amb `baixa`, un bucle esgotava la memòria compartida de Postgres.
- L'orquestrador hi ha fet tres canvis:
  - **P4:** la fitxa fusiona l'@usuari i la confirmació que torna la RPC, i l'@usuari mai no va a `user_metadata`.
  - **P2:** a la capçalera, la llista d'identitats fundacionals s'omple DESPRÉS d'aplicar la migració; abans, la reserva els donaria el sufix `-2` a ells mateixos.
  - Els dos camps de l'alta passen al seu fitxer, `CampsDIdentitatALAlta.jsx`, amb el mateix marcatge: `OnboardingSteps.jsx` no fa créixer el deute de disseny.

**Integració:**
- Les 22 claus noves són als cinc diccionaris.
- **VERSIO_CATALEG** és `2026-10-28T22:26:58+01:00`, i les notes nomenen els dos espècimens.
- **QA-01** és a l'arbre viu per l'executor (transacció `9958d6c8`).

**Bateria sobre la còpia d'assaig** (`cd3b5b56c` + els fitxers del Bloc H):

| Comprovació | Resultat |
| --- | --- |
| ESLint sencer | net |
| `test:precommit` | 3.585 proves Vitest i 262/262 Node, en verd |
| Vitest sencer | 23.649 aprovades i 1 fallida: `laParroquia.test.js`, heretada. `MapaFotografic.test.jsx` no carrega a la còpia (Vite refusa el CSS de Leaflet de fora de l'arrel); a l'arbre viu passa 26/26 |
| Node primari | 1.141 aprovades i 1 fallida: `botigues`, heretada |
| design_guard | les mateixes 10 identitats noves que `cd3b5b56c`, i 39 crítics i 12 avisos, que no superen els 40 i 12 de `cd3b5b56c` |
| frontissa | només `legal`, pendent de l'aprovació del Mestre |

**Per al commit:**
- L'aprovació de la nova empremta `legal` (`975922d3…`, 45.493 bytes) ja està calculada en una còpia. Només s'aplicarà per l'executor quan el Mestre l'aprove.
- Corre la revisió adversarial final del diff integrat.

**Relleu de progrés, 2026-10-28 23:55 · Revisió adversarial final del Bloc H.**

Han revisat el diff integrat tres lents: la integració entre carrils, la seguretat i les regressions fora de l'ordre. Un escèptic independent ha intentat refutar cada troballa, i n'ha confirmat 9:

| Id | Gravetat | On | Què |
| --- | --- | --- | --- |
| R1 | bloquejant | `PerfilEditor.jsx` | El bloc de l'@usuari i el poble va germà de l'editor dins d'un contenidor sense scroll. En un telèfon de 375 px l'editor queda a 0 px i el selector de poble, retallat. Passaria a tothom en aplicar la migració. |
| S-01 | major | migració 2610282100 | Mentre l'identificador no està confirmat, la branca que el regenera quan `full_name` deixa «Veí/na» fa d'oracle sense límit: diu si un identificador existix, també el d'un perfil privat. |
| R2 | major | `UniversalToolbar.jsx` | El botó Proposa Card fa passar la barra de Notes a dues files en telèfons de 360 a 393 px. |
| INT-01 | major | llista del commit | La llista era anterior a l'extracció de `CampsDIdentitatALAlta.jsx`, i la bateria de les 22:57 no la cobria. |
| INT-02 | menor | `modules.css` | El peu del menú + pren la mida de prosa (20 px), no els 14 px discrets. |
| INT-03 | menor | `Compositor.jsx` | A l'espècimen de Disseny, el menú + queda retallat a 64 px. |
| S-02 | menor | migració | La guarda SDP-USER-022 accepta la política «profiles read own» oberta (`using (true)`). |
| R3 | menor | `IdentitatAlPoble.jsx` | L'error de desar el poble es pinta davall de l'identificador. |
| R4 | menor | `IdentitatAlPoble.jsx` | «Desat.» pot no anunciar-se, i el focus cau a `<body>`. |

**Refutada:** S-03. El prerender estricte es para amb una publicació remota incompleta, però això ja passava a `cd3b5b56c` i no és cap defecte que el Bloc H faça accessible.

**Verificat net**, cadascun amb la seua prova:
- les capes CSS, el semàfor, els consumidors de `squareBadge` i les 22 claus i18n;
- el perfil i la RPC, Descàrregues i l'`index.html`;
- la RLS i els grants de la migració, la quarantena de la baixa, `canalsDeBotiga`, QA-01, la compartició i el connector d'Android;
- M2 contra l'oracle (0 grups diferents en 400 conjunts), QA-02, el compositor a 320 i 375 px i els builds.

**Correccions:** quatre carrils amb fitxers disjunts, cadascun amb un verificador i mutants. INT-01 és de l'orquestrador: regenerar la llista des de l'arbre viu, refer la còpia d'assaig i repetir la bateria abans del commit.

**Paquet de WordPress.org.** La base neta ja està preparada: `cd3b5b56c` extret a una carpeta fora de l'arbre, amb les mateixes dependències. El Bloc H s'hi afegirà quan estiga verificat, i els dos builds de release es compilaran damunt d'eixa còpia, mai sobre l'arbre brut.

**Tancament del Bloc H, 2026-10-29 00:25.**

**Correccions de la revisió final.** Els vuit punts confirmats s'han corregit en quatre carrils, cadascun amb un verificador independent. Cada mutant que desfà una correcció torna a fallar.
- **R1:** el bloc de l'@usuari i el poble va al peu de l'editor (`peuDePagina`), dins del contenidor que fa scroll. L'editor conserva l'alçada: 425 px a 375×667, 602 a 390×844, 181 a 667×375 i 678 a 1280×800.
- **R2:** en compacte, el botó de Proposa Card va al grup «Aa». La barra de Notes torna a una fila (58 px) entre 360 i 393 px.
- **R3 i R4:** l'error del poble va en el seu camp. La regió «Desat.» sempre està muntada, ara fora de la graella, i el focus torna al camp de l'identificador.
- **S-01:** la regeneració per l'arribada tardana del nom només es dispara mentre l'identificador és un comodí (`veina…`). L'oracle ja no filtra res.
- **S-02:** la guarda avorta si «profiles read own» no és una de les versions que només llegixen la fila pròpia, o si no és només per a `authenticated`.
- **INT-02 i INT-03:** el peu del menú + fa 14 px, i a l'espècimen el menú ja no queda retallat.
- **INT-01:** la llista del commit s'ha regenerat des de l'arbre viu (99 camins). `src/data/wikiManifest.js` en queda fora: és generat i el porta un canvi de la Wiki d'una altra mà.

**Commit.** Per ordre del Mestre: aprovació de l'empremta `legal` per l'executor (`cd8c7421`, frontissa 15/15), després el commit i el push.
- **Commit `e36606db2`:** 99 fitxers, +8.779/−438, `--no-verify` per índex temporal. L'arbre és exactament el de la còpia d'assaig, comprovat blob a blob.
- **Push:** `cd3b5b56c..e36606db2` a `fork/backup-notes-publish`.
- **Sense aplicar ni desplegar:** cap migració aplicada (`2610282100` continua NO aplicada) i cap desplegament.

**Paquet de WordPress.org.** Es construïx des de `git archive e36606db2`, amb els dos builds de release 1.1.9 i `empaqueta.mjs --directori`.
- **Fitxers:** `_builds_de_poble/wordpress/261029_0018_wordpress_directori_v1.1.9.zip` i `socdepoble.zip`, idèntics: 3.244.627 B, SHA-256 `8fb6792db33b91d79a7cffec613348e2a22cb847028706e4e4be7ef90bf29f34`. Al costat, `261029_0018_informe_validacio_directori_v1.1.9.json`.
- **Comprovacions:** les proves de l'enxufe passen 83 de 83. Porta 43 entrades, sense `languages/`, sense actualitzador ni `Update URI`, i amb la font variable i `OFL.txt`.
- **Mitjans externs:** a l'origen se n'han sondat 388. Les 377 imatges es servixen com a `image/*` amb CORS (`*`, i `Content-Range, ETag` exposades); els altres 11 són textos i un EPUB, amb el seu tipus. Cap torna una pàgina de reserva.
- **Avís greu per al Mestre:** **producció (la versió de Firebase del 261023) continua servint les 10 fotos d'identitat amb GPS a l'EXIF**. El repositori les té netes des de `cd3b5b56c` (OG-7); cal desplegar la web abans de publicar el zip, o alhora.

**P1-12 (E2EE).** El disseny final és a `../_investigacio_ia_de_poble/261028_2330_p112_e2ee_claude/disseny_final_e2ee.md`. Hi ha arribat així:
- cinc reconeixements, dos dissenys independents, la revisió criptogràfica adversarial de GM2-09 i dels blindatges, quatre crítiques i una síntesi;
- incorpora QA-E01..E07 de Codex i les quatre esmenes de Claude.

**Decisions del Mestre:**
- esperar, mai en clar;
- 6 paraules obligatòries;
- abast de tota conversa privada, rectificat a les 22:00, amb les entitats i els grups privats;
- l'historial queda amb divisòria;
- qui denuncia aporta el text;
- una clau per persona;
- IDEA-48 amb k = 3;
- D-02: els xats comuns de les organitzacions de membres es xifren a F5 i fins llavors van en clar amb l'avís;
- les altres 23 recomanacions (a) de §18.2.

**Desplegament i requisits.** El pla té huit fases, de F0 a F7, i cada pas es pot revisar per separat. Abans d'activar res cal:
- validar HPKE amb l'RFC 9180;
- fer les proves de dues sessions;
- passar les sondes en aparells reals;
- que el Mestre revise el diccionari de 2.048 paraules.

**Canal de previsualització, 2026-10-29 00:35.** El Mestre ho va manar en xat: primer la previsualització, i producció només amb la seua ordre.
- **Abans:** la versió viva era `7b5999aa` del 2026-10-28 13:23Z, anterior a `cd3b5b56c`, i encara servia les fotos amb GPS.
- **Build:** `npm run build` complet des de `git archive e36606db2`. Els `.env` es van copiar només per al build i s'han esborrat.
- **Comprovacions del `dist/`:**
  - les 10 fotos d'identitat no porten GPS;
  - `sw.js` és el del commit, amb `SKIP_WAITING`;
  - porta 4 JWT, tots `anon`, i cap `sb_secret`.
- **Desplegament:** al canal `bloc-h-e36606db2`, amb `firebase-tools@15.34.1` i les credencials de gcloud.
  - URL: `https://soc-de-poble--bloc-h-e36606db2-ud17v8hn.web.app`
  - versió `66c751d46152b56e`; caduca el 2026-11-05
- **Producció:** continua a `7b5999aa`, comprovat per REST.
- **Pendent:** corre la verificació del canal en tres lents (rutes i OpenGraph, mitjans i privacitat, l'aplicació en un navegador), amb un escèptic per troballa.

**Verificació del canal de previsualització (`66c751d4`), 2026-10-29 01:20.** Tres lents (rutes i OpenGraph, mitjans i privacitat, l'aplicació a Chrome), amb un escèptic per troballa. **Res no és bloquejant.**

**Verificat net:**
- La purga del GPS de les 10 fotos d'identitat: la previsualització no en porta cap. Producció, en canvi, servix encara 38,6078 −0,4202, a 833 m.
- Les 122 rutes prerenderitzades fan 200 per als quatre agents d'usuari, amb un sol head, i `trailingSlash` fa 301 cap a la forma sense barra.
- Les rutes privades servixen el shell; la CSP és idèntica a producció; no hi ha cap secret, i l'únic JWT és `anon`.
- A Chrome: 0 errors de consola i 0 respostes ≥ 400 en 8.787 peticions.
- El xat de convidat no porta el + ni el micròfon; la PWA a Descàrregues no porta cap enllaç de botiga.
- Les barres van al 87,5 %, i el SW net no conté cap precàrrega de juny.

**Regressions del Bloc H:**
- **APP-D1 · major:** `/registre` demana l'@usuari i el poble sense la migració 2610282100. Es queden només a `user_metadata`, i s'hi perdrien en aplicar-la. Es tanca al commit de tancament.
- **R-01 · major per risc:** 11 rutes porten una og:image pròpia de més de 600 KB (fins a 1,09 MB); WhatsApp pot no pintar-la. Abans era la targeta genèrica de 531 KB. Cal decidir: variants OG de 1200×630 de 300 KB com a molt, o la genèrica.
- **R-02 · menor:** sis fitxers `.png` són JPEG, i el `Content-Type` no hi casa.
- **R-07 · menor:** 13 documents de la Wiki porten l'id cru com a títol de la targeta.

**Ja hi eren a producció:**
- R-04: l'arrel acaba en `noindex` per la redirecció a `/xat`;
- R-03: `?item=` porta la targeta de la llista;
- R-05: el sitemap fet a mà;
- R-06, M-02 i APP-D2: el CSS de fonts amb una hora de memòria cau;
- M-01: falten `X-Content-Type-Options`, `Referrer-Policy` i `Permissions-Policy`.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

| Comprovació | Resultat |
| --- | --- |
| Còpia d'assaig | `cd3b5b56c` més els 99 fitxers del Bloc H, igual byte a byte que l'arbre viu i blob a blob que el commit `e36606db2` |
| Vitest sencer | 23.657 aprovades i 1 fallida heretada: `laParroquia.test.js`, perquè el laboratori es va moure el 261026. `MapaFotografic.test.jsx` no carrega a la còpia, perquè Vite refusa el CSS de Leaflet de fora de l'arrel; a l'arbre viu passa 26/26 |
| Node primari | 1.141 aprovades i 1 fallida heretada (`botigues`, el preflight del laboratori) |
| `test:precommit` | 3.588 proves Vitest i 262/262 Node, en verd |
| ESLint `src tooling scripts tests --max-warnings=0` | net |
| design_guard | 39 crítics i 12 avisos, que no superen els 40 i 12 de `cd3b5b56c`; les mateixes 10 identitats noves heretades |
| frontissa | 15/15 amb l'empremta `legal` aprovada |
| SEO, QA-01 | 58/58 a l'arbre viu, i el test nou falla amb el prerender vell |
| Revisió adversarial final | 9 confirmades, totes corregides i verificades amb mutants; 1 refutada (S-03, que ja passava a la base) |
| Paquet de WordPress.org | 83/83 proves de l'enxufe; 388 mitjans sondats a l'origen |
| Arrel del repositori | neta; les dues carpetes `./~` de Chrome són a la quarantena |


<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Migracions:** `2610282100` (P1-68) i `2610281730` (P1-13) **no estan aplicades**. Les aplica el Mestre.
  - En aplicar `2610282100`, la llista d'identitats fundacionals s'omple DESPRÉS de la migració.
  - Si SDP-USER-022 avorta, cal revisar les polítiques o vistes que nomene.
- **Desplegament:** cap. Producció continua a la versió del 261023, amb les 10 fotos d'identitat amb GPS.
- **No verificat en aparells reals:**
  - la Càmera i `prompt()` d'Android;
  - el pas Compartir d'iOS 26;
  - el doble toc a iOS;
  - el reajustament visual a més de 1.870 px d'amplada (l'ha mesurat el verificador, no una persona).
- **Decisions de producte per confirmar:**
  - els textos «Afegeix» i «Arxiu» (P1-69);
  - el botó Proposa Card només amb icona en ample i, en compacte, dins d'«Aa»;
  - les notes connectades sense Proposa Card;
  - els 16 px al menú de la bombolla;
  - la proposta de l'@usuari al peu de la fitxa, que abans anava damunt;
  - la regla de còpia de les arrels de la plataforma (`veina` per a «Mestre» o «Rentonar» sols);
  - els codis SDP-USER-006 i 007;
  - els 10 intents per hora.
- **Plugin Check** no s'ha pogut executar (no hi ha `php` ni `wp-cli`). Cal demanar l'slug `socdepoble` en l'alta.
- **Deute que queda:**
  - el crèdit de Noto Sans al readme;
  - `section.xat.adjunts.tria`, que ja no s'usa;
  - `tanca()` de la compartició, que no està connectat;
  - `tallaSessio` a iOS;
  - la franja de l'amplada mitjana de la barra de Notes (672 a 776 px);
  - Map-4: el mapa amb còpies del món a l'antimeridià.
- **P1-12:** disseny i decisions fets; implementació pendent. Cap fil s'activarà sense el Mestre.
- **Arbre compartit:** les altres mans (Codex, Gemini i MarIA) poden haver mogut documents; només s'ha confirmat el que nomena la llista del commit.


<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]

## Relleu d'emergència (quota) · 2026-10-29

Torn actiu: `torn_74bad4b9-c817-4dca-96b8-eb6ff86a0da4` (obert; `tancament --check` només marca la zona humana). HEAD `e36606db2` (pujat). Workflow de correccions `w0479j1zp` **aturat a mitges pel stop**: res verificat, res commitejat.
- **QA-H01** (`src/sections/profile/PerfilContext.jsx`): estat git `M`, marca QA-H01 al fitxer: sí. Treball del carril a `/private/tmp/claude-501/-Users-javillinares-Documents-Antigravity-Som-de-Poble/7ebf4042-85af-4144-ae3d-043fc0c93e7e/scratchpad/lane_qah01_perfil/`.
- **QA-H02** (`supabase/migrations/2610282100_usuari_i_poble_canonic.sql`): estat git `M`, marca QA-H02: sí. Carril a `/private/tmp/claude-501/-Users-javillinares-Documents-Antigravity-Som-de-Poble/7ebf4042-85af-4144-ae3d-043fc0c93e7e/scratchpad/lane_qah02_migracio/`.
- **QA-H04** (governança, mai a l'arbre viu): fitxers preparats a `/private/tmp/claude-501/-Users-javillinares-Documents-Antigravity-Som-de-Poble/7ebf4042-85af-4144-ae3d-043fc0c93e7e/scratchpad/lane_qah04_og/governanca`: package.json, tooling/tests/node-suite-manifest.json, tooling/seo/projeccio-publica.test.mjs, tooling/seo/prerender-social.test.mjs, tooling/seo/build-social-manifest.mjs, tooling/seo/build-social-manifest.test.mjs, tooling/seo/prerender-social.mjs, tooling/seo/projeccio-publica.mjs. Cal aplicar-los amb l'executor (recepta `eines/governanca_qa01.mjs`).
- **QA-E07/QA-S01..S06** (disseny P1-12): §21 present: no; marca QA-S06: sí. Pendents la crítica, la correcció i la verificació.
- **Fase 1 de P1-12** (sense consumidors, NO verificada): xifratXatCripto.js=sí · xifratXatCripto.seguretat.test.js=sí · xifratXatFormats.js=sí · xifratXatFormats.seguretat.test.js=sí · xifratXatMagatzem.js=sí · xifratXatMagatzem.seguretat.test.js=sí · idbFalsEstructurat.js=sí. Paraules, Recuperació i Protocol encara no existixen.
- **Següent compte de Claude, en ordre:** (1) llegir els carrils de dalt i completar/verificar QA-H01, QA-H02 i QA-H04 (aquest per l'executor); (2) bateria a una còpia exacta (`cd3b5b56c..`, recepta `integracio/bateria.sh` de l'scratch vell `21a81070…`); (3) commit de tancament per índex temporal (`integracio/commit_h.sh`), sense els fitxers `xifratXat*` ni `wikiManifest.js`; (4) rebuild de `socdepoble.zip` + còpia datada (`wp_build/construix.sh` sobre `git archive` del commit nou); (5) avisar el Mestre per pujar-lo, i recordar que producció servix les fotos amb GPS fins al desplegament (previsualització `bloc-h-e36606db2` pendent de verificar); (6) P1-12 Fase 2: verificar els fitxers de la Fase 1 (tots set existixen, cap no està revisat ni verificat) i continuar pels passos 4, 5 i 7 de §16.
- No s'ha esborrat ni mogut res. Cap migració aplicada, cap desplegament a producció.
