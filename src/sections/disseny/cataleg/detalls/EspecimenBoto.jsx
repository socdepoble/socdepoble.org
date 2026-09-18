import { Especimen } from '../Especimen.jsx';
import { useState } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { Camp, CampText, AreaText, Selector, Casella, GrupOpcions, GrupCamps, Interruptor, Boto, Alerta, PillToggle, UniversalSearch } from '../../../../components/PedraSeca/index.js';

export default function EspecimenBoto() {
  const [visible, setVisible] = useState(false);
  return (
    <Especimen id="boto" nom="Boto" fitxer="src/components/PedraSeca/Boto.jsx"
        descripcio="L'única manera de fer un botó. Canonitza sdp-boto, que la Gestoria ja usava sense cap estil." contracte={[ ['varietat', "'primari'|'secundari'|'accent'|'perill'|'fantasma'", "'secundari'", 'Pes visual. Un sol primari per vista.'], ['mida', "'normal'|'gran'", "'normal'", '44px o 56px (accions de bancal).'], ['icona', 'Component lucide', 'null', 'Icona decorativa a l’esquerra.'], ['carregant', 'boolean', 'false', 'Desactiva i escriu «Treballant…».'], ['ple', 'boolean', 'false', 'Ocupa tota l’amplada.'], ['tipus', "'button'|'submit'|'reset'", "'button'", 'Mai submit per accident dins d’un form.'], ]} a11y={['<button>       natiu: Intro i Espai sense JS.', 'aria-busy mentre carrega.', 'Focus visible de 3px amb --sdp-focus.']} fes={['Verb + objecte: «Enviar l’alta», «Publicar la nota».', 'Accent (taronja) només per a publicar o accions d’identitat.']} noFacis={['Botons només amb icona sense aria-label.', 'Dos primaris l’un al costat de l’altre.', 'Usar <div onClick> o <a> sense href com a botó.']}> <div className="sdp-especimen__fila"> <Boto varietat="primari">Primari</Boto> <Boto>Secundari</Boto> <Boto varietat="accent">Publicar</Boto> <Boto varietat="perill" icona={Trash2}>Esborrar</Boto> <Boto varietat="fantasma">Fantasma</Boto> <Boto varietat="primari" carregant>Desant</Boto> <Boto disabled>Desactivat</Boto> </div> <div className="sdp-especimen__fila"><Boto varietat="primari" mida="gran">Gran (56px)</Boto></div> </Especimen> ); }
