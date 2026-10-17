/**
 * comunicacioGovern.js — els resums executius del Govern del Mestre, en
 * paraules planes i sense React.
 *
 * Pla 261016_1530, Onada 0.5, mòdul 4: «Un xat o registre d'esdeveniments
 * diàfan on les IAs deixen els seus informes resumits en llenguatge humà de
 * poble.» Hui l'única font llegible per màquina és la matriu: els resums en
 * deriven, i res més. Cap frase porta rutes, ordres ni empremtes, i cap xifra
 * s'inventa: el que compta és el que la matriu pinta (vistaMatriu).
 */
import { ambMajuscula, plural } from '../concordanca.js';
import { recompteVist } from './matriuGovern.js';

export const SENSE_RESPONSABLE = 'Sense responsable';
export const SENSE_PRIORITAT = 'Sense prioritat';

/* Com es diu cada estat dins d'una frase. */
const EN_FRASE = Object.freeze({
  fet: 'fet i segellat',
  parcial: 'va a mitges',
  pendent: 'pendent per a la tanda següent',
  obsolet: 'cal tornar-ho a comprovar'
});

/** «35 fets i segellats, 52 a mitges, 41 per a la tanda següent i 0 per tornar a comprovar». */
export function fraseDeRecompte(r) {
  const parts = [
    plural(r.fet, 'fet i segellat', 'fets i segellats'),
    `${r.parcial} a mitges`,
    `${r.pendent} per a la tanda següent`
  ];
  if (r.obsolet) parts.push(`${r.obsolet} per tornar a comprovar`);
  return `${parts.slice(0, -1).join(', ')} i ${parts.at(-1)}`;
}

/* El nom d'una part de `owner`: la primera paraula, sense la puntuació del final
   («Claude implementa» → «Claude», «MarIA (orquestradora)» → «MarIA»). */
const nomDeLaPart = (part) => (part.trim().split(/\s+/)[0] ?? '').replace(/[^\p{L}\p{N}_-]+$/u, '');

/**
 * Qui porta una fila, un nom per responsable i sense repetir: el text de
 * `owner` partit per «;», «,», «/», «+» i « i », i la primera paraula de cada
 * part. «Claude implementa; Gemini arquitectura; Codex verifica» → Claude,
 * Gemini i Codex; «Gemini i Codex» → Gemini i Codex. Un nom és propi (amb
 * majúscula): «Claude implementa i verifica» no fa «verifica» responsable. Si
 * cap part porta un nom propi, la primera paraula. Llista buida sense owner.
 * Revisió adversarial del carril F1 (problema 12) · Abans s'agrupava pel text
 * sencer: amb la matriu real eixien 10 «responsables» per a tres IAs.
 */
export function responsablesDe(owner) {
  if (typeof owner !== 'string' || !owner.trim()) return [];
  const noms = owner.split(/[;,/+]|\s+i\s+/).map(nomDeLaPart).filter(Boolean);
  const propis = noms.filter((n) => /^\p{Lu}/u.test(n));
  return [...new Set(propis.length ? propis : noms.slice(0, 1))];
}

/* Agrupa les files per les seues claus de text (una fila pot tindre'n més
   d'una i compta en cada grup), en l'ordre d'aparició (o l'ordre donat). */
function agrupa(files, clausDe, ordre) {
  const grups = new Map();
  for (const f of files) {
    for (const clau of clausDe(f)) {
      if (!grups.has(clau)) grups.set(clau, []);
      grups.get(clau).push(f);
    }
  }
  const claus = [...grups.keys()];
  if (ordre) claus.sort(ordre);
  return claus.map((nom) => {
    const r = recompteVist(grups.get(nom));
    const total = grups.get(nom).length;
    return { nom, total, ...r, frase: `${nom}: ${plural(total, 'requeriment', 'requeriments')}, ${fraseDeRecompte(r)}.` };
  });
}

/* P1 abans que P2; el que no és Pn, al final i per ordre alfabètic. */
const ordrePrioritat = (a, b) => {
  const n = (p) => (/^P\d+$/i.test(p) ? Number(p.slice(1)) : Infinity);
  return n(a) - n(b) || a.localeCompare(b, 'ca');
};

/**
 * Els resums d'una matriu: { general: [frases], perResponsable: [grup],
 * perPrioritat: [grup], p1Oberts: [{ id, frase }], responsables,
 * senseResponsable }. Cada grup és { nom, total, fet, parcial, pendent,
 * obsolet, frase }. Per responsable, un grup per nom (responsablesDe): una
 * fila amb dos responsables compta per als dos, i la frase literal de `owner`
 * es conserva a cada fila. Les files sense `owner` van al grup «Sense
 * responsable», que no és cap responsable.
 * Revisió adversarial del carril F1 (mètrica de la targeta) · `responsables`
 * compta només els grups amb nom, i `senseResponsable`, les files que no en
 * porten cap: la targeta ja no compta el grup sintètic com un responsable més.
 * Null sense matriu.
 */
export function resumsExecutius(vista) {
  if (!vista) return null;
  const r = recompteVist(vista.files);
  const total = vista.files.length;
  const general = [];
  if (vista.caducitat?.obsoleta) {
    /* Revisió adversarial del carril F1 (problema 5) · El que deia, tal com
       ix: una fila amb un estat que no s'entén ja és 'obsolet' i es diu «per
       tornar a comprovar», i la frase quadra amb el total. Derogat: el
       recompte amb obsolet a zero, que se les deixava. */
    const deia = recompteVist(vista.files.map((f) => ({ estatVist: f.estat })));
    general.push(`La matriu és obsoleta i no es pot creure tal com està: ${vista.caducitat.motius.map((m) => m.text.replace(/\.$/, '').toLocaleLowerCase('ca')).join('; ')}.`);
    general.push(`Deia ${plural(total, 'requeriment', 'requeriments')}: ${fraseDeRecompte(deia)}. Cal tornar-la a fer abans de donar res per fet.`);
  } else {
    general.push(`La matriu té ${plural(total, 'requeriment', 'requeriments')}: ${fraseDeRecompte(r)}.`);
    const oberts = total - r.fet;
    general.push(oberts
      ? `${ambMajuscula(plural(oberts, 'requeriment passa', 'requeriments passen'))} a la tanda següent, cada un amb el seu identificador: cap s’esborra.`
      : 'No en queda cap per a la tanda següent.');
  }
  const p1Oberts = vista.files
    .filter((f) => (f.prioritat ?? '').toUpperCase() === 'P1' && f.estatVist !== 'fet')
    .map((f) => ({
      id: f.id,
      frase: `${f.id}: ${(f.requeriment ?? 'sense descripció').replace(/[.\s]+$/, '')}. ${ambMajuscula(EN_FRASE[f.estatVist])}.`
        + (f.responsable ? ` Responsables: ${f.responsable.replace(/[.\s]+$/, '')}.` : '')
    }));
  const perResponsable = agrupa(vista.files, (f) => {
    const noms = responsablesDe(f.responsable);
    return noms.length ? noms : [SENSE_RESPONSABLE];
  });
  const sense = perResponsable.find((g) => g.nom === SENSE_RESPONSABLE);
  return {
    general,
    perResponsable,
    perPrioritat: agrupa(vista.files, (f) => [f.prioritat ?? SENSE_PRIORITAT], ordrePrioritat),
    p1Oberts,
    responsables: perResponsable.length - (sense ? 1 : 0),
    senseResponsable: sense?.total ?? 0
  };
}

/** Què vol dir cada estat, per a la llegenda de les pàgines (l'etiqueta és ETIQUETA_ESTAT). */
export const LLEGENDA = Object.freeze([
  Object.freeze({ estat: 'fet', que: 'fet i comprovat' }),
  Object.freeze({ estat: 'parcial', que: 'va a mitges' }),
  Object.freeze({ estat: 'pendent', que: 'passa a la tanda següent' }),
  Object.freeze({ estat: 'obsolet', que: 'la matriu és vella o l’estat no s’entén: cal tornar-ho a comprovar' })
]);
