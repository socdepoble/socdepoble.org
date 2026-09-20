import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Coins, Receipt, Puzzle, RefreshCw } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import {
  Boto, Dialeg, Taula, Pestanyes, Insignia, EstatBuit, Carregant, Progres
} from '../../components/PedraSeca';
import { useSEO } from '../../hooks/useSEO';
import { useUIActions } from '../../app/contexts/UIContext';
import {
  carregaConsola, resumSkills, resumConsums, curt, dataLocal
} from './consolaContent.js';

/* ── Peces internes (sense classes noves fora de sdp-consola__*) ─────────── */

function Xifra({ etiqueta, valor }) {
  return (
    <div className="sdp-consola__xifra">
      <span className="sdp-consola__xifra-valor">{valor}</span>
      <span className="sdp-consola__xifra-etiqueta">{etiqueta}</span>
    </div>
  );
}

function PanellConsums({ consums }) {
  if (consums.length === 0) {
    return (
      <EstatBuit icona={Activity} titol="Cap consum registrat">
        El diari <code className="sdp-consola__mono">.agents/.diari_sessio.jsonl</code> no conté cap
        entrada <code className="sdp-consola__mono">consum.tokens</code>. Quan un agent en registre,
        apareixerà ací sense tocar codi.
      </EstatBuit>
    );
  }
  const { total, perAgent } = resumConsums(consums);
  return (
    <>
      <div className="sdp-consola__resum">
        <Xifra etiqueta="Tòkens d'entrada" valor={total.entrada.toLocaleString('ca-ES')} />
        <Xifra etiqueta="Tòkens d'eixida" valor={total.eixida.toLocaleString('ca-ES')} />
        <Xifra etiqueta="Sessions" valor={consums.length} />
      </div>
      <Taula titol="Consum de tòkens per agent" densa>
        <thead>
          <tr><th>Agent</th><th>Sessions</th><th>Entrada</th><th>Eixida</th></tr>
        </thead>
        <tbody>
          {perAgent.map((a) => (
            <tr key={a.agent}>
              <td>{a.agent}</td>
              <td>{a.sessions}</td>
              <td>{a.entrada.toLocaleString('ca-ES')}</td>
              <td>{a.eixida.toLocaleString('ca-ES')}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

function PanellCredits({ credits }) {
  if (!credits) {
    return (
      <EstatBuit icona={Coins} titol="Sense font de crèdits">
        Cap fitxer del repositori registra el saldo de crèdits de l'eixam. La consola no l'inventa:
        quan hi haja font (§3.6 de l'auditoria 260920_0300), es connecta ací.
      </EstatBuit>
    );
  }
  return (
    <div className="sdp-consola__llista">
      {credits.map((c) => (
        <Progres key={c.proveidor} etiqueta={`${c.proveidor} · ${c.consumit} / ${c.limit}`}
          valor={c.consumit} max={c.limit} />
      ))}
    </div>
  );
}

function PanellRebuts({ rebuts, onVeure }) {
  if (rebuts.length === 0) {
    return <EstatBuit icona={Receipt} titol="Cap rebut Matrix">El diari de sessió no té entrades <code className="sdp-consola__mono">matrix.rebut</code>.</EstatBuit>;
  }
  return (
    <Taula titol="Rebuts de lectura Matrix" densa className="sdp-taula--llarga">
      <thead>
        <tr><th>Data</th><th>Petició</th><th>Protocol</th><th>Fonts</th><th></th></tr>
      </thead>
      <tbody>
        {rebuts.map((r) => (
          <tr key={`${r.t}-${r.peticio}`}>
            <td>{dataLocal(r.t)}</td>
            <td className="sdp-consola__mono">{curt(r.peticio)}</td>
            <td>{r.protocols.map((p) => p.split('/').pop()).join(', ') || '—'}</td>
            <td>{r.fonts.length}</td>
            <td><Boto varietat="fantasma" onClick={() => onVeure(r)}>Veure fonts</Boto></td>
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}

function PanellSkills({ skills, segell }) {
  const { total, orfes, fantasmes, nucli } = resumSkills(skills);
  return (
    <>
      <div className="sdp-consola__resum">
        <Xifra etiqueta="Skills" valor={total} />
        <Xifra etiqueta="Nucli (core)" valor={nucli.length} />
        <Xifra etiqueta="Orfes (disc sense manifest)" valor={orfes.length} />
        <Xifra etiqueta="Fantasmes (manifest sense disc)" valor={fantasmes.length} />
      </div>
      {segell ? (
        <p>
          Segell <code className="sdp-consola__mono">{curt(segell.hash)}</code> · {segell.filesCount} fitxers ·
          {' '}{dataLocal(segell.timestamp)}
        </p>
      ) : null}
      <Taula titol="Inventari de skills" densa>
        <thead>
          <tr><th>Skill</th><th>Estat</th><th>Manifest</th><th>Disc</th><th>Descripció</th></tr>
        </thead>
        <tbody>
          {skills.map((s) => (
            <tr key={s.nom}>
              <td>{s.core ? <strong>{s.nom}</strong> : s.nom}</td>
              <td>{s.estat ? <Insignia to={s.estat === 'canonic' ? 'exit' : 'info'}>{s.estat}</Insignia> : <Insignia to="neutre">sense estat</Insignia>}</td>
              <td>{s.alManifest ? <Insignia to="exit">sí</Insignia> : <Insignia to="error">no</Insignia>}</td>
              <td>{s.alDisc ? <Insignia to="exit">sí</Insignia> : <Insignia to="error">esborrat</Insignia>}</td>
              <td>{s.descripcio}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

/* ── Secció ─────────────────────────────────────────────────────────────── */

export default function ConsolaSection() {
  const { t } = useUIActions();
  const [estat, setEstat] = useState('loading');   // loading | ready | absent | error
  const [dades, setDades] = useState(null);
  const [error, setError] = useState(null);
  const [rebutObert, setRebutObert] = useState(null);

  useSEO({
    title: t('section.consola.title', 'Consola Termodinàmica'),
    description: t('section.consola.lead', "Consums, crèdits, rebuts Matrix i inventari de skills de l'eixam.")
  });

  const carrega = useCallback((signal) => {
    setEstat('loading');
    carregaConsola(signal)
      .then((d) => { if (signal?.aborted) return; setDades(d); setEstat(d ? 'ready' : 'absent'); })
      .catch((e) => { if (signal?.aborted) return; setError(e); setEstat('error'); });
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    carrega(ac.signal);
    return () => ac.abort();
  }, [carrega]);

  const pestanyes = dades ? [
    { id: 'consums', etiqueta: 'Consums', icona: Activity, contingut: <PanellConsums consums={dades.consums} /> },
    { id: 'credits', etiqueta: 'Crèdits', icona: Coins, contingut: <PanellCredits credits={dades.credits} /> },
    { id: 'rebuts', etiqueta: `Rebuts (${dades.rebuts.length})`, icona: Receipt, contingut: <PanellRebuts rebuts={dades.rebuts} onVeure={setRebutObert} /> },
    { id: 'skills', etiqueta: `Skills (${dades.skills.length})`, icona: Puzzle, contingut: <PanellSkills skills={dades.skills} segell={dades.segell} /> }
  ] : [];

  return (
    <UniversalPage
      title={t('section.consola.title', 'Consola Termodinàmica')}
      subtitle={t('section.consola.subtitle', 'Manteniment de la IAIA')}
      lead={t('section.consola.lead', "Consums, crèdits, rebuts Matrix i inventari de skills de l'eixam.")}
      chrome="system"
    >
      <div className="content-wrapper">
        <div className="sdp-consola__capcal">
          <p>
            {dades?.generat ? <>Instantània: {dataLocal(dades.generat)} · {dades.immunitari.operacions} operacions immunitàries</> : null}
          </p>
          <Boto varietat="secundari" icona={RefreshCw} carregant={estat === 'loading'} onClick={() => carrega()}>
            Refrescar
          </Boto>
        </div>

        {estat === 'loading' && !dades ? <Carregant etiqueta="Llegint l'estat de l'eixam…" /> : null}

        {estat === 'absent' ? (
          <EstatBuit titol="Consola no disponible en este entorn">
            El servidor no exposa <code className="sdp-consola__mono">/__iaia/consola.json</code>. La consola només
            existix al servidor de desenvolupament (plugin <code className="sdp-consola__mono">sdp:consola-iaia</code>).
          </EstatBuit>
        ) : null}

        {estat === 'error' ? (
          <EstatBuit titol="No s'ha pogut llegir la consola">
            <pre className="sdp-consola__mono">{error?.message || String(error)}</pre>
          </EstatBuit>
        ) : null}

        {dades ? <Pestanyes etiqueta="Panells de la consola" pestanyes={pestanyes} /> : null}
      </div>

      <Dialeg
        obert={rebutObert !== null}
        onTanca={() => setRebutObert(null)}
        titol="Fonts llegides senceres"
        descripcio={rebutObert ? `Petició ${curt(rebutObert.peticio)} · ${dataLocal(rebutObert.t)}` : undefined}
        mida="g"
        accions={<Boto varietat="primari" onClick={() => setRebutObert(null)}>Tancar</Boto>}
      >
        {rebutObert ? (
          <Taula titol="Fonts del rebut" densa>
            <thead><tr><th>Ruta</th><th>sha256</th></tr></thead>
            <tbody>
              {rebutObert.fonts.map((f) => (
                <tr key={f.ruta}><td>{f.ruta}</td><td className="sdp-consola__mono">{curt(f.sha256)}</td></tr>
              ))}
            </tbody>
          </Taula>
        ) : null}
      </Dialeg>
    </UniversalPage>
  );
}
