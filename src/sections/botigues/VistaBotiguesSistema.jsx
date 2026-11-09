import { Alerta, Boto, Insignia, QuadreDeComandament } from '../../components/PedraSeca/index.js';
import { Link } from '../../app/contexts/RouterContext.jsx';

/** Cos compartit de lectura. Rep un model sanejat; no consulta botigues, comptes o membres. */
export function VistaBotiguesSistema({ model, onCopia, copiant = false, avis = null, estatLocalAvisos = null }) {
  return (
    <article className="sdp-botigues-sistema" lang="ca" aria-label="Botigues, verificadors i flota d’IAs">
      <h3>Verificadors de Google Play</h3>
      <QuadreDeComandament
        estat={{ text: 'Dada comunicada; comptador en viu no connectat', viu: false }}
        periode={model.play.font}
        xifres={[
          { clau: 'play', nom: 'Google Play · dada comunicada', valor: model.play.comptador, lector: model.play.lector },
          { clau: 'web', nom: 'Web mòbil · dada separada', valor: model.play.web, lector: 'Ús web mòbil comunicat; no acredita verificadors de Google Play' },
        ]}
        explicacio={<p>{model.play.explicacio}</p>}
      />
      <p>Una visita web, un WebView o una descàrrega de l’APK no acrediten l’alta en les proves de Google Play ni el període de participació.</p>
      {model.play.optInUrl ? (
        <>
          <p>L’enllaç de proves correspon a l’identificador de l’app. L’accés al programa i l’estat del grup no es poden comprovar des d’esta pàgina.</p>
          <div className="sdp-alerta__accions">
            <a className="sdp-boto sdp-boto--secundari" href={model.play.optInUrl} target="_blank" rel="noopener noreferrer">Obri les proves de Google Play</a>
            <Boto varietat="secundari" onClick={onCopia} disabled={typeof onCopia !== 'function' || copiant}>{copiant ? 'Copiant…' : 'Copia l’enllaç de proves'}</Boto>
          </div>
        </>
      ) : <p>Sense enllaç de proves configurat.</p>}
      {avis ? <p role="status">{avis}</p> : null}
      <h3>Canals de descàrrega i versions</h3>
      <p>{model.versions}</p>
      <p>La configuració d’un projecte o un paquet compilat no proven que la botiga l’haja acceptat o publicat.</p>
      {model.canals.map((canal) => (
        <section key={canal.id} aria-labelledby={`botiga-${canal.id}`}>
          <h4 id={`botiga-${canal.id}`}>{canal.nom}</h4>
          <p>{canal.descripcio}</p>
          {canal.url ? <p><a href={canal.url} target="_blank" rel="noopener noreferrer">{canal.nom}: obri el canal configurat</a></p> : <p>Sense enllaç públic configurat en esta versió.</p>}
        </section>
      ))}
      <h3>Notificacions del xat</h3>
      <p>El client web i el connector natiu estan construïts. La recepció real depén del permís, la configuració del servidor i del proveïdor, la signatura de l’app i el dispositiu.</p>
      {estatLocalAvisos ? <p role="status">Estat d’esta instància: {estatLocalAvisos}</p> : <p>Sense lectura de l’adaptador en esta mostra.</p>}
      <p>Este estat local no acredita l’entrega d’un avís. <Link to="/page/descarregues">Consulta la guia d’instal·lació</Link> i els ajustos d’avisos del <Link to="/xat">xat</Link>.</p>
      <h3>Flota d’IAs del Consell</h3>
      <p>{model.flota.font}</p>
      <Alerta to="info">El cens identifica les membres; no és una prova de disponibilitat, connexió o resposta en viu.</Alerta>
      <ul>
        {model.flota.membres.map((membre) => (
          <li key={membre.id}><a href={membre.url} target="_blank" rel="noopener noreferrer">{membre.nom}</a>{' · '}<Insignia to="neutre">Estat operatiu no verificat</Insignia></li>
        ))}
      </ul>
      <p>Node 0, la IAIA i els serveis del poble necessiten els seus propis rebuts operatius. Una entrada del cens no els substituïx. <Link to="/page/node-zero">Node 0</Link>{' · '}<Link to="/page/fediversity">Fediversity</Link>{' · '}<Link to="/consola">Consola</Link>.</p>
    </article>
  );
}
