/**
 * EspecimenXatNovaConversa.jsx — el diàleg «Nova conversa» del Xat (onada 3,
 * captura 19.12.49; catàleg de l'onada 3B, Pedra Seca §9).
 *
 * DialegNovaConversa és un <dialog> modal (Dialeg de Pedra Seca): només se'n
 * pot veure un alhora. Cada botó l'obri en un dels seus estats amb les
 * dades de mostraDelXat(). Tres estats depenen de les props i s'hi veuen
 * directament en obrir-lo (llista, errorObrir i carregant); els altres són
 * estat intern del diàleg i es fan com al Xat, dins del diàleg: escriure al
 * cercador (cerca), prémer «Nou grup» (panell honest) o prémer la fila «(Tu)»
 * quan el backend no obri el xat propi (per confirmar i avís personal). El
 * botó ho recorda.
 *
 * R21 (carril f2) · La fila «(Tu)» diu la veritat del backend (`xatPropi`,
 * XatContext): dalt de tot només si l'obri ('disponible': la llavor, el mode
 * local o un servidor que ja n'ha tornat o creat un). En remot sense la
 * migració 2611121630_xat_propi, la fila només ix amb una cerca i prémer-la
 * acaba en l'avís honest, mai en un error mut. L'estat «Per confirmar» fa de
 * servidor de mostra que respon SDP-XAT-002.
 */
import { useMemo, useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { Boto } from '../../../../components/PedraSeca/index.js';
import DialegNovaConversa from '../../../xat/components/DialegNovaConversa.jsx';
import { contactesFrequents as calculaFrequents } from '../../../xat/missatges.js';
import { mostraDelXat } from './EspecimenXatLlista.jsx';

const t = (clau, alternativa) => alternativa;

/* Una promesa que no es resol mai: el servidor que no respon. */
const maiNoRespon = () => new Promise(() => {});

export const ESTATS_NOVA_CONVERSA = Object.freeze([
  { id: 'llista', etiqueta: 'Llista', pista: 'El backend obri el xat propi: «Javi Llinares (Tu)» va dalt de «Contactes a Sóc de Poble», amb les accions i els dos contactes d’ajuda, Sóc de Poble i IAIA MarIA.' },
  { id: 'cerca', etiqueta: 'Cerca', pista: 'Escriu «ma» al cercador: «Maria la Vall» apareix encara que no l’escrigues amb majúscula.' },
  { id: 'panell', etiqueta: 'Panell honest', pista: 'Prem «Nou grup» o «Nova comunitat»: diu d’on naixen.' },
  { id: 'confirmar', etiqueta: 'Per confirmar', pista: 'El servidor encara no ha dit si obri el xat propi: la fila «(Tu)» no va dalt. Busca «Javi» i prem-la: el servidor de mostra respon que no i ix l’avís honest.' },
  { id: 'personal', etiqueta: 'Avís personal', pista: 'El servidor ja ha dit que no obri el xat propi: busca «Javi» i prem la teua fila, «Javi Llinares (Tu)». L’avís honest, sense cap petició.' },
  { id: 'error', etiqueta: 'Error en obrir', pista: 'L’error de la conversa que no s’ha pogut obrir, dins del diàleg.' },
  { id: 'carregant', etiqueta: 'Carregant', pista: 'El servidor encara no ha respost: «Carregant la gent del teu poble…».' }
]);

/* El que el backend de mostra acredita del xat propi en cada estat. */
const xatPropiDe = (estat) => (estat === 'confirmar' ? 'per-confirmar' : estat === 'personal' ? 'no' : 'disponible');

export default function EspecimenXatNovaConversa() {
  const [estat, setEstat] = useState(null);
  const [xatPropi, setXatPropi] = useState('disponible');
  const [avis, setAvis] = useState('Tria un estat i obri el diàleg.');
  const { membres } = useMemo(() => mostraDelXat(), []);
  const frequents = useMemo(() => calculaFrequents([
    { id: 'dir-joan', tipus: 'directe', altres: [{ id: 'p-joan', nom: 'Joan Baptiste', tipus: 'persona' }], ultimAl: new Date().toISOString() }
  ], membres, 'jo'), [membres]);
  const tanca = () => setEstat(null);
  /* El padró de mostra: tot sense terme i, amb terme, el que el conté. */
  const cercaMembres = useMemo(() => (estat === 'carregant'
    ? maiNoRespon
    : async (terme) => (terme ? membres.filter((m) => m.nom.toLowerCase().includes(String(terme).toLowerCase())) : membres)),
  [estat, membres]);
  const pista = ESTATS_NOVA_CONVERSA.find((e) => e.id === estat)?.pista;

  return (
    <Especimen id="xat-nova-conversa" nom="Xat · Nova conversa" fitxer="src/sections/xat/components/DialegNovaConversa.jsx"
      descripcio="El «+» de la fila de títol obri este diàleg: el cercador amb el focus, «Nou grup» i «Nova comunitat» (que diuen d’on naixen: cap RPC en crea), les dos entrades d’ajuda per defecte. La teua fila «(Tu)» va dalt de «Contactes a Sóc de Poble» només quan el backend obri el xat propi; si encara no ho ha dit o ha dit que no, apareix només amb una cerca, i prémer-la acaba en l’avís honest si el servidor no l’obri. La resta de contactes i els freqüents apareixen només amb una cerca. El padró es demana al servidor en obrir-lo i, amb un terme, també amb el terme. Si obrir una conversa falla, l’error es diu dins del diàleg: un toast quedaria davall del vel."
      contracte={[
        ['obert / onTanca', 'boolean / () => void', 'false', 'Controlat, sobre el Dialeg de Pedra Seca (<dialog> natiu).'],
        ['cercaMembres', '(terme | null) => Promise<membre[]>', '—', 'El padró: sense terme en obrir-lo (fins a 100) i amb el terme mentre s’escriu.'],
        ['contactesFrequents', 'membre[]', '[]', 'D’useXat(): només es mostra amb una cerca coincident.'],
        ['joId / joNom / joAvatar / filPersonal', 'string / string / url / id | null', 'null', 'La fila «(Tu)»: si ja hi ha un fil propi a la llista, l’obri.'],
        ['xatPropi', "'disponible' | 'per-confirmar' | 'no' | null", "'no'", 'D’useXat(): el que el backend acredita. Disponible, dalt de tot i obri o crea el fil; per confirmar, només amb cerca i prémer-la pregunta al servidor; no, només amb cerca i l’avís honest sense cap petició; null, cap fila.'],
        ['onTriaMembre / obrintAmb', '(membre) => void / id', '—', 'Obri o crea la conversa; mentre, la fila diu que obri.'],
        ['onObriFil / onVes', '(id) => void / (ruta) => void', '—', 'El xat personal i el camí al Mur o a Pobles del panell honest.'],
        ['errorObrir', 'string | null', 'null', 'L’error d’obrir una conversa, pintat dins del diàleg (role="alert").']
      ]}
      a11y={[
        'El focus entra al cercador en obrir-lo i torna al «+» en tancar-lo.',
        'Escape amb text esborra el terme; buit, tanca el diàleg.',
        'Mentre el servidor no ha respost, «Carregant la gent del teu poble…» (role="status"), mai «Cap contacte».'
      ]}
      fes={['Dir d’on naixen els grups i les comunitats en lloc d’oferir un formulari que no crea res.']}
      noFacis={['Un toast per a l’error: quedaria davall del <dialog> modal.', 'Prometre el xat personal quan el backend no l’obri: ni fila fixa dalt ni un clic que acabe en un error mut.']}>
      <div className="sdp-especimen__fila" role="group" aria-label="Estats del diàleg">
        {ESTATS_NOVA_CONVERSA.map((e) => (
          <Boto key={e.id} varietat="secundari" aria-haspopup="dialog" onClick={() => { setEstat(e.id); setXatPropi(xatPropiDe(e.id)); setAvis(e.pista); }}>
            {e.etiqueta}
          </Boto>
        ))}
      </div>
      <p role="status">{pista || avis}</p>
      <DialegNovaConversa
        obert={estat != null}
        onTanca={tanca}
        errorObrir={estat === 'error' ? "No s'ha pogut obrir la conversa: el servidor no respon." : null}
        t={t}
        cercaMembres={cercaMembres}
        contactesFrequents={estat === 'carregant' ? [] : frequents}
        joId="jo"
        joNom="Javi Llinares"
        xatPropi={xatPropi}
        filPersonal={xatPropi === 'disponible' ? 'personal-jo' : null}
        onTriaMembre={(membre) => {
          /* «Per confirmar»: el servidor de mostra respon SDP-XAT-002 al xat
             propi (sense 2611121630) i el diàleg es queda obert amb l'avís. */
          if (estat === 'confirmar' && membre.usuari_id === 'jo') { setXatPropi('no'); return; }
          tanca(); setAvis(`Obriria la conversa amb ${membre.nom}.`);
        }}
        onObriFil={(id) => { tanca(); setAvis(`Obriria el xat ${id}.`); }}
        onVes={(ruta) => { tanca(); setAvis(`Portaria a ${ruta}.`); }}
      />
    </Especimen>
  );
}
