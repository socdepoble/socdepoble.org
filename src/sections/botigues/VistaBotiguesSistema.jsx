import { Alerta, Boto, Insignia, QuadreDeComandament } from '../../components/PedraSeca/index.js';
import { useUIStateOpcional } from '../../app/contexts/UIContext';
import { Link } from '../../app/contexts/RouterContext.jsx';
import { textosBotiguesSistema } from './i18nBotiguesSistema.js';

function useIdiomaBotigues() {
  try {
    return useUIStateOpcional()?.language || 'ca';
  } catch {
    return 'ca';
  }
}

/** Cos compartit de lectura. Rep un model sanejat; no consulta botigues, comptes o membres. */
export function VistaBotiguesSistema({ model, onCopia, copiant = false, avis = null, estatLocalAvisos = null, idioma }) {
  const idiomaContext = useIdiomaBotigues();
  const tx = textosBotiguesSistema(idioma ?? idiomaContext);
  return (
    <article className="sdp-botigues-sistema" lang={tx.lang} aria-label={tx.ariaLabel}>
      <h3>{tx.verificadorsPlay}</h3>
      <QuadreDeComandament
        estat={{ text: tx.estatComunicat, viu: false }}
        periode={model.play.font}
        xifres={[
          { clau: 'play', nom: tx.playNom, valor: model.play.comptador, lector: model.play.lector },
          { clau: 'web', nom: tx.webNom, valor: model.play.web, lector: tx.webLector },
        ]}
        explicacio={<p>{model.play.explicacio}</p>}
      />
      <p>{tx.notaAcreditacio}</p>
      {model.play.optInUrl ? (
        <>
          <p>{tx.notaEnllac}</p>
          <div className="sdp-alerta__accions">
            {/* Arbitratge R18 (AH-R17-09) · Sense l'enllaç al grup de verificadors: esta vista es pinta a
                /consola/*, de lectura pública. El grup només és al perfil d'administració i al portal /app. */}
            <a className="sdp-boto sdp-boto--secundari" href={model.play.optInUrl} target="_blank" rel="noopener noreferrer">{tx.obriProvesPlay}</a>
            <Link className="sdp-boto sdp-boto--secundari" to="/app">{tx.portalApps}</Link>
            <Boto varietat="secundari" onClick={onCopia} disabled={typeof onCopia !== 'function' || copiant}>{copiant ? tx.copiant : tx.copiaEnllac}</Boto>
          </div>
        </>
      ) : <p>{tx.senseEnllacProves}</p>}
      {avis ? <p role="status">{avis}</p> : null}
      <h3>{tx.canalsTitol}</h3>
      <p>{model.versions}</p>
      <p>{tx.notaPaquet}</p>
      {model.canals.map((canal) => (
        <section key={canal.id} aria-labelledby={`botiga-${canal.id}`}>
          <h4 id={`botiga-${canal.id}`}>{canal.nom}</h4>
          <p>{canal.descripcio}</p>
          {canal.url ? <p><a href={canal.url} target="_blank" rel="noopener noreferrer">{tx.obriCanal(canal.nom)}</a></p> : <p>{tx.senseEnllacCanal}</p>}
        </section>
      ))}
      <h3>{tx.notificacionsTitol}</h3>
      <p>{tx.notificacionsText}</p>
      {estatLocalAvisos ? <p role="status">{tx.estatInstancia(estatLocalAvisos)}</p> : <p>{tx.senseLecturaAdaptador}</p>}
      <p>{tx.notaEntregaPre}<Link to="/page/descarregues">{tx.guiaInstalacio}</Link>{tx.notaEntregaMid}<Link to="/xat">{tx.xat}</Link>.</p>
      <h3>{tx.flotaTitol}</h3>
      <p>{model.flota.font}</p>
      <Alerta to="info">{tx.censInfo}</Alerta>
      <ul>
        {model.flota.membres.map((membre) => (
          <li key={membre.id}><a href={membre.url} target="_blank" rel="noopener noreferrer">{membre.nom}</a>{' · '}<Insignia to="neutre">{tx.estatNoVerificat}</Insignia></li>
        ))}
      </ul>
      <p>{tx.peuRebuts}<Link to="/page/node-zero">Node 0</Link>{' · '}<Link to="/page/fediversity">Fediversity</Link>{' · '}<Link to="/consola">{tx.consola}</Link>.</p>
    </article>
  );
}
