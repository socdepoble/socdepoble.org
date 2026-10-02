# Tractor «Gestoria · Creuament amb el correu»

**Identificador:** `gestoria.correus` · **Versió:** 1.0.0 · **Dades personals:** sí · **Xarxa:** cap

## Què fa, en una frase

Llig, només en este ordinador, una exportació del teu correu que tu tries i la creua amb les factures del trimestre per a trobar factures que t'han arribat per correu i que no són a la carpeta.

## Pas a pas

1. **Comprova la teua aprovació.** Abans de llegir res verifica que l'empremta del seu codi, d'esta fitxa i del seu manifest és la que has aprovat. Si no ho és, s'atura.
2. **Tu tries l'exportació.** Un fitxer `.mbox` (Google Takeout de Gmail, Thunderbird) o fitxers `.eml` solts, triats amb el selector del sistema.
3. **Es queda només amb les capçaleres.** El navegador llig el fitxer d'exportació sencer en memòria, però de cada missatge només en conserva el remitent, el domini, l'assumpte, la data i el nom dels adjunts. El cos dels missatges no es guarda ni es mostra, i desapareix amb la memòria.
4. **Reconeix els correus de factura** per l'assumpte i pels adjunts (factura, invoice, receipt, rebut, recibo…) i n'identifica el proveïdor pel domini del remitent.
5. **Creua amb el trimestre.** Si un proveïdor t'ha enviat una factura dins del trimestre i no hi ha cap factura seua a prop d'eixa data, t'ho marca com a «correu sense document».

## Què llig

- L’exportació de correu que tries passa sencera per la memòria del navegador, inclosos cossos i adjunts. Només s’extrauen les capçaleres necessàries per al creuament; el cos no s’analitza com a contingut ni es mostra.

## Què escriu

- Res. Els avisos apareixen al panell de la Gestoria i desapareixen amb la memòria.

## Què no fa mai

- No es connecta al teu compte de correu: ni Gmail, ni IMAP, ni cap contrasenya. Treballa amb una exportació que fas tu.
- No envia res per la xarxa i no guarda cap missatge al navegador.
- No analitza, mostra ni conserva el cos com a contingut del creuament. El fitxer complet només passa per memòria per separar els missatges i les capçaleres.

## Límits honestos

- Només veu el que hi ha a l'exportació que li dones: si l'exportació no cobrix tot el trimestre, el panell en diu el període real revisat.
- Un proveïdor amb un domini que no coneix es queda sense identificar; el pots reconéixer pel nom de l'adjunt.

## Com es desenxufa

«Desenxufa» buida la memòria. Revocar l'aprovació al panell de Tractors el bloqueja a l'instant.

## L'aprovació

Aproves esta versió exacta per la seua empremta curta, amb la signatura de Touch ID o d'una clau de pas (la confirmació escrita no basta per a dades personals). Qualsevol canvi en el codi, en el manifest o en esta fitxa la invalida. Caduca als 90 dies. És una aprovació separada de la del full trimestral: aprovar la lectura de factures no aprova la lectura del correu.

**Què protegix i què no.** L'aprovació d'este navegador evita l'execució accidental o d'una versió que no has llegit, i el selector de fitxers exigix un gest teu. No protegix davant d'un programa que ja controle este navegador o el teu perfil; per a l'execució per agents, la clau de confiança ha d'estar fixada fora del seu abast (lease).
