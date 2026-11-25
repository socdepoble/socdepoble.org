import { useId, useMemo, useRef, useState } from 'react';
import { AlertTriangle, CalendarDays, Check, ChevronDown, ChevronUp, CircleHelp, Sprout, Users, X } from 'lucide-react';
import { Link } from '../../app/contexts/RouterContext';
import { PillToggle } from '../../components/PedraSeca/index.js';
import { useIdentitatOpcional } from '../../app/contexts/IdentitatContext';
import { useSessioOpcional } from '../../app/contexts/SessionContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssEsdeveniments from '../../css/diferit-esdeveniments.css?inline';
import { esActePassat } from './actePassat.js';
import { rutaDeLEntrada } from './calendariGlobal.js';
import { resolTextCalendariRsvp, textosCalendariRsvp } from './i18nCalendariRsvp.js';
import {
  desaRsvpEsdeveniment,
  detectaSolapamentsRsvp,
  llegeixRsvpEsdeveniment,
  participantRsvpActual,
  useMagatzemRsvpEsdeveniments
} from './rsvpEsdeveniments.js';
import {
  localeCalendariDe,
  mesDeLEntrada,
  resumDataEntrada,
  textNet,
} from './desplegableEsdevenimentsCalendariModel.js';

const TEXTOS_ENLLAC_AGRICOLA = Object.freeze({
  ca: 'Calendari Agrícola',
  es: 'Calendario Agrícola',
  en: 'Agricultural Calendar',
  eu: 'Nekazaritza Egutegia',
  gl: 'Calendario Agrícola'
});

export function SelectorModeCalendari({ mode, onCanviMode, entradesEsdeveniments, onSaltaAMes = null, ambError = false }) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'esdeveniments', cssEsdeveniments);

  const idLlista = useId();
  const { t, language = 'ca' } = useUIActions();
  const tx = textosCalendariRsvp(language);
  const tr = (clau, valor) => resolTextCalendariRsvp(t, language, clau, valor);
  const locale = localeCalendariDe(language);
  const [desplegat, setDesplegat] = useState(true);

  const currentUser = useSessioOpcional()?.currentUser || null;
  const identitat = useIdentitatOpcional();
  const idParticipant = participantRsvpActual(currentUser, identitat);
  const magatzemRsvp = useMagatzemRsvpEsdeveniments();

  const solapaments = useMemo(
    () => detectaSolapamentsRsvp(entradesEsdeveniments, { idParticipant, magatzem: magatzemRsvp }),
    [entradesEsdeveniments, idParticipant, magatzemRsvp]
  );

  const totalActes = entradesEsdeveniments.length;
  const etiquetaActes = `${tr('section.calendari.filtre.esdeveniments', tx.filtreEsdeveniments)} (${totalActes})`;

  const triaIntencioRapida = (item, rsvpActual, novaIntencio) => {
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
          etiqueta={tr('section.calendari.filtre.aria', tx.filtreAria)}
          valor={mode}
          onCanvi={(nouMode) => {
            onCanviMode(nouMode);
            if (nouMode === 'events') setDesplegat(true);
          }}
          opcions={[
            { valor: 'events', text: etiquetaActes },
            { valor: 'all', text: tr('section.calendari.filtre.tot', tx.filtreTot) }
          ]}
        />
        <Link
          className="sdp-boto sdp-boto--secundari"
          to="/page/banc-de-llavors?llibre=calendari"
        >
          <Sprout size={16} aria-hidden="true" focusable="false" />
          <span>{TEXTOS_ENLLAC_AGRICOLA[String(language || 'ca').toLowerCase().slice(0, 2)] || TEXTOS_ENLLAC_AGRICOLA.ca}</span>
        </Link>
      </div>

      {mode === 'events' ? (
        <section
          className="sdp-cal-desplegable"
          aria-label={tr('section.calendari.desplegable.titol', tx.desplegableTitol)}
          data-testid="desplegable-esdeveniments-calendari"
        >
          <div className="sdp-cal-desplegable__cap">
            <h3 className="sdp-cal-desplegable__titol">
              {`${tr('section.calendari.desplegable.titol', tx.desplegableTitol)} (${totalActes})`}
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
                    ? tr('section.calendari.desplegable.plega', tx.desplegablePlega)
                    : tr('section.calendari.desplegable.desplega', tx.desplegableDesplega)}
                </span>
              </button>
            ) : null}
          </div>

          {totalActes === 0 ? (
            ambError ? null : (
              <div className="sdp-paragraf-centrat">
                <p className="sdp-cal-desplegable__detall" role="status">
                  {tr('section.calendari.desplegable.buit', tx.desplegableBuit)}
                </p>
                <div className="sdp-cal-desplegable__accions">
                  <button
                    type="button"
                    className="sdp-boto sdp-boto--secundari"
                    onClick={() => onCanviMode('all')}
                  >
                    {tr('section.calendari.desplegable.veureTot', tx.desplegableVeureTot)}
                  </button>
                </div>
              </div>
            )
          ) : (
            <ul id={idLlista} className="sdp-cal-desplegable__llista" hidden={!desplegat}>
              {desplegat ? entradesEsdeveniments.map((entrada) => {
                const ruta = rutaDeLEntrada(entrada);
                const mes = mesDeLEntrada(entrada);
                const titol = textNet(entrada.item?.title) || textNet(entrada.acte?.titol);
                const detall = resumDataEntrada(entrada, locale);
                const rsvp = entrada.item
                  ? llegeixRsvpEsdeveniment(entrada.item, idParticipant, magatzemRsvp)
                  : { confirmats: 0, potser: 0, intencio: null, nota: '' };
                const idActe = textNet(String(entrada.item?.id ?? entrada.acte?.id ?? ''));
                const actesSolapats = idActe ? (solapaments.perActe[idActe] ?? []) : [];
                const titolsSolapats = actesSolapats.map((c) => c.titol).join(', ');
                const teSolapamentHorari = actesSolapats.some((c) => c.tipus === 'horari');
                /* P0-ANDROID-PUSH (v1.2.16) · B10c (D-12) · Un acte que ja s'ha fet no oferix
                   «Assistiré / Potser / No assistiré»; el recompte i els enllaços es queden. */
                const ambRsvp = Boolean(entrada.item) && !esActePassat(entrada);

                return (
                  <li key={entrada.clau} className="sdp-cal-desplegable__item">
                    <div className="sdp-cal-desplegable__info">
                      <span className="sdp-cal-desplegable__nom">{titol}</span>
                      {detall ? <p className="sdp-cal-desplegable__detall">{detall}</p> : null}
                      {entrada.item ? (
                        <p className="sdp-cal-rsvp-comptador">
                          <Users size={14} aria-hidden="true" />
                          <span>{`${tr('section.events.rsvp.confirmats', tx.confirmats)}: ${rsvp.confirmats}`}</span>
                          {rsvp.potser > 0 ? (
                            <span className="sdp-cal-rsvp-comptador__potser">{`· ${tx.potserComptador}: ${rsvp.potser}`}</span>
                          ) : null}
                        </p>
                      ) : null}
                    </div>

                    <div className="sdp-cal-desplegable__accions">
                      {ambRsvp ? (
                        <div
                          className="sdp-cal-rsvp-grup"
                          role="group"
                          aria-label={tx.grupAria(titol)}
                        >
                          <button
                            type="button"
                            aria-pressed={rsvp.intencio === 'si'}
                            className={`sdp-boto sdp-cal-rsvp-grup__boto ${rsvp.intencio === 'si' ? 'sdp-boto--primari' : 'sdp-boto--secundari'}`}
                            onClick={() => triaIntencioRapida(entrada.item, rsvp, 'si')}
                          >
                            <Check size={16} aria-hidden="true" />
                            <span>{tr('section.events.rsvp.curt.si', tx.assistire)}</span>
                          </button>

                          <button
                            type="button"
                            aria-pressed={rsvp.intencio === 'potser'}
                            className={`sdp-boto sdp-cal-rsvp-grup__boto ${rsvp.intencio === 'potser' ? 'sdp-boto--primari' : 'sdp-boto--secundari'}`}
                            onClick={() => triaIntencioRapida(entrada.item, rsvp, 'potser')}
                          >
                            <CircleHelp size={16} aria-hidden="true" />
                            <span>{tr('section.events.rsvp.potser', tx.potser)}</span>
                          </button>

                          <button
                            type="button"
                            aria-pressed={rsvp.intencio === 'no'}
                            className={`sdp-boto sdp-cal-rsvp-grup__boto ${rsvp.intencio === 'no' ? 'sdp-boto--accent' : 'sdp-boto--secundari'}`}
                            onClick={() => triaIntencioRapida(entrada.item, rsvp, 'no')}
                          >
                            <X size={16} aria-hidden="true" />
                            <span>{tr('section.events.rsvp.curt.no', tx.noAssistire)}</span>
                          </button>
                        </div>
                      ) : null}

                      {mes && typeof onSaltaAMes === 'function' ? (
                        <button
                          type="button"
                          className="sdp-boto sdp-boto--secundari sdp-cal-rsvp-grup__accio"
                          onClick={() => onSaltaAMes(mes)}
                        >
                          <CalendarDays size={16} aria-hidden="true" />
                          <span>{tr('section.calendari.desplegable.mes', tx.desplegableMes)}</span>
                        </button>
                      ) : null}

                      {ruta ? (
                        <Link className="sdp-boto sdp-boto--primari sdp-cal-rsvp-grup__accio" to={ruta}>
                          {tr('section.calendari.desplegable.veure', tx.desplegableVeure)}
                        </Link>
                      ) : null}
                    </div>

                    {actesSolapats.length > 0 ? (
                      <div
                        className="sdp-cal-rsvp-avis-solapament"
                        role="status"
                        data-testid={`avis-solapament-${idActe}`}
                      >
                        <AlertTriangle size={18} aria-hidden="true" />
                        <p className="sdp-cal-rsvp-avis-solapament__text">
                          <strong>{`${tx.solapamentTitol}: `}</strong>
                          {teSolapamentHorari
                            ? tx.solapamentHorari(titolsSolapats)
                            : tx.solapamentMateixDia(titolsSolapats)}
                        </p>
                      </div>
                    ) : null}
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
