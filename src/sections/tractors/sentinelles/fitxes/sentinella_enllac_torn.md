# Sentinella «Enllaç del Torn»

**Identificador:** `sentinella.enllac-torn` · **Versió:** 1.0.0 · **Nivell:** L0 · **Revisió Humana:** Pendent · **Dades personals:** sí · **Xarxa:** cap

## Què fa, en una frase

Quan es tanca un torn al TPV, llig la nota de traspàs i et diu què ha de saber el torn següent: comandes obertes, diferència de caixa, incidències, reposició i si la nota encara no s'ha llegit.

## Disparador

- **En tancar un torn al TPV**, amb la nota de traspàs exportada (`sdp.bar.traspas.v1`). Pots afegir-hi el tancament del mateix torn (`sdp.bar.tancament.v1`) per a comprovar que la caixa diu el mateix als dos llocs.

## Què llig

- La nota de traspàs que tries i, si vols, el tancament del mateix torn.

## Què assenyala

- **Bandera roja:** no hi ha nota, la nota no té la forma acordada, la caixa no quadra en 20 € o més, o el fons deixat és negatiu.
- **Bandera groga:** la nota no s'ha llegit, hi ha comandes obertes, la caixa no quadra per poc, hi ha anul·lacions, devolucions o invitacions, no s'ha deixat fons, o el tancament i la nota no coincidixen.
- **Informació:** productes per reposar, els avisos que deixa el torn i una nota de fa més de 24 hores.

## Què escriu

- Res. La nota per al torn següent es mostra a la pantalla.

## Porta humana

Assenyala el que cal mirar. Cobrar, tancar comandes o quadrar la caixa ho fa la persona del torn següent.

## L'aprovació

La nota porta el nom de qui tanca i de qui llig: es tracta com a dades personals i s'aprova amb la signatura de Touch ID o d'una clau de pas. Caduca als 90 dies.
