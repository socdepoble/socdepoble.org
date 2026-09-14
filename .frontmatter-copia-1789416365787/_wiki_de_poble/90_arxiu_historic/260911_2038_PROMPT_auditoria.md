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

Bundle aparellat: 260911_2038_BUNDLE_auditoria.md.

La integració actual és purament online i centrada en crear una connexió perfecta per al sistema de la nostra empresa sòcia, Sollutia; la sobirania local és una meta de llarg termini.

## Instrucció Principal

Aquesta és una **Auditoria Destructiva/Constructiva centrada en l'Arquitectura del Perfil i la Tolerància a Fallades**. Has de generar els *patches* o el codi complet per a executar aquestes 3 missions:

1. **Reconstrucció del Perfil (Clonar l'èxit de Notes):** Agafa tot allò que funciona perfectament a `NotesSection.jsx` i `NotesContext.jsx` (arquitectura, aïllament, gestió via `UniversalManager`) i clona eixa mateixa lògica, estabilitat i disseny sobre `PerfilShell.jsx` i `PerfilContext.jsx`. El mòdul Perfil ara mateix està "en blanc" i empra un esquema vell i trencat de `UniversalManager`.
2. **Aplicació Radical de Pedra Seca:** Esborra qualsevol rastre de Tailwind o classes CSS dels 90 que quede al Perfil (ex: `w-full`, `flex`, `bg-gray-100`). Injecta exclusivament els nous components canònics del catàleg de disseny (`Boto`, `Alerta`, `UniversalCard`, etc.) definits en `UniversalElements` i CSS central.
3. **Validació d'Aïllament (Fail-closed):** Aplica la Llei de la Frontissa L6. Ara mateix el backend llança un 404 al buscar els fils de xat (`xat_fils_meus`) i trenca coses. Protegeix tot l'entorn de l'usuari amb *Error Boundaries* i *Try/Catch* forts en els fetch de dades. Si falla la càrrega de dades externes, la interfície ha d'absorbir l'error (degradació suau) i mostrar un estat buit ("Zero data") elegant en lloc d'imprimir errors massius i roigs a la consola i deixar la pantalla en blanc.

`EXECUTA: Genera un patch de codi complet o els fitxers complets per substituir l'actual PerfilShell.jsx i PerfilContext.jsx, implementant UniversalManager i Fail-Closed sense Tailwind.`

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
