---
type: norma
status: esborrany
description: Esmena de l'ADR-2026-08 per a les apps locals, amb dades del dispositiu i deures d'exportació, i la closca de /app/* al service worker del lloc propi.
tags:
  - arquitectura
  - maquina
---
# ADR-2026-10 — Apps del dispositiu i closca sense xarxa

Esta ADR esmena l'[[ADR-2026-08-ONLINE-FIRST]] sense substituir-la: les dades compartides del poble continuen online-first i s'hi afig una categoria nova, les dades del dispositiu, per a les apps locals de la Plataforma d'Apps Enxufables. També fixa què pot fer el service worker del lloc propi perquè una app ja visitada arrenque sense xarxa.

## Estat

Proposta aplicada a sw.js el 261007 per ordre del Mestre; pendent de signatura.

L'ordre del Mestre del 261007 diu: «Fes-ho tot... si pots resoldre-ho sencer i no trencar el connector de WordPress». Mentre no es signe, l'ADR-2026-08 continua sent la norma en tot el que esta esmena no toca.

## Context

L'ADR-2026-08 dona per retirats la PWA, IndexedDB i els service workers, però el codi ja no ho reflectix:

- Hi ha un service worker en producció (`public/sw.js`), registrat des de `src/main.jsx` per `src/pwa/registre.js`.
- Hi ha un motor IndexedDB comú, `creaMagatzemIdb` (`src/utils/magatzemLocal.js`).
- Cinc apps tenen la veritat de les seues dades en este dispositiu: el Bar, Salut, la Nevera, el Lector i la Gestoria (el llibre Veri*Factu).
- El TPV del Bar ven sense xarxa per ordre del Mestre, però fins al 261007 només amb la pestanya oberta: una recàrrega sense xarxa donava la pàgina «Sense connexió».

L'ESTAT ja tenia pendent l'«ADR offline del service worker». L'esborrany `ADR_PWA_ESMENA.txt` (a `04_escriptori/02_investigacio_ia/261003_1330_onada4_claude/`) proposava reobrir la PWA com a instal·lable i lleugera, sense guardar cap HTML.

## Decisió

### Dades compartides: online-first, sense canvis

Les línies 28-31 de l'ADR-2026-08 continuen intactes. Supabase és la font de veritat de les dades compartides, amb autenticació i autorització de servidor. La memòria cau local és opcional i no autoritativa. No hi ha reconciliació sense xarxa, ni sincronització en segon pla, ni CRDT.

### Una categoria nova: les dades del dispositiu

- **Què són:** les dades de les apps locals (Bar, Salut, Nevera, Lector i Gestoria). No són compartides, no es sincronitzen i la seua font de veritat és este dispositiu.
- **On viuen:** a IndexedDB. Una app només hi entra per `creaMagatzemIdb` des del seu `magatzem.js`; la Gestoria i els Tractors, pels seus magatzems declarats. Ho vigilen `src/apps/plataforma/fronteres.test.js` i `src/sections/gestoria/privacitat.test.js`.
- **L'excepció:** la conseqüència de l'ADR-2026-08 «Migrar abans qualsevol dada que només visca en IndexedDB» no s'aplica a esta categoria, i només a esta.

### Deures de les dades del dispositiu

1. Oferir a la persona una exportació o una còpia (`bolca` del motor, `exportaLlibre` de la Gestoria): una còpia dins del mateix origen no és un backup.
2. Demanar persistència al navegador (`demanaPersistencia`).
3. Avisar de manera visible quan el navegador no deixa guardar (`persistent: false`): llavors les dades només duren la sessió.
4. Oblidar les dades personals en eixir de la sessió.

Esta esmena fixa els deures; no certifica que cada app ja els complisca. La revisió app per app és una tasca de seguiment.

### El service worker és només del lloc propi

- **Qui el registra:** només `src/pwa/registre.js`, des de `src/main.jsx`, en producció, en context segur, fora d'un iframe i fora de l'app nativa.
- **Qui no el porta mai:** `sw.js` i `manifest.webmanifest` són a `PROPIS_DEL_LLOC`. El connector de WordPress i el Web Component no els reben (`tests/standalone-build.test.mjs` i `tests/natiu-build.test.mjs`).
- **Què guarda:** els recursos del build amb empremta, amb sostres de 300 entrades i 8 MiB, i la closca de les apps.
- **Què no guarda mai:** l'API, `/auth/`, `/rest/`, cap altre origen, cap POST, cap petició amb Authorization ni cap dada de la persona.
- **Sense xarxa, fora de /app/\*:** la pàgina honesta «Sense connexió» (503), com fins ara.

Ratifica l'esborrany `ADR_PWA_ESMENA.txt` amb una sola esmena: «cap HTML» passa a ser «cap HTML fora de /app/\*».

### La closca de les apps

1. Cada app té la seua closca, a la memòria `sdp-pwa-closca-v1`, amb la clau `/app/<id>/`. El portal té la clau `/app/`. L'HTML és el mateix a tot /app/\*, però cada app necessita uns altres chunks per a arrencar: l'HTML només nomena el chunk d'entrada, i `RutaApps` i el chunk de cada app es carreguen després.
2. Una navegació a /app/\* que respon bé deixa una còpia de l'HTML a la closca de la seua app, amb la llista dels recursos amb empremta que demana l'HTML. Eixa llista és l'empremta del build. Respondre bé vol dir 200, del mateix origen, HTML, sense consulta, sense redirecció i sense `no-store` ni `private`. Una ruta amb un id que la Plataforma no admet no té closca.
3. La pàgina de l'app confirma la closca amb tots els recursos amb empremta que ha carregat. Només ho pot fer si és del mateix build i si eixos recursos ja són a la memòria. Cada confirmació nova s'afig a les anteriors: les vistes que s'obrin després també hi entren. Una navegació del mateix build conserva la confirmació. Un build nou la perd i ha d'esperar la de la pàgina nova. Una pestanya d'un altre build no la toca.
4. Sense xarxa, una navegació a /app/\* només rep la closca de la seua app. També cal que la pàgina l'haja confirmada i que continuen desats tots els recursos, tant els de l'HTML com els de la pàgina. Si no, rep una pàgina honesta que explica com deixar l'app preparada. No rep mai la closca d'una altra app.
5. Amb xarxa sempre mana la xarxa, i cada navegació a /app/\* refresca la closca de la seua app.
6. Pujar la versió de la closca la invalida en activar el worker nou. Una closca que demana algun recurs que ja no hi és no es dona mai. Tampoc una que en demana més dels que caben a la memòria (300). Com a molt hi ha 32 closques: en desar-ne una de més, ix la que fa més temps que es va desar.

### L'escalfament: el component avisa, la pàgina parla amb el worker

1. Quan `RutaApps` es munta al lloc propi (`esAmaDelDocument`), avisa la pàgina amb l'esdeveniment `sdp:app-visitada`, sense cap dada (ni quina app ni on). Torna a avisar a cada canvi de ruta dins de /app/\*, perquè passar d'una app a una altra no torna a muntar `RutaApps`.
2. `src/pwa/registre.js`, que només existix a l'entrada pròpia, escolta tres coses: eixe avís, el canvi de controlador de la primera visita i, amb un observador de Resource Timing, cada recurs amb empremta nou que carrega la pàgina.
3. Cada una d'estes causes programa el missatge per a mig segon després (`ESPERA_ESCALFAMENT_MS`), i les que arriben dins d'eixa espera s'hi ajunten. Així el chunk de l'app, que arriba després de l'avís, va en el mateix missatge. Una vista oberta més tard en provoca un altre.
4. El missatge porta els recursos amb empremta que la pàgina ha carregat i la ruta de l'app. Fora de /app/\* no s'envia res.
5. El worker ho torna a validar tot, escalfa els recursos que falten amb els mateixos sostres i confirma la closca de l'app de la pàgina. Si un dels recursos no s'ha pogut desar, no confirma res. Només demana l'HTML a la xarxa si la closca desada no és del build de la pàgina.

El component no parla mai amb el worker. Dins d'un amfitrió hi pot haver el worker d'un altre (un connector PWA de WordPress), i el paquet no ha de dependre de la pàgina que l'acull. Cap app ni la Gestoria toquen el worker: la guarda de la Gestoria (`src/sections/gestoria/privacitat.test.js`) veta l'API del worker del navegador.

### Cap dada del dispositiu puja al servidor sense una ADR pròpia

Pujar dades del dispositiu a Supabase demana una ADR pròpia, una safata d'eixida idempotent que només esborre amb una confirmació inequívoca del servidor ([[contingencia_offline]], §3) i RLS.

### Escriure amb una sessió desada és un indicador, no una autorització

El pont de sessió de les apps (`useSessioApp`) deixa escriure en local amb els motius `fora-de-linia` i `comprovant-desada`. Això només diu a la interfície què pot fer en este dispositiu. La seguretat de qualsevol dada que arribe al servidor és la RLS.

## Conseqüències

- Una app de /app/\* arrenca en fred sense xarxa si es complixen tres condicions: s'ha obert una vegada amb xarxa al lloc propi, en producció; la seua pàgina ha confirmat la closca; i la memòria encara té tots els recursos que eixa pàgina va carregar. Si no, ix la pàgina honesta en lloc d'un error de càrrega. L'única excepció és una vista que no s'ha obert mai amb xarxa (vegeu «Límits coneguts»). La resta del lloc es comporta igual que abans.
- El connector de WordPress i el Web Component no canvien: no reben cap worker i, dins d'un amfitrió, l'avís de les apps ni tan sols es fa.
- L'arrencada sense xarxa dins d'un amfitrió és responsabilitat de l'amfitrió ([[estandard_integracio_react]]).

## Límits coneguts

- Una vista que no s'ha obert mai amb xarxa no té el seu chunk desat. L'app arrenca, però eixa vista dona l'error de càrrega de sempre fins que torna la xarxa.
- La closca d'una app demana tots els recursos amb empremta que la pàgina havia carregat, també els de seccions de fora de l'app visitades abans en la mateixa pestanya. Això la fa més prudent del compte: si la poda se n'emporta un que l'app no necessita, ix la pàgina honesta.
- La poda FIFO de la memòria de recursos (300 entrades, 8 MiB) pot endur-se un recurs d'una closca. Llavors es dona la pàgina honesta fins a la pròxima visita amb xarxa.
- Hi ha una finestra curta entre l'avís de `RutaApps` i el missatge que porta el chunk de l'app: en una xarxa lenta, el primer missatge pot eixir sense ell. Este chunk ja és a la memòria, perquè el worker controla la pàgina, i el missatge següent l'afig a la closca. La closca només queda incompleta si la pestanya es tanca dins d'eixa finestra i la poda se l'emporta abans de la visita següent.
- La closca desada d'una app pot ser d'un build anterior al d'altres apps visitades després. Sense xarxa arrenca amb el seu build i amb els seus chunks.
- El 261007, les cinc apps locals declaren `entorn: 'desenvolupament'` i només entren al paquet de producció amb la seua bandera (`VITE_SDP_APP_BAR=1`, `VITE_SDP_APP_GESTORIA=1`…). El worker només es registra en producció: fins que el Mestre promoga una app a producció, la closca no té cap app que arrencar.
- El 261007, socdepoble.org encara servia un `sw.js` antic de Workbox, amb `cache-control: max-age=31536000, immutable`. El worker nou arriba amb el pròxim desplegament; convé servir `/sw.js` amb `no-cache`.
- Falta la verificació manual de la càrrega en fred sense xarxa a Chrome, Firefox i Safari.

## Propagació pendent de la signatura

Amb la skill wiki-propagar-veritat, una vegada signada:

- [[00_arquitectura_tecnica_unificada]]: les files 49 i 51.
- [[contingencia_offline]]: `vite-plugin-pwa` i Dexie ja no existixen.
- [[el_projecte]] (línia 24) i [[self_repair]] (línia 55).
- El missatge de la llei L4 de `tooling/gates/tractor-persistencia.mjs`.
- El compromís extern amb NLnet de l'ADR-2026-08, perquè esta esmena reobri una part de l'abast retirat.

## Proves

- `src/pwa/sw.test.js`: instal·lació neta sense xarxa, closca desada, actualització, cap HTML fora de /app/\*, escalfament amb sostres i patró, i Authorization i POST mai. També hi ha les proves d'una closca per app: després d'un desplegament, la visita a una altra app no canvia la closca de la primera; una closca sense confirmar o amb un chunk podat no es dona; una pestanya vella no la toca.
- `src/pwa/registre.test.js`: el missatge d'escalfament, l'escolta, l'espera, l'observador de recursos i la frontera del component.
- `src/apps/plataforma/escalfamentMemoriaCau.test.jsx`: l'avís de `RutaApps`, només al lloc propi i a cada canvi de ruta.

## Vincles

- [[ADR-2026-08-ONLINE-FIRST]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[00_arquitectura_tecnica_unificada]]
- [[contingencia_offline]]
- [[estandard_integracio_react]]
- [[00_index_maquina]]
