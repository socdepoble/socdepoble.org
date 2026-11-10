/* Onada R15b (RV-01) · Lèxic tancat i determinista dels 14 al·lèrgens de l'annex II del Reglament (UE) 1169/2011.
   Port del prototip de l'àrbitre (r15/pasC/eines/lexic_prototip.mjs, DISSENY_PUNT4 §5), amb la capa castellana i
   anglesa dels àlies anteriors i els marcadors de traça i de negació. El motor és src/utils/candidatsAlergens.js.
   · Classes: A = porta al·lergen, N = ingredient sense indici (mai vol dir «absent»), E = elaborat (cal la fitxa),
     M = mesura, Q = qualificador, S = paraula buida, U = estri, X = marcador de traça («pot contindre», «traces»),
     G = marcador de negació («sense», «sin»: rebaixa • a T, mai esborra). Les receptes del llibre van a REFERENCIES.
   · Marques: I = «• Ingredient» (paraula inequívoca), T = «T Traça» (derivat, ambigu o contaminació creuada habitual).
   · Formes separades per «|», tal com les deixa normalitza(): sense accents, «l·l» → «ll», apòstrofs → espai.
   · Una paraula que no és ací fa la línia «no reconeguda» i la recepta passa a cobertura parcial: mai se n'ignora
     cap en silenci. Una forma amb dues classes fa petar construixLexic (una paraula buida no amaga un al·lergen).
   · Canviar una entrada obliga a pujar VERSIO_LEXIC (la prova de corpus en fixa la instantània). */
export const VERSIO_LEXIC = 'lexic-alergens-v2';

const ent = (classe) => (formes, marques = {}, motiu = '', extra = {}) => ({ classe, formes, marques, motiu, ...extra });
const A = ent('A'), N = ent('N'), E = ent('E'), U = ent('U'), X = ent('X'), G = ent('G');
const llista = (classe, text) => [{ classe, formes: text.trim().split(/\s+/).join('|'), marques: {}, motiu: '' }];

/* ── Paraules sense contingut d'ingredient ─────────────────────────────── */
const S = llista('S', `de d del dels la el les els l s n un una uns unes i o a al als amb en per que es se hi li fa ha han qui si no ni
  com tot ben mes molt poc poques poquet pero fins dalt segons diu veu sol cal posa aquest darrer apart abans despres quasi us vostre
  vinga elegir afegir afegiu ficar collir estar poder treballar millor rentar mans enganxen servir omplir mesclar daurar pintar untar
  refregar corregir bullir fer conserva sofregit collides collita maig temporada altre quants sant joan farcir arrebossar
  cristallitzar ple plens qualsevol marca pes varietat and of with or the`);
const M = llista('M', `g gr grams gram kg quilo quilos litre litres ml millilitres cl mesura mesures mesureta got gots gotet gotets
  tassa tasses tasseta cullerada cullerades culleradeta pessic pessics grapat grapats rall ratllet polsim pot pots paquet paquets
  sobre sobres sobret sobrets pastilla pastilles pastilleta bloc bloquet bloquets manoll garba garbes parell tros trossos trosset
  trossets part parts quarta mig mitja meitat cabeca gota gotes branqueta branquetes rama envas envasos culet doble minim
  aproximadament persona unitat unitats dos racio racions`);
const Q = llista('Q', `fresc fresca frescos secs sec seca seques tendre tendres madur madura madures madurs gros grossa grossos grosses
  gran grans xicotet xicoteta xicotets xicotetes picat picada picades picats picant dolc dolca blanc blanca blancs blanques negre negres
  negretes roig roja roges verd verda verdes groc groga crua crues cru crus desfeta desfetes desfet trossejat trossejada trossejats
  trossejades ratllat ratllada ratllats ratllades molta moltes molts tallat tallada tallades tallats partides partida partit partits
  sencer sencera senceres sencers pelat pelada pelats pelades netes net cuits cuit cuita bullida bullides bullits bullit bullint calent
  calenta tebia tebi fregida fregides fregit fregits torrada torrat torrats torrades congelades congelats congelat dessalat dessalada curat curada
  natural normal fina llarga llarg escorreguda xafigats xafigat entreverada serrats serrat salats salat sangonosa mollut trencades
  trencada variat variada catalans catala gust opcional rodanxes rodanxa daus juliana anelles anella forca filet camp neu punt pols gra
  admeta liquid edulcorant fregir forn bomba callosina callosines banya pericana enrastrar mancanelles blanquetes cistella vegetal
  animal pell suc raspat ratlladura terrosa dur clor pinyol espines reial facedura atural passades passats passat passada molles ganyes
  planxa caseres casolanes fumat fumats`);

/* ── Marcadors de traça i de negació (només canvien la marca de la mateixa frase) ── */
const MARCADORS = [
  X('pot contindre|pot contenir|poden contindre|poden contenir|puede contener|pueden contener|may contain|may contain traces of|traces|traces de|traca|traca de|trazas|trazas de|traza|trace|traces of', {}, 'Declaració de traça: la marca és T.'),
  G('sense|sin|without|lliure de|libre de|free from|no conte|no contiene', {}, 'Negació sense font: rebaixa • a T, mai acredita absència.')
];

/* ── Estris (no són ingredients) ───────────────────────────────────────── */
const ESTRIS = [
  U('perol|drap|tela|poros|llibrell|bunyoleres|cassola|motle|motles|vidre'),
  U('motles de magdalena|aparell de fer xurros|pots de vidre')
];

/* ── Ingredients sense indici d'al·lergen (N): mai vol dir «absent» ────── */
const NEUTRES = [
  N('oli|oli d oliva|oliva|oli de gira sol|gira sol', {}, 'Oli d’oliva o de gira-sol; l’oli de cacau es marca a part.'),
  N('sal|sal grossa|sucre|aigua|aigua de naixement|aigua calenta|mel|vainilla'),
  N('tomaca|tomaques|tomata|tomates|ceba|cebes|all|alls|allet|allets|julivert|llorer|porro'),
  N('pebre roig|pebre|pebre blanc|pebre en gra|canella|orenga|safra|nyora|nyores|nou moscada|nous moscades|herba sana|timo|romer|salvia|menta|poliol|rabet de gat|camamilla|timo reial|pebrella|herbes|herbes aromatiques', {}, 'Espècia o herba d’una sola planta (decisió D-P4-3).'),
  N('llima|llimes|taronja|codonys|codony|carabassa|carbassa|pasta de carabassa|moniato|figues|cirera|cirer|aranyons|fruita'),
  N('creilles|creilla|carlota|carlotes|carlotetes|safanories|safanoria|pastanagues|pastanaga|naps|nap|xirivia|xirivies|penques|penca|bledes|bleda|espinacs|floricol|carxofes|carxofa|alberginies|alberginia|bajoca|bajoques|pebrera|pebreres|bajoquins|bajoquetes|bajoqueta|pesols|faves|faves tendres|xampinyons|xampinyo|esclata sangs|rubiols|bolets de xop|bolets|amanida'),
  N('arros|dacsa|espigues de dacsa|roses|olives|oliva blanqueta'),
  N('conill|pollastre|vedella|bou|porc|corder|titot|magre|fetge|carn|carn picada|carn capolada|capolada|costelles|costelletes|cuixa|cuixes|aletes|anca|pits|xulles|peuets|morret|morro|careta|orelles|orella|os|ossos|pota|ventre|garronets|sang|cansalada|sagi|mantega de porc|cuixot|pernil|llom|rellom|ternera|entrecot|bacon|baco|panceta|pexuga|pit'),
  N('cafe|cafe en gra|alcohol|alcohol etilic|aiguardent|cassalla|herbero|quall|sosa|fulles'),
  N('llimonada|gasosa', {}, 'Refresc o gasificant en sobre: cap al·lergen típic, però és elaborat.', { fitxa: true }),
  N('cabell d angel|caramel|essencia de vainilla|colorant', {}, 'Producte elaborat sense al·lergen típic; cal la fitxa.', { fitxa: true }),
  N('salsa', {}, 'Salsa sense nom: composició desconeguda.', { fitxa: true, obert: true })
];

/* ── Al·lèrgens per paraula inequívoca o per derivat ───────────────────── */
const AL = [
  // Gluten (cereals: blat, sègol, ordi, civada, espelta, kamut). Exempts de l'annex II: destil·lats, xarops de glucosa.
  A('gluten|farina|farina de blat|farina de forca|farina normal|blat|blat pelat|semola|ordi|segol|civada|espelta|kamut|khorasan|cervesa|malta', { gluten: 'I' }, 'Cereal amb gluten o derivat directe.'),
  A('fideus|fideu|fideua|macarrons|macarro|pasta de canelons|canelons|espaguetis|espagueti', { gluten: 'I', ous: 'T' }, 'Pasta de blat; algunes porten ou.'),
  A('pasta', { gluten: 'T' }, '«Pasta» ambigua: massa de blat o puré.'),
  A('pa|pa dur|pa ratllat|torrada amb|torrades amb|entrepa|entrepans|bocata|bocadillo|montadito|pepito|sandwich|sandvitx|canapes|canape|burret', { gluten: 'I', sesam: 'T', llet: 'T' }, 'Pa de forn: contaminació creuada habitual amb sèsam i llet.'),
  A('farina de dacsa|maizena', { gluten: 'T' }, 'Farina o midó de dacsa: molinera compartida amb el blat (cal fitxa).'),
  A('llevat|llevat fresc', { gluten: 'T' }, '«Llevat» pot ser fresc o químic; alguns químics porten midó de blat.'),
  A('llentilles|llentilla|cigrons|cigro|fesols|fesol|faves seques', { gluten: 'T' }, 'Llegum sec: grans de cereal per contaminació creuada (decisió D-P4-5).'),
  A('galetes|galetes maria|galeta', { gluten: 'I', llet: 'T', ous: 'T', soja: 'T', 'fruits-closca': 'T' }, 'Galeta de blat: la indústria hi declara sovint llet, ou, soja i fruits de closca.'),
  A('neula|neules', { gluten: 'I', llet: 'T', ous: 'T' }, 'Neula de farina de blat.'),
  A('pasta fullada', { gluten: 'I', llet: 'T', ous: 'T' }, 'Massa de blat amb greix (sovint mantega).'),
  A('beixamel|bechamel', { gluten: 'I', llet: 'I' }, 'Farina i llet.'),
  A('croquetes|croqueta', { gluten: 'I', llet: 'I', ous: 'T' }, 'Beixamel arrebossada.'),
  A('arrebossat|arrebossada|arrebossats|arrebossades|a la romana|andalusa|piruletes|creps|crep|coulant|volcanet', { gluten: 'I', ous: 'T', llet: 'T' }, 'Arrebossat o massa de farina.'),
  // Crustacis.
  A('gamba|gambes|gambeta|gambetes|llagosti|llagostins|escamarla|escamarlans|cranc|crancs|llagosta|llagostes|bogavant|galera|galeres|crustacis|crustaci|langostino|langostinos|cigala|cigales', { crustacis: 'I' }, 'Crustaci.'),
  A('gambes congelades|gambetes congelades|gambetes xicotetes pelades congelades', { crustacis: 'I', sulfits: 'T' }, 'Crustaci congelat: sovint tractat amb sulfits.'),
  // Ous.
  A('ou|ous|rovell|rovells|clara|clares|ovoproductes|truita de creilla|truita de creilles|truita francesa|truita amb', { ous: 'I' }, 'Ou o part de l’ou.'),
  A('truita', { ous: 'T', peix: 'T' }, '«Truita» ambigua: d’ou o el peix.'),
  A('truita de riu', { peix: 'I' }, 'Truita de riu: peix.'),
  A('flan', { ous: 'I', llet: 'I' }, 'Flam d’ou i llet.'),
  A('saladet|amb salat|de salat', { peix: 'T' }, '«Salat» com a nom: salaó de peix.'),
  A('maonesa|mahonesa|maionesa|ensaladilla', { ous: 'I', mostassa: 'T' }, 'Salsa d’ou; la industrial pot portar mostassa.', { fitxa: true }),
  A('allioli', { ous: 'T' }, 'L’allioli pot portar ou.'),
  // Peix.
  A('peix|peixos|peixet|peixets|tonyina|bacalla|bacallarets|maire|aladroc|aladrocs|anxova|anxoves|sardina|sardines|lluc|llucs|llucet|llucets|emperador|mero|nero|capella|capellans|salmo|moixama|hueva|llobarro|orada|rap|verat|sorell|surimi', { peix: 'I' }, 'Peix.'),
  A('peixet de vedella|peixet de ternera', { peix: 'T' }, '«Peixet» de carn: tall de vedella, però el nom fa dubtar.'),
  A('caldo de peix|brou de peix|fumet', { peix: 'I', crustacis: 'T', molluscs: 'T', api: 'T' }, 'Brou de peix: sovint amb marisc i api.'),
  A('olives farcides', { peix: 'T' }, 'Les olives farcides solen portar anxova.'),
  // Cacauets (en valencià «cacau» és el cacauet; «cacau en pols» és el de xocolate).
  A('cacau|cacaus|cacauet|cacauets|cacahuet|cacahuets|oli de cacau|mantega de cacauet|crema de cacauet', { cacauets: 'I' }, 'Cacauet (en valencià, «cacau»).'),
  A('cacau en pols|cacau soluble', { cacauets: 'T', llet: 'T', soja: 'T' }, '«Cacau» ambigu: si és xocolate en pols, pot portar llet i soja.'),
  // Soja.
  A('soja|soia|tofu|edamame|tempeh|miso|tamari|salsa de soja|lecitina de soja', { soja: 'I' }, 'Soja.'),
  // Llet.
  A('llet|formatge|formatges|nata|iogurt|iogurts|mantega|crema de llet|llet condensada|lactosa|serum de llet|mantecado|quallada|brossat|caseina|manxego', { llet: 'I' }, 'Llet o derivat lacti.'),
  A('llet de coco|llet d ametla|llet d ametlla|llet de civada|llet de soja|llet d arros|llet de arros', { llet: 'T' }, '«Llet» vegetal: no és làctia, però el nom fa dubtar i sol compartir línia.'),
  A('margarina|margarina vegetal', { llet: 'T', soja: 'T' }, 'Margarina: pot portar sèrum de llet i lecitina de soja.', { fitxa: true }),
  // Fruits de closca (ametla, avellana, nou, anacard, pacana, nou del Brasil, festuc, macadàmia).
  A('fruits de closca|fruita seca|ametla|ametles|ametlla|ametlles|ametlat|ametlo|avellana|avellanes|nou|nous|anacard|anacards|pacana|pacanes|nou del brasil|festuc|festucs|pistatxo|pistatxos|macadamia|torro|nous tendres', { 'fruits-closca': 'I' }, 'Fruit de closca de l’annex II.'),
  A('pinyo|pinyons|pinyonets|pinyonet', { 'fruits-closca': 'T' }, 'El pinyó no és a l’annex II, però s’envasa amb fruits de closca (decisió D-P4-4).'),
  A('coco', { 'fruits-closca': 'T' }, 'El coco no és a l’annex II; contaminació creuada habitual en fruita seca (decisió D-P4-4).'),
  // Api.
  A('api|apit|apio|rave d api', { api: 'I' }, 'Api.'),
  A('verdura|verdures|verdura variada|diverses verdures', { api: 'T' }, 'Llista oberta de verdures: pot incloure api.', { obert: true }),
  A('especies|adobat|adobada|adob|moru', { api: 'T', mostassa: 'T', sesam: 'T' }, 'Barreja d’espècies o adob: contaminació creuada habitual amb api, mostassa i sèsam.', { obert: true }),
  // Mostassa, sèsam, tramussos.
  A('mostassa|mostaza', { mostassa: 'I' }, 'Mostassa.'),
  A('sesam|sesamo|ajonjoli|tahina|tahini', { sesam: 'I' }, 'Sèsam.'),
  A('tramus|tramussos|llobins|altramuz|altramuces', { tramussos: 'I' }, 'Tramussos.'),
  // Sulfits (> 10 mg/kg o mg/l).
  A('vi|vi blanc|vi negre|vins|cava|vermut|vinagreta|sulfit|sulfits|dioxid de sofre|e220|e221|e222|e223|e224|e225|e226|e227|e228|e 220|e 221|e 222|e 223|e 224|e 225|e 226|e 227|e 228', { sulfits: 'I' }, 'Vi o sulfit declarat.'),
  A('vinagre|conyac|most|most de raim|figues seques|tomaques seques|panses', { sulfits: 'T' }, 'Derivat del vi o fruita seca: sulfits habituals (cal fitxa).'),
  // Mol·luscs (inclou cefalòpodes i caragols terrestres).
  A('clotxina|clotxines|musclo|musclos|petxina|petxines|tellina|tellines|cloissa|cloisses|calamar|calamars|sepia|sepies|polp|polps|polpet|polpets|pop|pops|caragol|caragols|cargol|cargols|ostra|ostres|navalla|navalles|escopinya|escopinyes|xipiro|xipirons|tinta de calamar|molluscs|mollusc', { molluscs: 'I' }, 'Mol·lusc.'),
  A('marisc|mariscs', { crustacis: 'T', molluscs: 'T' }, '«Marisc» pot ser crustaci o mol·lusc.')
];

/* ── Elaborats: la composició depén de la marca (fitxa obligatòria) ────── */
const ELABORATS = [
  E('royal', { gluten: 'T' }, 'Gasificant químic de marca: alguns porten midó de blat.', { fitxa: true }),
  E('flam|potax', { gluten: 'T', llet: 'T' }, 'Preparat per a flam: cal la fitxa.', { fitxa: true }),
  E('avecrem|caldo|brou|caldo de carn|caldo de verdura|caldo de paella', { gluten: 'T', api: 'T', llet: 'T', soja: 'T' }, 'Brou o pastilla de brou: sovint amb gluten, api, llet o soja; cal la fitxa.', { fitxa: true }),
  E('xocolate|xocolata|xocolate a la tassa', { llet: 'T', soja: 'T', 'fruits-closca': 'T', cacauets: 'T', gluten: 'T' }, 'Xocolate: contaminació creuada habitual; el de tassa sol portar farina.', { fitxa: true }),
  E('xoric|xoriset|botifarra|botifarres|llonganissa|llonganisses|llomello|llomellos|embotit|salsitxa|salsitxes|hamburgesa|hamburguesa|kebab', { gluten: 'T', llet: 'T', soja: 'T', sulfits: 'T' }, 'Preparat carni o embotit: cal la fitxa (lactosa, proteïna de soja, sulfits).', { fitxa: true }),
  E('gula|gules|gula del nord|cuixetes de mar', { peix: 'I', crustacis: 'T', gluten: 'T', ous: 'T', soja: 'T' }, 'Surimi: peix amb aglutinants.', { fitxa: true }),
  E('licor', { llet: 'T', ous: 'T', 'fruits-closca': 'T' }, '«Qualsevol licor»: n’hi ha de crema, d’ou o d’ametla.', { fitxa: true, obert: true })
];

/* ── Vocabulari de carta (noms de producte del Bar) ────────────────────── */
const CARTA = [
  A('coca|coques|coquetes|bunyols|bunyol|xurros|xurro|magdalena|magdalenes|rosquetes|mona|mones', { gluten: 'I' }, 'Massa de farina de blat.'),
  A('tarta|pastis|pastissos|bescuit|pastisseria', { gluten: 'T', ous: 'T', llet: 'T' }, 'Pastís: n’hi ha sense farina (bescuit d’ametla).', { obert: true }),
  A('braves|brava', { gluten: 'T', api: 'T' }, 'Salsa brava: sovint lligada amb farina.'),
  A('cafe tallat|cappuccino|capuccino|cafe amb llet', { llet: 'I' }, 'Cafè amb llet.'),
  A('bombo', { llet: 'T' }, '«Bombó»: cafè amb llet condensada o gelat.'),
  A('calimotxo|sangria|tinto de verano|tinto verano|mistela', { sulfits: 'I' }, 'Beguda de vi.'),
  A('brandy|brandi', { sulfits: 'T' }, 'Destil·lat de vi: sulfits possibles.'),
  N('whisky|ginebra|vodka|ron|tequila|anis|orujo|gintonic|infusio|orxata|aquarius|cola|tonica', {}, 'Destil·lat o beguda sense al·lergen típic (els destil·lats de cereals són exempts de l’annex II).'),
  N('espardenyes|espardenya', {}, 'Cogombre de mar (equinoderm): no és mol·lusc ni crustaci.'),
  E('callos', { gluten: 'T', llet: 'T', soja: 'T', sulfits: 'T' }, 'Guisat amb embotits.', { fitxa: true }),
  E('papes|patates xips', { gluten: 'T', llet: 'T' }, 'Aperitiu industrial amb sabor.', { fitxa: true }),
  E('oreo|cookies|galetes de xocolate', { gluten: 'I', llet: 'T', soja: 'T' }, 'Galeta industrial de blat.', { fitxa: true })
];

/* ── Capa castellana i variants (Mercadona, Nevera, cartes en castellà) ── */
const CASTELLA = [
  ...llista('S', 'con y los las para por unos unas'),
  ...llista('Q', `verds verge seco secos dulce dulces rojo rojos rojas verde virgen extra cerdo redo poble pages forner llanda viada`),
  N('tomate|tomaquet|tomaquets|tomatiga|tomatigues|patata|patates|patatas|queradilla|queradilles|cebolla|cebollas|ajo|ajos|cabeces d alls|pebrot|pebrots|pimiento|pimientos|albergina|albergines|berenjena|berenjenas|carabasso|carabassons|carabasseta|carabassetes|calabacin|calabacines|mongeta tendra|mongetes tendres|judia verde|judias verdes|nabo|nabos|card|cards|cardo|cardos|acelga|acelgas|zanahoria|zanahorias|arroz|aceite|aceite de oliva|costilla|costillas|pimenton|azafran|barra|costella'),
  A('mongeta|mongetes|mongeta seca|mongetes seques|alubia|alubias|garbanzo|garbanzos|llentia|llenties|lenteja|lentejas', { gluten: 'T' }, 'Llegum sec: grans de cereal per contaminació creuada (decisió D-P4-5).'),
  A('harina|trigo|pan|pan rallado|cebada|centeno|avena|cerveza|galleta|galletas|cuscus|bulgur|rebozado|empanado|empanada|empanadilla|fideo|fideos|macarrones|espaguetis|spaghetti', { gluten: 'I' }, 'Cereal amb gluten o derivat (castellà).'),
  A('levadura', { gluten: 'T' }, '«Levadura» pot ser química.'),
  A('gambas|langosta|langostas|necora|carabinero|quisquilla|cangrejo|cangrejos|cigalas|crustaceo|crustaceos', { crustacis: 'I' }, 'Crustaci (castellà).'),
  A('huevo|huevos|yema|yemas|mayonesa|claras|albumina', { ous: 'I' }, 'Ou (castellà).'),
  A('pescado|pescados|atun|bonito|bacalao|merluza|boqueron|boquerones|anchoa|anchoas|salmon|caballa|lubina|dorada|pez espada|abadejo|sardinas|trucha', { peix: 'I' }, 'Peix (castellà).'),
  A('mani|cacahuete|cacahuetes', { cacauets: 'I' }, 'Cacauet (castellà).'),
  A('soya', { soja: 'I' }, 'Soja (castellà).'),
  A('leche|queso|quesos|mantequilla|yogur|yogures|requeson|suero de leche|caseinato', { llet: 'I' }, 'Llet (castellà).'),
  A('leche de coco|leche de almendra|leche de avena|leche de soja|leche de arroz', { llet: 'T' }, '«Leche» vegetal: el nom fa dubtar.'),
  A('almendra|almendras|avellanas|avellana|nuez|nueces|anacardo|anacardos|pistacho|pistachos|turron|nuez de brasil|nueces de brasil|frutos de cascara', { 'fruits-closca': 'I' }, 'Fruit de closca (castellà).'),
  N('nuez moscada', {}, 'Espècia: no és fruit de closca.'),
  A('pinon|pinones', { 'fruits-closca': 'T' }, 'Pinyó (castellà).'),
  A('sesamo', { sesam: 'I' }, 'Sèsam (castellà).'),
  A('altramuz|chocho|chochos', { tramussos: 'I' }, 'Tramús (castellà).'),
  A('vino|tinto|sulfitos|dioxido de azufre', { sulfits: 'I' }, 'Vi o sulfit (castellà).'),
  A('pasas|orejones|sidra', { sulfits: 'T' }, 'Sulfits habituals (castellà).'),
  A('mejillon|mejillones|almeja|almejas|berberecho|berberechos|chirla|chirlas|navaja|navajas|calamares|pulpo|pulpos|chipiron|chipirones|caracol|caracoles|vieira|vieiras|zamburina|zamburinas|coquina|coquinas|choco|chocos|moluscos|molusco|ostras', { molluscs: 'I' }, 'Mol·lusc (castellà).'),
  /* R15b · Formes que el motor anterior reconeixia i que el lèxic tancat havia perdut (verificació del carril G1). */
  A('moll|molls|boquerons|bacallaret', { peix: 'I' }, 'Peix: moll, boquerons i bacallaret.'),
  A('sepias', { molluscs: 'I' }, 'Mol·lusc (castellà).'),
  A('pecana|pecanes', { 'fruits-closca': 'I' }, 'Pacana, amb la grafia «pecana».'),
  A('sulfito', { sulfits: 'I' }, 'Sulfit (castellà).'),
  A('marisco|mariscos', { crustacis: 'T', molluscs: 'T' }, '«Marisco» pot ser crustaci o mol·lusc.'),
  E('morcilla|morcillas|chorizo|salchicha|salchichas', { gluten: 'T', llet: 'T', soja: 'T', sulfits: 'T' }, 'Embotit (castellà).', { fitxa: true })
];

/* ── Capa anglesa mínima (etiquetes d'importació; mai per a deduir absències) ── */
const ANGLES = [
  A('wheat|rye|barley|oat|oats|spelt|flour|bread|biscuit|biscuits|beer|malt', { gluten: 'I' }, 'Cereal amb gluten (anglés).'),
  A('prawn|prawns|shrimp|shrimps|crab|crabs|lobster|lobsters|crustaceans', { crustacis: 'I' }, 'Crustaci (anglés).'),
  A('egg|eggs|yolk|yolks|mayonnaise', { ous: 'I' }, 'Ou (anglés).'),
  A('fish|tuna|cod|anchovy|anchovies|hake|sardine', { peix: 'I' }, 'Peix (anglés).'),
  A('peanut|peanuts', { cacauets: 'I' }, 'Cacauet (anglés).'),
  A('soy|soybean|soybeans', { soja: 'I' }, 'Soja (anglés).'),
  A('milk|cheese|butter|cream|yogurt|yogurts|yoghurt|yoghurts|whey|casein|lactose', { llet: 'I' }, 'Llet (anglés).'),
  A('nuts|tree nuts|almond|almonds|hazelnut|hazelnuts|walnut|walnuts|cashew|cashews|pecan|pecans|pistachio|pistachios|brazil nuts', { 'fruits-closca': 'I' }, 'Fruit de closca (anglés).'),
  A('celery|celeriac', { api: 'I' }, 'Api (anglés).'),
  A('mustard', { mostassa: 'I' }, 'Mostassa (anglés).'),
  A('sesame', { sesam: 'I' }, 'Sèsam (anglés).'),
  A('wine|sulphite|sulphites|sulfite|sulfites|sulphur dioxide|sulfur dioxide', { sulfits: 'I' }, 'Vi o sulfit (anglés).'),
  A('vinegar', { sulfits: 'T' }, 'Vinagre (anglés).'),
  A('lupin|lupins|lupine', { tramussos: 'I' }, 'Tramús (anglés).'),
  A('mollusks|squid|cuttlefish|octopus|mussel|mussels|clam|clams|cockle|cockles|oyster|oysters|snail|snails', { molluscs: 'I' }, 'Mol·lusc (anglés).'),
  A('shellfish|seafood', { crustacis: 'T', molluscs: 'T' }, '«Shellfish» pot ser crustaci o mol·lusc.')
];

export const ENTRADES = Object.freeze([...S, ...M, ...Q, ...MARCADORS, ...ESTRIS, ...NEUTRES, ...AL, ...ELABORATS, ...CARTA, ...CASTELLA, ...ANGLES]);

/* ── Referències a receptes del mateix llibre («Què dinem?») ───────────── */
export const REFERENCIES = Object.freeze([
  { formes: 'crema per farcir|crema per a farcir|crema per farcir pastissos', recepta: 'crema-per-a-farcir', bloc: null },
  { formes: 'pilotes de dacsa', recepta: 'olleta-murera', bloc: 'Ingredients de les pilotes' },
  { formes: 'pilotes de carn|pilotes', recepta: 'olla-de-carn', bloc: 'Ingredients de les pilotes' },
  { formes: 'mandonguilles de carn|mandonguilles', recepta: 'mandonguilles-de-carn', bloc: null }
]);
/* Fora del llibre, una referència sense resoldre es llig així (mai com a buida). */
export const REFERENCIA_NO_RESOLTA = Object.freeze({ marques: Object.freeze({ ous: 'T', gluten: 'T', llet: 'T' }), motiu: 'Preparació d’una altra recepta sense resoldre: lligants habituals.' });

/* ── Frases que s'esborren abans de llegir ─────────────────────────────── */
/* Mesura amb paraules d'ingredient: «2 envasos de iogurt natural plens de farina» (el iogurt és la mesura). */
export const FRASES_MESURA = Object.freeze([
  /\benvas(?:os)? de iogurt (?:a?n?atural )?(?:ple|plens) d(?:e)?\b/g
]);
/* Adverbis de la prosa que semblen ingredients: «de nou», «de bell nou» (tornar a fer), no la nou. */
export const FRASES_BUIDES_PROSA = Object.freeze([/\bde (?:bell )?nou\b/g]);

/* ── Tokens que obrin la llista (cobertura sempre parcial) ─────────────── */
export const OBERTS = Object.freeze(['etc']);
