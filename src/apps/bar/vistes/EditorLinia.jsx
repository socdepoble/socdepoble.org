/**
 * El Bar · vistes/EditorLinia.jsx — tocar una línia de la comanda l'edita
 * (disseny del Bar §A.6, flux 1.4).
 */
import { useState } from 'react';
import {
  Boto, Camp, CampText, AreaText, Dialeg, Fila, PillToggle, Pila, TeclatNumeric
} from '../../../components/PedraSeca/index.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { textosUiBar } from '../i18nBar.js';
import { AvisOperacio } from './comu.jsx';
import { useIdiomaBar, useUnaVegada } from './punt.js';
import { detallDeLinia, euros } from './vestits.js';
import { brutLinia, totalLinia } from '../nucli/linia.js';

function accionsDeLinia(estat, tx) {
  if (estat === 'nova') {
    return [
      { valor: 'quantitat', text: tx.accioQuantitat },
      { valor: 'nota', text: tx.accioNota },
      { valor: 'descompte', text: tx.accioDescompte },
      { valor: 'convida', text: tx.accioConvida }
    ];
  }
  if (estat === 'marxada') {
    return [
      { valor: 'descompte', text: tx.accioDescompte },
      { valor: 'convida', text: tx.accioConvida },
      { valor: 'anulla', text: tx.accioAnulla }
    ];
  }
  return [];
}

function Formulari({ comanda, linia, onFet, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { accions } = useBar();
  const opcions = accionsDeLinia(linia.estat, tx);
  const [accio, setAccio] = useState(opcions[0]?.valor || null);
  const [quantitat, setQuantitat] = useState(linia.quantitat);
  const [nota, setNota] = useState(linia.nota || '');
  const [tipus, setTipus] = useState('percent');
  const [valor, setValor] = useState(0);
  const [motiu, setMotiu] = useState('');
  const [aAnullar, setAAnullar] = useState(linia.quantitat);
  const [, unaVegada] = useUnaVegada();
  const fet = (operacio) => unaVegada(async () => {
    const r = await operacio();
    if (r.ok) onFet();
  });
  const campMotiu = (
    <Camp etiqueta={tx.motiuEtiqueta} ajuda={tx.motiuAjudaTancament} obligatori>
      <CampText value={motiu} maxLength={80} onChange={(event) => setMotiu(event.target.value)} />
    </Camp>
  );
  if (!accio) return <p>{tx.liniaAnulladaNoCanvia}</p>;
  return (
    <Pila gap={4}>
      <AvisOperacio />
      <PillToggle etiqueta={tx.queVolsFerLinia} valor={accio} onCanvi={setAccio} opcions={opcions} />
      {accio === 'quantitat' ? (
        <>
          <TeclatNumeric mode="quantitat" etiqueta={tx.unitatsEtiqueta} valor={quantitat} onCanvi={setQuantitat} maxim={999}
            onAccepta={(q) => fet(() => accions.canviaQuantitat(comanda.id, linia.id, q))} textAccepta={tx.desaQuantitat} />
          <Boto varietat="perill" onClick={() => fet(() => accions.canviaQuantitat(comanda.id, linia.id, 0))}>{tx.llevaLinia}</Boto>
        </>
      ) : null}
      {accio === 'nota' ? (
        <>
          <Camp etiqueta={tx.notaBarraCuina}>
            <AreaText files={2} maxLength={80} value={nota} onChange={(event) => setNota(event.target.value)} />
          </Camp>
          <Boto varietat="primari" onClick={() => fet(() => accions.canviaNota(comanda.id, linia.id, nota))}>{tx.desaNota}</Boto>
        </>
      ) : null}
      {accio === 'descompte' ? (
        <>
          <PillToggle etiqueta={tx.tipusDescompte} valor={tipus} onCanvi={(nou) => { setTipus(nou); setValor(0); }}
            opcions={[{ valor: 'percent', text: tx.percentatge }, { valor: 'import', text: tx.importEtiqueta }]} />
          <TeclatNumeric mode={tipus === 'percent' ? 'quantitat' : 'import'} unitat="%" maxim={tipus === 'percent' ? 100 : brutLinia(linia)}
            etiqueta={tipus === 'percent' ? tx.percentatge : tx.importDescompte} valor={valor} onCanvi={setValor} />
          {campMotiu}
          <Fila gap={2}>
            <Boto varietat="primari" disabled={valor < 1} onClick={() => fet(() => accions.descompte(comanda.id, linia.id, { tipus, valor, motiu }))}>{tx.aplicaDescompte}</Boto>
            {linia.descompte ? <Boto onClick={() => fet(() => accions.descompte(comanda.id, linia.id, null))}>{tx.llevaDescompte}</Boto> : null}
          </Fila>
        </>
      ) : null}
      {accio === 'convida' ? (
        <>
          <p>{tx.convidaExplicacio(euros(brutLinia(linia)))}</p>
          {campMotiu}
          <Boto varietat="primari" onClick={() => fet(() => accions.convida(comanda.id, linia.id, motiu))}>{tx.accioConvida}</Boto>
        </>
      ) : null}
      {accio === 'anulla' ? (
        <>
          <TeclatNumeric mode="quantitat" etiqueta={tx.unitatsAAnullar} valor={aAnullar} onCanvi={setAAnullar} maxim={linia.quantitat} />
          {campMotiu}
          <Boto varietat="perill" disabled={aAnullar < 1}
            onClick={() => fet(() => accions.anulla(comanda.id, linia.id, { motiu, quantitat: aAnullar }))}>{tx.accioAnulla}</Boto>
        </>
      ) : null}
    </Pila>
  );
}

/** `liniaId`: la línia oberta (de la URL) o null. */
export function EditorLinia({ comanda, liniaId, onTanca }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  const linia = comanda?.linies.find((l) => l.id === liniaId) || null;
  return (
    <Dialeg obert={Boolean(linia)} onTanca={onTanca} titol={linia ? `${linia.quantitat} × ${linia.nomCongelat}` : tx.liniaTitol}
      descripcio={linia ? [detallDeLinia(linia, idioma), euros(totalLinia(linia))].filter(Boolean).join(' · ') : undefined}
      accions={<Boto onClick={() => onTanca?.('boto')}>{tx.tanca}</Boto>}>
      {linia ? <Formulari key={`${linia.id}-${linia.estat}-${linia.quantitat}`} comanda={comanda} linia={linia} idioma={idioma} onFet={() => onTanca?.('fet')} /> : null}
    </Dialeg>
  );
}
