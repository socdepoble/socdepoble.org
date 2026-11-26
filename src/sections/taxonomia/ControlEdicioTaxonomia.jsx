/**
 * ControlEdicioTaxonomia.jsx — IDEA-375 (v1.2.26 · Disparador lleuger i lazy
 * d'Edició Directa de Categories, Etiquetes i Geografia).
 *
 * Visible únicament per a `superadmin` amb `nivell === 'aal2'` (autoritat real
 * de C26-3, mai pel nom visible del perfil). Carrega `PanellEdicioTaxonomia`
 * amb `lazyRoute` només quan s'obri (+0 B al nucli WP).
 */
import { Suspense, useState } from 'react';
import { Tags } from 'lucide-react';
import { Boto } from '../../components/PedraSeca/atoms/Boto.jsx';
import { useSessioOpcional } from '../../app/contexts/SessionContext.jsx';
import { BarreraDelTrosAccessori, lazyRoute } from '../../apps/plataforma/lazyRoute.js';
import { textosTaxonomiaV26 } from '../../data/taxonomia/i18nTaxonomiaV26.js';
import { useAccionsUITaxonomia } from './useTaxonomiaPaginaOverlay.js';

const PanellEdicioTaxonomia = lazyRoute(() => import('./PanellEdicioTaxonomia.jsx'));

export default function ControlEdicioTaxonomia({
  idPagina,
  categoriesSistemaInicials,
  categoriesTematiquesInicials,
  etiquetesInicials,
  geografiaInicial,
  onDesat
}) {
  const sessio = useSessioOpcional();
  const idioma = useAccionsUITaxonomia()?.language || 'ca';
  const [obert, setObert] = useState(false);

  if (sessio?.esSuperadmin !== true || sessio?.nivell !== 'aal2' || !idPagina) return null;
  const tx = textosTaxonomiaV26(idioma);

  return (
    <>
      <div className="sdp-alerta__accions sdp-alerta__accions--centrades">
        <Boto
          varietat="secundari"
          icona={Tags}
          aria-expanded={obert}
          onClick={() => setObert((actual) => !actual)}
        >
          {obert ? tx.taxonomiaV26EditorBotoTancar : tx.taxonomiaV26EditorBotoObrir}
        </Boto>
      </div>
      {obert ? (
        <BarreraDelTrosAccessori>
          <Suspense fallback={<p role="status">{tx.taxonomiaV26EditorCarregant}</p>}>
            <PanellEdicioTaxonomia
              idPagina={idPagina}
              categoriesSistemaInicials={categoriesSistemaInicials}
              categoriesTematiquesInicials={categoriesTematiquesInicials}
              etiquetesInicials={etiquetesInicials}
              geografiaInicial={geografiaInicial}
              onDesat={onDesat}
              onTanca={() => setObert(false)}
            />
          </Suspense>
        </BarreraDelTrosAccessori>
      ) : null}
    </>
  );
}
