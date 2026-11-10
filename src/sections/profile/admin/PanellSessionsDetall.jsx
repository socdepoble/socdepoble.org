import { useEffect, useRef, useState } from 'react';
import { Alerta, Boto, Camp, CampText, Selector } from '../../../components/PedraSeca/index.js';
import { useSessioOpcional } from '../../../app/contexts/SessionContext.jsx';
import * as port from '../../../data/backendPort.js';
import { codiDErrorResumSessions } from '../../../data/resumSessionsDispositius.js';
import { MIGRACIO_DETALL_SESSIONS } from '../../../data/sessionsDispositius.js';
import { CAMINS_PANELL, textErrorResum } from './usuarisDispositiusBotigues.js';
const consultaDelPort = (entrada, config) => port.adminLlistaSessionsDispositius(entrada, config);
export default function PanellSessionsDetall({ consulta = consultaDelPort, nativaIos = false }) {
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
  const camins = CAMINS_PANELL.filter(c => !(nativaIos && c.nomenaAltres));
  const dadesVisibles = estat.actor === usuariId ? estat.dades : null;
  const files = dadesVisibles?.files.filter(f => !(nativaIos && ['app_android','web_android'].includes(f.cami))) ?? [];
  return <section className="sdp-admin-taxonomia__panel" aria-label="Directori d’usuaris i dispositius">
    <h3>Directori d’usuaris i dispositius</h3>
    <p>Persones i dispositius amb activitat en els últims 14 dies. Consulta restringida a superadmin amb segon factor; cada consulta queda registrada al servidor. Només hi apareixen comptes amb consentiment vigent i sense baixa demanada, amb el correu emmascarat. El canal és una estimació del navegador; no es mostra cap token, adreça IP, agent complet ni identificador de sessió o de persona.</p>
    <form onSubmit={consultaAra}>
      <Camp etiqueta="Filtra per nom o àlies"><CampText value={cerca} maxLength={120} onChange={e => setCerca(e.target.value)} /></Camp>
      <Camp etiqueta="Filtra per dispositiu"><Selector value={cami} onChange={e => setCami(e.target.value)} opcions={[{ valor: 'tots', etiqueta: 'Tots els dispositius' }, ...camins.map(c => ({ valor: c.cami, etiqueta: c.titol }))]} /></Camp>
      <div className="sdp-admin-actions-inline"><Boto type="submit" carregant={estat.fase === 'carregant'}>Consulta el directori</Boto></div>
    </form>
    <div aria-live="polite">
      {estat.fase === 'inicial' ? <p>Encara no s’ha consultat el directori.</p> : null}
      {estat.fase === 'error' ? <Alerta to="avis">{estat.codi === 'sense-migracio' ? `El directori requerix la migració ${MIGRACIO_DETALL_SESSIONS}, encara pendent de verificació al servidor.` : textErrorResum(estat.codi)}</Alerta> : null}
      {estat.fase === 'dades' && dadesVisibles ? <>
        <p>{nativaIos ? `${files.length} combinacions de persona i dispositiu visibles en esta consulta.` : `${files.length} de ${estat.dades.total} combinacions de persona i dispositiu coincidents.`} Es mostren com a màxim 200 combinacions per consulta; concreta els filtres per buscar-ne més. Hora: <time dateTime={estat.dades.consultatA}>{new Date(estat.dades.consultatA).toLocaleString('ca-ES')}</time>.</p>
        {files.length ? <div className="sdp-admin-sessions"><table className="sdp-admin-table"><caption>Usuaris i dispositius amb activitat recent</caption><thead><tr><th scope="col">Usuari</th><th scope="col">Dispositiu</th><th scope="col">Última activitat</th></tr></thead><tbody>{files.map(f => <tr key={f.clau}><td>{f.nom || 'Nom no informat'}<br />{f.correuMascarat ?? 'Correu no disponible'}</td><td>{camins.find(c => c.cami === f.cami)?.titol}<br /><small>{f.sessions === 1 ? '1 sessió' : `${f.sessions} sessions`}</small></td><td><time dateTime={f.activitat}>{new Date(f.activitat).toLocaleString('ca-ES')}</time></td></tr>)}</tbody></table></div> : <p>No hi ha sessions que coincidisquen amb estos filtres.</p>}
      </> : null}
    </div>
  </section>;
}
