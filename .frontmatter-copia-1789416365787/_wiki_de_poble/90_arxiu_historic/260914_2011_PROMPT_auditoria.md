---
tipus: petorreta
estat: esborrany
description: "Auditoria tècnica del paquet auditoria"
---
# 🛡️ PETORRETA AL CONSELL: AUDITORIA FINAL DE SEGURETAT I ENXUFABILITAT (10/10)

## Objectiu

**Auditoria tècnica agressiva ("Red Team") de la connexió amb Sollutia i la seguretat global.**

Demà tenim la reunió crítica d'integració amb Sollutia. El sistema ha de ser **infranquejable** i la injecció de l'API (Enxufabilitat) ha de funcionar amb una tolerància perfecta. Aquesta és la segona ronda d'auditoria després d'haver aplicat totes les correccions anteriors. Necessitem que ens rebenteu l'arquitectura per tots els costats fins que no hi quede ni un sol forat, per poder tindre un 10/10 demà.

## Context Necessari

Bundle aparellat: `260914_2011_BUNDLE_auditoria.md`.

Hem implementat:
1. Tolerància a `host.js` (Injecció parcial de backend amb fallback a Supabase).
2. Protecció contra SSRF a `sanitize.js`.
3. Tancament del relé OAuth (verificació de `state`, neteja d'orígens, propagació correcta en popups i redireccions a `oauthRelay.js` i `callback.html`).
4. Enduriment de les polítiques RLS i supressió d'exposicions de `tenant_id` (Spoofing) a `handle_new_user()`.

## Instrucció Principal

**EXECUTA:** Analitza el codi adjunt a fons. Destrueix les nostres solucions. Busca qualsevol escletxa en l'enxufabilitat (`host.js`) que puga fer fallar la càrrega des de Sollutia. Busca qualsevol vulnerabilitat residual en el flux d'autenticació o RLS. Si el sistema és segur, dóna'ns un 10/10 i explica per què. Si trobes forats, proposa correccions mínimes verificables. No faces suposicions, basa't exclusivament en el codi del bundle.

## Output Esperat

`FORMAT: markdown`

## Bloc Fixe d’Identitat

**Qui Som (La Nostra Història):** Som l'Associació ecologista El Rentonar i Sóc de Poble. Aquest projecte és l'hereu de més de 30 anys d'activisme rural i lluita pel nostre entorn natural i patrimonial. El nostre llegat i identitat digital resideixen històricament en `rentonar.blogspot.com`, van evolucionar a l'antiga plataforma fundacional `socdepoble.net`, i avui es materialitzen construint `socdepoble.org` (el Mas).

**Filosofia:** [[el_projecte|Sóc de Poble]] és actualment una aplicació web connectada (Online-First / React SPA + Supabase BaaS). Tot i que l'aspiració a llarg termini és la sobirania tecnològica rural (amb arquitectures descentralitzades), avui dia depenem d'un backend centralitzat (Supabase PostgreSQL + GoTrue Auth + RLS) i requereix connexió constant. NO utilitzes patrons 'Local-First' ni 'Offline-First' que enfosquisquen aquesta realitat, ja que confonen el Consell d'IAs. La IAIA MarIA actua amb Trellat, mínima intervenció, el Baseline 2022 com a jutge i respecte absolut per la llengua, la memòria i la gent major.

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

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/plantilles/plantilla_iso_sdp.md":"978fc4f0f6141a05786c3a4ad7ea319a58170c0f51078ef235649d1bd24c2835","_wiki_de_poble/01_ser/00_bios.md":"5dbace813b4a86af2002b3ca45a12f11055dd6d664ac6e22585a9af9a1c8de34","_wiki_de_poble/01_ser/02_genotip.md":"980417e92c4c5b305f65db70cfc67108f30608910d97774e2d9d0174fb7f84f1","_wiki_de_poble/02_saber/doc_governanca.md":"5a37a96783fecf1029d95c5735e6bb93d63399195783064e632e53789de04693","_wiki_de_poble/02_saber/doc_logos_oficials.md":"70d4ea7c1a14a5c75a00aaaf2439c3b1910b7f921e1207346f5df5dee81e0861","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"294ee25a85573276c93ed009ae02c0e9ef508fd4d622b3a3af906f28adf0c32f"} -->
