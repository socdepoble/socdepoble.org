/**
 * EspecimenIconesAlergens.jsx — les icones dels 14 al·lèrgens (ordre del
 * Mestre, 261006: «deixa previst en el component de la targeta de producte
 * l'espai i el codi per a renderitzar aquestes xicotetes icones d'al·lèrgens
 * de forma visual. Això és vital per a la Carta Digital i el TPV»). Pedra Seca
 * §9: l'espècimen abans de la producció. Els 14 en les dues mides, el «+N»,
 * la llegenda (cada dibuix del Mestre amb el seu nom, per a comprovar que cap
 * no s'ha canviat de lloc) i la targeta de la Carta Digital amb les icones al
 * cos, sense cap prop nova d'UniversalCard. El TPV les mostra al seu
 * espècimen (estructura/universal-tpv). Dades sintètiques: cap producte ni
 * preu de cap establiment real.
 */
import { Especimen } from '../Especimen.jsx';
import { IconesAlergens, UniversalCard } from '../../../../components/PedraSeca/index.js';
import { ALERGENS, NOMS_ALERGENS } from '../../../../utils/productes/producteUniversal.js';

const MOLTS = ['gluten', 'ous', 'llet', 'fruits-closca', 'sesam', 'sulfits'];

export default function EspecimenIconesAlergens() {
  return (
    <Especimen id="icones-alergens" nom="IconesAlergens" fitxer="src/components/PedraSeca/molecules/IconesAlergens.jsx"
      descripcio="Les xicotetes icones dels 14 al·lèrgens del Reglament (UE) 1169/2011, amb els dibuixos del Mestre (src/assets/alergens, còpies netes dels originals). Una fila d’imatges quadrades amb un sol nom per al lector. Viatgen dins del paquet com a URI data: (cap petició: funcionen sense xarxa); un dibuix que falta o que no es pot pintar deixa el lloc a la seua abreviatura, en una pastilla."
      contracte={[
        ['alergens', 'string[]', '—', 'Ids de la llista canònica (ALERGENS de utils/productes/producteUniversal.js). Els desconeguts i els repetits no es pinten i l’ordre és el de l’annex II. Sense cap id conegut, no pinta res.'],
        ['mida', "'xicoteta' | 'mitjana'", "'xicoteta'", 'Icones de 1.25rem o de 2rem, sempre quadrades.'],
        ['maxim', 'enter ≥ 1', '—', 'Com a molt tantes peces, «+N» inclòs: si hi caben, totes les icones; si no, maxim − 1 i una pastilla «+N» amb la resta. El nom accessible els diu tots.'],
        ['etiqueta', 'string', "'Al·lèrgens'", 'El començament del nom accessible: «Al·lèrgens: gluten, llet».']
      ]}
      a11y={[
        'Un sol element amb role="img" i un nom que diu tots els al·lèrgens, en minúscula i separats per comes; les icones són decoratives (alt="").',
        'No són controls: cap botó, cap focus i cap mida tàctil. El color no és l’única pista: cada dibuix té la seua forma i el nom ho diu en text.',
        'Qui ja els diu en un altre nom (la rajola del TPV: «…, conté llet») amaga la peça amb aria-hidden en un contenidor seu.'
      ]}
      fes={[
        'Passar els ids tal com els desa el producte (alergens): la peça els ordena i descarta els desconeguts.',
        'A la Carta Digital, posar-la al cos de la UniversalCard (body admet un node), darrere del text i en mida mitjana.',
        'Al TPV, passar alergens a cada article: la rajola la pinta xicoteta a la cantonada i ho diu al nom.'
      ]}
      noFacis={[
        'Demanar les icones a la xarxa o a una ruta: viatgen dins del paquet i funcionen sense connexió.',
        'Fer-ne un botó o deixar-la com a única pista dins d’un control: els al·lèrgens s’han de dir també en text.',
        'Copiar els colors dels al·lèrgens als fulls: són dins dels dibuixos del Mestre.'
      ]}>
      <h4>Els 14, xicotetes (1.25rem)</h4>
      <p><IconesAlergens alergens={ALERGENS} /></p>
      <h4>Els 14, mitjanes (2rem)</h4>
      <p><IconesAlergens alergens={ALERGENS} mida="mitjana" /></p>
      <h4>Com a molt 4 peces: 3 icones i «+N»</h4>
      <p><IconesAlergens alergens={MOLTS} maxim={4} /></p>
      <h4>Cada dibuix i el seu al·lergen</h4>
      <ul aria-label="Llegenda dels 14 al·lèrgens">
        {ALERGENS.map((id) => (
          <li key={id} data-alergen={id}>
            <span aria-hidden="true"><IconesAlergens alergens={[id]} mida="mitjana" /></span>
            {' '}{NOMS_ALERGENS[id]}
          </li>
        ))}
      </ul>
      <h4>A la targeta de la Carta Digital</h4>
      <UniversalCard
        title="Coca de llanda"
        headingLevel="h5"
        price="2,00 €"
        hasFooter={false}
        body={(
          <>
            <p>Un tros de la coca de mostra, feta cada matí.</p>
            <IconesAlergens alergens={['llet', 'gluten', 'ous']} mida="mitjana" />
          </>
        )}
      />
    </Especimen>
  );
}
