# Tractor «Gestoria · Escàner Local de la carpeta»

**Identificador:** `gestoria.escaner` · **Versió:** 1.0.0 · **Dades personals:** sí · **Xarxa:** cap

## Què fa, en una frase

Recorre, només en este ordinador, la carpeta arrel de la Gestoria que tu tries, hi troba els extractes del banc, classifica les factures de cada trimestre, t'avisa dels duplicats, de les dates que no quadren i dels buits, i et proposa abocar els extractes al Tauler amb un clic.

## Pas a pas

1. **Comprova la teua aprovació.** Abans de llistar res verifica que l'empremta del seu codi, d'esta fitxa i del seu manifest és la que has aprovat. Si no ho és, s'atura i l'Escàner diu «Cal aprovar el tractor».
2. **Tu tries la carpeta.** Amb el selector de carpetes del sistema o, on el navegador no en té, amb el botó de triar una carpeta. El navegador només dona accés a la carpeta que tries, només per a llegir-la i només després d'un gest teu.
3. **Llista la carpeta sencera.** De cada fitxer en pren el nom, la mida i la data, i res més. Els fitxers ocults i els del sistema no es llisten.
4. **Compara els que tenen la mateixa mida.** Només de les factures i dels extractes que el Tauler sap llegir, i només si dos o més tenen exactament la mateixa mida, llig els bytes per a calcular-ne l'empremta (sha256): és com sap que dos fitxers són la mateixa factura.
5. **Reconeix els extractes del banc.** Dels extractes candidats en Norma 43 o en CSV en mira els primers 4 kB, només per a saber si el Tauler els pot llegir.
6. **Classifica i avisa.** Pel nom, la mida i la carpeta (i l'empremta, si n'hi ha), cada fitxer va al seu apartat: bancs, factures, identitat, burocràcia, arxiu, codi o altres. T'avisa de les factures repetides en dos trimestres, de les còpies, de les dates dels noms que no quadren amb la carpeta del trimestre, dels trimestres sense carpeta, dels mesos sense extracte, dels forats de les sèries i de les credencials soltes. Tot són propostes: no mou ni esborra res.
7. **Et proposa els extractes per al Tauler.** Preselecciona els que el Tauler llig i de manera que cap moviment es compte dues vegades. Tu en tries i prems «Aboca»; els bytes dels extractes els llig llavors el tractor del Tauler, amb la seua aprovació, no este.

## Què llig

- La carpeta que tries, sencera: el nom, la mida i la data de cada fitxer.
- Els bytes de les factures i dels extractes que tenen la mateixa mida que un altre, només per a calcular-ne l'empremta. Mai els de la carpeta de la identitat legal, els de l'arxiu (les carpetes d'arxiu, d'històric i de quarantena), els de les credencials ni els dels documents que pel nom són sensibles (identitat, credencials, salut).
- Dels extractes candidats en Norma 43 o en CSV, els primers 4 kB. El navegador entrega el fitxer sencer en la memòria; l'Escàner en mira només el principi, tallat a l'última línia sencera, i descarta la resta de seguida. Un extracte que ja s'havia llegit per a l'empremta no es torna a llegir.
- De la carpeta de la identitat legal només en compta les carpetes i els fitxers, per a dir-te que tenen la seua vista, «Identitat i Finestreta». No en llig cap byte i no en mostra cap nom, tampoc d'una credencial que hi haja ni d'una carpeta de la identitat que estiga dins de l'arxiu: d'eixos fitxers en diu la carpeta i quants n'hi ha.

## Què escriu

- Res. La radiografia viu en la memòria de la pàgina i desapareix quan la tanques o prems «Oblida la carpeta».

## Què no fa mai

- No mou, no reanomena i no esborra cap fitxer, ni crea cap carpeta: només proposa.
- No envia res per la xarxa, no es connecta al banc ni a cap servei i no guarda res al navegador.
- No llig la carpeta de la identitat legal ni l'arxiu, i no compta cap credencial com a factura.
- No fa el full trimestral ni toca les factures: per al Full, tria la mateixa carpeta al Full trimestral, que hi troba sola la carpeta del trimestre. On el navegador no obri el selector de carpetes, tria-hi la carpeta del trimestre (com 2026_3T) i no l'arrel: allí el Full diu el nom dels primers fitxers que hi troba, i l'arrel porta la identitat legal.
- No posa cap dada a l'adreça de la pàgina: l'Índex hi escriu el títol de la secció, i per això cap títol porta dades. Els trimestres, les carpetes i els noms dels fitxers només es llegixen dins dels paràgrafs i de les taules.
- No mostra cap xifra del banc fins que prems l'ull: els moviments i les parelles del resum diuen «Xifra amagada». Les dates i els recomptes de fitxers no són diners i es veuen sempre.

## Límits honestos

- Una carpeta buida no es veu: el navegador només llista fitxers. Un any o un trimestre amb la carpeta buida compta com a absent.
- Les dates dels noms són indicis, no veredictes. El prefix d'arxiu (any, mes i dia, i l'hora) és el dia que es va arxivar, mai el de la factura; per això els avisos diuen «revisa-ho» i les gravetats són baixes.
- Els fulls de càlcul del banc (`.xls`, `.xlsx`) i els PDF del banc no es poden llegir: l'Escàner t'ho diu i et demana l'extracte en Norma 43 o en CSV.
- Un CSV de moviments d'un format que el Tauler encara no llig es mostra, però no s'aboca.
- Sense Norma 43, dos CSV del mateix banc en la mateixa carpeta poden repetir moviments: se n'aboca només el més gran i t'ho diu. En carpetes diferents només es reconeixen si són idèntics.
- A l'iPhone i a l'iPad el navegador no deixa triar carpetes, només fitxers solts: sense carpetes, l'Escàner no sap els trimestres ni els bancs, i ho avisa.
- Una carpeta molt gran (més de 20.000 fitxers) o molt fonda (més de 8 nivells) es llista fins al límit, i ho avisa.
- Un fitxer que no es pot llegir no atura l'anàlisi: es compta a les notes i se'n queda sense empremta o sense format.

## Com es desenxufa

«Oblida la carpeta» desenxufa la carpeta (cap fitxer es torna a llegir), buida la radiografia i la selecció, i cancel·la l'anàlisi activa. Si el Tauler estava llegint els extractes d'esta carpeta, també cancel·la eixa lectura. Triar una altra carpeta cancel·la l'anàlisi anterior i n'oblida la carpeta. Canviar de mòdul dins de Gestoria conserva la radiografia; tancar la Gestoria l'oblida. El navegador no permet interrompre el fitxer que ja ha començat a llegir: quan acaba, els seus bytes es descarten, no se'n llig cap altre i no es publica cap resultat parcial. Revocar l'aprovació al panell de Tractors bloqueja les anàlisis següents.

## L'aprovació

Aproves esta versió exacta per la seua empremta curta, amb la signatura de Touch ID o d'una clau de pas (la confirmació escrita no basta per a dades personals). Qualsevol canvi en el codi, en el manifest o en esta fitxa la invalida. Caduca als 90 dies. És una aprovació separada de les altres: aprovar l'Escàner no aprova el Tauler, i per a abocar els extractes cal també la del Tauler.

**Què protegix i què no.** L'aprovació d'este navegador evita l'execució accidental o d'una versió que no has llegit, i el selector de carpetes exigix un gest teu. No protegix davant d'un programa que ja controle este navegador o el teu perfil; per a l'execució per agents, la clau de confiança ha d'estar fixada fora del seu abast (lease).
