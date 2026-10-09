import { UniversalPage } from '../../components/universal/UniversalPage';
import { ContentProvider } from '../../components/universal/ContentProvider';

import { useSEO } from '../../hooks/useSEO';
import { useMur } from '../mur/MurContext';
import { useUIActions } from '../../app/contexts/UIContext';
import { Carregant, Boto } from '../../components/PedraSeca/index.js';
// T2 · El mateix estat d'error que el Mur (un sol contracte per a les dues seccions).
import { EstatErrorDades } from '../mur/EstatErrorDades.jsx';
/* Revisió del 261007 (M3-12) · Les props de la targeta d'un producte (boina,
   data, drets, foto, etiquetes) viuen a targetaDeProducte.js: la mostra del
   catàleg passa pel mateix camí.
   Esmena 2 del pla 261007_1645 · La targeta de cada producte és
   TargetaDelMercat (extracció pura del JSX d'ací): la mateixa de l'històric de
   l'actor (PublicacionsDeLActor) davall de l'editor de Notes. */
import { TargetaDelMercat } from './TargetaDelMercat.jsx';

/* Decisió 4 del Mestre (261007) · «Carregar-ne més». Un useMur sense
   paginació (un doble d'abans de la Decisió 4) no en porta: cap botó. */
const SENSE_MES = () => false;
const SENSE_ERROR = () => null;
const SENSE_CARREGA = async () => false;

export default function MercatSection() {
  const {
    sortedMarketItems, status, error, refresh,
    carregaMes = SENSE_CARREGA, hiHaMes = SENSE_MES, carregantMes = SENSE_MES, errorMes = SENSE_ERROR
  } = useMur();
  const { t } = useUIActions();
  /* Decisió 4 · Els productes de més enllà dels primers 50. hiHaMes ja inclou
     teCapacitat('paginacioSeccions'); si la càrrega falla, l'avís és el de
     sempre i «Torna-ho a provar» torna a demanar la mateixa pàgina. */
  const errorDeMes = errorMes('mercat');
  const mostraMes = () => carregaMes('mercat');

  useSEO({
    title: t('section.mercat.kicker', 'Mercat'),
    description: t('section.mercat.subtitle', 'Explora els productes i les ofertes disponibles.')
  });

  const config = {
    title: t('section.mercat.kicker', 'Mercat'),
    subtitle: t('section.mercat.title', 'Productes i intercanvis'),
    lead: t('section.mercat.subtitle', 'Explora els productes i les ofertes disponibles.'),
    chrome: "system",
    showLogos: true
  };

  return (
    <ContentProvider initialConfig={config}>
      <UniversalPage>
        {status === 'loading' ? <Carregant etiqueta={t('section.mercat.carregant', 'Carregant els productes…')} /> : null}
        {status === 'error'
          ? <EstatErrorDades titol={t('section.mercat.error', "No s'ha pogut carregar el Mercat")} error={error} onReintenta={refresh} />
          : null}
        {status === 'ready' && !sortedMarketItems.length ? <p role="status">
          {t('section.mercat.buit', 'Encara no hi ha productes publicats en este poble.')}
        </p> : null}
        <div className="sdp-card-grid">
          {/* Esmena 2 (261007_1645) · el descriptor, Connectar i el peu, a
              TargetaDelMercat: el JSX de sempre, píxel a píxel. */}
          {sortedMarketItems.map((item) => <TargetaDelMercat key={item.id} item={item} />)}
        </div>
        {/* Decisió 4 del Mestre (261007) · «Carregar-ne més», al final de la
            llista i només amb més pàgines. Sense, el DOM és el de sempre. */}
        {errorDeMes
          ? <EstatErrorDades titol={t('section.mercat.error', "No s'ha pogut carregar el Mercat")} error={errorDeMes} onReintenta={mostraMes} />
          : hiHaMes('mercat')
            ? (
              <div className="sdp-camp sdp-camp--centrat">
                <Boto carregant={carregantMes('mercat')} onClick={mostraMes}>{t('section.mur.loadMore', 'Mostra més')}</Boto>
              </div>
            )
            : null}
      </UniversalPage>
    </ContentProvider>
  );
}
