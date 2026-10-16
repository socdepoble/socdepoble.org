import { useCallback, useRef, useState } from 'react';
import useHeroImageHandler from '../../hooks/useHeroImageHandler.js';
import {
  ACCEPT_FOTO, PES_MAXIM_FOTO, costatDeSortida, useEnquadramentImatge,
} from '../../components/universal/enquadrament/useEnquadramentImatge.jsx';
import { AJUDA_IMATGE_PUJANT as AVIS_IMATGE_PUJANT } from '../../components/universal/UniversalEditorShell.jsx';

/* Un pas que falla sense missatge propi (no hauria de passar: el hook l'avisa). */
export const ERROR_DESAT_IMATGE = 'No s’ha pogut desar la imatge.';
/* Correcció de la revisió (261008) · El que es diu si es torna a obrir
   mentre la imatge encara puja: la MATEIXA constant que la guarda de la
   closca (AJUDA_IMATGE_PUJANT, ordre E, 261007), no una còpia del text que
   es puga desfasar. Es torna a exportar amb el nom de sempre: PerfilEditor i
   les proves l'importen d'ací. No obri cap dependència nova: PerfilEditor ja
   importava la closca, i la closca no importa directament res de
   sections/profile. A més, és un enllaç viu que només es llig dins de
   funcions, mai en avaluar el mòdul: un cicle transitiu no el trobaria buit. */
export { AVIS_IMATGE_PUJANT };

/* Tancar el selector de fitxers sense triar dispara `cancel` a l'input, i
   puja: dins d'un <dialog>, Dialeg el prendria per un Escape i el tancaria.
   Es para a l'input (React només escolta `cancel` al <dialog>). */
const paraCancel = (e) => e.stopPropagation();

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
 *   res més que dir-ho (onError(AVIS_IMATGE_PUJANT, 'info')): cap segona
 *   pujada trepitja la primera ni el seu control. Si la pujada falla amb la
 *   finestra ja tancada, l'avís va fora (onError), perquè dins ja no hi és.
 */
export function useImatgeDeFitxa({
  camp = 'heroImage', forma = 'capcalera', onImageUpload = null, onDesaCamp, onError, onDesat,
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

  const enquadrament = useEnquadramentImatge({
    forma,
    onError: (missatge) => errorRef.current?.(missatge),
    onEnquadrat: async (fitxer, info, exif) => {
      // Un sol desat alhora: els refs (desat, errorPujada, controlRef) són d'ell.
      if (pujantRef.current) throw new Error(AVIS_IMATGE_PUJANT);
      pujantRef.current = true;
      setPujant(true);
      try {
        errorPujada.current = null;
        desat.current = null;
        /* Gauntlet 261016 (Bloc 1, Llei del Quadrat) · La forma va amb el
           fitxer: l'avatar d'una persona es desa al camp logoImage i ha de
           pujar com a avatar (dins del pressupost), no com a logotip.
           Bloc 1.2 · I la tria de la casella de l'EXIF (`exif`, la de
           useEnquadramentImatge), si n'hi ha hagut. */
        const fet = await handlerRef.current.processaFitxer(fitxer, {
          pesMaxim: PES_MAXIM_FOTO, midaMaxima: costatDeSortida(forma), forma, ...exif,
        });
        if (!fet) throw new Error(errorPujada.current || ERROR_DESAT_IMATGE);
        /* Bloc 3.5.4 · Abans s'esperava sense mirar-ne el resultat: un 403
           tancava la finestra com si s'haguera desat. */
        if ((await desat.current) === false) throw new Error(ERROR_DESAT_IMATGE);
        const control = controlRef.current;
        controlRef.current = null;
        control?.acaba?.();
        desatRef.current?.(camp);
      } catch (err) {
        // Escape a mitja pujada: la finestra ja no hi és per a dir-ho.
        if (!obertRef.current) errorRef.current?.(err?.message || ERROR_DESAT_IMATGE);
        throw err;
      } finally {
        pujantRef.current = false;
        setPujant(false);
      }
    },
  });
  obertRef.current = enquadrament.obert;
  const obriFinestra = enquadrament.obri;

  const obri = useCallback((control) => {
    if (pujantRef.current) {
      errorRef.current?.(AVIS_IMATGE_PUJANT, 'info');
      return;
    }
    controlRef.current = typeof control?.acaba === 'function' ? control : null;
    inputRef.current?.click();
  }, []);

  const enTria = (e) => {
    const fitxer = e.target.files?.[0];
    e.target.value = '';
    if (!fitxer) return;
    if (pujantRef.current) {
      errorRef.current?.(AVIS_IMATGE_PUJANT, 'info');
      return;
    }
    if (!obriFinestra(fitxer)) controlRef.current = null;
  };

  /* Un ref de funció: l'escoltador de `cancel` va amb el node, munte'l qui el munte. */
  const refInput = useCallback((node) => {
    inputRef.current?.removeEventListener('cancel', paraCancel);
    inputRef.current = node;
    node?.addEventListener('cancel', paraCancel);
  }, []);

  const input = (
    <input ref={refInput} type="file" accept={ACCEPT_FOTO} onChange={enTria} className="sdp-nomes-lector"
      tabIndex={-1} aria-hidden="true" data-imatge-de-fitxa={camp} />
  );

  return { obri, input, dialeg: enquadrament.dialeg, pujant, obert: enquadrament.obert };
}

export default useImatgeDeFitxa;
