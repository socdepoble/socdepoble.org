/**
 * El Bar · vistes/NotaClient.jsx — la nota per a ensenyar al client, a
 * pantalla completa (disseny del Bar §A.6, flux 3). NO és cap factura ni cap
 * tiquet fiscal: la llegenda ho diu sempre.
 */
import { Boto, Dialeg, LiniesColleccio, Pila, Taula } from '../../../components/PedraSeca/index.js';
import { textosUiBar } from '../i18nBar.js';
import { textNumero } from '../nucli/cobrament.js';
import { useIdiomaBar } from './punt.js';
import { euros, horaCurta, liniesVestides, textosLiniesBar } from './vestits.js';

function nomMetodeNota(metode, tx) {
  if (metode === 'efectiu') return tx.metodeEfectiu;
  if (metode === 'targeta') return tx.metodeTargetaDatafon;
  return tx.metodeAltre;
}

/** El desglossament informatiu de l'IVA d'un tiquet, en una taula de Pedra Seca. */
export function TaulaIva({ tiquet }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  const grups = tiquet?.totals?.perIva || [];
  if (!grups.length) return null;
  return (
    <Taula titol={tx.ivaInclosInformatiu} densa>
      <thead>
        <tr><th scope="col">{tx.colIva}</th><th scope="col">{tx.colBase}</th><th scope="col">{tx.colQuota}</th></tr>
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
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  const devolucio = tiquet?.tipus === 'devolucio';
  return (
    <Dialeg obert={Boolean(obert && tiquet)} onTanca={onTanca} mida="completa"
      titol={devolucio ? tx.llegendaDevolucio : tx.llegendaNota}
      descripcio={tiquet ? `${establiment?.nom || 'El Bar'} · ${textNumero(tiquet.numero)} · ${horaCurta(tiquet.tancatA)}` : undefined}
      accions={<Boto varietat="primari" onClick={() => onTanca?.('boto')}>{tx.tancaNota}</Boto>}>
      {tiquet ? (
        <Pila gap={4}>
          <LiniesColleccio linies={liniesVestides(tiquet, idioma)} etiqueta={tx.consumicions} textos={textosLiniesBar(idioma)} />
          <p>{tx.totalNota(euros(tiquet.totals.totalCents))}</p>
          <TaulaIva tiquet={tiquet} />
          {tiquet.pagaments.map((p) => (
            <p key={p.id}>
              {`${nomMetodeNota(p.metode, tx)}: ${euros(p.importCents)}`}
              {Number.isSafeInteger(p.lliuratCents) && p.canviCents > 0 ? tx.lliuratCanviNota(euros(p.lliuratCents), euros(p.canviCents)) : ''}
            </p>
          ))}
          <p>{tx.llegendaNota}</p>
        </Pila>
      ) : null}
    </Dialeg>
  );
}
