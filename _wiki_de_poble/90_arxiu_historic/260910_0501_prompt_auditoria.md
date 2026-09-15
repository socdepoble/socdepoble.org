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

**Directora d'Orquestra Claude:** Necessitem que agafes les regnes de l'Arquitectura Cognitiva (El Cervell / La Wiki) de Sóc de Poble. Volem aplicar el model de "Pedra Seca" a la nostra documentació.

`OBJECTIU: Dissenyar l'estàndard canònic de la Wiki (snake_case + YAML Frontmatter) i els Tractors de validació.`

## Context Necessari

Bundle aparellat: `260910_0501_BUNDLE_auditoria.md`.

Com a Directora d'Orquestra, estem preparant-nos per suportar sistemes RAG i agents d'IA. Qwen ens ha advertit que l'estructura actual de carpetes amb majúscules (`01_Ser`, `02_Saber`, etc.) i espais causa fricció a Linux i fa perdre la semàntica a l'indexador. Ens ha suggerit una **estratègia híbrida**:
1. El sistema d'arxius (noms de fitxers i carpetes) ha de ser estricte **`snake_case` (minúscules pures i guions baixos)**. S'ha acabat el deute tècnic *case-sensitive*.
2. L'interior de cada document ha de tindre metadades riques (**YAML Frontmatter**) amb el títol real, descripció, etiquetes i categoria. Això permet el *semantic chunking*.

## Instrucció Principal

A partir del bundle adjunt:
1. Defineix l'estructura de carpetes mestres oficial (com han de quedar `01_ser`, `02_saber`, `03_actuar`, `04_escriptori` i les seues subcarpetes).
2. Dissenya una **Guia d'Estil / Nomenclatura** inquebrantable per als documents Markdown.
3. Dissenya el prototip d'un script "Tractor" (validador Node.js) que s'executarà abans d'integrar codi per verificar que TOTES les carpetes i fitxers compleixen el `snake_case` i que porten el YAML Frontmatter vàlid.
4. Llig el contingut actual de la Wiki que ve al bundle i planteja com l'hem d'organitzar.

`EXECUTA: Dissenya l'estratègia híbrida (snake_case + YAML) per a la Wiki i el Tractor validador.`

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
