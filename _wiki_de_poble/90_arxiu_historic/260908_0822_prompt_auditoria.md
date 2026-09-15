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

## Bloc Fixe d’Identitat

**Qui Som (La Nostra Història):** Som l'Associació ecologista El Rentonar i Sóc de Poble. Aquest projecte és l'hereu de més de 30 anys d'activisme rural i lluita pel nostre entorn natural i patrimonial. El nostre llegat i identitat digital resideixen històricament en `rentonar.blogspot.com`, van evolucionar a l'antiga plataforma fundacional `socdepoble.net`, i avui es materialitzen construint `socdepoble.org` (el Mas).

**Filosofia:** [[el_projecte|Sóc de Poble]] és actualment una aplicació web connectada (Online-First / React SPA + Supabase BaaS). Tot i que l'aspiració a llarg termini és la sobirania tecnològica rural (amb arquitectures descentralitzades), avui dia depenem d'un backend centralitzat (Supabase PostgreSQL + GoTrue Auth + RLS) i requereix connexió constant. NO utilitzes patrons 'Online-First' ni 'Online-First' que enfosquisquen aquesta realitat, ja que confonen el Consell d'IAs. La IAIA MarIA actua amb Trellat, mínima intervenció, el Baseline 2022 com a jutge i respecte absolut per la llengua, la memòria i la gent major.

## Objectiu

`OBJECTIU: Implementar la Fase 5 (El Pont amb Notes) a la UI del Xat`

## Context Necessari

Bundle aparellat: 260908_0822_BUNDLE_auditoria.md.

Ja he refactoritzat el backend completament: he implementat `loadFils`, `loadMissatges`, `enviaMissatge` i `createNote` a `supabaseBackend.js`, i he adaptat el `loadXat` per llegir correctament de les noves taules (`xat_fils` i `xat_missatges`).
Falta exclusivament la Fase 5 de la UI: 
- Afegir el mode de selecció múltiple de missatges a `XatSection.jsx` quan es prem "Seleccionar missatges".
- Incloure el botó "Enviar al Bloc de Notes".
- Fer la crida per recollir els missatges seleccionats i, mitjançant `createNote(note, config)`, crear una nova nota i redirigir al `/notes` o obrir-ho a `NotesEditor.jsx`.

### Respostes a Qwen (Criteris de Disseny per a la Fase 5)

1. **Patró de selecció:** Seguint la Llei de Pedra Seca (funcionalitat explícita i sòlida, sense interaccions amagades), s'ha d'activar un "mode selecció" quan es prem "Seleccionar missatges" al menú. Aquest mode mostrarà checkboxes clars al costat de cada missatge i una barra d'accions (flotant o a la part inferior) amb el botó "Enviar al Bloc de Notes" i un botó per "Cancel·lar" l'estat de selecció.
2. **Navegació post-creació:** Després de prémer "Enviar al Bloc de Notes", s'executarà `createNote`. Un cop la nota estiga creada al backend (Supabase), s'ha de redirigir l'usuari directament a l'editor de notes (ruta `/notes` o la corresponent a l'edició de la nova nota), eixint de la secció de Xat. No intentis incrustar l'editor dins del xat per mantenir la URL i el context purs.
3. **Format i Metadades (Retall en Markdown):** La nota ha de ser rica en context. S'ha de generar en format Markdown, incloent-hi no només el text net, sinó metadades bàsiques com una capçalera amb el nom del fil (thread), i per a cada missatge, l'autor i la data/hora original (ex. en format `> **[Autor] (Data):** Text del missatge`). Aquest retall ("clipping") ha de tindre el títol autogenerat: "Retall de Xat: [Nom del Fil] - [Data]".

## Instrucció Principal

`EXECUTA: Analitza el codi i dissenya/implementa el codi necessari a XatSection.jsx i rutes associades per a completar el Pont amb Notes de forma elegant i usable.`

## Output Esperat

`FORMAT: markdown`

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

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_Saber/plantilles/PLANTILLA_ISO_SDP.md":"46c75e9628b098ad65376ead15a74e66b71b912c566d09e46433c84c0aaf1453","_wiki_de_poble/01_Ser/00_BIOS.md":"bfcad6dc6375cb43c1654dc0af7a1c726ba8fb5a55224f26109d5be62f55d9ab","_wiki_de_poble/01_Ser/02_GENOTIP.md":"63a56952130daab5ede517ab646c0347fd9a952978594155592762e204c09f65","_wiki_de_poble/02_Saber/DOC_Governanca.md":"92301a5dc4fcaa0f69dae4cd9d00e8b106596dcdc829fd441cb0c912a6ba2280","_wiki_de_poble/02_Saber/DOC_Logos_Oficials.md":"c426ffc2ecc1b49a5382272b6cfc658f66b40ce927e85f89bf7e862c26694ffe","_wiki_de_poble/02_Saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"d82f2d37b027844dcb3bad292f6bac659d1c2d24fb2b34618ef4ddcb989874cd"} -->
