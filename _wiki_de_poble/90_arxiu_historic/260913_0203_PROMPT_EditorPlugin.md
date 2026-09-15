---
tipus: petorreta
estat: esborrany
description: Auditoria arquitectònica del UniversalEditorShell com a plugin
---
# 🛡️ PETORRETA AL CONSELL: AUDITORIA DE L'EDITOR INCRUSTAT (UniversalEditorShell)

## Context Necessari

Bundle aparellat: `260913_0203_BUNDLE_EditorPlugin.md`.

El mestre (l'usuari) vol una auditoria profunda sobre el component `UniversalEditorShell` (i com s'integra en `NotesEditor.jsx`, `DetallAjust.jsx`, etc.). Aquest component és el nucli on l'usuari edita i crea contingut (el "Bloc de Notes"). 

La visió del mestre és que açò hauria de ser pràcticament un **plugin autònom** incrustat dins la pàgina web. Ha de ser capaç de millorar en el futur de forma independent, sense tombar tot el sistema (la placa base). Actualment s'empra tant per al Bloc de Notes com per a l'edició del Perfil d'usuari, unificant l'arquitectura de creació de contingut.

## Objectiu

Auditar l'arquitectura del `UniversalEditorShell` com a "plugin" d'edició. S'ha d'avaluar la seua modularitat, robustesa i facilitat d'evolució sense comprometre la resta de l'aplicació.

## Instrucció Principal

Analitza el codi del bundle (especialment `UniversalEditorShell.jsx`, i el seu ús) i respon a aquestes qüestions:
1. **Desacoblament:** És realment un component aïllat (plugin)? Té dependències tòxiques amb la "placa base" (Router, Autenticació forçada, Contextos globals innecessaris)?
2. **Robustesa:** Si en el futur introduïm canvis radicals en aquest editor (ex: afegir modes de bloc, canviar el motor TipTap per un altre), es trencaria el sistema sencer?
3. **Propostes de Millora:** Quins xicotets canvis arquitectònics faries ARA MATEIX per assegurar que siga un vertader "plugin" independent, blindat contra fallades sistèmiques?

`EXECUTA: Analitza l'arquitectura de l'editor, identifica punts d'acoblament perillosos i proposa millores per convertir-lo en un plugin blindat.`

## Output Esperat

`FORMAT: markdown`
Dona respostes directes, sense lliçons bàsiques de React, i sigues molt crític amb el nivell d'acoblament actual.

## Bloc Fixe d’Identitat

**Qui Som (La Nostra Història):** Som l'Associació ecologista El Rentonar i Sóc de Poble. Aquest projecte és l'hereu de més de 30 anys d'activisme rural i lluita pel nostre entorn natural i patrimonial. El nostre llegat i identitat digital resideixen històricament en `rentonar.blogspot.com`, van evolucionar a l'antiga plataforma fundacional `socdepoble.net`, i avui es materialitzen construint `socdepoble.org` (el Mas).

**Filosofia:** [[el_projecte|Sóc de Poble]] és actualment una aplicació web connectada (Online-First / React SPA + Supabase BaaS). NO utilitzes patrons 'Online-First' ni 'Online-First' que enfosquisquen aquesta realitat, ja que confonen el Consell d'IAs. La IAIA MarIA actua amb Trellat, mínima intervenció, el Baseline 2022 com a jutge i respecte absolut per la llengua, la memòria i la gent major.

---

## Tancament Obligatori

- No yapping.
- No dependències supèrflues.
- No Tailwind al Core.
- No tocar dades personals sense base legal.
- Si hi ha risc de destrucció, activa SDP-LOCK.
- PROHIBICIÓ ESTRICTA DE CERCA WEB: Ets en un entorn aïllat (air-gapped). Tota la informació està en el bundle adjunt. Llig-lo i no el busques fora.
