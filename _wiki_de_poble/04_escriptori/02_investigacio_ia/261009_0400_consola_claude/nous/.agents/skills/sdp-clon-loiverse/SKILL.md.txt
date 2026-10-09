---
type: skill
status: actiu
name: sdp-clon-loiverse
description: Directriu arquitectònica i visual obligatòria per a desenvolupar el TPV (Mode Bar i Mode Rebost). Cal calcar la interfície de Loiverse al mil·límetre.
triggers_on:
  - loiverse
  - punt de venda
  - mode bar
  - mode rebost
  - llista de la compra
---

# Clonació Visual de Loiverse (El TPV Universal)

Aquesta skill defineix l'estàndard visual i arquitectònic per a qualsevol interfície relacionada amb productes, venda, o inventari (ex: Bar de la Parròquia, Llista de la Compra, Rebost).

## 1. Calcar al mil·límetre
La instrucció del Mestre és innegociable: **La interfície ha de ser un clon exacte de Loiverse.**
S'han d'estudiar les captures de pantalla proporcionades pel Mestre (disponibles a `01_produccio` o pujades al xat) i calcar la disposició:
- **Espai optimitzat:** Es veu més que es llig. L'optimització de l'espai en pantalla és fonamental.
- **Predomini de la imatge:** Cada producte ha de tindre la seua imatge ben visible en una graella clara i clicable.
- **Sidebar fosc i àrea de tiquets:** S'ha de respectar la barra lateral fosca de navegació i l'àrea blanca de "Tiquets oberts" / "Comanda" a l'esquerra de la graella de productes.

## 2. Reutilització Modular (Un sol component)
Tot i que els casos d'ús siguen diferents (un TPV de bar on es cobra, o una llista de la compra on s'afigen productes per a comprar), **la interfície gràfica serà la mateixa**.
S'utilitzarà el component "TPV Loiverse" com a patró de disseny base, canviant només la lògica dels botons segons el domini (ex: `Afegir a la cistella` vs `Cobrar`).

## 3. Filosofia de les Imatges i la Nano Banana
Per al sistema en producció pública, no es poden utilitzar les imatges "robades" d'internet (amb drets d'autor) que hi ha al Loiverse original de la Parròquia.
L'Estratègia és:
1. Treballar el TPV en mode **privat** darrere de l'autenticació del Mestre (Javi/Sóc de Poble).
2. La "Nano Banana" (o una IA equivalent) haurà de recrear cadascuna de les imatges del Loiverse original per a generar imatges pròpies, lliures de drets i estèticament coherents, perquè l'app puga ser pública.
3. Els noms dels productes comercials (ex: Danone, Pa torrat Hacendado) sí que es mantenen exactes (ús nominatiu), només es canvien els logotips per icones genèriques nostres.

## Obligació de l'Agent
Qualsevol agent assignat a crear el mòdul de "Menjar i Beure", "Rebost" o "Llista de la Compra" ha de llegir obligatòriament aquesta skill i aplicar-la per a dissenyar el frontend en React. No inventes una UI nova; copia Loiverse.
