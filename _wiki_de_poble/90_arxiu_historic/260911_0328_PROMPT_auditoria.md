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

## Objectiu

Crear i normativitzar el disseny de la `ManagerItemCard` per a l'`UniversalManager` complint estrictament amb la Pedra Seca.

`OBJECTIU: Estandarditzar el component ManagerItemCard (vist a la llista del Bloc de Notes i Perfil) amb regles de Pedra Seca pures.`

## Context Necessari

Bundle aparellat: 260911_0328_BUNDLE_auditoria.md.

La integració actual té l'`UniversalManager` que gestiona llistes d'elements (Notes, Perfils, etc.). El disseny de la targeta de llista d'aquests elements (`NotesItemCard` i `PerfilItemCard`) s'ha desestructurat i ara pareix un article. Hem de crear un component base anomenat `ManagerItemCard` per a incrustar-lo ací.

La "Llei de Pedra Seca" per a aquesta targeta específica exigeix:
1. Només disposa d'un H1 i un H2 (sense entradilla, sense body, sense H3).
2. S'ha de complir un màxim de 3 línies en total: l'H1 (títol) pot ocupar un màxim de 2 línies, i l'H2 (subtítol/data) un màxim d'1 línia.
3. A l'esquerra, ha de tindre una foto/imatge quadrada de 96 píxels d'amplada (o 90px si s'ajusta a l'altura de la targeta).
4. Ha de funcionar com a norma i estructura bàsica per a qualsevol element incrustat dins la llista de l'UniversalManager.

## Instrucció Principal

Analitza el codi i dissenya el component `ManagerItemCard.jsx` o les modificacions necessàries a `UniversalCard.jsx`/CSS perquè s'adapte perfectament a la Llei de Pedra Seca descrita dalt i es puga integrar a l'aplicació.

`EXECUTA: Dissenya el component ManagerItemCard que complisca les regles descrites i proporciona el codi per incrustar-lo al projecte.`

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

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/plantilles/PLANTILLA_ISO_SDP.md":"978fc4f0f6141a05786c3a4ad7ea319a58170c0f51078ef235649d1bd24c2835","_wiki_de_poble/01_ser/00_bios.md":"5dbace813b4a86af2002b3ca45a12f11055dd6d664ac6e22585a9af9a1c8de34","_wiki_de_poble/01_ser/02_genotip.md":"980417e92c4c5b305f65db70cfc67108f30608910d97774e2d9d0174fb7f84f1","_wiki_de_poble/02_saber/doc_governanca.md":"5a37a96783fecf1029d95c5735e6bb93d63399195783064e632e53789de04693","_wiki_de_poble/02_saber/doc_logos_oficials.md":"70d4ea7c1a14a5c75a00aaaf2439c3b1910b7f921e1207346f5df5dee81e0861","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"294ee25a85573276c93ed009ae02c0e9ef508fd4d622b3a3af906f28adf0c32f"} -->
