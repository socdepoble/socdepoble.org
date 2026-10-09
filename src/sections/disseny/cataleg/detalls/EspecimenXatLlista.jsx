/**
 * EspecimenXatLlista.jsx — la columna de llista del Xat (onada 3, T67 i T68;
 * catàleg de l'onada 3B, Pedra Seca §9): el «…» de la fila de títol obert
 * (MenuLlista), la barra de «Seleccionar xats» amb 0, 1 i n (BarraSeleccio),
 * la fila de conversa en totes les variants noves (FilaConversa) i la fila
 * de comunitat (FilaComunitat).
 *
 * Components de producció amb dades de mostra passades per mapejaFil i
 * agrupaComunitats, com les dona el XatContext. Cap context de l'app.
 *
 * `mostraDelXat()` és la llavor de tots els espècimens del Xat de l'onada 3B.
 *
 * Torn 260930 (T1): les files dels missatges propis (✓ enviat, ✓✓ blau
 * llegit, «Tu: » en un grup), la pastilla grisa d'un fil silenciat i el punt
 * d'un fil marcat a mà com a no llegit. Viuen en una llavor a banda
 * (`mostraDeLaFila()`) perquè la de l'onada 3B no canvie per als altres
 * espècimens. El ✓✓ gris (entregat) no hi és: el contracte encara no porta el
 * rebut dels altres (missatges.js, derivaEstat; ronda C3), i un espècimen no
 * mostra un estat que el producte no pot donar.
 *
 * Revisió adversarial 260930 (P3, Pedra Seca §9: «Res existeix fins que no
 * està al manual») · La fila del grup del poble de l'amfitrió quan encara no
 * existix a les dades (FilaPoble): avatar de comunitat, nom, xebró, «Avisos,
 * General» i la xinxeta de fixada. No es registra a registre.js: les peces
 * del Xat hi van amb `fora: true` i la porta no les vigila.
 *
 * Onada 6 · Revisió 261009 (Pedra Seca §9) · El peu de la llista amb
 * «Informa d'un error» (LlistaConverses `peu` i BotoInformaDUnError): darrere
 * de la llista i fora de la <ul>, davall de l'avís d'una llista que no s'ha
 * pogut carregar, i la reserva quan el xat no s'obri (copiar l'informe o
 * enviar-lo per correu).
 */
import { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import AppGridColumn from '../../../../components/layout/AppGridColumn.jsx';
import MenuLlista from '../../../xat/components/MenuLlista.jsx';
import BarraSeleccio from '../../../xat/components/BarraSeleccio.jsx';
import FilaConversa, { FilaComunitat } from '../../../xat/components/FilaConversa.jsx';
import FilaPoble from '../../../xat/components/FilaPoble.jsx';
import LlistaConverses from '../../../xat/components/LlistaConverses.jsx';
import BotoInformaDUnError from '../../../xat/components/BotoInformaDUnError.jsx';
import { agrupaComunitats, mapejaFil } from '../../../xat/missatges.js';
import { composaInforme, enllacDeCorreu } from '../../../xat/informeDError.js';

/* Traductor mínim: les alternatives ja són el text en valencià. */
const t = (clau, alternativa) => alternativa;
const LOCALE = 'ca-ES';
const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd-256x256.png';
/* El poble que declararia l'amfitrió (window.SocDePobleConfig, pobleDeConfig). */
const POBLE_DE_MOSTRA = { id: 'la-torre-de-les-macanes', nom: 'Gent de la Torre' };

/* Hores d'avui, perquè la llista mostre «17:34» i no una data. */
function hui(hores, minuts) {
  const d = new Date();
  d.setHours(hores, minuts, 0, 0);
  return d.toISOString();
}

/**
 * La llavor dels espècimens del Xat: dos comunitats (Almàssera la Torre,
 * sense imatge; Sóc de Poble, amb el logo) amb els seus Avisos i grups, un
 * grup solt, dos canals solts (amb imatge i sense), una conversa directa, el
 * padró i uns quants missatges carregats. «torre» troba una comunitat, un
 * grup, un canal, gent del padró i missatges.
 */
export function mostraDelXat() {
  const fils = [
    { id: 'c-almassera', tipus: 'comunitat', titol: 'Almàssera la Torre' },
    { id: 'a-almassera', tipus: 'canal', titol: 'Avisos', comunitatId: 'c-almassera', rol: 'membre',
      ultimText: 'Dissabte obrim la collita a les 9.', ultimAl: hui(9, 5), noLlegits: 1, participants: 48 },
    { id: 'g-almassera', tipus: 'grup', titol: 'General', comunitatId: 'c-almassera', ultimText: 'Qui porta les olives?',
      ultimAutorId: 'pep', altres: [{ id: 'pep', nom: 'Pep', tipus: 'persona' }], ultimAl: hui(11, 34), noLlegits: 2 },
    { id: 'c-sdp', tipus: 'comunitat', titol: 'Sóc de Poble', imatgeUrl: LOGO },
    { id: 'a-sdp', tipus: 'canal', titol: 'Avisos', comunitatId: 'c-sdp', rol: 'admin', imatgeUrl: LOGO,
      ultimText: 'Ja tenim el xat nou.', ultimAl: hui(8, 0) },
    { id: 'g-sdp', tipus: 'grup', titol: 'Beta testers', comunitatId: 'c-sdp', ultimText: 'Ja funciona la cerca!',
      ultimAutorId: 'maria', altres: [{ id: 'maria', nom: 'Maria', tipus: 'persona' }], ultimAl: hui(10, 12) },
    { id: 'g-festes', tipus: 'grup', titol: 'Comissió de Festes', ultimText: 'Ens veiem a la torre a les 8.',
      ultimAutorId: 'pepica', altres: [{ id: 'pepica', nom: 'Pepica', tipus: 'persona' }], ultimAl: hui(17, 34), noLlegits: 3 },
    { id: 'k-torre', tipus: 'canal', titol: 'Avisos de la Torre', imatgeUrl: LOGO, ultimText: 'Tall d’aigua dimarts.', ultimAl: hui(7, 45) },
    { id: 'k-banda', tipus: 'canal', titol: 'Avisos de la banda', ultimText: 'Assaig a les 20.', ultimAl: hui(6, 30) },
    { id: 'dir-vicent', tipus: 'directe', titol: 'Vicent Ferris', ultimText: 'Perfecte, comencem hui.', ultimAl: hui(9, 12) }
  ].map((f) => mapejaFil(f));
  const per = Object.fromEntries(fils.map((f) => [f.id, f]));
  return {
    fils,
    per,
    comunitats: agrupaComunitats(fils),
    membres: [
      { usuari_id: 'p-joan', nom: 'Joan Baptiste', tipus: 'persona' },
      { usuari_id: 'p-maria', nom: 'Maria la Vall', tipus: 'persona' },
      { usuari_id: 'p-pau', nom: 'Pau Torregrossa', tipus: 'persona' },
      { usuari_id: 'p-teresa', nom: 'Teresa de la Torre', tipus: 'persona' },
      { usuari_id: 'e-cooperativa', nom: 'Cooperativa de la Torre', tipus: 'entitat' },
      { usuari_id: 'ia-iaia', nom: 'IAIA MarIA', tipus: 'ia' }
    ],
    missatgesPerFil: {
      'g-festes': [
        { id: 'm-1', seq: 1, sender: 'other', author: 'Pepica', text: 'Ens veiem a la torre a les 8.', creatAl: hui(17, 30) },
        { id: 'm-2', seq: 2, sender: 'me', text: 'Porte la furgoneta.', creatAl: hui(17, 33) }
      ],
      'k-torre': [
        { id: 'm-3', seq: 1, sender: 'other', author: 'Ajuntament', text: 'Tall d’aigua dimarts al barri de la Torre.', creatAl: hui(7, 45) }
      ]
    }
  };
}

/**
 * T1 · Les files de l'estat: `jo` és qui mira l'espècimen (el joId de les
 * files). El silenci dura huit hores des d'ara, perquè esSilenciat el veja.
 */
function mostraDeLaFila() {
  const silenciFins = new Date(Date.now() + 8 * 3600e3).toISOString();
  return [
    { id: 'dir-enviat', tipus: 'directe', titol: 'Teresa de la Torre', ultimText: 'Demà baixe a l’almàssera.',
      ultimAutorId: 'jo', ultimSeq: 4, ultimAl: hui(12, 40) },
    { id: 'dir-llegit', tipus: 'directe', titol: 'Maria la Vall', ultimText: 'Perfecte, fins dissabte.',
      ultimAutorId: 'jo', ultimSeq: 3, llegitPelsAltresFinsSeq: 3, ultimAl: hui(11, 50) },
    { id: 'g-tu', tipus: 'grup', titol: 'Veïns del carrer Major', ultimText: 'Porte la furgoneta.',
      ultimAutorId: 'jo', ultimSeq: 9, llegitPelsAltresFinsSeq: 9, ultimAl: hui(10, 30) },
    { id: 'g-silenciat', tipus: 'grup', titol: 'Penya del futbol', ultimText: 'Qui baixa a vore el partit?',
      ultimAutorId: 'pau', altres: [{ id: 'pau', nom: 'Pau', tipus: 'persona' }], noLlegits: 5,
      silenciatFinsAl: silenciFins, ultimAl: hui(10, 2) },
    { id: 'dir-manual', tipus: 'directe', titol: 'Cooperativa de la Torre', ultimText: 'La factura ja està pujada.',
      ultimAutorId: 'e-cooperativa', noLlegits: 0, noLlegitManual: true, ultimAl: hui(9, 20) }
  ].map((f) => mapejaFil(f));
}

/* Obri el «…» una sola vegada en muntar-se (també amb el doble efecte de
   StrictMode): el menú real, amb el focus a la seua opció. */
function MenuObert({ onSeleccionar }) {
  const boto = useRef(null);
  const obert = useRef(false);
  useEffect(() => {
    if (obert.current) return;
    obert.current = true;
    boto.current?.click();
  }, []);
  return (
    <div className="sdp-xat sdp-xat-especimen sdp-xat-especimen--menu">
      <aside className="sdp-workspace-column" aria-label="Llista de mostra amb el menú obert">
        <AppGridColumn esDark={true} titol="Converses" icona={MessageCircle} esquerra={<MenuLlista onSeleccionar={onSeleccionar} refBoto={boto} t={t} />} />
      </aside>
    </div>
  );
}

/* L'informe de mostra de la reserva: l'entorn s'injecta, cap lectura del navegador. */
const INFORME_DE_MOSTRA = composaInforme({
  t, rutaActual: '/xat', rutaAnterior: '/mur', versio: 'production · XatSection-mostra.js',
  entorn: { ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) Version/16.6 Mobile/15E148 Safari/604.1', amplada: 375, alcada: 812, densitat: 3 }
});
const RESERVA_DE_MOSTRA = { informe: INFORME_DE_MOSTRA, correu: enllacDeCorreu(INFORME_DE_MOSTRA, "Informe d'un error a Sóc de Poble") };

/* Una columna de llista de mostra amb el seu peu. */
function ColumnaAmbPeu({ etiqueta, children }) {
  return (
    <div className="sdp-especimen__mostra sdp-especimen__mostra--columna">
      <aside className="sdp-workspace-column" aria-label={etiqueta}>{children}</aside>
    </div>
  );
}

function Barra({ quants, etiqueta, avisa }) {
  return (
    <div className="sdp-especimen__mostra sdp-especimen__mostra--columna">
      <aside className="sdp-workspace-column" aria-label={etiqueta}>
        <BarraSeleccio quants={quants} onEixir={avisa('Creu: eixiria de la selecció de xats.')} onMarcaLlegides={avisa('Marcaria les triades com a llegides.')} t={t} />
      </aside>
    </div>
  );
}

export default function EspecimenXatLlista() {
  const [avis, setAvis] = useState('Prem una fila, una casella o una acció.');
  const [triades, setTriades] = useState(() => new Set(['g-festes']));
  const avisa = (text) => () => setAvis(text);
  const { per, comunitats } = mostraDelXat();
  const filesDEstat = mostraDeLaFila();
  const fila = (fil, extra = {}) => (
    <li key={`${fil.id}-${extra.seleccio ? 's' : 'n'}`}>
      <FilaConversa fil={fil} onSelect={(id) => setAvis(`Obriria la conversa ${id}.`)} locale={LOCALE} t={t} joId="jo" {...extra} />
    </li>
  );
  const alterna = (id) => () => setTriades((previes) => {
    const noves = new Set(previes);
    if (noves.has(id)) noves.delete(id);
    else noves.add(id);
    return noves;
  });

  const peu = (extra = {}) => (
    <BotoInformaDUnError onPrem={avisa('Obriria el xat de feedback amb l’esborrany de l’informe.')} onCopia={avisa('Copiaria l’informe al porta-retalls.')} t={t} {...extra} />
  );

  return (
    <Especimen id="xat-llista" nom="Xat · llista de converses" fitxer="src/sections/xat/components/ (MenuLlista, BarraSeleccio, FilaConversa, FilaPoble, LlistaConverses, BotoInformaDUnError)"
      descripcio="La columna de llista calcada de WhatsApp Desktop (onada 3): el «…» redó de la fila de títol amb «Seleccionar xats», la barra que el substituïx mentre es trien xats i les files. Un grup porta la icona de persones i l’avanç «Nom: text»; el General d’una comunitat, la bafarada; un canal («Avisos»), sempre el megàfon, tinga o no imatge. Si l’últim missatge és teu, la previsualització comença amb les marques (✓ enviat, ✓✓ blau llegit) i, en un grup o un canal, amb «Tu: »; el ✓✓ gris (entregat) espera que el contracte porte el rebut dels altres. Un fil silenciat porta la pastilla grisa i l’hora sense ressaltar; un fil marcat a mà com a no llegit, el punt. Una comunitat és UNA fila, amb l’avatar quadrat i les targetes apilades, que obri la seua fitxa. En un amfitrió que declara el seu poble, el grup del poble va el primer; mentre encara no existix, el pinta FilaPoble, fixada, i prémer-la l’obri o el crea."
      contracte={[
        ['MenuLlista', '{ onSeleccionar, t, refBoto? }', '—', 'El «…» de la fila de títol; una sola opció, «Seleccionar xats». Escape el tanca i torna el focus al botó.'],
        ['BarraSeleccio', '{ quants, onEixir, onMarcaLlegides, t, refEixir? }', '0', 'La fila de títol durant la selecció: la creu, el recompte i «Marcar com a llegides», desactivat amb 0.'],
        ['FilaConversa', '{ fil, activa, onSelect, locale, t, seleccio?, joId? }', '—', 'Amb seleccio ({ triada, onAlterna }) és una casella: role="checkbox" amb el cercle. Amb joId, si l’últim missatge és teu: les marques d’estatDeLUltim i, en grups i canals, «Tu: ».'],
        ['FilaComunitat', '{ comunitat, onObri, t, seleccio? }', '—', 'comunitat és una entrada d’useXat().comunitats; la pastilla suma els no llegits dels fills. No porta ni el punt ni la pastilla grisa.'],
        ['FilaPoble', '{ poble, onObri, t }', '—', 'poble és { id, nom } de l’amfitrió (pobleDeConfig). El grup del poble que encara no existix: l’anatomia de FilaComunitat, «Avisos, General» i la xinxeta de fixada. onObri(poble) fa el camí del «Comentar» de la pàgina del poble. Mai en selecció ni mentre la llista carrega.'],
        ['PastillaNoLlegits', '{ quants, t, manual?, silenciada? }', '0 · false · false', 'Res amb 0 si no és manual; manual i 0, el punt amb «Marcada com a no llegida»; silenciada, grisa. Amb recompte, mana el número.'],
        ['LlistaConverses · peu', '{ …, avis?, estatBuit?, carregant?, peu? }', 'null', 'Onada 6 · El node del peu va darrere de la llista, FORA de la <ul> (no és cap conversa), i també davall de l’avís (avis) i de l’estat buit; mentre carrega, no. En compacte la reserva de la barra mòbil passa de la llista al peu.'],
        ['BotoInformaDUnError', '{ onPrem, obrint?, reserva?, onCopia?, t }', 'false · null', 'La píndola secundària «Informa d’un error» (aria-busy i desactivada mentre obri). Amb reserva ({ informe, correu }), la nota i dues eixides: «Copia l’informe» (onCopia) i «Envia’l per correu» (mailto: a l’adreça pública).']
      ]}
      a11y={[
        'Cada fila diu el seu tipus en text per a lectors de pantalla («, Grup», «, Canal d’avisos», «, Comunitat»): mai només un dibuix.',
        'Les marques diuen l’estat en text («Enviat», «Llegit»), a més de la forma (una marca o dos): mai només el color.',
        'El punt no és només un color: porta el text «Marcada com a no llegida». La pastilla grisa fa 9,50:1 en clar i 11,51:1 en fosc; el punt gris, 3:1 o més sobre la fila (WCAG 1.4.11).',
        'En selecció, la fila és role="checkbox" amb aria-checked; la barra anuncia el recompte (aria-live).',
        'El menú és role="menu" amb menuitem; en obrir-lo el focus entra a l’opció i Escape el torna al «…».',
        'El peu «Informa d’un error» no és un listitem: el lector de pantalla compta només les converses. La nota de la reserva viu en una regió role="status" sempre muntada, que s’anuncia en aparéixer.'
      ]}
      fes={['Passar les comunitats d’useXat() tal qual: la llista no torna a agrupar.', 'Una sola acció a la barra de selecció: la que té RPC darrere.']}
      noFacis={['Pintar els Avisos i el General com a files soltes: viuen dins de la seua comunitat.', 'Obrir una comunitat com si fóra una conversa.']}>
      <h4>El «…» de la fila de títol, obert</h4>
      <MenuObert onSeleccionar={avisa('Entraria en «Seleccionar xats».')} />

      <h4>Seleccionar xats: 0, 1 i n</h4>
      <Barra quants={0} etiqueta="Selecció amb cap xat" avisa={avisa} />
      <Barra quants={1} etiqueta="Selecció amb un xat" avisa={avisa} />
      <Barra quants={4} etiqueta="Selecció amb quatre xats" avisa={avisa} />

      <h4>Files de conversa: grup, grup de comunitat i canals</h4>
      <ul className="sdp-xat-llista" aria-label="Files de mostra">
        {fila(per['g-festes'])}
        {fila(per['g-almassera'])}
        {fila(per['k-torre'])}
        {fila(per['k-banda'], { activa: true })}
      </ul>

      <h4>Files de conversa: marques, silenci i no llegida a mà</h4>
      <ul className="sdp-xat-llista" aria-label="Files de mostra amb l’estat">
        {filesDEstat.map((fil) => fila(fil))}
      </ul>

      <h4>En selecció: una casella per fila</h4>
      <ul className="sdp-xat-llista" aria-label="Files de mostra en selecció">
        {['g-festes', 'dir-vicent'].map((id) => fila(per[id], { seleccio: { triada: triades.has(id), onAlterna: alterna(id) } }))}
        <li>
          <FilaComunitat comunitat={comunitats[0]} onObri={avisa('Obriria la fitxa de la comunitat.')} t={t}
            seleccio={{ triada: triades.has('comunitat'), onAlterna: alterna('comunitat') }} />
        </li>
      </ul>

      <h4>Fila de comunitat</h4>
      <ul className="sdp-xat-llista" aria-label="Comunitats de mostra">
        {comunitats.map((comunitat) => (
          <li key={comunitat.fil.id}>
            <FilaComunitat comunitat={comunitat} onObri={(id) => setAvis(`Obriria la fitxa de ${id}.`)} t={t} />
          </li>
        ))}
      </ul>

      <h4>Fila del grup del poble (amfitrió)</h4>
      <ul className="sdp-xat-llista" aria-label="Grup del poble de mostra">
        <li data-clau={`poble:${POBLE_DE_MOSTRA.id}`}>
          <FilaPoble poble={POBLE_DE_MOSTRA} onObri={(p) => setAvis(`Obriria o crearia el grup de ${p.nom}.`)} t={t} />
        </li>
      </ul>

      <h4>Peu «Informa d’un error» (beta testers)</h4>
      <ColumnaAmbPeu etiqueta="Llista de mostra amb el peu">
        <LlistaConverses fils={[per['dir-vicent']]} onSelect={(id) => setAvis(`Obriria la conversa ${id}.`)} locale={LOCALE} t={t} joId="jo" peu={peu()} />
      </ColumnaAmbPeu>
      <ColumnaAmbPeu etiqueta="Llista que no s’ha pogut carregar, amb el peu">
        <LlistaConverses fils={[]} locale={LOCALE} t={t} avis="Encara no consta que sigues d’este poble, i el xat és per a la gent del poble." peu={peu()} />
      </ColumnaAmbPeu>
      <ColumnaAmbPeu etiqueta="El xat no s’ha pogut obrir: la reserva">
        <LlistaConverses fils={[]} locale={LOCALE} t={t} estatBuit="Encara no tens cap conversa" peu={peu({ reserva: RESERVA_DE_MOSTRA })} />
      </ColumnaAmbPeu>
      <p role="status">{avis}</p>
    </Especimen>
  );
}
