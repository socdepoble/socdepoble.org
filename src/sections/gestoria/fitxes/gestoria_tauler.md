# Tractor «Gestoria · Tauler de l’empresa»

**Identificador:** `gestoria.tauler` · **Versió:** 1.0.0 · **Dades personals:** sí · **Xarxa:** cap

## Què fa, en una frase

Llig, només en este ordinador, els extractes del banc que tu tries i en calcula les xifres del Tauler de la Gestoria: la caixa real, quants mesos la cobrix, les finances dels últims 30 dies i la tresoreria de cada compte.

## Pas a pas

1. **Comprova la teua aprovació.** Abans de llegir res verifica que l'empremta del seu codi, d'esta fitxa i del seu manifest és la que has aprovat. Si no ho és, s'atura i el Tauler diu «Cal aprovar el tractor».
2. **Tu tries els fitxers.** Els extractes en Norma 43 (`.n43`, `.aeb`, `.c43`, `.q43`, `.txt` o `.dat`) o el CSV de moviments del banc, triats amb el selector del sistema. Si vols, també el fitxer de configuració de l'empresa (`.json`).
3. **Llig els comptes i en guarda només el que necessiten les xifres.** De cada compte: l'entitat, els quatre últims dígits, la moneda, les dates i els saldos. De cada moviment: les dates, l'import, el concepte comú de la norma (un codi genèric de dues xifres) i, si és en una altra moneda, el seu import en eixa moneda. Del CSV, de cada fila: les dates, l'import i el saldo. No guarda mai el número sencer del compte, l'oficina, el nom del titular, el text dels conceptes, les referències, el número de document ni les dades dels rebuts SEPA (el creditor, el seu identificador amb el NIF i el mandat). Comprova les sumes i el saldo, i t'avisa del que no quadra.
4. **Calcula el Tauler.** La caixa real és la suma dels saldos en euros. La cobertura divideix la caixa per la despesa mensual mitjana dels últims sis mesos que cobrixen els extractes. Les finances són les entrades i les eixides dels 30 dies que acaben l'últim dia dels extractes, no el d'avui.
5. **Estima els impostos.** El 303 i el 130 del trimestre són una estimació per a revisar amb la gestoria, mai una declaració, i diuen «estimació incompleta» mentre falten dades.

## Què llig

- Els extractes del banc que tries: els llig sencers en la memòria del navegador, però en guarda només el que diu el pas 3.
- De la configuració de l'empresa, si la tries: només el nom (el comercial, si n'hi ha) i la població del domicili fiscal, per a la teua boina. La resta del fitxer no es guarda.
- El nom d'un fitxer només es guarda dins de l'avís d'un fitxer que no s'ha pogut llegir, perquè sàpies quin és.

## Què escriu

- Res. Les xifres viuen en la memòria de la pàgina i desapareixen quan la tanques.

## Què no fa mai

- No es connecta al teu banc ni a cap servei: treballa amb els fitxers que descarregues tu.
- No envia res per la xarxa i no guarda res al navegador.
- No mostra cap xifra fins que tu prems l'ull: per defecte, totes les xifres estan amagades i el lector de pantalla diu «Import amagat».
- No es pot compartir: les targetes del Tauler són privades.
- No posa cap dada a l'adreça de la pàgina. L'Índex hi escriu el títol de la secció que tries, i per això cap títol porta dades: les targetes dels comptes es diuen «Compte 1», «Compte 2»…, i l'entitat i els quatre últims dígits només es llegixen dins de la targeta.

## Límits honestos

- Si dos extractes del mateix compte cobrixen els mateixos dies, els moviments repetits només compten una vegada i t'ho diu.
- Els traspassos entre els teus comptes compten com a entrada en un i eixida en l'altre.
- Sense factures, el 303 i el 130 no tenen xifra; amb factures rebudes que no diuen el tipus d'operació, l'IVA suportat no es dona per deduïble.
- Un compte en una altra moneda queda fora de la caixa real, i el Tauler ho diu.
- Sense moviments o factures en euros, la xifra diu «Sense mesura en euros»: mai un zero que no s'ha mesurat.
- Com que no guarda el text dels conceptes ni els rebuts SEPA, la conciliació del Tauler aparella per l'import, la data, el concepte comú i l'import en l'altra moneda: no reconeix el número de factura ni el creditor d'un rebut.

## Com es desenxufa

«Oblida les dades» buida la memòria del Tauler i torna a amagar totes les xifres. Revocar l'aprovació al panell de Tractors el bloqueja a l'instant.

## L'aprovació

Aproves esta versió exacta per la seua empremta curta, amb la signatura de Touch ID o d'una clau de pas (la confirmació escrita no basta per a dades personals). Qualsevol canvi en el codi, en el manifest o en esta fitxa la invalida. Caduca als 90 dies. És una aprovació separada de la del full trimestral i de la del correu: aprovar el Tauler no aprova cap dels altres dos.

**Què protegix i què no.** L'aprovació d'este navegador evita l'execució accidental o d'una versió que no has llegit, i el selector de fitxers exigix un gest teu. No protegix davant d'un programa que ja controle este navegador o el teu perfil; per a l'execució per agents, la clau de confiança ha d'estar fixada fora del seu abast (lease).
