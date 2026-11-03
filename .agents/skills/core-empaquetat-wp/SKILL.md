---
type: skill
status: actiu
description: Tractor cognitiu per estandarditzar la creació, nomenclatura i emmagatzematge dels arxius ZIP del connector de WordPress, evitant l'acumulació de brossa a l'arrel.
name: core-empaquetat-wp
tags:
  - tractors
  - sollutia
triggers_on:
  - zip del plugin
  - empaquetar l'enxufe
  - empaqueta el plugin
  - release de l'enxufe
  - plugin de wordpress
contracte.llig:
  - package.json
  - vite.config.js
  - vite.standalone.config.js
  - wordpress-plugin/eines/empaqueta.mjs
  - tooling/lib/higiene-paquets.mjs
  - tests/enxufe-empaqueta.test.mjs
contracte.escriu:
  - wordpress-plugin/builds
---
# Tractors i Procediment d'Empaquetat del Plugin de WordPress (Enxufe)

Aquesta skill s'ha d'invocar **SEMPRE** que una IA (o el Mestre) demane generar un arxiu ZIP per a pujar l'aplicació a WordPress o distribuir la SPA independent. Serveix com a tallafoc contra el "Llop Salvatge" d'escopir zips i carpetes temporals sense rumb per qualsevol lloc de l'espai de treball.

## 1. Tria el paquet abans de generar-lo

Consulta `node wordpress-plugin/eines/empaqueta.mjs --ajuda` i l'inventari dels builds. L'empaquetador té tres eixides diferents; esta skill no canvia el canal ni la ruta que implementa cada variant:

- **Release signada:** dos ZIP datats (`AAMMDD_HHMM_wordpress_enxufe_vX.zip` i `AAMMDD_HHMM_estatic_spa_vX.zip`) dins de `wordpress-plugin/builds/`. `--sortida DIR` només admet una carpeta dins d'eixa frontera i refusa enllaços simbòlics. La data ix del build, amb fus horari Europe/Madrid.
- **Directori de WordPress.org:** `--directori` genera només `wordpress-plugin/builds/directori/socdepoble.zip` a partir dels builds de release existents. No compila ni modifica el canal. No es combina amb altres opcions. Esta variant exclou l'actualitzador, `Update URI`, `languages/` i `Domain Path`.
- **Paquet lleuger manual:** `--lleuger` genera `../_builds_de_poble/wordpress/socdepoble.zip`, amb mitjans externs i límit de 2.500.000 bytes. La carpeta satèl·lit ha d'existir; el tractor no la crea ni publica un canal. És una eixida externa: confirma l'abast autoritzat de la sessió abans d'executar-la; el contracte local de Fronteres només descriu camins del repositori.

El nom fix `socdepoble.zip` dels dos modes manuals és una excepció deliberada a la nomenclatura datada. No reanomenes eixe lliurable ni copies un ZIP a un altre circuit per fer-lo encaixar en una regla documental.

## 2. Higiene i retenció

Els ZIP no es versionen a Git. Mantín les eixides en la carpeta que correspon al mode seleccionat; no les deixes a l'arrel, `scratch/` o l'Escriptori documental. `tooling/lib/higiene-paquets.mjs` i les proves del packager comproven exclusions i frontera; no acrediten l'aprovació editorial d'una release.

La retenció del satèl·lit i els builds de release són circuits diferents. Conserva els artefactes aliens i les preimatges: la mera presència d'un ZIP no autoritza moure'l o esborrar-lo. Per a restes creades en este torn, usa el temporal aïllat i la neteja prevista pel tractor; per a una migració d'emmagatzematge, registra origen, destí, hash i autorització específica.

## 3. Verifica i deixa constància

Executa les proves `node --test tests/enxufe-empaqueta.test.mjs tests/higiene-paquets.test.mjs` quan canvies el circuit. No fabriques una release, una clau privada o una publicació per a comprovar una skill. La generació de cada variant ha de verificar l'inventari, la mida i el SHA-256 retornats pel tractor, i la correspondència de versió amb els builds d'entrada.

L'informe cita mode, ruta exacta, versió, mida, hash i proves executades. Empaquetar no autoritza pujar a WordPress.org, publicar manifests o substituir un canal: són accions separades de l'encàrrec.

## Vincles
- [[00_INDEX_SKILLS]]
