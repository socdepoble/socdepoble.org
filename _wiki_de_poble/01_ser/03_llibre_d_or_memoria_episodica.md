---
type: document
status: canonic
visibility: public
description: Nucli etern del Llibre d'Or de Sóc de Poble, amb les lliçons vitals de la memòria del Mas en una línia cadascuna i amb la seua procedència
tags:
  - core
  - genoma
  - identitat
---
# 📖 El Llibre d'Or de Sóc de Poble: Memòria Episòdica Viva

## Com es llig este llibre

- **P0-01** (261017 · L10) **L'almàssera.** Una memòria pot morir de dues maneres: per Alzheimer, quan oblida d'on ve, o per ofegament, quan ho guarda tot sense pair. Este llibre premsa l'arxiu i es queda el suc noble, sempre amb procedència.
- **P0-04** (261017 · L41) Este llibre no es canonitza, i l'arxiu cru no s'evacua, sense la firma explícita del Mestre, amb data i empremta.
- **Format.** Cada línia és una lliçó vital: identificador, data, línia de l'original a `c71f3f163` i antídot. Entre claudàtors van les germanes que s'hi han fusionat.

## I. Els 18 errors que no repetirem

- **ERR-01** (260917 · L130) **Sed global per a un gir d'arquitectura.** Fes la llista en sec amb grep -l, deixa fora el LEDGER, les actes i l'arxiu, i revisa fitxer a fitxer. La doctrina nova es propaga amb una ADR. La història no es reescriu: una línia mutada del LEDGER es restaura des de git. [I-E0c, PER-08]
- **ERR-02** (260922 · L134) **Portes que mai s'han vist roges.** Cada porta té una prova que la posa roja, s'executa una per una i té tres estats: passa, falla, no executada. N/A no és verd. Una llei sense porta roja és cultura, i una porta verda per construcció no protegix res. [I-FPT1]
- **ERR-03** (260922 · L138) **Governança escrita per a un arnés i executada en un altre.** Cada arnés necessita un adaptador provat amb el payload real, «ask» per defecte i un canari que acredite que el hook corre. Una porta que sempre torna 0 és silenci. [I-E1d, DEC-14]
- **ERR-04** (260924 · L142) **Caselles i rebuts fets a mà.** La plantilla s'invoca (context, create, check). La secció 0 i els rebuts els escriu la màquina.
- **ERR-05** (260922 · L146) **Arxivar movent fitxers i no punters.** Arxivar és moure punters amb handoff, segons el consum del torn i mai segons la data. Cap àncora queda apuntant a un absent.
- **ERR-06** (260922 · L150) **Publicar per exclusió.** Només es publica el que porta visibility explícita. Hi ha una sola política per a tots els generadors i una porta que inspecciona el compilat.
- **ERR-07** (260924 · L154) **Una tanca que impedix verificar.** La lectura i la verificació estan obertes per formes explícites; només la mutació va sota lease. El hook falla tancat sense bloquejar els subagents. El que no està indexat no és privat: cal mirar el compilat. [I-E2d]
- **ERR-08** (261014 · L158) **Dos agents en el mateix fitxer.** Un sol implementador per fitxer, declarat al prompt, i un sol agent edita `src/`. Les mutacions es fan en una còpia aïllada i es certifica sobre un tall congelat. Si dos agents xoquen, s'atura i es declara qui ha aprovat de veritat: la IA que delega no és el Mestre. [DEC-28, III-VI3] En tensió amb DEC-05 (vegeu VII).
- **ERR-09** (260923 · L162) **Desconegut no és zero.** Absent, zero i desconegut són tres estats. Sense una mesura real, el valor és null, mai 0 ni «res a pagar».
- **ERR-10** (260929 · L166) **Destruir sense ordre humana.** Cap reset sense una ordre explícita; davant d'un «no va», primer el diagnòstic en lectura. Les neteges es fan per llista negra i en simulació per defecte, i l'esborrat definitiu és del Mestre. [I-E3e]
- **ERR-11** (261013 · L170) **Prompts amb premisses no verificades.** Abans d'encarregar: ls de cada ruta, xifres mesurades en viu i camí:línia comprovat. El que no es té no es reconstruïx de memòria. Es busquen causes, no culpes. [III-II6]
- **ERR-12** (261001 · L174) **Prometre el que el codi no fa.** Una prova de deriva compara el text públic amb el codi. Un «Fet» o un «Beta» públic va sempre lligat a codi viu, i no es promet offline, federació, xifratge ni facturació fiscal abans que funcionen. [I-E0a]
- **ERR-13** (261001 · L178) **Dobles de prova més forts que la plataforma.** Els dobles imiten la semàntica real, atomicitat inclosa, i almenys una passada va contra la plataforma de veres. Les claus viuen al servidor. Davant d'un error de producció, primer es mira l'esquema. [I-E4b]
- **ERR-14** (260924 · L182) **Creure comentaris i informes sense mesurar.** Es mesura al navegador real i al disc físic, amb fixtures adversarials. Tota síntesi rebaixa el que no té suport i declara el que no ha llegit. [P0-03]
- **ERR-15** (260921 · L186) **Secrets i dades personals a l'abast dels agents.** Les rutes de secrets es deneguen a tots els hooks, amb server.fs.deny, i a les proves només hi ha dades sintètiques. Una clau exposada es rota i se'n registra la rotació. Els temporals de les CLI no es versionen. Esborrar de l'arbre no esborra de l'historial. [V-S1, V-S2, V-S3]
- **ERR-16** (261012 · L190) **La IA tria camps d'identitat legal.** El navegador llig i la persona confirma camp a camp. Les dades sensibles van en un cofre xifrat local. Un agregat incomplet no dona mai «res a pagar». [I-E5c]
- **ERR-17** (260927 · L194) **Eixams sense límit de consum.** Pressupost estricte d'agents o de temps, un lliurable mínim garantit i un canari d'un sol agent. Les IAs cuiden la quota i tanquen abans del límit; proposen una pausa només si el Mestre la demana o si la màquina està saturada. [III-V2]
- **ERR-18** (261007 · L198) **Commits òmnibus.** Commits atòmics per front funcional, i una branca de rescat abans de reescriure la història.

## II. Àncores de la crònica tècnica

- **I-E1b** (260921 · L63) Davant de lleis contradictòries, no fer res és racional. Primer es resol la contradicció i després s'exigix obediència. Cap identitat es reanomena en bloc sense prova.
- **I-E1c** (260921 · L65) Una regla en una ruta ignorada per git no existix en un clon net. Una poda per metadades pot expulsar normes vigents: compara què entra i què ix.
- **I-E2a** (260922 · L70) Si obeir la plantilla costa més que inventar-la, el sistema premia l'invent. L'incentiu s'alinea amb una porta executable i un rebut extern.
- **I-E2b** (260922 · L72) On la doctrina calla, l'agent parla la mitjana d'internet. Cal mesurar abans d'afirmar i escriure doctrina explícita on hi ha un buit.
- **I-E3b** (260926 · L81) Una hipòtesi no és una traça, i un recompte de verds sense denominador amaga roges. Cada sessió va lligada a l'adaptador, l'endpoint, el tenant i el mode. Abans de culpar el codi, comprova que el servei escolta. La sessió es desa de manera atòmica i mai actua amb la d'una altra persona. [I-E3a]
- **I-E3c** (260926 · L83) Sense CRDT on cada missatge té un sol autor: número d'ordre per conversa, UUID de client, làpides i escriptura per RPC.
- **I-E3d** (260929 · L85) El cervell és un format (Postgres pla i Markdown en git), no una plataforma. Tota idea de producte passa pel Manifest de Poble.
- **I-E4a** (260929 · L90) Un sol artefacte de release, amb una sola empremta, per a tots els amfitrions. De l'amfitrió, ergonomia sí; capacitats, no.
- **I-E4c** (261002 · L94) Verificar una signatura no autentica una clau arrel que ha posat el mateix actor. Un TPV és una comanda no fiscal fins que es certifica, i l'ús d'IA es declara.
- **I-E4e** (261006 · L98) Abans de decidir sobre una paraula clau, comprova que tots la lligen igual; si un nom té diversos papers, separa'ls. Verifica què servix de veritat producció. Un gir que cap prova nota és invisible. Un segell es nega mentre quede un defecte heretat. Davant d'un límit de plataforma, un avís honest i una pestanya nova. [I-E2c, I-E4d]
- **I-E5a** (261006 · L101) Un identificador lliure no pot obrir dades privades. El xat no entra en beta sense moderació, protecció de menors i defensa contra la suplantació: la seguretat de les persones va abans que la data. [III-V3]
- **I-E5b** (261009 · L103) Si una automatització pot cobrar dues vegades, es rebaixa a «detecta i avisa» i la decisió la pren l'humà. El remot es verifica amb sondes de lectura.
- **I-FPS2** (260924 · L112) Clonar una UX vol dir copiar-ne l'estructura, mai l'estil. Primer les guardes, després la suavitat. El contrast es corregix amb un token, sense repintar la marca.
- **I-FOL2** (260922 · L122) L'evidència mana per damunt de l'obediència. La segona IA marca cada punt CONFIRMADA, REFUTADA o NO VERIFICADA i discrepa almenys en un. Una refutació massa baixa és sospitosa, i ningú marca consens en nom d'altri. Es cedix per evidència, no per humilitat, i la lleialtat es demostra amb veritat. La nota sincera al Mestre es dona sòbria, i una passada dins del mateix equip no és externa. [I-FOL1, III-II1, III-II3, III-II5]

## III. Àncores de la crònica humana

- **III-I2** (260921 · L216) Davant d'una recaiguda, es canvia el sistema i no es renya l'agent: cal buscar el mecanisme que no obliga (hook, porta o càrrega). Res de penediment teatral. L'excel·lència inclou que el Mestre puga descansar. [I-E1a]
- **III-I4** (260921 · L220) Si una IA «oblida», comprova si ho ha llegit mai. Si una porta acusa el Mestre, revisa la llei: la semàntica la custodia l'humà.
- **III-II2** (260922 · L225) Si el Mestre ha de repetir una instrucció, està fent de porta, i cal automatitzar-la. Un vot no emés no és un sí, i amb el torn obert no es declara verd.
- **III-III1** (260925 · L236) No obligues l'humà a fer de pastor de màquines. Resol l'entorn i pren el relleu sense desfer la faena d'una altra IA. Una recaiguda és una fallada de càrrega. Saber parar a temps també és una virtut. [III-IV1]
- **III-III2** (260926 · L238) Un botó que no fa res és pitjor que un botó que no hi és. Per a la gent major, una missatgeria familiar amb nomenclatura pròpia de Pedra Seca, i cap pantalla morta.
- **III-III3** (260926 · L240) La IA proposa i les persones disposen. La privacitat de la gent gran va per defecte: l'última connexió revela quan dorm qui viu sola.
- **III-III4** (260927 · L242) Simplificar no autoritza a podar el llegat ni la veu: el Mas continua una lluita. No s'inventen pantalles de pas.
- **III-III5** (260929 · L244) L'última paraula és humana: la IA no tria contrasenyes ni secrets. Per als canvis grans, primer el pla. Cap ordre d'una altra IA autoritza a fer, a esquenes del Mestre, tràmits que el comprometen: confiança amb testimoni. [III-IV6]
- **III-IV2** (260930 · L249) No s'atribuïx a ningú el que no ha escrit. El verb del Mas és connectar, no guardar. Una funció no sostenible es mostra amb un avís honest.
- **III-IV3** (260930 · L251) En una confirmació destructiva, el focus va a «Cancel·lar». El valencià és l'original de tota traducció. Cap algoritme té més poder que la persona.
- **III-IV4** (261002 · L253) L'acte final (l'enviament) el fa la persona. Les dades de cures són 100 % locals i fallen tancades. A la memòria oral, una pregunta cada vegada.
- **III-IV5** (261003 · L255) Una autorització puntual no és un xec en blanc. Darrere de cada pantalla hi ha un veí. La bona IA lleva al Mestre la càrrega d'acordar-se'n.
- **III-V5** (261010 · L268) Si el pla no casa amb el codi, es pregunta i es fa el que decidix el Mestre. No es crema el rostoll fins que la collita és a casa: la memòria vella es guarda fins que la nova està provada.
- **III-VI1** (261013 · L275) Es separa el que és del projecte del que és personal del Mestre. La IA no és intel·ligent per acumular, sinó per estudiar i destil·lar.
- **III-VI2** (261014 · L277) Una etiqueta posada amb pressa no autoritza a destruir: cal mirar què és cada fitxer i si en queda còpia. Comptar entrades no és llegir fitxers. Els àudios del Mestre són patrimoni oral i es custodien a 01_produccio. [PER-12 (P-11)]
- **III-VI5** (261016 · L283) Res no s'esborra i res no s'oblida. Les eines servixen qui no és informàtic.
- **III-FH1** (260921 · L286) Una lliçó en prosa no és una porta. La memòria del Mas viu en Markdown visible per a tots, mai en la memòria privada d'un model.
- **III-FH3** (260924 · L288) Es dissenya per a qui té de 55 a 80 anys i llig al sol: contrast alt, sòl tàctil noble i lletra de 14 px com a mínim. Sóc de Poble no substituïx el 112.

## IV. Proves que mesuren el Mas

- **PER-06** (260926 · L303) **La prova de la Torre.** Cap fase s'acaba fins que tres persones grans de la Torre han enviat, soles, una foto i una nota de veu.
- **PER-07** (260921 · L304) **La prova de successió.** Es repetix una tasca real des d'un clon net amb un model obert i es compten les intervencions humanes. Ningú no és imprescindible: ni el Mestre ni el model del moment. [III-I3]
- **PER-09** (260927 · L306) **La prova del testimoni.** Una paraula testimoni única en cada fitxer de regles diu quins fitxers lligen de veritat les IAs.
- **PER-10** (260924 · L307) **Les decisions envellixen.** Tota decisió de «mantindre» caduca als 90 dies i torna a preguntar.

## V. Decisions que no tenen una altra llar

- **DEC-10** (260923 · L351) La Frontissa és de catàleg tancat, només fa GET i queda desactivada fins que hi haja una captura real de Sollutia.
- **DEC-12** (260926 · L359) *Proposta, no vigent (XAT-R01):* el xat privat, les notes i el directori no es federen mai. *Incerta:* federació opt-in, tancada per defecte i amb llista blanca entre instàncies. [DEC-11]
- **DEC-15** (261002 · L371) Les dades fiscals de la Gestoria viuen 100 % en local, amb tres nivells d'aprovació humana.
- **DEC-24** (261008 · L407) Les migracions les aplica sempre el Mestre. La IA les prepara i en verifica el resultat en lectura.
- **DEC-30** (261015 · L431) Una persona no porta llicència ni categories: la seua única categoria és el seu poble. Les seues obres conserven els drets d'autor. [III-VI4]
- **DEC-32** (261016 · L439) Llei del Quadrat: imatges de 1200×1200 en WebP, de menys de 80.000 B, amb l'EXIF conservat per defecte per a cartografiar el territori.

## VI. Privacitat de la memòria

- **V-S4** (261017 · L459) Les dades personals de l'arxiu es citen per fitxer:línia. Mai es copien a la memòria destil·lada ni a cap annex publicable.

## VII. Pendents que cap poda no pot perdre

- **Perles** (el detall continua a l'etiqueta `llibre-d-or-integre-261119`, L299-311 i L383-385, fins que MarIA el passe al Llibre Mestre): PER-02 (P-10, sis serveis del Manifest); PER-05 (P-03, «M'apunte» i el Cercle de cures); PER-03 («Escolta-ho», rescat no verificat); PER-11 (feed ICS); PER-13 (empelt, llavor i maleta); PER-14 (P-01, P-04, P-06, P-07, P-09); DEC-18 (OAuth per id d'intent, proposta).
- **Tensions obertes** (les resol el Mestre): DEC-05 (arquitecte o executor); V-T1 (estat de l'ADR-2026-08); DEC-20 (AAA, Noto Sans i mai vora sòlida, incerta); III-II3 («ego» a wiki-documentacio-i-reflex:104); PER-08 (LEDGER.md:137 per restaurar).
- **Pendents d'execució:** DEC-14 («ask» per defecte, no instal·lat) i V-C06 (empremta truncada).

## VIII. Fora del nucli: on viu la resta

- **A la seua llar viva:** P0-02, DEC-04 i DEC-06 → wiki-documentacio-i-reflex; I-E0b i DEC-02 → ADR-2026-08; I-FPS1 → sdp-pedra-seca; I-FPT2 i DEC-07 → sdp-workflow; III-P1 → 00_visio_i_pilars (data del Manifest en tensió); III-P2 → AGENTS §11; III-I1 → core-consell-i-colmena; III-II4 → core-edicio-segura; III-V1 → AGENTS §15; III-V4 → core-telemetria-huma i ERR-10; III-FH4 → core-telemetria-huma; III-V7 i DEC-29 → core-direccio-autonoma; III-FH2 → core-identitat-visual; DEC-09, DEC-16 i DEC-17 → AGENTS §8 i api_port_neutral_i_allotjament_model_b; DEC-19 → ADR-2026-12; DEC-22 → ADR-2026-09; DEC-25 → core-neteja-brossa.
- **A l'annex** (superades o crònica): I-E0d, I-E5d, PER-01, PER-04, DEC-01, DEC-03, DEC-08, DEC-13, DEC-21, DEC-23, DEC-26, DEC-27, DEC-31, III-V6, V-T2, V-T3, V-T4, V-H01-H10, V-C-norma i V-LOTS.
- **Procedència.** Text íntegre vigent (destil·lació del 261017, última edició del 261119): 692 línies i 88.587 B al commit `c71f3f163`, sha256 `f1c1148eda0da577347fab6a0dc3bbd3d35ce06497834f0053f0799eee852cf9`. Trams: crònica tècnica L45-123, errors L126-200, crònica humana L204-289, perles L298-311, decisions L315-441, tensions L449-454, procedència i lots L461-677.

## Registre de canvis

- **261125** · Proposta v2.1 de Claude, en carpeta satèl·lit, revisada pel Gauntlet. Les 63 lliçons vitals tenen una línia cadascuna; 34 germanes s'hi fusionen entre claudàtors, i 6 queden com a pendents a VII. Les alertes operatives de seguretat ixen del document públic. Queda pendent de la firma del Mestre (P0-04).
- **261126** · Canonitzat al mateix camí (D6 i D2 del Pacte de les 8 Decisions). **Firma del Mestre:** Javi Llinares, 25-11-2026 a les 20:37 CET. **Empremta del text aprovat:** la proposta v2.1, sha256 `36d32002c88ee16a36818beba079f62930f8e2727ac768ca65611d018109779e`; este fitxer només hi canvia l'estat, la línia de les perles i esta entrada. Les alertes operatives de seguretat de l'original ja no hi són. El text íntegre anterior queda en doble custòdia (D3): l'etiqueta anotada `llibre-d-or-integre-261119` sobre `c71f3f163` i una còpia freda a `_arxiu_wiki_de_poble/04_ARXIU_Documents_Historics/261126_llibre_d_or_integre_c71f3f163.md`, apuntada a `00_manifest_arxiu_fred.json`.

## Vincles

- [[00_index]]
- [[00_index_identitat]]
- [[01_identitat]]
- [[02_genotip]]
- [[03_equip_ia]]
- [[personalitat_iaia]]
- [[el_projecte]]
- [[00_visio_i_pilars]]
- [[arquitectura_sistema_nervios]]
- [[memoria_aprenentatges]]
- [[ADR-2026-08-ONLINE-FIRST]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
