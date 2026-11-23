import { useEffect, useRef, useState } from 'react';
import { Alerta, Boto, Camp, CampText, Selector } from '../../../components/PedraSeca/index.js';
import { useLlenguaDeLaUI } from '../useLlenguaDeLaUI.js';
import { useSessioOpcional } from '../../../app/contexts/SessionContext.jsx';
import * as port from '../../../data/backendPort.js';
import { codiDErrorResumSessions } from '../../../data/resumSessionsDispositius.js';
import { CAMINS_PANELL } from './usuarisDispositiusBotigues.js';
import cssAdminTaxonomia from '../../../css/diferit-admin-taxonomia.css?inline';
import { adoptaFullDiferit } from '../../../config/fullDiferit.js';
import { textosAdminEntitats } from './i18nAdminEntitats.js';

const adoptaEstilsAdminTaxonomia = (node) => { if (node) adoptaFullDiferit(node, 'admin-taxonomia', cssAdminTaxonomia); };
const consultaDelPort = (entrada, config) => port.adminLlistaSessionsDispositius(entrada, config);

export default function PanellSessionsDetall({ consulta = consultaDelPort, nativaIos = false }) {
  const llenguaUI = useLlenguaDeLaUI();
  const tx = textosAdminEntitats(llenguaUI);
  const sessio = useSessioOpcional();
  const usuariId = sessio?.currentUser?.id;
  const [cerca, setCerca] = useState('');
  const [cami, setCami] = useState('tots');
  const [estat, setEstat] = useState({ fase: 'inicial' });
  const control = useRef(null);
  const generacio = useRef(0);
  useEffect(() => {
    generacio.current += 1; control.current?.abort(); setEstat({ fase: 'inicial' });
    return () => { generacio.current += 1; control.current?.abort(); };
  }, [usuariId]);
  const consultaAra = async (e) => {
    e.preventDefault();
    control.current?.abort(); const avorta = new AbortController(); control.current = avorta;
    const numero = ++generacio.current;
    setEstat({ fase: 'carregant' });
    try {
      const dades = await consulta({ cerca, cami }, { signal: avorta.signal });
      if (numero === generacio.current) setEstat({ fase: 'dades', dades, actor: usuariId });
    } catch (error) {
      if (numero === generacio.current && error.name !== 'AbortError') setEstat({ fase: 'error', codi: codiDErrorResumSessions(error) });
    }
  };
  const camins = CAMINS_PANELL
    .filter((c) => !(nativaIos && c.nomenaAltres))
    .map((c) => ({ ...c, titolLocalitzat: tx.caminsTitols?.[c.cami] || c.titol }));
  const dadesVisibles = estat.actor === usuariId ? estat.dades : null;
  const files = dadesVisibles?.files.filter((f) => !(nativaIos && ['app_android', 'web_android'].includes(f.cami))) ?? [];
  return (
    <section ref={adoptaEstilsAdminTaxonomia} className="sdp-admin-taxonomia__panel" aria-label={tx.directoriSessionsRegio}>
      <h3>{tx.sessionsTitol}</h3>
      <p>{tx.sessionsIntro}</p>
      <form onSubmit={consultaAra}>
        <Camp etiqueta={tx.sessionsFiltraNom}>
          <CampText value={cerca} maxLength={120} onChange={(e) => setCerca(e.target.value)} />
        </Camp>
        <Camp etiqueta={tx.sessionsFiltraDispositiu}>
          <Selector
            value={cami}
            onChange={(e) => setCami(e.target.value)}
            opcions={[
              { valor: 'tots', etiqueta: tx.sessionsTotsDispositius },
              ...camins.map((c) => ({ valor: c.cami, etiqueta: c.titolLocalitzat }))
            ]}
          />
        </Camp>
        <div className="sdp-admin-actions-inline">
          <Boto type="submit" carregant={estat.fase === 'carregant'}>{tx.sessionsBotoConsulta}</Boto>
        </div>
      </form>
      <div aria-live="polite">
        {estat.fase === 'inicial' ? <p>{tx.sessionsInicial}</p> : null}
        {estat.fase === 'error' ? (
          <Alerta to="avis">
            {estat.codi === 'sense-migracio' ? tx.sessionsSenseMigracio : tx.errorResum(estat.codi)}
          </Alerta>
        ) : null}
        {estat.fase === 'dades' && dadesVisibles ? (
          <>
            <p>
              {nativaIos ? tx.sessionsResumIos(files.length) : tx.sessionsResumWeb(files.length, estat.dades.total)}
              {' '}
              {tx.sessionsMaximNota}
              {' '}
              <time dateTime={estat.dades.consultatA}>{new Date(estat.dades.consultatA).toLocaleString(tx.locale)}</time>.
            </p>
            {files.length ? (
              <div className="sdp-admin-sessions">
                <table className="sdp-admin-table">
                  <caption>{tx.sessionsCaption}</caption>
                  <thead>
                    <tr>
                      <th scope="col">{tx.sessionsColUsuari}</th>
                      <th scope="col">{tx.sessionsColDispositiu}</th>
                      <th scope="col">{tx.sessionsColActivitat}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files.map((f) => (
                      <tr key={f.clau}>
                        <td>
                          {f.nom || tx.sessionsNomNoInformat}
                          <br />
                          {f.correuMascarat ?? tx.sessionsCorreuNoDisponible}
                        </td>
                        <td>
                          {camins.find((c) => c.cami === f.cami)?.titolLocalitzat}
                          <br />
                          <small>{tx.sessionsNombre(f.sessions)}</small>
                        </td>
                        <td>
                          <time dateTime={f.activitat}>{new Date(f.activitat).toLocaleString(tx.locale)}</time>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>{tx.sessionsCapCoincidencia}</p>
            )}
          </>
        ) : null}
      </div>
    </section>
  );
}
