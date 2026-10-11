# Sentinella «Triturador Financer · Trituradora de Documents Locals»

**Identificador:** `sentinella.triturador-financer` · **Versió:** 1.1.0 · **Nivell:** L0 · **Revisió Humana:** Pendent · **Dades personals:** sí · **Xarxa:** cap

## Què fa, en una frase

Llig en lot, només en este ordinador, els extractes del banc i de la targeta i els fulls trimestrals de factures que tries, proposa els assentaments que falten, assenyala les discrepàncies d'IVA i fa l'auditoria de pagaments de cada trimestre, tot pendent d'«Aprovar» a la Gestoria.

## Què ha canviat en la versió 1.1.0 (Onada 12, 261011)

- Llig també l'**extracte de la targeta de crèdit** i el CSV d'altres bancs (punt i coma, coma decimal, dates dd/mm/aa).
- Dos extractes del mateix compte que se solapen, o el mateix fitxer triat dos colps (un extracte o un full), **ja no compten dues vegades**.
- Un CSV de moviments ja no es pren per un full de factures buides.
- L'informe porta l'**auditoria de pagaments per trimestre** i el resum de cada full.
- El que no es pot donar per bo va **dalt de tot de l'informe** i no entra a cap xifra: un extracte amb el signe dubtós i els moviments que no són en euros.

Com que el codi ha canviat, l'aprovació de la versió 1.0.0 ja no val: cal tornar a llegir esta fitxa i aprovar la 1.1.0.

## Disparador

- **Quan deixes un lot de fitxers** a la carpeta del trimestre i els tries amb el selector del sistema.

## Què llig

- Extractes en **Norma 43** (`.n43`, `.c43`, `.aeb` o un `.txt` que ho siga, també amb BOM o tot seguit sense salts de línia, com els llig la Gestoria).
- Els CSV i els textos es descodifiquen com a la Gestoria: UTF-8, UTF-16 o windows-1252 (el que desa Excel a Windows), sense perdre els accents.
- El **CSV de moviments del banc** de sempre (data, data valor, concepte, import i saldo).
- L'**extracte en CSV de la targeta de crèdit o d'un altre banc**: detecta el separador, la fila de capçalera (encara que hi haja línies davant), el separador decimal i el signe, i t'ho diu a l'informe. Si és d'una targeta (ho diu l'extracte, la columna «Comercio» o el nom del fitxer amb «tarjeta», «targeta» o «visa») i les compres venen en positiu, les gira: ací una compra és negativa i una devolució, positiva. Els números de targeta emmascarats es lleven del concepte; d'un número de targeta sencer o d'un IBAN només en queden les quatre últimes xifres.
- **Si no sap el signe, no l'endevina.** Un extracte amb quasi tots els imports positius, sense saldo i sense cap senyal de targeta, queda «pendent de confirmar el signe»: es llista dalt de tot i no entra ni a la conciliació ni a cap resum. No hi ha cap botó per a dir-li-ho: si és d'una targeta, posa «tarjeta» al nom del fitxer i torna'l a triar.
- **Si les dates van amb el mes davant (mm/dd), no llig l'extracte**: alça bandera roja. Llig sempre el dia primer i no vol girar dates a cegues.
- **El que no és en euros** es llista a part i no es concilia ni se suma.
- Els **fulls trimestrals CSV** que proposa el tractor «Gestoria · Full trimestral de factures»: un o diversos (el 2n, el 3r i el 4t alhora, per exemple).
- Els **PDF no els llig**: són del tractor de factures, amb la seua aprovació i la seua signatura. Si en tries algun, t'ho diu.

## Com treballa

1. Comprova l'aprovació d'esta versió exacta abans de llegir res.
2. Classifica cada fitxer pel format i el llig amb els mòduls purs de la Gestoria, els mateixos que fa servir el tractor de factures. Els extractes entren pel port dels moviments (`gestoria/nucli/fontMoviments.js`): cada un passa abans el kit de conformitat del port, i rep un identificador estable per moviment.
3. Lleva els repetits només quan sap que ho són: el mateix compte de la Norma 43 en dos extractes, o el mateix fitxer dos colps. Entre dos CSV que no diuen de quin compte o targeta són **no lleva res**: si hi ha moviments iguals (dia, import i concepte), els conserva tots i avisa en groc, perquè dues targetes poden tindre la mateixa subscripció el mateix dia.
4. Fusiona la Norma 43 amb el CSV del banc de sempre per a saber el comerç de les compres amb targeta de dèbit. Els moviments de l'extracte de la targeta de crèdit no són a la Norma 43 un per un: s'hi afigen. Els d'un extracte de compte en un altre format que coincidixen en dia i import amb la Norma 43 es prenen pel mateix compte: compten una vegada, amb avís en groc.
5. Quan hi ha fulls, només mira els moviments dels seus trimestres i dels dos veïns, i diu quants en queden fora.
6. Concilia una sola vegada tots els moviments amb totes les factures (una factura del 2n trimestre cobrada al 3r fa parella igualment) i revisa l'IVA de cada factura.
7. Fa l'**auditoria de pagaments** de cada trimestre:
   - factures emeses sense cap cobrament;
   - eixides i entrades del banc sense factura (un moviment sospitós de duplicat continua en esta llista: no se'n lleva mai cap);
   - possibles pagaments duplicats: el mateix import a la mateixa contrapart en tres dies, o un segon moviment que **cita el número** d'una factura que ja té el seu pagament. Una quota mensual sense factura no és cap duplicat: és una eixida sense factura;
   - imports que no quadren entre la factura i el moviment;
   - factures amb la data fora del trimestre del seu full, i les que es cobren o es paguen en un altre trimestre.
8. Et dona el **resum de cada full**: ingressos i despeses (base), IVA repercutit i suportat, retencions d'IRPF i resultat, i el que el banc diu que ja s'ha cobrat i pagat (amb signe: un abonament tornat resta; un moviment que paga factures de dos trimestres es repartix).
   - **Retencions**: el full CSV no té columna de retenció. La deduïx de base + IVA − total quan la diferència és un tipus habitual (7, 15 o 19 %), i ho diu. Si una factura no quadra i la diferència no és cap d'eixos tipus, diu que no es pot saber: mai un «0,00 €» que no és cert.

## Què escriu

- Res. No anota, no mou i no esborra cap fitxer. Les propostes queden pendents d'«Aprovar» a la Gestoria.

## Porta humana

Cada assentament i cada discrepància d'IVA els aproves tu a la Gestoria. Cap pagament ni cap enviament ix d'ací.

## Límits honestos

- Tot són indicis per a revisar, no veredictes. Una factura sense moviment pot estar pagada en efectiu o des d'un compte que no és a l'extracte; dos càrrecs iguals del mateix dia poden ser dues compres de veres.
- La conciliació proposa parelles per regles (número de factura citat, rebut SEPA, import i dates); una parella de confiança mitjana s'ha de mirar. Les regles són de la Gestoria (`concilia.js`) i tenen límits que l'auditoria arrossega, i que l'informe repetix davant de tot:
  - **Un pagament a trossos**: el tros que cita la factura hi fa parella amb «import que no quadra», i la factura deixa d'eixir com a pendent encara que en falte una part. L'altre tros ix com un moviment sense factura.
  - **Un cobrament a 30 o 60 dies que no cita el número** no casa: sense número, el moviment ha d'arribar entre 3 dies abans i 10 després de la data de la factura (un rebut SEPA amb el NIF del creditor, fins a 40). Ix un «emesa sense cobrament» que no és cert.
  - **Càrrecs diaris iguals** a la mateixa contrapart s'encadenen i ixen junts com a possible duplicat.
- Dos extractes de la mateixa targeta en CSV que se solapen compten els dies repetits dues vegades, amb avís en groc: un CSV no diu de quina targeta és, i el triturador prefereix avisar que perdre un càrrec.
- Si un full no diu de quin trimestre és, es pren aquell on cauen més de la mitat de les seues factures, i les altres ixen com a «fora del trimestre».
- El mateix full triat dues vegades amb un altre nom i el mateix contingut es llig una vegada; si el contingut canvia en res, les factures repetides del mateix trimestre compten una vegada i s'avisa.
- El resum no és cap declaració: no diu quin IVA és deduïble. Això ho decidix la gestoria.
- Un import com «1.234» en una columna amb punt decimal no es llig (mil euros o un euro amb tres decimals?): queda fora, amb avís.
- No classifica les despeses per categories: això ho fa l'Històric de la Gestoria, que encara no llig l'extracte de la targeta de crèdit.
- Si un fitxer no és Norma 43, ni un extracte amb data i import, ni un full, queda com a «no reconegut».

## L'aprovació

Tracta dades personals i financeres: s'aprova amb la signatura de Touch ID o d'una clau de pas. L'empremta cobrix també els mòduls de la Gestoria que fa servir: si en canvia un, cal tornar a aprovar. Caduca als 90 dies.
