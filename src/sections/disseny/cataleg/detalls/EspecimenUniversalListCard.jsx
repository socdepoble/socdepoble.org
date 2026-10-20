/**
 * EspecimenUniversalListCard.jsx — la llista viva d'«El Comú» (Fase E,
 * 261020, tasca 2; pla 261020_2045). Pedra Seca §9: l'espècimen abans de la
 * producció. Sis demostracions de LA MATEIXA peça, una per mode, amb dades
 * sintètiques i estat local (cap port, cap xarxa): els tocs canvien la
 * targeta en el lloc, com ho farà dins de la bombolla del xat.
 *
 * «Qui toca» canvia l'actor: la persona que ha creat la llista (governa:
 * serveix, cobra, allibera, paga, signa per la societat) o un veí (reclama,
 * confirma, demana). «Mòbil» posa la peça dins d'un marc de l'amplada d'una
 * bombolla en una pantalla de 375 px.
 *
 * Totes les persones, els establiments, els rols i les xifres són de mostra:
 * cap nom real, cap preu real, cap alumne real. Els rols del cens no són cap
 * personatge amb drets d'autor.
 */
import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { PillToggle, UniversalListCard } from '../../../../components/PedraSeca/index.js';

const MIDES = [
  { valor: 'estret', text: 'Mòbil (bombolla de 375 px)' },
  { valor: 'ample', text: 'Tota l’amplada' }
];
const ACTORS = {
  amo: { id: 'mostra-anna', nom: 'Anna' },
  veí: { id: 'mostra-pau', nom: 'Pau' }
};
const QUI = [
  { valor: 'amo', text: 'Qui l’ha creada (Anna)' },
  { valor: 'veí', text: 'Un veí (Pau)' }
];
const ARA = '2026-10-20T19:00:00.000Z';
const rellotge = () => new Date(ARA);
const signa = (id, nom) => ({ usuariId: id, nom, at: ARA });

function generadorDIds(prefix) {
  let n = 0;
  return () => {
    n += 1;
    return `${prefix}-${n}`;
  };
}

const LLISTES = [
  {
    id: 'mostra-rebost', mode: 'rebost', titol: 'Compra del mas', subtitol: 'Dissabte al matí', propietariId: 'mostra-anna', revisio: 3,
    configMode: { costDesplacamentCents: 760 },
    recentsComu: [{ nom: 'Llet', especificacio: '6 l', at: ARA }, { nom: 'Pa de pagés', especificacio: '', at: ARA }],
    elementsComu: [
      { id: 'r1', ordre: 1, nom: 'Tomaca de penjar', emoji: '🍅', capaMode: { estat: 'falta', especificacio: '2 kg + 1 kg', demanatPer: [{ ...signa('mostra-anna', 'Anna'), especificacio: '2 kg' }, { ...signa('mostra-pau', 'Pau'), especificacio: '1 kg' }], compratPer: null, preuPobleCents: 250, preuGranSuperficieCents: 295, unitatPreu: 'kg' } },
      { id: 'r2', ordre: 2, nom: 'Ous', emoji: '🥚', capaMode: { estat: 'falta', especificacio: '1 dotzena', demanatPer: [{ ...signa('mostra-pau', 'Pau'), especificacio: '1 dotzena' }], compratPer: null, preuPobleCents: 30, preuGranSuperficieCents: 25, unitatPreu: 'u' } },
      { id: 'r3', ordre: 3, nom: 'Creïlles', capaMode: { estat: 'falta', especificacio: '3 kg', demanatPer: [{ ...signa('mostra-anna', 'Anna'), especificacio: '3 kg' }], compratPer: null } },
      { id: 'r4', ordre: 4, nom: 'Oli d’oliva', emoji: '🫒', capaMode: { estat: 'comprat', especificacio: '1 l', demanatPer: [{ ...signa('mostra-anna', 'Anna'), especificacio: '1 l' }], compratPer: signa('mostra-pau', 'Pau') } }
    ]
  },
  {
    id: 'mostra-bar', mode: 'bar_tpv', titol: 'Taula 4 · Sopar de la colla', propietariId: 'mostra-anna', revisio: 2,
    configMode: { carta: [{ nom: 'Cafè sol', preuCents: 110 }, { nom: 'Torrada amb tomaca', preuCents: 250, desti: 'cuina' }, { nom: 'Aigua', preuCents: 100 }] },
    elementsComu: [
      { id: 'b1', ordre: 1, nom: 'Torrada amb tomaca', emoji: '🍞', capaMode: { estat: 'demanat', quantitat: 3, preuCents: 250, desti: 'cuina', demanatPer: signa('mostra-pau', 'Pau') } },
      { id: 'b2', ordre: 2, nom: 'Aigua', emoji: '💧', capaMode: { estat: 'servit', quantitat: 2, preuCents: 100, desti: 'barra', demanatPer: signa('mostra-anna', 'Anna') } },
      { id: 'b3', ordre: 3, nom: 'Cafè sol', emoji: '☕', capaMode: { estat: 'cobrat', quantitat: 1, preuCents: 110, desti: 'barra', demanatPer: signa('mostra-pau', 'Pau') } }
    ]
  },
  {
    id: 'mostra-cens', mode: 'colla_cens', titol: 'Disfresses de la cavalcada', subtitol: 'Cada rol, una persona', propietariId: 'mostra-anna', revisio: 4,
    configMode: { faccions: ['Poblat', 'Campament'] },
    elementsComu: [
      { id: 'c1', ordre: 1, nom: 'Druida', emoji: '🧙', capaMode: { faccio: 'Poblat', descripcio: 'Barba blanca i capa', quota: 1, adjudicacions: [signa('mostra-rosa', 'Rosa')] } },
      { id: 'c2', ordre: 2, nom: 'Ferrera', emoji: '🔨', capaMode: { faccio: 'Poblat', quota: 1, adjudicacions: [] } },
      { id: 'c3', ordre: 3, nom: 'Soldat', emoji: '🛡️', capaMode: { faccio: 'Campament', quota: 5, adjudicacions: [signa('mostra-pau', 'Pau'), signa('mostra-toni', 'Toni')] } },
      { id: 'c4', ordre: 4, nom: 'Tambor menut', emoji: '🥁', capaMode: { faccio: 'Campament', quota: 1, esMenut: true, adjudicacions: [] } }
    ]
  },
  {
    id: 'mostra-banda', mode: 'banda_eixida', titol: 'Entrada de bandes', subtitol: 'Festes de mostra · 18 h', propietariId: 'mostra-anna', revisio: 5,
    configMode: {
      volen: 6, codiActe: 3, necessitats: { trompa: 2, bombardino: 1 }, suplementCotxeCents: 1000, pressupostatCents: 30000,
      tarifesCents: { plantilla_nivell_1: { 3: 5000 }, plantilla_nivell_3: { 3: 3333 }, contractat: { 3: 6000 } }
    },
    elementsComu: [
      { id: 'm1', ordre: 1, nom: 'Pau', capaMode: { corda: 'trompa', vinculacio: 'plantilla', nivell: 3, usuariId: 'mostra-pau', assistencia: 'convocat', posaCotxe: false, places: 0, pagament: 'pendent' } },
      { id: 'm2', ordre: 2, nom: 'Marta', capaMode: { corda: 'clarinet', vinculacio: 'plantilla', nivell: 1, usuariId: 'mostra-marta', assistencia: 'confirmat', posaCotxe: true, places: 4, pagament: 'pendent' } },
      { id: 'm3', ordre: 3, nom: 'Reforç de bombardino', capaMode: { corda: 'bombardino', vinculacio: 'contractat', assistencia: 'confirmat', posaCotxe: false, places: 0, pagament: 'pagat' } },
      { id: 'm4', ordre: 4, nom: 'Joan', capaMode: { corda: 'percussió', vinculacio: 'plantilla', nivell: 1, usuariId: 'mostra-joan', assistencia: 'baixa', posaCotxe: false, places: 0, pagament: 'pendent' } }
    ]
  },
  {
    id: 'mostra-loteria', mode: 'loteria_diposit', titol: 'Loteria de Nadal', subtitol: 'Número de mostra 00000', propietariId: 'mostra-anna', revisio: 6,
    configMode: { decimFacialCents: 2000, decimRecarrecPercent: 15, paperetaFacialCents: 240, paperetaRecarrecPercent: 25 },
    elementsComu: [
      { id: 'l1', ordre: 1, nom: 'Bar de la Plaça', capaMode: { format: 'decims', entregats: 20, retornats: 3, signatures: { entregaDepositari: true, entregaSocietat: true, liquidacioDepositari: false, liquidacioSocietat: false } } },
      { id: 'l2', ordre: 2, nom: 'Forn del Carrer Major', capaMode: { format: 'paperetes', entregats: 50, retornats: 0, depositariUsuariId: 'mostra-pau', signatures: { entregaDepositari: false, entregaSocietat: true, liquidacioDepositari: false, liquidacioSocietat: false } } }
    ]
  },
  {
    id: 'mostra-escola', mode: 'escola_educand', titol: 'Fitxa de l’educand de mostra', subtitol: 'Curs 2026-2027 · Clarinet', propietariId: 'mostra-anna', revisio: 2,
    configMode: { families: ['mostra-pau'] },
    elementsComu: [
      {
        id: 'e1', ordre: 1, nom: 'Solfeig', capaMode: {
          professor: 'Professorat de mostra',
          mesos: [
            { mes: 'setembre', setmanes: ['E', 'B', null, null, null], nota: 6 },
            { mes: 'octubre', setmanes: [null, null, 'X', 'B', null], nota: 5 },
            { mes: 'novembre', setmanes: ['B', 'B', null, null, null], nota: 6 },
            { mes: 'desembre', setmanes: [null, 'R', 'E', null, null], nota: 8 }
          ],
          dialeg: [{ id: 'd1', rol: 'familia', text: 'A casa practica vint minuts cada vesprada.', ...signa('mostra-pau', 'Pau') }]
        }
      }
    ]
  }
];

export default function EspecimenUniversalListCard() {
  const [mida, setMida] = useState('estret');
  const [qui, setQui] = useState('amo');
  const [generaId] = useState(() => generadorDIds('mostra'));
  const actor = ACTORS[qui];
  const marc = mida === 'estret' ? 'sdp-comu-marc sdp-comu-marc--estret' : 'sdp-comu-marc';
  return (
    <Especimen id="llista-comu" nom="UniversalListCard" fitxer="src/components/PedraSeca/UniversalListCard/UniversalListCard.jsx"
      descripcio="La llista viva d’«El Comú»: el que en un grup de missatgeria serien cent missatges de text copiats i pegats és ací una sola targeta que canvia en el lloc. Sis modes en la mateixa peça. El Rebost, la Comanda i el Cens van en rajoles de 98 × 116 px (Bring!) que canvien d’estat amb un toc i 300 ms de transició; l’Eixida de la banda, la Loteria i la Fitxa de l’educand, en files, perquè porten diners, signatures o notes. «Amplia en taula» obri la vista estesa amb els exportadors (WhatsApp i CSV)."
      contracte={[
        ['llista', '{ id, mode, titol, subtitol?, propietariId, revisio, configMode, elementsComu, recentsComu? }', '—', 'La forma neutra (basesComu.js). Cada element porta el bloc nuclear (id, nom, emoji?, ordre) i la capa del seu mode (capaMode). Si canvia, la peça hi passa la guarda anti-eco: ni el ressò del propi toc ni una revisió vella tornen a pintar.'],
        ['mode', "'rebost' | 'bar_tpv' | 'colla_cens' | 'banda_eixida' | 'loteria_diposit' | 'escola_educand'", '—', 'Dins de la llista. Tria la vista, els filtres, l’afegit ràpid, les xifres del peu i les columnes de la taula.'],
        ['actor', '{ id, nom } | null', 'null', 'La persona de la sessió: qui reclama, qui confirma, qui signa. Mai un nom escrit a mà. Sense actor, la peça es llig però no es toca.'],
        ['onMuta', '(canvi) => Promise<instantània | void> | null', 'null', 'Cada toc es pinta de seguida (optimista) i després passa ací { accio, llista, revisioBase, clientInstanceId }. Si torna una instantània, mana la del servidor; si falla amb un { codi }, el toc es desfà i l’error es diu. És on s’enxufa el port (tasca 4).'],
        ['variant', "'bombolla' | 'plena'", "'bombolla'", 'bombolla: l’amplada d’una targeta incrustada, mai més que la bombolla. plena: tota l’amplada.'],
        ['interactiva', 'boolean', 'true', 'false dins del mode de selecció del xat: cap botó ni camp, només lectura (la bombolla sencera és la casella).'],
        ['rellotge, generaId', '() => Date, () => string', 'el rellotge i randomUUID', 'Per a proves i espècimens deterministes.']
      ]}
      a11y={[
        'Una regió amb el títol de la llista com a nom. El mode, el progrés (un <progress> natiu) i el filtre (PillToggle) van davant de la llista.',
        'Cada rajola és un botó natiu amb aria-pressed i un nom que diu l’article, la quantitat i l’estat en text («Tomaca de penjar, 2 kg + 1 kg, Falta»): el color no és mai l’únic senyal.',
        'Deixar un rol, alliberar el d’un altre o llevar un element demanen confirmació; en les destructives, el focus inicial va a «Cancel·la».',
        'Cap control fa menys de --sdp-touch (48 px). El que no es pot fer no és un botó desactivat: és text.',
        'Les accions pròpies s’anuncien en un role="status" («Tomaca: al cistell.»); un error del nucli o del servidor, en un role="alert" amb el seu text.',
        'La fitxa d’un educand és privada: per a qui no és del professorat ni de la família, la peça només diu que és privada.'
      ]}
      fes={[
        'Passar sempre l’actor de la sessió i deixar que el nucli diga què pot fer cadascú: el servidor repetirà la regla (CAS i auth.uid()).',
        'Donar a cada llista el seu propietariId i, si cal, gestors a configMode: és qui serveix, cobra, allibera, paga i signa per la societat.',
        'Escriure en una sola línia a l’afegit ràpid: «2 kg de tomaca», «2 cafè sol», «Soldat x5», «Pere, trompa», «Bar de la Plaça 20».',
        'Usar «Amplia en taula» per a tot el que no cap en una rajola: la quantitat escrita a mà, les unitats de més o de menys, alliberar un lloc, llevar un element.'
      ]}
      noFacis={[
        'Copiar els colors de Bring! (roig i verd en cru): actiu és el blau d’acció i resolt, el verd d’èxit dels tokens.',
        'Afegir un missatge de text al xat per cada toc: la llista canvia en el lloc.',
        'Guardar una identitat en text lliure (el «cens-actor» que la Vila Gal·la deixava a la memòria del navegador): qui allibera el lloc d’un altre ha de governar la llista.',
        'Mostrar la fitxa d’un menor o la capa econòmica de la banda a qui no li toca.'
      ]}>
      <PillToggle etiqueta="Mida de la mostra" valor={mida} onCanvi={setMida} opcions={MIDES} />
      <PillToggle etiqueta="Qui toca" valor={qui} onCanvi={setQui} opcions={QUI} />
      {LLISTES.map((llista) => (
        <div key={`${llista.id}-${qui}`} className={marc}>
          <UniversalListCard llista={llista} actor={actor} variant={mida === 'estret' ? 'bombolla' : 'plena'}
            rellotge={rellotge} generaId={generaId} />
        </div>
      ))}
    </Especimen>
  );
}
