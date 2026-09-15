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

Executar l'ordre d'atac del teu dictamen parcial (Nota 6,4) i auditar la resta del codi (Sopa de DOM, esquemes SQL) amb neteja extrema (Salfumà).

`OBJECTIU: Executar els 10 punts de neteja, auditar DOM/SQL i retornar codi sec per aplicar-ho`

## Context Necessari

Bundle aparellat: 260909_1346_BUNDLE_auditoria.md.

Al teu dictamen anterior ens vas atorgar un 6,4/10 i vas establir un "ORDRE D'ATAC" de 10 punts per resoldre P0s i deute (netejar 110 classes CSS mortes, connectar portes, etc.). A més, no vas tenir temps d'auditar el DOM duplicat ni els schemas SQL. El pressupost ja no és un problema. Tens via lliure absoluta per gastar el que calga.

## Instrucció Principal

Has de fer DUES coses en aquesta sessió:

1. **L'Ordre d'Atac (Execució):** Dóna'ns el codi sec i exacte (snippets de substitució) per aplicar els 10 punts que vas diagnosticar (ex: on i com endollar el porter de 58px, el pedaç de folderId: 'f-notes', l'export del tractor de cadena, etc.). Fes que els puguem copiar i enganxar ràpidament.
2. **L'Auditoria Restant (Operació Salfumà):** Entra on no vas poder entrar. Analitza els components grans (`UniversalComponents.jsx`, `DesignSection.jsx`), els schemas de base de dades i les llavors. Elimina qualsevol rastre de sopa de DOM o divs quadriplicats inútils. Elimina tot el que no siga absolutament necessari perquè el sistema funcione. Retorna el codi refactoritzat i net. Fes la feina completa.

`EXECUTA: Dóna el codi per arreglar els 10 punts de deute i fes una neteja agressiva (salfumà) del DOM i SQL restants.`

## Output Esperat

Dictamen directe en Markdown. Posa els blocs de codi de forma molt seca i estructurada (indicant quin fitxer i quina línia cal canviar o esborrar) perquè siga fàcil per nosaltres aplicar-ho automàticament. Fes tota la faena i dóna-ho mastegat.

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
