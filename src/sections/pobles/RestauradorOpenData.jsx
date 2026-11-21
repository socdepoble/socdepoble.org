import { useEffect, useRef, useState } from 'react';
import { PackageCheck } from 'lucide-react';
import { Accions, Alerta, Boto, Camp, CampFitxer, CampText, Carregant, EstatBuit, Pila } from '../../components/PedraSeca/index.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { useUIStateOpcional } from '../../app/contexts/UIContext.jsx';
import * as backendPort from '../../data/backendPort.js';
import { textosOpenDataEstats } from './i18nOpenDataEstats.js';
import {
  COLLECCIONS_RESUM,
  CONFIG_OPENDATA_BUIDA,
  MAXIM_BYTES_OPENDATA,
  TEXTOS_RESTAURADOR,
  teCapacitatRestauracioOpenData,
} from './restauradorOpenDataModel.js';

const llig = (...args) => import('../../data/importaMunicipiOpenData.js').then(m => m.llegeixPaquetOpenData(...args));
const importa = (...args) => import('../../data/importaMunicipiOpenData.js').then(m => m.importaMunicipiOpenData(...args));

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
export default function RestauradorOpenData({ municipi = null, scopeKey = '', port = backendPort, config = CONFIG_OPENDATA_BUIDA, autoritzat = false, introduccio = true, idioma }) {
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
  const potRestaurar = Boolean(coincideix && autoritzat && scopeKey && teCapacitatRestauracioOpenData(port));
  const esBuitInicial = Boolean(!fitxer && !sha && !preview && !error && !ocupat && !restaurat);

  async function comprova(event) {
    event.preventDefault();
    if (enVol.current) return;
    invalida();
    const actual = versio.current;
    enVol.current = true; setOcupat(true); setFaseOcupat('comprovant');
    try {
      if (!fitxer || fitxer.size <= 0 || fitxer.size > MAXIM_BYTES_OPENDATA || !/^[a-f0-9]{64}$/i.test(sha.trim())) throw new TypeError('fitxer');
      const bytes = new Uint8Array(await fitxer.arrayBuffer());
      if (bytes.byteLength > MAXIM_BYTES_OPENDATA || bytes.byteLength !== fitxer.size) throw new TypeError('mida');
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

        {!teCapacitatRestauracioOpenData(port) ? (
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
