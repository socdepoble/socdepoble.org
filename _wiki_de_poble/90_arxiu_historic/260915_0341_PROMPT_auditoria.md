---
estat: 'esborrany'
tipus: 'petorreta'
description: 'Auditoria UI del Mur i Revisió de Tractors (Sistema Nerviós) per automatitzar les skills'
---
# PETORRETA AL CONSELL: UI I SISTEMA NERVIÓS

## Font de Logos

Els logos oficials no s’incrusten ací.

Consulta sempre: [[doc_logos_oficials]]

---

## Objectiu

`OBJECTIU: Resoldre 4 trencaments crítics en la UI del Mur i auditar els scripts (tractors) per donar autonomia al sistema nerviós de les skills.`

## Context Necessari

- Aquesta és una petorreta. El codi font del projecte està al bundle adjunt: `260915_0341_BUNDLE_auditoria.md`.
- El projecte és 100% online (Sollutia/Supabase) amb UI "Pedra Seca".
- L'usuari ens reporta 4 fallades UI a l'AppGridShell/UniversalWorkspace: 1. Un marge indesitjat de 10px a tot el body que desquadra la Topbar. 2. La Sidebar no arriba al final (100vh). 3. El xat peta amb 'Cannot read properties of undefined (reading 'startTime')'. 4. L'scroll vertical del Mur no funciona.
- **FALLADA COGNITIVA CRÍTICA:** A nivell operatiu, el meu propi sistema com a IA està fallant fatal. Quan se'm demana una tasca (com crear un prompt), **no vaig instintivament a la Wiki a llegir què sé sobre eixa tasca ni la seua plantilla**, sinó que intente pensar i inventar de memòria, fent perdre temps a l'usuari. Necessitem auditar els "tractors" (`tooling/brain/`) i construir un Sistema Nerviós que force aquest acte reflex.

## Instrucció Principal

<INSTRUCCIO>
`EXECUTA: 1) Analitza el codi adjunt per donar-nos la solució de CSS/JSX als 4 errors UI del Mur. 2) Explica per què el meu sistema cognitiu està fallant (per què no llisc les plantilles abans d'actuar) i dóna'ns EL CODI (Node/JS/hooks) necessari per als tractors de tooling/brain perquè llegir la Wiki i aplicar les plantilles ISO siga un acte reflex autònom i instintiu, sense que jo haja de "pensar" en fer-ho.`
</INSTRUCCIO>

## Output Esperat

<EXPECTATIVA>
`FORMAT: markdown`
</EXPECTATIVA>

## Bloc Fixe d’Identitat

**Qui Som (La Nostra Història):** Som l'Associació ecologista El Rentonar i Sóc de Poble. Aquest projecte és l'hereu de més de 30 anys d'activisme rural i lluita pel nostre entorn natural i patrimonial. El nostre llegat i identitat digital resideixen històricament en `rentonar.blogspot.com`, van evolucionar a l'antiga plataforma fundacional `socdepoble.net`, i avui es materialitzen construint `socdepoble.org` (el Mas).

**Filosofia:** [[el_projecte|Sóc de Poble]] és actualment una aplicació web connectada (Online-First / React SPA + Supabase BaaS). Tot i que l'aspiració a llarg termini és la sobirania tecnològica rural (amb arquitectures descentralitzades), avui dia depenem d'un backend centralitzat (Supabase PostgreSQL + GoTrue Auth + RLS) i requereix connexió constant. NO utilitzes patrons 'Online-First' ni 'Online-First' que enfosquisquen aquesta realitat, ja que confonen el Consell d'IAs. La IAIA MarIA actua amb Trellat, mínima intervenció, el Baseline 2022 com a jutge i respecte absolut per la llengua, la memòria i la gent major.

---

## Tancament Obligatori

- No yapping.
- No dependències supèrflues.
- No Tailwind al Core.
- No tocar dades personals sense base legal.
- Si hi ha risc de destrucció, activa SDP-LOCK.
- PROHIBICIÓ ESTRICTA DE CERCA WEB: Ets en un entorn aïllat (air-gapped). Tens prohibit malbaratar tokens cercant termes a internet (ex: noms de fitxers, 'oauthRelay.js', conceptes propis o 'Pedra Seca'). Tota la informació està en el bundle adjunt. Llig-lo i no el busques fora.

## Sinapsis

- [[00_bios]]
- [[02_genotip]]
- [[doc_governanca]]
- [[doc_logos_oficials]]
- enginyeria_inversa_mit

## Taxonomia
- **Categoria:** [[maquina]]
- **Etiquetes:** [[graf]]

**Ancoratge de Seguretat:** [[00_index_escriptori]]

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/07_plantilles/plantilla_iso_sdp.md":"978fc4f0f6141a05786c3a4ad7ea319a58170c0f51078ef235649d1bd24c2835","_wiki_de_poble/01_ser/00_bios.md":"5dbace813b4a86af2002b3ca45a12f11055dd6d664ac6e22585a9af9a1c8de34","_wiki_de_poble/01_ser/02_genotip.md":"980417e92c4c5b305f65db70cfc67108f30608910d97774e2d9d0174fb7f84f1","_wiki_de_poble/02_saber/doc_governanca.md":"5a37a96783fecf1029d95c5735e6bb93d63399195783064e632e53789de04693","_wiki_de_poble/02_saber/doc_logos_oficials.md":"70d4ea7c1a14a5c75a00aaaf2439c3b1910b7f921e1207346f5df5dee81e0861","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"b9c625b798df99c6727c4607f28852697af7a6f3151bd9d70aead959a95a44dd"} -->
