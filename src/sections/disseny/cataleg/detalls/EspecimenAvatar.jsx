import { Especimen } from '../Especimen.jsx';
import { Avatar, GrupAvatars } from '../../../../components/PedraSeca/index.js';

export default function EspecimenAvatar() {
  return (
    <Especimen id="avatar" nom="Avatar · GrupAvatars" fitxer="src/components/PedraSeca/atoms/Avatar.jsx"
      descripcio="Representació d'una persona o entitat. Mides tancades: xs 24 · sm 32 · md 44 (mínim tàctil) · lg 56 · xl 80, ràtio 1:1 exacte. Amb imatge, l'alt és el nom; sense imatge, les inicials són decoració i el nom el llig el lector de pantalla."
      contracte={[
        ['nom', 'string', '—', 'Nom complet: genera les inicials i el títol accessible.'],
        ['src', 'string', 'null', 'Imatge; només fonts segures (esFontImatgeSegura).'],
        ['mida', "'xs'|'sm'|'md'|'lg'|'xl'", "'md'", 'Qualsevol altre valor cau a md.']
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
