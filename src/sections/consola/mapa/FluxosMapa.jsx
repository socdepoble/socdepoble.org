import { useMemo } from 'react';
import { Workflow } from 'lucide-react';
import { EstatBuit, Insignia, Taula } from '../../../components/PedraSeca';
import { Link } from '../../../app/contexts/RouterContext';
import { concorda, de, plural } from '../concordanca.js';
import { Mono, Privat } from '../peces.jsx';
import { GraellaXifres } from '../XifresMas.jsx';
import { rutaXifra, xifresDeVista } from '../xifresMas.js';
import { NOMS_TIPUS, TO_CONFIANCA, etiquetaNode } from './grafMapa.js';
import { esSenseLector, fluxosDelMapa } from './fluxosMapa.js';

/* Fluxos de treball (01_fluxos_skills.md): la pestanya «Flujos trabajo
   skills» d'Emowe amb la regla del Mas. Només encadenen les relacions
   declarades o derivades; la prosa queda com a suggeriment de «declara'm».
   Ordre del Mestre, 261004 (xat: cap xifra solta) · Les xifres són
   targetes senceres amb boina i pàgina pròpia (XifresMas.jsx). Derogat per
   l'ordre del Mestre del 261004 (xat: cap xifra solta): les xifres com a
   targetes compactes del Panell de Control (Xifra).
   Correcció 261004 (verificador de la segona passada, punt 2) · Els llocs
   que reben faena sense lector també són una targeta, i la frase de l'estat
   buit que els compta hi enllaça.
   Neteja 261007 (prompt 261007_1628, peça D) · El to de la confiança és el
   de grafMapa.js (TO_CONFIANCA), la seua única font: ací n'hi havia una còpia
   idèntica. */

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
      <h4>{noms}</h4>
      <p>
        {/* Correcció 261004 (verificador de la tercera passada, punt 3) · «Cadena d’8 passos». */}
        {`Cadena ${de(cadena.passos.length, plural(cadena.passos.length, 'pas', 'passos'))}.`} Confiança de la baula més feble:{' '}
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
  const xifres = useMemo(() => xifresDeVista('fluxos', mapa), [mapa]);
  const senseLector = punts.filter(esSenseLector).length;

  return (
    <>
      <p>
        Un flux de treball és una cadena de peces on el que deixa una és el que llig la
        següent, o on una crida l'altra de veres. Ací només encadenen les relacions
        declarades o derivades: una skill que en nomena una altra no la crida per força,
        i per això el que diu la prosa queda a part, com a suggeriment del que caldria declarar.
      </p>
      <GraellaXifres xifres={xifres} generat={mapa.generat} />

      <section>
        <h3>Cadenes declarades</h3>
        {cadenes.length ? cadenes.map((c) => <Cadena key={c.id} cadena={c} />) : (
          <EstatBuit icona={Workflow} titol="Cap cadena declarada">
            Cap ruta ni skill declara que llig el que una altra deixa
            {senseLector ? (
              <>: <Link to={rutaXifra('llocs-sense-lector')}>{plural(senseLector, 'lloc', 'llocs')}</Link>{' '}
                {concorda(senseLector, 'rep', 'reben')} faena i ningú no declara que la replega</>
            ) : null}.
            Quan es declare (el camp <code>contracte.llig</code> de les skills, o les <code>lectures</code> de
            cada ruta a <Mono>.agents/protocolledge.json</Mono>), les cadenes apareixeran ací soles.
          </EstatBuit>
        )}
      </section>

      <section>
        <h3>Suggeriments de la prosa</h3>
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
        <h3>Punts de trobada</h3>
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
