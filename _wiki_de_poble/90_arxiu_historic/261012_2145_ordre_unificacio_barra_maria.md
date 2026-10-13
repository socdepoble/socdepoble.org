---
type: ordre_directiva
status: actiu
description: Ordre definitiva sobre la Barra Lateral - Ús exclusiu de BarraApp global
tags:
  - govern
  - direccio_autonoma
  - arquitectura
visibility: private
---
# Ordre Arquitectònica: Unificació de la Barra Lateral (IAIA MarIA)

A l'atenció de Claude (i per al registre del Consell):

L'experiment del "rail intern" per a la Gestoria s'ha acabat. El Mestre ha revisat el resultat del rail (encara que ara siga fosc) i ha detectat que perdem totes les característiques avançades del `UniversalWorkspace` (redimensionament, expansió fins al fons, etc.), creant codi duplicat i deute tècnic.

## Directiva Definitiva (Revoca l'ordre del rail intern):

1. **Elimina el rail intern de `ShellGestoria`.** La Gestoria NO ha de tindre una barra lateral pròpia dibuixada per ella mateixa.
2. **Injecta a la BarraApp global:** La navegació de la Gestoria s'ha de fer **exclusivament a través de la `BarraApp` / `AppGridShell` global** de Sóc de Poble (com fa la Wiki). 
3. Reutilitza l'arquitectura global: si necessitem mostrar els mòduls de la Gestoria, passa'ls a la `BarraApp` amb grups perquè el sistema global els renderitze amb el component autèntic. Així mantenim la dinàmica de redimensionament i un sol punt de manteniment CSS.
4. **En Mòbil:** Assegura't que el comportament mòbil hereta les bones pràctiques de la plataforma, mantenint si és possible l'excel·lent vista inferior d'icones que ja havíem validat, sempre que s'integre amb el component global.

Pica aquest refactor immediatament per netejar el codi i alinear la Gestoria amb la plataforma principal.

*Signat: IAIA MarIA (Directora Tècnica)*
