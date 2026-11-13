import { useCallback, useRef, useState } from 'react';
import useHeroImageHandler from '../../hooks/useHeroImageHandler.js';
import {
  ACCEPT_FOTO, PES_MAXIM_FOTO, costatDeSortida, useEnquadramentImatge,
} from '../../components/universal/enquadrament/useEnquadramentImatge.jsx';
import { TEXTOS_ENQUADRAMENT } from '../../components/universal/enquadrament/DialegEnquadrament.jsx';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { AJUDA_IMATGE_PUJANT as AVIS_IMATGE_PUJANT, TEXTOS_CLOSCA } from '../../components/universal/UniversalEditorShell.jsx';
import { ambEnquadrament } from '../../utils/enquadramentUrl.js';

/* Un pas que falla sense missatge propi (no hauria de passar: el hook l'avisa).
   P1-22 (marató 261101_2143, B3-I18N §3.C) · En parell [clau, reserva], i es
   pinta traduït; la reserva és el literal de sempre, amb l'apòstrof
   tipogràfic: és una clau diferent de la de la closca, que el porta recte
   (D-2). La constant de sempre en naix amb el mateix valor (les proves
   l'importen). */
export const PARELL_ERROR_DESAT_IMATGE = Object.freeze(['section.perfil.editor.imatge.errorDesar', 'No s’ha pogut desar la imatge.']);
export const ERROR_DESAT_IMATGE = PARELL_ERROR_DESAT_IMATGE[1];
/* Correcció de la revisió (261008) · El que es diu si es torna a obrir
   mentre la imatge encara puja: la MATEIXA constant que la guarda de la
   closca (AJUDA_IMATGE_PUJANT, ordre E, 261007), no una còpia del text que
   es puga desfasar. Es torna a exportar amb el nom de sempre: PerfilEditor i
   les proves l'importen d'ací. No obri cap dependència nova: PerfilEditor ja
   importava la closca, i la closca no importa directament res de
   sections/profile. A més, és un enllaç viu que només es llig dins de
   funcions, mai en avaluar el mòdul: un cicle transitiu no el trobaria buit.
   P1-22 (B3-I18N §3.C) · Dins del hook es pinta el seu parell traduït
   (TEXTOS_CLOSCA.imatgePujant, també un enllaç viu llegit dins de funcions);
   la constant només es torna a exportar. */
export { AVIS_IMATGE_PUJANT };

/* Tancar el selector de fitxers sense triar dispara `cancel` a l'input, i
   puja: dins d'un <dialog>, Dialeg el prendria per un Escape i el tancaria.
   Es para a l'input (React només escolta `cancel` al <dialog>). */
const paraCancel = (e) => e.stopPropagation();

/* R22.1 (r221-ui-02) · El nom accessible del selector de fitxers, per forma:
   el del camp de la fitxa (els parells de la closca, ja en cinc llengües).
   TEXTOS_CLOSCA es llig dins de la funció, mai en avaluar el mòdul (vegeu
   AVIS_IMATGE_PUJANT, damunt). */
function nomDelSelector(forma) {
  if (forma === 'avatar') return TEXTOS_CLOSCA.campAvatar;
  if (forma === 'logotip') return TEXTOS_CLOSCA.altLogotip;
  return TEXTOS_CLOSCA.campCapcalera;
}

/**
 * useImatgeDeFitxa — Onada 4 (retallador senzill, ordre del Mestre 261008).
 * Un botó, una imatge: «Capçalera», «Avatar» o «Logotip» de la fitxa del
 * Perfil, cadascun amb el seu selector de fitxers i la mateixa finestra de
 * retall (useEnquadramentImatge), sense cap diàleg intermedi.
 *
 * CONTRACTE
 *   useImatgeDeFitxa({ camp, forma, onImageUpload, onDesaCamp, onError, onDesat })
 *   camp ('heroImage' | 'logoImage') · el camp de la fitxa que es desa.
 *   forma ('capcalera' | 'avatar' | 'logotip') · la proporció i la màscara.
 *   onImageUpload(fitxer) → url · la pujada de sempre (uploadMedia del Perfil).
 *   onDesaCamp(camp, url) · el desat del camp (la cua de la fitxa); s'espera.
 *     Bloc 3.5.4 (Gauntlet 261016) · Si torna false o rebutja, el servidor no
 *     té la imatge: és un fracàs, com una pujada fallada (vegeu Guardar).
 *   onError(missatge, tipus?) · la foto triada no s'admet (no és PNG, JPEG o
 *     WebP, o passa de 10 MB): no s'obri res i l'avís va fora (toast), perquè
 *     cap modal el tapa. `tipus` només ve quan no és un error ('info').
 *   onDesat(camp) · opcional: el desat ha acabat bé (el pare hi porta el focus).
 *   identitat (false) · P1-64 (Mestre 261028, decisió 7): la foto és
 *     d'identitat (la capçalera d'una persona; l'avatar ja ho és per la
 *     forma). Puja neta i sense casella i, si portava GPS, després de desar bé
 *     es diu onError(AVIS_GPS_ELIMINAT_PERFIL, 'info'): la finestra ja s'ha
 *     tancat i la persona ho veu igual.
 *   Torna { obri(control?), input, dialeg, pujant, obert }:
 *     · obri fa clic a l'input amagat dins del gest de la persona. Si rep el
 *       control de la closca ({ acaba }), el crida quan la imatge ja s'ha
 *       desat (torna la capçalera a la imatge); un esdeveniment no ho és.
 *     · `input` i `dialeg` es pinten on calga (fora de cap altre diàleg).
 *     · `pujant` és true des de Guardar fins que el camp ja és desat (o ha
 *       fallat): la pujada i el desat del camp.
 *   Guardar fa UNA pujada (processaFitxer) del retall, que ja ix a la mida
 *   exacta: no es torna a reduir (midaMaxima). Si falla, l'avís ix dins de la
 *   finestra, que continua oberta. Cancel·lar no puja res.
 *   Bloc 3.5.4 (Gauntlet 261016; P2 de Codex, «error 403») · «Falla» és també
 *   un desat del camp que el servidor no ha acceptat: onDesaCamp torna false
 *   (o rebutja, i llavors el seu missatge és l'avís). La finestra continua
 *   oberta amb el retall, sense `acaba` ni onDesat: res no es dona per desat.
 *   Tornar a Guardar ho torna a provar; l'esborrany és de qui desa (la cua).
 *   Correcció de la revisió (261008) · La guarda de pujada de l'ordre E
 *   (261007), ara per a la fitxa: Escape tanca la finestra encara que estiga
 *   desant, i el desat continua. Mentre dura, obri i un fitxer triat no fan
 *   res més que dir-ho (onError(avís de pujada, 'info'); el de la closca,
 *   TEXTOS_CLOSCA.imatgePujant, traduït): cap segona
 *   pujada trepitja la primera ni el seu control. Si la pujada falla amb la
 *   finestra ja tancada, l'avís va fora (onError), perquè dins ja no hi és.
 *
 * Ordre del Mestre (18-10-2026, relleu del Pla 2000, punt 2: «en fer clic
 * directament sobre el cercle de l'avatar, obri directament DialegEnquadrament
 * carregant la imatge que ja hi ha») · Opcional, i sense ella el de sempre:
 *   finestra ({ canviaFoto?, ajudaFoto?, onLleva?, etiquetaLleva?, etiquetaDesa? })
 *     · el que la finestra de retall porta de més (DialegEnquadrament). Amb
 *     `canviaFoto: true`, «Canviar foto» dins de la finestra: la foto triada
 *     passa la mateixa validació (10 MB, PNG, JPEG o WebP) i la mateixa
 *     guarda de pujada, i s'obri en la mateixa finestra; si no s'admet, l'avís
 *     ix dins. La resta passa tal qual.
 *   I el que torna, a més: ajusta(font, control?) → boolean, que obri la
 *   finestra amb una adreça JA RESOLTA (la imatge que ja hi ha) sense passar
 *   pel selector, amb la guarda de pujada d'obri; i tanca(), que la tanca
 *   (després de «Llevar avatar»). Guardar puja el retall pel camí de sempre
 *   (processaFitxer i onDesaCamp): la persona no torna a triar cap fitxer, i
 *   una adreça desada sencera no té res a desar (DialegEnquadrament, T46).
 *
 * P0-80 / IDEA-211 (llei del Mestre, 09-11-2026: ENQUADRAMENT NO DESTRUCTIU) ·
 * La capçalera (forma 'capcalera') no es retalla: Guardar puja la foto
 * SENCERA i desa la seua adreça amb el marc al fragment #sdp-crop=
 * (processaFitxer, opcions.enquadrament). Re-enquadrar la que ja hi ha
 * (ajusta) no puja res: la finestra torna un text i es desa
 * onDesaCamp(camp, el valor DESAT amb el marc nou), mai l'adreça resolta (una
 * URL signada caduca). Per això ajusta(font, control, desat) rep, de tercer,
 * el valor desat del camp (sdp-media://…); sense, el de la font. R16a
 * (revisió final, troballa 3) · Si la finestra l'ha de tornar a codificar (la
 * casella desmarcada o una precisió del GPS més grossa), torna la foto
 * sencera (un File), que puja com una de nova, amb la precisió i el marc.
 *   noDestructiu (true) · false torna a la capçalera retallada de sempre (la
 *     d'una organització: PerfilEditor). L'avatar i el logotip no canvien.
 */
export function useImatgeDeFitxa({
  camp = 'heroImage', forma = 'capcalera', onImageUpload = null, onDesaCamp, onError, onDesat, finestra = null, identitat = false,
  noDestructiu = true,
} = {}) {
  const inputRef = useRef(null);
  const controlRef = useRef(null);
  const errorPujada = useRef(null);
  /* La promesa del desat del camp: Guardar l'espera abans de tancar. */
  const desat = useRef(null);
  const desaCampRef = useRef(onDesaCamp);
  desaCampRef.current = onDesaCamp;
  const errorRef = useRef(onError);
  errorRef.current = onError;
  /* P1-22 · L'avís del GPS es diu amb la finestra ja tancada: en la llengua de la interfície.
     B3-I18N §3.C · I l'avís de pujada i l'error de desat, que es diuen des de
     callbacks estables (el ref sempre porta el traductor d'este pintat). */
  const tRef = useRef(null);
  const t = useTraductorOpcional();
  tRef.current = t;
  const desatRef = useRef(onDesat);
  desatRef.current = onDesat;
  /* La guarda de pujada: el ref mana (el gest pot arribar abans del render);
     l'estat la fa visible al pare. */
  const pujantRef = useRef(false);
  const [pujant, setPujant] = useState(false);
  /* Si la finestra encara és oberta quan un desat falla (l'avís hi ix dins). */
  const obertRef = useRef(false);

  const handler = useHeroImageHandler({
    fieldName: camp,
    onImageUpload,
    onSaveField: (nom, valor) => {
      desat.current = Promise.resolve(desaCampRef.current?.(nom, valor));
      /* Bloc 3.5.4 · Guardar l'espera (i en llig el rebuig) just després: este
         escoltador buit evita que un rebuig primerenc es compte com a no gestionat. */
      desat.current.catch(() => {});
    },
    // Amb la finestra oberta, l'error es mostra dins: el toast quedaria davall.
    onError: (missatge) => { errorPujada.current = missatge; },
  });
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  /* Pla 2000 (punt 2) · «Canviar foto» dins de la finestra: la mateixa guarda
     de pujada que el selector de fora i la validació de la forma (canvia).
     El missatge, si n'hi ha, el diu la finestra. */
  const canviaRef = useRef(null);
  const canviaFoto = useCallback((fitxer) => {
    if (pujantRef.current) return tradueix(tRef.current, TEXTOS_CLOSCA.imatgePujant);
    return canviaRef.current?.(fitxer) ?? null;
  }, []);
  const { canviaFoto: ambCanviaFoto = false, ...restaFinestra } = finestra || {};
  const extres = finestra ? { ...restaFinestra, ...(ambCanviaFoto ? { onCanviaFoto: canviaFoto, acceptFoto: ACCEPT_FOTO } : null) } : null;

  /* P0-80 · El valor desat del camp que s'està re-enquadrant (ajusta). */
  const valorDesatRef = useRef(null);
  const enquadrament = useEnquadramentImatge({
    forma,
    identitat,
    noDestructiu,
    extres,
    onError: (missatge) => errorRef.current?.(missatge),
    onEnquadrat: async (fitxer, info, exif) => {
      // Un sol desat alhora: els refs (desat, errorPujada, controlRef) són d'ell.
      if (pujantRef.current) throw new Error(tradueix(tRef.current, TEXTOS_CLOSCA.imatgePujant));
      pujantRef.current = true;
      setPujant(true);
      try {
        errorPujada.current = null;
        desat.current = null;
        if (typeof fitxer === 'string') {
          /* P0-80 · Només ha canviat el marc: el valor desat (la referència, no
             l'adreça resolta) amb el fragment nou. Cap pujada. */
          desat.current = Promise.resolve(desaCampRef.current?.(camp, ambEnquadrament(valorDesatRef.current || fitxer, info?.enquadrament)));
        } else {
          /* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · La forma va amb el
             fitxer: l'avatar d'una persona es desa al camp logoImage i ha de
             pujar com a avatar (dins del pressupost), no com a logotip.
             Bloc 1.2 · I la tria de la casella de l'EXIF (`exif`, la de
             useEnquadramentImatge), si n'hi ha hagut.
             P0-80 · I el marc de la foto sencera, si n'hi ha (info.enquadrament). */
          const fet = await handlerRef.current.processaFitxer(fitxer, {
            pesMaxim: PES_MAXIM_FOTO, midaMaxima: costatDeSortida(forma), forma, ...exif,
            ...(info?.enquadrament ? { enquadrament: info.enquadrament } : null),
          });
          if (!fet) throw new Error(errorPujada.current || tradueix(tRef.current, PARELL_ERROR_DESAT_IMATGE));
        }
        /* Bloc 3.5.4 · Abans s'esperava sense mirar-ne el resultat: un 403
           tancava la finestra com si s'haguera desat. */
        if ((await desat.current) === false) throw new Error(tradueix(tRef.current, PARELL_ERROR_DESAT_IMATGE));
        const control = controlRef.current;
        controlRef.current = null;
        control?.acaba?.();
        desatRef.current?.(camp);
        // P1-64 · Només si la foto portava GPS de veres (DialegEnquadrament, avisaGpsEliminat).
        if (info?.gpsEliminat === true) errorRef.current?.(tradueix(tRef.current, TEXTOS_ENQUADRAMENT.gpsEliminat), 'info');
      } catch (err) {
        // Escape a mitja pujada: la finestra ja no hi és per a dir-ho.
        if (!obertRef.current) errorRef.current?.(err?.message || tradueix(tRef.current, PARELL_ERROR_DESAT_IMATGE));
        throw err;
      } finally {
        pujantRef.current = false;
        setPujant(false);
      }
    },
  });
  obertRef.current = enquadrament.obert;
  canviaRef.current = enquadrament.canvia;
  const obriFinestra = enquadrament.obri;

  const obri = useCallback((control) => {
    if (pujantRef.current) {
      errorRef.current?.(tradueix(tRef.current, TEXTOS_CLOSCA.imatgePujant), 'info');
      return;
    }
    controlRef.current = typeof control?.acaba === 'function' ? control : null;
    valorDesatRef.current = null;
    inputRef.current?.click();
  }, []);

  /* Pla 2000 (punt 2) · La imatge que ja hi ha, directa a la finestra (una
     adreça ja resolta: obriFinestra no la valida). Mateixa guarda que obri.
     Correcció F3 de la revisió · El retall ix en el format de la imatge
     carregada (formatDeLaFont): un avatar PNG amb transparència no torna
     amb fons blanc. */
  const ajusta = useCallback((font, control, desatDelCamp) => {
    if (pujantRef.current) {
      errorRef.current?.(tradueix(tRef.current, TEXTOS_CLOSCA.imatgePujant), 'info');
      return false;
    }
    if (typeof font !== 'string' || !font) return false;
    controlRef.current = typeof control?.acaba === 'function' ? control : null;
    // P0-80 · El valor desat, perquè un marc nou es dese sobre la referència i no sobre l'adreça resolta.
    valorDesatRef.current = typeof desatDelCamp === 'string' && desatDelCamp ? desatDelCamp : null;
    return obriFinestra(font, { formatDeLaFont: true });
  }, [obriFinestra]);

  const enTria = (e) => {
    const fitxer = e.target.files?.[0];
    e.target.value = '';
    if (!fitxer) return;
    if (pujantRef.current) {
      errorRef.current?.(tradueix(tRef.current, TEXTOS_CLOSCA.imatgePujant), 'info');
      return;
    }
    valorDesatRef.current = null;
    if (!obriFinestra(fitxer)) controlRef.current = null;
  };

  /* Un ref de funció: l'escoltador de `cancel` va amb el node, munte'l qui el munte. */
  const refInput = useCallback((node) => {
    inputRef.current?.removeEventListener('cancel', paraCancel);
    inputRef.current = node;
    node?.addEventListener('cancel', paraCancel);
  }, []);

  /* R22.1 (r221-ui-02, r221-text-11) · Sense aria-hidden, el selector és a
     l'arbre accessible (tabIndex -1 només el trau de l'ordre del tabulador):
     porta el nom del camp de la fitxa, traduït, com el botó que l'obri. */
  const input = (
    <input ref={refInput} type="file" accept={ACCEPT_FOTO} onChange={enTria} className="sdp-nomes-lector"
      tabIndex={-1} aria-label={tradueix(t, nomDelSelector(forma))}
      data-imatge-de-fitxa={camp} />
  );

  return {
    obri, ajusta, tanca: enquadrament.tanca, input, dialeg: enquadrament.dialeg, pujant, obert: enquadrament.obert,
  };
}

export default useImatgeDeFitxa;
