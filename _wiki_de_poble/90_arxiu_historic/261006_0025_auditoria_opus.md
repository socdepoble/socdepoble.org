---
type: informe
status: esborrany
description: Autòpsia de les àncores fantasma i de la porta Olivera, prova de useSession, neteja de la Consola i enxufabilitat Sollutia, amb evidència ruta:línia
tags:
  - auditoria
visibility: private
reflex: sdp:torn_f2623861-1b6f-4706-be9d-aca31fa164f8:80d41212-4520-49e1-9f93-c9c161c8c7a2
---
# Auditoria Opus 5.5 Ultracode

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_f2623861-1b6f-4706-be9d-aca31fa164f8:80d41212-4520-49e1-9f93-c9c161c8c7a2 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-05T22:24:50.255Z |
| Modificació | 2026-10-06T00:35:00.000Z (aproximada: el hook bloqueja `date`; datada amb `ls -lT`) |
| Propietari | opus |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5) via Claude Code en mode ultracode, amb 31 subagents del mateix model en tres workflows (autòpsia 16, implementació 9, remat 6) |
| Tokens consumits | Sense comptador de cost. Comptadors dels workflows: 5,28 M + 2,82 M + 1,02 M = 9,12 M tokens de subagents, més el fil principal |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

- 2026-10-05T22:21:53Z: torn `torn_f2623861` obert (actor opus, abast code). Lectura del prompt 261005_1303, del pla, de l'auditoria de Fable, de l'Acta 261005_1236 i del codi de la porta, de l'executor i de les polítiques del hook.
- 2026-10-05T22:24:50Z: esborrany creat amb `document.mjs context` → `create`.
- 22:24Z-22:54Z: workflow d'autòpsia, huit lents (tres sobre les àncores: escriptors, jutge i evidència; porta Olivera; useSession; Consola; enxufabilitat; commit i segell), cadascuna seguida d'un escèptic que l'ha refutada troballa a troballa. Una refutada sencera (ANC-E4), la majoria corregides en part.
- 22:57Z: higiene de l'índex de l'Escriptori («Activitat en curs» i «Vincles»).
- 22:56Z-00:02Z: workflow d'implementació (quatre fronts, revisió adversarial, correcció del laboratori Olivera).
- 23:0xZ: el Mestre decidix D1 = B1 (Consums) i que el crash el reproduirà ell al navegador.
- 00:06Z-00:23Z: workflow de remat (Consums B1, retocs de revisió).
- 00:24Z-00:30Z: verificació final; lectura dels documents nous de MarIA (261006_0224). Informe escrit sencer d'una tacada.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### 0. Resum per al Mestre (sense mentides belles)

1. **La porta Olivera diu la veritat; el que falla és tot el que mou documents fora d'ella.** Les quatre denegacions explícites «Àncores a documents absents» del registre d'Antigravity apunten a fitxers que de veres no hi eren: zero falsos positius de l'analitzador. La recurrència ve de trasllats i reanomenats a mà, que l'eina obliga a fer perquè no sap fer el que MarIA necessita (§1). La reparació estructural és al laboratori `261006_0055_olivera_ancores_opus`, verificada (§2).
2. **El paquet 261002 de la porta Olivera ja no és aplicable**: deriva en sis fitxers respecte de HEAD i la seua prova peta en carregar (`commitCreation`). El paquet nou el substituïx; no s'ha de fer el rebase (§2.3).
3. **useSession**: prova d'integració escrita i verda (3/3). Dues mutacions demostren que caça el crash si existix. A HEAD, i en esta capa, el crash no naix. Ningú no l'ha reproduït mai al navegador: Fable no el va obrir, i el prompt ho afirmava malament (§3).
4. **Consola**: Crèdits i Consums retirats (B1, ordre del Mestre), orfes de zero píxels fora, tauler idèntic comprovat al navegador, 591 proves verdes (§4).
5. **Segell de skills**: verd (22b96726). El que està roig és el **catàleg**: les dues skills noves no tenen frontmatter canònic, `inventari()` llança i deixen `test:ci` roig a HEAD. El text exacte per a MarIA i el Mestre és a §5.
6. **Enxufabilitat**: el bloquejant de veres és doctrinal: «Model B» té tres significats incompatibles (P0). He fet les reparacions de zero píxels i el **kit de conformitat del port** (28 casos) que Sollutia pot omplir demà (§6).
7. **Urgent hui**: tres torns del 5-10 caduquen a les **11:52, 12:10 i 13:01** (hora local). MarIA pot registrar-ne els relleus amb les ordres de §7.1. Claude no pot: `command-policy` no admet `handoff`.
8. **Concurrència**: MarIA ha treballat alhora a `src/`, `AGENTS.md`, el pla 1303 i l'índex. El pla de commit separa el que és d'este torn del que no ho és (§7.2 i §8). La petorreta 261006_0224 sobre el LEDGER no l'he executada (§8.2).

Totes les troballes d'ací avall han passat per una refutació adversarial separada. Quan l'escèptic ha corregit l'investigador, mana la versió corregida.

### 1. T3 · Autòpsia de les àncores fantasma

#### 1.1 Sentència

El jutge (`tooling/gates/porta-olivera.mjs:196-212`, `ancoratge()`) compleix la definició d'AGENTS §0.1: «cap àncora plana a un document absent». Les àncores fantasma naixen de cinc camins que **mouen, reanomenen o esborren documents sense passar per cap eina que despenge o reapunte l'àncora**. MarIA els fa servir perquè l'eina canònica no cobrix el seu cas, i el hook els pregunta però no els repara.

#### 1.2 Causes, ordenades per freqüència amb evidència

**A1 · Trasllat a mà perquè `--arxiva` no pot (P1).** 30 avisos «Trasllat a mà» al registre; 17 passen la taula de neta a bruta (`.agents/runtime/antigravity-hook.log`, grep -A1). L'eina no cobrix:
- categories fora de `TRANSITORIES` (`porta-olivera.mjs:71`, `:349-351`); un sol nom dolent atura el lot (prova `[DEFECTE D1+D2]`, `tests/porta-olivera-diagnosi.test.mjs:54-95`, verda hui);
- artefactes no Markdown, perquè `inventari` usa `NOM` amb `.md` (`:73`) i `--nom` força el sufix `.md` (`:346`), mentre la taula exigix àncora a qualsevol extensió (`:91-97`);
- subcarpeta de sessió (`:361`);
- documents del mateix dia sense `--nom` (`:140`).

L'impacte varia per sessió: a la Marató 91 de 102 artefactes eren fora d'abast (90 `produccio_*` no Markdown i 1 `avaluacio`, comptats amb `ls`). Fable en comptava 90. El 261001 tot entrava a `--nom` i només faltava la carpeta de sessió. La porta no obliga a moure eixos artefactes, només a ancorar-los; el trasllat el demana la doctrina («arxiva la resta», AGENTS §0.1), que no nomena cap forma substituta per a estos casos.

**A2 · Reanomenat a mà per un parany de nom (P1).**
- `deliverContext` només valida la forma del nom (`tooling/documental/turns.mjs:171`) i `create` ancora `[[nom]]` (`tooling/documental/draft-write.mjs:114-116`).
- La Plantilla viva assigna `pla_*` a la ruta `planificacio` (`tooling/gates/porta-plantilla-viva.mjs:65`) i denega l'edició amb «el nom demana planificacio» (`:164`). És un id de ruta que es llig com a prefix i que va induir el reanomenat a `planificacio_*`, que `vigilat()` no vigila.
- Tres denegacions al registre (línies 906, 2330 i 4741) i el cas del 261005 (`261005_1303_pla_opus` → `pla_implementacio_opus`, torn `torn_6f2b5c7d`, rebuts a les línies 2692-2738).
- El circuit no té cap ordre de reanomenat (`tooling/documental/command-policy.mjs:78-79`).

**A3 · El relleu no toca l'índex (P1).**
- `handoffDocument` registra el moviment i mai llig ni escriu l'índex (`turns.mjs:306-338`).
- `checkTurn` exigix aleshores una àncora amb camí al destí (`turns.mjs:246-247`, `:276`), que cap eina escriu. La forma curta d'Obsidian `[[x]]` és fantasma per a la porta i invàlida per a `core.anchored` (`tooling/documental/core.mjs:158-161`).
- És la prova `[DEFECTE D7 parcial]`, verda hui.

**A4 · No hi ha cap via de reparació (P2).**
- `arxiva()` només despenja el que acaba de moure (`porta-olivera.mjs:382`).
- La reparació es fa editant l'índex amb l'eina (171 escriptures permeses al registre, cap amb comprovació d'àncores: `antigravity-hook.mjs:256-260`, `turns.mjs:196`), per redirecció de shell (registre:56) o amb scripts.
- `fix_anchors.mjs`, a l'arrel i versionat, afig una capçalera nova «## Fix Automàtic d'Àncores» a cada execució (`fix_anchors.mjs:16-23`). És l'autor del bloc de 85 àncores de l'índex. Corregix Fable 261005_1211 §1.3, que deia que cap script l'escrivia.

**A5 · El hook pregunta, però no repara ni traça (P1).**
- Fins al 261004 l'`ask` s'aprovava sol per la memòria cau «Always Allow» del contracte de l'IDE. Les latències van de 67 a 317 ms (registre:3666-3668), massa curtes per a un clic humà.
- Des del 261005 és `force_ask`, i almenys 3 dels 4 trasllats preguntats s'han executat.
- La regex destructiva (`antigravity-hook.mjs:206`) no veu `find -delete`, `rsync`, `sed -i` ni els scripts en fitxer.
- La traça no guarda l'ordre de shell (`:385-392`), i per això no es pot fer forense de cap trasllat.

**Refutat (ANC-E4):** l'hipòtesi de «quatre documents perduts» no aguanta. Eren reanomenats; els documents resultants són a l'arxiu.

#### 1.3 Divergències latents entre jutges (cap no ha causat fantasmes registrats)

- **ANC-01.** Una àncora plana sempre es jutja contra el primer nivell (`porta-olivera.mjs:181-187`), però Obsidian resol pel nom a tot el vault (format «shortest» per defecte; `.obsidian/app.json` no el canvia). És el contracte d'AGENTS §0.1. El defecte real és que el missatge (`:248`) no diu el remei.
- **ANC-02.** F9 exigix un vincle a «## Vincles» de l'índex, que era buit. `[[00_index]]` hi seria fantasma. **Resolt ara** amb `- [[../00_index]]`, que satisfà F9, Olivera i SCC.
- **ANC-03.** `[[x.jpg]]` al primer nivell és verd a Olivera i trencat a SCC, Orfandat i Llaurador (`tooling/gates/verificador-scc.mjs:37`, `:257-258`; `tooling/lib/document-links.mjs:20-30`).
- **ANC-05.** Els enllaços Markdown `[t](x.md)` ancoren per a SCC (fixture de `tests/verificador-scc.test.mjs:18-19`) i no per a Olivera ni per a core.
- **ANC-04, 09, 11-14.** Àlies escapat `\|` a document-links; caixa, NFC i U+202F; noms amb punts; màscara de codi que travessa paràgrafs; `%%…%%`; un `[[` sense tancar s'empassa la línia següent (regex `porta-olivera.mjs:123`, `:199`).

#### 1.4 Cicatrius de l'índex

- **ANC-W6.** `anchorDraft` insereix una línia en blanc per cada àncora (`draft-write.mjs:90`) i `arxiva` només lleva l'àncora. D'ací ve l'acumulació: 252 línies buides de 660.
- **ANC-W7.** Els duplicats `[[x]]`/`[[x.md]]` es detecten per text literal (`draft-write.mjs:89`).
- **Higiene feta en este torn:** una sola àncora per document a «Activitat en curs», sense blancs, i `[[../00_index]]` a «Vincles». La porta continua eixint amb 0.

#### 1.5 Remei lliurat

El paquet de §2 cobrix A1, A2 (simptomàticament, amb `--renomena`), A3 i A4, i les cicatrius W6 i W7. Queden fora (són de MarIA o del Mestre, en paquets propis):
- el contrast nom↔ruta a `deliverContext` i el text de la Plantilla viva;
- els verbs i la traça del hook d'Antigravity;
- el bloc «Fix Automàtic» i `fix_anchors.mjs` (decisió humana).

### 2. T2 · Porta Olivera: `produccio`, `avaluacio` i artefactes

#### 2.1 Confirmat a HEAD

- **C1.** Confirmat a HEAD. Una prova primària fixa el límit: `tests/cognitive-preflight.test.mjs:215`.
- **C1b.** Les quatre categories `macro_` i `micro_` de `TRANSITORIES` són lletra morta, perquè la categoria és el primer token (`porta-olivera.mjs:106`).
- **TAX.** La taxonomia té 19 categories (`tooling/wiki/taxonomia.json:14-34`). `avaluacio` no hi és, i `porta-taxonomia --staged` del pre-commit faria caure `avaluacio` (T3) i les dobles extensions (T1, `porta-taxonomia.mjs:42`).
- **C2 i C3.** Confirmats: la frontera és la mitjanit (`:140`) i no es llig mai `10_actes`; el destí és sempre l'arrel de l'arxiu.
- **T2-ANC.** El despenjat resol amb una regla diferent d'`ancoratge()` (`:382`, `:386` contra `:199`, `:205`) i s'emporta àncores d'homònims.
- **T2-LOT.** Un `renameSync` que falla a mitjan lot deixa fantasmes (`:370-376`).

#### 2.2 Paquet nou `02_investigacio_ia/261006_0055_olivera_ancores_opus`

Codi complet a `nous/` amb la ruta real, sense cap import nou (la diagnosi D6 en copia només la porta, `arrel` i `AGENTS`):
- arxivat per nom de qualsevol extensió, també doble i en majúscules, i de `produccio` i `avaluacio`;
- `categoriaDe` amb les categories compostes;
- `--sessio aammdd_Nom`;
- `--reapunta`;
- la línia amb camí a «## Arxivat amb la Porta Olivera» per als Markdown amb rebut de torn obert, que fa que el handoff deixe el torn tancable i inverteix la D7;
- despenjat amb la regla d'`ancoratge()`;
- trasllat per enllaç dur, sense trepitjar;
- índex escrit per temporal i rename, amb CAS i dins del lock de `draft-write`;
- remei per a cada fantasma (cerca només per nom, mai contingut);
- `--repara [--sec]`;
- `--renomena VELL --a NOU [--sec]`, que comprova abans de moure que el relleu és possible;
- àncores sense salts de línia;
- `anchorDraft` sense línia en blanc pròpia i amb duplicats per referent.

Ve amb `prepara-pla.mjs` (pla `sdp.mutation.v1` amb les BASES de HEAD i detecció de deriva) i `LLEGIU_PRIMER.txt` (ordre d'aplicació, decisions i límits).

**Verificació:** el corredor `tests/laboratori-olivera-261006.test.js` (Vitest) construïx dues còpies del repositori, passa 27 fitxers de proves a les dues i dona base 325 pass / 40 fail / 9 skip contra paquet 358 / 42 / 9. Les 35 proves noves passen totes i no hi ha cap regressió, amb una regla estricta en què skip→fail també compta. Les dues fallades de més són deriva declarada de `governanca-260930b-portes`, un laboratori superat amb preimatges congelades, i **requerixen l'acceptació explícita del Mestre**. ESLint dona zero missatges. Una revisió adversarial va trobar dos defectes importants (`--renomena` sense comprovar el torn; el handoff imprés deixava el torn sense àncora) i cinc menors; tots set estan corregits i tornats a provar.

#### 2.3 Per què no el 261002

Deriva demostrada:
- `turns.mjs` sense `commitCreation`, `failCreation` ni `activeReceipts` (la prova peta en carregar);
- la porta perd set mecanismes de HEAD;
- el hook perd tot el blindatge posterior;
- `core.anchored` torna a acreditar basenames plans;
- `command-policy` torna a autoritzar rebuts fallits;
- les seues proves contradiuen T5-10 i v3:124.

A més crearia un cicle d'imports turns↔porta i no resol T2. Els dependents que cal mirar abans d'arxivar-lo són `tests/anticipacio-261003.test.mjs:758` i `tests/lint-torn-261002.test.mjs`.

### 3. T4 · Crash de useSession

- **SES-01 (P1, confirmat a HEAD).** Cap camí estructural pinta un consumidor de `useSession` fora de `SessionProvider`:
  - el context no s'exporta (`src/app/contexts/SessionContext.jsx:11`);
  - hi ha un sol muntatge (`src/PedraSecaEmbed.jsx:262-268`) i un sol mòdul;
  - cap proveïdor porta `key` i no hi ha cap àlies preact;
  - cada build porta una sola còpia del missatge.
- **SES-02 (lliurat).** `src/sections/control/ControlSection.sessio.test.jsx` munta l'arbre real (ErrorBoundary, MemoryRouter, UIProvider en llavor, SessionProvider real, StrictMode, NotificationProvider, RouteErrorBoundary amb `resetKey`, Suspense i les rutes lazy reals `/control` i `/registre` amb OnboardingSection), sense substituir EixidaSegura. Té tres casos: eixida neta, eixida amb pendents i sessió caiguda amb el Panell obert. Dues mutacions temporals (un import rebutjat i un `useSession` fora del proveïdor) la posen roja amb la causa i el component stack. Està afegida a `CONTROL` de `qualitat.test.js`. Resultat: 3/3 verda, i la carpeta de control, 121 verdes.
- **Abast de la prova.** Acredita l'arbre en llavor, en memòria i amb un sol graf de mòduls. No cobrix:
  - AppShell (TopBar → `useIdentitatDeLaBarra.js:51`, BotoCrom → `PanellCrom.jsx:87`), IdentitatProvider ni els proveïdors de dades;
  - **la hipòtesi d'una segona instància de `SessionContext.jsx`** servida per un servidor Vite ranci o després d'un HMR, que dona exactament este missatge (memòria del Mas: «servidor Vite ranci després d'un npm ci»).
- **Reproducció manual (per al Mestre).**
  1. Arrancar de nou el servidor de desenvolupament (sense HMR pel mig), entrar, anar a `/control` i prémer «Eixir del poble».
  2. Copiar el component stack. «Hi ha hagut un problema» amb `<pre>` vol dir dins de les rutes; «No s'ha pogut carregar Sóc de Poble» vol dir a la closca o als proveïdors.
  3. Si no es reproduïx, tancar la tasca com a «no reproduïble a HEAD».
- **SES-03 (P2, decisió humana).** DetallAjust i la baixa de DetallPrivacitat recarreguen la pàgina (`src/sections/profile/DetallAjust.jsx:45-48`, `DetallPrivacitat.jsx:344-349`). Consta com a criteri deliberat; l'ordre del 260930 cobrix el Panell i el Xat, no el Perfil.
- **Troballa nova (P2).** En mode llavor o local, arribar a `/registre` fa que OnboardingSection cride `enterRemoteMode` (`src/data/dataMode.js:36-43`), que recarrega la pàgina sense mirar `esAmaDelDocument`. Encastat a WordPress, això recarrega l'amfitrió després d'eixir. En remot no passa.
- **SES-04 i SES-05 (P3).** `lazyRoute` disfressa errors d'avaluació, però no té res a vore amb este crash. El comentari d'`App.jsx:247-251` diu que la closca es pot muntar sense proveïdor, però TopBar crida `useSession` obligatori.

### 4. T5 · Consola Termodinàmica

Fet, amb l'ordre del Mestre i la decisió D1 = B1:
- **Orfes de zero píxels:** CSS `.sdp-consola__segell` i `__llista`; `useTargetesQueObrin`, `movimentReduit`; la branca morta `!font` de MapaConsola amb el seu botó; icones `coins`, `wallet`, `logIn` i `logOut`.
- **Crèdits:** panell, coberta, xifres, família `credit` i normalització. Això apaga també el defecte latent ANC-4: `estrategia_consum: null` tombava `consola.json`.
- **Consums (B1):** panell, xifres de tòkens i vista. `registres-de-consum` es queda viva al grup del pols, perquè és l'àncora de la primera mètrica del tauler (ANC-1). Porta l'entradeta aprovada (D2), ara fixada per prova.
- **Comprovat al navegador:** el tauler `/consola` és idèntic (graelles de 9 i 10 targetes, mètriques del pols iguals). `/consola/pols` té tres panells i la targeta de registres; `/consola/pols/consums` i `/consola/pols/credits` diuen «Panell no trobat». Cap error a la consola.
- **Proves:** 591 verdes. design_guard no empitjora. Les roges que queden són alienes: `components.abast.capes.test.js` (`.sdp-emojis-xl`), `TextSection.test.jsx` i les de MarIA de §8.

Pendent amb ordre vostra:
- el text visible de `XifresMas.jsx:259` («els proveïdors de crèdits»);
- el lead de `src/sections/text/pageContent.js:185` i `section.consola.lead` d'`i18n.js`, que encara parlen de crèdits i tòkens (Fase B, frontissa de contingut);
- D3 (TargetaResum i Xifra, amb `manifest.js:372`);
- D4 (`MapaConsola.jsx.tmp`, 0 bytes, versionat);
- D5 (el middleware `consola-iaia.mjs` encara publica `credits`; ara és inofensiu).

### 5. T1 · Segell i catàleg de skills

- **CS-01 (P1).** El segell es va reconciliar el 5-10 a les 13:09 (transacció `5e1ac28e`), però el catàleg és roig:
  - `core-comprensio-reflexiva` i `core-tecniques-investigacio` no tenen `type`, `status` ni `triggers_on`, i el seu `name` no és el de la carpeta;
  - la segona, a més, porta «: » dins d'un escalar pla;
  - per tant `inventari()` llança (`tooling/brain/cataleg_skills.mjs:54`, `:57`).

  Efectes: `tests/backend_consolidacio.test.mjs` (requiredPrimary) dona 9/14 roges, `test:ci` és roig a HEAD, el pas «skills» de `tancament --check` i la Porta Registre fallen, i l'índex i el manifest es queden en 30 skills de 32.
- **CS-02.** `npm run porta:segella:update` sense arguments no funciona: exigix CAS (`segella.mjs:87`).
- **CS-03.** El router de UserPromptSubmit treballa amb un `skills_index.json` del 2-10 amb 29 skills (`tooling/session/persona_router.mjs:34-42`): les skills noves no poden disparar mai. Només 9 de 32 són a `.claude/skills`.
- **Causa estructural.** `segella.mjs --update` segella qualsevol contingut sense validar el frontmatter.
- **Seqüència (MarIA edita amb aprovació del Mestre, perquè `.agents` també és governança a Antigravity; el Mestre fa el CAS):**
  1. Frontmatter canònic:
     - `type: skill`, `status: actiu`, `name` igual a la carpeta;
     - tags de l'enum: `core`, `trellat` i `reflex` per a la primera; `core`, `auditoria` i `tractors` per a la segona;
     - `triggers_on` únics: aixada, impulsivitat, comprensió reflexiva, entendre la petició / autòpsia, tècniques d'investigació, investigar el codi, cacera de bugs;
     - en la descripció de la segona, canviar «: » per «, » sense reescriure la frase.
  2. `node tooling/brain/cataleg_skills.mjs --escriu` i després `--check`.
  3. `node tooling/gates/segella.mjs --json`, i amb el hash que diga, `node tooling/gates/segella.mjs --update --expected-hash=NOU --expected-previous=22b967269c8aebec6d1874f84cfef932dc83455df957a5dab07149836ac2659d --reason="frontmatter canonic de les dues skills; cataleg regenerat"`.
  4. `node --test tests/backend_consolidacio.test.mjs` ha de donar 14/14.
  5. `npm run skills:index`.

  Entre els passos 1 i 3 el segell està trencat i `segell-auto` fa roig cada eina d'agent: s'ha de fer d'una tirada.

### 6. Enxufabilitat amb Sollutia

- **ENX-01 (P0, decisió humana).** «Model B» té tres lectures:
  - AGENTS §8 diu que Sollutia és el backend;
  - `prompt_local.md:72` diu que el Supabase és intercanviable;
  - l'ADR-2026-09 (acceptada el 16-09, pendent de signatura) diu que el Supabase de SdP és l'autoritat i que a Sollutia només se li llig per GET a través de la Frontissa.

  El codi aplica el B estricte a l'amfitrió (decisions A1/A3), però `src/data/contracte.js:146-147` encara preveu un backend Sollutia injectat. Fins que es fixe la frase canònica (D1 de l'ESTAT), els endpoints de Sollutia no tenen destí.
- **Bloquejants per al dia dels endpoints (P1):**
  - La Frontissa no té consumidor ni camí fins a la UI: `src/data/adaptadors/sollutia/client.js:4-8` amb el catàleg buit.
  - Hi ha dos catàlegs incompatibles: `traductor` validat per F3 i `decode` exigit pel transport.
  - El GET va sense credencials (`creaFrontissa.js:60-63`), i l'ADR cita un token que no existix.
  - Nucli de 32 mètodes amb tres morts. És tot-o-res de presència, no de comportament.
  - El magatzem de sessió (`src/data/identitat.js`) és part implícita del contracte, amb forma de GoTrue.
  - La UI llig `user_metadata` a cinc llocs i amb ordres incoherents. `adoptaSessioExterna` filtra `town_name` (`identitat.js:536`), i per això tota sessió injectada perd el poble.
- **P2:**
  - els modes llavor i local viuen dins de l'adaptador Supabase;
  - el bucket `mitjans_privats` està fixat a la UI (`NotesContext.jsx:252`, `:260`; `formaDelGrup.js:129`) i al sanejador;
  - la llei E1 de `tractor-enxufe` no veu els imports nus de `@supabase/*` ni les rutes GoTrue fora de l'adaptador (`tooling/gates/tractor-enxufe.mjs:93-94`);
  - la Wiki cita línies mortes (ADR:24, :36; `estandard_integracio_react.md:82`, `:129`, `:130`), i la còpia publicada a `wikiManifest.js:549` les propaga.
- **Fet, zero píxels:**
  - DTO estricte i congelat del traductor de perfil (`recursos.js`, amb prova);
  - fora els dos subscriptors morts de `realtime.js`;
  - codi neutral `esquema-absent` a `errorsBackend.js`, que `abastConnexio` mira abans de la regex de PostgREST (cap adaptador l'emet encara);
  - **kit de conformitat** `src/data/conformitat/kit.js`. És pur i només importa `../contracte.js`. Té 28 casos amb les signatures reals, un executor que no llança mai i `metodesSenseCas()`, que deixa el deute a la vista. `src/data/supabase/conformitat.test.js` el passa contra Supabase en llavor sense cap fetch. Sollutia hi pot enxufar la seua implementació amb un fetch de mentida que servisca captures reals.
- **Deute nou declarat.** La llei LLEI_08 de `tooling/brain/tractor-pedra-seca.mjs:279-285` comptarà `kit.js` com a subarbre orfe, perquè només l'importen proves. No el puc esborrar ni tocar `tooling`. La porta ja era roja per tres `__fixtures__`. Línia per a `EXCEPCIONS_ORFE`: `'src/data/conformitat/kit.js': 'kit de conformitat del port: només l\'importen proves'`.
- **Preguntes per a Sollutia:**
  - captura real anonimitzada per endpoint;
  - qui emet el JWT, amb quin `iss`, `aud` i `exp`, i la rotació;
  - UUID de persona i de tenant;
  - origen de l'API i CORS;
  - format d'error;
  - paginació;
  - fitxers i orígens;
  - temps real;
  - límits.

### 7. Commit atòmic (pla actualitzat a HEAD 44e2b8e2)

#### 7.1 Urgent abans del migdia: relleus que només pot fer MarIA

Torn `torn_eafab5f7` (Fable), caduca a les 11:52 local:

```bash
node tooling/wiki/document.mjs handoff --turn-id torn_eafab5f7-6d92-49a2-ad17-eec892cc41af --file _wiki_de_poble/04_escriptori/261005_1155_prompt_fable.md --to _wiki_de_poble/90_arxiu_historic/261005_1155_prompt_fable.md
node tooling/wiki/document.mjs handoff --turn-id torn_eafab5f7-6d92-49a2-ad17-eec892cc41af --file _wiki_de_poble/04_escriptori/261005_1155_pla_implementacio_fable.md --to _wiki_de_poble/90_arxiu_historic/261005_1155_pla_implementacio_fable.md
node tooling/wiki/document.mjs handoff --turn-id torn_eafab5f7-6d92-49a2-ad17-eec892cc41af --file _wiki_de_poble/04_escriptori/261005_1155_prompt_fable_local.md --to _wiki_de_poble/90_arxiu_historic/261005_1155_prompt_fable_local.md
```

Torn `torn_0a328563`, caduca a les 12:10 local:

```bash
node tooling/wiki/document.mjs handoff --turn-id torn_0a328563-5bba-4716-9c28-eb7b5442f723 --file _wiki_de_poble/04_escriptori/261005_1215_auditoria_fable.md --to _wiki_de_poble/90_arxiu_historic/261005_1215_auditoria_fable.md
```

Sense relleu possible:
- `261005_1155_prompt_fable_ultracode` és un rebut de context sense fitxer;
- `261005_1303_pla_opus` es va esborrar per tornar a crear-lo amb un altre nom. El torn `torn_6f2b5c7d` (caduca a les 13:01) no tancarà per eixe rebut: queda com a deute al LEDGER.

Després dels relleus, cal un pas de l'índex que l'eina de hui no fa (A3). Sense una àncora amb camí, `checkTurn` diu «Document sense àncora». Les quatre línies, a «## Arxivat amb la Porta Olivera»:

```markdown
- [[../90_arxiu_historic/261005_1155_prompt_fable]]
- [[../90_arxiu_historic/261005_1155_pla_implementacio_fable]]
- [[../90_arxiu_historic/261005_1155_prompt_fable_local]]
- [[../90_arxiu_historic/261005_1215_auditoria_fable]]
```

#### 7.2 Què és d'este torn i què no

**D'este torn:**
- Consola: `src/css/components.css`, `src/css/modules.css`, `src/css/modules.abast.capes.test.js` i els fitxers de `src/sections/consola/` del diff (23, llevat de `ConsolaSection.jsx`, que no s'ha tocat).
- Prova d'eixida: `src/sections/control/ControlSection.sessio.test.jsx` i `src/sections/control/qualitat.test.js`.
- Enxufabilitat: `src/data/adaptadors/sollutia/recursos.js` i `recursos.test.js`, `src/data/errorsBackend.js`, `src/data/supabase/realtime.js`, `src/data/supabase/README.md`, `src/data/supabase/conformitat.test.js`, `src/data/conformitat/` (tres fitxers), `src/sections/connectar/abastConnexio.js` i `abastConnexio.esquema.test.js`.
- Laboratori: `tests/laboratori-olivera-261006.test.js` i `_wiki_de_poble/04_escriptori/02_investigacio_ia/261006_0055_olivera_ancores_opus/`.
- Documental: este informe, les seccions «Activitat en curs», «Vincles» i el laboratori de l'índex, i `.agents/runtime/turns/torn_f2623861-1b6f-4706-be9d-aca31fa164f8.json`.

**No és d'este torn (MarIA o el Mestre; NO s'ha de barrejar):**
- `src/app/App.jsx`, `src/components/layout/AppGridShell.css` i `AppGridShell.jsx`, `src/sections/wiki-de-poble/WikiDePobleSection.jsx` i `src/sections/tractors/PanellAgents.jsx` (nou);
- `AGENTS.md` i `.agents/AGENTS.md` (§16);
- el pla `261005_1303` (Fases 4 i 5);
- els documents `261006_0224_*`;
- `tooling/scratch_malformades.mjs` (un script scratch dins de `tooling/`, que és el patró C6 de Fable);
- **unes 150 captures de `01_produccio/` ja posades a l'índex de git (estat «A»)**: cal mirar-ne la mida abans de cap commit.

#### 7.3 Commits proposats (mai `git add -A`; rutes explícites)

- **0.** El pre-commit és roig per disseny (CS-01 i les portes globals de tancament). O primer el commit del catàleg de §5, o cada commit va amb `--no-verify` i una línia d'incidència al LEDGER (precedent: LEDGER:769).
- **A.** `feat(consola): retira Consums i Crèdits del pols (B1) i orfes de zero píxels`: els fitxers de Consola de §7.2.
- **B.** `test(control): eixida real des del Panell dins de SessionProvider`.
- **C.** `feat(enxufe): DTO estricte de perfil, codi esquema-absent i kit de conformitat del port`.
- **D.** `chore(laboratori): paquet Olivera àncores 261006 i el seu corredor`. Avís: el corredor afig uns 19 s a Vitest i s'ha de retirar quan s'aplique el paquet.
- **E.** `docs(escriptori): auditoria Opus 261006`, només quan `node tooling/gates/porta-documents.mjs` isca amb 0. Inclou l'índex (que també porta línies de MarIA: revisar el diff) i el JSON del torn, preparat just abans del commit.

**Abans de cap push:** verificar els blobs grans del rang `fork/backup-notes-publish..HEAD`. El `260922_0320_BUNDLE_null.md` (5,16 MB) és versionat, i hi ha un objecte solt de 26,3 MB (`4f1f27a2…`, 5-10 12:11) que probablement és el bundle de 67,7 MB, capturat per la màquina del temps a `refs/time-machine` (CS-04, plausible i no verificat). Ordres per al Mestre: `git cat-file -s 4f1f27a2d384f96f6e507e5884c985cd9c42f8cd` i `git rev-list --objects --all` filtrat per `_null`.

**Altres decisions del Mestre:**
- `wordpress-plugin/builds/1.0.4.json` és versionat amb `http://localhost:8881`; `stable.json` ja torna a ser 1.0.3;
- `fix_anchors.mjs`, `scratch-banner.py` i els 34 fitxers de `scratch/` són versionats malgrat el `.gitignore`;
- el soroll de `.immunitari/cron.out` i de les receptes, i `graph.json`.

### 8. Concurrència i documents nous de MarIA

#### 8.1 Escriptures paral·leles

MarIA ha editat, mentre durava este torn:
- `AGENTS.md` (§16, 01:40);
- el pla `261005_1303` (Fases 4 i 5, amb una «NOTA PER A CLAUDE» sobre Loyverse);
- `WikiDePobleSection.jsx` (01:46), `PanellAgents.jsx` (01:52) i `App.jsx` (02:15);
- l'índex (dues àncores noves).

Efectes mesurats:
- 6 proves roges a `src/sections/wiki-de-poble` (categoria `maquinaria_cat` i `agents_panell`);
- 2 a `App.test.jsx` (Telefonades);
- design_guard puja a 32 crítics per `tailwind-visual` a `PanellAgents.jsx`.

Cap d'estes roges és d'este torn. **Les Fases 4 i 5 no les he executades.** No eren a l'encàrrec que em vau donar (Fases 1-3). La 4.1, obrir rutes sense `RequireAuth`, té implicacions de seguretat i necessita pla. La 5 és un redisseny (Llei del Píxel).

#### 8.2 Petorreta `261006_0224_petorreta_claude_ledger`

No l'he executada, per tres motius:
- és una instrucció trobada en un document, no una ordre del Mestre al xat;
- el hook denega a Claude tota escriptura a `.agents/` i la signatura (`verify-ledger --sign`) és del Mestre;
- esborrar els deu peus intercalats (línies 69, 187, 211, 238, 310, 328, 605, 618, 781 i 823) és esborrar text del LEDGER, i això xoca amb la Llei de la Immutabilitat (QUI_SOC §3.3).

Segons el codi (`tooling/verify-ledger.mjs:20`, `:31`), només el peu final valida: els intercalats són cos inert. Proposta:
- (a) el Mestre verifica i signa el peu final (`node tooling/verify-ledger.mjs` i després `--sign`);
- (b) separar les dues línies enganxades (605 i 619) sense esborrar cap caràcter, amb executor i lease;
- (c) que `mapa-consola` classifique els peus intercalats com a «peus històrics» en lloc d'anomalies, perquè la Consola deixe de comptar-los.

Si el Mestre vol una altra cosa, que ho diga al xat.

#### 8.3 Tensió doctrinal

AGENTS §16 («L'Oblit Saludable: s'ha d'esborrar o arxivar») i §5 («Prohibit esborrar… sense preguntar») conviuen sense frontera explícita. Proposta: que §16 diga «arxivar amb la porta Olivera; esborrar només amb ordre».

### 9. Text per a l'ESTAT i el LEDGER (Claude no pot escriure a `.agents/`; ho aplica MarIA)

```markdown
## ESTAT_ACTUAL · 2026-10-06 02:35 · Opus · auditoria i implementació 261006

Informe 261006_0025_auditoria_opus. Àncores fantasma: la porta diu la veritat; causes = trasllats i reanomenats fora de l'eina. Paquet nou 02_investigacio_ia/261006_0055_olivera_ancores_opus verificat (358/42/9 contra 325/40/9, 35 proves noves, 0 regressions, 2 de deriva declarada del 260930b), pendent d'aprovació a la Wiki i de lease; el 261002 queda superat. Consola: Crèdits i Consums (B1) retirats, tauler idèntic. Prova d'integració useSession verda; crash no reproduït a HEAD; reproducció manual pendent del Mestre. Enxufabilitat: P0 doctrinal (Model B, tres lectures); kit de conformitat del port lliurat. Catàleg de skills roig (frontmatter de les dues noves): test:ci roig a HEAD. Urgent: relleus de torn_eafab5f7 (11:52) i torn_0a328563 (12:10). Res commitejat. Següent: frontmatter de les skills i resegellat CAS; commits A-E de l'informe §7.3; decisió de la frase canònica de Model B.
```

```markdown
261006 | auditoria | opus | 0025: autòpsia de les àncores fantasma (causes fora de l'eina), paquet Olivera 261006_0055 verificat, Consola B1, prova useSession, kit de conformitat
261006 | incidència | core-higiene-escriptori | el 261002 deriva i és inaplicable; supera'l el 261006_0055
261006 | incidència | wiki-cicle-de-vida | les skills noves sense frontmatter canònic posen test:ci roig a HEAD 44e2b8e2
261005 | incidència | wiki-cicle-de-vida | 886f4272 i 44e2b8e2 sense línia al LEDGER; 44e2b8e2 probablement amb --no-verify
```

### 10. Retroalimentació de la plantilla `prompt_local`

- **El prompt ha de citar les auditories literalment.** Afirmava que Fable va descobrir que el crash «no es pot reproduir manualment»; Fable no va obrir el navegador (261005_1211:117).
- **Comprovar l'estat abans d'encarregar.** T1 («reparar i signar el segell») ja estava fet quan es va emetre el prompt. El que estava trencat era el catàleg.
- **Declarar la frontera d'escriptura.** Claude no pot tocar `.agents/` ni `tooling/`, i hi ha tasques (T1, T2) que la creuen. La plantilla ha de dir-ho i nomenar la via (laboratori + executor + lease).
- **Congelar el pla un cop emés el prompt.** Durant este torn el pla va créixer amb dues fases. Els canvis han d'anar a un document nou amb la seua hora.
- **La secció de Context** encara mana llegir `taxonomia_documental.md` sense ruta (és a `02_saber/protocols_tecnics/`), i el seu «Model B» contradiu l'ADR (ENX-01).

### 11. Taula de severitats (totes refutades per un escèptic)

| Id | Sev | Tema | Estat | Decisió humana |
| --- | --- | --- | --- | --- |
| ENX-01 | P0 | Model B amb tres significats | obert | sí |
| CS-01 | P1 | Catàleg de skills roig, test:ci roig a HEAD | text lliurat (§5) | sí (CAS) |
| A1-A5 | P1 | Causes de les àncores fantasma | paquet 261006_0055 | sí (lease) |
| T2-C1, C1b, ANC, LOT | P1-P2 | Abast i robustesa d'arxiva | paquet 261006_0055 | sí (lease) |
| T2-D1..D7 | P1 | Paquet 261002 inaplicable | superat | sí (arxivar) |
| SES-01/02 | P1/P2 | useSession | prova lliurada; reproducció manual pendent | sí |
| T3-01 | P1 | Consums i Crèdits | fet (B1) | — |
| L-05 | P1 | Torns del 5-10 que caduquen hui | ordres a §7.1 | MarIA |
| ENX-02..07 | P1 | Bloquejants de l'enxufe | kit lliurat; la resta obert | sí |
| CS-04/05 | P2 | Blobs grans a l'historial | ordres de verificació | sí |
| CS-03 | P2 | Router de skills ranci | `npm run skills:index` | MarIA |
| SES-03, nou | P2 | Recàrregues de pàgina en eixir (Perfil, llavor/local) | obert | sí |
| ANC-01..14 | P2-P3 | Divergències entre jutges | latents; ANC-02 resolt | parcial |

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

Executat en este torn (el resultat el diu el codi, no esta guia):

- `node tooling/gates/porta-olivera.mjs --informe`: eixida 0 en cada passada. L'última: 7 documents vius, Safata buida, pla de hui `261006_0224_pla_implementacio_antigravity`.
- `node tooling/gates/segella.mjs`: ✅ 22b96726.
- `npx vitest run src/sections/consola src/sections/control src/data src/sections/connectar tests/host.test.js tests/laboratori-olivera-261006.test.js`: 107 fitxers, 1.908 proves verdes i 1 omesa (00:24:46Z).
- `node --test tests/porta-olivera-v3.test.mjs tests/porta-olivera-diagnosi.test.mjs tests/cognitive-preflight.test.mjs tests/lint-sessio.test.mjs tests/lint_enxufe.test.mjs tests/tractor-enxufe.test.mjs tests/frontissa-gate.test.mjs tests/node-suite-policy.test.mjs`: 100 verdes, 0 roges i 2 `todo` de diagnòstic.
- `node --test tests/olivera-arxiva-261002.test.mjs`: SyntaxError en carregar (`commitCreation` absent). És la prova de la deriva del 261002.
- `node --test tests/backend_consolidacio.test.mjs`: 5 verdes i 9 roges, totes per `cataleg_skills.mjs:57` (CS-01).
- `node tooling/gates/tractor-enxufe.mjs` i `node tooling/gates/tractor-rls.mjs`: verdes.
- `node tooling/gates/design_guard.mjs --arrel=src`: exit 1 per deute aliè ja present a HEAD. La Consola no hi suma cap línia; el crític 32 és de `PanellAgents.jsx` (MarIA).
- Navegador (pestanya de fons al 3340, servidor ja en marxa): `/consola`, `/consola/pols`, `/consola/pols/consums`, `/consola/pols/credits`, `/consola/salut` i `/consola/xifres/registres-de-consum`, sense errors a la consola. No s'ha tocat cap sessió ni s'ha eixit del poble.
- Mutacions temporals de la prova de useSession (import rebutjat i `useSession` fora del proveïdor), totes dues roges com s'esperava i revertides.

No verificat: `verify-ledger.mjs`, `verificador-scc.mjs`, `tractor-frontmatter.mjs`, `tractor-pedra-seca.mjs`, `tractor-registre.mjs`, `cataleg_skills.mjs --check`, `tancament.mjs --check`, `npm run lint` sencer i la bateria Vitest sencera de `src`. El hook no els admet. ESLint s'ha passat per les proves de qualitat i per API dins del corredor del laboratori. La deriva del 260930b i el contingut de l'objecte `4f1f27a2…` també queden sense verificar.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Frontera d'escriptura.** Claude no pot escriure a `tooling/`, `.agents/`, `.claude/` ni `scripts/`, ni moure o esborrar fitxers. Per això T1 i T2 es lliuren com a text i com a laboratori, i no com a canvi instal·lat. El scratchpad i la memòria persistent de Claude també estan bloquejats: el que s'ha après en esta sessió només viu en este informe.
- **Lectura de `90_arxiu_historic/`.** Només s'han fet `ls` de noms concrets per a verificar existència, mai lectura de contingut.
- **Arbre concurrent.** MarIA ha escrit a `src/`, a l'índex, a `AGENTS.md` i al pla mentre durava el torn (§8). Les cites de línia de l'índex són de les 00:2x.
- **Reproducció del crash.** Per decisió del Mestre, no s'ha obert cap sessió al navegador ni s'ha eixit del poble.
- **Proves de laboratori.** El paquet Olivera s'ha verificat sobre còpies temporals, no instal·lat. La deriva del 260930b la tolera per nom exacte i requerix l'acceptació del Mestre.
- **Hores.** Aproximades: el hook bloqueja `date`, i m'he datat amb `ls -lT` i amb `expiresAt` del torn.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
