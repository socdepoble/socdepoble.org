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

Bundle aparellat: 260908_0311_BUNDLE_auditoria.md.

La integració actual és purament online i centrada en crear una connexió perfecta per al sistema de la nostra empresa sòcia, Sollutia. 
El Mestre i la IAIA MarIA ja han implementat els Pedaços de Seguretat Crítica (OAuth `window.location.origin` / `sessionStorage`, RLS segur amb triggers d'immutabilitat, aturador online-first a SupabaseBackend). També s'ha fet el Sanejament Cognitiu (Wiki reestructurada en anells enumerats: 00_Raw, 01_Ser, 02_Saber, 04_Escriptori). 
El Deute Tècnic Restant (Desfragmentació de Monolits en UniversalComponents.jsx) NO S'HA FET per protegir la supervivència de la interfície visual en aquesta iteració.

## Instrucció Principal

Audita la solidesa dels pedaços aplicats a l'esquema SQL i RLS (Fase 1 i 2). Avalua el Trellat d'haver posposat els monolits. Decideix si el sistema mereix el **GO PER A PRODUCCIÓ** ara mateix. Si consideres que els monolits són bloquejants i els podem trossejar de forma segura abans de producció, dona'n la instrucció detallada, però sigues molt prudent.

**Per a Codex:** Sabem que tens pocs tokens de sortida. Intenta prioritzar donar-nos la resposta completa (encara que hages de sacrificar part de l'anàlisi profunda), però el que ens dones que siga accionable al 100% per poder implementar-ho directament. Som conscients del teu límit, no et talles si has d'anar ràpid al gra.
**Per a Claude i la resta de l'equip:** Estem tots en el mateix equip. El nostre objectiu és consolidar un sistema (Creative Commons) que puga ser heretat per qualsevol IA futura. Ajudeu-nos a polir-lo com l'equip que som. En el cas concret de Claude, sabem que encara et queden molts tokens (aprox 70%). Et demanem que gastes tots els teus tokens en aquesta resposta per analitzar i donar-nos la màxima força possible, incloent instruccions detallades per al trossejament dels monolits si ho veus segur. Dona-ho tot en aquesta tirada perquè puguem avançar amb el disseny sense haver de fer un altre prompt.
**Pregunta arquitectònica sobre la Wiki:** Ens recomaneu crear una carpeta `03_Actuar` dins de la Wiki per a tindre a mà un índex dels scripts? O és millor que la Wiki només siga per a "Saber" i els scripts continuen vivint fora (`tooling/` i `.agents/skills/`) per evitar contaminar el context RAG?

`EXECUTA: Audita pedaços, respon a la pregunta de 03_Actuar i emet el GO PER A PRODUCCIÓ (o dóna les instruccions per als monolits si creus que s'ha de fer ara).`

## Output Esperat

`FORMAT: markdown`

## Tancament Obligatori

- No yapping.
- No dependències supèrflues.
- No Tailwind al Core.
- No tocar dades personals sense base legal.
- Si hi ha risc de destrucció, activa SDP-LOCK.

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

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_Saber/plantilles/PLANTILLA_ISO_SDP.md":"1579af8b4a5938f86995776df6a1af1907ca7b220d1df77231b213ab4276ab76","_wiki_de_poble/01_Ser/00_BIOS.md":"fc4f36244a2fa668b1f89dc920b7e5c5d9d85e944f6e3972ac683734f96f02d9","_wiki_de_poble/01_Ser/02_GENOTIP.md":"5661dfb5a5136e241f85477473542f3346f48781a02a30701e52640192c082e0","_wiki_de_poble/02_Saber/DOC_Governanca.md":"80fa2264bb8b5cb76fb4e61fc6c0463059017b288bcb49a44e24d9363f5ff51e","_wiki_de_poble/02_Saber/DOC_Logos_Oficials.md":"34dba63b26a0628396d45131eb79cd00520343a5b33b1dbb6f6e3a2917a909b7","_wiki_de_poble/02_Saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"6700cb9c7f53419c1ccabb7f0c2aa7001b11c8795bca40b844e20ef5748395ec"} -->
