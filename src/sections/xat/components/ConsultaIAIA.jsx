/** Ajuda documental personal, separada dels missatges del xat compartit.
 * Funciona amb la Wiki pública del paquet, també sense un bot remot desplegat. */
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from '../../../app/contexts/RouterContext.jsx';
import { Dialeg, Boto } from '../../../components/PedraSeca/index.js';
import { consultaTecnicaIAIA, MAXIM_PREGUNTA_IAIA, preparaWikiDeLaIAIA, SALUTACIO_TECNICA_IAIA } from '../../../data/iaiaLocal.js';

/* Gauntlet 261022_0225 (crítica Claude) · La Wiki (183 KB gzip) comença a
   baixar quan el diàleg porta un moment obert: el temps d'escriure la
   pregunta cobrix la descàrrega, i obrir i tancar de seguida no la demana. */
const ESPERA_PER_A_PREPARAR = 300;

export default function ConsultaIAIA({ t, consulta = consultaTecnicaIAIA, prepara = preparaWikiDeLaIAIA }) {
  const [obert, setObert] = useState(false);
  /* Ordre del Mestre (261026_2126; P1-37) · La píndola respira: ja no va
     enganxada al compositor ni a les vores (src/css/modules.css, bloc
     ConsultaIAIA). */
  return <>
    <button type="button" className="sdp-xat-pindola sdp-xat-pindola--iaia" onClick={() => setObert(true)}>
      {t('section.xat.iaia.consulta.obrir', 'Pregunta a la IAIA')}
    </button>
    <Dialeg obert={obert} onTanca={() => setObert(false)} mida="m" className="sdp-iaia-consulta"
      titol={t('section.xat.iaia.consulta.titol', 'IAIA · ajuda amb la Wiki')}>
      {obert ? <Contingut t={t} consulta={consulta} prepara={prepara} onFont={() => setObert(false)} /> : null}
    </Dialeg>
  </>;
}

/* Gauntlet 261022_0225 (crítica Claude) · El que anuncia la zona viva: una
   frase curta, mai els fragments sencers de les fonts. */
function avisDe(resultat, t) {
  switch (resultat?.estat) {
    case 'resposta': return resultat.fonts.length === 1
      ? t('section.xat.iaia.consulta.trobada', 'He trobat 1 font a la Wiki.')
      : t('section.xat.iaia.consulta.trobades', 'He trobat {n} fonts a la Wiki.').replace('{n}', String(resultat.fonts.length));
    case 'salutacio': return t('section.xat.iaia.consulta.salutacio', 'Digues-me què vols fer o el nom de l’eina, i et busque la font a la Wiki.');
    /* Ordre del Mestre (30-10-2026; f4 D.2, P1-49) · L'estat buit diu la
       veritat i no promet res: el nom de l'eina ja troba el que la Wiki en diu
       (iaiaLocal.js · cercaGuiada), i tornar-lo a escriure no trobaria res més. */
    case 'sense_resultats': return t('section.xat.iaia.consulta.buit', 'No ho trobe a la Wiki pública. Potser encara no en parla, o ho diu amb altres paraules. Pots preguntar-ho al grup General de la comunitat Sóc de Poble, on et pot contestar una persona.');
    case 'no_disponible': return t('section.xat.iaia.consulta.error', 'Ara no puc llegir la Wiki. Pots tornar-ho a provar; no he guardat la pregunta.');
    default: return '';
  }
}

function Contingut({ t, consulta, prepara, onFont }) {
  const [pregunta, setPregunta] = useState('');
  const [pendent, setPendent] = useState(false);
  const [resultat, setResultat] = useState(null);
  const actual = useRef(null);
  const id = useId();
  useEffect(() => () => { actual.current?.abort(); actual.current = null; }, []);
  useEffect(() => {
    const rellotge = setTimeout(() => prepara?.(), ESPERA_PER_A_PREPARAR);
    return () => clearTimeout(rellotge);
  }, [prepara]);
  const envia = async (event) => {
    event.preventDefault();
    if (actual.current || !pregunta.trim()) return;
    const control = new AbortController();
    actual.current = control;
    setPendent(true);
    setResultat(null);
    try {
      const resposta = await consulta(pregunta.trim(), { signal: control.signal });
      if (!control.signal.aborted) setResultat(resposta);
    } catch {
      if (!control.signal.aborted) setResultat({ estat: 'no_disponible', fonts: [] });
    } finally {
      if (actual.current === control) { actual.current = null; setPendent(false); }
    }
  };
  const avis = avisDe(resultat, t);
  const fonts = resultat?.estat === 'resposta' ? resultat.fonts : [];
  /* Gauntlet 261022_0225 (crítica Claude) · La salutació, una sola vegada:
     ací dalt. Mentre consulta, el camp és de només lectura i el botó porta
     aria-disabled (mana la guarda d'envia): un control desactivat perdria el
     focus, i el navegador l'enviaria a <body>, fora del diàleg. */
  return <div className="sdp-xat-dialeg__cos">
    <p>{t('section.xat.iaia.salutacio', SALUTACIO_TECNICA_IAIA)}</p>
    <p>{t('section.xat.iaia.consulta.abast', 'Consulte la Wiki pública d’esta versió. La pregunta es queda en este navegador i no s’envia al xat compartit.')}</p>
    <form onSubmit={envia}>
      <label htmlFor={id}>{t('section.xat.iaia.consulta.pregunta', 'Què necessites saber?')}</label>
      <textarea id={id} value={pregunta} onChange={(e) => setPregunta(e.target.value)}
        maxLength={MAXIM_PREGUNTA_IAIA} rows={3} readOnly={pendent} data-sdp-focus-inicial
        className="sdp-xat-compositor__camp" />
      <Boto type="submit" disabled={!pregunta.trim()} aria-disabled={pendent || undefined}>
        {pendent ? t('section.xat.iaia.consulta.cercant', 'Consultant la Wiki…') : t('section.xat.iaia.consulta.preguntar', 'Consultar')}
      </Boto>
    </form>
    {/* Gauntlet 261022_0225 (crítica Claude) · Una sola peça de la graella
        del cos: la zona viva i les fonts no sumen cap buit entre elles. */}
    <div>
      <div role="status" aria-live="polite">
        {avis ? <p className={fonts.length ? 'sdp-nomes-lector' : undefined}>{avis}</p> : null}
      </div>
      {fonts.length ? <>
        <p>{t('section.xat.iaia.consulta.fonts', 'Açò diuen les fonts. Obri-les per veure el context i la vigència de les instruccions:')}</p>
        {fonts.map((font) => <article key={font.id}>
          {font.fragment ? <p>{font.fragment}</p> : <p>{t('section.xat.iaia.consulta.senseFragment', 'He trobat una referència pel títol; cal llegir-la per comprovar si resol el dubte.')}</p>}
          <Link to={font.ruta} onClick={onFont}>{font.titol}</Link>
        </article>)}
      </> : null}
    </div>
  </div>;
}
