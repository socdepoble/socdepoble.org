import { useMemo } from 'react';
import { FolderOpen, Waypoints, Workflow } from 'lucide-react';
import { EstatBuit, Insignia, Taula } from '../../../components/PedraSeca';
import { Mono, Privat, Xifra } from '../peces.jsx';
import { NOMS_TIPUS, etiquetaNode } from './grafMapa.js';
import { fluxosDelMapa } from './fluxosMapa.js';

/* Fluxos de treball (01_fluxos_skills.md): la pestanya «Flujos trabajo
   skills» d'Emowe amb la regla del Mas. Només encadenen les relacions
   declarades o derivades; la prosa queda com a suggeriment de «declara'm». */

const TO_CONFIANCA = Object.freeze({ declarat: 'info', derivat: 'neutre', inferit: 'avis' });
const nom = (id) => etiquetaNode({ id });
const darrer = (cami) => String(cami).split('/').filter(Boolean).pop() || String(cami);
const llista = (ids) => (ids.length ? ids.map(nom).join(' · ') : 'ningú');

function ComArriba({ enllac }) {
  if (enllac.via === 'crida') return <>{nom(enllac.de)} crida {nom(enllac.a)}</>;
  const deixa = darrer(enllac.deixa);
  const llig = darrer(enllac.llig);
  return deixa === llig
    ? <>{nom(enllac.de)} deixa <Privat>{deixa}</Privat> i {nom(enllac.a)} el llig</>
    : <>{nom(enllac.de)} deixa <Privat>{deixa}</Privat> i {nom(enllac.a)} llig <Privat>{llig}</Privat></>;
}

function Cadena({ cadena }) {
  const noms = cadena.passos.map((p) => nom(p.id)).join(' → ');
  return (
    <>
      <h3>{noms}</h3>
      <p>
        Cadena de {cadena.passos.length} passos. Confiança de la baula més feble:{' '}
        <Insignia to={TO_CONFIANCA[cadena.confianca]}>{cadena.confianca}</Insignia>
      </p>
      <Taula titol={`Cadena ${noms}`} densa>
        <thead>
          <tr>
            <th scope="col">Pas</th><th scope="col">Peça</th><th scope="col">Tipus</th>
            <th scope="col">Com li arriba la faena</th><th scope="col">Confiança</th>
          </tr>
        </thead>
        <tbody>
          {cadena.passos.map((p, i) => (
            <tr key={p.id}>
              <td>{i + 1}</td>
              <th scope="row">{nom(p.id)}</th>
              <td>{NOMS_TIPUS[p.tipus] ?? p.tipus ?? '—'}</td>
              <td>{p.enllac ? <ComArriba enllac={p.enllac} /> : 'comença la cadena'}</td>
              <td>{p.enllac ? <Insignia to={TO_CONFIANCA[p.enllac.confianca]}>{p.enllac.confianca}</Insignia> : '—'}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

export function FluxosMapa({ mapa }) {
  const { cadenes, suggeriments, punts } = useMemo(() => fluxosDelMapa(mapa), [mapa]);
  const senseLector = punts.filter((p) => p.escriuen.length && !p.lligen.length).length;

  return (
    <>
      <p>
        Un flux de treball és una cadena de peces on el que deixa una és el que llig la
        següent, o on una crida l'altra de veres. Ací només encadenen les relacions
        declarades o derivades: una skill que en nomena una altra no la crida per força,
        i per això el que diu la prosa queda a part, com a suggeriment del que caldria declarar.
      </p>
      <div className="sdp-card-grid">
        <Xifra icona={Workflow} valor={cadenes.length} etiqueta="Cadenes declarades o derivades" />
        <Xifra icona={Waypoints} valor={suggeriments.length} etiqueta="Suggeriments de la prosa (inferits)" />
        <Xifra icona={FolderOpen} valor={punts.length} etiqueta="Punts de trobada: llocs on una peça escriu o llig" />
      </div>

      <section>
        <h2>Cadenes declarades</h2>
        {cadenes.length ? cadenes.map((c) => <Cadena key={c.id} cadena={c} />) : (
          <EstatBuit icona={Workflow} titol="Cap cadena declarada">
            Cap ruta ni skill declara que llig el que una altra deixa
            {senseLector ? <>: {senseLector} {senseLector === 1 ? 'lloc rep' : 'llocs reben'} faena i ningú no declara que la replega</> : null}.
            Quan es declare (el camp <code>contracte.llig</code> de les skills, o les <code>lectures</code> de
            cada ruta a <Mono>.agents/protocolledge.json</Mono>), les cadenes apareixeran ací soles.
          </EstatBuit>
        )}
      </section>

      <section>
        <h2>Suggeriments de la prosa</h2>
        <p>
          Relacions que només es lligen al text d'una skill. No encadenen: si una és un
          pas de veres, el remei és declarar-la al seu contracte.
        </p>
        {suggeriments.length ? (
          <Taula titol="Suggeriments de la prosa" densa>
            <thead>
              <tr><th scope="col">Qui en parla</th><th scope="col">De qui parla</th><th scope="col">Relació</th><th scope="col">On ho diu</th></tr>
            </thead>
            <tbody>
              {suggeriments.map((s) => (
                <tr key={`${s.de}|${s.a}|${s.tipus}`}>
                  <th scope="row">{nom(s.de)}</th>
                  <td>{nom(s.a)}</td>
                  <td>{s.tipus}</td>
                  <td>{s.evidencia ? <Mono>{s.evidencia}</Mono> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </Taula>
        ) : <p>Cap: la prosa no suggerix cap relació entre skills o rutes.</p>}
      </section>

      <section>
        <h2>Punts de trobada</h2>
        <p>
          On deixa la faena cada peça i qui la replega. Una cadena es tanca on algú llig
          el que un altre ha deixat: un lloc amb escriptors i cap lector és una cadena a mitges.
        </p>
        {punts.length ? (
          <Taula titol="Punts de trobada" densa>
            <thead>
              <tr><th scope="col">Lloc</th><th scope="col">Hi escriuen</th><th scope="col">El lligen</th></tr>
            </thead>
            <tbody>
              {punts.map((p) => (
                <tr key={p.node.id}>
                  <th scope="row"><Privat>{etiquetaNode(p.node)}</Privat></th>
                  <td>{llista(p.escriuen)}</td>
                  <td>{llista(p.lligen)}</td>
                </tr>
              ))}
            </tbody>
          </Taula>
        ) : <p>Cap peça declara on escriu ni què llig.</p>}
      </section>
    </>
  );
}
