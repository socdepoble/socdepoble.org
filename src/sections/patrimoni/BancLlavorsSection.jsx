import { useEffect, useMemo, useRef, useState } from 'react';
import { Alerta, Boto, Camp, CampText, IconesAlergens, Insignia, Selector } from '../../components/PedraSeca/index.js';
import { useUIActions } from '../../app/contexts/UIContext';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssBancLlavorsFitxa from '../../css/diferit-banc-llavors-fitxa.css?inline';
import cssLlistesEscalables from '../../css/diferit-llistes-escalables.css?inline';
import { FONTS_BANC_LLAVORS, entradesDelCataleg, filtraEntrades } from '../../data/patrimoni/bancLlavors.js';
import LaminesBotaniquesNode0 from './LaminesBotaniquesNode0.jsx';
import { useLaminesBotaniquesNode0 } from './useLaminesBotaniquesNode0.js';
import EmpremtaFont from './EmpremtaFont.jsx';
import { FASES_CALENDARI, ambComa, barra12MesosDe, fasesAmbMesos, nutricioDe } from './fitxaDidactica.js';
import { traductorPatrimoni } from './textosPatrimoni.js';
import { textosBibliotecaAgricola } from './i18nBibliotecaAgricola.js';

/* IDEA-112 (Onada R9, carril C5) · /page/banc-de-llavors: la consulta dels catàlegs publicats i l'estudi d'oliveres,
   davall del text breu de PAGE_COPY (PageDetailSection la carrega en un chunk lazy). Només llig dades literals: cap
   formulari, cap persistència, cap custodi ni cap lot (G9-05). Els noms i les dades es mantenen en la llengua de cada
   font: no es traduïxen. Les pàgines són les del PDF de cada catàleg.
   R32.53 (IDEA-336 + IDEA-338) · Fitxes desplegables amb noblesa Pedra Seca (.sdp-taula-prosa amb <th scope>, lang,
   píndoles centrades i bloc desacoplat d'aptitud i 14 al·lèrgens UE 1169/2011 amb estat preventiu 'desconegut'). */
const MIDA = 24;

/* v1.2.22 · Gauntlet R2 (M5-06) · La llengua del títol de la font: 'ca' si la font no en diu cap. L'estudi d'oliveres
   (llenguaTitol: 'es') té el títol en castellà, i l'autoria i la nota de la font continuen en català. */
const llenguaDelTitol = (font) => (typeof font?.llenguaTitol === 'string' && font.llenguaTitol ? font.llenguaTitol : 'ca');

/**
 * Resol de manera pura i sense inventar certificacions el bloc d'aptitud i els
 * 14 al·lèrgens UE 1169/2011 d'una entrada del Banc de Llavors quan arriba el
 * consens 8/8 d'IDEA-336 (`registreAlergens` o `consensAlergens`).
 * Invariant innegociable: una varietat tòxica o no comestible mai s'acredita
 * com a apta per al consum ni exposa al·lèrgens d'aliment.
 */
export function resolSeguretatIAlergensLlavor(entrada, registreAlergens, txBib) {
  const dada = entrada?.dada || {};
  const reg = registreAlergens || entrada?.consensAlergens || dada?.consensAlergens || null;
  const aptitud = reg?.aptitud || entrada?.aptitud || dada?.aptitud || null;
  const esToxica = entrada?.esToxica === true || dada?.esToxica === true || aptitud === 'toxica';
  const esNoComestible = !esToxica && aptitud === 'no_comestible';

  if (esToxica) {
    return {
      esToxica: true,
      esNoComestible: false,
      insigniaTo: 'error',
      insigniaText: txBib.aptitudToxica,
      alergens: [],
      traces: [],
      estatAlergens: 'ocult',
    };
  }
  if (esNoComestible) {
    return {
      esToxica: false,
      esNoComestible: true,
      insigniaTo: 'neutre',
      insigniaText: txBib.aptitudNoComestible,
      alergens: [],
      traces: [],
      estatAlergens: 'ocult',
    };
  }

  const normalitzaIdAlergen = (id) => String(id || '').trim().toLowerCase().replace(/_/g, '-');
  const matriu = reg?.matriuFinal || reg?.matriuAlergens || entrada?.matriuFinal || entrada?.matriuAlergens || null;
  let alergens = Array.isArray(reg?.alergens)
    ? reg.alergens.map(normalitzaIdAlergen)
    : Array.isArray(entrada?.alergens)
      ? entrada.alergens.map(normalitzaIdAlergen)
      : [];
  let traces = Array.isArray(reg?.tracesAlergens)
    ? reg.tracesAlergens.map(normalitzaIdAlergen)
    : Array.isArray(entrada?.tracesAlergens)
      ? entrada.tracesAlergens.map(normalitzaIdAlergen)
      : [];

  if (matriu && typeof matriu === 'object') {
    const desDeMatriu = [];
    const tracesMatriu = [];
    for (const [clau, valor] of Object.entries(matriu)) {
      const idCanonic = normalitzaIdAlergen(clau);
      const estat = typeof valor === 'object' && valor !== null ? valor.estat : valor;
      if (estat === 'conte' || estat === 'ingredient') desDeMatriu.push(idCanonic);
      else if (estat === 'traca') tracesMatriu.push(idCanonic);
    }
    if (!alergens.length) alergens = desDeMatriu;
    if (!traces.length) traces = tracesMatriu;
  }

  const valorsMatriu = matriu && typeof matriu === 'object'
    ? Object.values(matriu).map((v) => (typeof v === 'object' && v !== null ? v.estat : v))
    : [];
  const teConsensComplet = valorsMatriu.length > 0 && valorsMatriu.every(
    (v) => v === 'conte' || v === 'ingredient' || v === 'traca' || v === 'absent'
  );

  let insigniaTo = 'avis';
  let insigniaText = txBib.aptitudCultiuDocumental;
  if (aptitud === 'aromatica_infusio') {
    insigniaTo = 'info';
    insigniaText = txBib.aptitudAromatica;
  } else if (aptitud === 'aliment' && (alergens.length > 0 || traces.length > 0 || teConsensComplet)) {
    insigniaTo = 'exit';
    insigniaText = txBib.aptitudAlimentRevisat;
  }

  if (alergens.length > 0 || traces.length > 0) {
    return { esToxica: false, esNoComestible: false, insigniaTo, insigniaText, alergens, traces, estatAlergens: 'declarat' };
  }
  if (teConsensComplet) {
    return { esToxica: false, esNoComestible: false, insigniaTo, insigniaText, alergens: [], traces: [], estatAlergens: 'absent_verificat' };
  }
  return { esToxica: false, esNoComestible: false, insigniaTo, insigniaText, alergens: [], traces: [], estatAlergens: 'desconegut' };
}

function TaulaDadesPedraSeca({ caption, txBib, ariaLabel = null, children }) {
  return (
    <div
      className="sdp-taula-prosa"
      tabIndex={0}
      {...(ariaLabel ? { role: 'region', 'aria-label': ariaLabel } : {})}
    >
      <table>
        <caption className="sdp-sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col">{txBib.campCol}</th>
            <th scope="col">{txBib.valorCol}</th>
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

/* v1.2.22 · Gauntlet R2 (M4-01) · Amb `webEsRegistreDocument`, l'adreça és el registre del document (RedIVIA), no la
   web d'una entitat: el rètol ve del mòdul de textos del Banc, en la llengua que rep `llengua`. */
export function FitxaDeLaFont({ font, tr, llengua = 'ca' }) {
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'banc-llavors-fitxa', cssBancLlavorsFitxa);
  const txBib = textosBibliotecaAgricola(llengua);
  const etiquetaWeb = font.webEsRegistreDocument === true
    ? txBib.registreDocument
    : tr('patrimoni.llavors.web', 'Web de l’entitat');
  return (
    <div ref={arrelRef} className="sdp-llavors-font">
      <p lang="ca">{font.nota}</p>
      {font.discrepancies.length > 0 && (
        <Alerta to="avis" viva={false} titol={tr('patrimoni.font.discrepancia', 'Discrepància')}>
          <span lang="ca">{font.discrepancies.join(' ')}</span>
        </Alerta>
      )}
      <TaulaDadesPedraSeca
        caption={`${tr('patrimoni.font.titol', 'La font')} · ${font.autoria}`}
        txBib={txBib}
        ariaLabel={`${tr('patrimoni.font.titol', 'La font')} · ${font.autoria}`}
      >
        <tr>
          <th scope="row">{tr('patrimoni.font.titol', 'La font')}</th>
          <td lang={llenguaDelTitol(font)}>{font.titol}</td>
        </tr>
        <tr>
          <th scope="row">{tr('patrimoni.llavors.autoria', 'Procedència')}</th>
          <td lang="ca">{font.autoria}</td>
        </tr>
        <tr>
          <th scope="row">{tr('patrimoni.llavors.ambit', 'Àmbit')}</th>
          <td lang="ca">{font.ambit}</td>
        </tr>
        {/* C26-2 #13 (Gauntlet c13) · Una web que encara no ha comprovat cap persona (webVerificada: false,
            la mateixa regla que catalegsMultipoble.js) no es pinta com a enllaç: l'adreça, com a text, sense
            «s’obri en una finestra nova». Les verificades, com sempre (Llei del Píxel). */}
        {font.web ? (
          <tr>
            <th scope="row">{etiquetaWeb}</th>
            {font.webVerificada === false ? (
              <td>{font.web.replace(/^https:\/\//, '')}</td>
            ) : (
              <td>
                <a href={font.web} target="_blank" rel="noopener noreferrer">{font.web.replace(/^https:\/\//, '')}</a>{' '}
                {tr('patrimoni.font.finestraNova', '(s’obri en una finestra nova)')}
              </td>
            )}
          </tr>
        ) : null}
      </TaulaDadesPedraSeca>
    </div>
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
export function BlocNutricio({ item, tr, txBib }) {
  const nutricio = nutricioDe(item);
  if (!nutricio) return null;
  const titol = tr('patrimoni.llavors.nutricio', 'Valors nutricionals de referència (per 100 g)');
  return (
    <section className="sdp-fitxa-didactica__bloc" aria-label={titol}>
      <h4>{titol}</h4>
      <TaulaDadesPedraSeca caption={titol} txBib={txBib}>
        <tr>
          <th scope="row">{tr('patrimoni.llavors.energia', 'Energia')}</th>
          <td>{`${nutricio.kcal100g} kcal / 100 g`}</td>
        </tr>
        <tr>
          <th scope="row">{tr('patrimoni.llavors.fibraAigua', 'Fibra i aigua')}</th>
          <td>{`${ambComa(nutricio.fibraG)} g de fibra · ${ambComa(nutricio.aiguaG)} g d’aigua`}</td>
        </tr>
        <tr>
          <th scope="row">{tr('patrimoni.llavors.vitamines', 'Vitamines i minerals')}</th>
          <td lang="ca">{nutricio.vitaminesMinerals}</td>
        </tr>
      </TaulaDadesPedraSeca>
      <p className="sdp-fitxa-didactica__font-nutricio">
        {tr('patrimoni.llavors.nutricioFont', 'Valors de referència per 100 g: «{aliment}», USDA FoodData Central SR Legacy, FDC {fdc}; no són de la font del catàleg.', { aliment: nutricio.aliment, fdc: nutricio.fdc })}
      </p>
    </section>
  );
}

export function DetallValencia({ v, germanes = [], onTriaGermana, tr, txBib }) {
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
      <TaulaDadesPedraSeca caption={`${v.nom} · ${v.nomCientific}`} txBib={txBib}>
        <tr>
          <th scope="row">{tr('patrimoni.llavors.nomCientific', 'Nom científic')}</th>
          <td lang="la"><i>{v.nomCientific}</i></td>
        </tr>
        {v.familia ? (
          <tr>
            <th scope="row">{tr('patrimoni.llavors.familia', 'Família')}</th>
            <td lang="ca">{v.familia}</td>
          </tr>
        ) : null}
        {v.nomIndex ? (
          <tr>
            <th scope="row">{tr('patrimoni.llavors.nomIndex', 'A l’índex del catàleg es diu')}</th>
            <td lang="ca">{v.nomIndex.text}</td>
          </tr>
        ) : null}
      </TaulaDadesPedraSeca>
      <Barra12Mesos calendari={v.calendari} tr={tr} />
      <BlocNutricio item={v} tr={tr} txBib={txBib} />
      <h4>{tr('patrimoni.llavors.tecnica', 'Informació tècnica')}</h4>
      <ul lang="ca">
        {v.camps.map((camp) => <li key={camp.linies[0]}>{camp.clau ? `${camp.clau}: ${camp.valor}` : camp.valor}</li>)}
      </ul>
      {v.avisos?.includes('unitat-pes-cm') && <p>{tr('patrimoni.llavors.unitatPes', 'La font dona este pes en centímetres: es copia tal com és.')}</p>}
    </>
  );
}

export function DetallMallorca({ v, tr, txBib }) {
  const temporada = v.temporada === 'hivern'
    ? tr('patrimoni.llavors.temporada.hivern', 'Varietats d’hivern')
    : tr('patrimoni.llavors.temporada.estiu', 'Varietats d’estiu');
  return (
    <>
      <TaulaDadesPedraSeca caption={`${v.nom} · ${v.nomCientific}`} txBib={txBib}>
        <tr>
          <th scope="row">{tr('patrimoni.llavors.nomCientific', 'Nom científic')}</th>
          <td lang="la"><i>{v.nomCientific}</i></td>
        </tr>
        <tr>
          <th scope="row">{tr('patrimoni.llavors.origen', 'Origen')}</th>
          <td lang="ca">{v.origen}</td>
        </tr>
        <tr>
          <th scope="row">{tr('patrimoni.llavors.temporada', 'Temporada')}</th>
          <td>{temporada}</td>
        </tr>
      </TaulaDadesPedraSeca>
      <BlocNutricio item={v} tr={tr} txBib={txBib} />
    </>
  );
}

/* R9V-C5-04 · Algunes línies del text extret de l'Atles ajunten dues varietats que el PDF presenta per separat
   (`particions` de les dades, contrastades amb les pàgines del PDF). Es mostren separades i amb l'avís: la dada
   literal no canvia. */
export function DetallCatalunya({ e, tr, txBib }) {
  const particions = e.particions ?? [];
  const partida = new Map(particions.map((p) => [p.trossos.join(' '), p.trossos]));
  const grups = [
    ['llista', tr('patrimoni.llavors.llista', 'Varietats locals'), e.llista.flatMap((linia) => partida.get(linia) ?? [linia])],
    ['altres', tr('patrimoni.llavors.altres', 'Altres varietats locals'), e.altres],
    ['sinonimies', tr('patrimoni.llavors.sinonimies', 'Sinonímies entre noms populars'), e.sinonimies]
  ].filter(([, , linies]) => linies.length > 0);
  return (
    <>
      <TaulaDadesPedraSeca caption={`${e.especie || e.nomCientific} · ${e.nomCientific}`} txBib={txBib}>
        <tr>
          <th scope="row">{tr('patrimoni.llavors.nomCientific', 'Nom científic')}</th>
          <td lang="la"><i>{e.nomCientific}</i></td>
        </tr>
      </TaulaDadesPedraSeca>
      <BlocNutricio item={e} tr={tr} txBib={txBib} />
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

export function DetallOlivera({ o, tr, txBib }) {
  return (
    <TaulaDadesPedraSeca caption={`${o.nom} · ${o.nomCientific}`} txBib={txBib}>
      <tr>
        <th scope="row">{tr('patrimoni.llavors.nomCientific', 'Nom científic')}</th>
        <td lang="la"><i>{o.nomCientific}</i></td>
      </tr>
      {Array.isArray(o.llista) && o.llista.length > 0 ? (
        <tr>
          <th scope="row">{txBib.denominacioEstudi}</th>
          <td lang="ca">{o.llista.join(', ')}</td>
        </tr>
      ) : null}
      {Array.isArray(o.sinonimies) && o.sinonimies.length > 0 ? (
        <tr>
          <th scope="row">{txBib.sinonimiaLocal}</th>
          <td lang="ca">{o.sinonimies.join(', ')}</td>
        </tr>
      ) : null}
    </TaulaDadesPedraSeca>
  );
}

export function Fitxa({
  entrada,
  totes,
  onTriaEntrada,
  font,
  onTanca,
  tr,
  autoFocus = true,
  llengua = 'ca',
  registreAlergens = null,
}) {
  const { dada } = entrada;
  const arrelRef = useRef(null);
  useFullDiferit(arrelRef, 'banc-llavors-fitxa', cssBancLlavorsFitxa);
  const txBib = textosBibliotecaAgricola(llengua);
  const cataleg = useLaminesBotaniquesNode0();
  const lamina = cataleg?.obteLaminaBotanicaNode0(entrada.id);
  const titol = useRef(null);
  /* La consulta autònoma anuncia el títol; el Workspace conserva la propietat del focus de les fletxes. */
  useEffect(() => { if (autoFocus) titol.current?.focus(); }, [autoFocus]);
  const germanes = useMemo(
    () => (font.id === 'cataleg-valencia' ? totes.filter((x) => x.nomCientific === entrada.nomCientific) : []),
    [font.id, totes, entrada.nomCientific]
  );
  const seguretat = resolSeguretatIAlergensLlavor(entrada, registreAlergens, txBib);
  const origenOCataleg = dada?.origen || dada?.familia || null;

  return (
    <section ref={arrelRef} className="sdp-fitxa-didactica" aria-label={entrada.nom}>
      <header className="sdp-fitxa-didactica__cap">
        <h4 ref={titol} tabIndex={-1} className="sdp-fitxa-didactica__titol">{entrada.nom}</h4>
        <Boto varietat="secundari" mida="p" onClick={onTanca}>{tr('common.tanca', 'Tancar')}</Boto>
      </header>

      <div className="sdp-llavors-fitxa__pindoles">
        <span className="sdp-llavors-fitxa__pindola">
          <span aria-hidden="true">🌱</span>
          <span lang="ca">{font.ambit}</span>
        </span>
        <span className="sdp-llavors-fitxa__pindola sdp-llavors-fitxa__pindola--origen">
          <span aria-hidden="true">🔬</span>
          <i lang="la">{entrada.nomCientific}</i>
        </span>
        {origenOCataleg ? (
          <span className="sdp-llavors-fitxa__pindola sdp-llavors-fitxa__pindola--origen">
            <span aria-hidden="true">📍</span>
            <span lang="ca">{origenOCataleg}</span>
          </span>
        ) : null}
      </div>

      {font.id === 'cataleg-valencia' && <DetallValencia v={dada} germanes={germanes} onTriaGermana={onTriaEntrada} tr={tr} txBib={txBib} />}
      {font.id === 'avl-mallorca' && <DetallMallorca v={dada} tr={tr} txBib={txBib} />}
      {font.id === 'atles-catalunya' && <DetallCatalunya e={dada} tr={tr} txBib={txBib} />}
      {font.id === 'oliveres-gva-ivia' && <DetallOlivera o={dada} tr={tr} txBib={txBib} />}

      <LaminesBotaniquesNode0 lamina={lamina} nom={entrada.nom} binomi={lamina?.binomiNet} titolElement="h4" />

      <section className="sdp-fitxa-didactica__bloc" aria-label={txBib.seguretatTitol}>
        <h4>{txBib.seguretatTitol}</h4>
        <div className="sdp-llavors-fitxa__seguretat">
          <div className="sdp-llavors-fitxa__aptitud">
            <Insignia to={seguretat.insigniaTo}>{seguretat.insigniaText}</Insignia>
          </div>
          <Alerta to={seguretat.esToxica || seguretat.esNoComestible ? 'avis' : 'info'} viva={false}>
            <p>{seguretat.esToxica || seguretat.esNoComestible ? txBib.avisToxicaLlavors : txBib.avisPreventiuLlavors}</p>
          </Alerta>
          {seguretat.estatAlergens === 'declarat' ? (
            <div className="sdp-llavors-fitxa__alergens">
              {seguretat.alergens.length > 0 ? (
                <IconesAlergens alergens={seguretat.alergens} mida="mitjana" etiqueta={txBib.alergensEtiqueta} />
              ) : null}
              {seguretat.traces.length > 0 ? (
                <IconesAlergens alergens={seguretat.traces} mida="xicoteta" etiqueta={txBib.tracesEtiqueta} />
              ) : null}
            </div>
          ) : null}
          {seguretat.estatAlergens === 'absent_verificat' ? (
            <div className="sdp-llavors-fitxa__alergens">
              <p className="sdp-llavors-fitxa__alergens-nota">{txBib.alergensCapDeclarat}</p>
            </div>
          ) : null}
          {seguretat.estatAlergens === 'desconegut' ? (
            <div className="sdp-llavors-fitxa__alergens">
              <p className="sdp-llavors-fitxa__alergens-nota">{txBib.alergensPendent}</p>
            </div>
          ) : null}
        </div>
      </section>

      {/* v1.2.22 · Gauntlet R1 (L4-11) · Les oliveres (Codex R32.42 lot 02) només porten el nom i la pàgina del document:
          no se'n transcriu res, i la fitxa no ho pot dir. */}
      {font.id !== 'oliveres-gva-ivia' ? (
        <p>{tr('patrimoni.font.literal', 'Transcripció literal: es conserven les paraules i les xifres de la font, també les errates.')}</p>
      ) : null}
      <h4>{tr('patrimoni.font.titol', 'La font')}</h4>
      <p><span lang="ca">{font.autoria}</span> · <span lang={llenguaDelTitol(font)}>{font.titol}</span> · {tr('patrimoni.font.pagina', 'Pàgina {n} del PDF', { n: entrada.pagina })}</p>
      <EmpremtaFont font={font} tr={tr} llengua={llengua} />
    </section>
  );
}

/** Cos viu de TextSection a /page/banc-de-llavors. */
export default function BancLlavorsSection() {
  const { t, language } = useUIActions();
  const tr = useMemo(() => traductorPatrimoni(t), [t]);
  const [idFont, setIdFont] = useState(FONTS_BANC_LLAVORS[0].id);
  const [cerca, setCerca] = useState('');
  const [limit, setLimit] = useState(MIDA);
  const [seleccio, setSeleccio] = useState(null);
  const [tornada, setTornada] = useState(null);
  const llista = useRef(null);
  useFullDiferit(llista, 'llistes-escalables', cssLlistesEscalables);
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
      <FitxaDeLaFont font={font} tr={tr} llengua={language} />
      <Camp etiqueta={tr('patrimoni.llavors.cerca', 'Cerca pel nom o pel nom científic')}>
        <CampText tipus="search" value={cerca} onChange={(e) => { setCerca(e.target.value); setLimit(MIDA); }} />
      </Camp>
      <p role="status">{tr('patrimoni.font.resultats', '{n} de {total}', { n: entrades.length, total: totes.length })}</p>
      {seleccio && (
        <Fitxa key={seleccio.id} entrada={seleccio} totes={totes} onTriaEntrada={setSeleccio} font={font} onTanca={tanca} tr={tr} llengua={language} />
      )}
      {entrades.length ? (
        <ol lang="ca" ref={llista} className="sdp-llista-escalable">
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
