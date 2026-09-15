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

Auditar el Sistema de Disseny (Pedra Seca) per trobar components orfes i unificar-los.

`OBJECTIU: Crear un sistema de disseny unificat que ho cobrisca tot (taules, llistes, etc.) i eliminar CSS orfe.`

## Context Necessari

Bundle aparellat: 260911_1511_BUNDLE_auditoria.md.

La integració actual és purament online i centrada en crear una connexió perfecta per al sistema de la nostra empresa sòcia, Sollutia; la sobirania local és una meta de llarg termini. Estem intentant crear un sistema de disseny "Pedra Seca" que siga immutable i automàtic. Hem notat que falten molts components per dissenyar (com per exemple les Taules, que s'utilitzen molt a la Gestoria i ara mateix no tenen estil). 

## Instrucció Principal

Analitza tot el codi base inclòs en el bundle (especialment `src/css/index.css`, `src/sections/disseny/` i components de la Gestoria).
1. Identifica tots els components estructurals genèrics (taules, formularis, alertes, modals, llistes) que no estan estandarditzats sota el sistema de disseny.
2. Dissenya classes CSS canòniques (basades purament en els tokens de Pedra Seca: `--sdp-*`) per a aquests components, començant per una taula universal i robusta, prenent com a base les taules de la Gestoria.
3. El propòsit final és que, en crear qualsevol apartat nou al futur, amb l'HTML semàntic n'hi haja prou per tenir-ho dissenyat automàticament, evitant així el CSS mort i fragmentat a l'estil "Tailwind".
4. Rastrea i identifica codi CSS fantasma (regles mortes o redundants) en l'actual `index.css` per a procedir a la seua neteja.
Aquesta és només la fase 1 de 3 auditories contínues per arribar a la perfecció visual de l'App.

`EXECUTA: Analitza el disseny, troba buits, proposa el CSS canònic faltant (especialment per a taules) i detecta CSS fantasma.`

## Output Esperat

`FORMAT: markdown`
Proposa l'auditoria, llista els components orfes detectats, i redacta el bloc CSS canònic complet (només amb tokens SDP) que hem d'integrar per solucionar-ho, començant per les taules.

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
