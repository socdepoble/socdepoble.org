/* v1.2.26 · Viu en una fulla pròpia perquè cap mòdul de l'arrencada estàtica no la fa servir: dins de
   contentHelpers.js el tros d'entrada l'havia d'exportar per al cercador, la federació i el netejador
   IDEA-357, i la pagava l'arrencada (integrador C1-3, tercera ronda). No la reexportes des de
   contentHelpers.js, o tornaria a l'arrencada. */
import { cercadorEndavant } from './contentHelpers.js';

/* Abans: /<(script|style)[\s\S]*?<\/\1>/gi → ' '. Un bloc va d'un '<script'
   (o '<style', en majúscules o minúscules) al primer '</script>' (o
   '</style>') que el seguix, i es fa un espai. L'obertura no demana '>' i el
   tancament no admet espais, com l'expressió; un bloc sense tancament no casa
   i la cerca continua després. */
export function llevaScriptsIEstils(valor) {
  const text = String(valor ?? '');
  const tancaments = {
    script: cercadorEndavant(text, /<\/script>/gi),
    style: cercadorEndavant(text, /<\/style>/gi)
  };
  const obertura = /<(script|style)/gi;
  let net = '';
  let fet = 0;
  let casa;
  while ((casa = obertura.exec(text)) !== null) {
    const nom = casa[1].toLowerCase();
    const fi = tancaments[nom](obertura.lastIndex);
    if (fi === -1) continue;
    net += `${text.slice(fet, casa.index)} `;
    fet = fi + nom.length + 3;
    obertura.lastIndex = fet;
  }
  return net + text.slice(fet);
}
