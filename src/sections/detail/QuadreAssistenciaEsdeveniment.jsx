import { useId, useRef, useState } from 'react';
import { CalendarCheck2, Check, CircleHelp, Lock, MapPin, MessageSquare, Users, X } from 'lucide-react';
import { Insignia } from '../../components/PedraSeca/atoms/Insignia.jsx';
import { SquareBadge } from '../../components/PedraSeca/organismes/SquareBadge.jsx';
import { interlocutorDelPrivat, useComentaEnPrivat } from '../../components/PedraSeca/hooks/useAccions.js';
import { useXatSocDePoble } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import { useNavigate } from '../../app/contexts/RouterContext';
import { useSessioOpcional } from '../../app/contexts/SessionContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useFullDiferit } from '../../config/fullDiferit.js';
import { rutaXatDePagina } from '../../config/objecteConnectable.js';
import cssEsdeveniments from '../../css/diferit-esdeveniments.css?inline';
import {
  desaRsvpEsdeveniment,
  participantRsvpActual,
  useRsvpEsdeveniment
} from '../calendari/rsvpEsdeveniments.js';
import { recordaReferenciaPaginaXat } from '../xat/referenciaPaginaXat.js';

function textNet(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function resumDatesDeLActe(item) {
  const etiqueta = textNet(item?.date_label) || textNet(item?.calendar_badge?.label);
  if (etiqueta) return etiqueta;
  const inici = textNet(item?.dades?.data_inici) || textNet(item?.inici) || textNet(item?.date);
  const fi = textNet(item?.dades?.data_fi) || textNet(item?.fi);
  const hora = textNet(item?.time);
  if (inici && fi && fi !== inici) return `${inici} – ${fi}`;
  if (inici && hora) return `${inici} · ${hora}`;
  return inici;
}

function llocDeLActe(item) {
  const lloc = textNet(item?.dades?.lloc) || textNet(item?.location);
  const poble = textNet(item?.dades?.poble) || textNet(item?.town_name);
  if (lloc && poble && !lloc.toLowerCase().includes(poble.toLowerCase())) return `${lloc} · ${poble}`;
  return lloc || poble;
}

function etiquetaRespostaXat(intencio, t) {
  if (intencio === 'si') return `✅ ${t('section.events.rsvp.si', 'Sí, compta amb mi')}`;
  if (intencio === 'potser') return `🤔 ${t('section.events.rsvp.potser', 'Potser')}`;
  if (intencio === 'no') return `❌ ${t('section.events.rsvp.no', 'No podré anar-hi')}`;
  return '';
}

export function QuadreAssistenciaEsdeveniment({ item, badge = null, objecteXat = null }) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'esdeveniments', cssEsdeveniments);

  const idNota = useId();
  const { t } = useUIActions();
  const navigate = useNavigate();
  const currentUser = useSessioOpcional()?.currentUser || null;
  const idParticipant = participantRsvpActual(currentUser);
  const rsvp = useRsvpEsdeveniment(item, idParticipant);

  const xatSocDePoble = useXatSocDePoble();
  const ambQuiPrivat = interlocutorDelPrivat(objecteXat, xatSocDePoble);
  const comentaEnPrivat = useComentaEnPrivat(ambQuiPrivat);

  const [idActeVist, setIdActeVist] = useState(item?.id ?? null);
  const [notaEsborrany, setNotaEsborrany] = useState(rsvp.nota);
  const [confirmacio, setConfirmacio] = useState(false);

  if ((item?.id ?? null) !== idActeVist) {
    setIdActeVist(item?.id ?? null);
    setNotaEsborrany(rsvp.nota);
    setConfirmacio(false);
  }

  const rutaXat = objecteXat ? rutaXatDePagina(objecteXat) : null;
  const tipusActe = textNet(item?.type_label);
  const datesText = resumDatesDeLActe(item);
  const llocText = llocDeLActe(item);
  const titolActe = textNet(item?.title) || t('section.detail.events.itemTitle', 'Acte');
  const teRespostaONota = Boolean(rsvp.intencio || notaEsborrany.trim());

  const triaIntencio = (novaIntencio) => {
    const resultat = desaRsvpEsdeveniment(item, {
      idParticipant,
      intencio: novaIntencio,
      nota: notaEsborrany
    });
    if (resultat.ok) setConfirmacio(true);
  };

  const desaNota = () => {
    const intencioEfectiva = rsvp.intencio || 'si';
    const resultat = desaRsvpEsdeveniment(item, {
      idParticipant,
      intencio: intencioEfectiva,
      nota: notaEsborrany
    });
    if (resultat.ok) setConfirmacio(true);
  };

  const preparaEsborranyDelXat = () => {
    const intencioEfectiva = rsvp.intencio || (notaEsborrany.trim() ? 'potser' : null);
    if (intencioEfectiva) {
      desaRsvpEsdeveniment(item, {
        idParticipant,
        intencio: intencioEfectiva,
        nota: notaEsborrany
      });
    }
    const capcalera = etiquetaRespostaXat(intencioEfectiva, t);
    const cosNota = notaEsborrany.trim();
    const missatge = [capcalera, cosNota].filter(Boolean).join(' — ');
    recordaReferenciaPaginaXat(objecteXat, { esborrany: missatge });
  };

  const obriXatPublic = () => {
    if (!rutaXat) return;
    preparaEsborranyDelXat();
    navigate(rutaXat);
  };

  const obriXatPrivat = () => {
    preparaEsborranyDelXat();
    comentaEnPrivat();
  };

  const etiquetaBotoPrivat = ambQuiPrivat?.nom
    ? t('section.events.rsvp.xatPrivatAmb', 'Preguntar en privat a {nom}').replace('{nom}', () => ambQuiPrivat.nom)
    : t('section.events.rsvp.xatPrivat', 'Preguntar en privat');

  return (
    <section
      ref={arrelRef}
      className="sdp-quadre-esdeveniment"
      aria-label={t('section.events.rsvp.titol', 'Assistiràs a este esdeveniment?')}
      data-testid="quadre-assistencia-esdeveniment"
    >
      <div className="sdp-quadre-esdeveniment__cap">
        {badge ? <SquareBadge badge={badge} /> : null}
        <div className="sdp-quadre-esdeveniment__resum">
          <p className="sdp-quadre-esdeveniment__titol">{titolActe}</p>
          {datesText ? (
            <p className="sdp-quadre-esdeveniment__meta">
              <CalendarCheck2 size={16} aria-hidden="true" />{' '}
              <strong>{datesText}</strong>
            </p>
          ) : null}
          {llocText ? (
            <p className="sdp-quadre-esdeveniment__meta">
              <MapPin size={16} aria-hidden="true" />{' '}
              <span>{llocText}</span>
            </p>
          ) : null}
          <div className="sdp-quadre-esdeveniment__insignies">
            {tipusActe ? <Insignia to="info">{tipusActe}</Insignia> : null}
            <Insignia to={rsvp.confirmats > 0 ? 'exit' : 'neutre'}>
              <Users size={14} aria-hidden="true" />{' '}
              <span>{`${t('section.events.rsvp.confirmats', 'Compta amb mi')}: ${rsvp.confirmats}`}</span>
            </Insignia>
          </div>
        </div>
      </div>

      <div className="sdp-quadre-esdeveniment__pregunta">
        <p className="sdp-quadre-esdeveniment__llegenda">
          {t('section.events.rsvp.titol', 'Assistiràs a este esdeveniment?')}
        </p>

        <div className="sdp-quadre-esdeveniment__opcions" role="group" aria-label={t('section.events.rsvp.titol', 'Assistiràs a este esdeveniment?')}>
          <button
            type="button"
            aria-pressed={rsvp.intencio === 'si'}
            className={rsvp.intencio === 'si' ? 'sdp-boto sdp-boto--primari' : 'sdp-boto sdp-boto--secundari'}
            onClick={() => triaIntencio('si')}
          >
            <Check size={16} aria-hidden="true" />
            <span>{t('section.events.rsvp.si', 'Sí, compta amb mi')}</span>
          </button>

          <button
            type="button"
            aria-pressed={rsvp.intencio === 'potser'}
            className={rsvp.intencio === 'potser' ? 'sdp-boto sdp-boto--primari' : 'sdp-boto sdp-boto--secundari'}
            onClick={() => triaIntencio('potser')}
          >
            <CircleHelp size={16} aria-hidden="true" />
            <span>{t('section.events.rsvp.potser', 'Potser')}</span>
          </button>

          <button
            type="button"
            aria-pressed={rsvp.intencio === 'no'}
            className={rsvp.intencio === 'no' ? 'sdp-boto sdp-boto--accent' : 'sdp-boto sdp-boto--secundari'}
            onClick={() => triaIntencio('no')}
          >
            <X size={16} aria-hidden="true" />
            <span>{t('section.events.rsvp.no', 'No podré anar-hi')}</span>
          </button>
        </div>

        <div className="sdp-quadre-esdeveniment__nota">
          <label htmlFor={idNota} className="sdp-quadre-esdeveniment__etiqueta">
            {t('section.events.rsvp.notaLabel', 'Vols afegir un comentari o motiu? (opcional)')}
          </label>
          <input
            id={idNota}
            type="text"
            className="sdp-control"
            value={notaEsborrany}
            maxLength={500}
            onChange={(event) => {
              setNotaEsborrany(event.target.value);
              setConfirmacio(false);
            }}
            placeholder={t(
              'section.events.rsvp.notaPlaceholder',
              'Ex.: Eixes dates coincidixen amb festes al meu poble, anem dos en cotxe…'
            )}
          />
        </div>

        <div className="sdp-quadre-esdeveniment__accions">
          {teRespostaONota ? (
            <button type="button" className="sdp-boto sdp-boto--secundari" onClick={desaNota}>
              <Check size={16} aria-hidden="true" />
              <span>{t('section.events.rsvp.desa', 'Desar resposta')}</span>
            </button>
          ) : null}

          {rutaXat ? (
            <button
              type="button"
              className="sdp-boto sdp-boto--primari"
              onClick={obriXatPublic}
            >
              <MessageSquare size={16} aria-hidden="true" />
              <span>
                {teRespostaONota
                  ? t('section.events.rsvp.enviaXat', 'Comentar al xat públic')
                  : t('section.events.rsvp.obriXat', 'Xat públic de l’esdeveniment')}
              </span>
            </button>
          ) : null}

          {objecteXat ? (
            <button
              type="button"
              className="sdp-boto sdp-boto--secundari"
              onClick={obriXatPrivat}
            >
              <Lock size={16} aria-hidden="true" />
              <span>{etiquetaBotoPrivat}</span>
            </button>
          ) : null}
        </div>

        {confirmacio ? (
          <p className="sdp-quadre-esdeveniment__estat" role="status">
            {t('section.events.rsvp.desat', 'S’ha desat la teua resposta en este navegador.')}
          </p>
        ) : null}
      </div>
    </section>
  );
}
