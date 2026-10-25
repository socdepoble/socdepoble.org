---
type: informe
status: esborrany
description: Implementació de la Tasca 1 de P1-11, la llibertat multiformat IDEA-20 i la correcció C11-02, amb proves i límits.
tags:
  - auditoria
visibility: private
reflex: sdp:torn_08793431-2505-4da7-8248-15e373802748:13c4539c-7473-4f7b-bd5c-1485d980208b
---
# Implementació Claude · P1-11, IDEA-20 i C11-02

**Dictamen: tot el full de ruta del Mestre de les 23:15 està implementat al codi, amb proves i amb una revisió adversarial ja aplicada. Hi ha commit: `47eb2fa00`, decidit pel Mestre al xat.** Cobrix la Tasca 1 de P1-11, la llibertat multiformat IDEA-20, la vista de membres T5B-03 i la correcció C11-02. El commit `47eb2fa005bc20025723a6ca8a765fdb8b328617` (arbre `b957185c`) va sobre `d7aa77350`, a `backup-notes-publish`. No s'ha fet cap push. La migració nova **NO està aplicada**. Res no s'ha verificat en un navegador real. `npm run test:precommit` passa: 19,98 s i 26,6 s en les dues últimes execucions.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_08793431-2505-4da7-8248-15e373802748:13c4539c-7473-4f7b-bd5c-1485d980208b |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-24T21:31:26.447Z |
| Modificació | 2026-10-24T21:56:00Z |
| Propietari | Claude (torn `torn_08793431-2505-4da7-8248-15e373802748`, abast `code`) |
| Aprovació humana | Pla 2230 aprovat pel Mestre (àudios 22:29 i 22:47); full de ruta de consens passat al xat a les 23:15. No implica aprovació de commit, migració ni desplegament. |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (constructor), amb 2 workflows de subagents Claude: 2 implementadors en paral·lel i 8 revisors adversarials |
| Tokens consumits | Subagents: ~0,58 M (implementació) + ~1,37 M (revisió). El fil principal no exposa el recompte. |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

La seqüència ha sigut torn propi `torn_08793431` (obert amb `obrir_torn.mjs --actor claude --scope code`), després `document.mjs context` i `create` de la ruta `auditoria`, i el pla 2230 vinculat amb `document.mjs plan`. L'Olivera surt amb 0. Claude no escriu `.agents/` (ESTAT, LEDGER): el relleu d'ESTAT i del LEDGER és de MarIA.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- **2026-10-24T21:31:26Z.** Esborrany creat des de la plantilla viva.
- **2026-10-24T21:56:00Z.** Informe complet: implementació, revisió adversarial de 4 lents amb verificació escèptica, 8 correccions aplicades i verificació.
- **2026-10-24T22:27:19Z.** Commit `47eb2fa00`, per decisió del Mestre al xat, amb `--no-verify`, índex temporal i llista explícita dels 70 camins. Abans s'ha assajat l'arbre exacte `b957185c` en una còpia congelada amb el seu propi git: Vitest sencer 1.270 fitxers i 21.889 proves en verd, 0 fallades; `test:node` 1.023 en verd, 0 fallades; `lint` codi 0; `test:precommit` 152/2.959 + 259 Node, 0 fallades, 29,5 s. No s'ha fet cap push.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

**Fonts llegides senceres abans d'actuar:**
- `AGENTS.md` i `02_genotip.md`;
- el prompt i el pla 2230, rellegits del disc;
- `261024_2254_auditoria_codex.md` i `261024_2230_auditoria_gemini.md`;
- les files P1-11, IDEA-20 i P1-13 del Llibre Mestre;
- les skills `sdp-pedra-seca`, `sdp-estudi-mercat`, `sdp-workflow` i `wiki-documentacio-i-reflex`;
- les reserves T5b de `261024_1945_auditoria_codex`.

Allà on el full de ruta de consens de les 23:15 divergix de la Tasca 1 original, mana el full de ruta. Les desviacions conscients són a «Decisions de l'executor».

### Correspondència amb el full de ruta del Mestre

| Punt del full de ruta | Estat al codi | On |
| --- | --- | --- |
| 1 · Multiformat de capçalera, 9 proporcions | FET (sense commit) | `enquadrament.js`: FORMATS amb `1:1`, `original`, `4:3`, `3:2`, `16:9`, `21:9`, `4:5`, `3:4` i `9:16`. `useEnquadramentImatge.jsx`: la capçalera del Perfil. `UniversalEditorShell.jsx`: la capçalera de les Notes. |
| 1 · Fora l'`exacta` 1200×1200 i costat llarg de 1200 | FET | `opcionsSortida` amb `sortida.costatLlarg` (precedència exacta > costatLlarg > ampladaMaxima). 16:9 → 1200×675; 9:16 → 675×1200; 21:9 → 1200×514; 1:1 → 1200×1200, com abans. |
| 1 · Selector de Forma visible | FET, per una altra via (D-1) | `DialegEnquadrament.jsx`: el mode senzill pinta `<GrupOpcions llegenda="Forma">` quan hi ha més d'una forma. |
| 1 · Guarda `max-height: min(75vh, 720px)` | FET, només per a portades verticals (D-2) | `PageFrame.jsx` + `layout.css` (`hero-image--vertical`); `VisorDePublicacio.jsx` + `components.css` (la portada del detall del Mur). |
| 1 · La targeta es manté 1:1 | MANTINGUT, sense canvis | `.sp-card-media-container` intacte (D-3). |
| 2 · Filtre de poble a `listPublicOrganizations` | FET | Contracte (`poble?`), adaptador Supabase (`town_name=eq.` abans del límit), adaptador local i kit de conformitat. |
| 2 · Fora `.badge-row`/`.pill` i 2a pestanya | FET | `detailSectionMeta.jsx`, `sections/pobles/EntitatsDelPoble.jsx` i `useEntitatsDelPoble.js`. |
| 3 · Aparador públic d'actor | FET | `sections/profile/PublicacionsDeLaFitxa.jsx` i `usePublicacionsDeLaFitxa.js`; `usePublicacionsDelsAlies` a `usePublicacionsDeLActor.js`. |
| 4 · Puresa lèxica del Connectar i 5 diccionaris | FET | `BlocRelacio.jsx`, `useSeguiment.js`, `Seguidors.jsx`, `ConnectarSection.jsx`, `BlocFormarPart.jsx` i `src/config/idiomes/*.js`. |
| 5 · `GestioMembres` fora d'«El compte» sense duplicar | FET | Vista «Membres i connexions»: `perfilModel.js`, `PerfilShell.jsx`, `DetallCompte.jsx` (`lloc`) i `PerfilContext.jsx`. |
| 5 · `contacte_organitzacio` amb `m.user_id = v_uid` | FET, NO aplicada | `supabase/migrations/2610242320_correu_propietaria_nomes_titular.sql`. |
| `npm run test:precommit` < 30 s | VERD | Vegeu Verificació. |

En total són 60 fitxers modificats (+1.425/−498) i 10 de nous, tots dins de `src/` i `supabase/`, més este informe i el Llibre Mestre. No s'ha tocat `.agents/`, `tooling/`, `package.json` ni el lock.

### 1 · Pàgina del poble («Gent de [Poble]»)

- **Píndoles fora.** La `.badge-row` de la població i del nom del poble repetia el que ja diuen l'H1, la barra taronja i les etiquetes. Ara la barra de pestanyes va just després del botó blau. El lector del MAS tampoc no les pinta.
- **«Empreses i entitats».** És la 2a pestanya. Mostra les organitzacions públiques que declaren el poble amb la targeta del directori (`SectionItemCard`, la de `/perfil`): «Llegir més» porta a la fitxa pública, i hi ha el Connectar centralitzat i el botó gran «Anar al xat». Cap botó solt de seguir.
- **Cap petició si ningú no la mira.** El panell només es munta quan la persona obri la pestanya, i es queda muntat. Va en diferit (`lazyRoute`), amb la barrera de l'Onada 6. Les pestanyes es tornen a muntar per a cada poble (`key`).
- **Estats.** Carregant; `EstatErrorDades` amb «Torna-ho a provar»; buit amb `role=status`; i «Este servidor encara no llista les empreses i entitats dels pobles» quan no hi ha la capacitat o el servidor no sap el poble. Una fitxa sense nom no pregunta res: el filtre buit tornaria les entitats de tots els pobles.

### 2 · Filtre de poble al port (C11-01 i G2230-01)

- **Contracte.** La forma és `listPublicOrganizations({ consulta?, poble?, limit?, signal? })`. `poble` és el NOM, el valor que desa el selector a `organizations.town_name`. El filtre es retalla. El valor desat es compara tal qual, igual que fa el servidor amb `town_name=eq.`: ni de més ni de menys. Va documentat a `contracte.js`, amb funcions pures a `pobleOrganitzacio.js`.
- **Supabase.** `&town_name=eq.<nom codificat>` va abans de `order` i de `limit`: el tall a 500 ja no pot deixar fora les entitats del poble. Un nom de més de 120 caràcters (el CHECK de la columna) torna `[]` sense preguntar.
  - Si la vista no té `town_name`, la crida rebutja amb `code: 'NO-DISPONIBLE'` (C11-01: mai les entitats de tots els pobles, ni un buit mut). La vista ho diu sense cap reintent fals.
- **Local.** La mateixa regla, també abans del límit.
- **Defensa en profunditat.** El hook torna a filtrar cada fila. El kit de conformitat té un cas nou: per a un poble inexistent, cap fila d'un altre poble. El doble remot de `supabase/conformitat.test.js` emula `town_name=eq.`.
- **Homònims i variants.** La comparació és exacta: no es plega ni es fa bilingüe. G2230-01 proposava casar per `clauDelPoble`. Al servidor caldria un patró tolerant que pot portar entitats de pobles homònims. Queda per al Mestre (L-4).

### 3 · Aparador de la fitxa pública (C11-04 i G2230-02)

- **On va.** «El que publica {nom}» va al **peu de PageFrame** (`peuDePagina`, `section.sdp-pagina-peu` amb nom), **fora de l'article**: l'Índex, la traducció i el Lector no recullen les targetes. Té el seu h2 i tres pestanyes: Mur, Mercat i Agenda.
- **Què pinta.** Cada pestanya és `VistaPublicacionsDeLActor`, amb el DTO canònic `{ id, item, esdeveniment }`. Obri per la primera pestanya que té publicacions (un comerç que només ven obri pel Mercat), i després mana la tria de la persona.
  - Una IA no en porta. Fora del Mur de l'App, tampoc. En cap cas queda una regió buida.
- **Sense duplicar.** `usePublicacionsDeLActor` ara delega en `usePublicacionsDelsAlies(seccio, alies, { exclouId, actiu, tipusAutor })`. Els seus consumidors no canvien.
- **Àlies de la fitxa VISITADA (`aliesDeLaFitxa`).** Porta l'id de la fitxa. Per a les identitats del Mestre, hi afig els àlies de la llavor, reconeguts per l'id, per l'id remot declarat o pel registre de l'entitat del projecte (`registraEntitatDelProjecte`, el mateix en què confien `esElProjecte` i `rutaDAutoria`). Mai pel slug: una organització amb el slug «socdepoble» no s'emporta les publicacions del projecte (el mateix risc que F6, 261019).
  - `tipusAutor` evita que es barregen una persona i una entitat amb el mateix id.
- **Textos honestos.** El buit diu «{nom} no té cap publicació recent al Mur d'este poble»: és la finestra de 50 publicacions per secció del poble actiu, no l'historial. El títol no porta «de» davant del nom, així que no ix cap «de Anna».

### 4 · Puresa lèxica del Connectar (G2230-03 i G1945-04)

- **Abast.** 32 claus canviades en les cinc llengües, amb les reserves del codi byte a byte iguals a `ca.js`. Cap clau afegida ni esborrada. El model del port no canvia: continua sent un seguiment d'un sol sentit.
- **El vocabulari nou:**
  - «Connectar amb {nom}» i «Connectat amb {nom}.»;
  - «Deixar la connexió amb {nom}» i «T'has connectat amb {nom}…»;
  - «Veïnat connectat amb tu» i «Veïnat connectat amb {nom}».
- **L'avís que rep l'altra banda.** Ara diu «Connexió nova: m'he connectat amb tu a Sóc de Poble.».
- **L'entradeta de `/connectar`.** Abans deia «Si guardes la connexió en privat…»; ara nomena l'element: «Si guardes l'element a les teues notes en privat…». Amb el vocabulari nou, «la connexió» es confonia amb la relació entre persones, que sempre avisa.
- **Superfície declarada.** `/connectar` (BlocRelacio, useSeguiment, ConnectarSection i BlocFormarPart) i les dues llistes de connexions (Seguidors). Els comentaris que citaven els rètols vells també estan al dia.

### 5 · «Membres i connexions» (T5B-03 i G2230-04)

- **La vista.** Una organització porta, just després d'«El compte», la vista «Membres i connexions» (👥).
  - És el mateix `DetallCompte` amb `lloc="membres"`: les mateixes accions de membres, la mateixa barra taronja i la mateixa data, sense cap còpia.
  - `GestioMembres` ja inclou `QuiSegueixOrganitzacio`, de manera que hi ha una sola llista.
  - «Eixir» es queda al compte.
- **El text.** El lead apostrofa davant de vocal (`deNom`, que ara és a `fitxaDePerfil.js` i també el llig `DetallMultimedia.jsx`). El subtítol d'«El compte» d'una organització diu ara «Correu, identificador i eixida».

### 6 · C11-02 · El correu d'accés de la propietària, només per a ella

- **La migració.** `2610242320` torna a crear `public.contacte_organitzacio` amb el mateix contracte i una sola condició més: `and m.user_id = v_uid`.
  - Una prova estàtica comprova que la definició és la de 2610181915 byte a byte, llevat d'eixa condició.
  - `desa_contacte_organitzacio` crida la funció i hereta la correcció.
  - Cap columna, política ni permís nou.
- **El client ja ho esperava.** El seu contracte ja deia «`perDefecte.correu` només ve ple si qui mira n'és la titular» (`contacteOrganitzacio.js`), i el model local ja ho feia.
- **Catàleg.** Entrada a `supabase/README.md` com a «NO aplicada». `organitzacionsCorreu.migracio.test.js` l'admet com a tercer fitxer, però només si `contact_email` hi apareix dins del cos de la funció.

### Revisió adversarial i correccions aplicades

Un workflow de quatre lents independents ha revisat el diff sencer:
- dades i seguretat;
- lògica i UI;
- multiformat;
- vocabulari i i18n.

Un escèptic per lent ha intentat refutar cada troballa. De 12 troballes, n'ha **confirmat 9** (cap d'alta, dues de mitjana) i n'ha **refutat 3**. Cap troballa no afecta la migració C11-02: un revisor n'ha comparat els cossos amb `diff`.

| Troballa confirmada | Severitat | Correcció |
| --- | --- | --- |
| L'aparador anava dins de l'`<article>`: l'Índex llistava targetes de pestanyes amagades i el Traductor l'aplanava | mitjana | Mogut a `peuDePagina`, sense regió buida. Una prova comprova que no és descendent de l'article. |
| La guarda vertical no arribava a la portada del detall del Mur (ranura `heroComponent`) | mitjana | La mateixa detecció a `VisorDePublicacio`. La guarda `min(75vh, 720px)` és a `components.css`. Prova nova. |
| «Enquadrar» una capçalera ja desada obria en «Quadrat» i la retallava sense remei | baixa | Una adreça existent obri en «Original» (Notes i Perfil); una foto nova continua en quadrat. La prova antiga, que fixava el retall, s'ha actualitzat a posta. |
| En remot, la fitxa del projecte (UUID) no portava les pàgines del sistema | baixa | `aliesDeLaFitxa` reconeix l'id registrat del projecte i es recalcula quan arriba. |
| Paritat local/remot: el local retallava el valor desat, el servidor no | baixa | Una sola semàntica, la del servidor. Prova local invertida. |
| L'entradeta de `/connectar` deia «la connexió» en privat | baixa | Ara nomena l'element, en les 5 llengües. |
| «Publicacions de {nom}» sense apostrofar davant de vocal | baixa | «El que publica {nom}» i `deNom` al lead de membres. |
| El buit de l'aparador afirmava l'historial sencer | baixa | Ara diu «recent» i «d'este poble», en les 5 llengües. |
| La vertical es decidix en l'esdeveniment `load` (salt de maquetació) | baixa | **NO corregit**: cal desar l'amplada i l'alçada de la capçalera. Queda com a L-6. |

Les tres troballes refutades:
- **El kit i el NO-DISPONIBLE.** És la convenció del kit en totes les capacitats: certifica contra l'esquema actual.
- **Cap guarda automàtica del vocabulari.** La cobrixen les proves de textos.
- **Les ajudes repetides de la «Forma».** El nom accessible queda dins del patró de `.sdp-casella`.

### Decisions de l'executor (reversibles, per al Mestre)

- **D-1 · La «Forma» dins del mode senzill, no `senzill: false`.** El full de ruta demanava passar la capçalera al mode T46 «perquè mostre el selector de Forma». El selector es mostra, dins de la finestra senzilla que el Mestre va ordenar per a les imatges del Perfil (Onada 4, 261008).
  - Amb una sola forma (avatar i logotip), el DOM és el d'abans.
  - La llista usa `.sdp-casella`, amb `min-height: var(--sdp-touch-min)`: 44 px per opció i cap scroll horitzontal (C.1 de Gemini).
  - Si el Mestre vol el T46 sencer (lliscadors de posició, «Desar l'enquadrament»), és una línia a `configDeForma`.
- **D-2 · La guarda vertical, només per a les portades verticals.** `max-height` i `object-fit: contain` a tota `.hero-image img` haurien posat bandes a les portades quadrades de 1200×1200 en escriptori (Llei del Píxel). Les verticals conserven la proporció amb `width: auto` i `margin-inline: auto`.
- **D-3 · La targeta, intacta.** Gemini proposa passar d'`object-position: top` a `center`, però això canviaria el retall de totes les targetes existents. Amb el `top` d'ara, una panoràmica ja ix centrada en horitzontal; només les verticals ixen ancorades dalt, i així es protegixen les cares. Ho ha de decidir el Mestre.
- **D-4 · Ajudes pròpies a la capçalera del Perfil.** Les ajudes de les Notes («Si la nota ja és al Mur…») no hi escauen. Les noves diuen: «Recomanat: la fitxa i la seua targeta ensenyen la mateixa imatge sencera.» i «A la fitxa es veu sencera, amb esta forma; a les targetes es retalla en quadrat.».
- **D-5 · Com es desfà una connexió.** El prompt no donava cap substitut per a «Deixar de seguir». S'ha triat «Deixar la connexió amb {nom}»; en anglés, «End the connection with {nom}».

### Retroalimentació sobre la plantilla del prompt

El prompt 2230 i el full de ruta posterior divergien en tres punts:
- la llista de formats: sis o nou;
- `senzill: false`;
- la guarda CSS: general o només per a les verticals.

Codex ja ho advertia. Proposta per a `prompt_local`: una secció «Criteri de fet» amb el resultat observable (p. ex., «la persona veu i tria la forma; un 16:9 ix a 1200×675»), separada del «com» suggerit. Així l'executor pot complir el resultat sense trencar una ordre anterior del Mestre, i ho declara.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Totes les ordres s'han executat des de `socdepoble.org`. No s'ha instal·lat res.

| Verificació | Resultat |
| --- | --- |
| `npm run test:precommit` (1a, abans de la revisió) | Codi 0: 152 fitxers, 2.959 Vitest i 259 Node; **23,9 s** de rellotge, amb 8 revisors en paral·lel. |
| `npm run test:precommit` (2a, després de les correccions) | Codi 0: 152 fitxers, 2.959 Vitest i 259 Node; **19,98 s** de rellotge. |
| Suite Vitest sencera (1a, abans de les correccions) | 1.266 fitxers en verd i 2 en roig; 21.884 proves en verd i 3 en roig (100 omeses); 699 s. Les 3 fallades no són d'este torn (vegeu L-1). |
| Suite Vitest sencera (2a, després de les correccions) | 1.267 fitxers en verd i 3 en roig; 21.891 proves en verd i 4 en roig; 541 s. Tres són les de L-1. La quarta era meua: `qualitat.visor.test.js` prohibix unitats de viewport dins del bloc VISOR D'IMATGES, i la guarda vertical de `VisorDePublicacio` hi havia anat a parar. S'ha corregit traient-la a un bloc `@layer components` propi («PORTADA VERTICAL»). |
| Repetició després d'eixa correcció: `src/components`, `src/sections/detail`, `src/sections/multimedia` i `App.appsLocals` | 265 fitxers en verd i 2 en roig; 3.505 proves en verd. Les 3 en roig són les heretades de L-1. |
| `npm run test:precommit` (3a, final) | Codi 0: 152 fitxers, 2.959 Vitest i 259 Node; **26,6 s** de rellotge. |
| ESLint `--max-warnings=0` sobre `src/components/universal`, `src/sections/{profile,pobles,detail,mur,connectar}`, `src/data` i `src/config/idiomes` | Codi 0. |
| Proves dirigides (port, kit, pobles, perfil, detall, enquadrament, CSS, i18n) | Totes en verd: profile 65 fitxers/883; pobles 9/139; detail i CSS 52/767; enquadrament i editors 18/473; i18n 5/295. |
| `node tooling/gates/porta-olivera.mjs` | Codi 0. |
| `node tooling/gates/tancament.mjs --check --turn-id torn_08793431-…` | Codi 1, estat `planned`. Passen Olivera, plantilles, autoritat, segell, skills i documental-tests; fallen LEDGER, Wiki i SCC (deute heretat, el mateix que registra Codex). Abans de completar este informe, els únics 5 errors propis eren les seues seccions pendents. |

Proves noves:
- `EntitatsDelPoble.test.jsx`;
- `PublicacionsDeLaFitxa.test.jsx`;
- `PerfilPublicSection.aparador.test.jsx`;
- `VisorDePublicacio.vertical.test.jsx`;
- `correuPropietaria.migracio.test.js`;
- casos nous a `organizations.directori`, `localPerfils.directori`, `pobleOrganitzacio`, `DetallCompte`, `UniversalEditorShell.enquadrament`, `useImatgeDeFitxa`, `DialegEnquadrament.senzill`, `enquadrament` i `PageFrame.hero`.

Totes les proves que fixaven el comportament antic s'han actualitzat a posta, amb el comentari «Expectativa actualitzada a propòsit: P1-11…» o «Actualitzada a posta (IDEA-20…)».

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **L-1 · Tres fallades fora d'este torn.**
  - `censImatges.test.js` (2) fallen pels fitxers sense seguiment `public/assets/fotos/iaia_maria_avatar_mobil.png/.webp`, d'una altra mà.
  - `App.appsLocals.test.jsx › /app/lector … mode remote` falla perquè el Lector, en remot i sense sessió, crida `functions/v1/noticies/fonts`. **Reproduït també en una còpia neta de HEAD `d7aa77350`** amb qualsevol URL de servidor; només passa sense cap servidor configurat. No toque `src/apps`.
- **L-2 · Res verificat en un navegador.** Falten la finestra del retall amb 9 formes (mòbil i escriptori), la portada vertical, la pestanya «Empreses i entitats» i l'aparador. Tot està comprovat amb jsdom i amb la lectura del CSS. Cal mirar-ho en Safari 16 i Chrome abans de desplegar.
- **L-3 · La migració `2610242320` NO està aplicada: l'aplica el Mestre.** No s'ha executat contra cap PostgreSQL. La verificació posterior, amb una propietària i una administradora de prova, és a la capçalera del fitxer i a `supabase/README.md`.
- **L-4 · Decisions del Mestre.**
  - Casar les entitats per un nom tolerant (bilingüe o sense accents) o exacte, com ara.
  - El `object-position` de la targeta (D-3).
  - El T46 sencer per a la capçalera (D-1).
  - El verb de desfer la connexió (D-5).
- **L-5 · Textos amb «seguir» fora de la superfície.**
  - `legalContent.js` (bloqueig, dades, retenció i «qui veu què») i `DetallPrivacitat.jsx:114-115` són textos legals i de privacitat: canviar-los demana decisió i revisió legal.
  - Els missatges del contracte i del servidor (`MISSATGES_SEGUIMENTS`, SDP-SEG-* a 2610241430) no arriben a la gent (R3-12).
  - `SnippetCurador.jsx:112` és el Lector RSS, no una relació entre persones.
- **L-6 · El salt de maquetació de la portada vertical.** Sense mida declarada, la classe vertical arriba en l'esdeveniment `load`: la portada salta una vegada. El remei net és desar l'amplada i l'alçada de la capçalera en pujar-la i passar-les com a `heroWidth`/`heroHeight`. El diàleg ja les coneix.
- **L-7 · Pendent de P1-13.** C11-03 (la carrera de l'alta concurrent de membres) i C11-05 (la projecció pública del contacte) continuen oberts.
- **L-8 · L'aparador és una finestra.** En remot, porta les 50 darreres publicacions de cada secció del poble actiu, no l'historial sencer. Els textos ja no ho amaguen.
- **L-9 · Traduccions.** Les noves (es, en, eu i gl) les ha fetes una IA. Convé que les revise algú nadiu de cada llengua, sobretot el basc («konektatutako auzokideak», «Argitaratzen duena: {nom}»).
- **L-10 · Tancament.** El codi és al commit `47eb2fa00`, sense push. Sense commit, i per al commit de documents de MarIA, queden la Wiki (este informe, el Llibre i l'índex), `.agents/` (ESTAT i LEDGER, que són de MarIA) i les imatges `iaia_maria_avatar_mobil.*`, d'una altra mà. El hook no ha corregut (`--no-verify`, decisió del Mestre). L'error del post-commit `consume-commit` («active.json ENOENT») és el conegut i no té efecte.
- **Recursos.** Cap cron ni schedule creat. Els dos workflows (10 agents) han acabat, i no queda cap procés en segon pla d'este torn quan s'emet este informe.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[03_llibre_mestre_tasques_i_idees]]
- [[261024_2230_pla_implementacio_logica_actors_i_disseny_interior_pedra_seca]]
- [[261024_2230_prompt_claude_gemini_codex_logica_actors_i_disseny_interior_pedra_seca]]
- [[261024_2254_auditoria_codex]]
- [[261024_2230_auditoria_gemini]]
