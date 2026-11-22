/**
 * i18nFitxaComunitatForaster.js · Onada R32.35b · DOL-56
 * Textos hospitalaris i honestos en les 5 llengües oficials (ca, es, en, eu, gl)
 * per a FitxaComunitat quan el Foraster navega sense sessió (`/xat?comunitat=...`):
 * evita dir falsament «Grups als quals pertanys» i convertix el botó del peu en
 * una eixida directa cap a l'entrada amb retorn exacte a la comunitat.
 */

const TEXTOS = Object.freeze({
  ca: Object.freeze({
    grupsComunitat: 'Grups d’esta comunitat',
    buitForaster: 'Pots explorar els canals oberts d’esta comunitat. Entra o registra’t per a parlar-hi.',
    entrarParticipar: 'Entrar o registrar-se',
  }),
  es: Object.freeze({
    grupsComunitat: 'Grupos de esta comunidad',
    buitForaster: 'Puedes explorar los canales abiertos de esta comunidad. Entra o regístrate para participar.',
    entrarParticipar: 'Entrar o registrarse',
  }),
  en: Object.freeze({
    grupsComunitat: 'Groups in this community',
    buitForaster: 'You can explore the open channels in this community. Sign in or sign up to join the conversation.',
    entrarParticipar: 'Sign in or sign up',
  }),
  eu: Object.freeze({
    grupsComunitat: 'Komunitate honetako taldeak',
    buitForaster: 'Komunitate honetako kanal irekiak arakatu ditzakezu. Sartu edo erregistratu parte hartzeko.',
    entrarParticipar: 'Sartu edo erregistratu',
  }),
  gl: Object.freeze({
    grupsComunitat: 'Grupos desta comunidade',
    buitForaster: 'Podes explorar as canles abertas desta comunidade. Entra ou rexístrate para participar.',
    entrarParticipar: 'Entrar ou rexistrarse',
  }),
});

export function textosFitxaComunitatForaster(locale = 'ca-ES') {
  const codi = String(locale || 'ca').trim().toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(TEXTOS, codi) ? TEXTOS[codi] : TEXTOS.ca;
}
