import { useState } from 'react';
import { Dialeg, Boto, Camp, CampText, GrupOpcions, Selector } from '../../components/PedraSeca';
import { normalizeSlug, validateOrganization, readableBackendError } from '../onboarding/onboardingModel.js';

const TIPUS = Object.freeze([
  { valor: 'company', etiqueta: 'Empresa o negoci', ajuda: 'Una botiga, un taller, una cooperativa…' },
  { valor: 'group', etiqueta: 'Grup', ajuda: 'Penja d’una empresa que ja administres.' },
]);

/**
 * Crear una organització des del Perfil (I10). Abans el botó «NOVA ORG»
 * creava «Organització nova» sense preguntar res; ara es tria nom, tipus i,
 * per a un grup, l'empresa mare (sense mare, la política d'INSERT el
 * rebutjaria amb un error opac).
 *
 * L'identificador es deriva del nom fins que la persona el toca. Els errors
 * del servidor van al camp que toca: l'identificador repetit, a
 * «Identificador»; la resta, damunt del formulari.
 *
 * `onCrea(dades)` és una promesa: si falla, el diàleg continua obert.
 * `empresesMare`: [{ valor, etiqueta }] de les empreses que la persona mana.
 */
export function DialegNovaOrganitzacio({ obert, onTanca, onCrea, empresesMare = [] }) {
  const [nom, setNom] = useState('');
  const [slug, setSlug] = useState(null); // null = derivat del nom
  const [kind, setKind] = useState('company');
  const [mare, setMare] = useState('');
  const [errors, setErrors] = useState({});
  const [desant, setDesant] = useState(false);

  const slugVisible = slug ?? normalizeSlug(nom);
  const ambGrups = empresesMare.length > 0;

  const envia = async (e) => {
    e?.preventDefault?.();
    if (desant) return;
    const dades = {
      name: nom.trim(),
      slug: normalizeSlug(slugVisible),
      kind,
      ...(kind === 'group' ? { parentOrganizationId: mare } : {}),
    };
    const nous = validateOrganization(dades);
    if (kind === 'group' && !mare) nous.mare = 'Tria l’empresa de la qual penja el grup.';
    setErrors(nous);
    if (Object.keys(nous).length) return;

    setDesant(true);
    try {
      await onCrea(dades);
    } catch (err) {
      if (err?.name === 'AbortError') return;
      const text = readableBackendError(err);
      setErrors(/identificador/i.test(text) ? { slug: text } : { general: text });
    } finally {
      setDesant(false);
    }
  };

  const adreca = `/${kind === 'group' ? 'grup' : 'empresa'}/${normalizeSlug(slugVisible) || '…'}`;

  return (
    <Dialeg
      obert={obert}
      onTanca={onTanca}
      titol="Nova organització"
      mida="s"
      descripcio="Crea una empresa o un grup. Tu en seràs la persona propietària."
      accions={(
        <>
          <Boto varietat="secundari" onClick={() => onTanca?.('boto')} disabled={desant}>Cancel·lar</Boto>
          <Boto varietat="primari" onClick={envia} carregant={desant}>Crear</Boto>
        </>
      )}
    >
      {/* Sense classe: la que duia no existia a cap full (Porta Vocabulari) i
          els Camp de Pedra Seca ja porten el seu espaiat. */}
      <form onSubmit={envia} noValidate>
        {errors.general ? <p role="alert" className="sdp-camp__error">{errors.general}</p> : null}
        <Camp etiqueta="Nom" error={errors.name} obligatori>
          <CampText
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            maxLength={120}
            autoComplete="organization"
          />
        </Camp>
        <GrupOpcions
          llegenda="Tipus"
          opcions={ambGrups ? TIPUS : TIPUS.slice(0, 1)}
          valor={kind}
          onCanvi={setKind}
        />
        {ambGrups ? null : (
          <p className="sdp-camp__ajuda">Per a crear un grup, primer has d’administrar una empresa.</p>
        )}
        {kind === 'group' ? (
          <Camp etiqueta="Empresa mare" error={errors.mare} obligatori>
            <Selector
              value={mare}
              onChange={(e) => setMare(e.target.value)}
              opcions={[{ valor: '', etiqueta: 'Tria una empresa…' }, ...empresesMare]}
            />
          </Camp>
        ) : null}
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
          />
        </Camp>
      </form>
    </Dialeg>
  );
}

export default DialegNovaOrganitzacio;
