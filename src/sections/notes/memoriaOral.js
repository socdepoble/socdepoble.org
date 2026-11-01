/**
 * memoriaOral.js — L'estructurador local de memòria oral de «🎴 Proposa Card»
 * (IDEA-29, IDEA-41 i IDEA-49 del Llibre Mestre; T3.2 de la marató nocturna
 * 261101). Germà de proposaCard.js, que el reexporta.
 *
 * QUÈ FA. D'un relat oral transcrit (text pla) o d'una nota del Bloc
 * ({ title, subtitle, lead, content }, l'HTML com el desa el Bloc), proposa
 * una fitxa: un títol estructurat, una descripció d'una frase, un resum fet
 * només amb frases del mateix relat, les etiquetes temàtiques d'un vocabulari
 * rural tancat (VOCABULARI_RURAL) amb les paraules del relat que les
 * justifiquen, el municipi esmentat (només un dels pobles de la llavor del
 * codi, townsSeed.js, o de la llista que passe qui crida; mai cap altre) i el
 * document Open Knowledge Format v0.2 que la representa, llest per a publicar
 * quan una persona l'haja revisat.
 *
 * EL «MÈTODE KARPATHY», SENSE MODEL DE LLENGUATGE. Andrej Karpathy (gist «LLM
 * Wiki», 2026-04-04) descriu una base de coneixement on un model de llenguatge
 * llig fonts crues, que no es toquen mai, i en manté una wiki de pàgines
 * markdown amb un índex (index.md) i un registre (log.md). Ací en prenem
 * l'esquema i no el model: la font crua (la nota o la transcripció) no es
 * modifica; cada relat fa una pàgina; indexOkf() i entradaLog() fan l'índex i
 * el registre; i l'extracció és determinista: vocabulari tancat, recompte de
 * paraules i tria de frases. No hi ha xarxa, ni tòkens, ni cap model. El
 * motor no entén el relat: no escriu cap frase pròpia dins del resum, no
 * corregix ni completa res i pot triar una etiqueta per una paraula que en el
 * relat té un altre sentit. Per això la fitxa naix com a esborrany
 * (`status: draft`, sense `verified`) i només una persona la promou, amb
 * marcaRevisioHumana(), que també li deixa descartar etiquetes i triar el
 * poble entre els candidats (o cap) abans de signar (Gauntlet 261101, B2-04).
 * D-5 (pla 261101_1246, decisió del Mestre) · La persona també pot afegir el
 * que falta: una etiqueta del vocabulari o una de lliure (etiquetaNova; com a
 * molt MAX_ETIQUETES_LLIURES de lliures i MAX_ETIQUETES_REVISADES en total) i
 * un poble que la màquina no ha trobat, dit com el diu la gent («Jijona», «la
 * Torre», «Alcoy»: resolPobleDeText), d'entre els que coneix l'aplicació i
 * els municipis de referència (pobles/aliesDePobles.js · catalegDePobles).
 * El detector dels relats coneix els mateixos àlies, però només proposa
 * pobles de la llista de l'aplicació: mai no s'inventa cap poble. Els àlies
 * són dades (pobles/aliesDePoblesSeed.js o el camp `alies` de la fitxa del
 * poble), mai codi. /page/fediversity descriu el Mètode Karpathy de la
 * candidatura «amb models de llenguatge»: este mòdul no és eixe mètode, en
 * fa només la part determinista.
 *
 * OKF v0.2 (GoogleCloudPlatform/knowledge-catalog, okf/SPEC.md, branca main,
 * llegida el 2026-11-01; SHA-256 26aa5da029278939f914e578107242d9607d4f2d
 * c5fe153272b82f9ed1030101). Camps que escriu, amb el nom exacte de
 * l'especificació:
 *  · `type` (§4.1, l'únic obligatori): TIPUS_OKF.
 *  · `title`, `description` i `tags` (§4.1, recomanats).
 *  · `resource` (§4.1): només si qui crida dona l'URL de la nota (`recurs`).
 *  · `status` (§5.4): `draft`; marcaRevisioHumana() el passa a `stable`.
 *  · `generated: { by, at }` (§5.2): `by` és ACTOR_ESTRUCTURADOR, un actor
 *    «<producer>/<version>» (§7); `at`, només si qui crida dona l'hora (`ara`):
 *    el motor no llig mai el rellotge, perquè siga determinista.
 *  · `verified` (§5.2): el motor no el posa mai. marcaRevisioHumana() hi afig
 *    `{ by: human:<id>, at }`, i la fitxa passa a «human-reviewed» (§5.3).
 *  · `stale_after` (§5.5): només si qui crida el dona (`caducaEl`); un
 *    testimoni no caduca tot sol.
 *  · `sources` (§5.1): una entrada `{ id: relat, resource, title, author? }`, i
 *    la nota a peu `[^relat]` darrere del resum (l'atribució per afirmació).
 *    Sense URL, `resource` és un descriptor d'abast, com permet el §5.1.
 *  · `municipi`: una clau d'extensió del productor (el §4.1 les permet); no és
 *    cap camp d'OKF.
 *  · `okf_version: "0.2"` (§12) només va a l'index.md arrel (indexOkf).
 * No escriu `usage_count`, `usage_window`, `last_modified` ni els camps de les
 * computacions atestades (§10): no hi ha cap dada vera per a omplir-los.
 *
 * RENDIMENT. Tot el recorregut és lineal en la mida de l'entrada: l'HTML es
 * llig d'una sola passada; cada regex té classes repetides sense cap
 * quantificador niat ambigu; i la cerca al vocabulari és per mapa, amb una
 * finestra fitada. Un text (relat, títol i subtítol junts) de més de
 * MIDA_MAXIMA_TEXT caràcters no s'analitza (motiu `massa-llarg`).
 *
 * Pur: sense React, sense DOM, sense disc, sense xarxa i sense rellotge. El
 * mateix relat i les mateixes opcions donen sempre la mateixa fitxa.
 */
import { esLlavorDeNota } from './llavorNota.js';
import { MOCK_TOWNS } from '../pobles/townsSeed.js';
import { aliesDelPoble, catalegDePobles } from '../pobles/aliesDePobles.js';

/* 1.1.0 (D-5, 261101): el detector coneix els àlies de poble, i la revisió
   humana pot afegir etiquetes lliures i un poble que no és candidat. */
export const VERSIO_ESTRUCTURADOR = '1.1.0';
/** L'actor de `generated.by` (OKF v0.2 §7: «<producer>/<version>»). */
export const ACTOR_ESTRUCTURADOR = `socdepoble-memoria-oral/${VERSIO_ESTRUCTURADOR}`;
export const OKF_VERSIO = '0.2';
export const TIPUS_OKF = 'Memòria oral';
/** El descriptor d'abast de `sources[].resource` quan la nota no té URL (§5.1). */
export const FONT_SENSE_URL = 'Bloc de Notes de Sóc de Poble (nota sense URL pública)';

/** Per damunt d'esta mida de text (caràcters), el relat no s'analitza. */
export const MIDA_MAXIMA_TEXT = 2 * 1024 * 1024;
/** Per davall d'estes paraules, la fitxa ix amb el motiu `curt`. */
export const MIN_PARAULES = 12;
/** Des d'estes paraules, una etiqueta demana dues coincidències (abans, una). */
export const PARAULES_TEXT_LLARG = 80;
export const MAX_ETIQUETES = 5;
export const MAX_FRASES_RESUM = 3;
export const MAX_RESUM = 480;
export const MAX_TITOL = 120;
const TALL_TITOL = 80;
const MAX_PROVES = 6;
const MAX_PROVA = 40;
/** La llargària mínima d'una arrel del vocabulari. */
export const MIN_ARREL = 4;
const MAX_SLUG = 60;
/* D-5 (pla 261101_1246) · Les etiquetes lliures de la revisió humana: de
   MIN_ETIQUETA_LLIURE a MAX_ETIQUETA_LLIURE caràcters (punts de codi), com a
   molt MAX_ETIQUETES_LLIURES, i MAX_ETIQUETES_REVISADES etiquetes en total. */
export const MIN_ETIQUETA_LLIURE = 2;
export const MAX_ETIQUETA_LLIURE = 40;
export const MAX_ETIQUETES_LLIURES = 5;
export const MAX_ETIQUETES_REVISADES = MAX_ETIQUETES + 5;
/** El text més llarg (caràcters) que el selector de poble intenta resoldre. */
export const MAX_TEXT_POBLE = 80;
/* Un text d'etiqueta més llarg (abans de netejar-lo) ni es mira. */
const MAX_TEXT_ETIQUETA = 4 * MAX_ETIQUETA_LLIURE;

/* Gauntlet 2 (261101, G2-MO-07) · Cada avís del motor porta un codi
   (`codisAvis`, paral·lel a `avisos`), perquè la pantalla el puga traduir
   (editor.memoriaOral.avis.<codi>) amb el text d'ací com a reserva. El
   markdown OKF es queda en valencià: és el document. */
export const AVISOS_MEMORIA = Object.freeze({
  curt: `El relat té menys de ${MIN_PARAULES} paraules: la fitxa és orientativa.`,
  diversosPobles: 'El relat esmenta més d\'un poble: cal confirmar el municipi.',
  massaLlarg: `El text (relat, títol i subtítol) passa de ${MIDA_MAXIMA_TEXT} caràcters: no s'ha analitzat.`
});

export const MOTIUS_MEMORIA = Object.freeze({
  /** Hi ha relat i la fitxa és completa. */
  proposta: 'proposta',
  /** Hi ha relat, però massa curt (menys de MIN_PARAULES paraules): la fitxa és orientativa. */
  curt: 'curt',
  /** No hi ha cap text de relat. */
  buit: 'buit',
  /** El cos és la plantilla de format verge del Bloc (llavorNota.js). */
  llavor: 'llavor',
  /** El text passa de MIDA_MAXIMA_TEXT: no s'analitza. */
  massaLlarg: 'massa-llarg'
});

/** Els esglaons de confiança d'OKF v0.2 §5.3, del més baix al més alt. */
export const NIVELLS_CONFIANCA = Object.freeze({
  senseVerificar: 'unverified',
  maquina: 'machine-confirmed',
  huma: 'human-reviewed'
});

const tema = (id, nom, titol, descripcio, { arrels = [], paraules = [], expressions = [], ambMajuscula = [], ambContext = [] }) => Object.freeze({
  id,
  nom,
  titol,
  descripcio,
  arrels: Object.freeze(arrels),
  paraules: Object.freeze(paraules),
  expressions: Object.freeze(expressions),
  ambMajuscula: Object.freeze(ambMajuscula),
  ambContext: Object.freeze(ambContext.map((c) => Object.freeze({
    ...c,
    formes: Object.freeze([...c.formes]),
    ...(c.noDespresDe ? { noDespresDe: Object.freeze([...c.noDespresDe]) } : {})
  })))
});

/*
 * El vocabulari rural tancat. Cada tema diu per què existix (`descripcio`) i
 * quines formes el disparen:
 *  · `paraules`: formes exactes («pou», «bassa»);
 *  · `expressions`: seqüències exactes de paraules («el riu»);
 *  · `ambMajuscula`: formes que només compten escrites amb majúscula
 *    («França», i no l'adjectiu «franca»);
 *  · `ambContext` (Gauntlet 261101, B2-02): formes que també són paraules
 *    corrents i només compten en el seu context: `seguidaDeNom`, si darrere
 *    ve un nom propi, amb article o sense («li deien el Rabosa», i no «li
 *    deia que tornara»); `noDespresDe`, si no van darrere d'eixes paraules
 *    («no hi havia més remei»); i `nomPropi`, si amb majúscula a mitjan
 *    frase són el nom d'una persona («la tia Remei»);
 *  · `arrels`: el principi d'una paraula, de MIN_ARREL lletres com a mínim
 *    («oliv» → olives, oliveres); si n'hi ha més d'una, guanya la més llarga
 *    («llaurador» → oficis; «llaur» → collita). Les arrels que també són
 *    cognoms o noms de pila (ARRELS_QUE_SON_NOMS: Ferrer, Pastor, Oliver,
 *    Hortènsia, Ballester…) no compten escrites amb majúscula a mitjan frase.
 * Tot es compara sense accents, sense majúscules i sense el punt volat
 * («col·lecta» = «collecta»). Les arrels que tocarien paraules corrents (escol-
 * → escoltar, cabr- → cabre, seg- → seguir, process- → processar, patron- →
 * els patrons de la fàbrica) van com a formes exactes; i les formes que en un
 * relat oral solen voler dir una altra cosa («el patró» de la fàbrica, «riu»
 * de riure, «contava» de comptar) no hi són o només compten en context.
 */
export const VOCABULARI_RURAL = Object.freeze([
  tema('festes', 'Festes i tradicions', 'Les festes',
    'Festes patronals, processons, moros i cristians, fogueres, revetles, balls de plaça i la missa del diumenge.', {
      arrels: ['fest', 'revetl', 'verben', 'romeri', 'compars', 'foguer', 'ermit', 'carnestolt', 'ball'],
      paraules: ['processó', 'processons', 'patronal', 'patronals', 'falles', 'faller', 'fallers', 'fallera', 'falleres', 'nadal', 'nadals', 'pasqua', 'pasqües', 'traca', 'traques', 'coet', 'coets', 'pólvora', 'cucanya', 'missa', 'misses'],
      expressions: ['moros i cristians', 'castell de focs']
    }),
  tema('oficis', 'Oficis i treballs', 'Els oficis',
    'Els oficis de la gent: llauradors, pastors, ferrers, fusters, forners, moliners, espardenyers i jornalers.', {
      arrels: ['llaurador', 'pastor', 'ferrer', 'fuster', 'forner', 'espardenyer', 'teixidor', 'carboner', 'jornal', 'moliner', 'barber', 'sabater', 'picapedrer', 'traginer', 'esquilador', 'treball', 'botig', 'modist', 'fàbric'],
      paraules: ['ofici', 'oficis', 'forn', 'forns', 'molí', 'molins', 'taller', 'tallers', 'paleta', 'paletes', 'cosir', 'cosia', 'cosien']
    }),
  tema('aigua', "L'aigua", "L'aigua",
    "Fonts, pous, sèquies, basses, cisternes, safarejos, pluja i sequera: com es trobava i es repartia l'aigua.", {
      arrels: ['sèqui', 'sequer', 'cistern', 'aljub', 'assut', 'embassa', 'tempest'],
      paraules: ['aigua', 'aigües', 'font', 'fonts', 'pou', 'pous', 'bassa', 'basses', 'barranc', 'barrancs', 'pluja', 'pluges', 'ploure', 'plovia', 'plou', 'reg', 'regar', 'regava', 'regaven', 'regàvem', 'regadiu', 'regadius', 'safareig', 'safarejos', 'llavador', 'llavadors', 'càntir', 'càntirs', 'pantà', 'pantans', 'neu'],
      /* «riu» tot sol també és riure («mon germà riu»): el riu, amb el seu article o la seua preposició. */
      expressions: ['el riu', 'al riu', 'del riu', 'pel riu', 'un riu', 'els rius', 'als rius', 'dels rius', 'pels rius']
    }),
  tema('collita', 'Collita i camp', 'La collita',
    "Sembrar, segar, batre i collir: el blat, les olives, les ametles, el raïm, les cireres i el calendari del camp.", {
      arrels: ['collit', 'sembr', 'verem', 'viny', 'oliv', 'ametl', 'cirer', 'garrof', 'maçan', 'pomer', 'hort', 'llaur', 'conre', 'tomac', 'tomaq', 'tomat', 'figuer', 'sega'],
      paraules: ['collir', 'collia', 'collien', 'collíem', 'collint', 'arreplegar', 'arreplegàvem', 'arreplegaven', 'poma', 'pomes', 'batre', 'batia', 'batíem', 'batien', 'batuda', 'batudes', 'aixada', 'aixades', 'arada', 'arades', 'falç', 'falçs', 'camp', 'camps', 'blat', 'ordi', 'civada', 'panís', 'dacsa', 'raïm', 'raïms', 'figa', 'figues', 'fava', 'faves', 'fesols', 'garba', 'garbes', 'trill', 'trills', 'ameller', 'amellers']
    }),
  tema('malnoms', 'Malnoms i renoms', 'Els malnoms',
    'Els malnoms de les famílies i de la gent del poble, i com es deien les cases.', {
      arrels: ['malnom', 'renom', 'sobrenom'],
      expressions: ['mal nom'],
      /* El verb dir: només és un malnom si darrere ve el nom («li deien el Rabosa»). */
      ambContext: [{
        formes: ['li deien', 'li dien', 'li diuen', 'li deia', 'els deien', 'els dien', 'els diuen', 'ens deien', 'ens dien', 'ens diuen'],
        seguidaDeNom: true
      }]
    }),
  tema('cancons', 'Cançons i música', 'Les cançons',
    'Cançons de treball, de bressol i de ronda, albades, jotes, dolçaina i tabal, i la banda de música.', {
      arrels: ['cançó', 'albad', 'dolçain', 'músic', 'guitarr', 'cantador'],
      paraules: ['cantar', 'cantava', 'cantaven', 'cantàvem', 'cantaves', 'cantaren', 'cantant', 'cante', 'cantem', 'canten', 'cant', 'cants', 'tabal', 'tabals', 'tabalet', 'bressol', 'jotes', 'acordió', 'acordions'],
      expressions: ['banda de música'],
      /* «No entenia ni jota» no és cap cançó (Gauntlet 2, 261101, G2-MO-05). */
      ambContext: [{ formes: ['jota'], noDespresDe: ['ni'] }]
    }),
  tema('cuina', 'Cuina i rebost', 'La cuina',
    'Plats i receptes de casa, la matança, els embotits, el forn de coques i el rebost.', {
      /* Sense «recept»: la recepta del metge o de la farmàcia no és cap plat
         (G2-MO-05). */
      arrels: ['matanç', 'embotit', 'botifarr', 'llonganiss', 'sobrassad', 'paell', 'cuin', 'rebost', 'gaspatx', 'ollet'],
      paraules: ['arròs', 'coca', 'coques', 'torró', 'torrons', 'bullit', 'farina', 'oli']
    }),
  tema('bestiar', 'Animals i bestiar', 'El bestiar',
    'Ramats i pastures, animals de càrrega i de corral, i la caça.', {
      arrels: ['ramat', 'ovell', 'corral', 'conill', 'gallin', 'transhumanç', 'bestiar', 'cavall', 'pollastr', 'abell', 'pastur'],
      paraules: ['mula', 'mules', 'matxo', 'matxos', 'burro', 'burros', 'ase', 'ases', 'cabra', 'cabres', 'cabrit', 'cabrits', 'cabrer', 'porc', 'porcs', 'porquet', 'vaca', 'vaques', 'caçador', 'caçadors']
    }),
  tema('infancia', 'Infància i escola', 'La infància',
    "L'escola, les mestres, els jocs de carrer i els records de quan eren xiquets.", {
      arrels: ['xiquet', 'pissarr'],
      paraules: ['escola', 'escoles', 'escolar', 'escolars', 'escoleta', 'mestra', 'mestres', 'infància', 'joc', 'jocs', 'jugar', 'jugava', 'jugaven', 'jugàvem']
    }),
  tema('guerra', 'Guerra i postguerra', 'La guerra',
    'La guerra, la postguerra, el racionament, l\'estraperlo i la fam.', {
      arrels: ['guerr', 'postguerr', 'racionam', 'estraperl', 'soldat', 'refugi', 'bombarde', 'milici'],
      paraules: ['fam', 'cartilla', 'cartilles', 'maquis']
    }),
  tema('emigracio', 'Emigració i tornada', "L'emigració",
    "La gent que se'n va anar a treballar a França, a la ciutat o a Amèrica, i la que va tornar.", {
      arrels: ['emigr', 'exili'],
      paraules: ['Amèrica', 'Alemanya'],
      ambMajuscula: ['França']
    }),
  tema('remeis', 'Remeis i sabers', 'Els remeis',
    'Remeis de casa, herbes remeieres, curanderes i saludadors.', {
      arrels: ['herb', 'infusi', 'curander', 'saludador', 'ungüent', 'cataplasm', 'tisan'],
      paraules: ['remeis', 'remeier', 'remeiers', 'remeiera', 'remeieres', 'ventoses'],
      expressions: ["mal d'ull"],
      /* «No hi havia més remei», «quin remei!» i la tia Remei no són cap remei. */
      ambContext: [{ formes: ['remei'], noDespresDe: ['més', 'quin', 'altre'], nomPropi: true }]
    }),
  tema('rondalles', 'Rondalles i dites', 'Les rondalles',
    'Rondalles, llegendes, contes, refranys, endevinalles i dites que es contaven a la vora del foc.', {
      arrels: ['rondall', 'llegend', 'refrany', 'endevinall'],
      /* Sense «contava»: també és comptar («contava els cèntims»). Sense
         «conte» ni «dita»: «que ningú no ho conte» és contar i «una cosa
         dita» és el participi de dir; «contes» i «dites» ja hi són (G2-MO-05). */
      paraules: ['bruixa', 'bruixes', 'bruixot', 'contes', 'dites']
    })
]);

const TEMES_PER_ID = new Map(VOCABULARI_RURAL.map((t) => [t.id, t]));

/* Els pobles de la llavor que també són una paraula corrent: només compten amb
   majúscula («Relleu», no «el relleu del terreny»; «Sella», no «la sella de
   la mula»). Una llista de pobles de qui crida ho marca per poble, amb
   `ambMajuscula: true` (Gauntlet 261101, B2-01). */
const POBLES_AMB_SENTIT_COMU = new Set(['relleu', 'sella']);
/* Gauntlet 2 (261101, G2-MO-04) · Les arrels del vocabulari que també són
   cognoms o noms de pila valencians: Ferrer, Fuster, Pastor, Forner, Moliner,
   Barber, Sabater, Teixidor, Carboner (oficis); Oliver, Oliva i Olivia,
   Hortènsia, Cirer, Vinyes i Vinyals, Segarra, Figueres i Figuerola, Pomer,
   Ametller (collita); Ballester (festes); Cavaller, Abellán i Corrales
   (bestiar). Amb majúscula a mitjan frase («la senyora Pastor», «Vicent
   Oliver») són el nom d'una persona i no compten; a l'inici de la frase o en
   una frase tota en majúscules la majúscula no diu res, i sí que compten.
   «guerr» no hi és: «la Guerra Civil» amb majúscula és la guerra. Cada una
   ha de ser una arrel del vocabulari (memoriaOral.test.js ho comprova). */
export const ARRELS_QUE_SON_NOMS = Object.freeze(['ferrer', 'fuster', 'pastor', 'forner', 'moliner', 'barber', 'sabater', 'teixidor', 'carboner',
  'oliv', 'hort', 'cirer', 'viny', 'sega', 'figuer', 'pomer', 'ametl', 'ball', 'cavall', 'abell', 'corral']);
const ARRELS_DE_NOM = new Set(ARRELS_QUE_SON_NOMS);
const ARTICLES = new Set(['el', 'els', 'la', 'les', 'l']);
/* L'article d'un nom de persona: «li deien el Rabosa», «en Pep», «na Maria». */
const ARTICLES_DE_NOM = new Set(['el', 'els', 'la', 'les', 'l', 'en', 'na']);
/* A l'inici de frase o en una frase tota en majúscules, la majúscula no diu
   res: una forma que només compta amb majúscula hi necessita una d'estes
   preposicions davant («Vaig nàixer a Relleu», «A FRANÇA», «DE SELLA»). */
const PREPOSICIONS_DE_LLOC = new Set(['a', 'de', 'd', 'en', 'per', 'des', 'cap', 'fins', 'entre']);
const TE_MINUSCULA = /\p{Ll}/u;

/* Una paraula: lletres, marques i xifres, amb el punt volat entre lletres
   («col·lecció» és una paraula). Les dues classes són disjuntes: cap
   retrocés quadràtic. */
const PARAULA = /[\p{L}\p{M}\p{N}]+(?:[\u00b7\u0387\u2027\u22c5][\p{L}\p{M}\p{N}]+)*/gu;
const MARQUES = /\p{M}/gu;
const PUNTS_VOLATS = /[\u00b7\u0387\u2027\u22c5]/g;
const NOMES_ASCII = /^[\x20-\x7e]*$/;
const NO_SLUG = /[^a-z0-9]/g;
const CONTROLS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f-\u009f]/g;
const ESPAIS = /\s+/g;
const ENTITAT = /&(?:#(\d{1,7})|#[xX]([0-9a-fA-F]{1,6})|([a-zA-Z]{2,8}));/g;
/* Una data ISO 8601 amb fus i amb segons (sense segons, YAML la llig com una
   cadena i no com una data). Els components es comproven a esInstantIso: el
   30 de febrer o les 24:00 no són cap data (Gauntlet 261101, B2-06). */
const ISO_AMB_FUS = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(?:Z|[+-](\d{2}):(\d{2}))$/;
const ID_PERSONA = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;
const ACTOR_AMB_PREFIX = /^[a-z][a-z0-9_-]{0,31}:\S{1,128}$/;
const ACTOR_PRODUCTOR = /^[^\s/]{1,128}\/\S{1,64}$/;
/* Un URL http(s) o un camí del lloc. «//host/…» i «/\host/…» no són cap camí:
   el navegador els llig com un URL a un altre domini (Gauntlet 261101, B2-13). */
const URL_O_CAMI = /^(?:https?:\/\/[^\s<>"]{1,2040}|\/(?![/\\])[^\s<>"\\]{0,2040})$/;
const SLUG_PLA = /^[a-z][a-z0-9-]{0,63}$/;
/* L'identificador d'un poble com el fa slugDe(): el municipi d'un camí OKF. */
const ID_POBLE = /^[a-z0-9][a-z0-9-]{0,63}$/;
const EMPREMTA_DEL_CAMI = /-([0-9a-f]{8})\.md$/;
/* Una frase que ja acaba en punt (amb les cometes o el parèntesi que el tanquen). */
const ACABA_EN_PUNT = /[.!?…][»"”’')]*$/;
const YAML_RESERVATS = new Set(['y', 'n', 'yes', 'no', 'on', 'off', 'true', 'false', 'null']);
const NO_IMPRIMIBLES_YAML = /[\u007f-\u009f\u2028\u2029\ufeff\ufffe\uffff]/g;
const ESPECIALS_MD = /[\\`*_[\]<>|~&]/g;
const STATUS_OKF = new Set(['draft', 'stable', 'deprecated']);

const ENTITATS_NOMENADES = new Map([
  ['amp', '&'], ['lt', '<'], ['gt', '>'], ['quot', '"'], ['apos', "'"], ['nbsp', ' '], ['middot', '·'],
  ['rsquo', '’'], ['lsquo', '‘'], ['ldquo', '“'], ['rdquo', '”'], ['laquo', '«'], ['raquo', '»'],
  ['hellip', '…'], ['ndash', '–'], ['mdash', '—']
]);
const BLOCS_HTML = new Set(['address', 'article', 'aside', 'blockquote', 'br', 'dd', 'div', 'dl', 'dt', 'figcaption', 'figure', 'footer',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'header', 'hr', 'li', 'main', 'nav', 'ol', 'p', 'pre', 'section', 'table', 'td', 'th', 'tr', 'ul']);
const SENSE_TEXT_HTML = new Set(['script', 'style', 'template', 'noscript', 'svg', 'math', 'head']);
const TANCADORS_FRASE = new Set(['.', '!', '?', '…', '»', '"', '”', '’', "'", ')']);

/* ───────────────────────── Text ───────────────────────── */

/* Un suplent UTF-16 solt no és cap caràcter: es canvia per U+FFFD (YAML i
   markdown el rebutjarien). Sense lookbehind, pel Safari 16.0 de la Baseline. */
const SUPLENTS = /[\ud800-\udbff][\udc00-\udfff]|[\ud800-\udfff]/g;
const senseSuplentsSolts = (text) => text.replace(SUPLENTS, (parella) => (parella.length === 2 ? parella : '\ufffd'));
const net = (text) => senseSuplentsSolts(String(text ?? '')).replace(CONTROLS, '').replace(ESPAIS, ' ').trim();

/* La forma de comparació d'una paraula: minúscules, sense accents, sense punt
   volat. Les paraules en ASCII pur (la majoria) no passen per normalize(). */
function formaDe(paraula) {
  const baixa = paraula.toLowerCase();
  if (NOMES_ASCII.test(baixa)) return baixa;
  return baixa.normalize('NFKD').replace(MARQUES, '').replace(PUNTS_VOLATS, '');
}

function formesDe(text) {
  const formes = [];
  for (const m of String(text).matchAll(PARAULA)) formes.push(formaDe(m[0]));
  return formes;
}

function comencaAmbMajuscula(paraula) {
  const primera = paraula.charAt(0);
  return primera !== primera.toLowerCase();
}

function descodificaEntitats(text) {
  return text.replace(ENTITAT, (sencera, dec, hex, nom) => {
    if (nom) return ENTITATS_NOMENADES.get(nom.toLowerCase()) ?? sencera;
    const punt = dec ? Number(dec) : parseInt(hex, 16);
    if (!punt || punt > 0x10ffff || (punt >= 0xd800 && punt <= 0xdfff)) return '\ufffd';
    return String.fromCodePoint(punt);
  });
}

const esLletra = (c) => (c >= 65 && c <= 90) || (c >= 97 && c <= 122);
const esLletraODigit = (c) => esLletra(c) || (c >= 48 && c <= 57);

/* L'índex just darrere del «>» que tanca l'etiqueta que comença abans de
   `des`, sense fer cas d'un «>» de dins d'un valor entre cometes. */
function fiDEtiqueta(html, des) {
  let cometa = 0;
  for (let m = des; m < html.length; m += 1) {
    const c = html.charCodeAt(m);
    if (cometa) {
      if (c === cometa) cometa = 0;
    } else if (c === 34 || c === 39) {
      cometa = c;
    } else if (c === 62) {
      return m + 1;
    }
  }
  return html.length;
}

/* Darrere del tancament «</nom…>» (sense distingir majúscules), o la fi. */
function despresDelTancament(html, des, nom) {
  let p = des;
  for (;;) {
    const c = html.indexOf('</', p);
    if (c === -1) return html.length;
    if (html.slice(c + 2, c + 2 + nom.length).toLowerCase() === nom) return fiDEtiqueta(html, c + 2 + nom.length);
    p = c + 2;
  }
}

/*
 * El text d'un HTML, d'una sola passada i sense DOM: cada bloc (paràgraf,
 * títol, element de llista, <br>…) és un salt de línia; el contingut de
 * <script>, <style> i semblants no és text; una imatge (encara que porte una
 * foto en data: de megabytes) no aporta res. Un «<» que no obri cap etiqueta
 * és text.
 */
function textDeHtml(html) {
  const trossos = [];
  const n = html.length;
  let i = 0;
  while (i < n) {
    const lt = html.indexOf('<', i);
    if (lt === -1) {
      trossos.push(html.slice(i));
      break;
    }
    if (lt > i) trossos.push(html.slice(i, lt));
    if (html.startsWith('!--', lt + 1)) {
      const fi = html.indexOf('-->', lt + 4);
      i = fi === -1 ? n : fi + 3;
      continue;
    }
    let j = lt + 1;
    const tanca = html.charCodeAt(j) === 47;
    if (tanca) j += 1;
    if (!esLletra(html.charCodeAt(j))) {
      if (html[j] === '!' || html[j] === '?') {
        i = fiDEtiqueta(html, j);
      } else {
        trossos.push('<');
        i = lt + 1;
      }
      continue;
    }
    let k = j;
    while (k < n && esLletraODigit(html.charCodeAt(k))) k += 1;
    const nom = html.slice(j, k).toLowerCase();
    i = fiDEtiqueta(html, k);
    if (BLOCS_HTML.has(nom)) trossos.push('\n');
    if (!tanca && SENSE_TEXT_HTML.has(nom)) i = despresDelTancament(html, i, nom);
  }
  return descodificaEntitats(trossos.join(''));
}

/* Els paràgrafs d'un text pla: una línia en blanc els separa; els salts d'una
   sola línia (un text tallat a amplada fixa) són espais. */
function paragrafsDeText(text) {
  const paragrafs = [];
  let actual = [];
  for (const linia of text.split('\n')) {
    if (linia.trim()) {
      actual.push(linia);
    } else if (actual.length) {
      paragrafs.push(net(actual.join(' ')));
      actual = [];
    }
  }
  if (actual.length) paragrafs.push(net(actual.join(' ')));
  return paragrafs.filter(Boolean);
}

/* Les frases d'un paràgraf (ja net): talla darrere de «.», «!», «?» o «…» (i
   les cometes o el parèntesi que els tanquen) si ve un espai o la fi. */
function frasesDe(paragraf) {
  const frases = [];
  let inici = 0;
  for (let i = 0; i < paragraf.length; i += 1) {
    const c = paragraf[i];
    if (c !== '.' && c !== '!' && c !== '?' && c !== '…') continue;
    let j = i + 1;
    while (j < paragraf.length && TANCADORS_FRASE.has(paragraf[j])) j += 1;
    if (j === paragraf.length || paragraf[j] === ' ') {
      const frase = paragraf.slice(inici, j).trim();
      if (frase) frases.push(frase);
      inici = j;
    }
    i = j - 1;
  }
  const resta = paragraf.slice(inici).trim();
  if (resta) frases.push(resta);
  return frases;
}

/* Sense punt final: un sol punt, mai uns punts suspensius. */
function senseFinal(text) {
  return text.endsWith('.') && !text.endsWith('..') ? text.slice(0, -1).trimEnd() : text;
}

function retallaAParaula(text, maxim) {
  if (text.length <= maxim) return text;
  const tall = text.lastIndexOf(' ', maxim - 1);
  return `${text.slice(0, tall > maxim / 2 ? tall : maxim - 1).trimEnd()}…`;
}

/* FNV-1a de 32 bits, en hexadecimal: una empremta curta i estable del relat. */
function empremta(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function slugDe(text) {
  const trossos = [];
  let llargaria = 0;
  for (const m of String(text).matchAll(PARAULA)) {
    const tros = formaDe(m[0]).replace(NO_SLUG, '');
    if (!tros) continue;
    const amb = llargaria + tros.length + (trossos.length ? 1 : 0);
    if (amb > MAX_SLUG) break;
    trossos.push(tros);
    llargaria = amb;
  }
  return trossos.join('-');
}

/* ───────────────────────── Noms de lloc ───────────────────────── */

const ARTICLE_INICIAL = /^(El|Els|La|Les) |^(L)['’]/;

/* Un nom de poble dins d'una frase: l'article, en minúscula («la Torre de
   les Maçanes»), com es fa en el text corrent. */
function enMigDeFrase(nom) {
  return ARTICLE_INICIAL.test(nom) ? nom.charAt(0).toLowerCase() + nom.slice(1) : nom;
}

function comencaAmbVocal(nom) {
  const [a = '', b = ''] = formaDe(nom.slice(0, 3));
  if (!a) return false;
  if (a === 'h') return b !== '' && 'aeo'.includes(b);
  return 'aeo'.includes(a) || ((a === 'i' || a === 'u') && (b === '' || !'aeiou'.includes(b)));
}

/* «a» o «de» davant d'un nom de poble, amb la contracció o l'apòstrof: «a la
   Torre de les Maçanes», «al Campello», «d'Alcoleja», «de Xixona». */
function ambPreposicio(preposicio, nom) {
  const m = /^(El|Els) (.+)$/.exec(nom);
  if (m) return `${preposicio === 'de' ? 'de' : 'a'}${m[1] === 'El' ? 'l' : 'ls'} ${m[2]}`;
  const enFrase = enMigDeFrase(nom);
  if (preposicio === 'de' && enFrase === nom && comencaAmbVocal(nom)) return `d'${nom}`;
  return `${preposicio} ${enFrase}`;
}

function llistaAmbI(elements) {
  if (elements.length < 2) return elements.join('');
  return `${elements.slice(0, -1).join(', ')} i ${elements[elements.length - 1]}`;
}

const minusculaInicial = (text) => text.charAt(0).toLowerCase() + text.slice(1);

/* ───────────────────────── El diccionari ───────────────────────── */

function refDePoble(poble) {
  const nom = net(poble?.title ?? poble?.nom ?? poble?.name);
  const id = slugDe(String(poble?.id ?? '')) || slugDe(nom);
  if (!nom || !id) return null;
  return Object.freeze({ id, nom, comarca: net(poble.comarca) || null, provincia: net(poble.provincia) || null });
}

function compila(pobles) {
  const perPrimera = new Map();
  const arrels = new Map();
  let maxArrel = MIN_ARREL;
  const afig = (formes, entrada) => {
    if (!formes.length) return;
    const llista = perPrimera.get(formes[0]) ?? [];
    llista.push(Object.freeze({ ...entrada, formes: Object.freeze(formes) }));
    perPrimera.set(formes[0], llista);
  };
  for (const poble of pobles) {
    const ref = refDePoble(poble);
    if (!ref) continue;
    const formes = formesDe(ref.nom);
    const majuscula = poble.ambMajuscula === true || POBLES_AMB_SENTIT_COMU.has(formes.join(' '));
    afig(formes, { tipus: 'poble', ref, majuscula });
    const ambArticle = formes.length > 1 && ARTICLES.has(formes[0]);
    if (ambArticle) afig(formes.slice(1), { tipus: 'poble', ref, majuscula });
    /* D-5 · Els àlies del poble (pobles/aliesDePobles.js), sense variant sense
       article («la Torre» sense l'article seria «torre»). Un àlies amb
       `ambMajuscula` només compta amb majúscula a la paraula `majusculaEn`
       («a la Torre», i no «la torre de l'església»). */
    const oficials = new Set([formes.join(' '), ...(ambArticle ? [formes.slice(1).join(' ')] : [])]);
    for (const a of aliesDelPoble(poble)) {
      const formesAlies = formesDe(a.forma);
      if (!formesAlies.length || oficials.has(formesAlies.join(' '))) continue;
      afig(formesAlies, {
        tipus: 'poble', ref, majuscula: a.ambMajuscula === true || majuscula, majusculaEn: Math.min(a.majusculaEn, formesAlies.length - 1)
      });
    }
  }
  for (const t of VOCABULARI_RURAL) {
    for (const p of t.paraules) afig(formesDe(p), { tipus: 'tema', ref: t, majuscula: false });
    for (const e of t.expressions) afig(formesDe(e), { tipus: 'tema', ref: t, majuscula: false });
    for (const p of t.ambMajuscula) afig(formesDe(p), { tipus: 'tema', ref: t, majuscula: true });
    for (const c of t.ambContext) {
      const context = {
        seguidaDeNom: c.seguidaDeNom === true,
        nomPropi: c.nomPropi === true,
        noDespresDe: c.noDespresDe ? new Set(c.noDespresDe.map((p) => formaDe(p))) : null
      };
      for (const f of c.formes) afig(formesDe(f), { tipus: 'tema', ref: t, majuscula: false, ...context });
    }
    for (const a of t.arrels) {
      const [forma] = formesDe(a);
      if (!arrels.has(forma)) arrels.set(forma, t);
      maxArrel = Math.max(maxArrel, forma.length);
    }
  }
  /* La seqüència més llarga primer; a la mateixa llargària, el poble. L'ordre
     d'inserció desempata (sort és estable). */
  for (const llista of perPrimera.values()) {
    llista.sort((a, b) => b.formes.length - a.formes.length || (a.tipus === 'poble' ? 0 : 1) - (b.tipus === 'poble' ? 0 : 1));
  }
  return Object.freeze({ perPrimera, arrels, maxArrel });
}

let diccionariDeLaLlavor = null;
const diccionaris = new WeakMap();

function diccionariPer(pobles) {
  if (pobles === undefined) {
    diccionariDeLaLlavor ??= compila(MOCK_TOWNS);
    return diccionariDeLaLlavor;
  }
  if (!Array.isArray(pobles)) throw new TypeError('memoriaOral: «pobles» ha de ser una llista.');
  let dicc = diccionaris.get(pobles);
  if (!dicc) {
    dicc = compila(pobles);
    diccionaris.set(pobles, dicc);
  }
  return dicc;
}

/* Cert si l'entrada, que ja casa a partir de la paraula `i`, compta en el
   seu context: la majúscula (amb una preposició de lloc davant si la porta
   la primera paraula de la frase o si la frase és tota en majúscules), el nom
   propi de darrere, la paraula de davant i la majúscula d'un nom de persona
   (B2-01 i B2-02). */
function compta(entrada, formes, paraules, i, llarg, totMajuscules) {
  if (entrada.majuscula) {
    /* La majúscula, a la paraula que la porta: la primera, o la de
       `majusculaEn` en un àlies com «la Torre» (D-5). */
    if (!comencaAmbMajuscula(paraules[i + (entrada.majusculaEn ?? 0)])) return false;
    /* Gauntlet D-05 · A l'inici de la frase, la majúscula de la primera
       paraula no diu res; la d'una paraula de dins («La Torre era…») sí. */
    const interior = (entrada.majusculaEn ?? 0) > 0;
    if (((i === 0 && !interior) || totMajuscules) && !(i > 0 && PREPOSICIONS_DE_LLOC.has(formes[i - 1]))) return false;
  }
  if (entrada.noDespresDe && i > 0 && entrada.noDespresDe.has(formes[i - 1])) return false;
  if (entrada.nomPropi && i > 0 && !totMajuscules && comencaAmbMajuscula(paraules[i])) return false;
  if (entrada.seguidaDeNom) {
    if (totMajuscules) return false;
    let j = i + llarg;
    if (j < formes.length && ARTICLES_DE_NOM.has(formes[j])) j += 1;
    if (j >= paraules.length || !comencaAmbMajuscula(paraules[j])) return false;
  }
  return true;
}

/* La coincidència que comença a la paraula `i`, o null. */
function cerca(formes, paraules, i, dicc, totMajuscules) {
  const candidats = dicc.perPrimera.get(formes[i]);
  if (candidats) {
    for (const entrada of candidats) {
      const llarg = entrada.formes.length;
      if (i + llarg > formes.length) continue;
      let iguals = true;
      for (let k = 1; k < llarg; k += 1) {
        if (formes[i + k] !== entrada.formes[k]) {
          iguals = false;
          break;
        }
      }
      if (!iguals || !compta(entrada, formes, paraules, i, llarg, totMajuscules)) continue;
      return { entrada, llarg };
    }
  }
  const forma = formes[i];
  /* Amb majúscula a mitjan frase, una arrel que també és nom de persona no
     compta: «Amparo Ferrer» no és cap ferrer (G2-MO-04). */
  const potSerNom = i > 0 && !totMajuscules && comencaAmbMajuscula(paraules[i]);
  for (let l = Math.min(forma.length, dicc.maxArrel); l >= MIN_ARREL; l -= 1) {
    const arrel = forma.slice(0, l);
    const t = dicc.arrels.get(arrel);
    if (t) return potSerNom && ARRELS_DE_NOM.has(arrel) ? null : { entrada: { tipus: 'tema', ref: t }, llarg: 1 };
  }
  return null;
}

/* ───────────────────────── L'anàlisi ───────────────────────── */

/* Les parts d'una entrada: el títol i el subtítol de la persona (compten per
   al municipi i les etiquetes, però no fan relat) i els paràgrafs del relat. */
function partsDe(entrada) {
  if (typeof entrada === 'string') {
    return { titol: '', subtitol: '', paragrafs: paragrafsDeText(entrada.replace(/\r\n?/g, '\n')), llavor: false };
  }
  if (!entrada || typeof entrada !== 'object') return { titol: '', subtitol: '', paragrafs: [], llavor: false };
  const html = typeof entrada.content === 'string' ? entrada.content : '';
  const camp = (valor) => (typeof valor === 'string' ? net(textDeHtml(valor)) : '');
  /* Un cos que encara és la llavor de format no és relat, però l'entradilla
     sí: una nota vella amb la llavor desada i el relat a l'entradilla en fa
     fitxa (Gauntlet 261101, B2-08). */
  const llavor = esLlavorDeNota(html);
  const paragrafs = [camp(entrada.lead), ...(llavor ? [] : textDeHtml(html).split('\n').map(net))].filter(Boolean);
  return { titol: camp(entrada.title), subtitol: camp(entrada.subtitle), paragrafs, llavor };
}

function analitza(frases, dicc) {
  const temes = new Map();
  const pobles = new Map();
  const perFrase = [];
  let paraulesDelRelat = 0;
  let ordre = 0;
  for (const frase of frases) {
    const paraules = [];
    const inicis = [];
    for (const m of frase.text.matchAll(PARAULA)) {
      paraules.push(m[0]);
      inicis.push(m.index);
    }
    const formes = paraules.map(formaDe);
    if (frase.relat) paraulesDelRelat += paraules.length;
    const totMajuscules = !TE_MINUSCULA.test(frase.text);
    /* Només les frases amb alguna coincidència porten el seu registre: un
       relat d'un milió de frases buides no en crea cap. */
    let daci = null;
    let i = 0;
    while (i < formes.length) {
      const trobada = cerca(formes, paraules, i, dicc, totMajuscules);
      ordre += 1;
      if (!trobada) {
        i += 1;
        continue;
      }
      const { entrada, llarg } = trobada;
      daci ??= { temes: new Set(), pobles: new Set() };
      if (entrada.tipus === 'poble') {
        const p = pobles.get(entrada.ref.id) ?? { ref: entrada.ref, mencions: 0, primera: ordre };
        p.mencions += 1;
        pobles.set(entrada.ref.id, p);
        daci.pobles.add(entrada.ref.id);
      } else {
        const t = temes.get(entrada.ref.id) ?? { tema: entrada.ref, coincidencies: 0, proves: [], primera: ordre };
        t.coincidencies += 1;
        /* La prova és el tros del relat tal com està escrit («mal d’ull»),
           fitat: una «paraula» d'un mega no es copia a l'eixida. */
        const darrera = i + llarg - 1;
        const tros = frase.text.slice(inicis[i], Math.min(inicis[darrera] + paraules[darrera].length, inicis[i] + MAX_PROVA + 1));
        const prova = (tros.length > MAX_PROVA ? `${tros.slice(0, MAX_PROVA)}…` : tros).toLowerCase();
        if (t.proves.length < MAX_PROVES && !t.proves.includes(prova)) t.proves.push(prova);
        temes.set(entrada.ref.id, t);
        daci.temes.add(entrada.ref.id);
      }
      i += llarg;
    }
    perFrase.push(daci);
  }
  return { temes, pobles, perFrase, paraulesDelRelat };
}

/* El resum: fins a MAX_FRASES_RESUM frases del relat, les que porten més
   temes triats (i el poble), tornades al seu ordre; cap paraula del motor.
   Els punts van de 0 a MAX_ETIQUETES + 1: una ordenació per calaixos (lineal)
   en lloc d'un sort. Sense cap frase puntuada, la primera que hi cap. Dos
   frases de paràgrafs diferents, si la primera no acaba en punt (un relat
   transcrit sense puntuació), van en paràgrafs separats ("\n\n"): enganxades
   no es podrien llegir (Gauntlet 261101, B2-09). Per això cada frase compta
   dos caràcters de separació contra MAX_RESUM. */
function juntaResum(frases, indexos) {
  let text = '';
  indexos.forEach((index, k) => {
    const frase = frases[index];
    if (k === 0) {
      text = frase.text;
      return;
    }
    const abans = frases[indexos[k - 1]];
    text += abans.paragraf !== frase.paragraf && !ACABA_EN_PUNT.test(abans.text) ? `\n\n${frase.text}` : ` ${frase.text}`;
  });
  return text;
}

function triaResum(frases, perFrase, etiquetes, municipi) {
  const triats = new Set(etiquetes.map((e) => e.id));
  const calaixos = Array.from({ length: MAX_ETIQUETES + 2 }, () => []);
  let primera = -1;
  frases.forEach((frase, index) => {
    if (!frase.relat) return;
    if (primera < 0) primera = index;
    const registre = perFrase[index];
    let punts = 0;
    if (registre) {
      for (const id of registre.temes) if (triats.has(id)) punts += 1;
      if (municipi && registre.pobles.has(municipi.id)) punts += 1;
    }
    calaixos[punts].push(index);
  });
  if (primera < 0) return '';
  const elegides = [];
  let llargaria = 0;
  for (let punts = calaixos.length - 1; punts >= 0 && elegides.length < MAX_FRASES_RESUM; punts -= 1) {
    if (punts === 0 && elegides.length) break;
    for (const index of calaixos[punts]) {
      if (elegides.length >= MAX_FRASES_RESUM) break;
      const amb = llargaria + frases[index].text.length + (elegides.length ? 2 : 0);
      if (amb > MAX_RESUM) continue;
      elegides.push(index);
      llargaria = amb;
      if (punts === 0) break;
    }
  }
  if (!elegides.length) return retallaAParaula(frases[primera].text, MAX_RESUM);
  return juntaResum(frases, elegides.sort((a, b) => a - b));
}

function titolDe(etiquetes, municipi, titolDeLaPersona, titolDelText) {
  if (titolDeLaPersona) return titolDeLaPersona;
  const lloc = municipi ? ` ${ambPreposicio('a', municipi.nom)}` : '';
  if (etiquetes.length) {
    const [primer, segon] = etiquetes;
    return `${primer.titol}${segon ? ` i ${minusculaInicial(segon.titol)}` : ''}${lloc}`;
  }
  if (titolDelText) return titolDelText;
  return municipi ? `Memòria oral ${ambPreposicio('de', municipi.nom)}` : 'Memòria oral';
}

/* Revisada per una persona, el poble és el que ha triat ella (que potser no
   és el més esmentat): «(poble: …)». Amb un empat de mencions al capdamunt,
   el de la fitxa és el primer que ix, i no «el més esmentat» (Gauntlet 2,
   261101, G2-MO-10). */
function descripcioDe(etiquetes, municipi, candidats, revisada = false) {
  const temes = etiquetes.slice(0, 3).map((e) => minusculaInicial(e.titol));
  const sobre = temes.length ? ` sobre ${llistaAmbI(temes)}` : '';
  const empat = candidats.length > 1 && candidats[1].mencions === candidats[0].mencions;
  const quin = revisada ? 'poble' : empat ? 'primer poble esmentat' : `poble ${candidats.length > 1 ? 'més esmentat' : 'esmentat'}`;
  const poble = municipi ? ` (${quin}: ${enMigDeFrase(municipi.nom)})` : '';
  return `Relat de memòria oral${sobre}${poble}.`;
}

/* ───────────────────────── OKF: YAML i markdown ───────────────────────── */

/* Una cadena YAML entre cometes dobles: JSON (YAML 1.2 n'és un superconjunt)
   amb els caràcters que YAML no admet sense escapar. */
function yamlCadena(text) {
  return JSON.stringify(String(text)).replace(NO_IMPRIMIBLES_YAML, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

const yamlEscalar = (text) => (SLUG_PLA.test(text) && !YAML_RESERVATS.has(text) ? text : yamlCadena(text));

/* Una data del YAML, sense cometes com als exemples de l'especificació: només
   si és una data ISO 8601 amb fus de veres. Un salt de línia o una clau
   colada en una fitxa rehidratada (JSON del disc o d'una base de dades) no
   arriba mai al YAML (Gauntlet 261101, B2-05). */
function instantYaml(valor, nom) {
  const iso = valor instanceof Date ? (Number.isNaN(valor.getTime()) ? '' : valor.toISOString()) : valor;
  if (!esInstantIso(iso)) throw new TypeError(`memoriaOral: «${nom}» no és cap data ISO 8601 amb fus (OKF v0.2 §5).`);
  return iso;
}

/* El bloc YAML de la fitxa, en l'ordre dels exemples de l'especificació. Cada
   camp opcional només hi va si hi és; els textos, entre cometes; les dates,
   per instantYaml; l'estat, només un dels tres de l'especificació. */
function serialitzaFrontmatter(fm) {
  if (!STATUS_OKF.has(fm.status)) throw new TypeError('memoriaOral: «status» ha de ser draft, stable o deprecated (OKF v0.2 §5.4).');
  const l = ['---', `type: ${yamlCadena(fm.type)}`];
  if (fm.title !== undefined) l.push(`title: ${yamlCadena(fm.title)}`);
  if (fm.description !== undefined) l.push(`description: ${yamlCadena(fm.description)}`);
  if (fm.resource) l.push(`resource: ${yamlCadena(fm.resource)}`);
  if (Array.isArray(fm.tags)) l.push(`tags: [${fm.tags.map((e) => yamlEscalar(String(e))).join(', ')}]`);
  l.push(`status: ${fm.status}`);
  if (fm.generated) {
    l.push('generated:', `  by: ${yamlCadena(fm.generated.by)}`);
    if (fm.generated.at) l.push(`  at: ${instantYaml(fm.generated.at, 'generated.at')}`);
  }
  if (fm.verified) {
    l.push('verified:');
    for (const v of [].concat(fm.verified)) l.push(`  - by: ${yamlCadena(v.by)}`, `    at: ${instantYaml(v.at, 'verified.at')}`);
  }
  if (fm.stale_after) l.push(`stale_after: ${instantYaml(fm.stale_after, 'stale_after')}`);
  if (Array.isArray(fm.sources)) {
    l.push(fm.sources.length ? 'sources:' : 'sources: []');
    for (const s of fm.sources) {
      const camps = [];
      if (s.id !== undefined) camps.push(`id: ${yamlEscalar(String(s.id))}`);
      camps.push(`resource: ${yamlCadena(s.resource)}`);
      if (s.title !== undefined) camps.push(`title: ${yamlCadena(s.title)}`);
      if (s.author) camps.push(`author: ${yamlCadena(s.author)}`);
      camps.forEach((camp, k) => l.push(`${k ? '    ' : '  - '}${camp}`));
    }
  }
  if (fm.municipi) l.push(`municipi: ${yamlEscalar(String(fm.municipi))}`);
  l.push('---');
  return l.join('\n');
}

/* Text de la persona dins del markdown: els signes que farien marca (enllaç,
   HTML, èmfasi, nota a peu…) i, a l'inici d'una línia, els que farien títol,
   cita o llista, van escapats amb «\» (CommonMark). */
function escapaMd(text) {
  const escapat = String(text).replace(ESPECIALS_MD, '\\$&');
  const primer = escapat.charAt(0);
  if (primer && '#>+=-'.includes(primer)) return `\\${escapat}`;
  let d = 0;
  while (d < escapat.length && d < 10 && escapat.charCodeAt(d) >= 48 && escapat.charCodeAt(d) <= 57) d += 1;
  if (d > 0 && (escapat[d] === '.' || escapat[d] === ')')) return `${escapat.slice(0, d)}\\${escapat.slice(d)}`;
  return escapat;
}

const vegades = (n, una, moltes) => `${n} ${n === 1 ? una : moltes}`;

/* Els encapçalaments del relat dins del cos. Cap línia de text de la persona
   no pot començar per «# » (escapaMd l'escapa), i així el relat escapat es
   pot tornar a traure d'un cos fet per este motor (relatDelCos). */
const INICI_RELAT = '\n# Relat\n\n';
const FI_RELAT = "\n\n# Com s'ha fet\n";

/*
 * El cos markdown de la fitxa. `relatMd` és el relat ja escapat, un paràgraf
 * per bloc. `revisio` (null en una proposta) és la correcció de la revisió
 * humana: { canviaEtiquetes, canviaPoble, descartades, municipi }; el cos ho
 * diu a cada secció i a «Com s'ha fet», sense amagar què proposava la màquina.
 *
 * «Com s'ha fet» diu què porta «Relat» (Gauntlet 2, 261101, G2-MO-01): el
 * text sencer del relat (l'entradilla i el cos de la nota, o la transcripció),
 * sense format i sense cap canvi, tal com el rep el motor. El títol de la nota
 * és el `title` de la fitxa; el subtítol (`subtitol`), que no és relat, no va
 * a «Relat»: si n'hi ha, «Com s'ha fet» el copia i diu per què no hi és. Així
 * cap text de la persona no es perd del fitxer. El motor no pot saber si qui
 * el crida li dona la nota retallada: DocumentEditor li dona la nota tal com
 * l'ha escrita la persona, abans d'aplicar cap proposta de la Card.
 */
function cosMarkdown({ descripcio, resum, etiquetes, candidats, relatMd, subtitol = '', revisio = null }) {
  const b = ['# Resum', '', escapaMd(descripcio), ''];
  if (resum) b.push(`${resum.split('\n\n').map(escapaMd).join('\n\n')}[^relat]`, '');
  b.push('# Etiquetes', '', revisio
    ? `Proposades amb el vocabulari rural tancat de ${ACTOR_ESTRUCTURADOR} i revisades per una persona.`
    : `Proposades amb el vocabulari rural tancat de ${ACTOR_ESTRUCTURADOR}; una persona les ha de revisar.`, '');
  if (etiquetes.length) {
    for (const e of etiquetes) {
      /* D-5 · Una etiqueta lliure: el text de la persona, escapat, i res del vocabulari. */
      if (e.lliure === true) {
        b.push(`* **${escapaMd(e.nom)}**: etiqueta lliure, afegida en la revisió humana.`);
        continue;
      }
      const perque = e.coincidencies > 0
        ? `Paraules del relat: ${escapaMd(e.proves.join(', '))} (${vegades(e.coincidencies, 'coincidència', 'coincidències')}).`
        : 'Afegida en la revisió humana.';
      b.push(`* **${e.nom}** (\`${e.id}\`): ${e.descripcio} ${perque}`);
    }
  } else {
    b.push(revisio?.descartades.length
      ? "En la revisió s'han descartat totes les etiquetes proposades."
      : 'Cap paraula del vocabulari tancat no hi apareix prou voltes per a proposar una etiqueta.');
  }
  if (revisio?.descartades.length) b.push('', `Descartades en la revisió: ${revisio.descartades.join(', ')}.`);
  b.push('', '# Poble', '');
  if (candidats.length) {
    for (const c of candidats) {
      const on = [c.comarca, c.provincia].filter(Boolean).join(', ');
      b.push(`* ${escapaMd(c.nom)}${on ? ` (${escapaMd(on)})` : ''}: ${vegades(c.mencions, 'menció', 'mencions')}.`);
    }
    if (revisio) {
      b.push('', revisio.municipi
        ? `Poble triat en la revisió: ${escapaMd(revisio.municipi.nom)}.`
        : "En la revisió, cap d'estos pobles no s'ha triat com a poble del relat.");
    }
  } else {
    b.push('Cap poble de la llista de Sóc de Poble no hi apareix.');
    /* D-5 · Sense candidats, la persona n'ha pogut triar un al selector. */
    if (revisio?.municipi) b.push('', `Poble triat en la revisió: ${escapaMd(revisio.municipi.nom)}.`);
  }
  b.push('', '# Relat', '', relatMd, '');
  const delSubtitol = subtitol
    ? ` El subtítol de la nota, que no és relat i només ha comptat per a les etiquetes i el poble, és: «${escapaMd(subtitol)}».`
    : '';
  b.push('# Com s\'ha fet', '',
    `Fitxa proposada per ${ACTOR_ESTRUCTURADOR} sense cap model de llenguatge: vocabulari tancat, recompte de paraules i frases del mateix relat. El relat no s'ha modificat: «Relat» en porta el text sencer, sense format.${delSubtitol}`, '');
  if (revisio) {
    const que = [revisio.canviaEtiquetes ? 'les etiquetes' : '', revisio.canviaPoble ? 'el poble' : ''].filter(Boolean);
    b.push(`En la revisió humana s'${revisio.canviaEtiquetes ? 'han' : 'ha'} corregit ${llistaAmbI(que)}.`, '');
  }
  b.push('[^relat]: Relat oral original', '');
  return b.join('\n');
}

/* El relat escapat d'un cos fet per cosMarkdown, o null si no n'és cap. */
function relatDelCos(cos) {
  if (typeof cos !== 'string') return null;
  const inici = cos.indexOf(INICI_RELAT);
  const fi = inici < 0 ? -1 : cos.indexOf(FI_RELAT, inici + INICI_RELAT.length);
  return inici < 0 || fi < 0 ? null : cos.slice(inici + INICI_RELAT.length, fi);
}

const markdownDe = (fm, cos) => `${serialitzaFrontmatter(fm)}\n\n${cos}`;

function congela(valor) {
  if (valor && typeof valor === 'object' && !Object.isFrozen(valor)) {
    for (const v of Object.values(valor)) congela(v);
    Object.freeze(valor);
  }
  return valor;
}

/* ───────────────────────── Opcions ───────────────────────── */

/* Cert si `valor` és una data ISO 8601 amb fus i amb segons que existix: cap
   30 de febrer, cap 24:00, cap segon 60 i cap fus de més de 23:59. Date.parse
   no val: V8 normalitza el 30 de febrer al 2 de març (B2-06). */
function esInstantIso(valor) {
  if (typeof valor !== 'string') return false;
  const m = ISO_AMB_FUS.exec(valor);
  if (!m) return false;
  const [any, mes, dia, hora, minut, segon] = m.slice(1, 7).map(Number);
  if (hora > 23 || minut > 59 || segon > 59) return false;
  if (m[7] !== undefined && (Number(m[7]) > 23 || Number(m[8]) > 59)) return false;
  /* setUTCFullYear, i no Date.UTC: els anys 0-99 no passen a 1900-1999. */
  const data = new Date(0);
  data.setUTCFullYear(any, mes - 1, dia);
  return data.getUTCFullYear() === any && data.getUTCMonth() === mes - 1 && data.getUTCDate() === dia;
}

function instantDe(valor, nom) {
  if (valor === undefined || valor === null) return null;
  if (valor instanceof Date) {
    /* Un any de més de quatre xifres («+010000-…») no és cap data de l'OKF. */
    const iso = Number.isNaN(valor.getTime()) ? '' : valor.toISOString();
    if (!esInstantIso(iso)) throw new TypeError(`memoriaOral: «${nom}» no és cap data vàlida.`);
    return iso;
  }
  if (!esInstantIso(valor)) {
    throw new TypeError(`memoriaOral: «${nom}» ha de ser una data ISO 8601 amb fus horari i segons (OKF v0.2 §5).`);
  }
  return valor;
}

function actorHuma(id, nom) {
  if (typeof id !== 'string' || !ID_PERSONA.test(id)) {
    throw new TypeError(`memoriaOral: «${nom}» ha de ser un identificador sense espais (lletres, xifres, «.», «_» o «-»).`);
  }
  return `human:${id}`;
}

function recursDe(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  if (typeof valor !== 'string' || !URL_O_CAMI.test(valor)) {
    throw new TypeError('memoriaOral: «recurs» ha de ser un URL http(s) o un camí que comence per «/».');
  }
  return valor;
}

/* ───────────────────────── API ───────────────────────── */

const resultatSenseFitxa = (motiu, codisAvis = []) => congela({
  motiu,
  titol: '',
  titolDelText: '',
  titolDeLaPersona: false,
  subtitol: '',
  descripcio: '',
  resum: '',
  etiquetes: [],
  municipi: null,
  candidats: [],
  paraules: 0,
  avisos: codisAvis.map((codi) => AVISOS_MEMORIA[codi]),
  codisAvis,
  okf: null
});

/**
 * La fitxa de memòria oral d'un relat, determinista i local.
 *
 * `entrada`: el relat en text pla (els paràgrafs, separats per una línia en
 * blanc) o una nota del Bloc { title, subtitle, lead, content } amb l'HTML com
 * el desa el Bloc. El títol de la persona, si n'hi ha, mana sempre.
 *
 * `opcions` (totes opcionals; cap no llig el rellotge ni la xarxa):
 *  · ara: l'hora de la proposta (ISO 8601 amb fus, o Date) per a
 *    `generated.at`; sense ella, `generated` només porta `by`.
 *  · caducaEl: `stale_after` (ISO 8601 amb fus, o Date).
 *  · recurs: l'URL (o el camí «/…») de la nota, per a `resource` i la font.
 *  · autor: l'identificador de qui ha escrit la nota, per a `sources[].author`
 *    (`human:<id>`). El Bloc no hi passa l'id del compte de la sessió, sinó
 *    un autor humà sense identificador (memoriaOralDelBloc.js, G2-MO-08).
 *  · pobles: la llista de pobles ({ id, title, comarca, provincia }); per
 *    defecte, la llavor del codi (townsSeed.js). Cada llista es compila una
 *    sola volta (per objecte): si canvia, cal passar-ne una de nova.
 *
 * Torna, immutable: { motiu (MOTIUS_MEMORIA), titol, titolDelText,
 * titolDeLaPersona (cert si el títol és el de la nota i no el del motor),
 * subtitol (el de la nota, net; no és relat), descripcio, resum, etiquetes:
 * [{ id, nom, titol, descripcio, coincidencies, proves }], municipi: { id,
 * nom, comarca, provincia, mencions } | null, candidats, paraules, avisos
 * (els textos d'AVISOS_MEMORIA), codisAvis (les seues claus, en el mateix
 * ordre), okf: { cami, frontmatter, cos, markdown } | null }. Llança
 * TypeError només si una opció no té la forma que demana.
 */
export function estructuraMemoriaOral(entrada, opcions) {
  const o = opcions ?? {};
  const ara = instantDe(o.ara, 'ara');
  const caducaEl = instantDe(o.caducaEl, 'caducaEl');
  const recurs = recursDe(o.recurs);
  const autor = o.autor === undefined || o.autor === null ? null : actorHuma(o.autor, 'autor');
  const dicc = diccionariPer(o.pobles);

  const parts = partsDe(entrada);
  /* El títol i el subtítol també compten: s'analitzen i es copien sencers
     (Gauntlet 261101, B2-07). */
  const midaText = [parts.titol, parts.subtitol, ...parts.paragrafs].reduce((suma, p) => suma + p.length + 1, 0);
  if (midaText > MIDA_MAXIMA_TEXT) {
    return resultatSenseFitxa(MOTIUS_MEMORIA.massaLlarg, ['massaLlarg']);
  }
  if (parts.llavor && !parts.paragrafs.length) return resultatSenseFitxa(MOTIUS_MEMORIA.llavor);
  if (!parts.paragrafs.length) return resultatSenseFitxa(MOTIUS_MEMORIA.buit);

  const frases = [];
  for (const capcal of [parts.titol, parts.subtitol]) if (capcal) frases.push({ text: capcal, relat: false, paragraf: -1 });
  parts.paragrafs.forEach((p, n) => {
    for (const f of frasesDe(p)) frases.push({ text: f, relat: true, paragraf: n });
  });
  const { temes, pobles, perFrase, paraulesDelRelat } = analitza(frases, dicc);
  if (!paraulesDelRelat) return resultatSenseFitxa(MOTIUS_MEMORIA.buit);

  const llindar = paraulesDelRelat < PARAULES_TEXT_LLARG ? 1 : 2;
  const etiquetes = [...temes.values()]
    .filter((t) => t.coincidencies >= llindar)
    .sort((a, b) => b.coincidencies - a.coincidencies || a.primera - b.primera)
    .slice(0, MAX_ETIQUETES)
    .map((t) => ({ id: t.tema.id, nom: t.tema.nom, titol: t.tema.titol, descripcio: t.tema.descripcio, coincidencies: t.coincidencies, proves: t.proves }));
  const candidats = [...pobles.values()]
    .sort((a, b) => b.mencions - a.mencions || a.primera - b.primera)
    .map((p) => ({ ...p.ref, mencions: p.mencions }));
  const municipi = candidats[0] ?? null;

  const primera = frases.find((f) => f.relat)?.text ?? '';
  const titolDelText = primera.length <= MAX_TITOL ? senseFinal(primera) : retallaAParaula(primera, TALL_TITOL);
  const titol = titolDe(etiquetes, municipi, parts.titol, titolDelText);
  const descripcio = descripcioDe(etiquetes, municipi, candidats);
  const resum = triaResum(frases, perFrase, etiquetes, municipi);

  const codisAvis = [];
  const motiu = paraulesDelRelat < MIN_PARAULES ? MOTIUS_MEMORIA.curt : MOTIUS_MEMORIA.proposta;
  if (motiu === MOTIUS_MEMORIA.curt) codisAvis.push('curt');
  if (candidats.length > 1) codisAvis.push('diversosPobles');

  const relat = parts.paragrafs.join('\n');
  const cami = `memoria-oral/${municipi?.id ?? 'sense-poble'}/${slugDe(titol) || 'relat'}-${empremta(relat)}.md`;
  const font = { id: 'relat', resource: recurs ?? FONT_SENSE_URL, title: 'Relat oral original' };
  if (autor) font.author = autor;
  const frontmatter = {
    type: TIPUS_OKF,
    title: titol,
    description: descripcio,
    ...(recurs ? { resource: recurs } : {}),
    tags: etiquetes.map((e) => e.id),
    status: 'draft',
    generated: ara ? { by: ACTOR_ESTRUCTURADOR, at: ara } : { by: ACTOR_ESTRUCTURADOR },
    ...(caducaEl ? { stale_after: caducaEl } : {}),
    sources: [font],
    ...(municipi ? { municipi: municipi.id } : {})
  };
  const cos = cosMarkdown({ descripcio, resum, etiquetes, candidats, relatMd: parts.paragrafs.map(escapaMd).join('\n\n'), subtitol: parts.subtitol });
  return congela({
    motiu,
    titol,
    titolDelText,
    titolDeLaPersona: Boolean(parts.titol),
    subtitol: parts.subtitol,
    descripcio,
    resum,
    etiquetes,
    municipi,
    candidats,
    paraules: paraulesDelRelat,
    avisos: codisAvis.map((codi) => AVISOS_MEMORIA[codi]),
    codisAvis,
    okf: { cami, frontmatter, cos, markdown: markdownDe(frontmatter, cos) }
  });
}

/* ───────────────────────── D-5 · El selector de poble ───────────────────────── */

let indexDeLaLlavor = null;
const indexos = new WeakMap();

/* Les formes d'un nom amb l'article i, si en porta, també sense. */
const ambISenseArticle = (formes) => (formes.length > 1 && ARTICLES.has(formes[0]) ? [formes, formes.slice(1)] : [formes]);

/* L'índex del selector d'una llista de pobles: la forma de comparació del nom
   oficial i de cada àlies (amb l'article i sense), cap a les refs del poble.
   Al selector la majúscula no compta: la persona tria. També guarda les refs
   per id, per a la revisió d'un poble que no és candidat (municipiCorregit). */
function compilaIndex(pobles) {
  const oficials = new Map();
  const alies = new Map();
  const perId = new Map();
  const posa = (mapa, formes, ref) => {
    if (!formes.length) return;
    const clau = formes.join(' ');
    const refs = mapa.get(clau) ?? new Map();
    if (!refs.has(ref.id)) refs.set(ref.id, ref);
    mapa.set(clau, refs);
  };
  for (const poble of pobles) {
    const ref = refDePoble(poble);
    if (!ref) continue;
    if (!perId.has(ref.id)) perId.set(ref.id, ref);
    for (const formes of ambISenseArticle(formesDe(ref.nom))) posa(oficials, formes, ref);
    for (const a of aliesDelPoble(poble)) {
      for (const formes of ambISenseArticle(formesDe(a.forma))) posa(alies, formes, ref);
    }
  }
  return Object.freeze({ oficials, alies, perId });
}

function indexPer(pobles) {
  if (pobles === undefined) {
    indexDeLaLlavor ??= compilaIndex(catalegDePobles());
    return indexDeLaLlavor;
  }
  if (!Array.isArray(pobles)) throw new TypeError('memoriaOral: «pobles» ha de ser una llista.');
  let index = indexos.get(pobles);
  if (!index) {
    index = compilaIndex(pobles);
    indexos.set(pobles, index);
  }
  return index;
}

/* Els pobles d'una clau: primer pels noms oficials i, si cap no hi casa, pels
   àlies (un nom oficial mana sobre l'àlies d'un altre poble). */
function refsDe(index, formes) {
  if (!formes.length) return null;
  const clau = formes.join(' ');
  return index.oficials.get(clau) ?? index.alies.get(clau) ?? null;
}

const RESULTAT_BUIT = Object.freeze({ estat: 'buit' });
const RESULTAT_CAP = Object.freeze({ estat: 'cap' });

/**
 * El poble que vol dir un text del selector de la fitxa, tal com el diu la
 * gent: el nom oficial, sense accents ni majúscules, amb l'article o sense
 * («Torre de les Maçanes»), o un àlies («Jijona», «la Torre», «Alcoy»).
 * `pobles`: la llista on es busca; per defecte, el catàleg de la llavor i els
 * municipis de referència (pobles/aliesDePobles.js · catalegDePobles).
 * Torna, congelat: { estat: 'buit' } (cap text), { estat: 'cap' } (cap poble
 * o un text de més de MAX_TEXT_POBLE caràcters), { estat: 'trobat', poble:
 * { id, nom, comarca, provincia } } o { estat: 'ambigu', pobles: [...] }.
 */
export function resolPobleDeText(text, { pobles } = {}) {
  const index = indexPer(pobles);
  const t = net(text);
  if (!t) return RESULTAT_BUIT;
  if (t.length > MAX_TEXT_POBLE) return RESULTAT_CAP;
  const formes = formesDe(t);
  const refs = refsDe(index, formes) ?? (formes.length > 1 && ARTICLES.has(formes[0]) ? refsDe(index, formes.slice(1)) : null);
  if (!refs) return RESULTAT_CAP;
  const trobats = [...refs.values()];
  return trobats.length === 1
    ? Object.freeze({ estat: 'trobat', poble: trobats[0] })
    : Object.freeze({ estat: 'ambigu', pobles: Object.freeze(trobats) });
}

/* ───────────────────────── D-5 · Les etiquetes lliures ───────────────────────── */

/* El que no és lletra, marca, xifra, espai, apòstrof, punt volat o guionet. */
const NO_ETIQUETA = /[^\p{L}\p{M}\p{N} '·-]+/gu;
const APOSTROFS = /[‘’ʼ]/g;
const VORES_ETIQUETA = new Set([' ', '-', "'", '·']);
const TE_LLETRA_O_XIFRA = /[\p{L}\p{N}]/u;

/* Cada tema del vocabulari, per la forma de comparació del seu id, del seu nom
   i del seu títol («festes», «Festes i tradicions», «Les festes»). */
const TEMES_PER_FORMA = new Map();
for (const t of VOCABULARI_RURAL) {
  for (const text of [t.id, t.nom, t.titol]) if (!TEMES_PER_FORMA.has(formaDe(text))) TEMES_PER_FORMA.set(formaDe(text), t);
}

/**
 * Una etiqueta lliure, neta: sense els «#» del principi, amb l'apòstrof recte,
 * en minúscules, els signes que no són lletres, xifres, «'», «·» ni «-» fets
 * espais i sense guionets, apòstrofs ni punts volats a les puntes. Ha de fer
 * de MIN_ETIQUETA_LLIURE a MAX_ETIQUETA_LLIURE punts de codi i portar alguna
 * lletra o xifra; si no, null. Sense lookbehind ni Intl.Segmenter (Baseline
 * Safari 16), i lineal: cap regex amb retrocés.
 */
export function normalitzaEtiquetaLliure(text) {
  if (typeof text !== 'string') return null;
  const crua = net(text);
  if (!crua || crua.length > MAX_TEXT_ETIQUETA) return null;
  let inici = 0;
  while (inici < crua.length && crua[inici] === '#') inici += 1;
  const neta = crua.slice(inici).normalize('NFC').replace(APOSTROFS, "'").replace(PUNTS_VOLATS, '·')
    .toLocaleLowerCase('ca').replace(NO_ETIQUETA, ' ').replace(ESPAIS, ' ');
  let a = 0;
  let b = neta.length;
  while (a < b && VORES_ETIQUETA.has(neta[a])) a += 1;
  while (b > a && VORES_ETIQUETA.has(neta[b - 1])) b -= 1;
  const etiqueta = neta.slice(a, b);
  const punts = [...etiqueta].length;
  if (punts < MIN_ETIQUETA_LLIURE || punts > MAX_ETIQUETA_LLIURE || !TE_LLETRA_O_XIFRA.test(etiqueta)) return null;
  return etiqueta;
}

/**
 * L'etiqueta d'un text de la persona: la del vocabulari rural si el text és
 * l'id, el nom o el títol d'un tema ({ id, nom, lliure: false }), o una de
 * lliure amb el text net ({ id: text, nom: text, lliure: true }); null si el
 * text no val. `clau` és la forma de comparació (sense accents ni majúscules)
 * per a no repetir-la. Congelada.
 */
export function etiquetaDeText(text) {
  const n = normalitzaEtiquetaLliure(text);
  if (n === null) return null;
  const tema = TEMES_PER_FORMA.get(formaDe(n));
  return Object.freeze(tema
    ? { id: tema.id, nom: tema.nom, lliure: false, clau: tema.id }
    : { id: n, nom: n, lliure: true, clau: formaDe(n) });
}

/**
 * Si es pot afegir una etiqueta a les que ja estan marcades (`ids`), a la
 * revisió de la fitxa. Torna, congelat: { estat: 'invalida' }, { estat:
 * 'repetida', etiqueta } (sense accents ni majúscules), { estat: 'massa',
 * maxim } (ja n'hi ha MAX_ETIQUETES_REVISADES; o, si és lliure, ja hi ha
 * MAX_ETIQUETES_LLIURES de lliures, amb `lliures: true`) o { estat: 'ok',
 * etiqueta }.
 */
export function etiquetaNova(text, ids = []) {
  const etiqueta = etiquetaDeText(text);
  if (!etiqueta) return Object.freeze({ estat: 'invalida' });
  const marcades = Array.isArray(ids) ? ids.filter((id) => typeof id === 'string') : [];
  if (marcades.some((id) => formaDe(id) === etiqueta.clau)) return Object.freeze({ estat: 'repetida', etiqueta });
  if (marcades.length >= MAX_ETIQUETES_REVISADES) return Object.freeze({ estat: 'massa', maxim: MAX_ETIQUETES_REVISADES });
  if (etiqueta.lliure && marcades.filter((id) => !TEMES_PER_ID.has(id)).length >= MAX_ETIQUETES_LLIURES) {
    return Object.freeze({ estat: 'massa', maxim: MAX_ETIQUETES_LLIURES, lliures: true });
  }
  return Object.freeze({ estat: 'ok', etiqueta });
}

const nombreNatural = (n) => (Number.isInteger(n) && n >= 0 ? n : 0);

/* Una etiqueta de la fitxa per al cos i per a la pantalla: el nom, el títol i
   la descripció surten sempre del vocabulari (mai d'una fitxa rehidratada),
   i les proves i el recompte, de la proposta de la màquina si n'hi havia. */
function etiquetaDe(tema, proposada) {
  const proves = Array.isArray(proposada?.proves) ? proposada.proves.filter((p) => typeof p === 'string') : [];
  return { id: tema.id, nom: tema.nom, titol: tema.titol, descripcio: tema.descripcio, coincidencies: nombreNatural(proposada?.coincidencies), proves };
}

function etiquetesCorregides(ids, proposades) {
  if (!Array.isArray(ids)) throw new TypeError('memoriaOral: «etiquetes» ha de ser una llista d\'identificadors del vocabulari rural.');
  const vistes = new Set();
  const llista = [];
  for (const id of ids) {
    const tema = typeof id === 'string' ? TEMES_PER_ID.get(id) : undefined;
    if (!tema) throw new TypeError(`memoriaOral: «${String(id).slice(0, 40)}» no és cap etiqueta del vocabulari rural.`);
    if (vistes.has(id)) continue;
    vistes.add(id);
    llista.push(etiquetaDe(tema, proposades.find((e) => e?.id === id)));
  }
  return llista;
}

/* D-5 · Una etiqueta lliure dins de la fitxa: el nom és el text net, sense
   títol ni descripció del vocabulari, i sense cap coincidència del relat. */
const etiquetaLliure = (id) => ({ id, nom: id, titol: id, descripcio: '', coincidencies: 0, proves: [], lliure: true });

/* Cert si una etiqueta d'una fitxa ja revisada és una lliure de veres: el
   text ja net i que no és cap tema del vocabulari (una fitxa rehidratada pot
   portar-ne qualsevol cosa). */
function esLliureDeLaFitxa(e) {
  if (e?.lliure !== true || typeof e.id !== 'string' || normalitzaEtiquetaLliure(e.id) !== e.id) return false;
  return etiquetaDeText(e.id)?.lliure === true;
}

/* Les etiquetes que ja porta la fitxa: les del vocabulari (refetes des del
   vocabulari) i les lliures d'una revisió anterior. */
const etiquetesDeLaFitxa = (proposades) => proposades.flatMap((e) => {
  if (TEMES_PER_ID.has(e?.id)) return [etiquetaDe(TEMES_PER_ID.get(e.id), e)];
  return esLliureDeLaFitxa(e) ? [etiquetaLliure(e.id)] : [];
});

/*
 * D-5 · Les etiquetes de la revisió: les del vocabulari que es queden (`ids`;
 * sense, les de la fitxa) i, darrere, les que la persona ha escrit
 * (`lliures`; sense, les lliures que ja portava la fitxa). Una de `lliures`
 * que és del vocabulari hi entra com a afegida del vocabulari. Sense
 * repetits (sense accents ni majúscules). TypeError si una no val, si hi ha
 * més de MAX_ETIQUETES_LLIURES de lliures o més de MAX_ETIQUETES_REVISADES en
 * total. null si no hi ha cap correcció d'etiquetes.
 */
function etiquetesRevisades(ids, lliures, proposades) {
  if (ids === undefined && lliures === undefined) return null;
  const llista = etiquetesCorregides(ids === undefined ? proposades.flatMap((e) => (TEMES_PER_ID.has(e?.id) ? [e.id] : [])) : ids, proposades);
  const textos = lliures === undefined ? proposades.filter(esLliureDeLaFitxa).map((e) => e.id) : lliures;
  if (!Array.isArray(textos)) throw new TypeError('memoriaOral: «etiquetesLliures» ha de ser una llista de textos.');
  const lliuresFinals = [];
  const claus = new Set();
  for (const text of textos) {
    const e = etiquetaDeText(text);
    if (!e) {
      throw new TypeError(`memoriaOral: «${String(text).slice(0, 40)}» no és cap etiqueta (de ${MIN_ETIQUETA_LLIURE} a ${MAX_ETIQUETA_LLIURE} caràcters, amb lletres o xifres).`);
    }
    if (!e.lliure) {
      if (!llista.some((x) => x.id === e.id)) llista.push(etiquetaDe(TEMES_PER_ID.get(e.id), proposades.find((p) => p?.id === e.id)));
    } else if (!claus.has(e.clau)) {
      claus.add(e.clau);
      lliuresFinals.push(etiquetaLliure(e.id));
    }
  }
  if (lliuresFinals.length > MAX_ETIQUETES_LLIURES) throw new TypeError(`memoriaOral: com a molt ${MAX_ETIQUETES_LLIURES} etiquetes lliures.`);
  if (llista.length + lliuresFinals.length > MAX_ETIQUETES_REVISADES) throw new TypeError(`memoriaOral: com a molt ${MAX_ETIQUETES_REVISADES} etiquetes.`);
  return [...llista, ...lliuresFinals];
}

/* El poble de la revisió: un dels candidats, el que una revisió anterior ja
   va signar (una segona revisió d'un poble triat al selector: `signat`) o,
   si qui crida dona `coneguts` (D-5: el catàleg del selector), un poble
   d'eixa llista, sense cap menció del relat. Si no, TypeError. */
function municipiCorregit(id, candidats, coneguts, signat) {
  if (id === null) return null;
  const valid = typeof id === 'string' && ID_POBLE.test(id);
  const triat = valid ? candidats.find((c) => c?.id === id) : undefined;
  if (triat) return { ...triat, mencions: nombreNatural(triat.mencions) };
  /* El signat, refet camp a camp (pot ser una fitxa rehidratada). */
  if (valid && signat?.id === id && net(signat.nom)) {
    return { id, nom: net(signat.nom), comarca: net(signat.comarca) || null, provincia: net(signat.provincia) || null, mencions: nombreNatural(signat.mencions) };
  }
  const conegut = valid && coneguts !== undefined ? indexPer(coneguts).perId.get(id) : undefined;
  if (!conegut) throw new TypeError('memoriaOral: «municipi» ha de ser un dels pobles candidats de la fitxa (o dels «poblesConeguts»), o null.');
  return { ...conegut, mencions: 0 };
}

/*
 * La correcció de la revisió humana (Gauntlet 261101, B2-04; D-5): les
 * etiquetes que es queden (ids del vocabulari, en l'ordre que les dona qui
 * crida) i les lliures, i el poble (un dels candidats, un dels `coneguts` o
 * cap). Si no canvia res, null. Si canvia, refà el títol (si era el del
 * motor), la descripció, el cos i el camí; el resum i el relat no es toquen:
 * són frases del mateix relat. El títol i la descripció només nomenen
 * etiquetes del vocabulari: una lliure no té cap títol amb article.
 */
function correccioDe(fitxa, idsEtiquetes, idMunicipi, lliures, coneguts) {
  const proposades = Array.isArray(fitxa.etiquetes) ? fitxa.etiquetes : [];
  const candidats = Array.isArray(fitxa.candidats) ? fitxa.candidats.filter((c) => c && typeof c === 'object') : [];
  const etiquetes = etiquetesRevisades(idsEtiquetes, lliures, proposades);
  /* Gauntlet T6a-G06 · El poble de la fitxa només compta com a triat si una
     revisió anterior el va signar (status stable i el mateix `municipi` al
     frontmatter): un esborrany no en pot colar cap que no siga candidat. */
  const fm = fitxa.okf.frontmatter;
  const signat = fm.status === 'stable' && fitxa.municipi?.id === fm.municipi ? fitxa.municipi : undefined;
  const municipi = idMunicipi === undefined ? undefined : municipiCorregit(idMunicipi, candidats, coneguts, signat);
  /* Les llistes d'ids, unides per un salt de línia: una etiqueta lliure pot
     portar espais, però cap salt. */
  const abans = proposades.map((e) => e?.id).join('\n');
  const canviaEtiquetes = etiquetes !== null && etiquetes.map((e) => e.id).join('\n') !== abans;
  const canviaPoble = municipi !== undefined && (municipi?.id ?? null) !== (fitxa.municipi?.id ?? null);
  if (!canviaEtiquetes && !canviaPoble) return null;

  const relatMd = relatDelCos(fitxa.okf.cos);
  const empremtaDelCami = EMPREMTA_DEL_CAMI.exec(String(fitxa.okf.cami ?? ''))?.[1];
  if (relatMd === null || !empremtaDelCami) throw new TypeError('memoriaOral: esta fitxa no l\'ha feta este motor; no es pot corregir.');
  const finals = canviaEtiquetes ? etiquetes : etiquetesDeLaFitxa(proposades);
  const delVocabulari = finals.filter((e) => e.lliure !== true);
  const triat = municipi === undefined ? (fitxa.municipi ?? null) : municipi;
  const titol = fitxa.titolDeLaPersona === false
    ? titolDe(delVocabulari, triat, '', typeof fitxa.titolDelText === 'string' ? fitxa.titolDelText : '')
    : fitxa.okf.frontmatter.title;
  const descripcio = descripcioDe(delVocabulari, triat, candidats, true);
  const descartades = proposades.filter((e) => !finals.some((f) => f.id === e?.id)).map((e) => TEMES_PER_ID.get(e?.id)?.nom ?? escapaMd(String(e?.id)));
  const cos = cosMarkdown({
    descripcio,
    resum: typeof fitxa.resum === 'string' ? fitxa.resum : '',
    etiquetes: finals,
    candidats: candidats.map((c) => ({ ...c, mencions: nombreNatural(c.mencions) })),
    relatMd,
    /* El subtítol de la nota, net (una fitxa rehidratada pot portar-ne qualsevol cosa). */
    subtitol: typeof fitxa.subtitol === 'string' ? net(fitxa.subtitol) : '',
    revisio: { canviaEtiquetes, canviaPoble, descartades, municipi: triat }
  });
  const cami = `memoria-oral/${triat?.id ?? 'sense-poble'}/${slugDe(titol) || 'relat'}-${empremtaDelCami}.md`;
  return { titol, descripcio, etiquetes: finals, municipi: triat, cos, cami };
}

/**
 * La revisió humana d'una fitxa (OKF v0.2 §5.2 i §5.4): torna una fitxa nova,
 * immutable, amb `status: stable`, un `verified` més `{ by: human:<persona>,
 * at: ara }` i el markdown refet. `ara` és obligatori (ISO 8601 amb fus, o
 * Date): el motor no llig el rellotge.
 *
 * La persona pot corregir la proposta de la màquina abans de signar
 * (Gauntlet 261101, B2-04):
 *  · etiquetes: la llista d'ids del vocabulari rural que es queden (les que
 *    falten són descartades; una que no havia proposat la màquina hi entra
 *    com a afegida en la revisió);
 *  · municipi: l'id d'un dels `candidats` de la fitxa, o null (cap);
 *  · etiquetesLliures (D-5): els textos de les etiquetes que la persona ha
 *    escrit (etiquetaDeText): una del vocabulari compta com a afegida del
 *    vocabulari, i les altres van darrere, com a etiquetes lliures (com a
 *    molt MAX_ETIQUETES_LLIURES, i MAX_ETIQUETES_REVISADES en total). Sense,
 *    les lliures que ja portava la fitxa;
 *  · poblesConeguts (D-5): la llista on `municipi` pot ser un poble que no és
 *    candidat (el catàleg del selector, catalegDePobles). Sense, només un
 *    candidat.
 * Si canvien, la fitxa segellada ho reflectix al frontmatter (`tags`,
 * `municipi`, `title` si era el del motor, `description`), al cos (cada
 * secció diu què s'ha corregit) i al camí. Sense correcció, només canvien
 * l'estat i `verified`.
 *
 * La fitxa d'entrada ha de ser OKF vàlida (validaFitxaOkf): una fitxa
 * rehidratada (JSON del disc o d'una base de dades) amb una data o un estat
 * colats no arriba mai al YAML. Un `verified` en un sol mapa compta com una
 * llista d'un (§5.2).
 */
export function marcaRevisioHumana(fitxa, { persona, ara, etiquetes, municipi, etiquetesLliures, poblesConeguts } = {}) {
  if (!fitxa?.okf?.frontmatter) throw new TypeError('memoriaOral: no hi ha cap fitxa OKF per revisar.');
  const at = instantDe(ara, 'ara');
  if (!at) throw new TypeError('memoriaOral: la revisió necessita «ara».');
  const by = actorHuma(persona, 'persona');
  if (poblesConeguts !== undefined && !Array.isArray(poblesConeguts)) throw new TypeError('memoriaOral: «poblesConeguts» ha de ser una llista de pobles.');
  const anterior = fitxa.okf.frontmatter;
  const validacio = validaFitxaOkf(anterior);
  if (!validacio.valida) throw new TypeError(`memoriaOral: fitxa OKF no vàlida: ${validacio.errors.join(' ')}`);
  const previs = (anterior.verified == null ? [] : [].concat(anterior.verified))
    .map((v) => ({ by: v.by, at: instantDe(v.at, 'verified.at') }));
  const c = correccioDe(fitxa, etiquetes, municipi, etiquetesLliures, poblesConeguts);

  const frontmatter = { ...anterior, status: 'stable', verified: [...previs, { by, at }] };
  if (anterior.generated && 'at' in anterior.generated) frontmatter.generated = { ...anterior.generated, at: instantDe(anterior.generated.at, 'generated.at') };
  if ('stale_after' in anterior) frontmatter.stale_after = instantDe(anterior.stale_after, 'stale_after');
  if (c) {
    frontmatter.title = c.titol;
    frontmatter.description = c.descripcio;
    frontmatter.tags = c.etiquetes.map((e) => e.id);
    delete frontmatter.municipi;
    if (c.municipi) frontmatter.municipi = c.municipi.id;
  }
  const cos = c ? c.cos : fitxa.okf.cos;
  return congela({
    ...fitxa,
    ...(c ? { titol: c.titol, descripcio: c.descripcio, etiquetes: c.etiquetes, municipi: c.municipi } : {}),
    okf: { ...fitxa.okf, ...(c ? { cami: c.cami, cos } : {}), frontmatter, markdown: markdownDe(frontmatter, cos) }
  });
}

/** L'esglaó de confiança d'un frontmatter OKF (§5.3), un de NIVELLS_CONFIANCA. */
export function nivellDeConfianca(frontmatter) {
  const v = frontmatter?.verified;
  if (!v) return NIVELLS_CONFIANCA.senseVerificar;
  const llista = Array.isArray(v) ? v : [v];
  if (!llista.length) return NIVELLS_CONFIANCA.senseVerificar;
  return llista.some((e) => typeof e?.by === 'string' && e.by.startsWith('human:')) ? NIVELLS_CONFIANCA.huma : NIVELLS_CONFIANCA.maquina;
}

/* Una data del frontmatter: una cadena ISO 8601 de veres o un Date vàlid (el
   que dona un lector YAML amb dates, com js-yaml DEFAULT_SCHEMA). */
const esInstant = (valor) => (valor instanceof Date ? !Number.isNaN(valor.getTime()) : esInstantIso(valor));
const esActor = (valor) => typeof valor === 'string' && (ACTOR_AMB_PREFIX.test(valor) || ACTOR_PRODUCTOR.test(valor));
const esText = (valor) => typeof valor === 'string' && valor.trim() !== '';
const esMapa = (valor) => Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor);
const finestraValida = (w) => esMapa(w) && esInstant(w.from) && esInstant(w.to);

/* Els errors d'una entrada de `sources` (§5.1), amb els seus senyals de
   credibilitat (Gauntlet 261101, B2-10). */
function errorsDeFont(s, n) {
  if (!esMapa(s)) return [`sources[${n}]: ha de ser un mapa (§5.1).`];
  const errors = [];
  if (!esText(s.resource)) errors.push(`sources[${n}].resource: obligatori i no buit (§5.1).`);
  if ('id' in s && !esText(s.id)) errors.push(`sources[${n}].id: ha de ser un text no buit (§5.1).`);
  if ('title' in s && !esText(s.title)) errors.push(`sources[${n}].title: ha de ser un text no buit (§5.1).`);
  if ('author' in s && !esActor(s.author)) errors.push(`sources[${n}].author: ha de ser un actor (§5.1, §7).`);
  if ('usage_count' in s && !(Number.isInteger(s.usage_count) && s.usage_count >= 0)) errors.push(`sources[${n}].usage_count: un nombre enter no negatiu (§5.1).`);
  if ('last_modified' in s && !esInstant(s.last_modified)) errors.push(`sources[${n}].last_modified: data ISO 8601 amb fus (§5.1).`);
  if ('usage_window' in s && !finestraValida(s.usage_window)) errors.push(`sources[${n}].usage_window: { from, to } amb dates ISO 8601 amb fus (§5.1).`);
  return errors;
}

/**
 * Comprova un frontmatter de concepte contra les regles d'OKF v0.2 (§4.1, §5,
 * §7 i §10.2) abans de publicar-lo. `type` és l'únic camp obligatori; els
 * altres, si hi són, han de tindre la forma de l'especificació, també els
 * senyals de credibilitat de les fonts (§5.1: `author`, `usage_count`,
 * `last_modified` i `usage_window`) i el `runtime` que una «Attested
 * Computation» porta per força (§10.2). Un `verified` en un sol mapa compta
 * com una llista d'un (§5.2). Les claus d'extensió no es comproven (§4.1).
 * Torna { valida, errors }.
 */
export function validaFitxaOkf(frontmatter) {
  const errors = [];
  const fm = frontmatter;
  if (!fm || typeof fm !== 'object' || Array.isArray(fm)) return Object.freeze({ valida: false, errors: Object.freeze(['El frontmatter ha de ser un mapa.']) });
  if (!esText(fm.type)) errors.push('type: obligatori i no buit (§4.1).');
  for (const clau of ['title', 'description', 'resource']) {
    if (clau in fm && !esText(fm[clau])) errors.push(`${clau}: ha de ser un text no buit (§4.1).`);
  }
  if ('tags' in fm && (!Array.isArray(fm.tags) || !fm.tags.every(esText))) errors.push('tags: ha de ser una llista de textos (§4.1).');
  if ('status' in fm && !STATUS_OKF.has(fm.status)) errors.push('status: draft, stable o deprecated (§5.4).');
  if ('stale_after' in fm && !esInstant(fm.stale_after)) errors.push('stale_after: data ISO 8601 amb fus (§5.5).');
  if ('generated' in fm) {
    const g = fm.generated;
    if (!g || typeof g !== 'object' || !esActor(g.by)) errors.push('generated.by: obligatori, un actor (§5.2, §7).');
    else if ('at' in g && !esInstant(g.at)) errors.push('generated.at: data ISO 8601 amb fus (§5.2).');
  }
  if ('verified' in fm) {
    const llista = Array.isArray(fm.verified) ? fm.verified : [fm.verified];
    if (!llista.every((v) => v && typeof v === 'object' && esActor(v.by) && esInstant(v.at))) errors.push('verified: cada entrada { by: actor, at: data ISO 8601 amb fus } (§5.2).');
  }
  if ('sources' in fm) {
    if (!Array.isArray(fm.sources)) errors.push('sources: ha de ser una llista (§5.1).');
    else fm.sources.forEach((s, n) => errors.push(...errorsDeFont(s, n)));
  }
  if ('usage_window' in fm && !finestraValida(fm.usage_window)) errors.push('usage_window: { from, to } amb dates ISO 8601 amb fus (§5.1).');
  if (fm.type === 'Attested Computation' && !esText(fm.runtime)) errors.push('runtime: obligatori en una Attested Computation (§10.2).');
  return Object.freeze({ valida: errors.length === 0, errors: Object.freeze(errors) });
}

/**
 * L'index.md arrel d'un paquet OKF de memòria oral (§8 i §12): el frontmatter
 * només porta `okf_version`, i cada fitxa és una línia «* [Títol](/camí) -
 * descripció», agrupada per poble en l'ordre d'arribada. Cada grup és una
 * secció amb el seu H1, com a l'exemple del §8 (Gauntlet 261101, B2-12);
 * `titol` només encapçala l'índex buit. Les entrades sense fitxa OKF no hi
 * entren.
 */
export function indexOkf(fitxes, { titol = 'Memòria oral' } = {}) {
  const grups = new Map();
  for (const f of fitxes ?? []) {
    if (!f?.okf) continue;
    const grup = f.municipi?.nom ?? 'Sense poble detectat';
    if (!grups.has(grup)) grups.set(grup, []);
    grups.get(grup).push(`* [${escapaMd(f.okf.frontmatter.title)}](/${f.okf.cami}) - ${escapaMd(f.okf.frontmatter.description)}`);
  }
  const l = ['---', `okf_version: ${yamlCadena(OKF_VERSIO)}`, '---', ''];
  if (!grups.size) l.push(`# ${escapaMd(titol)}`, '', 'Encara no hi ha cap relat.', '');
  for (const [grup, linies] of grups) l.push(`# ${escapaMd(grup)}`, '', ...linies, '');
  return l.join('\n');
}

/**
 * Una entrada del log.md del paquet (§9): l'encapçalament de data
 * (AAAA-MM-DD, la data d'`ara` tal com està escrita) i una línia. Una fitxa
 * esborrany és una «Proposta»; una de revisada, una «Revisió».
 */
export function entradaLog(fitxa, { ara } = {}) {
  if (!fitxa?.okf?.frontmatter) throw new TypeError('memoriaOral: no hi ha cap fitxa OKF per registrar.');
  const at = instantDe(ara, 'ara');
  if (!at) throw new TypeError('memoriaOral: el registre necessita «ara».');
  const fm = fitxa.okf.frontmatter;
  const enllac = `[${escapaMd(fm.title)}](/${fitxa.okf.cami})`;
  /* Un `verified` en un sol mapa és una llista d'un (§5.2). */
  const darrera = [].concat(fm.verified ?? []).pop()?.by;
  const linia = fm.status === 'draft'
    ? `* **Proposta**: ${enllac}, esborrany de ${ACTOR_ESTRUCTURADOR} pendent de revisió humana.`
    : `* **Revisió**: ${enllac}, revisada per ${typeof darrera === 'string' ? escapaMd(darrera) : 'una persona'}.`;
  return `## ${at.slice(0, 10)}\n${linia}\n`;
}

/**
 * T2 · D04/D10 (assalt 261101) · El fitxer Markdown d'una fitxa OKF a partir
 * del seu frontmatter i del seu cos, amb el mateix serialitzador que la fitxa
 * (fitxa.okf.markdown): el paquet Open Data l'escriu a data/okf/ i el
 * restaurador comprova que els bytes hi tornen igual. Llança TypeError amb un
 * estat o una data que no són d'OKF v0.2.
 */
export const markdownOkf = (frontmatter, cos) => markdownDe(frontmatter, cos);
