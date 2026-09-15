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

Auditar l'arquitectura i el disseny visual del Bloc de Notes (`NotesSection.jsx` i components derivats) per a polir-ne l'estructura, corregir les alçades de les capçaleres (58px) i preparar aquesta maquetació com a base genèrica reutilitzable per a la futura pantalla de Perfil d'Usuari.

## Context Necessari

Bundle aparellat: 260909_1201_BUNDLE_auditoria.md.

La integració actual és purament online i centrada en crear una connexió perfecta per al sistema de la nostra empresa sòcia, Sollutia; la sobirania local és una meta de llarg termini.

## Instrucció Principal

Analitza el codi adjunt, centrant-te específicament en l'entorn de Notes (`NotesSection.jsx`, CSS i Layouts vinculats). Necessitem:

1. **Correcció de Capçaleres:** Assegura que totes les barres superiors compleixen estrictament l'altura de 58px i estan correctament alineades visualment sota la Llei de Pedra Seca.
2. **Abstracció i Reutilització del Layout:** L'estructura visual del Bloc de Notes (amb la llista/menú lateral i el document a la dreta) haurà de servir **exactament igual** per a mostrar els Perfils d'Usuari complexos i estesos. Avalua i prepara el Layout perquè suporte aquest doble propòsit amb el mínim codi possible.
3. **Poda General:** Neteja codi mort, estils redundants o deute tècnic acumulat a l'ecosistema de Notes.
4. **Pausa d'Agents:** NO t'enfoques en canviar els noms de les carpetes o la lògica d'Avatars/Agents. Això es dissenyarà més endavant de forma flexible. Centra't purament en l'esquelet visual i arquitectònic.
5. **Auditoria Destructiva:** A banda del Bloc de Notes, dedica part de la teua intel·ligència a intentar "rebentar" TOTA l'arquitectura global de l'aplicació. Busca bugs ocults, errors de lògica, o vulnerabilitats de manteniment fins que no en trobes cap. Volem regalar un sistema robust i lliure de manteniment, així que audita el codi sense pietat.

Dictamina les propostes i aporta el codi sec necessari per a aplicar els canvis.

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
