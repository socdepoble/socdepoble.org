import { Fragment, useRef } from 'react';
import { AlertTriangle, Check, CircleHelp, Eye, X } from 'lucide-react';
import { Link } from '../../app/contexts/RouterContext.jsx';
import { useUIActionsOpcional } from '../../app/contexts/UIContext.jsx';
import { Accions, Insignia, QuadreDeComandament } from '../../components/PedraSeca/index.js';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssEsdeveniments from '../../css/diferit-esdeveniments.css?inline';
import cssEspecimens from '../../css/diferit-especimens.css?inline';
import { textosCalendariRsvp } from '../calendari/i18nCalendariRsvp.js';
import { textosAparadorGuia } from './i18nAparadorGuiaPasAPas.js';

/** Converteix una cadena amb etiquetes <strong>…</strong> a nodes JSX purs sense innerHTML. */
function prosaAmbNegretes(text) {
  const parts = String(text || '').split(/(<strong>[\s\S]*?<\/strong>)/g);
  return parts.map((part, idx) => {
    const m = /^<strong>([\s\S]*?)<\/strong>$/.exec(part);
    if (m) return <strong key={idx}>{m[1]}</strong>;
    return <Fragment key={idx}>{part}</Fragment>;
  });
}

export default function AparadorGuiaPasAPas({ language: idiomaProp }) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'especimens', cssEspecimens);
  useFullDiferit(arrelRef, 'esdeveniments', cssEsdeveniments);

  const ui = useUIActionsOpcional();
  const idioma = idiomaProp ?? ui?.language ?? 'ca';
  const tx = textosAparadorGuia(idioma);
  const txRsvp = textosCalendariRsvp(idioma);

  return (
    <div ref={arrelRef} className="cms-preview" data-testid="aparador-guia-pas-a-pas">
      <h3>{tx.quadreH3}</h3>
      <p>{prosaAmbNegretes(tx.quadreIntro)}</p>

      <QuadreDeComandament
        estat={{ text: tx.estatText, viu: true }}
        periode={tx.periode}
        xifres={tx.xifres}
        ranquing={{
          titol: tx.ranquingTitol,
          files: tx.ranquingFiles
        }}
        nivell={4}
      />

      <h3>{tx.mostresH3}</h3>
      <p>{prosaAmbNegretes(tx.mostresIntro)}</p>

      <figure className="sdp-especimen__figura" data-testid="mostra-inerta-rsvp">
        <figcaption>{tx.mostraRsvpCaption}</figcaption>
        <div className="sdp-especimen__viu" inert="" aria-hidden="true">
          <div className="sdp-cal-desplegable__item">
            <div className="sdp-cal-desplegable__info">
              <span className="sdp-cal-desplegable__nom">{tx.mostraRsvpActe}</span>
              <p className="sdp-cal-desplegable__detall">{tx.mostraRsvpData}</p>
            </div>
            <div className="sdp-cal-rsvp-grup">
              <span className="sdp-boto sdp-boto--primari sdp-cal-rsvp-grup__boto">
                <Check size={16} />
                <span>{txRsvp.assistire}</span>
              </span>
              <span className="sdp-boto sdp-boto--secundari sdp-cal-rsvp-grup__boto">
                <CircleHelp size={16} />
                <span>{txRsvp.potser}</span>
              </span>
              <span className="sdp-boto sdp-boto--secundari sdp-cal-rsvp-grup__boto">
                <X size={16} />
                <span>{txRsvp.noAssistire}</span>
              </span>
            </div>
            <div className="sdp-cal-rsvp-avis-solapament">
              <AlertTriangle size={18} />
              <p className="sdp-cal-rsvp-avis-solapament__text">
                <strong>{`${tx.mostraRsvpAvisTitol} `}</strong>
                {tx.mostraRsvpAvisCos}
              </p>
            </div>
          </div>
        </div>
      </figure>

      <figure className="sdp-especimen__figura" data-testid="mostra-inerta-senior">
        <figcaption>{tx.mostraSeniorCaption}</figcaption>
        <div className="sdp-especimen__viu" inert="" aria-hidden="true">
          <div className="sdp-especimen__fila">
            <span className="sdp-boto sdp-boto--primari sdp-cal-rsvp-grup__boto">
              <Eye size={18} />
              <span>{tx.mostraSeniorEtiqueta}</span>
            </span>
            <Insignia to="exit">{tx.mostraSeniorEstat}</Insignia>
          </div>
        </div>
      </figure>

      <h3>{tx.einesExtraH3}</h3>
      <p>{prosaAmbNegretes(tx.einesExtraParagraf)}</p>
      <Accions>
        {tx.enllacosExtra.map((item) => (
          <Link key={item.to} className="sdp-boto sdp-boto--secundari sdp-cal-rsvp-grup__accio" to={item.to}>
            {item.text}
          </Link>
        ))}
      </Accions>
    </div>
  );
}
