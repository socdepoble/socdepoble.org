/**
 * ajustosXat.js — el model del full «Ajustos» del Xat (torn 260930, T1), en
 * funcions pures. Calca l'arbre d'«Ajustes» de WhatsApp Desktop (captures del
 * Mestre, 20.47–21.05) i hi posa NOMÉS el que Sóc de Poble ja té: la resta
 * és «en construcció», i ho diu.
 *
 * Sense React ni xarxa. FullAjustos.jsx el pinta; el catàleg de disseny
 * (EspecimenXatAjustos) també.
 *
 * L'arbre és una pila de pàgines dins del MATEIX marc (WhatsApp: «push dins
 * del mateix full»). Cada pàgina porta el títol i, o bé grups de files en
 * targetes, o bé un contingut especial (els Preferits), o bé l'avís «en
 * construcció». Cada fila diu quin element porta a la dreta pel seu tipus:
 *   · 'pagina' → xebró: empeny una subpàgina dins del full;
 *   · 'ruta'   → xebró: obri una ruta de l'app i tanca el full;
 *   · 'opcio'  → ✓ si és la triada (selecció única de la seua targeta; es
 *                 canvia a l'acte, sense botó de desar, com a WhatsApp);
 *   · 'accio'  → text roig i sense xebró (destructiva: «Tanca la sessió»);
 *   · 'seccio' → només als resultats de la cerca: una capçalera de secció
 *                trobada (filaDeSeccio), que obri la pàgina on viu.
 * `valor` demana a qui pinta un valor gris a la dreta ('tema', 'amplaria' o
 * 'correu'): el model no el sap, és estat de l'app. Un grup pot portar
 * `paraules` ([clau, text]): el que la cerca troba a més de la capçalera.
 *
 * Els textos són parells [clau i18n, text en valencià]. On ja hi havia una
 * clau (el rail, els filtres, el Control del xat, la barra principal) es
 * reutilitza: el mateix nom a tot arreu.
 *
 * `icona` és el nom de l'export de lucide-react, com a FILTRES_CERCA_XAT
 * (cercaXat.js): el model no importa cap component.
 */
import { SUPPORTED_LANGUAGES } from '../../config/i18n.js';
import { fitxes as fitxesDeConsulta, plega } from '../search/indexCerca.js';
import { PRESETS_AMPLARIA } from './amplariaColumnes.js';

/** Les rutes de l'app on porten les files 'ruta'. Totes existixen (sections.js i ClosCaXat.RUTA_PERFIL).
 *  Torn 261004 (T5) · `multimedia` és la vista del rail (VISTES_XAT, ClosCaXat), ja operativa. */
export const RUTES_AJUSTOS = Object.freeze({
  perfil: '/el-meu-perfil',
  wiki: '/wikidepoble',
  legal: '/legal',
  versions: '/versions',
  multimedia: '/xat?vista=multimedia'
});

/** La pàgina de dalt de la pila. */
export const ARREL_AJUSTOS = 'arrel';

/* La llengua pròpia primer i la resta en l'ordre de la configuració, com a
   /traduccions (TranslationsSection). El nom de cada llengua es diu en la
   seua forma de la configuració i no es traduïx: és el que la persona busca. */
const LLENGUA_PROPIA = 'ca';
const LLENGUES = [
  ...SUPPORTED_LANGUAGES.filter((llengua) => llengua.code === LLENGUA_PROPIA),
  ...SUPPORTED_LANGUAGES.filter((llengua) => llengua.code !== LLENGUA_PROPIA)
];

/* Les tres opcions del tema de WhatsApp (captura 20.59.01): «Igual al
   sistema», «Modo claro» i «Modo oscuro», sobre les preferències que ja
   coneix config/theme.js ('system', 'light', 'dark'). */
export const OPCIONS_TEMA = Object.freeze([
  Object.freeze({ id: 'tema-system', tipus: 'opcio', opcio: 'system', clau: 'section.xat.ajustos.tema.sistema', text: 'Igual que el sistema' }),
  Object.freeze({ id: 'tema-light', tipus: 'opcio', opcio: 'light', clau: 'section.xat.ajustos.tema.clar', text: 'Mode clar' }),
  Object.freeze({ id: 'tema-dark', tipus: 'opcio', opcio: 'dark', clau: 'section.xat.ajustos.tema.fosc', text: 'Mode fosc' })
]);

/* D6 · Mode Bancal (Q1 del Mestre, 261004) · Les tres preferències de
   contrast que coneix config/theme.js ('normal', 'bancal', 'sistema'), en
   eixe ordre. «Bancal» porta entre parèntesis per a què servix. */
export const OPCIONS_CONTRAST = Object.freeze([
  Object.freeze({ id: 'contrast-normal', tipus: 'opcio', opcio: 'normal', clau: 'section.xat.ajustos.contrast.normal', text: 'Normal' }),
  Object.freeze({ id: 'contrast-bancal', tipus: 'opcio', opcio: 'bancal', clau: 'section.xat.ajustos.contrast.bancal', text: 'Bancal (exterior, màxim contrast)' }),
  Object.freeze({ id: 'contrast-sistema', tipus: 'opcio', opcio: 'sistema', clau: 'section.xat.ajustos.contrast.sistema', text: 'Segons el sistema' })
]);

const fila = (id, tipus, clau, text, extra = {}) => Object.freeze({ id, tipus, clau, text, ...extra });

/* ── L'arbre ────────────────────────────────────────────────────────────── */

export const PAGINES_AJUSTOS = Object.freeze({
  /* L'arrel (captura 20.48.41): X, cercador, targeta de perfil i quatre
     grups. «Privacitat» no té pàgina pròpia al Xat: porta a l'espai del
     Perfil, on viu «Privacitat i dades» (PerfilShell).
     Revisió adversarial 260930 (P3) · El Perfil s'obri en «La fitxa», no en
     «Privacitat i dades», i l'apartat només hi és si el backend declara
     'compte' o 'consentiment'. Mentre el Mestre no decidix com portar-hi de
     veres, la nota del grup ho diu (`notaDinamica: 'privacitat'`). */
  arrel: Object.freeze({
    id: 'arrel',
    titol: ['section.xat.ajustos.titol', 'Ajustos'],
    cercador: true,
    perfil: true,
    grups: Object.freeze([
      Object.freeze({ id: 'personal', files: Object.freeze([
        fila('preferits', 'pagina', 'section.xat.filtres.preferits', 'Preferits', { icona: 'Heart', pagina: 'preferits' }),
        fila('destacats', 'pagina', 'section.xat.rail.destacats', 'Destacats', { icona: 'Star', pagina: 'destacats' })
      ]) }),
      Object.freeze({ id: 'historial', files: Object.freeze([
        fila('historial', 'pagina', 'section.xat.ajustos.historial', 'Historial del xat', { icona: 'RefreshCw', pagina: 'historial' })
      ]) }),
      Object.freeze({ id: 'app', notaDinamica: 'privacitat', files: Object.freeze([
        fila('compte', 'pagina', 'section.xat.ajustos.compte', 'Compte', { icona: 'KeyRound', pagina: 'compte' }),
        fila('privacitat', 'ruta', 'section.xat.ajustos.privacitat', 'Privacitat', { icona: 'Lock', ruta: RUTES_AJUSTOS.perfil }),
        fila('xats', 'pagina', 'section.xat.rail.xats', 'Xats', { icona: 'MessageCircle', pagina: 'xats' }),
        fila('aparenca', 'pagina', 'section.xat.ajustos.aparenca', 'Aparença', { icona: 'Palette', pagina: 'aparenca' }),
        fila('notificacions', 'pagina', 'section.xat.ajustos.notificacions', 'Notificacions', { icona: 'BellDot', pagina: 'notificacions' }),
        /* L'equivalència canònica de la skill sdp-clon-whatsapp (§2.3):
           «Almacenamiento y datos» → «Dades i memòria local». */
        fila('dades', 'pagina', 'section.xat.ajustos.dades', 'Dades i memòria local', { icona: 'ArrowDownUp', pagina: 'dades' })
      ]) }),
      Object.freeze({ id: 'ajuda', files: Object.freeze([
        fila('ajuda', 'pagina', 'section.xat.ajustos.ajuda', 'Ajuda', { icona: 'CircleQuestionMark', pagina: 'ajuda' })
      ]) })
    ])
  }),

  /* Les converses marcades com a preferides (fil.preferit): les pinta qui
     munta el full, amb dades d'useXat(). */
  preferits: Object.freeze({
    id: 'preferits',
    titol: ['section.xat.filtres.preferits', 'Preferits'],
    especial: 'preferits'
  }),

  /* El MATEIX text que la vista Destacats del rail (textosDeVista). */
  destacats: Object.freeze({
    id: 'destacats',
    titol: ['section.xat.rail.destacats', 'Destacats'],
    construccio: Object.freeze({ vista: 'destacats' })
  }),

  /* Sense sincronització entre dispositius: el text de WhatsApp no s'aplica. */
  historial: Object.freeze({
    id: 'historial',
    titol: ['section.xat.ajustos.historial', 'Historial del xat'],
    construccio: Object.freeze({
      descripcio: ['section.xat.ajustos.historial.text', 'Ací hi haurà l’historial de les teues converses: des de quan es guarda i en quins dispositius el tens.']
    })
  }),

  /* «Cuenta» (captura 20.53.25): el perfil, amb el correu de la sessió com a
     valor, i l'eixida en roig, en una targeta a banda. Sense sessió, sense
     eixida (`nomesAmbSessio`). */
  compte: Object.freeze({
    id: 'compte',
    titol: ['section.xat.ajustos.compte', 'Compte'],
    grups: Object.freeze([
      Object.freeze({ id: 'perfil', files: Object.freeze([
        fila('compte-perfil', 'ruta', 'section.xat.ajustos.elMeuPerfil', 'El meu perfil', { ruta: RUTES_AJUSTOS.perfil, valor: 'correu' })
      ]) }),
      Object.freeze({ id: 'eixida', nomesAmbSessio: true, files: Object.freeze([
        fila('compte-eixida', 'accio', 'section.xat.ajustos.tancaSessio', 'Tanca la sessió', { accio: 'eixida', perill: true, nomesAmbSessio: true })
      ]) })
    ])
  }),

  /* «Chats» (captura 20.58.55): l'Aparença amb el tema com a valor, i les
     opcions del Control del xat (/control-xat) amb les seues claus.
     Ordre del Mestre del 261004 (T5) · «Multimèdia, enllaços i documents»
     ja no és una pàgina en construcció: porta a la vista del rail
     (/xat?vista=multimedia) i tanca el full. */
  xats: Object.freeze({
    id: 'xats',
    titol: ['section.xat.rail.xats', 'Xats'],
    grups: Object.freeze([
      Object.freeze({ id: 'aparenca', files: Object.freeze([
        fila('xats-aparenca', 'pagina', 'section.xat.ajustos.aparenca', 'Aparença', { pagina: 'aparenca', valor: 'tema' })
      ]) }),
      Object.freeze({ id: 'amplaria', files: Object.freeze([
        fila('xats-amplaria', 'pagina', 'section.xat.control.espai.titol', 'Amplària de les columnes', { pagina: 'amplaria', valor: 'amplaria' })
      ]) }),
      Object.freeze({ id: 'pendents', files: Object.freeze([
        fila('xats-temporals', 'pagina', 'section.xat.control.temporals.titol', 'Missatges temporals', { pagina: 'temporals' }),
        fila('xats-multimedia', 'ruta', 'section.xat.control.multimedia.titol', 'Multimèdia, enllaços i documents', { ruta: RUTES_AJUSTOS.multimedia })
      ]) })
    ])
  }),

  /* Una sola pàgina d'Aparença, dos portes (l'arrel i Xats): el tema, el
     contrast (D6, 261004) i la llengua, amb capçalera de secció i ✓
     (captura 20.59.01).
     Revisió adversarial 260930 (P2) · Els dos ajustos només tenen nom a la
     capçalera: la cerca la indexa amb les `paraules` clau del grup (el que
     la persona escriu per a buscar-lo i no és el nom). Cap paraula que ja
     porte una fila (fosc, clar, aparença): trauria la secció davant de la
     fila que la persona buscava. */
  aparenca: Object.freeze({
    id: 'aparenca',
    titol: ['section.xat.ajustos.aparenca', 'Aparença'],
    grups: Object.freeze([
      Object.freeze({
        id: 'tema',
        capcalera: ['section.xat.ajustos.tema', 'Tema'],
        paraules: ['section.xat.ajustos.tema.paraules', 'aspecte colors nit'],
        seleccio: 'tema',
        files: OPCIONS_TEMA
      }),
      /* D6 (261004) · El contrast, al costat del tema. Les paraules clau no
         repetixen cap paraula d'una fila (normal, bancal, sistema). */
      Object.freeze({
        id: 'contrast',
        capcalera: ['section.xat.ajustos.contrast', 'Contrast'],
        paraules: ['section.xat.ajustos.contrast.paraules', 'sol exterior llegibilitat lectura'],
        seleccio: 'contrast',
        files: OPCIONS_CONTRAST
      }),
      Object.freeze({
        id: 'llengua',
        capcalera: ['section.xat.ajustos.llengua', 'Llengua'],
        paraules: ['section.xat.ajustos.llengua.paraules', 'idioma idiomes llengües'],
        seleccio: 'llengua',
        files: Object.freeze(LLENGUES.map((llengua) => fila(`llengua-${llengua.code}`, 'opcio', null, llengua.name, { opcio: llengua.code })))
      })
    ])
  }),

  /* Els tres valors predefinits d'AppGridShell, els mateixos que /control-xat
     (amplariaColumnes.js). La nota diu les mides d'ara (`notaDinamica`). */
  amplaria: Object.freeze({
    id: 'amplaria',
    titol: ['section.xat.control.espai.titol', 'Amplària de les columnes'],
    grups: Object.freeze([
      Object.freeze({
        id: 'amplaria',
        seleccio: 'amplaria',
        notaDinamica: 'amplaria',
        files: Object.freeze(PRESETS_AMPLARIA.map(([id, clau, text]) => fila(`amplaria-${id}`, 'opcio', clau, text, { opcio: id })))
      })
    ])
  }),

  temporals: Object.freeze({
    id: 'temporals',
    titol: ['section.xat.control.temporals.titol', 'Missatges temporals'],
    construccio: Object.freeze({ descripcio: ['section.xat.control.temporals.text', "Activa l'autodestrucció de missatges per a converses sensibles."] })
  }),

  notificacions: Object.freeze({
    id: 'notificacions',
    titol: ['section.xat.ajustos.notificacions', 'Notificacions'],
    construccio: Object.freeze({
      descripcio: ['section.xat.ajustos.notificacions.text', 'Ací podràs triar com t’avisa el xat dels missatges nous, dels grups i de les reaccions.']
    })
  }),

  dades: Object.freeze({
    id: 'dades',
    titol: ['section.xat.ajustos.dades', 'Dades i memòria local'],
    construccio: Object.freeze({
      descripcio: ['section.xat.ajustos.dades.text', 'Ací veuràs quant d’espai ocupa el xat en este dispositiu i en podràs alliberar.']
    })
  }),

  /* «Ayuda» (captura 21.04.41), amb les pàgines pròpies que ja existixen:
     res del centre d'ajuda de WhatsApp (skill sdp-clon-whatsapp, §3). */
  ajuda: Object.freeze({
    id: 'ajuda',
    titol: ['section.xat.ajustos.ajuda', 'Ajuda'],
    grups: Object.freeze([
      Object.freeze({ id: 'pagines', files: Object.freeze([
        fila('ajuda-wiki', 'ruta', 'nav.wikidepoble', 'Wiki de Poble', { ruta: RUTES_AJUSTOS.wiki }),
        fila('ajuda-legal', 'ruta', 'nav.legal', 'Legal i privacitat', { ruta: RUTES_AJUSTOS.legal }),
        fila('ajuda-versions', 'ruta', 'nav.versions', 'Versions', { ruta: RUTES_AJUSTOS.versions })
      ]) })
    ])
  })
});

/* ── Funcions ───────────────────────────────────────────────────────────── */

const senseTraduir = (_, text) => text;

/** La pàgina d'un id, o null. */
export const paginaAjustos = (id, pagines = PAGINES_AJUSTOS) => (Object.hasOwn(pagines, id) ? pagines[id] : null);

/** El text d'un parell [clau, text], traduït. */
export const textDe = (parell, t = senseTraduir) => (parell ? t(parell[0], parell[1]) : '');

/** L'etiqueta d'una fila, traduïda; les llengües porten el seu nom sense clau. */
export const etiquetaDeFila = (filaAjust, t = senseTraduir) => (filaAjust.clau ? t(filaAjust.clau, filaAjust.text) : filaAjust.text);

/** Totes les files d'una pàgina, en ordre. */
export const filesDePagina = (pagina) => (pagina?.grups || []).flatMap((grup) => grup.files);

/**
 * El camí més curt des de l'arrel fins a cada pàgina: { [id]: ['arrel', …, id] }.
 * Una pàgina amb dos portes (Aparença) pren la més curta.
 */
export function caminsAjustos(pagines = PAGINES_AJUSTOS) {
  const camins = { [ARREL_AJUSTOS]: [ARREL_AJUSTOS] };
  const cua = [ARREL_AJUSTOS];
  while (cua.length) {
    const id = cua.shift();
    for (const filaAjust of filesDePagina(paginaAjustos(id, pagines))) {
      if (filaAjust.tipus !== 'pagina' || !paginaAjustos(filaAjust.pagina, pagines) || camins[filaAjust.pagina]) continue;
      camins[filaAjust.pagina] = [...camins[id], filaAjust.pagina];
      cua.push(filaAjust.pagina);
    }
  }
  return camins;
}

/**
 * La fila que representa una capçalera de secció als resultats de la cerca
 * (tipus 'seccio'): porta el nom de la capçalera i obri la pàgina on viu.
 * L'id no coincidix amb cap fila de l'arbre: el focus hi torna en tornar.
 */
export const filaDeSeccio = (grup) => Object.freeze({
  id: `seccio-${grup.id}`, tipus: 'seccio', clau: grup.capcalera[0], text: grup.capcalera[1]
});

/* Revisió adversarial 260930 (P2) · On busca la cerca en una capçalera de
   secció: la capçalera i les paraules clau del grup, traduïdes i també en
   valencià (la reserva del parell). Així «llengua» troba «Language» a qui
   té la interfície en anglés. Les etiquetes de les files es busquen només
   en la llengua de la interfície: és el que es veu. */
const textDeCercaDeSeccio = (grup, t) => [grup.capcalera, grup.paraules]
  .filter(Boolean)
  .flatMap((parell) => [t(parell[0], parell[1]), parell[1]])
  .join(' ');

/**
 * «Cerca als ajustos»: les files de TOT l'arbre l'etiqueta de les quals conté
 * cada paraula del terme, amb el plegat de /cerca (indexCerca.js, com a
 * cercaXat.js): «aparenca» troba «Aparença» i «fosc» troba «Mode fosc».
 * També les capçaleres de secció (el Tema i la Llengua, que no tenen cap
 * fila amb el seu nom), per la capçalera o per les paraules clau del grup:
 * «llengua», «idioma» o «theme» troben la seua secció (filaDeSeccio), davant
 * de les files del grup.
 *
 * Torna null sense terme (no s'està cercant) o una llista, en l'ordre de
 * l'arbre (primer l'arrel), de { fila, pagina, cami }: `pagina` és on viu la
 * fila i `cami` la pila que l'hi porta. Dos portes a la mateixa pàgina
 * (l'Aparença de l'arrel i la de Xats) donen un sol resultat: el més curt.
 * `ambSessio` false lleva les files que només tenen sentit amb sessió.
 */
export function cercaAjustos(terme, { t = senseTraduir, ambSessio = true, pagines = PAGINES_AJUSTOS } = {}) {
  const llistaFitxes = fitxesDeConsulta(terme);
  if (!llistaFitxes.length) return null;
  const camins = caminsAjustos(pagines);
  const destins = new Set();
  const resultats = [];
  const casa = (text) => {
    const plegat = plega(text);
    return llistaFitxes.every((fitxa) => plegat.includes(fitxa));
  };
  for (const [id, cami] of Object.entries(camins)) {
    const pagina = paginaAjustos(id, pagines);
    for (const grup of pagina.grups || []) {
      if (grup.nomesAmbSessio && !ambSessio) continue;
      if (grup.capcalera && casa(textDeCercaDeSeccio(grup, t))) {
        resultats.push({ fila: filaDeSeccio(grup), pagina: id, cami });
      }
      for (const filaAjust of grup.files) {
        if (filaAjust.nomesAmbSessio && !ambSessio) continue;
        if (!casa(etiquetaDeFila(filaAjust, t))) continue;
        if (filaAjust.tipus === 'pagina') {
          if (destins.has(filaAjust.pagina)) continue;
          destins.add(filaAjust.pagina);
        }
        resultats.push({ fila: filaAjust, pagina: id, cami });
      }
    }
  }
  return resultats;
}

/**
 * La pila ([{ id, origen }]) que obri un resultat de la cerca: una fila 'pagina' porta a la
 * seua pàgina; una opció, una acció o una capçalera de secció, a la pàgina
 * on viu (no es tria des de la cerca: es mostra on és, amb el seu ✓ o el
 * seu roig). Una fila 'ruta'
 * no empeny res: qui pinta l'obri directament i tanca el full.
 */
export function pilaDeResultat(resultat, pagines = PAGINES_AJUSTOS) {
  if (!resultat) return [{ id: ARREL_AJUSTOS, origen: null }];
  const { fila: filaAjust, cami } = resultat;
  const ids = filaAjust.tipus === 'pagina' ? [...cami, filaAjust.pagina] : [...cami];
  /* `origen`: la fila de la pàgina de davall que obri cada nivell, on torna
     el focus en tornar. El primer nivell l'ha obert el resultat mateix (a
     l'arrel, la seua fila de resultat porta el mateix id). */
  return ids.map((id, i) => ({
    id,
    origen: i === 0 ? null
      : i === 1 ? filaAjust.id
        : filaQueObri(ids[i - 1], id, pagines)?.id ?? null
  }));
}

/** La primera fila de la pàgina `pare` que empeny la pàgina `fill`, o null. */
export function filaQueObri(pare, fill, pagines = PAGINES_AJUSTOS) {
  return filesDePagina(paginaAjustos(pare, pagines)).find((f) => f.tipus === 'pagina' && f.pagina === fill) || null;
}
