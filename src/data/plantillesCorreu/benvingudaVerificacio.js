/**
 * IDEA-72 / AH-11 · Plantilla canònica de correu de benvinguda i activació de compte
 * des del remitent institucional `socdepoble@socdepoble.org` en les 5 llengües oficials.
 */

export const REMITENT_CORREU_CANONIC = 'socdepoble@socdepoble.org';
export const NOM_REMITENT_CANONIC = 'Sóc de Poble';
export const LLENGUES_CORREU = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

const DOMINIS_CONFIRMACIO_PERMESOS = new Set([
  'socdepoble.org',
  'www.socdepoble.org',
  'socdepoble.cat',
  'www.socdepoble.cat',
  'gentdelatorre.net',
  'localhost',
]);

const TEXTOS_PER_LLENGUA = Object.freeze({
  ca: Object.freeze({
    assumpte: 'Benvingut/da a Sóc de Poble · Confirma el teu compte',
    salutacio: 'Hola, {nom}:',
    salutacioGenerica: 'Hola, veí o veïna:',
    intro: 'Gràcies per registrar-te a Sóc de Poble, la xarxa rural feta des dels nostres pobles i sense anuncis ni algoritmes.',
    pobleText: 'El teu compte quedarà vinculat a la comunitat de {poble} amb l’identificador @{usuari}.',
    instruccio: 'Per activar el teu compte i començar a participar al Mur, al Xat i als espais veïnals, confirma el teu correu prement l’enllaç següent:',
    boto: 'Confirmar el meu compte a Sóc de Poble',
     seguretat: 'Si tu no has demanat aquest compte, pots ignorar aquest correu amb total tranquil·litat.',
    comiat: 'Una abraçada des del Mas i benvingut/da a casa,',
    signatura: 'L’equip de Sóc de Poble (socdepoble@socdepoble.org)',
  }),
  es: Object.freeze({
    assumpte: 'Bienvenido/a a Sóc de Poble · Confirma tu cuenta',
    salutacio: 'Hola, {nom}:',
    salutacioGenerica: 'Hola, vecino o vecina:',
    intro: 'Gracias por registrarte en Sóc de Poble, la red rural hecha desde nuestros pueblos y sin anuncios ni algoritmos.',
    pobleText: 'Tu cuenta quedará vinculada a la comunidad de {poble} con el identificador @{usuari}.',
    instruccio: 'Para activar tu cuenta y empezar a participar en el Muro, el Chat y los espacios vecinales, confirma tu correo pulsando el siguiente enlace:',
    boto: 'Confirmar mi cuenta en Sóc de Poble',
    seguretat: 'Si tú no has solicitado esta cuenta, puedes ignorar este correo con total tranquilidad.',
    comiat: 'Un abrazo desde el Mas y bienvenido/a a casa,',
    signatura: 'El equipo de Sóc de Poble (socdepoble@socdepoble.org)',
  }),
  en: Object.freeze({
    assumpte: 'Welcome to Sóc de Poble · Confirm your account',
    salutacio: 'Hello, {nom}:',
    salutacioGenerica: 'Hello, neighbour:',
    intro: 'Thank you for signing up to Sóc de Poble, the rural network built from our villages with no ads and no algorithms.',
    pobleText: 'Your account will be linked to the community of {poble} with handle @{usuari}.',
    instruccio: 'To activate your account and join the Wall, Chat, and village spaces, confirm your email by clicking the link below:',
    boto: 'Confirm my Sóc de Poble account',
    seguretat: 'If you did not request this account, you can safely ignore this email.',
    comiat: 'Warm regards from the Mas and welcome home,',
    signatura: 'The Sóc de Poble team (socdepoble@socdepoble.org)',
  }),
  eu: Object.freeze({
    assumpte: 'Ongi etorri Sóc de Poble-ra · Berretsi zure kontua',
    salutacio: 'Kaixo, {nom}:',
    salutacioGenerica: 'Kaixo, auzokide:',
    intro: 'Eskerrik asko Sóc de Poble-n izena emateagatik, gure herrietatik egindako landa-sarea, iragarkirik eta algoritmorik gabea.',
    pobleText: 'Zure kontua {poble} komunitateari lotuta geratuko da @{usuari} identifikatzailearekin.',
    instruccio: 'Zure kontua aktibatzeko eta Horman, Txatean eta herriko guneetan parte hartzeko, berretsi zure posta esteka honetan sakatuz:',
    boto: 'Berretsi nire Sóc de Poble kontua',
    seguretat: 'Kontu hau zuk eskatu ez baduzu, mezu hau lasai baztertu dezakezu.',
    comiat: 'Besarkada bat Mas-etik eta ongi etorri etxera,',
    signatura: 'Sóc de Poble taldea (socdepoble@socdepoble.org)',
  }),
  gl: Object.freeze({
    assumpte: 'Benvido/a a Sóc de Poble · Confirma a túa conta',
    salutacio: 'Ola, {nom}:',
    salutacioGenerica: 'Ola, veciño ou veciña:',
    intro: 'Grazas por rexistrarte en Sóc de Poble, a rede rural feita dende as nosas vilas e sen anuncios nin algoritmos.',
    pobleText: 'A túa conta ficará vinculada á comunidade de {poble} co identificador @{usuari}.',
    instruccio: 'Para activar a túa conta e comezar a participar no Muro, no Chat e nos espazos veciñais, confirma o teu correo premendo na seguinte ligazón:',
    boto: 'Confirmar a miña conta en Sóc de Poble',
    seguretat: 'Se ti non solicitaches esta conta, podes ignorar este correo con total tranquilidade.',
    comiat: 'Unha aperta dende o Mas e benvido/a á casa,',
    signatura: 'O equipo de Sóc de Poble (socdepoble@socdepoble.org)',
  }),
});

export function escapaHtmlCorreu(valor = '') {
  return String(valor ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function validaUrlConfirmacio(url) {
  const crua = String(url ?? '').trim();
  if (!crua) return 'https://socdepoble.org/registre';
  try {
    const parsed = new URL(crua);
    if (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && parsed.hostname === 'localhost')) {
      return 'https://socdepoble.org/registre';
    }
    if (!DOMINIS_CONFIRMACIO_PERMESOS.has(parsed.hostname.toLowerCase())) {
      return 'https://socdepoble.org/registre';
    }
    return parsed.toString();
  } catch {
    return 'https://socdepoble.org/registre';
  }
}

export function generaCorreuBenvinguda({
  nom = '',
  usuari = '',
  poble = 'La Torre de les Maçanes',
  urlConfirmacio = 'https://socdepoble.org/registre',
  llengua = 'ca',
} = {}) {
  const codiLlengua = Object.hasOwn(TEXTOS_PER_LLENGUA, llengua) ? llengua : 'ca';
  const dic = TEXTOS_PER_LLENGUA[codiLlengua];
  const nomNet = String(nom ?? '').trim().slice(0, 120);
  const usuariNet = String(usuari ?? '').trim().replace(/^@+/, '').slice(0, 40) || 'veina';
  const pobleNet = String(poble ?? '').trim().slice(0, 120) || 'La Torre de les Maçanes';
  const urlSegura = validaUrlConfirmacio(urlConfirmacio);

  const salutacio = nomNet ? dic.salutacio.replace('{nom}', () => nomNet) : dic.salutacioGenerica;
  const pobleFrase = dic.pobleText
    .replace('{poble}', () => pobleNet)
    .replace('{usuari}', () => usuariNet);

  const text = [
    salutacio,
    '',
    dic.intro,
    pobleFrase,
    '',
    dic.instruccio,
    urlSegura,
    '',
    dic.seguretat,
    '',
    dic.comiat,
    dic.signatura,
  ].join('\n');

  /* Els clients de correu no entenen les propietats CSS personalitzades: colors literals de la paleta Pedra Seca
     (pedra-100 fons, pedra-300 vora, pedra-800 text, pedra-600 secundari, primary-700 botó; el blanc ja és canònic). */
  const COLORS = {
    fons: /* ALLOW_RAW_COLOR */ '#f8f6f4',
    text: /* ALLOW_RAW_COLOR */ '#22211e',
    vora: /* ALLOW_RAW_COLOR */ '#dcd7cd',
    suau: /* ALLOW_RAW_COLOR */ '#5b564e',
    boto: /* ALLOW_RAW_COLOR */ '#ad4c03',
  };
  const html = [
    `<!doctype html><html lang="${escapaHtmlCorreu(codiLlengua)}"><head><meta charset="utf-8"><title>${escapaHtmlCorreu(dic.assumpte)}</title></head>`,
    `<body style="margin:0;padding:24px;background:${COLORS.fons};color:${COLORS.text};font-family:system-ui,-apple-system,sans-serif;font-size:16px;line-height:1.5;">`,
    `<main style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid ${COLORS.vora};border-radius:12px;padding:24px;">`,
    `<p style="margin:0 0 16px;font-weight:700;font-size:18px;">${escapaHtmlCorreu(salutacio)}</p>`,
    `<p style="margin:0 0 16px;">${escapaHtmlCorreu(dic.intro)}</p>`,
    `<p style="margin:0 0 16px;">${escapaHtmlCorreu(pobleFrase)}</p>`,
    `<p style="margin:0 0 20px;">${escapaHtmlCorreu(dic.instruccio)}</p>`,
    `<p style="margin:0 0 24px;"><a href="${escapaHtmlCorreu(urlSegura)}" rel="noopener noreferrer" style="display:inline-block;padding:12px 20px;background:${COLORS.boto};color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700;">${escapaHtmlCorreu(dic.boto)}</a></p>`,
    `<p style="margin:0 0 16px;font-size:16px;color:${COLORS.suau};">${escapaHtmlCorreu(dic.seguretat)}</p>`,
    `<p style="margin:0;">${escapaHtmlCorreu(dic.comiat)}<br><strong>${escapaHtmlCorreu(dic.signatura)}</strong></p>`,
    '</main></body></html>',
  ].join('');

  return Object.freeze({
    from: `${NOM_REMITENT_CANONIC} <${REMITENT_CORREU_CANONIC}>`,
    replyTo: REMITENT_CORREU_CANONIC,
    llengua: codiLlengua,
    subject: dic.assumpte,
    urlConfirmacio: urlSegura,
    text,
    html,
  });
}
