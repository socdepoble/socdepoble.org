export const FONT_COMPATIBILITAT_TLS = 'https://supabase.com/docs/guides/security/tls#removal-of-cbc-mode-ciphers';

const COMPATIBILITAT_TLS = {
  ca: {
    title: 'Compatibilitat de connexió',
    subtitle: 'Avís sobre la retirada dels xifrats TLS 1.2 CBC a les connexions HTTPS',
    lead: 'Supabase ha anunciat la retirada de quatre xifrats antics TLS 1.2 CBC de les API HTTP dels projectes, a partir del 10 de novembre de 2026 com a molt prompte. Alguns mòbils molt antics, com els que encara utilitzen Android 4.4, iOS 9 o versions anteriors, poden quedar afectats. Si el navegador no admet TLS 1.3 ni cap dels xifrats TLS 1.2 que es mantenen, no podrà establir una connexió HTTPS amb estes API encara que tinga cobertura.',
    bodyHtml: 'Supabase ha anunciat la <strong>retirada de quatre xifrats antics TLS 1.2 CBC</strong> de les API HTTP dels projectes, a partir del <strong>10 de novembre de 2026</strong> com a molt prompte. Alguns <strong>mòbils molt antics</strong>, com els que encara utilitzen Android 4.4, iOS 9 o versions anteriors, poden quedar afectats. Si el navegador <strong>no admet TLS 1.3</strong> ni cap dels xifrats TLS 1.2 que es mantenen, <strong>no podrà establir una connexió HTTPS</strong> amb estes API <strong>encara que tinga cobertura</strong>.',
    font: 'Avís de compatibilitat de Supabase'
  },
  es: {
    title: 'Compatibilidad de conexión',
    subtitle: 'Aviso sobre la retirada de los cifrados TLS 1.2 CBC en las conexiones HTTPS',
    lead: 'Supabase ha anunciado la retirada de cuatro cifrados antiguos TLS 1.2 CBC de las API HTTP de los proyectos, a partir del 10 de noviembre de 2026 como pronto. Algunos móviles muy antiguos, como los que aún usan Android 4.4, iOS 9 o versiones anteriores, pueden verse afectados. Si el navegador no admite TLS 1.3 ni ninguno de los cifrados TLS 1.2 que se mantienen, no podrá establecer una conexión HTTPS con estas API aunque tenga cobertura.',
    bodyHtml: 'Supabase ha anunciado la <strong>retirada de cuatro cifrados antiguos TLS 1.2 CBC</strong> de las API HTTP de los proyectos, a partir del <strong>10 de noviembre de 2026</strong> como pronto. Algunos <strong>móviles muy antiguos</strong>, como los que aún usan Android 4.4, iOS 9 o versiones anteriores, pueden verse afectados. Si el navegador <strong>no admite TLS 1.3</strong> ni ninguno de los cifrados TLS 1.2 que se mantienen, <strong>no podrá establecer una conexión HTTPS</strong> con estas API <strong>aunque tenga cobertura</strong>.',
    font: 'Aviso de compatibilidad de Supabase'
  },
  en: {
    title: 'Connection compatibility',
    subtitle: 'Notice on the removal of legacy TLS 1.2 CBC ciphers from HTTPS connections',
    lead: 'Supabase has announced that it will remove four legacy TLS 1.2 CBC cipher suites from project HTTP APIs, starting no earlier than 10 November 2026. Some very old phones, such as those still running Android 4.4, iOS 9 or earlier versions, may be affected. A browser that supports neither TLS 1.3 nor any remaining TLS 1.2 cipher suite will be unable to establish an HTTPS connection to these APIs even with network coverage.',
    bodyHtml: 'Supabase has announced that it will <strong>remove four legacy TLS 1.2 CBC cipher suites</strong> from project HTTP APIs, starting no earlier than <strong>10 November 2026</strong>. Some <strong>very old phones</strong>, such as those still running Android 4.4, iOS 9 or earlier versions, may be affected. A browser that <strong>supports neither TLS 1.3</strong> nor any remaining TLS 1.2 cipher suite will be <strong>unable to establish an HTTPS connection</strong> to these APIs <strong>even with network coverage</strong>.',
    font: 'Supabase compatibility notice'
  },
  gl: {
    title: 'Compatibilidade de conexión',
    subtitle: 'Aviso sobre a retirada dos cifrados TLS 1.2 CBC nas conexións HTTPS',
    lead: 'Supabase anunciou a retirada de catro cifrados antigos TLS 1.2 CBC das API HTTP dos proxectos, a partir do 10 de novembro de 2026 como moi cedo. Algúns móbiles moi antigos, como os que aínda usan Android 4.4, iOS 9 ou versións anteriores, poden verse afectados. Se o navegador non admite TLS 1.3 nin ningún dos cifrados TLS 1.2 que se manteñen, non poderá establecer unha conexión HTTPS con estas API aínda que teña cobertura.',
    bodyHtml: 'Supabase anunciou a <strong>retirada de catro cifrados antigos TLS 1.2 CBC</strong> das API HTTP dos proxectos, a partir do <strong>10 de novembro de 2026</strong> como moi cedo. Algúns <strong>móbiles moi antigos</strong>, como os que aínda usan Android 4.4, iOS 9 ou versións anteriores, poden verse afectados. Se o navegador <strong>non admite TLS 1.3</strong> nin ningún dos cifrados TLS 1.2 que se manteñen, <strong>non poderá establecer unha conexión HTTPS</strong> con estas API <strong>aínda que teña cobertura</strong>.',
    font: 'Aviso de compatibilidade de Supabase'
  },
  eu: {
    title: 'Konexioaren bateragarritasuna',
    subtitle: 'HTTPS konexioetatik TLS 1.2 CBC zifratze zaharrak kentzeari buruzko oharra',
    lead: 'Supabasek iragarri du proiektuen HTTP APIetatik TLS 1.2 CBCko lau zifratze-multzo zahar kenduko dituela, 2026ko azaroaren 10etik aurrera, data hori baino lehenago ez. Telefono oso zahar batzuei eragin diezaieke, Android 4.4, iOS 9 edo aurreko bertsioak dituztenei, esaterako. Nabigatzaileak ez badu TLS 1.3 onartzen eta mantenduko diren TLS 1.2ko zifratze-multzoetako bat ere onartzen ez badu, ezingo du API horiekin HTTPS konexiorik ezarri, estaldura izan arren.',
    bodyHtml: 'Supabasek iragarri du proiektuen HTTP APIetatik <strong>TLS 1.2 CBCko lau zifratze-multzo zahar</strong> kenduko dituela, <strong>2026ko azaroaren 10etik aurrera</strong>, data hori baino lehenago ez. <strong>Telefono oso zahar</strong> batzuei eragin diezaieke, Android 4.4, iOS 9 edo aurreko bertsioak dituztenei, esaterako. Nabigatzaileak <strong>ez badu TLS 1.3 onartzen</strong> eta mantenduko diren TLS 1.2ko zifratze-multzoetako bat ere onartzen ez badu, <strong>ezingo du API horiekin HTTPS konexiorik ezarri</strong>, <strong>estaldura izan arren</strong>.',
    font: 'Supabaseren bateragarritasun-oharra'
  }
};

const translations = Object.fromEntries(Object.entries(COMPATIBILITAT_TLS).map(([language, { title, subtitle, lead, bodyHtml, font }]) => [
  language,
  { title, subtitle, lead, font, language, html: `<p>${bodyHtml}</p><p><a href="${FONT_COMPATIBILITAT_TLS}" target="_blank" rel="noopener noreferrer">${font}</a></p>` }
]));

// La pantalla i la Frontissa lligen el mateix text.
export const PAGINA_DISPOSITIUS = { ...translations.ca, contentLanguage: 'ca', translations };

export function compatibilitatDispositius(language) {
  return Object.hasOwn(translations, language) ? translations[language] : translations.ca;
}
