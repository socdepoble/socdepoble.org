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
contracte.escriu:
  - package.json
---
# Tractors i Procediment d'Empaquetat del Plugin de WordPress (Enxufe)

Aquesta skill s'ha d'invocar **SEMPRE** que una IA (o el Mestre) demane generar un arxiu ZIP per a pujar l'aplicació a WordPress o distribuir la SPA independent. Serveix com a tallafoc contra el "Llop Salvatge" d'escopir zips i carpetes temporals sense rumb per qualsevol lloc de l'espai de treball.

## 1. Nomenclatura Estàndard i Termodinàmica
Qualsevol ZIP compilat (siga a mà, per script de laboratori, o per IA autònoma) HA DE TENIR obligatòriament el format canònic de Sóc de Poble:
`aammdd_hhmm_categoria_titol.ext`

La **categoria** reflectix l'amfitrió o sistema al qual s'enxufa el paquet:
- Per al plugin de WordPress: `AAMMDD_HHMM_wordpress_enxufe_v[MAJOR].[MINOR].[PATCH].zip` (Exemple: `261015_2250_wordpress_enxufe_v1.1.3.zip`)
- Per a la SPA autònoma (servidor estàtic/Sollutia): `AAMMDD_HHMM_estatic_spa_v[MAJOR].[MINOR].[PATCH].zip`
- Per a altres amfitrions futurs: `AAMMDD_HHMM_sollutia_enxufe_vX.Y.Z.zip`, `AAMMDD_HHMM_joomla_enxufe_vX.Y.Z.zip`, `AAMMDD_HHMM_wikimedia_enxufe_vX.Y.Z.zip`

## 2. Destinació Única (wordpress-plugin/builds/)
D'acord amb la Llei de l'Enxufabilitat i per mantindre l'ordre, els productes finals i zips de prova del connector (plugin) van EXCLUSIVAMENT a la carpeta del mateix plugin:
**Ruta canònica:** `wordpress-plugin/builds/`

Està **ESTRICTAMENT PROHIBIT** guardar arxius `.zip`, `.tar.gz` o carpetes de compilat soltes a:
- L'arrel del repositori `/` (ni crear carpetes `release/` per a proves manuals)
- La carpeta `scratch/`
- `_wiki_de_poble/04_escriptori/00_bandeja_d_entrada/`

## 3. Neteja de Brossa Temporal (Acte Reflex)
El ZIP es queda on el deixa `wordpress-plugin/eines/empaqueta.mjs`: `wordpress-plugin/builds/`, i la variant del directori a `wordpress-plugin/builds/directori/`. No se'n fa cap còpia a `01_produccio/`, que és zona humana. Si la generació deixa directoris o fitxers temporals fora de `builds/`, es diu al Mestre a l'informe de la sessió: els retira ell o el cron d'higiene (`node tooling/higiene/cron_higiene.mjs`), i cap agent no esborra res.

## 4. Retenció
A `wordpress-plugin/builds/` i a `wordpress-plugin/builds/directori/` es conserven sempre: els paquets que nomena `stable.json` (el canal estable), el més recent de cada producte i carpeta, i els que cita l'última Acta Marmota de `_wiki_de_poble/10_actes/`. La resta són candidats a retirar. El cron d'higiene els llista cada dia a `.immunitari/higiene/aammdd.json` (L0) i només els trasllada a una paperera germana del repositori (`../.sdp-paperera-builds/retencio-ISO/`, amb `MANIFEST.json` i el sha256 de cada paquet) quan el Mestre confirma la proposta des d'un terminal: `node tooling/higiene/cron_higiene.mjs --l2` mostra la proposta i el seu codi, i `--l2 --confirma CODI` l'aplica (L2). El cron no esborra mai cap ZIP: la paperera germana no entra a cap purga, i la buida el Mestre a mà quan vulga. Els `*.zip` no es versionen (`.gitignore`).

## 5. Constància
El paquet que es lliura es cita amb el seu nom exacte a l'informe o a l'Acta Marmota de la sessió: és el que la retenció conserva.

## Vincles
- [[00_INDEX_SKILLS]]
