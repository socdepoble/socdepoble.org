# Sentinella «Detectiu del Poble»

**Identificador:** `sentinella.detectiu-poble` · **Versió:** 1.0.0 · **Nivell:** L0 · **Revisió Humana:** Pendent · **Dades personals:** sí · **Xarxa:** cap

## Què fa, en una frase

Llig els missatges de la bústia i de la Pàgina Universal que tries, amaga les dades personals i et diu quins punts de dolor es repetixen al poble.

## Disparador

- **En obrir el Tauler d'Inici**, amb els missatges exportats de la bústia i de la Pàgina Universal.

## Com treballa

1. **Amaga les dades personals abans de comptar res:** correus, telèfons, DNI, NIE i IBAN es canvien per una marca.
2. **Compta per missatge, no per paraula:** una queixa que diu tres vegades «fanal» compta una.
3. **Busca temes coneguts** per paraules clau en valencià i en castellà: aigua, enllumenat, fems, carrers, transport, salut, internet, soroll, animals, neteja i aparcament.
4. **Avisa dels que es repetixen:** groga a partir de 3 missatges; roja si en són 5 o més i passen d'una quarta part del total.
5. Afig les paraules que es repetixen fora dels temes, sense comptar mai els noms propis: ni la paraula en majúscula enmig d'una frase, ni la que en tot el lot només apareix en majúscula (a l'inici d'un missatge o darrere d'un tractament com «Sra.»).

## Què llig

- Els missatges que tries, en JSON (una llista de textos o d'objectes amb el text i l'origen) o en text (un missatge per paràgraf).

## Què escriu

- Res. L'informe només porta xifres per tema i paraules soltes: cap text original.
- Tampoc l'origen tal qual: es diu només si el missatge ve de la bústia, de la Pàgina Universal, d'altres orígens o de cap, perquè un nom de fitxer o un camp «origen» pot portar el nom o el correu d'una persona.

## Porta humana

Assenyala els temes que es repetixen. Respondre al veïnat o publicar-ne res ho decidix i ho fa la persona.

## Límits honestos

- Les paraules clau no entenen la ironia ni el context: un tema pot eixir per una paraula dita de passada.
- Un nom propi escrit en minúscules no es reconeix com a nom.
- Una paraula corrent que en tot el lot només apareix a l'inici d'un missatge es tracta com a nom i no es compta.

## L'aprovació

Els missatges són del veïnat: es tracten com a dades personals i s'aprova amb la signatura de Touch ID o d'una clau de pas. Caduca als 90 dies.
