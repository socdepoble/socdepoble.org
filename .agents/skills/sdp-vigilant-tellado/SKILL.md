---
type: skill
name: sdp-vigilant-tellado
prioritat: 2
description: "Tractor de perímetre inspirat en Vigilant de Fernando Tellado. Usa-la abans de desplegar o empaquetar el connector WordPress, en tocar capçaleres o CSP, o si un plugin de seguretat bloqueja l'App. Només llig i informa."
status: actiu
tags: [seguretat, fortificacio, tractors, auditoria]
triggers_on:
  - vigilant
  - vigilante
  - tellado
  - ayudawp
  - capçaleres de seguretat
  - security headers
  - enduriment
  - hardening
  - perímetre
  - csp de producció
  - integritat del paquet
  - plugin de seguretat de l'amfitrió
version: 1.1.0
contracte.llig:
  - wordpress-plugin/
  - index.html
  - public/
  - vercel.json
  - firebase.json
  - vite.config.js
  - vite.natiu.config.js
  - vite.standalone.config.js
  - src/data/supabase/auth.js
  - src/pwa/
  - supabase/migrations/
  - tooling/gates/
  - tooling/higiene/
  - tooling/lib/dist-secrets.mjs
contracte.escriu:
  - _wiki_de_poble/04_escriptori
---
# Vigilant Tellado: perímetre estàtic

Esta skill acompanya el tractor real `tooling/gates/tractor-vigilant.mjs`. La inspiració de Vigilant/AyudaWP és històrica; no executa ni copia el connector de tercers. Complementa `core-seguretat-audit`: inspecciona exposició i paquet, mentre aquella tracta fluxos de dades, permisos i correctors.

## Execució disponible

```bash
node tooling/gates/tractor-vigilant.mjs --json
node tooling/gates/tractor-vigilant.mjs --json --arrel=/ruta/copia
```

Només admet `--json` i `--arrel=DIR`. Llig el sistema de fitxers de l'arrel, sense consultar Git, xarxa ni producció, i sense escriure-hi. `commit` i `origen` ixen `null`: conserva la base i els hashes de la còpia per separat si el lliurable els necessita. `--viu` i `--origen` no estan implementats i es rebutgen.

El `cron_higiene.mjs` incorpora esta diagnosi a L0 i `run-portes.mjs` a les portes. Això descriu consumidors existents, no autoritza crear un cron, deixar un temporitzador actiu o canviar la seua configuració.

## Les 15 comprovacions que executa

| ID | Comprovació real | Límit de la mesura |
| --- | --- | --- |
| VIG-01 | Noms de fitxers sensibles en `public`, `dist`, `dist-natiu` i superfícies de paquet WordPress declarades al codi | Patrons de noms; no és un escàner de secrets versionats ni inspecciona tots els bytes del repositori |
| VIG-02 | Extensions executables de servidor a les carpetes d'actius declarades | No executa ni classifica semànticament el fitxer |
| VIG-03 | Patrons lèxics perillosos als PHP de `wordpress-plugin` | No analitza tots els scripts d'empaquetat ni demostra absència de portes del darrere |
| VIG-04 | Format conegut de `sdp-inventari.json`, hash dels fitxers i fitxers orfes del paquet | No valida `sdp-release.json`; depén del paquet físic present, que pot ser antic |
| VIG-05 | URL `http://` fora de la llista local/espais de noms del codi en les fonts seleccionades | És una heurística amb falsos positius possibles; no consulta la destinació |
| VIG-06 | Atributs `src`/`href` amb quatre patrons de CDN als PHP i a `index.html` | No valida una declaració de serveis externs ni tots els dominis de tercers |
| VA1 | Presència lèxica de `defined('ABSPATH')` als PHP | No prova que la guarda interrompa l'execució |
| VA2 | Presència de `permission_callback` i absència del patró `__return_true` als PHP amb REST | Es comprova per fitxer; no certifica cada ruta ni la lògica del permís |
| VA3 | Referències a tres capçaleres d'IP reenviada en PHP | No prova una cadena de proxies de confiança |
| VB1 | `X-Content-Type-Options: nosniff` en una regla global `**` de `firebase.json` | No mesura capçaleres servides en viu ni tota la CSP |
| VB2 | Patró `strict-origin` de `Referrer-Policy` en eixa configuració | No valida tota la política de referrer desplegada |
| VB3 | Presència de `camera=` a `Permissions-Policy` global | No valida tots els permisos ni callbacks d'autenticació |
| VB9 | Cadena `Content-Security-Policy` a `index.html` | No valida la política final, els hashes del build ni secrets |
| VB10 | Fitxers `.map` a les superfícies exposades | No demostra quins actius està servint un host |
| VC2 | Existència d'un informe d'higiene llegible de hui o ahir | No comprova tot el contingut de l'informe ni certifica que el cron estiga actiu |

Quan troba symlinks, no els travessa i afig `VIG-SYMLINK` com a `no-mesurat`. L'absència d'una font no s'ha de convertir en evidència que eixa superfície s'ha revisat. El lector limita fitxers a 8 MiB i algunes comprovacions lèxiques usen text buit quan no hi ha lectura: revisa eixos límits abans de concloure cobertura completa.

Els antics identificadors de comprovacions desitjades que no apareixen a la taula no són portes implementades. No atribuïsques a VB1–VB3/VB9 validació integral de CSP, callbacks o secrets.

## Interpretar el resultat

L'esquema és `sdp.vigilant.v1`, amb `comprovacions` i `recompte`. Els estats són `ok`, `falla`, `no-mesurat` i `informa`; conserva també `avis` i `severitat`.

- Eixida `0`: no hi ha falles bloquejants; pot haver-hi falles d'avís i fonts no mesurades.
- Eixida `1`: alguna falla alta/crítica que ja bloqueja.
- Eixida `2`: arguments o arrel no mesurables.

Només VA1, VA2 i VA3 poden bloquejar actualment. La resta són avisos segons `NOU` al codi; no els declares resolts perquè el procés acaba amb 0. `no-mesurat` no és `ok`.

## Revisió i correctors

Les sis proves de `tests/tractor-vigilant.test.mjs` contrasten lectura, patrons, inventari, symlinks, arguments i integració L0. No substituïxen revisar el connector o construir el paquet final.

Per a una release, contrasta també el paquet amb la porta d'empaquetat i la CSP amb les proves del build. Els permisos de servidor/RLS, l'autenticació, les capçaleres HTTP efectives, la compatibilitat d'un amfitrió i la retenció de dades necessiten evidència pròpia; si no s'han mesurat, deixa'ls pendents. Una comprovació viva és una operació separada dins de l'abast i origen autoritzats.

Els correctors van en còpia aïllada amb reproductor i preimatges, pel circuit de `core-seguretat-audit`. La diagnosi no retira actius, no activa proteccions, no llig credencials per connectar-se a Supabase ni imprimeix valors de secrets. Les coincidències de fitxers sensibles s'informen pel nom.

## Vincles

- [[00_INDEX_SKILLS]]
- [[core-seguretat-audit/SKILL]]
- [[core-salfumant-radical/SKILL]]
- [[core-empaquetat-wp/SKILL]]
- [[core-neteja-brossa/SKILL]]
