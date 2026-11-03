---
type: document
status: esborrany
description: Xifres mesurades el 261101 i preus oficials citats per a allotjar un node municipal, amb tres escenaris de cost mensual per a un ajuntament menut.
tags:
  - arquitectura
  - maquina
---
# Perfil mínim d'allotjament d'un node municipal

**Un node municipal** és la instal·lació del Mas electrònic que **servix un poble**: la seua web, les **seues dades** i la **seua federació**, amb el **contracte del port neutral** que descriu [[api_port_neutral_i_allotjament_model_b]]. Este document recull què necessita un node municipal del Mas: web estàtica, base de dades, Storage, funcions i federació. Servix a qui haja de triar entre un **allotjament gestionat** i un d'autoallotjat. Les **xifres del repositori** es van mesurar en esta màquina el 2026-11-01, i els preus es van consultar el mateix dia a les **pàgines oficials**.

## 1. Tall i mètode

- **Tall:** 2026-11-01, 04:38 CET, HEAD `a6e4b0d81` de la branca `backup-notes-publish`, amb l'arbre de treball compartit (no net) i Node v24.13.0.
- **Web:** `dist/` tal com estava, del build de les 04:07:11; per a este document no s'ha reconstruït res.
- **Compressió:** Node `zlib`, gzip de nivell 9 i Brotli de qualitat 11, fitxer per fitxer.
- **Producció:** `curl` a `https://socdepoble.org` amb `Accept-Encoding` `br`, `gzip` i `identity`.
- **Base de dades:** recompte sobre `supabase/migrations/*.sql` i `supabase/functions/`; no s'ha consultat cap projecte remot.
- **Instal·lador:** `tests/inicia-node-germa.test.mjs` executa `tooling/instalador/inicia-node-germa.mjs` per a Xixona en un directori temporal. A les 04:38 la font era l'arbre de treball; des del Gauntlet del 261101 és la release de HEAD extreta amb `git archive` (secció 3).

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

- **Contingut:** `src`, `public`, `tooling`, `scripts` i els fitxers d'arrel `package.json`, `package-lock.json`, `index.html`, `vite.config.js`, `firebase.json`, `flake.nix` i `LICENSE`.
- **Fora de la release:** l'instal·lador no copia `supabase/` (migracions i funcions). Per al mode `remote`, l'administrador les pren del repositori a la mateixa versió.
- **Mida mesurada a l'arbre de treball:** 3.628 fitxers i 176.131.477 bytes a les 04:38. A les 04:27 eren 3.623 fitxers: l'arbre canvia mentre altres agents hi treballen, i per això la prova pren la release de HEAD amb `git archive`, que no canvia.
- **Còpia:** l'instal·lador va copiar la release sencera de l'arbre de treball en 0,64 segons en esta màquina.
- **Construcció:** `npm ci` i `npm run build:web` són opcionals (`--build`). Les dependències d'este repositori ocupen 320.944 KiB a `node_modules`, amb 378 entrades de primer nivell; uns 39 MB d'eixa xifra són memòries cau de Vite i Vitest (`.vite` i `.vitest-cache`) i restes d'una instal·lació a mitges (`.acorn-*`, `.aria-query-*`…), que un `npm ci` net no tindria. `npm ci` necessita accés al registre de npm.
- **Prova:** `tests/inicia-node-germa.test.mjs` és una prova d'integració de la CLI de l'instal·lador (còpia i federació). Comprova la identitat de Xixona, que cada fitxer de la release de HEAD arriba al node amb el seu SHA-256, que cap secret de la configuració viatja i que quatre fitxers vigilats del repositori viu no canvien. No executa `npm ci` ni el build, i no servix cap web: la construcció d'un node no està provada.

## 4. Base de dades, Storage i funcions

El node en **mode `remote`** necessita un **projecte Supabase** amb les **migracions de la mateixa versió aplicades** i el seu `tenantId`. Les migracions i les funcions **no viatgen amb la release** (secció 3): **l'administrador** les pren del repositori. En **mode `seed`** no en necessita cap: és una **demostració**.

- **Migracions:** 64 fitxers SQL, de `2609080000_initial_schema.sql` a `2610312000_e2ee_lot3_validadors_service_role.sql`.
- **Esquema:** 48 taules creades, en els esquemes `public` i `private`, i 101 sentències `create policy` al llarg de les migracions (el text apareix 102 voltes; una és dins d'un comentari).
- **Extensions:** `pgcrypto`, que una migració crea. `pg_cron` és opcional: quatre tasques es programen només si ja està activa (`sdp-purga-baixes`, `sdp-purga-paperera-notes`, `sdp-neteja-xat-adjunts` i `sdp-purga-altes-seguiments`). `pg_net` només hi apareix per a dir que no s'usa.
- **Realtime:** la publicació `supabase_realtime` inclou `public.xat_missatges`.
- **Funcions:** tres funcions a `supabase/functions/` (`compte-apple`, `noticies` i `purga-fitxers`) i el codi compartit de `_shared`. `purga-fitxers` llig la clau de servei i `SDP_CRON_SECRET` de l'entorn de la funció (`Deno.env`); `compte-apple` llig la clau de servei, els cinc secrets d'Apple (els identificadors d'equip, de clau i de client, la clau privada i la clau dels testimonis; els noms exactes són al codi de la funció, perquè el client web no els ha de nomenar mai) i `SDP_CRON_SECRET`.
- **No mesurat:** la mida de la base de dades de producció. Cal consultar-la al projecte abans de fixar el disc d'un node gran.

| Bucket | Públic | Límit per fitxer (bytes) | Tipus admesos |
| --- | --- | --- | --- |
| `mitjans` | sí | 5.242.880 | WebP, JPEG, PNG i AVIF |
| `mitjans_privats` | no | 25.242.880 | WebP, JPEG, PNG, AVIF i PDF |
| `xat_adjunts` | no | 20.000.000 | WebP, JPEG, MP4, WebM, QuickTime, àudio WebM, MP4 i Ogg, i `application/octet-stream` per als adjunts xifrats (E2EE) |

## 5. Federació d'un node germà

La prova de l'instal·lador genera la federació del node de Xixona des de la còpia instal·lada, amb la mateixa ordre que el mòdul NixOS.

- **Coherent:** NodeInfo 2.1, `host-meta`, WebFinger i les regles d'nginx usen l'origen del node, i cap fitxer publicat conté `socdepoble.org`.
- **Residu:** el node publicaria l'actor `la-torre-de-les-macanes` i el del projecte, i cap actor de Xixona. `POBLES_FEDERATS` (`src/data/activitypub.js`) i `ACTORS_WEBFINGER_ESTATIC` (`tooling/seo/genera-federacio.mjs`) són constants de la release.
- **Reescriptures:** el `firebase.json` copiat porta les de WebFinger lligades a `socdepoble.org`.
- **Llavor:** la release copia les fotos i les pàgines de La Torre de la demostració.
- **Estat:** la prova ho declara com a `[DEFECTE]`; el canvi és una decisió pendent del Mestre.

## 6. RAM i CPU d'un servidor autoallotjat

- **Supabase autoallotjat amb Docker:** mínim de 4 GB de RAM, 2 nuclis i 40 GB de SSD; recomanat 8 GB o més, 4 nuclis o més i 80 GB o més de SSD. Font: [Supabase, Self-Hosting with Docker](https://supabase.com/docs/guides/self-hosting/docker), consultada el 2026-11-01. La pàgina afig que activar els registres i l'analítica augmenta els requisits.
- **Web estàtica sola:** són 0,14 GB de fitxers servits per nginx. No s'ha mesurat cap càrrega de servidor; el pla més menut de la secció 7 hi té espai de sobra.
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
- La mida de la base de dades i la càrrega real d'un servidor no s'han mesurat.
- La construcció d'un node (`npm ci` i `npm run build:web`) no s'ha provat.
- Els escenaris sumen preus publicats amb un supòsit de trànsit; no són pressupostos.

## Vincles

- [[00_index_maquina]]
- [[api_port_neutral_i_allotjament_model_b]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[ADR-2026-08-ONLINE-FIRST]]
