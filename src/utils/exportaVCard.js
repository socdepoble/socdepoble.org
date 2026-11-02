/**
 * exportaVCard.js · IDEA-25 i IDEA-45 (Llibre Mestre, Fita 23: «Secció de
 * Contacte = vCard estàndard universal (.vcf)») · La porta universal de la
 * targeta de contacte: una fitxa pública (persona, entitat o grup) dona el
 * text .vcf, o null.
 *
 * Una sola font de veritat: la gramàtica vCard 3.0 (escapament de \\, «,», «;»
 * i salts de línia, controls i bidi fora, plegat a 75 octets, CRLF, tipus MIME,
 * nom del fitxer i descàrrega) i la targeta d'una organització són les de
 * sections/profile/vcardOrganitzacio.js. Ací només hi ha el que no existia: la
 * targeta d'una persona (IDEA-25) i l'adaptador que tria la de cada fitxa.
 *
 * Kit de Gemini (Onada 2, 261101), auditat i refet a mà: fora la còpia de la
 * gramàtica, el telèfon (deixava passar salts de línia), el carrer i el codi
 * postal (el model encara no els té: quan existisquen, entren a
 * vcardOrganitzacio.js), el correu i l'adreça d'una persona, el TITLE amb la
 * bio (fins a 500 caràcters) i els cognoms endevinats.
 *
 * Privacitat (RGPD, minimització): la targeta d'una persona només porta el
 * que la seua fitxa publicada ja ensenya a tothom (el nom, el @usuari en la
 * forma del servidor, la bio, el lema i l'URL de la fitxa). Mai cap correu,
 * telèfon ni adreça postal, ni tan sols el poble, que no és cap domicili: la
 * funció no els accepta.
 *
 * Consumidor: FitxaPublica (sections/profile/PerfilPublicSection.jsx), per a
 * les organitzacions i les persones publicades, des de la marató 261101_2143
 * (B4: IDEA-25 i V-03, ordre del Mestre 261101 21:41). Pur: cap petició ni
 * cap servidor.
 *
 * Capes: és l'únic mòdul de src/utils que importa de src/sections (la font de
 * la gramàtica i FORMA_USERNAME hi viuen). El camí ve del kit; el lloc natural
 * seria sections/profile, al costat de vcardOrganitzacio.js.
 */
import { FORMA_USERNAME } from '../sections/onboarding/onboardingModel.js';
import { urlExterna } from '../data/origenNota.js';
import { escapaValor, plega, vcardDOrganitzacio } from '../sections/profile/vcardOrganitzacio.js';

/* La resta de la porta (tipus MIME, nom del fitxer i descàrrega): les
   mateixes funcions, no cap còpia. */
export { TIPUS_VCARD, desaVcard, nomFitxerVcard } from '../sections/profile/vcardOrganitzacio.js';

const CRLF = '\r\n';
const text = (valor) => (typeof valor === 'string' ? valor : '');

/**
 * El text .vcf d'una persona, o null si no té nom.
 * N porta el nom sencer com a nom de pila: els cognoms no s'endevinen
 * («Maria del Mar Pla» no és «Maria» + «del Mar Pla»).
 * @param {{ nom?: string, usuari?: string, bio?: string, lema?: string, url?: string }} fitxa
 * @returns {string|null}
 */
export function vcardDePersona({ nom, usuari, bio, lema, url } = {}) {
  const nomNet = escapaValor(text(nom));
  if (!nomNet) return null;
  const linies = ['BEGIN:VCARD', 'VERSION:3.0', `N:;${nomNet};;;`, `FN:${nomNet}`];
  // El @usuari, només en la forma del servidor (com l'etiqueta de la fitxa).
  if (typeof usuari === 'string' && FORMA_USERNAME.test(usuari)) linies.push(`NICKNAME:@${usuari}`);
  // La bio (H2) i el lema (entradilla), en l'ordre de la fitxa, en una nota.
  const nota = [bio, lema].map((part) => escapaValor(text(part))).filter(Boolean).join('\\n');
  if (nota) linies.push(`NOTE:${nota}`);
  /* Una URI, no un text: no s'escapa (URL, RFC 2426 §3.6.8; valor uri, RFC
     2425 §5.8.4). Només http(s), sense credencials, espais ni controls
     (urlExterna). */
  const web = urlExterna(url);
  if (web) linies.push(`URL:${web}`);
  linies.push('END:VCARD');
  return `${linies.map(plega).join(CRLF)}${CRLF}`;
}

/**
 * La targeta d'una fitxa pública, o null. Una entitat o un grup: la de
 * vcardDOrganitzacio (el correu només si té forma vàlida). Una persona: la
 * de vcardDePersona. Cap targeta d'una IA, d'una fitxa no publicada ni de cap
 * altre tipus.
 * @param {object} perfil DTO de loadPerfilPublic
 * @param {{ poble?: string, url?: string }} [opcions] el poble que ensenya la
 *   fitxa ('' si no n'ensenya cap: mana sobre el del DTO; sense l'opció, el
 *   del DTO) i la seua adreça canònica
 * @returns {string|null}
 */
export function vcardDePerfilPublic(perfil, { poble, url } = {}) {
  // Un text, un número o null no porten la marca de publicada.
  if (perfil?.publicat !== true || perfil.esIA) return null;
  if (perfil.tipus === 'entitat' || perfil.tipus === 'grup') {
    return vcardDOrganitzacio({ nom: perfil.nom, poble: poble ?? perfil.poble, correu: perfil.correu, url });
  }
  if (perfil.tipus === 'persona') {
    return vcardDePersona({ nom: perfil.nom, usuari: perfil.usuari, bio: perfil.bio, lema: perfil.lema, url });
  }
  // Cap altre tipus («ia», el de les IA del catàleg, o un de desconegut).
  return null;
}
