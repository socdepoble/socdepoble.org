---
type: document
status: esborrany
description: Especificacions de disseny d'alta densitat per a les barres de l'editor.
tags:
  - disseny
---

# Especificacions de Disseny: Barres de l'Editor

Aquest document registra les regles de disseny i distribució (per a assolir un acabat d'alta densitat) que s'aplicaran a la interfície del Bloc de Notes una vegada s'assegure l'estabilitat estructural de la plataforma.

## 1. Barra Blava (Eines de l'Editor)

La barra s'organitza en tres zones estratègiques:

- **Grup Esquerra:** Fletxa arrere, Fletxa avant, Índex de continguts.
- **Grup Centre:** Traductor, Comentaris, Compartir.
- **Grup Dreta:** Botó "Connectar/Publicar".

**Regles d'espaiat i densitat:**
- L'espaiat entre icones dins del mateix grup ha de ser **zero** (`gap: 0`). El disseny de les fletxes divergents i l'ús intel·ligent de l'espai propi de cada SVG ja aporta aire suficient.
- El **Grup Centre** ha d'estar perfectament centrat de forma asoluta o calculada respecte als altres dos grups.

**Comportament responsiu:**
- **Pantalles intermèdies:** Quan falte espai, es reduirà el `padding` o la mida del contenidor de les icones, mantenint la separació a 0.
- **Pantalles crítiques (mòbil):** El botó d'acció principal ("Connectar" / "Publicar") perdrà la paraula i es convertirà en un botó completament redó amb el símbol `+`, conservant el color corporatiu.

## 2. Barra Taronja (Informació de Publicació)

Distribució clàssica i funcional de les metadades de l'autoria:

- **Zona Esquerra:**
  - Avatar de l'usuari.
  - Nom del publicador/a.
  - Poble d'origen (ex: La Torre de les Maçanes).
- **Zona Dreta:**
  - Icona de Rellotge.
  - Hora i Data de publicació o edició.

---
*Nota: Aquestes pautes serviran com a lleis base per a les futures auditories de disseny quan busquem el refinament absolut.*
