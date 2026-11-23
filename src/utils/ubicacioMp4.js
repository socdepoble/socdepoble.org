/**
 * ubicacioMp4.js — v1.2.23 · IDEA-331 (ordre del Mestre 261123) · Gauntlet R1 del carril A (P2, vídeo recomprimit).
 *
 * Al xat, el contingut conserva per defecte el lloc DINS del fitxer. Quan el navegador recomprimix un vídeo
 * (MediaRecorder: Chrome, Android i l'app Capacitor; compressioVideoClient.js), el contenidor nou no porta el lloc de
 * l'original. Ací es torna a escriure el rescatat abans de comprimir (ubicacioMitjans.js) en un `moov/udta/©xyz`, el
 * format de QuickTime que escriuen l'iPhone i Android (ISO 6709: «+DD.DDDD-DDD.DDDD+AAA.A/», amb la longitud de la
 * cadena i l'idioma davant).
 *
 * Fer créixer el moov desplaça el que ve darrere. Es corregixen els desplaçaments absoluts que el format permet: les
 * entrades de stco i co64 (taules de mostres), el base_data_offset dels tfhd (fragments) i el moof_offset dels tfra
 * del mfra (l'índex d'accés aleatori que escriu Chromium). Una caixa de primer nivell que no és ftyp, moov, moof, mdat,
 * mfra, free, skip o wide, o una caixa del moov amb desplaçaments que no es corregixen o amb un lloc que no és el
 * nostre (meta, iloc, saio, cmov, loci, uuid, ©xyz), deixa el vídeo com estava: torna null i l'avís diu que només el
 * mapa porta el lloc. WebM no té cap lloc estàndard: també null.
 *
 * Abans de tornar-lo, el resultat es comprova: cada desplaçament apunta on apuntava (un moof, unes mostres de l'mdat),
 * l'inspector hi llig el mateix lloc i el netejador el sap llevar («Amaga el lloc»). Només es lligen capçaleres, el
 * moov, els moof i el mfra: les mostres passen com a trossos del Blob original, sense copiar-les. Mai llança, llevat
 * de l'AbortError.
 */
import { inspeccionaUbicacioMitja, senseUbicacioVideo } from './ubicacioMitjans.js';

const LIMITS = Object.freeze({ caixes: 20_000, bytes: 8_000_000, moov: 4_000_000, profunditat: 8 });
const PRIMER_NIVELL = new Set(['ftyp', 'moov', 'moof', 'mdat', 'mfra', 'free', 'skip', 'wide']);
const CONTENIDORS = new Set(['trak', 'mdia', 'minf', 'stbl', 'edts', 'dinf', 'mvex', 'udta']);
const VETADES = new Set(['meta', 'iloc', 'saio', 'cmov', 'loci', 'uuid', '©xyz']);
const TIPUS_XYZ = Uint8Array.of(0xa9, 0x78, 0x79, 0x7a); // «©xyz»
const TIPUS_UDTA = Uint8Array.of(0x75, 0x64, 0x74, 0x61); // «udta»
const IDIOMA = 0x15c7; // «eng» empaquetat (ISO 639-2/T), el que escriuen l'iPhone i Android
const MARGE = 1e-7;
const MAX_U32 = 0xffffffff;

const abortat = () => new DOMException('Operació cancel·lada.', 'AbortError');
class NoInjectable extends Error {}
const no = () => { throw new NoInjectable('contenidor-no-injectable'); };
const vista = (b) => new DataView(b.buffer, b.byteOffset, b.byteLength);
const tipus = (b, p) => String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]);
const buit = (n) => n === null || n === undefined;
const mateix = (a, b, marge = MARGE) => (buit(a) || buit(b) ? buit(a) && buit(b) : Math.abs(a - b) <= marge);

function bytesDe(blob) {
  if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(reader.error); reader.readAsArrayBuffer(blob);
  });
}

function lector(fitxer, signal) {
  let llegits = 0;
  return async (pos, n) => {
    if (signal?.aborted) throw abortat();
    if (!Number.isSafeInteger(pos) || !Number.isSafeInteger(n) || pos < 0 || n < 0 || pos + n > fitxer.size) no();
    llegits += n;
    if (llegits > LIMITS.bytes) no();
    const b = new Uint8Array(await bytesDe(fitxer.slice(pos, pos + n)));
    if (signal?.aborted) throw abortat();
    if (b.length !== n) no();
    return b;
  };
}

/* Les caixes de [inici, fi) d'uns bytes ja llegits. Dins d'una caixa, la mida 0 («fins al final») no s'admet. */
function caixes(b, inici, fi) {
  const v = vista(b), resultat = [];
  for (let p = inici; p < fi;) {
    if (fi - p < 8) no();
    let mida = v.getUint32(p), cap = 8;
    if (mida === 1) {
      if (fi - p < 16) no();
      const gran = v.getBigUint64(p + 8);
      if (gran > BigInt(Number.MAX_SAFE_INTEGER)) no();
      mida = Number(gran); cap = 16;
    }
    if (mida < cap || mida > fi - p) no();
    resultat.push({ inici: p, dades: p + cap, fi: p + mida, cap, tipus: tipus(b, p + 4) });
    if (resultat.length > LIMITS.caixes) no();
    p += mida;
  }
  return resultat;
}

async function primerNivell(fitxer, llig) {
  const resultat = [];
  for (let p = 0; p < fitxer.size;) {
    if (fitxer.size - p < 8) no();
    const cap = await llig(p, Math.min(16, fitxer.size - p)), v = vista(cap);
    const declarada = v.getUint32(0);
    let mida = declarada, h = 8;
    if (declarada === 1) {
      if (cap.length < 16) no();
      const gran = v.getBigUint64(8);
      if (gran > BigInt(Number.MAX_SAFE_INTEGER)) no();
      mida = Number(gran); h = 16;
    } else if (declarada === 0) mida = fitxer.size - p;
    if (mida < h || mida > fitxer.size - p) no();
    const t = tipus(cap, 4);
    if (!PRIMER_NIVELL.has(t)) no();
    resultat.push({ inici: p, dades: p + h, fi: p + mida, cap: h, tipus: t, finsAlFinal: declarada === 0 });
    if (resultat.length > LIMITS.caixes) no();
    p += mida;
  }
  return resultat;
}

const valor = (b, pos, ample) => {
  const v = vista(b);
  if (ample === 4) return v.getUint32(pos);
  const gran = v.getBigUint64(pos);
  if (gran > BigInt(Number.MAX_SAFE_INTEGER)) no();
  return Number(gran);
};
const escriu = (b, pos, ample, n) => {
  if (ample === 4) { if (n > MAX_U32) no(); vista(b).setUint32(pos, n); } else vista(b).setBigUint64(pos, BigInt(n));
};

/* L'estructura i cada desplaçament absolut: { caixa (de primer nivell), pos (dins dels seus bytes), ample, mena }.
   mena: 'mostres' (stco/co64, dins d'unes mostres d'mdat), 'base' (tfhd, dins d'un moof o d'un mdat) o 'moof'
   (tfra, l'inici d'un moof). */
async function analitza(fitxer, llig, { ambXyz = false } = {}) {
  const top = await primerNivell(fitxer, llig);
  const moovs = top.filter((c) => c.tipus === 'moov');
  if (top[0]?.tipus !== 'ftyp' || moovs.length !== 1 || top.filter((c) => c.tipus === 'mfra').length > 1) no();
  const moov = moovs[0];
  if (moov.finsAlFinal || moov.fi - moov.inici > LIMITS.moov) no();
  const bytesMoov = await llig(moov.inici, moov.fi - moov.inici);
  const desplacaments = [];
  let udta = null, xyz = 0;
  const recorre = (filles, profunditat, pare) => {
    if (profunditat > LIMITS.profunditat) no();
    for (const c of filles) {
      if (c.tipus === '©xyz' && ambXyz && pare === 'udta-moov') { xyz += 1; continue; }
      if (VETADES.has(c.tipus)) no();
      if (c.tipus === 'stco' || c.tipus === 'co64') {
        const ample = c.tipus === 'stco' ? 4 : 8;
        if (c.fi - c.dades < 8) no();
        const n = vista(bytesMoov).getUint32(c.dades + 4);
        if (n > LIMITS.caixes * 100 || c.dades + 8 + n * ample !== c.fi) no();
        for (let i = 0; i < n; i += 1) desplacaments.push({ caixa: moov, pos: c.dades + 8 + i * ample, ample, mena: 'mostres' });
      } else if (CONTENIDORS.has(c.tipus)) {
        const directa = c.tipus === 'udta' && pare === 'moov';
        if (directa) { if (udta) no(); udta = c; }
        recorre(caixes(bytesMoov, c.dades, c.fi), profunditat + 1, directa ? 'udta-moov' : c.tipus);
      }
    }
  };
  recorre(caixes(bytesMoov, moov.cap, bytesMoov.length), 0, 'moov');
  if (ambXyz && xyz !== 1) no();
  const peces = new Map();
  for (const c of top) {
    if (c.tipus !== 'moof' && c.tipus !== 'mfra') continue;
    if (c.finsAlFinal) no();
    const b = await llig(c.inici, c.fi - c.inici);
    peces.set(c, b);
    const v = vista(b);
    if (c.tipus === 'moof') {
      for (const traf of caixes(b, c.cap, b.length).filter((x) => x.tipus === 'traf')) {
        for (const tfhd of caixes(b, traf.dades, traf.fi).filter((x) => x.tipus === 'tfhd')) {
          if (tfhd.fi - tfhd.dades < 8) no();
          if (v.getUint32(tfhd.dades) & 0x000001) {
            if (tfhd.fi - tfhd.dades < 16) no();
            desplacaments.push({ caixa: c, pos: tfhd.dades + 8, ample: 8, mena: 'base' });
          }
        }
      }
    } else {
      for (const f of caixes(b, c.cap, b.length)) {
        if (f.tipus === 'mfro') continue;
        if (f.tipus !== 'tfra' || f.fi - f.dades < 16 || b[f.dades] > 1) no();
        const ample = b[f.dades] === 1 ? 8 : 4;
        const mides = v.getUint32(f.dades + 8), n = v.getUint32(f.dades + 12);
        const pas = 2 * ample + ((mides >> 4) & 3) + ((mides >> 2) & 3) + (mides & 3) + 3;
        if (n > LIMITS.caixes || f.dades + 16 + n * pas !== f.fi) no();
        for (let i = 0; i < n; i += 1) desplacaments.push({ caixa: c, pos: f.dades + 16 + i * pas + ample, ample, mena: 'moof' });
      }
    }
  }
  const bytesDe2 = (caixa) => (caixa === moov ? bytesMoov : peces.get(caixa));
  const valors = desplacaments.map((d) => valor(bytesDe2(d.caixa), d.pos, d.ample));
  // Cada desplaçament ha d'apuntar on diu el seu tipus: si no s'entén, no es toca.
  const moofs = new Set(top.filter((c) => c.tipus === 'moof').map((c) => c.inici));
  const dins = (n, tipusCaixa, camp) => top.some((c) => tipusCaixa.includes(c.tipus) && n >= c[camp] && n < c.fi);
  desplacaments.forEach((d, i) => {
    const n = valors[i];
    if (d.mena === 'moof' ? !moofs.has(n) : d.mena === 'base' ? !dins(n, ['moof', 'mdat'], 'inici') : !dins(n, ['mdat'], 'dades')) no();
  });
  return { top, moov, bytesMoov, udta, peces, desplacaments, valors };
}

/* ISO 6709 amb set decimals com a molt, sense zeros sobrers: «+38.5919-000.4184+456.7/». */
const xifra = (n, enters) => {
  const [e, d] = Math.abs(n).toFixed(7).replace(/\.?0+$/, '').split('.');
  return `${n < 0 ? '-' : '+'}${e.padStart(enters, '0')}${d ? `.${d}` : ''}`;
};
export function iso6709(coordenades) {
  const lat = coordenades?.lat, lng = coordenades?.lng, altitud = coordenades?.altitud;
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return `${xifra(lat, 2)}${xifra(lng, 3)}${Number.isFinite(altitud) ? xifra(altitud, 1) : ''}/`;
}
const caixa = (tipusBytes, cos) => {
  const b = new Uint8Array(8 + cos.length);
  vista(b).setUint32(0, b.length); b.set(tipusBytes, 4); b.set(cos, 8);
  return b;
};
function caixaXyz(coordenades) {
  const text = iso6709(coordenades);
  if (!text) no();
  const cos = new Uint8Array(4 + text.length);
  vista(cos).setUint16(0, text.length); vista(cos).setUint16(2, IDIOMA);
  for (let i = 0; i < text.length; i += 1) cos[4 + i] = text.charCodeAt(i);
  return caixa(TIPUS_XYZ, cos);
}
const novaMida = (b, cap, mida) => { if (cap === 16) vista(b).setBigUint64(8, BigInt(mida)); else escriu(b, 0, 4, mida); };

/**
 * El mateix MP4/MOV amb `moov/udta/©xyz` de `coordenades` ({ lat, lng, altitud? }), o null si no es pot fer amb
 * garanties. Torna { fitxer, lloc: { lat, lng } }: `lloc` és el que l'inspector hi llig. `maximBytes`, el sostre del
 * fitxer resultant.
 */
export async function ambUbicacioMp4(fitxer, coordenades, { signal, maximBytes = Infinity } = {}) {
  try {
    if (signal?.aborted) throw abortat();
    if (!(fitxer instanceof Blob) || !/^video\/(mp4|quicktime)$/.test(fitxer.type) || !iso6709(coordenades)) return null;
    const est = await analitza(fitxer, lector(fitxer, signal));
    const xyz = caixaXyz(coordenades);
    const insercio = est.udta ? xyz : caixa(TIPUS_UDTA, xyz);
    const puntRel = est.udta ? est.udta.fi : est.bytesMoov.length;
    const punt = est.moov.inici + puntRel;
    const delta = insercio.length;
    if (fitxer.size + delta > maximBytes) return null;
    const desplaca = (n) => (n >= punt ? n + delta : n);

    const moov = new Uint8Array(est.bytesMoov.length + delta);
    moov.set(est.bytesMoov.subarray(0, puntRel), 0);
    moov.set(insercio, puntRel);
    moov.set(est.bytesMoov.subarray(puntRel), puntRel + delta);
    novaMida(moov, est.moov.cap, moov.length);
    if (est.udta) novaMida(moov.subarray(est.udta.inici), est.udta.cap, est.udta.fi - est.udta.inici + delta);
    const substituts = new Map([[est.moov, moov]]);
    est.desplacaments.forEach((d, i) => {
      if (d.caixa === est.moov) { escriu(moov, d.pos >= puntRel ? d.pos + delta : d.pos, d.ample, desplaca(est.valors[i])); return; }
      if (!substituts.has(d.caixa)) substituts.set(d.caixa, new Uint8Array(est.peces.get(d.caixa)));
      escriu(substituts.get(d.caixa), d.pos, d.ample, desplaca(est.valors[i]));
    });
    const nou = new Blob(est.top.map((c) => substituts.get(c) ?? fitxer.slice(c.inici, c.fi)), { type: fitxer.type });
    if (nou.size !== fitxer.size + delta) return null;

    // La comprovació: la mateixa estructura desplaçada, el mateix lloc llegit i un netejador que el sap llevar.
    const despres = await analitza(nou, lector(nou, signal), { ambXyz: true });
    if (despres.valors.length !== est.valors.length || despres.valors.some((n, i) => n !== desplaca(est.valors[i]))) return null;
    const inspeccio = await inspeccionaUbicacioMitja(nou, { signal });
    const llegit = inspeccio?.coordenades;
    if (!inspeccio?.completa || !llegit || !mateix(llegit.lat, coordenades.lat) || !mateix(llegit.lng, coordenades.lng)
      || !mateix(Number.isFinite(llegit.altitud) ? llegit.altitud : null, Number.isFinite(coordenades.altitud) ? coordenades.altitud : null, 1e-3)) return null;
    const net = await senseUbicacioVideo(nou, { signal });
    if (!net?.net || (await inspeccionaUbicacioMitja(net.fitxer, { signal }))?.coordenades !== null) return null;
    return { fitxer: nou, lloc: { lat: llegit.lat, lng: llegit.lng } };
  } catch (error) {
    if (error?.name === 'AbortError') throw error;
    return null;
  }
}
