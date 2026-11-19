/** IDEA-284 · Intervals [inici, fi), ordenació O(n log n), sense llistes
 * quadràtiques de parelles. Les dates de paret de Madrid exigeixen offset
 * explícit i coherent amb IANA; Z i enters són instants absoluts.
 */
const madrid = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit',
  day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
function enter(v, camp, minim = 0) {
  if (!Number.isSafeInteger(v) || v < minim) throw new TypeError(`${camp}: enter segur >= ${minim}`);
  return v;
}
function id(v) {
  if (typeof v !== 'string' || !v || v.length > 160 || v !== v.normalize('NFC') || /[\p{Cc}\p{Cf}\p{Cs}]/u.test(v)) throw new TypeError('ID no canònic');
  return v;
}

export function instantMadrid(v) {
  if (typeof v === 'number') {
    if (!Number.isSafeInteger(v) || Math.abs(v) > 8_640_000_000_000_000) throw new TypeError('Instant invàlid');
    return v;
  }
  if (typeof v !== 'string' || v.length > 32) throw new TypeError('Data no acotada');
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|\+01:00|\+02:00)$/.exec(v);
  if (!m) throw new TypeError('Cal ISO 8601 amb Z o offset explícit de Madrid');
  const [any, mes, dia, hora, minut, segon] = m.slice(1, 7).map(Number);
  if (any < 1970 || mes < 1 || mes > 12 || dia < 1 || dia > 31 || hora > 23 || minut > 59 || segon > 59) throw new TypeError('Data inexistent');
  const paret = Date.UTC(any, mes - 1, dia, hora, minut, segon, Number((m[7] || '').padEnd(3, '0')));
  const dataParet = new Date(paret);
  if (dataParet.getUTCFullYear() !== any || dataParet.getUTCMonth() !== mes - 1 || dataParet.getUTCDate() !== dia) throw new TypeError('Data inexistent');
  const instant = paret - (m[8] === 'Z' ? 0 : m[8] === '+01:00' ? 3_600_000 : 7_200_000);
  if (m[8] !== 'Z') {
    const parts = Object.fromEntries(madrid.formatToParts(instant).map(p => [p.type, p.value]));
    if (Number(parts.year) !== any || Number(parts.month) !== mes || Number(parts.day) !== dia || Number(parts.hour) !== hora
      || Number(parts.minute) !== minut || Number(parts.second) !== segon) throw new TypeError('Hora inexistent o offset contrari a Europe/Madrid');
  }
  return instant;
}

export function disponibilitatSenseSolapament(intervals, { capacitat = 1 } = {}) {
  enter(capacitat, 'capacitat', 1);
  if (!Array.isArray(intervals) || intervals.length > 100_000) throw new TypeError('Intervals no acotats');
  const ids = new Set(), events = [];
  for (const interval of intervals) {
    if (!interval || typeof interval !== 'object') throw new TypeError('Interval invàlid');
    const clau = id(interval.id);
    if (ids.has(clau)) throw new TypeError('ID d’interval duplicat');
    ids.add(clau);
    const inici = instantMadrid(interval.inici), fi = instantMadrid(interval.fi);
    const places = enter(interval.places === undefined ? 1 : interval.places, 'places', 1);
    if (fi <= inici) throw new RangeError('fi ha de ser posterior a inici');
    events.push([inici, places], [fi, -places]);
  }
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let ocupacio = 0, maxOcupacio = 0, anterior = null;
  const conflictes = [];
  for (let i = 0; i < events.length;) {
    const moment = events[i][0];
    if (anterior !== null && moment > anterior && ocupacio > capacitat) {
      const ultim = conflictes.at(-1);
      if (ultim && ultim.fi === anterior && ultim.ocupacio === ocupacio) ultim.fi = moment;
      else conflictes.push({ inici: anterior, fi: moment, ocupacio, capacitat });
    }
    while (i < events.length && events[i][0] === moment) {
      ocupacio += events[i++][1];
      if (!Number.isSafeInteger(ocupacio)) throw new RangeError('Ocupació fora de rang');
    }
    maxOcupacio = Math.max(maxOcupacio, ocupacio);
    anterior = moment;
  }
  return { disponible: conflictes.length === 0, maxOcupacio, conflictes };
}

/** FIFO estricte de grups sencers: un grup que no cap encapçala l'espera;
 * cap grup posterior el pot avançar. Empats per ID en ordre de codi Unicode.
 * Només una inscripció activa per persona; la capacitat és una entrada del
 * servidor. La persistència necessita reserva atòmica al backend.
 */
export function assignaPlacesRsvp({ capacitat, inscripcions }) {
  enter(capacitat, 'capacitat');
  if (!Array.isArray(inscripcions) || inscripcions.length > 100_000) throw new TypeError('Inscripcions no acotades');
  const ids = new Set(), persones = new Set(), actives = [];
  for (const entrada of inscripcions) {
    if (!entrada || typeof entrada !== 'object') throw new TypeError('Inscripció invàlida');
    const clau = id(entrada.id), personaId = id(entrada.personaId);
    if (ids.has(clau)) throw new TypeError('ID d’inscripció duplicat');
    ids.add(clau);
    if (!['activa', 'cancel_lada'].includes(entrada.estat)) throw new TypeError('Estat d’inscripció desconegut');
    const places = enter(entrada.places === undefined ? 1 : entrada.places, 'places', 1);
    const creada = instantMadrid(entrada.creada);
    if (entrada.estat === 'cancel_lada') continue;
    if (persones.has(personaId)) throw new TypeError('Persona amb més d’una inscripció activa');
    persones.add(personaId);
    actives.push({ id: clau, personaId, places, creada });
  }
  actives.sort((a, b) => a.creada - b.creada || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const confirmades = [], espera = [];
  let lliures = capacitat;
  for (const entrada of actives) {
    if (!espera.length && entrada.places <= lliures) { confirmades.push(entrada); lliures -= entrada.places; }
    else espera.push(entrada);
  }
  return { confirmades, espera, placesOcupades: capacitat - lliures, placesLliures: lliures };
}
