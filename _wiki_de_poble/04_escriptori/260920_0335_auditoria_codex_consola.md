Subagente de Codex: Auditoria estàtica completada, sense modificar fitxers, executar proves ni obrir navegador. Les dues skills demanades i la implementació canònica de Disseny han estat llegides.

Troballes que convé incorporar:

- **P2, índex amb destinació invisible.** El diàleg està sempre muntat dins `UniversalPage` ([ConsolaSection.jsx:209](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:209)); el seu títol és un `h2` ([Dialeg.jsx:63](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/components/PedraSeca/organismes/Dialeg.jsx:63)), i l’índex recull encapçalaments sense excloure diàlegs tancats ([PageFrame.jsx:20](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/components/universal/PageFrame.jsx:20)). Resultat deduïble del DOM: apareix «Fonts llegides senceres» encara que el diàleg estiga tancat. Proposta local: diàleg germà de `UniversalPage`, sempre muntat.
- **P2 condicionat a dades incorrectes, error fora del circuit de càrrega.** `normalitza` comprova algunes llistes però no les seues files ni `credits` ([consolaContent.js:14](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/consola/consolaContent.js:14)). `credits: {}` falla en `.map`; un rebut sense `protocols` falla en render; `skills: [null]` falla en `resumSkills` ([ConsolaSection.jsx:72](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:72), [ConsolaSection.jsx:94](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:94), [consolaContent.js:27](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/consola/consolaContent.js:27)). A més, `Pestanyes` munta els panells ocults ([Pestanyes.jsx:51](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/components/PedraSeca/organismes/Pestanyes.jsx:51)). Cal validar abans de `ready`, amb error explícit.
- **P2 condicionat a dades incorrectes, totals numèrics invàlids.** `Number(x) || 0` accepta `Infinity` i negatius, i convertix valors il·legibles en zero ([consolaContent.js:35](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/consola/consolaContent.js:35)). Recomane rebutjar el registre invàlid en la frontera de dades.
- **P3, refresc incompletament cancel·lable.** Només la petició de l’efecte rep `AbortSignal`; el botó crida `carrega()` sense senyal ([ConsolaSection.jsx:154](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:154), [ConsolaSection.jsx:186](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:186)). El bloc següent unifica les peticions amb `useRef`. No afirme una carrera reproduïda: el botó queda desactivat durant la càrrega.
- **P3, estat conservat poc explícit i no anunciat.** En fallar un refresc, les dades velles continuen visibles, però el missatge no explica que són l’última instantània; `EstatBuit` tampoc incorpora `role="alert"` ni `role="status"` ([ConsolaSection.jsx:200](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:200), [estats.jsx:10](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/components/PedraSeca/atoms/estats.jsx:10)).
- **Recomanacions:** afegir `h3` als panells, capció pròpia a cada taula i `scope`; permetre llegir/copiar les empremtes completes; anomenar «Registres» el recompte d’esdeveniments mentre no existisca deduplicació per identificador de sessió ([ConsolaSection.jsx:40](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/consola/ConsolaSection.jsx:40), [consolaContent.js:46](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/sections/consola/consolaContent.js:46)). Per a una consola administrativa, `useSEO({ index: false })` encaixa amb el suport existent del hook ([useSEO.js:53](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/hooks/useSEO.js:53)).

El `div.content-wrapper` interior és redundant, però **no he trobat doble padding**: la regla existent només afecta `article.content-wrapper` ([base.css:237](/Users/javillinares/Documents/Antigravity/Som%20de%20Poble/socdepoble.org/src/css/base.css:237)).

Substitució proposada completa de `src/sections/consola/ConsolaSection.jsx`. És una proposta per a l’informe; no s’ha aplicada. El renderitzat exclusiu del contingut del panell actiu evita que els nous `h3` dels panells ocults entren en l’índex compartit.

```jsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Coins, Receipt, Puzzle, RefreshCw } from 'lucide-react';
import { UniversalPage } from '../../components/universal/UniversalPage';
import {
  Boto, Dialeg, Taula, Pestanyes, Insignia, EstatBuit, Carregant, Progres
} from '../../components/PedraSeca';
import { useSEO } from '../../hooks/useSEO';
import { useUIActions } from '../../app/contexts/UIContext';
import {
  carregaConsola, resumSkills, resumConsums, dataLocal
} from './consolaContent.js';

function Empremta({ valor }) {
  return <code className="sdp-consola__mono">{valor || '—'}</code>;
}

function Xifra({ etiqueta, valor }) {
  return (
    <div className="sdp-consola__xifra">
      <dt className="sdp-consola__xifra-etiqueta">{etiqueta}</dt>
      <dd className="sdp-consola__xifra-valor">{valor}</dd>
    </div>
  );
}

function PanellConsums({ consums }) {
  if (consums.length === 0) {
    return (
      <EstatBuit icona={Activity} titol="Cap consum registrat">
        El diari de sessió encara no conté registres de consum de tòkens.
      </EstatBuit>
    );
  }

  const { total, perAgent } = resumConsums(consums);

  return (
    <>
      <dl className="sdp-consola__resum">
        <Xifra etiqueta="Tòkens d'entrada" valor={total.entrada.toLocaleString('ca-ES')} />
        <Xifra etiqueta="Tòkens d'eixida" valor={total.eixida.toLocaleString('ca-ES')} />
        <Xifra etiqueta="Registres" valor={consums.length.toLocaleString('ca-ES')} />
      </dl>
      <Taula titol="Consum de tòkens per agent" densa className="sdp-consola__taula">
        <caption className="sr-only">Consum de tòkens per agent</caption>
        <thead>
          <tr>
            <th scope="col">Agent</th>
            <th scope="col" className="sdp-consola__numero">Registres</th>
            <th scope="col" className="sdp-consola__numero">Entrada</th>
            <th scope="col" className="sdp-consola__numero">Eixida</th>
          </tr>
        </thead>
        <tbody>
          {perAgent.map((a) => (
            <tr key={a.agent}>
              <th scope="row">{a.agent}</th>
              <td className="sdp-consola__numero">{a.sessions.toLocaleString('ca-ES')}</td>
              <td className="sdp-consola__numero">{a.entrada.toLocaleString('ca-ES')}</td>
              <td className="sdp-consola__numero">{a.eixida.toLocaleString('ca-ES')}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

function PanellCredits({ credits }) {
  if (credits === null) {
    return (
      <EstatBuit icona={Coins} titol="Sense font de crèdits">
        No hi ha una font connectada que informe del saldo de crèdits de l’eixam.
      </EstatBuit>
    );
  }

  if (credits.length === 0) {
    return (
      <EstatBuit icona={Coins} titol="Cap proveïdor registrat">
        La font de crèdits no conté cap proveïdor.
      </EstatBuit>
    );
  }

  return (
    <div className="sdp-consola__llista">
      {credits.map((c, index) => (
        <Progres
          key={`${c.proveidor}-${index}`}
          etiqueta={`${c.proveidor} · ${c.consumit} / ${c.limit}`}
          valor={c.consumit}
          max={c.limit}
        />
      ))}
    </div>
  );
}

function PanellRebuts({ rebuts, onVeure }) {
  if (rebuts.length === 0) {
    return (
      <EstatBuit icona={Receipt} titol="Cap rebut Matrix">
        El diari de sessió encara no conté rebuts Matrix.
      </EstatBuit>
    );
  }

  return (
    <Taula titol="Rebuts de lectura Matrix" densa className="sdp-consola__taula">
      <caption className="sr-only">Rebuts de lectura Matrix</caption>
      <thead>
        <tr>
          <th scope="col">Data</th>
          <th scope="col">Petició</th>
          <th scope="col">Protocol</th>
          <th scope="col" className="sdp-consola__numero">Fonts</th>
          <th scope="col">Accions</th>
        </tr>
      </thead>
      <tbody>
        {rebuts.map((r, index) => (
          <tr key={`${r.t}-${r.peticio}-${index}`}>
            <td>{dataLocal(r.t)}</td>
            <th scope="row"><Empremta valor={r.peticio} /></th>
            <td>{r.protocols.map((p) => p.split('/').pop()).join(', ') || '—'}</td>
            <td className="sdp-consola__numero">{r.fonts.length}</td>
            <td>
              <Boto
                varietat="fantasma"
                aria-label={`Veure fonts del rebut ${index + 1}, ${dataLocal(r.t)}`}
                onClick={() => onVeure(r)}
              >
                Veure fonts
              </Boto>
            </td>
          </tr>
        ))}
      </tbody>
    </Taula>
  );
}

function PanellSkills({ skills, segell }) {
  if (skills.length === 0) {
    return (
      <EstatBuit icona={Puzzle} titol="Cap skill inventariada">
        La instantània no conté skills.
      </EstatBuit>
    );
  }

  const { total, orfes, fantasmes, nucli } = resumSkills(skills);

  return (
    <>
      <dl className="sdp-consola__resum">
        <Xifra etiqueta="Skills" valor={total} />
        <Xifra etiqueta="Nucli (core)" valor={nucli.length} />
        <Xifra etiqueta="Orfes (disc sense manifest)" valor={orfes.length} />
        <Xifra etiqueta="Fantasmes (manifest sense disc)" valor={fantasmes.length} />
      </dl>

      {segell ? (
        <p className="sdp-consola__segell">
          Segell <Empremta valor={segell.hash} /> · {segell.filesCount} fitxers ·{' '}
          {dataLocal(segell.timestamp)}
        </p>
      ) : (
        <p className="sdp-consola__segell">No hi ha cap segell de skills disponible.</p>
      )}

      <Taula titol="Inventari de skills" densa className="sdp-consola__taula">
        <caption className="sr-only">Inventari de skills</caption>
        <thead>
          <tr>
            <th scope="col">Skill</th>
            <th scope="col">Estat</th>
            <th scope="col">Manifest</th>
            <th scope="col">Disc</th>
            <th scope="col">Descripció</th>
          </tr>
        </thead>
        <tbody>
          {skills.map((s) => (
            <tr key={s.nom}>
              <th scope="row">
                {s.nom}
                {s.core ? <span className="sr-only">, del nucli</span> : null}
              </th>
              <td>
                {s.estat ? (
                  <Insignia to={s.estat === 'canonic' ? 'exit' : 'info'}>
                    {s.estat}
                  </Insignia>
                ) : (
                  <Insignia to="neutre">sense estat</Insignia>
                )}
              </td>
              <td>
                {s.alManifest
                  ? <Insignia to="exit">sí</Insignia>
                  : <Insignia to="error">no</Insignia>}
              </td>
              <td>
                {s.alDisc
                  ? <Insignia to="exit">sí</Insignia>
                  : <Insignia to="error">absent</Insignia>}
              </td>
              <td>{s.descripcio || '—'}</td>
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

export default function ConsolaSection() {
  const { t } = useUIActions();
  const [estat, setEstat] = useState('loading');
  const [dades, setDades] = useState(null);
  const [error, setError] = useState('');
  const [rebutObert, setRebutObert] = useState(null);
  const [pestanyaActiva, setPestanyaActiva] = useState('consums');
  const peticioRef = useRef(null);

  useSEO({
    title: t('section.consola.title', 'Consola Termodinàmica'),
    description: t(
      'section.consola.lead',
      "Consums, crèdits, rebuts Matrix i inventari de skills de l'eixam."
    ),
    index: false
  });

  const carrega = useCallback(async () => {
    peticioRef.current?.abort();

    const controlador = new AbortController();
    peticioRef.current = controlador;
    setEstat('loading');
    setError('');

    try {
      const novaInstantania = await carregaConsola(controlador.signal);

      if (
        controlador.signal.aborted ||
        peticioRef.current !== controlador
      ) return;

      setDades(novaInstantania);
      setEstat(novaInstantania ? 'ready' : 'absent');
      if (!novaInstantania) setRebutObert(null);
    } catch (causa) {
      if (
        controlador.signal.aborted ||
        peticioRef.current !== controlador
      ) return;

      setError(causa instanceof Error ? causa.message : String(causa));
      setEstat('error');
    } finally {
      if (peticioRef.current === controlador) {
        peticioRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    void carrega();

    return () => {
      peticioRef.current?.abort();
      peticioRef.current = null;
    };
  }, [carrega]);

  const definicions = dades ? [
    {
      id: 'consums',
      etiqueta: 'Consums',
      titol: 'Consum de tòkens',
      icona: Activity,
      render: () => <PanellConsums consums={dades.consums} />
    },
    {
      id: 'credits',
      etiqueta: 'Crèdits',
      titol: 'Crèdits',
      icona: Coins,
      render: () => <PanellCredits credits={dades.credits} />
    },
    {
      id: 'rebuts',
      etiqueta: `Rebuts (${dades.rebuts.length})`,
      titol: 'Rebuts Matrix',
      icona: Receipt,
      render: () => <PanellRebuts rebuts={dades.rebuts} onVeure={setRebutObert} />
    },
    {
      id: 'skills',
      etiqueta: `Skills (${dades.skills.length})`,
      titol: 'Inventari de skills',
      icona: Puzzle,
      render: () => <PanellSkills skills={dades.skills} segell={dades.segell} />
    }
  ] : [];

  const pestanyes = definicions.map(({ id, etiqueta, titol, icona, render }) => ({
    id,
    etiqueta,
    icona,
    contingut: id === pestanyaActiva ? (
      <>
        <h3 className="sdp-consola__titol-panell">{titol}</h3>
        {render()}
      </>
    ) : null
  }));

  const anunci = estat === 'ready'
    ? 'Instantània de la consola actualitzada.'
    : estat === 'absent'
      ? 'La consola no està disponible en este entorn.'
      : estat === 'loading' && dades
        ? 'Actualitzant la instantània de la consola…'
        : '';

  return (
    <>
      <UniversalPage
        title={t('section.consola.title', 'Consola Termodinàmica')}
        subtitle={t('section.consola.subtitle', 'Manteniment de la IAIA')}
        lead={t(
          'section.consola.lead',
          "Consums, crèdits, rebuts Matrix i inventari de skills de l'eixam."
        )}
        chrome="system"
      >
        <div className="sdp-consola__contingut">
          <p className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {anunci}
          </p>

          <div className="sdp-consola__capcal">
            <p>
              {dades ? (
                <>
                  Instantània: {dataLocal(dades.generat)} ·{' '}
                  {dades.immunitari.operacions.toLocaleString('ca-ES')}{' '}
                  operacions immunitàries
                </>
              ) : (
                'Estat de la consola'
              )}
            </p>
            <Boto
              varietat="secundari"
              icona={RefreshCw}
              className="sdp-consola__refresca"
              carregant={estat === 'loading'}
              onClick={() => { void carrega(); }}
            >
              Refrescar
            </Boto>
          </div>

          {estat === 'loading' && !dades ? (
            <Carregant etiqueta="Llegint l'estat de l'eixam…" />
          ) : null}

          {estat === 'absent' ? (
            <EstatBuit titol="Consola no disponible en este entorn">
              Esta consola necessita el servidor de desenvolupament del projecte.
            </EstatBuit>
          ) : null}

          {estat === 'error' ? (
            <div role="alert" className="sdp-consola__error">
              <EstatBuit titol="No s'ha pogut llegir la consola">
                <p>
                  {dades
                    ? 'Es conserva l’última instantània carregada. Les dades no s’han actualitzat.'
                    : 'No s’ha carregat cap instantània. Pots tornar-ho a provar amb Refrescar.'}
                </p>
                <p className="sdp-consola__mono">{error}</p>
              </EstatBuit>
            </div>
          ) : null}

          {dades ? (
            <div aria-busy={estat === 'loading'}>
              <Pestanyes
                etiqueta="Panells de la consola"
                pestanyes={pestanyes}
                activa={pestanyaActiva}
                onCanvi={setPestanyaActiva}
                className="sdp-consola__panells"
              />
            </div>
          ) : null}
        </div>
      </UniversalPage>

      <Dialeg
        obert={rebutObert !== null}
        onTanca={() => setRebutObert(null)}
        titol="Fonts registrades en el rebut"
        descripcio={rebutObert ? `Rebut del ${dataLocal(rebutObert.t)}` : undefined}
        mida="g"
        accions={(
          <Boto varietat="primari" onClick={() => setRebutObert(null)}>
            Tancar
          </Boto>
        )}
      >
        {rebutObert ? (
          <>
            <p className="sdp-consola__peticio">
              Petició: <Empremta valor={rebutObert.peticio} />
            </p>

            {rebutObert.fonts.length === 0 ? (
              <EstatBuit titol="El rebut no conté fonts">
                No hi ha rutes ni empremtes registrades en este rebut.
              </EstatBuit>
            ) : (
              <Taula titol="Fonts del rebut" densa className="sdp-consola__taula">
                <caption className="sr-only">Fonts del rebut</caption>
                <thead>
                  <tr>
                    <th scope="col">Ruta</th>
                    <th scope="col">SHA-256</th>
                  </tr>
                </thead>
                <tbody>
                  {rebutObert.fonts.map((font, index) => (
                    <tr key={`${font.ruta}-${font.sha256}-${index}`}>
                      <th scope="row" className="sdp-consola__ruta">{font.ruta}</th>
                      <td><Empremta valor={font.sha256} /></td>
                    </tr>
                  ))}
                </tbody>
              </Taula>
            )}
          </>
        ) : null}
      </Dialeg>
    </>
  );
}
```

Substitució proposada del bloc `/* CONSOLA TERMODINÀMICA */` a `src/css/components.css:349`. Manté els tokens i les classes locals. La proposta elimina la doble zona vertical de scroll dels rebuts en deixar de passar `sdp-taula--llarga`; es conserva el desplaçament horitzontal accessible de `Taula`.

```css
  /* ── CONSOLA TERMODINÀMICA ────────────────────────────────────────── */
  .sdp-consola__contingut,
  .sdp-consola__panells {
    min-inline-size: 0;
    color: var(--sdp-text-cos);
    line-height: 1.6;
  }

  .sdp-consola__capcal {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--sdp-space-4);
    margin-block-end: var(--sdp-space-6);
    padding-block-end: var(--sdp-space-4);
    border-block-end: 2px solid var(--sdp-vora);
    color: var(--sdp-text-suau);
    font-weight: 700;
  }

  .sdp-consola__capcal > p {
    flex: 1 1 20rem;
    min-inline-size: 0;
    max-inline-size: 68ch;
    margin: 0;
    overflow-wrap: anywhere;
  }

  .sdp-consola__refresca {
    flex: 0 0 auto;
    min-block-size: var(--sdp-touch);
    min-inline-size: var(--sdp-touch);
  }

  .sdp-consola__titol-panell {
    max-inline-size: 68ch;
    margin-block: 0 var(--sdp-space-4);
    margin-inline: 0;
    color: var(--sdp-text-titol);
    text-align: start;
    line-height: 1.2;
  }

  .sdp-consola__resum {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr));
    gap: var(--sdp-space-4);
    margin: 0 0 var(--sdp-space-8);
  }

  .sdp-consola__xifra {
    display: flex;
    flex-direction: column;
    gap: var(--sdp-space-1);
    min-inline-size: 0;
    padding: var(--sdp-space-4);
    border: 1px solid var(--sdp-vora);
    border-radius: var(--sdp-radi-m);
    background: var(--sdp-fons-targeta);
    text-align: center;
  }

  .sdp-consola__xifra-valor {
    order: -1;
    margin: 0;
    color: var(--sdp-text-titol);
    font-size: 2rem;
    font-weight: 800;
    line-height: 1.2;
    font-variant-numeric: tabular-nums;
    overflow-wrap: anywhere;
  }

  .sdp-consola__xifra-etiqueta {
    margin: 0;
    color: var(--sdp-text-suau);
    font-size: var(--sdp-text-meta);
    font-weight: 700;
    line-height: 1.6;
    overflow-wrap: anywhere;
  }

  .sdp-consola__mono {
    font-family: var(--sdp-font-mono);
    font-size: 0.9em;
    white-space: normal;
    overflow-wrap: anywhere;
    word-break: normal;
  }

  .sdp-consola__llista {
    display: flex;
    flex-direction: column;
    gap: var(--sdp-space-4);
  }

  .sdp-consola__taula {
    max-inline-size: 100%;
    min-inline-size: 0;
  }

  .sdp-consola__taula :where(th, td) {
    vertical-align: top;
    overflow-wrap: anywhere;
  }

  .sdp-consola__numero {
    text-align: end;
    white-space: nowrap;
    font-variant-numeric: tabular-nums;
  }

  .sdp-consola__ruta {
    overflow-wrap: anywhere;
    word-break: normal;
  }

  .sdp-consola__segell,
  .sdp-consola__peticio {
    max-inline-size: 68ch;
    margin-block: 0 var(--sdp-space-4);
    color: var(--sdp-text-cos);
    line-height: 1.6;
    overflow-wrap: anywhere;
  }

  .sdp-consola__error {
    margin-block-end: var(--sdp-space-6);
  }

  .sdp-consola__panells
  .sdp-pestanyes__pestanya[aria-selected="true"] {
    color: var(--sdp-accio-text);
    border-block-end-color: var(--sdp-accio);
  }
```

Proposta de validació substitutiva de `normalitza` a `consolaContent.js:14`. Conserva el payload vigent, incloent `credits: null`; els valors incorrectes generen un error de contracte abans del render. No transforma absències en comptadors zero. Accepta imports numèrics finits per als crèdits i enters segurs per als tòkens.

```js
export function normalitza(brut) {
  const falla = (camp, tipus) => {
    throw new Error(`Resposta de consola invàlida: ${camp} ha de ser ${tipus}.`);
  };

  const objecte = (valor, camp) => {
    if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
      falla(camp, 'un objecte');
    }
    return valor;
  };

  const llista = (valor, camp) => {
    if (!Array.isArray(valor)) falla(camp, 'una llista');
    return valor;
  };

  const text = (valor, camp, { nul = false, buit = false } = {}) => {
    if (valor === null && nul) return valor;
    if (
      typeof valor !== 'string' ||
      (!buit && valor.trim().length === 0)
    ) {
      falla(camp, nul ? 'text o null' : 'text');
    }
    return valor;
  };

  const boolea = (valor, camp) => {
    if (typeof valor !== 'boolean') falla(camp, 'un booleà');
    return valor;
  };

  const numero = (valor, camp, { enter = false, positiu = false } = {}) => {
    const esRepresentacioNumerica =
      typeof valor === 'number' ||
      (typeof valor === 'string' && valor.trim() !== '');

    if (!esRepresentacioNumerica) falla(camp, 'un nombre');

    const n = Number(valor);
    if (
      !Number.isFinite(n) ||
      n < 0 ||
      (positiu && n === 0) ||
      (enter && !Number.isSafeInteger(n))
    ) {
      falla(
        camp,
        enter
          ? 'un enter segur no negatiu'
          : positiu
            ? 'un nombre finit positiu'
            : 'un nombre finit no negatiu'
      );
    }
    return n;
  };

  const arrel = objecte(brut, 'resposta');
  const generat = text(arrel.generat, 'generat', { nul: true });

  const rebuts = llista(arrel.rebuts, 'rebuts').map((valor, index) => {
    const camp = `rebuts[${index}]`;
    const rebut = objecte(valor, camp);
    return {
      ...rebut,
      t: text(rebut.t, `${camp}.t`, { nul: true }),
      peticio: text(rebut.peticio, `${camp}.peticio`, { nul: true }),
      protocols: llista(rebut.protocols, `${camp}.protocols`).map((protocol, i) =>
        text(protocol, `${camp}.protocols[${i}]`)
      ),
      fonts: llista(rebut.fonts, `${camp}.fonts`).map((valorFont, i) => {
        const rutaCamp = `${camp}.fonts[${i}]`;
        const font = objecte(valorFont, rutaCamp);
        return {
          ...font,
          ruta: text(font.ruta, `${rutaCamp}.ruta`),
          sha256: text(font.sha256, `${rutaCamp}.sha256`)
        };
      })
    };
  });

  const consums = llista(arrel.consums, 'consums').map((valor, index) => {
    const camp = `consums[${index}]`;
    const consum = objecte(valor, camp);
    return {
      ...consum,
      agent: text(consum.agent, `${camp}.agent`),
      entrada: numero(consum.entrada, `${camp}.entrada`, { enter: true }),
      eixida: numero(consum.eixida, `${camp}.eixida`, { enter: true })
    };
  });

  const credits = arrel.credits === null
    ? null
    : llista(arrel.credits, 'credits').map((valor, index) => {
      const camp = `credits[${index}]`;
      const credit = objecte(valor, camp);
      return {
        ...credit,
        proveidor: text(credit.proveidor, `${camp}.proveidor`),
        consumit: numero(credit.consumit, `${camp}.consumit`),
        limit: numero(credit.limit, `${camp}.limit`, { positiu: true })
      };
    });

  const noms = new Set();
  const skills = llista(arrel.skills, 'skills').map((valor, index) => {
    const camp = `skills[${index}]`;
    const skill = objecte(valor, camp);
    const nom = text(skill.nom, `${camp}.nom`);
    if (noms.has(nom)) {
      throw new Error(`Resposta de consola invàlida: skill duplicada "${nom}".`);
    }
    noms.add(nom);

    return {
      ...skill,
      nom,
      estat: text(skill.estat, `${camp}.estat`, { nul: true, buit: true }),
      core: boolea(skill.core, `${camp}.core`),
      alManifest: boolea(skill.alManifest, `${camp}.alManifest`),
      alDisc: boolea(skill.alDisc, `${camp}.alDisc`),
      descripcio: text(skill.descripcio, `${camp}.descripcio`, { buit: true })
    };
  });

  let segell = null;
  if (arrel.segell !== null) {
    const valor = objecte(arrel.segell, 'segell');
    segell = {
      ...valor,
      hash: text(valor.hash, 'segell.hash'),
      timestamp: text(valor.timestamp, 'segell.timestamp'),
      filesCount: numero(valor.filesCount, 'segell.filesCount', { enter: true })
    };
  }

  const valorImmunitari = objecte(arrel.immunitari, 'immunitari');
  const immunitari = {
    ...valorImmunitari,
    operacions: numero(
      valorImmunitari.operacions,
      'immunitari.operacions',
      { enter: true }
    )
  };

  return { generat, rebuts, consums, credits, skills, segell, immunitari };
}
```

Límits del codi proposat: no està executat ni renderitzat. No corregeix problemes compartits del calaix d’índex —gestió de focus i modalitat en `PageFrame.jsx:83`— perquè la correcció local demanada evita ampliar aquest component. Tampoc prova que els rebuts acrediten lectura real: per això el títol proposat diu «Fonts registrades en el rebut».
