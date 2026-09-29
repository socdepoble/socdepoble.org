import { useState } from 'react';
import { Globe, Lock } from 'lucide-react';
import { Especimen } from '../Especimen.jsx';
import { Boto } from '../../../../components/PedraSeca/index.js';
import { SelectorVisibilitat } from '../../../../components/universal/SelectorVisibilitat.jsx';
import { bloqueigDeFitxa, textosDeFitxa } from '../../../profile/visibilitatFitxa.js';
import { bloqueigDeNota, textosDeNota } from '../../../notes/visibilitatNota.js';
import { Llinatge } from '../Llinatge.jsx';

/* T41 (ordre del Mestre, 260928) · «Qui ho pot vore?». La bola del món de la
   barra taronja i PUBLICAR obrin esta finestra (la mateixa finestra de barra
   que el calendari de T40). Tres casos reals, amb els textos de cada
   consumidor: una fitxa privada, una nota ja publicada (no es pot retirar
   del Mur) i la fitxa d'un agent IA (sempre pública). */
const CASOS = [
  { id: 'persona', nom: 'Fitxa privada d’una persona', publica: false, textos: textosDeFitxa('persona'), bloqueig: bloqueigDeFitxa('persona') },
  { id: 'nota', nom: 'Nota publicada al Mur', publica: true, textos: textosDeNota(), bloqueig: bloqueigDeNota({ publicada: true }), comNom: 'Sóc de Poble' },
  { id: 'agent', nom: 'Fitxa d’un agent IA', publica: true, textos: textosDeFitxa('agent'), bloqueig: bloqueigDeFitxa('agent') },
];

export default function EspecimenSelectorVisibilitat() {
  const [obert, setObert] = useState(null);
  const [estats, setEstats] = useState(() => Object.fromEntries(CASOS.map((c) => [c.id, c.publica])));
  return (
    <>
    <Llinatge id="visibilitat" />
    <Especimen id="visibilitat" nom="SelectorVisibilitat · pública o privada, amb avís"
      fitxer="src/components/universal/SelectorVisibilitat.jsx"
      descripcio="La bola del món (o el cadenat) de la barra taronja i el botó PUBLICAR de la barra d’eines ja no canvien res en silenci: obrin esta finestra, que explica les dues eixides i demana confirmació. Diu només el que és cert: on no es pot desfer, no promet que es pot desfer."
      contracte={[
        ['obert / onTanca', "boolean / (motiu: 'esc'|'vel'|'boto'|'fet') => void", '—', 'Controlat pel pare (DocumentEditor en té una sola instància).'],
        ['esPublica', 'boolean', 'false', 'L’estat d’ara: la targeta porta «Com està ara».'],
        ['onTria', '(publica) => Promise<boolean|void>', '—', 'Confirmar sempre la crida; el consumidor decidix. false: es queda oberta. Error: en línia.'],
        ['textos', '{ titol, descripcio, llegenda, publica, privada, reversible, irreversible, avisPublica }', 'genèrics', 'Per consumidor: visibilitatFitxa.js i visibilitatNota.js.'],
        ['bloqueig', "null | { opcio: 'publica'|'privada', motiu }", 'null', 'Eixa eixida no es pot triar, i es diu per què.'],
        ['comNom', 'string | null', 'null', '«Publicaràs com a …»: la identitat que signa, per props.'],
      ]}
      a11y={[
        'Ràdios natius dins d’un fieldset amb llegenda (fletxes de teclat); cada opció és una targeta sencera.',
        'Els errors, en línia amb role="alert"; els bloquejos i els avisos, amb role="status".',
        'Mentre treballa, ni Escape ni el vel la tanquen; el botó principal diu «Treballant…».',
        'El focus torna al botó que l’ha oberta (la bola del món o PUBLICAR).',
      ]}
      fes={['Una sola finestra per a la barra: la data (T40) i la visibilitat comparteixen anatomia.', 'Explicar què passa amb cada eixida abans de confirmar.']}
      noFacis={['Commutar en silenci amb un toast.', 'Dir «ho pots tornar a fer privat» on no hi ha manera de desfer-ho.']}>
      {CASOS.map((cas) => {
        const Icona = estats[cas.id] ? Globe : Lock;
        return (
          <div key={cas.id}>
            <h4>{cas.nom}</h4>
            <Boto onClick={() => setObert(cas.id)} icona={Icona} aria-haspopup="dialog">
              {estats[cas.id] ? cas.textos.publica.etiqueta : cas.textos.privada.etiqueta}: canviar
            </Boto>
            <SelectorVisibilitat
              obert={obert === cas.id}
              onTanca={() => setObert(null)}
              esPublica={estats[cas.id]}
              textos={cas.textos}
              bloqueig={cas.bloqueig}
              comNom={cas.comNom || null}
              onTria={(publica) => {
                setEstats((previ) => ({ ...previ, [cas.id]: publica }));
                return true;
              }}
            />
          </div>
        );
      })}
    </Especimen>
    </>
  );
}
