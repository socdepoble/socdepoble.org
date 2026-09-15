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

Realitzar una auditoria destructiva global per a netejar la casa, sincronitzar la lògica i obtenir una avaluació arquitectònica (nota de 0 a 10).

`OBJECTIU: Realitzar auditoria destructiva, neteja de deute, revisió Sollutia-Tractors i avaluació 0-10`

## Context Necessari

Bundle aparellat: 260909_1325_BUNDLE_auditoria.md.

El sistema acaba de passar una gran refactorització per aplicar la Llei de la Mida (58px) a les capçaleres i abstreure el CSS del Bloc de Notes i l'AppGridShell. Tanmateix, sabem que encara hi ha deute tècnic acumulat. Volem buscar l'excel·lència. Volem que compareu com està el sistema ara respecte a com hauria d'estar si fóra perfecte segons els nostres ideals (Llei de Pedra Seca, Trellat i Universalització).

## Instrucció Principal

Has d'analitzar el codi de dalt a baix i lliurar un informe detallat amb els següents punts:

1. **La Gran Neteja (Auditoria Destructiva):** Busca i denuncia tots els `divs` duplicats, triplicats o quadriplicats que hagen quedat com a deute tècnic antic, codi mort (especialment CSS), mètodes orfes, i estructures de components redundants (sopa de DOM) que haurien de fondre's en un component universal.
2. **Sincronització Lògica i Mecànica:** Revisa com s'acobla la "nostra lògica" de la UI i l'estat, amb la "lògica de Sollutia" (Supabase backend, Autenticació, Base de Dades). També avalua si el disseny reflecteix el que es dicta a les nostres *Skills* i als *Tractors* (sondes mecàniques a `tooling/gates/`).
3. **El Veredicte (Nota del 0 al 10):** Volem saber on estem. Avalua el sistema actual i atorga una nota del 0 al 10 sobre l'estat tècnic global, comparant-ho amb la imatge de l'arquitectura perfecta que tenim pensada (zero complexitat inútil, modular, sòlida com la pedra seca, offline-ready a futur però brillant en online). Justifica la nota detalladament perquè un humà sense coneixements tècnics avançats entenga a quin "nivell" ens movem.

`EXECUTA: Analitza el bundle, denuncia codi duplicat, avalua sincronització amb Sollutia/Tractors i dona una nota tècnica de l'arquitectura (0-10)`

## Output Esperat

Dictamen en Markdown, extremadament incisiu i directe. Posa la Nota (0-10) al principi del document com a resum executiu i després desglossa els punts a netejar.

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
