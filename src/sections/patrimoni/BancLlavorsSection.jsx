import { useEffect, useMemo, useRef, useState } from 'react';
import { Alerta, Boto, Camp, CampText, Selector } from '../../components/PedraSeca/index.js';
import { useUIActions } from '../../app/contexts/UIContext';
import { FONTS_BANC_LLAVORS, entradesDelCataleg, filtraEntrades } from '../../data/patrimoni/bancLlavors.js';
import EmpremtaFont from './EmpremtaFont.jsx';
import { FASES_CALENDARI, ambComa, barra12MesosDe, fasesAmbMesos, nutricioDe } from './fitxaDidactica.js';
import { traductorPatrimoni } from './textosPatrimoni.js';

/* IDEA-112 (Onada R9, carril C5) · /page/banc-de-llavors: la consulta dels tres catàlegs, davall del text breu de
   PAGE_COPY (PageDetailSection la carrega en un chunk lazy). Només llig dades literals: cap formulari, cap
   persistència, cap custodi ni cap lot (G9-05). Els noms i les dades es mantenen en la llengua de cada font
   (valenciana, mallorquina o catalana): no es traduïxen. Les pàgines són les del PDF de cada catàleg.
   P0-59 / IDEA-190 (Onada R13) · La fitxa ja no és cap finestra emergent: es desplega a la pàgina, damunt de
   la llista, amb el focus al seu títol (i, en tancar-la, torna al botó de la llista). Porta la barra dels 12
   mesos quan la varietat té calendari, les varietats germanes del Catàleg valencià i, si l'espècie en té, els
   valors de referència d'un registre de l'USDA FoodData Central (fitxaDidactica.js), que no són de la font i
   ho diu. Sense calendari (AVL, Atles) no hi ha barra; sense perfil, no hi ha bloc de nutrició. */
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

const SIMBOL_FASE = Object.fromEntries(FASES_CALENDARI.map((fase) => [fase.id, fase.simbol]));
/* Les etiquetes de la llegenda del PDF (Sembra o Sembra directa, Trasplantament, Recol·lecció, Maduració llavors).
   Claus literals (la prova de les claus les ha de vore als 5 diccionaris). */
const etiquetesFase = (tr, calendari) => ({
  sembra: calendari?.sembraDirecta === true
    ? tr('patrimoni.llavors.fase.sembraDirecta', 'Sembra directa')
    : tr('patrimoni.llavors.fase.sembra', 'Sembra'),
  plantacio: tr('patrimoni.llavors.fase.trasplantament', 'Trasplantament'),
  collita: tr('patrimoni.llavors.fase.recollectio', 'Recol·lecció'),
  maduracioLlavors: tr('patrimoni.llavors.fase.maduracioLlavors', 'Maduració llavors')
});

/* P0-59 · La barra dels 12 mesos (G..D), d'un colp d'ull i sense scroll intern. Sense calendari, res.
   La llegenda només porta les fases que la varietat té (com la del PDF). */
function Barra12Mesos({ calendari, tr }) {
  const barra = barra12MesosDe(calendari);
  if (!barra.some((m) => m.actiu)) return null;
  const titol = tr('patrimoni.llavors.calendari12', 'Calendari dels 12 mesos');
  const fase = etiquetesFase(tr, calendari);
  return (
    <section className="sdp-fitxa-didactica__bloc" aria-label={titol}>
      <h4>{titol}</h4>
      <p className="sdp-barra-12-mesos__llegenda">
        {fasesAmbMesos(calendari).map((f) => (
          <span key={f.id} className="sdp-barra-12-mesos__llegenda-item">
            <span aria-hidden="true">{f.simbol}</span> {fase[f.id]}
          </span>
        ))}
      </p>
      <div role="list" className="sdp-barra-12-mesos">
        {barra.map((m) => (
          <div
            key={m.mes}
            role="listitem"
            className={m.actiu ? 'sdp-barra-12-mesos__mes sdp-barra-12-mesos__mes--actiu' : 'sdp-barra-12-mesos__mes'}
            aria-label={`${m.nomMes}: ${m.actiu ? m.fases.map((id) => fase[id]).join(', ') : tr('patrimoni.llavors.repos', 'repòs')}`}
          >
            <span className="sdp-barra-12-mesos__inicial" aria-hidden="true">{m.inicial}</span>
            <span className="sdp-barra-12-mesos__icones" aria-hidden="true">
              {m.actiu ? m.fases.map((id) => <span key={id}>{SIMBOL_FASE[id]}</span>) : <span className="sdp-barra-12-mesos__repos">·</span>}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

/* P0-59 · Valors de referència de l'aliment (no de la font), només si l'espècie en té (fitxaDidactica.js). */
function BlocNutricio({ item, tr }) {
  const nutricio = nutricioDe(item);
  if (!nutricio) return null;
  const titol = tr('patrimoni.llavors.nutricio', 'Valors nutricionals de referència (per 100 g)');
  return (
    <section className="sdp-fitxa-didactica__bloc" aria-label={titol}>
      <h4>{titol}</h4>
      <dl className="sdp-fitxa-didactica__nutricio-dl">
        <div className="sdp-fitxa-didactica__nutricio-item">
          <dt>{tr('patrimoni.llavors.energia', 'Energia')}</dt>
          <dd>{`${nutricio.kcal100g} kcal / 100 g`}</dd>
        </div>
        <div className="sdp-fitxa-didactica__nutricio-item">
          <dt>{tr('patrimoni.llavors.fibraAigua', 'Fibra i aigua')}</dt>
          <dd>{`${ambComa(nutricio.fibraG)} g de fibra · ${ambComa(nutricio.aiguaG)} g d’aigua`}</dd>
        </div>
        <div className="sdp-fitxa-didactica__nutricio-item">
          <dt>{tr('patrimoni.llavors.vitamines', 'Vitamines i minerals')}</dt>
          <dd lang="ca">{nutricio.vitaminesMinerals}</dd>
        </div>
      </dl>
      <p className="sdp-fitxa-didactica__font-nutricio">
        {tr('patrimoni.llavors.nutricioFont', 'Valors de referència per 100 g: «{aliment}», USDA FoodData Central SR Legacy, FDC {fdc}; no són de la font del catàleg.', { aliment: nutricio.aliment, fdc: nutricio.fdc })}
      </p>
    </section>
  );
}

function DetallValencia({ v, germanes = [], onTriaGermana, tr }) {
  return (
    <>
      {germanes.length > 1 && (
        <div className="sdp-fitxa-didactica__variants" role="group" aria-label={tr('patrimoni.llavors.germanes', 'Varietats de la mateixa espècie')}>
          {germanes.map((g) => (
            <Boto key={g.id} varietat={g.id === v.id ? 'primari' : 'secundari'} mida="p" aria-pressed={g.id === v.id} onClick={() => onTriaGermana(g)}>
              {g.nom}
            </Boto>
          ))}
        </div>
      )}
      <dl>
        <dt>{tr('patrimoni.llavors.nomCientific', 'Nom científic')}</dt><dd><i>{v.nomCientific}</i></dd>
        {v.familia && <><dt>{tr('patrimoni.llavors.familia', 'Família')}</dt><dd lang="ca">{v.familia}</dd></>}
        {v.nomIndex && <><dt>{tr('patrimoni.llavors.nomIndex', 'A l’índex del catàleg es diu')}</dt><dd lang="ca">{v.nomIndex.text}</dd></>}
      </dl>
      <Barra12Mesos calendari={v.calendari} tr={tr} />
      <BlocNutricio item={v} tr={tr} />
      <h4>{tr('patrimoni.llavors.tecnica', 'Informació tècnica')}</h4>
      <ul lang="ca">
        {v.camps.map((camp) => <li key={camp.linies[0]}>{camp.clau ? `${camp.clau}: ${camp.valor}` : camp.valor}</li>)}
      </ul>
      {v.avisos?.includes('unitat-pes-cm') && <p>{tr('patrimoni.llavors.unitatPes', 'La font dona este pes en centímetres: es copia tal com és.')}</p>}
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
      <BlocNutricio item={v} tr={tr} />
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
      <BlocNutricio item={e} tr={tr} />
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

function Fitxa({ entrada, totes, onTriaEntrada, font, onTanca, tr }) {
  const { dada } = entrada;
  const titol = useRef(null);
  /* Sense finestra que el porte, el focus va al títol de la fitxa: el lector l'anuncia i la vista hi baixa. */
  useEffect(() => { titol.current?.focus(); }, []);
  const germanes = useMemo(
    () => (font.id === 'cataleg-valencia' ? totes.filter((x) => x.nomCientific === entrada.nomCientific) : []),
    [font.id, totes, entrada.nomCientific]
  );
  return (
    <section className="sdp-fitxa-didactica" aria-label={entrada.nom}>
      <header className="sdp-fitxa-didactica__cap">
        <h4 ref={titol} tabIndex={-1} className="sdp-fitxa-didactica__titol">{entrada.nom}</h4>
        <Boto varietat="secundari" mida="p" onClick={onTanca}>{tr('common.tanca', 'Tancar')}</Boto>
      </header>
      {font.id === 'cataleg-valencia' && <DetallValencia v={dada} germanes={germanes} onTriaGermana={onTriaEntrada} tr={tr} />}
      {font.id === 'avl-mallorca' && <DetallAvl v={dada} tr={tr} />}
      {font.id === 'atles-catalunya' && <DetallAtles e={dada} tr={tr} />}
      <p>{tr('patrimoni.font.literal', 'Transcripció literal: es conserven les paraules i les xifres de la font, també les errates.')}</p>
      <h4>{tr('patrimoni.font.titol', 'La font')}</h4>
      <p><span lang="ca">{font.autoria} · {font.titol}</span> · {tr('patrimoni.font.pagina', 'Pàgina {n} del PDF', { n: entrada.pagina })}</p>
      <EmpremtaFont font={font} tr={tr} />
    </section>
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
  const [tornada, setTornada] = useState(null);
  const llista = useRef(null);
  const font = FONTS_BANC_LLAVORS.find((f) => f.id === idFont) ?? FONTS_BANC_LLAVORS[0];
  const totes = useMemo(() => entradesDelCataleg(font.id), [font.id]);
  const entrades = useMemo(() => filtraEntrades(totes, cerca), [totes, cerca]);
  const titol = tr('patrimoni.llavors.titol', 'Consulta els tres catàlegs');
  /* En tancar la fitxa, el focus torna al botó de la llista que l'havia oberta (si encara hi és). */
  useEffect(() => {
    if (seleccio || !tornada) return;
    const boto = [...(llista.current?.querySelectorAll('button[data-entrada]') ?? [])].find((b) => b.dataset.entrada === tornada);
    boto?.focus();
    setTornada(null);
  }, [seleccio, tornada]);
  const tanca = () => { setTornada(seleccio?.id ?? null); setSeleccio(null); };
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
      {seleccio && (
        <Fitxa key={seleccio.id} entrada={seleccio} totes={totes} onTriaEntrada={setSeleccio} font={font} onTanca={tanca} tr={tr} />
      )}
      {entrades.length ? (
        <ol lang="ca" ref={llista}>
          {entrades.slice(0, limit).map((entrada) => (
            <li key={entrada.id}>
              <Boto varietat="fantasma" data-entrada={entrada.id} onClick={() => setSeleccio(entrada)}>{entrada.nom} · <i>{entrada.nomCientific}</i></Boto>
            </li>
          ))}
        </ol>
      ) : <p>{tr('patrimoni.font.buit', 'No hi ha cap resultat amb esta cerca.')}</p>}
      {limit < entrades.length && <Boto onClick={() => setLimit((n) => n + MIDA)}>{tr('patrimoni.font.mes', 'Mostra’n més')}</Boto>}
    </section>
  );
}
