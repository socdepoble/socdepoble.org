/**
 * xifratXatParaules.js — la llista de paraules de la frase de recuperació
 * dels xats privats (P1-12 / IDEA-19; disseny_final_e2ee.md §5.1-§5.3, DM-2).
 *
 * PENDENT DE LA REVISIÓ DEL MESTRE (DM-2). Esta llista v1 no es pot activar
 * fins que el Mestre l'haja revisada: REVISADA_PEL_MESTRE ho diu en el codi i
 * la porta (tooling/gates/porta-paraules-recuperacio.mjs) ho recorda. Mentre
 * siga pendent, qualsevol paraula es pot canviar per una altra que passe la
 * porta (i es recalcula l'empremta). Activada, la v1 queda congelada: una v2
 * només pot corregir l'ortografia mantenint els índexs, i `llistaVersio` va
 * dins de l'entrada de la KDF (§5.1).
 *
 * La frase són sis índexs d'11 bits (66 bits): 2.048 = 2¹¹ paraules, i
 * getRandomValues sobre un Uint16Array amb la màscara 0x7FF no té biaix,
 * perquè 65.536 és múltiple de 2.048 (§5.2). La persona no tria mai les
 * paraules. La KDF va sobre els índexs, no sobre el text (els 9 B de l'entrada
 * SDPR els escriu xifratXatFormats.js): un accent, una majúscula, un teclat en
 * castellà o una ela geminada escrita d'una altra manera no canvien la clau.
 *
 * Les regles de la llista (§5.3), que fan complir la porta i
 * xifratXatParaules.seguretat.test.js:
 *   · exactament 2.048, de 3 a 8 lletres, úniques després de plegar;
 *   · prefix únic de 4 lletres, o la paraula sencera si en té 3 (i cap
 *     paraula de 3 lletres és el començament d'una altra): l'autocompletat
 *     sap quina és després de 3 o 4 lletres;
 *   · Levenshtein ≥ 2 després de plegar i clau fonètica única (b/v,
 *     tx/ix/x, ss/s/z, ç/s i c davant e/i, g/j davant e/i, h muda);
 *   · sense ela geminada, apòstrof ni guionet; cap plural d'una altra entrada;
 *     res que comence per l'arrel vetada per a la plataforma (la plataforma
 *     és el Mas); cap paraula ofensiva, trista, religiosa, política, de doble
 *     sentit, nom propi, marca ni anglicisme.
 * Ordenades pel plegat (comparació de codis, sense configuració regional):
 * l'índex de cada paraula és la seua posició.
 *
 * Sense dependències ni consumidors: els mòduls de recuperació el carregaran
 * amb import() dinàmic (§5.3). L'objecte `cripto` (getRandomValues)
 * s'injecta sempre, com al cofre de la Gestoria; ningú d'ací el pren de cap
 * global. Les paraules no passen per t(): una frase s'ha de poder restaurar
 * en un aparell en qualsevol llengua (§5.3).
 *
 * Empremta SHA-256 de la llista v1 (UTF-8, una paraula per línia, salt final):
 *   d752293a2893bdcb15065bd3314fefa87fc36a00e5fe45be6dc26cfb78100098
 */

export const VERSIO_LLISTA = 1;
/* Pendent de DM-2: només el Mestre ho passa a true, i fins llavors cap
   consumidor no ha de generar frases reals amb esta llista. */
export const REVISADA_PEL_MESTRE = false;
export const NOMBRE_PARAULES = 2048;
export const BITS_PER_PARAULA = 11;
export const PARAULES_PER_FRASE = 6;
export const BITS_FRASE = 66;
export const LLETRES_PREFIX = 4;
export const EMPREMTA_LLISTA = 'd752293a2893bdcb15065bd3314fefa87fc36a00e5fe45be6dc26cfb78100098';
const MASCARA = 0x7ff;

const LLISTA_V1 = `
àbac abans abast abella abeurar abocar abordar abraçar abril abundant acabar acàcia acadèmia
acampada acaronar acceptar acer àcid aclarir aclucar acollir acomodar acordió acostar acotxar
acrílic acròbata acte actiu actor actuar acudit acurat acústic adagi adaptar adequat adient
adjacent adjunt admirar adob adonar adopció adormit adreça adult adverbi aeri aeroport afaitar
afany afecte afegir afició afinar afirmar aflorar afluent aforisme agafar àgata agenda àgil
agitar àgora agost agradar agre agrícola agrònom agrupar aguantar àguila agut ahir aigua ailant
airejar aixada aixeta aixopluc ajornar ajudar ajuntar alabança aladroc alambí albarda albercoc
albirar àlbum alçar alcova aleatori alegre alenar alfàbega alfil alforja alga algeps aliatge
aligot aliment aljub allargar alleujar allioli allotjar allunyar almanac almesc almud alosa
alpaca alpí altaveu altell altiplà altura alumne alvèol alvocat amable amagar amanida amarg
amatent ambient ambulant ameba ametla amfibi àmfora amic amidar amistat amollar amor ample amunt
ananàs anar àncora andana ànec anèmona anfós angle anhel animal anís annex anotar antany antena
antic anual anunci anxova anyada anyell anyil aparador apetit àpex apícola apilar aplaudir aplec
aplicat aplom apogeu aportar aprendre aptitud aquari aquós aranya arbitrar arboç arbre arbust
arcada arena argent argila argolla argument aritja arlequí armari armilla arnadí arnès aroma
arpa arpegi arquet arracada arrel arribar arròs arruga artesà artista ascla asèptic asfalt
aspecte aspirar assajar asseure assistir assolir assut asterisc astre astúcia atall atent
aterrar atipar atles àtom atònit atrapar atrevit atuell aturar atzavara atzerola atzur auca
audaç auditori auge aurífer austral autèntic autòcton avaluar avançar avellana avenc avet aviat
avidesa avinguda avió aviram avisar axial axioma azalea
babuí bacallà bací badall badia baf bagatge bagul baix bajoca baladre balcó baldufa ball bàlsam
bambolla bancal banda banquet banyera barana barber barca bardissa baríton barnús barquer
barraca basalt bàscula base bàsic bassa bastó batedora batre batuta bebè bec bedoll begònia
beguda bellota benestar berenar bergantí besar bescuit bessó bestiar betum beure biberó bidó
bienni bifurcar biga bigot bilingüe billar binari biombo bípede bitlla bitxo blanc blat blauet
blavós bobina boca bocoi bogavant boira bolcar bolet bolígraf bolquer bombeta bonança bondat
bonhomia bonic boreal borla borratja bosc botar botella botijó botxa bramar branca braser
bressol brevetat brida brillant brindar brioix brocat brodar brollar bromera bronze bròquil
brossa brot bruc brumós brunzit bucal bucòlic bufar bufet bufó bugada buit bulb bullir bunyol
burro buscar bústia butaca
cabana cabdell cabestre cabirol cable cabra cabussar cacau cactus cadafal cadena cadira café
caixa calamar calcetí caldera calent calfar càlid callat calma calor camaleó cambrer camèlia
camisa camp camussa canari cançó candor cànem cangur canícula canonada càntir canut canviar
canya caoba capaç capçal capgirar capítol capó capritx càpsula captar caputxa caqui caragol
carbó card carener cargolet carícia carmí carnaval carpeta carrer carta carxofa casa cascada
casella cassola castanya catifa caure cautela cavall càvec ceba cedre cel cendra centre cenyir
cercar cereal cert cérvol cessar cetaci ciclamen ciència cigne cigonya cigró cilindre cimal
ciment cinema cingle cinturó cinyell circ cirera cisell cistella cítric ciutat civada clapa
clarinet classe clauer clavell cleda clenxa client clima clivella cloenda clofolla cloïssa
closca clot cobai coberta cobla cocodril còdex codony coet cofoi cognom cogombre coherent coiot
coixí colador coliflor collita colom colrat columna colze comarca combinar cometa comí còmode
comprar concert conduir conéixer confort congost conill conjunt conrear conserva conte convidar
cooperar copiós coral corb corda cormorà corneta correu cortina coscoll cosir cosmos cossiol
costera cotna cotó cotxe cova cranc cràter creatiu creïlla crema cresol creure criar crinera
cristall criteri crònica croqueta crosta crucial cruixent cruspir cubell cubilet cucut cuereta
cuidar cuina cuir cullera cultura cúmul cunyat curar curiós cursa curull
dacsa daina dàlia dansaire darrere dàtil daurat davantal dècada decidir decorat dedicar definir
degustar deixar delectar delicat delta demà dempeus dens déntol derivat descans desembre desfer
desgel desitjar despensa dessota destral devesa diadema diàfan diagrama diàleg diamant diari
dibuixar dictat didal dieta difusió digerir digital dignitat dijous dilatar diligent dilluns
diluir dimarts dimecres dinar diploma diptong directe dirigir disc disposat dissabte distint
diumenge diürn divan divertit dividir divulgar doblec docent dòcil dofí dolçaina dolmen domàs
domèstic dòmino dormir dorsal drac dragó drapaire drecera dret dringar dúctil duna duplicar
durada dutxa
ebenista eclèctic eclipsi eclosió eco edat edició edifici editor educat eficaç efímer efusiu
egua eina eixam eixerit eixir eixut elaborar elàstic elèctric elefant element elenc elevar elogi
eloqüent embarcar emblema embotit embut èmfasi eminent emoció empàtic empeltar emplenar emprar
emular enamorat encant encendre enciam enclusa encreuat endavant endemà endívia endoll endreçar
energia enfeinat enfilar enfornar enganxar engegar enginy engolir engrunar enguany enigma
enlairar enllaç enòleg enorme enquesta enrere ensumar entorn entrepà enumerar envà envelat
enviar envoltar èpic epígraf epíleg episodi equador equip eriçó erudit eruga esbarzer esbós
esbrinar escarola escena esclat escola escriure escull esfera esforç esglaó esgranar esmalt
esmentar esmorzar espart espelma espígol esplai esponja espurna esquirol essència estable
estendre estiu estora estrela estufa esvelt etapa etiqueta eufonia evident evitar evocar
evolució exacte exagerar excavar exemple exercici exhibir exigent existir exòtic expansió expert
explicar exprés extens
fàbrica fàbula façana faceta fàcil fada faener fagot faisà falç falguera fallera família famós
fanal fandango fanfara fang fantasia farcell farina farmàcia farratge fartó fauna favor febrer
fecund feliç feltre fenàs fenc fènix fenomen ferm ferrar fèrtil fesol festa fetge fibra ficció
fideu figuera filar filera filferro filosa finca finestra fiord física fita flabiol flaire flam
flascó flauta fleca fletxa flexió flonjo flor fluix fluvial foc fogassa fogó foia follet folre
fonament fondo fonoll font forat formatge forn forqueta fòssil fotja fotògraf fracció fràgil
fratern fred fregall freixe freqüent fresca frontó frugal fruita fulgor fulla fumeral funda fura
furgó fusible fuster futur
gàbia gafarró gaiato gairebé gaita galàxia galeta gallina galop gamba gana ganivet ganxet
garatge garbell garlanda garota garrofa garsa gasela gasosa gaspatxo gat gaubança gaudir gavina
gebre gegant gelada gener genial genoll gentil genuí geoda gerani germà gerret gesmil gespa gest
gibrell gimnàs ginesta ginjol girafa glaç gladiol gleva glicina globus glossa góndola gorg gorra
gos gotejar gotim gràcia gradual graella grafit gram graner grapat gratar graula grava gregal
grill grimpar gripau gris groc gronxar grua gruixut guaitar guanyar guardar guatla guepard guiar
guinda guió guisat guitarra guixa gustós
hàbil hamaca harmonia havanera hectàrea hèlix herba hermètic heura hexàgon hibernar híbrid
hidrogen higiene història hivern home homònim honest honrat horari horitzó hort hoste hotel hui
humit humor
idea idèntic idioma idoni iglú igual illot imaginar imant imatge imitar immens impàvid imponent
impremta impuls inaudit incert inclinar indiot indret inèdit inèrcia infant infinit inflar
infusió inici innat innocent insecte insistir insòlit inspirar instant intens intrèpid intuïció
invent invitat irisat isard istme ivori
jaciment jade jaqueta jardí jaspi joglar joguet joier joiós jolgori jonc jonquill jornal jota
jove jubilat jugar julivert juny just juvenil
laberint lacònic lacustre làmina làmpada larva latitud laureat lavabo lector lèmur lèxic liana
lilà límit límpid lingot línia linx líquid líric litoral litre llacuna llagosta llamp llanda
llapis llard llata llaüt llavor llebre lledoner llegir lleixiu llenya llepolia llesca llet
lleuger llevat llibreta lliçó lligam llimac lliri llis llitera lliure lloable llobarro llogar
lloma llonguet llop llorer llotja lluç llúdria lluert lluir lluna lluquet llustrós lòbul loció
lògica longitud lucidesa lúdic lumínic lunar lupa
mabre macarró madeixa madrilla madur magenta màgia magnòlia magrana maig mainada maionesa
majòlica mallol maluc malva mamífer mamut manat maniquí manobre mansió mantega manxa manyós mapa
màquina maragda març marfull marge mariner marjal marrà martell matalaf material matí matoll
màxim meandre mecànic medalla meditar medusa meitat melassa melindro meló menejar menhir
menjador menta mercat merenga meridià merla mesclar mesurar metall meteor mètode metre mico
migdia migjorn milotxa mímica mimosa mineral mínim minut minyó mirar missatge mistela mite
mitjanit mixet moble mocador moda modern modista mofeta moixama moldre molí molsa moltó moment
moneder moniato monsó moqueta morera morter mosaic mosca mosquit mostrar motiu motlle motxilla
mudar mufló mula mullat multitud munió muntanya munyir murmuri murta múscul museu música mussol
nabiu nacre nadar nadó nàixer nansa narrar nas natació natura nàutic navegar nebot nebulosa
nècora nèctar nenúfar neolític nespra netejar neu nevada nevera nexe niar ninot nit nivell
nocturn noguera nòmada nombrós nòria nostrat notable notícia novembre nugat nutrir núvia núvol
nyora
oasi obaga obedient obert objecte oblada oblic oboè obra obrir obscur observar obtenir obvi
ocarina ocasió oceà ocell oci ocórrer ocre octava octubre oculista ocupar ocurrent oferir ofici
oleós olfacte òliba olier olivera olla olorar ombriu omnívor omplir oncle ondejar ondulat ònix
òpal opció opinar òptic opulent orada oratge òrbita ordenar ordi ordre orejar orelleta orenga
orfebre orgànic orient origen ornament oroneta orquídia orsa ortiga orxata ostra ovació ovalat
ovella
pacífic paella pagès pàgina pairal paisatge pala paller palmera palpar pàmpol panera panorama
pantaló pany paó papagai paper paquet paraigua paret parlar paròdia parpella partida passejar
pastís patinet pavelló pebrella peculiar pedaç pedrera peix pelar pelicà pell pelussa pèndol
penombra pensar pentinar penya pera perdiu perenne perfum pergamí pericana permetre pernil perol
perruca persiana pèrtiga pesat pescar pestanya pètal petúnia petxina piano picarol picot
pictòric pigment pilota pinassa pineda pingüí pinsà pintor pinyol pinzell pioner pipa piragua
pirita piscina pissarra pistatxo pitxer plaça plaer plafó planter plàtan plegar plomall ploure
plugim pluja plural poal podar poesia poeta poliol pollí polp polsera poltre poma poncem ponent
popular porc porpra porquer porticó porxe posada positiu postal potser pou pràctica prat preciós
predir preferir pregunta preludi premsa preparar préssec preu previ prim prisma proa produir
profund progrés prolífic prompte pronom propina protegir provar pròxim prudent pruna pua puig
pujar pulcre punta punxó pupitre puput puré
quadra quallada quars quasi quedar queixal qüestió quiet quilo química quiosc quisso
rabassa rabent rabosa racó radiador ràfec raïm rajada rajola rambla rampa ranura ràpid rascassa
rasera raspall rastell rata ratlla ratolí ratpenat raval reacció rebedor rebost rebrot recer
recinte recordar recte recull redó reduir referent refilar reforç refresc refugi regadora regió
regle regular reixa relat rellotge remar remei rèmol remullar renill renom rentar repartir
repetir replegar repòs rèptil requisit reserva resina resoldre respirar resum retallar retornar
retrat reunió revetlla revista revolt rialla ribàs ribera ribot rierol rima rínxol ritme riu
rizoma robí robust rodanxa rodet rodolar rogenc roig rol rombe romer rompent rondalla rosa
rosella rossí rostoll rotació rotllana rotund roure rovelló rugós ruixat rumb rupestre rupit
rural rusc rústic
sabata sabó safareig safir safrà saga sainet sajolida salaó saler salina salmorra salpa salsitxa
salt saludar salvar salze samaruc sambori samfaina sandàlia sanefa sarau sardina sargir sarment
sarró satisfet saüc sauló savi secció seda sedós segment sègol segur seient selecte sella
semàfor sembra semestre sèmola sempre senalla sendera senglar sénia sensible sentir senyal
senzill separar séquia serenor sèrie serjant serp serrell serva sèsam sessió setembre setí
setmana setrill sidra sifó sigla signar sílaba silenci silueta símbol simetria simfonia similar
simpàtic sincer síndria singular sinònim síntesi sirena sistema sitja situar sobretot socarrat
sòcol sofregit solana solc solfa sòlid solstici solució somera somiar somni sonall sonet sonor
sopa sopluig soprano sorbet sorell sorpresa sostre sotabosc sovint suau suavitat submarí subtil
sucós sucre sud sufix sulfat sumar superar suport suquet surera suro sutge
tabal tàctil taiga talaia tallar talp talús tamarit tamboret tancar tàndem tango tapadora tapís
taquilla tardor tarima taronja tartana tascó tastar taula tavà tavella teatre tebi teclat
tècnica teixó telèfon tellina telúric temàtic tempesta tenaç tenca tendre tenor tènue teoria
terbolí terme terra tertúlia tetera teulada textura tibar tigre tija timbal tímid timó tinta
típic tipus tisana titella títol tocar tòfona tolerant toll tomaca tonada tonell tonyina topall
tord tornavís torró tortuga tossal total tovalla traca tradició traginer trajecte tramús
tranquil trapezi trasllat traure travessa tremp trenar trepant trespol trèvol triangle tricot
trigar trilla trineu triomf trípode triscar tritó trobar trofeu trompeta tronc tròpic tros
trucar trufa trull tuba tubercle tudó tulipa tundra tupí turbina turista turmell turquesa
ubicar udol ufanós ull ultramar unànime ungla unicorn unir unisó unitat univers untar urbà usar
usual utensili útil utopia
vaca vailet vainilla vaixell valentia vals valuós vàlvula vànova vapor vaquer varietat vast
vedell vegada vegetal veïnat vela veler vellut veloç vendaval venedor venir vent verat verbal
verd verema verger veritat vermelló vernís verro vertical vesprada vestit vetlar viable vianant
viatjar vibrar vida vidre vigent vigilar vigor vímet vinagre vincle vinya violeta virtut visera
visita visó vistós visual vitamina vitícola vitrina vivaç vivència vocal volar volcà voltor
voluntat vora
xabec xafogor xai xalet xaloc xamfrà xampinyó xancla xaranga xarop xarranca xarxa xatrac xàvega
xeremia xerinola xerrac xicotet xicra xilòfon xinxeta xiquet xirivia xitxarra xiular xocolate
xofer xollar xop xoriguer xufa xumet
zebra zenit zinc zona zoo
`;

export const PARAULES = Object.freeze(LLISTA_V1.trim().split(/\s+/));

/* Un error amb codi estable, perquè la pantalla decidisca què diu. */
export function errorAmbCodi(codi, missatge) {
  const error = new Error(missatge);
  error.codi = codi;
  return error;
}

/* Les marques que la gent fa servir per a la ela geminada: el punt volat i
   els seus semblants, i el punt baix dels teclats que no en tenen (la ŀ
   precomposta ja es descompon en «l·» amb NFKD). El guionet no hi és: separa
   paraules més sovint que no fa d'ela geminada. */
const ELA_GEMINADA = /l[\u00b7\u0387\u2027\u2219\u22c5\u2022\u30fb\uff65.]l/g;

/**
 * Plega un text per a comparar paraules: NFKD (també les lletres d'amplada
 * completa), minúscules, sense diacrítics (ç → c, ï → i) i qualsevol ela
 * geminada → «ll». No traduïx ni corregix res més.
 */
export function plega(text) {
  return String(text).normalize('NFKD').toLowerCase().replace(/[\u0300-\u036f]/g, '')
    .replace(ELA_GEMINADA, 'll');
}

const PLEGATS = Object.freeze(PARAULES.map(plega));
const PER_PLEGAT = new Map(PLEGATS.map((f, i) => [f, i]));
const PER_PREFIX = new Map(PLEGATS.filter((f) => f.length > 3).map((f) => [f.slice(0, LLETRES_PREFIX), PER_PLEGAT.get(f)]));

/* Falla tancat en carregar: si la llista no és la que diu ser, cap frase s'ha
   de poder generar ni llegir amb ella. */
if (PARAULES.length !== NOMBRE_PARAULES || 2 ** BITS_PER_PARAULA !== NOMBRE_PARAULES || 65536 % NOMBRE_PARAULES !== 0
  || PER_PLEGAT.size !== NOMBRE_PARAULES || PER_PREFIX.size + PLEGATS.filter((f) => f.length === 3).length !== NOMBRE_PARAULES) {
  throw errorAmbCodi('LLISTA_INVALIDA', 'La llista de paraules de recuperació no compleix el seu contracte.');
}

/**
 * L'índex d'una paraula escrita per la persona, o -1. Tolerant: sense accents,
 * en majúscules, amb l'ela geminada de qualsevol manera i amb signes de
 * puntuació al voltant. Si no és la paraula sencera, n'hi ha prou amb les 4
 * primeres lletres (són úniques); amb menys, cal la paraula exacta.
 */
export function indexDeParaula(entrada) {
  if (typeof entrada !== 'string') return -1;
  const f = plega(entrada).replace(/[^a-z]/g, '');
  if (!f) return -1;
  const exacta = PER_PLEGAT.get(f);
  if (exacta !== undefined) return exacta;
  if (f.length < LLETRES_PREFIX) return -1;
  return PER_PREFIX.get(f.slice(0, LLETRES_PREFIX)) ?? -1;
}

/** Les paraules que comencen per un prefix (per a l'autocompletat), com a molt `maxim`. */
export function suggeriments(prefix, maxim = 6) {
  const f = plega(prefix ?? '').replace(/[^a-z]/g, '');
  if (!f || !(maxim > 0)) return [];
  const eixida = [];
  for (let i = 0; i < PLEGATS.length && eixida.length < maxim; i += 1) {
    if (PLEGATS[i].startsWith(f)) eixida.push(PARAULES[i]);
  }
  return eixida;
}

/** Talla un text en paraules: qualsevol cosa que no siga una lletra separa (espais, comes, números de casella). */
export function trossejaFrase(text) {
  if (typeof text !== 'string') throw errorAmbCodi('FRASE_INVALIDA', 'La frase de recuperació és un text.');
  return plega(text).split(/[^a-z]+/).filter(Boolean);
}

function exigixIndexs(indexs) {
  const valid = (Array.isArray(indexs) || indexs instanceof Uint16Array) && indexs.length === PARAULES_PER_FRASE
    && Array.prototype.every.call(indexs, (i) => Number.isInteger(i) && i >= 0 && i < NOMBRE_PARAULES);
  if (!valid) throw errorAmbCodi('INDEXS_INVALIDS', `Una frase són ${PARAULES_PER_FRASE} índexs enters de 0 a ${NOMBRE_PARAULES - 1}.`);
}

/** Els sis índexs d'una frase escrita, o un error amb codi (i la posició de la paraula que no s'entén). */
export function indexsDeFrase(text) {
  const trossos = trossejaFrase(text);
  if (trossos.length !== PARAULES_PER_FRASE) {
    throw errorAmbCodi('FRASE_LLARGARIA', `La frase de recuperació té ${PARAULES_PER_FRASE} paraules.`);
  }
  return trossos.map((tros, posicio) => {
    const index = indexDeParaula(tros);
    if (index < 0) {
      const error = errorAmbCodi('PARAULA_DESCONEGUDA', `La paraula ${posicio + 1} no és de la llista.`);
      error.posicio = posicio;
      throw error;
    }
    return index;
  });
}

/** Les sis paraules (en la forma normativa, amb accents) d'uns índexs. */
export function paraulesDeIndexs(indexs) {
  exigixIndexs(indexs);
  return Array.from(indexs, (i) => PARAULES[i]);
}

/**
 * Sis índexs uniformes i independents: un sol getRandomValues de 6 × 16 bits i
 * la màscara d'11 bits. Sense biaix perquè 65.536 = 32 × 2.048 (el mostreig amb
 * rebuig només caldria amb una llista que no fóra potència de dos, i la
 * càrrega del mòdul ja ho impedix). Les mostres es posen a zero en acabar.
 */
export function generaIndexs(cripto) {
  if (!cripto || typeof cripto.getRandomValues !== 'function') {
    throw errorAmbCodi('CRIPTO_ABSENT', 'Cal un generador criptogràfic (crypto.getRandomValues).');
  }
  const mostres = new Uint16Array(PARAULES_PER_FRASE);
  cripto.getRandomValues(mostres);
  const indexs = Array.from(mostres, (v) => v & MASCARA);
  mostres.fill(0);
  return indexs;
}

/** Una frase nova: els índexs (per a la KDF) i les paraules (per a la targeta). */
export function generaFrase(cripto) {
  const indexs = generaIndexs(cripto);
  return { indexs, paraules: paraulesDeIndexs(indexs) };
}
