/**
 * IndexConsola.jsx — l'Índex de la Consola, al peu del tauler (/consola).
 *
 * Onada 11 (261010; prompt 261010_1730, tasca 5) · Requeriment del Mestre
 * (auditoria 261010_1404 §8.2): «a la part de baix de la Consola, després de
 * totes les targetes», «un índex de text pur: un H2 de títol i H3 i H4 per
 * als subapartats», «explicar què fa cada peça de la Consola i enllaçar a la
 * Pàgina Universal de cada targeta».
 *
 * Text pur: cap targeta, cap component nou del catàleg. La jerarquia és la
 * d'indexConsola.js (dada, sense React): l'H2 de títol, un H3 per pàgina
 * (títol enllaçat a la seua ruta, el «per a què» i l'entradeta) i un H4 per
 * cada targeta de dins (títol enllaçat a la seua pàgina pròpia i l'entradeta
 * de la xifra o l'entradilla del panell). Els noms de fitxer de les
 * entradetes van en <Mono> (Entradeta, XifresMas.jsx) i amb el mode
 * privacitat s'amaguen; el títol d'una peça que porta una ruta diu la seua
 * versió privada (titolPrivat), com la seua targeta.
 *
 * Només al tauler de /consola (ConsolaSection.jsx), darrere de «El Mas en
 * xifres»: no a la Consola incrustada de la Wiki (ConsolaIncrustada), que
 * conserva els seus píxels. L'Índex de secció de la barra blava
 * (nivellMaxIndex={6}) recull estos h2, h3 i h4 com qualsevol altre.
 *
 * Onada 12 (261011; ordres 261011_0130, punt 2) · Derogat EN PART «cap
 * imatge»: l'H2 i els H3 que tenen il·lustració a la dada (IMATGES_INDEX,
 * indexConsola.js) la pinten en una miniatura, darrere de l'entradeta del
 * seu títol i davant de les seues targetes. La jerarquia (H2, H3, H4) i
 * l'ordre títol, «per a què», entradeta no canvien, i un node sense imatge
 * deixa el DOM de l'Onada 11. Llei Visual: sempre quadrada i centrada
 * (.sdp-consola__index-imatge, modules.css § CONSOLA), sense marc.
 *
 * Derogat EN PART per l'ordre del Mestre del 13-10-2026 (pla 261013_1405,
 * front F) · Les miniatures dels H3 (Explorador i Avisos i salut) passen a
 * les capçaleres de les seues targetes del tauler (imatgesConsola.js): cap
 * imatge es pinta dues vegades a /consola. Només l'H2 en porta, i el DOM dels
 * H3 torna a ser el de l'Onada 11. Esta vista no canvia: pinta el que diu la
 * dada (indexConsola.js).
 * Ordre del Mestre, 13-10-2026 (pla 261013_1405, front F) · L'Índex ja no és
 * l'últim bloc del tauler: darrere ve el «Diagnòstic del Mas»
 * (DiagnosiConsola.jsx), amb l'accés ràpid i el text pla.
 */
import { Fragment, useContext, useId } from 'react';
import { Link } from '../../app/contexts/RouterContext';
import { resolveAsset } from '../../config/assetResolver';
import { PrivacitatConsola } from './peces.jsx';
import { Entradeta } from './XifresMas.jsx';
import { indexConsola } from './indexConsola.js';

/* La il·lustració d'un node, si en porta. La ruta és del paquet (public/):
   resolveAsset la du a la base de l'amfitrió, com la portada de la pàgina. */
function Miniatura({ node }) {
  if (!node.imatge) return null;
  return (
    <img className="sdp-consola__index-imatge" src={resolveAsset(node.imatge)} alt={node.imatgeAlt}
      loading="lazy" decoding="async" />
  );
}

/* El títol d'un node: enllaçat a la seua ruta si en té; amb el mode
   privacitat, la versió sense ruta si la peça en porta. */
function Titol({ node, privat }) {
  const text = privat && node.titolPrivat ? node.titolPrivat : node.titol;
  return node.ruta ? <Link to={node.ruta}>{text}</Link> : text;
}

/* Una pàgina de l'índex (H3) amb les seues targetes (H4). */
function Pagina({ node, privat }) {
  return (
    <section className="sdp-consola__index-pagina">
      <h3><Titol node={node} privat={privat} /></h3>
      {node.subtitol && <p className="sdp-consola__index-peraque">{node.subtitol}</p>}
      {node.text && <p><Entradeta marcada={node.text} /></p>}
      <Miniatura node={node} />
      {node.fills.map((peca) => (
        <Fragment key={peca.id}>
          <h4><Titol node={peca} privat={privat} /></h4>
          {peca.text && <p><Entradeta marcada={peca.text} /></p>}
        </Fragment>
      ))}
    </section>
  );
}

/**
 * L'índex amb les fonts d'ara: el Mapa (`mapa`) i consola.json (`dades`),
 * cap de les dues obligatòria. Sense fonts, el nom de cada xifra fixa.
 */
export function IndexConsola({ mapa = null, dades = null, locale = 'ca-ES' }) {
  const id = useId();
  const privat = useContext(PrivacitatConsola);
  const [arrel] = indexConsola(mapa, dades, locale);
  return (
    <section className="sdp-consola__index" aria-labelledby={id}>
      <h2 id={id}>{arrel.titol}</h2>
      <p className="lead">{arrel.text}</p>
      <Miniatura node={arrel} />
      {arrel.fills.map((pagina) => <Pagina key={pagina.id} node={pagina} privat={privat} />)}
    </section>
  );
}
