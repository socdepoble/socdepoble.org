import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { Llinatge } from '../Llinatge.jsx';
import { UniversalCard, Alerta } from '../../../../components/PedraSeca/index.js';
import { PortaDePagina, PortesTargeta } from '../../../../components/PedraSeca/organismes/PortesTargeta.jsx';
import { BotoVisibilitat } from '../../../../components/universal/barres/BotoVisibilitat.jsx';
import { COPYRIGHT_SDP, dataHoraDeBarra } from '../../../../components/universal/editorial.js';
import { insigniaEmojiXL } from '../../../../components/universal/insigniaEmoji.jsx';
import { propsDeTargetaDeLaPagina } from '../../../../components/universal/targetaDeLaPagina.js';
import { useNavigate } from '../../../../app/contexts/RouterContext';
import { objecteDePagina } from '../../../../config/objecteConnectable.js';
import { getSectionItemPath, RUTA_PERFIL_PROJECTE } from '../../../../config/navigation.js';
import { RUTA_DRETS_AUTOR, accioDeLaPagina } from '../../../../config/systemPages.js';
import { PAGE_COPY } from '../../../text/pageContent.js';
import { propsDePaginaDeText } from '../../../text/paginaDeText.js';
import { MARKET_ITEMS } from '../../../mercat/marketContent.js';
import { propsDeTargetaDeProducte } from '../../../mercat/targetaDeProducte.js';
import { TOWNS } from '../../../pobles/townsContent.js';

/* Revisió del 261007 (M3-12) · La Samarreta de la llavor, no una còpia. */
const SAMARRETA = MARKET_ITEMS.find((item) => item.id === 'samarreta-socdepoble') || null;

/* Autoria i peu compartits per les variants: la targeta és una i les dades canvien.
   Ordre del Mestre (261007) · Els drets de sèrie són els de l'app (COPYRIGHT_SDP,
   CC BY-NC-SA 4.0), no una còpia que es quede vella.
   Onada 8 (261009) · «Un clic a QUALSEVOL boina taronja porta SEMPRE al perfil
   públic»: la boina de Sóc de Poble de les mostres porta al seu perfil
   (RUTA_PERFIL_PROJECTE), com al Mur. */
const SDP = {
  author: 'Sóc de Poble',
  location: 'La Torre de les Maçanes',
  avatarUrl: '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png',
  authorHref: RUTA_PERFIL_PROJECTE,
  copyright: COPYRIGHT_SDP
};

/* Onada 8 (261009) · L'avís que signa el poble: la boina porta a la fitxa del
   poble, la del contingut de llavor (cap poble escrit al codi). Sense, cap
   enllaç. */
const POBLE_DE_L_AVIS = TOWNS.find((poble) => poble.title === SDP.location) || null;

/* Ordre del Mestre (261007) · «Cards de veritat»: la targeta d'una pàgina és
   la miniatura de la seua UniversalPage. Les mostres passen pel MATEIX camí
   que la targeta incrustada sincronitzada (sections/detail/SincronitzacioTargetes.jsx):
   propsDePaginaDeText → propsDeTargetaDeLaPagina, més l'acció gran de la
   pàgina (accioDeLaPagina) si en té. Cap dada copiada a mà. */
const deVeritat = (clau) => {
  const props = propsDeTargetaDeLaPagina(propsDePaginaDeText(PAGE_COPY[clau], clau));
  const porta = accioDeLaPagina(clau);
  return { ...props, mainHref: `/page/${clau}`, ...(porta ? { accio: <PortaDePagina porta={porta} /> } : null) };
};
const PEU = { hasFooter: true, showTranslate: true, showComment: true, showShare: true, showConnect: true };

/* P5 · Onada 4 (PRD «Control amb targetes il·lustrades de doble acció», aprovat pel Mestre
   el 261003) · Les portes: Publicar i Saber-ne més. Destí null: en obres.
   ESMENA 261003 22:34 (directrius 2234 i 2245) · La targeta amb portes és la UniversalCard
   estàndard: la boina de socdepoble (l'autor obri el seu xat corporatiu), la il·lustració, i
   títol, subtítol i entradilla visibles, els de la seua pàgina (PAGE_COPY). Dues mostres: una
   amb les dues portes obertes (el Mur) i una amb Publicar en obres i sense il·lustració (el Mapa).
   P6 (directriu 2325) · Amb el peu blau de sempre cap a la seua pàgina i cap etiqueta: «en
   obres» ho diu la porta inerta. La directriu deia el peu sense Connectar; derogat per l'ordre
   del Mestre del 261009 (revisió R3; requeriments 261009_1300, punt 2): com al Panell, el peu
   porta Connectar i el cos, els drets de les pàgines del sistema (COPYRIGHT_SDP).
   T6 (ordre del Mestre, 261004; deroga W4-09) · La boina de socdepoble porta a la pàgina del
   projecte, ja no al seu xat corporatiu. Onada 8 (261009) · Al seu perfil
   (RUTA_PERFIL_PROJECTE, la de rutaDAutoria), ja no a /projecte. */
const porta = (id, verb, nom, desti, varietat) => ({ id, verb, nom, desti, varietat });

/* Ordre del Mestre (261007) · Al quadrat d'una part sense foto, un emoji XL
   en lloc de la icona lineal (sp-card-calendar-badge__emoji, components.css).
   Decoratiu: el nom el porta l'etiqueta del quadrat. La insígnia és la peça
   compartida (insigniaEmojiXL, components/universal/insigniaEmoji.jsx), la
   mateixa que porta la targeta viva sense imatge. */
const BOINA_SDP = { author: SDP.author, location: SDP.location, avatarUrl: SDP.avatarUrl, authorHref: SDP.authorHref };

/* Ordre del Mestre, 261004 (prompt 261004_0515, «no inventar targetes») · Les opcionals de les
   llistes de les apps (Notícies, la Nevera): imatgePrivada, idElement, premuda i
   onAccioSecundaria. Dades de mostra, sense cap persona. */
const DE_LA_COMPRA = [
  { id: 'farina', title: 'Farina de la Torre', subtitle: 'Paquet d’un quilo', imageUrl: '/assets/nano_cards/mur_nano_card.jpg' },
  { id: 'oli', title: 'Oli de la cooperativa', subtitle: 'Garrafa de cinc litres', imageUrl: 'https://exemple.invalid/oli.jpg' }
];
const ambLaPagina = (clau) => {
  const pagina = PAGE_COPY[clau];
  const ruta = `/page/${clau}`;
  return {
    title: pagina.title, subtitle: pagina.subtitle, body: pagina.lead, ...dataHoraDeBarra({ creat: pagina.date }),
    mainHref: ruta, objecte: objecteDePagina({ titol: pagina.title, ruta, id: ruta }), hasFooter: true, copyright: COPYRIGHT_SDP
  };
};
const DOBLE_ACCIO = [
  {
    clau: 'mur', ...ambLaPagina('publicar_mur'),
    imageUrl: '/assets/nano_cards/mur_nano_card.jpg',
    portes: [porta('publicar', 'Publicar', 'Publicar al Mur', '/notes', 'primari'), porta('saber', 'Saber-ne més', 'Saber-ne més sobre el Mur', '/page/publicar_mur', 'secundari')]
  },
  {
    clau: 'mapa', ...ambLaPagina('publicar_mapa'),
    squareBadge: insigniaEmojiXL('Publicar al Mapa', '🗺️'),
    portes: [porta('publicar', 'Publicar', 'Publicar al Mapa', null, 'primari'), porta('saber', 'Saber-ne més', 'Saber-ne més sobre el Mapa', '/page/publicar_mapa', 'secundari')]
  }
];

export default function EspecimenUniversalCard() {
  const navega = useNavigate();
  const [avis, setAvis] = useState('Encara no has premut el pin ni la bola del món.');
  const [aLaLlista, setALaLlista] = useState(() => new Set(['farina']));
  const [detall, setDetall] = useState('Prem una targeta per a posar-la o llevar-la de la llista; mantín-la premuda per a obrir-ne el detall.');
  const commuta = (id) => setALaLlista((abans) => {
    const nou = new Set(abans);
    if (nou.has(id)) nou.delete(id); else nou.add(id);
    return nou;
  });
  return (
    <>
    <Llinatge id="card" />
    <Especimen id="universalcard" nom="UniversalCard · la targeta mestra" fitxer="src/components/PedraSeca/organismes/UniversalCard.jsx"
      descripcio="L'ànima de la IAIA. Tota publicació (Mur, Mercat, Esdeveniments, Vehicles, Animalets, Gestoria) hereta la mateixa anatomia: capçalera taronja d'autoria, mitjà quadrat, cos amb títol i etiquetes, i peu blau d'accions. És una versió reduïda de PageFrame amb codi propi: fa servir els mateixos àtoms, però un canvi a les barres no hi arriba sol. No s'imita el seu DOM a mà: s'instancia el component. Ordre del Mestre (261007), «cards de veritat»: la targeta d'una pàgina és la miniatura de la seua UniversalPage (targetaDeLaPagina.js), la mateixa al Mur i incrustada dins d'un text, on seguix el seu original."
      contracte={[
        ['title / subtitle / body', 'node', '—', 'Títol, subtítol h4 i text.'],
        ['headingLevel', "'h2' | 'h3' | 'h4' | 'h5' | 'h6'", "'h3'", 'L’etiqueta del títol, segons el feed on viu; qualsevol altre valor torna a h3.'],
        ['variant', "'default' | 'pla'", "'default'", "'pla' (sp-card--pla): sense marc, radi ni ombra, per a viure dins d’una llista. És la targeta viva del Bloc de Notes i del Perfil."],
        ['author / location / avatarUrl', 'string', '—', 'Capçalera taronja. Si no hi ha cap dels tres, no es pinta.'],
        ['authorHref', 'string', '—', 'Amb una ruta segura, l’autoria de la caputxa és un enllaç a la pàgina de qui signa (T6, ordre del Mestre, 261004): una persona o una entitat, al seu perfil; Sóc de Poble (el sistema), al seu perfil, /empresa/socdepoble (Onada 8: mai a /projecte ni al xat; una ruta vella /projecte es llig com la nova). La ruta ix de rutaDAutoria (config/navigation.js), que resol per id, slug o àlies, mai pel nom. Un poble, a la seua fitxa (/pobles/<id>). Una ruta de l’app enllaça també a l’app nativa (rutaDAutorSegura, W4-07).'],
        ['emoticona', 'string', "''", 'El camp cru d’emoticona del document. Només amb una emoticona triada la caputxa passa a tres columnes, amb l’emoticona al centre (EmoticonaBarra en lectura). Mai la ploma.'],
        ['time / date / dateTime', 'string', '—', 'DateTimeControl a la capçalera, amb l’hora si la font en té (un dia sol, sense hora). El clic obri el Calendari en el mes de la data, amb totes les targetes d’eixe mes (/calendari?mes=AAAA-MM, mes local, mai UTC), i no arriba a l’enllaç de la targeta; el nom accessible diu l’hora, el dia (en l’ordre en què es veuen) i on porta (ordre del Mestre, 261001).'],
        ['onDateTime', 'fn | false', '—', 'Un clic propi per a la pastilla (la previsualització que avisa); false, un <time> sense clic. Sense, el Calendari.'],
        ['showPin / onPin', 'boolean / fn', 'Boolean(onPin)', 'El pin «Ancorar {títol}» de la caputxa (ActionControl amb btn-icon-orange: icona blanca). El Mur el mostra als avisos (showPin={item.isAvis}).'],
        ['isAvis', 'boolean', 'false', 'Afig sp-card--avis a l’article (avís ancorat). Avui cap regla CSS el pinta diferent: és un ganxo per al Mur.'],
        ['headerAction', 'node', '—', 'Una acció pròpia a la dreta de la caputxa, entre el pin i la data. Cap secció la fa servir encara.'],
        ['imageUrl / imageAlt', 'string', '—', 'Mitjà quadrat (aspect-ratio 1/1). Només fonts segures.'],
        ['squareBadge', "{ type: 'price'|'calendar'|'custom', … }", 'null', 'Insígnia lateral: preu, data (dia/mes/any) o contingut propi. Afegix .has-aside i alinea el text a l’esquerra. P6: el quadrat de 128 px, fosc com la barra lateral (--sdp-crom-fons) i lletra blanca.'],
        ['price', 'string', '—', 'P6 · El preu va al mateix quadrat, mai a una píndola (com squareBadge type price). Un preu llarg («1.250,00 €») baixa de lletra i hi cap sencer. Mana squareBadge, després price i després calendarBadge.'],
        ['calendarBadge', '{ dia, mes, any?, dateTime, onClick? }', 'null', 'La insígnia de data d’un esdeveniment (EventCard): un <time dateTime> amb dia, mes i any; amb onClick, un botó. Si també hi ha squareBadge, mana squareBadge.'],
        ['actual', 'boolean', 'false', 'La targeta és l’element triat d’una llista: aria-current="true" a l’element principal (o a l’article, si no n’hi ha).'],
        ['labels', "(string | { text, className, href })[]", '[]', 'Taxonomia: sdp-badge-system · category · tag · accent.'],
        ['accio', 'node', 'null', "Ordre del Mestre (261007) · L’acció gran de la pàgina, en lloc de les etiquetes: PortaDePagina, el mateix botó primari gran que la UniversalPage pinta davall del títol. La declara la pàgina del sistema (systemPages.js · accioDeLaPagina): «Anar al xat» a la targeta d’El Xat. És germana del vel: el botó porta al seu destí i la resta de la targeta, a la pàgina."],
        ['etiquetesAmbAccio', 'boolean', 'false', 'Onada 8 (261009) · Amb accio, les etiquetes també es pinten, al seu lloc, i el botó va just després: la targeta d’un poble afig «Anar al xat» (el xat de la seua gent) sense perdre la província, la comarca ni l’enllaç a la Viquipèdia. Sense, la ranura ocupa el lloc de les etiquetes, com a El Xat.'],
        ['copyright', 'string', '—', `Ordre del Mestre (261007) · Els drets. SEMPRE és un enllaç blau (--sdp-accio-text) a la pàgina de sistema «Drets d’autor» (${RUTA_DRETS_AUTOR}), siga quin siga el text: la llicència de sèrie (COPYRIGHT_SDP, CC BY-NC-SA 4.0), «© Pepet» o una atribució. Sense subratllat, que només ix en passar-hi el ratolí. Una sola línia: un text llarg es retalla amb punts suspensius, i el text sencer continua sent el nom accessible. L’àrea tàctil és de --sdp-touch sense moure la línia. És germà del vel: el clic no obri la targeta.`],
        ['hasFooter / showTranslate / showComment / showShare / showConnect', 'boolean', '—', 'Peu blau. hasFooter=true activa les quatre accions per defecte.'],
        ['mainHref / onMainClick', 'string / fn', '—', 'Tota la targeta és un enllaç (overlay) sense tapar les accions.'],
        ['objecte', '{ tipus, id, titol, ruta }', '—', 'T63.2 · El descriptor tipat de l’element (objecteDe, objecteDePerfil…). Ordre del Mestre (261007), «Comentaris = xat»: sense onComment, Comentar obri un menú de dues vies. «En privat» porta al xat privat amb l’autor de l’element (Onada 8: /xat?amb=<id>, encara que no el conegues; el menú en diu el nom) o amb la persona, l’entitat o la IA del perfil; amb el pilot, sense autor o amb una publicació pròpia, al xat amb Sóc de Poble. «En públic» porta al xat comú de la seua Pàgina Universal (/xat?sobre=tipus:id), que pren el títol de l’element. Una nota no en té: Comentar no es pinta. Sense objecte, el xat de la pàgina del detall (mainHref), mai el de la llista. Sense xat públic (objecte null, una persona o una IA, cap detall o una ruta que el contracte no admet), «En públic» queda desactivada i diu per què.'],
        ['connectLabel', 'string', "'Connectar'", 'Verb de l’acció principal: «Sol·licitar plaça», «Obrir»… Nom accessible: «Connectar amb {títol}»; qualsevol altre verb, «{verb}: {títol}».'],
        ['portes', '[{ id, verb, nom, desti, varietat, avis?, enObres? }]', '—', 'P5 · Com a màxim dues portes al final del cos (PortesTargeta): «Publicar» i «Saber-ne més». Amb portes no hi ha enllaç de tota la targeta; la resta de l’anatomia és la de sempre, boina i peu blau inclosos (P6): mainHref ja no fa overlay, és la pàgina de Comentar i Compartir. desti: una ruta de l’app, validada sense mirar el protocol de la finestra (W4-07); null, o una adreça de fora, pinta la porta inerta que avisa.'],
        ['imatgePrivada', 'boolean', 'false', 'Ordre del Mestre, 261004 · La imatge i l’avatar passen pel filtre de les peces de les apps (fontSegura de marca.jsx: el mateix origen o el de mitjans) i es demanen sense referent (referrerpolicy="no-referrer"). Una imatge de fora no es pinta. Per a les llistes de les apps (Notícies, la Nevera). Decisió 3 del Mestre (261007) · També la porten les targetes del Mur i dels actes (TargetaDelMur, EventCard), que abans hi passen la imatge i l’avatar pel mode estricte (fontImatgePropia de utils/sanitize.js): cap servidor de tercers, tampoc els avatars de Google, Facebook o GitHub. Una de fora no es demana: sense portada, cap; sense avatar, la silueta.'],
        ['idElement', 'string', '—', 'Ordre del Mestre, 261004 · data-element a l’element principal: la llista hi torna el focus quan es tanca el detall.'],
        ['premuda', 'boolean', '—', 'Ordre del Mestre, 261004 · aria-pressed a l’element principal quan és un botó (onMainClick): la targeta que posa i lleva de la col·lecció (la Nevera).'],
        ['onAccioSecundaria', 'fn(element)', '—', 'Ordre del Mestre, 261004 · Pulsació llarga, clic dret o Maj+F10 sobre l’element principal (pulsacioLlarga.js, com les rajoles): el detall de l’element. El clic que ve després d’una pulsació llarga no fa l’acció principal. Necessita mainHref o onMainClick.']
      ]}
      a11y={['Cada acció del peu té nom accessible amb el títol: «Comentar Samarreta…».', 'L’overlay d’enllaç és un <a>/<button> real amb aria-label, no un div.', 'Les insígnies de calendari són <time> amb dateTime.', 'L’enllaç dels drets es retalla a la vista, però el seu nom accessible és el text sencer (Pedra Seca §12).', 'L’acció gran és un enllaç real del router amb el verb visible al nom («Anar al xat»).']}
      fes={['Un sol h3 per targeta dins d’un feed; el feed porta el seu h2 (si no, headingLevel).', 'squareBadge per a preu, data o icona: mai text llarg.', 'Sense foto, l’emoji XL de la part va a squareBadge (sp-card-calendar-badge__emoji, decoratiu: el nom el porta label): 🚗 Vehicle, 🐶 Animalets, ⚙️ Consola, 🗺️ Mapa, 🧾 Gestoria (ordre del Mestre, 261007).', 'Una data que no porta al Calendari (instantània de dades): onDateTime={false}.', 'Passar a emoticona el camp cru del document: la caputxa només la mostra si s’ha triat.', 'La targeta d’una pàgina: propsDeTargetaDeLaPagina amb les props de la seua UniversalPage, la mateixa regla d’autoria de la barra taronja.']}
      noFacis={['Copiar les classes sp-card* a mà en un altre component.', 'Un peu buit: si no hi ha accions, hasFooter={false}.', 'Imatges no quadrades: el contenidor les retalla.', 'Passar la 🪶 de reserva de la llista (item.icon) com a emoticona.', 'Canviar PageFrame o les barres i donar per fet que la targeta també canvia.', 'Una targeta inventada: el títol, la imatge o la data d’una pàgina copiats a mà, que es queden vells.', 'Els drets en text pla o en dues línies.']}>

      <Alerta to="avis" titol="Contracte DOM (ordre estricte)">
        <ol>
          <li><code>.sp-card-header</code> (opcional: autoria, ancoratge i data).</li>
          <li><code>.sp-card-media-container</code> (opcional: imatge 1/1).</li>
          <li><code>.sp-card-body</code> (obligatori: insígnia lateral, títol, subtítol, text, l’acció gran <code>.sp-card-accio</code> o les etiquetes <code>.sp-card-labels</code>, i els drets <code>.sp-card-copyright</code>, un enllaç d’una línia).</li>
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
          /* Ordre del Mestre, 261001 (tasca 4 i carril A) · la pastilla amb
             hora i clicable, com al Mur: obri el Calendari en agost de 2022. */
          time="10:00" date="07/08/22" dateTime="2022-08-07T10:00"
          mainHref="/disseny"
          {...SDP} {...PEU}
        />

        {/* 2 · Mercat (amb preu) — la samarreta de Sóc de Poble. P6 · El preu
            (price) va al quadrat fosc, com al Mur i al Mercat.
            Revisió del 261007 (M3-12) · De veritat: el producte de la llavor
            (MARKET_ITEMS) pel mateix camí que la llista del Mercat
            (propsDeTargetaDeProducte). La foto principal és la xica, com a
            la seua pàgina. */}
        {SAMARRETA ? <UniversalCard {...propsDeTargetaDeProducte(SAMARRETA)} {...PEU} /> : null}

        {/* 2b · P6 · Un preu llarg: la lletra baixa per trams i cap sencer al quadrat. */}
        <UniversalCard
          title="Motocultor de segona mà"
          subtitle="Revisat i a punt per a l'hort"
          body="Funciona perfectament. Es pot provar a la cooperativa."
          price="1.250,00 €"
          labels={[{ text: 'Mercat', className: 'sdp-badge-system' }]}
          time="18:10" date="02/10/26"
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
          squareBadge={insigniaEmojiXL('Vehicle', '🚗')}
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
          squareBadge={insigniaEmojiXL('Animalets', '🐶')}
          labels={[{ text: 'Animalets', className: 'sdp-badge-system' }, { text: 'Perdut', className: 'sdp-badge-accent' }]}
          author="Paco" location="La Torre de les Maçanes"
          time="09:15" date="13/09/26"
          {...PEU} showTranslate={false}
        />

        {/* 6 · Gestoria (sense imatge ni text: només estat). Ordre del Mestre
            (261007): l'emoji XL de la part al quadrat; l'estat, a l'etiqueta.
            Revisió del 261007 (M2-08) · «Vist» era text visible del quadrat:
            ara és una etiqueta, que es veu i es llig. */}
        <UniversalCard
          title="Hisenda"
          subtitle="Model 303 / 130"
          squareBadge={insigniaEmojiXL('Gestoria · Hisenda, vist', '🧾')}
          labels={[
            { text: 'Gestoria', className: 'sdp-badge-system' },
            { text: 'Hisenda', className: 'sdp-badge-category' },
            { text: 'Vist', className: 'sdp-badge-accent' }
          ]}
          author="Javi" location="La Torre de les Maçanes"
          time="14:28" date="26/06/22"
          connectLabel="Obrir"
          {...PEU}
        />

        {/* 7 · Explicativa (Consola): icona en lloc de foto, entradilla i les
            mètriques vives en h5 centrats (T2, ordre del Mestre, 260930).
            Derogat per l'ordre del Mestre del 261004 (xat: tota targeta amb
            boina i pàgina pròpia): la targeta de sistema sense boina i amb la
            data a l'última línia del cos. Ara porta la boina de Sóc de Poble
            (l'autor porta al seu perfil, Onada 8) i la data a la pastilla, un <time>
            sense clic (instantània de dades, onDateTime={false}); tota
            clicable i el peu de la barra blava, amb Connectar cap a la seua
            pàgina. Ordre del Mestre, 261004 (xat: cap xifra solta) · totes
            les xifres de la Consola (les del Mas, les de dins de cada pàgina i
            del pols) i cada peça del Mapa són esta mateixa targeta, amb pàgina
            pròpia a /consola/xifres/<slug>; cap no és ja una targeta compacta
            del Control. La instància real és TargetaConsola
            (src/sections/consola/peces.jsx), que pinta TargetaXifra
            (src/sections/consola/XifresMas.jsx). */}
        <UniversalCard
          className="sdp-consola__targeta"
          {...BOINA_SDP}
          time="01:42" date="26/09/26" dateTime="2026-09-26T01:42:00" onDateTime={false}
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
          squareBadge={insigniaEmojiXL('Calendari de processos', '⚙️')}
          labels={[{ text: 'Cal reparar', className: 'sdp-insignia sdp-insignia--error' }]}
          mainHref="/consola/calendari"
          hasFooter onConnect={() => navega('/consola/calendari')}
        />
      </div>

      {/* Ordre del Mestre (261007) · «Cards de veritat», l'acció gran i els drets. */}
      <h4>Targetes de pàgina de veritat, l’acció gran i els drets</h4>
      <p>
        La targeta d’una <strong>pàgina</strong> no s’inventa: és la <strong>miniatura de la seua UniversalPage</strong>,
        amb la portada, el títol, el subtítol, l’entradilla, les etiquetes, el rellotge i la boina de qui la signa (sense
        autor, <strong>Sóc de Poble</strong>, amb el seu avatar i La Torre de les Maçanes). És la mateixa al
        <strong> Mur</strong> i <strong>incrustada dins d’un text</strong> (la de «Drets d’autor» dins de «Legal i
        privacitat»), on es <strong>sincronitza amb l’original</strong>: la instantània desada a l’HTML només és la
        reserva. Les dues primeres mostres ixen d’eixe mateix camí, amb les dades de PAGE_COPY.
      </p>
      <p>
        <strong>El Xat</strong> porta la seua <strong>acció gran</strong>, «Anar al xat», en lloc de les etiquetes. Els
        <strong> drets</strong> són sempre un <strong>enllaç blau</strong> a «Drets d’autor», en <strong>una sola
        línia</strong>: la tercera mostra porta una atribució llarga, retallada amb punts suspensius.
      </p>
      <div className="sdp-card-grid" role="group" aria-label="Targetes de pàgina de veritat i drets">
        <UniversalCard {...deVeritat('drets-autor')} {...PEU} />
        <UniversalCard {...deVeritat('xat')} {...PEU} />
        <UniversalCard
          title="La Festa de Sant Antoni"
          subtitle="Fotografies de l’arxiu de la família"
          body="La foguera, els animals i la benedicció, tal com eren."
          labels={[{ text: 'Publicació', className: 'sdp-badge-category' }]}
          author="Pepet" location="La Torre de les Maçanes"
          copyright="© Pepet Ferrandis i Ribes / Fotografies de la Festa de Sant Antoni de 1987, arxiu de la família"
          time="19:30" date="17/01/26" dateTime="2026-01-17T19:30"
          {...PEU}
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
          author="La Torre de les Maçanes" location="Avís del poble" avatarUrl={SDP.avatarUrl}
          authorHref={POBLE_DE_L_AVIS ? getSectionItemPath('pobles', POBLE_DE_L_AVIS.id) : undefined}
          labels={[{ text: 'Avís', className: 'sdp-badge-accent' }]}
          time="08:00" date="29/09/26" dateTime="2026-09-29T08:00" onDateTime={false}
          {...PEU}
        />
      </div>
      <p role="status">{avis}</p>

      {/* Ordre del Mestre, 261004 (prompt 261004_0515) · Les targetes de les llistes de les apps. */}
      <h5>Targetes de les llistes de les apps (commutables i privades)</h5>
      <p>
        Les de <strong>Notícies</strong> i de <strong>la Nevera</strong>. Un toc les posa o les lleva de la llista
        (<code>premuda</code>: <strong>aria-pressed</strong> al botó de tota la targeta); la <strong>pulsació llarga</strong>,
        el clic dret o <strong>Maj+F10</strong> n’obrin el detall (<code>onAccioSecundaria</code>). Amb
        <code> imatgePrivada</code>, una imatge d’un <strong>servidor de fora no es pinta</strong> (la segona mostra) i la
        pròpia es demana <strong>sense referent</strong>. <code>idElement</code> deixa tornar el focus a la targeta.
      </p>
      <div className="sdp-card-grid" role="group" aria-label="Targetes commutables de mostra">
        {DE_LA_COMPRA.map((article) => (
          <UniversalCard key={article.id} imatgePrivada idElement={article.id}
            title={article.title} subtitle={article.subtitle} imageUrl={article.imageUrl}
            labels={aLaLlista.has(article.id) ? [{ text: 'A la llista', className: 'sdp-badge-accent' }] : []}
            premuda={aLaLlista.has(article.id)} onMainClick={() => commuta(article.id)}
            onAccioSecundaria={() => setDetall(`S’obriria el detall de «${article.title}».`)}
          />
        ))}
      </div>
      <p role="status">{detall}</p>

      {/* P5 · Onada 4 · Pedra Seca §9: l'espècimen abans de la producció (el Panell de Control),
          amb l'ESMENA 261003 22:34 (directrius 2234 i 2245): la targeta estàndard, sencera.
          Onada 8 (261009; revisió R3 derogada) · Connectar i els drets, com al Panell. */}
      <h5>Targeta de doble acció (portes)</h5>
      <p>
        La del <strong>Panell de Control</strong>. És la <strong>UniversalCard de sempre</strong>, sencera: la boina de
        l’entitat <strong>socdepoble</strong> (l’autor porta al <strong>seu perfil</strong>, i la data, al
        Calendari), la il·lustració, i el <strong>títol, el subtítol i l’entradilla visibles</strong>, els mateixos de la
        seua pàgina. Al final del cos, <strong>dues portes</strong>: «Publicar», en blau, i «Saber-ne més», que obri la
        <strong> UniversalPage</strong> de la targeta.
      </p>
      <p>
        Amb <code>portes</code>, la targeta sencera <strong>no és cap enllaç</strong>, però conserva el
        <strong> peu blau</strong> de sempre (Traduir, Comentar, Compartir i Connectar), cap a la seua
        pàgina, i els <strong>drets</strong>, l’enllaç blau a «Drets d’autor». És
        l’<strong>única variació</strong>: dues portes al cos i <strong>cap etiqueta</strong>. Una porta sense destí,
        o amb un destí que <strong>no és una ruta de l’app</strong>, queda <strong>inerta</strong>: diu que està en
        obres i no navega. La ruta es valida <strong> sense mirar el protocol de la finestra</strong>, i val igual a
        la web i a l’app nativa.
      </p>
      <div className="sdp-card-grid" role="group" aria-label="Targetes de doble acció de mostra">
        {DOBLE_ACCIO.map(({ clau, ...targeta }) => (
          <UniversalCard key={clau} {...BOINA_SDP} {...targeta} />
        ))}
      </div>

      <h5>Les portes, soles (PortesTargeta)</h5>
      <p>
        La peça que pinta les portes. L’índex de Pedra Seca <strong>no l’exporta</strong>: la munta la targeta. El
        <strong> nom</strong> de cada porta conté el verb visible, i la resta va per a lector.
      </p>
      <PortesTargeta
        portes={[
          porta('publicar', 'Publicar', 'Publicar: Vehicle Compartit', null, 'primari'),
          porta('saber', 'Saber-ne més', 'Saber-ne més: Vehicle Compartit', null, 'secundari')
        ]}
      />
    </Especimen>
    </>
  );
}
