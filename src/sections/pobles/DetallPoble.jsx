/** Accions públiques del poble: el paquet porta les limitacions de les fonts.
 * Decisió del Mestre del 31-10-2026 (Ronda 2): la identitat federada (compte @,
 * Actor i Outbox) només es mostra per als pobles federats (POBLES_FEDERATS, hui
 * La Torre); un poble de mostra no té actor publicat i no se li'n promet cap.
 * Revisió de la Ronda 2: els textos passen per t() (section.detail.pobles.opendata.*,
 * R-02) i, dins de l'app nativa, no hi ha botó de descàrrega (R-09, R2-COR-05):
 * un blob amb <a download> no desa res al WebView i la CSP nativa no deixa
 * llegir l'outbox de socdepoble.org; es diu on es pot descarregar. */
import { useEffect, useRef, useState } from 'react';
import { Boto } from '../../components/PedraSeca/atoms/Boto.jsx';
import { esPobleFederat, esSlugFederat, urlsDeMunicipi } from '../../data/activitypub.js';
import { ORIGEN_PUBLIC_PER_DEFECTE, esAppNativa } from '../../config/origenPublic.js';
import { ConnexionsPubliques, VisibilitatConnexions } from '../profile/ConnexionsPubliques.jsx';
import { useConfigDeLApp } from './useEntitatsDelPoble.js';
import { omple } from '../../config/moderacio.js';

const senseTraductor = (_clau, reserva) => reserva;
/* T2 · D04/D10 (assalt 261101) · El generador (ZIP, SHA-256, iCalendar i la
   memòria oral) es carrega en diferit, en clicar «Descarregar»: no pesa a la
   fitxa del poble. */
const exportaMunicipiOpenData = (...args) => import('../../data/exportaMunicipiOpenData.js').then((m) => m.exportaMunicipiOpenData(...args));

/* T2 · D04/D10 (assalt 261101) · El resum del paquet descarregat, col·lecció a
   col·lecció, amb els recomptes i els pendents de veres (paquet.comptes i
   paquet.pendents de exportaMunicipiOpenData). Parells [clau, reserva]
   literals: i18n.usades.test.js els troba. */
const COLECCIONS_DEL_RESUM = Object.freeze([
  ['noticies', ['section.detail.pobles.opendata.coleccio.noticies', 'Notícies']],
  ['agenda', ['section.detail.pobles.opendata.coleccio.agenda', 'Agenda']],
  ['directori', ['section.detail.pobles.opendata.coleccio.directori', 'Entitats']],
  ['memoria', ['section.detail.pobles.opendata.coleccio.memoria', 'Memòria cultural']],
  ['memoriaOral', ['section.detail.pobles.opendata.coleccio.memoriaOral', 'Memòria oral']]
]);

/** «Notícies: 2 · Agenda: 1 · … · Memòria oral: encara no s’exporta», o null si el paquet no porta recomptes. */
export function resumDelPaquet(paquet, t = senseTraductor) {
  const comptes = paquet?.comptes;
  if (!comptes || typeof comptes !== 'object') return null;
  const pendents = new Set(Array.isArray(paquet.pendents) ? paquet.pendents : []);
  const parts = COLECCIONS_DEL_RESUM
    .filter(([coleccio]) => pendents.has(coleccio) || Number.isSafeInteger(comptes[coleccio]))
    .map(([coleccio, [clau, reserva]]) => `${t(clau, reserva)}: ${pendents.has(coleccio)
      ? t('section.detail.pobles.opendata.pendent', 'encara no s’exporta') : comptes[coleccio]}`);
  return parts.length ? parts.join(' · ') : null;
}

export function descarregaPaquet(paquet) {
  const url = URL.createObjectURL(new Blob([paquet.zip], { type: 'application/zip' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = paquet.nomFitxer;
  a.rel = 'noopener';
  /* Enllaç despenjat (Llei 06), com descarregaPerDefecte de PanellGestoria.jsx:
     el clic no necessita penjar-lo del document. */
  try { a.click(); } finally { setTimeout(() => URL.revokeObjectURL(url), 1000); }
}

export default function DetallPoble({ poble, t = senseTraductor, exporta = exportaMunicipiOpenData, descarrega = descarregaPaquet, config = null }) {
  const [revisioConnexions, setRevisioConnexions] = useState(0);
  const configApp = useConfigDeLApp();
  const configActual = config || configApp || {};
  const slug = String(poble?.slug || poble?.id || '');
  const [ocupat, setOcupat] = useState(false);
  const [missatge, setMissatge] = useState('');
  const versio = useRef(0);
  const bloquejat = useRef(false);
  useEffect(() => { versio.current += 1; bloquejat.current = false; setOcupat(false); setMissatge('');
    return () => { versio.current += 1; }; }, [slug]);
  const connexions = <><ConnexionsPubliques revisio={revisioConnexions} tipus="poble" id={String(poble?.id || slug)} config={configActual} t={t} />
    {poble?.administrable === true ? <VisibilitatConnexions onCanvi={() => setRevisioConnexions(n => n + 1)} tipus="poble" id={String(poble?.id || slug)} config={configActual} t={t} /> : null}</>;
  if (!esSlugFederat(slug)) return connexions;
  const federat = esPobleFederat(slug);
  const natiu = esAppNativa();
  const urls = urlsDeMunicipi(slug, { origen: ORIGEN_PUBLIC_PER_DEFECTE });
  const identificador = `@${slug}@socdepoble.org`;
  const descarregar = async () => {
    if (bloquejat.current) return;
    bloquejat.current = true;
    const actual = versio.current;
    setOcupat(true); setMissatge('');
    try {
      const paquet = await exporta(slug, { municipi: { slug, nom: poble.title || poble.name } });
      if (actual !== versio.current) return;
      descarrega(paquet);
      /* T2 · El missatge diu el que porta el paquet de veres, i el que no. */
      const resum = resumDelPaquet(paquet, t);
      setMissatge(resum
        ? omple(t('section.detail.pobles.opendata.descarregatResum', 'Paquet descarregat. {resum}.'), { resum })
        : t('section.detail.pobles.opendata.descarregatSenseResum', 'Paquet descarregat. La seua memòria (memoria.md) diu què porta i què encara no s’hi exporta.'));
    } catch { if (actual === versio.current) setMissatge(t('section.detail.pobles.opendata.error', 'No s’ha pogut preparar el paquet. Torna-ho a provar.')); }
    finally { if (actual === versio.current) { bloquejat.current = false; setOcupat(false); } }
  };
  const copiar = async () => {
    const actual = versio.current;
    try { await navigator.clipboard.writeText(identificador); if (actual === versio.current) setMissatge(t('section.detail.pobles.opendata.copiat', 'Identificador federat copiat.')); }
    catch { if (actual === versio.current) setMissatge(omple(t('section.detail.pobles.opendata.copiaAMa', 'Copia l’identificador: {identificador}'), { identificador })); }
  };
  return (
    <>
    {connexions}
    <section aria-label={federat ? t('section.detail.pobles.opendata.regio.federat', 'Dades obertes i identitat federada') : t('section.detail.pobles.opendata.regio', 'Dades obertes del poble')}>
      {natiu
        ? <p>{t('section.detail.pobles.opendata.natiu', 'Dins de l’app el paquet no es pot desar a les descàrregues: descarrega’l des de socdepoble.org.')}</p>
        : <p><Boto onClick={descarregar} disabled={ocupat} carregant={ocupat}>{federat
          ? t('section.detail.pobles.opendata.descarregaFederat', 'Descarregar paquet Open Data del poble (JSON / ActivityStreams 2.0 + JSON-LD)')
          : t('section.detail.pobles.opendata.descarrega', 'Descarregar paquet Open Data del poble (JSON / JSON-LD)')}</Boto></p>}
      {federat ? (
        <>
          <p>{t('section.detail.pobles.opendata.identificador', 'Identificador federat:')} <code>{identificador}</code></p>
          <p><Boto onClick={copiar}>{t('section.detail.pobles.opendata.copia', 'Copiar identificador federat')}</Boto>{' '}<a href={urls.actor}>Actor</a>{' · '}<a href={urls.outbox}>Outbox</a></p>
          <p>{t('section.detail.pobles.opendata.fase1', 'Consulta pública en fase 1. Seguir i respondre des del Fedivers encara està pendent.')}</p>
        </>
      ) : null}
      <p role="status" aria-live="polite">{missatge}</p>
    </section>
    </>
  );
}
