/* P0-SEO-UNIVERSAL (ordre del Mestre, 13-11-2026) · Les metadades socials de la
   fitxa pública d'una persona, una entitat, un grup o una IA: una sola regla
   per a qui les escriu, el client (sections/profile/PerfilPublicSection.jsx) i
   el prerender del build (tooling/seo/perfils-socials.mjs i
   build-social-manifest.mjs). Si divergiren, el head que Firebase servix a
   WhatsApp (dist/<ruta>/index.html) diria una cosa i l'app una altra.
   Pur i carregable des de Node: només importa mòduls purs (cap React).

   Privadesa · D'un perfil només es lligen el nom, el lema, la bio, la portada,
   l'avatar, el tipus, l'id i el slug. Mai el correu, el poble, les dates, la
   presentació en HTML ni cap altre camp: el que no entra ací no pot eixir al
   <head> estàtic. */
import { CAP_SOCIAL_BASE, primeraImatgeSocial } from './imatgeSocial.js';
import { LIMIT_DESCRIPCIO, LIMIT_TITOL, textPla } from './metadadesSocials.js';
import { RUTA_FITXA_IAIA, rutaCanonicaDePerfil, rutaDePerfil } from './navigation.js';
import {
  AGENTS_IA_SEED, ENTITAT_PILOT_SLUG, ENTITATS_SEED, IDS_REMOTS_FUNDACIONALS, PERSONA_PILOT
} from '../data/identitatsSeed.js';

const text = (valor) => (typeof valor === 'string' ? valor.trim() : '');
const minuscules = (valor) => String(valor ?? '').trim().toLowerCase();

/** La forma d'un UUID (l'id d'una fila del servidor). Un slug amb esta forma no és mai una clau. */
export const FORMA_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Les claus que el paquet reserva per a les seues identitats: l'id, el slug i
   cada àlies de la persona pilot, de cada entitat del padró i de cada IA, amb
   els ids remots que el Mestre haja declarat. Derivades de la llavor, mai
   escrites ací, llevat de dos amb motiu:
     · 'soc-de-poble', el slug històric de l'entitat pilot (identitatsSeed.js,
       capçalera): enllaços vells encara el porten;
     · el primer tram de RUTA_FITXA_IAIA ('iaia'), l'adreça neta de la IAIA.
   El CHECK de organizations.slug admet qualsevol d'elles ('javi', '0001',
   'iaia-maria' o la forma d'un UUID) i qualsevol membre pot crear una empresa:
   sense esta guarda, la fitxa i la targeta d'una identitat del paquet serien
   de qui registrara el seu slug. Mapa: clau en minúscules → ids declarats per
   la identitat que la reserva. */
function reservaDelPaquet() {
  const mapa = new Map();
  const declara = (claus, nomesReservades = []) => {
    const ids = new Set(claus.map(minuscules).filter(Boolean));
    for (const clau of [...ids, ...nomesReservades.map(minuscules)]) if (!mapa.has(clau)) mapa.set(clau, ids);
  };
  declara([PERSONA_PILOT.id, PERSONA_PILOT.slug, ...PERSONA_PILOT.alies, ...(IDS_REMOTS_FUNDACIONALS[PERSONA_PILOT.slug] || [])]);
  for (const entitat of ENTITATS_SEED) {
    declara([entitat.id, entitat.slug, ...(entitat.alies || []), ...(IDS_REMOTS_FUNDACIONALS[entitat.slug] || [])],
      entitat.slug === ENTITAT_PILOT_SLUG ? ['soc-de-poble'] : []);
  }
  for (const agent of AGENTS_IA_SEED) declara([agent.id, agent.slug], [RUTA_FITXA_IAIA.slice(1)]);
  return mapa;
}
const RESERVA = reservaDelPaquet();

/** Les claus reservades pel paquet (en minúscules), per a qui les ha de recórrer (el build i les proves). */
export const CLAUS_RESERVADES = Object.freeze([...RESERVA.keys()]);

/**
 * Si el slug d'una fitxa pot fer de clau pública (/empresa/<slug>): no té la
 * forma d'un UUID (seria l'adreça per id d'una altra fitxa) i, si és una clau
 * reservada pel paquet, l'id de la fitxa és un dels que eixa identitat
 * declara. Si no, la fitxa només ix pel seu id.
 */
export function slugPotSerClau(slug, id) {
  const clau = minuscules(slug);
  if (!clau || FORMA_UUID.test(clau)) return false;
  const declarats = RESERVA.get(clau);
  return !declarats || declarats.has(minuscules(id));
}

/** Si una clau està reservada pel paquet per a una identitat que NO és la d'este id. */
export function esClauReservadaPerAUnAltre(clau, id) {
  const declarats = RESERVA.get(minuscules(clau));
  return Boolean(declarats) && !declarats.has(minuscules(id));
}

/** La clau pública d'una fitxa: el slug si pot ser clau i, si no, l'id. '' sense cap dels dos. */
export function clauPublicaDePerfil(perfil) {
  const id = perfil?.id == null ? '' : String(perfil.id).trim();
  const slug = text(perfil?.slug);
  return slug && slugPotSerClau(slug, id) ? slug : id;
}

/**
 * L'adreça canònica ÚNICA d'una fitxa pública: la neta d'una identitat del
 * Mestre o de la IAIA (rutaCanonicaDePerfil: /javillinares, /socdepoble,
 * /rentonar, /iaia) o, per a la resta, la de la seua família amb la clau
 * pública (rutaDePerfil: /empresa/<slug>, /grup/<slug>, /gent/<id>,
 * /perfil/<id>). La resta d'adreces que el Router accepta per a la mateixa
 * fitxa (els altres prefixos, l'id) en són àlies. null sense id.
 */
export function rutaPublicaDePerfil(perfil) {
  if (!perfil || typeof perfil !== 'object') return null;
  return rutaCanonicaDePerfil(perfil) || rutaDePerfil(perfil.tipus, clauPublicaDePerfil(perfil));
}

/** El @type de schema.org d'una fitxa: Person, Organization o, per a una IA, SoftwareApplication. */
export function schemaDePerfil(perfil) {
  if (perfil?.tipus === 'persona') return 'Person';
  return perfil?.tipus === 'ia' || perfil?.esIA === true ? 'SoftwareApplication' : 'Organization';
}

/**
 * Si la fitxa s'indexa a l'adreça `ruta` (la seua canònica): hui, una fitxa
 * publicada fora de la família /perfil, que és sense indexar per decisió
 * (useSEO.js · PRIVATE i publication-policy.mjs · PRIVATE_ROUTES). Un sol lloc
 * per a girar-ho al client i al build alhora (D-SEO-18).
 */
export function indexDePerfil(perfil, ruta) {
  const primerTram = String(ruta ?? '').replace(/^\/+/, '').split(/[/?#]/)[0];
  return Boolean(perfil?.publicat) && primerTram !== '' && primerTram !== 'perfil';
}

/* Una sola candidata pel selector compartit (imatgeSocial.js): torna l'estat
   ('triada', 'bloquejada' o 'absent') i mai compta una reserva (la marca de
   Sóc de Poble, la panoràmica per defecte). */
const candidata = (ref, opcions) => primeraImatgeSocial('mur', { imageSrc: typeof ref === 'string' ? ref : '' }, opcions);

/**
 * La imatge social d'una fitxa: la portada i, sense portada, l'avatar o el
 * logotip (ací l'avatar SÍ que és la imatge: és l'excepció a la regla de les
 * publicacions). Si la primera que hi ha no es pot servir, queda 'bloquejada':
 * mai es passa a la segona.
 */
export function imatgeDePerfil(perfil, opcions) {
  const portada = candidata(perfil?.hero, opcions);
  return portada.estat !== 'absent' ? portada : candidata(perfil?.avatar, opcions);
}

/**
 * Les metadades del <head> d'una fitxa pública, amb la forma de
 * metadadesDePagina:
 *   · title: el nom;
 *   · description: el lema o, sense, la bio; sense cap dels dos, la de
 *     CAP_SOCIAL_BASE;
 *   · imatge: imatgeDePerfil, amb l'estat;
 *   · image: la del <head> (una 'triada', amb el nom com a alt) o null.
 * `opcions` són les d'urlSocialDe (origen, supabaseUrl, permesos).
 */
export function metadadesDePerfil(perfil, opcions) {
  const fitxa = perfil && typeof perfil === 'object' ? perfil : {};
  const title = textPla(fitxa.nom, LIMIT_TITOL);
  const imatge = imatgeDePerfil(fitxa, opcions);
  return {
    title,
    description: textPla(fitxa.lema, LIMIT_DESCRIPCIO) || textPla(fitxa.bio, LIMIT_DESCRIPCIO) || CAP_SOCIAL_BASE.description,
    imatge,
    image: imatge.estat === 'triada' ? (title ? { url: imatge.url, alt: title } : imatge.url) : null
  };
}
