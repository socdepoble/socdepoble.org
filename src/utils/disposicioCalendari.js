/**
 * disposicioCalendari.js — on va cada ocurrència a les vistes Setmana i Mes,
 * pur (sense React ni DOM).
 *
 * T10 (ordre del Mestre, 261001) · VistaSetmana i VistaMes, a l'estil Google
 * Calendar. Les ocurrències arriben d'ocurrenciesEnRang (utils/esdeveniment.js),
 * que fa servir la mateixa regla que ocorreElDia: este mòdul només decidix la
 * geometria, mai si un acte ocorre o no.
 *
 * SETMANA. Un acte de tot el dia, o amb hora que dura almenys un dia de paret,
 * va a la franja de dalt (separaFranja; hipòtesi sobre el criteri de Google,
 * pendent de les captures del Mestre). La resta es talla per dies
 * (segmentaPerDies) i cada dia es disposa en columnes (disposaDia): clústers
 * d'actes que se solapen, columnes voraces i expansió cap a la dreta. Un
 * segment de durada zero (les targetes no porten fi) es pinta amb una alçada
 * mínima (minimMinuts, 30 per defecte), i el solapament es calcula amb eixa
 * alçada visible, com fa Google amb les caixes; l'hora que es llig és la real.
 *
 * MES I FRANJA. Cada fila de set dies fa segments (segmentsDeFila): una barra
 * si l'acte és de tot el dia o cobrix més d'un dia, un punt si és amb hora
 * d'un sol dia. Cada segment va al primer carril lliure (assignaCarrils) i, si
 * un dia no hi cap, l'últim carril visible es fa «+N» (retallaPerCapacitat):
 * una barra que travessa un dia ple es parteix en peces.
 *
 * Minuts de paret: de 0 a 1440, en hora local (periodes.js · minutDeParet).
 */
import { ocurrenciesEnRang } from './esdeveniment.js';
import { clauDeData, diesEntre, minutDeParet, sumaDies } from './periodes.js';

const MINUTS_DIA = 1440;

const compara = (a, b) => (a < b ? -1 : a > b ? 1 : 0);

/** L'ocurrència cobrix el dia d'una clau 'AAAA-MM-DD'? (Les claus de quatre xifres s'ordenen com a text.) */
export const ocurrenciaCobrix = (oc, clau) => oc.diaInici <= clau && clau < oc.diaFi;

/* Fase visual (prompt 261001_0445) · El color d'un acte segons d'on ve. Llista
   blanca: les fonts sense color propi (poble, nota, multimèdia, importats o
   desconegudes) es pinten com una publicació, mai amb una classe inventada.
   Les regles són al bloc SDP:calendari-vistes de modules.css. */
const FONTS_AMB_COLOR = Object.freeze(['esdeveniment', 'publicacio', 'producte', 'pagina', 'agenda']);

/** La classe de color d'un esdeveniment: 'sdp-cal-font--<font>'. */
export function classeDeFont(esd) {
  const tipus = esd?.font?.tipus;
  return `sdp-cal-font--${FONTS_AMB_COLOR.includes(tipus) ? tipus : 'publicacio'}`;
}

/**
 * Les ocurrències de tota una llista d'esdeveniments dins del rang [desde,
 * fins), en ordre cronològic (i per clau, si comencen alhora):
 * { ocurrencies, retallat }. Les nul·les no compten; retallat, si alguna
 * xarxa de passos s'ha hagut de tallar.
 */
export function ocurrenciesDeLaLlista(esdeveniments, desde, fins, opcions) {
  const ocurrencies = [];
  let retallat = false;
  for (const esd of esdeveniments ?? []) {
    if (!esd) continue;
    const resultat = ocurrenciesEnRang(esd, desde, fins, opcions);
    retallat = retallat || resultat.retallat;
    ocurrencies.push(...resultat.ocurrencies);
  }
  ocurrencies.sort((a, b) => a.inici - b.inici || compara(a.clau, b.clau));
  return { ocurrencies, retallat };
}

/**
 * On va una ocurrència a la vista Setmana: 'franja' (tot el dia, o amb hora
 * fins a la mateixa hora de paret de l'endemà o més enllà, encara que el dia
 * del canvi d'hora en faça 23 o 25) o 'graella'.
 */
export function separaFranja(oc) {
  if (oc.totElDia) return 'franja';
  const [inici, fi] = [new Date(oc.inici), new Date(oc.fi)];
  const dies = diesEntre(inici, fi);
  return dies > 1 || (dies === 1 && minutDeParet(fi) >= minutDeParet(inici)) ? 'franja' : 'graella';
}

/**
 * Els trossos d'una ocurrència als dies donats ([{ clau, data }]):
 * [{ ocurrencia, clau, iniciMin, fiMin, continuaAbans, continuaDespres }].
 * El primer dia comença a l'hora de paret de l'inici i els altres a les 00:00;
 * l'últim acaba a l'hora de paret de la fi (1440 si acaba a la mitjanit) i els
 * altres a les 24:00. Una ocurrència de durada zero fa iniciMin = fiMin.
 */
export function segmentaPerDies(oc, dies) {
  const clauFi = clauDeData(new Date(oc.fi));
  const segments = [];
  for (const { clau, data } of dies) {
    if (!ocurrenciaCobrix(oc, clau)) continue;
    const primer = clau === oc.diaInici;
    const darrer = clauDeData(sumaDies(data, 1)) === oc.diaFi;
    const iniciMin = oc.totElDia || !primer ? 0 : minutDeParet(oc.inici);
    let fiMin = MINUTS_DIA;
    if (darrer && !oc.totElDia) {
      // Acaba eixe dia; si acaba a la mitjanit (exclusiva), és el dia d'abans
      // a les 24:00. L'aritmètica de 24 h d'una regla repetida (vegeu
      // ocurrenciesEnRang) pot moure diaFi un dia: amb una fi d'abans del dia
      // (tardor) no fa cap tros negatiu; amb una fi de després (primavera),
      // l'últim dia comptat arriba fins a les 24:00 i el tros de l'endemà no
      // hi és, com no hi és a ocorreElDia.
      if (oc.fi === oc.inici || clauFi < clau) fiMin = iniciMin;
      else if (clauFi === clau) fiMin = minutDeParet(oc.fi);
    }
    segments.push({ ocurrencia: oc, clau, iniciMin, fiMin: Math.max(fiMin, iniciMin), continuaAbans: !primer, continuaDespres: !darrer });
  }
  return segments;
}

const solapen = (a, b) => a.segment.iniciMin < b.fiVisualMin && b.segment.iniciMin < a.fiVisualMin;

/* Columnes i amplada dels membres d'un clúster ja tancat. */
function tancaCluster(membres, columnes) {
  for (const membre of membres) {
    membre.columnes = columnes.length;
    membre.amplada = 1;
    // Expansió: ocupa les columnes de la dreta mentre cap segment no se li solape.
    for (let c = membre.columna + 1; c < columnes.length && !columnes[c].some((altre) => solapen(membre, altre)); c++) membre.amplada++;
  }
}

/**
 * La disposició dels segments d'UN dia:
 * [{ segment, columna, columnes, amplada, fiVisualMin, cluster }], en l'ordre
 * de pintar (inici ascendent; amb el mateix inici, el més llarg primer; i la
 * clau de l'ocurrència): permutar l'entrada no canvia res.
 *   1. fiVisualMin = min(1440, max(fiMin, iniciMin + minimMinuts)).
 *   2. Un clúster es tanca quan un segment comença a partir de la fi visual
 *      més tardana del clúster (intervals semioberts: 9–10 i 10–11 no se
 *      solapen).
 *   3. Cada segment va a la primera columna on l'últim acaba abans que ell
 *      comence; si no n'hi ha cap, a una de nova. columnes = les del clúster.
 *   4. amplada = 1 + les columnes de la dreta lliures de solapament, fins a la
 *      primera ocupada. A la vista: left = columna / columnes, width =
 *      amplada / columnes.
 */
export function disposaDia(segments, { minimMinuts = 30 } = {}) {
  const ordenats = (segments ?? []).map((segment) => ({
    segment,
    fiVisualMin: Math.min(MINUTS_DIA, Math.max(segment.fiMin, segment.iniciMin + minimMinuts))
  })).sort((a, b) => a.segment.iniciMin - b.segment.iniciMin
    || (b.fiVisualMin - b.segment.iniciMin) - (a.fiVisualMin - a.segment.iniciMin)
    || compara(a.segment.ocurrencia.clau, b.segment.ocurrencia.clau));
  let cluster = -1;
  let fiCluster = -Infinity;
  let membres = [];
  let columnes = [];
  for (const entrada of ordenats) {
    if (entrada.segment.iniciMin >= fiCluster) {
      tancaCluster(membres, columnes);
      [cluster, membres, columnes] = [cluster + 1, [], []];
    }
    let columna = columnes.findIndex((col) => col[col.length - 1].fiVisualMin <= entrada.segment.iniciMin);
    if (columna < 0) columna = columnes.push([]) - 1;
    columnes[columna].push(entrada);
    Object.assign(entrada, { columna, cluster });
    membres.push(entrada);
    fiCluster = Math.max(fiCluster, entrada.fiVisualMin);
  }
  tancaCluster(membres, columnes);
  return ordenats.map(({ segment, columna, columnes: n, amplada, fiVisualMin, cluster: c }) => ({
    segment, columna, columnes: n, amplada, fiVisualMin, cluster: c
  }));
}

/**
 * Els segments d'una fila de dies ([{ clau, data }], set a la vista):
 * [{ ocurrencia, colInici, colFi, continuaAbans, continuaDespres, tipus }],
 * colFi exclusiu. tipus: 'barra' si l'acte és de tot el dia o cobrix més d'un
 * dia; 'punt' si és amb hora d'un sol dia. continuaAbans / continuaDespres: la
 * barra ve de la fila d'abans o seguix en la de després.
 */
export function segmentsDeFila(ocurrencies, dies) {
  const [primera, darrera] = [dies[0].clau, dies[dies.length - 1].clau];
  const despres = clauDeData(sumaDies(dies[dies.length - 1].data, 1));
  const segments = [];
  for (const oc of ocurrencies ?? []) {
    if (!(oc.diaInici <= darrera && oc.diaFi > primera)) continue;
    const columnes = dies.flatMap(({ clau }, i) => (ocurrenciaCobrix(oc, clau) ? [i] : []));
    const [continuaAbans, continuaDespres] = [oc.diaInici < primera, oc.diaFi > despres];
    const multiDia = columnes.length > 1 || continuaAbans || continuaDespres;
    segments.push({
      ocurrencia: oc, colInici: columnes[0], colFi: columnes[columnes.length - 1] + 1,
      continuaAbans, continuaDespres, tipus: oc.totElDia || multiDia ? 'barra' : 'punt'
    });
  }
  return segments.sort(ordenaSegmentsDeFila);
}

/**
 * L'ordre dels segments d'una fila: primer la columna d'inici; amb la mateixa,
 * el més llarg; les barres abans que els punts; l'inici; el títol
 * (localeCompare en català) i, per acabar, la clau de l'ocurrència.
 */
export function ordenaSegmentsDeFila(a, b) {
  return a.colInici - b.colInici
    || (b.colFi - b.colInici) - (a.colFi - a.colInici)
    || (a.tipus === b.tipus ? 0 : a.tipus === 'barra' ? -1 : 1)
    || a.ocurrencia.inici - b.ocurrencia.inici
    || a.ocurrencia.esd.titol.localeCompare(b.ocurrencia.esd.titol, 'ca')
    || compara(a.ocurrencia.clau, b.ocurrencia.clau);
}

/**
 * Cada segment, en l'ordre de la fila, al primer carril (fila de dalt a baix)
 * on totes les seues columnes són lliures: [{ ...segment, carril }]. Les
 * barres que no se solapen comparteixen carril; un punt només ocupa el seu dia.
 */
export function assignaCarrils(segments) {
  const ocupats = [];
  return [...(segments ?? [])].sort(ordenaSegmentsDeFila).map((segment) => {
    const lliure = (carril) => {
      for (let c = segment.colInici; c < segment.colFi; c++) if (ocupats[carril]?.has(c)) return false;
      return true;
    };
    let carril = 0;
    while (!lliure(carril)) carril++;
    ocupats[carril] ??= new Set();
    for (let c = segment.colInici; c < segment.colFi; c++) ocupats[carril].add(c);
    return { ...segment, carril };
  });
}

const cobrixColumna = (segment, c) => segment.colInici <= c && c < segment.colFi;

/**
 * El que hi cap en `maxCarrils` carrils: { peces, mes }. Un dia on algun
 * segment té carril ≥ maxCarrils desborda: hi ixen els de carril <
 * maxCarrils − 1 i l'últim carril visible diu «+N», amb N = els que hi queden
 * amagats (mes[c]). Un dia que no desborda els mostra tots. Les peces són els
 * trams de columnes on cada segment es veu ({ segment, colInici, colFi,
 * carril, continuaAbans, continuaDespres }): una barra pot partir-se.
 */
export function retallaPerCapacitat(segments, maxCarrils = Infinity, columnes = 7) {
  const llista = segments ?? [];
  const desborda = Array.from({ length: columnes }, (_, c) => llista.some((s) => cobrixColumna(s, c) && s.carril >= maxCarrils));
  const visible = (s, c) => !desborda[c] || s.carril < maxCarrils - 1;
  const mes = desborda.map((ple, c) => (ple ? llista.filter((s) => cobrixColumna(s, c) && !visible(s, c)).length : 0));
  const peces = [];
  for (const segment of llista) {
    for (let c = segment.colInici; c < segment.colFi;) {
      if (!visible(segment, c)) { c++; continue; }
      const inici = c;
      while (c < segment.colFi && visible(segment, c)) c++;
      peces.push({
        segment, colInici: inici, colFi: c, carril: segment.carril,
        continuaAbans: inici > segment.colInici || segment.continuaAbans,
        continuaDespres: c < segment.colFi || segment.continuaDespres
      });
    }
  }
  return { peces, mes };
}

/* Els esdeveniments (sense repetir) dels segments que cobrixen cada columna:
   el recompte i els títols del nom accessible del dia. */
function esdevenimentsPerColumna(segments, columnes) {
  return Array.from({ length: columnes }, (_, c) => [...new Set(segments.filter((s) => cobrixColumna(s, c)).map((s) => s.ocurrencia.esd))]);
}

/**
 * La vista Mes: una fila per setmana de la graella (periodes.js ·
 * graellaDelMes), cada una { dies, peces, mes, delDia } amb els carrils de
 * segmentsDeFila → assignaCarrils → retallaPerCapacitat. delDia: els
 * esdeveniments de cada dia, sense repetir, en l'ordre de la fila.
 */
export function disposaMes(ocurrencies, graella, { maxCarrils = 3 } = {}) {
  return graella.map((dies) => {
    const segments = assignaCarrils(segmentsDeFila(ocurrencies, dies));
    const { peces, mes } = retallaPerCapacitat(segments, maxCarrils, dies.length);
    return { dies, peces, mes, delDia: esdevenimentsPerColumna(segments, dies.length) };
  });
}

/**
 * La vista Setmana dels dies donats (periodes.js · diesDeLaSetmana):
 * { franja, perDia, delDia }. franja: { peces, mes, carrils } dels actes de
 * tot el dia (per defecte, sense límit de carrils, com Google en escriptori);
 * perDia: Map clau → disposaDia dels segments amb hora; delDia: els
 * esdeveniments de cada dia, sense repetir (franja i graella).
 */
export function disposaSetmana(ocurrencies, dies, { minimMinuts = 30, maxCarrilsFranja = Infinity } = {}) {
  const [deLaFranja, deLaGraella] = [[], []];
  for (const oc of ocurrencies ?? []) (separaFranja(oc) === 'franja' ? deLaFranja : deLaGraella).push(oc);
  const segmentsFranja = assignaCarrils(segmentsDeFila(deLaFranja, dies));
  const { peces, mes } = retallaPerCapacitat(segmentsFranja, maxCarrilsFranja, dies.length);
  const carrils = segmentsFranja.reduce((max, s) => Math.max(max, s.carril + 1), 0);
  const perDia = new Map(dies.map((dia) => [
    dia.clau, disposaDia(deLaGraella.flatMap((oc) => segmentaPerDies(oc, [dia])), { minimMinuts })
  ]));
  const delDia = dies.map(({ clau }) => [...new Set((ocurrencies ?? []).filter((oc) => ocurrenciaCobrix(oc, clau)).map((oc) => oc.esd))]);
  return { franja: { peces, mes, carrils: Math.min(carrils, maxCarrilsFranja) }, perDia, delDia };
}

/**
 * On va la línia d'«ara» a la vista Setmana: { clau, minut } si `ara` (Date o
 * ms) cau en algun dels dies donats; si no, null.
 */
export function posicioAra(ara, dies) {
  if (ara == null) return null;
  const data = ara instanceof Date ? ara : new Date(ara);
  if (Number.isNaN(data.getTime())) return null;
  const clau = clauDeData(data);
  return dies.some((dia) => dia.clau === clau) ? { clau, minut: minutDeParet(data) } : null;
}

/* Fase visual (prompt 261001_0445) · Front Setmana: el rang d'hores que es
   pinta, la forma de cada bloc segons el que fa d'alt i el dia que mostra la
   tira del mòbil. Geometria pura, com la resta del mòdul. */

/**
 * Les hores que pinta la graella de la setmana: { horaInicial, horaFinal },
 * enters i horaFinal exclusiva. De min(inici, l'hora de l'acte que comença
 * més prompte) a max(fi, l'hora en què acaba visualment el més tardà), mai
 * fora de 0–24: sense scroll intern, la matinada buida no omple la pàgina i
 * cap acte queda fora. perDia: el Map de disposaSetmana (o qualsevol llista de
 * llistes de disposaDia); si les entrades porten iniciVisualMin
 * (encaixaFinalDelDia), compta eixe inici. minuts: altres minuts de paret que
 * han de cabre (la línia d'«ara», perquè sempre es veja on som).
 */
export function rangHorari(perDia, { inici = 7, fi = 22, minuts = [] } = {}) {
  let [primer, darrer] = [Infinity, -Infinity];
  for (const disposats of perDia?.values?.() ?? []) {
    for (const { segment, iniciVisualMin, fiVisualMin } of disposats ?? []) {
      primer = Math.min(primer, iniciVisualMin ?? segment.iniciMin);
      darrer = Math.max(darrer, fiVisualMin);
    }
  }
  for (const minut of minuts) {
    if (!Number.isFinite(minut)) continue;
    primer = Math.min(primer, minut);
    darrer = Math.max(darrer, minut + 1);
  }
  const horaInicial = Math.max(0, Math.min(inici, Math.floor(primer / 60)));
  const horaFinal = Math.min(24, Math.max(fi, Math.ceil(darrer / 60)));
  return { horaInicial, horaFinal: Math.max(horaFinal, horaInicial + 1) };
}

/* El primer minut visible on caben 2, 3 i 4 línies (títol i interval), per
   densitat: vegeu formaDelBloc. */
const LLINDARS_DE_FORMA = Object.freeze({ normal: Object.freeze([50, 70, 90]), compacta: Object.freeze([54, 78, 102]) });

/**
 * La forma d'un bloc de la graella pels minuts que fa d'alt (fi visual menys
 * inici visual) i la densitat de la vista: 'curt' (una sola línia «HH:MM
 * Títol»), 'una-linia' (el títol en una línia i l'interval), 'dues-linies' i
 * 'llarg' (fins a tres línies de títol). Les tres últimes demanen 2, 3 i 4
 * línies de 14px (16,1px), i cada llindar és el primer minut on hi caben:
 *   normal (hora de 3rem: 0,8px per minut, menys 4px de separació i 4px de
 *   farciment): 0,8·m − 8 ≥ 16,1·n − 0,5 → 50, 70 i 90;
 *   compacta (hora de 2,5rem: 0,667px per minut, menys la separació i sense
 *   farciment): 0,667·m − 4 ≥ 16,1·n − 0,5 → 54, 78 i 102.
 * El mig píxel és de la part de baix de l'última línia, que sempre és
 * l'interval: les xifres, els dos punts i el guió acaben a la línia de base,
 * més de 2px per damunt. La compacta només es pinta amb ratolí (@media
 * (pointer: fine)): en tàctil, amb els seus llindars, el bloc mostra menys
 * línies de les que hi cabrien, mai més.
 */
export function formaDelBloc(minutsVisibles, { densitat } = {}) {
  const [dues, tres, quatre] = LLINDARS_DE_FORMA[densitat === 'compacta' ? 'compacta' : 'normal'];
  if (!(minutsVisibles >= dues)) return 'curt';
  if (minutsVisibles < tres) return 'una-linia';
  return minutsVisibles < quatre ? 'dues-linies' : 'llarg';
}

/**
 * Els actes del final del dia, encaixats: la disposició d'UN dia (disposaDia)
 * amb iniciVisualMin a cada entrada. Un segment que comença tan tard que la
 * seua alçada mínima passaria de la mitjanit (iniciMin > 1440 − minimMinuts)
 * es pinta des de 1440 − minimMinuts; si no, un acte sense fi a les 23:56
 * faria 4 minuts d'alt, menys que la separació, i no es veuria. Els
 * solapaments es tornen a calcular amb l'inici visual. segment continua sent
 * l'original, i l'hora que es llig, la real (ocurrencia.inici). Si cap segment
 * no s'ha de moure, la geometria és la de disposaDia.
 */
export function encaixaFinalDelDia(disposats, { minimMinuts = 30 } = {}) {
  const llista = disposats ?? [];
  const sostre = Math.max(0, MINUTS_DIA - minimMinuts);
  if (!llista.some(({ segment }) => segment.iniciMin > sostre)) {
    return llista.map((disposat) => ({ ...disposat, iniciVisualMin: disposat.segment.iniciMin }));
  }
  const original = new Map();
  const visibles = llista.map(({ segment }) => {
    const visible = segment.iniciMin > sostre ? { ...segment, iniciMin: sostre } : segment;
    original.set(visible, segment);
    return visible;
  });
  return disposaDia(visibles, { minimMinuts }).map((disposat) => ({
    ...disposat, segment: original.get(disposat.segment), iniciVisualMin: disposat.segment.iniciMin
  }));
}

/**
 * El dia que pinta la tira del mòbil (un sol dia de la setmana): la clau del
 * dia triat si és d'esta setmana; si no, la de hui si hi cau; si no, la del
 * primer dia (el dilluns).
 */
export function diaDeLaTira(dies, diaTriat, hui) {
  const claus = (dies ?? []).map((dia) => dia.clau);
  if (claus.includes(diaTriat)) return diaTriat;
  return claus.includes(hui) ? hui : (claus[0] ?? null);
}
