import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';
import { BarraTaronja } from '../../../../components/universal/barres/BarraTaronja.jsx';
import { PanellTraspasPublicacioInline } from '../../../admin/PanellTraspasPublicacioInline.jsx';

const DATA_MOSTRA = { time: '18:00', date: '11/11/26', dateTime: '2026-11-11T18:00:00' };

const CO_PUBLICADORS_2 = Object.freeze([
  Object.freeze({
    actor_id: 'a240e870-4aef-4d92-b138-e8b4e2f2123a',
    slug_ruta: '/socdepoble',
    nom: 'Sóc de Poble',
    avatar_url: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
    poble_nom: 'La Torre de les Maçanes',
    rol_publicacio: 'principal'
  }),
  Object.freeze({
    actor_id: 'b2c87505-53b1-4108-902f-2313e77b9968',
    slug_ruta: '/rentonar',
    nom: 'Rentonar',
    avatar_url: '',
    poble_nom: 'La Torre de les Maçanes',
    rol_publicacio: 'copublicador'
  })
]);

const CO_PUBLICADORS_3 = Object.freeze([
  ...CO_PUBLICADORS_2,
  Object.freeze({
    actor_id: '3073b933-69fc-4c3e-80dc-b0df9c6b8391',
    slug_ruta: '/empresa/olidelatorre',
    nom: 'Oli de La Torre',
    avatar_url: '/assets/uploads/brain/oli_de_la_torre_logo.webp',
    poble_nom: 'La Torre de les Maçanes',
    rol_publicacio: 'copublicador'
  })
]);

const CO_PUBLICADORS_5 = Object.freeze([
  ...CO_PUBLICADORS_3,
  Object.freeze({
    actor_id: 'c4110000-4000-4000-8000-000000000004',
    slug_ruta: '/perfil/c4110000-4000-4000-8000-000000000004',
    nom: 'Coordinadora Cultural de Muro',
    avatar_url: '',
    poble_nom: 'Muro',
    rol_publicacio: 'copublicador'
  }),
  Object.freeze({
    actor_id: 'c4110000-4000-4000-8000-000000000005',
    slug_ruta: '/perfil/c4110000-4000-4000-8000-000000000005',
    nom: 'Colla Agrària d’Alcosser',
    avatar_url: '',
    poble_nom: 'Alcosser de Planes',
    rol_publicacio: 'copublicador'
  })
]);

export default function EspecimenTraspasCopublicacio() {
  return (
    <>
      <Llinatge id="traspas-copublicacio" />
      <Especimen
        id="traspas-copublicacio"
        nom="Co-publicació multi-entitat i traspàs inline · BarraTaronja · AvatarCompostPublicadors · PanellTraspasPublicacioInline"
        fitxer="src/components/universal/barres/publicadorsBarraTaronja.js · AvatarCompostPublicadors.jsx · src/sections/admin/PanellTraspasPublicacioInline.jsx"
        descripcio="Quan dos o més entitats registrades al padró publiquen conjuntament una pàgina o catàleg, la BarraTaronja mostra un mosaic quadrangular Pedra Seca d’estil grup de xat (2, 3 o 2×2 amb comptador +N) i enllaça cada co-publicador al seu perfil amb zona tàctil >= 48 px (--sdp-touch). El panell inline de superadmin permet traspassar la publicació o activar la co-publicació en 1 clic sense modals flotants."
        contracte={[
          ['BarraTaronja.publicadorsRegistrats', 'Array<ActorRegistrat> | null', 'null', 'Amb null o menys de 2 actors registrats vàlids, conserva el DOM clàssic d’1 publicador; amb >= 2 actors registrats, activa el mosaic quadrangular i la llista d’enllaços accessibles.'],
          ['projectaLecturaCopublicacio(lectura)', 'RespostaCopublicacio -> ReadonlyArray | null', '—', 'Projecta la resposta autoritativa de lligPublicadorsRegistrats; si versio === 0 o no hi ha cap actor registrat assignat, retorna null perquè es mantinga la reserva editorial.'],
          ['PanellTraspasPublicacioInline', 'recursTipusInicial · recursIdInicial · modeEspecimen', "'pagina' · 'receptes' · false", 'Quadre inline sense modal i amb botons centrats que invoca traspassaPublicacio i reverteixTraspasPublicacio amb operacioId UUID estable durant reintents i preserva els crèdits editorials.']
        ]}
        a11y={[
          'Cada entitat co-publicadora té el seu propi enllaç enfocable amb alçària mínima de 48 px (--sdp-touch).',
          'L’avatar compost és ortogonal (border-radius: 0) i usa inicials d’alt contrast AAA quan l’entitat encara no té logotip.',
          'Cap finestra modal flotant per a configurar l’autoria: tots els controls viuen en el flux de lectura.'
        ]}
        fes={[
          'Alimentar la BarraTaronja des de la lectura autoritativa de lligPublicadorsRegistrats i mantindre la reserva editorial quan el node encara no exposa la capacitat.',
          'Mantindre separada l’autoria de publicació (BarraTaronja) dels drets d’autor i la llicència de l’obra (peu del títol).',
          'Centrar els botons d’acció del panell inline amb justify-content: center.'
        ]}
        noFacis={[
          'Passar strings solts o DTOs arbitraris no acreditats a la BarraTaronja.',
          'Usar miniatures circulars minúscules amb pics blancs o cantons tallats.',
          'Obrir diàlegs modals per a configurar el traspàs d’autoria.'
        ]}
      >
        <h4>2 co-publicadors registrats (mosaic bipartit)</h4>
        <div className="sdp-especimen__barres sdp-especimen__barres--contenidor">
          <BarraTaronja
            publicadorsRegistrats={CO_PUBLICADORS_2}
            etiqueta="Co-publicació de dues entitats registrades"
            {...DATA_MOSTRA}
          />
        </div>

        <h4>3 co-publicadors registrats i vista estreta</h4>
        <div className="sdp-especimen__barres sdp-especimen__barres--contenidor">
          <BarraTaronja
            publicadorsRegistrats={CO_PUBLICADORS_3}
            etiqueta="Co-publicació de tres entitats registrades"
            {...DATA_MOSTRA}
          />
        </div>
        <div className="sdp-especimen__barres sdp-especimen__barres--contenidor sdp-especimen__barres--estreta">
          <BarraTaronja
            publicadorsRegistrats={CO_PUBLICADORS_3}
            etiqueta="Co-publicació de tres entitats en columna estreta"
            {...DATA_MOSTRA}
          />
        </div>

        <h4>5 co-publicadors registrats (mosaic 2×2 amb +2)</h4>
        <div className="sdp-especimen__barres sdp-especimen__barres--contenidor">
          <BarraTaronja
            publicadorsRegistrats={CO_PUBLICADORS_5}
            etiqueta="Co-publicació de cinc entitats registrades"
            {...DATA_MOSTRA}
          />
        </div>

        <h4>Guarda contra entitats no registrades (fallback automàtic a Sóc de Poble)</h4>
        <div className="sdp-especimen__barres sdp-especimen__barres--contenidor">
          <BarraTaronja
            publicadorsRegistrats={[
              'Associació Sense Registre',
              { actor_id: 'fake-id', slug_ruta: '/empresa/associacio-inventada', nom: 'Associació Inventada' }
            ]}
            etiqueta="Guarda d’integritat de la Barra Taronja"
            {...DATA_MOSTRA}
          />
        </div>

        <h4>Panell inline de traspàs i co-publicació d’1 clic</h4>
        <PanellTraspasPublicacioInline
          modeEspecimen
          actorsRegistratsExtra={[
            {
              actor_id: 'c4110000-4000-4000-8000-000000000004',
              slug_ruta: '/perfil/c4110000-4000-4000-8000-000000000004',
              nom: 'Coordinadora Cultural de Muro',
              poble_nom: 'Muro',
              rol_publicacio: 'copublicador'
            }
          ]}
        />
      </Especimen>
    </>
  );
}
