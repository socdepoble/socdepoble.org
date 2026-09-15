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

Auditoria Visual i Meta-Anàlisi del Sistema de Disseny Pedra Seca (Testing d'al·lucinació)

`OBJECTIU: Reconstruir visualment el sistema de disseny a partir del bundle adjunt en un HTML executable i auditar els "punts cecs" de la nostra documentació.`

## Context Necessari

Bundle aparellat: 260911_1802_BUNDLE_auditoria.md.

La integració actual és purament online i centrada en crear una connexió perfecta per al sistema de la nostra empresa sòcia, Sollutia; la sobirania local és una meta de llarg termini.
Hem actualitzat recentment `DesignSectionContent.jsx` i `index.css`. Volem posar a prova el sistema amb diverses IAs (Claude, Codex, Qwen, Gemini, etc.) per veure si la documentació és prou clara. Recentment, una IA va interpretar els H3 amb tipografia Serif i colors inventats. Si això passa, vol dir que el nostre sistema de disseny està fallant en comunicar les seues regles.

## Instrucció Principal

Has d'analitzar estrictament el codi adjunt en el bundle, prestant especial atenció a `DesignSectionContent.jsx` i `index.css`. A partir d'això, has de complir **dues missions**:

**MISSIÓ 1: Reproducció Visual (Generació de Codi)**
Genera un ÚNIC fitxer HTML autònom (Standalone HTML reproduïble) que mostre la guia visual d'estils i components estructurals (Sistema Pedra Seca).
Posa èmfasi especial en si pots inferir i renderitzar correctament:
1. L'anatomia de la Pàgina Universal (UniversalPage), amb Sidebar i Topbar inclosos.
2. L'escala gràfica d'espaiats i la tipografia (Sans-Serif per defecte, interlineats, marges de paràgrafs).
3. El funcionament i jerarquia de la `UniversalCard`.
4. El sistema d'Alertes i d'Avatars.
*El codi generat serà provat visualment pel Mestre Humà per a extraure bones idees i avaluar la teua precisió.*

**MISSIÓ 2: Meta-Anàlisi de Punts Cecs**
Després de generar el codi, identifica explícitament els "punts cecs" o faltes de claredat en el nostre sistema. Si has tingut dubtes sobre quin color aplicar a un `h3`, sobre quina tipografia usar (Serif vs Sans-Serif), o sobre els marges entre paràgrafs, **digues-ho**. Explica on falla el nostre CSS o JSX a l'hora de donar-te instruccions inèdites i inequívoques. Proposa millores tècniques per blindar la nostra documentació contra al·lucinacions.

`EXECUTA: Genera l'HTML reproduïble i proporciona l'informe de punts cecs per millorar el nostre sistema.`

## Output Esperat

`FORMAT: HTML (Standalone) seguit d'un breu informe en Markdown.`

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
