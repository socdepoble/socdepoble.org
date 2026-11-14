/**
 * refranysDePobleSeed.js · Onada R23 («La Veu de Sóc de Poble») · Base curada
 * de 32 refranys i dites populars classificats per comarca i àmbit.
 *
 * Llei d'Empatia i Dignitat Humana: cap dita d'este arxiu conté ni contindrà
 * estigmes ètnics, xenòfobs, masclistes ni burles contra cap poble o col·lectiu.
 */

import { getVal, setVal } from '../../config/storage.js';

export const CLAU_APORTACIONS_REFRANYER_LOCAL = 'sdp:aportacions_refranyer_sonor_v1';
export const MAX_DURADA_GRAVACIO_S = 15;
export const MAX_BYTES_GRAVACIO = 2_097_152; // 2 MB

export const CATEGORIES_REFRANYER = Object.freeze([
  Object.freeze({
    id: 'totes',
    clau: 'patrimoni.refranyer.cat.totes',
    reserva: 'Tots els àmbits',
  }),
  Object.freeze({
    id: 'camp-olivera',
    clau: 'patrimoni.refranyer.cat.campOlivera',
    reserva: 'Camp i olivera',
  }),
  Object.freeze({
    id: 'oratge-aigua',
    clau: 'patrimoni.refranyer.cat.oratgeAigua',
    reserva: 'Oratge i aigua',
  }),
  Object.freeze({
    id: 'taula-rebost',
    clau: 'patrimoni.refranyer.cat.taulaRebost',
    reserva: 'Taula i rebost',
  }),
  Object.freeze({
    id: 'saviesa-convivencia',
    clau: 'patrimoni.refranyer.cat.saviesaConvivencia',
    reserva: 'Saviesa i convivència',
  }),
]);

export const REFRANYS_DE_POBLE_SEED = Object.freeze([
  /* ── 1. Camp i olivera (8) ─────────────────────────────────────────────── */
  Object.freeze({
    id: 'ref-01-olivera-podador',
    categoria: 'camp-olivera',
    text: 'A l’olivera, un bon podador i un millor llaurador.',
    comarca: 'L’Alacantí · La Torre de les Maçanes',
    veuSuggerida: 'arnau_valencia',
    explicacio: {
      ca: 'L’arbre d’oli agraïx dues mans sàvies: tisora que deixe entrar el sol a la copa i rella que guarde la humitat del secà.',
      es: 'El olivo agradece dos oficios sabios: poda limpia que deje entrar el sol en la copa y labranza que conserve la humedad del secano.',
      en: 'Olive trees thrive on two skilled hands: careful pruning to let sunlight into the crown and tilling that holds dryland moisture.',
      eu: 'Olibondoak bi esku jakintsu eskertzen ditu: eguzkia sartzen uzten duen inausketa eta lehorreko hezetasuna gordetzen duen goldaketa.',
      gl: 'A oliveira agradece dúas mans sabias: poda que deixe entrar o sol na copa e labra que garde a humidade do secaño.',
    },
  }),
  Object.freeze({
    id: 'ref-02-tots-sants-olives',
    categoria: 'camp-olivera',
    text: 'Per Tots Sants, les olives a les mans; i per Santa Caterina, l’oli a la cuina.',
    comarca: 'La Marina Alta i el Comtat',
    veuSuggerida: 'gina_valencia',
    explicacio: {
      ca: 'Calendari viu de la collita: l’1 de novembre es comença a varejar o pentinar l’oliva primerenca i el 25 de novembre ja raja l’oli nou de l’almàssera.',
      es: 'Calendario vivo de la cosecha: el 1 de noviembre empieza la recogida de la aceituna temprana y el 25 de noviembre ya entra el aceite nuevo en la cocina.',
      en: 'Traditional olive calendar: picking begins around All Saints’ Day (Nov 1) and fresh oil reaches the kitchen by St Catherine’s Day (Nov 25).',
      eu: 'Oliba-bilketaren egutegi bizia: Domu Santu egunez olibak eskuetan, eta Santa Katalinaz olio berria sukaldean.',
      gl: 'Calendario vivo da apaña: por Todos os Santos as olivas nas mans, e por Santa Catarina o aceite novo na cociña.',
    },
  }),
  Object.freeze({
    id: 'ref-03-llaura-fondo',
    categoria: 'camp-olivera',
    text: 'Llaura fondo i tira fems, i riu-te’n dels llibres vells.',
    comarca: 'La Vall d’Albaida',
    veuSuggerida: 'berta_valencia',
    explicacio: {
      ca: 'Reivindicació del treball ben fet a peu de bancal: alimentar la terra i cuidar el sòl pesa més que la teoria desconnectada del camp.',
      es: 'Reivindicación del oficio a pie de bancal: nutrir y labrar bien la tierra vale más que cualquier manual escrito lejos del campo.',
      en: 'Hands-on care for the soil and organic manure outweigh any dusty textbook written far from the fields.',
      eu: 'Lurra ondo lantzea eta ongarritzea liburu zaharretako teoria hutsa baino baliotsuagoa da.',
      gl: 'Labrar fondo e aboar ben a terra vale máis ca calquera teoría escrita lonxe da leira.',
    },
  }),
  Object.freeze({
    id: 'ref-04-ametler-florit',
    categoria: 'camp-olivera',
    text: 'Flor d’ametler per gener, no ompli el graner.',
    comarca: 'L’Alcoià i les Valls del Vinalopó',
    veuSuggerida: 'arnau_valencia',
    explicacio: {
      ca: 'Quan la calor d’hivern fa florir massa prompte els ametlers de muntanya, qualsevol gelada de febrer o març crema la collita.',
      es: 'Cuando la templanza de enero adelanta la flor del almendro en la montaña, las heladas de febrero suelen llevarse el fruto.',
      en: 'Almond blossoms opening too early in January risk being wiped out by late mountain frosts.',
      eu: 'Urtarrilean goizegi loratzen den arbendolondoari otsaileko izozteek uztarik gabe uzten diote sarri.',
      gl: 'A flor de amendoeira que abre cedo en xaneiro corre o risco de queimarse coas xeadas de febreiro.',
    },
  }),
  Object.freeze({
    id: 'ref-05-olivera-avi',
    categoria: 'camp-olivera',
    text: 'Olivera d’avi, figuera de pare i vinya teua.',
    comarca: 'El Comtat i la Marina Baixa',
    veuSuggerida: 'gina_valencia',
    explicacio: {
      ca: 'Generositat intergeneracional de secà: qui planta una olivera als marges de pedra seca regala ombra i oli als fills i als néts.',
      es: 'Generosidad entre generaciones: quien planta un olivo en márgenes de piedra seca siembra alimento y paisaje para hijos y nietos.',
      en: 'Intergenerational stewardship: planting an olive tree on a dry-stone terrace is a gift of shade and oil for grandchildren.',
      eu: 'Belaunaldien arteko eskuzabaltasuna: harri lehorreko terrazan olibondoa landatzen duenak bilobentzako uzta ereiten du.',
      gl: 'Xenerosidade entre xeracións: quen planta unha oliveira nos socalcos de pedra seca regala sombra e aceite aos netos.',
    },
  }),
  Object.freeze({
    id: 'ref-06-olivera-vella',
    categoria: 'camp-olivera',
    text: 'L’olivera, com més vella, més oliera.',
    comarca: 'El Baix Maestrat · Sant Mateu i Canet lo Roig',
    veuSuggerida: 'lluc_valencia',
    explicacio: {
      ca: 'Les oliveres centenàries i mil·lenàries continuen donant un oli finíssim quan se’ls cuida la soca i el bancal.',
      es: 'Los olivos centenarios y milenarios siguen ofreciendo un aceite extraordinario cuando se cuida su tronco y su bancal.',
      en: 'Centuries-old olive trees keep yielding exquisite oil whenever their ancient trunks and terraces are tended with care.',
      eu: 'Ehunka urteko olibondoek olio bikaina ematen jarraitzen dute enborra eta terraza mimuz zaintzen direnean.',
      gl: 'As oliveiras centenarias seguen dando un aceite finísimo cando se coida o seu tronco e o seu bancal.',
    },
  }),
  Object.freeze({
    id: 'ref-07-sant-joan-oli',
    categoria: 'camp-olivera',
    text: 'Aigua per Sant Joan, oli per a tot l’any.',
    comarca: 'L’Alcoià i l’Alt Vinalopó',
    veuSuggerida: 'arnau_valencia',
    explicacio: {
      ca: 'Una pluja suau al voltant del solstici d’estiu ajuda a quallar l’oliva menuda i prepara una tardor generosa a l’almàssera.',
      es: 'Una lluvia templada hacia San Juan ayuda a cuajar el fruto joven del olivo y augura buena campaña de almazara.',
      en: 'Gentle midsummer rain around St John’s Day helps young olives set and promises a generous autumn pressing.',
      eu: 'San Joan inguruko euri gozoak oliba gaztea finkatzen laguntzen du eta udazken oparoa iragartzen du.',
      gl: 'Unha choiva morna polo San Xoán axuda a callar a oliva miúda e anuncia boa colleita no muíño.',
    },
  }),
  Object.freeze({
    id: 'ref-08-terra-escudellada',
    categoria: 'camp-olivera',
    text: 'Terra ben escudellada, guarda l’aigua de la tronada.',
    comarca: 'Les Garrigues, el Segrià i la Terra Alta',
    veuSuggerida: 'emma_occidental',
    explicacio: {
      ca: 'Obrir escudelles i cavallons al peu de cada arbre evita que l’aiguat d’estiu s’emporte la terra fèrtil costa avall.',
      es: 'Hacer alcorques y caballones al pie de cada árbol retiene el aguacero de verano e impide la erosión de la ladera.',
      en: 'Shaping basins around each tree trunk captures summer cloudbursts and prevents fertile hillside soil from washing away.',
      eu: 'Zuhaitz bakoitzaren oinean sakonuneak egiteak udako zaparradako ura gordetzen du eta lur emankorra babesten du.',
      gl: 'Facer caldeiras ao pé de cada árbore garda a auga da treboada e evita que a enxurrada leve a terra fértil.',
    },
  }),

  /* ── 2. Oratge i aigua (8) ─────────────────────────────────────────────── */
  Object.freeze({
    id: 'ref-09-aitana-capell',
    categoria: 'oratge-aigua',
    text: 'Quan Aitana posa capell, pica espart i fes cordell.',
    comarca: 'El Comtat, l’Alcoià i la Marina Baixa',
    veuSuggerida: 'gina_valencia',
    explicacio: {
      ca: 'Si el cim de la serra d’Aitana es cobreix amb boira espessa en forma de barret, l’aigua és imminent i toca fer faena sota teulada.',
      es: 'Si la cumbre de la sierra de Aitana se cubre con un sombrero de nubes, la lluvia es segura y toca trabajar bajo techo picando esparto.',
      en: 'When Aitana Peak wears a cap of clouds, rain is certain—stay indoors weaving esparto grass.',
      eu: 'Aitana mendi-gailurrak hodei-txapela janzten duenean, euria ziurra da eta teilatupean espartzua lantzeko ordua da.',
      gl: 'Cando o cume da serra de Aitana pon sombreiro de nubes, a choiva é segura e toca traballar baixo cuberta.',
    },
  }),
  Object.freeze({
    id: 'ref-10-vent-llevant',
    categoria: 'oratge-aigua',
    text: 'Vent de llevant, aigua davant.',
    comarca: 'La Safor, la Ribera i la Marina',
    veuSuggerida: 'berta_valencia',
    explicacio: {
      ca: 'Els vents humits de la Mediterrània que entropessen amb les serres litorals descarreguen les pluges més abundants a les nostres valls.',
      es: 'Los vientos húmedos del Mediterráneo que tropiezan con las sierras litorales traen las lluvias más generosas a nuestros valles.',
      en: 'Humid easterly winds blowing in from the Mediterranean against coastal mountains bring soaking rains.',
      eu: 'Mediterraneotik datozen sortaldeko haize hezeek mendiekin topo egitean euri oparoa dakarte.',
      gl: 'Os ventos húmidos do leste que entran do Mediterráneo contra as serras litorais traen auga segura.',
    },
  }),
  Object.freeze({
    id: 'ref-11-aigua-maig',
    categoria: 'oratge-aigua',
    text: 'Aigua de maig, carrega el carro i no cap al raig.',
    comarca: 'L’Alacantí i el Camp d’Elx',
    veuSuggerida: 'lluc_valencia',
    explicacio: {
      ca: 'Una bona saó al mes de maig umpli el gra d’ordi i blat i engreixa els fruits de secà com cap altra regada de l’any.',
      es: 'Una buena lluvia en mayo llena la espiga de cereal y engorda los cultivos de secano multiplicando la cosecha.',
      en: 'Timely rain in May swells the grain and fills the harvest cart to overflowing.',
      eu: 'Maiatzeko euriak alea gizendu eta uztako gurdia goraino betetzen du.',
      gl: 'A auga de maio enche a espiga e carga o carro da colleita ata arriba.',
    },
  }),
  Object.freeze({
    id: 'ref-12-cel-rogent',
    categoria: 'oratge-aigua',
    text: 'Cel rogent, pluja o vent.',
    comarca: 'El Maestrat, els Ports i les Terres de l’Ebre',
    veuSuggerida: 'emma_occidental',
    explicacio: {
      ca: 'El cel encés a l’alba sol avisar de l’entrada d’un front humit o de mestral fort abans que acabe la jornada.',
      es: 'El cielo enrojecido al amanecer avisa de cambio de tiempo, con entrada de lluvia o rachas de cierzo y mestral.',
      en: 'Red sky at dawn warns shepherds and farmers of incoming rain or strong winds.',
      eu: 'Egunsentiko zeru gorrixkak euria edo haize zakarra datorrela iragartzen du.',
      gl: 'O ceo roibén ao mencer avisa da chegada de choiva ou vento forte.',
    },
  }),
  Object.freeze({
    id: 'ref-13-mariola-benicadell',
    categoria: 'oratge-aigua',
    text: 'Quan Mariola fa caputxa i el Benicadell capell, agafa la manta i el cistell.',
    comarca: 'La Vall d’Albaida, el Comtat i l’Alcoià',
    veuSuggerida: 'gina_valencia',
    explicacio: {
      ca: 'Baròmetre natural de les comarques centrals: quan tots dos cims es tapen alhora amb boira baixa, entra temporal d’aigua i frescor.',
      es: 'Barómetro natural de las comarcas centrales: cuando ambas cumbres se cubren a la vez, llega temporal de lluvia y fresco.',
      en: 'Natural mountain barometer: when both Mariola and Benicadell ridges pull on cloud hoods, cool rain is rolling into the valleys.',
      eu: 'Mendiko barometro naturala: Mariola eta Benicadell lainoz estaltzen direnean, euria eta freskura datoz haranetara.',
      gl: 'Barómetro natural das serras: cando Mariola e o Benicadell se cobren de néboa á vez, entra temporal de auga e fresco.',
    },
  }),
  Object.freeze({
    id: 'ref-14-abril-gotes',
    categoria: 'oratge-aigua',
    text: 'En abril, cada gota en val mil.',
    comarca: 'L’Alacantí, el Baix Vinalopó i l’Horta d’Alacant',
    veuSuggerida: 'arnau_valencia',
    explicacio: {
      ca: 'A les terres seques del sud, qualsevol ruixat primaveral desperta els sembrats, la timoneda i els bancals d’ametlers i oliveres.',
      es: 'En las tierras secas del sur, cada llovizna de abril multiplica la floración, los pastos y la reserva de los bancales.',
      en: 'Across dry southern valleys, every April raindrop is worth a thousand for spring crops, wild thyme and olive terraces.',
      eu: 'Hegoaldeko lur lehorretan, apirileko euri-tanta bakoitzak mila balio du ereintza eta olibondo-terrazak biziberritzeko.',
      gl: 'Nas terras secas do sur, cada pinga de abril vale por mil para espertar os sementados e os socalcos.',
    },
  }),
  Object.freeze({
    id: 'ref-15-febreret-curt',
    categoria: 'oratge-aigua',
    text: 'Febreret el curt, amb set capes i un caputx.',
    comarca: 'Els Ports · Morella i Vilafranca',
    veuSuggerida: 'lluc_valencia',
    explicacio: {
      ca: 'Tot i ser el mes més breu del calendari, les fredorades i nevades tardanes als cims dels Ports demanen bon abric i llenya seca.',
      es: 'Aunque sea el mes más corto del año, las heladas y nevadas de febrero en las montañas de Els Ports piden buen abrigo y leña.',
      en: 'Shortest month though it is, February’s crisp mountain gales and late snows call for warm cloaks and dry firewood.',
      eu: 'Urteko hilabeterik laburrena izan arren, otsaileko mendiko elurte eta hotzek beroki ona eta egur lehorra eskatzen dute.',
      gl: 'Aínda sendo o mes máis curto, as xeadas e nevaradas de febreiro na montaña piden bo abrigo e leña seca.',
    },
  }),
  Object.freeze({
    id: 'ref-16-tramuntana-nuvols',
    categoria: 'oratge-aigua',
    text: 'Tramuntana forta, núvols s’emporta.',
    comarca: 'L’Empordà, Menorca i Mallorca',
    veuSuggerida: 'olga_balear',
    explicacio: {
      ca: 'El vent sec del nord escombra la humitat i deixa el cel ras, blau i lluminós sobre la mar i les parets seques.',
      es: 'El viento seco del norte barre las nubes y deja el cielo raso y luminoso sobre el mar y los campos.',
      en: 'A brisk northern Tramuntana wind sweeps clouds away, leaving crystal-clear skies above sea and stone walls.',
      eu: 'Iparraldeko tramuntana haize idorrak hodeiak eramaten ditu eta zerua garbi eta argitsu uzten du.',
      gl: 'O vento seco do norte varre as nubes e deixa o ceo limpo e luminoso sobre o mar e os valados.',
    },
  }),

  /* ── 3. Taula i rebost (8) ─────────────────────────────────────────────── */
  Object.freeze({
    id: 'ref-17-oli-oliva',
    categoria: 'taula-rebost',
    text: 'Oli d’oliva, tot mal esquiva.',
    comarca: 'L’Alacantí · La Torre de les Maçanes',
    veuSuggerida: 'gina_valencia',
    explicacio: {
      ca: 'L’or líquid de les nostres serres ha sigut durant segles aliment diari, llum del cresol i remei de capçalera de totes les cases.',
      es: 'El oro líquido de nuestras sierras ha sido durante siglos alimento diario, lumbre del candil y remedio de todas las casas.',
      en: 'Mountain extra-virgin olive oil has served for centuries as daily nourishment, lamp fuel and household remedy.',
      eu: 'Gure mendietako oliba-olioa elikagai nagusia eta etxeko sendagaia izan da mendeetan zehar.',
      gl: 'O ouro líquido das nosas serras foi durante séculos alimento diario e remedio de cabeceira.',
    },
  }),
  Object.freeze({
    id: 'ref-18-pa-amb-oli',
    categoria: 'taula-rebost',
    text: 'Pa amb oli i sal, menjar reial.',
    comarca: 'L’Horta, el Camp de Túria i Mallorca',
    veuSuggerida: 'olga_balear',
    explicacio: {
      ca: 'Elogi de l’austeritat saborosa: una llesca de pa de massa mare amb un bon raig d’oli verd i un pessic de sal no enveja cap banquet.',
      es: 'Elogio de la sencillez sabrosa: una rebanada de buen pan de pueblo con aceite nuevo y una pizca de sal sabe a gloria.',
      en: 'Praise for simple abundance: crusty village bread drizzled with fresh olive oil and sea salt is a royal meal.',
      eu: 'Soiltasun gozoaren gorazarrea: herriko ogi xerra bat olio berri eta gatz pitin batekin errege-jana da.',
      gl: 'Eloxio da sinxeleza saborosa: unha rebanda de pan da aldea con aceite novo e sal é xantar de reis.',
    },
  }),
  Object.freeze({
    id: 'ref-19-olla-que-no-bull',
    categoria: 'taula-rebost',
    text: 'D’olla que no bull, aparta’t d’ella i fuig.',
    comarca: 'La Costera i la Canal de Navarrés',
    veuSuggerida: 'berta_valencia',
    explicacio: {
      ca: 'Val per a la cuina i per a la vida: el menjar a mig coure no fa profit, i els tractes sense claredat ni escalfor porten maldecaps.',
      es: 'Vale para la cocina y para la vida: ni el guiso sin hervor sienta bien, ni los tratos tibios o turbios llegan a buen puerto.',
      en: 'True in the kitchen and in life: step away from a pot that refuses to boil and from half-hearted dealings.',
      eu: 'Sukaldean bezala bizitzan ere: irakiten ez duen eltzetik eta epelkeriatik urrundu zaitez.',
      gl: 'Vale na cociña e na vida: nin o pote sen ferver fai proveito nin os tratos mornos chegan a bo porto.',
    },
  }),
  Object.freeze({
    id: 'ref-20-torro-mistela',
    categoria: 'taula-rebost',
    text: 'Per Nadal, torró i mistela, i la família vora la candela.',
    comarca: 'L’Alacantí · Xixona i La Torre de les Maçanes',
    veuSuggerida: 'arnau_valencia',
    explicacio: {
      ca: 'Memòria viva dels hiverns d’ametla torrada, mel de romer i sobretaules llargues al voltant de la llar.',
      es: 'Memoria viva de los inviernos de almendra tostada, miel de romero y sobremesas largas alrededor de la lumbre.',
      en: 'Living memory of winter gatherings around the hearth with Xixona nougat and sweet mistela wine.',
      eu: 'Gabonetako oroimen bizia: arbendol txigortuzko turroia, mistela eta familia sutondoan bilduta.',
      gl: 'Memoria viva dos invernos de améndoa torrada, mel de romeu e conversa longa arredor da lareira.',
    },
  }),
  Object.freeze({
    id: 'ref-21-foc-menut-olleta',
    categoria: 'taula-rebost',
    text: 'El foc menut fa l’olleta saborosa.',
    comarca: 'L’Alcoià, el Comtat i la Foia de Castalla',
    veuSuggerida: 'gina_valencia',
    explicacio: {
      ca: 'L’olleta de blat, penques, fesols i nap demana xup-xup lent i pacient: la bona cuina de muntanya mai es fa amb presses.',
      es: 'La olleta de trigo, pencas y alubias pide hervor lento y paciente: la buena cocina de montaña nunca se hace con prisas.',
      en: 'Traditional mountain stews of wheat, cardoons and beans ask for a gentle simmer—good cooking never rushes.',
      eu: 'Mendiko eltzekari tradizionalak su eztia eta pazientzia eskatzen ditu: sukaldaritza ona ez da presaka egiten.',
      gl: 'O pote tradicional de montaña pide lume manso e paciencia: a boa cociña nunca se fai ás présas.',
    },
  }),
  Object.freeze({
    id: 'ref-22-espencat-caliu',
    categoria: 'taula-rebost',
    text: 'Tomaca, pebrera i albergínia al caliu, alegria de l’estiu.',
    comarca: 'L’Alacantí · La Torre, Xixona i Mutxamel',
    veuSuggerida: 'arnau_valencia',
    explicacio: {
      ca: 'L’espencat o aspencat regat amb oli nou d’oliva i capellans és el plat rei dels sopars a la fresca a les nostres comarques.',
      es: 'El espencat o aspencat aliñado con buen aceite de oliva virgen extra es el plato rey de las cenas al fresco en verano.',
      en: 'Flame-roasted peppers, aubergines and tomatoes dressed in fresh olive oil bring summer joy to every village table.',
      eu: 'Txingarretan erretako piper, alberjinia eta tomateak oliba-olio berriarekin udako afarien poza dira.',
      gl: 'Pemento, berenxena e tomate ás brasas cun bo fío de aceite de oliva son a alegría das ceas de verán.',
    },
  }),
  Object.freeze({
    id: 'ref-23-herbes-rentonar',
    categoria: 'taula-rebost',
    text: 'Timó, romer i pebrella, fan olor de serra i donen gust a la paella.',
    comarca: 'La Mariola, Aitana i el Rentonar',
    veuSuggerida: 'arnau_valencia',
    explicacio: {
      ca: 'La pebrella i el timó de muntanya són el segell aromàtic inconfusible dels arrossos, les olives trencades i els guisats alacantins.',
      es: 'La pebrella, el tomillo y el romero de sierra son el sello aromático inconfundible de los arroces y aceitunas partidas alicantinas.',
      en: 'Wild mountain savory, thyme and rosemary lend unmistakable sierra aroma to Alicante rice dishes and cracked olives.',
      eu: 'Mendiko ezkaia, erromeroa eta pebrella belarra Alacanteko arroz eta oliba zatituen usain bereizgarria dira.',
      gl: 'O tomillo, o romeu e a pebrella da serra poñen o selo aromático inconfundible nos arroces e olivas partidas.',
    },
  }),
  Object.freeze({
    id: 'ref-24-figues-sant-mateu',
    categoria: 'taula-rebost',
    text: 'Per Sant Mateu, figues al canyís i raïm al peu.',
    comarca: 'La Marina Alta, la Vall de Pop i la Safor',
    veuSuggerida: 'berta_valencia',
    explicacio: {
      ca: 'Saviesa del rebost antic: a finals de setembre s’assequen les figues sobre canyissos al sol per guardar dolçor natural tot l’hivern.',
      es: 'Sabiduría de la despensa tradicional: por San Mateo se secan los higos al sol en cañizos para conservar dulzor todo el invierno.',
      en: 'Pantry wisdom: in late September figs are sun-dried on reed mats to store natural sweetness for the winter months.',
      eu: 'Jakituria tradizionala: irailaren amaieran pikuak eguzkitan lehortzen dira negu osorako gozotasuna gordetzeko.',
      gl: 'Sabedoría da despensa antiga: a finais de setembro sécanse os figos ao sol en canizos para gardar dozura todo o inverno.',
    },
  }),

  /* ── 4. Saviesa i convivència (8) ──────────────────────────────────────── */
  Object.freeze({
    id: 'ref-25-poble-en-poble',
    categoria: 'saviesa-convivencia',
    text: 'De poble en poble, cadascú té el seu mot propi.',
    comarca: 'Els Ports i l’Alt Maestrat',
    veuSuggerida: 'emma_occidental',
    explicacio: {
      ca: 'A només cinc quilòmetres de serra canvia l’entonació o el nom d’una ferramenta: eixa riquesa no ens separa, ens fa reconéixer-nos.',
      es: 'A cinco kilómetros de sierra cambia la entonación o el nombre de un apero: esa riqueza no divide, nos hace reconocernos.',
      en: 'Five kilometres over the ridge brings a new tune or word for a tool—diversity that enriches our shared language.',
      eu: 'Herriz herri doinua eta hitzak aldatzen dira: aniztasun horrek ez gaitu banatzen, aberastu baizik.',
      gl: 'De aldea en aldea muda o acento ou o nome dun apeiro: esa riqueza fainos recoñecernos.',
    },
  }),
  Object.freeze({
    id: 'ref-26-escolta-gent-gran',
    categoria: 'saviesa-convivencia',
    text: 'Qui escolta la gent gran, s’estalvia mig camí d’enganys.',
    comarca: 'Terres de l’Ebre i Catalunya Central',
    veuSuggerida: 'elia_central',
    explicacio: {
      ca: 'L’experiència viscuda de les iaies i els iaios és la primera biblioteca d’un poble; per això la nostra IA aprén escoltant-los.',
      es: 'La experiencia vivida de abuelas y abuelos es la primera biblioteca de un pueblo; por eso nuestra IA aprende escuchándolos.',
      en: 'Listening to elders spares you half a road of mistakes—their oral memory is the first library of every village.',
      eu: 'Adineko jendeari entzuten dionak bide erdiko hutsuneak aurrezten ditu: haien ahotsa herriaren lehen liburutegia da.',
      gl: 'Quen escoita a xente maior aforra medio camiño de enganos: a súa memoria oral é a primeira biblioteca da aldea.',
    },
  }),
  Object.freeze({
    id: 'ref-27-bon-vei',
    categoria: 'saviesa-convivencia',
    text: 'Més val bon veí a la porta que parent a Mallorca; i a Mallorca, bon veí a la vora.',
    comarca: 'Illes Balears i la Marina',
    veuSuggerida: 'olga_balear',
    explicacio: {
      ca: 'En un poble menut, la persona del costat que t’ajuda quan cau una pedregada o et guarda les claus és família de fet.',
      es: 'En un pueblo pequeño, el vecino de al lado que acude cuando hace falta una mano vale un tesoro diario.',
      en: 'In rural life, a caring neighbour right next door is daily kinship across both shores of the sea.',
      eu: 'Herri txiki batean, ate ondoko auzokide ona eguneroko altxorra eta benetako familia da.',
      gl: 'Nunha aldea pequena, o bo veciño á porta que bota unha man cada día vale un tesouro.',
    },
  }),
  Object.freeze({
    id: 'ref-28-pedra-a-pedra',
    categoria: 'saviesa-convivencia',
    text: 'Poc a poc es fa el camí, i pedra a pedra el marge fi.',
    comarca: 'El Comtat i la Vall de Gallinera',
    veuSuggerida: 'gina_valencia',
    explicacio: {
      ca: 'Filosofia pura de Pedra Seca: sense ciment ni presses, encaixant cada peça amb paciència perquè aguante cent anys.',
      es: 'Filosofía pura de Piedra Seca: sin cemento ni prisas, encajando cada piedra con tino para que aguante cien años.',
      en: 'Pure dry-stone philosophy: without mortar or haste, fitting each stone carefully so the terrace stands for centuries.',
      eu: 'Harri lehorraren filosofia hutsa: porlanik eta presarik gabe, harriz harri horma mendeetan zutik irauteko.',
      gl: 'Filosofía pura de Pedra Seca: sen cemento nin présas, encaixando cada pedra con sentidiño para que dure cen anos.',
    },
  }),
  Object.freeze({
    id: 'ref-29-parlant-escoltant',
    categoria: 'saviesa-convivencia',
    text: 'Parlant la gent s’entén, i escoltant encara més.',
    comarca: 'Catalunya Central, Osona i el Bages',
    veuSuggerida: 'elia_central',
    explicacio: {
      ca: 'En qualsevol plaça o assemblea veïnal, escoltar amb respecte i empatia obri portes que cap crit no pot obrir.',
      es: 'En cualquier plaza o reunión vecinal, escuchar con respeto y empatía logra acuerdos duraderos.',
      en: 'In every village square, speaking kindly brings understanding—and listening with empathy brings even more.',
      eu: 'Edozein herriko plazatan, hitz eginez jendeak elkar ulertzen du, eta enpatiaz entzunez are gehiago.',
      gl: 'En calquera praza veciñal, falando a xente enténdese, e escoitando con empatía aínda máis.',
    },
  }),
  Object.freeze({
    id: 'ref-30-moltes-mans',
    categoria: 'saviesa-convivencia',
    text: 'Moltes mans fan lleugera la càrrega.',
    comarca: 'Les Terres de l’Ebre, el Priorat i el Maestrat',
    veuSuggerida: 'emma_occidental',
    explicacio: {
      ca: 'Essència del treball a tornallom: quan el veïnat s’ajuda mútuament a la collita o a netejar séquies, cap feina es fa pesada.',
      es: 'Esencia del trabajo comunitario a tornallom: cuando la cuadrilla se ayuda mutuamente, ninguna tarea resulta pesada.',
      en: 'Heart of mutual aid (tornallom): when neighbours pitch in together at harvest or ditch-cleaning, heavy work turns light.',
      eu: 'Auzolanaren muina: auzokideek elkarri laguntzen diotenean, lanik astunena ere arin bihurtzen da.',
      gl: 'Esencia da axuda mutua: cando a veciñanza bota unha man xunta na apaña, ningunha carga pesa.',
    },
  }),
  Object.freeze({
    id: 'ref-31-cadira-fresca',
    categoria: 'saviesa-convivencia',
    text: 'Cadira a la fresca i porta oberta, fan el carrer viu i la gent desperta.',
    comarca: 'L’Horta, la Costera i la Ribera',
    veuSuggerida: 'berta_valencia',
    explicacio: {
      ca: 'Traure les cadires de boga al carrer en caure el sol manté viva la conversa entre generacions i acompanya qui viu a soles.',
      es: 'Sacar las sillas de enea a la puerta al atardecer mantiene viva la conversación entre generaciones y ahuyenta la soledad.',
      en: 'Setting rush-woven chairs outside at dusk keeps conversation alive across generations and ensures nobody feels alone.',
      eu: 'Ilunabarrean aulkiak atarira ateratzeak belaunaldien arteko elkarrizketa bizirik mantentzen du eta bakardadea uxatzen du.',
      gl: 'Sacar as cadeiras á fresca ao solpor mantén viva a conversa entre xeracións e afasta a soidade.',
    },
  }),
  Object.freeze({
    id: 'ref-32-arrels-empatia',
    categoria: 'saviesa-convivencia',
    text: 'Paraula amable i bon trellat, obrin portes a tot costat.',
    comarca: 'L’Alacantí, el Comtat i la Marina',
    veuSuggerida: 'arnau_valencia',
    explicacio: {
      ca: 'El respecte, el tacte humà i el bon trellat en parlar són la clau de volta de la convivència digna entre totes les persones.',
      es: 'El respeto, el tacto humano y la sensatez al hablar son la piedra angular de una convivencia digna para todas las personas.',
      en: 'Kind words, tact and common sense open every door and uphold the dignity of every person in the community.',
      eu: 'Hitz goxoak, begiruneak eta zentzu onak ate guztiak irekitzen dituzte eta pertsona guztien duintasuna zaintzen dute.',
      gl: 'A palabra amable, o tacto humano e o sentidiño abren todas as portas e coidan a dignidade de toda persoa.',
    },
  }),
]);

/** Filtra els refranys per categoria i per cerca textual insensible a majúscules i diacrítics. */
function normalitzaCerca(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function filtraRefranys(refranys, { categoria = 'totes', cerca = '', idioma = 'ca' } = {}) {
  const llista = Array.isArray(refranys) ? refranys : [];
  const q = normalitzaCerca(cerca);
  return llista.filter((r) => {
    if (categoria && categoria !== 'totes' && r.categoria !== categoria) return false;
    if (!q) return true;
    const cos = `${r.text} ${r.comarca} ${r.explicacio?.[idioma] || r.explicacio?.ca || ''}`;
    return normalitzaCerca(cos).includes(q);
  });
}

/** Tria el primer tipus MIME d'àudio admés pel MediaRecorder del navegador actual. */
export function triaMimeGravacio(mediaRecorderClass = typeof MediaRecorder !== 'undefined' ? MediaRecorder : null) {
  if (!mediaRecorderClass || typeof mediaRecorderClass.isTypeSupported !== 'function') return '';
  const candidats = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/ogg;codecs=opus',
    'audio/ogg',
  ];
  return candidats.find((m) => mediaRecorderClass.isTypeSupported(m)) || '';
}

/** Llig el registre local de metadades d'aportacions del Refranyer Sonor. */
export function llegeixAportacionsRefranyerLocals() {
  const llista = getVal(CLAU_APORTACIONS_REFRANYER_LOCAL, null);
  return Array.isArray(llista) ? llista.slice(0, 50) : [];
}

/** Desa les metadades validades d'una gravació oral (respectant límits de 15 s i 2 MB i consentiment explícit). */
export function desaAportacioRefranyLocal({
  refranyId,
  textRefrany,
  pobleComarca,
  duradaSegons,
  midaBytes,
  mimeType,
  consentiment,
} = {}) {
  if (consentiment !== true) return { ok: false, motiu: 'consentiment' };
  const pobleNet = typeof pobleComarca === 'string' ? pobleComarca.replace(/\s+/g, ' ').trim().slice(0, 120) : '';
  const textNet = typeof textRefrany === 'string' ? textRefrany.replace(/\s+/g, ' ').trim().slice(0, 280) : '';
  if (pobleNet.length < 2 || textNet.length < 2) return { ok: false, motiu: 'camps' };
  if (!Number.isFinite(midaBytes) || midaBytes <= 0 || midaBytes > MAX_BYTES_GRAVACIO) {
    return { ok: false, motiu: 'mida' };
  }
  const durada = Math.min(MAX_DURADA_GRAVACIO_S, Math.max(0.5, Number(duradaSegons) || 1));

  const registre = {
    id: `veu-${Date.now()}`,
    refranyId: typeof refranyId === 'string' ? refranyId.slice(0, 80) : '',
    textRefrany: textNet,
    pobleComarca: pobleNet,
    duradaSegons: Number(durada.toFixed(1)),
    midaBytes: Math.round(midaBytes),
    mimeType: typeof mimeType === 'string' ? mimeType.split(';')[0].slice(0, 40) : 'audio/webm',
    consentimentArxiuObert: true,
    consentimentVersio: 'cc-by-sa-4.0-v1',
    consentimentAcceptatAt: new Date().toISOString(),
  };

  const actuals = llegeixAportacionsRefranyerLocals();
  const noves = [registre, ...actuals].slice(0, 50);
  if (typeof window !== 'undefined' && !setVal(CLAU_APORTACIONS_REFRANYER_LOCAL, noves)) {
    /* Honestedat Llei 0: si falla la capa d'emmagatzematge, no diguem mai que s'ha guardat al dispositiu. */
    return { ok: false, motiu: 'emmagatzematge', registre };
  }
  return { ok: true, registre, totalLocals: noves.length };
}
