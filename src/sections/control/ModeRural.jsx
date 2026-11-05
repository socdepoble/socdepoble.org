import { useEffect, useRef, useState } from 'react';
import { UniversalPage } from '../../components/universal/UniversalPage.jsx';
import { Alerta, Boto, Camp, CampText, AreaText, CampFitxer, DialegConfirmacio } from '../../components/PedraSeca/index.js';
import { useUIState } from '../../app/contexts/UIContext.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { useIdentitatOpcional } from '../../app/contexts/IdentitatContext.jsx';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { normalizeBackendConfig } from '../../config/backendConfig.js';
import { sanejaEtiqueta, sanejaIdentificador } from '../../config/configAmfitrio.js';
import { tradueix, useTraductorOpcional } from '../../components/PedraSeca/hooks/useTraductorOpcional.js';
import { capturaSessio, entradaSessio } from '../../data/identitat.js';
import { creaSessioRural, lligJsonRural } from '../../data/sessioRural.js';
import { TEXTOS_MODE_RURAL as TX } from './textosModeRural.js';

const MAX_FITXER = 4 * 1024 * 1024;
/* control-06 (revisió del Panell, 261104) · L'error porta un codi i executa()
   el pinta traduït (TX.fitxerGran); el missatge és la reserva. */
async function textDeFitxer(fitxer) {
  if (!fitxer || fitxer.size > MAX_FITXER) throw Object.assign(new Error(TX.fitxerGran[1]), { code: 'RURAL_FITXER_GRAN' });
  return fitxer.text();
}

/* control-02 (revisió del Panell, 261104) · El poble del Mode rural.
   `tenantId` és l'UUID de public.towns i les fitxes de `towns` (la llavor, el
   local i l'app_content remot) porten l'id slug i el camp `title`
   (configAmfitrio.js): `towns.find(p => p.id === tenantId)?.name` no casava
   mai, i el text pendent, TRADUÏT a l'idioma de la interfície, es gravava com
   a `municipi` de cada nota i del paquet d'emergència signat.
   · El nom: el de la fitxa del tenant (`id` o, si el catàleg el declara,
     `tenant_id`), amb `name` o `title` i les guardes de FitxaOpenData.jsx.
   · La dada gravada: eixe nom; sense, el tenant (estable i sense idioma) i,
     sense tenant (llavor), la reserva canònica. Mai el traductor ni la
     configuració de l'amfitrió, un global que qualsevol script pot escriure.
   · El text visible: el nom; sense, el de la fitxa del poble que declara
     l'amfitrió (`poble`, per id o slug, com pobleAmfitrio.js) o el seu
     `nomPoble`; si no, el text pendent traduït, com abans. Ja no es pinta el
     slug cru ni `townName`, que no és cap clau del contracte d'amfitrió. */
function nomDeLaFitxa(towns, casa) {
  const fitxa = Array.isArray(towns) ? towns.find(town => town && casa(town)) : null;
  const nom = typeof fitxa?.name === 'string' ? fitxa.name.trim() : typeof fitxa?.title === 'string' ? fitxa.title.trim() : '';
  return nom && nom.length <= 120 && !/[<>\u0000-\u001f\u007f]/.test(nom) ? nom : '';
}
const esDelTenant = tenant => town => [town.id, town.tenant_id].some(valor => typeof valor === 'string' && valor.toLowerCase() === tenant);
const esDelPoble = poble => town => String(town.id) === poble || (town.slug != null && String(town.slug) === poble);

export default function ModeRural({ onBack, fabrica = creaSessioRural, vistaRef }) {
  const t = useTraductorOpcional();
  const sessio = useSessioOpcional();
  const identitat = useIdentitatOpcional();
  const { externalConfig } = useUIState();
  const { towns } = useCoreContent();
  const c = normalizeBackendConfig(externalConfig || {});
  const abast = { persona: `${sessio?.currentUser?.id || 'anon'}::${identitat?.actorKey || 'persona'}`, tenant: c.tenantId || 'local', endpoint: c.backendUrl || (c.dataMode === 'remote' ? '' : c.dataMode), mode: c.dataMode };
  const delTenant = c.tenantId ? nomDeLaFitxa(towns, esDelTenant(String(c.tenantId).toLowerCase())) : '';
  const poblePerfilCru = sessio?.currentUser?.town_name || sessio?.currentUser?.poble || sessio?.currentUser?.location || identitat?.activa?.poble || identitat?.usuari?.poble || '';
  const poblePerfilId = sanejaIdentificador(poblePerfilCru);
  const delPerfil = (poblePerfilId ? nomDeLaFitxa(towns, esDelPoble(poblePerfilId)) : '') || sanejaEtiqueta(poblePerfilCru);
  const poble = sanejaIdentificador(externalConfig?.poble);
  const delAmfitrio = poble ? nomDeLaFitxa(towns, esDelPoble(poble)) : '';
  const municipi = delTenant || delPerfil || c.tenantId || TX.municipiPendent[1];
  const nomVisible = delTenant || delPerfil || delAmfitrio || sanejaEtiqueta(externalConfig?.nomPoble) || tradueix(t, TX.municipiPendent);
  return <ModeRuralDins key={JSON.stringify([abast, entradaSessio(), sessio?.generacio ?? null])} abast={abast} municipi={municipi} nomVisible={nomVisible} potEntrar={Boolean(sessio?.currentUser?.id)} onBack={onBack} fabrica={fabrica} vistaRef={vistaRef} />;
}

function ModeRuralDins({ abast, municipi, nomVisible, potEntrar, onBack, fabrica, vistaRef }) {
  const t = useTraductorOpcional();
  const tr = clau => tradueix(t, TX[clau]);
  const motor = useRef(null);
  const sessioCapturada = useRef(null);
  if (!sessioCapturada.current) sessioCapturada.current = capturaSessio();
  const vigent = () => sessioCapturada.current();
  const viu = useRef(false);
  const enVol = useRef(false);
  const lectures = useRef(0);
  const requerixOpfs = useRef(false);
  const [ocupat, setOcupat] = useState(false);
  const [error, setError] = useState('');
  const [estat, setEstat] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [clauPublica, setClauPublica] = useState('');
  const [preparat, setPreparat] = useState(null);
  const [confirmaEsborrat, setConfirmaEsborrat] = useState(false);
  const [edicio, setEdicio] = useState(null);
  const [notaPerEsborrar, setNotaPerEsborrar] = useState(null);
  /* control-04 (261104) · L'error ha nascut d'una confirmació: es pinta dins
     del seu diàleg mentre és obert (vegeu els DialegConfirmacio de baix). */
  const [errorDelDialeg, setErrorDelDialeg] = useState(false);
  const [avis, setAvis] = useState('');
  const opfsDisponible = typeof globalThis.navigator?.storage?.getDirectory === 'function' && typeof globalThis.navigator?.locks?.request === 'function';
  function netejaVista() {
    lectures.current++; setEstat(null); setPreparat(null); setClauPublica(''); setConfirmaEsborrat(false);
    setEdicio(null); setNotaPerEsborrar(null); setAvis(''); setTitle(''); setContent('');
  }
  useEffect(() => { viu.current = true; return () => { viu.current = false; motor.current?.close(); motor.current = null; }; }, []);

  async function executa(accio, { desDelDialeg = false } = {}) {
    if (enVol.current) return;
    enVol.current = true; setOcupat(true); setError(''); setErrorDelDialeg(false);
    try { vigent(); await accio(); vigent(); }
    catch (e) {
      if (viu.current) {
        if (e.code === 'SDP-RURAL-GENERACIO' || e.name === 'AbortError') {
          motor.current?.close(); motor.current = null; netejaVista();
        }
        setErrorDelDialeg(desDelDialeg);
        setError(e.name === 'AbortError' ? tr('sessioCanviada') : e.code === 'RURAL_DIARI_PLE' ? tr('diariPle') : e.code === 'SDP-RURAL-GENERACIO' ? tr('canviGeneracio')
          : e.code === 'RURAL_FITXER_GRAN' ? tr('fitxerGran')
          : e.code === 'SDP-RURAL-OPFS-COMMIT-DESCONEGUT' ? tr('crdtCommitDesconegut') : typeof e.code === 'string' && e.code.includes('QUOTA') ? tr('crdtQuota')
            : e.message === e.code && typeof e.code === 'string' && e.code.startsWith('RURAL_CRDT_') ? tr('crdtInvalid') : e.message || String(e));
      }
    }
    finally { enVol.current = false; if (viu.current) setOcupat(false); }
  }
  async function actualitza() {
    const m = motor.current, n = ++lectures.current;
    if (!m) return null;
    const e = await m.estat(); vigent();
    if (requerixOpfs.current && (e.motor !== 'opfs' || e.crdt !== true)) throw new Error(tr('opfsInvalid'));
    if (viu.current && motor.current === m && n === lectures.current) setEstat(e);
    return e;
  }
  async function activa(perfil = 'legacy') {
    requerixOpfs.current = perfil === 'opfs';
    const creada = await fabrica({ abast, municipi, comprovaAbast: vigent, ...(perfil === 'opfs' ? { motor: 'opfs', crdt: true } : {}),
      onCanvi: () => { if (viu.current && motor.current) void actualitza().catch(e => { if (viu.current) setError(e.message || tr('crdtInvalid')); }); },
      onInvalidada: cause => {
        if (!viu.current) return;
        motor.current = null; netejaVista(); setError(tr(cause?.name === 'AbortError' ? 'sessioCanviada' : 'canviGeneracio'));
      } });
    if (!viu.current) { creada.close(); return; }
    try { vigent(); } catch (cause) { creada.close(); throw cause; }
    motor.current = creada;
    try { await actualitza(); }
    catch (e) { creada.close(); motor.current = null; if (viu.current) netejaVista(); throw e; }
  }
  async function obriEdicio(nota) {
    const draft = await motor.current.preparaEdicio(nota.id); vigent();
    if (!viu.current) return;
    setEdicio({ ...draft, resol: [], metadades: {} }); setTitle(draft.nota.title); setContent(draft.nota.content);
  }
  function triaVariant(camp, valor) {
    if (camp === 'title') setTitle(valor);
    setEdicio(actual => ({ ...actual, resol: [...new Set([...actual.resol, camp])],
      metadades: camp === 'title' ? actual.metadades : { ...actual.metadades, [camp]: valor } }));
  }
  const campsVariants = { title: 'campTitle', slug: 'campSlug', folderId: 'campFolderId', tags: 'campTags', prioritat: 'campPrioritat', updatedAt: 'campUpdatedAt' };
  const textVariant = v => typeof v === 'string' ? v : Array.isArray(v) && v.every(t => typeof t === 'string') ? v.join(', ') : JSON.stringify(v);
  function prepara(nom, dades) { vigent(); if (viu.current) setPreparat({ nom, text: JSON.stringify(dades, null, 2) }); }
  function descarrega() {
    try { vigent(); } catch { motor.current?.close(); motor.current = null; netejaVista(); setError(tr('sessioCanviada')); return; }
    const url = URL.createObjectURL(new Blob([preparat.text], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = preparat.nom; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function importa(event, tipus) {
    const fitxer = event.target.files?.[0]; event.target.value = '';
    if (!fitxer) return;
    void executa(async () => {
      const text = await textDeFitxer(fitxer); vigent();
      if (!viu.current || !motor.current) return;
      if (tipus === 'vault') await motor.current.importaVault(text);
      else await motor.current.importaDelta(text, lligJsonRural(clauPublica));
      await actualitza();
    });
  }
  return <UniversalPage title={tr('titol')} subtitle={tr('subtitol')} lead={tr('lead')} onBack={onBack} chrome="system" traduccio={false}>
    <div ref={vistaRef} className="content-wrapper">
      <h3>{tr('localTitol')}</h3>
      <p>{nomVisible}</p>
      <div className="sdp-mode-rural__punts">
        <h4>{tr('perAQueTitol')}</h4>
        <p>{tr('punt1')}</p>
        <p>{tr('punt2')}</p>
        <p>{tr('punt3')}</p>
      </div>
      {!potEntrar ? <p>{tr('entra')}</p> : !estat ? <>
        <Boto carregant={ocupat} onClick={() => void executa(() => activa())}>{tr('activa')}</Boto>
        <Boto disabled={ocupat || !opfsDisponible} onClick={() => void executa(() => activa('opfs'))}>{tr('activaOpfs')}</Boto>
        <p>{tr('ajudaOpfs')}</p>{!opfsDisponible ? <p>{tr('opfsNoDisponible')}</p> : null}
      </> : <>
        <p>{tr('local')}</p>
        {estat.crdt && estat.motor === 'opfs' ? <><p>{tr('crdtActiu')}</p><Boto disabled={ocupat} onClick={() => void executa(actualitza)}>{tr('refresca')}</Boto>{estat.dependenciesPendents ? <Alerta>{tr('dependenciesPendents')}</Alerta> : null}</> : null}
        <p>{tr('limitCua')}: {Math.ceil(estat.bytesCua / 1024)} / {Math.ceil(estat.limitBytesCua / 1024)} KiB</p>
        <Boto disabled={ocupat || !estat.pendents} onClick={() => void executa(async () => { const nou = await motor.current.consolidaDiari(); vigent(); if (viu.current) setEstat(nou); })}>{tr('consolida')}</Boto>
        <p>{tr('ajudaConsolida')}</p>
        <p role="status">{tr('cua')}: {estat.pendents}. {estat.cadenaValida ? tr('cadena') : ''}</p>
        <Boto disabled={ocupat} onClick={() => { motor.current.close(); motor.current = null; netejaVista(); }}>{tr('desactiva')}</Boto>
        <section aria-label={tr('nota')}>
          <h3>{tr('nota')}</h3>
          {edicio ? <p>{tr('ajudaEdicio')}</p> : null}
          <form key={edicio?.nota.id ?? 'nova'} onSubmit={e => { e.preventDefault(); void executa(async () => {
            if (edicio) await motor.current.editaNota({ id: edicio.nota.id, title, content, base: edicio.base, resol: edicio.resol, metadades: edicio.metadades });
            else await motor.current.desaNota({ title, content });
            if (!viu.current) return; setEdicio(null); setTitle(''); setContent(''); await actualitza();
          }); }}>
            <Camp etiqueta={tr('titolNota')} obligatori><CampText autoFocus={Boolean(edicio)} value={title} maxLength={200} onChange={e => setTitle(e.target.value)} disabled={ocupat} /></Camp>
            <Camp etiqueta={tr('cosNota')} obligatori={!edicio}><AreaText value={content} maxLength={edicio ? 100000 : 20000} onChange={e => setContent(e.target.value)} disabled={ocupat} /></Camp>
            <Boto tipus="submit" disabled={ocupat || !title.trim() || (!edicio && !content.trim())}>{tr(edicio ? 'desaCanvis' : 'desa')}</Boto>
            {edicio ? <Boto disabled={ocupat} onClick={() => { setEdicio(null); setTitle(''); setContent(''); }}>{tr('cancelaEdicio')}</Boto> : null}
          </form>
          {edicio && Object.keys(edicio.nota.variants ?? {}).length ? <section aria-label={tr('variantsTitol')}><h4>{tr('variantsTitol')}</h4>
            {Object.entries(edicio.nota.variants).map(([camp, valors]) => <section key={camp}><h5>{tr(campsVariants[camp])}</h5>
              <ul>{valors.map((valor, i) => <li key={i}><p>{textVariant(valor)}</p>
                <Boto disabled={ocupat} aria-label={`${tr('triaVariant')}: ${tr(campsVariants[camp])} · ${textVariant(valor)}`} onClick={() => triaVariant(camp, valor)}>{tr('triaVariant')}</Boto></li>)}</ul>
              {edicio.resol.includes(camp) ? <p>{tr('variantTriada')}</p> : null}
            </section>)}
          </section> : null}
        </section>
        <section aria-label={tr('carpeta')}><h3>{tr('carpeta')}</h3>{estat.crdt ? <p>{tr('carpetaCrdtAjuda')}</p> : null}
          <Boto disabled={ocupat} onClick={() => void executa(async () => prepara(estat.crdt ? 'notes-rurals-crdt.json' : 'notes-rurals.json', await motor.current.exportaVault()))}>{tr('exportaVault')}</Boto>
          <Camp etiqueta={tr('importaVault')}><CampFitxer accept=".json,application/json" disabled={ocupat} onChange={e => importa(e, 'vault')} /></Camp>
          {typeof globalThis.showDirectoryPicker === 'function' ? <Boto disabled={ocupat} onClick={() => void executa(async () => { const handle = await globalThis.showDirectoryPicker({ mode: 'readwrite' }); vigent(); if (!viu.current) return; const resultat = await motor.current.sincronitzaCarpeta(handle); vigent(); if (!viu.current) return; setAvis(resultat.sincronitzacio?.incorporacionsSenseBase ? tr('carpetaSenseBase') : ''); await actualitza(); })}>{tr('sincronitza')}</Boto> : null}
        </section>
        <section aria-label={tr('pont')}><h3>{tr('pont')}</h3><p>{tr('origenDispositiu')}</p>
          <Boto disabled={ocupat} onClick={() => void executa(async () => { const { delta, publicKeyJwk } = await motor.current.exportaDelta(); prepara('emergencia.sdp-dtn-delta.json', delta); if (viu.current) setClauPublica(JSON.stringify(publicKeyJwk, null, 2)); })}>{tr('exportaDelta')}</Boto>
          <Camp etiqueta={tr('publica')} ajuda={tr('ajudaClau')}><AreaText value={clauPublica} onChange={e => setClauPublica(e.target.value)} maxLength={4096} disabled={ocupat} /></Camp>
          <Camp etiqueta={tr('importaDelta')}><CampFitxer accept=".json,application/json" disabled={ocupat || !clauPublica.trim()} onChange={e => importa(e, 'delta')} /></Camp>
        </section>
        <section aria-label={tr('rebudes')}><h3>{tr('rebudes')}</h3>
          <ul>{estat.notes.map(n => <li key={n.id}><strong>{n.title}</strong><p>{n.content}</p>
            {estat.crdt ? <>{Object.keys(n.variants ?? {}).length ? <p>{tr('variantsAvis')}</p> : null}
              <Boto disabled={ocupat || Boolean(edicio)} aria-label={`${tr('edita')}: ${n.title}`} onClick={() => void executa(() => obriEdicio(n))}>{tr('edita')}</Boto>
              <Boto disabled={ocupat || Boolean(edicio)} aria-label={`${tr('eliminaNota')}: ${n.title}`} onClick={() => void executa(async () => { const draft = await motor.current.preparaEdicio(n.id); vigent(); if (viu.current) setNotaPerEsborrar(draft); })}>{tr('eliminaNota')}</Boto>
            </> : null}
          </li>)}{estat.bans.filter(n => !estat.notes.some(nota => nota.id === n.id)).map(n => <li key={n.id}><strong>{n.payload.title}</strong><p>{n.payload.content}</p></li>)}</ul>
        </section>
        <section aria-label={tr('retencioTitol')}><h3>{tr('retencioTitol')}</h3><p>{tr('retencioText')}</p>
          <Boto disabled={ocupat} onClick={() => setConfirmaEsborrat(true)}>{tr('esborra')}</Boto>
        </section>
      </>}
      {/* control-04 (revisió del Panell, 261104) · Amb un diàleg obert, el
          fons és inert: l'error d'una confirmació fallida es pinta dins del
          diàleg, com a DetallPrivacitat.jsx, i només allí. Abans es pintava
          fora, darrere del vel, i el diàleg es quedava obert sense dir res.
          En Cancel·lar, l'error torna a la pàgina. Un error d'abans d'obrir el
          diàleg no hi entra: es queda on era. */}
      <DialegConfirmacio obert={confirmaEsborrat} onTanca={() => setConfirmaEsborrat(false)} destructiu carregant={ocupat}
        titol={tr('esborra')} descripcio={tr('esborraDescripcio')} etiquetaConfirma={tr('esborraConfirma')} etiquetaCancela={tr('cancela')}
        onConfirma={() => void executa(async () => {
          await motor.current.esborraTot();
          if (!viu.current) return;
          motor.current = null; netejaVista();
        }, { desDelDialeg: true })}>
        {confirmaEsborrat && errorDelDialeg && error ? <Alerta to="error">{error}</Alerta> : null}
      </DialegConfirmacio>
      <DialegConfirmacio obert={Boolean(notaPerEsborrar)} onTanca={() => setNotaPerEsborrar(null)} destructiu carregant={ocupat}
        titol={tr('eliminaNota')} descripcio={tr('eliminaNotaAjuda')} etiquetaConfirma={tr('eliminaConfirma')} etiquetaCancela={tr('cancela')}
        onConfirma={() => void executa(async () => {
          await motor.current.eliminaNota({ id: notaPerEsborrar.nota.id, base: notaPerEsborrar.base });
          if (!viu.current) return; setNotaPerEsborrar(null); await actualitza();
        }, { desDelDialeg: true })}>
        {notaPerEsborrar && errorDelDialeg && error ? <Alerta to="error">{error}</Alerta> : null}
      </DialegConfirmacio>
      {avis ? <Alerta>{avis}</Alerta> : null}
      {error && !(errorDelDialeg && (confirmaEsborrat || notaPerEsborrar)) ? <Alerta to="error">{error}</Alerta> : null}
      {preparat ? <section aria-label={tr('preparat')}><h3>{tr('preparat')}: {preparat.nom}</h3><Camp etiqueta={tr('contingut')}><AreaText value={preparat.text} readOnly /></Camp><Boto onClick={descarrega}>{tr('descarrega')}</Boto></section> : null}
    </div>
  </UniversalPage>;
}
