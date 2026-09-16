/**
 * traductor.js — El cor de la Frontissa (capa anticorrupció).
 *
 *   JSON de l'origen ──valida(entrada)──▶ mapa() ──valida(eixida)──▶ DTO congelat
 *
 * · Fail-closed: si l'origen no complix la forma esperada, llança
 *   ErrorFrontera amb tots els camins. La UI no rep mai mitja dada.
 * · Camps nous a l'origen → `avisos`, no error: detectem la deriva abans
 *   que ens trenque.
 * · El DTO ix congelat: cap component pot mutar la veritat de l'origen.
 */
import { valida } from './esquema.js';

export class ErrorFrontera extends Error {
  constructor(motiu, detall = {}) {
    super(`[Frontissa] ${motiu}${detall.errors ? `\n  · ${detall.errors.join('\n  · ')}` : ''}`);
    this.name = 'ErrorFrontera';
    this.motiu = motiu;
    Object.assign(this, detall);
  }
}

const congela = (v) => {
  if (v && typeof v === 'object' && !Object.isFrozen(v)) {
    Object.values(v).forEach(congela);
    Object.freeze(v);
  }
  return v;
};

export function creaTraductor({ origen, recurs, versio, entrada, eixida, mapa }) {
  const nom = `${origen}/${recurs}@${versio}`;
  function tradueix(cru) {
    const ent = valida(entrada, cru);
    if (ent.errors.length) throw new ErrorFrontera(`${nom}: l'origen no complix el contracte`, { errors: ent.errors, recurs: nom });
    const dto = mapa(cru);
    const eix = valida(eixida, dto);
    if (eix.errors.length) throw new ErrorFrontera(`${nom}: el mapa produïx un DTO invàlid`, { errors: eix.errors, recurs: nom });
    return { dto: congela(dto), avisos: ent.extres.map((c) => `${nom}: camp nou a l'origen ${c}`) };
  }
  tradueix.llista = (crus) => {
    if (!Array.isArray(crus)) throw new ErrorFrontera(`${nom}: s'esperava una llista`, { recurs: nom });
    const avisos = [];
    const dtos = crus.map((c, i) => {
      try { const r = tradueix(c); avisos.push(...r.avisos); return r.dto; } catch (err) { err.message += ` (element ${i})`; throw err; }
    });
    return { dtos: Object.freeze(dtos), avisos: [...new Set(avisos)] };
  };
  tradueix.nom = nom;
  tradueix.entrada = entrada;
  return tradueix;
}
