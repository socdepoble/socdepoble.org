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

Auditoria profunda de seguretat (exploits), atomització del codi i implementació completa del flux de Registre/Login i el mòdul de Xat.

`OBJECTIU: Codi de millora profunda, detecció d'exploits i construcció del registre d'usuaris`

## Context Necessari

Bundle aparellat: `260908_0800_BUNDLE_auditoria.md`

Ens trobem a les portes de la Beta. Fins ara hem auditat l'arquitectura teòrica, però el Mestre Javi ens adverteix que **ni tan sols ell s'ha registrat encara**. No sabem del cert si el flux de registre/login actual amb Supabase funciona de forma segura. A més, volem atomitzar l'arquitectura del frontend perquè puga créixer sense traumes i buscar qualsevol "exploit" que permeta trencar el sistema.

## Instrucció Principal

Analitza el bundle adjunt i entrega'ns una resposta exclusivament centrada en **CODI I SEGURETAT**. Necessitem:

1. **Auditoria del Registre/Auth:** Revisa el codi actual de Supabase Auth i el flux d'onboarding. Funciona? És segur? Si no ho és, dóna'ns el codi exacte per a reparar-ho.
2. **Detecció d'Exploits:** Cerca qualsevol vulnerabilitat (bypasses de RLS, injeccions, cua offline manipulable) i dóna'ns l'SQL o JS per a tancar-ho.
3. **Atomització:** Proposa l'estructura de components React i la lògica per a atomitzar l'aplicació, especialment el nou Xat (amb el seu esquema de 4 taules) i el pont d'exportació al Bloc de Notes. Dóna'ns el codi per a no haver d'inventar la roda.

`EXECUTA: Analitza el flux de registre, detecta exploits de seguretat i proporciona el codi exacte per atomitzar el Xat i l'Auth.`

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
