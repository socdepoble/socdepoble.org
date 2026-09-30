import { useState } from 'react';
import { CalendarClock, Car, PawPrint } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';
import { UniversalCard, Alerta } from '../../../../components/PedraSeca/index.js';
import { BotoVisibilitat } from '../../../../components/universal/barres/BotoVisibilitat.jsx';
import { useNavigate } from '../../../../app/contexts/RouterContext';

/* Autoria i peu compartits per les variants: la targeta és una i les dades canvien. */
const SDP = {
  author: 'Sóc de Poble',
  location: 'La Torre de les Maçanes',
  avatarUrl: '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg',
  copyright: '© Sóc de Poble / Fet per la IAIA i Nano Banana'
};
const PEU = { hasFooter: true, showTranslate: true, showComment: true, showShare: true, showConnect: true };

export default function EspecimenUniversalCard() {
  const navega = useNavigate();
  const [avis, setAvis] = useState('Encara no has premut el pin ni la bola del món.');
  return (
    <>
    <Llinatge id="card" />
    <Especimen id="universalcard" nom="UniversalCard · la targeta mestra" fitxer="src/components/PedraSeca/organismes/UniversalCard.jsx"
      descripcio="L'ànima de la IAIA. Tota publicació (Mur, Mercat, Esdeveniments, Vehicles, Animalets, Gestoria) hereta la mateixa anatomia: capçalera taronja d'autoria, mitjà quadrat, cos amb títol i etiquetes, i peu blau d'accions. És una versió reduïda de PageFrame amb codi propi: fa servir els mateixos àtoms, però un canvi a les barres no hi arriba sol. No s'imita el seu DOM a mà: s'instancia el component."
      contracte={[
        ['title / subtitle / body', 'node', '—', 'Títol, subtítol h4 i text.'],
        ['headingLevel', "'h2' | 'h3' | 'h4' | 'h5' | 'h6'", "'h3'", 'L’etiqueta del títol, segons el feed on viu; qualsevol altre valor torna a h3.'],
        ['variant', "'default' | 'pla'", "'default'", "'pla' (sp-card--pla): sense marc, radi ni ombra, per a viure dins d’una llista. És la targeta viva del Bloc de Notes i del Perfil."],
        ['author / location / avatarUrl', 'string', '—', 'Capçalera taronja. Si no hi ha cap dels tres, no es pinta.'],
        ['authorHref', 'string', '—', 'Amb una ruta segura, l’autoria de la caputxa és un enllaç: al perfil, o a /pobles si publica el sistema (EventCard, Mur).'],
        ['emoticona', 'string', "''", 'El camp cru d’emoticona del document. Només amb una emoticona triada la caputxa passa a tres columnes, amb l’emoticona al centre (EmoticonaBarra en lectura). Mai la ploma.'],
        ['time / date / dateTime', 'string', '—', 'DateTimeControl a la capçalera; el clic filtra el Mur per dia (calendari local, mai UTC).'],
        ['showPin / onPin', 'boolean / fn', 'Boolean(onPin)', 'El pin «Ancorar {títol}» de la caputxa (ActionControl amb btn-icon-orange: icona blanca). El Mur el mostra als avisos (showPin={item.isAvis}).'],
        ['isAvis', 'boolean', 'false', 'Afig sp-card--avis a l’article (avís ancorat). Avui cap regla CSS el pinta diferent: és un ganxo per al Mur.'],
        ['headerAction', 'node', '—', 'Una acció pròpia a la dreta de la caputxa, entre el pin i la data. Cap secció la fa servir encara.'],
        ['imageUrl / imageAlt', 'string', '—', 'Mitjà quadrat (aspect-ratio 1/1). Només fonts segures.'],
        ['squareBadge', "{ type: 'price'|'calendar'|'custom', … }", 'null', 'Insígnia lateral: preu, data (dia/mes/any) o contingut propi. Afegix .has-aside i alinea el text a l’esquerra.'],
        ['calendarBadge', '{ dia, mes, any?, dateTime, onClick? }', 'null', 'La insígnia de data d’un esdeveniment (EventCard): un <time dateTime> amb dia, mes i any; amb onClick, un botó. Si també hi ha squareBadge, mana squareBadge.'],
        ['actual', 'boolean', 'false', 'La targeta és l’element triat d’una llista: aria-current="true" a l’element principal (o a l’article, si no n’hi ha).'],
        ['labels', "(string | { text, className, href })[]", '[]', 'Taxonomia: sdp-badge-system · category · tag · accent.'],
        ['hasFooter / showTranslate / showComment / showShare / showConnect', 'boolean', '—', 'Peu blau. hasFooter=true activa les quatre accions per defecte.'],
        ['mainHref / onMainClick', 'string / fn', '—', 'Tota la targeta és un enllaç (overlay) sense tapar les accions.'],
        ['objecte', '{ tipus, id, titol, ruta }', '—', 'T63.2 · El descriptor tipat de l’element (objecteDe, objecteDePerfil…). Sense onComment, Comentar obri el xat comú de la seua Pàgina Universal (/xat?sobre=tipus:id), o el missatge directe d’una persona o una IA. Una nota no en té: Comentar no es pinta. Sense objecte, el xat de la pàgina del detall (mainHref), mai el de la llista. Sense cap xat (objecte null, cap detall o una ruta que el contracte no admet), el botó es queda i el clic ho avisa.'],
        ['connectLabel', 'string', "'Connectar'", 'Verb de l’acció principal: «Sol·licitar plaça», «Obrir»… Nom accessible: «Connectar amb {títol}»; qualsevol altre verb, «{verb}: {títol}».']
      ]}
      a11y={['Cada acció del peu té nom accessible amb el títol: «Comentar Samarreta…».', 'L’overlay d’enllaç és un <a>/<button> real amb aria-label, no un div.', 'Les insígnies de calendari són <time> amb dateTime.']}
      fes={['Un sol h3 per targeta dins d’un feed; el feed porta el seu h2 (si no, headingLevel).', 'squareBadge per a preu, data o icona: mai text llarg.', 'Sense foto, la icona de la part va a squareBadge (Consola, Vehicle, Animalets).', 'Una data que no filtra el Mur (instantània de dades): onDateTime={false}.', 'Passar a emoticona el camp cru del document: la caputxa només la mostra si s’ha triat.']}
      noFacis={['Copiar les classes sp-card* a mà en un altre component.', 'Un peu buit: si no hi ha accions, hasFooter={false}.', 'Imatges no quadrades: el contenidor les retalla.', 'Passar la 🪶 de reserva de la llista (item.icon) com a emoticona.', 'Canviar PageFrame o les barres i donar per fet que la targeta també canvia.']}>

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
          author="Javi" location="La Torre de les Maçanes"
          time="14:28" date="26/06/22"
          connectLabel="Obrir"
          {...PEU}
        />

        {/* 7 · Explicativa (Consola): icona en lloc de foto, entradilla i les
            mètriques vives en h5 centrats (T2, ordre del Mestre, 260930), hora
            de només lectura i un «Obrir» que no compta com a Connectar.
            La instància real és TargetaConsola (src/sections/consola/peces.jsx). */}
        <UniversalCard
          title="Calendari de processos"
          subtitle="Per a vigilar el que corre sense ningú davant"
          body={(
            <>
              <p>Què corre sol al Mas, quan, qui ho llança i si continua viu.</p>
              <div className="sdp-consola__metriques">
                <h5 className="sdp-consola__metrica">10 tasques</h5>
                <h5 className="sdp-consola__metrica">2 vives</h5>
                <h5 className="sdp-consola__metrica">1 morta</h5>
              </div>
            </>
          )}
          squareBadge={{ type: 'custom', label: 'Calendari de processos', content: <CalendarClock size={48} strokeWidth={1.5} aria-hidden="true" focusable="false" /> }}
          labels={[{ text: 'Cal reparar', className: 'sdp-insignia sdp-insignia--error' }]}
          author="Consola Termodinàmica" location="Font: el Mapa del Mas"
          avatarUrl={SDP.avatarUrl}
          time="01:42" date="26/09/26" dateTime="2026-09-26T01:42:00" onDateTime={false}
          mainHref="/consola/calendari"
          showShare showConnect onConnect={() => navega('/consola/calendari')} connectLabel="Obrir"
          telemetria={{ comptar: false }}
        />
      </div>

      {/* Les mostres porten el títol h3 de sèrie, com totes les targetes de
          l'app: el catàleg ensenya el DOM i el píxel de veres. Un headingLevel
          més baix llevaria la ratlla que base.css posa als h3 i el subtítol
          continuaria sent h4 (pendent del propietari d'UniversalCard). */}
      <h4>Targeta plana (variant «pla») i emoticona a la caputxa</h4>
      <p>La de les llistes: sense marc ni ombra. Amb una emoticona triada, la caputxa fa tres columnes i l’emoticona queda al centre; sense, la caputxa de sempre.</p>
      <div className="sdp-especimen__targetes">
        <UniversalCard variant="pla" emoticona="🍅"
          title="Planter de tomaques de la Font" subtitle="Quan i com el sembrem enguany"
          body="El dissabte repartim el planter a la plaça. Porta una caixa i el teu nom a la llista."
          labels={[{ text: 'Agricultura', className: 'sdp-badge-category' }, { text: 'tomaca', className: 'sdp-badge-tag' }]}
          time="09:00" date="12/10/26" dateTime="2026-10-12T09:00" onDateTime={false}
          {...SDP} {...PEU}
        />
        <UniversalCard variant="pla"
          title="Planter de tomaques de la Font" subtitle="Sense emoticona triada"
          body="La caputxa no té espai central: autoria a l’esquerra i data a la dreta."
          time="09:00" date="12/10/26" dateTime="2026-10-12T09:00" onDateTime={false}
          {...SDP} {...PEU}
        />
      </div>

      <h4>Avís ancorat: pin, acció de caputxa i autor enllaçat</h4>
      <p>isAvis i showPin, com els avisos del Mur. El pin i l’acció de la caputxa (ací, la bola del món) són blancs dins del cercle de vel fosc. L’autoria enllaça al poble (authorHref).</p>
      <div className="sdp-especimen__targetes">
        <UniversalCard isAvis showPin onPin={() => setAvis('Has premut «Ancorar»: al Mur, l’avís quedaria dalt de tot.')}
          headerAction={<BotoVisibilitat publicat etiqueta="Pública: canviar la visibilitat" onObri={() => setAvis('Has premut la bola del món: obriria el selector de visibilitat.')} />}
          title="Tall d’aigua dimarts" subtitle="De 9:00 a 13:00, tot el poble"
          body="L’Ajuntament canvia una canonada del carrer Major. Ompliu garrafes la vespra."
          author="La Torre de les Maçanes" location="Avís del poble" avatarUrl={SDP.avatarUrl} authorHref="/pobles"
          labels={[{ text: 'Avís', className: 'sdp-badge-accent' }]}
          time="08:00" date="29/09/26" dateTime="2026-09-29T08:00" onDateTime={false}
          {...PEU}
        />
      </div>
      <p role="status">{avis}</p>
    </Especimen>
    </>
  );
}
