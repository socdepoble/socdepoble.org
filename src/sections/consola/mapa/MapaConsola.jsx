import { Network } from 'lucide-react';
import { Alerta, Carregant, EstatBuit, Insignia, Taula } from '../../../components/PedraSeca';
import { Desplegable, Mono } from '../peces.jsx';
import { GraellaXifres } from '../XifresMas.jsx';
import { xifresDeVista } from '../xifresMas.js';
import { curt, dataLocal } from '../consolaContent.js';
import { resumMapa, valorMetrica, textCadencia, textLlancador } from './mapaContent.js';
import { EvidenciesAvis, codiIFrase } from './AvisosMapa.jsx';
import { TEXT_ESTAT, TO_CONFIANCA, TO_ESTAT, TO_SEVERITAT } from './grafMapa.js';

/* El Mapa de la Consola: qui crida qui, què corre sol i amb quina confiança.
   Contracte: _wiki_de_poble/02_saber/03_consola_termodinamica/04_contracte_de_dades.md
   Tot el que falta es pinta (N/A, «sense llançador»), mai s'amaga.
   Neteja 261007 (prompt 261007_1628, peça D) · Els tons i els textos de les
   insígnies (estat, confiança i severitat) tenen una sola font, grafMapa.js:
   ací n'hi havia una còpia idèntica. */

/* Ordre del Mestre, 261004 (cap anomalia sense mostrar) · L'avís es diu amb
   la seua frase darrere del codi, i l'evidència, totes si n'hi ha més d'una,
   va en <Mono>: abans era text cru i el mode privacitat no l'amagava. */
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
            <td>{codiIFrase(a.codi)}</td>
            <td><Insignia to={TO_SEVERITAT[a.severitat]}>{a.severitat}</Insignia></td>
            <td><EvidenciesAvis avis={a} /></td>
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

/* `font` és el resultat de useMapa() de la Consola, que llig el Mapa una
   sola vegada per a totes les pàgines; el Refrescar és el del peu (llig les
   dues fonts).
   Ordre del Mestre, 261004 (xat: cap xifra solta) · Les xifres són targetes
   senceres amb boina i pàgina pròpia (XifresMas.jsx), també sense Mapa (amb
   el seu nom: la seua pàgina diu per què no hi ha dada); el detall,
   desplegables. Derogat per l'ordre del Mestre del 261004 (xat: cap xifra
   solta): les xifres com a targetes del Panell de Control (Xifra).
   Correcció 261004 (verificador de la segona passada, punt 2) · Les
   targetes són les de la vista «salut» (VISTES_XIFRES): les anomalies del
   tauler que es tracten ací i les tasques del Mapa; els nodes i les arestes,
   a l'Explorador, que és on es tracten. Els desplegables ja no porten cap
   recompte al títol: la xifra és a la seua targeta. Derogat per l'ordre del
   Mestre del 261004 (xat: cap xifra solta): «Veure els N avisos», «Veure les
   N tasques» i «Veure les N arestes». */
export function MapaConsola({ locale, font }) {
  const { estat, mapa, error } = font;

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
      {/* Correcció 261004 (verificador de la tercera passada, punt 5) · sense Mapa, també
          mentre es llig: les targetes amb el seu nom (la seua pàgina ja existix). */}
      {!mapa && <GraellaXifres xifres={xifresDeVista('salut', null)} />}
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
        <GraellaXifres xifres={xifresDeVista('salut', mapa)} generat={mapa.generat} />
        <Desplegable titol="Veure els avisos, el més greu primer">
          <TaulaAvisos avisos={resum.avisosOrdenats} />
        </Desplegable>
        <Desplegable titol="Veure les tasques i els seus llançadors">
          <TaulaTasques tasques={mapa.tasques} />
        </Desplegable>
        <Desplegable titol="Veure la funció de salut">
          <TaulaSalut salut={mapa.salut} />
        </Desplegable>
        <Desplegable titol="Veure els nodes per tipus i les arestes per confiança">
          <TaulaRecompte titol="Nodes per tipus" capcal="Tipus" files={resum.perTipus} />
          <TaulaRecompte titol="Arestes per confiança" capcal="Confiança" files={resum.perConfianca} />
        </Desplegable>
        <Desplegable titol="Veure totes les arestes">
          <TaulaArestes arestes={mapa.arestes} />
        </Desplegable>
      </>}
    </>
  );
}
