---
type: document
status: esborrany
description: "Façana municipal Fediversity per a NixOS: importació del mòdul, opcions, què es publica, integritat d'Open Data i límits de verificació sense Nix."
---
# Node municipal de Sóc de Poble per a NixOS

Esta façana reutilitza el `lib.mkWeb` del flake arrel: `package-lock.json`, `importNpmLock`, Node 24, recepta web i la mateixa llista pública de fonts. `nixpkgs` està fixat a la revisió immutable **7dcdd87373d72e7a2173e4db02e20d3d7f495cfd**, observada el 3-11-2026. No hi ha cap hash fictici.

**Fonts alineades (FEDI-05):** `flake.nix` inclou explícitament `scripts/botigues/associacio-apps.json`, configuració pública que exigix Vite. La façana ja no necessita copiar-la en `postPatch`; el comprovador de reproductibilitat usa la mateixa llista. No s'hi incorpora la resta de `scripts/` ni cap credencial.

**Límit de verificació:** l'amfitrió de construcció no té Nix. Les proves Node i els dos builds de la recepta equivalent sí que s'han executat; `nix eval`, `nix build`, la VM NixOS/Nginx i la generació real de `flake.lock` continuen pendents. No és una release amb lock certificat. En un entorn Nix cal generar i versionar el lock, i després executar els checks sense actualitzar-lo.

## Configuració

Importeu `nixosModules.default` del flake de la release completa, amb `dir=nix`. No copieu només esta carpeta: es reutilitzen el flake arrel i les seues fonts públiques.

La façana ja importa el `nixosModules.default` del flake arrel: **no l'importeu també a part**. El sistema de mòduls deduplica per `key` i el mòdul arrel no en porta, així que el veuria dues vegades i aturaria l'avaluació amb «The option `services.socdepoble.pobles' … is already declared». Si l'amfitrió ja usava el mòdul arrel, substituïu aquella importació per esta: `services.socdepoble.pobles.<nom>` continua disponible per a altres instàncies.

```nix
{
  imports = [ socdepoble.nixosModules.default ];
  services.socdepoble = {
    enable = true;
    domain = "poble.example.org";
    municipality = {
      slug = "la-torre-de-les-macanes";
      name = "La Torre de les Maçanes";
    };
    enableActivityPub = true;
    enableOpenData = true;
    # L'operador configura DNS i ACME al sistema amfitrió abans d'activar-ho.
    enableACME = false;
    openFirewall = false;
  };
}
```

També s'accepta `municipality = "la-torre-de-les-macanes";`: es convertix a l'atribut `slug` i conserva el nom conegut **La Torre de les Maçanes**. Per a un slug nou, com `municipality = "sella";`, el nom inicial és el mateix slug (`sella`). Es recomana l'attrset `{ slug = "sella"; name = "Sella"; }` per a mostrar el nom complet i concordar amb la identitat del seu paquet Open Data. L'abreviatura no deduïx noms, dades ni autoria d'altres pobles; amb el paquet de La Torre, un altre municipi requerix `openDataSource` propi o `enableOpenData = false`.

Per defecte, el frontal és una demostració `seed`, sense cap credencial real ni backend nou. `dataMode`, `supabaseUrl`, `publicKey` i `tenantId` permeten reutilitzar un backend públic ja configurat. Només s'admet una clau `sb_publishable_`, i `supabaseUrl` ha de ser un origen HTTPS (o HTTP local) sense credencials, ruta ni consulta. `lib.mkMunicipalWeb` ho comprova en avaluar, abans d'escriure cap `.drv` al magatzem (llegible per tothom), i el missatge d'error no repetix el valor. La guarda de vite (`validatePublicCredentials`) és només la segona barrera, dins del build. Un JWT anon heretat va per `services.socdepoble.pobles` de la release, on el rol només el comprova vite. En una configuració basada en flakes, un valor literal ja entra al magatzem amb la font del flake: no hi escriviu mai cap secret.

`enable = false` no crea esta instància; no toca altres instàncies `services.socdepoble.pobles` configurades explícitament per l'operador en este mateix sistema (sense importar el mòdul arrel a part). Canviar el domini o municipi no crea comptes, dades, DNS ni migracions de servidor.

## Què es publica

| Opció | Lectura estàtica | Escriptura |
| --- | --- | --- |
| `enableActivityPub` | `/.well-known/webfinger?resource=…`, NodeInfo 2.1, `/ap/actor.json` i documents canònics `/ap/actors/<slug>.json` | POST 405 amb `Allow`; cap inbox activa, Follow/Accept o notificació federada |
| `enableOpenData` | `/opendata/manifest.json` i recursos públics del paquet 1.2.0, amb SHA-256 i el MIME del manifest (`activitystreams.json` com a `application/activity+json`, Markdown amb `charset=utf-8`) | POST 405; cap restauració ni mutació del port |

`/.well-known/host-meta` no es servix en nginx (404): la seua plantilla LRDD per camí (`/.well-known/webfinger/{uri}`) només la resol Firebase. Ací WebFinger és per paràmetre.

Els interruptors són independents. Desactivats, les seues rutes tornen 404, també quan el paquet físic conté documents estàtics: no es torna la closca SPA. Un recurs absent també és 404. Les capçaleres de seguretat ixen de `firebase.json`; les respostes públiques afegixen CORS `*`, sense credencials, i només GET/HEAD/OPTIONS. El guard de mètode de WebFinger precedix les reescriptures del JRD intern.

`/ap/actor.json` és un aliàs byte a byte de l'actor generat, amb el seu **ID canònic** `/ap/actors/<slug>.json`. Actor, WebFinger i NodeInfo porten el domini i municipi configurats. L'actor municipal continua dient que no és el compte oficial de l'Ajuntament.

## Open Data: integritat i procedència

`public/opendata` és el paquet 1.2.0 de **La Torre de les Maçanes**, amb les seues dades, llicències, URLs d'origen i hashes. Per a un altre municipi, aporteu `openDataSource = ./paquet-public;`, amb un paquet complet coherent, o desactiveu `enableOpenData`. Ha de ser un path Nix (sense cometes) o una derivació: es copia al magatzem i el build en depén. Una ruta absoluta en text (`"/srv/…"`) no la veu el sandbox i falla en avaluar. El build rebutja un slug/nom alié, un recurs absent, un symlink, traversal, una mida o SHA-256 divergent.

El paquet es conserva **byte a byte**: servir-lo en un altre domini no canvia la seua autoria, llicència ni procedència i no el convertix en dades noves. Les URLs internes de la instantània de La Torre continuen apuntant a `socdepoble.org`; no es reetiqueten ni es recalculen hashes per a simular una nova publicació. Les identitats ActivityPub del node es generen per al domini nou, però una migració federada real d'identitat i seguidors requerix el protocol `Move` separat; esta façana no la declara feta.

## Inventari verificat de tot el paquet estàtic

`lib.mkWeb` i la façana municipal heretada generen un inventari determinista **després del `postBuild` municipal i abans de copiar `dist`**. Inclou SHA-256 i bytes de cada fitxer regular, també `.well-known/host-meta`, els dos documents NodeInfo, el `manifest.webmanifest` real, Open Data, assets i fitxers ocults admesos. La llista explícita d’arrels i segments rebutja camins desconeguts o ambigus, symlinks i entrades especials; la verificació exigix cobertura exacta, sense omissions, extres ni directoris afegits. Una segona verificació comprova els bytes copiats.

`out` continua sent només el web estàtic. La sortida Nix separada `integritat` conté `inventari-dist.json` i `sha256-confiat`; així cap fitxer de `dist` queda exclòs per autoreferència. Amb l’instal·lador `--build`, l’inventari queda fora de `dist`, a l’arrel del node, i el rebut `node-germa.json` porta `compilacio.inventari`, `sha256Confiat`, nombre de fitxers i bytes. L’inventari inicial de fonts del mateix rebut es conserva separat dels artefactes compilats.

El verificador requerix una empremta de confiança externa explícita; no calcula un hash del manifest rebut i el considera automàticament fiable:

```sh
node tooling/instalador/inventari-estatic.mjs verifica \
  --dist /ruta/al/web \
  --manifest /ruta/al/inventari-dist.json \
  --sha256-confiat DIGEST_REBUT_PER_UN_CANAL_DE_CONFIANCA
```

Conserveu i distribuïu el digest del rebut de construcció per un canal fiable independent del paquet que verifiqueu. Recalcular manifest i hash després d’alterar el web només crea un inventari diferent: no acredita autoria ni autenticitat. El check del flake usa l’anchor de la seua construcció per comprovar consistència, i la confiança en la release/derivació ha de vindre del canal de distribució de l’operador. Este inventari SHA-256 **no és** la firma pública del manifest del Node 0 i no la substituïx; si n’hi ha una dins `dist`, també queda inventariada com qualsevol altre fitxer. No es llig cap clau privada ni es posa cap secret al magatzem de Nix.

Les proves Node alteren, lleven i afigen artefactes de totes les categories, rebutgen un manifest recalculat amb l’anchor original i executen el fragment d’instal·lació real en shell, amb una còpia alterada entre controls. El productor es contrasta amb dos entorns i rutes diferents. `checks.integritat-estatica` de l’arrel i el check de l’instal·lador incorporen estos controls. El límit indicat al principi continua vigent: no s’ha executat Nix en este amfitrió.

## Verificació

### R13 · Backend i contenidor preparats, certificació Nix encara oberta

`node0.nix` afegix una opció **desactivada per defecte** `services.socdepoble.node0.enable`:
PostgreSQL **17** sense TCP, rol de peticions `node0_runtime` sense privilegis administratius,
migracions canòniques amb les empremtes del ledger, identitat Ed25519 persistent i privada,
Node 24 en systemd i Caddy davant de la façana Nginx local a `127.0.0.1:8080`.
La fase d'arrencada crea l'esquema en la base dedicada `socdepoble_node0`; no inventa
perfils ni importa una instantània pública amb una identitat prestada.

El servidor actual porta l'origen institucional `socdepoble.cat` fixat al codi. Per això
el mòdul rebutja habilitar-lo sota un altre domini o municipi. La façana estàtica
continua sent configurable per poble. Esta restricció explícita no acredita un servidor
Node 0 desplegable arbitràriament en qualsevol ajuntament.

Les credencials es lliuren amb `LoadCredential`, des d'un fitxer extern al magatzem,
per defecte `/run/secrets/socdepoble-node0.env`. El fitxer conté un token administratiu
aleatori de 32 caràcters com a mínim i, si cal, el token Mastodon. Només s'admeten
`SDP_NODE0_ADMIN_TOKEN`, `MASTODON_ACCESS_TOKEN` i `SDP_MASTODON_ACCESS_TOKEN`;
no pot canviar el rol PostgreSQL, l'executable, la identitat ni activar auth/POSSE.
Els flags d'autenticació i publicació no s'activen amb esta entrega. La clau privada
es genera a `/var/lib/socdepoble-node0` amb permisos `0600`; no es genera durant el build.

`nixosModules.containers`, definit en `containers.nix`, permet declarar
`services.socdepobleContainer.enable = true`. El contenidor té xarxa privada,
IP pròpia, credencial muntada només en lectura i `autoStart = false` per defecte.
La xarxa pública, NAT, DNS i TLS de l'amfitrió requerixen la configuració del desplegament;
el mòdul no la modifica silenciosament.

`tooling/nixos/verifica-flake-reproduible.mjs` comprova el pin de revisió, el graf del
lock i el digest NAR; després exigix un procés Nix real que resolga el lock sense
actualitzar-lo, repetisca l'avaluació amb la memòria cau desactivada, construïsca el
web i el reconstruïsca amb `--rebuild`, calcule SHA-256 NAR de les eixides i execute
les VM `module-http` i `node0-http`. Finalment comprova que fonts i lock no han canviat.
Les proves de protocol amb dobles sempre produïxen `evidenceKind: test-double`,
`verified: false`; no poden convertir una simulació en certificat.

El verificador crea una còpia **només amb les fonts públiques declarades**, incloent
els fitxers nous d'un kit CAS. No passa l'arrel crua del repositori al fetcher `path:`,
perquè això copiaria també `.git`, `.env` i altres dades al magatzem llegible per tothom.
La còpia conserva els modes executables i fixa els temps a l'època canònica `315532800`
(1980), sense metadades Git de release: és una prova del contingut inventariat,
no una equivalència amb una release Git amb `shortRev`/data diferents.

```sh
# Inspecció: eixida 1 si no hi ha certificat complet; no genera cap lock.
node tooling/nixos/verifica-flake-reproduible.mjs --inspect
# En un entorn Nix Linux, després de generar i revisar el lock real de nix/:
node tooling/nixos/verifica-flake-reproduible.mjs --system=aarch64-linux --out=/tmp/prova-nix.json
# Només avaluació: mai dóna verified:true ni eixida de certificat correcte.
node tooling/nixos/verifica-flake-reproduible.mjs --evaluation-only
```

En este amfitrió no hi ha `nix`, `nix-instantiate` ni `/nix`. Docker té client però
cap daemon disponible. La cerca local de `flake.lock` en `/tmp` i en el workspace
no ha trobat cap lock aprofitable. La xarxa de processos no resol GitHub (DNS
`ENOTFOUND`). **No s'ha inventat ni incorporat un `narHash`.** El rebut natiu de
`evidence/r13/nix/native-preflight.json` conserva `nix_lock_missing` i `nix_unavailable`.
Ni els fitxers `.nix` nous ni les VM s'han avaluat o executat amb Nix. IDEA-104a
continua sense certificació Nix completa; les suites Node acrediten les fronteres
de credencials, fonts, bootstrap i protocol del verificador.

Fonts primàries consultades per a esta ampliació: [referències de flakes i `dir`](https://nix.dev/manual/nix/2.28/command-ref/new-cli/nix3-flake),
[format NAR](https://nix.dev/manual/nix/2.28/protocols/nix-archive), [PostgreSQL en NixOS](https://wiki.nixos.org/wiki/Postgres)
i [Caddy en NixOS](https://wiki.nixos.org/wiki/Caddy). La consulta de documentació no substituïx l'avaluació de la revisió fixada.

Sense Nix:

```sh
node --test tests/fediversity-nixos-module.test.mjs tooling/seo/genera-federacio.test.mjs
```

La suite executa el generador real, valida JSON/SHA-256, passa per la CLI de preparació pública (també amb `--open-data-source`), comprova determinisme i prova errors abans d'escriure. El test dels fitxers `.nix` és **textual**: equilibri de claus, claudàtors i parèntesis amb un lèxic mínim (comentaris, cadenes i `${…}`), que cada ruta depén del seu interruptor, MIME del manifest i patrons de les guardes (només dins d'un subconjunt d'ERE que `std::regex` compila i JS llig igual; la compilació real la fa `builtins.match` amb Nix). **No avalua Nix ni nginx.** Sense Nix es marca una omissió explícita; `SDP_REQUIRE_NIX=1` la convertix en fallada. Cap CI del repositori instal·la Nix ni definix esta variable: fins que no hi haja un job amb Nix (decisió del Mestre), `npm run test:ci` sempre deixa en omissió el parse real, i el Pilar 1 no es pot donar per verificat.

En una còpia Git completa i amb Nix, useu l'URL `git+file:///ruta/absoluta/release?dir=nix` (o una release Git immutable equivalent), genereu `flake.lock`, incorporeu-lo a la release i executeu:

```sh
nix flake check --no-update-lock-file 'git+file:///ruta/absoluta/release?dir=nix'
nix build --no-update-lock-file 'git+file:///ruta/absoluta/release?dir=nix#web'
nix build --no-update-lock-file --rebuild 'git+file:///ruta/absoluta/release?dir=nix#web'
```

`checks.module-evaluation` avalua la instància i les assertions; `checks.web-open-data-source` construïx amb `openDataSource` dins del sandbox; `checks.module-http` arranca dos nodes de prova NixOS i comprova HTTP real, headers, mètodes, fitxers absents i els dos interruptors desactivats. Estos checks estan preparats però **no executats** en esta entrega.

Fonts primàries: [Fediversity, allotjament basat en NixOS](https://fediversity.eu/), [manual de mòduls NixOS](https://nixos.org/manual/nixos/stable/#sec-writing-modules), [buildNpmPackage/importNpmLock de Nixpkgs](https://github.com/NixOS/nixpkgs/blob/master/doc/languages-frameworks/javascript.section.md) i [revisió fixada de Nixpkgs](https://github.com/NixOS/nixpkgs/tree/7dcdd87373d72e7a2173e4db02e20d3d7f495cfd).

## Restauració: identitat exacta del ledger d'origen

`tooling/node0/verifica-restauracio-node0.mjs` i la recepta distribuïble
`tooling/node0/receptes-mirall/restaura-node0-bundle.mjs` exigixen, en `--apply`,
`--migrations-count` i `--migration-ledger-sha256`, a més del digest del xifrat
i la identitat rebuda per un pipe anònim. El recompte i l'empremta esperats
han de vindre del registre fiable de la còpia **d'origen**. Cal obtindre'ls
amb una captura coherent amb el dump; este verificador no certifica eixa captura.

**R42 implementa el protocol de captura coherent del productor, encara sense
prova nativa entre processos.** L'exportador manté un `psql` amb lock compartit
de l'hidratador i transacció `REPEATABLE READ READ ONLY`; el count/digest i el
token de `pg_export_snapshot()` es lligen en eixa sessió. El token passa només
a `pg_dump --snapshot`, amb stdout directe a age, i la sessió continua viva
fins que acaben els dos processos. Només es publica després de tancar els tres.
El MANIFEST inclou `snapshot.migrationLedger` (`migrations` i
`migrationLedgerSha256`) i `migrationLedgerCapture.nativeVerified:false`.
El MAC local existent autentica eixos bytes; cal verificar-lo amb la clau de
confiança externa al mirall abans d'usar-los com a registre d'origen.

El catàleg i els pins POSSE descriuen codi, no el dump. Les còpies antigues sense
estos camps conserven la via de registre manual fiable i coherent. El
verificador no inferix l'esperat del catàleg o del target, i manté
`sourceMigrationLedgerCaptureVerified:false`: no certifica com s'ha capturat o
autenticat l'origen. Els dobles de procés i PGlite no acrediten el circuit natiu
psql/pg_dump/age/restauració ni cap còpia productiva o trasllat de proveïdor.

El digest és SHA-256 UTF-8 de les tuples `version`, `file` i `sha256`, separades
per TAB, ordenades per `version COLLATE "C"` i separades per LF sense LF final.
En la base restaurada es calcula amb `pg_catalog.sha256` del nucli, sense
dependre de l'extensió `pgcrypto` ni de l'esquema on estiga instal·lada.
Després de restaurar en una base temporal pròpia es comproven recompte i digest
exactes: un hash de migració diferent amb el mateix recompte falla. No s'inferix
l'esperat a partir del resultat restaurat ni s'amplia una llista de versions.
Sense prova d'origen, el mode d'aplicació es nega abans d'obrir la còpia.

La CLI manté el pla sec sense operacions de base de dades quan no s'indica
`--apply`. La prova SQL en PGlite verifica el càlcul quan s'executa amb
`SDP_PGLITE_MODULE` (sense eixa variable es marca com a omesa); els dobles de lifecycle
continuen sense certificar restauració nativa, ACL, custòdia externa o canvi
de màquina. La portabilitat completa també requerix desplegar al nou host,
reconfigurar connexions/URL i verificar DNS i serveis.

## Vincles

- [[00_index]]
