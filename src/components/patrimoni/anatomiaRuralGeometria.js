/**
 * anatomiaRuralGeometria.js — Geometria isomètrica paramètrica del visor
 * d'Anatomia Rural (IDEA-109). Pura: cap React, cap DOM, cap dependència.
 *
 * Projecció isomètrica (30°): x i y són el pla del terra; z, l'alçada.
 *   pantalla.x = CENTRE_X + (x − y)·cos30°
 *   pantalla.y = BASE_Y  + (x + y)·sin30° − z
 * Una circumferència de radi r al terra és una el·lipse de semieixos
 * r·√2·cos30° i r·√2·sin30° (relació 0,577: la isomètrica de veres).
 *
 * Cada peça d'anatomiaRural.js (`forma`) es convertix en una llista de
 * traços { d, cara, ombra }: `cara` és el paper del traç ('cim', 'cos',
 * 'esq', 'dre', 'filera') i `ombra` (0, 1 o 2) el nivell de fosc que la
 * vora pinta damunt. El dibuix és un esquema: no té escala.
 */

export const AMPLARIA = 600;
export const ALTARIA = 520;
export const CENTRE_X = 300;
export const BASE_Y = 440;
/** Separació vertical entre peces consecutives del tot desmuntat (unitats de l'esquema). */
export const SEPARACIO = 26;

const COS = Math.cos(Math.PI / 6);
const SIN = 0.5;
const RX_PER_RADI = Math.SQRT2 * COS;
const RY_PER_RADI = Math.SQRT2 * SIN;

const arrodoneix = (valor) => Math.round(valor * 10) / 10;
const num = (valor) => String(arrodoneix(valor));

/** (x, y, z) del món → [x, y] de pantalla. */
export function projecta(x, y, z) {
  return [arrodoneix(CENTRE_X + (x - y) * COS), arrodoneix(BASE_Y + (x + y) * SIN - z)];
}

const poligon = (punts) => `M${punts.map(([x, y]) => `${num(x)} ${num(y)}`).join(' L')} Z`;
const ellipse = (cx, cy, rx, ry) => `M${num(cx - rx)} ${num(cy)} A${num(rx)} ${num(ry)} 0 1 0 ${num(cx + rx)} ${num(cy)} A${num(rx)} ${num(ry)} 0 1 0 ${num(cx - rx)} ${num(cy)} Z`;
const mitatInferior = (cx, cy, rx, ry) => `M${num(cx - rx)} ${num(cy)} A${num(rx)} ${num(ry)} 0 0 0 ${num(cx + rx)} ${num(cy)}`;

function filesDelCilindre({ cx, cy, r, z, h, fileres = 0 }) {
  const traços = [];
  for (let k = 1; k <= fileres; k += 1) {
    const [px, py] = projecta(cx, cy, z + (h * k) / (fileres + 1));
    traços.push({ d: mitatInferior(px, py, r * RX_PER_RADI, r * RY_PER_RADI), cara: 'filera', ombra: 0 });
  }
  return traços;
}

function prisma({ x, y, w, d, z, h, fileres = 0 }) {
  const cim = [projecta(x, y, z + h), projecta(x + w, y, z + h), projecta(x + w, y + d, z + h), projecta(x, y + d, z + h)];
  const esquerra = [projecta(x, y + d, z + h), projecta(x + w, y + d, z + h), projecta(x + w, y + d, z), projecta(x, y + d, z)];
  const dreta = [projecta(x + w, y, z + h), projecta(x + w, y + d, z + h), projecta(x + w, y + d, z), projecta(x + w, y, z)];
  const traços = [
    { d: poligon(esquerra), cara: 'esq', ombra: 1 },
    { d: poligon(dreta), cara: 'dre', ombra: 2 },
    { d: poligon(cim), cara: 'cim', ombra: 0 }
  ];
  for (let k = 1; k <= fileres; k += 1) {
    const zk = z + (h * k) / (fileres + 1);
    const [a, b] = [projecta(x, y + d, zk), projecta(x + w, y + d, zk)];
    const [c, e] = [projecta(x + w, y, zk), projecta(x + w, y + d, zk)];
    traços.push({ d: `M${num(a[0])} ${num(a[1])} L${num(b[0])} ${num(b[1])}`, cara: 'filera', ombra: 0 });
    traços.push({ d: `M${num(c[0])} ${num(c[1])} L${num(e[0])} ${num(e[1])}`, cara: 'filera', ombra: 0 });
  }
  return { traços, ancora: projecta(x + w / 2, y + d / 2, z + h / 2) };
}

function cilindre(forma) {
  const { cx, cy, r, z, h } = forma;
  const rx = r * RX_PER_RADI;
  const ry = r * RY_PER_RADI;
  const [bx, by] = projecta(cx, cy, z);
  const [tx, ty] = projecta(cx, cy, z + h);
  const cos = `M${num(bx - rx)} ${num(by)} L${num(tx - rx)} ${num(ty)} L${num(tx + rx)} ${num(ty)} L${num(bx + rx)} ${num(by)} A${num(rx)} ${num(ry)} 0 0 1 ${num(bx - rx)} ${num(by)} Z`;
  return {
    traços: [
      { d: cos, cara: 'cos', ombra: 1 },
      { d: ellipse(tx, ty, rx, ry), cara: 'cim', ombra: 0 },
      ...filesDelCilindre(forma)
    ],
    ancora: projecta(cx, cy, z + h / 2)
  };
}

function con({ cx, cy, r1, r2, z, h }) {
  const [bx, by] = projecta(cx, cy, z);
  const [tx, ty] = projecta(cx, cy, z + h);
  const [rx1, ry1] = [r1 * RX_PER_RADI, r1 * RY_PER_RADI];
  const [rx2, ry2] = [r2 * RX_PER_RADI, r2 * RY_PER_RADI];
  const cos = `M${num(bx - rx1)} ${num(by)} L${num(tx - rx2)} ${num(ty)} L${num(tx + rx2)} ${num(ty)} L${num(bx + rx1)} ${num(by)} A${num(rx1)} ${num(ry1)} 0 0 1 ${num(bx - rx1)} ${num(by)} Z`;
  return {
    traços: [
      { d: cos, cara: 'cos', ombra: 1 },
      { d: ellipse(tx, ty, rx2, ry2), cara: 'cim', ombra: 0 }
    ],
    ancora: projecta(cx, cy, z + h / 2)
  };
}

function cupula({ cx, cy, r, z, h, fileres = 0 }) {
  const [bx, by] = projecta(cx, cy, z);
  const rx = r * RX_PER_RADI;
  const ry = r * RY_PER_RADI;
  /* Contorn: la mitat inferior de la base i l'arc superior, de la dreta a l'esquerra. */
  const cos = `M${num(bx - rx)} ${num(by)} A${num(rx)} ${num(ry)} 0 0 0 ${num(bx + rx)} ${num(by)} A${num(rx)} ${num(h)} 0 0 0 ${num(bx - rx)} ${num(by)} Z`;
  const traços = [{ d: cos, cara: 'cos', ombra: 1 }];
  for (let k = 1; k <= fileres; k += 1) {
    const fraccio = k / (fileres + 1);
    const factor = Math.sqrt(1 - fraccio * fraccio);
    traços.push({ d: mitatInferior(bx, by - h * fraccio, rx * factor, ry * factor), cara: 'filera', ombra: 0 });
  }
  return { traços, ancora: [bx, arrodoneix(by - h / 2)] };
}

function marcador({ x, y, z }) {
  return { traços: [], ancora: projecta(x, y, z) };
}

const CONSTRUCTORS = { prisma, cilindre, con, cupula, marcador };

/** Els traços de la forma i el punt de la peça on cau el punt calent. */
export function construeixPeca(forma) {
  const construeix = CONSTRUCTORS[forma?.tipus];
  if (!construeix) return { traços: [], ancora: [CENTRE_X, BASE_Y] };
  return construeix(forma);
}

const limita = (valor, min, max) => Math.min(max, Math.max(min, valor));

/**
 * La separació de cada peça per a un valor del control (0 = muntat, 100 =
 * desmuntat). Peça a peça: la de dalt es desprén primer. Torna, per peça i
 * en l'ordre de `peces`, { id, dz, dx, dy, t }: `dz` puja la peça (unitats
 * de l'esquema), `dx` i `dy` la desplacen de costat (peces laterals).
 */
export function separacions(peces, valor) {
  const k = limita(Number(valor) / 100 || 0, 0, 1);
  const n = peces.length;
  let rang = 0;
  return peces.map((peca, index) => {
    const t = limita(k * n - (n - 1 - index), 0, 1);
    if (peca.lateral) {
      return { id: peca.id, dz: 0, dx: arrodoneix(peca.lateral.dx * t), dy: arrodoneix(peca.lateral.dy * t), t };
    }
    const dz = arrodoneix(rang * SEPARACIO * t);
    rang += 1;
    return { id: peca.id, dz, dx: 0, dy: 0, t };
  });
}
