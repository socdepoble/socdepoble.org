/**
 * El Bar · vistes/EditorLinia.jsx — tocar una línia de la comanda l'edita
 * (disseny del Bar §A.6, flux 1.4): quantitat i nota (si encara és nova),
 * descompte, convidar o anul·lar (si ja ha marxat, sempre amb motiu).
 * Un Dialeg de Pedra Seca: cap llista ni graella pròpia. La línia oberta va
 * a la URL (?linia=<id>) i arrere el tanca.
 */
import { useState } from 'react';
import {
  Boto, Camp, CampText, AreaText, Dialeg, Fila, PillToggle, Pila, TeclatNumeric
} from '../../../components/PedraSeca/index.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { AvisOperacio } from './comu.jsx';
import { detallDeLinia, euros } from './vestits.js';
import { brutLinia, totalLinia } from '../nucli/linia.js';

const ACCIONS = Object.freeze({
  nova: [{ valor: 'quantitat', text: 'Quantitat' }, { valor: 'nota', text: 'Nota' }, { valor: 'descompte', text: 'Descompte' }, { valor: 'convida', text: 'Convida' }],
  marxada: [{ valor: 'descompte', text: 'Descompte' }, { valor: 'convida', text: 'Convida' }, { valor: 'anulla', text: 'Anul·la' }]
});

function Formulari({ comanda, linia, onFet }) {
  const { accions } = useBar();
  const opcions = ACCIONS[linia.estat] || [];
  const [accio, setAccio] = useState(opcions[0]?.valor || null);
  const [quantitat, setQuantitat] = useState(linia.quantitat);
  const [nota, setNota] = useState(linia.nota || '');
  const [tipus, setTipus] = useState('percent');
  const [valor, setValor] = useState(0);
  const [motiu, setMotiu] = useState('');
  const [aAnullar, setAAnullar] = useState(linia.quantitat);
  const fet = (resultat) => resultat.then((r) => { if (r.ok) onFet(); });
  const campMotiu = (
    <Camp etiqueta="Motiu" ajuda="Queda al tancament del torn." obligatori>
      <CampText value={motiu} maxLength={80} onChange={(event) => setMotiu(event.target.value)} />
    </Camp>
  );
  if (!accio) return <p>Esta línia està anul·lada: ja no es pot canviar.</p>;
  return (
    <Pila gap={4}>
      <AvisOperacio />
      <PillToggle etiqueta="Què vols fer amb la línia" valor={accio} onCanvi={setAccio} opcions={opcions} />
      {accio === 'quantitat' ? (
        <>
          <TeclatNumeric mode="quantitat" etiqueta="Unitats" valor={quantitat} onCanvi={setQuantitat} maxim={999}
            onAccepta={(q) => fet(accions.canviaQuantitat(comanda.id, linia.id, q))} textAccepta="Desa la quantitat" />
          <Boto varietat="perill" onClick={() => fet(accions.canviaQuantitat(comanda.id, linia.id, 0))}>Lleva la línia</Boto>
        </>
      ) : null}
      {accio === 'nota' ? (
        <>
          <Camp etiqueta="Nota per a la barra o la cuina">
            <AreaText files={2} maxLength={80} value={nota} onChange={(event) => setNota(event.target.value)} />
          </Camp>
          <Boto varietat="primari" onClick={() => fet(accions.canviaNota(comanda.id, linia.id, nota))}>Desa la nota</Boto>
        </>
      ) : null}
      {accio === 'descompte' ? (
        <>
          <PillToggle etiqueta="Tipus de descompte" valor={tipus} onCanvi={(nou) => { setTipus(nou); setValor(0); }}
            opcions={[{ valor: 'percent', text: 'Percentatge' }, { valor: 'import', text: 'Import' }]} />
          <TeclatNumeric mode={tipus === 'percent' ? 'quantitat' : 'import'} unitat="%" maxim={tipus === 'percent' ? 100 : brutLinia(linia)}
            etiqueta={tipus === 'percent' ? 'Percentatge' : 'Import del descompte'} valor={valor} onCanvi={setValor} />
          {campMotiu}
          <Fila gap={2}>
            <Boto varietat="primari" disabled={valor < 1} onClick={() => fet(accions.descompte(comanda.id, linia.id, { tipus, valor, motiu }))}>Aplica el descompte</Boto>
            {linia.descompte ? <Boto onClick={() => fet(accions.descompte(comanda.id, linia.id, null))}>Lleva el descompte</Boto> : null}
          </Fila>
        </>
      ) : null}
      {accio === 'convida' ? (
        <>
          <p>{`La línia passa a 0 i queda com a convidada (${euros(brutLinia(linia))}).`}</p>
          {campMotiu}
          <Boto varietat="primari" onClick={() => fet(accions.convida(comanda.id, linia.id, motiu))}>Convida</Boto>
        </>
      ) : null}
      {accio === 'anulla' ? (
        <>
          <TeclatNumeric mode="quantitat" etiqueta="Unitats a anul·lar" valor={aAnullar} onCanvi={setAAnullar} maxim={linia.quantitat} />
          {campMotiu}
          <Boto varietat="perill" disabled={aAnullar < 1}
            onClick={() => fet(accions.anulla(comanda.id, linia.id, { motiu, quantitat: aAnullar }))}>Anul·la</Boto>
        </>
      ) : null}
    </Pila>
  );
}

/** `liniaId`: la línia oberta (de la URL) o null. */
export function EditorLinia({ comanda, liniaId, onTanca }) {
  const linia = comanda?.linies.find((l) => l.id === liniaId) || null;
  return (
    <Dialeg obert={Boolean(linia)} onTanca={onTanca} titol={linia ? `${linia.quantitat} × ${linia.nomCongelat}` : 'Línia'}
      descripcio={linia ? [detallDeLinia(linia), euros(totalLinia(linia))].filter(Boolean).join(' · ') : undefined}
      accions={<Boto onClick={() => onTanca?.('boto')}>Tanca</Boto>}>
      {linia ? <Formulari key={`${linia.id}-${linia.estat}-${linia.quantitat}`} comanda={comanda} linia={linia} onFet={() => onTanca?.('fet')} /> : null}
    </Dialeg>
  );
}
