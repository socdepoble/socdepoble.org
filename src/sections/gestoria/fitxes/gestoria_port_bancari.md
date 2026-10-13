# Nota d'arquitectura «Gestoria · El port dels moviments del banc»

**Contracte:** `sdp.gestoria.font-moviments.v1` · **Codi:** `src/sections/gestoria/nucli/fontMoviments.js` · **Dades personals:** sí · **Xarxa:** cap · **Estat:** decisió de la nit del 261011 (Onada 12, ordres 261011_0130, punt 6), a revisar pel Mestre

Esta fitxa no és la d'un tractor: no aprova res ni llig res. Explica una frontera.

## Què decidix, en una frase

Tot el que la Gestoria sap del banc entra per una sola porta, la «font de moviments», de manera que connectar-se un dia a un banc siga afegir un adaptador i res més.

## El contracte

Una font de moviments és un objecte amb `esquema`, `id`, `tipus`, `nom`, `local`, `avisos` i una sola operació:

- `llegixMoviments({ des, fins })` torna els moviments amb la data d'operació dins del rang, amb els dos extrems inclosos. Un extrem absent deixa el rang obert.

Cada moviment porta:

- **id**: estable dins de la sessió. El mateix moviment té el mateix identificador en dues lectures del mateix fitxer i en dos extractes del mateix compte que se solapen. És una empremta del compte, les dates, l'import, el concepte i l'ordinal dels iguals: dos cafés del mateix dia són dos moviments. En la Norma 43, el compte de l'empremta és l'identificador opac que `c43.js` trau del número sencer amb una sal de la sessió (cap xifra del compte): dos comptes del mateix banc acabats en els mateixos quatre dígits ja no comparteixen identificadors, i l'identificador només és estable mentre dura la sessió (ordre del Mestre, 13-10-2026, pla 261013_1405, front I; auditoria Codex GES-A2). Sense eixe identificador, el d'abans: l'entitat i els quatre últims dígits. Un CSV no diu de quin compte o targeta és: el seu identificador porta la identitat del fitxer (una empremta del nom i de les columnes).
- **data** i **dataValor**: dies del calendari (`{ a, m, d }`), sense hora ni zona horària.
- **concepte**: el text del banc, en una línia.
- **import**: cèntims enters amb signe. Una eixida és negativa; una devolució, positiva.
- **saldo**: cèntims després del moviment, o `null` si l'origen no el diu.
- **moneda**: codi ISO 4217.
- **compte**: un nom per a mostrar, l'entitat i els quatre últims dígits, o `null`. Mai el número sencer. Si dos comptes diferents del mateix fitxer acaben igual, són «entitat-sufix» i «entitat-sufix-2», en l'ordre en què apareixen.
- **detall**: el moviment tal com l'entén la conciliació.

## Els adaptadors que hi ha hui

1. **`fontDeC43`**: l'extracte en Norma 43, amb el lector de sempre (`c43.js`).
2. **`fontDeCsv`**: l'extracte en CSV del compte o de la targeta de crèdit, amb el lector tolerant (`extracteCsv.js`): detecta el separador, la capçalera, el separador decimal i el signe, i diu com ho ha decidit.

Tots dos són **locals**: lligen un fitxer que la persona ha triat i responen de seguida.

## Quan dos moviments són el mateix, i quan no se sap

- **D'un compte conegut** (la Norma 43 porta el compte, que es reconeix per l'identificador opac i no per l'entitat i els quatre últims dígits): el mateix identificador és el mateix moviment, i només compta una vegada.
- **De la mateixa font** (el mateix fitxer triat dos colps): també.
- **De dos CSV que no diuen de qui són**: no es lleva mai res en silenci. Dues targetes poden tindre la mateixa subscripció el mateix dia. Si dos moviments de dos CSV coincidixen en dia, import i concepte, es conserven tots dos i `uneixMoviments` torna quants en són (`dubtosos`); qui ho consumix ha d'avisar. El preu: dos extractes de la mateixa targeta que se solapen compten els dies repetits dues vegades, amb avís. És millor un avís que perdre un càrrec.
- **La moneda** viatja amb cada moviment. El que no és en euros no s'ha de conciliar ni sumar amb la resta.

## Marques de temps

El port només admet dies del calendari (`{ a, m, d }`). El lector de dates de la Gestoria (`dates.js`) es queda amb el dia que porta escrit el text i no converteix cap zona horària: les 22:30 UTC del 30 de juny les llig com a 30 de juny, i a l'hora d'ací ja són l'1 de juliol, que és un altre trimestre. Per a un extracte en fitxer no passa res, perquè porta dies. Per a una connexió bancària, que dona instants en UTC, **l'adaptador ha de convertir cada instant a la zona de la persona abans de fer-ne el dia**. `dates.trimestres.test.js` fixa el comportament d'ara perquè es veja, no perquè siga bo per a eixe cas.

## Dates amb el mes davant

El lector llig sempre el dia abans que el mes. Si un CSV porta alguna data que només existix amb el mes davant (mm/dd), no en llig cap moviment i ho diu: les dates amb dia fins a 12 es llegirien girades sense que ningú ho vera.

## El tercer adaptador: un agregador bancari (PSD2)

No existix, i esta nit no s'ha escrit ni una crida de xarxa ni una credencial. Quan arribe:

1. Fa la seua font amb `creaFont({ tipus, nom, moviments, local: false })`. Com que és de xarxa, `llegixMoviments` tornarà una promesa.
2. Ha de passar `comprovaFont`, el **kit de conformitat** que ja passen els dos d'ara (`fontMoviments.test.js` en porta un de mentida, sense xarxa, per a demostrar que encaixa).
3. Qui el consumisca fa `await` de cada `llegixMoviments` i unix els moviments amb `uneixMoviments`, que lleva els repetits per l'identificador. `llegixFonts`, que és síncrona, refusa una font que no és local: així cap sentinella, que no pot esperar, la llig per error.

El que **no** decidix esta fitxa, i és del Mestre: quin agregador, qui guarda el consentiment i les credencials (mai el navegador de la Gestoria, que hui no té xarxa per llei: `privacitat.test.js`), i el tractor nou amb la seua fitxa i la seua aprovació que caldrà per a una lectura que ix d'este ordinador.

## Qui fa servir el port hui

- El sentinella **Triturador Financer** (`src/sections/tractors/sentinelles/trituradorFinancer.js`): llig la Norma 43 i els CSV de targeta o d'altres bancs pel port. Passa cada font pel kit `comprovaFont` abans de llegir-la i, quan hi ha fulls, demana només el rang dels seus trimestres i dels dos veïns (`llegixMoviments({ des, fins })`).
- El CSV del banc «de sempre» (el format fix de `movimentsBanc.js`) NO passa pel port: el Triturador el fusiona amb la Norma 43 com abans. El mateix fitxer triat dos colps es descarta pel contingut.

## Límits que l'auditoria de pagaments hereta de la conciliació

`concilia.js` és font signada i no s'ha tocat. El que arrossega `auditoriaPagaments.js`, dit amb totes les lletres:

- **Pagament a trossos**: el tros que cita la factura hi fa parella amb «import que no quadra», i la factura deixa d'eixir com a pendent encara que en falte una part. L'altre tros ix com un moviment sense factura.
- **Cobrament a 30 o 60 dies sense citar el número**: no casa (la finestra per import va de 3 dies abans a 10 després de la factura; un rebut SEPA amb el NIF del creditor, fins a 40). Ix un «emesa sense cobrament» fals.
- **Càrrecs diaris iguals** a la mateixa contrapart s'encadenen i ixen junts com a possible duplicat.
- **Una quota sense factura** ja no es pren pel segon pagament de la del mes anterior: un «segon pagament» ha de citar el número de la factura.

Per això l'informe comença amb un avís: és una ajuda per a revisar, no un veredicte.

## Qui encara no

- El **Tauler** (`gestoria.tauler`) i l'**Històric** (`gestoria.historic`) continuen llegint amb `llegeixC43` i `llegeixMovimentsCsv` directament. Passar-los al port és canviar fonts signades de dos tractors, que tornarien a «pendent»: no s'ha fet sense ordre. Mentrestant, l'Històric no llig l'extracte de la targeta de crèdit en CSV, només el CSV de moviments del compte.

## Com entren el TPV i el Rebost al llibre

Hui encara no hi entren: la Gestoria no té cap importador d'ingressos. La Gestoria no importa cap app i cap app importa la Gestoria (`fronteres.test.js`). El patró és el mateix del banc: el TPV i el Rebost **exporten un fitxer** i la Gestoria el llig amb un adaptador, mai amb una importació de codi.

- **Vendes del TPV → ingressos · contracte acordat, pendent d'endoll.** Des de la nit del 261011 el TPV exporta, al detall d'un torn tancat, un fitxer `vendes-<data>-<torn>.json` amb el contracte neutre `sdp.vendes.v1` (`src/utils/vendes/registreVendes.js`, amb el validador `validaRegistreVendes`). De cada venda diu el total AMB IVA per tipus d'IVA, sense base ni quota. El que farà la Gestoria quan s'endolle:
  - valida el fitxer amb `validaRegistreVendes` i no en llig cap si no és vàlid;
  - fa un apunt d'ingrés per dia i tipus d'IVA; les devolucions resten;
  - trau la base i la quota amb la regla que la Gestoria ja té per al mode «IVA inclòs» (`facturacio/facturaEmesa.js`, `desglossa`): se suma el que paga el client per tipus d'IVA, la base és la suma × 100 / (100 + tipus), arredonida una sola vegada, i la quota és la suma menys la base. No n'hi ha d'haver una segona;
  - no importa dues vegades la mateixa venda: la clau és `origen.app/origen.establiment/venda.id`;
  - el titular el posa la Gestoria en importar; mai una venda de l'àmbit de la llar.
  
  Per què no s'ha escrit esta nit: `privacitat.test.js` només deixa que la Gestoria importe els seus dos carrils i unes poques peces declarades, i `src/utils/vendes/` no hi és. Afegir-la a la llista blanca és afluixar una porta, i això és decisió del Mestre. Tampoc hi ha encara cap vista d'importació on endollar-ho, i una funció sense cridador és maquinària sense endollar.
- **Compres del Rebost → despeses**: una compra només és una despesa del llibre si té factura. El Rebost pot exportar la llista de compres amb el número de factura o de tiquet, i l'auditoria de pagaments (`auditoriaPagaments.js`) la creua amb el banc com qualsevol altra factura rebuda.

## Límits honestos

- L'identificador depén de l'ordre dels moviments iguals dins de cada fitxer. Dos extractes que tallen el mateix dia per llocs diferents poden donar un ordinal diferent a un moviment repetit.
- Un CSV no diu de quin compte és. El port no ho endevina: avisa.
- Entre dos fitxers diferents, el nom `compte` no distingix dos comptes acabats en els mateixos quatre dígits (tots dos es diuen «entitat-sufix»): els distingix l'identificador de cada moviment, que és el que `uneixMoviments` mira. Qui agrupe per compte entre fitxers ha d'agrupar per l'identificador, no pel nom.
- Els mòduls nous (`fontMoviments.js`, `extracteCsv.js`, `auditoriaPagaments.js`) viuen a `nucli/`, que `fronteraModelsPurs.test.js` NO vigila (eixa prova només mira `identitat/`, `burocracia/` i `projectes/`). Les portes que sí que els lligen són `privacitat.test.js` (cap xarxa, cap emmagatzematge) i `qualitat.test.js` (lint i Baseline).
- Un moviment de la Norma 43 i el mateix moviment en un CSV no tenen el mateix identificador (el text del concepte canvia): per a ajuntar-los hi ha `fusionaMoviments`, no el port.
- El port no guarda res: cada lectura torna a llegir el fitxer.
