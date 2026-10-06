---
type: informe
status: esborrany
description: 'Relleu del front TPV Universal: peça UniversalTPV, entrada TPV del Bar, pont de sessió, offline, al·lèrgens i sdp.vendes.v1, amb proves i comprovació al navegador'
tags:
  - auditoria
visibility: private
reflex: sdp:torn_4b8a66ec-ae35-4f53-82b7-4b4dea5cf300:cf45c0b2-19a5-4562-b74a-25d2c42923b4
---
# Relleu Claude: TPV Universal (estructura de Loyverse amb pell Pedra Seca), offline, al·lèrgens i contracte de vendes

Esta guia és consultiva i de només lectura. Els resultats els calcula el codi vigent; la guia no pot substituir els scripts ni declarar salut si una comprovació falla.

<!-- SDP:SECTION auditoria.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_4b8a66ec-ae35-4f53-82b7-4b4dea5cf300:cf45c0b2-19a5-4562-b74a-25d2c42923b4 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-06T20:48:31.617Z |
| Modificació | 2026-10-06T21:45:00.000Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md (v2.0.0) |
| Model IA | Claude Opus 5.5 (claude-opus-5-5), coordinador i subagents |
| Tokens consumits | ≈ 17,1 M als subagents (3,05 + 6,33 + 4,12 + 2,72 + 0,86), sense comptar el coordinador |

<!-- SDP:SECTION auditoria.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/02_saber/protocols_tecnics/auditoria_canonica.md; SHA-256 855544fb761eca8472fd500438aeb726b8b63e796ee5b733d83bd52a38d204cf. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION auditoria.s3 -->
## Historial

2026-10-06T20:48:31.617Z: esborrany creat; contingut i verificació pendents.

- 2026-10-06T13:04Z: torn `torn_4b8a66ec-ae35-4f53-82b7-4b4dea5cf300` obert (actor claude, abast codi). Lectura del prompt [[261006_1215_prompt_claude_loiverse]], de la skill `sdp-clon-loiverse`, del pla [[261006_1140_pla_implementacio]] i de l'auditoria 1150 (ara a l'arxiu).
- 13:06Z: workflow de comprensió (15 agents): les 72 captures i les 20 `.img` de `01_produccio/loyverse_clon*`, el Bar, la Nevera, la closca i les barres, l'entrada, la doctrina i l'auditoria 1150, més un crític de completesa.
- Després: primera tanda de decisions del Mestre per xat (entrada nova «TPV», pont de sessió de només lectura, dos canals per producte). Línia base de proves: 143 fitxers, 1 roig previ (`auth.test.js`).
- Workflow d'implementació (40 agents): lots A (peça), B (model), C (plataforma) i D (Bar), quatre lents de revisió adversarial, 24 troballes confirmades i 21 corregides.
- Ordres noves del Mestre a mig torn: capacitat offline prioritària (també a l'acta [[261006_1910_acta_marmota_capacitat_offline]]), la Gestoria com a pas següent i els al·lèrgens amb els SVG propis. Segona tanda de decisions: sessió a tot el Bar i, en mode de proves, venda amb avís.
- Lot E (24 agents): pont offline, permís a tot el Bar, tornada al TPV, imatges tolerants i `sdp.vendes.v1`; 14 troballes, totes tractades.
- Lot F (12 agents): al·lèrgens al contracte i a la rajola, avís dins de les columnes; 6 troballes corregides.
- Verificació al navegador del coordinador: dos defectes trobats i corregits (inicials tallades i variants) i una caiguda per refresc en calent, corregida per un lot propi (3 agents) i verificada al navegador.
- Les hores, excepte la de creació, són aproximades.

<!-- SDP:SECTION auditoria.s4 -->
## Troballes

### Resum per al Mestre

El TPV Universal ja viu a **`/app/bar/tpv`**: el tiquet blanc a l'esquerra, amb la barra partida «Tiquets oberts | Cobra 3,50 €» al peu, i la graella densa de categories i productes a la dreta, dins de la barra fosca de l'app. En el vostre mode de proves (seed, sense Supabase) ven amb l'avís «Mode de proves: les vendes no estan lligades a cap compte». La mateixa peça fa de Llista de la Compra o Rebost («Afig a la llista») a l'espècimen de Disseny.

Per a vore-ho:
- `/app/bar/tpv`: la venda real amb la carta de La Parròquia (carregada a Ajustos › Carta en este torn, a les dades locals de proves).
- Disseny › Estructura › «TPV universal»: els modes Bar i Rebost, sense sessió i sense connexió.
- Disseny › Fonaments › «Icones d'al·lèrgens»: els vostres 14 dibuixos.

Decisions vostres d'avui que fixen el disseny:
1. Entrada nova «TPV»; la Caixa d'ara no canvia (Llei del Píxel).
2. Pont de sessió de només lectura: la plataforma dona a les apps `{ estat, teSessio, potEscriure, motiu, enLinia, modeProves, marca, rutaEntrada }`, mai el testimoni ni l'usuari.
3. Dos canals per producte: «A la carta digital» i «Per emportar».
4. La sessió s'exigix a tot el Bar.
5. En mode de proves local, el Bar ven amb avís.
6. Offline prioritari, la Gestoria com a pas següent i els al·lèrgens amb els vostres SVG (missatges i acta de MarIA).

Decisions pendents (`requires_human_decision: true`), per ordre d'importància:
1. **Obrir el TPV sense xarxa des de zero.** El service worker és «Online-first» (ADR-2026-08). Sense xarxa, una recàrrega mostra «Sense connexió». Cal esmenar l'ADR (§C.2).
2. **`src/data/supabase/auth.js` sense commit** (d'un altre front, editat hui a les 18:40). Ara trenca `auth.persistencia.test.js` › «logout: buida el registre…». A més, el botó «Forçar entrada local (Mock)» continua sense fer res (§D).
3. **Trencar el cicle d'imports de `src/data`** que encara pot fer caure la primera secció carregada després de desar en calent (§E.3).
4. **Endollar la Nevera (Rebost) al model comú.** La seua frontera no admet `utils/productes` sense ordre vostra (§F.6).
5. **Després de cobrar: tiquet nou o el de barra obert.** Avui, en tornar al TPV, s'obri el tiquet de barra obert més recent; Loyverse comença una venda nova (§F.4).

### A. Què s'ha construït

Cada peça cita el fitxer on viu. Les proves de cada fitxer són al costat (`*.test.js[x]`).

#### A.1 La peça `UniversalTPV` (Pedra Seca)

- **Fitxers:** `src/components/PedraSeca/organismes/UniversalTPV.jsx`, `src/components/PedraSeca/tpv.css` (importat a `src/css/index.css` sense `layer()`), `src/components/PedraSeca/qualitat.tpv.test.js`. Registrada al catàleg (`registre.js`, `manifest.js`, `detailRegistry.jsx`) amb l'espècimen `EspecimenUniversalTPV.jsx`.
- **Estructura de Loyverse, pell Pedra Seca** (correcció vostra del 261003, LEDGER:773): cap verd, cap hex. L'acció principal porta el blau d'acció (`--sdp-accio-control`, perquè el blanc sobre `--sdp-accio` només fa 3,87:1) i la secundària, el taronja.
- **Contracte:** `UniversalTPV({ etiqueta, marca, avis, tiquet, accions, cataleg, oberts, tria })`. Parla les MATEIXES formes de dades que l'esquelet comú (`article`, `categoria`, `linia`, a `organismes/articles.js`). Per això les dades que el Bar ja vestix servixen tal qual, i la Gestoria o el Rebost les podran pintar també en les columnes d'`AppGridShell`.
- **Disposició ampla:**
  - El tiquet fa entre 18 i 24 rem.
  - La graella és `repeat(auto-fill, minmax(7.5rem, 1fr))`, amb rajoles 1:1 on la foto o la marca ompli el quadrat i una banda porta el nom i el preu.
  - Només fan scroll les línies i la graella (Llei de Scroll).
- **Disposició estreta (menys de 46em de la pròpia peça):** a dalt la barra d'accions, i davall les pestanyes «Productes» i «Tiquet N», com Loyverse mòbil.
- **Diàlegs:** «Tiquets oberts» i «tria» (variants o modificador obligatori; un toc tria i tanca).
- **Accessibilitat:**
  - noms accessibles complets («Cola Cao, 2 variants», «…, conté gluten, llet»);
  - `role="status"`, que anuncia «Tiquet Barra: 3 unitats»;
  - focus de tornada als diàlegs i fites amb nom.
- **Sense xarxa:** una foto o un logotip que no carreguen tornen a la marca o a les inicials, sense imatge trencada.

#### A.2 L'entrada «TPV» del Bar

- **Fitxers:** `src/apps/bar/vistes/Tpv.jsx`, `manifest.js` (entrada `tpv`, grup Servei, després de Caixa), `rutesBar.js` (`tpv` i `tpv/:comanda` com a rutes d'àrea única) i `vestits.js` (`articlesDelTpv`, `tiquetDeComanda`, `tiquetsOberts`, `preuObertDeConsulta`).
- **El toc, com Loyverse:**
  - preu obert → el teclat;
  - un grup obligatori o més d'una variant → el diàleg de tria;
  - si no, l'única variant.

  La Caixa conserva el seu toc (la variant per defecte, i el detall amb pulsació llarga).
- **«Cobra»:** porta al cobrament de la Caixa amb `?torna=tpv`. Després de la nota del client, «Tanca la nota» torna a `/app/bar/tpv`. Sense el paràmetre, la Caixa fa exactament el d'abans.
- **Per emportar:** una comanda d'origen `emportar` només veu el canal «Per emportar» i l'avís ho diu.
- **Consulta (Clàusula dels Slugs):** `?oberts=1`, `?tria=`, `?preu=` i `?variant=` i `?linia=`, amb validadors estrictes.

#### A.3 La plataforma

- **Ruta d'àrea única:** `src/apps/plataforma/rutesAplicacio.js` i `ClosaAplicacio.jsx`, regla `.sdp-app-unica` a `apps.css`. Una ruta pot portar `Unica` en lloc de les columnes. En compacte es reserva l'alçada de la barra mòbil, i la barra d'accions del TPV no queda tapada (comprovat al navegador). Les rutes de columnes no canvien.
- **Pont de sessió `useSessioApp()`:** `sessioApp.js`, `fontSessio.js` (només l'importa `RutaApps.jsx`) i `ContextApp.jsx` (la part de la plataforma que veuen les apps).
  - Els motius són `lliure`, `sessio`, `mode-proves`, `fora-de-linia`, `comprovant-desada`, `comprovant`, `sense-permis` i `sense-sessio`.
  - La renovació del JWT no bloqueja la venda.
  - `entorn.sessio` de `ProveidorPlataforma` fixa la sessió a les proves.
- **Porta nova** (`fronteres.test.js`): la clausura d'imports de `plataforma/index.js` no arriba a cap context de l'arrel, al registre ni al backend (vegeu §E.3).

#### A.4 La sessió a tot el Bar i l'avís dins de les columnes

- **Una sola guarda a l'estat** (`src/apps/bar/estat/ProveidorBar.jsx`): les 23 escriptures refusen sense permís amb `SENSE_PERMIS`; les lectures no.
  - És una guarda d'experiència: les dades són locals i la seguretat real és la RLS.
  - Hi ha una prova que el bolcat del magatzem queda idèntic.
- **`AvisSessio`** (`vistes/comu.jsx`): un text per a cada motiu. Va dins del marc de cada columna, davall de la capçalera, gràcies a una prop opcional nova `avis` de `MarcColumna`, que passen `ColumnaCataleg`, `ColumnaColleccio` i `ColumnaColleccions`.
- **Llei del Píxel:**
  - Sense avís, el DOM de l'esquelet és idèntic per a la Nevera, el Lector i Salut. Hi ha proves per estructura, i el lot F va comparar per resum el DOM de 22 pantalles abans i després.
  - Comprovat al navegador: les capçaleres de la Caixa tornen a ser una barra contínua.

#### A.5 El model comú de productes

- **Fitxer:** `src/utils/productes/producteUniversal.js`. És pur i sense imports.
- **Contracte:**
  - `DOMINIS` (`casa`, `bar`) i `CANALS` (`carta-digital`, `emportar`), amb `canalsDe`, `esDelCanal` i `validaCanals`. Sense `canals`, un producte és als dos canals, i la carta d'ara no canvia.
  - `ALERGENS` (els 14 de l'annex II del Reglament (UE) 1169/2011, en el seu ordre), `NOMS_ALERGENS`, `ABREVIATURES_ALERGENS`, `validaAlergens` i `ordenaAlergens`.
  - `producteDeBar`, `producteDeCasa` i `validaProducteUniversal`, amb les presentacions comunes (preu, quantitat, unitat).
- **Al Bar:**
  - `nucli/cataleg.js` reexporta els al·lèrgens (el mateix objecte), valida els canals i afig `cartaDelCanal`.
  - L'editor de producte (`vistes/Carta.jsx`) té els interruptors «A la carta digital» i «Per emportar».
- **Pendent:** els traductors i el canal `carta-digital` encara no tenen consumidor de producció (§F.7).

#### A.6 Els al·lèrgens amb els vostres SVG

- **Còpies netes** a `src/assets/alergens/<id>.svg`. S'han llevat la declaració XML, el DOCTYPE amb URL externa i els atributs de l'editor; els traços i els colors són els vostres.
  - Casats PEL NOM: la vostra numeració intercanvia 03 (PESCADO) i 04 (HUEVOS) respecte de l'annex II.
  - `soja`, `cacauets` i `tramussos` portaven un `viewBox` no quadrat i s'han enquadrat a 16×16 sense tocar cap camí. Una prova compara cada còpia amb l'original de `01_produccio` (només lectura).
- **Registre** (`src/components/PedraSeca/recursos/alergens.js`): carrega els SVG com a TEXT dins del paquet i els servix com a URI `data:`. Funcionen sense xarxa i sense cap petició, perquè el service worker no guarda SVG solts. La CSP ja admet `img-src data:`.
- **Peça `IconesAlergens`** (`src/components/PedraSeca/molecules/IconesAlergens.jsx`, full `alergens.css`):
  - mides xicoteta (1,25 rem) i mitjana (2 rem);
  - «+N» quan no caben;
  - pastilla amb l'abreviatura si falta un dibuix;
  - nom accessible «Al·lèrgens: gluten, llet».
- **On es veuen:**
  - La rajola del TPV en porta fins a 4 peces.
  - La `UniversalCard` no s'ha tocat: el seu `body` ja admet `IconesAlergens`, i així ho farà la Carta Digital (documentat a la peça i a l'espècimen).

#### A.7 El contracte de vendes per a la Gestoria

- **Fitxers:** `src/utils/vendes/registreVendes.js` (`sdp.vendes.v1`) i l'adaptador `src/apps/bar/nucli/vendes.js` (`registreDeVendes(tiquets, { titular, establiment, zona, des, fins })`).
- **Titular:** `{ tipus, id, alies, ambit }`, compatible amb `sdp.gestoria.titular.v1`. El Bar és ACTIVITAT (persona) o ENTITAT, mai LLAR. El posa qui crida: el TPV no tria el perfil.
- **Vendes i devolucions:** porten data `{ a, m, d }` en la zona IANA que es passa, l'hora, el canal, el total, `perIva: [{ ivaPercent, totalCents }]` i els pagaments. Les devolucions porten els imports en positiu.
- **Llista blanca tancada:** cap àlies de cambrer, nota ni motiu.
- **Principi 4 de la Gestoria:** el contracte no calcula cap impost; ni base, ni quota, ni models.
- **Pendent explícit:** encara no hi ha consumidor; el pas següent és la Gestoria (§F.8).

### B. Les captures de Loyverse: què hi ha de veres

Els 15 lectors van obrir totes les fonts. Cap no mostra la venda de Loyverse en tauleta:

- **`loyverse_clon/`** (27 PNG d'escriptori): tot és el **Back Office** web.
  - Llistes d'articles, categories (amb colors), modificadors, informes, tiquets oberts predefinits («BARRA - 1…8», «TAULA - 1…6»), impressora de cuina per categoria, rebut, IVA del 10, 21 i 4 %, i 12 TPV actius (Android, iPad i mòbils).
  - 3.13.34 revela el negoci real.
- **`loyverse_clon_mobil/`** (36 JPEG): el POS en mòbil.
  - Venda en **llista** (preferència «List» de La Parròquia).
  - La barra «OPEN TICKETS | CHARGE €x», el filtre «All items ▾», el diàleg de variants i el cobrament.
  - L'esquema 18.11.14, que dona la graella de 3 columnes de cel·les quadrades.
- **`loyverse_clon_ipad/`:** els 9 PNG no són de Loyverse (configuració de Claude, Finder i dues pantalles de Sóc de Poble). Les 20 `.img` són **notes de veu** (WebM només d'àudio, uns 26 minuts) i no s'han transcrit: fer-ho en local vol una instal·lació aprovada, i al núvol trauria la vostra veu fora.

El TPV calca, per tant:
- l'estructura i els fluxos del mòbil i de l'esquema 18.11.14;
- l'ordre de la skill: el tiquet a l'esquerra. [CONEIXEMENT GENERAL, no verificat] El Loyverse real de tauleta posa el tiquet a la dreta.

Si voleu el calc exacte de tauleta, cal una gravació de pantalla de l'iPad (.mov/.mp4 amb vídeo).

### C. Offline

#### C.1 El que ja funciona sense xarxa

- **Dades:** les del Bar viuen a IndexedDB del dispositiu (`utils/magatzemLocal.js`). Vendre, cobrar i tancar el torn no fan cap petició.
- **Sessió desada:** amb una sessió desada en este dispositiu (algú va entrar i no va eixir), el Bar ven sense xarxa (`fora-de-linia`) i també quan el servidor no respon però el navegador diu «en línia».
- **Imatges:** les fotos i els logotips que no carreguen tornen a la marca. Les icones d'al·lèrgens van dins del paquet.

#### C.2 El que encara no (`requires_human_decision: true`)

- **Evidència:** `public/sw.js:5-15`. El service worker és «Online-first (ADR-2026-08)»: les navegacions van a la xarxa i, sense xarxa, mostra la pàgina «Sense connexió». No guarda cap HTML.
- **Conseqüència:** una pestanya ja oberta continua venent, però **recarregar o obrir el TPV sense xarxa no funciona**.
- **Proposta conservadora (no aplicada):** esmenar l'ADR perquè el worker guarde l'esquelet HTML per a les navegacions de `/app/*`, servit de la memòria cau quan la xarxa falla. Els chunks amb empremta ja es guarden, i cal assegurar que els del Bar hi entren.
- **Abast:** `public/sw.js` és fora del meu abast. Afecta tota la PWA, i per això no l'he tocat.
- **Altres límits:**
  - Amb un router sense eixida a Internet, la sessió no es torna a comprovar fins a un esdeveniment `online` o una recàrrega (`src/data/sessionService.js`, zona prohibida). L'avís promet «es comprovarà quan torne la xarxa».
  - Sense xarxa, la capçalera mostra el nom de l'establiment en lloc de la marca de l'organització, que només arriba amb sessió.

### D. L'entrada com a usuari registrat

- **Verificació de punta a punta: no s'ha pogut fer.** El Supabase local (`127.0.0.1:54321`) no respon en este entorn («Failed to fetch» des del navegador). En mode seed, entrar és impossible per disseny (`auth.js:139-149`), i per això heu triat que el Bar vena amb avís.
- **Proves del pont:** 91 de `sessioApp.test.jsx`, inclosa una amb `IdentitatProvider` real i una pertinença owner amb logotip, i les del Bar amb cada motiu. Totes en verd.
- **Defecte d'un altre front (`requires_human_decision: true`):**
  - **Evidència d'este matí:** la línia sense commit `src/data/supabase/auth.js:353` (`if (esModeLocal(config)) return { ok: true };`) feia fallar `src/data/supabase/auth.test.js` › «en seed també sonda la URL configurada». Era l'únic roig de la línia base.
  - **Estat al final del torn:** `auth.js` es va tornar a editar a les 18:40, en la sessió de MarIA i fora d'este front. La línia 353 ja no hi és, i `auth.test.js` passa.
  - **Fallada nova a la suite sencera:** ara falla `src/data/supabase/auth.persistencia.test.js:126` › «logout: buida el registre abans que responga la xarxa i revoca amb el JWT capturat», perquè `fetch` no es crida cap vegada. Probablement ve del canvi sense commit de `logout`/`tanca()` («Bug latent 1 corregit» del pla).
  - **El botó «Forçar entrada local (Mock)»:** només fa `setSimulaLocal(true)`, sense crear cap sessió. L'acta 1910 de MarIA hi afig un `modeDades` que arrenca en `remote`.
  - **Proposta:** no ho he tocat (codi de seguretat d'un altre front). Ho ha de decidir qui el porta.
- **Fitxers de seguretat:** este front no ha modificat `src/data/**`, `SessionContext.jsx`, `RequireAuth.jsx`, l'onboarding ni la identitat de la barra. `IdentitatContext.jsx` només porta una exportació nova de lectura (`useIdentitatOpcional`).

### E. Defectes trobats al navegador i corregits

1. **Inicials tallades a les rajoles del TPV.**
   - **Evidència:** 318 de 320 rajoles. La regla comuna `.sdp-marca-article` (100 % d'ample i 1:1) feia un quadrat de 130 px dins d'una fila de 68 px.
   - **Correcció:** una regla a `tpv.css` (`.sdp-tpv__media > .sdp-marca-article`). Ara són 0 de 320.
   - **Pendent:** la Caixa té el mateix tall amb la peça obsoleta `GraellaArticles` (§F.9).
2. **Variants al TPV.**
   - **Evidència:** tocar «Cola Cao» afegia la primera variant, i al TPV no hi ha pulsació llarga.
   - **Correcció:** més d'una variant obri la tria. Prova nova: «Aigua» → «Gran» ven la variant `gran` a 1,80 €.
3. **Caiguda de l'app en desar en calent** (només desenvolupament; producció no té refresc en calent).
   - **Mecanisme:** `plataforma/index.js → sessioApp.js → SessionContext/IdentitatContext`. Eixos contexts ja eren ascendents de totes les apps pel cicle `SessionContext → sessionService/backendPort → import(host.js) → registreApps → import() de les apps`. Cada edició d'una vista carregava una instància nova del context, i React Refresh deixava la barra negra sense proveïdor.
   - **Correcció:** `ContextApp.jsx` i `fontSessio.js`, més una porta a `fronteres.test.js`.
   - **Verificació al navegador:** desar `Tpv.jsx`, `Caixa.jsx` o `UniversalTPV.jsx` ja no fa caure res.
   - **Residu (`requires_human_decision: true`):** el cicle de `src/data` continua. Després de desar en calent, la primera secció que es carrega per primera vegada (p. ex. `/registre`) pot nàixer sense proveïdor fins que es recarrega. Trencar-lo vol tocar `backendPort.js` o `host.js`.
   - **També:** editar fitxers de la mateixa plataforma remunta `ProveidorBar` en calent, i pot passar el bloqueig de la caixa a una altra pestanya.

### F. Pendents

1. ADR offline del service worker (§C.2). Decisió vostra.
2. `auth.js` sense commit (`auth.persistencia.test.js`) i el botó Mock (§D). Decisió del front d'entrada.
3. Cicle d'imports de `src/data` (§E.3). Decisió vostra.
4. **Després de cobrar.** En tornar, `/app/bar/tpv` obri el tiquet de barra obert més recent, si n'hi ha; Loyverse comença una venda nova. És el comportament de la Caixa, i no l'he canviat sense ordre.
5. **El TPV encara no porta** «Marxa», «Dividix», «Mou», «Tanca sense cobrar» ni el detall d'al·lèrgens per pulsació llarga. Viuen a la Caixa.
6. **Nevera i Rebost.** L'espècimen demostra el mode «Afig a la llista», però l'app de la Nevera no s'ha endollat: `src/apps/nevera/frontera.test.js` només admet una llista tancada d'utils. Cal l'ordre per a obrir-la a `utils/productes`.
7. **Carta digital pública i menjar per a casa fora del dispositiu.** Avui els canals són marques locals. Publicar-los vol una capacitat nova al contracte, una migració amb GRANT explícits (des del 2026-10-30) i una ADR (Model B).
8. **`sdp.vendes.v1`.** Sense consumidor fins a la Gestoria. El Bar no guarda la zona IANA de l'establiment, i cal decidir d'on la traurà la Gestoria.
9. **Inicials tallades a la Caixa** (`GraellaArticles`, obsoleta). Arreglar-ho canvia píxels de la Caixa, i cal ordre.
10. **Al·lèrgens.**
    - Si voleu fidelitat byte a byte, cal desfer els tres `viewBox` enquadrats.
    - Les icones de ració (1/1 i 1/2) i d'idioma queden per a la Carta Digital.
    - En fosc, el fons de la icona reutilitza `--sdp-sobre-accio`; un token propi vol tocar `tokens.css`.
11. **Ancoratge de l'Escriptori.** La porta Olivera (`--informe`, 23:45) ix neta. Este relleu ja és a «## Activitat en curs», i `01_produccio/alergens_svg/` ja està ancorada. Queda per a MarIA o per a vosaltres la carpeta `01_produccio/Alergenos-ES_COPIA-ES_POT_BORRAR/`, que pel nom és una còpia per esborrar: no l'he tocada.
12. **Governança.** No he actualitzat `.agents/ESTAT.md` ni el LEDGER, ni he executat `tancament.mjs`: el hook ho reserva a l'executor amb lease. Bloc proposat per a l'ESTAT, a copiar per MarIA:

    ```markdown
    ## ESTAT_ACTUAL · 2026-10-06 23:45 · Claude · TPV Universal
    Relleu [[261006_2250_auditoria_claude]]. Fet: peça UniversalTPV (Pedra Seca), entrada /app/bar/tpv, ruta Unica i pont useSessioApp de la plataforma, sessió a tot el Bar amb mode de proves i venda offline amb sessió desada, model producteUniversal (canals i 14 al·lèrgens), icones d'al·lèrgens del Mestre, contracte sdp.vendes.v1. Res commitejat. Decisions pendents: ADR offline del service worker, auth.js sense commit (auth.persistencia.test.js, altre front), cicle d'imports de src/data, endollar la Nevera. Suite sencera de src: 3 rojos aliens al TPV. Següent: commit atòmic del TPV (sense auth.js, onboarding, identitat de la barra ni les migracions 2610061448/1450) i la Gestoria.
    ```
13. **La skill `sdp-clon-loiverse`.**
    - No està versionada, no és a `00_INDEX_SKILLS.md` i no té enllaç a `.claude/skills/`.
    - La vostra correcció del 261003, «clonar és copiar l'estructura, no l'estil» (LEDGER:773), no és instal·lada a `sdp-pedra-seca` ni a la skill de clonació. Esta torna a dir «clon exacte… al mil·límetre».
14. **Commit atòmic.** Els fitxers d'este front són tots els de `src/` de la Verificació, excepte els de l'altre front:
    - `src/data/supabase/auth.js`;
    - `src/sections/onboarding/OnboardingSection*`;
    - `src/components/universal/identitat/useIdentitatDeLaBarra*`;
    - `supabase/migrations/2610061448_*` i `2610061450_*`.
15. **Lliçons per a la memòria.** El hook no deixa escriure fora del repo:
    - (a) el cicle de contexts i refresc en calent (§E.3);
    - (b) el mapa de les captures (§B);
    - (c) amb una mida emulada més gran que el panell, els clics per referència cauen desplaçats: per a provar fluxos, cal tornar al preset d'escriptori.

### G. Retroalimentació per a la plantilla `prompt_local`

1. **Fonts autoritzades.** La instrucció cita «les captures proporcionades pel Mestre» sense dir quines carpetes contenen la pantalla demanada. Un camp «Fonts canòniques i què hi ha a cada una» haguera estalviat la sorpresa de §B.
2. **Requisits transversals.** L'offline, la Gestoria i els al·lèrgens van arribar a mig torn. Un camp fix («offline, privacitat, portabilitat cap a la Gestoria, Llei del Píxel») els faria visibles des del principi.
3. **Aprovació del torn.** El registre diu «Aprovació humana: pendent» mentre el Mestre decidia per xat. Un camp de decisions del torn, amb el canal i l'hora, en deixaria traça.
4. **Ordre o redacció.** Seria útil marcar què és ordre literal del Mestre i què és redacció de MarIA. Ací, «calcar al mil·límetre» xocava amb la correcció del 261003.

<!-- SDP:SECTION auditoria.s5 -->
## Verificació

**Línia base**, abans de tocar res:
- **Ordre:** `npx vitest run src/apps src/components/PedraSeca src/sections/disseny src/app/App.appsLocals.test.jsx src/data/supabase/auth.test.js`
- **Resultat:** 143 fitxers, 2.176 proves; 1 fallada, la de `auth.test.js` per `auth.js:353`.

**Suites dels lots**, totes executades pels agents i revisades:
- **Lot de correcció del primer workflow:** 155 fitxers, 2.492 proves passades i 0 fallades.
- **Lot E:** 262 fitxers passats i 1 omés, 5.202 proves.
- **Lot F**, sobre `src/apps src/components src/sections/disseny src/utils src/app/App.appsLocals.test.jsx src/app/contexts src/sections/gestoria src/css src/pwa`: 382 fitxers passats i 1 fallat, 6.935 proves. L'única fallada és `src/css/components.abast.capes.test.js` › «D-C · espais de la reixeta», per `.sdp-emojis-xl__graella li { padding: calc(var(--sdp-space-1) + 3px) }` de `components.css`, que este front no ha tocat.
- **Correcció del pont:** `npx vitest run src/apps src/app/App.appsLocals.test.jsx src/app/contexts src/components/PedraSeca/organismes/UniversalTPV.test.jsx` dona 88 fitxers i 1.832 proves passades.

**Suite sencera** `npx vitest run src`, al final del torn: 763 fitxers (759 passats, 3 fallats, 1 omés) i 12.958 proves (12.947 passades, 3 fallades, 8 omeses).

**Les tres fallades són alienes al TPV** (cap d'eixos fitxers és d'este front):
- `src/css/components.abast.capes.test.js` › «D-C · espais de la reixeta», per `components.css`.
- `src/sections/text/TextSection.test.jsx` › «L'Ànima de la IAIA (/ia)»: la pàgina ja rep `heroFetchPriority`, `heroHeight` i `heroWidth` de `pageContent.js`, `paginaDeText.js` i `PageFrame.jsx`, que no tenen canvis a l'arbre de treball. La prova falla amb el codi del commit actual.
- `src/data/supabase/auth.persistencia.test.js` › «logout…», per l'`auth.js` sense commit editat a les 18:40 (§D). La de `auth.test.js` de la línia base ja passa.

**Al navegador** (`localhost:3340`, mode seed, carta de La Parròquia, torn de prova «Prova Claude»):
- `/app/bar/tpv`:
  - l'avís de mode de proves;
  - una venda de Bombó, Cafè sol i Cola Cao («Tria la variant» → «Got gran de 300 ml» a 2,00 €);
  - «Cobra 4,60 €», el cobrament amb `?torna=tpv` i l'efectiu exacte;
  - «Nota 0001» amb l'IVA del 10 % (base 4,18 €, quota 0,42 €);
  - «Tanca la nota», que torna a `/app/bar/tpv`.
- **Compacte:** la barra d'accions damunt de la barra mòbil.
- **Caixa:** les capçaleres alineades amb l'avís dins de la columna.
- **Espècimens:** el TPV i les icones d'al·lèrgens (48 icones carregades des de `data:`).
- **Refresc en calent sense caiguda:** sis edicions de comentari a `Tpv.jsx`, `Caixa.jsx` i `UniversalTPV.jsx`, totes desfetes.

<!-- SDP:SECTION auditoria.s6 -->
## Límits

- **Sense Supabase local:** l'entrada real, la marca d'una organització real i el mode remot no s'han exercit de punta a punta.
- **Sense captures de tauleta:** les notes de veu no s'han escoltat.
- **Portes del repo:** no s'han executat `tractor-cataleg`, `tractor-importacions` ni `tractor-pedra-seca`, perquè el hook només permet Vitest. Les seues comprovacions C1-C3 estan reproduïdes a les proves de qualitat noves.
- **Build de producció:** no s'ha mesurat. Les icones afigen uns 58 KB de text sense comprimir al chunk de la façana.
- **Governança i commit:** no s'han tocat l'ESTAT, el LEDGER, les skills, `public/sw.js` ni la governança, i no s'ha fet cap commit.
- **Dades locals de proves:** al navegador del Mestre s'han carregat la carta de La Parròquia, un torn de prova («Prova Claude»), comandes de prova i la «Nota 0001». Es poden tornar a l'exemple a Ajustos › Carta, i el torn es pot tancar a Tancament.

<!-- SDP:SECTION auditoria.s7 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
