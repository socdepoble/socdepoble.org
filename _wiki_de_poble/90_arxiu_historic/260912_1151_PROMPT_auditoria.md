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

Desenvolupar un sistema de disseny complet basat en el nostre actual (Pedra Seca).

`OBJECTIU: Analitzar l'estat actual del nostre sistema de disseny Pedra Seca (adjunt al Bundle) i ajudar-nos a completar tot el que ens falta per a tindre un sistema de disseny sencer i robust.`

## Context Necessari

Bundle aparellat: 260912_1151_BUNDLE_auditoria.md.

La integració actual és purament online i centrada en crear una connexió perfecta per al sistema de la nostra empresa sòcia, Sollutia; la sobirania local és una meta de llarg termini.

## Instrucció Principal

Revisa la documentació, els tokens CSS i els components actuals de Pedra Seca inclosos al Bundle. A banda de proposar tots els elements que falten per a completar el sistema de disseny (alertes, modals, etc.), posa especial èmfasi en el següent:

1. **Netejar Fantasmes a la Pàgina Base (`src/sections/disseny/DesignSection.jsx` i `DesignSectionContent.jsx` o on corresponga a la ruta `/disseny`):** Aquesta pàgina és la base de tot el nostre sistema de disseny i d'on s'agafa la referència. Ha d'estar **impecable**. Audita-la a fons i elimina els "fantasmes" de sessions anteriors (divs inútils o estils morts) que estan trencant la maquetació (com l'spinner que no està centrat). Volem una base completament neta per no embrutar les futures pàgines i que els nous artefactes es pinten correctament sense interferències.
2. **Definir la Top Bar i Sidebar:** S'ha de pintar i definir estructuralment la barra negra superior (Top Bar) i la Sidebar.
3. **Marge del Logotip:** Defineix amb precisió la separació exacta i els marges que hi ha entre el logotip de "Sóc de Poble" i el `div` que el conté. S'ha de fer bé perquè qualsevol IA siga capaç de reproduir-ho al mil·límetre i quede corroborat al sistema de disseny.

`EXECUTA: Auditar i netejar els estils morts de la UniversalPage, definir l'espaiat exacte del logotip, la Top Bar i Sidebar, i generar el codi de tots els elements restants del sistema de disseny Pedra Seca.`

## Output Esperat

`FORMAT: markdown`

## Bloc Fixe d’Identitat

**Qui Som (La Nostra Història):** Som l'Associació ecologista El Rentonar i Sóc de Poble. Aquest projecte és l'hereu de més de 30 anys d'activisme rural i lluita pel nostre entorn natural i patrimonial. El nostre llegat i identitat digital resideixen històricament en `rentonar.blogspot.com`, van evolucionar a l'antiga plataforma fundacional `socdepoble.net`, i avui es materialitzen construint `socdepoble.org` (el Mas).

**Filosofia:** [[el_projecte|Sóc de Poble]] és actualment una aplicació web connectada (Online-First / React SPA + Supabase BaaS). Tot i que l'aspiració a llarg termini és la sobirania tecnològica rural (amb arquitectures descentralitzades), avui dia depenem d'un backend centralitzat (Supabase PostgreSQL + GoTrue Auth + RLS) i requereix connexió constant. NO utilitzes patrons 'Online-First' ni 'Online-First' que enfosquisquen aquesta realitat, ja que confonen el Consell d'IAs. La IAIA MarIA actua amb Trellat, mínima intervenció, el Baseline 2022 com a jutge i respecte absolut per la llengua, la memòria i la gent major.

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
