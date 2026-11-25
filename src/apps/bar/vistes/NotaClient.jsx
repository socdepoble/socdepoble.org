/**
 * El Bar · vistes/NotaClient.jsx — la nota per a ensenyar al client, a
 * pantalla completa (disseny del Bar §A.6, flux 3). NO és cap factura ni cap
 * tiquet fiscal: la llegenda ho diu sempre.
 *
 * Onada v1.2.25 (Lot G2) · Plantilla tèrmica imprimible 58 mm / 80 mm amb
 * `@media print` neta (diferit-impressio-apps.css, que adopta RutaApps.jsx · `[data-sdp-tiquet-termic]`) i 5 llengües.
 */
import { useState } from 'react';
import { Printer } from 'lucide-react';
import { Boto, Dialeg, Fila, LiniesColleccio, PillToggle, Pila, Taula } from '../../../components/PedraSeca/index.js';
import { textosUiBar } from '../i18nBar.js';
import { textNumero } from '../nucli/cobrament.js';
import { useIdiomaBar } from './punt.js';
import { euros, horaCurta, liniesVestides, textosLiniesBar } from './vestits.js';

const TEXTOS_TERMIC = Object.freeze({
  ca: Object.freeze({ ample: 'Format de paper tèrmic', mm58: '58 mm', mm80: '80 mm', imprimix: 'Imprimix tiquet' }),
  es: Object.freeze({ ample: 'Formato de papel térmico', mm58: '58 mm', mm80: '80 mm', imprimix: 'Imprimir tique' }),
  en: Object.freeze({ ample: 'Thermal receipt width', mm58: '58 mm', mm80: '80 mm', imprimix: 'Print receipt' }),
  eu: Object.freeze({ ample: 'Paper termikoaren zabalera', mm58: '58 mm', mm80: '80 mm', imprimix: 'Inprimatu tiketa' }),
  gl: Object.freeze({ ample: 'Formato de papel térmico', mm58: '58 mm', mm80: '80 mm', imprimix: 'Imprimir tícket' })
});

function textosTermic(idioma = 'ca') {
  const codi = String(idioma || 'ca').toLowerCase().slice(0, 2);
  return Object.hasOwn(TEXTOS_TERMIC, codi) ? TEXTOS_TERMIC[codi] : TEXTOS_TERMIC.ca;
}

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

export function NotaClient({ obert, tiquet, establiment, onTanca, onImprimix = null }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  const tt = textosTermic(idioma);
  const [amplePaper, setAmplePaper] = useState('80mm');
  const devolucio = tiquet?.tipus === 'devolucio';
  const imprimix = () => {
    if (typeof onImprimix === 'function') onImprimix(amplePaper);
    else if (typeof window !== 'undefined' && typeof window.print === 'function') window.print();
  };
  return (
    <Dialeg obert={Boolean(obert && tiquet)} onTanca={onTanca} mida="completa"
      titol={devolucio ? tx.llegendaDevolucio : tx.llegendaNota}
      descripcio={tiquet ? `${establiment?.nom || 'El Bar'} · ${textNumero(tiquet.numero)} · ${horaCurta(tiquet.tancatA)}` : undefined}
      accions={(
        <Fila justify="center">
          <Boto varietat="secundari" icona={Printer} onClick={imprimix}>{tt.imprimix}</Boto>
          <Boto varietat="primari" onClick={() => onTanca?.('boto')}>{tx.tancaNota}</Boto>
        </Fila>
      )}>
      {tiquet ? (
        <div data-sdp-tiquet-termic={amplePaper}>
          <Pila gap={4}>
            <div data-sdp-tiquet-controls="1">
              <PillToggle
                etiqueta={tt.ample}
                valor={amplePaper}
                onCanvi={setAmplePaper}
                opcions={[
                  { valor: '58mm', text: tt.mm58 },
                  { valor: '80mm', text: tt.mm80 }
                ]}
              />
            </div>
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
        </div>
      ) : null}
    </Dialeg>
  );
}
