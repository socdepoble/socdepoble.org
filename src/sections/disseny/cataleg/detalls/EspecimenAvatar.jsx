import { Especimen } from '../Especimen.jsx';
import { Avatar, GrupAvatars } from '../../../../components/PedraSeca/index.js';
/* Onada 6 (tasca 12) · La cara de la IAIA al xat, sense cap fitxer nou. */
import { CARA_DE_LA_IAIA } from '../../../../data/xatsPerDefecte.js';

export default function EspecimenAvatar() {
  return (
    <Especimen id="avatar" nom="Avatar · GrupAvatars" fitxer="src/components/PedraSeca/atoms/Avatar.jsx"
      descripcio="Representació d'una persona o entitat. Mides tancades: xs 24 · sm 32 · md 44 (mínim tàctil) · lg 56 · xl 80, ràtio 1:1 exacte. Amb imatge, l'alt és el nom; sense imatge, les inicials són decoració i el nom el llig el lector de pantalla."
      contracte={[
        ['nom', 'string', '—', 'Nom complet: genera les inicials i el títol accessible.'],
        ['src', 'string', 'null', 'Imatge; només fonts segures (esFontImatgeSegura).'],
        ['mida', "'xs'|'sm'|'md'|'lg'|'xl'", "'md'", 'Qualsevol altre valor cau a md.'],
        ['enquadrament', "null | 'iaia'", 'null', 'Onada 6 · Variant additiva: amb imatge, el cercle talla i la imatge s’amplia i es desplaça fins al tros que diu el nom (modules.css). «iaia» és la cara de la IAIA a «Festa del Poble». Un altre nom, cap canvi.']
      ]}
      a11y={['Amb imatge: alt = nom. Sense: inicials aria-hidden + nom en .sdp-nomes-lector.', 'Per davall de md l’avatar no pot ser interactiu.']}
      fes={['GrupAvatars per a apilar-los (solapament de 10px).']}
      noFacis={['Inventar mides: prohibit fora de les cinc.', 'Colors fora de les variables semàntiques.']}>
      <div className="sdp-especimen__fila">
        <Avatar nom="Joan Baptiste" mida="xs" />
        <Avatar nom="Maria la Vall" mida="sm" />
        <Avatar nom="Vicent Ferris" mida="md" />
        <Avatar nom="Pepica la Vall" mida="lg" />
        <Avatar nom="IAIA MarIA" mida="xl" />
        <Avatar nom="Sóc de Poble" mida="xl" src="/assets/system/ui/logo-socdepoble-cuadrat-verd.svg" />
      </div>
      <h4>Enquadrament: la cara de la IAIA al xat</h4>
      <div className="sdp-especimen__fila">
        <Avatar nom="IAIA MarIA" mida="sm" src={CARA_DE_LA_IAIA.src} enquadrament={CARA_DE_LA_IAIA.enquadrament} />
        <Avatar nom="IAIA MarIA" mida="md" src={CARA_DE_LA_IAIA.src} enquadrament={CARA_DE_LA_IAIA.enquadrament} />
        <Avatar nom="IAIA MarIA" mida="lg" src={CARA_DE_LA_IAIA.src} enquadrament={CARA_DE_LA_IAIA.enquadrament} />
        <Avatar nom="IAIA MarIA" mida="xl" src={CARA_DE_LA_IAIA.src} enquadrament={CARA_DE_LA_IAIA.enquadrament} />
      </div>
      <h4>Grup</h4>
      <GrupAvatars>
        <Avatar nom="Joan Baptiste" mida="md" />
        <Avatar nom="Maria la Vall" mida="md" />
        <Avatar nom="Vicent Ferris" mida="md" />
        <Avatar nom="+4" mida="md" />
      </GrupAvatars>
    </Especimen>
  );
}
