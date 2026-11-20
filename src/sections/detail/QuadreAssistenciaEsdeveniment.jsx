import { useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CalendarCheck2, Check, CircleHelp, Lock, MapPin, MessageSquare, Users, X } from 'lucide-react';
import { Insignia } from '../../components/PedraSeca/atoms/Insignia.jsx';
import { SquareBadge } from '../../components/PedraSeca/organismes/SquareBadge.jsx';
import { interlocutorDelPrivat, useComentaEnPrivat } from '../../components/PedraSeca/hooks/useAccions.js';
import { useXatSocDePoble } from '../../components/PedraSeca/hooks/xatSocDePoble.js';
import { useIdentitatOpcional } from '../../app/contexts/IdentitatContext';
import { useNavigate } from '../../app/contexts/RouterContext';
import { useSessioOpcional } from '../../app/contexts/SessionContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useFullDiferit } from '../../config/fullDiferit.js';
import { rutaXatDePagina } from '../../config/objecteConnectable.js';
import cssEsdeveniments from '../../css/diferit-esdeveniments.css?inline';
import {
  normalitzaIdiomaCalendariRsvp,
  resolTextCalendariRsvp,
  textosCalendariRsvp
} from '../calendari/i18nCalendariRsvp.js';
import {
  desaRsvpEsdeveniment,
  detectaSolapamentsRsvp,
  llegeixRsvpEsdeveniment,
  participantRsvpActual,
  useMagatzemRsvpEsdeveniments
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

function etiquetaRespostaXat(intencio, tr, tx) {
  if (intencio === 'si') return `✅ ${tr('section.events.rsvp.si', tx.assistireLlarg)}`;
  if (intencio === 'potser') return `🤔 ${tr('section.events.rsvp.potser', tx.potser)}`;
  if (intencio === 'no') return `❌ ${tr('section.events.rsvp.no', tx.noAssistireLlarg)}`;
  return '';
}

export function QuadreAssistenciaEsdeveniment({ item, badge = null, objecteXat = null, actesCalendari = [] }) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'esdeveniments', cssEsdeveniments);

  const idNota = useId();
  const { t, language = 'ca' } = useUIActions();
  const tx = textosCalendariRsvp(language);
  const tr = (clau, valor) => resolTextCalendariRsvp(t, language, clau, valor);
  const navigate = useNavigate();
  const currentUser = useSessioOpcional()?.currentUser || null;
  const identitat = useIdentitatOpcional();
  const idParticipant = participantRsvpActual(currentUser, identitat);
  const magatzemRsvp = useMagatzemRsvpEsdeveniments();
  const rsvp = llegeixRsvpEsdeveniment(item, idParticipant, magatzemRsvp);

  const actesSolapats = useMemo(() => {
    const idActual = textNet(String(item?.id ?? ''));
    if (!idActual || !Array.isArray(actesCalendari) || actesCalendari.length === 0) return [];
    const llista = [item, ...actesCalendari.filter(Boolean)];
    const mapa = detectaSolapamentsRsvp(llista, { idParticipant, magatzem: magatzemRsvp });
    return mapa.perActe[idActual] ?? [];
  }, [item, actesCalendari, idParticipant, magatzemRsvp]);

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
    const capcalera = etiquetaRespostaXat(intencioEfectiva, tr, tx);
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
    ? tr('section.events.rsvp.xatPrivatAmb', tx.xatPrivatAmb).replace('{nom}', () => ambQuiPrivat.nom)
    : tr('section.events.rsvp.xatPrivat', tx.xatPrivat);

  const textDesat = normalitzaIdiomaCalendariRsvp(language) === 'ca'
    ? t('section.events.rsvp.desat', 'S’ha desat la teua resposta en este navegador.')
    : tx.desat;

  const titolsSolapats = actesSolapats.map((c) => c.titol).join(', ');
  const teSolapamentHorari = actesSolapats.some((c) => c.tipus === 'horari');

  return (
    <section
      ref={arrelRef}
      className="sdp-quadre-esdeveniment"
      aria-label={tr('section.events.rsvp.titol', tx.titolPregunta)}
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
              <span>{`${tr('section.events.rsvp.confirmats', tx.confirmats)}: ${rsvp.confirmats}`}</span>
            </Insignia>
          </div>
        </div>
      </div>

      <div className="sdp-quadre-esdeveniment__pregunta">
        <p className="sdp-quadre-esdeveniment__llegenda">
          {tr('section.events.rsvp.titol', tx.titolPregunta)}
        </p>

        <div
          className="sdp-quadre-esdeveniment__opcions"
          role="group"
          aria-label={tr('section.events.rsvp.titol', tx.titolPregunta)}
        >
          <button
            type="button"
            aria-pressed={rsvp.intencio === 'si'}
            className={`sdp-boto sdp-cal-rsvp-grup__boto ${rsvp.intencio === 'si' ? 'sdp-boto--primari' : 'sdp-boto--secundari'}`}
            onClick={() => triaIntencio('si')}
          >
            <Check size={16} aria-hidden="true" />
            <span>{tr('section.events.rsvp.si', tx.assistireLlarg)}</span>
          </button>

          <button
            type="button"
            aria-pressed={rsvp.intencio === 'potser'}
            className={`sdp-boto sdp-cal-rsvp-grup__boto ${rsvp.intencio === 'potser' ? 'sdp-boto--primari' : 'sdp-boto--secundari'}`}
            onClick={() => triaIntencio('potser')}
          >
            <CircleHelp size={16} aria-hidden="true" />
            <span>{tr('section.events.rsvp.potser', tx.potser)}</span>
          </button>

          <button
            type="button"
            aria-pressed={rsvp.intencio === 'no'}
            className={`sdp-boto sdp-cal-rsvp-grup__boto ${rsvp.intencio === 'no' ? 'sdp-boto--accent' : 'sdp-boto--secundari'}`}
            onClick={() => triaIntencio('no')}
          >
            <X size={16} aria-hidden="true" />
            <span>{tr('section.events.rsvp.no', tx.noAssistireLlarg)}</span>
          </button>
        </div>

        {actesSolapats.length > 0 ? (
          <div className="sdp-cal-rsvp-avis-solapament" role="status" data-testid="avis-solapament-detall">
            <AlertTriangle size={18} aria-hidden="true" />
            <p className="sdp-cal-rsvp-avis-solapament__text">
              <strong>{`${tx.solapamentTitol}: `}</strong>
              {teSolapamentHorari
                ? tx.solapamentHorari(titolsSolapats)
                : tx.solapamentMateixDia(titolsSolapats)}
            </p>
          </div>
        ) : null}

        <div className="sdp-quadre-esdeveniment__nota">
          <label htmlFor={idNota} className="sdp-quadre-esdeveniment__etiqueta">
            {tr('section.events.rsvp.notaLabel', tx.notaLabel)}
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
            placeholder={tr('section.events.rsvp.notaPlaceholder', tx.notaPlaceholder)}
          />
        </div>

        <div className="sdp-quadre-esdeveniment__accions">
          {teRespostaONota ? (
            <button type="button" className="sdp-boto sdp-boto--secundari sdp-cal-rsvp-grup__accio" onClick={desaNota}>
              <Check size={16} aria-hidden="true" />
              <span>{tr('section.events.rsvp.desa', tx.desa)}</span>
            </button>
          ) : null}

          {rutaXat ? (
            <button
              type="button"
              className="sdp-boto sdp-boto--primari sdp-cal-rsvp-grup__accio"
              onClick={obriXatPublic}
            >
              <MessageSquare size={16} aria-hidden="true" />
              <span>
                {teRespostaONota
                  ? tr('section.events.rsvp.enviaXat', tx.enviaXat)
                  : tr('section.events.rsvp.obriXat', tx.obriXat)}
              </span>
            </button>
          ) : null}

          {objecteXat ? (
            <button
              type="button"
              className="sdp-boto sdp-boto--secundari sdp-cal-rsvp-grup__accio"
              onClick={obriXatPrivat}
            >
              <Lock size={16} aria-hidden="true" />
              <span>{etiquetaBotoPrivat}</span>
            </button>
          ) : null}
        </div>

        {confirmacio ? (
          <p className="sdp-quadre-esdeveniment__estat" role="status">
            {textDesat}
          </p>
        ) : null}
      </div>
    </section>
  );
}
