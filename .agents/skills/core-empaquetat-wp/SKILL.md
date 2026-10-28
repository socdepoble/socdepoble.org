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

## 2. Destinació Única Satèl·lit (_builds_de_poble/wordpress/)
D'acord amb la Llei de la Puresa de Capes i per no ofegar el repositori de codi font (`socdepoble.org`), tots els productes finals, binaris compilats i arxius ZIP del connector de WordPress van **EXCLUSIVAMENT** al magatzem satèl·lit extern:
**Ruta canònica externa:** `../_builds_de_poble/wordpress/`

Està **ESTRICTAMENT PROHIBIT** guardar arxius `.zip`, `.tar.gz`, `.apk`, `.aab` o binaris compilats pesats a:
- L'arrel del repositori `/`
- L'arbre intern de `wordpress-plugin/` (ni a `wordpress-plugin/builds/` ni subcarpetes)
- La carpeta `scratch/`
- `_wiki_de_poble/04_escriptori/`

Dins de `wordpress-plugin/builds/` només hi poden residir els manifests lleugers en text JSON per a l'actualitzador autònom (`stable.json`, signatures `.sig`), mai binaris ZIP.

## 3. Neteja de Brossa Temporal (Acte Reflex)
Quan es genere un paquet ZIP per a la comunitat o per a WordPress.org (`socdepoble.zip`), es diposita directament a `../_builds_de_poble/wordpress/`. Si cap eina d'empaquetat o procés intermedi deixa fitxers temporals o còpies locals de `.zip` a l'arbre de treball de `socdepoble.org`, s'han de moure immediatament a `_builds_de_poble/wordpress/` o purgar de l'arbre abans de tancar el torn.

## 4. Retenció a _builds_de_poble/wordpress/
A `_builds_de_poble/wordpress/` es conserven:
- L'últim paquet vigent per a WordPress.org (`socdepoble.zip`).
- Els paquets datats per versió (`AAMMDD_HHMM_wordpress_...zip`).
- Els informes de validació JSON associats a cada paquet.
Els fitxers ZIP mai es versionen a Git (`.gitignore`).

## 5. Constància
El paquet que es lliura es cita amb el seu nom exacte a l'informe o a l'Acta Marmota de la sessió: és el que la retenció a `_builds_de_poble/wordpress/` conserva.

## Vincles
- [[00_INDEX_SKILLS]]
