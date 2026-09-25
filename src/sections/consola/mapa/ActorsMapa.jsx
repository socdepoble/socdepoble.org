import { useMemo } from 'react';
import { Bot, CircleDashed, FileStack, FolderOpen, GitBranch, Lock, LockOpen, Timer } from 'lucide-react';
import { EstatBuit, Taula } from '../../../components/PedraSeca';
import { Mono, Privat, TargetaResum, etiquetaBona, etiquetaPendent } from '../peces.jsx';
import { etiquetaNode } from './grafMapa.js';
import { quanDe } from './calendariMapa.js';
import { capesActors } from './actorsMapa.js';

/* Actors del Mas (05_actors_i_salut.md): la pestanya «Actores» d'Emowe, capa
   per capa. Cada capa ix del Mapa; la relació amb la capa del costat va
   escrita en la targeta (qui dispara quin candat, qui carrega què), perquè es
   puga llegir també sense vore cap línia. */

const darrer = (cami) => String(cami).split('/').filter(Boolean).pop() || String(cami);
const plural = (n, un, molts) => `${n} ${n === 1 ? un : molts}`;
const noms = (nodes) => nodes.map((n) => n.atributs?.arnes ?? etiquetaNode(n)).join(', ');

const ESTAT_TASCA = Object.freeze({
  viu: etiquetaBona('VIU'),
  mort: etiquetaPendent('MORT'),
  'declarat-sense-llancador': etiquetaPendent('SENSE LLANÇADOR'),
  'llancador-sense-declaracio': etiquetaPendent('SENSE DECLARACIÓ'),
  desconegut: etiquetaPendent('DESCONEGUT')
});

function estatArnes(a) {
  if (!a.candats) return etiquetaPendent('SENSE CANDATS');
  if (a.acreditats === a.candats) return etiquetaBona('ACTIU');
  return a.acreditats ? etiquetaPendent('PARCIAL') : etiquetaPendent('SENSE CONSUMIDOR');
}

function estatCandat(c) {
  if (c.acreditat === true) return etiquetaBona('ACTIU');
  return c.acreditat === false ? etiquetaPendent('SENSE CONSUMIDOR') : etiquetaPendent('DESCONEGUT');
}

function arrencada({ documents, skills }) {
  if (!documents.length && !skills.length) return 'no declara què carrega en arrencar';
  return `en arrencar carrega ${plural(documents.length, 'document', 'documents')} i ${plural(skills.length, 'skill', 'skills')}`;
}

export function ActorsMapa({ mapa }) {
  const capes = useMemo(() => capesActors(mapa), [mapa]);
  const { arnesos, carregadors, candats, programades, senseLlancador, sol } = capes;

  return (
    <>
      <p>
        Al capdamunt, el Mestre: demana, revisa i decidix. Davall, capa per capa, el que el
        Mapa troba al voltant dels agents. Cada targeta porta el seu estat; el que falta es
        diu, no s'amaga. Les relacions entre capes van escrites en cada targeta: qui dispara
        quin candat i qui carrega què en arrencar.
      </p>

      <section>
        <h2>Els que conversen</h2>
        <p>Cada arnés és l'eina amb què el Mestre parla amb un agent. Dispara els seus candats i carrega la memòria d'arrencada.</p>
        {arnesos.length ? (
          <div className="sdp-card-grid">
            {arnesos.map((a) => (
              <TargetaResum key={a.node.id} icona={Bot} titol={a.nom}
                descripcio={`${plural(a.candats, 'candat', 'candats')} · ${arrencada(a.arrencada)}`}
                etiquetes={estatArnes(a)} />
            ))}
          </div>
        ) : <EstatBuit icona={Bot} titol="Cap arnés al Mapa" />}
        <p>
          Codex i les dotze membres del Consell no hi apareixen: el compilador encara no
          llig <Mono>.agents/consell.json</Mono> ni la configuració de Codex.
        </p>
      </section>

      <section>
        <h2>La memòria d’arrencada</h2>
        <p>El que s'ha carregat abans de la primera paraula. Un carregador que cap arnés no declara carregar només compta si algú el llig a mà.</p>
        {carregadors.length ? <>
          <div className="sdp-card-grid">
            {carregadors.map((c) => {
              const docs = c.carrega.filter((n) => n.tipus === 'document').length;
              const skills = c.carrega.filter((n) => n.tipus === 'skill').length;
              return (
                <TargetaResum key={c.node.id} icona={FileStack} titol={<Privat>{etiquetaNode(c.node)}</Privat>}
                  descripcio={`carrega ${plural(docs, 'document', 'documents')} i ${plural(skills, 'skill', 'skills')} · ${c.perQui.length ? `el carrega ${noms(c.perQui)}` : 'cap arnés declara que el carrega'}`} />
              );
            })}
          </div>
          <Taula titol="Què es carrega en arrencar" densa>
            <thead>
              <tr><th scope="col">Carregador</th><th scope="col">Carrega</th><th scope="col">Qui el carrega</th></tr>
            </thead>
            <tbody>
              {carregadors.map((c) => (
                <tr key={c.node.id}>
                  <th scope="row"><Mono>{etiquetaNode(c.node)}</Mono></th>
                  <td>{c.carrega.map((n) => (n.tipus === 'skill' ? etiquetaNode(n) : <Mono key={n.id}>{etiquetaNode(n)}</Mono>))
                    .flatMap((x, i) => (i ? [' · ', x] : [x]))}</td>
                  <td>{c.perQui.length ? noms(c.perQui) : 'cap arnés'}</td>
                </tr>
              ))}
            </tbody>
          </Taula>
        </> : <EstatBuit icona={FileStack} titol="Cap càrrega d’arrencada declarada" />}
      </section>

      <section>
        <h2>Els candats</h2>
        <p>
          Els hooks intercepten cada eina de l'agent abans o després d'executar-se. Un candat
          sense consumidor acreditat és una promesa: està declarat, però ningú no demostra que salte.
        </p>
        {candats.length ? (
          <div className="sdp-card-grid">
            {candats.map((c) => (
              <TargetaResum key={c.id} icona={c.acreditat === true ? Lock : c.acreditat === false ? LockOpen : GitBranch}
                titol={c.esdeveniment}
                descripcio={c.scripts.length
                  ? <>{c.arnes} · dispara <Privat>{c.scripts.map(darrer).join(', ')}</Privat></>
                  : `${c.arnes} · sense script declarat`}
                etiquetes={estatCandat(c)} />
            ))}
          </div>
        ) : <EstatBuit icona={Lock} titol="Cap candat al Mapa" />}
      </section>

      <section>
        <h2>El que corre sol</h2>
        <p>Les tasques que llança el rellotge del sistema (launchd), sense ningú davant. Les que el registre declara i ningú no llança, a part.</p>
        {programades.length || senseLlancador.length ? (
          <div className="sdp-card-grid">
            {programades.map((t) => (
              <TargetaResum key={t.id} icona={Timer} titol={t.id}
                descripcio={<>{quanDe(t)}{t.script ? <> · <Privat>{darrer(t.script)}</Privat></> : null}</>}
                etiquetes={ESTAT_TASCA[t.estat]} />
            ))}
            {senseLlancador.length ? (
              <TargetaResum icona={CircleDashed} titol={plural(senseLlancador.length, 'tasca sense llançador', 'tasques sense llançador')}
                descripcio={senseLlancador.map((t) => t.id).join(' · ')} etiquetes={etiquetaPendent('FALTA')} />
            ) : null}
          </div>
        ) : <EstatBuit icona={Timer} titol="Res no corre sol">Cap tasca del Mapa té llançador: els agents només treballen mentre algú els parla.</EstatBuit>}
      </section>

      <section>
        <h2>El sòl</h2>
        <p>On treballen: els llocs on les peces deixen la faena o la lligen.</p>
        {sol.length ? (
          <div className="sdp-card-grid">
            {sol.map((p) => (
              <TargetaResum key={p.node.id} icona={FolderOpen} titol={<Privat>{etiquetaNode(p.node)}</Privat>}
                descripcio={`hi escriuen ${p.escriuen.length} · el lligen ${p.lligen.length}`}
                etiquetes={p.escriuen.length && !p.lligen.length ? etiquetaPendent('SENSE LECTOR') : undefined} />
            ))}
          </div>
        ) : <EstatBuit icona={FolderOpen} titol="Cap lloc declarat" />}
      </section>
    </>
  );
}
