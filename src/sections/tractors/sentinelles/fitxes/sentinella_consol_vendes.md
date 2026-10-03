# Sentinella «Cònsol de Vendes»

**Identificador:** `sentinella.consol-vendes` · **Versió:** 1.0.0 · **Nivell:** L0 · **Dades personals:** no · **Xarxa:** cap

## Què fa, en una frase

Llig els tancaments de torn que exporta el TPV i et fa un report en text: on es guanya, on es perd i quines vendes són atípiques.

## Disparador

- **En obrir el Tauler d'Inici**, amb els tancaments exportats (`sdp.bar.tancament.v1`). El TPV no es connecta amb el sentinella: el pont és el fitxer que tries.

## Què llig

- Un o diversos tancaments de torn: vendes per mètode de pagament, per categoria i per producte, amb el cost que diuen els escandalls.
- El darrer tancament és el que s'analitza; els anteriors fan d'historial.

## Què assenyala

- **Bandera roja:** un producte venut per davall del cost.
- **Bandera groga:** un marge per davall del 30 %, massa descomptes, invitacions, anul·lacions i devolucions (més del 5 % del venut), unes vendes que s'aparten més d'un 40 % de la mediana dels torns anteriors, o un producte habitual que hui no s'ha venut.
- **Informació:** productes sense escandall i vendes disparades d'un producte.

## Què escriu

- Res. El report es mostra a la pantalla.

## Porta humana

El sentinella proposa on actuar. Canviar preus, carta o escandalls ho decidixes i ho fas tu al TPV.

## Límits honestos

- Les vendes atípiques necessiten almenys tres torns anteriors.
- Sense escandall, no se sap si un producte guanya o perd.

## L'aprovació

No tracta dades personals: s'aprova amb la confirmació escrita de l'empremta curta (o amb la signatura). Qualsevol canvi en el codi, en el manifest o en esta fitxa invalida l'aprovació. Caduca als 90 dies.
