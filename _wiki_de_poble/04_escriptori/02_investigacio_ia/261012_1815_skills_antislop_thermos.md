---
type: document
status: esborrany
description: "Pla d'integració de les habilitats Anti-slop i Thermos al workflow de Sóc de Poble"
tags: [arquitectura, skills, anti-slop, thermos]
visibility: private
---

# Integració de "Anti-slop" i "Thermos" al Model Sóc de Poble

A partir de la intel·ligència recollida, adaptarem els dos conceptes presentats al vídeo a la nostra arquitectura de la Masia i l'Olivera. No copiarem les eines, sinó que n'absorbirem la filosofia.

## 1. Anti-slop (La Porta del Trellat)
**Concepte original:** Regles automàtiques que bloquegen patrons de codi brossa en JS/TS abans d'acceptar canvis.
**La nostra adaptació:**
- Crearem una nova porta al nostre sistema de *tooling*: `porta-antislop.mjs`.
- **Funció:** S'executarà automàticament durant la fase de tancament (`tancament.mjs`). Analitzarà el codi modificat buscant patrons típics de mandra de la IA (codi genèric, comentaris inútils tipus `// add your code here`, funcions monolítiques sense sentit, o pèrdua de l'idioma valencià en el codi).
- Si la IA genera *slop*, la porta no s'obri i l'agent està obligat a refer-ho abans de poder tancar el torn.

## 2. Thermos (L'Esquadró de Manteniment)
**Concepte original:** Coordinació d'agents per buscar codi duplicat, fitxers massa grans i problemes de mantenibilitat per donar-li criteris concrets a Claude.
**La nostra adaptació:**
- Formalitzarem un nou *Gauntlet* (com el que estem fent per a la Finestreta) però enfocat exclusivament a la Salut del Codi (Code Health).
- Crearem la skill `.agents/skills/core-thermos-manteniment/SKILL.md`.
- **Funció:** En lloc de demanar-li a Claude "revisa això", cridarem al *Workflow Thermos*. Aquest llançarà tres subagents especialitzats:
  1. **Lent de Duplicitat:** Busca patrons lògics repetits que haurien de ser components purs.
  2. **Lent d'Hipertròfia:** Detecta fitxers que han crescut massa i necessiten divisió.
  3. **Lent de Seguretat/Rendiment:** Busca problemes d'optimització (ex. *renders* innecessaris en React).
- El resultat serà un informe precís que passarem a Opus/Codex perquè execute la refactorització amb criteris estrictes.

## Següents Passos
1. Redactar el codi de `porta-antislop.mjs` i afegir-lo al *hook* de pre-commit i al tancament.
2. Crear la Skill `core-thermos-manteniment` com a procediment estàndard per a les auditories mensuals de la base de codi.
