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
 *
 * Ordre del Mestre, 30-10-2026 (xat, ~14:15, punts 2.1, 2.2 i 2.3) ·
 *  · Fora la miniatura repetida: cap imatge a l'Índex (la vinyeta de la
 *    Consola ja és la portada de /page/consola i de la seua targeta).
 *  · Estil de publicació de Sóc de Poble: l'article porta la classe de la
 *    prosa (sdp-prose) i la columna de lectura canònica, centrada (sdp-centre:
 *    --sdp-measure, el contenidor Centre de composicio), en lloc d'estirar
 *    les línies de punta a punta del monitor. L'H2 i la seua entradeta
 *    (p.lead) van centrats; els H3, en el blau marí dels H3 i els H4, en el
 *    terracota dels H4, també quan porten enllaç (modules.css § CONSOLA).
 *  · Redacció didàctica: cada H3 i cada H4 pinta els tres moviments de la
 *    dada (indexConsola.js): què és (`text` i, als H3, `explica`), què diuen
 *    ara les dades (`diu`) i què està en ordre i què queda (`queda`), amb
 *    negretes per a llegir a salts de vista i enllaços vius a les pàgines.
 *    Les rutes i els fitxers van en <Mono>, que el mode privacitat amaga.
 *  · Les fonts són les mateixes del tauler (consola.json, el Mapa, la matriu
 *    del govern i els empaquetats) i el mateix rellotge (`ara`).
 * Derogat EN PART: l'Onada 12 (la miniatura de l'H2) i el «text pur» de
 * l'Onada 11 (ara també hi ha enllaços dins dels paràgrafs, sempre cap a
 * pàgines que ja són títols de l'índex).
 * Gauntlet 261030 (cicle 4, corrector de la Consola) · Les peces d'una
 * família ja no són un H4 cada una: van davall de la xifra que les compta
 * (o del seu H4 de família), i les que marquen alguna cosa, en una llista
 * <ul> amb l'enllaç a la seua pàgina (Membres). Derogat EN PART: «cap
 * llista» dins de l'Índex.
 */
import { Fragment, useContext, useId } from 'react';
import { Link } from '../../app/contexts/RouterContext';
import { Mono, PrivacitatConsola } from './peces.jsx';
import { indexConsola, trossosMarcats } from './indexConsola.js';

/* El títol d'un node: enllaçat a la seua ruta si en té; amb el mode
   privacitat, la versió sense ruta si la peça en porta. */
function Titol({ node, privat }) {
  const text = privat && node.titolPrivat ? node.titolPrivat : node.titol;
  return node.ruta ? <Link to={node.ruta}>{text}</Link> : text;
}

/* Un tros de paràgraf (indexConsola.js): text, negreta, fitxer o enllaç. */
function Tros({ tros, privat }) {
  if ('mono' in tros) return <Mono>{tros.mono}</Mono>;
  const text = privat && tros.privat ? tros.privat : (tros.fort ?? tros.enllac ?? tros.text);
  if ('fort' in tros) return <strong>{text}</strong>;
  if ('enllac' in tros) return <Link to={tros.ruta}>{text}</Link>;
  return text;
}

/* Un paràgraf de trossos; sense cap tros, res. */
function Paragraf({ trossos, privat }) {
  if (!trossos?.length) return null;
  return <p>{trossos.map((tros, i) => <Tros key={i} tros={tros} privat={privat} />)}</p>;
}

/* Els tres moviments d'un node: què és (i, als H3, en paraules planes), què diuen ara les dades i què queda. */
function Moviments({ node, privat }) {
  return (
    <>
      <Paragraf trossos={trossosMarcats(node.text)} privat={privat} />
      {(node.explica ?? []).map((trossos, i) => <Paragraf key={i} trossos={trossos} privat={privat} />)}
      <Paragraf trossos={node.diu} privat={privat} />
      <Paragraf trossos={node.queda} privat={privat} />
    </>
  );
}

/* Gauntlet 261030 (cicle 4, corrector de la Consola) · Les peces d'una
   família (indexConsola.js · membresDe): la definició de la família i el
   recompte, en paràgrafs, i les peces que marquen alguna cosa en una llista
   de cos normal (lliçó 261030 de sdp-universal-page: cap taula de prosa),
   cada una amb el seu enllaç. Sense membres, res. */
function Membres({ membres, privat }) {
  if (!membres) return null;
  return (
    <>
      <Paragraf trossos={membres.definicio} privat={privat} />
      <Paragraf trossos={membres.resum} privat={privat} />
      {membres.llista.length > 0 && (
        <ul>
          {membres.llista.map((peca) => (
            <li key={peca.id}>{peca.trossos.map((tros, i) => <Tros key={i} tros={tros} privat={privat} />)}</li>
          ))}
        </ul>
      )}
    </>
  );
}

/* Un bloc de l'índex (H3) amb les seues targetes (H4). */
function Pagina({ node, privat }) {
  return (
    <section className="sdp-consola__index-pagina">
      <h3><Titol node={node} privat={privat} /></h3>
      {node.subtitol && <p className="sdp-consola__index-peraque">{node.subtitol}</p>}
      <Moviments node={node} privat={privat} />
      {node.fills.map((peca) => (
        <Fragment key={peca.id}>
          <h4><Titol node={peca} privat={privat} /></h4>
          <Moviments node={peca} privat={privat} />
          <Membres membres={peca.membres} privat={privat} />
        </Fragment>
      ))}
    </section>
  );
}

/**
 * L'índex amb les fonts del tauler: `fonts` ({ dades, estatDades, mapa,
 * estatMapa }, com ConsolaSection · fontsDe), `govern` (useGovern),
 * `empaquetats` (useFontDev) i el rellotge de la pintada (`ara`). Cap
 * obligatòria: sense fonts, el nom de cada xifra i per què no hi ha dades.
 */
export function IndexConsola({ fonts = {}, govern = null, empaquetats = null, locale = 'ca-ES', ara = Date.now() }) {
  const id = useId();
  const privat = useContext(PrivacitatConsola);
  const [arrel] = indexConsola(fonts.mapa ?? null, fonts.dades ?? null, locale, {
    estatMapa: fonts.estatMapa, estatDades: fonts.estatDades, govern, empaquetats, ara
  });
  return (
    <section className="sdp-consola__index sdp-prose sdp-centre" aria-labelledby={id}>
      <h2 id={id}>{arrel.titol}</h2>
      <p className="lead">{arrel.text}</p>
      {arrel.fills.map((pagina) => <Pagina key={pagina.id} node={pagina} privat={privat} />)}
    </section>
  );
}
