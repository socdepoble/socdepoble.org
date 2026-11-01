/**
 * FitxaMemoriaOral.jsx — La «Fitxa de memòria oral (OKF v0.2)» de «🎴 Proposa
 * Card» (T3.2, marató 261101; IDEA-29 i IDEA-41 del Llibre Mestre).
 *
 * Germana de DocumentEditor, que l'obri després del clic. Només pinta la
 * fitxa que li donen: el motor (estructura i revisió) és del consumidor
 * (DocumentEditor · adapter.memoriaOral; el Bloc, sections/notes/
 * memoriaOralDelBloc.js), i el component universal no importa cap secció.
 *
 * Un diàleg de Pedra Seca, sense cap classe nova:
 *  · amb fitxa OKF: el títol, la descripció, el resum, el poble i les
 *    etiquetes (amb les paraules del relat que les justifiquen) i els avisos;
 *    i sempre, dins d'un <details> natiu «Veure la fitxa sencera», el fitxer
 *    sencer (el markdown OKF) en un quadre de només lectura: la persona veu
 *    tot el que signa abans de signar-ho (Gauntlet 2, 261101, G2-MO-03). Els
 *    noms de les etiquetes i els avisos passen pel traductor
 *    (editor.memoriaOral.tema.<id> i editor.memoriaOral.avis.<codi>), amb el
 *    text del motor com a reserva (G2-MO-07); el fitxer es queda en valencià;
 *  · la casella «L'he revisada», que crida revisa() (marcaRevisioHumana) i,
 *    desmarcada, torna a l'esborrany; l'estat de revisió, en una regió viva;
 *    i «Descarrega la fitxa», el markdown OKF en un Blob amb el nom del seu
 *    camí, sense xarxa;
 *  · la correcció abans de signar (Gauntlet 261101, B2-04): si la màquina hi
 *    ha trobat pobles, el poble del relat es tria entre ells (o cap) amb un
 *    GrupOpcions; si hi ha trobat etiquetes, cada una és una Casella que la
 *    persona pot desmarcar. Pot llevar el que sobra, però no afegir el que
 *    falta (un poble que no és candidat, una etiqueta que la màquina no ha
 *    proposat): afegir-ne és decisió del Mestre. Quan marca «L'he revisada»,
 *    revisa(fitxa, { etiquetes, municipi }) segella la fitxa amb la correcció
 *    (frontmatter, cos i camí); mentre és revisada, la correcció queda tancada, i
 *    desmarcar-la la torna a obrir tal com estava. Sense ningú que signe, es
 *    veu però no es pot tocar. L'esborrany que es descarrega abans de
 *    revisar és la proposta de la màquina, i el text ho diu;
 *  · dins de l'app nativa (o sense URL.createObjectURL), on un enllaç blob:
 *    no desa res, cap botó que no faria res: el <details> ja naix obert, i el
 *    quadre diu que se'n copie el text;
 *  · sense fitxa OKF (motiu buit, llavor o massa-llarg), un text curt i res més.
 * La revisió només viu en el diàleg obert: canvia la fitxa que es descarrega
 * i no es desa enlloc. Tancar i tornar a obrir torna a l'esborrany.
 */
import { useState } from 'react';
import { Alerta, AreaText, Boto, Camp, Casella, Dialeg, GrupCamps, GrupOpcions, Pila } from '../PedraSeca/index.js';
import { esAppNativa } from '../../config/origenPublic.js';

const TIPUS_MARKDOWN = 'text/markdown;charset=utf-8';

/* El text curt de cada motiu sense fitxa OKF (memoriaOral.js · MOTIUS_MEMORIA). */
const SENSE_FITXA = Object.freeze({
  buit: ['editor.memoriaOral.motiu.buit', 'La nota encara no té cap relat: escriu-lo al cos i torna a provar.'],
  llavor: ['editor.memoriaOral.motiu.llavor', 'El cos encara és la plantilla de format: escriu-hi el relat i torna a provar.'],
  'massa-llarg': ['editor.memoriaOral.motiu.massaLlarg', 'El relat és massa llarg per a analitzar-lo en el navegador.']
});

/** El nom del fitxer: el camí OKF de la fitxa (memoria-oral/<poble>/<slug>.md) en un sol nom. */
export function nomDeLaFitxa(cami) {
  return String(cami ?? '').split('/').filter(Boolean).join('_') || 'memoria-oral.md';
}

/* Cert si este navegador pot desar un fitxer generat amb un enllaç blob:. */
function potDescarregar() {
  return !esAppNativa() && typeof globalThis.URL?.createObjectURL === 'function';
}

/* El markdown, desat amb un Blob i un enllaç despenjat (Llei 06: l'app pot
   viure dins d'un shadow root), com DetallPoble i DetallPrivacitat. Cap peça
   universal no ho oferix encara (Gauntlet 2, 261101, G2-MO-11): quan n'hi
   haja una, esta funció hi ha de passar. */
function descarregaMarkdown(text, nom) {
  const urls = globalThis.URL;
  const url = urls.createObjectURL(new Blob([text], { type: TIPUS_MARKDOWN }));
  const enllac = globalThis.document.createElement('a');
  enllac.href = url;
  enllac.download = nom;
  enllac.rel = 'noopener';
  // Safari necessita que la URL visca un moment després del clic.
  try { enllac.click(); } finally { setTimeout(() => urls.revokeObjectURL(url), 1000); }
}

/* Les etiquetes i els pobles que la màquina ha proposat, tal com venen. */
const llistaDe = (valor) => (Array.isArray(valor) ? valor.filter((e) => e && typeof e.id === 'string') : []);

/* Un id de tema o un codi d'avís que pot fer de tros de clau. */
const TROS_DE_CLAU = /^[A-Za-z][A-Za-z0-9]{0,40}$/;

/* El text d'una etiqueta: el nom (traduït; el del vocabulari, de reserva) i,
   entre parèntesis, les paraules del relat, tal com les va escriure la persona. */
function textEtiqueta(e, t) {
  const nom = TROS_DE_CLAU.test(e.id) ? t(`editor.memoriaOral.tema.${e.id}`, e.nom) : e.nom;
  return e.proves?.length ? `${nom} (${e.proves.join(', ')})` : nom;
}

/* Els avisos del motor, traduïts pel seu codi (codisAvis, paral·lel a avisos);
   sense codi, el text tal com ve. */
function textosAvisos(fitxa, t) {
  const avisos = Array.isArray(fitxa?.avisos) ? fitxa.avisos : [];
  const codis = Array.isArray(fitxa?.codisAvis) && fitxa.codisAvis.length === avisos.length ? fitxa.codisAvis : [];
  return avisos.flatMap((avis, n) => {
    if (typeof avis !== 'string') return [];
    const codi = codis[n];
    return [typeof codi === 'string' && TROS_DE_CLAU.test(codi) ? t(`editor.memoriaOral.avis.${codi}`, avis) : avis];
  });
}

/* Un text del motor amb paràgrafs separats per una línia en blanc (el resum
   d'un relat sense puntuació, B2-09): un <p> per paràgraf; un de sol, tal qual. */
function ambParagrafs(text) {
  const paragrafs = String(text).split('\n\n').filter(Boolean);
  return paragrafs.length > 1 ? paragrafs.map((p, n) => <p key={n}>{p}</p>) : text;
}

/**
 * Props: obert, onTanca, fitxa (la d'estructuraMemoriaOral, en esborrany),
 * revisa ((fitxa, { etiquetes, municipi }) => fitxa revisada, o null: la
 * casella apagada), descripcio (el resultat de la Card, opcional) i t (el
 * traductor, (clau, reserva)). La correcció comença en la proposta de la
 * màquina cada volta que el diàleg es munta (DocumentEditor en canvia la
 * `key` a cada obertura).
 */
export function FitxaMemoriaOral({ obert, onTanca, fitxa, revisa = null, descripcio = null, t }) {
  const [revisada, setRevisada] = useState(null);
  const [errorRevisio, setErrorRevisio] = useState(false);
  const proposades = llistaDe(fitxa?.etiquetes);
  const candidats = llistaDe(fitxa?.candidats);
  const [triades, setTriades] = useState(() => proposades.map((e) => e.id));
  /* '' és «cap d'estos pobles»: cap id de poble no és buit. */
  const [poble, setPoble] = useState(() => fitxa?.municipi?.id ?? '');
  const actual = revisada ?? fitxa;
  const okf = actual?.okf ?? null;
  const descarregable = Boolean(okf) && potDescarregar();
  const potRevisar = typeof revisa === 'function';
  const tancada = !potRevisar || Boolean(revisada);

  const canviaRevisio = (event) => {
    if (!event.target.checked) {
      setRevisada(null);
      setErrorRevisio(false);
      return;
    }
    try {
      setRevisada(revisa(fitxa, {
        etiquetes: proposades.filter((e) => triades.includes(e.id)).map((e) => e.id),
        municipi: poble || null
      }));
      setErrorRevisio(false);
    } catch {
      setRevisada(null);
      setErrorRevisio(true);
    }
  };
  const canviaEtiqueta = (id) => (event) => {
    const marcada = event.target.checked;
    setTriades((abans) => (marcada ? [...abans, id] : abans.filter((x) => x !== id)));
  };

  const titol = t('editor.memoriaOral.titol', 'Fitxa de memòria oral (OKF v0.2)');
  if (!okf) {
    const [clau, reserva] = SENSE_FITXA[fitxa?.motiu] ?? SENSE_FITXA.buit;
    return (
      <Dialeg obert={obert} onTanca={onTanca} titol={titol} descripcio={descripcio} mida="m">
        <p>{t(clau, reserva)}</p>
      </Dialeg>
    );
  }

  const avisos = textosAvisos(actual, t);
  const resum = typeof actual.resum === 'string' ? actual.resum : '';
  return (
    <Dialeg obert={obert} onTanca={onTanca} titol={titol} descripcio={descripcio} mida="m"
      accions={descarregable ? (
        <Boto varietat="primari" onClick={() => descarregaMarkdown(okf.markdown, nomDeLaFitxa(okf.cami))}>
          {t('editor.memoriaOral.descarrega', 'Descarrega la fitxa')}
        </Boto>
      ) : null}>
      <Pila gap={4}>
        {potRevisar && !revisada && (candidats.length > 0 || proposades.length > 0) ? (
          <p>{t('editor.memoriaOral.correccio', 'Abans de marcar «L’he revisada», desmarca les etiquetes que no hi toquen i tria el poble del relat. La correcció entra a la fitxa quan la marques com a revisada; fins aleshores, la que descarregues és la proposta de la màquina.')}</p>
        ) : null}
        <dl>
          <dt>{t('editor.memoriaOral.camp.titol', 'Títol')}</dt>
          <dd>{actual.titol}</dd>
          <dt>{t('editor.memoriaOral.camp.descripcio', 'Descripció')}</dt>
          <dd>{actual.descripcio}</dd>
          {resum ? (
            <>
              <dt>{t('editor.memoriaOral.camp.resum', 'Resum')}</dt>
              <dd>{ambParagrafs(resum)}</dd>
            </>
          ) : null}
          {candidats.length ? null : (
            <>
              <dt>{t('editor.memoriaOral.camp.poble', 'Poble detectat')}</dt>
              <dd>{t('editor.memoriaOral.capPoble', 'Cap dels pobles que coneix l’aplicació')}</dd>
            </>
          )}
          {proposades.length ? null : (
            <>
              <dt>{t('editor.memoriaOral.camp.etiquetes', 'Etiquetes')}</dt>
              <dd>{t('editor.memoriaOral.capEtiqueta', 'Cap del vocabulari rural')}</dd>
            </>
          )}
        </dl>
        {candidats.length ? (
          <GrupOpcions
            llegenda={t('editor.memoriaOral.camp.pobleDelRelat', 'Poble del relat')}
            opcions={[
              ...candidats.map((c) => ({ valor: c.id, etiqueta: c.nom })),
              { valor: '', etiqueta: t('editor.memoriaOral.capDEstos', 'Cap d’estos pobles') }
            ]}
            valor={revisada ? (revisada.municipi?.id ?? '') : poble}
            onCanvi={setPoble}
            disabled={tancada}
          />
        ) : null}
        {proposades.length ? (
          <GrupCamps llegenda={t('editor.memoriaOral.camp.etiquetes', 'Etiquetes')}>
            {proposades.map((e) => (
              <Casella key={e.id} etiqueta={textEtiqueta(e, t)}
                checked={revisada ? llistaDe(revisada.etiquetes).some((x) => x.id === e.id) : triades.includes(e.id)}
                disabled={tancada}
                onChange={canviaEtiqueta(e.id)} />
            ))}
          </GrupCamps>
        ) : null}
        {avisos.length ? (
          <Alerta to="avis" viva={false} titol={t('editor.memoriaOral.avisos', 'Avisos')}>
            <ul className="sdp-llista">
              {avisos.map((avis, n) => <li key={n}>{avis}</li>)}
            </ul>
          </Alerta>
        ) : null}
        {/* G2-MO-03 · El fitxer sencer, sempre i abans de la casella que el
            signa: plegat on es pot descarregar, obert on només es pot copiar
            (l'app nativa). */}
        <details open={!descarregable}>
          <summary>{t('editor.memoriaOral.veureFitxa', 'Veure la fitxa sencera')}</summary>
          <Camp etiqueta={t('editor.memoriaOral.text', 'La fitxa, en Markdown')}
            ajuda={descarregable
              ? t('editor.memoriaOral.textSencer', 'És el fitxer sencer, tal com es descarrega.')
              : t('editor.memoriaOral.senseDescarrega', 'Ací no es pot desar com a fitxer: copia’n el text.')}>
            <AreaText files={8} readOnly spellCheck={false} value={okf.markdown} />
          </Camp>
        </details>
        <Casella
          etiqueta={t('editor.memoriaOral.revisada', 'L’he revisada')}
          ajuda={revisa
            ? t('editor.memoriaOral.revisadaAjuda', 'La fitxa que descarregues passa d’esborrany a revisada per una persona; el fitxer no porta cap identificador del teu compte.')
            : t('editor.memoriaOral.senseCompte', 'Per a signar la revisió cal entrar amb el teu compte.')}
          checked={Boolean(revisada)}
          disabled={typeof revisa !== 'function'}
          onChange={canviaRevisio}
        />
        <p role="status">
          {errorRevisio
            ? t('editor.memoriaOral.errorRevisio', 'No s’ha pogut signar la revisió: la fitxa continua en esborrany.')
            : revisada
              ? t('editor.memoriaOral.estat.revisada', 'Estat: revisada per una persona.')
              : t('editor.memoriaOral.estat.esborrany', 'Estat: esborrany, pendent de revisió humana.')}
        </p>
      </Pila>
    </Dialeg>
  );
}

export default FitxaMemoriaOral;
