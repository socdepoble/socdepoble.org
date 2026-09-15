---
tipus: petorreta
estat: esborrany
description: "Auditoria tècnica del paquet auditoria"
---
# 🛡️ PETORRETA AL CONSELL: AUDITORIA

## Font de Logos

Els logos oficials no s’incrusten ací.

Consulta sempre: [[doc_logos_oficials]]

---

## Objectiu

Auditar el paquet auditoria amb evidències verificables

`OBJECTIU: Auditar el paquet auditoria amb evidències verificables`

## Context Necessari

Bundle aparellat: 260915_0438_BUNDLE_auditoria.md.

La integració actual és purament online i centrada en crear una connexió perfecta per al sistema de la nostra empresa sòcia, Sollutia; la sobirania local és una meta de llarg termini.

**Estat actual (Iteració 2):**
- Codex ha implementat el pedaç per arreglar l'scroll i reactivar l'editor de Notes (UniversalRichTextContent).
- Segons els nostres tests, aquests dos errors crítics haurien d'estar solucionats a l'estructura.
- **OBJECTIU D'AQUESTA ITERACIÓ:** Ara necessitem **apujar de nivell** cap a l'excel·lència estructural. El Consell ja ha apuntat a aquests vectors d'atac, que heu d'auditar sobre el codi fresc:
  1. **Monòlits i Deute (La regla de les 300 línies):** Analitzeu `App.jsx`, `legat.css`, `XatSection.jsx` i `supabaseBackend.js`. Proposeu refactoritzacions per trossejar-los.
  2. **Anti-Divs i Semàntica (Rendiment iPad A10):** Destrosseu els "wrapper hell" inútils (`content-wrapper`, dobles *providers*). Substituïu `<div>` per Fragments de React `<></>` o tags semàntics (`<main>`, `<article>`) per evitar el *layout thrashing*.
  3. **Llei de l'Enxufabilitat:** Vigileu excepcions com `loadGestoria` (que llig d'IndexedDB directament) o migracions SQL de xat fràgils.
  4. **SEO i Accessibilitat (Usabilitat):** Proposeu estratègies de "Prerender" d'una closca HTML estàtica (compatible amb Online-First), JSON-LD, i :focus-visible global.

*(Nota interna: Ignoreu detalls cosmètics residuals com el desplaçament de la barra blava superior, ja me n'encarregaré jo. Aneu directes a l'esquelet i el rendiment).*

## Instrucció Principal

La instrucció és portar l'estructura a l'excel·lència tècnica, centrant-se exclusivament en usabilitat, SEO, puresa del DOM i destrucció de monòlits. La sang dels bugs crítics (Scroll/Notes) ja no brolla. Teniu permís per destrossar i recomanar el que siga necessari.

`EXECUTA: Audita el codi per a trobar deute tècnic residual, forats d'usabilitat, fallades SEO i oportunitats arquitectòniques per assolir l'excel·lència`

## Output Esperat

`FORMAT: markdown`

## Bloc Fixe d’Identitat

**Qui Som (La Nostra Història):** Som l'Associació ecologista El Rentonar i Sóc de Poble. Aquest projecte és l'hereu de més de 30 anys d'activisme rural i lluita pel nostre entorn natural i patrimonial. El nostre llegat i identitat digital resideixen històricament en `rentonar.blogspot.com`, van evolucionar a l'antiga plataforma fundacional `socdepoble.net`, i avui es materialitzen construint `socdepoble.org` (el Mas).

**Filosofia:** [[el_projecte|Sóc de Poble]] és actualment una aplicació web connectada (Online-First / React SPA + Supabase BaaS). Tot i que l'aspiració a llarg termini és la sobirania tecnològica rural (amb arquitectures descentralitzades), avui dia depenem d'un backend centralitzat (Supabase PostgreSQL + GoTrue Auth + RLS) i requereix connexió constant. NO utilitzes patrons 'Local-First' ni 'Offline-First' que enfosquisquen aquesta realitat, ja que confonen el Consell d'IAs. La IAIA MarIA actua amb Trellat, mínima intervenció, el Baseline 2022 com a jutge i respecte absolut per la llengua, la memòria i la gent major.

---

## Auditoria Final de Qualitat

> **📝 AUDITORIA FINAL DE QUALITAT I NIVELL DE MADURESA:**
> Sou màquines orquestradores capaces d'imaginar, projectar solucions a llarg termini d'alta complexitat informàtica. Com a darrer pas, valora aquests ítems:
> 
> 1. **La Neteja Profunda Estructural (Anti-Divs Fantasmes):** Elimina el dolor de DOM i els wrappers inútils, sense tantes capes imbricades que maten iPads en 2028.
> 2. **Anàlisi DAFO Exhaustiu de les Respostes (5 dimensions):** Executa un DAFO profund aplicant la visió associada (1. Social, 2. Personal, 3. Tècnic, 4. Econòmic i 5. Futurs).
> 3. **Estalvi de Tokens Sense Penediments Diaris:** L'error de pas és la base per a l'aprenentatge. Res de disculpes llargues; ves directa i eficient als components purs, usant la imaginació i l'intel·lecte en xarxa de cara a les pròpies necessitats per resoldre amb dades objectives a llarg terme.
> 4. **Estalvi de Tokens:** No repetisques el que ja sabem, no faces discursos inicials. Vés directe a l'arquitectura i al diagnòstic. Mútua eficiència per a no malbaratar la finestra de context.

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


**Ancoratge de Seguretat:** [[00_index]]

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/07_plantilles/plantilla_iso_sdp.md":"61e084ba54537b4378a6ec87b4446c9d7d1febd3c94daf179e8fe0d6bd73c18e","_wiki_de_poble/01_ser/00_bios.md":"5dbace813b4a86af2002b3ca45a12f11055dd6d664ac6e22585a9af9a1c8de34","_wiki_de_poble/01_ser/02_genotip.md":"980417e92c4c5b305f65db70cfc67108f30608910d97774e2d9d0174fb7f84f1","_wiki_de_poble/02_saber/doc_governanca.md":"5a37a96783fecf1029d95c5735e6bb93d63399195783064e632e53789de04693","_wiki_de_poble/02_saber/doc_logos_oficials.md":"70d4ea7c1a14a5c75a00aaaf2439c3b1910b7f921e1207346f5df5dee81e0861","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"b9c625b798df99c6727c4607f28852697af7a6f3151bd9d70aead959a95a44dd"} -->
