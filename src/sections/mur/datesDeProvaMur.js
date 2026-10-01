/**
 * datesDeProvaMur.js — les dates de prova del Mur (mode seed).
 *
 * Tasca 5 (ordre del Mestre, 261001): «Per comprovar que l'ordenació temporal
 * funciona», les huit targetes importants del Mur porten dia i hora d'ESTA
 * setmana, i les molt tècniques, una data de fa dues setmanes (entre el 2 i
 * el 15 de setembre de 2026). L'ordre per defecte del Mur (MurSection ·
 * momentDElement, la mateixa data que pinta la pastilla) les deixa així dalt
 * de tot, i el Calendari en té per a pintar en la setmana en curs.
 *
 * Per què és una capa a banda i no una data escrita al copy:
 *  · les pàgines de sistema (PAGE_COPY, legalContent) es servixen també en
 *    mode remot, on la data del copy és la de creació de la pàgina, un dia
 *    sense hora (T51; D5 de barraTaronjaData.contracte.test.jsx). Cap data de
 *    prova ha d'arribar a producció: esta capa només la carrega el mode seed
 *    (data/supabase/content.js), i la llavor (APP_SEED) queda intacta;
 *  · les d'esta setmana es calculen a partir de l'arrencada (de dilluns a les
 *    00:00 fins ara, mai en el futur): no caduquen, i la demostració de
 *    qualsevol dia en porta.
 *
 * Els actes de l'agenda (eventsSeed.js) no hi són: la seua data és el dia de
 * l'acte, no el de la publicació, i el Calendari els pinta el dia que passen.
 *
 * Mòdul pur, sense imports: `ara` s'injecta a les proves.
 */

/** L'arrencada de la demostració: una sola per a totes les càrregues. El Mur
    (loadMur) i les pàgines (loadCoreContent) es demanen en moments diferents
    i no poden repartir-se unes altres hores. */
const ARRENCADA = new Date();

/** On porta la data de creació cada col·lecció de la llavor. El copy d'una
    pàgina, a `date` (MurSection la passa a created_at; TextSection i
    paginaDeText la lligen com a creació); la resta, a `created_at`. */
const CAMP_DE_DATA = Object.freeze({ pages: 'date', feedPosts: 'created_at', marketItems: 'created_at' });

/**
 * Les importants, de la més nova a la més vella: l'ordre en què les pinta el
 * Mur. Són les que ja eren dalt menys les dos més tècniques, i l'anunci del
 * Mac Mini per a arribar a huit. Primer, el que un veí necessita en entrar:
 * què és Sóc de Poble, la samarreta oficial del Mercat i el seu Bloc de notes;
 * després, les lleis, la Wiki, l'anunci d'un veí, el full de ruta i la pàgina
 * legal. [col·lecció, id]
 */
export const IMPORTANTS_DEL_MUR = Object.freeze([
  ['pages', 'projecte'],
  ['marketItems', 'samarreta-socdepoble'],
  ['pages', 'notes'],
  ['pages', 'constitucio'],
  ['pages', 'wikidepoble'],
  ['marketItems', 'mac-mini-m4'],
  ['pages', 'roadmap'],
  ['pages', 'legal']
].map((fila) => Object.freeze(fila)));

/**
 * Les molt tècniques, amb data fixa de fa dues setmanes, en hora de València
 * (CEST): el disseny del codi i la història de les versions. Porten hora,
 * com les importants. [col·lecció, id, data]
 */
export const TECNIQUES_DEL_MUR = Object.freeze([
  ['pages', 'disseny', '2026-09-14T18:25:00+02:00'],
  ['pages', 'versions', '2026-09-03T11:50:00+02:00']
].map((fila) => Object.freeze(fila)));

const MINUT = 60 * 1000;
/* La jornada on es repartixen: ningú no publica a les quatre de la matinada. */
const HORA_INICI = 8;
const HORA_FI = 22;

/** Dilluns a les 00:00 (hora local) de la setmana d'`ara`. */
export function dillunsDe(ara) {
  const dia = new Date(ara.getFullYear(), ara.getMonth(), ara.getDate());
  dia.setDate(dia.getDate() - ((dia.getDay() + 6) % 7));
  return dia;
}

/**
 * `n` moments d'esta setmana, del més nou al més vell, repartits a parts
 * iguals per les hores de jornada (de 8 a 22) de dilluns fins ara: cap en el
 * futur ni abans de dilluns, i cadascun més vell que l'anterior. A minut
 * sencer sempre que hi caben (tot menys els primers minuts de la setmana).
 * Dilluns de matinada, encara sense cap hora de jornada, es repartixen entre
 * les 00:00 i ara.
 */
export function momentsDEstaSetmana(n, ara = ARRENCADA) {
  const dilluns = dillunsDe(ara);
  const franges = [];
  for (const dia = new Date(dilluns); dia <= ara; dia.setDate(dia.getDate() + 1)) {
    const inici = new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), HORA_INICI).getTime();
    const fi = Math.min(new Date(dia.getFullYear(), dia.getMonth(), dia.getDate(), HORA_FI).getTime(), ara.getTime());
    if (fi > inici) franges.push([inici, fi]);
  }
  if (!franges.length) franges.push([dilluns.getTime(), ara.getTime()]);
  const total = franges.reduce((suma, [inici, fi]) => suma + (fi - inici), 0);
  const aMinut = total / n >= MINUT;
  /* La posició dins de la jornada (0 és dilluns a l'inici) passada a instant. */
  const instantDe = (posicio) => {
    let resta = posicio;
    for (const [inici, fi] of franges) {
      if (resta < fi - inici) return inici + resta;
      resta -= fi - inici;
    }
    return franges[franges.length - 1][1];
  };
  return Array.from({ length: n }, (_, i) => {
    const instant = instantDe(total * (n - i - 0.5) / n);
    return new Date(aMinut ? Math.floor(instant / MINUT) * MINUT : Math.floor(instant));
  });
}

/* Sense els mil·lisegons a zero: «…T00:00:00.000Z» és la forma d'un dia
   serialitzat, que editorial.js llig com un dia sense hora
   (MITJANIT_UTC_D_UN_DIA). Un moment de prova porta sempre la seua hora. */
const serialitza = (moment) => moment.toISOString().replace(/\.000Z$/, 'Z');

/**
 * La llavor amb les dates de prova del Mur, per al mode seed. Torna una
 * còpia: la llavor original no canvia, i cap col·lecció ni cap element que
 * no nomena (els actes, els pobles, la multimèdia…) es toca.
 */
export function llavorAmbDatesDeProva(llavor, ara = ARRENCADA) {
  const dates = new Map(TECNIQUES_DEL_MUR.map(([coleccio, id, data]) => [`${coleccio}:${id}`, data]));
  momentsDEstaSetmana(IMPORTANTS_DEL_MUR.length, ara)
    .forEach((moment, i) => dates.set(IMPORTANTS_DEL_MUR[i].join(':'), serialitza(moment)));
  const copia = { ...llavor };
  for (const [coleccio, camp] of Object.entries(CAMP_DE_DATA)) {
    if (!Array.isArray(llavor?.[coleccio])) continue;
    copia[coleccio] = llavor[coleccio].map((element) => {
      const data = dates.get(`${coleccio}:${element?.id}`);
      return data ? { ...element, [camp]: data } : element;
    });
  }
  return copia;
}
