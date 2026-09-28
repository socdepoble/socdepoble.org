import { Especimen } from '../Especimen.jsx';
import { Boto, GrupOpcions } from '../../../../components/PedraSeca/index.js';
import { ResumConnexio } from '../../../connectar/ResumConnexio.jsx';
import { opcionsDAbast } from '../../../connectar/abastConnexio.js';

const res = () => {};

/* T43 (ordre del Mestre, 260928) · La visibilitat d'una connexió i el resum
   del que s'ha fet de veres. Dades fixes: cap context ni xarxa. */
const MAS = { clau: 'mas', nom: 'El teu MAS', estat: 'fet', detall: 'Guardada a «Connectats».' };
const CASOS = [
  ['Tot enviat', [MAS, { clau: 'p1', nom: 'Toni Ferrer', estat: 'fet', detall: 'Enviat per xat.' }]],
  ['Un enviament fallat', [MAS,
    { clau: 'g1', nom: 'Comissió de Festes', estat: 'fet', detall: 'Enviat per xat.' },
    { clau: 'g2', nom: 'La Torre', estat: 'error', detall: 'No s’ha enviat. El trobaràs al xat per a tornar-ho a provar.' }]],
  ['Tot el poble: falta un pas', [MAS,
    { clau: 'mur', nom: 'El teu mur', estat: 'pendent', detall: 'Obri la connexió al teu MAS i prem «Compartir»: la veurà la gent registrada del poble, no Internet.' }]]
];
const GRUPS = [{ id: 'g1', nom: 'Comissió de Festes' }];

export default function EspecimenResumConnexio() {
  return (
    <Especimen id="resum-connexio" nom="ResumConnexio · qui ho pot vore i què s’ha fet" fitxer="src/sections/connectar/ResumConnexio.jsx"
      descripcio="Connectar guarda sempre una nota privada al MAS de la persona. «Qui ho pot vore?» és una tria honesta: Privada, Persones concretes i Grups (l’enllaç s’envia per xat: és un missatge, no un permís) i Tot el poble (es compartix al Mur des del MAS: la gent registrada del poble, no Internet). Després de guardar, el resum diu fila per fila què s’ha fet."
      contracte={[
        ['resultats', "[{ clau, nom, estat: 'fet' | 'error' | 'pendent', detall? }]", '[]', 'Una fila per destinatari. La primera sol ser «El teu MAS».'],
        ['titol', 'string', 'segons el pitjor estat', "Si no ve: «Connexió guardada», «…però no tot s’ha enviat» o «…et falta un pas»."],
        ['accions', 'node', 'null', 'Botons de l’Alerta (p. ex. «Obrir la connexió al teu MAS»).'],
        ['opcionsDAbast({ dataMode, teSessio, grups })', 'funció pura', '—', 'Les quatre opcions de GrupOpcions amb el motiu de les desactivades.'],
      ]}
      a11y={['L’Alerta és role="status": s’anuncia sense interrompre.', 'L’estat de cada fila es llig en text («Fet», «No enviat», «Pendent»); la icona és decorativa (aria-hidden).', 'Una opció desactivada diu per què en el seu detall, que forma part de la descripció del ràdio.']}
      fes={['Dir què és un enviament (un missatge de xat) i què no és (un permís sobre la nota).', 'Dir qui veu el Mur: la gent registrada del poble, no Internet.', 'Enviar en sèrie i donar un resultat per destinatari.']}
      noFacis={['Prometre «Pública per a tothom» sense servidor que ho aplique.', 'Filtrar la visibilitat al client amb un camp del payload: qualsevol membre del poble el podria llegir.', 'Enviar a més de 20 persones o 10 grups d’un colp.']}>

      <h4>Qui ho pot vore? (remot, amb sessió)</h4>
      <GrupOpcions llegenda="Qui ho pot vore?" nom="especimen-abast-remot" aspecte="targetes" textTriada="Triada"
        opcions={opcionsDAbast({ dataMode: 'remote', teSessio: true, grups: GRUPS })} valor="privada" onCanvi={res} />

      <h4>Qui ho pot vore? (sense servidor)</h4>
      <GrupOpcions llegenda="Qui ho pot vore?" nom="especimen-abast-seed" aspecte="targetes" textTriada="Triada"
        opcions={opcionsDAbast({ dataMode: 'seed', teSessio: true, grups: [] })} valor="privada" onCanvi={res} />

      {CASOS.map(([titol, resultats]) => (
        <div key={titol}>
          <h4>{titol}</h4>
          <ResumConnexio resultats={resultats} accions={<Boto varietat="primari" onClick={res}>Obrir la connexió al teu MAS</Boto>} />
        </div>
      ))}
    </Especimen>
  );
}
