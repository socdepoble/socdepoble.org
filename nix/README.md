---
type: document
status: esborrany
description: "Façana municipal Fediversity per a NixOS: importació del mòdul, opcions, què es publica, integritat d'Open Data i límits de verificació sense Nix."
---
# Node municipal de Sóc de Poble per a NixOS

Esta façana reutilitza el `lib.mkWeb` del flake arrel: `package-lock.json`, `importNpmLock`, Node 24, recepta web i la llista pública de fonts, amb una excepció declarada. `nixpkgs` està fixat a la revisió immutable **7dcdd87373d72e7a2173e4db02e20d3d7f495cfd**, observada el 3-11-2026. No hi ha cap hash fictici.

**Defecte heretat del flake arrel:** el connector Vite `sdp:associacio-apps` exigix `scripts/botigues/associacio-apps.json`, però la font de `flake.nix` arrel (marques `sdp:font-inici`/`sdp:font-fi`) no l'inclou. Per això `nix build .#web`, `checks.web` i `checks.modul-nixos` de l'arrel, i el comprovador de reproductibilitat que construïx des de la mateixa llista, fallen en `vite build`. Esta façana copia el fitxer en el `postPatch` de `nix/flake.nix` com a pegat temporal: és configuració pública (empremtes i orígens), sense cap secret. L'esmena de fons (afegir-lo a la font arrel i retirar el pegat) és decisió del Mestre.

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

## Verificació

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

## Vincles

- [[00_index]]
