/**
 * correuBenvinguda.js — Plantilla càlida de correu de benvinguda i confirmació
 * post-registre per a Sóc de Poble (IDEA-72 · Beta Tester Alfredo Llorens Jordá).
 *
 * Proporciona el correu en els 5 idiomes del sistema (ca, es, en, eu, gl) amb
 * assumpte, text pla i HTML editorial Pedra Seca, més la configuració SQL/GoTrue
 * documentada per a Supabase Auth (`auth.templates` / GoTrue).
 */

export const IDIOMA_PER_DEFECTE = 'ca';
export const IDIOMES_CORREU_BENVINGUDA = Object.freeze(['ca', 'es', 'en', 'eu', 'gl']);

const ESCAPA_HTML_MAP = Object.freeze({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
});

export function escapaHtmlCorreu(text = '') {
  return String(text ?? '').replace(/[&<>"']/g, (c) => ESCAPA_HTML_MAP[c]);
}

function urlSeguraCorreu(url, reserva = 'https://socdepoble.org') {
  const neta = String(url ?? '').trim();
  if (!neta) return reserva;
  if (neta === '{{ .ConfirmationURL }}' || neta === '{{ .SiteURL }}') return neta;
  if (/^https?:\/\//i.test(neta)) return neta;
  return reserva;
}

const COPIES_PER_IDIOMA = Object.freeze({
  ca: {
    assumpte: 'Benvingut/da a Sóc de Poble · La plaça digital de la nostra terra',
    salutacio: (nom) => (nom ? `Hola, ${nom}!` : 'Hola, veí o veïna!'),
    intro: (poble) =>
      `Gràcies per registrar-te a Sóc de Poble${poble ? ` des de ${poble}` : ''}. Acabes d'entrar a una plaça pública digital feta des dels nostres pobles, sense anuncis ni algoritmes que ens separen.`,
    confirmacioCta: 'Confirma el teu correu i entra a la plaça',
    passosTitol: '3 passos senzills per començar al teu ritme:',
    passos: [
      {
        titol: '1. El Mur del Poble (/mur)',
        text: 'Descobreix les cròniques, els bàndols municipals, el mercat KM 0 i l’agenda cultural de la comarca.',
      },
      {
        titol: '2. El Xat i la IAIA MarIA (/xat)',
        text: 'Parla amb el veïnat i les associacions, o pregunta qualsevol dubte del dia a dia a la IAIA MarIA.',
      },
      {
        titol: '3. El teu Poble i les Connexions (/pobles)',
        text: 'Connecta amb el teu poble, comerços locals i col·lectius com El Rentonar per fer pinya al territori.',
      },
    ],
    comiat: 'Una abraçada ben forta des de La Torre de les Maçanes i tota la Muntanya d’Alacant,',
    signatura: 'Javi Llinares i la IAIA MarIA · Sóc de Poble',
  },
  es: {
    assumpte: 'Bienvenido/a a Sóc de Poble · La plaza digital de nuestra tierra',
    salutacio: (nom) => (nom ? `¡Hola, ${nom}!` : '¡Hola, vecino o vecina!'),
    intro: (poble) =>
      `Gracias por registrarte en Sóc de Poble${poble ? ` desde ${poble}` : ''}. Acabas de entrar en una plaza pública digital hecha desde nuestros pueblos, sin anuncios ni algoritmos que nos separen.`,
    confirmacioCta: 'Confirma tu correo y entra en la plaza',
    passosTitol: '3 pasos sencillos para empezar a tu ritmo:',
    passos: [
      {
        titol: '1. El Muro del Pueblo (/mur)',
        text: 'Descubre las crónicas, los bandos municipales, el mercado KM 0 y la agenda cultural de la comarca.',
      },
      {
        titol: '2. El Chat y la IAIA MarIA (/xat)',
        text: 'Habla con el vecindario y las asociaciones, o pregunta cualquier duda del día a día a la IAIA MarIA.',
      },
      {
        titol: '3. Tu Pueblo y las Conexiones (/pobles)',
        text: 'Conecta con tu pueblo, comercios locales y colectivos como El Rentonar para hacer piña en el territorio.',
      },
    ],
    comiat: 'Un fuerte abrazo desde La Torre de les Maçanes y toda la Montaña de Alicante,',
    signatura: 'Javi Llinares y la IAIA MarIA · Sóc de Poble',
  },
  en: {
    assumpte: 'Welcome to Sóc de Poble · Our rural digital town square',
    salutacio: (nom) => (nom ? `Hello, ${nom}!` : 'Hello, neighbour!'),
    intro: (poble) =>
      `Thank you for joining Sóc de Poble${poble ? ` from ${poble}` : ''}. You have just stepped into a public digital square built from our villages, free of ads and divisive algorithms.`,
    confirmacioCta: 'Confirm your email and enter the town square',
    passosTitol: '3 simple steps to get started at your own pace:',
    passos: [
      {
        titol: '1. The Village Wall (/mur)',
        text: 'Explore local chronicles, municipal notices, the KM 0 market and the regional cultural calendar.',
      },
      {
        titol: '2. The Chat & IAIA MarIA (/xat)',
        text: 'Talk with neighbours and associations, or ask IAIA MarIA any everyday question.',
      },
      {
        titol: '3. Your Village & Connections (/pobles)',
        text: 'Connect with your village, local shops and collectives like El Rentonar to strengthen our community.',
      },
    ],
    comiat: 'Warm regards from La Torre de les Maçanes and the Alicante Mountains,',
    signatura: 'Javi Llinares & IAIA MarIA · Sóc de Poble',
  },
  eu: {
    assumpte: 'Ongi etorri Sóc de Poblera · Gure herrien plaza digitala',
    salutacio: (nom) => (nom ? `Kaixo, ${nom}!` : 'Kaixo, bizilagun!'),
    intro: (poble) =>
      `Eskerrik asko Sóc de Poblen izena emateagatik${poble ? ` (${poble})` : ''}. Gure herrietatik sortutako plaza publiko digitalean sartu berri zara, iragarkirik eta algoritmo banatzailerik gabe.`,
    confirmacioCta: 'Baieztatu zure posta eta sartu plazara',
    passosTitol: 'Zure erritmoan hasteko 3 urrats erraz:',
    passos: [
      {
        titol: '1. Herriko Horma (/mur)',
        text: 'Ezagutu kronikak, udal bandoak, KM 0 azoka eta eskualdeko kultur agenda.',
      },
      {
        titol: '2. Txata eta IAIA MarIA (/xat)',
        text: 'Hitz egin bizilagunekin eta elkarteekin, edo galdetu eguneroko edozein zalantza IAIA MarIAri.',
      },
      {
        titol: '3. Zure Herria eta Konexioak (/pobles)',
        text: 'Konektatu zure herriarekin, tokiko saltokiekin eta El Rentonar bezalako taldeekin.',
      },
    ],
    comiat: 'Besarkada handi bat La Torre de les Maçanestik,',
    signatura: 'Javi Llinares eta IAIA MarIA · Sóc de Poble',
  },
  gl: {
    assumpte: 'Benvido/a a Sóc de Poble · A praza dixital da nosa terra',
    salutacio: (nom) => (nom ? `Ola, ${nom}!` : 'Ola, veciño ou veciña!'),
    intro: (poble) =>
      `Grazas por rexistrarte en Sóc de Poble${poble ? ` dende ${poble}` : ''}. Acabas de entrar nunha praza pública dixital feita dende as nosas vilas, sen anuncios nin algoritmos que nos separen.`,
    confirmacioCta: 'Confirma o teu correo e entra na praza',
    passosTitol: '3 pasos sinxelos para comezar ao teu ritmo:',
    passos: [
      {
        titol: '1. O Muro da Vila (/mur)',
        text: 'Descubre as crónicas, os bandos municipais, o mercado KM 0 e a axenda cultural da comarca.',
      },
      {
        titol: '2. O Chat e a IAIA MarIA (/xat)',
        text: 'Fala coa veciñanza e as asociacións, ou pregunta calquera dúbida do día a día á IAIA MarIA.',
      },
      {
        titol: '3. A túa Vila e as Conexións (/pobles)',
        text: 'Conecta coa túa vila, comercios locais e colectivos como El Rentonar para facer piña no territorio.',
      },
    ],
    comiat: 'Unha aperta ben forte dende La Torre de les Maçanes,',
    signatura: 'Javi Llinares e a IAIA MarIA · Sóc de Poble',
  },
});

export function normalitzaIdiomaCorreu(idioma = IDIOMA_PER_DEFECTE) {
  const codi = String(idioma ?? '').trim().toLowerCase().slice(0, 2);
  return IDIOMES_CORREU_BENVINGUDA.includes(codi) ? codi : IDIOMA_PER_DEFECTE;
}

/* Paleta del correu: els clients de correu no entenen var(--sdp-*) ni les classes de l'App,
   així que els colors viatgen com a literals en línia (justificats un a un per al Design Guard). */
const COLOR_CORREU = Object.freeze({
  fons: /* ALLOW_RAW_COLOR */ '#F7F5F0',
  text: /* ALLOW_RAW_COLOR */ '#1C1917',
  vora: /* ALLOW_RAW_COLOR */ '#D6D1C7',
  etiqueta: /* ALLOW_RAW_COLOR */ '#4D6B3C',
  text2: /* ALLOW_RAW_COLOR */ '#292524',
  accio: /* ALLOW_RAW_COLOR */ '#2E5A27',
  separador: /* ALLOW_RAW_COLOR */ '#E5E0D5',
  text3: /* ALLOW_RAW_COLOR */ '#44403C',
});

export function generaCorreuBenvinguda({
  nom = '',
  poble = '',
  idioma = IDIOMA_PER_DEFECTE,
  urlConfirmacio = '{{ .ConfirmationURL }}',
  urlPortal = 'https://socdepoble.org',
} = {}) {
  const lang = normalitzaIdiomaCorreu(idioma);
  const copy = COPIES_PER_IDIOMA[lang];
  const nomNet = String(nom ?? '').trim();
  const pobleNet = String(poble ?? '').trim();
  const nomHtml = escapaHtmlCorreu(nomNet);
  const pobleHtml = escapaHtmlCorreu(pobleNet);
  const hrefConfirmacio = escapaHtmlCorreu(urlSeguraCorreu(urlConfirmacio, 'https://socdepoble.org'));
  const hrefPortal = escapaHtmlCorreu(urlSeguraCorreu(urlPortal, 'https://socdepoble.org'));

  const textPla = [
    copy.salutacio(nomNet),
    '',
    copy.intro(pobleNet),
    '',
    `${copy.confirmacioCta}: ${urlSeguraCorreu(urlConfirmacio, 'https://socdepoble.org')}`,
    '',
    copy.passosTitol,
    ...copy.passos.map((p) => `- ${p.titol}: ${p.text}`),
    '',
    copy.comiat,
    copy.signatura,
    urlSeguraCorreu(urlPortal, 'https://socdepoble.org'),
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapaHtmlCorreu(copy.assumpte)}</title>
</head>
<body style="margin:0;padding:24px;background-color:${COLOR_CORREU.fons};color:${COLOR_CORREU.text};font-family:system-ui,-apple-system,sans-serif;line-height:1.6;">
  <main style="max-width:600px;margin:0 auto;background-color:#FFFFFF;border:2px solid ${COLOR_CORREU.vora};border-radius:12px;padding:28px;">
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:${COLOR_CORREU.etiqueta};text-transform:uppercase;letter-spacing:0.04em;">Sóc de Poble</p>
    <header class="page-title">
      <h1 style="margin:0 0 16px;font-size:24px;line-height:1.3;color:${COLOR_CORREU.text};">${copy.salutacio(nomHtml)}</h1>
    </header>
    <p style="margin:0 0 20px;font-size:16px;color:${COLOR_CORREU.text2};">${copy.intro(pobleHtml)}</p>
    <p style="margin:0 0 28px;">
      <a href="${hrefConfirmacio}" style="display:inline-block;padding:14px 24px;background-color:${COLOR_CORREU.accio};color:#FFFFFF;text-decoration:none;font-weight:700;border-radius:8px;">${escapaHtmlCorreu(copy.confirmacioCta)}</a>
    </p>
    <h2 style="margin:0 0 12px;font-size:18px;color:${COLOR_CORREU.text};">${escapaHtmlCorreu(copy.passosTitol)}</h2>
    <ol style="margin:0 0 24px;padding-left:20px;color:${COLOR_CORREU.text2};">
      ${copy.passos
        .map(
          (p) =>
            `<li style="margin-bottom:12px;"><strong>${escapaHtmlCorreu(p.titol)}:</strong> ${escapaHtmlCorreu(p.text)}</li>`
        )
        .join('\n      ')}
    </ol>
    <hr style="border:0;border-top:1px solid ${COLOR_CORREU.separador};margin:24px 0;" />
    <p style="margin:0 0 4px;font-size:16px;color:${COLOR_CORREU.text3};">${escapaHtmlCorreu(copy.comiat)}</p>
    <p style="margin:0 0 12px;font-size:16px;font-weight:700;color:${COLOR_CORREU.text};">${escapaHtmlCorreu(copy.signatura)}</p>
    <p style="margin:0;font-size:16px;"><a href="${hrefPortal}" style="color:${COLOR_CORREU.accio};font-weight:600;">${hrefPortal}</a></p>
  </main>
</body>
</html>`;

  return {
    idioma: lang,
    assumpte: copy.assumpte,
    textPla,
    html,
    signatura: copy.signatura,
  };
}

/**
 * Plantilla documentada per a Supabase Auth / GoTrue (confirmació d'alta amb
 * benvinguda càlida). Es pot aplicar al panell d'Email Templates de Supabase
 * o al config.toml / variables d'entorn de GoTrue.
 */
export const PLANTILLA_SUPABASE_AUTH_TEMPLATES_SQL = `-- IDEA-72 · Plantilla de correu de benvinguda i confirmació post-registre (Sóc de Poble)
-- Nota: En Supabase Cloud / self-hosted GoTrue, copia l'assumpte i l'HTML generat per
-- generaCorreuBenvinguda({ idioma: 'ca', urlConfirmacio: '{{ .ConfirmationURL }}' })
-- a Authentication -> Email Templates -> Confirm signup.
SELECT
  'Benvingut/da a Sóc de Poble · La plaça digital de la nostra terra' AS subject,
  '{{ .ConfirmationURL }}' AS confirmation_url_token;
`;
