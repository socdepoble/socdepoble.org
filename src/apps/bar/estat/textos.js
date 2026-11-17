/**
 * El Bar · estat/textos.js — el que es diu a la persona quan una operació no
 * es fa. El text ix del `codi` de l'error (nucli, magatzem, magatzemLocal o
 * la guarda del permís de ProveidorBar), mai d'un missatge tècnic: cap valor
 * de negoci, cap clau, cap pila.
 *
 * També l'avís de la sessió (avisDeSessio): per què el Bar ven o no ven ara.
 *
 * Onada R32.5 · Internacionalització en les 5 llengües (ca, es, en, eu, gl)
 * conservant el valencià per defecte.
 */
import { codiIdiomaBar, textosErrorsBar, textosUiBar } from '../i18nBar.js';

const TEXTOS_MIG = Object.freeze({
  ca: Object.freeze({
    titol: 'Un moviment s’ha quedat a mitges',
    errorTitol: 'No s’han pogut comprovar els moviments',
    errorText: 'No s’ha pogut mirar si algun moviment entre comandes s’ha quedat a mitges. Revisa les comandes obertes abans de cobrar: alguna línia podria estar dues vegades.',
    linia: 'La línia',
    linies: 'Les línies',
    origenCobrat: (quines, origen, desti) => `${quines}: ja s’han cobrat a «${origen}» i encara són a «${desti}». Revisa-la abans de cobrar: estes línies poden estar dues vegades. Si sobren, lleva-les de «${desti}».`,
    destiCobrat: (quines, origen, desti) => `${quines}: ja s’han cobrat a «${desti}» i encara són a «${origen}». Revisa-la abans de cobrar: estes línies poden estar dues vegades. Si sobren, lleva-les de «${origen}».`,
    duplicat: (quines, origen, desti) => `${quines}: són a «${origen}» i també a «${desti}». Revisa-les abans de cobrar: estes línies poden estar dues vegades. Lleva-les de la comanda on sobren; no tornes a fer el moviment.`
  }),
  es: Object.freeze({
    titol: 'Un movimiento se ha quedado a medias',
    errorTitol: 'No se han podido comprobar los movimientos',
    errorText: 'No se ha podido comprobar si algún movimiento entre comandas se ha quedado a medias. Revisa las comandas abiertas antes de cobrar: alguna línea podría estar duplicada.',
    linia: 'La línea',
    linies: 'Las líneas',
    origenCobrat: (quines, origen, desti) => `${quines}: ya se han cobrado en «${origen}» y aún siguen en «${desti}». Revísala antes de cobrar: estas líneas pueden estar duplicadas. Si sobran, quítalas de «${desti}».`,
    destiCobrat: (quines, origen, desti) => `${quines}: ya se han cobrado en «${desti}» y aún siguen en «${origen}». Revísala antes de cobrar: estas líneas pueden estar duplicadas. Si sobran, quítalas de «${origen}».`,
    duplicat: (quines, origen, desti) => `${quines}: están en «${origen}» y también en «${desti}». Revísalas antes de cobrar: estas líneas pueden estar duplicadas. Quítalas de la comanda donde sobren; no repitas el movimiento.`
  }),
  en: Object.freeze({
    titol: 'A transfer was left incomplete',
    errorTitol: 'Could not verify order transfers',
    errorText: 'Could not check whether a transfer between orders was left incomplete. Review open orders before charging: an item might be listed twice.',
    linia: 'Line',
    linies: 'Lines',
    origenCobrat: (quines, origen, desti) => `${quines}: already paid in “${origen}” and still present in “${desti}”. Review before charging: remove duplicates from “${desti}” if needed.`,
    destiCobrat: (quines, origen, desti) => `${quines}: already paid in “${desti}” and still present in “${origen}”. Review before charging: remove duplicates from “${origen}” if needed.`,
    duplicat: (quines, origen, desti) => `${quines}: present in both “${origen}” and “${desti}”. Review before charging and remove from the extra order without repeating the transfer.`
  }),
  eu: Object.freeze({
    titol: 'Mugimendu bat erdibidean geratu da',
    errorTitol: 'Ezin izan dira mugimenduak egiaztatu',
    errorText: 'Ezin izan da begiratu eskaeren arteko mugimenduren bat erdibidean geratu den. Berrikusi eskaera irekiak kobratu aurretik: lerroren bat bikoiztuta egon liteke.',
    linia: 'Lerroa',
    linies: 'Lerroak',
    origenCobrat: (quines, origen, desti) => `${quines}: dagoeneko «${origen}» eskaeran kobratu dira eta oraindik «${desti}» eskaeran daude. Berrikusi kobratu aurretik eta kendu «${desti}» eskaeratik soberan badaude.`,
    destiCobrat: (quines, origen, desti) => `${quines}: dagoeneko «${desti}» eskaeran kobratu dira eta oraindik «${origen}» eskaeran daude. Berrikusi kobratu aurretik eta kendu «${origen}» eskaeratik soberan badaude.`,
    duplicat: (quines, origen, desti) => `${quines}: «${origen}» eta «${desti}» eskaeretan daude. Berrikusi kobratu aurretik eta kendu soberan dauden eskaeratik.`
  }),
  gl: Object.freeze({
    titol: 'Un movemento quedou a medias',
    errorTitol: 'Non se puideron comprobar os movementos',
    errorText: 'Non se puido mirar se algún movemento entre comandas quedou a medias. Revisa as comandas abertas antes de cobrar: algunha liña podería estar dúas veces.',
    linia: 'A liña',
    linies: 'As liñas',
    origenCobrat: (quines, origen, desti) => `${quines}: xa se cobraron en «${origen}» e aínda están en «${desti}». Revísaa antes de cobrar: se sobran, quítaas de «${desti}».`,
    destiCobrat: (quines, origen, desti) => `${quines}: xa se cobraron en «${desti}» e aínda están en «${origen}». Revísaa antes de cobrar: se sobran, quítaas de «${origen}».`,
    duplicat: (quines, origen, desti) => `${quines}: están en «${origen}» e tamén en «${desti}». Revísaas antes de cobrar e quítaas da comanda onde sobren.`
  })
});

/**
 * L'avís d'un «Mou» o un «Dividix» a mitges (nucli/migMoviment.js,
 * detectaMigsMoviments), per a una persona: quines línies, a quines dues
 * comandes i què fer. `nomDe(descripcio)` diu el nom d'una comanda («Taula 3»,
 * «Barra · 10:00», «Nota 0004»); el posa la vista. Res no s'arregla sol.
 * @returns {{ titol: string, text: string }}
 */
export function avisMigMoviment(mig, nomDe, idioma = 'ca') {
  const m = TEXTOS_MIG[codiIdiomaBar(idioma)];
  if (!mig || mig.motiu === 'ERROR') {
    return { titol: m.errorTitol, text: m.errorText };
  }
  const linies = mig.linies.map((l) => `${l.quantitat} × ${l.nom}`).join(', ');
  const quines = `${mig.linies.length === 1 && mig.linies[0].quantitat === 1 ? m.linia : m.linies} ${linies}`;
  const origen = nomDe(mig.origen);
  const desti = nomDe(mig.desti);
  if (mig.motiu === 'ORIGEN_COBRAT') {
    return { titol: m.titol, text: m.origenCobrat(quines, origen, desti) };
  }
  if (mig.motiu === 'DESTI_COBRAT') {
    return { titol: m.titol, text: m.destiCobrat(quines, origen, desti) };
  }
  return { titol: m.titol, text: m.duplicat(quines, origen, desti) };
}

export function textError(error, idioma = 'ca') {
  const dic = textosErrorsBar(idioma);
  const codi = error?.codi;
  if (codi && Object.hasOwn(dic, codi) && codi !== 'GENERIC') return dic[codi];
  return dic.GENERIC;
}

/* Un avís per motiu del pont de sessió (useSessioApp, MOTIUS). `entra`: porta
   el botó «Entra» (rutaEntrada). 'sessio' i 'lliure' no en tenen: en línia no
   cal dir res. 'comprovant-desada' diu el mateix que 'comprovant', però el
   Bar ven: el servidor comprova una sessió desada que encara no ha caigut.
   Onada R32.5 · Els textos de cada motiu viuen a i18nBar.js (textosUiBar), en les 5 llengües. */

/**
 * L'avís de la sessió del Bar a partir del permís de l'estat (ProveidorBar,
 * `permis`: { potEscriure, motiu, enLinia, modeProves, rutaEntrada }):
 * { to, text, entra } o null si no cal dir res ('sessio' o 'lliure' en línia).
 * Un sol avís: el motiu ja diu el més important. Amb sessió (o en una app
 * lliure) però sense xarxa, l'avís de «Sense connexió».
 */
export function avisDeSessio(permis, idioma = 'ca') {
  const tx = textosUiBar(idioma);
  const motiu = permis?.motiu;
  if (motiu === 'sense-sessio') return { to: 'avis', text: tx.sessioSenseSessio, entra: true };
  if (motiu === 'comprovant' || motiu === 'comprovant-desada') return { to: 'info', text: tx.sessioComprovant, entra: false };
  if (motiu === 'sense-permis') return { to: 'avis', text: tx.sessioSensePermis, entra: false };
  if (motiu === 'mode-proves') return { to: 'info', text: tx.sessioModeProves, entra: false };
  if (motiu === 'fora-de-linia') return { to: 'info', text: tx.sessioForaLinia, entra: false };
  return permis?.enLinia === false ? { to: 'info', text: tx.sessioSenseConnexio, entra: false } : null;
}
