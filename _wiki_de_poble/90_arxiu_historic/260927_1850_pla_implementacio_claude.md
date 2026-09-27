---
type: planificacio
status: esborrany
description: "Pla per corregir l'alineació CSS de ClosCaXat i AppGridShell"
tags: [govern]
---

# Pla d'Implementació: Correcció de la graella de ClosCaXat

## Objectiu
Aconseguir una graella "ben quadrada" per a la barra lateral del Xat (el menú principal tipus WhatsApp). S'ha d'eliminar qualsevol escletxa o marge asimètric perquè "Xat i Control facen pinya", seguint un comportament rígid i unificat com el d'un full de càlcul.

## Tasques (T1-T4)

- **T1: Revisió de Marges a ClosCaXat.css / .jsx:**
  Analitzar l'espaiat (paddings, margins i gaps) als ítems de la barra lateral.
- **T2: Quadratura i Pinya:**
  Alinear correctament la icona de la roda dentada (Configuració) amb la resta de botons. Assegurar que els botons comparteixen exactament les mateixes mides.
- **T3: Estabilització AppGridShell:**
  Comprovar que al obrir el panell "Novetats" no es produeixen desquadraments globals en la jerarquia de l'AppGridShell.
- **T4: Estilització de ConnectarSection (Refactorització UI):**
  La plana `ConnectarSection.jsx` té ara l'estructura correcta però utilitza un fitxer CSS customitzat i no usa `<UniversalPage>`. S'ha d'esborrar `ConnectarSection.css` i refactoritzar `ConnectarSection.jsx` per utilitzar només `<UniversalPage>` i les classes d'utilitat del sistema Pedra Seca (ex. `sdp-panel`, `poble-badge`), aconseguint exactament el mateix disseny de la V2 que tenim a producció.

## Riscos previstos
- Si toquem selectors genèrics de `AppGridShell.css` podríem desquadrar altres mòduls de Sóc de Poble.
- *Solució:* Confinar els ajustaments al component `ClosCaXat` i la seva capa d'estils locals.

## Vincles
- [[00_index_escriptori]]
