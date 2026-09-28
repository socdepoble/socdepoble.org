import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { Boto } from '../../../../components/PedraSeca/index.js';
import { BotoIdentitatActiva } from '../../../../components/universal/identitat/BotoIdentitatActiva.jsx';
import { CalaixIdentitats } from '../../../../components/universal/identitat/CalaixIdentitats.jsx';
import { TargetaAdministrar } from '../../../connectar/organitzacio/TargetaAdministrar.jsx';

const res = () => {};

/* T43 (ordre del Mestre, 260928) · Identitat activa a la barra negra i
   administrar organitzacions. Dades fixes: cap context ni xarxa. */
const IDENTITATS = [
  { tipus: 'persona', id: 'u-1', nom: 'Pepa Soler', avatar: null, rol: 'persona', activa: false },
  { tipus: 'entitat', id: 'o-1', nom: 'Forn de la Torre', avatar: null, rol: 'owner', activa: true },
  { tipus: 'entitat', id: 'o-2', nom: 'Colla del Barranc', avatar: null, rol: 'admin', activa: false }
];
/* Un exemplar per cada estat d'ESTATS_ADMINISTRACIO (estatAdministracio.js), sense repetir-ne cap. */
export const ESTATS = [
  ['Sense sessió', { estat: 'sense-sessio' }],
  ['Sense servidor', { estat: 'no-disponible' }],
  ['Ja l’administra', { estat: 'administres', rol: 'owner' }],
  ['Alta aprovada, afegint la identitat', { estat: 'activant' }],
  ['Comprovant la petició pròpia', { estat: 'comprovant' }],
  ['Membre', { estat: 'membre' }],
  ['Petició pendent', { estat: 'pendent', data: '2026-09-28T10:00:00Z' }],
  ['Petició rebutjada', { estat: 'rebutjada' }],
  ['Ja té propietària', { estat: 'te-propietaria' }],
  ['No és del poble', { estat: 'no-del-poble' }],
  ['Pot connectar-se (amb revisió)', { estat: 'pot-connectar', ambRevisio: true }]
];

export default function EspecimenIdentitat() {
  const [obert, setObert] = useState(false);
  return (
    <Especimen id="identitat" nom="Identitat activa i administrar organitzacions" fitxer="src/components/universal/identitat/ · src/sections/connectar/organitzacio/"
      descripcio="La barra negra diu sempre amb qui actues. Una entitat es mostra amb el SEU logo o les SEUES inicials i un anell de crom, mai amb la foto de la persona. El calaix «Amb qui actues?» deixa canviar d’identitat, i la vista Connectar d’una organització explica què vol dir administrar-la."
      contracte={[
        ['BotoIdentitatActiva.teSessio', 'bool', 'false', 'Sense sessió: icona de persona i «Entrar».'],
        ['BotoIdentitatActiva.entitat', 'bool', 'false', 'Anell de crom i «(organització)» al nom accessible.'],
        ['BotoIdentitatActiva.avatar', 'string | null', 'null', 'Logo o foto (també sdp-media://, que es resol). Una entitat no hereta mai la foto de la persona.'],
        ['CalaixIdentitats.identitats', '[{ tipus, id, nom, avatar, rol, activa }]', '[]', 'Les d’IdentitatContext; l’activa porta aria-current.'],
        ['CalaixIdentitats.onTria(tipus, id)', 'funció', '—', 'El pare crida setActor i tanca el calaix.'],
        ['TargetaAdministrar.estat', "'pot-connectar' | 'administres' | 'activant' | 'comprovant' | 'pendent' | 'rebutjada' | 'te-propietaria' | 'no-del-poble' | 'membre' | 'sense-sessio' | 'no-disponible'", '—', 'Ho calcula estatDeLAdministracio.'],
        ['TargetaAdministrar.errorLectura', 'Error | null', 'null', 'Error en LLEGIR les peticions pròpies: alerta «No s’ha pogut comprovar», mai «No s’ha pogut enviar».'],
      ]}
      a11y={['Nom accessible del botó: «Identitat activa: {nom}. Canviar identitat»; l’avatar és decoració (alt="").', 'El calaix és un <dialog> germà del header: no hereta el crom i torna el focus al botó.', 'Les files del calaix són botons de 44px amb :focus-visible; l’activa es diu amb aria-current i amb text («Activa»).']}
      fes={['Dir amb qui actues en tot moment, també a la barra de dalt.', 'Separar «Actua com a» d’«Edita la fitxa»: editar no canvia la identitat.', 'Avisar que qui administra veurà també les converses de l’organització.']}
      noFacis={['Pintar la foto de la persona quan actua com una entitat.', 'Canviar d’identitat en silenci en connectar-se.', 'Mostrar el correu d’una altra persona a qui no n’és titular.']}>

      <h4>Botó de la barra negra</h4>
      <section className="bar-black" aria-label="Mostra de la barra negra">
        <div className="right-icons">
          <BotoIdentitatActiva teSessio={false} onClick={res} />
          <BotoIdentitatActiva teSessio nom="Pepa Soler" llavor="u-1" onClick={res} />
          <BotoIdentitatActiva teSessio entitat nom="Forn de la Torre" llavor="o-1" onClick={() => setObert(true)} obert={obert} />
        </div>
      </section>

      <h4>Calaix «Amb qui actues?»</h4>
      <Boto onClick={() => setObert(true)}>Obrir el calaix d’identitats</Boto>
      <CalaixIdentitats obert={obert} onTanca={() => setObert(false)} identitats={IDENTITATS}
        onTria={() => setObert(false)} onConnectar={() => setObert(false)} onFitxa={() => setObert(false)} />

      {ESTATS.map(([titol, props]) => (
        <section key={titol} aria-label={titol}>
          <h4>{titol}</h4>
          <TargetaAdministrar nom="Forn de la Torre" {...props} onConnecta={res} onActua={res} onEditaFitxa={res} onEntra={res} />
        </section>
      ))}
    </Especimen>
  );
}
