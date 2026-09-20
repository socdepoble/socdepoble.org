import { Car, PawPrint } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { UniversalCard, Alerta } from '../../../../components/PedraSeca/index.js';

/* Autoria i peu compartits per les variants: la targeta és una i les dades canvien. */
const SDP = {
  author: 'Sóc de Poble',
  location: 'La Torre de les Maçanes',
  avatarUrl: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
  copyright: '© Sóc de Poble / Fet per la IAIA i Nano Banana'
};
const PEU = { hasFooter: true, showTranslate: true, showComment: true, showShare: true, showConnect: true };

export default function EspecimenUniversalCard() {
  return (
    <Especimen id="universalcard" nom="UniversalCard · la targeta mestra" fitxer="src/components/PedraSeca/organismes/UniversalCard.jsx"
      descripcio="L'ànima de la IAIA. Tota publicació (Mur, Mercat, Esdeveniments, Vehicles, Animalets, Gestoria) hereta la mateixa anatomia: capçalera taronja d'autoria, mitjà quadrat, cos amb títol i etiquetes, i peu blau d'accions. No s'imita el seu DOM a mà: s'instancia el component."
      contracte={[
        ['title / subtitle / body', 'node', '—', 'Títol (headingLevel h2–h6, per defecte h3), subtítol h4 i text.'],
        ['author / location / avatarUrl', 'string', '—', 'Capçalera taronja. Si no hi ha cap dels tres, no es pinta.'],
        ['time / date / dateTime', 'string', '—', 'DateTimeControl a la capçalera; el clic filtra el Mur per dia (calendari local, mai UTC).'],
        ['imageUrl / imageAlt', 'string', '—', 'Mitjà quadrat (aspect-ratio 1/1). Només fonts segures.'],
        ['squareBadge', "{ type: 'price'|'calendar'|'custom', … }", 'null', 'Insígnia lateral: preu, data (dia/mes/any) o contingut propi. Afegix .has-aside i alinea el text a l’esquerra.'],
        ['labels', "(string | { text, className, href })[]", '[]', 'Taxonomia: sdp-badge-system · category · tag · accent.'],
        ['hasFooter / showTranslate / showComment / showShare / showConnect', 'boolean', '—', 'Peu blau. hasFooter=true activa les quatre accions per defecte.'],
        ['mainHref / onMainClick', 'string / fn', '—', 'Tota la targeta és un enllaç (overlay) sense tapar les accions.'],
        ['connectLabel', 'string', "'Connectar'", 'Verb de l’acció principal: «Sol·licitar plaça», «Obrir»…']
      ]}
      a11y={['Cada acció del peu té nom accessible amb el títol: «Comentar Samarreta…».', 'L’overlay d’enllaç és un <a>/<button> real amb aria-label, no un div.', 'Les insígnies de calendari són <time> amb dateTime.']}
      fes={['Un sol h3 per targeta dins d’un feed; el feed porta el seu h2.', 'squareBadge per a preu, data o icona: mai text llarg.']}
      noFacis={['Copiar les classes sp-card* a mà en un altre component.', 'Un peu buit: si no hi ha accions, hasFooter={false}.', 'Imatges no quadrades: el contenidor les retalla.']}>

      <Alerta to="avis" titol="Contracte DOM (ordre estricte)">
        <ol>
          <li><code>.sp-card-header</code> (opcional: autoria, ancoratge i data).</li>
          <li><code>.sp-card-media-container</code> (opcional: imatge 1/1).</li>
          <li><code>.sp-card-body</code> (obligatori: insígnia lateral, títol, subtítol, text, <code>.sp-card-labels</code>, copyright).</li>
          <li><code>.sp-card-footer</code> (opcional: equival a la barra blava, amb Traduir · Comentar · Compartir · Connectar).</li>
        </ol>
        <p>L’embolcall sempre porta <code>.sp-card</code>. Invocació canònica: <code>{'<UniversalCard title subtitle body imageUrl labels author location hasFooter />'}</code></p>
      </Alerta>

      <div className="sdp-card-grid">
        {/* 1 · Mur (base, sense insígnia lateral: el text es centra) */}
        <UniversalCard
          title="Disseny Pedra Seca"
          subtitle="Sistema oficial de disseny per a Sóc de Poble"
          body="Inclou la Targeta Mestra, els colors oficials i tots els elements preparats, inclús els skills i scripts, perquè qualsevol IA puga entendre este sistema i reproduir-lo."
          imageUrl="/assets/uploads/brain/ibanez_pedra_seca_design_1780873465211.png"
          imageAlt="Il·lustració del sistema de disseny Pedra Seca"
          labels={[{ text: 'MUR', className: 'sdp-badge-system' }, { text: 'Disseny UI', className: 'sdp-badge-category' }]}
          time="10:00" date="07/08/22"
          mainHref="/disseny"
          {...SDP} {...PEU}
        />

        {/* 2 · Mercat (amb preu) — la samarreta de Sóc de Poble */}
        <UniversalCard
          title="Samarreta Sóc de Poble"
          subtitle="L'edició definitiva amb el logotip complet"
          body="Dibuix del mapa del tresor. Cotó Roly de màxima qualitat."
          squareBadge={{ type: 'price', value: '15 €' }}
          imageUrl="https://socdepoble.org/assets/uploads/brain/media__1776503825171.jpg"
          imageAlt="Samarreta amb el logotip de Sóc de Poble"
          labels={[
            { text: 'Mercat', className: 'sdp-badge-system' },
            { text: '2 variants', className: 'sdp-badge-accent' },
            { text: 'roba', className: 'sdp-badge-category' },
            { text: 'samarreta', className: 'sdp-badge-tag' }
          ]}
          time="00:29" date="23/03/22"
          {...SDP} {...PEU}
        />

        {/* 3 · Esdeveniment (amb data al calendari) */}
        <UniversalCard
          title="Aplec de la Font Roja"
          subtitle="Paella, música i ball a la muntanya"
          body="Eixim a les 9:00 des de la plaça. Cadascú porta el seu plat i el got. Tornada a la vesprada."
          calendarBadge={{ dia: '14', mes: 'AGOST', any: '2026', dateTime: '2026-08-14' }}
          labels={[{ text: 'Esdeveniments', className: 'sdp-badge-system' }, { text: 'Festes', className: 'sdp-badge-category' }]}
          time="09:00" date="14/08/26"
          {...SDP} {...PEU}
        />

        {/* 4 · Vehicle (insígnia pròpia) */}
        <UniversalCard
          title="Viatge a Alacant"
          subtitle="Compartir cotxe"
          body="Isc demà divendres a les 8:00 h cap a l'estació de tren d'Alacant. Tinc 3 places lliures."
          squareBadge={{ type: 'custom', label: 'Vehicle', content: <Car size={48} strokeWidth={1.5} aria-hidden="true" focusable="false" /> }}
          labels={[{ text: 'Vehicle', className: 'sdp-badge-system' }, { text: 'Alacant', className: 'sdp-badge-category' }]}
          author="Maria" location="La Torre de les Maçanes"
          time="18:30" date="13/09/26"
          connectLabel="Sol·licitar plaça"
          {...PEU}
        />

        {/* 5 · Animalets (sense Traduir) */}
        <UniversalCard
          title="Gos perdut"
          subtitle="Zona del Riu"
          body="Hem trobat un gosset xicotet prop del riu. Porta un collar roig però no té xapa. Si algú el coneix que avise."
          squareBadge={{ type: 'custom', label: 'Animalets', content: <PawPrint size={48} strokeWidth={1.5} aria-hidden="true" focusable="false" /> }}
          labels={[{ text: 'Animalets', className: 'sdp-badge-system' }, { text: 'Perdut', className: 'sdp-badge-accent' }]}
          author="Paco" location="La Torre de les Maçanes"
          time="09:15" date="13/09/26"
          {...PEU} showTranslate={false}
        />

        {/* 6 · Gestoria (sense imatge ni text: només estat) */}
        <UniversalCard
          title="Hisenda"
          subtitle="Model 303 / 130"
          squareBadge={{ type: 'custom', label: 'Vist', content: <span className="sp-card-calendar-badge__dia" data-oversized="true">Vist</span> }}
          labels={[{ text: 'Gestoria', className: 'sdp-badge-system' }, { text: 'Hisenda', className: 'sdp-badge-category' }]}
          author="Mestre Poble" location="La Torre de les Maçanes"
          time="14:28" date="26/06/22"
          connectLabel="Obrir"
          {...PEU}
        />
      </div>
    </Especimen>
  );
}
