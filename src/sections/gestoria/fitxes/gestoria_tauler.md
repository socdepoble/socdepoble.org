# Tractor «Gestoria · Tauler de l’empresa»

**Identificador:** `gestoria.tauler` · **Versió:** 1.0.0 · **Dades personals:** sí · **Xarxa:** cap

## Què fa, en una frase

Llig, només en este ordinador, els extractes del banc que tu tries i en calcula les xifres del Tauler de la Gestoria: la caixa real, quants mesos la cobrix, les finances dels últims 30 dies, la tresoreria de cada compte i el Quadre de comandament (el flux de caixa de cada mes, els dies de cobertura, els venciments i, amb les factures del full trimestral, les que podrien faltar).

## Pas a pas

1. **Comprova la teua aprovació.** Abans de llegir res verifica que l'empremta del seu codi, d'esta fitxa i del seu manifest és la que has aprovat. Si no ho és, s'atura i el Tauler diu «Cal aprovar el tractor».
2. **Tu tries els fitxers.** Els extractes en Norma 43 (`.n43`, `.aeb`, `.c43`, `.q43`, `.txt` o `.dat`) o el CSV de moviments del banc, triats amb el selector del sistema. També poden ser els que l'Escàner Local troba a la carpeta que tries i tu aboques al Tauler («Aboca»): l'Escàner només els proposa, i els bytes els llig este tractor, amb esta aprovació. Si vols, també el fitxer de configuració de l'empresa (`.json`).
3. **Llig els comptes i en guarda només el que necessiten les xifres.** De cada compte: l'entitat, els quatre últims dígits, un identificador opac, la moneda, les dates i els saldos. L'identificador opac ix del número sencer del compte i d'una sal que només viu en esta sessió: no porta cap dígit del compte i només servix perquè dos comptes de la mateixa entitat acabats en els mateixos quatre dígits no es confonguen. De cada moviment: les dates, l'import, el concepte comú de la norma (un codi genèric de dues xifres) i, si és en una altra moneda, el seu import en eixa moneda. Del CSV, de cada fila: les dates, l'import i el saldo. No guarda mai el número sencer del compte, l'oficina, el nom del titular, el text dels conceptes, les referències, el número de document ni les dades dels rebuts SEPA (el creditor, el seu identificador amb el NIF i el mandat). Comprova les sumes i el saldo, i t'avisa del que no quadra.
4. **Calcula el Tauler.** La caixa real és la suma dels saldos en euros. La cobertura divideix la caixa per la despesa mensual mitjana dels últims sis mesos que cobrixen els extractes. Les finances són les entrades i les eixides dels 30 dies que acaben l'últim dia dels extractes, no el d'avui.
5. **Estima els impostos.** El 303 i el 130 del trimestre són una estimació per a revisar amb la gestoria, mai una declaració, i diuen «estimació incompleta» mentre falten dades. El trimestre és el que tries a la capçalera del panell (‹ › i «Hui»); si no en tries cap, el del full trimestral o, sense full, el que té oberta la presentació del 303 i del 130 (de l'1 al 20 d'abril, juliol i octubre, el trimestre anterior; de l'1 al 30 de gener, el quart de l'any passat) i, fora d'eixes finestres, el d'avui. «Hui» porta a eixe mateix trimestre. Quan el full analitza un trimestre nou, la capçalera el seguix. A Hisenda, cada model es paga pel seu compte: el que surt a pagar és la suma de la part a pagar del 303 i de la del 130, i un 303 a compensar no resta del 130 ni són diners que entren (la targeta Hisenda el diu a part, «IVA a compensar (no resta)»).
6. **Situa el trimestre.** La capçalera diu on és avui respecte del trimestre i del seu termini de presentació, amb una barra de dies i, dins del termini, els dies que queden («queden 6 dies»): una data no és cap xifra i es veu sempre. També diu quina part de la caixa real caldria per a l'estimació de Hisenda, però això sí que és una xifra i només es pinta quan prems l'ull.
7. **El Quadre de comandament** (abans, la Cabina d'Avió). Una tercera vista del Tauler, entre «Targetes» i «Vista comprimida», amb els mateixos números que les targetes en una sola pantalla:
   - **Els instruments:** la caixa real, la despesa mensual mitjana i els dies de cobertura, el 303, el 130, el que surt a pagar a Hisenda, la caixa davant de Hisenda i els dies de cobertura un colp pagat. La despesa i els dies parteixen de la mateixa base que la targeta Cobertura, la despesa bruta (tota eixida). Cada instrument obri la pàgina de la seua targeta.
   - **El flux de caixa per mes:** les entrades i les eixides en euros de cada mes de calendari, com a molt dels 12 últims fins a l'últim dia dels extractes i des del primer mes que en tenen, en dos gràfics i en una taula amb el net. Un mes sense extractes ho diu: mai un zero.
   - **Els venciments:** la finestra de presentació del 303 i del 130 de cada trimestre, oberta, propera o vençuda. Els terminis són orientatius, a verificar amb la gestoria.
   - **La data de referència:** és l'últim dia dels extractes, mai el d'avui. Si fa més de 31 dies, t'avisa que les dades són antigues.
   - **Les factures que falten:** si el full trimestral ha analitzat un trimestre, el Quadre en creua les factures (i les dels fulls d'abans, que fa servir d'historial) amb els moviments que ja ha llegit este tractor, i diu, per proveïdor habitual i mes, les que falten o en què en falta alguna. Si el banc té un únic càrrec que hi casa (entre l'1 del mes i 10 dies després de l'últim), en diu el dia i l'import (amagat fins que prems l'ull); si no, diu per què: cap càrrec, diversos que hi podrien casar, un que també podria ser d'un altre mes, sense historial per a buscar-lo o sense extracte del mes. Compta per la data de la factura: són indicis per a revisar, i la gestoria decidix el trimestre de cada factura. On demanar-la és el domini públic del proveïdor, en text. No llig cap fitxer més: les factures ja les ha llegit el full trimestral, amb la seua aprovació.
   - **La Plantilla Gestoria:** l'última secció mostra el full que el full trimestral ha generat amb la teua segona aprovació, en el format exacte que accepta la gestoria, i te'l deixa descarregar o preparar-ne el correu. Este tractor no el genera ni l'escriu: els bytes, la descàrrega i el correu són del tractor del full trimestral, amb la seua aprovació. Sense full generat, et porta al full trimestral.
8. **La boina de cada pàgina.** Amb sessió, la boina és la teua persona de la sessió: el nom, el poble i l'avatar que dona la plataforma. Este tractor no els llig, no ixen d'este ordinador i no van a l'adreça. Sense sessió, la boina porta el titular que hi escrius (només en la memòria de la pàgina), el nom de la configuració de l'empresa o «Titular sense configurar». A la dreta de la barra hi ha sempre la data i l'hora d'ara, vives, i a la seua esquerra l'hora de la darrera lectura dels extractes, amb el dia només si no és d'avui. A mitjanit, el dia de la Gestoria canvia amb el rellotge.

## Què llig

- Els extractes del banc que tries, o els que aboques des de l'Escàner Local: els llig sencers en la memòria del navegador, però en guarda només el que diu el pas 3.
- De la configuració de l'empresa, si la tries: només el nom (el comercial, si n'hi ha) i la població del domicili fiscal, per a la teua boina mentre no hi ha sessió. La resta del fitxer no es guarda.
- El selector mostra el nom dels fitxers triats. Es buida en acabar una lectura bona o prémer «Oblida les dades». Dins de la lectura, el nom només es guarda en els avisos, perquè sàpies quin fitxer els ha causat.

## Què escriu

- Res. Les xifres viuen en la memòria de la pàgina i desapareixen quan la tanques.

## Què no fa mai

- No es connecta al teu banc ni a cap servei: treballa amb els fitxers que descarregues tu.
- No envia res per la xarxa i no guarda res al navegador.
- No mostra cap xifra fins que tu prems l'ull: per defecte, totes les xifres estan amagades i el lector de pantalla diu «Import amagat». Val igual per a les targetes, per a la vista comprimida (la taula densa), per al Quadre de comandament (també el full de la Plantilla Gestoria i els imports de les factures que falten) i per a la barra de Hisenda sobre la caixa. Al Quadre, amb l'ull tancat, tampoc hi ha gràfics, perquè l'alçada de les barres també és una xifra, ni cap perquè que diga el signe d'una xifra («res a pagar», «en descobert»). Les dates sí que es veuen sempre.
- No es pot compartir: les targetes del Tauler són privades. La barra i el peu porten Comentar, Compartir i Connectar com a tota la plataforma, però a la Gestoria no fan res fora d'este ordinador: en prémer-los, diuen per què (no naveguen, i la lectura no s'oblida).
- No posa cap dada a l'adreça de la pàgina. L'Índex hi escriu el títol de la secció que tries, i per això cap títol porta dades: les targetes dels comptes es diuen «Compte 1», «Compte 2»…, i l'entitat i els quatre últims dígits només es llegixen dins de la targeta. Els títols del Quadre de comandament tampoc porten cap xifra ni cap data. El trimestre que tries i la vista (targetes, Quadre de comandament o comprimida) tampoc van a l'adreça.

## Límits honestos

- Un mateix fitxer triat dues vegades compta una sola vegada, i t'ho diu.
- Si dos extractes del mateix compte se solapen, o un acumula l'altre, s'unixen moviment a moviment: cap moviment es perd ni es compta dues vegades, i dos càrrecs iguals de veres d'un mateix extracte continuen sent dos. El saldo és el de l'extracte que acaba més tard.
- Les files d'un CSV es reconeixen per les dates, l'import i el saldo: dues exportacions del mateix compte que no porten igual la columna del saldo no es reconeixen com les mateixes files.
- Sense la columna del saldo, dues files de CSV diferents amb les mateixes dates i el mateix import poden ser dos càrrecs de veres (un compte i una targeta amb la mateixa quota el mateix dia): compten totes dues i un avís ho diu. Si eren dues exportacions del mateix compte, eixos dies compten dues vegades; tria'n una amb la columna del saldo. Dos CSV sense saldo iguals fila a fila no es poden distingir del mateix triat dues vegades: compten com un de sol, i l'avís diu el dubte.
- Dos comptes de la mateixa entitat acabats en els mateixos quatre dígits són dos comptes, però l'identificador opac només dura la sessió: en tornar a llegir els extractes, se'n fa un altre.
- Els traspassos entre els teus comptes compten com a entrada en un i eixida en l'altre. Per això la despesa mensual i els dies de cobertura, que parteixen de la despesa bruta, també els compten.
- L'única ràtio de liquiditat que es pot calcular sense balanç és la caixa davant de Hisenda: ni la ràtio corrent ni la prova àcida.
- Els terminis de presentació no es mouen al dia hàbil següent per caps de setmana ni per festius: són orientatius.
- Sense factures, el 303 i el 130 no tenen xifra; amb factures rebudes que no diuen el tipus d'operació, l'IVA suportat no es dona per deduïble.
- Des del segon trimestre, el 130 no pot restar els pagaments fraccionats d'abans, que el Tauler no sap: per això diu «estimació incompleta».
- Un compte en una altra moneda queda fora de la caixa real, i el Tauler ho diu.
- Sense moviments o factures en euros, la xifra diu «Sense mesura en euros»: mai un zero que no s'ha mesurat.
- Com que no guarda el text dels conceptes ni els rebuts SEPA, la conciliació del Tauler aparella per l'import, la data, el concepte comú i l'import en l'altra moneda: no reconeix el número de factura ni el creditor d'un rebut.

## Com es desenxufa

«Oblida les dades» buida les dades guardades del Tauler i els noms del selector, torna a amagar totes les xifres i torna la capçalera al trimestre que té oberta la presentació (o, fora de les finestres, al d'avui). També cancel·la la lectura activa i oblida la carpeta de l'Escàner Local i la seua radiografia. Mentre llig, el selector està desactivat: no es pot triar un altre lot. Canviar de mòdul dins de Gestoria conserva la lectura; tancar la Gestoria la cancel·la. El navegador no permet interrompre el fitxer que ja ha començat a llegir: quan acaba, els seus bytes es descarten, no es llig cap fitxer següent i no es publica cap resultat parcial. Revocar l’aprovació al panell de Tractors, també des d’una altra pestanya, bloqueja les lectures següents però no interromp una lectura que ja està en marxa.

## L'aprovació

Aproves esta versió exacta per la seua empremta curta, amb la signatura de Touch ID o d'una clau de pas (la confirmació escrita no basta per a dades personals). Qualsevol canvi en el codi, en el manifest o en esta fitxa la invalida. Caduca als 90 dies. És una aprovació separada de la del full trimestral i de la del correu: aprovar el Tauler no aprova cap dels altres dos.

**Què protegix i què no.** L'aprovació d'este navegador evita l'execució accidental o d'una versió que no has llegit, i el selector de fitxers exigix un gest teu. No protegix davant d'un programa que ja controle este navegador o el teu perfil; per a l'execució per agents, la clau de confiança ha d'estar fixada fora del seu abast (lease).
