---
type: skill
status: actiu
name: core-tecniques-investigacio
description: Tractor que defineix com les IAs (locals o externes) han d'investigar els problemes, verificant el codi real dels tractors en lloc de conformar-se amb llegir la teoria de les regles.
tags:
  - core
  - auditoria
  - tractors
triggers_on:
  - autòpsia
  - tècniques d'investigació
  - investigar el codi
  - cacera de bugs
---

# Tècniques d'Investigació i Autòpsia

Aquesta habilitat defineix l'estàndard d'auditoria i cacera de bugs per a totes les IAs del Mas (siguen locals com Fable/Claude/Codex o externes). 

## La Llei del Codi i la Teoria
Quan hi ha un error o una discrepància (com ara un tractor que falla constantment o una neteja que no s'executa com toca), el problema quasi mai està en el que diu la teoria, sinó en el que el codi permet fer. 

**Procediment d'Investigació Obligatori:**

1. **Llegir la Teoria:** Revisa l'`AGENTS.md`, la `taxonomia_documental.md` o la Skill corresponent per entendre el flux funcional previst. Entén què s'hauria de fer en teoria.
2. **Llegir la Pràctica (El Codi Real):** Això és innegociable. No et pots aturar al pas 1. Has d'obrir el tractor de codi (l'script `.mjs`, `.js`, el hook, etc.) encarregat d'executar i fer complir eixa teoria en el repositori.
3. **Validació d'Engranatges:** Analitza el codi buscant excepcions ocultes, restriccions d'extensions (ex: l'eina només accepta `.md`), bloquejos per defecte, regles RegExp esbiaixades o dependències asimètriques. Verifica que cada tractor fa efectivament el que la teoria diu i no introdueix exclusions indesitjades.
4. **Sentència i Solució:** Identifica el bloqueig exacte a nivell de codi, demostra-ho citant els números de línia, i proposa la solució tècnica estructural que calca la realitat a la teoria (o redissenya la teoria si aquesta és mecànicament inviable).

Aquesta tècnica és l'antídot contra l'estancament: evita que el sistema caiga en la frustració d'intentar complir una regla humana (teòrica) que està bloquejada per una regla de màquina (codi).
