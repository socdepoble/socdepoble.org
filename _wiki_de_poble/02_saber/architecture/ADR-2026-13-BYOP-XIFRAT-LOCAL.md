---
type: norma
status: esborrany
description: Xifrat local BYOP (Bring Your Own Password) per a les apps amb dades sensibles: el cofre de la Gestoria generalitzat en un nucli compartit, un magatzem xifrat damunt de creaMagatzemIdb, la clau només en memòria, l'XLSX i les còpies, i els riscos en un amfitrió de tercers.
tags:
  - arquitectura
  - seguretat
---
# ADR-2026-13 — Xifrat local BYOP: un cofre compartit per a les apps amb dades sensibles

Esta ADR respon a l'encàrrec del Mestre del 261010 (`261010_1148_prompt_claude_investigacio_seguretat`, §Instrucció del torn, línies 61-65): que la Gestoria i Salut es puguen obrir des de qualsevol amfitrió (Sollutia, un WordPress de tercers, el Fedivers) sense el «robatori d'independència» de la guarda financera, amb una segona contrasenya (BYOP) que xifre les dades privades a IndexedDB. No inventa cap criptografia: generalitza el cofre que la Gestoria ja té des de l'Onada 6 (`src/sections/gestoria/cofre/`) i el posa davall del motor d'IndexedDB que compartixen el Bar, la Nevera, Salut i el Lector (`creaMagatzemIdb`, `src/utils/magatzemLocal.js:90`). Document només: cap codi de producció canvia amb esta ADR.

## Estat

Esborrany, pendent de signatura del Mestre (Onada 11, 261010, tasca 4). Cap fase s'ha executat.

**Decisió de Direcció Tècnica, 261011** (ordres `261011_0130_ordres_nit_directora`, punt 3, D-16, D-17 i D-18). Tres de les huit preguntes ja tenen resposta. El que l'ordre diu, literal, i res més:

- **D-16:** «Un cofre compartit de moment.» (§Preguntes, 2)
- **D-17:** «A WordPress NO relaxem la privacitat si el cofre és actiu.» (§Preguntes, 3)
- **D-18:** «Salut usarà claus opaques on siga possible per evitar fugues laterals de meta-informació, o es mantindrà l'arquitectura bàsica si trenca codi (vull neteja no grans refactors de dades aquesta nit).» (§Preguntes, 5) El codi de Salut no ha canviat.

Continuen obertes les preguntes 1, 4, 6, 7 i 8. La 1 (quina app entra primer) bloqueja la fase 3.

**El que és decisió i el que és proposta.** La resta de l'ADR s'ha ajustat a eixes tres frases, i en fer-ho Claude ha anat més enllà de l'ordre en quatre punts. Cap dels quatre està decidit; tots porten la marca «proposta de Claude, pendent del Mestre» allà on apareixen:

1. Retirar la fase 4 per a QUALSEVOL amfitrió. L'ordre només parla de WordPress; Sollutia, l'iframe d'un tercer i el Fedivers no hi són (fase 4).
2. La fase 3b sencera: com es fan opaques les claus de Salut (identificador aleatori, migració en dos temps).
3. Descartar les claus derivades amb HMAC (§Alternatives).
4. Llegir la pregunta 4 com si D-16 ja l'haguera estreta (una sola política d'autobloqueig).

**El que canvia en l'abast.** L'encàrrec demanava obrir la Gestoria i Salut des de qualsevol amfitrió. Amb D-17 això no passa a WordPress: el cofre protegix les dades en repòs al lloc propi i deixa el terreny preparat, però dins d'un WordPress estes dues apps continuen dient «només s'obri a la pàgina pròpia» (`PortalApps.jsx:36-37`). Per a la resta d'amfitrions l'ordre no diu res, i el codi d'hui tampoc els obri: la guarda no distingix WordPress de cap altre document que no siga el propi (`interruptors.js:80-82`).

## Context

**El que hi ha hui.**

- El cofre de la Gestoria és un disseny complet i provat, JS pur sobre WebCrypto natiu, sense cap dependència (`cripto.js:1-28`):
  - KDF PBKDF2-HMAC-SHA-256 de 600.000 iteracions, sal aleatòria de 16 B, paràmetres versionats `{ v: 1, kdf, iter, sal }` (`cripto.js:30-37`, `:226-228`); el sòl de les iteracions és el de producció i `llegixParametres` refusa res per davall (`cripto.js:236-240`).
  - KEK AES-KW-256 derivada, NO extraïble, només `wrapKey`/`unwrapKey` (`cripto.js:259-267`).
  - DEK AES-GCM-256 aleatòria (`cripto.js:285-287`), embolcallada dues vegades: amb la KEK de la frase i amb la KEK d'un codi de recuperació de 128 bits en base32 (`cripto.js:107-160`, `cofre.js:234-242`). La DEK de treball es desembolcalla NO extraïble (`cripto.js:299-306`).
  - Cada registre: IV de 12 B aleatori a cada xifrat (`cripto.js:38`, `:368`; amb IVs aleatoris de 96 bits, NIST SP 800-38D §8.3 limita cada DEK a 2^32 xifrats: la rotació en fa una de nova), AAD `sdp.gestoria.cofre.v1|<col·lecció>|<id>` (`cripto.js:44`, `:334`), text farcit a múltiples de 4 KiB (`cripto.js:42`, `:337-343`), etiqueta GCM de 128 bits (`cripto.js:370`).
  - Una frase errònia fa fallar el desembolcallat AES-KW: `CONTRASENYA_ERRONIA`, res desxifrat (`cofre.js:213-221`). Un registre mogut de lloc o tocat: `REGISTRE_MANIPULAT`, res a mitges (`cripto.js:382-402`).
  - La DEK viu en una clausura (`let sessio`, `cofre.js:115`, `:146-160`) i es descarta en bloquejar (`cofre.js:137-143`): botó, 10 min d'inactivitat, 5 min amagat o `pagehide` (`autobloqueig.js:19`, `:103-124`), i en eixir de la vista de l'Històric (`Historic.jsx:565`).
  - Rotació: `renovaCodi`, `obreAmbCodi` i `canviaContrasenya({ rotaClau: true })` fan una DEK nova i tornen a xifrar tots els registres en UNA transacció, amb comprovació de meta i d'IVs (`cofre.js:265-293`, `magatzemCofre.js:266-284`).
  - Còpia xifrada `FORMAT_COPIA` i exportació en clar només amb `CONFIRMACIO_EN_CLAR` i la frase vigent (`cofre.js:48-52`, `:520-533`, `:586-601`).
- **El cofre només protegix una col·lecció**: la configuració de l'Històric (`COLLECCIO_HISTORIC = 'historic'`, `Historic.jsx:76`), a la base `sdp-gestoria-cofre` (`magatzemCofre.js:28`). El llibre de factures (`src/sections/gestoria/facturacio/registre/portIndexedDB.js`) i tot Salut (base `sdp-salut`, `src/apps/salut/magatzem.js:22`) van a IndexedDB en clar: cap fitxer de Facturació ni de Salut importa el cofre (`rg 'cofre'` sobre eixos arbres, 261010, zero resultats fora de proves).
- Les quatre apps de la recepta escriuen per `creaMagatzemIdb`: llista blanca per store (`magatzemLocal.js:283-296`), una sola pestanya escriptora amb Web Locks (`:520-568`), avís entre pestanyes que només porta el nom del store (`:136-139`) i memòria quan IndexedDB no s'obri la primera vegada (`:141-145`, `:200-211`).
- La guarda: `dadesPersonals` `'salut'` i `'financeres'` només s'obrin quan l'app és l'ama del document (`NOMES_AL_DOCUMENT_PROPI`, `interruptors.js:46-49`, `:80-82`; `esAmaDelDocument`, `:134-138`). Ho declaren Salut (`src/apps/salut/manifest.js:49`) i la Gestoria (`src/apps/gestoria/manifest.js:49`); el Bar, la Nevera i el Lector, `false` (`bar/manifest.js:67`, `nevera/manifest.js:32`, `lector/manifest.js:30`). Els ids estan reservats (`DADES_RESERVADES`, `registreApps.js:43`). L'ADR-2026-12 §6 ho fixa i la seua fase 2, punt 5, exclou estos mòduls de WordPress.
- El build d'un mòdul veta tot magatzem no declarat (`MAGATZEMS`, `guardesDelModul.js:55-61`); els cinc declaren només `'idb'` (`:89-98`).
- Les exportacions XLSX es fan en memòria amb `creaXlsx` (`src/utils/fulls/xlsx.js:1-24`), JS pur, a partir d'un model: Salut amb `exporta()` (`src/apps/salut/nucli/exportacio.js:28-32`), l'Històric amb `creaLlibreGestora` (`llibreGestora.js:266`, cridat des de `Historic.jsx:408`).
- Tot cap dins del Baseline Canònic 2022 (Safari/iOS 16, Chrome 100, Firefox 100) sense cap polyfill: PBKDF2, AES-KW i AES-GCM de WebCrypto són a Safari des de l'11; els Web Locks del motor d'IndexedDB (`magatzemLocal.js:520-568`), des de Safari 15.4; `crypto.randomUUID` (Safari 15.4) té reserva amb `getRandomValues` a `cripto.js:319-326`.

**El que demana el Mestre** (prompt, §Tasques i §Riscos, línies 70-81): derivació AES-GCM/PBKDF2 d'una segona contrasenya; intercepció de lectura/escriptura a IndexedDB per a xifrar els camps sensibles al vol; clau només en memòria i destruïda en tancar; viabilitat de l'XLSX; riscos de keylogger, DOM compromés, pèrdua de clau i pes.

## Decisió

### 1 · El cofre ix de la Gestoria: `src/utils/cofre/`

Els quatre fitxers del cofre (`nucli/cripto.js`, `cofre.js`, `magatzemCofre.js`, `autobloqueig.js`) es mouen a `src/utils/cofre/` sense canviar cap paràmetre criptogràfic: les constants de `cripto.js:30-44` són les del nucli compartit. Dues coses deixen de ser literals de la Gestoria i passen a ser un argument `espai` de `creaCofreLocal`:

- el prefix de l'AAD, `PREFIX_AAD = 'sdp.gestoria.cofre.v1'` (`cripto.js:44`), que passa a `sdp.<espai>.cofre.v1`;
- els formats `FORMAT_COFRE`, `FORMAT_COPIA` i `FORMAT_CLAR` (`cofre.js:48-50`) i el nom de la base `NOM_BD_COFRE` (`magatzemCofre.js:28`), que passen a `sdp.<espai>.cofre[.copia|.clar]` i `sdp-<espai>-cofre`.

Amb `espai = 'gestoria'` tot és byte a byte el d'ara: els cofres creats a l'Onada 6 continuen obrint-se.

**Un sol cofre (decisió 261011, D-16).** La plataforma crea UNA instància de `creaCofreLocal`, i totes les apps que hi entren la compartixen: la mateixa frase, el mateix codi de recuperació, la mateixa DEK, la mateixa sessió i el mateix autobloqueig. `espai` es queda com a argument del nucli, amb un sol valor en ús. Les apps no se separen per clau sinó per l'AAD de cada sobre (`<base>|<store>|<clau>`, §Decisió, 2): un sobre de Salut no s'obri com si fora de la Gestoria, però qui té la sessió oberta ho pot obrir tot. Proposta d'aplicació, no ordenada: que eixa instància única siga la que ja existix (base `sdp-gestoria-cofre`, AAD `sdp.gestoria.cofre.v1`), perquè donar-li un nom neutre obligaria a migrar els cofres de l'Onada 6; el nom «gestoria» quedaria com a nom històric de la base. Si el Mestre vol un nom de plataforma, és una migració a banda amb la seua prova. «De moment» vol dir que un cofre per app continua sent possible més avant sense tocar la criptografia: seria un segon valor d'`espai`. `src/sections/gestoria/cofre/` queda com a reexportació (`cofreDeLaGestoria`, `persistenciaDelCofre`, `PortaCofre.jsx`, `useCofre.js`), i `PortaCofre` és la porta universal: crear, obrir, recuperar, canviar, còpia i exportació en clar. El cofre guanya dos mètodes, `xifra(lloc, valor)` i `desxifra(lloc, sobre)`, que usen la DEK de la sessió sense traure-la de la clausura (`COFRE_BLOQUEJAT` si no hi ha sessió, com `desa`/`llig`, `cofre.js:472-493`).

### 2 · El magatzem xifrat: `creaMagatzemXifrat` damunt de `creaMagatzemIdb`

Un embolcall amb la MATEIXA API que `creaMagatzemIdb` (`obte`, `totes`, `perIndex`, `desa`, `desaTots`, `actualitza`, `esborra`, `buida`, `buidaTot`, `bolca`, `subscriu`, `obtinBloqueig`, `tanca`: `magatzemLocal.js:315-598`), que rep el cofre i, per store, els camps que es xifren:

```js
// pseudocodi · src/utils/cofre/magatzemXifrat.js (no provat)
export function creaMagatzemXifrat({ cofre, xifrats, ...definicio }) {
  // xifrats: { apunts: ['tipus', 'moment', 'ofsetMin', 'notes'], meta: ['valor'] }
  // La clau i els índexs de cada store (definicio.stores[s].clau, .indexs) NO
  // poden ser a xifrats: IndexedDB els llig per a indexar. Són etiquetes.
  const neteja = definicio.llistaBlanca;                      // la de l'app, com ara
  const base = creaMagatzemIdb({ ...definicio, llistaBlanca: ambSobre(neteja, xifrats) });
  const lloc = (store, clau) => `${definicio.nom}|${store}|${clau}`;  // → AAD sdp.<espai>.cofre.v1|<lloc>

  async function tanca(store, registre) {                     // abans de put()
    const net = aplica(neteja[store], registre);
    if (!xifrats[store]?.length) return net;                  // store sense xifrats: idèntic a hui
    const secret = pren(net, xifrats[store]);                 // els camps xifrats, fora del registre
    const sobre = await cofre.xifra(lloc(store, net[clau]), secret);   // { iv, xifrat } en base64
    return { ...senseEls(net, xifrats[store]), _x: { v: 1, ...sobre } };
  }
  async function obri(store, fila) {                          // després de get()/getAll()
    if (fila == null || !xifrats[store]?.length) return fila; // cap fila, o store sense xifrats: en clar, com hui
    if (!fila._x) llanca('REGISTRE_MANIPULAT');               // store xifrat sense sobre: mai es servix en clar
    const secret = await cofre.desxifra(lloc(store, fila[clau]), fila._x);  // REGISTRE_MANIPULAT si no quadra
    return { ...senseEls(fila, ['_x']), ...secret };
  }
  return {
    ...base,
    obte: async (s, k) => obri(s, await base.obte(s, k)),
    totes: async (s) => Promise.all((await base.totes(s)).map((f) => obri(s, f))),
    perIndex: async (s, i, v) => Promise.all((await base.perIndex(s, i, v)).map((f) => obri(s, f))),
    bolca: async () => obriCadaStore(await base.bolca()),
    desa: async (s, r) => obri(s, await base.desa(s, await tanca(s, r))),
    desaTots: async (s, rs) => base.desaTots(s, await Promise.all(rs.map((r) => tanca(s, r)))),
    actualitza: async (s, k, fn) => {                         // vegeu §Límits coneguts, 3
      const actual = await obri(s, await base.obte(s, k));
      const nou = fn(actual);
      if (nou === undefined) return actual;
      const sobre = await tanca(s, nou);
      return obri(s, await base.actualitza(s, k, (ara) => (ara?._x?.iv === actual?._x?.iv ? sobre : llanca('CONFLICTE'))));
    }
  };
}
```

El que es desa al disc de l'amfitrió, per registre: la clau en clar, els índexs en clar i un sobre `_x` `{ v, iv, xifrat }` en base64, com les files del cofre d'ara (`magatzemCofre.js:50`). El store i la clau són etiquetes, no dades, com ja diu `magatzemCofre.js:23-24`: per això una app que entre al cofre ha de tindre claus que no diguen res (§Límits coneguts, 2). L'AAD lliga cada sobre a la base, al store i a la clau: un sobre copiat a un altre lloc no s'obri. Un store sense camps a `xifrats` passa per `creaMagatzemIdb` tal qual: mateixos bytes, mateix DOM (Llei del Píxel). En un store amb `xifrats`, una fila sense sobre `_x` no es servix mai en clar: `REGISTRE_MANIPULAT`, com un sobre tocat; les files que hui ja són en clar hi entren per la migració de la fase 2b, no per esta porta. En bloquejar, el cofre avisa els subscriptors (`cofre.js:142`) i l'app buida el que tenia desxifrat, com fa `useHistoric.js:173`.

### 3 · La clau de sessió: en una clausura, mai en cap magatzem

La DEK de treball és una `CryptoKey` NO extraïble (`cripto.js:299-306`) que viu a `sessio.dek` dins de la clausura de `creaCofreLocal` (`cofre.js:115`, `:151`). No va a `sessionStorage` ni a `localStorage`:

- tots dos només guarden text, i qualsevol script del mateix origen (un connector de WordPress, un tema, una extensió del navegador amb permís sobre el lloc) els llig amb una línia;
- una `CryptoKey` no extraïble no es pot serialitzar (`exportKey` falla): l'únic que s'hi podria desar és la frase o la DEK en clar, que és justament el que el disseny prohibix (`cofre.js:21-23`);
- IndexedDB sí que admet una `CryptoKey` per clonació estructurada, també no extraïble, i qualsevol script del mateix origen la podria USAR sense llegir-la (fet de les especificacions de WebCrypto i d'IndexedDB, no d'este repositori): per això la regla és «cap magatzem», no «cap magatzem de text».

Es destruïx amb l'autobloqueig (`autobloqueig.js:19`: 10 min d'inactivitat, 5 min de pestanya amagada, `pagehide`), en eixir de la vista (`Historic.jsx:565`), amb `tanca()` (`cofre.js:604-607`) i quan una altra pestanya canvia la frase, el codi o la clau (`COFRE_CANVIAT`, `cofre.js:171-175`).

### 4 · L'XLSX i les còpies

- **XLSX**: `creaXlsx` és pur i treballa sobre un model en memòria (`xlsx.js:1-24`). L'app llig pel magatzem xifrat (desxifrat al vol amb el cofre obert), munta el model i genera els bytes just abans de descarregar, com ja fa l'Històric (`Historic.jsx:404-415` → `llibreGestora.js:266`). Res canvia a `src/utils/fulls/`. El full ix EN CLAR: és la seua raó de ser (el metge, la gestora). L'avís «sense xifrar» que l'Històric ja mostra abans de descarregar (`Historic.jsx:431-432`) és el patró universal.
- **Còpia xifrada** (`FORMAT_COPIA`): els paràmetres, les dues DEK embolcallades i els registres xifrats, cap byte en clar (`cofre.js:520-533`). És la via de portabilitat entre nodes del Fedivers: s'importa amb la frase i només si TOTS els registres superen la integritat (`cofre.js:546-580`). Els sobres del magatzem xifrat entren a `registres` de la còpia amb la base, el store i la clau, els tres: `base = <nom de la base>`, `colleccio = <store>` i `id = <clau>`. Amb un sol cofre per a diverses bases (D-16) els dos últims no basten: Salut i una altra app tenen cadascuna el seu store `meta`, i dos registres `meta|persona` xocarien dins de la còpia; i l'AAD de cada sobre és `<base>|<store>|<clau>` (§Decisió, 2), de manera que sense la base l'importador no la pot reconstruir i cap sobre superaria la integritat. És un camp nou de `FORMAT_COPIA`: els registres del cofre d'ara (la col·lecció `historic`, sense base) s'han de continuar llegint, i la fase 2 ho ha de fixar amb una prova de còpia amb dues bases que porten el mateix store i la mateixa clau.
- **Exportació en clar** (`FORMAT_CLAR`): només amb el text exacte `CONFIRMACIO_EN_CLAR` («Entenc que el fitxer ix sense xifrar», `cofre.js:52`) marcat per la persona (`PortaCofre.jsx:354`) i la frase vigent (`cofre.js:586-601`).

### 5 · Els riscos, dits clars

- **Amfitrió maliciós (WordPress compromés, mateix origen).** BYOP protegix les dades EN REPÒS: el que hi ha a IndexedDB no s'obri sense la frase. NO protegix la sessió oberta: un script del mateix origen pot posar un escoltador de teclat al camp de la frase, llegir el que l'app té desxifrat en memòria (l'estat de React, el model del full) o substituir el component que pinta la porta. El Shadow DOM aïlla estils i consultes del DOM; no és una frontera de seguretat: el mateix `window`, el mateix `crypto.subtle`, el mateix heap. Per això la guarda `NOMES_AL_DOCUMENT_PROPI` ES MANTÉ (`interruptors.js:46-49`). A WordPress, també amb el cofre actiu: decisió de Direcció Tècnica del 261011 (D-17). Per a la resta d'amfitrions l'ordre no diu res; mantindre-la igual per a tots és proposta de Claude, pendent del Mestre (fase 4), i és el que fa el codi d'hui, on `avaluaApp` no rep cap senyal del cofre.
- **Un sol cofre, una sola sessió (D-16).** Amb el cofre compartit, una sessió oberta per a apuntar a Salut deixa també a l'abast les dades de la Gestoria, i a l'inrevés. És el preu de tindre una sola frase. Ho acoten l'autobloqueig (la seua política continua oberta, §Preguntes, 4) i la guarda de dalt.
- **Pèrdua de la frase.** Sense frase ni codi de recuperació, les dades no es recuperen: no hi ha porta del darrere, a propòsit. Ho mitiga el codi de recuperació de 128 bits (`cripto.js:39`, `:107-131`), que es mostra una sola vegada i no es guarda (`cofre.js:21-23`, `:357-360`), la confirmació «l'he apuntat» (`useCofre.js:173-177`) i la còpia xifrada fora de l'ordinador (`useCofre.js:184`). Una recuperació amb el codi rota la clau i en dona un de nou (`cofre.js:388-417`).
- **Pes.** Zero dependències: WebCrypto natiu, quatre fitxers de JS pur. El cost és el KDF, pagat una vegada en obrir (i en rotar): 600.000 iteracions de PBKDF2-HMAC-SHA-256. El temps no s'ha mesurat en este repositori (la prova de producció, `cofre.test.js:260-268`, comprova els paràmetres, no el temps): la fase 0 el mesura en un mòbil de gamma baixa i ho anota ací. No s'abaixa: és la xifra que recomana l'OWASP (Password Storage Cheat Sheet) per a este KDF, el cost és per obertura i no per registre, `llegixParametres` refusa res per davall (`cripto.js:240`) i, si cal un KDF més fort, els paràmetres ja porten versió (`cripto.js:11-13`): Argon2id seria una `v: 2`, no unes iteracions menys.
- **El que el cofre no amaga.** El store, la clau i la mida en blocs de 4 KiB (`cripto.js:42`). Les claus i els índexs de cada store queden en clar. A Salut, hui: l'índex `jornada` dels apunts (`salut/magatzem.js:64`) i la clau `data` de les jornades (`:65`) diuen quins dies tenen apunts, no què diuen. Les marques `creat` i `modificat` de cada apunt (`useSalut.jsx:83`, `diccionari.js:598`) són instants ISO i diuen el dia igual: si no entren al sobre, amagar la clau no servix de res. La decisió del 261011 (D-18) és llevar-ho on es puga; el com és la fase 3b, que és proposta.

## Alternatives descartades

- **Hooks de Dexie.** No hi ha Dexie al projecte (ADR-2026-08) i `creaMagatzemIdb` ja és el punt únic d'intercepció.
- **Xifrar la base sencera com un sol blob.** Perd `perIndex` i `actualitza`, i cada escriptura reescriu tot: fora per a Salut (apunts per jornada) i per al Bar.
- **Una clau per dispositiu sense frase (WebAuthn `prf`, o una DEK desada a IndexedDB).** Qualsevol script del mateix origen la podria usar: no protegix res davant de l'amfitrió, que és el cas que el Mestre vol cobrir. L'extensió `prf` queda fora del Baseline 2022.
- **`sessionStorage` per a sobreviure una recàrrega.** Llegible pel mateix origen i no admet una `CryptoKey`: només hi cabria el secret en clar.
- **Un iframe d'origen propi (socdepoble.org) dins de WordPress.** Sí que seria una frontera (origen diferent, IndexedDB propi), però el codi deixaria de ser del paquet de l'amfitrió i tornaria a dependre del nostre servidor. Es deixa com a pregunta (§Preguntes, 8).
- **Un cofre per app** (una frase per a Salut i una altra per a la Gestoria). Descartat de moment per la decisió del 261011 (D-16): dues frases i dos codis de recuperació per a la mateixa persona. Queda a un valor d'`espai` de distància.
- **Relaxar la guarda a WordPress amb el cofre actiu** (part de l'antiga fase 4). Descartat per la decisió del 261011 (D-17). Relaxar-la en altres amfitrions no està decidit: vegeu la fase 4.
- **Claus opaques derivades amb HMAC** (la clau de la jornada com a HMAC de la data amb una clau del cofre). **Proposta de Claude, pendent del Mestre: descartar-la.** L'ordre no en parla. Donaria claus deterministes, però demana una tercera clau embolcallada al cofre i canviar-ne el format. Salut ho carrega tot d'una vegada i busca en memòria (`salut/magatzem.js:85-86`, `useSalut.jsx:66`): un identificador aleatori fa el mateix servei sense tocar el cofre (fase 3b).

## Conseqüències

- Un sol disseny criptogràfic a la plataforma: el de `cripto.js`, amb proves ja escrites. Cap app n'inventa un altre.
- Tota app que entre al cofre hereta la porta (`PortaCofre`), l'autobloqueig, la còpia xifrada i l'exportació en clar amb confirmació: el mateix comportament a la Gestoria, a Salut i al que vinga.
- `creaMagatzemXifrat` és asíncron per dins (WebCrypto): `actualitza` deixa de ser una sola transacció (§Límits coneguts, 3).
- Les apps amb cofre demanen sessió: sense cofre obert, `COFRE_BLOQUEJAT`, com l'Històric d'ara (`useHistoric.js:113`). La UI ho diu, no ho amaga.
- A WordPress la guarda de document propi no es relaxa amb el cofre actiu: decisió del 261011 (D-17). `interruptors.js` no canvia amb esta ADR i `interruptors.test.js` continua sent la prova que ho fixa. L'ADR-2026-12, fase 2, punt 5, continua excloent de WordPress els mòduls amb dades sensibles. Si la guarda es pot relaxar en un altre amfitrió queda obert (fase 4).
- Una frase per a tot (D-16): menys coses a recordar i a perdre, i una sola sessió que ho obri tot mentre dura. Les apps amb cofre compartixen la porta i la còpia xifrada, que per això ha de dir de quina base és cada registre (§Decisió, 4).
- Si s'accepta la fase 3b (proposta), Salut canvia de forma al disc quan entre al cofre: les jornades deixen de tindre la data com a clau i els apunts perden l'índex per jornada. És una migració de dades i del motor (`magatzemLocal.js:159-166` només crea stores i índexs, no en lleva ni en canvia la clau).
- El build dels mòduls no canvia: el cofre només usa IndexedDB, que els cinc ja declaren (`guardesDelModul.js:89-98`).

## Fases

0. **Mesura i mapa** (sense codi de producció). Primer pas: una prova `[MESURA]` que cronometre `kekDeFrase` amb 600.000 iteracions i ho anote ací; i la llista, per app, dels camps que són dada i dels que són etiqueta (clau, índexs). Proves: cap. Llei del Píxel: trivial.
1. **El nucli ix** (`src/utils/cofre/`). Primer pas: moure els quatre fitxers i afegir `espai` amb el valor per defecte `'gestoria'`; `src/sections/gestoria/cofre/` reexporta. Proves: les de `cofre.test.js`, `cripto.test.js`, `magatzemCofre.test.js`, `autobloqueig.test.js` i `HistoricCofre.seguretat.test.jsx` passen sense canvis; una prova nova fixa que amb `espai: 'gestoria'` l'AAD, els formats i el nom de la base són byte a byte els d'ara, i que un cofre creat amb el codi de l'Onada 6 (fixture) s'obri. Píxel: `/app/gestoria/historic` idèntic.
2. **El magatzem xifrat** (`creaMagatzemXifrat`). Primer pas: l'embolcall amb `xifrats` buit per a tots els stores i la prova que els bytes desats són exactament els de `creaMagatzemIdb` (Píxel al disc). Després, les proves de seguretat: rebuig (frase errònia → `CONTRASENYA_ERRONIA`, cap registre tornat; cofre bloquejat → `COFRE_BLOQUEJAT`), manipulació d'AAD (un sobre copiat a un altre store, a una altra clau o a una altra base → `REGISTRE_MANIPULAT`; un byte del `xifrat` o de l'`iv` → el mateix), rotació (`renovaCodi` torna a xifrar tots els sobres d'una base en una transacció; els sobres vells no s'obrin amb la DEK nova ni els nous amb la vella; amb el cofre compartit de D-16, a més, el protocol entre bases de §Límits coneguts, 8) i el sobre que no entra a la llista blanca sense el cofre.
   - **2b · Migració** (tanca la fase 2, abans que cap app lliga pel magatzem xifrat). El gallet és l'ENTRADA d'una app al cofre, no la creació del cofre: amb D-16 el cofre és un de sol i, quan Salut o el llibre de factures hi entren, ja pot existir (l'Històric el crea des de l'Onada 6). La migració s'executa la primera vegada que l'app obri el seu magatzem xifrat amb el cofre obert i troba files sense sobre; si el cofre encara no existix, es crea abans per la porta de sempre. Cal una marca per base (a la seua `meta`, o a la del cofre amb el nom de la base) que diga «esta base ja és dins»: sense ella, una base a mitges no es distingix d'una manipulada. Primer pas: reescriure tots els registres dels stores amb `xifrats` per `tanca()` en UNA transacció, amb el patró de `rota` (`magatzemCofre.js:266-284`: comprovació de la meta i de les files llegides, `clear()` i `put()` de tots els sobres, res escrit si alguna cosa ha canviat entremig), i comprovar en acabar que no queda cap fila sense `_x`; el magatzem xifrat no servix cap lectura fins que la migració acaba. Proves: «la migració deixa zero files en clar» (el `bolca()` del magatzem base només torna sobres) i «fila sense sobre en store xifrat → `REGISTRE_MANIPULAT`». Píxel: dades, no pantalla.
3. **La primera app** (la que diga el Mestre, §Preguntes, 1). Primer pas: `creaMagatzemSalut` (o el magatzem de la Gestoria) rep el cofre compartit (D-16) i declara `xifrats`; la vista va darrere de `PortaCofre`. Proves: la privacitat de l'app (`src/apps/salut/privacitat.test.js`) continua dient que només `magatzem.js` parla d'IndexedDB; l'XLSX es genera igual amb el cofre obert i no es genera amb el cofre bloquejat; la còpia xifrada s'importa en un navegador net. Píxel: només canvia el que el Mestre ordene (la porta).
   - **3b · Claus opaques de Salut. PROPOSTA DE CLAUDE, PENDENT DEL MESTRE.** L'ordre (D-18) només diu que Salut usarà claus opaques «on siga possible»; tot el que seguix (què es canvia, com es deriva l'identificador, la migració) és disseny de Claude i no està decidit. Aniria amb la fase 3 quan l'app siga Salut, i no abans: una clau opaca al costat d'un registre en clar no amaga res, perquè el `moment` de cada apunt ja diu el dia.
     - **El mapa d'hui** (codi del 261011). `apunts`: clau `id`, un `crypto.randomUUID()` (`useSalut.jsx:22`, `:83`), ja opaca; les marques `creat` i `modificat`, instants ISO que posa `desaApunt` (`useSalut.jsx:81-83`) i que el diccionari conserva (`diccionari.js:598`), diuen el dia i l'hora de cada apunt tant com el `moment`; índex `jornada` en clar (`magatzem.js:64`), que cap lector de producció consulta (`perIndex` només apareix a `magatzem.test.js:27`: l'app ho llig tot amb `bolca()`, `magatzem.js:85-86`, i torna a calcular la jornada en memòria amb `assignaJornades`, `useSalut.jsx:65`). `jornades`: clau `data`, la data mateixa (`magatzem.js:65`): diu quins dies s'han marcat. `periodes` i `valoracions`: clau `id` aleatòria (`useSalut.jsx:98`, `:104`), ja opaques; `inici` i `setmanaInici` són camps, no claus. `meta`: cinc claus de nom fix (`magatzem.js:24`); que hi haja la fila `apagats` o `descartades` diu que la família ha tocat eixe ajust, no quin.
     - **El que es canvia.** (1) `jornades` passa de clau `data` a clau `id`, i `data` entra al sobre amb `completa` i `notes`. (2) `apunts` perd l'índex `jornada` i el camp `jornada` deixa de desar-se: es calcula en llegir, com ara. (3) Tots els camps d'un apunt que porten temps van DINS del sobre: `moment`, `ofsetMin`, `creat` i `modificat`, a més del contingut. Fora només queda l'`id`. Deixar-ne un fora (les marques `creat` i `modificat` són les fàcils d'oblidar, perquè no són dada clínica) diu el dia igual que la clau que es vol amagar. El mateix per a `inici` dels períodes, `setmanaInici` de les valoracions i les dates dins de `descartades`, `avis` i `ultimaCopia` de la meta: al sobre. (4) `meta` conserva les cinc claus de nom fix com a etiquetes; el seu `valor` va al sobre.
     - **La funció de derivació.** Cap derivació criptogràfica: `id = crypto.randomUUID()`, assignat la primera vegada que es desa una jornada. `marcaJornada(data, …)` (`useSalut.jsx:93`) busca la fila d'eixa data al `Map` en memòria (`useSalut.jsx:66`) i en reutilitza l'`id`; si no n'hi ha, en fa un. La unicitat per data la garantix que només una pestanya escriu (Web Locks, `magatzemLocal.js:520-568`) i es comprova en llegir: dues files amb la mateixa data són un error que es diu, no es fusiona en silenci. En memòria la jornada continua sent `{ data, completa, notes? }` més l'`id`: les vistes, el full i les mesures no canvien.
     - **La migració.** Dos temps, perquè WebCrypto és asíncron i no cap dins d'una transacció de canvi de versió. Primer, `VERSIO_BASE` 1 → 2 (`magatzem.js:23`), síncron dins de l'`onupgradeneeded`: llegir `jornades`, esborrar el store, tornar-lo a crear amb clau `id` i reescriure cada fila amb un `id` nou; llevar l'índex `jornada` d'`apunts`. El motor hui només crea stores i índexs (`magatzemLocal.js:159-166`): cal donar-li una migració per versió, que és codi compartit amb el Bar, la Nevera i el Lector i demana les seues proves. Després, la fase 2b xifra totes les files en una transacció.
     - **El que no canvia.** El format de la còpia `sdp.salut.copia.v1` (`nucli/copia.js:17`): les jornades hi viatgen amb `data` i es fusionen per `data` (`copia.js:88`); l'`id` del disc no ix a la còpia ni al full. `importa` (`useSalut.jsx:141-142`) ja compara `r.id ?? r.data`: per a les jornades ha de comparar sempre `data`.
     - **Proves.** `magatzem.test.js`: una base de la versió 1 amb jornades (fixture) s'obri en la 2 amb les mateixes dates, `completa` i `notes`, cada una amb un `id` distint, i sense l'índex `jornada`; el `bolca()` del magatzem base, amb el cofre posat, no conté cap text amb forma de data ni d'instant ISO (ni `moment`, ni `creat`, ni `modificat`, ni `inici`, ni `setmanaInici`) als valors ni a les claus de cap store; dues files amb la mateixa data → error dit. `copia.test.js` i `full.test.js`: sense canvis (la còpia i el full ixen byte a byte iguals). `privacitat.test.js`: només `magatzem.js` parla d'IndexedDB. Una còpia feta abans de la migració s'importa després. Píxel: cap pantalla canvia.
4. **La guarda.** Dues parts, i només una està decidida.
   - **A WordPress: RETIRADA** per la decisió del 261011 (D-17). Amb el cofre actiu, `'salut'` i `'financeres'` continuen tancades dins d'un WordPress.
   - **A la resta d'amfitrions (Sollutia, l'iframe d'un tercer, el Fedivers): PROPOSTA DE CLAUDE, PENDENT DEL MESTRE: retirar-la també.** L'ordre no en parla. L'argument és el de §Decisió, 5: el cofre protegix el disc, no la sessió oberta en un origen que no és nostre, i això val igual per a qualsevol document aliè. Si el Mestre vol obrir-la per a algun amfitrió, el disseny original continua valent: `avaluaApp` rep `cofreActiu` i l'amfitrió, i `NOMES_AL_DOCUMENT_PROPI` deixa passar només amb cofre actiu i amb un motiu nou (`document-no-propi-amb-cofre`) que pinta un avís («En este lloc les teues dades es guarden xifrades; mentre el cofre és obert, el lloc podria llegir-les»), amb `interruptors.test.js` per als casos propi/no propi × amb/sense cofre × amfitrió.
   - En els dos casos, quan el cofre arribe a la plataforma (fase 3) toca afegir a `interruptors.test.js` el cas que fixa el que s'haja decidit. Hui `avaluaApp` no rep cap senyal del cofre.
5. **WordPress: RETIRADA** per la decisió del 261011 (D-17). El connector de l'ADR-2026-12, fase 2, punt 5, continua sense admetre mòduls amb dades sensibles, porten cofre o no.

## Preguntes al Mestre

Les respostes porten data i origen. Una pregunta sense resposta continua oberta.

1. Quines apps entren primer? Salut (tot en clar hui) o la Facturació de la Gestoria (el llibre de factures, en clar a `portIndexedDB.js`)? L'Històric ja hi és.
   - **Oberta.** Les ordres del 261011 no ho diuen. Bloqueja la fase 3.
2. Un cofre per app (una frase per a Salut, una altra per a la Gestoria, bases separades) o un de compartit per a la plataforma (una frase, una sessió, un autobloqueig)? Compartit és més senzill per a la persona i més exposat: una sessió oberta obri tot.
   - **Decisió de Direcció Tècnica, 261011 (D-16):** «Un cofre compartit de moment.» Aplicada a §Decisió, 1 i 5, a §Conseqüències i a la fase 3.
3. Es relaxa la guarda a WordPress amb cofre actiu per a `'financeres'` i `'salut'` (fase 4)? Amb quin text d'avís? Esta ADR recomana NO per a `'financeres'` mentre el llibre de factures no vaja al cofre.
   - **Decisió de Direcció Tècnica, 261011 (D-17):** «A WordPress NO relaxem la privacitat si el cofre és actiu.» L'ordre parla de WordPress i de «la privacitat», sense distingir `'salut'` de `'financeres'`: es llig per a les dues. La part de WordPress de la fase 4 i la fase 5 queden retirades. Què es fa en altres amfitrions, l'ordre no ho diu: continua obert (fase 4, amb la proposta de Claude). Comprovat al codi el 261011: `NOMES_AL_DOCUMENT_PROPI` només es llig a `avaluaApp` (`interruptors.js:80-82`), que mira `ctx.amaDelDocument` i res més; cap fitxer de `src/` nomena `cofreActiu` ni cap motiu `document-no-propi-amb-cofre`. Esta ADR encara no és a `src/data/wikiManifest.js` (hi ha l'enllaç de l'índex, no l'element): fins que es regenere amb `node tooling/wiki/compile-wiki-to-app.mjs`, l'enllaç de la Wiki integrada no troba la pàgina.
4. La política d'autobloqueig: els 10 min / 5 min de la Gestoria valen per a Salut (una família que apunta durant tot el dia)? Configurable per app o fixa per a totes?
   - **Oberta**, sencera. Observació de Claude, no decisió: amb el cofre compartit de D-16 una sola sessió ho obri tot, i una política distinta per app demanaria dir què passa amb les altres quan una es bloqueja. El Mestre pot voler-la igualment.
5. Les claus en clar: Salut indexa els apunts per `jornada` i les jornades per `data` (`salut/magatzem.js:64-65`). S'accepta que els dies amb apunts es vegen, o Salut passa a claus opaques (migració de la base)?
   - **Decisió de Direcció Tècnica, 261011 (D-18):** «Salut usarà claus opaques on siga possible per evitar fugues laterals de meta-informació, o es mantindrà l'arquitectura bàsica si trenca codi (vull neteja no grans refactors de dades aquesta nit).» Avaluat el 261011: els apunts, els períodes i les valoracions ja tenen clau opaca; la clau `data` de les jornades i l'índex `jornada` dels apunts no es poden canviar sense migrar les dades desades i sense ampliar el motor, i a més no amagarien res mentre els registres siguen en clar. No s'ha tocat el codi de Salut: es manté l'arquitectura bàsica. Com fer-ho més avant és la fase 3b, que és proposta de Claude i espera el Mestre.
6. El llibre de factures és de només afegir i encadenat (`portIndexedDB.js:4-13`): si entra al cofre, l'encadenament es verifica sobre el text en clar (desxifrar per a verificar) o sobre el sobre? Decisió de la Facturació, no d'esta ADR.
7. Les dues confirmacions d'exportació en clar que hi ha hui (el diàleg de l'XLSX, `Historic.jsx:431`, i la casella més la frase de `exportaEnClar`, `PortaCofre.jsx:341-354`) s'unifiquen en una? Quina?
8. L'iframe d'origen propi dins de WordPress (§Alternatives) és una via que vols que s'estudie, o queda fora pel Model B?

## Límits coneguts

1. **Cap línia de codi s'ha escrit ni executat per a esta ADR**: el pseudocodi de §Decisió, 2, no s'ha provat. Les cites de codi són de l'arbre del 261010; les de les decisions del 261011 (Estat, fase 3b i respostes de §Preguntes), de l'arbre del 261011.
2. **Les claus i els índexs van en clar**, i `xifraValor` exigix un id opac (`cripto.js:311`, `:328-331`, `:361`): el magatzem xifrat necessita els mètodes `xifra`/`desxifra` amb lloc lliure (§Decisió, 1) o claus opaques a cada store. Per a Salut, la decisió del 261011 (D-18) tria les claus opaques on siga possible; la manera (fase 3b) és proposta. Fins que s'execute, la data de les jornades, l'índex dels apunts i les seues marques de temps continuen en clar.
3. **`actualitza` deixa de ser atòmic.** `creaMagatzemIdb.actualitza` fa `fn` síncrona dins de la transacció (`magatzemLocal.js:395-425`); WebCrypto és asíncron i una transacció d'IndexedDB es tanca sense peticions pendents. El pseudocodi fa llegir → desxifrar → `fn` → xifrar → escriptura condicionada per l'IV, el mateix patró que `rota` (`magatzemCofre.js:272-276`): detecta el conflicte, no l'evita.
4. **La memòria de reserva.** Quan IndexedDB no s'obri, `creaMagatzemIdb` treballa en memòria (`magatzemLocal.js:141-145`); el cofre, en canvi, es nega (`SENSE_INDEXEDDB`, `magatzemCofre.js:58-60`). Esta ADR proposa que el magatzem xifrat es negue, com el cofre.
5. **El temps del KDF no està mesurat** (fase 0).
6. **Res protegix la sessió oberta en un origen compromés** (§Decisió, 5). Esta ADR no ho resol: ho diu.
7. **Les dades que hui ja són en clar** (tot Salut, el llibre de factures) no es xifren soles. Sense la fase 2b, el disc de l'amfitrió conservaria files en clar al costat dels sobres i, si el magatzem les servira, la integritat promesa (§Context, `REGISTRE_MANIPULAT`) quedaria buida: per això la fase 2b va abans de la 3 i `obri()` refusa tota fila sense `_x` en un store amb `xifrats`. El que IndexedDB conserve físicament d'una fila sobreescrita (còpies internes del motor, compactació pendent) queda fora de l'abast d'esta ADR.
8. **La rotació amb un cofre compartit no és atòmica entre bases** (conseqüència de D-16, sense resoldre). Hui `rota` torna a xifrar tots els registres en UNA transacció perquè tots viuen a la base del cofre (`magatzemCofre.js:266-284`). Amb una sola DEK per a diverses bases (`sdp-gestoria-cofre`, `sdp-salut`…), una transacció d'IndexedDB no en cobrix més d'una: una rotació tallada a mitges deixaria una base amb la DEK nova i una altra amb la vella. La fase 2 ha de portar el protocol (la DEK vella es conserva embolcallada fins que totes les bases han acabat, amb una marca de rotació pendent a la meta) i la seua prova, abans que una segona app entre al cofre.
9. **Les decisions del 261011 són de Direcció Tècnica**, preses de nit amb el Mestre absent (`261011_0130_ordres_nit_directora`). L'ADR continua en esborrany fins a la signatura del Mestre.

## Proves

Les que cada fase ha de portar, totes vitest al costat del codi:

- `src/utils/cofre/cofre.test.js`, `cripto.test.js`, `magatzemCofre.test.js`, `autobloqueig.test.js`: les d'ara, mogudes, sense canvis de comportament; més la paritat amb `espai: 'gestoria'` i la fixture de l'Onada 6.
- `src/utils/cofre/magatzemXifrat.test.js`: Píxel al disc amb `xifrats` buit; rebuig; manipulació d'AAD (store, clau, base); rotació; sobre fora de la llista blanca; `actualitza` amb conflicte; `bolca` desxifrat; cofre bloquejat a mitja operació; fila sense sobre en store xifrat → `REGISTRE_MANIPULAT`; la migració (fase 2b) deixa zero files en clar.
- `src/apps/salut/privacitat.test.js` (o el de la Gestoria): un sol fitxer parla d'IndexedDB; cap xarxa.
- `src/apps/salut/magatzem.test.js` (fase 3b): la migració de la versió 1 a la 2 conserva les jornades amb un `id` opac i lleva l'índex `jornada`; amb el cofre posat, cap data en clar al disc.
- `src/utils/cofre/magatzemXifrat.test.js` (límit 8): una rotació tallada entre dues bases es reprén i cap sobre queda sense clau que l'òbriga.
- `src/utils/cofre/cofre.test.js` (§Decisió, 4): una còpia amb dues bases que porten el mateix store i la mateixa clau s'importa sense xoc i cada sobre supera la integritat; una còpia de l'Onada 6, sense el camp de la base, es continua llegint.
- `src/apps/plataforma/interruptors.test.js`: dins d'un WordPress la guarda NO canvia (D-17), amb cofre o sense. Per als altres amfitrions, el que el Mestre decidisca a la fase 4.
- `src/apps/plataforma/guardesDelModul.test.js` i `modulDeBuild.test.jsx`: el cos amb el cofre només declara `'idb'`.

## Vincles

- [[00_index]]
- [[00_index_maquina]]
- [[ADR-2026-12-MODULS-OPCIONALS]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
