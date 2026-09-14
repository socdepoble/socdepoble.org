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

Realitzar una auditoria profunda i d'enginyeria inversa (destructiva i constructiva) sobre tota la web per trobar forats, patrons solts o estils orfes, amb la finalitat de completar el Sistema de Disseny Pedra Seca i aconseguir un 10 sobre 10. També s'ha de proposar un "menú comú" (botonera) per a la pàgina de `/disseny`.

`OBJECTIU: Assolir un 10 en Pedra Seca i crear un component Menú unificat`

## Context Necessari

Bundle aparellat: 260912_1252_BUNDLE_auditoria.md.

L'usuari (el Mestre) ha detectat que a la pàgina `/disseny` el menú lateral (que conté Fonaments, Estructura, etc.) no utilitza cap component estàndard de botonera. Proposa estudiar l'ús de `PillToggle` (la botonera actual) per a fer de menú, o bé proposar una opció millor de botons que unifique aquest comportament. L'objectiu és eliminar components no estàndards i tapar tots els forats visuals de l'aplicació.

La integració actual és purament online i centrada en crear una connexió perfecta per al sistema de la nostra empresa sòcia, Sollutia; la sobirania local és una meta de llarg termini.

## Instrucció Principal

1. **Investiga tota la web sencera** mitjançant el Bundle i fes arquitectura inversa. Busca allà on hi hagen coses soltes, components a mitges, o manca d'estandardització visual.
2. **Dissenya un Menú Comú**: Avalua l'ús de `PillToggle` per al menú lateral de `/disseny` i altres possibles menús semblants de l'app. Si encaixa, dóna'm la implementació. Si no, crea un component `Menu` / `Botonera` que puguem reutilitzar i que compartisca disseny amb la resta de l'app.
3. **Fixar/Desfixar Mapa (Pàgina Mur)**: A la pàgina `/mur`, el component `PillToggle` té un botó taronja anomenat "Desfixar" per a controlar el mapa. Investiga si hi ha alguna opció o component millor per a aquesta funcionalitat. Si decidim mantenir-ho tal com està (ja que actualment li val a l'usuari), plasma i documenta oficialment aquesta variació (estat actiu taronja / perill o excepció) al sistema de disseny.
4. **Pla d'Acció Cap al 10**: Dóna'm tots els detalls, codi necessari i components que calen per tancar el sistema de disseny i deixar-lo perfecte.

`EXECUTA: Analitza el bundle, defineix el Menú comú i llista els forats del sistema de disseny per assolir l'excel·lència`

## Output Esperat

Un dictamen complet en Markdown que continga l'auditoria, les correccions estructurals necessàries i el codi del component de menú/botonera. No facis resums superficials, aporta el codi i l'arquitectura concreta.

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

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/plantilles/PLANTILLA_ISO_SDP.md":"978fc4f0f6141a05786c3a4ad7ea319a58170c0f51078ef235649d1bd24c2835","_wiki_de_poble/01_ser/00_bios.md":"5dbace813b4a86af2002b3ca45a12f11055dd6d664ac6e22585a9af9a1c8de34","_wiki_de_poble/01_ser/02_genotip.md":"980417e92c4c5b305f65db70cfc67108f30608910d97774e2d9d0174fb7f84f1","_wiki_de_poble/02_saber/doc_governanca.md":"5a37a96783fecf1029d95c5735e6bb93d63399195783064e632e53789de04693","_wiki_de_poble/02_saber/doc_logos_oficials.md":"f3e03b4c5358e45b532d371c931d6542bb6e3f16e149dc1bd4811ff975175848","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"294ee25a85573276c93ed009ae02c0e9ef508fd4d622b3a3af906f28adf0c32f"} -->
