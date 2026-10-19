import { useMemo, useRef, useState } from 'react';
import { Dialeg, Boto, Camp, CampText, GrupOpcions, Selector } from '../../components/PedraSeca';
import { normalizeSlug, validateOrganization, readableBackendError } from '../onboarding/onboardingModel.js';
import { useCoreContent } from '../../app/contexts/CoreContentContext.jsx';
import { pobleDOrganitzacio } from '../../data/pobleOrganitzacio.js';
import { opcionsDePoble, usePerfilOpcional } from './PerfilContext.jsx';
import { poblePrincipal } from './fitxaDePerfil.js';

const TIPUS = Object.freeze([
  { valor: 'company', etiqueta: 'Empresa o negoci', ajuda: 'Una botiga, un taller, una cooperativa…' },
  { valor: 'group', etiqueta: 'Grup', ajuda: 'Una colla, una associació, un col·lectiu…' },
]);

/**
 * Crear una organització des del Perfil (I10). Abans el botó «NOVA ORG»
 * creava «Organització nova» sense preguntar res; ara es tria nom i tipus.
 *
 * Ordre del Mestre (261008) · «Un grup no té per què pertànyer a cap
 * empresa»: el camp «Empresa mare» ja no existix i «Grup» sempre s'oferix.
 * El servidor ja accepta un grup sense mare (2610081400) i el domini només
 * envia la mare si en ve una (organizations.js).
 *
 * L'identificador es deriva del nom fins que la persona el toca. Els errors
 * del servidor van al camp que toca: l'identificador repetit, a
 * «Identificador»; la resta, damunt del formulari.
 *
 * Gauntlet 261016 (Bloc 3.5.2; ordre del Mestre: «Tota entitat creada ha de
 * portar el seu poble») · «Poble» és obligatori: el selector de sempre del
 * poble d'una organització (opcionsDePoble, el de «El compte», amb els pobles
 * del contingut core), que naix amb el poble de qui la crea si en té. Sense
 * poble no s'envia res; el domini i l'adaptador també l'exigixen
 * (data/pobleOrganitzacio.js).
 *
 * Pla 261018_1605 (Tasca 2, D5; ordre del Mestre, 18-10-2026) · Una persona
 * pot ser de més d'un poble ('A · B', el primer el principal): l'organització
 * nova naix NOMÉS amb el principal (poblePrincipal), mai amb la cadena sencera.
 *
 * `onCrea(dades)` és una promesa: si falla, el diàleg continua obert.
 */
export function DialegNovaOrganitzacio({ obert, onTanca, onCrea }) {
  const { towns } = useCoreContent();
  const pobleDeLaPersona = usePerfilOpcional()?.identitats?.find((identitat) => identitat.mena === 'persona')?.dades?.town_name;
  const [nom, setNom] = useState('');
  const [slug, setSlug] = useState(null); // null = derivat del nom
  const [kind, setKind] = useState('company');
  const [poble, setPoble] = useState(() => poblePrincipal(pobleDeLaPersona));
  const [errors, setErrors] = useState({});
  const [desant, setDesant] = useState(false);
  const enviant = useRef(false);

  const slugVisible = slug ?? normalizeSlug(nom);
  const opcionsPoble = useMemo(() => opcionsDePoble(towns, poble), [towns, poble]);

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
    setErrors(nous);
    if (Object.keys(nous).length) return;

    enviant.current = true;
    setDesant(true);
    try {
      await onCrea(dades);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      const text = readableBackendError(err);
      setErrors(/identificador/i.test(text) ? { slug: text } : { general: text });
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
      titol="Nova organització"
      mida="s"
      descripcio="Crea una empresa o un grup. Tu en seràs la persona propietària."
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => tanca('boto')} disabled={desant}>Cancel·lar</Boto>
          <Boto varietat="primari" onClick={envia} carregant={desant}>Crear</Boto>
        </>
      )}
    >
      {/* Sense classe: la que duia no existia a cap full (Porta Vocabulari) i
          els Camp de Pedra Seca ja porten el seu espaiat. */}
      <form onSubmit={envia} noValidate aria-busy={desant}>
        {errors.general ? <p role="alert" className="sdp-camp__error">{errors.general}</p> : null}
        <Camp etiqueta="Nom" error={errors.name} obligatori>
          <CampText
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            maxLength={120}
            autoComplete="organization"
            disabled={desant}
          />
        </Camp>
        <GrupOpcions
          llegenda="Tipus"
          opcions={TIPUS}
          valor={kind}
          onCanvi={setKind}
          disabled={desant}
        />
        <Camp etiqueta="Poble" error={errors.town_name} obligatori>
          <Selector
            value={poble}
            onChange={(e) => setPoble(e.target.value)}
            opcions={opcionsPoble}
            disabled={desant}
          />
        </Camp>
        <Camp
          etiqueta="Identificador"
          error={errors.slug}
          ajuda={`Adreça pública: ${adreca}. No es podrà canviar.`}
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
