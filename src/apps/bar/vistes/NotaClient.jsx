/**
 * El Bar · vistes/NotaClient.jsx — la nota per a ensenyar al client, a
 * pantalla completa (disseny del Bar §A.6, flux 3). NO és cap factura ni cap
 * tiquet fiscal: la llegenda ho diu sempre, «Nota de consum · no és factura».
 * Les línies són les de l'esquelet (LiniesColleccio); l'IVA, informatiu.
 */
import { Boto, Dialeg, LiniesColleccio, Pila, Taula } from '../../../components/PedraSeca/index.js';
import { textNumero } from '../nucli/cobrament.js';
import { TEXTOS_LINIES_BAR, euros, horaCurta, liniesVestides } from './vestits.js';

const LLEGENDA_NOTA = 'Nota de consum · no és factura';

const NOMS_METODE = Object.freeze({ efectiu: 'Efectiu', targeta: 'Targeta (datàfon)', altre: 'Altre' });

/** El desglossament informatiu de l'IVA d'un tiquet, en una taula de Pedra Seca. */
export function TaulaIva({ tiquet }) {
  const grups = tiquet?.totals?.perIva || [];
  if (!grups.length) return null;
  return (
    <Taula titol="IVA inclòs (informatiu)" densa>
      <thead>
        <tr><th scope="col">IVA</th><th scope="col">Base</th><th scope="col">Quota</th></tr>
      </thead>
      <tbody>
        {grups.map((g) => (
          <tr key={g.ivaPercent}><th scope="row">{`${g.ivaPercent} %`}</th><td>{euros(g.baseCents)}</td><td>{euros(g.quotaCents)}</td></tr>
        ))}
      </tbody>
    </Taula>
  );
}

export function NotaClient({ obert, tiquet, establiment, onTanca }) {
  const devolucio = tiquet?.tipus === 'devolucio';
  return (
    <Dialeg obert={Boolean(obert && tiquet)} onTanca={onTanca} mida="completa"
      titol={devolucio ? 'Devolució · no és factura' : LLEGENDA_NOTA}
      descripcio={tiquet ? `${establiment?.nom || 'El Bar'} · ${textNumero(tiquet.numero)} · ${horaCurta(tiquet.tancatA)}` : undefined}
      accions={<Boto varietat="primari" onClick={() => onTanca?.('boto')}>Tanca la nota</Boto>}>
      {tiquet ? (
        <Pila gap={4}>
          <LiniesColleccio linies={liniesVestides(tiquet)} etiqueta="Consumicions" textos={TEXTOS_LINIES_BAR} />
          <p>{`Total: ${euros(tiquet.totals.totalCents)}`}</p>
          <TaulaIva tiquet={tiquet} />
          {tiquet.pagaments.map((p) => (
            <p key={p.id}>
              {`${NOMS_METODE[p.metode]}: ${euros(p.importCents)}`}
              {Number.isSafeInteger(p.lliuratCents) && p.canviCents > 0 ? ` · lliurat ${euros(p.lliuratCents)} · canvi ${euros(p.canviCents)}` : ''}
            </p>
          ))}
          <p>{LLEGENDA_NOTA}</p>
        </Pila>
      ) : null}
    </Dialeg>
  );
}
