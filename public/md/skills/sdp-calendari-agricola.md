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
  - src/sections/calendari/CalendariSection.jsx
  - src/sections/calendari/fonts/contracteFonts.js
  - src/data/backendPort.js
  - .agents/skills/sdp-pedra-seca/SKILL.md
  - _wiki_de_poble/01_ser/02_genotip.md
contracte.escriu:
  - _wiki_de_poble/04_escriptori
---
# Calendari agrícola i avisos per SMS

Esta és una especificació de producte per a subscripcions de cultius i dates de plantació. El mòdul agrícola i l'enviament d'SMS no queden acreditats com a implementats perquè existisca esta skill.

## Reutilitzar el calendari real

Llig primer `src/sections/calendari/CalendariSection.jsx` i el contracte de fonts de `src/sections/calendari/fonts/contracteFonts.js`. Integra el nou cas amb el calendari existent i els components de Pedra Seca; no inventes una nova Card o una segona navegació abans de comprovar què resolen les peces actuals.

Proposa el model de cultiu, zona, data òptima i subscripció amb procedència i límits de les dades agrícoles. Una data de plantació no és universal: no inventes recomanacions sense una font adequada al lloc i al cultiu.

## Dades i confiança

- Sollutia és l'amfitrió de lectura GET de la Frontissa, no el lloc on crear o escriure taules.
- Supabase és el backend propi vigent; qualsevol canvi autoritzat va pel port neutral `src/data/backendPort.js`, una migració revisada i permisos/RLS mínims. No alteres taules core fora de l'encàrrec.
- Els avisos d'SMS es desenvolupen amb un proveïdor simulat. Activar una API real, gastar crèdits o enviar missatges requerix l'autorització corresponent del Mestre i la subscripció del destinatari; cap ordre de generar codi activa eixos enviaments.

## Acceptació

Prova la conversió de dates, la zona horària, la baixa de subscripció i la denegació entre usuaris amb fonts simulades. Declara què és proposta i què s'ha verificat al producte. Les suites actuals de calendari cobrixen el calendari i les seues fonts; no certifiquen el futur sistema agrícola ni el lliurament d'SMS.

## Vincles

- [[00_INDEX_SKILLS]]
- [[sdp-pedra-seca/SKILL]]
- [[core-seguretat-audit/SKILL]]
