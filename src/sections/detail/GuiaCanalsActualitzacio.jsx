/**
 * GuiaCanalsActualitzacio.jsx — Bloc editorial blanc Pedra Seca per al peu de
 * `/page/descarregues` (Onada R22 · T2).
 *
 *   · Explica en les 5 llengües (`ca, es, en, eu, gl`) i sense tecnicismes foscos
 *     la diferència entre els dos canals d'Android:
 *       1. Google Play (recomanat per a la majoria): actualització automàtica i
 *          avís suau integrat (`versioRecomanada`).
 *       2. Fitxer `.apk` directe: instal·lació manual independent signada amb la
 *          clau pròpia del projecte.
 *   · Aclareix per què Android mostra «No s'ha instal·lat l'aplicació»
 *     (`UPDATE_INCOMPATIBLE`) si es prova d'instal·lar l'un damunt de l'altre,
 *     i com desinstal·lar i reinstal·lar netament sense perdre el compte ni les
 *     dades guardades al servidor.
 *   · R24 botigues (E1, KGA-07) · Abans de desinstal·lar, la còpia del que només
 *     viu al telèfon (allowBackup=false): el llibre de la Facturació i el cofre de
 *     la Gestoria. Que Play i l'APK porten signatures diferents no s'ha verificat a
 *     Play Console (RC-2): el text ho diu en condicional.
 *   · Cap `<dl>` de dues columnes (Llei de Maquetació Editorial) i cap enllaç
 *     duplicat a les botigues oficials ni a `/versions`: un botó centrat puja
 *     suaument a les opcions oficials de descàrrega de la capçalera.
 */
import { useRef } from 'react';
import { ArrowUp } from 'lucide-react';
import { useUIActions } from '../../app/contexts/UIContext';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssPeuICanals from '../../css/diferit-peu-i-canals.css?inline';

export default function GuiaCanalsActualitzacio() {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'peu-i-canals', cssPeuICanals);
  const { t } = useUIActions();

  /* Auditoria del kit de Gemini R22 · El títol es busca a l'arrel del botó
     (getRootNode): dins del connector de WordPress l'App viu en l'arrel ombra
     de <soc-de-poble> i document.querySelector no hi entra. */
  const pujaAlsCanalsOficials = (e) => {
    const arrel = e?.currentTarget?.getRootNode?.() ?? (typeof document !== 'undefined' ? document : null);
    const capcalera = typeof arrel?.querySelector === 'function' ? arrel.querySelector('header.page-title') : null;
    const h1 = capcalera?.querySelector('h1') || capcalera;
    if (!h1) return;
    h1.scrollIntoView?.({ block: 'start' });
    if (!h1.hasAttribute('tabindex')) h1.setAttribute('tabindex', '-1');
    h1.focus?.({ preventScroll: true });
  };

  return (
    <div ref={arrelRef} className="sdp-guia-canals">
      <h3 className="sdp-guia-canals__titol">
        {t('descarregues.canals.titol', 'Com es manté al dia l’aplicació en cada canal')}
      </h3>
      <p className="sdp-guia-canals__intro">
        {t(
          'descarregues.canals.intro',
          'A l’iPhone, l’iPad i la web l’aplicació s’actualitza per un sol camí. A Android tens dos canals vàlids, però convé no barrejar-los en el mateix telèfon.'
        )}
      </p>

      <div className="sdp-guia-canals__bloc">
        <h4>
          {t('descarregues.canals.play.titol', '1. Google Play: actualització automàtica i avís suau')}
        </h4>
        <p>
          {t(
            'descarregues.canals.play.text',
            'Si instal·les Sóc de Poble des de Google Play, el telèfon baixa les millores tot sol. Quan ix una versió recomanada nova i encara no s’ha aplicat, l’aplicació mostra a dalt una barra discreta i no bloquejant perquè l’actualitzes amb un toc quan et vinga bé.'
          )}
        </p>
      </div>

      <div className="sdp-guia-canals__bloc">
        <h4>
          {t('descarregues.canals.apk.titol', '2. Fitxer APK directe: instal·lació manual independent')}
        </h4>
        <p>
          {t(
            'descarregues.canals.apk.text',
            'El fitxer APK directe està pensat per a aparells sense Google Play. En este canal les actualitzacions no es baixen soles des de la botiga: cal descarregar i obrir el nou fitxer APK quan es publique.'
          )}
        </p>
      </div>

      <div className="sdp-guia-canals__bloc sdp-guia-canals__bloc--avis">
        <h4>
          {t(
            'descarregues.canals.signatura.titol',
            'Per què Android pot dir «No s’ha instal·lat l’aplicació» (UPDATE_INCOMPATIBLE) en canviar de canal?'
          )}
        </h4>
        <p>
          {t(
            'descarregues.canals.signatura.text',
            'Si l’aplicació de Google Play i el fitxer APK directe no porten la mateixa signatura, Android no deixa instal·lar l’una damunt de l’altra: si tenies l’APK de proves i passes a Google Play (o al revés), primer cal desinstal·lar l’aplicació antiga i després instal·lar la nova des del canal triat. El teu compte, poble i publicacions continuen intactes al servidor.'
          )}
        </p>
        <p>
          {t(
            'descarregues.canals.signatura.dadesLocals',
            'Abans de desinstal·lar-la, fes còpia del que només viu en este telèfon: la Facturació (Gestoria › «Còpia del llibre») i el cofre de la Gestoria («Descarrega la còpia xifrada»). Android no en fa cap còpia de seguretat: si desinstal·les l’aplicació sense eixes còpies, es perden per sempre.'
          )}
        </p>
      </div>

      <div className="sdp-accions sdp-guia-canals__accions">
        <button
          type="button"
          className="sdp-boto sdp-boto--secundari"
          onClick={pujaAlsCanalsOficials}
        >
          <ArrowUp size={18} aria-hidden="true" focusable="false" />
          <span>{t('descarregues.canals.pujaBotons', 'Torna als botons oficials de descàrrega')}</span>
        </button>
      </div>
    </div>
  );
}
