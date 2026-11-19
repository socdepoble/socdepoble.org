import { useId, useRef, useState } from 'react';
import { CalendarDays, Check, ChevronDown, ChevronUp, Users } from 'lucide-react';
import { Link } from '../../app/contexts/RouterContext';
import { PillToggle } from '../../components/PedraSeca/index.js';
import { useSessioOpcional } from '../../app/contexts/SessionContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssEsdeveniments from '../../css/diferit-esdeveniments.css?inline';
import { diaDeLaClau, rutaDeLEntrada } from './calendariGlobal.js';
import {
  desaRsvpEsdeveniment,
  llegeixRsvpEsdeveniment,
  participantRsvpActual,
  useMagatzemRsvpEsdeveniments
} from './rsvpEsdeveniments.js';

function textNet(valor) {
  return typeof valor === 'string' ? valor.trim() : '';
}

function formataDataCurtaIso(clau, locale) {
  const data = diaDeLaClau(clau);
  if (!data) return clau;
  try {
    return data.toLocaleDateString(locale || 'ca-ES', { day: 'numeric', month: 'long', year: 'numeric' });
  } catch {
    return clau;
  }
}

function resumDataEntrada(entrada, locale) {
  const item = entrada?.item;
  const poble = textNet(item?.location) || textNet(item?.town_name) || textNet(entrada?.acte?.lloc);
  const etiqueta = textNet(item?.date_label) || textNet(item?.calendar_badge?.label);
  if (etiqueta) {
    if (poble && !etiqueta.toLowerCase().includes(poble.toLowerCase())) return `${etiqueta} · ${poble}`;
    return etiqueta;
  }
  const iniciCru = textNet(entrada?.acte?.inici?.data)
    || textNet(entrada?.acte?.inici?.dataHora)?.slice(0, 10)
    || textNet(item?.date);
  const inici = /^\d{4}-\d{2}-\d{2}$/.test(iniciCru) ? formataDataCurtaIso(iniciCru, locale) : iniciCru;
  if (inici && poble) return `${inici} · ${poble}`;
  return inici || poble;
}

function mesDeLEntrada(entrada) {
  const inici = textNet(entrada?.acte?.inici?.data)
    || textNet(entrada?.acte?.inici?.dataHora)?.slice(0, 10)
    || textNet(entrada?.item?.inici)
    || textNet(entrada?.item?.date);
  return /^\d{4}-\d{2}/.test(inici) ? inici.slice(0, 7) : null;
}

export function SelectorModeCalendari({ mode, onCanviMode, entradesEsdeveniments, onSaltaAMes = null }) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'esdeveniments', cssEsdeveniments);

  const idLlista = useId();
  const { t, language = 'ca' } = useUIActions();
  const locale = `${language}-ES`;
  const [desplegat, setDesplegat] = useState(true);
  const currentUser = useSessioOpcional()?.currentUser || null;
  const idParticipant = participantRsvpActual(currentUser);
  const magatzemRsvp = useMagatzemRsvpEsdeveniments();

  const totalActes = entradesEsdeveniments.length;
  const etiquetaActes = `${t('section.calendari.filtre.esdeveniments', 'Esdeveniments')} (${totalActes})`;

  const commutaAssistenciaRapida = (item, rsvpActual) => {
    const novaIntencio = rsvpActual.intencio === 'si' ? 'no' : 'si';
    desaRsvpEsdeveniment(item, {
      idParticipant,
      intencio: novaIntencio,
      nota: rsvpActual.nota
    });
  };

  return (
    <div ref={arrelRef}>
      <div className="sdp-cal-filtre-barra">
        <PillToggle
          etiqueta={t('section.calendari.filtre.aria', 'Contingut del calendari')}
          valor={mode}
          onCanvi={(nouMode) => {
            onCanviMode(nouMode);
            if (nouMode === 'events') setDesplegat(true);
          }}
          opcions={[
            { valor: 'events', text: etiquetaActes },
            { valor: 'all', text: t('section.calendari.filtre.tot', 'Totes les publicacions') }
          ]}
        />
      </div>

      {mode === 'events' ? (
        <section
          className="sdp-cal-desplegable"
          aria-label={t('section.calendari.desplegable.titol', 'Esdeveniments de Sóc de Poble')}
          data-testid="desplegable-esdeveniments-calendari"
        >
          <div className="sdp-cal-desplegable__cap">
            <h3 className="sdp-cal-desplegable__titol">
              {`${t('section.calendari.desplegable.titol', 'Esdeveniments de Sóc de Poble')} (${totalActes})`}
            </h3>
            {totalActes > 0 ? (
              <button
                type="button"
                className="sdp-boto sdp-boto--secundari"
                aria-expanded={desplegat}
                aria-controls={idLlista}
                onClick={() => setDesplegat((obert) => !obert)}
              >
                {desplegat ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                <span>
                  {desplegat
                    ? t('section.calendari.desplegable.plega', 'Amaga el llistat ràpid')
                    : t('section.calendari.desplegable.desplega', 'Mostra tots els esdeveniments')}
                </span>
              </button>
            ) : null}
          </div>

          {totalActes === 0 ? (
            <p className="sdp-cal-desplegable__detall" role="status">
              {t('section.calendari.desplegable.buit', 'Encara no hi ha cap esdeveniment publicat.')}
            </p>
          ) : (
            <ul id={idLlista} className="sdp-cal-desplegable__llista" hidden={!desplegat}>
              {desplegat ? entradesEsdeveniments.map((entrada) => {
                const ruta = rutaDeLEntrada(entrada);
                const mes = mesDeLEntrada(entrada);
                const titol = textNet(entrada.item?.title) || textNet(entrada.acte?.titol);
                const detall = resumDataEntrada(entrada, locale);
                const rsvp = entrada.item
                  ? llegeixRsvpEsdeveniment(entrada.item, idParticipant, magatzemRsvp)
                  : { confirmats: 0, intencio: null, nota: '' };
                const apuntat = rsvp.intencio === 'si';

                return (
                  <li key={entrada.clau} className="sdp-cal-desplegable__item">
                    <div className="sdp-cal-desplegable__info">
                      <span className="sdp-cal-desplegable__nom">{titol}</span>
                      {detall ? <p className="sdp-cal-desplegable__detall">{detall}</p> : null}
                    </div>
                    <div className="sdp-cal-desplegable__accions">
                      {entrada.item ? (
                        <button
                          type="button"
                          aria-pressed={apuntat}
                          className={apuntat ? 'sdp-boto sdp-boto--primari' : 'sdp-boto sdp-boto--secundari'}
                          onClick={() => commutaAssistenciaRapida(entrada.item, rsvp)}
                        >
                          {apuntat ? <Check size={16} aria-hidden="true" /> : <Users size={16} aria-hidden="true" />}
                          <span>{`${t('section.events.rsvp.confirmats', 'Compta amb mi')}: ${rsvp.confirmats}`}</span>
                        </button>
                      ) : null}
                      {mes && typeof onSaltaAMes === 'function' ? (
                        <button
                          type="button"
                          className="sdp-boto sdp-boto--secundari"
                          onClick={() => onSaltaAMes(mes)}
                        >
                          <CalendarDays size={16} aria-hidden="true" />
                          <span>{t('section.calendari.desplegable.mes', 'Veure al calendari')}</span>
                        </button>
                      ) : null}
                      {ruta ? (
                        <Link className="sdp-boto sdp-boto--primari" to={ruta}>
                          {t('section.calendari.desplegable.veure', 'Obrir i apuntar-s’hi')}
                        </Link>
                      ) : null}
                    </div>
                  </li>
                );
              }) : null}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}
