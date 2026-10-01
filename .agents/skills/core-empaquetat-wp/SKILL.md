---
name: core-empaquetat-wp
description: Tractor cognitiu per estandarditzar la creació, nomenclatura i emmagatzematge dels arxius ZIP del connector de WordPress, evitant l'acumulació de brossa a l'arrel.
tags:
  - tractor
  - neteja
  - wordpress
---
# Tractors i Procediment d'Empaquetat del Plugin de WordPress (Enxufe)

Aquesta skill s'ha d'invocar **SEMPRE** que una IA (o el Mestre) demane generar un arxiu ZIP per a pujar l'aplicació a WordPress o distribuir la SPA independent. Serveix com a tallafoc contra el "Llop Salvatge" d'escopir zips i carpetes temporals sense rumb per qualsevol lloc de l'espai de treball.

## 1. Nomenclatura Estàndard i Termodinàmica
Qualsevol ZIP compilat (siga a mà, per script de laboratori, o per IA autònoma) HA DE TENIR obligatòriament el format següent:
- Per al plugin WP: `socdepoble-enxufe-v[MAJOR].[MINOR].[PATCH]-aammdd_hhmm.zip` (Exemple: `socdepoble-enxufe-v1.0.3-260930_2005.zip`)
- Per a la SPA aïllada: `socdepoble-spa-v[MAJOR].[MINOR].[PATCH]-aammdd_hhmm.zip`

## 2. Destinació Única (01_produccio)
D'acord amb la Regla 12 de l'Escriptori, els productes finals i pesants destinats a ús humà (com un ZIP preparat per a instal·lar en un servidor remot) van EXCLUSIVAMENT a la zona de producció:
**Ruta canònica:** `_wiki_de_poble/04_escriptori/01_produccio/builds/` 

Està **ESTRICTAMENT PROHIBIT** guardar arxius `.zip`, `.tar.gz` o carpetes temporals de compilat (ex. `wordpress-plugin/`) a:
- L'arrel del repositori `/`
- La carpeta `scratch/`
- `_wiki_de_poble/04_escriptori/00_bandeja_d_entrada/`

## 3. Neteja de Brossa Temporal (Acte Reflex)
Després de generar i moure l'arxiu ZIP a `01_produccio/builds/`, l'agent TÉ L'OBLIGACIÓ absoluta d'esborrar (`rm -rf`) completament qualsevol directori temporal o subproducte intermedi utilitzat durant la generació de la versió. Si deixes rastre a l'arrel, estàs contravenint el BIOS i seràs auditat amb penalització.

## 4. Evitar l'Orfandat
Tot fitxer desat a `01_produccio/` necessita una àncora. Quan generes un ZIP nou i el deses, recorda enllaçar-lo o deixar-ne constància documental als índexs (p. ex., en un informe d'auditoria de la sessió, o al 00_index de producció) perquè no quede orbitant com un satèl·lit fantasma a l'arquitectura.
