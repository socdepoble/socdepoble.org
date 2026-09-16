---
estat: "canonic"
tipus: "document"
description: "TASQUES ESTANDARDITZACIÓ UI"
tags:
  - "arquitectura"
  - "disseny"
---
\n# Deute Tècnic de Disseny i Estandardització (UI)

Aquest document recull les observacions i tasques pendents per unificar i millorar la coherència visual de Sóc de Poble (alineat amb l'arquitectura de Pedra Seca).

## Targetes (Cards)
L'objectiu principal és universalitzar el codi de les targetes (per exemple, les del Panell de Control i les d'Onboarding) perquè comparteixin la mateixa estructura i comportament.

### Comportament dels Títols (H3/H2)
- **Amb Icona**: Si una targeta conté un títol amb icona al costat, la millor pràctica visual és alinear-lo a l'esquerra.
- **Sense Icona (Estil UniversalCard)**: Si el títol no porta icona, el comportament per defecte ha de ser text centrat.
- *Decisió pendent*: Valorar si cal eliminar les icones dels títols a l'Onboarding per mantenir-ho tot centrat i coherent amb el comportament de la `UniversalCard`, o bé aplicar la regla d'alineació a l'esquerra quan hi haja icona.

### Targetes d'Acció vs Targetes Informatives
- S'ha d'estudiar la possibilitat d'utilitzar l'estètica de la targeta d'onboarding (amb la franja decorativa superior taronja i un botó d'acció clar) per a elements que conviden al clic, com ara els accessos directes del Panell de Control. Aquest disseny convida molt més a la interacció ("és més *pinchable*").
- Aquest exercici requerirà abstreure la `onboarding-card` i potser unificar-la amb la `UniversalCard` o crear una variant específica per a les "Targetes de Navegació/Acció".

## Propers Passos
- Revisar totes les instàncies on es creen targetes manualment.
- Actualitzar `src/components/ui/UniversalCard.jsx` (o crear un nou component) per acceptar variants (`variant="action" | "info" | "onboarding"`).
- Aplicar la mateixa lògica CSS a les alineacions dels títols.
