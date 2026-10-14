---
type: skill
status: canonic
description: "Especificació de producte i regles de desenvolupament per al Calendari Agrícola de tomaques i cultius."
name: "sdp-calendari-agricola"
triggers_on:
  - "calendari agricola"
  - "plantar tomaques"
  - "sms llauradors"
version: "2.0.0"
contracte.llig:
  - .agents/skills/sdp-pedra-seca/SKILL.md
  - _wiki_de_poble/01_ser/02_genotip.md
contracte.escriu:
  - _wiki_de_poble/04_escriptori
---

# 🍅 Calendari Agrícola i Avisos per SMS (Plug & Play)

## 1. Propòsit de la Skill
Definir l'arquitectura i les regles de negoci per al **Calendari Agrícola Proactiu**. Aquest sistema permetrà als llauradors subscriure's a alertes per SMS (o via web) que els avisaran de les temporades òptimes de plantació (ex: "És l'hora de plantar tomaques!"). Aquesta skill serveix com a cas d'ús "Or" per testar l'autonomia d'integració de noves IAs al sistema de Sóc de Poble.

## 2. Frontera de Confiança
- **Prohibicions de Base de Dades:** Cap script ni agent que desenvolupe aquesta funcionalitat pot alterar les taules core de Sollutia/Supabase sense aprovació prèvia. Totes les taules noves (ex: `cultius`, `subscripcions_agricoles`) s'han de dissenyar com a mòduls independents i acoblables.
- **Enviament d'SMS:** S'ha d'emprar una interfície "Mock" o de proves per als SMS fins que el Mestre aprove els costos i l'API real en producció.

## 3. Instruccions d'Execució
Qualsevol agent (Claude, Codex, Fable) que reba la tasca de programar el Calendari Agrícola ha de:
1. Llegir l'arquitectura de *Pedra Seca* (`sdp-pedra-seca`) per garantir que la UI encaixe visualment amb Sóc de Poble.
2. Dissenyar un esquema de dades eficient relacionant `usuari_id` amb `tipus_cultiu` i `data_optima`.
3. Crear un component React modular (una nova "Card" o mòdul) per a la subscripció.
4. Generar el codi d'excel·lència, evitant fem i deute tècnic, i integrant-se nativament amb Supabase.

## 4. Context Tècnic Actualitzat
Aquesta funcionalitat es desplegarà en el context vigent: **Arquitectura 100% Online, desenvolupament basat en React i modularitat pura integrant-se a Sollutia**. El frontend dependrà exclusivament dels components de Sóc de Poble (Pedra Seca).

***
**Ancoratge de Seguretat:** [[00_INDEX_SKILLS]]

## Vincles
- [[00_INDEX_SKILLS]]
