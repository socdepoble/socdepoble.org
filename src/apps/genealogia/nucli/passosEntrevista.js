/**
 * passosEntrevista.js — Arbre Genealògic · els passos de l'entrevista i la
 * llista blanca de les respostes.
 *
 * Adaptat de PASSOS_ENTREVISTA_1_PREGUNTA del kit R111 (IDEA-100): cada pas
 * és UNA sola pregunta (regla d'una pregunta per torn). Es comença pel malnom
 * de la casa («Els de Ca...») i pel mas o poble concret, i es puja de G4 (tu
 * i els teus germans) a G3 (pare i mare, amb el cognom matern), G2 (els
 * quatre iaios, un per pas) i G1 (besavis). Els exemples són inventats: cap
 * nom ni poble real.
 *
 * Fitxer a banda d'entrevista.js perquè model.js (netejaEntrevista) el puga
 * importar sense cap cicle de mòduls.
 */
import { SEXES, VIVA } from './constants.js';
import { errorCamp, esClauSegura, objectePla, text } from './segur.js';

export const OPCIONS_FONT = Object.freeze(['oral', 'document']);
export const PASSOS_G2 = Object.freeze(['g2-pare-pare', 'g2-mare-pare', 'g2-pare-mare', 'g2-mare-mare']);
export const MAX_REPETICIONS = 20;

const congela = (objecte) => Object.freeze(objecte);
const AJUDA_DATA = congela({
  ca: 'Si no saps l’any exacte, escriu ~1950 (aproximat), 1950? (estimat) o 1950s (la dècada). Si no ho saps, deixa-ho en blanc.',
  es: 'Si no sabes el año exacto, escribe ~1950 (aproximado), 1950? (estimado) o 1950s (la década). Si no lo sabes, déjalo en blanco.',
  en: 'If you don’t know the exact year, write ~1950 (approximate), 1950? (estimated) or 1950s (the decade). If you don’t know, leave it blank.',
  eu: 'Urte zehatza ez badakizu, idatzi ~1950 (gutxi gorabehera), 1950? (estimatua) edo 1950s (hamarkada). Ez badakizu, utzi hutsik.',
  gl: 'Se non sabes o ano exacto, escribe ~1950 (aproximado), 1950? (estimado) ou 1950s (a década). Se non o sabes, déixao en branco.'
});
const EXEMPLE_PERSONA = congela({
  ca: 'Exemple inventat: Maria Exemple Prova, ~1950, llauradora',
  es: 'Ejemplo inventado: María Ejemplo Prueba, ~1950, labradora',
  en: 'Made-up example: Maria Example Sample, ~1950, farmer',
  eu: 'Asmatutako adibidea: Maria Adibide Proba, ~1950, nekazaria',
  gl: 'Exemplo inventado: María Exemplo Proba, ~1950, labrega'
});

const pas = (camps) => congela({ opcional: false, repetible: false, sexe: null, progenitorDe: null, opcions: null, ...camps });

/**
 * Els passos, en ordre. Camps propis a més dels del contracte:
 *   sexe          el sexe que es deduïx del pas ('M', 'F' o 'U')
 *   progenitorDe  el pas de qui és progenitor (g3-pare → g4-jo); per al G1 el tria la resposta (fillDe)
 *   opcions       en un pas 'opcio', els valors admesos
 */
export const PASSOS_ENTREVISTA = Object.freeze([
  pas({
    id: 'casa', generacio: 'CASA', tipus: 'text', opcional: true,
    pregunta: congela({
      ca: 'Com vos coneixen al poble? Quin és el malnom de la vostra casa («Els de Ca...»)?',
      es: '¿Cómo os conocen en el pueblo? ¿Cuál es el apodo de vuestra casa («Els de Ca...»)?',
      en: 'How is your family known in the village? What is your house nickname (“Els de Ca...”)?',
      eu: 'Nola ezagutzen zaituztete herrian? Zein da zuen etxeko ezizena («Els de Ca...»)?',
      gl: 'Como vos coñecen no pobo? Cal é o alcume da vosa casa («Els de Ca...»)?'
    }),
    ajuda: congela({
      ca: 'El malnom de la casa sovint és més antic que els cognoms i ajuda a trobar la família als padrons.',
      es: 'El apodo de la casa a menudo es más antiguo que los apellidos y ayuda a encontrar a la familia en los padrones.',
      en: 'The house nickname is often older than the surnames and helps to find the family in the censuses.',
      eu: 'Etxeko ezizena abizenak baino zaharragoa izan ohi da, eta familia erroldetan aurkitzen laguntzen du.',
      gl: 'O alcume da casa adoita ser máis antigo ca os apelidos e axuda a atopar a familia nos padróns.'
    }),
    exemple: congela({ ca: 'Exemple inventat: Ca la Prova', es: 'Ejemplo inventado: Ca la Prova', en: 'Made-up example: Ca la Prova', eu: 'Asmatutako adibidea: Ca la Prova', gl: 'Exemplo inventado: Ca la Prova' })
  }),
  pas({
    id: 'lloc', generacio: 'LLOC', tipus: 'text', opcional: true,
    pregunta: congela({
      ca: 'De quin mas, partida o poble concret és la família?',
      es: '¿De qué masía, partida o pueblo concreto es la familia?',
      en: 'Which farmstead, rural district or village exactly does the family come from?',
      eu: 'Zein baserri, auzo edo herri zehatzetakoa da familia?',
      gl: 'De que casal, parroquia ou pobo concreto é a familia?'
    }),
    ajuda: congela({
      ca: 'Com més concret, millor: cada parròquia i cada ajuntament tenen els seus llibres.',
      es: 'Cuanto más concreto, mejor: cada parroquia y cada ayuntamiento tienen sus libros.',
      en: 'The more specific, the better: each parish and each town council keeps its own books.',
      eu: 'Zenbat eta zehatzago, hobe: parrokia eta udal bakoitzak bere liburuak ditu.',
      gl: 'Canto máis concreto, mellor: cada parroquia e cada concello teñen os seus libros.'
    }),
    exemple: congela({ ca: 'Exemple inventat: Mas de la Prova, Poble Inventat', es: 'Ejemplo inventado: Mas de la Prova, Pueblo Inventado', en: 'Made-up example: Mas de la Prova, Madeup Village', eu: 'Asmatutako adibidea: Mas de la Prova, Herri Asmatua', gl: 'Exemplo inventado: Mas de la Prova, Pobo Inventado' })
  }),
  pas({
    id: 'g4-jo', generacio: 'G4', tipus: 'persona', sexe: 'U',
    pregunta: congela({
      ca: 'Comencem per tu: com et dius, quins són els teus dos cognoms i quan vas nàixer?',
      es: 'Empecemos por ti: ¿cómo te llamas, cuáles son tus dos apellidos y cuándo naciste?',
      en: 'Let’s start with you: what is your name, what are your two surnames and when were you born?',
      eu: 'Zurekin hasiko gara: nola duzu izena, zein dira zure bi abizenak eta noiz jaio zinen?',
      gl: 'Comecemos por ti: como te chamas, cales son os teus dous apelidos e cando naciches?'
    }),
    ajuda: congela({
      ca: 'Les persones vives queden protegides: no ixen en cap prompt ni exportació si no ho marques tu.',
      es: 'Las personas vivas quedan protegidas: no salen en ningún prompt ni exportación si no lo marcas tú.',
      en: 'Living people stay protected: they do not appear in any prompt or export unless you tick it.',
      eu: 'Bizirik dauden pertsonak babestuta daude: ez dira inongo prompt edo esportaziotan agertzen zuk markatzen ez baduzu.',
      gl: 'As persoas vivas quedan protexidas: non saen en ningún prompt nin exportación se non o marcas ti.'
    }),
    exemple: EXEMPLE_PERSONA
  }),
  pas({
    id: 'g4-germa', generacio: 'G4', tipus: 'persona', opcional: true, repetible: true, sexe: 'U',
    pregunta: congela({
      ca: 'Tens germans o germanes? Afig-ne un cada vegada, o passa al pas següent.',
      es: '¿Tienes hermanos o hermanas? Añade uno cada vez, o pasa al paso siguiente.',
      en: 'Do you have brothers or sisters? Add one at a time, or go on to the next step.',
      eu: 'Baduzu anai-arrebarik? Gehitu bat aldi bakoitzean, edo joan hurrengo urratsera.',
      gl: 'Tes irmáns ou irmás? Engade un de cada vez, ou pasa ao paso seguinte.'
    }),
    ajuda: congela({
      ca: 'Els germans són la primera branca col·lateral (FAN): ajuden a confirmar els pares als registres.',
      es: 'Los hermanos son la primera rama colateral (FAN): ayudan a confirmar a los padres en los registros.',
      en: 'Siblings are the first collateral branch (FAN): they help to confirm the parents in the records.',
      eu: 'Anai-arrebak lehen adar kolaterala dira (FAN): gurasoak erregistroetan berresten laguntzen dute.',
      gl: 'Os irmáns son a primeira póla colateral (FAN): axudan a confirmar os pais nos rexistros.'
    }),
    exemple: EXEMPLE_PERSONA
  }),
  pas({
    id: 'g3-pare', generacio: 'G3', tipus: 'persona', opcional: true, sexe: 'M', progenitorDe: 'g4-jo',
    pregunta: congela({
      ca: 'Com es diu o es deia ton pare, amb els seus dos cognoms, i quan va nàixer?',
      es: '¿Cómo se llama o se llamaba tu padre, con sus dos apellidos, y cuándo nació?',
      en: 'What is or was your father’s name, with both surnames, and when was he born?',
      eu: 'Nola du edo zuen izena zure aitak, bere bi abizenekin, eta noiz jaio zen?',
      gl: 'Como se chama ou se chamaba teu pai, cos seus dous apelidos, e cando naceu?'
    }),
    ajuda: AJUDA_DATA,
    exemple: EXEMPLE_PERSONA
  }),
  pas({
    id: 'g3-mare', generacio: 'G3', tipus: 'persona', opcional: true, sexe: 'F', progenitorDe: 'g4-jo',
    pregunta: congela({
      ca: 'Com es diu o es deia ta mare, amb els seus dos cognoms de soltera, i quan va nàixer?',
      es: '¿Cómo se llama o se llamaba tu madre, con sus dos apellidos de soltera, y cuándo nació?',
      en: 'What is or was your mother’s name, with both her maiden surnames, and when was she born?',
      eu: 'Nola du edo zuen izena zure amak, ezkongabeko bere bi abizenekin, eta noiz jaio zen?',
      gl: 'Como se chama ou se chamaba túa nai, cos seus dous apelidos de solteira, e cando naceu?'
    }),
    ajuda: congela({
      ca: 'El cognom matern és el que trobaràs als llibres parroquials: posa’l tal com era de soltera.',
      es: 'El apellido materno es el que encontrarás en los libros parroquiales: ponlo tal como era de soltera.',
      en: 'The maternal surname is the one you will find in the parish books: write it as it was before marriage.',
      eu: 'Amaren abizena da parrokia-liburuetan aurkituko duzuna: idatzi ezkondu aurretik zen bezala.',
      gl: 'O apelido materno é o que atoparás nos libros parroquiais: ponno tal como era de solteira.'
    }),
    exemple: EXEMPLE_PERSONA
  }),
  pas({
    id: 'g2-pare-pare', generacio: 'G2', tipus: 'persona', opcional: true, sexe: 'M', progenitorDe: 'g3-pare',
    pregunta: congela({
      ca: 'I el pare de ton pare, el teu iaio patern? Nom, cognoms i quan va nàixer.',
      es: '¿Y el padre de tu padre, tu abuelo paterno? Nombre, apellidos y cuándo nació.',
      en: 'And your father’s father, your paternal grandfather? Name, surnames and when he was born.',
      eu: 'Eta zure aitaren aita, aitaren aldeko aitona? Izena, abizenak eta noiz jaio zen.',
      gl: 'E o pai de teu pai, o teu avó paterno? Nome, apelidos e cando naceu.'
    }),
    ajuda: AJUDA_DATA,
    exemple: EXEMPLE_PERSONA
  }),
  pas({
    id: 'g2-mare-pare', generacio: 'G2', tipus: 'persona', opcional: true, sexe: 'F', progenitorDe: 'g3-pare',
    pregunta: congela({
      ca: 'I la mare de ton pare, la teua iaia paterna? Nom, cognoms de soltera i quan va nàixer.',
      es: '¿Y la madre de tu padre, tu abuela paterna? Nombre, apellidos de soltera y cuándo nació.',
      en: 'And your father’s mother, your paternal grandmother? Name, maiden surnames and when she was born.',
      eu: 'Eta zure aitaren ama, aitaren aldeko amona? Izena, ezkongabeko abizenak eta noiz jaio zen.',
      gl: 'E a nai de teu pai, a túa avoa paterna? Nome, apelidos de solteira e cando naceu.'
    }),
    ajuda: AJUDA_DATA,
    exemple: EXEMPLE_PERSONA
  }),
  pas({
    id: 'g2-pare-mare', generacio: 'G2', tipus: 'persona', opcional: true, sexe: 'M', progenitorDe: 'g3-mare',
    pregunta: congela({
      ca: 'I el pare de ta mare, el teu iaio matern? Nom, cognoms i quan va nàixer.',
      es: '¿Y el padre de tu madre, tu abuelo materno? Nombre, apellidos y cuándo nació.',
      en: 'And your mother’s father, your maternal grandfather? Name, surnames and when he was born.',
      eu: 'Eta zure amaren aita, amaren aldeko aitona? Izena, abizenak eta noiz jaio zen.',
      gl: 'E o pai de túa nai, o teu avó materno? Nome, apelidos e cando naceu.'
    }),
    ajuda: AJUDA_DATA,
    exemple: EXEMPLE_PERSONA
  }),
  pas({
    id: 'g2-mare-mare', generacio: 'G2', tipus: 'persona', opcional: true, sexe: 'F', progenitorDe: 'g3-mare',
    pregunta: congela({
      ca: 'I la mare de ta mare, la teua iaia materna? Nom, cognoms de soltera i quan va nàixer.',
      es: '¿Y la madre de tu madre, tu abuela materna? Nombre, apellidos de soltera y cuándo nació.',
      en: 'And your mother’s mother, your maternal grandmother? Name, maiden surnames and when she was born.',
      eu: 'Eta zure amaren ama, amaren aldeko amona? Izena, ezkongabeko abizenak eta noiz jaio zen.',
      gl: 'E a nai de túa nai, a túa avoa materna? Nome, apelidos de solteira e cando naceu.'
    }),
    ajuda: AJUDA_DATA,
    exemple: EXEMPLE_PERSONA
  }),
  pas({
    id: 'g1-besavi', generacio: 'G1', tipus: 'persona', opcional: true, repetible: true, sexe: 'U',
    pregunta: congela({
      ca: 'Saps el nom d’algun besavi o besàvia? Tria de quin iaio o iaia era pare o mare.',
      es: '¿Sabes el nombre de algún bisabuelo o bisabuela? Elige de qué abuelo o abuela era padre o madre.',
      en: 'Do you know the name of any great-grandparent? Choose which grandparent they were the parent of.',
      eu: 'Badakizu birraitona edo birramonaren baten izena? Aukeratu zein aitona edo amonaren guraso zen.',
      gl: 'Sabes o nome dalgún bisavó ou bisavoa? Escolle de que avó ou avoa era pai ou nai.'
    }),
    ajuda: congela({
      ca: 'L’ofici i el poble ajuden molt: als llibres parroquials (Quinque Libri) i als padrons sovint consten.',
      es: 'El oficio y el pueblo ayudan mucho: en los libros parroquiales (Quinque Libri) y en los padrones suelen constar.',
      en: 'Trade and village help a lot: they often appear in the parish books (Quinque Libri) and in the censuses.',
      eu: 'Lanbideak eta herriak asko laguntzen dute: parrokia-liburuetan (Quinque Libri) eta erroldetan agertu ohi dira.',
      gl: 'O oficio e o pobo axudan moito: nos libros parroquiais (Quinque Libri) e nos padróns adoitan constar.'
    }),
    exemple: EXEMPLE_PERSONA
  }),
  pas({
    id: 'font', generacio: 'FONT', tipus: 'opcio', opcions: OPCIONS_FONT,
    pregunta: congela({
      ca: 'D’on venen estos vincles: només de la memòria de la família o d’algun document escrit (partida, llibre de família)?',
      es: '¿De dónde vienen estos vínculos: solo de la memoria de la familia o de algún documento escrito (partida, libro de familia)?',
      en: 'Where do these links come from: family memory only, or a written document (certificate, family book)?',
      eu: 'Nondik datoz lotura hauek: familiaren oroimenetik bakarrik ala idatzizko dokumenturen batetik (agiria, familia-liburua)?',
      gl: 'De onde veñen estes vínculos: só da memoria da familia ou dalgún documento escrito (partida, libro de familia)?'
    }),
    /* La resposta no confirma res tota sola: un vincle només passa a
       [CONFIRMAT] quan la persona n'apunta la font escrita (la definició que
       també porten els prompts). */
    ajuda: congela({
      ca: 'Els vincles de l’entrevista queden [APROXIMAT]. Si ho has vist escrit, apunta el document a cada persona i el vincle passarà a [CONFIRMAT].',
      es: 'Los vínculos de la entrevista quedan [APROXIMAT]. Si lo has visto escrito, apunta el documento en cada persona y el vínculo pasará a [CONFIRMAT].',
      en: 'The interview links stay [APROXIMAT]. If you have seen it written down, note the document on each person and the link will become [CONFIRMAT].',
      eu: 'Elkarrizketako loturak [APROXIMAT] geratzen dira. Idatzita ikusi baduzu, idatzi dokumentua pertsona bakoitzean eta lotura [CONFIRMAT] izango da.',
      gl: 'Os vínculos da entrevista quedan [APROXIMAT]. Se o viches escrito, anota o documento en cada persoa e o vínculo pasará a [CONFIRMAT].'
    }),
    exemple: congela({ ca: '', es: '', en: '', eu: '', gl: '' })
  })
]);

const PER_ID = new Map(PASSOS_ENTREVISTA.map((p) => [p.id, p]));

/** El pas amb aquest id, o null. */
export function pasPerId(id) {
  return typeof id === 'string' && PER_ID.has(id) ? PER_ID.get(id) : null;
}

/**
 * La llista blanca d'una resposta de persona (RespostaPersona). La data es
 * desa com a text (la forma de llegeixData) i es valida en respondre.
 * `fillDe` només en el G1, i ha de ser un dels quatre passos G2.
 */
export function netejaRespostaPersona(cru, pasEntrevista) {
  if (!objectePla(cru)) throw errorCamp('valor');
  const textDe = (camp, max) => {
    try {
      return text(cru[camp], max);
    } catch {
      throw errorCamp(camp);
    }
  };
  /* Viu, ha mort o no ho sé: les tres respostes es conserven tal qual. Una
     resposta antiga només amb `difunta` (la casella d'abans) es llig com a
     'no' o 'desconegut'. `difunta` es manté derivat per compatibilitat. */
  let viva;
  if (cru.viva === undefined || cru.viva === null) viva = cru.difunta === true ? 'no' : 'desconegut';
  else if (VIVA.includes(cru.viva)) viva = cru.viva;
  else throw errorCamp('viva');
  const neta = {
    nom: textDe('nom', 80),
    cognom1: textDe('cognom1', 80),
    cognom2: textDe('cognom2', 80),
    naixement: textDe('naixement', 12),
    lloc: textDe('lloc', 120),
    ofici: textDe('ofici', 80),
    viva,
    difunta: viva === 'no'
  };
  if (neta.nom === '') throw errorCamp('nom', 'obligatori');
  if (cru.sexe !== undefined && cru.sexe !== null) {
    if (!SEXES.includes(cru.sexe)) throw errorCamp('sexe');
    neta.sexe = cru.sexe;
  }
  if (pasEntrevista?.id === 'g1-besavi') {
    if (!PASSOS_G2.includes(cru.fillDe)) throw errorCamp('fillDe', 'obligatori');
    neta.fillDe = cru.fillDe;
  }
  return neta;
}

/** La llista blanca de totes les respostes: només passos coneguts i valors del seu tipus. */
export function netejaRespostes(cru) {
  if (cru === null || cru === undefined) return {};
  if (!objectePla(cru)) throw errorCamp('respostes');
  const netes = {};
  for (const [clau, valor] of Object.entries(cru)) {
    if (!esClauSegura(clau)) throw errorCamp('respostes');
    const pasEntrevista = pasPerId(clau);
    if (!pasEntrevista) throw errorCamp('respostes', 'pas');
    if (pasEntrevista.tipus === 'text') netes[clau] = text(valor, 120);
    else if (pasEntrevista.tipus === 'opcio') {
      if (!pasEntrevista.opcions.includes(valor)) throw errorCamp(clau, 'opcio');
      netes[clau] = valor;
    } else if (pasEntrevista.repetible) {
      if (!Array.isArray(valor) || valor.length > MAX_REPETICIONS) throw errorCamp(clau, 'maxim');
      netes[clau] = valor.map((v) => netejaRespostaPersona(v, pasEntrevista));
    } else netes[clau] = netejaRespostaPersona(valor, pasEntrevista);
  }
  return netes;
}
