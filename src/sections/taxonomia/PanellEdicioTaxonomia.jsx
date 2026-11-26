/**
 * PanellEdicioTaxonomia.jsx — IDEA-375 (v1.2.26 · Edició Directa de Categories,
 * Etiquetes i Geografia per a `superadmin` amb AAL2, acoblat al port C26-3).
 *
 * Carregat sempre via `lazyRoute` (+0 B al nucli WP d'arrencada).
 */
import { useEffect, useId, useRef, useState } from 'react';
import { Boto } from '../../components/PedraSeca/atoms/Boto.jsx';
import { Alerta } from '../../components/PedraSeca/molecules/Alerta.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { actualitzaTaxonomiaPagina, lligTaxonomiaPagina } from '../../data/backendPort.js';
import {
  CATEGORIES_CANONIQUES,
  ETIQUETES_COMUNES,
  SISTEMA_CATEGORIES_12
} from '../../data/taxonomia/taxonomiaCanonica.js';
import { capturaTaxonomiaPagina } from '../../data/taxonomia/taxonomiaPagina.js';
import { textosTaxonomiaV26 } from '../../data/taxonomia/i18nTaxonomiaV26.js';
import { useFullDiferit } from '../../config/fullDiferit.js';
import cssTaxonomiaV26 from '../../css/diferit-taxonomia-v26.css?inline';
import {
  idPaginaValidTaxonomia,
  registraOverlayTaxonomiaLocal,
  useAccionsUITaxonomia,
  useEstatUITaxonomia
} from './useTaxonomiaPaginaOverlay.js';

const parseComes = (text) => [...new Set(
  String(text || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
)];

const juntaComes = (llista) => (Array.isArray(llista) ? llista.join(', ') : '');

export default function PanellEdicioTaxonomia({
  idPagina: idPaginaCru,
  categoriesSistemaInicials = ['Sistema'],
  categoriesTematiquesInicials = [],
  etiquetesInicials = [],
  geografiaInicial = null,
  onDesat = null,
  onTanca = null
}) {
  const sessio = useSessioOpcional();
  const uiActions = useAccionsUITaxonomia();
  const uiState = useEstatUITaxonomia();
  const idioma = uiActions?.language || uiState?.language || 'ca';
  const externalConfig = uiState?.externalConfig || null;
  const tx = textosTaxonomiaV26(idioma);
  const arrelRef = useRef(null);
  const baseId = useId();
  useFullDiferit(arrelRef, 'taxonomia-v26', cssTaxonomiaV26);

  const autoritzat = sessio?.esSuperadmin === true && sessio?.nivell === 'aal2';
  const idPagina = idPaginaValidTaxonomia(idPaginaCru);

  const [versio, setVersio] = useState(0);
  const [categoriesSistema, setCategoriesSistema] = useState(() => (
    Array.isArray(categoriesSistemaInicials) && categoriesSistemaInicials.length > 0
      ? [...new Set(categoriesSistemaInicials)]
      : ['Sistema']
  ));
  const [categoriesTematiques, setCategoriesTematiques] = useState(() => [...new Set(categoriesTematiquesInicials || [])]);
  const [etiquetes, setEtiquetes] = useState(() => [...new Set(etiquetesInicials || [])]);
  const [novaEtiqueta, setNovaEtiqueta] = useState('');
  const [xarxa, setXarxa] = useState(() => juntaComes(geografiaInicial?.xarxa));
  const [demarcacions, setDemarcacions] = useState(() => juntaComes(geografiaInicial?.demarcacions));
  const [comarques, setComarques] = useState(() => juntaComes(geografiaInicial?.comarques));
  const [pobles, setPobles] = useState(() => juntaComes(geografiaInicial?.pobles));
  const [paratges, setParatges] = useState(() => juntaComes(geografiaInicial?.paratges));
  const [desant, setDesant] = useState(false);
  const [error, setError] = useState(null);
  const [missatgeOk, setMissatgeOk] = useState(null);

  useEffect(() => {
    if (!autoritzat || !idPagina || typeof lligTaxonomiaPagina !== 'function') return undefined;
    let viu = true;
    Promise.resolve(lligTaxonomiaPagina(idPagina, externalConfig))
      .then((res) => {
        if (!viu) return;
        const fila = res?.overlay ?? res ?? null;
        if (!fila || typeof fila !== 'object') return;
        if (Number.isSafeInteger(fila.versio)) setVersio(fila.versio);
        if (Array.isArray(fila.categoriesSistema) && fila.categoriesSistema.length > 0) {
          setCategoriesSistema(fila.categoriesSistema);
        }
        if (Array.isArray(fila.categoriesTematiques)) setCategoriesTematiques(fila.categoriesTematiques);
        if (Array.isArray(fila.etiquetes)) setEtiquetes(fila.etiquetes);
        if (fila.geografia && typeof fila.geografia === 'object') {
          setXarxa(juntaComes(fila.geografia.xarxa));
          setDemarcacions(juntaComes(fila.geografia.demarcacions));
          setComarques(juntaComes(fila.geografia.comarques));
          setPobles(juntaComes(fila.geografia.pobles));
          setParatges(juntaComes(fila.geografia.paratges));
        }
      })
      .catch(() => {});
    return () => { viu = false; };
  }, [autoritzat, idPagina, externalConfig]);

  if (!autoritzat || !idPagina) return null;

  const commuta = (llista, valor, setter) => {
    setError(null);
    setMissatgeOk(null);
    setter(llista.includes(valor) ? llista.filter((x) => x !== valor) : [...llista, valor]);
  };

  const afigEtiquetaLliure = () => {
    const noves = parseComes(novaEtiqueta);
    if (!noves.length) return;
    setEtiquetes((actual) => [...new Set([...actual, ...noves])]);
    setNovaEtiqueta('');
  };

  const desa = async (event) => {
    event.preventDefault();
    setError(null);
    setMissatgeOk(null);
    if (categoriesSistema.length === 0) {
      setError(tx.taxonomiaV26EditorErrorMinimSistema);
      return;
    }
    const geografia = {
      ...(parseComes(xarxa).length ? { xarxa: parseComes(xarxa) } : {}),
      ...(parseComes(demarcacions).length ? { demarcacions: parseComes(demarcacions) } : {}),
      ...(parseComes(comarques).length ? { comarques: parseComes(comarques) } : {}),
      ...(parseComes(pobles).length ? { pobles: parseComes(pobles) } : {}),
      ...(parseComes(paratges).length ? { paratges: parseComes(paratges) } : {})
    };
    let payloadValid;
    try {
      payloadValid = capturaTaxonomiaPagina(idPagina, {
        idPagina,
        categoriesSistema,
        categoriesTematiques,
        etiquetes,
        geografia,
        mencions: [],
        versio
      });
    } catch {
      setError(tx.taxonomiaV26EditorErrorDesat);
      return;
    }

    setDesant(true);
    try {
      const resposta = await actualitzaTaxonomiaPagina(idPagina, {
        categoriesSistema: payloadValid.categoriesSistema,
        categoriesTematiques: payloadValid.categoriesTematiques,
        etiquetes: payloadValid.etiquetes,
        geografia: payloadValid.geografia,
        mencions: payloadValid.mencions,
        versio: payloadValid.versio
      }, externalConfig);
      const desada = resposta?.overlay ?? resposta ?? { ...payloadValid, versio: versio + 1 };
      if (Number.isSafeInteger(desada.versio)) setVersio(desada.versio);
      registraOverlayTaxonomiaLocal(idPagina, desada);
      setMissatgeOk(tx.taxonomiaV26EditorDesatOk);
      onDesat?.(desada);
    } catch (err) {
      const codi = String(err?.code || err?.message || '').toLowerCase();
      setError(codi.includes('conflicte') || codi.includes('versio') || codi.includes('409')
        ? tx.taxonomiaV26EditorErrorConflicte
        : tx.taxonomiaV26EditorErrorDesat);
    } finally {
      setDesant(false);
    }
  };

  return (
    <section
      ref={arrelRef}
      className="sdp-taxonomia-editor"
      aria-labelledby={`${baseId}-titol`}
      data-testid="panell-edicio-taxonomia"
    >
      <h3 id={`${baseId}-titol`}>{tx.taxonomiaV26EditorTitol}</h3>
      <p>{tx.taxonomiaV26EditorSubtitol}</p>

      {error ? <Alerta to="error">{error}</Alerta> : null}
      {missatgeOk ? <Alerta to="exit">{missatgeOk}</Alerta> : null}

      <form onSubmit={desa} className="sdp-taxonomia-editor__camps-geo">
        <fieldset className="sdp-taxonomia-editor__fieldset">
          <legend>{tx.taxonomiaV26EditorCategoriesSistema}</legend>
          <div className="sdp-taxonomia-editor__caselles">
            {SISTEMA_CATEGORIES_12.map((cat) => (
              <label key={cat.id} className="sdp-taxonomia-editor__casella">
                <input
                  type="checkbox"
                  checked={categoriesSistema.includes(cat.nom)}
                  onChange={() => commuta(categoriesSistema, cat.nom, setCategoriesSistema)}
                />
                <span>{cat.labels[idioma] ?? cat.nom}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="sdp-taxonomia-editor__fieldset">
          <legend>{tx.taxonomiaV26EditorCategoriesTematiques}</legend>
          <div className="sdp-taxonomia-editor__caselles">
            {CATEGORIES_CANONIQUES.map((cat) => {
              const nomCa = cat.labels.ca;
              return (
                <label key={cat.id} className="sdp-taxonomia-editor__casella">
                  <input
                    type="checkbox"
                    checked={categoriesTematiques.includes(nomCa)}
                    onChange={() => commuta(categoriesTematiques, nomCa, setCategoriesTematiques)}
                  />
                  <span>{cat.labels[idioma] ?? nomCa}</span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="sdp-taxonomia-editor__fieldset">
          <legend>{tx.taxonomiaV26EditorEtiquetes}</legend>
          <div className="sdp-taxonomia-editor__caselles">
            {ETIQUETES_COMUNES.map((et) => (
              <label key={et.slug} className="sdp-taxonomia-editor__casella">
                <input
                  type="checkbox"
                  checked={etiquetes.includes(et.nom)}
                  onChange={() => commuta(etiquetes, et.nom, setEtiquetes)}
                />
                <span>{et.labels[idioma] ?? et.nom}</span>
              </label>
            ))}
          </div>
          <div className="sdp-taxonomia-editor__accions">
            <label htmlFor={`${baseId}-etiqueta-nova`} className="sdp-sr-only">
              {tx.taxonomiaV26EditorEtiquetaNova}
            </label>
            <input
              id={`${baseId}-etiqueta-nova`}
              type="text"
              value={novaEtiqueta}
              placeholder={tx.taxonomiaV26EditorEtiquetaNova}
              onChange={(e) => setNovaEtiqueta(e.target.value)}
            />
            <Boto varietat="secundari" type="button" onClick={afigEtiquetaLliure}>
              {tx.taxonomiaV26EditorAfegirEtiqueta}
            </Boto>
          </div>
        </fieldset>

        <fieldset className="sdp-taxonomia-editor__fieldset">
          <legend>{tx.taxonomiaV26EditorGeografia}</legend>
          <div className="sdp-taxonomia-editor__camps-geo">
            <label htmlFor={`${baseId}-xarxa`}>
              {tx.taxonomiaV26EditorXarxa}
              <input id={`${baseId}-xarxa`} type="text" value={xarxa} onChange={(e) => setXarxa(e.target.value)} />
            </label>
            <label htmlFor={`${baseId}-demarcacions`}>
              {tx.taxonomiaV26EditorDemarcacions}
              <input id={`${baseId}-demarcacions`} type="text" value={demarcacions} onChange={(e) => setDemarcacions(e.target.value)} />
            </label>
            <label htmlFor={`${baseId}-comarques`}>
              {tx.taxonomiaV26EditorComarques}
              <input id={`${baseId}-comarques`} type="text" value={comarques} onChange={(e) => setComarques(e.target.value)} />
            </label>
            <label htmlFor={`${baseId}-pobles`}>
              {tx.taxonomiaV26EditorPobles}
              <input id={`${baseId}-pobles`} type="text" value={pobles} onChange={(e) => setPobles(e.target.value)} />
            </label>
            <label htmlFor={`${baseId}-paratges`}>
              {tx.taxonomiaV26EditorParatges}
              <input id={`${baseId}-paratges`} type="text" value={paratges} onChange={(e) => setParatges(e.target.value)} />
            </label>
          </div>
        </fieldset>

        <div className="sdp-taxonomia-editor__accions">
          <Boto varietat="primari" type="submit" carregant={desant}>
            {desant ? tx.taxonomiaV26EditorDesant : tx.taxonomiaV26EditorDesar}
          </Boto>
          {typeof onTanca === 'function' ? (
            <Boto varietat="secundari" type="button" onClick={onTanca}>
              {tx.taxonomiaV26EditorBotoTancar}
            </Boto>
          ) : null}
        </div>
      </form>
    </section>
  );
}
