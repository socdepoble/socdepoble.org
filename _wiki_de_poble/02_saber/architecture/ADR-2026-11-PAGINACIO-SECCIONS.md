---
type: norma
status: esborrany
description: Capacitat opcional del port per a carregar progressivament el Mur, el Calendari del Mur i el Mercat més enllà de les 50 primeres publicacions, amb un cursor de conjunt de claus (created_at, id).
tags:
  - arquitectura
  - maquina
---
# ADR-2026-11 — Paginació de les seccions del Mur

Esta ADR afig al contracte del port una capacitat opcional, `paginacioSeccions`, perquè la interfície puga demanar les publicacions dels veïns que queden més enllà de la primera pàgina de `loadMur`. El nucli del contracte no canvia: un backend sense la capacitat continua sent vàlid.

## Estat

Pendent de signatura del Mestre.

La Decisió 4 del Mestre (261007, confirmada) diu: «Tall de 50 publicacions: CARREGA PROGRESSIVA (LOAD MORE). Un límit inicial de 50 és sa, però s'ha d'implementar un botó de "Carregar-ne més" o infinite scroll per a no deixar l'usuari a mitges.» El codi s'hi aplica el 261008. Mentre no es signe, la capacitat és opcional: llevar `loadSeccioPage` de l'adaptador torna la interfície a l'estat d'abans, sense cap botó.

## Context

- `loadMur` (adaptador Supabase, `src/data/supabase/content.js`) demana `section_submissions` de cada secció (`mur`, `events`, `mercat`) amb `order=created_at.desc,id.desc&limit=50`, i el port no tenia cap cursor.
- La publicació 51 desapareixia del Mur, de la cerca, de l'agenda i del detall sense cap avís: `/mur/<id>` deia «Element no trobat», encara que la fila continuava a la base (auditoria 261007, troballa «Tall de 50 publicacions per secció sense paginació»).
- El contracte del nucli és tot-o-res. Canviar el backend demana una ADR i el kit de conformitat ([[ADR-2026-09-SOLLUTIA-MODEL-B]]): un mètode nou al nucli deixaria fora tots els adaptadors que ja existixen.
- Ja hi havia un precedent: la capacitat `paginacioNotes` (`loadNotesPage`, cursor d'id, `{ notes[], complete, nextCursor }`).

## Decisió

### Una capacitat opcional, calcada de paginacioNotes

- `CAPACITATS.paginacioSeccions = ['loadSeccioPage']` a `src/data/contracte.js`, fora de `CONTRACTE_NUCLI`.
- `SECCIONS_PAGINABLES` (`mur` → `feedPosts`, `events` → `events`, `mercat` → `marketItems`) és la font única de les seccions que es paginen, per a l'adaptador, el kit de conformitat i `MurContext`. Notes té la seua capacitat i Multimèdia no és d'esta ordre.
- `loadSeccioPage({ seccio, cursor, limit, signal }, config) → { elements[], complete, nextCursor }`. Una secció que no és de `SECCIONS_PAGINABLES` rebutja amb un error. `limit` és com a molt 50 (per defecte, 50). `complete` i `nextCursor: null` van junts.
- `cursor: null` vol dir des de la publicació més nova dels veïns de la secció, sense el contingut de l'administració. Es pot solapar amb la primera pàgina de `loadMur`, i la interfície fusiona per id. El kit de conformitat la crida així.
- La interfície ho pregunta amb `teCapacitat('paginacioSeccions')`. Sense la capacitat, no pinta cap botó.

### La primera pàgina: un camp additiu i opcional de loadMur

`loadMur` continua tornant `{ feedPosts[], events[], marketItems[] }`. Ara hi pot afegir `paginacio: { [seccio]: cursor }`, només per a les seccions que tenen més files. L'absència del camp, o de la clau d'una secció, vol dir que la secció és completa. Un backend d'abans de la capacitat no el porta, i el kit de conformitat l'accepta igual.

S'ha triat esta via, i no derivar el cursor a la interfície des de l'element més antic de la primera pàgina, per tres motius:

1. El cursor és opac: només el llig l'adaptador que l'ha emés. La interfície no sap res de `created_at` ni de PostgREST (Model B).
2. La primera pàgina barreja el contingut de l'administració (`app_content`) amb les publicacions dels veïns, i la interfície no té cap marcador fiable per a distingir-les.
3. Només l'adaptador sap si queden més files (el total de `Content-Range`). Un cursor derivat a cegues prometria pàgines que no existixen.

### El cursor de conjunt de claus (created_at, id)

- L'ordre és `created_at.desc,id.desc`, el de sempre de la primera pàgina.
- El filtre de la pàgina següent és `or=(created_at.lt."X",and(created_at.eq."X",id.lt."Y"))`: estable amb empats de `created_at` i sense els salts d'un offset quan arriben publicacions noves.
- Els valors van entre cometes dobles i el filtre sencer passa per `encodeURIComponent`. Sense codificar, el `+` del fus horari arribaria com un espai.
- L'instant es compara en microsegons: Postgres en guarda sis decimals i `Date` en perdria tres.
- El cursor porta el poble i la secció, i no val per a un altre àmbit.
- Com a `loadNotesPage`, només un rang amb total (`Prefer: count=exact`) o una pàgina buida confirmen el final. Una pàgina que no avança és un error, mai una pàgina repetida.
- Una fila amb un `created_at` que no és un instant ISO normal (`-infinity`, una data aC o un any de cinc xifres) es pinta igual, però no fa de cursor ni entra en la comprovació d'ordre. El cursor ix de l'última fila que té una clau fiable. Una pàgina sense cap fila amb clau fiable és la darrera.
- Les pàgines següents passen pel mateix mapatge que la primera (`elementDeFilaPublicada`). El contingut de l'administració (`app_content`) només va a la primera.
- En mode de proves (`seed` i `local`) no hi ha cap pàgina més ni cap petició.

### La interfície: MurContext i el botó

- `MurContext` exposa `carregaMes(seccio)`, `hiHaMes(seccio)`, `carregantMes(seccio)` i `errorMes(seccio)`. Fusiona per id sense duplicats, la primera pàgina mana, i l'ordre és el de `sortPinnedContent`.
- Amb la Decisió 2 del Mestre (renovació silenciosa), un canvi d'AÏLLAMENT (backend, persona, actor o configuració) amaga les pàgines extres i els cursors en el mateix pintat i els buida en l'efecte de l'àmbit, avorta la petició en vol i descarta la resposta que arribe tard.
- Una revalidació de FRESCOR (la renovació del JWT o el refresh després de publicar) conserva les extres. Si la cua de la primera pàgina ha canviat, «Mostra més» torna a partir de la cua nova, perquè cap publicació empesa avall quede sense camí. Les publicacions empeses que ja es veien es queden al seu lloc: una revalidació no lleva res del que es veia.
- Un error de «Mostra més» és del cursor que ha fallat. Si una revalidació deixa la secció completa o en mou la cua, l'avís se'n va.
- El botó és el `Boto` de Pedra Seca, al final de la llista de /mur i de /mercat. Porta la clau `section.mur.loadMore` («Mostra més»), que ja era al diccionari en les cinc llengües. Mentre carrega està desactivat i amb `aria-busy`. Si falla, ix l'avís de sempre (`EstatErrorDades`) amb «Torna-ho a provar», que només torna a demanar les seccions que han fallat.
- Sense cap pàgina més, el DOM és el de sempre (Llei del Píxel).

## Conseqüències

- Les publicacions de més enllà de les 50 primeres tornen a ser abastables al Mur i al Mercat. Una vegada carregades, també ho són al detall, a la cerca i a l'agenda, que beuen de les mateixes llistes.
- La primera càrrega del Mur demana el total de cada secció (`Prefer: count=exact`): una comptada per secció al servidor.
- Un altre backend (WordPress o un node federat) continua sent vàlid sense la capacitat. Si la vol, ha de passar els dos casos nous del kit de conformitat (`src/data/conformitat/kit.js`).

## Límits coneguts

- Les pàgines extres no es revaliden: una publicació esborrada en una d'elles es queda fins al canvi d'àmbit o la recàrrega.
- El servidor talla per `created_at`, però el Mur ordena per la data que pinta la targeta (la de publicació, la de l'acte o la de l'edició). Una publicació antiga amb una data recent pot quedar en una pàgina posterior. Només es resol amb una columna o una vista d'ordre al servidor, i és una decisió pendent.
- `created_at` el posa el client a l'INSERT. El trigger `trg_force_submission_author` l'hauria de fitar a `now()` amb una migració pendent, fora d'esta ADR. Mentrestant, les files amb un `created_at` impossible no deixen cap pàgina en error. Com que no tenen clau, les de l'infinit negatiu i les aC es tornen a servir a la pàgina següent, i la interfície les fusiona per id. Si n'hi ha més de 50 seguides, les que passen de 50 no s'abasten. El remei de fons és eixa migració.
- Si entre dos clics de «Mostra més» arriben més de 50 publicacions noves a una secció, les que ixen d'una primera pàgina intermèdia no es veuen fins al clic següent, que les torna a portar.
- Quan una revalidació mou la cua de la primera pàgina, «Mostra més» torna a partir de la cua nova, també en una llista que ja s'havia carregat fins al final. El botó torna a eixir, i els clics porten pàgines que en part ja es veuen. És el preu de no deixar cap publicació sense camí.
- Un enllaç compartit a una publicació de més enllà de la primera pàgina continua dient «Element no trobat» fins que se'n carrega la pàgina. Cal una lectura per id (una capacitat `elementPerId`), pendent de decisió.
- El Calendari (/calendari) i l'històric de l'actor davall de l'editor no porten botó: queden com a preguntes al Mestre.
- El text del botó és «Mostra més» (`section.mur.loadMore`, la clau que ja hi havia). L'ordre del Mestre deia «Carregar-ne més»: canviar-lo és una línia de `src/config/i18n.js`, i queda com a pregunta al Mestre.

## Proves

- `src/data/supabase/content.paginacio.test.js`: el cursor, els empats, la codificació, el final del recorregut, el rang inconsistent, el cursor d'un altre àmbit, les files sense clau fiable i el mode de proves sense cap petició.
- `src/data/conformitat/kit.test.js` i `src/data/supabase/conformitat.test.js`: els casos del kit, amb la capacitat i sense, i el recorregut de punta a punta en remot contra un doble de PostgREST.
- `src/sections/mur/MurContext.test.jsx`: `carregaMes`, la fusió sense duplicats, l'aïllament que buida, la frescor que conserva (també les publicacions empeses avall), l'error que se'n va amb la cua i la resposta tardana descartada.
- `src/sections/mur/MurSection.carregaMes.test.jsx` i `src/sections/mercat/MercatSection.carregaMes.test.jsx`: el botó, només amb la capacitat i més pàgines, el reintent només de la secció que ha fallat i el DOM idèntic sense botó.
- `src/sections/mur/qualitat.carregaMes.test.js`: ESLint amb zero missatges, Model B i Pedra Seca.

## Vincles

- [[00_index]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[00_index_maquina]]
