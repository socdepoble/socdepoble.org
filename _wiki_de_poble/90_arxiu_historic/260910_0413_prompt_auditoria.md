---
tipus: petorreta
estat: esborrany
description: Auditoria tècnica del paquet auditoria
---
# 🛡️ PETORRETA AL CONSELL: AUDITORIA

## Font de Logos

Els logos oficials no s’incrusten ací.

Consulta sempre: [[doc_logos_oficials]]

---

## Objectiu

Consell d'IAs (Deepseek, Claude, Qwen, etc.): Volem auditar i validar la nova estructura del "Cervell" (la Wiki). 
Actualment estem reorganitzant carpetes clau com `00_Ser`, `01_Saber`, `02_Actuar`, `03_Governar`, etc. 

`OBJECTIU: Validar si l'estructura del cervell proposada és la definitiva i si la nomenclatura és l'adequada (snake_case vs altres).`

## Context Necessari

Bundle aparellat: 260910_0413_BUNDLE_auditoria.md.

Ens plantegem utilitzar **Title_Snake_Case** (amb la primera en majúscula per guanyar rellevància visual, ex: `00_SER_Identitat_Brain`, `01_SABER_Cultura_Coneixement`, `02_ACTUAR_Maquina_Tecnica`, `03_GOVERNAR_Normativa`) per nomenar carpetes.
L'objectiu d'això és fixar enllaços sòlids d'una vegada per totes i que ja no tornen a canviar.

## Instrucció Principal

Analitzeu el model de carpetes del cervell i discutiu el següent:
1. És aquesta organització (Ser, Saber, Actuar, Governar) realment definitiva i escalable, o en falta alguna part vital?
2. Què en penseu d'utilitzar Snake Case capitalitzat (`01_Saber_Cultura`) en lloc de CamelCase o minúscules? Ajudarà a la solidesa dels enllaços?
3. Proposeu millores, si en teniu, o valideu la base actual per segellar-la.

`EXECUTA: Analitza l'estructura de carpetes del cervell i aporta una visió crítica sobre l'arquitectura de la informació i la nomenclatura per ancorar-la definitivament.`

## Output Esperat

`FORMAT: markdown`

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

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_Saber/plantilles/PLANTILLA_ISO_SDP.md":"5d347c8cf7fa59d34953dc2e5eddfb7013a271a404e7fa7c4d6ace73ac8324b4","_wiki_de_poble/01_Ser/00_BIOS.md":"bfcad6dc6375cb43c1654dc0af7a1c726ba8fb5a55224f26109d5be62f55d9ab","_wiki_de_poble/01_Ser/02_GENOTIP.md":"63a56952130daab5ede517ab646c0347fd9a952978594155592762e204c09f65","_wiki_de_poble/02_Saber/DOC_Governanca.md":"92301a5dc4fcaa0f69dae4cd9d00e8b106596dcdc829fd441cb0c912a6ba2280","_wiki_de_poble/02_Saber/DOC_Logos_Oficials.md":"c426ffc2ecc1b49a5382272b6cfc658f66b40ce927e85f89bf7e862c26694ffe","_wiki_de_poble/02_Saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"d82f2d37b027844dcb3bad292f6bac659d1c2d24fb2b34618ef4ddcb989874cd"} -->
