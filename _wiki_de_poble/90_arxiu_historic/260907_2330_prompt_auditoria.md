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

## OBJECTIU DIRECTE I INEQUÍVOC

Ets el Consell Superior. Tens accés a tot el `BUNDLE_*.md` adjunt amb el codi complet de Sóc de Poble (Fase 3).
La teua **única i exclusiva missió** avui és auditar la SEGURETAT I EL BLINDATGE de la base de dades Supabase.
Fes especial atenció al fitxer `supabase/schema.sql`.

Vull que:
1. Reavises cadascuna de les polítiques de **Row Level Security (RLS)**.
2. Comproves si és possible colar dades sense ser amo (owner) del poble o si és possible accedir a xats/murs que no toquen.
3. Comproves com interactua el Magic Link i la validació d'identitats (usuaris vs organitzacions) amb les RLS.
4. Redactes un informe despietat (Estudi) marcant els forats si n'hi ha. Si està completament blindat, dóna la teua Benedicció de Seguretat per poder pujar a Producció amb la consciència tranquil·la.

**Important:** No em parles de disseny ni de UI. Aquesta és una auditoria purament de *Backend* i RLS (schema.sql).

## Context Necessari

Bundle aparellat: 260907_2330_BUNDLE_auditoria.md.

La integració actual és purament online i centrada en crear una connexió perfecta per al sistema de la nostra empresa sòcia, Sollutia; la sobirania local és una meta de llarg termini.

## Instrucció Principal

Analitza el codi i la Wiki adjunts, identifica causes i proposa correccions mínimes verificables

`EXECUTA: Analitza el codi i la Wiki adjunts, identifica causes i proposa correccions mínimes verificables`

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
