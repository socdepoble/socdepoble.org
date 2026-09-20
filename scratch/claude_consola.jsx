import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Coins, Receipt, Puzzle, RefreshCw } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import {
  Alerta, Boto, Dialeg, Taula, Pestanyes, Insignia, EstatBuit, Carregant, Progres
} from '../../components/PedraSeca';
import { useSEO } from '../../hooks/useSEO';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
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

const Mono = ({ children }) => <code className="sdp-consola__mono">{children}</code>;

function PanellConsums({ consums, locale }) {
  if (consums.length === 0) {
    return (
      <EstatBuit icona={Activity} titol="Cap consum registrat">
        El diari <Mono>.agents/.diari_sessio.jsonl</Mono> no conté cap entrada <Mono>consum.tokens</Mono>.
        Quan un agent en registre, apareixerà ací sense tocar codi.
      </EstatBuit>
    );
  }
  const { total, perAgent } = resumConsums(consums);
  const n = (x) => x.toLocaleString(locale);
  return (
    <>
      <div className="sdp-consola__resum">
        <Xifra etiqueta="Tòkens d'entrada" valor={n(total.entrada)} />
        <Xifra etiqueta="Tòkens d'eixida" valor={n(total.eixida)} />
        <Xifra etiqueta="Sessions" valor={n(consums.length)} />
      </div>
      <Taula titol="Consum de tòkens per agent" densa>
        <thead>
          <tr><th scope="col">Agent</th><th scope="col">Sessions</th><th scope="col">Entrada</th><th scope="col">Eixida</th></tr>
        </thead>
        <tbody>
          {perAgent.map((a) => (
            <tr key={a.agent}>
              <th scope="row">{a.agent}</th>
              <td>{n(a.sessions)}</td>
              <td>{n(a.entrada)}</td>
              <td>{n(a.eixida)}</td>
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

function PanellRebuts({ rebuts, locale, onVeure }) {
  if (rebuts.length === 0) {
    return (
      <EstatBuit icona={Receipt} titol="Cap rebut Matrix">
        El diari de sessió no té entrades <Mono>matrix.rebut</Mono>.
      </EstatBuit>
    );
  }
  return (
    <Taula titol="Rebuts de lectura Matrix" densa className="sdp-taula--llarga">
      <thead>
        <tr>
          <th scope="col">Data</th>
          <th scope="col">Petició</th>
          <th scope="col">Protocol</th>
          <th scope="col">Fonts</th>
          <th scope="col"><span className="sdp-nomes-lector">Accions</span></th>
        </tr>
      </thead>
      <tbody>
        {rebuts.map((r, i) => {
          const quan = dataLocal(r.t, locale);
          return (
            <tr key={`${r.t}-${r.peticio}-${i}`}>
              <td>{quan}</td>
              <td><Mono>{curt(r.peticio)}</Mono></td>
              <td>{r.protocols.map((p) => p.split('/').pop()).join(', ') || '—'}</td>
              <td>{r.fonts.length}</td>
              <td>
                <Boto varietat="fantasma" onClick={() => onVeure(r)} aria-label={`Veure les ${r.fonts.length} fonts del rebut de ${quan}`}>
                  Veure fonts
                </Boto>
              </td>
            </tr>
          );
        })}
      </tbody>
    </Taula>
  );
}

function PanellSkills({ skills, segell, locale }) {
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
        <p className="sdp-consola__segell">
          Segell <Mono>{curt(segell.hash)}</Mono> · {segell.filesCount} fitxers · {dataLocal(segell.timestamp, locale)}
        </p>
      ) : null}
      <Taula titol="Inventari de skills" densa className="sdp-taula--llarga">
        <thead>
          <tr><th scope="col">Skill</th><th scope="col">Estat</th><th scope="col">Manifest</th><th scope="col">Disc</th><th scope="col">Descripció</th></tr>
        </thead>
        <tbody>
          {skills.map((s) => (
            <tr key={s.nom}>
              <th scope="row">{s.core ? <strong>{s.nom}</strong> : s.nom}</th>
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
  const { locale } = useUIState();
  const [estat, setEstat] = useState('loading');   // loading | ready | absent | error
  const [dades, setDades] = useState(null);
  const [error, setError] = useState(null);
  const [rebutObert, setRebutObert] = useState(null);
  const enCurs = useRef(null);                      // AbortController de la càrrega viva

  const titol = t('section.consola.title', 'Consola Termodinàmica');
  const lead = t('section.consola.lead', "Consums, crèdits, rebuts Matrix i inventari de skills de l'eixam.");
  useSEO({ title: titol, description: lead });

  /* Una sola càrrega viva: refrescar cancel·la l'anterior i desmuntar cancel·la l'última. */
  const carrega = useCallback(() => {
    enCurs.current?.abort();
    const ac = new AbortController();
    enCurs.current = ac;
    setEstat('loading');
    carregaConsola(ac.signal)
      .then((d) => { if (ac.signal.aborted) return; setDades(d); setError(null); setEstat(d ? 'ready' : 'absent'); })
      .catch((e) => { if (ac.signal.aborted) return; setError(e); setEstat('error'); });
  }, []);

  useEffect(() => {
    carrega();
    return () => enCurs.current?.abort();
  }, [carrega]);

  const pestanyes = dades ? [
    { id: 'consums', etiqueta: 'Consums', icona: Activity, contingut: <PanellConsums consums={dades.consums} locale={locale} /> },
    { id: 'credits', etiqueta: 'Crèdits', icona: Coins, contingut: <PanellCredits credits={dades.credits} /> },
    { id: 'rebuts', etiqueta: `Rebuts (${dades.rebuts.length})`, icona: Receipt, contingut: <PanellRebuts rebuts={dades.rebuts} locale={locale} onVeure={setRebutObert} /> },
    { id: 'skills', etiqueta: `Skills (${dades.skills.length})`, icona: Puzzle, contingut: <PanellSkills skills={dades.skills} segell={dades.segell} locale={locale} /> }
  ] : [];

  const missatgeError = error?.message || String(error);

  return (
    <UniversalPage
      title={titol}
      subtitle={t('section.consola.subtitle', 'Manteniment de la IAIA')}
      lead={lead}
      chrome="system"
    >
      <div className="sdp-consola">
        <div className="sdp-consola__capcal">
          {dades?.generat ? (
            <p className="sdp-consola__instantania">
              Instantània: {dataLocal(dades.generat, locale)} · {dades.immunitari.operacions} operacions immunitàries
            </p>
          ) : null}
          <Boto varietat="secundari" icona={RefreshCw} carregant={estat === 'loading'} onClick={carrega}>
            Refrescar
          </Boto>
        </div>

        {estat === 'loading' && !dades ? <Carregant etiqueta="Llegint l'estat de l'eixam…" /> : null}

        {estat === 'absent' ? (
          <EstatBuit titol="Consola no disponible en este entorn">
            El servidor no exposa <Mono>/__iaia/consola.json</Mono>. La consola només existix al servidor
            de desenvolupament (plugin <Mono>sdp:consola-iaia</Mono>).
          </EstatBuit>
        ) : null}

        {estat === 'error' && !dades ? (
          <EstatBuit titol="No s'ha pogut llegir la consola">
            <pre className="sdp-consola__mono">{missatgeError}</pre>
          </EstatBuit>
        ) : null}

        {estat === 'error' && dades ? (
          <Alerta to="error" titol="No s'ha pogut refrescar">
            Es mostra l'última instantània bona. <Mono>{missatgeError}</Mono>
          </Alerta>
        ) : null}

        {dades ? <Pestanyes etiqueta="Panells de la consola" pestanyes={pestanyes} /> : null}
      </div>

      <Dialeg
        obert={rebutObert !== null}
        onTanca={() => setRebutObert(null)}
        titol="Fonts llegides senceres"
        descripcio={rebutObert ? `Petició ${curt(rebutObert.peticio)} · ${dataLocal(rebutObert.t, locale)}` : undefined}
        mida="g"
        accions={<Boto varietat="primari" onClick={() => setRebutObert(null)}>Tancar</Boto>}
      >
        {rebutObert ? (
          <Taula titol="Fonts del rebut" densa>
            <thead><tr><th scope="col">Ruta</th><th scope="col">sha256</th></tr></thead>
            <tbody>
              {rebutObert.fonts.map((f) => (
                <tr key={f.ruta}><td>{f.ruta}</td><td><Mono>{curt(f.sha256)}</Mono></td></tr>
              ))}
            </tbody>
          </Taula>
        ) : null}
      </Dialeg>
    </UniversalPage>
  );
}
