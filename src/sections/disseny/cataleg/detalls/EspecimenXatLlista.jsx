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
 */
import { useEffect, useRef, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import AppGridColumn from '../../../../components/layout/AppGridColumn.jsx';
import MenuLlista from '../../../xat/components/MenuLlista.jsx';
import BarraSeleccio from '../../../xat/components/BarraSeleccio.jsx';
import FilaConversa, { FilaComunitat } from '../../../xat/components/FilaConversa.jsx';
import { agrupaComunitats, mapejaFil } from '../../../xat/missatges.js';

/* Traductor mínim: les alternatives ja són el text en valencià. */
const t = (clau, alternativa) => alternativa;
const LOCALE = 'ca-ES';
const LOGO = '/assets/system/ui/logo-socdepoble-cuadrat-verd.svg';

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

  return (
    <Especimen id="xat-llista" nom="Xat · llista de converses" fitxer="src/sections/xat/components/ (MenuLlista, BarraSeleccio, FilaConversa)"
      descripcio="La columna de llista calcada de WhatsApp Desktop (onada 3): el «…» redó de la fila de títol amb «Seleccionar xats», la barra que el substituïx mentre es trien xats i les files. Un grup porta la icona de persones i l’avanç «Nom: text»; el General d’una comunitat, la bafarada; un canal («Avisos»), sempre el megàfon, tinga o no imatge. Una comunitat és UNA fila, amb l’avatar quadrat i les targetes apilades, que obri la seua fitxa."
      contracte={[
        ['MenuLlista', '{ onSeleccionar, t, refBoto? }', '—', 'El «…» de la fila de títol; una sola opció, «Seleccionar xats». Escape el tanca i torna el focus al botó.'],
        ['BarraSeleccio', '{ quants, onEixir, onMarcaLlegides, t, refEixir? }', '0', 'La fila de títol durant la selecció: la creu, el recompte i «Marcar com a llegides», desactivat amb 0.'],
        ['FilaConversa', '{ fil, activa, onSelect, locale, t, seleccio?, joId? }', '—', 'Amb seleccio ({ triada, onAlterna }) és una casella: role="checkbox" amb el cercle.'],
        ['FilaComunitat', '{ comunitat, onObri, t, seleccio? }', '—', 'comunitat és una entrada d’useXat().comunitats; la pastilla suma els no llegits dels fills.']
      ]}
      a11y={[
        'Cada fila diu el seu tipus en text per a lectors de pantalla («, Grup», «, Canal d’avisos», «, Comunitat»): mai només un dibuix.',
        'En selecció, la fila és role="checkbox" amb aria-checked; la barra anuncia el recompte (aria-live).',
        'El menú és role="menu" amb menuitem; en obrir-lo el focus entra a l’opció i Escape el torna al «…».'
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
      <p role="status">{avis}</p>
    </Especimen>
  );
}
