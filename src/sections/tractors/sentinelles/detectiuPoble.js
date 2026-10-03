/**
 * detectiuPoble.js — Sentinella 7 · Detectiu del Poble.
 *
 * En obrir el Tauler, llig els missatges de la bústia i de la Pàgina
 * Universal que tria la persona i en troba els punts de dolor recurrents:
 * temes per freqüència de paraules clau en valencià i en castellà, comptats
 * per missatge (una queixa que repetix «fanal» tres vegades compta una).
 * Abans de comptar res, amaga correus, telèfons, DNI, NIE i IBAN; l'informe
 * només porta xifres i paraules soltes, mai cap text original. Tampoc l'origen:
 * es reduïx a una llista tancada (bústia, Pàgina Universal, altres orígens o
 * sense origen), perquè un nom de fitxer o un camp «origen» pot portar el nom
 * o el correu d'una persona veïna. L0.
 */
import { avis, contingutDe, esObjecte, extensioDe, fitxersTriats, llegixJson, nomDe, percentDe, senseAccents, textDe, textPle } from './comu.js';
import { FONTS_COMUNES, definixSentinella } from './contracte.js';

const LLINDARS = Object.freeze({ recurrencia: 3, proporcioRoja: 0.25, minimRoja: 5, llargariaParaula: 5, maxParaules: 8 });

/* L'ordre importa: l'IBAN abans que el DNI i el telèfon, que en són trossos. */
const PATRONS_PERSONALS = Object.freeze([
  ['correu', /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g, '[correu]'],
  ['iban', /\b[A-Za-z]{2}\d{2}(?:[ -]?[A-Za-z0-9]{4}){3,7}(?:[ -]?[A-Za-z0-9]{1,4})?\b/g, '[IBAN]'],
  ['nie', /\b[XYZxyz][ -]?\d{7}[ -]?[A-Za-z]\b/g, '[NIE]'],
  ['dni', /\b\d{8}[ -]?[A-Za-z]\b/g, '[DNI]'],
  ['telefon', /(?:\+|\b00)\d{2}[ .-]?\d(?:[ .-]?\d){7,10}\b|\b[6-9](?:[ .-]?\d){8}\b/g, '[telèfon]']
]);
const XIFRES_MINIMES_IBAN = 10;
/* Com es diu cada tipus de dada amagada a l'avís: [singular, plural]. */
const ETIQUETES_PERSONALS = Object.freeze({
  correu: ['correu', 'correus'], iban: ['IBAN', 'IBAN'], nie: ['NIE', 'NIE'], dni: ['DNI', 'DNI'], telefon: ['telèfon', 'telèfons']
});
/* Els orígens que pot dir l'informe, en este ordre. Cap altre text de l'origen hi arriba. */
const ORIGENS = Object.freeze(['bústia', 'Pàgina Universal', 'altres orígens', 'sense origen']);

/* La categoria tancada d'un origen: mai en copia el text. */
function categoriaOrigen(origen) {
  if (!textPle(origen)) return 'sense origen';
  const net = senseAccents(origen);
  if (/bustia|buzon/.test(net)) return 'bústia';
  if (/pagina[\s_.-]*universal/.test(net)) return 'Pàgina Universal';
  return 'altres orígens';
}

/* Les paraules d'un text, amb la seua forma: { clau (minúscules i sense accents), majuscula }. */
const formesDe = (text) => [...text.matchAll(/[\p{L}\p{M}]+/gu)].map(([p]) => ({ clau: senseAccents(p), majuscula: /^\p{Lu}/u.test(p) }));

export const TEMES = Object.freeze([
  { id: 'aigua', nom: 'Aigua', claus: ['aigua', 'agua', 'aixeta', 'grifo', 'canonada', 'tuberia', 'fuita', 'fuga', 'pressio', 'presion', 'potable'] },
  { id: 'enllumenat', nom: 'Enllumenat', claus: ['fanal', 'farola', 'enllumenat', 'alumbrado', 'llum', 'luz', 'fosc', 'oscur'] },
  { id: 'fems', nom: 'Fems i reciclatge', claus: ['fem', 'fems', 'brossa', 'basura', 'contenidor', 'contenedor', 'reciclatge', 'reciclaje', 'residu', 'deixalleria'] },
  { id: 'carrers', nom: 'Carrers i voreres', claus: ['clot', 'bache', 'sot', 'vorera', 'acera', 'asfalt', 'paviment', 'pavimento', 'carrer', 'calle'] },
  { id: 'transport', nom: 'Transport', claus: ['autobus', 'bus', 'parada', 'horari', 'horario', 'transport', 'taxi'] },
  { id: 'salut', nom: 'Salut i consultori', claus: ['metge', 'medic', 'consultori', 'consultorio', 'farmacia', 'infermer', 'enfermer', 'ambulancia'] },
  { id: 'connexio', nom: 'Internet i cobertura', claus: ['internet', 'cobertura', 'fibra', 'wifi', 'connexio', 'conexion', 'senyal'] },
  { id: 'soroll', nom: 'Soroll i molèsties', claus: ['soroll', 'ruido', 'molest'] },
  { id: 'animals', nom: 'Animals', claus: ['gos', 'gossos', 'perro', 'gat', 'gato', 'excrement', 'plaga', 'rata', 'mosquit'] },
  { id: 'neteja', nom: 'Neteja', claus: ['neteja', 'limpieza', 'brut', 'sucio', 'pintada', 'grafiti'] },
  { id: 'aparcament', nom: 'Aparcament i trànsit', claus: ['aparca', 'cotxe', 'coche', 'transit', 'trafico', 'velocitat', 'velocidad'] }
].map((t) => Object.freeze({ ...t, claus: Object.freeze(t.claus) })));

const BUIDES = new Set([
  'aquest', 'aquesta', 'aquests', 'aquestes', 'perque', 'tambe', 'sempre', 'encara', 'despres', 'abans', 'nosaltres', 'tenim', 'tenen',
  'estem', 'estan', 'poble', 'pueblo', 'porque', 'tambien', 'siempre', 'cuando', 'nosotros', 'tenemos', 'tienen', 'estamos', 'estan',
  'gracies', 'gracias', 'favor', 'senyor', 'senyora', 'senor', 'senora', 'molts', 'moltes', 'mucho', 'mucha', 'muchos', 'muchas',
  'todos', 'todas', 'desde', 'hasta', 'sobre', 'entre', 'despues', 'antes', 'altre', 'altra', 'altres', 'otros', 'otras', 'todavia',
  'ningu', 'nadie', 'alguna', 'algun', 'alguns', 'algunes', 'algunos', 'algunas', 'quina', 'quins', 'quines', 'cuales', 'donde',
  'correu', 'telefon', 'hauria', 'deberia', 'podria', 'podeu', 'pueden', 'fa', 'hace', 'dies', 'semanas', 'setmanes', 'mesos', 'meses'
]);

const comptesBuits = () => Object.fromEntries(PATRONS_PERSONALS.map(([tipus]) => [tipus, 0]));

/**
 * Amaga correus, telèfons, DNI, NIE i IBAN d'un text.
 * @param {string} text
 * @returns {{ text: string, comptes: Record<string, number> }}
 */
export function anonimitza(text) {
  const comptes = comptesBuits();
  let net = String(text ?? '');
  for (const [tipus, patro, marca] of PATRONS_PERSONALS) {
    net = net.replace(patro, (trobat) => {
      if (tipus === 'iban' && (trobat.match(/\d/g) ?? []).length < XIFRES_MINIMES_IBAN) return trobat;
      comptes[tipus] += 1;
      return marca;
    });
  }
  return { text: net, comptes };
}

const paraulesDe = (text) => senseAccents(text).replace(/\[[^\]]*\]/g, ' ').split(/[^a-z0-9]+/).filter(Boolean);
const casa = (paraula, clau) => (clau.length >= 4 ? paraula.startsWith(clau) : paraula === clau);
const CLAUS_DE_TEMES = TEMES.flatMap((t) => t.claus);

/**
 * @param {{ missatges: Array<{ text: string, origen?: string }> }} entrada
 */
export function observaDetectiu(entrada) {
  const avisos = [];
  const missatges = (esObjecte(entrada) && Array.isArray(entrada.missatges) ? entrada.missatges : [])
    .filter((m) => esObjecte(m) && textPle(m.text));
  if (!missatges.length) {
    avisos.push(avis('DET-SENSE-MISSATGES', 'info', 'No hi ha cap missatge per llegir.', 'entrada'));
    return { avisos, informe: 'Cap missatge: res a comptar.' };
  }

  const amagades = comptesBuits();
  const perTema = new Map(TEMES.map((t) => [t.id, 0]));
  const perParaula = new Map();
  const perOrigen = new Map();
  /* Noms propis, que no es compten mai: una paraula en majúscula enmig d'una
     frase, i tota paraula que en el lot només apareix en majúscula (a l'inici
     d'un missatge o darrere d'un tractament com «Sra.»). */
  const nomsPropis = new Set();
  const enMajuscula = new Set();
  const enMinuscula = new Set();
  for (const m of missatges) {
    const { text, comptes } = anonimitza(m.text);
    for (const [tipus, n] of Object.entries(comptes)) amagades[tipus] += n;
    for (const [, nom] of text.matchAll(/[^.!?¡¿\s](?=\s+(\p{Lu}\p{L}+))/gu)) nomsPropis.add(senseAccents(nom));
    for (const { clau, majuscula } of formesDe(text.replace(/\[[^\]]*\]/g, ' '))) (majuscula ? enMajuscula : enMinuscula).add(clau);
    const origen = categoriaOrigen(m.origen);
    perOrigen.set(origen, (perOrigen.get(origen) ?? 0) + 1);
    const paraules = new Set(paraulesDe(text));
    for (const tema of TEMES) {
      if ([...paraules].some((p) => tema.claus.some((c) => casa(p, c)))) perTema.set(tema.id, perTema.get(tema.id) + 1);
    }
    for (const p of paraules) {
      if (p.length < LLINDARS.llargariaParaula || /^\d+$/.test(p) || BUIDES.has(p) || CLAUS_DE_TEMES.some((c) => casa(p, c))) continue;
      perParaula.set(p, (perParaula.get(p) ?? 0) + 1);
    }
  }

  for (const clau of enMajuscula) if (!enMinuscula.has(clau)) nomsPropis.add(clau);
  for (const nom of nomsPropis) perParaula.delete(nom);
  const total = missatges.length;
  const recurrents = TEMES.map((t) => ({ ...t, n: perTema.get(t.id) })).filter((t) => t.n > 0).sort((a, b) => b.n - a.n);
  for (const t of recurrents.filter((x) => x.n >= LLINDARS.recurrencia)) {
    const roja = t.n >= LLINDARS.minimRoja && t.n / total >= LLINDARS.proporcioRoja;
    avisos.push(avis('DET-RECURRENT', roja ? 'roja' : 'groga', `${t.nom}: ${t.n} de ${total} missatges (${percentDe(t.n / total)}) en parlen.`, `tema:${t.id}`));
  }
  const paraules = [...perParaula.entries()].filter(([, n]) => n >= LLINDARS.recurrencia).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1))
    .slice(0, LLINDARS.maxParaules);
  if (paraules.length) {
    avisos.push(avis('DET-PARAULES', 'info', `Paraules que es repetixen fora dels temes coneguts: ${paraules.map(([p, n]) => `${p} (${n})`).join(', ')}.`, 'paraules'));
  }
  const nAmagades = Object.values(amagades).reduce((s, n) => s + n, 0);
  if (nAmagades) {
    const detall = Object.entries(amagades).filter(([, n]) => n > 0).map(([tipus, n]) => `${n} ${ETIQUETES_PERSONALS[tipus][n === 1 ? 0 : 1]}`).join(', ');
    avisos.push(avis('DET-ANONIMITZAT', 'info', `S’han amagat ${nAmagades} dades personals abans de comptar (${detall}).`, 'anonimitzacio'));
  }

  const informe = [
    `${total} missatges llegits (${ORIGENS.filter((o) => perOrigen.has(o)).map((o) => `${o}: ${perOrigen.get(o)}`).join(', ')}).`,
    'Temes per nombre de missatges:',
    ...(recurrents.length ? recurrents.map((t) => `- ${t.nom}: ${t.n} (${percentDe(t.n / total)})`) : ['- Cap tema conegut.']),
    '',
    'Cap text original ix d’este informe: només xifres i paraules soltes, després d’amagar les dades personals.'
  ];
  return { avisos, informe: informe.join('\n') };
}

/* Un JSON (llista de textos o d'objectes amb text, i l'origen) o un text: un missatge per paràgraf. */
function missatgesDe(fitxer) {
  if (extensioDe(fitxer.nom) === 'json') {
    const dades = llegixJson(fitxer);
    const llista = Array.isArray(dades) ? dades : Array.isArray(dades?.missatges) ? dades.missatges : [];
    return llista.map((m) => (typeof m === 'string' ? { text: m, origen: nomDe(fitxer) }
      : esObjecte(m) ? { text: String(m.text ?? m.missatge ?? m.cos ?? ''), origen: String(m.origen ?? nomDe(fitxer)) } : null)).filter(Boolean);
  }
  const text = textDe(contingutDe(fitxer)).replace(/\r\n?/g, '\n');
  const trossos = /\n\s*\n/.test(text) ? text.split(/\n\s*\n/) : text.split('\n');
  return trossos.map((t) => t.trim()).filter(Boolean).map((t) => ({ text: t, origen: nomDe(fitxer) }));
}

const preparaDetectiu = (fitxers) => ({ missatges: fitxersTriats(fitxers).flatMap(missatgesDe) });

export const SENTINELLA_DETECTIU = definixSentinella({
  id: 'sentinella.detectiu-poble',
  nom: 'Sentinella Detectiu del Poble',
  versio: '1.0.0',
  descripcio: 'Llig els missatges de la bústia i de la Pàgina Universal que tries, amaga les dades personals i troba els punts de dolor recurrents per freqüència de paraules clau, en valencià i en castellà.',
  disparador: [
    { tipus: 'obrir-tauler', detall: 'En obrir el Tauler d’Inici, amb els missatges exportats de la bústia i de la Pàgina Universal.' }
  ],
  llig: ['Els missatges que tries (JSON o text): bústia i Pàgina Universal'],
  escriu: ['Res: només mostra xifres per tema i paraules soltes, sense cap text original'],
  xarxa: 'cap',
  dadesPersonals: true,
  nivell: 'L0',
  eixida: ['bandera', 'informe'],
  superficie: { tipus: 'tauler-inici' },
  portaHumana: 'Assenyala els temes que es repetixen; respondre al veïnat o publicar-ne res ho decidix i ho fa la persona.',
  proves: ['src/sections/tractors/sentinelles/detectiuPoble.test.js'],
  llindars: { ...LLINDARS },
  fitxa: 'src/sections/tractors/sentinelles/fitxes/sentinella_detectiu_poble.md',
  fonts: [...FONTS_COMUNES, 'src/sections/tractors/sentinelles/detectiuPoble.js'],
  entrada: {
    etiqueta: 'Missatges de la bústia i de la Pàgina Universal (JSON o text)',
    ajuda: 'En un text, cada paràgraf és un missatge. Les dades personals s’amaguen abans de comptar.',
    accepta: '.json,.txt,application/json,text/plain',
    multiple: true,
    prepara: preparaDetectiu
  },
  observa: observaDetectiu
});
