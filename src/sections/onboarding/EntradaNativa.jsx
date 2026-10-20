/* Fase D (261020, tasca 1; ordre del Mestre) · L'accés ràpid de l'app nativa:
   «Continua amb Apple» (només a iOS) i «Continua amb Google», en l'ordre que diu
   el registre (config/entradaNativa.js). Només presentació: l'estat i les
   accions són d'OnboardingSection.jsx. Cap style en línia; els colors de marca
   són tokens (--sdp-marca-*) i els dos botons fan 48px d'alt (HIG i Google).
   La regió viva (role="status") és sempre muntada i només en canvia el text:
   VoiceOver no anuncia un node que naix amb el text ja posat. */
import { LoaderCircle } from 'lucide-react';
import { Alerta, Boto } from '../../components/PedraSeca/index.js';
import { LogotipApple, LogotipGoogle } from './LogotipsDeMarca.jsx';

const CLASSE = Object.freeze({ apple: 'sdp-boto--apple', google: 'sdp-boto--google' });
const CLAU = Object.freeze({ apple: 'section.login.nativa.apple', google: 'section.login.nativa.google' });
const LOGOTIP = Object.freeze({ apple: LogotipApple, google: LogotipGoogle });

export function EntradaNativa({ proveidors, t, enCurs = null, bloquejat = false, error = null, onEntra, onCancela = null, refBoto }) {
  return (
    <section className="sp-card sp-card--onboarding">
      <div className="sp-card-body">
        <h3>{t('section.login.nativa.titol')}</h3>
        <p>{t('section.login.nativa.entradilla')}</p>
        <div className="onboarding-entrada-nativa">
          {proveidors.map((p) => {
            const Logotip = LOGOTIP[p];
            return (
              <button
                key={p}
                ref={(node) => refBoto?.(p, node)}
                type="button"
                className={['sdp-boto', 'sdp-boto--ple', 'sdp-boto--marca', CLASSE[p]].join(' ')}
                onClick={() => onEntra(p)}
                disabled={bloquejat}
                aria-busy={enCurs === p ? 'true' : undefined}
              >
                <Logotip />
                <span>{t(CLAU[p])}</span>
                {enCurs === p ? <LoaderCircle className="sdp-boto__gir" size={18} aria-hidden="true" focusable="false" /> : null}
              </button>
            );
          })}
        </div>
        {/* D8 · Pendent de la validació legal del Mestre. */}
        <p className="onboarding-card__intro">{t('section.login.nativa.avisDades')}</p>
        {/* Fase D (261020, revisió) · Un avís que no és error (un testimoni
            rebutjat, una altra entrada oberta) es diu per esta regió ja muntada;
            l'Alerta visible, llavors, sense rol (no es llig dues vegades). Un
            error continua amb role="alert", que sí s'anuncia en nàixer. */}
        <p className="sdp-nomes-lector" role="status">
          {enCurs ? t('section.login.nativa.esperant') : (error && error.to !== 'error' ? error.text : '')}
        </p>
        {enCurs && onCancela ? <Boto varietat="fantasma" onClick={onCancela}>{t('section.login.nativa.cancela')}</Boto> : null}
        {error ? <Alerta to={error.to} viva={error.to === 'error'}>{error.text}</Alerta> : null}
      </div>
    </section>
  );
}
