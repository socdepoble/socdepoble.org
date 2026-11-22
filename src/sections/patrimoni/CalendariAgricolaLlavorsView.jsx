import { useMemo, useRef, useState } from 'react';
import { useUIActionsOpcional, useUIStateOpcional } from '../../app/contexts/UIContext.jsx';
import { Alerta, Boto } from '../../components/PedraSeca/index.js';
import { codiLlenguaBibliotecaAgricola, textosBibliotecaAgricola } from './i18nBibliotecaAgricola.js';
import { textosPatrimoniA11y } from './i18nPatrimoniA11y.js';
import {
  FONTS_BANC_LLAVORS,
  entradesDelCataleg
} from '../../data/patrimoni/bancLlavors.js';
import { desplacaDinsApp, enfocaSenseSalt } from '../../utils/desplacamentProxim.js';
import {
  FASES_CALENDARI,
  barra12MesosDe,
  binomiDe
} from './fitxaDidactica.js';
import { adoptaFullDiferit } from '../../config/fullDiferit.js';
import cssDiferitCalendari from '../../css/diferit-calendari.css?inline';
const adoptaEstilsDiferits = (el) => { adoptaFullDiferit(el, 'calendari', cssDiferitCalendari); };

const GRUPS_CULTIU_IDS = Object.freeze(['tots', 'tomaques', 'fruit-estiu', 'horta-fulla-bulb']);

const BINOMIS_TOMACA = new Set(['solanum lycopersicum', 'lycopersicon esculentum']);
const BINOMIS_FRUIT_ESTIU = new Set([
  'solanum melongena',
  'capsicum annuum',
  'cucumis melo',
  'citrullus lanatus',
  'cucurbita moschata',
  'cucurbita maxima',
  'cucurbita pepo',
  'arachis hypogaea'
]);

function grupDeVarietat(entrada) {
  const binomi = binomiDe(entrada?.nomCientific);
  if (BINOMIS_TOMACA.has(binomi)) return 'tomaques';
  if (BINOMIS_FRUIT_ESTIU.has(binomi)) return 'fruit-estiu';
  return 'horta-fulla-bulb';
}

export default function CalendariAgricolaLlavorsView({ onObrirVarietat = null }) {
  const uiState = useUIStateOpcional();
  const uiActions = useUIActionsOpcional();
  const language = uiState?.language || uiActions?.language || 'ca';
  const codiLlengua = codiLlenguaBibliotecaAgricola(language);
  const txPat = textosPatrimoniA11y(codiLlengua);
  const txBib = textosBibliotecaAgricola(codiLlengua);
  const [grupActiu, setGrupActiu] = useState('tots');
  const [faseActiva, setFaseActiva] = useState('totes');
  const [mesActiu, setMesActiu] = useState(0);
  const llistaResultatsRef = useRef(null);
  const accionsResumRef = useRef(null);

  const hiHaFiltresActius = grupActiu !== 'tots' || faseActiva !== 'totes' || mesActiu !== 0;
  const etiquetaGrupActiu = txBib.grups[grupActiu] || txBib.grups.tots;
  const etiquetaFaseActiva = faseActiva === 'totes' ? txBib.totesLesFases : txBib.fases[faseActiva];
  const etiquetaMesActiu = mesActiu >= 1 && mesActiu <= 12 ? txBib.mesos[mesActiu - 1] : txBib.totLAnyCurta;

  const saltaAVarietats = () => {
    desplacaDinsApp(llistaResultatsRef.current);
    enfocaSenseSalt(llistaResultatsRef.current);
  };

  const netejaFiltres = () => {
    setGrupActiu('tots');
    setFaseActiva('totes');
    setMesActiu(0);
    // Sense filtres, «Restablir filtres» desapareix: el focus passa a «Veure varietats», al
    // mateix grup, i no cau al document (WCAG 2.4.3).
    enfocaSenseSalt(accionsResumRef.current?.querySelector('button'));
  };

  const fontValenciana = FONTS_BANC_LLAVORS[0];
  const varietatsAmbCalendari = useMemo(() => {
    const entrades = entradesDelCataleg('cataleg-valencia');
    return entrades
      .map((entrada) => {
        const calendari = entrada?.dada?.calendari ?? entrada?.calendari ?? null;
        return {
          entrada,
          calendari,
          grup: grupDeVarietat(entrada),
          barra: barra12MesosDe(calendari)
        };
      })
      .filter(({ barra }) => barra.some((m) => m.actiu));
  }, []);

  const filtrades = useMemo(() => varietatsAmbCalendari.filter(({ grup, barra }) => {
    if (grupActiu !== 'tots' && grup !== grupActiu) return false;
    if (mesActiu >= 1 && mesActiu <= 12) {
      const celMes = barra[mesActiu - 1];
      if (!celMes?.actiu) return false;
      if (faseActiva !== 'totes' && !celMes.fases.includes(faseActiva)) return false;
      return true;
    }
    if (faseActiva !== 'totes') {
      return barra.some((m) => m.fases.includes(faseActiva));
    }
    return true;
  }), [varietatsAmbCalendari, grupActiu, faseActiva, mesActiu]);

  return (
    <section ref={adoptaEstilsDiferits}
      className="sdp-calendari-agricola"
      aria-label={txPat.calendariAgricolaAria}
    >
      <div>
        <h3>{txBib.titolCalendari}</h3>
        <p>
          {txBib.introAbansFont}
          <strong lang={codiLlengua !== 'ca' ? 'ca' : undefined}>{fontValenciana?.titol}</strong>
          {txBib.introDespresFont(varietatsAmbCalendari.length)}
        </p>
      </div>

      <Alerta to="info" viva={false} titol={txBib.alertaTitol}>
        {txBib.alertaCos}
      </Alerta>

      <div className="sdp-calendari-agricola__filtres" role="group" aria-label={txPat.filtreFamiliaCultiuAria}>
        {GRUPS_CULTIU_IDS.map((grupId) => (
          <Boto
            key={grupId}
            varietat={grupActiu === grupId ? 'primari' : 'secundari'}
            aria-pressed={grupActiu === grupId}
            onClick={() => setGrupActiu(grupId)}
          >
            {txBib.grups[grupId]}
          </Boto>
        ))}
      </div>

      <div className="sdp-calendari-agricola__filtres" role="group" aria-label={txPat.filtreFaseAgronomicaAria}>
        <Boto
          varietat={faseActiva === 'totes' ? 'primari' : 'secundari'}
          aria-pressed={faseActiva === 'totes'}
          onClick={() => setFaseActiva('totes')}
        >
          {txBib.totesLesFases}
        </Boto>
        {FASES_CALENDARI.map((fase) => (
          <Boto
            key={fase.id}
            varietat={faseActiva === fase.id ? 'primari' : 'secundari'}
            aria-pressed={faseActiva === fase.id}
            onClick={() => setFaseActiva(fase.id)}
          >
            {txBib.fases[fase.id]}
          </Boto>
        ))}
      </div>

      <div
        className="sdp-calendari-agricola__resum-viu"
        data-testid="calendari-agricola-resum-proxim"
      >
        <div className="sdp-calendari-agricola__resum-viu-text">
          <p role="status">
            <strong>{txBib.recompteDe(filtrades.length, varietatsAmbCalendari.length)}</strong>
            {txBib.recompteSufix}
          </p>
          <p className="sdp-calendari-agricola__filtres-actius">
            {txBib.filtreActiu(etiquetaGrupActiu, etiquetaFaseActiva, etiquetaMesActiu)}
          </p>
        </div>
        <div ref={accionsResumRef} className="sdp-calendari-agricola__resum-viu-accions">
          <Boto varietat="secundari" onClick={saltaAVarietats}>
            {txBib.veureVarietats(filtrades.length)}
          </Boto>
          {hiHaFiltresActius ? (
            <Boto varietat="fantasma" onClick={netejaFiltres}>
              {txBib.restablirFiltres}
            </Boto>
          ) : null}
        </div>
      </div>

      <div className="sdp-calendari-agricola__mesos" role="group" aria-label={txPat.filtreMesAnyAria}>
        <Boto
          varietat={mesActiu === 0 ? 'primari' : 'secundari'}
          aria-pressed={mesActiu === 0}
          onClick={() => setMesActiu(0)}
        >
          {txBib.totLAny12Mesos}
        </Boto>
        {txBib.mesos.map((nomMes, idx) => {
          const numeroMes = idx + 1;
          return (
            <Boto
              key={numeroMes}
              varietat={mesActiu === numeroMes ? 'primari' : 'secundari'}
              aria-pressed={mesActiu === numeroMes}
              onClick={() => setMesActiu(numeroMes)}
            >
              {nomMes}
            </Boto>
          );
        })}
      </div>

      <div
        ref={llistaResultatsRef}
        tabIndex={-1}
        className="sdp-calendari-agricola__resultats"
        data-testid="calendari-agricola-resultats"
      >
        {filtrades.length === 0 ? (
          <p ref={adoptaEstilsDiferits}>{txBib.buitCombinacio}</p>
        ) : (
          <div ref={adoptaEstilsDiferits} className="sdp-calendari-agricola__llista">
          {filtrades.map(({ entrada, calendari, barra }) => {
            const mesosResum = FASES_CALENDARI.map((fase) => {
              const mesosFase = barra
                .filter((m) => m.fases.includes(fase.id))
                .map((m) => txBib.mesos[m.mes - 1]);
              if (!mesosFase.length) return null;
              const nomFase = fase.id === 'sembra' && calendari?.sembraDirecta
                ? txBib.fases.sembraDirecta
                : txBib.fases[fase.id];
              return { id: fase.id, nomFase, text: mesosFase.join(', ') };
            }).filter(Boolean);

            return (
              <article ref={adoptaEstilsDiferits} key={entrada.id} className="sdp-calendari-agricola__item" aria-label={entrada.nom}>
                <div className="sdp-calendari-agricola__cap">
                  <div>
                    <h4 lang="ca">{entrada.nom}</h4>
                    <p>
                      <em lang="la">{entrada.nomCientific}</em>
                      {txBib.paginaPdf(entrada.pagina)}
                    </p>
                  </div>
                  {typeof onObrirVarietat === 'function' ? (
                    <Boto varietat="secundari" onClick={() => onObrirVarietat(entrada.id)}>
                      {txBib.obrirFitxaVarietat}
                    </Boto>
                  ) : null}
                </div>
                <ul>
                  {mesosResum.map((linia) => (
                    <li ref={adoptaEstilsDiferits} key={linia.id}>
                      <strong>{`${linia.nomFase}:`}</strong> {linia.text}
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
          </div>
        )}
      </div>
    </section>
  );
}
