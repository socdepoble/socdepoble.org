/* Onada R24 · wp_trinquet (SEO-R22-08, trinquet de l'arrencada estàtica) · Els
   destins del Traductor de Poble (data/traductor.js), en una fulla sense
   imports: PedraSecaEmbed.jsx, que és de l'arrencada, només en vol
   sanejaDestinsDeclarats (l'atribut `traductor-llengues` de l'amfitrió) i,
   important-la de traductor.js, arrossegava al tros d'entrada el client sencer
   (creaTraductor, tradueixTot, la protecció dels noms propis), que només fan
   servir vistes diferides. traductor.js els reexporta amb els mateixos noms i
   els mateixos valors: cap altre importador no canvia. */

/* La llista TANCADA de destins: el servidor rebutja qualsevol altre valor.
   `cap` és com ho diu una frase («Traduint al castellà…») i `lang` va a
   l'atribut lang del text traduït (lector de pantalla, guionat).
   Ordre del Mestre (261030 01:30): el gallec i el basc, literals. L'ordre del
   menú és el d'esta llista: el castellà, les altres llengües cooficials
   (gallec i basc) i després l'anglés, el francés i l'alemany, com abans. */
export const LLENGUES_TRADUCCIO = Object.freeze([
  Object.freeze({ codi: 'ES', nom: 'Castellà', cap: 'al castellà', lang: 'es' }),
  Object.freeze({ codi: 'GL', nom: 'Gallec', cap: 'al gallec', lang: 'gl' }),
  Object.freeze({ codi: 'EU', nom: 'Basc', cap: 'al basc', lang: 'eu' }),
  Object.freeze({ codi: 'EN-GB', nom: 'Anglés', cap: 'a l’anglés', lang: 'en-GB' }),
  Object.freeze({ codi: 'FR', nom: 'Francés', cap: 'al francés', lang: 'fr' }),
  Object.freeze({ codi: 'DE', nom: 'Alemany', cap: 'a l’alemany', lang: 'de' }),
]);

export const llenguaDeTraduccio = (codi) => LLENGUES_TRADUCCIO.find((llengua) => llengua.codi === codi) || null;

/* Gauntlet 261030 (Fase 3, TC3.1; traduir-eu-de-servidor-503) · Els destins
   que l'amfitrió declara que servix (`traductor-llengues`: marcatge.php a
   WordPress, el connector de desenvolupament a main.jsx). Una cadena separada
   per blancs ('ES GL EN-GB FR') o un array; només els codis exactes de
   LLENGUES_TRADUCCIO, sense repetits i en l'ordre declarat. Torna un array
   congelat o undefined (sense res vàlid): un amfitrió que no en declara cap
   es queda com abans. */
const LIMIT_TEXT_DESTINS = 128;
export function sanejaDestinsDeclarats(valor) {
  let candidats;
  if (typeof valor === 'string') {
    if (valor.length > LIMIT_TEXT_DESTINS) return undefined;
    candidats = valor.trim().split(/\s+/);
  } else if (Array.isArray(valor)) {
    candidats = valor.slice(0, LLENGUES_TRADUCCIO.length * 2);
  } else {
    return undefined;
  }
  const codis = [];
  for (const codi of candidats) {
    if (typeof codi === 'string' && llenguaDeTraduccio(codi) && !codis.includes(codi)) codis.push(codi);
  }
  return codis.length ? Object.freeze(codis) : undefined;
}
