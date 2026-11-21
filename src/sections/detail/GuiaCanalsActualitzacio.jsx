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
 *   · Onada v1.2.16 (ordres del Mestre 261121 01:32 i 01:55: ZERO APK fora de
 *     botiga) · DEROGA el canal 2: ja no hi ha «dos canals vàlids» a Android.
 *     La introducció diu el camí oficial de cada aparell (Google Play, l'App
 *     Store i el navegador); el bloc 2 passa a «Cap APK fora de botiga» (per què:
 *     la Protecció Avançada d'Android i l'actualització sola de Google Play; i el
 *     navegador mentrestant), i l'avís d'UPDATE_INCOMPATIBLE parla només del pas
 *     d'un APK de proves antic a Google Play, mai al revés. Els tres blocs, els
 *     títols i el botó es queden al seu lloc (cap element nou).
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
          'Cada aparell s’actualitza per un sol camí oficial: Google Play a Android, l’App Store a l’iPhone i l’iPad, i el navegador a la web.'
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
          {t('descarregues.canals.apk.titol', '2. Cap APK fora de botiga')}
        </h4>
        <p>
          {t(
            'descarregues.canals.apk.text',
            'Sóc de Poble no oferix cap fitxer APK per a instal·lar a mà: amb la Protecció Avançada d’Android activada, el telèfon no deixa instal·lar aplicacions de fora de botiga, i fora de Google Play l’aplicació no s’actualitzaria sola. Mentre no la tingues a Google Play, fes-la servir des del navegador.'
          )}
        </p>
      </div>

      <div className="sdp-guia-canals__bloc sdp-guia-canals__bloc--avis">
        <h4>
          {t(
            'descarregues.canals.signatura.titol',
            'Per què Android pot dir «No s’ha instal·lat l’aplicació» (UPDATE_INCOMPATIBLE) en passar a Google Play?'
          )}
        </h4>
        <p>
          {t(
            'descarregues.canals.signatura.text',
            'Si tens un APK de proves antic i no porta la mateixa signatura que l’aplicació de Google Play, Android no deixa instal·lar l’una damunt de l’altra: primer cal desinstal·lar l’antiga i després instal·lar la de Google Play. El teu compte, poble i publicacions continuen intactes al servidor.'
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
