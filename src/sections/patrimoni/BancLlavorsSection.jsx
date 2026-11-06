import { useMemo, useState } from 'react';
import { Alerta, Boto, Camp, CampText, Dialeg, Selector } from '../../components/PedraSeca/index.js';
import { useUIActions } from '../../app/contexts/UIContext';
import { FONTS_BANC_LLAVORS, entradesDelCataleg, filtraEntrades } from '../../data/patrimoni/bancLlavors.js';
import EmpremtaFont from './EmpremtaFont.jsx';
import { traductorPatrimoni } from './textosPatrimoni.js';

/* IDEA-112 (Onada R9, carril C5) · /page/banc-de-llavors: la consulta dels tres catàlegs, davall del text breu de
   PAGE_COPY (PageDetailSection la carrega en un chunk lazy). Només llig dades literals: cap formulari, cap
   persistència, cap custodi ni cap lot (G9-05). Els noms i les dades es mantenen en la llengua de cada font
   (valenciana, mallorquina o catalana): no es traduïxen. Les pàgines són les del PDF de cada catàleg. */
const MIDA = 24;

function FitxaDeLaFont({ font, tr }) {
  return (
    <>
    <p lang="ca">{font.nota}</p>
    {font.discrepancies.length > 0 && (
      <Alerta to="avis" viva={false} titol={tr('patrimoni.font.discrepancia', 'Discrepància')}>
        <span lang="ca">{font.discrepancies.join(' ')}</span>
      </Alerta>
    )}
    <dl>
      <dt>{tr('patrimoni.font.titol', 'La font')}</dt><dd lang="ca">{font.titol}</dd>
      <dt>{tr('patrimoni.llavors.autoria', 'Procedència')}</dt><dd lang="ca">{font.autoria}</dd>
      <dt>{tr('patrimoni.llavors.ambit', 'Àmbit')}</dt><dd lang="ca">{font.ambit}</dd>
      {font.web && (
        <>
          <dt>{tr('patrimoni.llavors.web', 'Web de l’entitat')}</dt>
          <dd><a href={font.web} target="_blank" rel="noopener noreferrer">{font.web.replace(/^https:\/\//, '')}</a> {tr('patrimoni.font.finestraNova', '(s’obri en una finestra nova)')}</dd>
        </>
      )}
    </dl>
    </>
  );
}

function DetallValencia({ v, tr }) {
  return (
    <>
      <dl>
        <dt>{tr('patrimoni.llavors.nomCientific', 'Nom científic')}</dt><dd><i>{v.nomCientific}</i></dd>
        {v.familia && <><dt>{tr('patrimoni.llavors.familia', 'Família')}</dt><dd lang="ca">{v.familia}</dd></>}
        {v.nomIndex && <><dt>{tr('patrimoni.llavors.nomIndex', 'A l’índex del catàleg es diu')}</dt><dd lang="ca">{v.nomIndex.text}</dd></>}
      </dl>
      <h4>{tr('patrimoni.llavors.tecnica', 'Informació tècnica')}</h4>
      <ul lang="ca">
        {v.camps.map((camp) => <li key={camp.linies[0]}>{camp.clau ? `${camp.clau}: ${camp.valor}` : camp.valor}</li>)}
      </ul>
      {v.avisos?.includes('unitat-pes-cm') && <p>{tr('patrimoni.llavors.unitatPes', 'La font dona este pes en centímetres: es copia tal com és.')}</p>}
      <p>{tr('patrimoni.llavors.calendari', 'El calendari de sembra i de collita és un gràfic a la font i no s’ha transcrit.')}</p>
    </>
  );
}

function DetallAvl({ v, tr }) {
  const temporada = v.temporada === 'hivern'
    ? tr('patrimoni.llavors.temporada.hivern', 'Varietats d’hivern')
    : tr('patrimoni.llavors.temporada.estiu', 'Varietats d’estiu');
  return (
    <>
      <dl>
        <dt>{tr('patrimoni.llavors.nomCientific', 'Nom científic')}</dt><dd><i>{v.nomCientific}</i></dd>
        <dt>{tr('patrimoni.llavors.origen', 'Origen')}</dt><dd lang="ca">{v.origen}</dd>
        <dt>{tr('patrimoni.llavors.temporada', 'Temporada')}</dt><dd>{temporada}</dd>
      </dl>
      <p>{tr('patrimoni.llavors.calendari', 'El calendari de sembra i de collita és un gràfic a la font i no s’ha transcrit.')}</p>
    </>
  );
}

/* R9V-C5-04 · Algunes línies del text extret de l'Atles ajunten dues varietats que el PDF presenta per separat
   (`particions` de les dades, contrastades amb les pàgines del PDF). Es mostren separades i amb l'avís: la dada
   literal no canvia. */
function DetallAtles({ e, tr }) {
  const particions = e.particions ?? [];
  const partida = new Map(particions.map((p) => [p.trossos.join(' '), p.trossos]));
  const grups = [
    ['llista', tr('patrimoni.llavors.llista', 'Varietats locals'), e.llista.flatMap((linia) => partida.get(linia) ?? [linia])],
    ['altres', tr('patrimoni.llavors.altres', 'Altres varietats locals'), e.altres],
    ['sinonimies', tr('patrimoni.llavors.sinonimies', 'Sinonímies entre noms populars'), e.sinonimies]
  ].filter(([, , linies]) => linies.length > 0);
  return (
    <>
      <dl>
        <dt>{tr('patrimoni.llavors.nomCientific', 'Nom científic')}</dt><dd><i>{e.nomCientific}</i></dd>
      </dl>
      {grups.map(([clau, titol, linies]) => (
        <section key={clau} aria-label={titol}>
          <h4>{titol}</h4>
          <ul lang="ca">{linies.map((linia, i) => <li key={`${i}-${linia}`}>{linia}</li>)}</ul>
          {clau === 'llista' && particions.map((p) => (
            <p key={p.linia}>{tr('patrimoni.llavors.ocrPartida', 'A la línia {linia} del text extret del PDF hi ha {n} varietats juntes; el PDF (pàgina {pagina}) les presenta per separat, cadascuna amb el seu mapa, i ací es mostren separades.', { linia: p.linia, n: p.trossos.length, pagina: e.pagina })}</p>
          ))}
        </section>
      ))}
    </>
  );
}

function Fitxa({ entrada, font, onTanca, tr }) {
  const { dada } = entrada;
  return (
    <Dialeg obert onTanca={onTanca} titol={entrada.nom} mida="g">
      {font.id === 'cataleg-valencia' && <DetallValencia v={dada} tr={tr} />}
      {font.id === 'avl-mallorca' && <DetallAvl v={dada} tr={tr} />}
      {font.id === 'atles-catalunya' && <DetallAtles e={dada} tr={tr} />}
      <p>{tr('patrimoni.font.literal', 'Transcripció literal: es conserven les paraules i les xifres de la font, també les errates.')}</p>
      <h4>{tr('patrimoni.font.titol', 'La font')}</h4>
      <p><span lang="ca">{font.autoria} · {font.titol}</span> · {tr('patrimoni.font.pagina', 'Pàgina {n} del PDF', { n: entrada.pagina })}</p>
      <EmpremtaFont font={font} tr={tr} />
    </Dialeg>
  );
}

/** Cos viu de TextSection a /page/banc-de-llavors. */
export default function BancLlavorsSection() {
  const { t } = useUIActions();
  const tr = useMemo(() => traductorPatrimoni(t), [t]);
  const [idFont, setIdFont] = useState(FONTS_BANC_LLAVORS[0].id);
  const [cerca, setCerca] = useState('');
  const [limit, setLimit] = useState(MIDA);
  const [seleccio, setSeleccio] = useState(null);
  const font = FONTS_BANC_LLAVORS.find((f) => f.id === idFont) ?? FONTS_BANC_LLAVORS[0];
  const totes = useMemo(() => entradesDelCataleg(font.id), [font.id]);
  const entrades = useMemo(() => filtraEntrades(totes, cerca), [totes, cerca]);
  const titol = tr('patrimoni.llavors.titol', 'Consulta els tres catàlegs');
  return (
    <section aria-label={titol}>
      <h3>{titol}</h3>
      <Alerta to="info" viva={false}>{tr('patrimoni.llavors.avis', 'No és cap banc d’intercanvi: ací no es reserven ni s’intercanvien llavors, i no hi ha custodis ni lots.')}</Alerta>
      <p>{tr('patrimoni.font.llengua', 'El contingut documental es manté en la llengua de la font: no es traduïx.')}</p>
      <Camp etiqueta={tr('patrimoni.llavors.cataleg', 'Catàleg')}>
        <Selector
          value={font.id}
          onChange={(e) => { setIdFont(e.target.value); setLimit(MIDA); setSeleccio(null); }}
          opcions={FONTS_BANC_LLAVORS.map((f) => ({ valor: f.id, etiqueta: `${f.autoria} · ${f.ambit}` }))}
        />
      </Camp>
      <FitxaDeLaFont font={font} tr={tr} />
      <Camp etiqueta={tr('patrimoni.llavors.cerca', 'Cerca pel nom o pel nom científic')}>
        <CampText tipus="search" value={cerca} onChange={(e) => { setCerca(e.target.value); setLimit(MIDA); }} />
      </Camp>
      <p role="status">{tr('patrimoni.font.resultats', '{n} de {total}', { n: entrades.length, total: totes.length })}</p>
      {entrades.length ? (
        <ol lang="ca">
          {entrades.slice(0, limit).map((entrada) => (
            <li key={entrada.id}>
              <Boto varietat="fantasma" onClick={() => setSeleccio(entrada)}>{entrada.nom} · <i>{entrada.nomCientific}</i></Boto>
            </li>
          ))}
        </ol>
      ) : <p>{tr('patrimoni.font.buit', 'No hi ha cap resultat amb esta cerca.')}</p>}
      {limit < entrades.length && <Boto onClick={() => setLimit((n) => n + MIDA)}>{tr('patrimoni.font.mes', 'Mostra’n més')}</Boto>}
      {seleccio && <Fitxa key={seleccio.id} entrada={seleccio} font={font} onTanca={() => setSeleccio(null)} tr={tr} />}
    </section>
  );
}
