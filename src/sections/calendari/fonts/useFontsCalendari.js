/**
 * useFontsCalendari.js — les fonts de calendari de fora (Google Calendar) per
 * al període que es veu a /calendari.
 *
 * T1 (prompt comú 261002_0125) · useFontsCalendari({ desde, fins }, opcions)
 * → { configurades, entrades, comptes, commuta, connecta, cancella,
 *     desconnecta, reintenta }
 *   entrades     les de les fonts amb la casella marcada d'un compte
 *                connectat, en la forma de l'agenda de Sollutia: la pàgina
 *                les barreja amb les targetes com barreja l'agenda.
 *   comptes      el que pinta PanellFontsCalendari: un grup per compte, amb
 *                la seua fase ('desconnectat' · 'connectant' · 'connectat'),
 *                el seu error i les seues fonts ({ id, nom, colorToken,
 *                activa, fase, error }).
 *   connecta(clau)    obri la finestra de Google (SÍNCRON dins del clic:
 *                     Safari bloqueja una finestra oberta després d'un await).
 *   cancella(clau) · desconnecta(clau) (oblida el token) · commuta(idFont)
 *   reintenta(idFont) torna a demanar una font que ha fallat.
 * Sense configuració (fontsGoogleConfigurades() fals) torna sempre el mateix
 * objecte inert: cap petició, cap entrada, cap panell.
 *
 * Cada font es demana una vegada per període, per versió del token i per
 * reintent; canviar una casella no torna a demanar les altres. Canviar de
 * període avorta la petició vella (com l'agenda). TOKEN_CADUCAT o
 * SENSE_AUTORITZACIO oblida el token del compte, que torna a «Connecta».
 *
 * Bucle adversarial (auditoria Codex 261002_0148, punt 10) · Cada resultat
 * porta la `sessio` (la versió del compte, sessioFonts.js) amb què es va
 * demanar, i només es mostra si és la vigent: desconnectar amaga les entrades
 * a l'instant, una resposta tardana d'una sessió vella no s'escriu i, en
 * tornar a connectar, la font comença buida. Les entrades d'abans només es
 * conserven mentre carrega un refresc de la MATEIXA sessió (un altre període,
 * «Torna a provar», tornar a marcar la casella). Les d'una sessió que ja no
 * és la vigent s'esborren de la memòria del hook.
 * Sense configuració, `motiu` diu per què (el que la pàgina podria mostrar);
 * null quan simplement no hi ha cap client de Google.
 *
 * opcions (proves): config (configFontsDeLEntorn), fetchImpl,
 * obriFinestra(url) → finestra | null, crearCanal.
 */
import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { ERRORS_DE_FONT, ErrorDeFont, aErrorDeFont, errorPla, validaEntradesDeFont } from './contracteFonts.js';
import { configFontsDeLEntorn } from './configFonts.js';
import { crearFontGoogle, esperaRespostaOAuth, generaEstatOAuth, urlAutoritzacioGoogle } from './googleCalendar.js';
import {
  acabaConnexio, cancellaConnexio, casellaDe, clauDelCompte, desaToken, estatDelCompte, iniciaConnexio, instantania,
  oblidaToken, posaCasella, subscriu, tokenDe
} from './sessioFonts.js';

const BUIDA = Object.freeze([]);
const SENSE_RESULTATS = new Map();
const NOM_FINESTRA = 'sdp-gcal-oauth';
const MIDES_FINESTRA = 'width=520,height=680';
const PROVEIDOR = 'Google';
const ETIQUETA_SENSE_COMPTE = 'El teu compte de Google';
const BLOQUEJADA = 'El navegador no ha deixat obrir la finestra de Google: permet les finestres emergents d’este lloc i torna-ho a provar.';
const CAP = () => {};
const INERT = Object.freeze({
  configurades: false, motiu: null, entrades: BUIDA, comptes: BUIDA, commuta: CAP, connecta: CAP, cancella: CAP, desconnecta: CAP, reintenta: CAP
});

const obriFinestraPerDefecte = (url) => window.open(url, NOM_FINESTRA, MIDES_FINESTRA);
const ambResultat = (previs, id, resultat) => new Map(previs).set(id, Object.freeze(resultat));

/* La sessió vigent d'una font: la versió del seu compte si està connectat, o null. */
function sessioDeLaFont(foto, font) {
  const compte = estatDelCompte(foto, clauDelCompte(font.compte));
  return compte.connectat ? compte.versio : null;
}

/* Sense els resultats de sessions que ja no són les vigents; el mateix Map si no n'hi ha cap. */
function senseSessionsVelles(previs, vigents) {
  const velles = [...previs].filter(([id, resultat]) => !vigents.has(id) || resultat.sessio !== vigents.get(id));
  if (!velles.length) return previs;
  const nou = new Map(previs);
  for (const [id] of velles) nou.delete(id);
  return nou;
}

/* Les entrades d'un resultat, només si és de la sessió `sessio`. */
const entradesDeLaSessio = (resultat, sessio) => (resultat && resultat.sessio === sessio ? resultat.entrades : BUIDA);

export function useFontsCalendari({ desde: dataDesde, fins: dataFins }, {
  config = configFontsDeLEntorn(), fetchImpl, obriFinestra = obriFinestraPerDefecte, crearCanal
} = {}) {
  const foto = useSyncExternalStore(subscriu, instantania, instantania);
  const [desde, fins] = [dataDesde.toISOString(), dataFins.toISOString()];
  const [reintents, setReintents] = useState(() => ({}));
  const [resultats, setResultats] = useState(SENSE_RESULTATS);
  const enCurs = useRef(new Map());

  /* Les fonts del contracte, una per entrada de la configuració; el token, de la sessió en memòria. */
  const fonts = useMemo(() => (config.configurades
    ? config.fonts.map((font) => crearFontGoogle({ ...font, obteToken: () => tokenDe(clauDelCompte(font.compte)), fetchImpl }))
    : BUIDA), [config, fetchImpl]);

  /* La sessió vigent de cada font (null si el seu compte no està connectat). */
  const vigents = useMemo(() => new Map(fonts.map((font) => [font.id, sessioDeLaFont(foto, font)])), [fonts, foto]);

  /* Les consultes que toquen ara: cada font marcada d'un compte connectat, amb la seua sessió i la seua clau. */
  const peticions = useMemo(() => fonts.flatMap((font) => {
    const sessio = vigents.get(font.id);
    if (sessio === null || !casellaDe(foto, font)) return [];
    return [{ font, sessio, clau: `${desde}|${fins}|${sessio}|${reintents[font.id] ?? 0}` }];
  }), [fonts, vigents, foto, desde, fins, reintents]);

  useEffect(() => {
    const vives = new Set();
    for (const { font, sessio, clau } of peticions) {
      vives.add(font.id);
      if (enCurs.current.get(font.id)?.clau === clau) continue;
      enCurs.current.get(font.id)?.control.abort();
      const control = new AbortController();
      enCurs.current.set(font.id, { clau, control });
      /* Una resposta només s'escriu si la seua consulta encara és la viva
         d'eixa font: ni avortada (desconnexió, període nou, desmuntatge) ni
         substituïda per una de més nova. */
      const viva = () => !control.signal.aborted && enCurs.current.get(font.id)?.control === control;
      /* Mentre arriba la resposta, la font conserva les entrades d'abans
         només si són d'esta mateixa sessió (cap parpelleig en un refresc). Mai
         les d'una connexió anterior: la font torna a començar buida. */
      setResultats((previs) => ambResultat(previs, font.id, {
        clau, sessio, fase: 'carregant', entrades: entradesDeLaSessio(previs.get(font.id), sessio), error: null
      }));
      Promise.resolve()
        .then(() => font.llistaEntrades({ desde: new Date(desde), fins: new Date(fins), signal: control.signal }))
        .then((entrades) => {
          if (!viva()) return;
          validaEntradesDeFont(font.id, entrades);
          setResultats((previs) => ambResultat(previs, font.id, { clau, sessio, fase: 'llest', entrades, error: null }));
        })
        .catch((causa) => {
          if (!viva()) return; // canvi de període, desconnexió o desmuntatge: no és cap error
          const error = aErrorDeFont(causa);
          console.warn(`[calendari] La font «${font.nom}» no ha respost:`, error.tipus);
          if (error.tipus === ERRORS_DE_FONT.TOKEN_CADUCAT || error.tipus === ERRORS_DE_FONT.SENSE_AUTORITZACIO) {
            oblidaToken(clauDelCompte(font.compte), error);
          }
          setResultats((previs) => ambResultat(previs, font.id, { clau, sessio, fase: 'error', entrades: BUIDA, error: errorPla(error) }));
        });
    }
    for (const [id, { control }] of enCurs.current) {
      if (vives.has(id)) continue;
      control.abort();
      enCurs.current.delete(id);
    }
    // Les dades d'una sessió que ja no és la vigent no es queden en memòria esperant la pròxima consulta.
    setResultats((previs) => senseSessionsVelles(previs, vigents));
  }, [peticions, vigents, desde, fins]);

  // Desmuntatge: cap resposta tardana escriu en un calendari que ja no hi és.
  useEffect(() => {
    const mapa = enCurs.current;
    return () => {
      for (const { control } of mapa.values()) control.abort();
      mapa.clear();
    };
  }, []);

  /* Al render, no a l'efecte: el resultat d'una sessió que ja no és la vigent no es veu ni un instant. */
  const entrades = useMemo(() => {
    const totes = peticions.flatMap(({ font, sessio }) => entradesDeLaSessio(resultats.get(font.id), sessio));
    return totes.length ? totes : BUIDA;
  }, [peticions, resultats]);

  const comptes = useMemo(() => {
    const grups = new Map();
    for (const font of fonts) {
      const clau = clauDelCompte(font.compte);
      if (!grups.has(clau)) {
        const compte = estatDelCompte(foto, clau);
        const fase = compte.connectant ? 'connectant' : (compte.connectat ? 'connectat' : 'desconnectat');
        grups.set(clau, { clau, etiqueta: font.compte ?? ETIQUETA_SENSE_COMPTE, proveidor: PROVEIDOR, fase, error: compte.error, fonts: [] });
      }
      const grup = grups.get(clau);
      const activa = casellaDe(foto, font);
      const previ = grup.fase === 'connectat' && activa ? resultats.get(font.id) : null;
      const resultat = previ && previ.sessio === vigents.get(font.id) ? previ : null;
      grup.fonts.push(Object.freeze({
        id: font.id, nom: font.nom, colorToken: font.colorToken, activa, fase: resultat?.fase ?? 'inactiu', error: resultat?.error ?? null
      }));
    }
    return [...grups.values()].map((grup) => Object.freeze({ ...grup, fonts: Object.freeze(grup.fonts) }));
  }, [fonts, foto, vigents, resultats]);

  const inert = useMemo(() => (config.motiu ? Object.freeze({ ...INERT, motiu: config.motiu }) : INERT), [config.motiu]);
  if (!config.configurades) return inert;

  /* Síncron fins a window.open: la finestra s'obri dins del gest del veí. */
  function connecta(clau) {
    const control = iniciaConnexio(clau);
    let estat;
    let finestra;
    try {
      estat = generaEstatOAuth();
      finestra = obriFinestra(urlAutoritzacioGoogle({ clientId: config.clientId, redirectUri: config.redirectUri, estat, loginHint: clau || null }));
    } catch (error) {
      acabaConnexio(clau, control, aErrorDeFont(error));
      return;
    }
    if (!finestra) {
      acabaConnexio(clau, control, new ErrorDeFont(ERRORS_DE_FONT.SENSE_AUTORITZACIO, BLOQUEJADA));
      return;
    }
    esperaRespostaOAuth({ estat, finestra, crearCanal, signal: control.signal })
      .then((resposta) => {
        if (control.signal.aborted) return;
        desaToken(clau, resposta);
        acabaConnexio(clau, control);
      })
      .catch((error) => {
        if (!control.signal.aborted) acabaConnexio(clau, control, error);
      })
      .finally(() => {
        try { finestra.close(); } catch { /* ja tancada */ }
      });
  }

  return {
    configurades: true,
    motiu: null,
    entrades,
    comptes,
    connecta,
    cancella: cancellaConnexio,
    desconnecta: (clau) => {
      cancellaConnexio(clau);
      oblidaToken(clau);
    },
    commuta: (idFont) => {
      const font = fonts.find((f) => f.id === idFont);
      if (font) posaCasella(idFont, !casellaDe(foto, font));
    },
    reintenta: (idFont) => setReintents((previs) => ({ ...previs, [idFont]: (previs[idFont] ?? 0) + 1 }))
  };
}
