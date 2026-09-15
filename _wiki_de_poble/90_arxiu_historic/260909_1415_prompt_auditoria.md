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

Auditar el paquet auditoria amb evidències verificables

`OBJECTIU: Auditar el paquet auditoria amb evidències verificables`

## Context Necessari

Bundle aparellat: 260909_1415_BUNDLE_auditoria.md.

La integració actual és purament online i centrada en crear una connexió perfecta per al sistema de la nostra empresa sòcia, Sollutia; la sobirania local és una meta de llarg termini.

## Instrucció Principal

Analitza el codi i la Wiki adjunts, identifica causes i proposa correccions mínimes verificables.

**Pregunta Extra (Desafiament Termodinàmic i Estructura):** 
1. **El Bundle:** Actualment pesa 4MB. A banda del dictamen sobre la Sopa de DOM, m'agradaria que avaluarares l'script o el format del bundle. Estem enviant el millor bundle genèric possible per a totes les IAs? Hi ha alguna manera d'optimitzar-lo per a reduir-ne el pes (minificació, formats més densos, reestructuració d'scripts) sense amagar informació ni trencar el context, o aquest pes és inevitable?
2. **La Plantilla del Prompt:** Fixa't en l'estructura d'aquesta petorreta (com està plantejada la Identitat, la Taxonomia, el Context...). Necessita alguna millora perquè les IAs tinguen sempre tot el que necessiten (com va passar amb el tema dels logos), o ja és òptima per a qualsevol model?
3. **Flux de treball (Arxiu Històric vs Wiki Activa):** Per evitar l'ofec termodinàmic, hem pres la decisió de moure tot l'historial acumulat (giges de dades) a una carpeta externa (`_arxiu_wiki_de_poble`) fora de la Wiki, deixant la Wiki només amb coneixement destil·lat, usant una carpeta temporal `90_Revisar` com a pont. És efectiva i correcta aquesta decisió per facilitar el treball de les IAs?
4. **Organització de la Wiki (Ontologia):** Actualment estructurem la Wiki en `01_Ser`, `02_Saber`, `03_Actuar`. Alguns documents crítics com `DOC_Governanca` estan dins de `02_Saber`. Té sentit aquesta taxonomia per al vostre raonament, o hi ha alguna arquitectura d'informació millor per a una Wiki gestionada per IAs? On posaríeu la Governança/Constitució?
5. **Estàndard de Nomenclatura (Formatting):** Com hauràs observat, els noms dels fitxers són inconsistents (barregem `snake_case`, `CamelCase`, majúscules i minúscules com `identitat_visual` vs `Identitat` o `DOC_Governanca`). Quin és l'estàndard de nomenclatura més eficient, llegible i òptim perquè els LLMs processeu l'arbre de fitxers de la Wiki? Proposeu-nos un estàndard ferm.

`EXECUTA: Analitza el codi i la Wiki adjunts, identifica causes, proposa correccions sobre la Sopa de DOM i respon detalladament a cadascun dels 5 punts del Desafiament Termodinàmic i d'Estructura.`

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
