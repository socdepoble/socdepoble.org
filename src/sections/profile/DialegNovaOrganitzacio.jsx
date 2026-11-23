import { useMemo, useRef, useState } from 'react';
import { Dialeg, Boto, Camp, CampText, GrupOpcions, Selector } from '../../components/PedraSeca';
import { normalizeSlug, validateOrganization, readableBackendError } from '../onboarding/onboardingModel.js';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { useLlenguaDeLaUI } from './useLlenguaDeLaUI.js';
import { ERROR_SENSE_POBLE, pobleDOrganitzacio } from '../../data/pobleOrganitzacio.js';
import { opcionsDePoble, usePerfilOpcional } from './PerfilContext.jsx';
import { poblePrincipal } from './fitxaDePerfil.js';
import { normalitzaCodiIdiomaEntitats, textosEntitatsCompte } from './i18nEntitatsCompte.js';

function localitzaErrorsValidacio(nous, tx, codiIdioma) {
  if (codiIdioma === 'ca') return nous;
  const traduits = { ...nous };
  if (traduits.name) traduits.name = tx.errorNomLlargaria;
  if (traduits.slug) traduits.slug = tx.errorSlugFormat;
  if (traduits.description) traduits.description = tx.errorDescripcioLlargaria;
  if (traduits.town_name) {
    traduits.town_name = traduits.town_name === ERROR_SENSE_POBLE
      ? tx.errorSensePoble
      : tx.errorPobleMassaLlarg;
  }
  return traduits;
}

function localitzaErrorServidor(text, tx, codiIdioma) {
  const esSlug = /identificador|duplicate|unique|slug/i.test(text);
  if (codiIdioma === 'ca') {
    return esSlug ? { slug: text } : { general: text };
  }
  if (esSlug) return { slug: tx.errorSlugOcupat };
  if (text === 'S’ha produït un error inesperat.') return { general: tx.errorGeneral };
  return { general: text };
}

export function DialegNovaOrganitzacio({ obert, onTanca, onCrea }) {
  const llenguaUI = useLlenguaDeLaUI();
  const codiIdioma = normalitzaCodiIdiomaEntitats(llenguaUI);
  const tx = textosEntitatsCompte(codiIdioma);
  const { towns } = useCoreContent();
  const pobleDeLaPersona = usePerfilOpcional()?.identitats?.find((identitat) => identitat.mena === 'persona')?.dades?.town_name;
  const [nom, setNom] = useState('');
  const [slug, setSlug] = useState(null);
  const [kind, setKind] = useState('company');
  const [poble, setPoble] = useState(() => poblePrincipal(pobleDeLaPersona));
  const [errors, setErrors] = useState({});
  const [desant, setDesant] = useState(false);
  const enviant = useRef(false);

  const slugVisible = slug ?? normalizeSlug(nom);
  const tipusOpcions = useMemo(() => ([
    { valor: 'company', etiqueta: tx.companyEtiqueta, ajuda: tx.companyAjuda },
    { valor: 'group', etiqueta: tx.groupEtiqueta, ajuda: tx.groupAjuda },
  ]), [tx]);
  const opcionsPoble = useMemo(() => {
    const base = opcionsDePoble(towns, poble);
    if (codiIdioma === 'ca' || base[0]?.valor !== '') return base;
    return [{ valor: '', etiqueta: tx.triaPoble }, ...base.slice(1)];
  }, [towns, poble, codiIdioma, tx]);

  const envia = async (e) => {
    e?.preventDefault?.();
    if (enviant.current) return;
    const dades = { name: nom.trim(), slug: normalizeSlug(slugVisible), kind, town_name: poble.trim() };
    const nous = validateOrganization(dades);
    try {
      pobleDOrganitzacio(dades.town_name);
    } catch (error) {
      nous.town_name = error.message;
    }
    const localitzats = localitzaErrorsValidacio(nous, tx, codiIdioma);
    setErrors(localitzats);
    if (Object.keys(localitzats).length) return;

    enviant.current = true;
    setDesant(true);
    try {
      await onCrea(dades);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      const text = readableBackendError(err);
      setErrors(localitzaErrorServidor(text, tx, codiIdioma));
    } finally {
      enviant.current = false;
      setDesant(false);
    }
  };
  const tanca = (motiu) => { if (!enviant.current) onTanca?.(motiu); };

  const adreca = `/${kind === 'group' ? 'grup' : 'empresa'}/${normalizeSlug(slugVisible) || '…'}`;

  return (
    <Dialeg
      obert={obert}
      onTanca={tanca}
      titol={tx.novaOrgTitol}
      mida="s"
      descripcio={tx.novaOrgDescripcio}
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => tanca('boto')} disabled={desant}>{tx.cancellar}</Boto>
          <Boto varietat="primari" onClick={envia} carregant={desant}>{tx.crear}</Boto>
        </>
      )}
    >
      <form onSubmit={envia} noValidate aria-busy={desant}>
        {errors.general ? <p role="alert" className="sdp-camp__error">{errors.general}</p> : null}
        <Camp etiqueta={tx.nom} error={errors.name} obligatori>
          <CampText
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            maxLength={120}
            autoComplete="organization"
            disabled={desant}
          />
        </Camp>
        <GrupOpcions
          llegenda={tx.tipus}
          opcions={tipusOpcions}
          valor={kind}
          onCanvi={setKind}
          disabled={desant}
        />
        <Camp etiqueta={tx.poble} error={errors.town_name} obligatori>
          <Selector
            value={poble}
            onChange={(e) => setPoble(e.target.value)}
            opcions={opcionsPoble}
            disabled={desant}
          />
        </Camp>
        <Camp
          etiqueta={tx.identificador}
          error={errors.slug}
          ajuda={tx.ajudaAdreca(adreca)}
        >
          <CampText
            value={slugVisible}
            onChange={(e) => setSlug(e.target.value.toLowerCase())}
            autoCapitalize="none"
            spellCheck={false}
            disabled={desant}
          />
        </Camp>
      </form>
    </Dialeg>
  );
}

export default DialegNovaOrganitzacio;
