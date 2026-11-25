import { useEffect, useMemo, useRef, useState } from 'react';
import { Bell, CalendarDays, Sprout } from 'lucide-react';
import { useNavigate } from '../../app/contexts/RouterContext';
import { useUIActionsOpcional, useUIStateOpcional } from '../../app/contexts/UIContext.jsx';
import { Alerta, Boto, Camp, EstatBuit, GrupCamps, Selector } from '../../components/PedraSeca/index.js';
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

const COMARQUES_AGRICOLES = Object.freeze([
  'El Comtat', 'L’Alcoià', 'La Marina Alta', 'La Marina Baixa', 'La Safor', 'La Vall d’Albaida', 'L’Horta'
]);

const TEXTOS_CALENDARI_V1225 = Object.freeze({
  ca: Object.freeze({
    enllacCalendariPoble: 'Calendari del Poble',
    buitTitol: 'Cap varietat amb esta combinació',
    avisosTitol: 'Avisos de sembra i trasplantament (en este dispositiu)',
    avisosDescripcio: 'Tria la comarca i el grup de cultiu per recordar-te el calendari agrícola local sense connexió.',
    comarca: 'Comarca',
    cultiu: 'Grup de cultiu',
    activaAvis: 'Activa recordatori local',
    desactivaAvis: 'Desactiva recordatori',
    avisActivat: (cultiu, comarca) => `Recordatori local actiu per a ${cultiu} a ${comarca}.`,
    avisDesactivat: 'Recordatori agrícola local desactivat.',
    avisError: 'No s’ha pogut actualitzar el recordatori agrícola. Torna-ho a provar.',
    avisSenseConnexio: 'Els recordatoris agrícoles requerixen un compte connectat per a confirmar-se.'
  }),
  es: Object.freeze({
    enllacCalendariPoble: 'Calendario del Pueblo',
    buitTitol: 'Ninguna variedad con esta combinación',
    avisosTitol: 'Avisos de siembra y trasplante (en este dispositivo)',
    avisosDescripcio: 'Elige la comarca y el grupo de cultivo para recordar el calendario agrícola local sin conexión.',
    comarca: 'Comarca',
    cultiu: 'Grupo de cultivo',
    activaAvis: 'Activa recordatorio local',
    desactivaAvis: 'Desactiva recordatorio',
    avisActivat: (cultiu, comarca) => `Recordatorio local activo para ${cultiu} en ${comarca}.`,
    avisDesactivat: 'Recordatorio agrícola local desactivado.',
    avisError: 'No se ha podido actualizar el recordatorio agrícola. Inténtalo de nuevo.',
    avisSenseConnexio: 'Los recordatorios agrícolas requieren una cuenta conectada para confirmarse.'
  }),
  en: Object.freeze({
    enllacCalendariPoble: 'Village Calendar',
    buitTitol: 'No varieties match this combination',
    avisosTitol: 'Sowing & transplanting reminders (on this device)',
    avisosDescripcio: 'Choose your county and crop group to keep local agricultural reminders offline.',
    comarca: 'County / region',
    cultiu: 'Crop group',
    activaAvis: 'Enable local reminder',
    desactivaAvis: 'Disable reminder',
    avisActivat: (cultiu, comarca) => `Local reminder active for ${cultiu} in ${comarca}.`,
    avisDesactivat: 'Local agricultural reminder disabled.',
    avisError: 'Could not update the agricultural reminder. Please try again.',
    avisSenseConnexio: 'Agricultural reminders require a connected account to confirm.'
  }),
  eu: Object.freeze({
    enllacCalendariPoble: 'Herriko Egutegia',
    buitTitol: 'Ez dago barietaterik konbinazio honekin',
    avisosTitol: 'Ereite eta landatze abisuak (gailu honetan)',
    avisosDescripcio: 'Aukeratu eskualdea eta labore-taldea tokiko nekazaritza-egutegia gogoratzeko.',
    comarca: 'Eskualdea',
    cultiu: 'Labore-taldea',
    activaAvis: 'Aktibatu tokiko abisua',
    desactivaAvis: 'Desaktibatu abisua',
    avisActivat: (cultiu, comarca) => `Tokiko abisua aktibo ${cultiu} (${comarca}).`,
    avisDesactivat: 'Tokiko nekazaritza-abisua desaktibatuta.',
    avisError: 'Ezin izan da nekazaritza-abisua eguneratu. Saiatu berriro.',
    avisSenseConnexio: 'Nekazaritza-abisuek konektatutako kontu bat behar dute berresteko.'
  }),
  gl: Object.freeze({
    enllacCalendariPoble: 'Calendario do Pobo',
    buitTitol: 'Ningunha variedade con esta combinación',
    avisosTitol: 'Avisos de sementeira e transplante (neste dispositivo)',
    avisosDescripcio: 'Escolle a comarca e o grupo de cultivo para lembrar o calendario agrícola local sen conexión.',
    comarca: 'Comarca',
    cultiu: 'Grupo de cultivo',
    activaAvis: 'Activa recordatorio local',
    desactivaAvis: 'Desactiva recordatorio',
    avisActivat: (cultiu, comarca) => `Recordatorio local activo para ${cultiu} en ${comarca}.`,
    avisDesactivat: 'Recordatorio agrícola local desactivado.',
    avisError: 'Non se puido actualizar o recordatorio agrícola. Téntao de novo.',
    avisSenseConnexio: 'Os recordatorios agrícolas requiren unha conta conectada para confirmarse.'
  })
});

function useNavigateOpcional() {
  try {
    return useNavigate();
  } catch {
    return null;
  }
}

/** Valida que la resposta del servei confirme explícitament l'estat i la configuració demanats (Codex P2). */
export function esAckPositiuSubscripcio(resultat, esperat, { comarca, cultiu } = {}) {
  if (resultat === true) return true;
  if (!resultat || typeof resultat !== 'object') return false;
  if (resultat.ok === false || resultat.confirmat === false) return false;
  if (resultat.comarca != null && comarca != null && String(resultat.comarca) !== String(comarca)) return false;
  if (resultat.cultiu != null && cultiu != null && String(resultat.cultiu) !== String(cultiu)) return false;
  if (typeof resultat.activa === 'boolean') return resultat.activa === esperat;
  if (typeof resultat.actiu === 'boolean') return resultat.actiu === esperat;
  return resultat.ok === true || resultat.confirmat === true;
}

export default function CalendariAgricolaLlavorsView({ onObrirVarietat = null, onCanviSubscripcio = null }) {
  const uiState = useUIStateOpcional();
  const uiActions = useUIActionsOpcional();
  const language = uiState?.language || uiActions?.language || 'ca';
  const codiLlengua = codiLlenguaBibliotecaAgricola(language);
  const txPat = textosPatrimoniA11y(codiLlengua);
  const txBib = textosBibliotecaAgricola(codiLlengua);
  const txV25 = TEXTOS_CALENDARI_V1225[codiLlengua] || TEXTOS_CALENDARI_V1225.ca;
  const [grupActiu, setGrupActiu] = useState('tots');
  const [faseActiva, setFaseActiva] = useState('totes');
  const [mesActiu, setMesActiu] = useState(0);
  const [comarcaAvis, setComarcaAvis] = useState(COMARQUES_AGRICOLES[0]);
  const [cultiuAvis, setCultiuAvis] = useState('tomaques');
  const [subscrit, setSubscrit] = useState(false);
  const [actualitzantAvis, setActualitzantAvis] = useState(false);
  const [missatgeAvis, setMissatgeAvis] = useState('');
  const genAvisRef = useRef(0);
  const llistaResultatsRef = useRef(null);
  const accionsResumRef = useRef(null);

  useEffect(() => () => { genAvisRef.current += 1; }, []);

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

  const navigateOpcional = useNavigateOpcional();
  const navegaACalendari = (event) => {
    if (typeof navigateOpcional === 'function') {
      event.preventDefault();
      navigateOpcional('/calendari');
    }
  };
  const teServeiAvisos = typeof onCanviSubscripcio === 'function';

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
        <p>{txBib.alertaCos}</p>
        <p>
          <a className="sdp-boto sdp-boto--secundari" href="/calendari" onClick={navegaACalendari}>
            <CalendarDays size={16} aria-hidden="true" focusable="false" />{' '}
            {txV25.enllacCalendariPoble}
          </a>
        </p>
      </Alerta>

      <GrupCamps llegenda={txV25.avisosTitol}>
        <p>{txV25.avisosDescripcio}</p>
        <Camp etiqueta={txV25.comarca}>
          <Selector
            value={comarcaAvis}
            disabled={actualitzantAvis}
            onChange={(e) => {
              genAvisRef.current += 1;
              setComarcaAvis(e.target.value);
            }}
            opcions={COMARQUES_AGRICOLES.map((c) => ({ valor: c, etiqueta: c }))}
          />
        </Camp>
        <Camp etiqueta={txV25.cultiu}>
          <Selector
            value={cultiuAvis}
            disabled={actualitzantAvis}
            onChange={(e) => {
              genAvisRef.current += 1;
              setCultiuAvis(e.target.value);
            }}
            opcions={GRUPS_CULTIU_IDS.map((id) => ({ valor: id, etiqueta: txBib.grups[id] }))}
          />
        </Camp>
        <Boto
          varietat={subscrit ? 'secundari' : 'primari'}
          icona={Bell}
          disabled={!teServeiAvisos || actualitzantAvis}
          carregant={actualitzantAvis}
          aria-pressed={subscrit}
          onClick={() => {
            const previ = subscrit;
            const nou = !previ;
            const comarcaReq = comarcaAvis;
            const cultiuReq = cultiuAvis;
            const nomCultiu = txBib.grups[cultiuReq] || cultiuReq;
            const payload = { actiu: nou, activa: nou, comarca: comarcaReq, cultiu: cultiuReq };
            if (typeof onCanviSubscripcio !== 'function') {
              setSubscrit(previ);
              setMissatgeAvis(txV25.avisSenseConnexio || txV25.avisError);
              return;
            }
            const gen = ++genAvisRef.current;
            setActualitzantAvis(true);
            const aplicaResultat = (res) => {
              if (genAvisRef.current !== gen) return;
              setActualitzantAvis(false);
              if (esAckPositiuSubscripcio(res, nou, { comarca: comarcaReq, cultiu: cultiuReq })) {
                setSubscrit(nou);
                setMissatgeAvis(nou ? txV25.avisActivat(nomCultiu, comarcaReq) : txV25.avisDesactivat);
              } else {
                setSubscrit(previ);
                setMissatgeAvis(txV25.avisError || txV25.avisDesactivat);
              }
            };
            const aplicaError = () => {
              if (genAvisRef.current !== gen) return;
              setActualitzantAvis(false);
              setSubscrit(previ);
              setMissatgeAvis(txV25.avisError || txV25.avisDesactivat);
            };
            try {
              const resultat = onCanviSubscripcio(payload);
              if (resultat && typeof resultat.then === 'function') {
                resultat.then(aplicaResultat, aplicaError);
                return;
              }
              aplicaResultat(resultat);
            } catch {
              aplicaError();
            }
          }}
        >
          {subscrit ? txV25.desactivaAvis : txV25.activaAvis}
        </Boto>
        {!teServeiAvisos ? <p role="note">{txV25.avisSenseConnexio}</p> : null}
        {missatgeAvis ? <p role="status">{missatgeAvis}</p> : null}
      </GrupCamps>

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
          <EstatBuit
            icona={Sprout}
            titol={txV25.buitTitol}
            accio={hiHaFiltresActius ? (
              <Boto varietat="secundari" onClick={netejaFiltres}>
                {txBib.restablirFiltres}
              </Boto>
            ) : null}
          >
            {txBib.buitCombinacio}
          </EstatBuit>
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
