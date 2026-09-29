/**
 * EspecimenXatNovaConversa.jsx — el diàleg «Nova conversa» del Xat (onada 3,
 * captura 19.12.49; catàleg de l'onada 3B, Pedra Seca §9).
 *
 * DialegNovaConversa és un <dialog> modal (Dialeg de Pedra Seca): només se'n
 * pot veure un alhora. Cada botó l'obri en un dels seus estats amb les
 * dades de mostraDelXat(). Tres estats depenen de les props i s'hi veuen
 * directament en obrir-lo (llista, errorObrir i carregant); els altres tres
 * són estat intern del diàleg i es fan com al Xat, dins del diàleg: escriure
 * al cercador (cerca), prémer «Nou grup» (panell honest) o prémer la fila
 * «(Tu)» sense xat personal (avís personal). El botó ho recorda.
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
  { id: 'llista', etiqueta: 'Llista', pista: 'Les accions i només els dos contactes d’ajuda: Sóc de Poble i IAIA MarIA.' },
  { id: 'cerca', etiqueta: 'Cerca', pista: 'Escriu «ma» al cercador: «Maria la Vall» apareix encara que no l’escrigues amb majúscula.' },
  { id: 'panell', etiqueta: 'Panell honest', pista: 'Prem «Nou grup» o «Nova comunitat»: diu d’on naixen.' },
  { id: 'personal', etiqueta: 'Avís personal', pista: 'Busca «Javi» i prem la teua fila, «Javi Llinares (Tu)»: este poble no obri el xat personal.' },
  { id: 'error', etiqueta: 'Error en obrir', pista: 'L’error de la conversa que no s’ha pogut obrir, dins del diàleg.' },
  { id: 'carregant', etiqueta: 'Carregant', pista: 'El servidor encara no ha respost: «Carregant la gent del poble…».' }
]);

export default function EspecimenXatNovaConversa() {
  const [estat, setEstat] = useState(null);
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
      descripcio="El «+» de la fila de títol obri este diàleg: el cercador amb el focus, «Nou grup» i «Nova comunitat» (que diuen d’on naixen: cap RPC en crea), les dos entrades d’ajuda per defecte. La resta de contactes, freqüents i tu mateix apareixen només amb una cerca. El padró es demana al servidor en obrir-lo i, amb un terme, també amb el terme. Si obrir una conversa falla, l’error es diu dins del diàleg: un toast quedaria davall del vel."
      contracte={[
        ['obert / onTanca', 'boolean / () => void', 'false', 'Controlat, sobre el Dialeg de Pedra Seca (<dialog> natiu).'],
        ['cercaMembres', '(terme | null) => Promise<membre[]>', '—', 'El padró: sense terme en obrir-lo (fins a 100) i amb el terme mentre s’escriu.'],
        ['contactesFrequents', 'membre[]', '[]', 'D’useXat(): només es mostra amb una cerca coincident.'],
        ['joId / joNom / filPersonal', 'string / string / id | null', 'null', 'La fila «(Tu)»: obri el xat personal si existix; si no, avisa.'],
        ['onTriaMembre / obrintAmb', '(membre) => void / id', '—', 'Obri o crea la conversa; mentre, la fila diu que obri.'],
        ['onObriFil / onVes', '(id) => void / (ruta) => void', '—', 'El xat personal i el camí al Mur o a Pobles del panell honest.'],
        ['errorObrir', 'string | null', 'null', 'L’error d’obrir una conversa, pintat dins del diàleg (role="alert").']
      ]}
      a11y={[
        'El focus entra al cercador en obrir-lo i torna al «+» en tancar-lo.',
        'Escape amb text esborra el terme; buit, tanca el diàleg.',
        'Mentre el servidor no ha respost, «Carregant la gent del poble…» (role="status"), mai «Cap contacte».'
      ]}
      fes={['Dir d’on naixen els grups i les comunitats en lloc d’oferir un formulari que no crea res.']}
      noFacis={['Un toast per a l’error: quedaria davall del <dialog> modal.', 'Prometre el xat personal quan el backend no l’obri.']}>
      <div className="sdp-especimen__fila" role="group" aria-label="Estats del diàleg">
        {ESTATS_NOVA_CONVERSA.map((e) => (
          <Boto key={e.id} varietat="secundari" aria-haspopup="dialog" onClick={() => { setEstat(e.id); setAvis(e.pista); }}>
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
        filPersonal={estat === 'personal' ? null : 'personal-jo'}
        onTriaMembre={(membre) => { tanca(); setAvis(`Obriria la conversa amb ${membre.nom}.`); }}
        onObriFil={(id) => { tanca(); setAvis(`Obriria el xat ${id}.`); }}
        onVes={(ruta) => { tanca(); setAvis(`Portaria a ${ruta}.`); }}
      />
    </Especimen>
  );
}
