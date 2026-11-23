/**
 * PanellUsuarisDispositiusBotigues.jsx — R13-C7 + R32.45 (paritat completa en 5 llengües
 * `ca`, `es`, `en`, `eu`, `gl` amb regla 2.3.10 d'Apple `nativaIos` intacta).
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Alerta, AreaText, Boto, Camp, Carregant, Insignia } from '../../../components/PedraSeca/index.js';
import { useLlenguaDeLaUI } from '../useLlenguaDeLaUI.js';
import * as port from '../../../data/backendPort.js';
import { consultaResumSessionsDispositius } from '../../../data/resumSessionsDispositius.js';
import { ADRECA_VERIFICADORS_GOOGLE_PLAY, URL_FITXA_APP_STORE } from './assistentBotigues.js';
import PanellSessionsDetall from './PanellSessionsDetall.jsx';
import { esAppNativaIos } from './appNativaIos.js';
import {
  APP_STORE,
  copiaAlPortaretalls,
  filesDelResum
} from './usuarisDispositiusBotigues.js';
import cssAdminTaxonomia from '../../../css/diferit-admin-taxonomia.css?inline';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';
import { textosAdminEntitats } from './i18nAdminEntitats.js';

const adoptaEstilsAdminTaxonomia = (node) => { if (node) adoptaFullDiferit(node, 'admin-taxonomia', cssAdminTaxonomia); };
const consultaDelPort = (config) => consultaResumSessionsDispositius(port, config);

const horaDeLaConsulta = (iso, locale = 'ca-ES') => {
  try {
    return new Date(iso).toLocaleString(locale, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

function TaulaDelResum({ resum, nativaIos, tx }) {
  const files = filesDelResum(resum, { nativaIos });
  const androidApp = files.find((f) => f.cami === 'app_android');
  return (
    <>
      <table className="sdp-admin-table" data-testid="taula-usuaris-dispositius">
        <caption>
          {tx.taulaCaptionPrefix}
          <time dateTime={resum.consultatA}>{horaDeLaConsulta(resum.consultatA, tx.locale)}</time>
        </caption>
        <thead>
          <tr>
            <th scope="col">{tx.colCami}</th>
            <th scope="col">{tx.col24h}</th>
            <th scope="col">{tx.col7d}</th>
            <th scope="col">{tx.col14d}</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.cami} data-testid={`fila-cami-${f.cami}`}>
              <th scope="row">{tx.caminsTitols?.[f.cami] || f.titol}</th>
              <td>{f.persones24h}</td>
              <td>{f.persones7d}</td>
              <td>{f.persones14d}</td>
            </tr>
          ))}
          <tr data-testid="fila-cami-total">
            <th scope="row"><strong>{tx.filaTotal}</strong></th>
            <td><strong>{resum.total.persones24h}</strong></td>
            <td><strong>{resum.total.persones7d}</strong></td>
            <td><strong>{resum.total.persones14d}</strong></td>
          </tr>
        </tbody>
      </table>
      <p className="sdp-muted">{tx.notaRecomptes}</p>
      {androidApp ? <p className="sdp-muted" data-testid="nota-verificadors">{tx.notaVerificadors}</p> : null}
    </>
  );
}

function UsuarisIDispositius({ consulta, nativaIos, tx }) {
  const idTitol = useId();
  const [estat, setEstat] = useState({ fase: 'inicial' });
  const peticio = useRef(0);
  const control = useRef(null);

  useEffect(() => () => {
    peticio.current += 1;
    control.current?.abort();
  }, []);

  const consultar = useCallback(() => {
    const numero = ++peticio.current;
    control.current?.abort();
    const avorta = new AbortController();
    control.current = avorta;
    setEstat({ fase: 'carregant' });
    Promise.resolve()
      .then(() => consulta({ signal: avorta.signal }))
      .then((resum) => { if (numero === peticio.current) setEstat({ fase: 'dades', resum }); })
      .catch((error) => {
        if (numero !== peticio.current || error?.name === 'AbortError') return;
        setEstat({ fase: 'error', codi: error?.code });
      });
  }, [consulta]);

  const carregant = estat.fase === 'carregant';
  return (
    <section ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__panel" aria-labelledby={idTitol} data-testid="usuaris-dispositius-connectats">
      <h3 id={idTitol}>{tx.connectatsTitol}</h3>
      <p className="sdp-muted">
        {nativaIos ? tx.connectatsIntroIos : tx.connectatsIntroWeb}
      </p>
      <div className="sdp-admin-actions-inline">
        <Boto varietat="primari" onClick={consultar} carregant={carregant} data-testid="boto-consulta-usuaris-dispositius">
          {tx.botoConsultaAra}
        </Boto>
      </div>
      <div aria-live="polite" data-testid="estat-usuaris-dispositius" data-fase={estat.fase}>
        {estat.fase === 'inicial' ? <p className="sdp-muted sdp-paragraf-centrat">{tx.estatInicial}</p> : null}
        {carregant ? <Carregant /> : null}
        {estat.fase === 'error' ? <Alerta to="avis" viva={false}>{tx.errorResum(estat.codi)}</Alerta> : null}
        {estat.fase === 'dades' ? <TaulaDelResum resum={estat.resum} nativaIos={nativaIos} tx={tx} /> : null}
      </div>
    </section>
  );
}

function GuiaVerificadorsAndroid({ navegador, tx }) {
  const idTitol = useId();
  const [copia, setCopia] = useState('res');
  const copiar = useCallback(() => {
    setCopia('copiant');
    copiaAlPortaretalls(tx.missatgeWhatsapp, navegador).then((fet) => setCopia(fet ? 'fet' : 'a-ma'));
  }, [navegador, tx.missatgeWhatsapp]);
  return (
    <section ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__panel" aria-labelledby={idTitol} data-testid="guia-verificadors-android">
      <h3 id={idTitol}>{tx.guiaAndroidTitol}</h3>
      <ol className="sdp-admin-botiga-detall__passos">
        {tx.passosAndroid.map((pas) => <li key={pas}>{pas}</li>)}
      </ol>
      <div className="sdp-admin-actions-inline sdp-admin-actions-inline--separat">
        <Boto onClick={copiar} carregant={copia === 'copiant'} data-testid="boto-copia-missatge-whatsapp">
          {tx.botoCopiaWhatsapp}
        </Boto>
      </div>
      <div aria-live="polite" data-testid="estat-copia-whatsapp" data-copia={copia}>
        {copia === 'fet' ? <p className="sdp-paragraf-centrat">{tx.copiatWhatsapp}</p> : null}
        {copia === 'a-ma' ? (
          <Camp etiqueta={tx.copiaAMaEtiqueta}>
            <AreaText readOnly value={tx.missatgeWhatsapp} files={10} onFocus={(e) => e.currentTarget.select()} />
          </Camp>
        ) : null}
      </div>
    </section>
  );
}

export default function PanellUsuarisDispositiusBotigues({ consulta = consultaDelPort, nativaIos: nativaIosProp, navegador } = {}) {
  const llenguaUI = useLlenguaDeLaUI();
  const tx = textosAdminEntitats(llenguaUI);
  const [nativaIosDetectada] = useState(() => esAppNativaIos());
  const nativaIos = typeof nativaIosProp === 'boolean' ? nativaIosProp : nativaIosDetectada;
  return (
    <article className="sdp-admin-taxonomia" aria-label={tx.usuarisBotiguesRegio} data-testid="panell-usuaris-dispositius-botigues">
      <header ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__header">
        <div ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__badges">
          <Insignia to="info">{`🍎 App Store v${APP_STORE.versio} · ${APP_STORE.id}`}</Insignia>
          {nativaIos ? null : <Insignia to="neutre">{tx.badgeGooglePlay}</Insignia>}
        </div>
      </header>

      <UsuarisIDispositius consulta={consulta} nativaIos={nativaIos} tx={tx} />
      <PanellSessionsDetall nativaIos={nativaIos} />

      <section ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__panel" aria-label={tx.descarreguesOficialsRegio} data-testid="botons-oficials-botigues">
        <h3>{tx.descarreguesTitol}</h3>
        <div className="sdp-admin-actions-inline">
          <a className="sdp-boto sdp-boto--marca sdp-boto--apple sdp-boto--gran" href={URL_FITXA_APP_STORE}
            target="_blank" rel="noopener noreferrer" data-testid="boto-descarrega-app-store">
            {tx.botoAppStore}
          </a>
          {nativaIos ? null : (
            <a className="sdp-boto sdp-boto--marca sdp-boto--google sdp-boto--gran" href={ADRECA_VERIFICADORS_GOOGLE_PLAY}
              target="_blank" rel="noopener noreferrer" data-testid="boto-descarrega-google-play">
              {tx.botoGooglePlay}
            </a>
          )}
        </div>
        {nativaIos ? null : <p className="sdp-muted sdp-paragraf-centrat" data-testid="nota-pas-1-google-play">{tx.notaPas1GooglePlay}</p>}
      </section>

      {nativaIos ? null : <GuiaVerificadorsAndroid navegador={navegador} tx={tx} />}
    </article>
  );
}
