import { useEffect, useRef, useState } from 'react';
import { PackageCheck } from 'lucide-react';
import { Accions, Alerta, Boto, Camp, CampFitxer, CampText, Carregant, EstatBuit, Pila } from '../../components/PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { useUIStateOpcional } from '../../app/contexts/UIContext.jsx';
import * as backendPort from '../../data/backendPort.js';
import { textosOpenDataEstats } from './i18nOpenDataEstats.js';

const txt = (clau, reserva) => Object.freeze([`section.pobles.restaurador.${clau}`, reserva]);
export const TEXTOS_RESTAURADOR = Object.freeze({
  titol: txt('titol', 'Restaurar dades obertes del municipi'),
  explica: txt('explica', 'Comprova un paquet abans de restaurar les seues dades públiques. No inclou comptes, xats ni notes privades.'),
  fitxer: txt('fitxer', 'Paquet Open Data (ZIP)'),
  ajudaFitxer: txt('ajudaFitxer', 'Tria un paquet municipal de fins a 64 MB. La lectura i la comprovació es fan en este dispositiu.'),
  sha: txt('sha', 'Empremta SHA-256 esperada'),
  ajudaSha: txt('ajudaSha', 'Aporta els 64 caràcters de l’empremta obtinguda d’una font de confiança. El resum del mateix fitxer, per si sol, no acredita qui l’ha publicat.'),
  comprova: txt('comprova', 'Comprovar i previsualitzar'),
  descarta: txt('descarta', 'Descartar el paquet'),
  comprovant: txt('comprovant', 'Comprovant el paquet…'),
  valid: txt('valid', 'El paquet coincidix amb l’empremta aportada; l’esquema DataPackage v2, les llicències per element i el contingut s’han comprovat. Encara no s’ha restaurat.'),
  error: txt('error', 'No es pot verificar el paquet. Revisa el fitxer ZIP i l’empremta de confiança; no s’ha escrit cap dada.'),
  senseCapacitat: txt('senseCapacitat', 'Este servidor permet comprovar el paquet, però encara no admet restaurar-lo. No s’enviarà cap dada.'),
  sensePermis: txt('sensePermis', 'La restauració necessita permís d’administració i un municipi actiu confirmat.'),
  altreMunicipi: txt('altreMunicipi', 'El paquet és d’un altre municipi. Canvia al poble corresponent abans de restaurar-lo.'),
  resum: txt('resum', 'Contingut verificat'),
  municipi: txt('municipi', 'Municipi'),
  noticies: txt('noticies', 'Notícies'),
  agenda: txt('agenda', 'Agenda'),
  directori: txt('directori', 'Entitats'),
  memoria: txt('memoria', 'Memòria cultural'),
  memoriaOral: txt('memoriaOral', 'Memòria oral revisada'),
  restaura: txt('restaura', 'Restaurar en el municipi actiu'),
  restaurat: txt('restaurat', 'El servidor de dades ha confirmat la restauració del contingut públic.'),
  errorRestauracio: txt('errorRestauracio', 'El servidor no ha confirmat la restauració. Revisa els permisos o els conflictes abans de tornar-ho a provar.'),
  limit: txt('limit', 'La configuració del node, la publicació ActivityPub i els fitxers d’imatge no es restauren amb esta operació.'),
});

const COLLECCIONS_RESUM = Object.freeze(['noticies', 'agenda', 'directori', 'memoria', 'memoriaOral']);
const MAXIM = 64 * 1024 * 1024;
const BUIDA = Object.freeze({});
const llig = (...args) => import('../../data/importaMunicipiOpenData.js').then(m => m.llegeixPaquetOpenData(...args));
const importa = (...args) => import('../../data/importaMunicipiOpenData.js').then(m => m.importaMunicipiOpenData(...args));
const capacitat = port => Boolean(port?.teCapacitat?.('restauracioDadesObertes') && typeof port.restauraDadesObertes === 'function');

function useIdiomaRestaurador() {
  try {
    return useUIStateOpcional()?.language || 'ca';
  } catch {
    return 'ca';
  }
}

/** `municipi` ha de vindre de la selecció activa autoritzada, mai del ZIP.
 * El pare ha de canviar scopeKey amb usuari/actor/tenant/backend. A més es
 * vinculen port i configuració per avortar els resultats d'un àmbit anterior.
 * La capacitat no substituïx els permisos que comprova l'adaptador real.
 *
 * Onada R32.11 · Lot 05: 6 estats UI complets (Empty, Loading diferenciat,
 * Error accionable, Permission, Partial i Success) i botons centrats (<Accions>).
 */
export default function RestauradorOpenData({ municipi = null, scopeKey = '', port = backendPort, config = BUIDA, autoritzat = false, introduccio = true, idioma }) {
  const idiomaContext = useIdiomaRestaurador();
  const tx = textosOpenDataEstats(idioma ?? idiomaContext);
  const t = useTraductorOpcional();
  const tr = k => tradueix(t, TEXTOS_RESTAURADOR[k]);
  const [fitxer, setFitxer] = useState(null);
  const [sha, setSha] = useState('');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [ocupat, setOcupat] = useState(false);
  const [faseOcupat, setFaseOcupat] = useState(null);
  const [restaurat, setRestaurat] = useState(false);
  const [entrada, setEntrada] = useState(0);
  const versio = useRef(0);
  const controlador = useRef(null);
  const dades = useRef(null);
  const enVol = useRef(false);
  const viu = useRef(false);
  // Les credencials no es pinten. La identitat del backend també invalida el preview.
  const context = JSON.stringify([scopeKey, municipi?.slug, config.tenantId ?? config.tenant_id, config.backendUrl ?? config.backend_url ?? config.supabaseUrl, config.backendId, config.dataMode]);
  function invalida() {
    versio.current += 1; controlador.current?.abort(); controlador.current = null;
    dades.current = null; setPreview(null); setError(null); setRestaurat(false);
    enVol.current = false; setOcupat(false); setFaseOcupat(null);
  }
  function descartaTot() {
    invalida();
    setFitxer(null);
    setSha('');
    setEntrada(n => n + 1);
  }
  useEffect(() => {
    viu.current = true;
    return () => { viu.current = false; versio.current += 1; controlador.current?.abort(); dades.current = null; };
  }, []);
  useEffect(() => { invalida(); setFitxer(null); setSha(''); }, [context, port, autoritzat]);
  const coincideix = Boolean(preview && municipi?.slug && preview.slug === municipi.slug);
  const potRestaurar = Boolean(coincideix && autoritzat && scopeKey && capacitat(port));
  const esBuitInicial = Boolean(!fitxer && !sha && !preview && !error && !ocupat && !restaurat);

  async function comprova(event) {
    event.preventDefault();
    if (enVol.current) return;
    invalida();
    const actual = versio.current;
    enVol.current = true; setOcupat(true); setFaseOcupat('comprovant');
    try {
      if (!fitxer || fitxer.size <= 0 || fitxer.size > MAXIM || !/^[a-f0-9]{64}$/i.test(sha.trim())) throw new TypeError('fitxer');
      const bytes = new Uint8Array(await fitxer.arrayBuffer());
      if (bytes.byteLength > MAXIM || bytes.byteLength !== fitxer.size) throw new TypeError('mida');
      if (!viu.current || actual !== versio.current) return;
      const llegit = await llig(bytes, { sha256Esperat: sha.trim().toLowerCase() });
      if (!viu.current || actual !== versio.current) return;
      dades.current = bytes;
      setPreview({ slug: llegit.slug, nom: llegit.municipi.nom, sha256: llegit.sha256, comptes: llegit.comptes });
    } catch {
      if (viu.current && actual === versio.current) setError('error');
    } finally {
      if (viu.current && actual === versio.current) {
        enVol.current = false; setOcupat(false); setFaseOcupat(null);
      }
    }
  }

  async function restaura() {
    if (enVol.current || !potRestaurar || !dades.current) return;
    const actual = versio.current;
    const control = new AbortController(); controlador.current = control;
    enVol.current = true; setOcupat(true); setFaseOcupat('restaurant'); setError(null); setRestaurat(false);
    try {
      // L'importador revalida tots els bytes, SHA i capacitat just abans d'escriure.
      await importa(dades.current, port, { sha256Esperat: preview.sha256, config, signal: control.signal });
      if (viu.current && actual === versio.current) setRestaurat(true);
    } catch {
      if (viu.current && actual === versio.current && !control.signal.aborted) setError('errorRestauracio');
    } finally {
      if (viu.current && actual === versio.current) {
        enVol.current = false; setOcupat(false); setFaseOcupat(null);
      }
    }
  }

  const colleccionsAmbDades = preview
    ? COLLECCIONS_RESUM.filter(k => (preview.comptes[k] ?? 0) > 0).length
    : 0;
  const esParcial = Boolean(preview && colleccionsAmbDades < COLLECCIONS_RESUM.length);

  return (
    <section aria-label={tr('titol')}>
      <Pila gap={4}>
        <h3>{tr(introduccio ? 'titol' : 'comprova')}</h3>
        {introduccio ? <p>{tr('explica')}</p> : null}

        {esBuitInicial ? (
          <EstatBuit icona={PackageCheck} titol={tx.buitPaquetTitol}>
            {tx.buitPaquetText}
          </EstatBuit>
        ) : null}

        <form onSubmit={comprova}>
          <Pila gap={4}>
            <Camp etiqueta={tr('fitxer')} ajuda={tr('ajudaFitxer')}>
              <CampFitxer
                key={`${context}:${entrada}`}
                disabled={ocupat}
                accept=".zip,application/zip"
                onChange={e => { invalida(); setFitxer(e.target.files?.[0] || null); }}
              />
            </Camp>
            <Camp etiqueta={tr('sha')} ajuda={tr('ajudaSha')}>
              <CampText
                value={sha}
                maxLength={64}
                disabled={ocupat}
                onChange={e => { invalida(); setSha(e.target.value); }}
              />
            </Camp>
            <Accions>
              <Boto type="submit" disabled={ocupat || !fitxer || !sha.trim()} carregant={ocupat}>
                {ocupat && faseOcupat === 'comprovant' ? tr('comprovant') : tr('comprova')}
              </Boto>
              {fitxer || sha || preview || error ? (
                <Boto varietat="fantasma" type="button" disabled={ocupat} onClick={descartaTot}>
                  {tr('descarta')}
                </Boto>
              ) : null}
            </Accions>
          </Pila>
        </form>

        {ocupat ? (
          <Carregant etiqueta={faseOcupat === 'restaurant' ? tx.restaurantPaquet : tr('comprovant')} />
        ) : null}

        {error ? (
          <Alerta to="error">{tr(error)}</Alerta>
        ) : null}

        {!capacitat(port) ? (
          <Alerta to="info" viva={false} titol={tx.modeVerificacioLocalTitol}>{tr('senseCapacitat')}</Alerta>
        ) : !autoritzat || !municipi?.slug || !scopeKey ? (
          <Alerta to="info" viva={false} titol={tx.modeVerificacioLocalTitol}>{tr('sensePermis')}</Alerta>
        ) : null}

        {preview ? (
          <Pila gap={4}>
            <Alerta to="info" titol={tx.paquetVerificatTitol}>{tr('valid')}</Alerta>
            <h4>{tr('resum')}</h4>
            <p>{tr('municipi')}: {preview.nom}</p>
            <ul>
              {COLLECCIONS_RESUM.map(k => (
                <li key={k}>{tr(k)}: {preview.comptes[k] ?? 0}</li>
              ))}
            </ul>
            <p>SHA-256: <code>{preview.sha256}</code></p>
            {esParcial ? (
              <Alerta to="avis" viva={false} titol={tx.coberturaParcialTitol(colleccionsAmbDades, COLLECCIONS_RESUM.length)}>
                {tx.coberturaParcialText}
              </Alerta>
            ) : (
              <p>{tx.coberturaCompletaTitol(COLLECCIONS_RESUM.length)}</p>
            )}
            {municipi?.slug && !coincideix ? <Alerta to="avis">{tr('altreMunicipi')}</Alerta> : null}
            <p>{tr('limit')}</p>
            {potRestaurar ? (
              <Accions>
                <Boto disabled={ocupat || restaurat} onClick={() => void restaura()}>
                  {tr('restaura')}
                </Boto>
              </Accions>
            ) : null}
          </Pila>
        ) : null}

        {restaurat ? (
          <Alerta to="exit" titol={tx.restauracioConfirmadaTitol}>{tr('restaurat')}</Alerta>
        ) : null}
      </Pila>
    </section>
  );
}
