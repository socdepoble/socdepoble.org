import { useState } from 'react';
import { Especimen } from '../Especimen.jsx';
import { BarraResum, LiniesColleccio, TargetesColleccions } from '../../../../components/PedraSeca/index.js';

/* Esquelet comú T4/T8 · la col·lecció en curs: el tiquet del TPV i la llista
   de la compra amb les mateixes peces. Dades sintètiques i preus d'exemple. */
const TIQUET = [
  { id: 'l1', articleId: 'cafe-llet', quantitat: 2, nom: 'Cafè amb llet', detall: 'Got', valor: '3,20 €' },
  { id: 'l2', articleId: 'torrada', quantitat: 1, nom: 'Torrada amb tomaca', detall: 'Sense gluten', valor: '2,50 €' },
  { id: 'l3', articleId: 'aigua', quantitat: 1, nom: 'Aigua', valor: '1,00 €', estat: 'anullat' }
];
const LLISTA = [
  { id: 'c1', articleId: 'llet', quantitat: 2, nom: 'Llet', detall: 'Sense lactosa' },
  { id: 'c2', articleId: 'pomes', quantitat: 1, nom: 'Pomes', detall: '1 kg', estat: 'fet' },
  { id: 'c3', articleId: 'paper', quantitat: 1, nom: 'Paper de cuina' }
];
const linies = (n) => `${n} ${n === 1 ? 'línia' : 'línies'}`;

export default function EspecimenColleccio() {
  const [llista, setLlista] = useState(LLISTA);
  const [avis, setAvis] = useState('Prova les accions de les línies.');
  const marca = (linia) => setLlista((actuals) => actuals.map((l) => (l.id === linia.id ? { ...l, estat: l.estat === 'fet' ? 'normal' : 'fet' } : l)));
  return (
    <Especimen id="colleccio" nom="LiniesColleccio · BarraResum · TargetesColleccions" fitxer="src/components/PedraSeca/organismes/LiniesColleccio.jsx · BarraResum.jsx · TargetesColleccions.jsx"
      descripcio="La col·lecció en curs i el que l’envolta: les línies («quantitat × nom», detall, valor i estat), la barra de resum (capçalera del panell en tauleta, peu que obri la col·lecció en el mòbil) i les col·leccions com a targetes amb comptador (tiquets oberts, llistes)."
      contracte={[
        ['LiniesColleccio', '{ linies: [{ id, articleId, quantitat, nom, detall?, valor?, estat? }], onTria?, onEdita?, onResta?, onSuma?, onLleva?, textos? }', '—', 'estat: normal, fet o anullat (amb text). Sense onTria, el toc edita.'],
        ['BarraResum', "{ etiqueta, comptador, textComptador(n), total?, accio?: { text, onClick, desactivada? }, forma: 'capcalera' | 'peu', href?, onObri? }", "'capcalera'", 'Un sol primari: en el peu amb acció, obrir passa a secundari.'],
        ['TargetesColleccions', '{ colleccions: [{ id, nom, comptador, secundari?, imatge? }], actiu?, hrefDe?(c), onTria?(c), onCrea?, textCrea?, textComptador?(n) }', '—', 'Amb hrefDe són enllaços (pestanya nova inclosa); l’oberta diu aria-current.']
      ]}
      a11y={['«2 ×» es llig «2 unitats de», no un signe.', 'Les accions de cada línia porten el nom de la línia («Resta una unitat: Aigua»).', 'El comptador sempre diu què compta («3 línies», «7 articles»).']}
      fes={['Passar els imports ja formats.', 'Dir l’estat amb text: «Comprat», «Anul·lat».']}
      noFacis={['Posar dos primaris junts a la barra.', 'Fer un tiquet o una llista amb peces pròpies.']}>
      <h4>Tiquet del TPV</h4>
      <BarraResum etiqueta="Comanda" comptador={TIQUET.length} textComptador={linies} total="5,70 €"
        accio={{ text: 'Cobra', onClick: () => setAvis('Cobrament de mostra: no s’ha cobrat res.') }} />
      <LiniesColleccio linies={TIQUET} etiqueta="Comanda de mostra"
        onEdita={(l) => setAvis(`Edita: ${l.nom}.`)} onResta={(l) => setAvis(`Una unitat menys: ${l.nom}.`)}
        onSuma={(l) => setAvis(`Una unitat més: ${l.nom}.`)} onLleva={(l) => setAvis(`Lleva: ${l.nom}.`)} />
      <h4>Llista de la compra</h4>
      <LiniesColleccio linies={llista} etiqueta="Llista de mostra" onTria={marca} onEdita={(l) => setAvis(`Especificació de ${l.nom}.`)}
        textos={{ fet: 'Comprat' }} />
      <h4>Peu del mòbil</h4>
      <div className="sdp-especimen__mostra sdp-especimen__mostra--estreta">
        <BarraResum forma="peu" etiqueta="Comanda" comptador={TIQUET.length} textComptador={linies} total="5,70 €"
          onObri={() => setAvis('Obri la comanda (en l’app, el panell de la col·lecció).')} />
      </div>
      <h4>Col·leccions</h4>
      <TargetesColleccions etiqueta="Tiquets oberts de mostra" actiu="barra" textComptador={linies}
        colleccions={[{ id: 'barra', nom: 'Barra', comptador: 3 }, { id: 'taula-3', nom: 'Taula 3', comptador: 5, secundari: 'Saló' }]}
        onTria={(c) => setAvis(`Obri el tiquet: ${c.nom}.`)} onCrea={() => setAvis('Nou tiquet de mostra.')} textCrea="Nou tiquet" />
      <p role="status">{avis}</p>
    </Especimen>
  );
}
