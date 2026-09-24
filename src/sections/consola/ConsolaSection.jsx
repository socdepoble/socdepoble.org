import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Coins, Receipt, Puzzle, RefreshCw } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import {
  Alerta, Boto, Dialeg, Taula, UniversalCard, Insignia, EstatBuit, Carregant, Progres
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
        <Xifra etiqueta="Registres de consum" valor={n(consums.length)} />
      </div>
      <Taula titol="Consum de tòkens per agent" densa>
        <thead>
          <tr><th scope="col">Agent</th><th scope="col">Registres</th><th scope="col">Entrada</th><th scope="col">Eixida</th></tr>
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

export function ConsolaPanells() {
  const { locale } = useUIState();
  const [estat, setEstat] = useState('loading');
  const [dades, setDades] = useState(null);
  const [error, setError] = useState(null);
  const [rebutObert, setRebutObert] = useState(null);
  const enCurs = useRef(null);

  const carrega = useCallback(() => {
    enCurs.current?.abort();
    const ac = new AbortController();
    enCurs.current = ac;
    setEstat('loading');
    setError(null);
    carregaConsola(ac.signal)
      .then((d) => {
        if (ac.signal.aborted) return;
        setDades(d);
        setEstat(d ? 'ready' : 'absent');
      })
      .catch((e) => {
        if (ac.signal.aborted) return;
        setError(e);
        setEstat('error');
      });
  }, []);
  useEffect(() => {
    carrega();
    return () => enCurs.current?.abort();
  }, [carrega]);

  const inventari = dades ? resumSkills(dades.skills) : null;
  const termometria = dades?.termometria;
  const mesurat = Number.isSafeInteger(termometria?.artefactesActius)
    && termometria.artefactesActius >= 0;
  const recompte = mesurat ? termometria.artefactesActius : null;
  const llindar = 150;
  const estatSenseDades = estat === 'loading' ? 'Llegint…'
    : estat === 'absent' ? 'No disponible en este entorn'
      : 'No s’ha pogut llegir';
  const panells = [
    { id: 'consums', titol: 'Consums', Icona: Activity,
      resum: dades ? (dades.consums.length ? `${dades.consums.length} registres` : 'Sense mesura de tòkens') : estatSenseDades,
      contingut: dades && <PanellConsums consums={dades.consums} locale={locale} /> },
    { id: 'credits', titol: 'Crèdits', Icona: Coins,
      resum: dades ? (dades.credits?.length ? `${dades.credits.length} proveïdors` : 'Saldo desconegut') : estatSenseDades,
      contingut: dades && <PanellCredits credits={dades.credits?.length ? dades.credits : null} /> },
    { id: 'rebuts', titol: 'Rebuts', Icona: Receipt,
      resum: dades ? `${dades.rebuts.length} rebuts de lectura` : estatSenseDades,
      contingut: dades && <PanellRebuts rebuts={dades.rebuts} locale={locale} onVeure={setRebutObert} /> },
    { id: 'skills', titol: 'Skills', Icona: Puzzle,
      resum: inventari ? `${inventari.total} skills · ${inventari.orfes.length} orfes · ${inventari.fantasmes.length} fantasmes` : estatSenseDades,
      contingut: dades && <PanellSkills skills={dades.skills} segell={dades.segell} locale={locale} /> }
  ];

  return (
    <>
      <div className="sdp-consola">
        <div>
          <h2>El pols del cervell</h2>
          <p>La Consola Termodinàmica reunix els consums, els crèdits, els rebuts
            i l’inventari de skills. Ens ajuda a detectar saturació i a preparar
            l’Acta Marmota amb evidències del treball fet.</p>
          <p>El seguiment diari i per sessió ha de relacionar hora, acció,
            resultat i consum mesurat. Ara es mostren les fonts disponibles;
            l’absència de dades no significa consum zero ni bon rendiment.</p>
          <p className="sdp-consola__instantania" role="status">
            {dades?.generat ? `Instantània: ${dataLocal(dades.generat, locale)} · ${dades.immunitari.operacions} operacions immunitàries`
              : 'Instantània encara no disponible.'}
          </p>
        </div>
        <div className="sdp-consola__capcal">
          <Boto varietat="secundari" icona={RefreshCw}
            carregant={estat === 'loading'} onClick={carrega}>Refrescar</Boto>
        </div>
        {estat === 'loading' && !dades && <Carregant etiqueta="Llegint l’estat de l’eixam…" />}
        {estat === 'absent' && <Alerta to="info" titol="Consola no disponible">
          Esta font només es publica al servidor local de desenvolupament.
        </Alerta>}
        {estat === 'error' && <Alerta to="error" titol="No s’ha pogut refrescar">
          {dades ? 'Es conserva l’última instantània bona. ' : ''}
          {error?.message || 'Torna a provar-ho amb Refrescar.'}
        </Alerta>}
        <UniversalCard title="Càrrega documental" headingLevel="h2" hasFooter={false}
          body={mesurat ? <>
            <p>{recompte} artefactes actius · avís per damunt de {llindar}.</p>
            <Progres etiqueta="Artefactes actius respecte del llindar d’avís"
              valor={Math.min(recompte, llindar)} max={llindar} />
            {recompte > llindar && <Alerta to="avis" titol="Revisem la saturació">
              Hi ha {recompte - llindar} artefactes per damunt del llindar.
              Cal revisar rellevància i context; no s’arxiva res automàticament.
            </Alerta>}
            <p>{termometria.abast}</p>
          </> : <p>Recompte d’artefactes actius encara no disponible. Les skills
            i els rebuts no són una mesura de la grandària del context.</p>} />
        <div>
          {panells.map(({ id, titol, Icona, resum, contingut }) => (
            <UniversalCard key={id} title={titol} headingLevel="h2"
              icon={<Icona aria-hidden="true" />} hasFooter={false}
              body={<>
                <p>{resum}</p>
                {contingut && <details>
                  <summary>Veure detall de {titol.toLocaleLowerCase(locale)}</summary>
                  {contingut}
                </details>}
              </>} />
          ))}
        </div>
      </div>
      <Dialeg obert={rebutObert !== null} onTanca={() => setRebutObert(null)}
        titol="Fonts llegides senceres" mida="g"
        descripcio={rebutObert ? `Petició ${curt(rebutObert.peticio)} · ${dataLocal(rebutObert.t, locale)}` : undefined}
        accions={<Boto varietat="primari" onClick={() => setRebutObert(null)}>Tancar</Boto>}>
        {rebutObert && <Taula titol="Fonts del rebut" densa>
          <thead><tr><th scope="col">Ruta</th><th scope="col">sha256</th></tr></thead>
          <tbody>{rebutObert.fonts.map((f) => (
            <tr key={f.ruta}><td>{f.ruta}</td><td><Mono>{curt(f.sha256)}</Mono></td></tr>
          ))}</tbody>
        </Taula>}
      </Dialeg>
    </>
  );
}

export default function ConsolaSection() {
  const { t } = useUIActions();
  const titol = t('section.consola.title', 'Consola Termodinàmica');
  const lead = t('section.consola.lead', "Consums, crèdits, rebuts Matrix i inventari de skills de l'eixam.");
  useSEO({ title: titol, description: lead });

  return (
    <UniversalPage
      title={titol}
      subtitle={t('section.consola.subtitle', 'Manteniment de la IAIA')}
      lead={lead}
      chrome="system"
    >
      <ConsolaPanells />
    </UniversalPage>
  );
}
