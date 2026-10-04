/**
 * concordanca.js — la concordança de nombre de tota la Consola, sense React
 * ni cap altra dependència: també la importa el compilador del Mapa
 * (mapa/construeixMapa.js), que corre a node.
 *
 * Ordre del Mestre, 261004 (xat: cap xifra solta) · «Els plurals han de
 * concordar (1 cadena, 2 cadenes).» Cap recompte de la Consola porta el
 * plural fix: el nom, el verb o l'article que va amb una xifra passa per ací.
 *
 * Correcció 261004 (verificador de la tercera passada, punt 3) · I
 * l'ortografia de la preposició: «de» s'apostrofa davant d'una xifra que es
 * llig començant per vocal («d’1 agent», «d’11», «d’8»), mai «de 1».
 */

/** Només la forma que concorda amb `n`: «rep» o «reben», «la llig» o «la lligen». */
export const concorda = (n, un, molts) => (n === 1 ? un : molts);

/** Una xifra amb el que compta: «1 cadena», «0 cadenes», «2 cadenes». */
export const plural = (n, un, molts) => `${n} ${concorda(n, un, molts)}`;

/** Una xifra amb el que compta, o el text d'absència si la mesura no hi és (mai 0). */
export const senseMesura = (n, un, molts, absent) => (n === null ? absent : plural(n, un, molts));

/** Un recompte d'un subtítol, concordat; si la mesura no hi és, «… sense mesura», mai 0 ni un guió. */
export const compteOMesura = (n, un, molts) => (n === null ? `${molts} sense mesura` : plural(n, un, molts));

/* Com es llig el grup de tres xifres (1-999) que encapçala un número:
   «un», «onze», «huit», «huitanta-…» i «huit-cents» comencen per vocal (la
   hac no sona); «cent», «dos-cents», «trenta»…, per consonant. */
function grupAmbVocal(g) {
  if (g >= 100) return Math.floor(g / 100) === 8;
  return g === 1 || g === 8 || g === 11 || (g >= 80 && g <= 89);
}

/**
 * Si una xifra (un enter no negatiu) es llig començant per vocal: 1 (un),
 * 8 (huit), 11 (onze), 80-89 (huitanta…), 800-899 (huit-cents), 8.000 (huit
 * mil), 1.000.000 (un milió)… però no 1.000 (mil) ni 1.000.000.000 (mil
 * milions). Qualsevol altra cosa, no.
 */
export function llegidaAmbVocal(n) {
  if (!Number.isSafeInteger(n) || n < 0) return false;
  let grup = n;
  let escala = 0;
  while (grup >= 1000) {
    grup = Math.floor(grup / 1000);
    escala += 1;
  }
  // Un sol miler és «mil», sense «un»; un sol milió (o bilió) sí que porta «un».
  if (grup === 1 && escala > 0) return escala % 2 === 0;
  return grupAmbVocal(grup);
}

/**
 * «de» davant d'una xifra, apostrofat quan la xifra es llig amb vocal.
 * `text` és la xifra ja escrita, amb el que compta: de(1, '1 agent') →
 * «d’1 agent»; de(30, '30 skills') → «de 30 skills».
 */
export const de = (n, text = String(n)) => (llegidaAmbVocal(n) ? `d’${text}` : `de ${text}`);

/** La primera lletra en majúscula: un `de(…)` a començament de frase («D’1 agent», «De 30 skills»). */
export const ambMajuscula = (text) => {
  const t = String(text ?? '');
  return t ? t[0].toLocaleUpperCase('ca') + t.slice(1) : t;
};
