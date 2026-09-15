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

Auditar el pla d'implementació per a la transició a Online-First (Fase 3) i les reparacions de la base de dades (B1 i B2).

`OBJECTIU: Validar els canvis SQL de la Fase 3 abans que l'usuari es registre i testejos els canvis.`

## Context Necessari

Bundle aparellat: 260907_2131_BUNDLE_auditoria.md.

La integració actual és purament online i centrada en crear una connexió perfecta per al sistema de la nostra empresa sòcia, Sollutia; la sobirania local és una meta de llarg termini. Estem preparant-nos per fer migracions SQL crítiques.

## Instrucció Principal

Analitza el codi SQL proposat a l'`implementation_plan.md` (veure dins el bundle o en l'historial recent) i l'arquitectura actual. Volem:
1. Validar la robustesa de l'enfocament B1 (Reparar `list_my_organizations`).
2. Validar B2 (`private.ajustos` i `handle_new_user`).
3. Validar Fase 3 (Rols globals i claims a Supabase sense estat local en Zustand).
4. **DONA'NS UNA NOTA (SCORE)** de la complexitat i estat actual del sistema. Dona'ns una idea clara d'esta transició per planificar el temps (seran 2 dies? 2 setmanes?).

`EXECUTA: Analitza el codi i dóna'ns el feedback de seguretat i complexitat per a la Fase 3, juntament amb una estimació de temps (Nota).`

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

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_ACTUAR_Tecnica/plantilles/PLANTILLA_ISO_SDP.md":"1579af8b4a5938f86995776df6a1af1907ca7b220d1df77231b213ab4276ab76","_wiki_de_poble/00_SER_Identitat_Cervell/00_BIOS.md":"fc4f36244a2fa668b1f89dc920b7e5c5d9d85e944f6e3972ac683734f96f02d9","_wiki_de_poble/00_SER_Identitat_Cervell/02_GENOTIP.md":"5661dfb5a5136e241f85477473542f3346f48781a02a30701e52640192c082e0","_wiki_de_poble/03_GOVERNAR_Normativa/DOC_Governanca.md":"80fa2264bb8b5cb76fb4e61fc6c0463059017b288bcb49a44e24d9363f5ff51e","_wiki_de_poble/00_SER_Identitat_Cervell/DOC_Logos_Oficials.md":"34dba63b26a0628396d45131eb79cd00520343a5b33b1dbb6f6e3a2917a909b7","_wiki_de_poble/02_ACTUAR_Tecnica/architecture/ADR-2026-08-ONLINE-FIRST.md":"6700cb9c7f53419c1ccabb7f0c2aa7001b11c8795bca40b844e20ef5748395ec"} -->
