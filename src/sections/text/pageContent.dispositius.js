export const FONT_COMPATIBILITAT_TLS = 'https://supabase.com/docs/guides/security/tls#removal-of-cbc-mode-ciphers';

const COMPATIBILITAT_TLS = {
  ca: {
    title: 'Compatibilitat de connexió',
    lead: 'Supabase ha anunciat la retirada de quatre xifrats antics TLS 1.2 CBC de les API HTTP dels projectes, a partir del 10 de novembre de 2026 com a molt prompte. Alguns mòbils molt antics, com els que encara usen Android 4.4, iOS 9 o versions anteriors, poden quedar afectats. Si el navegador no admet TLS 1.3 ni cap dels xifrats TLS 1.2 que es mantenen, no podrà establir una connexió HTTPS amb estes API encara que tinga cobertura.',
    font: 'Avís de compatibilitat de Supabase'
  },
  es: {
    title: 'Compatibilidad de conexión',
    lead: 'Supabase ha anunciado la retirada de cuatro cifrados antiguos TLS 1.2 CBC de las API HTTP de los proyectos, a partir del 10 de noviembre de 2026 como pronto. Algunos móviles muy antiguos, como los que aún usan Android 4.4, iOS 9 o versiones anteriores, pueden verse afectados. Si el navegador no admite TLS 1.3 ni ninguno de los cifrados TLS 1.2 que se mantienen, no podrá establecer una conexión HTTPS con estas API aunque tenga cobertura.',
    font: 'Aviso de compatibilidad de Supabase'
  },
  en: {
    title: 'Connection compatibility',
    lead: 'Supabase has announced that it will remove four legacy TLS 1.2 CBC cipher suites from project HTTP APIs, starting no earlier than 10 November 2026. Some very old phones, such as those still running Android 4.4, iOS 9 or earlier versions, may be affected. A browser that supports neither TLS 1.3 nor any remaining TLS 1.2 cipher suite will be unable to establish an HTTPS connection to these APIs even with network coverage.',
    font: 'Supabase compatibility notice'
  },
  gl: {
    title: 'Compatibilidade de conexión',
    lead: 'Supabase anunciou a retirada de catro cifrados antigos TLS 1.2 CBC das API HTTP dos proxectos, a partir do 10 de novembro de 2026 como moi cedo. Algúns móbiles moi antigos, como os que aínda usan Android 4.4, iOS 9 ou versións anteriores, poden verse afectados. Se o navegador non admite TLS 1.3 nin ningún dos cifrados TLS 1.2 que se manteñen, non poderá establecer unha conexión HTTPS con estas API aínda que teña cobertura.',
    font: 'Aviso de compatibilidade de Supabase'
  },
  eu: {
    title: 'Konexioaren bateragarritasuna',
    lead: 'Supabasek iragarri du proiektuen HTTP APIetatik TLS 1.2 CBCko lau zifratze-multzo zahar kenduko dituela, 2026ko azaroaren 10etik aurrera, data hori baino lehenago ez. Telefono oso zahar batzuei eragin diezaieke, Android 4.4, iOS 9 edo aurreko bertsioak dituztenei, esaterako. Nabigatzaileak ez badu TLS 1.3 onartzen eta mantenduko diren TLS 1.2ko zifratze-multzoetako bat ere onartzen ez badu, ezingo du API horiekin HTTPS konexiorik ezarri, estaldura izan arren.',
    font: 'Supabaseren bateragarritasun-oharra'
  }
};

const translations = Object.fromEntries(Object.entries(COMPATIBILITAT_TLS).map(([language, { title, lead, font }]) => [
  language,
  { title, lead, font, language, html: `<p>${lead}</p><p><a href="${FONT_COMPATIBILITAT_TLS}" target="_blank" rel="noopener noreferrer">${font}</a></p>` }
]));

// La pantalla i la Frontissa lligen el mateix text.
export const PAGINA_DISPOSITIUS = { ...translations.ca, contentLanguage: 'ca', translations };

export function compatibilitatDispositius(language) {
  return Object.hasOwn(translations, language) ? translations[language] : translations.ca;
}
