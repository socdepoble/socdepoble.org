/**
 * Orígens de Sollutia i de Sóc de Poble: UNA sola llista (A6, P2-b).
 * ---------------------------------------------------------------------------
 * Abans hi havia dues llistes que no coincidien: runtimePolicy.js (pares i
 * callbacks d'OAuth) i PedraSecaEmbed.jsx (orígens de backend acceptats a la
 * configuració). Ací es declara la unió i cada ús com a subconjunt d'ella,
 * amb el MATEIX comportament d'abans: cap origen entra ni ix de cap llista.
 *
 * La divergència continua i és una decisió del Mestre, no d'este fitxer:
 *   · runtimePolicy: https://sollutia.cat i https://v2.sollutia.com;
 *   · PedraSecaEmbed: https://socdepoble.sollutia.cat.
 * Quan Sollutia done els seus orígens exactes, només canvia este fitxer.
 *
 * Pur: sense import.meta ni window. Els orígens locals de desenvolupament
 * no hi són: els afig cada consumidor segons el seu entorn.
 */

/** Orígens propis de Sóc de Poble. */
export const ORIGENS_SOCDEPOBLE = Object.freeze([
  'https://socdepoble.org',
  'https://auth.socdepoble.org'
]);

/** Orígens de Sollutia citats en algun lloc del codi (unió de hui). */
export const ORIGENS_SOLLUTIA = Object.freeze([
  'https://sollutia.cat',
  'https://socdepoble.sollutia.com',
  'https://socdepoble.sollutia.cat',
  'https://v2.sollutia.com'
]);

/** La unió: tot origen públic que el nucli reconeix, d'un costat o de l'altre. */
export const ORIGENS_CONEGUTS = Object.freeze([...ORIGENS_SOCDEPOBLE, ...ORIGENS_SOLLUTIA]);

/* ── Usos (cada un, subconjunt de la unió; l'ordre és el de sempre) ── */

/** Pares que poden enviar ordres al pont d'iframe (runtimePolicy.js · DEFAULT_PARENTS). */
export const ORIGENS_PARE = Object.freeze([
  'https://socdepoble.org',
  'https://sollutia.cat',
  'https://socdepoble.sollutia.com'
]);

/** Tornades d'OAuth admeses (runtimePolicy.js · DEFAULT_CALLBACKS). */
export const ORIGENS_CALLBACK = Object.freeze([
  ...ORIGENS_PARE,
  'https://auth.socdepoble.org',
  'https://v2.sollutia.com'
]);

/** Orígens de backend i serveis que la configuració de l'element accepta
    (PedraSecaEmbed.jsx · sanejaConfig, a més del del paquet). */
export const ORIGENS_BACKEND = Object.freeze([
  'https://auth.socdepoble.org',
  'https://socdepoble.sollutia.com',
  'https://socdepoble.sollutia.cat'
]);
