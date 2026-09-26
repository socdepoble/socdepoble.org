---
type: document
status: canonic
description: Sistema de Gestió de Qualitat de Prompts i Petorretes (SGQ-PP), d'on ve el nom, què exigix a cada petorreta i on es resolen les plantilles.
---
# Sistema de Gestió de Qualitat de Prompts i Petorretes (SGQ-PP)

L’SGQ-PP és l’estàndard intern de rigor que complix tota petorreta, auditoria o prompt de Sóc de Poble: context seleccionat i sencer, objectiu clar i zero palla. Substituïx l’antiga etiqueta «ISO», i les plantilles vives les resol `.agents/protocolledge.json`.

## D’on ve el nom (abans, «ISO»)

Antigament s’emprava el terme «ISO» (com a `00_PLANTILLA_PROMPT_ISO.md`). Eixa nomenclatura s’ha substituït pel **Sistema de Gestió de Qualitat de Prompts i Petorretes de Sóc de Poble (SGQ-PP)**. Les plantilles ja no tenen un nom fix que calga recordar: `.agents/protocolledge.json` diu quina correspon a cada ruta. Per als prompts a IAs externes és [[prompt_consell]] (ruta `prompt.consell`) i per a les IAs locals, [[prompt_local]] (ruta `prompt.local`).

## Què garantix

Tota petorreta, auditoria i prompt ha de complir quatre normes:

1. **Context sencer i seleccionat:** les fonts que tria el manifest s’entreguen íntegres, sense resums mutilats, i mai s’aboca tota la Wiki per defecte (llei 1 del [[02_genotip]]).
2. **Absència d’AI slop:** prompts directes, sense afalacs ni estructures buides.
3. **Claredat d’objectiu:** el dictamen i l’objectiu són evidents, sense ambigüitats que el model puga interpretar malament.
4. **Economia de context:** els *bundles* només es fan per a IAs externes; les IAs locals, que lligen el repositori directament, només reben el prompt ([[taxonomia_documental]]).

L’SGQ-PP és, doncs, la base operativa perquè el Trellat s’implemente i s’audite contínuament en qualsevol plantilla interna de Sóc de Poble.

## Vincles

- [[00_index]]
- [[02_genotip]]
- [[prompt_local]]
- [[prompt_consell]]
- [[taxonomia_documental]]
- [[auditoria_canonica]]
