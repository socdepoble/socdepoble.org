import { HeartPulse, Link2, Network, RefreshCw, TriangleAlert } from 'lucide-react';
import { Alerta, Boto, Carregant, EstatBuit, Insignia, Taula } from '../../../components/PedraSeca';
import { Desplegable, Xifra, Mono } from '../peces.jsx';
import { curt, dataLocal } from '../consolaContent.js';
import { resumMapa, valorMetrica, textCadencia, textLlancador } from './mapaContent.js';
import { useMapa } from './useMapa.js';

/* El Mapa de la Consola: qui crida qui, què corre sol i amb quina confiança.
   Contracte: _wiki_de_poble/02_saber/03_consola_termodinamica/04_contracte_de_dades.md
   Tot el que falta es pinta (N/A, «sense llançador»), mai s'amaga. */

const TO_SEVERITAT = Object.freeze({ alta: 'error', mitjana: 'avis', baixa: 'info' });
const TO_ESTAT = Object.freeze({
  viu: 'exit', mort: 'error', 'declarat-sense-llancador': 'neutre',
  'llancador-sense-declaracio': 'avis', desconegut: 'neutre'
});
const TEXT_ESTAT = Object.freeze({
  viu: 'viu', mort: 'mort', 'declarat-sense-llancador': 'sense llançador',
  'llancador-sense-declaracio': 'sense declaració', desconegut: 'desconegut'
});
/* La confiança no és salut: només l'inferit avisa, perquè ix de la prosa. */
const TO_CONFIANCA = Object.freeze({ declarat: 'info', derivat: 'neutre', inferit: 'avis' });

function TaulaAvisos({ avisos }) {
  return (
    <Taula titol="Avisos del mapa" densa>
      <thead>
        <tr><th scope="col">Node</th><th scope="col">Avís</th><th scope="col">Severitat</th><th scope="col">Evidència</th></tr>
      </thead>
      <tbody>
        {avisos.map((a) => (
          <tr key={`${a.node}|${a.codi}`}>
            <th scope="row"><Mono>{a.node}</Mono></th>
            <td>{a.codi}</td>
            <td><Insignia to={TO_SEVERITAT[a.severitat]}>{a.severitat}</Insignia></td>
            <td>{a.evidencia ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}

function TaulaTasques({ tasques }) {
  return (
    <Taula titol="Tasques i llançadors" densa>
      <thead>
        <tr><th scope="col">Tasca</th><th scope="col">Estat</th><th scope="col">Llançador</th><th scope="col">Cadència</th><th scope="col">Script</th></tr>
      </thead>
      <tbody>
        {tasques.map((t) => (
          <tr key={t.id}>
            <th scope="row">{t.id}</th>
            <td><Insignia to={TO_ESTAT[t.estat]}>{TEXT_ESTAT[t.estat]}</Insignia></td>
            <td>{textLlancador(t.llancador)}</td>
            <td>{textCadencia(t.cadencia)}</td>
            <td>{t.script ? <Mono>{t.script}</Mono> : '—'}</td>
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}

function TaulaSalut({ salut }) {
  return (
    <Taula titol="Funció de salut" densa>
      <thead>
        <tr><th scope="col">Mètrica</th><th scope="col">Valor</th><th scope="col">Font</th><th scope="col">Prova</th></tr>
      </thead>
      <tbody>
        {salut.map((m) => (
          <tr key={m.metrica}>
            <th scope="row">{m.metrica}</th>
            <td>{m.valor === 'N/A' ? <Insignia to="neutre">N/A</Insignia> : valorMetrica(m)}</td>
            <td>{m.font}</td>
            <td>{m.prova ? <Mono>{m.prova}</Mono> : '—'}</td>
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}

function TaulaArestes({ arestes }) {
  return (
    <Taula titol="Arestes del mapa" densa>
      <thead>
        <tr><th scope="col">De</th><th scope="col">A</th><th scope="col">Relació</th><th scope="col">Confiança</th><th scope="col">Evidència</th></tr>
      </thead>
      <tbody>
        {arestes.map((a) => (
          <tr key={`${a.de}|${a.a}|${a.tipus}|${a.confianca}`}>
            <td><Mono>{a.de}</Mono></td>
            <td><Mono>{a.a}</Mono></td>
            <td>{a.tipus}</td>
            <td><Insignia to={TO_CONFIANCA[a.confianca]}>{a.confianca}</Insignia></td>
            <td>{a.evidencia ?? '—'}</td>
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}

function TaulaRecompte({ titol, capcal, files }) {
  return (
    <Taula titol={titol} densa>
      <thead><tr><th scope="col">{capcal}</th><th scope="col">Nombre</th></tr></thead>
      <tbody>
        {files.map(([clau, n]) => (
          <tr key={clau}><th scope="row">{clau}</th><td>{n}</td></tr>
        ))}
      </tbody>
    </Taula>
  );
}

/* `font` és el resultat de useMapa() quan la Consola ja ha llegit el Mapa
   per a totes les pàgines; sense `font`, el panell el llig pel seu compte.
   Dins de la Consola, el Refrescar és el de la capçalera (llig les dues
   fonts): el botó propi només ix quan el panell viu sol.
   Les xifres són targetes del Panell de Control; el detall, desplegables. */
export function MapaConsola({ locale, font }) {
  const propi = useMapa({ actiu: !font });
  const { estat, mapa, error, carrega } = font ?? propi;

  const resum = mapa ? resumMapa(mapa) : null;
  const tall = mapa?.tall;

  return (
    <>
      {estat === 'loading' && !mapa && <Carregant etiqueta="Llegint el mapa…" />}
      {estat === 'absent' && (
        <EstatBuit icona={Network} titol="Mapa no disponible">
          El Mapa només es publica al servidor local de desenvolupament
          (<Mono>GET /__iaia/mapa.json</Mono>). Si ací tampoc apareix, el
          compilador <Mono>tooling/brain/mapa-consola.mjs</Mono> encara no està
          instal·lat al middleware de la Consola.
        </EstatBuit>
      )}
      {estat === 'error' && (
        <Alerta to="error" titol="No s’ha pogut llegir el mapa">
          {mapa ? 'Es conserva l’última lectura bona. ' : ''}
          {error?.message || 'Torna a provar-ho amb Refrescar.'}
        </Alerta>
      )}
      {mapa && resum && <>
        <p className="sdp-consola__instantania" role="status">
          {tall
            ? `Tall: ${tall.branca ?? '—'} · ${tall.commit ? curt(tall.commit) : '—'} · ${tall.arbre_net === null ? 'arbre desconegut' : tall.arbre_net ? 'arbre net' : 'arbre brut'}`
            : 'Tall desconegut: sense branca ni commit, dos mapes no es poden comparar.'}
          {` · Generat: ${dataLocal(mapa.generat, locale)}`}
        </p>
        <div className="sdp-card-grid">
          <Xifra icona={TriangleAlert} etiqueta={`avisos, ${resum.alts} d’alts`} valor={resum.avisos} />
          <Xifra icona={HeartPulse} etiqueta="mètriques de salut amb mesura (la resta, N/A)" valor={`${resum.mesurades} / ${mapa.salut.length}`} />
          <Xifra icona={Network} etiqueta="nodes" valor={resum.nodes} />
          <Xifra icona={Link2} etiqueta="arestes" valor={resum.arestes} />
        </div>
        <Desplegable titol={`Veure els ${resum.avisos} avisos`}>
          <TaulaAvisos avisos={resum.avisosOrdenats} />
        </Desplegable>
        <Desplegable titol={`Veure les ${resum.tasques} tasques`}>
          <TaulaTasques tasques={mapa.tasques} />
        </Desplegable>
        <Desplegable titol="Veure la funció de salut">
          <TaulaSalut salut={mapa.salut} />
        </Desplegable>
        <Desplegable titol="Veure els nodes per tipus i les arestes per confiança">
          <TaulaRecompte titol="Nodes per tipus" capcal="Tipus" files={resum.perTipus} />
          <TaulaRecompte titol="Arestes per confiança" capcal="Confiança" files={resum.perConfianca} />
        </Desplegable>
        <Desplegable titol={`Veure les ${resum.arestes} arestes`}>
          <TaulaArestes arestes={mapa.arestes} />
        </Desplegable>
      </>}
      {!font && (
        <div className="sdp-consola__capcal">
          <Boto varietat="secundari" icona={RefreshCw}
            carregant={estat === 'loading'} onClick={carrega}>Refrescar el mapa</Boto>
        </div>
      )}
    </>
  );
}
