---
type: document
status: esborrany
description: Mesures del Node 0 del 2026-11-03, compilació municipal comprovada i tall històric de mides i preus del 2026-11-01, amb els límits encara no mesurats.
tags:
  - arquitectura
  - maquina
---
# Perfil mínim d'allotjament d'un node municipal

**Un node municipal** és la instal·lació del Mas electrònic que **servix un poble**: la seua web, les **seues dades** i la **seua federació**, amb el **contracte del port neutral** que descriu [[api_port_neutral_i_allotjament_model_b]]. Este document recull què necessita un node municipal del Mas: web estàtica, base de dades, Storage, funcions i federació. Servix a qui haja de triar entre un **allotjament gestionat** i un d'autoallotjat. Les taules de mides i costos conserven el **tall històric del 2026-11-01**; els preus no s'han revalidat després d'eixe dia. La secció 1.1 incorpora una **mesura directa del Node 0 del 2026-11-03** i les seccions 3 i 5, les proves noves de l'instal·lador.

## 1. Tall i mètode

- **Tall:** 2026-11-01, 04:38 CET, HEAD `a6e4b0d81` de la branca `backup-notes-publish`, amb l'arbre de treball compartit (no net) i Node v24.13.0.
- **Web:** `dist/` tal com estava, del build de les 04:07:11; per a este document no s'ha reconstruït res.
- **Compressió:** Node `zlib`, gzip de nivell 9 i Brotli de qualitat 11, fitxer per fitxer.
- **Producció:** `curl` a `https://socdepoble.org` amb `Accept-Encoding` `br`, `gzip` i `identity`.
- **Base de dades:** recompte sobre `supabase/migrations/*.sql` i `supabase/functions/`; no s'ha consultat cap projecte remot.
- **Instal·lador:** `tests/inicia-node-germa.test.mjs` executa `tooling/instalador/inicia-node-germa.mjs` per a Xixona en un directori temporal. A les 04:38 la font era l'arbre de treball; des del Gauntlet del 261101 és la release de HEAD extreta amb `git archive` (secció 3).

### 1.1 Mesura directa del Node 0 · 2026-11-03

**Lectura** per l'**accés SSH ja configurat** `macmini` (`192.168.0.23`), amb `BatchMode=yes`, `ConnectTimeout=5` i `StrictHostKeyChecking=yes`. **No s'ha modificat cap servei**, **instal·lat cap paquet** ni **llegit cap credencial**. **Comandes executades:** `date -u`, `uname -srm`, `sw_vers`, `sysctl hw.model hw.memsize hw.physicalcpu hw.logicalcpu machdep.cpu.brand_string`, `vm_stat`, `top -l 1 -n 0`, `df -k /`, `df -k /System/Volumes/Data` i `sysctl vm.swapusage`.

| Mesura | Resultat observat | Tall UTC |
| --- | --- | --- |
| Maquinari | Mac16,10, Apple M4, arm64, 10 nuclis físics i lògics | 2026-11-03T15:23:43Z |
| RAM física | 25.769.803.776 bytes = 24 GiB | 2026-11-03T15:23:43Z |
| Sistema | macOS 27.2, build 26B123; Darwin 27.2.0 | 2026-11-03T15:23:43Z |
| CPU, una instantània de tot l'amfitrió | 1,11 % usuari, 10,00 % sistema, 88,88 % inactiva | 2026-11-03T15:23:43Z |
| Càrrega mitjana a 1, 5 i 15 minuts | 1,14 / 1,19 / 1,43 | 2026-11-03T15:23:43Z |
| Memòria de tot l'amfitrió, eixida de `top` | 23G usada, amb 1950M wired i 278M de compressor; 668M sense usar | 2026-11-03T15:23:43Z |
| Intercanvi de memòria | `vm.swapusage`: total, usada i lliure 0,00M | 2026-11-03T15:24:45Z |
| Volum APFS de dades | 482.797.652 KiB totals; 99.964.356 KiB usats (95,33 GiB); 358.070.968 KiB disponibles compartits (341,48 GiB); 22 % segons `df` | 2026-11-03T15:24:45Z |

`vm_stat` declara pàgines de 16.384 bytes: 679.909 actives, 673.898 inactives, 124.774 wired, 17.801 ocupades pel compressor i 36.257 lliures. Les unitats `G` i `M` de la fila de `top` es conserven com les va imprimir l'eina. La memòria usada inclou macOS, altres processos i memòria cau: **no és la RAM que necessita el servei de Sóc de Poble**. CPU i càrrega són una instantània de la màquina, no una prova de concurrència ni un mínim d'allotjament. En APFS els volums compartixen espai; les xifres de `/` i `/System/Volumes/Data` no se sumen.

**Encara no mesurat:** **consum elèctric en watts o kWh** i **mida real de la base de dades de producció**. En este carril no s'ha disposat d'una **sessió SQL no interactiva ja establerta** amb què consultar-la; **no s'han llegit `.env`**, desbloquejat el clauer ni iniciat sessions noves. **No hi ha Nix**, `nix-instantiate` ni `nix-store` en el PATH consultat del Mac de treball ni del Node 0. Docker existix al Mac de treball, però el seu **daemon no està disponible**; **no s'ha arrancat**.

## 2. Web estàtica

El Mas es publica com una web estàtica (`dist/`) i qualsevol amfitrió que reproduïsca les regles de la secció 2.3 la pot servir.

| Mesura de `dist/` | Valor |
| --- | --- |
| Fitxers | 1.100 |
| Fitxers que Firebase publica (`ignore` de `firebase.json`) | 1.021 |
| Bytes (suma dels fitxers) | 144.347.726 (137,66 MiB) |
| Bytes que Firebase publica | 143.902.850 |
| Imatges JPG, WebP i PNG | 456 fitxers, 126,95 MiB (92,2 %) |
| JavaScript | 342 fitxers, 6.825.336 bytes |
| CSS | 2 fitxers, 2.199 bytes |
| Fonts (dos `.woff2`) | 95.756 bytes |
| Rutes amb La Torre de les Maçanes | 52 fitxers, 24.458.025 bytes |

El recompte de **1.021 fitxers publicables** coincidix amb el **desplegament a Firebase Hosting** que cita el prompt de la marató nocturna, però `dist/` **no és el build desplegat**: **producció servix** el de les 01:39 CET (`last-modified` 00:39:59 GMT), amb l'entrada `index-DeBPBAUV.js`, de la **mateixa mida** que l'entrada local `index-BoNloTr2.js` (1.461.491 bytes) i amb **bytes diferents**.

**L'ocupació en disc** no és a la taula: depén del **sistema de fitxers**, i el mateix dia `du -sk` en va donar **xifres diferents** per als **mateixos 1.100 fitxers** i els **mateixos bytes** (de 143.416 a 164.028 KiB). Per a l'allotjament compta la **suma de bytes**.

### 2.1 Recursos principals comprimits

| Recurs | Cru | gzip -9 | Brotli 11 |
| --- | --- | --- | --- |
| `index.html` | 5.536 | 2.102 | 1.795 |
| `fonts/noto-sans.css` | 2.170 | 1.012 | 947 |
| `assets/index-BoNloTr2.js` (entrada) | 1.461.491 | 404.555 | 331.412 |
| Closca inicial (les tres) | 1.469.197 | 407.669 | 334.154 |
| Tot el JavaScript | 6.825.336 | 2.203.425 | 1.905.389 |
| `assets/wikiManifest-C60Infyk.js` | 577.927 | 199.642 | 163.777 |
| `assets/DocumentEditor-CX-ooyxg.js` | 499.021 | 161.233 | 137.271 |

Les xifres són en bytes. La closca inicial és el que `index.html` referencia directament; la resta de mòduls es carreguen quan s'obri cada secció.

### 2.2 Comprovació en producció

- `https://socdepoble.org/` torna un `index.html` de 5.536 bytes.
- El mòdul d'entrada publicat, `assets/index-DeBPBAUV.js`, ocupa 1.461.491 bytes sense comprimir, 404.553 amb gzip i 331.369 amb Brotli.
- La resposta porta `cache-control: public, max-age=31536000, immutable` i la capçalera `x-served-by` mostra nodes de memòria cau (MAD i TOJ).

### 2.3 Regles que ha de reproduir l'amfitrió

Font: `firebase.json` del repositori. Un altre amfitrió estàtic necessita l'equivalent de cada punt.

- **Directori publicat:** `dist`, sense els fitxers que comencen per punt excepte `.well-known/`, i sense `node_modules`.
- **Seguretat a totes les rutes:** `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy` i `Permissions-Policy`.
- **Memòria cau:** `no-cache` fora d'`/assets` i `/fonts`; un any i `immutable` per als fitxers amb empremta de `/assets`.
- **CORS:** a `/assets/**`, al `host-meta`, a WebFinger, a NodeInfo i a `/ap/**`.
- **Tipus de contingut:** XRD per al `host-meta`, JRD per als fitxers de WebFinger i ActivityStreams (`application/activity+json`) per a `/ap/**`, que es guarda 300 segons.
- **Barres finals:** `trailingSlash: false` i `cleanUrls: false`. Cada ruta prerenderitzada es servix des del seu `index.html` sense barra final, i l'adreça amb barra final redirigix amb un 301 a la que no en porta (comprovat amb `/page/fediversity/` el 2026-11-01).
- **Associació d'apps:** `appAssociation: NONE`: Firebase no genera pel seu compte cap fitxer d'associació d'apps; s'hi servix només el que porta `dist/`, i és el que ha de servir un altre amfitrió.
- **Reescriptures:** tres per a WebFinger, lligades al domini `socdepoble.org`, i la de l'aplicació d'una pàgina per a tot el que no és `assets`, `fonts`, `ap` ni `.well-known`.
- **Servidor propi:** el mòdul NixOS de `flake.nix` servix el mateix amb nginx i inclou les regles de WebFinger per paràmetre que genera `tooling/seo/genera-federacio.mjs --servidor`.

## 3. Release que copia l'instal·lador

- **Contingut (FEDI-05, 2026-11-03):** `src`, `public`, `tooling`, `scripts`, i, si hi són a la release, `nix` i les tres carpetes públiques de Wiki (`01_ser`, `02_saber`, `03_actuar`). També `package.json`, `package-lock.json`, `index.html`, `vite.config.js`, `firebase.json`, `flake.nix`, `LICENSE`, `AGENTS.md` i el marcador `.agents/AGENTS.md`; `flake.lock` només si la release el porta. No es copia la resta de `.agents` ni la Wiki privada, l'Escriptori o l'arxiu.
- **Fora de la release:** l'instal·lador no copia `supabase/` (migracions i funcions). Per al mode `remote`, l'administrador les pren del repositori a la mateixa versió.
- **Mida mesurada a l'arbre de treball:** 3.628 fitxers i 176.131.477 bytes a les 04:38. A les 04:27 eren 3.623 fitxers: l'arbre canvia mentre altres agents hi treballen, i per això la prova pren la release de HEAD amb `git archive`, que no canvia.
- **Còpia:** l'instal·lador va copiar la release sencera de l'arbre de treball en 0,64 segons en esta màquina.
- **Construcció:** `npm ci` i `npm run build:web` són opcionals (`--build`). Les dependències d'este repositori ocupen 320.944 KiB a `node_modules`, amb 378 entrades de primer nivell; uns 39 MB d'eixa xifra són memòries cau de Vite i Vitest (`.vite` i `.vitest-cache`) i restes d'una instal·lació a mitges (`.acorn-*`, `.aria-query-*`…), que un `npm ci` net no tindria. `npm ci` necessita accés al registre de npm.
- **Prova (FEDI-05, 2026-11-03):** `SDP_NODE_GERMA_BUILD_REAL=1 node --test --test-concurrency=1 tests/inicia-node-germa.test.mjs` passa 8/8. Instal·la una release de HEAD per a Xixona en un temporal i executa `npm run build:web` real (5,8 s en este tall), amb les dependències locals contrastades amb `package-lock.json`: 529 versions coincidents, cap divergent ni necessària absent. No executa una instal·lació nova amb `npm ci` ni desplega o servix el node. Comprova els documents compilats d'actor, JRD, NodeInfo i host-meta amb la identitat de Xixona.
- **Integritat:** `node-germa.json` registra el SHA-256 de cada fitxer instal·lat. Per a `firebase.json`, que s'adapta al node nou, conserva també `sha256Font`, l'empremta dels bytes originals. La font no es modifica. El node no hereta `site` ni `target` de Firebase: l'operador ha de triar explícitament el seu projecte i lloc abans de desplegar.
- **Recepta del flake executada sense Nix (FEDI-05):** `node tooling/seo/comprova-reproductibilitat.mjs --treball /private/tmp --recepta flake --json` ha construït dues còpies de la mateixa instantània pública, amb UTC/C i Europe/Madrid/ca_ES.UTF-8. Les dues produïxen 1.070 fitxers idèntics byte a byte, digest `9042da05b6b8e92b80b583a6bc7ae97403845ed33d40d7cc09330159783146c4` (7,9 s i 7,5 s). El flake arrel inclou `scripts/botigues/associacio-apps.json` i compartix la revisió immutable de nixpkgs amb `nix/flake.nix`, sense el pegat redundant. Açò prova la recepta amb Node, **no** `nix eval`, `nix build`, la VM NixOS/Nginx ni un `flake.lock` generat per Nix.

## 4. Base de dades, Storage i funcions

El node en **mode `remote`** necessita un **projecte Supabase** amb les **migracions de la mateixa versió aplicades** i el seu `tenantId`. Les migracions i les funcions **no viatgen amb la release** (secció 3): **l'administrador** les pren del repositori. En **mode `seed`** no en necessita cap: és una **demostració**.

- **Migracions, inventari històric del 2026-11-01:** 64 fitxers SQL, de `2609080000_initial_schema.sql` a `2610312000_e2ee_lot3_validadors_service_role.sql`. Les noves migracions posteriors no formen part d'este recompte; les files següents d'esquema i funcions també corresponen a eixe tall, sense verificació del remot.
- **Esquema:** 48 taules creades, en els esquemes `public` i `private`, i 101 sentències `create policy` al llarg de les migracions (el text apareix 102 voltes; una és dins d'un comentari).
- **Extensions:** `pgcrypto`, que una migració crea. `pg_cron` és opcional: quatre tasques es programen només si ja està activa (`sdp-purga-baixes`, `sdp-purga-paperera-notes`, `sdp-neteja-xat-adjunts` i `sdp-purga-altes-seguiments`). `pg_net` només hi apareix per a dir que no s'usa.
- **Realtime:** la publicació `supabase_realtime` inclou `public.xat_missatges`.
- **Funcions, tall actual del 2026-11-03:** cinc entrades `index.ts` a `supabase/functions/`: `compte-apple`, `noticies`, `purga-fitxers`, `ap-inbox-verifica` i `notifica-xat`; més el codi compartit de `_shared`. És un inventari de fonts, no de funcions desplegades. `purga-fitxers` llig la clau de servei i `SDP_CRON_SECRET` de l'entorn de la funció (`Deno.env`); `compte-apple` llig la clau de servei, els cinc secrets d'Apple (els identificadors d'equip, de clau i de client, la clau privada i la clau dels testimonis; els noms exactes són al codi de la funció, perquè el client web no els ha de nomenar mai) i `SDP_CRON_SECRET`.
- **No mesurat:** la mida de la base de dades de producció. Cal consultar-la al projecte abans de fixar el disc d'un node gran.

| Bucket | Públic | Límit per fitxer (bytes) | Tipus admesos |
| --- | --- | --- | --- |
| `mitjans` | sí | 5.242.880 | WebP, JPEG, PNG i AVIF |
| `mitjans_privats` | no | 25.242.880 | WebP, JPEG, PNG, AVIF i PDF |
| `xat_adjunts` | no | 20.000.000 | WebP, JPEG, MP4, WebM, QuickTime, àudio WebM, MP4 i Ogg, i `application/octet-stream` per als adjunts xifrats (E2EE) |

### 4.1 Administració multipoble · assaig SQL local del 2026-11-03

- **PostgreSQL 17.5 en memòria**, mitjançant **PGlite 0.3.16** ja disponible: s'han aplicat les **74 migracions reals** fins a la 1700. **18 casos passen**; les fonts SQL conserven les mateixes empremtes.
- **Helper real** de superadmin i **aal2**, permisos d'execució, aïllament entre pobles, claus privades ocultes, versions i historial. **Auth, Storage i Realtime** tenen infraestructura de prova explícita.
- **Reproducció opcional:** `SDP_PGLITE_MODULE` indica un mòdul local existent a `tests/administracio-multipoble-postgres.test.mjs`. Sense mòdul, la suite declara una **omissió**, no una prova SQL superada.
- **Límit:** no s'han validat GoTrue, PostgREST ni un servidor Supabase; **no s'ha aplicat cap migració remota**. Esta prova tampoc mesura la mida de la base de dades de producció.

## 5. Federació d'un node germà

La prova de l'instal·lador genera la federació del node de Xixona des de la còpia instal·lada, amb la mateixa ordre que el mòdul NixOS.

- **Coherent:** NodeInfo 2.1, `host-meta`, WebFinger i les regles d'nginx usen l'origen del node, i cap fitxer publicat conté `socdepoble.org`.
- **Identitat municipal comprovada:** el generador llig `node-germa.json` i publica un sol actor, Xixona, amb la seua outbox; cap actor de La Torre ni del projecte. La prova D-13 i el build real de FEDI-05 ho comproven.
- **Reescriptures (FEDI-05):** l'instal·lador reutilitza `reglesFirebaseWebFinger` del generador per a adaptar reescriptures i capçaleres al domini i poble nous. Conserva les altres regles de la release i rebutja una compilació sense la identitat esperada.
- **Llavor:** la release copia les fotos i les pàgines de La Torre de la demostració.
- **Límit:** la còpia, la federació generada i el build web de Xixona estan comprovats en local; el desplegament d'eixa còpia i la federació interactiva amb una instància externa no s'han executat en estes proves.

## 6. RAM i CPU d'un servidor autoallotjat

- **Supabase autoallotjat amb Docker:** mínim de 4 GB de RAM, 2 nuclis i 40 GB de SSD; recomanat 8 GB o més, 4 nuclis o més i 80 GB o més de SSD. Font: [Supabase, Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker), consultada el 2026-11-01. La pàgina afig que activar els registres i l'analítica augmenta els requisits.
- **Web estàtica sola:** el tall del 2026-11-01 suma 0,14 GB de fitxers. La instantània del Node 0 de la secció 1.1 no aïlla nginx ni altres serveis; no determina capacitat de concurrència ni requisits mínims de CPU/RAM.
- **Construcció:** no cal fer-la al servidor; amb Node 24 i les dependències de la secció 3 es pot construir en una altra màquina i copiar `dist/`.

## 7. Preus oficials consultats

Totes les pàgines es van consultar el 2026-11-01. Cap mostrava data d'actualització dels preus. Les xifres són tal com les publiquen, sense impostos.

| Servei | Xifra | Font |
| --- | --- | --- |
| Supabase Free | 500 MB de base de dades, 1 GB de fitxers, 5 GB d'eixida, 50.000 usuaris actius al mes, pausa després d'una setmana d'inactivitat, 2 projectes actius | [supabase.com/pricing](https://supabase.com/pricing) |
| Supabase Pro | des de 25 $ al mes per projecte: 8 GB de disc, 100 GB de fitxers, 250 GB d'eixida, 100.000 usuaris actius al mes i 10 $ de còmput que cobrixen una instància Micro (1 GB de RAM) | [supabase.com/pricing](https://supabase.com/pricing) |
| Supabase Pro, excés | 0,125 $/GB de disc, 0,09 $/GB d'eixida, 0,0213 $/GB de fitxers | [supabase.com/pricing](https://supabase.com/pricing) |
| Firebase Hosting | sense cost fins a 10 GB d'emmagatzematge i 360 MB al dia de transferència; en el pla Blaze, després 0,026 $/GB i 0,15 $/GB; domini propi i SSL en els dos plans | [firebase.google.com/pricing](https://firebase.google.com/pricing) |
| Hetzner CX23 | 2 vCPU, 4 GB, 40 GB NVMe, 20 TB de trànsit, 5,99 € al mes (Nuremberg i Hèlsinki) | [hetzner.com/cloud/cost-optimized](https://www.hetzner.com/cloud/cost-optimized) |
| Hetzner CX33 | 4 vCPU, 8 GB, 80 GB NVMe, 20 TB de trànsit, 8,99 € al mes | [hetzner.com/cloud/cost-optimized](https://www.hetzner.com/cloud/cost-optimized) |
| Hetzner CPX02 | 1 vCPU, 1 GB, 20 GB NVMe, 20 TB de trànsit, 6,49 € al mes | [hetzner.com/cloud/regular-performance](https://www.hetzner.com/cloud/regular-performance) |
| Hetzner CPX32 | 4 vCPU, 8 GB, 160 GB NVMe, 20 TB de trànsit, 35,99 € al mes | [hetzner.com/cloud/regular-performance](https://www.hetzner.com/cloud/regular-performance) |

Les dos pàgines de Hetzner mostraven el 2026-11-01 l'avís «This product is currently unavailable» a cada pla.

## 8. Tres escenaris de cost mensual

Supòsit comú, no mesurat: una visita nova transferix uns 2 MB. La closca comprimida (334.154 bytes) i les fonts (95.756 bytes) sumen 0,43 MB; la resta són imatges i mòduls de secció, i una WebP de `dist/` fa 175.752 bytes de mitjana.

| Escenari | Peces | Cost mensual | Quota o límit |
| --- | --- | --- | --- |
| A. Demostració estàtica (`seed`) | Firebase Hosting sense cost | 0 € | 360 MB al dia: unes 180 visites noves diàries |
| B. Node gestionat (`remote`) | Supabase Pro i Firebase Hosting Blaze | 25 $ amb 3.000 visites al mes (6 GB, dins dels 360 MB diaris); 27,88 $ amb 15.000 (30 GB, 19,2 GB × 0,15 $) | 8 GB de disc i 250 GB d'eixida de Supabase |
| C. Node autoallotjat (`remote`) | Supabase amb Docker i nginx a Hetzner | 5,99 € amb el mínim de Supabase (CX23) o 8,99 € amb el recomanat (CX33), plans marcats com a no disponibles el 2026-11-01 (secció 7) | 20 TB de trànsit; còpies de seguretat i administració a part |

- **Fora dels tres escenaris:** el domini, l'IVA, les còpies de seguretat, el correu per als enllaços d'accés i les hores d'administració.
- **Supabase Free:** no servix per a un node en producció, perquè el projecte es pausa després d'una setmana sense activitat.
- **Node estàtic amb un Supabase compartit:** l'instal·lador admet un `tenantId` en un projecte d'un altre; el cost seria només el de l'escenari A, però allotjar inquilins d'altres pobles és una decisió del projecte.

## 9. Límits d'este perfil

- Les xifres de `dist/` valen per al build de les 04:07; un build nou les canvia.
- Les mesures de producció són d'un sol mòdul i d'una sola hora.
- La mida de la base de dades, el consum elèctric i la càrrega per servei no s'han mesurat. La secció 1.1 és una instantània de tot el Node 0.
- El build web de Xixona està provat amb dependències locals iguals al lock; falta una instal·lació nova amb `npm ci` i la validació real de Nix, lock i VM NixOS.
- Els escenaris sumen preus publicats amb un supòsit de trànsit; no són pressupostos.

## Vincles

- [[00_index_maquina]]
- [[api_port_neutral_i_allotjament_model_b]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[ADR-2026-08-ONLINE-FIRST]]
