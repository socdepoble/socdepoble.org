import { Network, RefreshCw } from 'lucide-react';
import { Alerta, Boto, EstatBuit, Insignia, Taula, UniversalCard } from '../../../components/PedraSeca';
import { Xifra, Mono } from '../peces.jsx';
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
    <Taula titol="Avisos del mapa" densa className="sdp-taula--llarga">
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
    <Taula titol="Arestes del mapa" densa className="sdp-taula--llarga">
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
   per a totes les pestanyes; sense `font`, el panell el llig pel seu compte. */
export function MapaConsola({ locale, font }) {
  const propi = useMapa({ actiu: !font });
  const { estat, mapa, error, carrega } = font ?? propi;

  const resum = mapa ? resumMapa(mapa) : null;
  const text = resum
    ? `${resum.nodes} nodes · ${resum.arestes} arestes · ${resum.avisos} avisos (${resum.alts} alts)`
    : estat === 'loading' ? 'Llegint el mapa…'
      : estat === 'absent' ? 'No disponible en este entorn'
        : 'No s’ha pogut llegir';
  const tall = mapa?.tall;

  return (
    <UniversalCard title="Mapa del Mas" headingLevel="h2"
      icon={<Network aria-hidden="true" />} hasFooter={false}
      body={<>
        <p>{text}</p>
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
          <div className="sdp-consola__resum">
            <Xifra etiqueta="Nodes" valor={resum.nodes} />
            <Xifra etiqueta="Arestes" valor={resum.arestes} />
            <Xifra etiqueta="Avisos alts" valor={resum.alts} />
            <Xifra etiqueta="Tasques" valor={resum.tasques} />
          </div>
          <details>
            <summary>Veure els {resum.avisos} avisos</summary>
            <TaulaAvisos avisos={resum.avisosOrdenats} />
          </details>
          <details>
            <summary>Veure les {resum.tasques} tasques</summary>
            <TaulaTasques tasques={mapa.tasques} />
          </details>
          <details>
            <summary>Veure la funció de salut</summary>
            <TaulaSalut salut={mapa.salut} />
          </details>
          <details>
            <summary>Veure els nodes per tipus i les arestes per confiança</summary>
            <TaulaRecompte titol="Nodes per tipus" capcal="Tipus" files={resum.perTipus} />
            <TaulaRecompte titol="Arestes per confiança" capcal="Confiança" files={resum.perConfianca} />
          </details>
          <details>
            <summary>Veure les {resum.arestes} arestes</summary>
            <TaulaArestes arestes={mapa.arestes} />
          </details>
        </>}
        <div className="sdp-consola__capcal">
          <Boto varietat="secundari" icona={RefreshCw}
            carregant={estat === 'loading'} onClick={carrega}>Refrescar el mapa</Boto>
        </div>
      </>} />
  );
}
