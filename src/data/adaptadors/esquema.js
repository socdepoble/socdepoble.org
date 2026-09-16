/**
 * esquema.js — Validador mínim de formes JSON. Zero dependències.
 * Una forma és un objecte pla de descriptors; `valida` torna TOTS els
 * errors amb el seu camí («autor.nom: s'esperava text»), no el primer.
 */
const T = (tipus, extra = {}) => ({ tipus, ...extra });
export const e = {
  text: (o) => T('text', o), nombre: (o) => T('nombre', o), boolea: (o) => T('boolea', o),
  data: (o) => T('data', o), uuid: (o) => T('uuid', o),
  llista: (de, o) => T('llista', { de, ...o }), objecte: (camps, o) => T('objecte', { camps, ...o }),
  enumeracio: (valors, o) => T('enumeracio', { valors, ...o }),
  opcional: (d) => ({ ...d, opcional: true }), nul: (d) => ({ ...d, nul: true }),
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function valida(desc, valor, cami = '$', errors = [], extres = []) {
  if (valor === undefined) { if (!desc.opcional) errors.push(`${cami}: falta`); return { errors, extres }; }
  if (valor === null) { if (!desc.nul) errors.push(`${cami}: és null`); return { errors, extres }; }
  const mal = (esperat) => errors.push(`${cami}: s'esperava ${esperat}, arriba ${Array.isArray(valor) ? 'llista' : typeof valor}`);
  switch (desc.tipus) {
    case 'text': if (typeof valor !== 'string') mal('text'); break;
    case 'nombre': if (typeof valor !== 'number' || Number.isNaN(valor)) mal('nombre'); break;
    case 'boolea': if (typeof valor !== 'boolean') mal('booleà'); break;
    case 'data': if (typeof valor !== 'string' || Number.isNaN(Date.parse(valor))) mal('data ISO'); break;
    case 'uuid': if (typeof valor !== 'string' || !UUID.test(valor)) mal('uuid'); break;
    case 'enumeracio': if (!desc.valors.includes(valor)) errors.push(`${cami}: «${valor}» fora de [${desc.valors.join(', ')}]`); break;
    case 'llista':
      if (!Array.isArray(valor)) mal('llista');
      else valor.forEach((v, i) => valida(desc.de, v, `${cami}[${i}]`, errors, extres));
      break;
    case 'objecte':
      if (typeof valor !== 'object' || Array.isArray(valor)) { mal('objecte'); break; }
      for (const [k, d] of Object.entries(desc.camps)) valida(d, valor[k], `${cami}.${k}`, errors, extres);
      /* Camps nous de l'origen: no trenquen res, però són el primer senyal
         que l'altra banda ha canviat. Es tornen com a avís. */
      for (const k of Object.keys(valor)) if (!(k in desc.camps)) extres.push(`${cami}.${k}`);
      break;
    default: errors.push(`${cami}: descriptor desconegut «${desc.tipus}»`);
  }
  return { errors, extres };
}
