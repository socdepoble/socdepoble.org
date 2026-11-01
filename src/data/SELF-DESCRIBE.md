---
type: document
status: actiu
description: Metadada auto-descriptiva de la capa de persistència de Sóc de Poble, el port neutral del Model B i les seues barreres mecàniques.
tags:
  - arquitectura
---
# SELF-DESCRIBE: la capa de persistència de Sóc de Poble

Este document és una metadada auto-descriptiva de la capa de persistència. Cada afirmació cita el fitxer que la sosté: si el fitxer canvia, este document es revisa amb ell.

## 1. El principi: el servidor és la font de veritat (online-first)

- Les dades compartides del poble tenen el servidor (Supabase) com a font de veritat, sense cap garantia de reconciliació fora de línia ni de CRDT. És el nucli vigent de l'ADR online-first (`_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md`, nota de vigència 261029).
- Online-first no vol dir zero emmagatzematge local. Hi ha magatzems locals declarats, i cap d'ells és la font de veritat de les dades compartides. Estos en són els principals:
  - l'autodesament dels escriptors registrats a `src/app/autodesamentEscriptors.js`: el text de la persona es desa a IndexedDB abans de cap petició, i la cua només l'oblida quan el servidor confirma eixa versió exacta (`src/data/autodesament/cua.js`, `src/data/autodesament/magatzem.js`);
  - les Notes, que no passen per eixa cua: el seu gestor desa els esborranys a IndexedDB (`'SdpNotesQueue'`) amb el CAS de revisió, reintenta i els reprén en carregar el Bloc (`src/sections/notes/GlobalSaveManager.js`, `src/app/autodesamentEscriptors.js`);
  - les dades que només viuen al dispositiu, amb el motor comú `creaMagatzemIdb` (`src/utils/magatzemLocal.js`, `_wiki_de_poble/02_saber/architecture/ADR-2026-10-APPS-DEL-DISPOSITIU.md`), i el cofre xifrat local de la Gestoria (`src/sections/gestoria/cofre/magatzemCofre.js`, `_wiki_de_poble/02_saber/architecture/ADR-2026-13-BYOP-XIFRAT-LOCAL.md`);
  - l'adaptador local (§2), que per defecte guarda les Notes en memòria i només les desa a IndexedDB amb `persistenciaNotes:'indexeddb'` (`src/data/local/adaptadorLocal.js`).
- La llista no és un cens complet: altres seccions obrin magatzems propis del dispositiu, com les aprovacions WebAuthn dels Tractors (`src/sections/tractors/nucli/magatzem.js`) o les carpetes locals recordades del Gestor d'arxius (`src/sections/multimedia/bibliotecaCarpetesLocals.js`).
- L'adaptador Supabase té tres modes de dades: `remote` (el per defecte, i també el d'un mode desconegut), `seed` i `local` (`normalizeDataMode` a `src/data/supabase/runtime.js`). En `seed` i `local` fan de servidor els mòduls locals (`src/data/localNotes.js`, `src/data/localXat.js`, `src/data/localPerfils.js` i `src/data/localSeguiments.js`, segons la capçalera de `src/data/local/adaptadorLocal.js`): una prova en eixos modes no acredita cap operació al servidor.

## 2. Injecció agnòstica (Llei de l'Enxufabilitat)

- L'adaptador de dades només s'endolla pel port neutral `src/data/backendPort.js`, que en valida la forma contra el contracte (`src/data/contracte.js`). Cap component de React importa un adaptador: fora de la seua carpeta, l'únic import permés de `src/data/supabase/` és el de `src/host.js` cap a `src/data/supabase/index.js` (`tooling/gates/tractor-enxufe.mjs`, E1).
- Hi ha dos adaptadors complets darrere del port, i tots dos passen el kit de conformitat `src/data/conformitat/kit.js` sense parlar amb cap servidor real. El kit acredita el contracte del port, no el comportament del servidor de producció:
  - l'adaptador Supabase (`src/data/supabase/index.js`), que `arrenca()` de `src/host.js` carrega quan el paquet no n'ha injectat cap. És el de les entrades productives. Passa el kit en mode `seed` i en una passada remota contra un doble del servidor (`src/data/supabase/conformitat.test.js`);
  - l'adaptador local (`src/data/local/adaptadorLocal.js`), sense Supabase i sense xarxa. Passa el kit en tres passades sense xarxa (`src/data/local/adaptadorLocal.conformitat.test.js`). Cap entrada de producció l'importa (frontera provada a `src/data/local/adaptadorLocal.test.js`): hi entra per `injectaBackendDelPaquet()` de `src/host.js` (`src/data/local/adaptadorLocal.host.test.js`) o directament en una prova.
- `src/host.js` congela el contracte en `arrenca()`. L'amfitrió (WordPress, Sollutia o un altre) configura presentació i navegació segons `sdp.amfitrio.v1` (`src/config/contracteAmfitrio.js`); les seues entrades de backend o tenant es descarten (`src/config/capaDelPaquet.js`).
- L'adaptador de dades és del paquet. `injectaBackendDelPaquet()` és una costura interna prèvia a l'arrencada: no la crida cap entrada (ni `src/main.jsx` ni `src/embed.jsx`), només les proves. La integració amb una API alternativa necessita un adaptador complet que passe el kit i proves amb els seus payloads reals.

## 3. Barreres mecàniques (portes)

- `src/config/storage.js` és l'única capa que toca l'emmagatzematge web, el local i l'efímer (`tooling/gates/tractor-persistencia.mjs`, L2). Les seues funcions són síncrones per contracte (L1) i només guarden identitat i preferències, res que puga créixer. El testimoni de sessió (`socdepoble-jwt`, `src/data/identitat.js`) hi va com a efímer.

## 4. Instàncies i moviments de l'amfitrió

- `src/PedraSecaEmbed.jsx` conserva l'arrel React per element. Dues instàncies vives poden conviure: cap pany global les substituïx.
- `disconnectedCallback()` espera una microtasca i comprova `isConnected` abans de desmuntar; un moviment síncron del DOM conserva la instància. Les instàncies desconnectades es netegen sense destruir els seus germans vius (`src/PedraSecaEmbed.jsx`).

*Eternitat a les dades. Tornem el poble a la gent, però amb la veritat per davant.*

## Vincles

- [[00_arquitectura_tecnica_unificada]]
- [[ADR-2026-08-ONLINE-FIRST]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[ADR-2026-10-APPS-DEL-DISPOSITIU]]
- [[ADR-2026-13-BYOP-XIFRAT-LOCAL]]
