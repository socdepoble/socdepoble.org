/**
 * PanellUsuarisDispositiusBotigues.jsx — R13-C7 (ordre del Mestre, 08-11-2026) · El 7é apartat
 * d'«🛡️ Administració del sistema», just davall d'«📦 Empaquetats i Desplegament»: «👥 Usuaris,
 * Dispositius i Botigues (Google i Apple)». Es carrega diferit (React.lazy a PerfilShell.jsx): ni el
 * panell ni les seues dades no entren a l'entrada del web.
 *
 *   1. Usuaris i dispositius connectats: un botó centrat demana al servidor els recomptes de persones
 *      amb sessió activa per camí (src/data/resumSessionsDispositius.js). Sense dades, el panell diu la
 *      causa (la migració o el port pendents, el segon factor, la xarxa) i no mostra cap xifra; amb
 *      dades, una taula per camí (24 hores, 7 dies i 14 dies) amb l'hora de la consulta. Mai noms ni
 *      correus: només recomptes.
 *   2. Els dos botons oficials, sempre centrats: l'App Store (la fitxa pública) i Google Play (l'enllaç
 *      del pas 1 dels verificadors, perquè encara no hi ha fitxa pública).
 *   3. La guia dels tres passos per als verificadors d'Android i el botó que copia el missatge per al
 *      grup de WhatsApp (si el navegador no deixa copiar, el text queda a la vista per a copiar-lo a mà).
 * Dins de l'app d'iOS (regla 2.3.10) s'amaga tot el que nomena Android o Google Play.
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { Alerta, AreaText, Boto, Camp, Carregant, Insignia } from '../../../components/PedraSeca/index.js';
/* El port sencer com a valor (com RestauradorOpenData): l'entrada ja n'exporta l'espai de noms i el mètode es
   busca en temps d'execució. Importar-ne una funció a part obligaria l'entrada a exportar-la (+9 B). */
import * as port from '../../../data/backendPort.js';
import { consultaResumSessionsDispositius } from '../../../data/resumSessionsDispositius.js';
import { ADRECA_VERIFICADORS_GOOGLE_PLAY, PASSOS_VERIFICADOR_GOOGLE_PLAY, URL_FITXA_APP_STORE } from './assistentBotigues.js';
import PanellSessionsDetall from './PanellSessionsDetall.jsx';
import { esAppNativaIos } from './appNativaIos.js';
import {
  APP_STORE, MISSATGE_WHATSAPP_VERIFICADORS, NOTA_PAS_1_GOOGLE_PLAY, NOTA_RECOMPTES, NOTA_VERIFICADORS, TEXT_BOTO_CONSULTA,
  TEXT_ESTAT_INICIAL, copiaAlPortaretalls, filesDelResum, textErrorResum
} from './usuarisDispositiusBotigues.js';

const consultaDelPort = (config) => consultaResumSessionsDispositius(port, config);

const horaDeLaConsulta = (iso) => {
  try {
    return new Date(iso).toLocaleString('ca-ES', { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
};

/* La taula del resum: una fila per camí i la dels totals; cap xifra que no vinga del servidor. */
function TaulaDelResum({ resum, nativaIos }) {
  const files = filesDelResum(resum, { nativaIos });
  const androidApp = files.find((f) => f.cami === 'app_android');
  return (
    <>
      <table className="sdp-admin-table" data-testid="taula-usuaris-dispositius">
        <caption>
          Persones distintes amb sessió activa · consulta de les <time dateTime={resum.consultatA}>{horaDeLaConsulta(resum.consultatA)}</time>
        </caption>
        <thead>
          <tr>
            <th scope="col">Camí</th>
            <th scope="col">24 hores</th>
            <th scope="col">7 dies</th>
            <th scope="col">14 dies</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.cami} data-testid={`fila-cami-${f.cami}`}>
              <th scope="row">{f.titol}</th>
              <td>{f.persones24h}</td>
              <td>{f.persones7d}</td>
              <td>{f.persones14d}</td>
            </tr>
          ))}
          <tr data-testid="fila-cami-total">
            <th scope="row"><strong>Persones distintes (tots els camins)</strong></th>
            <td><strong>{resum.total.persones24h}</strong></td>
            <td><strong>{resum.total.persones7d}</strong></td>
            <td><strong>{resum.total.persones14d}</strong></td>
          </tr>
        </tbody>
      </table>
      <p className="sdp-muted">{NOTA_RECOMPTES}</p>
      {androidApp ? <p className="sdp-muted" data-testid="nota-verificadors">{NOTA_VERIFICADORS}</p> : null}
    </>
  );
}

/* 1 · Els usuaris i els dispositius connectats, a demanda. */
function UsuarisIDispositius({ consulta, nativaIos }) {
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
    <section className="sdp-admin-taxonomia__panel" aria-labelledby={idTitol} data-testid="usuaris-dispositius-connectats">
      <h3 id={idTitol}>👥 Usuaris i dispositius connectats</h3>
      <p className="sdp-muted">
        {nativaIos
          ? `Quantes persones han entrat des de l’app de l’App Store (v${APP_STORE.versio} · ${APP_STORE.id}), des de Safari o des de l’escriptori.`
          : `Quantes persones han entrat des de l’app de l’App Store (v${APP_STORE.versio} · ${APP_STORE.id}) o des de Safari, des de l’app d’Android de Google Play o des de Chrome, i des de l’escriptori.`}
      </p>
      <div className="sdp-admin-actions-inline">
        <Boto varietat="primari" onClick={consultar} carregant={carregant} data-testid="boto-consulta-usuaris-dispositius">
          {TEXT_BOTO_CONSULTA}
        </Boto>
      </div>
      <div aria-live="polite" data-testid="estat-usuaris-dispositius" data-fase={estat.fase}>
        {estat.fase === 'inicial' ? <p className="sdp-muted sdp-paragraf-centrat">{TEXT_ESTAT_INICIAL}</p> : null}
        {carregant ? <Carregant /> : null}
        {estat.fase === 'error' ? <Alerta to="avis" viva={false}>{textErrorResum(estat.codi)}</Alerta> : null}
        {estat.fase === 'dades' ? <TaulaDelResum resum={estat.resum} nativaIos={nativaIos} /> : null}
      </div>
    </section>
  );
}

/* 3 · La guia dels verificadors d'Android i el missatge per al grup de WhatsApp. */
function GuiaVerificadorsAndroid({ navegador }) {
  const idTitol = useId();
  const [copia, setCopia] = useState('res');
  const copiar = useCallback(() => {
    setCopia('copiant');
    copiaAlPortaretalls(MISSATGE_WHATSAPP_VERIFICADORS, navegador).then((fet) => setCopia(fet ? 'fet' : 'a-ma'));
  }, [navegador]);
  return (
    <section className="sdp-admin-taxonomia__panel" aria-labelledby={idTitol} data-testid="guia-verificadors-android">
      <h3 id={idTitol}>Guia visual de 3 passos per als verificadors d’Android</h3>
      <ol className="sdp-admin-botiga-detall__passos">
        {PASSOS_VERIFICADOR_GOOGLE_PLAY.map((pas) => <li key={pas}>{pas}</li>)}
      </ol>
      <div className="sdp-admin-actions-inline sdp-admin-actions-inline--separat">
        <Boto onClick={copiar} carregant={copia === 'copiant'} data-testid="boto-copia-missatge-whatsapp">
          Copia el missatge per al grup de WhatsApp
        </Boto>
      </div>
      <div aria-live="polite" data-testid="estat-copia-whatsapp" data-copia={copia}>
        {copia === 'fet' ? <p className="sdp-paragraf-centrat">Missatge copiat: enganxa’l al grup de WhatsApp.</p> : null}
        {copia === 'a-ma' ? (
          <Camp etiqueta="Este navegador no ha deixat copiar: selecciona el missatge i copia’l a mà">
            <AreaText readOnly value={MISSATGE_WHATSAPP_VERIFICADORS} files={10} onFocus={(e) => e.currentTarget.select()} />
          </Camp>
        ) : null}
      </div>
    </section>
  );
}

/**
 * @param {{ consulta?: (config: object) => Promise<object>, nativaIos?: boolean, navegador?: Navigator }} props
 *   consulta: la funció de dades (per defecte, la del port); nativaIos: dins de l'app d'iOS (per defecte,
 *   esAppNativaIos()); navegador: on es llig navigator.clipboard (per defecte, el global).
 */
export default function PanellUsuarisDispositiusBotigues({ consulta = consultaDelPort, nativaIos: nativaIosProp, navegador } = {}) {
  const [nativaIosDetectada] = useState(() => esAppNativaIos());
  const nativaIos = typeof nativaIosProp === 'boolean' ? nativaIosProp : nativaIosDetectada;
  return (
    <article className="sdp-admin-taxonomia" aria-label="Usuaris, dispositius i botigues" data-testid="panell-usuaris-dispositius-botigues">
      <header className="sdp-admin-taxonomia__header">
        <div className="sdp-admin-taxonomia__badges">
          <Insignia to="info">{`🍎 App Store v${APP_STORE.versio} · ${APP_STORE.id}`}</Insignia>
          {nativaIos ? null : <Insignia to="neutre">🤖 Google Play: prova tancada amb verificadors</Insignia>}
        </div>
      </header>

      <UsuarisIDispositius consulta={consulta} nativaIos={nativaIos} />
      <PanellSessionsDetall nativaIos={nativaIos} />

      <section className="sdp-admin-taxonomia__panel" aria-label="Descàrregues oficials" data-testid="botons-oficials-botigues">
        <h3>📲 Descàrregues oficials</h3>
        <div className="sdp-admin-actions-inline">
          <a className="sdp-boto sdp-boto--marca sdp-boto--apple sdp-boto--gran" href={URL_FITXA_APP_STORE}
            target="_blank" rel="noopener noreferrer" data-testid="boto-descarrega-app-store">
            🍎 Descarrega a l’App Store
          </a>
          {nativaIos ? null : (
            <a className="sdp-boto sdp-boto--marca sdp-boto--google sdp-boto--gran" href={ADRECA_VERIFICADORS_GOOGLE_PLAY}
              target="_blank" rel="noopener noreferrer" data-testid="boto-descarrega-google-play">
              ▶️ Descarrega a Google Play Beta
            </a>
          )}
        </div>
        {nativaIos ? null : <p className="sdp-muted sdp-paragraf-centrat" data-testid="nota-pas-1-google-play">{NOTA_PAS_1_GOOGLE_PLAY}</p>}
      </section>

      {nativaIos ? null : <GuiaVerificadorsAndroid navegador={navegador} />}
    </article>
  );
}
