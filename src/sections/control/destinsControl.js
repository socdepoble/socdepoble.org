/**
 * destinsControl.js · P5 · Onada 4 (PRD «Control amb targetes il·lustrades
 * de doble acció», aprovat pel Mestre el 261003) · Les sis targetes de
 * publicació del Panell de Control i on porta cada porta.
 *
 * ESMENA 261003 22:34 (directrius 261003_2234 i 261003_2245 del Mestre,
 * transmeses per MarIA) · Les targetes són UniversalCards estàndard, no
 * vinyetes:
 *   · Títol, subtítol i entradilla visibles, amb els textos literals de 2245.
 *     No es copien ací: viuen a PAGE_COPY (sections/text/pageContent.js),
 *     que també pinta la UniversalPage de cada targeta. Una sola font per a
 *     la targeta i la seua pàgina, i la mateixa data a la boina i a la barra.
 *   · La boina és l'entitat socdepoble, no la IAIA. Tocar l'autor (tret de
 *     la data i l'hora) obri el seu xat corporatiu, el missatge directe de
 *     l'entitat (/xat?amb=<id>, com «Escriu-li al xat» de la seua fitxa,
 *     PerfilPublicSection): el suport humà.
 *   · Saber-ne més → la UniversalPage de la targeta (/page/<clau>), per a les
 *     sis. Publicar → el Bloc (/notes) per al Mur; per a la resta encara no hi
 *     ha cap camí d'escriptura (null): la porta es pinta inerta i ho diu.
 *
 * Una sola taula: { id, pagina, imatge, icona, publicar, seccio, noms }. Els
 * noms de les portes són parells [clau i18n, text en valencià]; el valencià
 * és la reserva de qui el crida. Cap ruta fictícia: encendre Publicar el dia
 * que hi haja editor serà canviar UNA dada d'esta taula (F4).
 *   · Mur: Publicar → /notes (D6: el Bloc, on hi ha l'editor universal i el
 *     «Publicar» real cap al Mur).
 *   · Mercat i Calendari: la secció existix (seccio), però encara no s'hi pot
 *     publicar des d'ací.
 *   · Mapa, Vehicle Compartit i Animalets (W4-04): sense secció ni camí
 *     d'escriptura, «EN OBRES». No hi ha ruta /mapa: el mapa del territori
 *     viu dins del Mur, sense URL.
 *   · Noms de les portes (D10): «Publicar al Mur»; Vehicle Compartit i
 *     Animalets, amb dos punts, per a conservar literal el títol.
 *   · Imatges: les il·lustracions Nano de public/assets/nano_cards (Mur,
 *     Mercat i Calendari) i les vinyetes dels plugins de
 *     public/assets/ui/plugins (Mapa, Vehicle Compartit, Animalets, Treball i
 *     Habitatge). Un destí sense imatge pinta la seua `icona` a la insígnia
 *     lateral (squareBadge), com les targetes de sempre sense foto; hui no
 *     n'hi ha cap.
 *   · W4-08 (261004) · Treball i Habitatge, afegits per MarIA, a les
 *     posicions 7 i 8: la mateixa anatomia i Publicar inert («en obres»).
 *
 * Sense estat ni xarxa: les icones hi són com a referència i es pinten a
 * ControlSection.
 *
 * P6 · Onada 4, sisena passada (directriu 261003_2325 del Mestre) ·
 *   · Cap etiqueta a les targetes ni a les sis pàgines: «en obres» ja no és
 *     cap píndola, és la porta Publicar inerta (aria-disabled, «(en obres)»
 *     al nom i el toast). enObres() continua dient quines ho estan.
 *   · El gran botó «Publicar» de cada pàgina (PublicarDeLaPagina.jsx) ix
 *     d'esta mateixa taula (destiDePagina + portesDe): cap segona font.
 *   · W4-09 (auditoria de Codex) · La boina ja no porta l'enllaç fix: l'id de
 *     llavor ('socdepoble') no és el de cap entitat del servidor, i en remot
 *     arribava literal a una RPC que exigix un UUID. XAT_SOCDEPOBLE és només
 *     el xat de la llavor; l'enllaç el resol xatCorporatiu.js pel port del
 *     backend.
 */
import { getSectionListPath } from '../../config/navigation.js';
import { dataHoraDeBarra } from '../../components/universal/editorial.js';
import { ENTITAT_PILOT_ID, entitatSeed } from '../../data/identitatsSeed.js';
import { PAGE_COPY } from '../text/pageContent.js';

/** Les claus i els textos comuns de les portes i de la graella. */
export const TEXTOS_PORTES = Object.freeze({
  titol: Object.freeze(['section.control.destins', 'Publica al poble']),
  publicar: Object.freeze(['section.control.porta.publicar', 'Publicar']),
  saberMes: Object.freeze(['section.control.porta.saberMes', 'Saber-ne més']),
  enObres: Object.freeze(['section.control.porta.enObres', '(en obres)']),
  avis: Object.freeze(['section.control.porta.avis', '“{nom}” encara està en obres.'])
});

/* La boina de les targetes de sistema: l'entitat socdepoble del padró
   (identitatsSeed.js, la taula única de correspondència).
   W4-09 · XAT_SOCDEPOBLE és el xat de la LLAVOR: l'id 'socdepoble' només el
   resol el xat local. En remot, l'enllaç de l'autor el resol
   xatCorporatiu.js amb el port del backend (l'entitat real, amb UUID); sense
   resoldre, l'autor no és cap enllaç. Per això AUTORIA_SOCDEPOBLE no porta
   authorHref. Cap prova d'ací acredita atenció humana del backend. */
const ENTITAT = entitatSeed(ENTITAT_PILOT_ID);
export const XAT_SOCDEPOBLE = `/xat?amb=${encodeURIComponent(ENTITAT.id)}`;
export const AUTORIA_SOCDEPOBLE = Object.freeze({
  author: ENTITAT.name,
  location: ENTITAT.town_name,
  avatarUrl: ENTITAT.logo_url
});

/** La ruta de la UniversalPage d'una pàgina de PAGE_COPY (PageDetailSection). */
export const rutaDePagina = (clau) => `/page/${encodeURIComponent(clau)}`;

const IMATGES = '/assets/nano_cards';

const desti = ({ id, pagina, imatge = null, icona = null, publicar = null, seccio = null, nomPublicar, nomSaber }) => Object.freeze({
  id,
  pagina,
  imatge,
  icona,
  publicar,
  saberMes: rutaDePagina(pagina),
  seccio,
  noms: Object.freeze({
    publicar: Object.freeze([`section.control.${id}.publicar`, nomPublicar]),
    saberMes: Object.freeze([`section.control.${id}.saberMes`, nomSaber])
  })
});

/* L'ordre és el de la graella, el del DOM i el del focus (W4-04: Mapa,
   Vehicle Compartit i Animalets a les posicions 4, 5 i 6). */
export const DESTINS_CONTROL = Object.freeze([
  desti({
    id: 'mur',
    pagina: 'publicar_mur',
    imatge: `${IMATGES}/mur_nano_card.jpg`,
    publicar: getSectionListPath('notes'),
    seccio: getSectionListPath('mur'),
    nomPublicar: 'Publicar al Mur',
    nomSaber: 'Saber-ne més sobre el Mur'
  }),
  desti({
    id: 'mercat',
    pagina: 'publicar_mercat',
    imatge: `${IMATGES}/mercat_nano_card.jpg`,
    seccio: getSectionListPath('mercat'),
    nomPublicar: 'Publicar al Mercat',
    nomSaber: 'Saber-ne més sobre el Mercat'
  }),
  desti({
    id: 'calendari',
    pagina: 'publicar_calendari',
    imatge: `${IMATGES}/calendari_nano_card.jpg`,
    seccio: getSectionListPath('calendari'),
    nomPublicar: 'Publicar al Calendari',
    nomSaber: 'Saber-ne més sobre el Calendari'
  }),
  desti({
    id: 'mapa',
    pagina: 'publicar_mapa',
    imatge: '/assets/ui/plugins/mapa_vinyeta.jpg',
    nomPublicar: 'Publicar al Mapa',
    nomSaber: 'Saber-ne més sobre el Mapa'
  }),
  desti({
    id: 'vehicle',
    pagina: 'vehicle_compartit',
    imatge: '/assets/ui/plugins/vehicle_vinyeta.jpg',
    nomPublicar: 'Publicar: Vehicle Compartit',
    nomSaber: 'Saber-ne més: Vehicle Compartit'
  }),
  desti({
    id: 'animalets',
    pagina: 'animalets',
    imatge: '/assets/ui/plugins/animalets_vinyeta.jpg',
    nomPublicar: 'Publicar: Animalets',
    nomSaber: 'Saber-ne més: Animalets'
  }),
  desti({
    id: 'treball',
    pagina: 'treball',
    imatge: `/assets/ui/plugins/treball_vinyeta.jpg`,
    nomPublicar: 'Publicar: Treball',
    nomSaber: 'Saber-ne més: Treball'
  }),
  desti({
    id: 'habitatge',
    pagina: 'habitatge',
    imatge: `/assets/ui/plugins/habitatge_vinyeta.jpg`,
    nomPublicar: 'Publicar: Habitatge',
    nomSaber: 'Saber-ne més: Habitatge'
  })
]);

/** Sense secció pròpia ni camí per a publicar, la funció està «en obres» (W4-04). */
export const enObres = (destiControl) => !destiControl.publicar && !destiControl.seccio;

/**
 * P6 · El destí d'una de les sis pàgines (la clau de PAGE_COPY de /page/<clau>),
 * o null si la pàgina no és de cap targeta del Panell. Només claus pròpies.
 */
export function destiDePagina(clau) {
  const text = typeof clau === 'string' ? clau : '';
  return DESTINS_CONTROL.find((desti) => desti.pagina === text) || null;
}

/**
 * El contingut de la targeta, llegit de la seua pàgina (PAGE_COPY): títol,
 * subtítol, entradilla i la data de la boina, la mateixa de la barra taronja
 * de la pàgina (dataHoraDeBarra). Sense pàgina, null: qui el crida no pinta
 * la targeta (una clau que falta no inventa text).
 */
export function contingutDe(destiControl) {
  const pagina = Object.hasOwn(PAGE_COPY, destiControl.pagina) ? PAGE_COPY[destiControl.pagina] : null;
  if (!pagina) return null;
  return {
    titol: pagina.title,
    subtitol: pagina.subtitle,
    entradilla: pagina.lead,
    ...dataHoraDeBarra({ creat: pagina.date })
  };
}

/**
 * Les dues portes d'un destí per a UniversalCard (`portes`), ja traduïdes amb
 * `t(clau, reserva)`: Publicar primer, en blau primari, i Saber-ne més, en
 * secundari (D4).
 */
export function portesDe(destiControl, t) {
  const tr = ([clau, reserva]) => t(clau, reserva);
  const enObresText = tr(TEXTOS_PORTES.enObres);
  const porta = (id, verb, nom, cami, varietat) => {
    const nomTraduit = tr(nom);
    return {
      id,
      verb: tr(verb),
      nom: nomTraduit,
      desti: cami,
      varietat,
      enObres: enObresText,
      avis: tr(TEXTOS_PORTES.avis).replace('{nom}', () => nomTraduit)
    };
  };
  return [
    porta('publicar', TEXTOS_PORTES.publicar, destiControl.noms.publicar, destiControl.publicar, 'primari'),
    porta('saber', TEXTOS_PORTES.saberMes, destiControl.noms.saberMes, destiControl.saberMes, 'secundari')
  ];
}
