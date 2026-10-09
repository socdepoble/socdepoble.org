/**
 * TargetaViva.jsx — la targeta del document que s'està escrivint.
 *
 * T50 (decisió del Mestre, 260928: «Llista + dreta si hi cap») · Una sola
 * peça per als tres llocs on es veu la targeta mentre s'edita:
 *   · la fitxa activa de la columna central (NotaFitxa, i la fitxa del Perfil);
 *   · l'aside fix a la dreta de l'editor, quan hi cap (DocumentEditor);
 *   · el diàleg del xip «Vista targeta», quan no hi cap (BotoTargetaViva).
 *
 * És la UniversalCard de la llista (variant "pla"), la mateixa anatomia que
 * la publicació: caputxa taronja, cos i peu blau. Els botons ensenyen les
 * proporcions però no connecten amb res: el clic s'intercepta i ho diu el
 * diàleg del sistema (cap alert()). Sense «(i)» a la caputxa
 * (skill sdp-universal-page §1.C): l'avís apareix en clicar una acció.
 * Revisió del 261007 (M3-11) · L'enllaç dels drets no s'intercepta: és el
 * d'UniversalCard (EnllacDrets, sempre a «Drets d'autor») i navega, també fora
 * de l'editor. La targeta incrustada de l'editor (TargetaIncrustadaNodeView)
 * sí que para els enllaços. Si la previsualització ha de navegar o no és
 * decisió pendent del Mestre (F12 de l'auditoria 0030).
 * Onada 8 (261009) · La boina tampoc no s'intercepta: «un clic a QUALSEVOL
 * boina taronja porta SEMPRE al perfil públic de qui signa». Amb `autor.ruta`
 * (la de la barra taronja de l'editor) és l'enllaç d'UniversalCard i navega,
 * com el dels drets; sense, text, com abans.
 */
import { useCallback, useLayoutEffect, useState, useSyncExternalStore } from 'react';
import { IdCard } from 'lucide-react';
import { UniversalCard, Dialeg, Boto } from '../PedraSeca/index.js';
import { useImatgeResolta } from '../../hooks/useImatgeTargeta.js';
import { emojiDelQuadrat, propsDeTargetaViva } from './targetaViva.js';
import { insigniaEmojiXL } from './insigniaEmoji.jsx';
import { llegixDocumentViu, publicaDocumentViu, subscriuDocumentViu } from './documentViu.js';

/* Correcció D1 (revisió de T50) · Els textos, per consumidor: cap no pot
   prometre el que el seu consumidor no complix. `descripcio` és el diàleg que
   obri una acció de la targeta; `vista`, la descripció del diàleg del xip.
   AVIS_PREVISUALITZACIO és la reserva, sense cap promesa de publicació: la
   fa servir qui no passa `avis` (DocumentEditor, si l'adaptador no porta
   avisTargetaViva). Els textos d'usuari van amb els demostratius este/esta i
   l'apòstrof tipogràfic (’), com la resta de l'app. */
const TITOL_AVIS = 'Això és una previsualització';
const BOTONS = 'Els botons d’esta targeta —connectar, traduir, comentar i compartir—';
export const AVIS_PREVISUALITZACIO = Object.freeze({
  titol: TITOL_AVIS,
  descripcio: `Estàs veient este document en format targeta. ${BOTONS} no fan res mentres estigues editant.`,
  vista: 'Així es veu este document en format targeta.',
});
export const AVISOS_TARGETA_VIVA = Object.freeze({
  notes: Object.freeze({
    titol: TITOL_AVIS,
    descripcio: `Estàs veient com quedarà la nota una vegada publicada al Mur. ${BOTONS} només funcionen a la publicació de veritat: mentres estigues editant, no fan res.`,
    vista: 'Així quedarà la targeta d’esta nota una vegada publicada al Mur.',
  }),
  /* El Perfil no publica cap targeta amb esta anatomia (el directori i la
     fitxa pública són altres peces): el text no en promet cap. «Esta fitxa»
     i no «la teua»: la mateixa peça es veu també a la fitxa d'una
     organització, i allí no seria exacte. */
  perfil: Object.freeze({
    titol: TITOL_AVIS,
    descripcio: `Així es veu esta fitxa en format targeta. ${BOTONS} no fan res en esta previsualització.`,
    vista: 'Així es veu esta fitxa en format targeta.',
  }),
});

/* El Connectar de la previsualització també es compta, marcat com a
   previsualització (useAccions), perquè el Mestre ho puga comprovar. */
const TELEMETRIA_PREVISUALITZACIO = Object.freeze({ mode: 'previsualitzacio' });

/* La imatge i l'avatar es resolen amb useImatgeResolta (hooks/useImatgeTargeta.js):
   T7 (261004) l'ha tret d'ací sense canvis per a compartir-lo amb la targeta
   incrustada de l'editor. */

/**
 * document: el de l'editor (HTML sanejat als camps de text).
 * autor: { nom, avatar, poble, ruta }, el de la barra taronja. etiquetes: les píndoles.
 * onMainClick: la fitxa de la llista la torna a triar; a l'aside no fa res.
 * avis: els textos del consumidor (AVISOS_TARGETA_VIVA); sense, la reserva.
 * actual: és la fitxa triada de la llista (aria-current a UniversalCard) i,
 *   sense imatge, porta l'emoji XL al quadrat (ordre del Mestre, 261007).
 */
export function TargetaViva({ document, autor = null, etiquetes, className, onMainClick, avis = AVIS_PREVISUALITZACIO, actual = false }) {
  const [avisObert, setAvisObert] = useState(false);
  const avisa = useCallback((event) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    setAvisObert(true);
  }, []);
  const tancaAvis = useCallback(() => setAvisObert(false), []);

  const props = propsDeTargetaViva(document, { autor, etiquetes });
  const imatge = useImatgeResolta(props.imageUrl);
  const avatar = useImatgeResolta(props.avatarUrl);
  /* Ordre del Mestre (261007) · «Aplica a TargetaViva.jsx (quan actua com a
     ítem de llista)»: sense imatge i amb una emoticona triada, l'emoji XL
     ocupa el quadrat (insigniaEmojiXL, la mateixa insígnia del catàleg); amb
     imatge, cap insígnia (CardBody la pintaria igualment). Només a la fitxa de
     la llista, que és la que porta `actual` (NotaFitxa, PerfilShell): l'aside
     i el xip «Vista targeta» de l'editor es queden com eren (Llei del Píxel)
     fins que el Mestre ho decidisca. L'emoticona del centre de la caputxa es
     queda: és la llei de la barra taronja (Pedra Seca §10, «en lectura o
     targeta, buit si no s'ha triat»), i amb imatge és l'únic lloc on es veu.
     Revisió del 261007 (M2-08) · Sense etiqueta: la targeta ja diu el títol, i
     el quadrat és decoratiu (no el repetix al lector). */
  const insignia = actual ? insigniaEmojiXL(null, emojiDelQuadrat(document)) : null;

  return (
    <>
      <UniversalCard
        {...props}
        imageUrl={imatge}
        avatarUrl={avatar}
        squareBadge={insignia}
        className={['sdp-targeta-viva-carta', className].filter(Boolean).join(' ')}
        variant="pla"
        hasFooter
        showPin={false}
        showTranslate
        showComment
        showShare
        showConnect
        connectLabel="CONNECTAR"
        telemetria={TELEMETRIA_PREVISUALITZACIO}
        onDateTime={avisa}
        onConnect={avisa}
        onTranslate={avisa}
        onComment={avisa}
        onShare={avisa}
        onPin={avisa}
        onMainClick={onMainClick}
        actual={actual}
      />
      <Dialeg
        obert={avisObert}
        onTanca={tancaAvis}
        titol={avis.titol}
        descripcio={avis.descripcio}
        mida="m"
        accions={<Boto varietat="accent" onClick={tancaAvis}>Entesos</Boto>}
      />
    </>
  );
}

/**
 * El xip «Vista targeta» (família dels de davall del títol: Vista A4, Crear
 * portada) i el diàleg amb la targeta. És la xarxa quan l'aside no cap a la
 * dreta de l'editor, i en navegadors sense @container (components.css).
 * La targeta només es munta amb el diàleg obert. `avis`, com a TargetaViva.
 */
export function BotoTargetaViva({ document, autor = null, etiquetes, avis = AVIS_PREVISUALITZACIO }) {
  const [obert, setObert] = useState(false);
  const tanca = useCallback(() => setObert(false), []);
  return (
    <>
      <button type="button" className="sdp-classificacio-pindola sdp-boto-targeta-viva" aria-haspopup="dialog" onClick={() => setObert(true)}>
        <span className="sp-card-label sdp-badge-buit"><IdCard size={14} aria-hidden="true" /><span className="sdp-classificacio-pindola__text">Vista targeta</span></span>
      </button>
      <Dialeg
        obert={obert}
        onTanca={tanca}
        titol="Vista targeta"
        descripcio={avis.vista}
        mida="m"
      >
        {obert ? <TargetaViva document={document} autor={autor} etiquetes={etiquetes} avis={avis} /> : null}
      </Dialeg>
    </>
  );
}

/** L'entrada viva ({ document, autor, etiquetes }) d'una clau, o null (documentViu.js). */
export function useDocumentViu(clau) {
  const subscriu = useCallback((oient) => subscriuDocumentViu(clau, oient), [clau]);
  const llig = useCallback(() => llegixDocumentViu(clau), [clau]);
  return useSyncExternalStore(subscriu, llig, llig);
}

/**
 * Publica l'entrada viva d'una clau mentre el component viu. Abans de pintar
 * (layout): la fitxa de la llista no parpelleja de compacta a targeta.
 */
export function usePublicaDocumentViu(clau, entrada) {
  useLayoutEffect(() => publicaDocumentViu(clau, entrada), [clau, entrada]);
}
