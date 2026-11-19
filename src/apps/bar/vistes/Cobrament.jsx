/**
 * El Bar · vistes/Cobrament.jsx — cobrar i dividir el compte (disseny del Bar
 * §A.6, fluxos 3 i 4).
 */
import { useState } from 'react';
import { Banknote, CreditCard, Wallet } from 'lucide-react';
import {
  Alerta, BarraResum, Boto, Fila, LiniesColleccio, PillToggle, TeclatNumeric
} from '../../../components/PedraSeca/index.js';
import { useParametresConsulta } from '../../plataforma/index.js';
import { totals } from '../nucli/comanda.js';
import { suggerimentsEfectiu } from '../nucli/cobrament.js';
import { MAX_PARTS, partsIguals } from '../nucli/divisio.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { textosUiBar } from '../i18nBar.js';
import { AvisOperacio, Columna, NoTrobat, Preparat } from './comu.jsx';
import { ambTornada, esTornaTpv, useIdiomaBar, usePunt, useUnaVegada, useVes } from './punt.js';
import { euros, textLiniesPerIdioma } from './vestits.js';

const PARAMETRES_COBRAMENT = Object.freeze({ metode: (valor) => valor === 'targeta' || valor === 'altre', torna: esTornaTpv });
const PARAMETRES_DIVISIO = Object.freeze({ mode: (valor) => valor === 'parts', torna: esTornaTpv });

function metodesPagament(tx) {
  return [
    { valor: 'efectiu', text: tx.metodeEfectiu, icona: <Banknote size={20} aria-hidden="true" focusable="false" /> },
    { valor: 'targeta', text: tx.metodeTargeta, icona: <CreditCard size={20} aria-hidden="true" focusable="false" /> },
    { valor: 'altre', text: tx.metodeAltre, icona: <Wallet size={20} aria-hidden="true" focusable="false" /> }
  ];
}

function useEnTancar(tornaTpv = false) {
  const { ves } = useVes();
  return (resultat) => {
    if (resultat.ok && resultat.valor?.tiquet) ves('tiquets', `${resultat.valor.tiquet.id}?nota=1${tornaTpv ? '&torna=tpv' : ''}`);
  };
}

export function CobramentCaixa({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.cobra}>
      <Cobrament params={params} idioma={idioma} />
    </Preparat>
  );
}

function Cobrament({ params, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { accions, permis } = useBar();
  const punt = usePunt(params);
  const [consulta, posaConsulta] = useParametresConsulta(PARAMETRES_COBRAMENT);
  const tornaTpv = consulta.torna === 'tpv';
  const enTancar = useEnTancar(tornaTpv);
  const [ocupat, unaVegada] = useUnaVegada();
  const [lliurat, setLliurat] = useState(0);
  const [importTargeta, setImportTargeta] = useState(null);
  const metode = consulta.metode || 'efectiu';
  const ven = permis.potEscriure;
  const { comanda } = punt;
  if (punt.perduda || !comanda) {
    const tornaBuit = tornaTpv ? { etiqueta: tx.tornaAlTpv, trams: ['tpv'] } : { etiqueta: tx.tornaALaCaixa, trams: punt.trams };
    return <NoTrobat titol={tx.resACobrar} text={tx.comandaTancadaOBuida} torna={tornaBuit} />;
  }
  const t = totals(comanda);
  const pendent = t.pendentCents;
  const torna = tornaTpv ? { etiqueta: tx.tornaAlTpv, trams: ['tpv', comanda.id] } : { etiqueta: tx.tornaALaComanda, trams: punt.trams };
  const paga = (pagament, despres) => unaVegada(async () => {
    const r = await accions.paga(comanda.id, pagament);
    despres?.();
    enTancar(r);
  });
  const cobraEfectiu = (lliuratCents) => {
    paga({ metode: 'efectiu', importCents: Math.min(lliuratCents, pendent), lliuratCents });
    setLliurat(0);
  };
  const triaMetode = (nou) => {
    posaConsulta({ metode: nou === 'efectiu' ? null : nou });
    setImportTargeta(null);
  };
  const altre = metode !== 'efectiu';
  const importAltre = importTargeta === null ? pendent : importTargeta;
  const resum = (
    <BarraResum etiqueta={t.pagatCents > 0 ? tx.pendentEtiqueta : tx.aCobrar} comptador={comanda.linies.filter((l) => l.estat !== 'anullada').length}
      textComptador={textLiniesPerIdioma(idioma)} total={euros(pendent)} textTotal={tx.pendentEtiqueta}
      accio={pendent > 0 && !altre ? { text: tx.exacteEfectiu(euros(pendent)), desactivada: !ven, onClick: () => cobraEfectiu(pendent) } : null} />
  );
  return (
    <Columna titol={tx.cobra} torna={torna} eines={resum}>
      <AvisOperacio />
      {t.pagatCents > 0 ? <Alerta to="info" viva={false}>{tx.jaCobratDeTotal(euros(t.pagatCents), euros(t.totalCents))}</Alerta> : null}
      <PillToggle etiqueta={tx.metodePagament} valor={metode} onCanvi={triaMetode} opcions={metodesPagament(tx)} />
      {metode === 'efectiu' ? (
        <>
          <Fila gap={2}>
            {suggerimentsEfectiu(pendent).map((cents) => (
              <Boto key={cents} mida="gran" disabled={ocupat || !ven} onClick={() => cobraEfectiu(cents)}>{euros(cents)}</Boto>
            ))}
          </Fila>
          <TeclatNumeric mode="import" etiqueta={tx.lliurat} valor={lliurat} onCanvi={setLliurat}
            onAccepta={(cents) => { if (cents > 0) cobraEfectiu(cents); }}
            textAccepta={lliurat >= pendent ? tx.cobraITornaCanvi : tx.cobraImportPart} desactivat={pendent <= 0 || !ven} />
          {lliurat > 0 ? (
            lliurat >= pendent
              ? <BarraResum etiqueta={tx.canvi} comptador={0} textComptador={() => ''} total={euros(lliurat - pendent)} textTotal={tx.canvi} />
              : <Alerta to="info" viva={false}>{tx.pagamentParcialQuedaran(euros(pendent - lliurat))}</Alerta>
          ) : null}
        </>
      ) : (
        <>
          <Alerta to="info" viva={false} titol={metode === 'targeta' ? tx.cobraAmbDatafon : tx.unAltreMetode}>
            {tx.avisTpvNoCobra}
          </Alerta>
          <TeclatNumeric mode="import" etiqueta={tx.importEtiqueta} valor={importAltre} maxim={pendent} onCanvi={setImportTargeta} desactivat={!ven} />
          <Boto varietat="primari" ple mida="gran" disabled={ocupat || !ven || importAltre < 1 || importAltre > pendent}
            onClick={() => paga({ metode, importCents: importAltre }, () => setImportTargeta(null))}>
            {metode === 'targeta' ? tx.datafonHaCobrat(euros(importAltre)) : tx.anotaCobrats(euros(importAltre))}
          </Boto>
        </>
      )}
    </Columna>
  );
}

export function DivisioCaixa({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.dividixCompte}>
      <Divisio params={params} idioma={idioma} />
    </Preparat>
  );
}

function Divisio({ params, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { accions, permis } = useBar();
  const ven = permis.potEscriure;
  const { ves } = useVes();
  const punt = usePunt(params);
  const [consulta, posaConsulta] = useParametresConsulta(PARAMETRES_DIVISIO);
  const tornaTpv = consulta.torna === 'tpv';
  const enTancar = useEnTancar(tornaTpv);
  const [ocupat, unaVegada] = useUnaVegada();
  const [seleccio, setSeleccio] = useState({});
  const [parts, setParts] = useState(2);
  const mode = consulta.mode || 'linies';
  const { comanda } = punt;
  if (punt.perduda || !comanda) {
    const tornaBuit = tornaTpv ? { etiqueta: tx.tornaAlTpv, trams: ['tpv'] } : { etiqueta: tx.tornaALaCaixa, trams: punt.trams };
    return <NoTrobat titol={tx.resADividir} text={tx.comandaTancadaOBuida} torna={tornaBuit} />;
  }
  const torna = tornaTpv ? { etiqueta: tx.tornaAlTpv, trams: ['tpv', comanda.id] } : { etiqueta: tx.tornaALaComanda, trams: punt.trams };
  const t = totals(comanda);
  const vives = comanda.linies.filter((l) => l.estat !== 'anullada');
  const canvia = (linia, pas) => setSeleccio((actual) => {
    const original = vives.find((l) => l.id === linia.id);
    const nou = Math.min(original.quantitat, Math.max(0, (actual[linia.id] || 0) + pas));
    return { ...actual, [linia.id]: nou };
  });
  const triades = Object.entries(seleccio).filter(([, q]) => q > 0).map(([liniaId, quantitat]) => ({ liniaId, quantitat }));
  const separa = () => unaVegada(async () => {
    const r = await accions.divideix(comanda.id, triades);
    if (r.ok) ves('caixa', r.valor.id, ambTornada('cobrar', tornaTpv));
    else if (r.error?.codi === 'CONFLICTE') setSeleccio({});
  });
  const pagades = comanda.pagaments.filter((p) => Number.isSafeInteger(p.part)).length;
  const valides = parts >= 2 && parts <= MAX_PARTS && parts > pagades;
  const pla = valides && t.pendentCents > 0 ? partsIguals(t.pendentCents, parts - pagades) : [];
  const seguent = pagades + 1;
  const pagaPart = (metode) => unaVegada(async () => {
    enTancar(await accions.paga(comanda.id, { metode, importCents: pla[0], part: seguent }));
  });
  let avisParts = null;
  if (parts < 2 || parts > MAX_PARTS) avisParts = tx.triaEntreParts(MAX_PARTS);
  else if (parts <= pagades) avisParts = tx.jaCobratParts(pagades);
  return (
    <Columna titol={tx.dividixCompte} torna={torna}>
      <AvisOperacio />
      <PillToggle etiqueta={tx.comEsDividix} valor={mode} onCanvi={(nou) => posaConsulta({ mode: nou === 'parts' ? 'parts' : null })}
        opcions={[{ valor: 'linies', text: tx.perLinies }, { valor: 'parts', text: tx.aPartsIguals }]} />
      {mode === 'linies' ? (
        <>
          <p>{tx.triaUnitatsSeparar}</p>
          <LiniesColleccio etiqueta={tx.unitatsASeparar}
            linies={vives.map((l) => ({ id: l.id, articleId: l.producteId, quantitat: seleccio[l.id] || 0, nom: l.nomCongelat, detall: tx.deQuantitat(l.quantitat) }))}
            onSuma={(linia) => canvia(linia, 1)} onResta={(linia) => canvia(linia, -1)} />
          <Boto varietat="primari" ple disabled={ocupat || !ven || triades.length === 0 || comanda.pagaments.length > 0} onClick={separa}>{tx.separaICobra}</Boto>
          {comanda.pagaments.length > 0 ? <Alerta to="info" viva={false}>{tx.comandaPagamentsPartsIguals}</Alerta> : null}
        </>
      ) : (
        <>
          <TeclatNumeric mode="quantitat" etiqueta={tx.partsEtiqueta} unitat={tx.partsUnitat} maxim={MAX_PARTS} valor={parts} onCanvi={setParts} />
          {avisParts ? <Alerta to="info" viva={false}>{avisParts}</Alerta> : null}
          <LiniesColleccio etiqueta={tx.partsQueQueden}
            linies={pla.map((importCents, i) => ({ id: `part-${seguent + i}`, articleId: 'part', quantitat: 1, nom: tx.partNom(seguent + i), valor: euros(importCents) }))} />
          {pla.length ? (
            <Fila gap={2}>
              <Boto varietat="primari" disabled={ocupat || !ven} onClick={() => pagaPart('efectiu')}>{tx.partEnEfectiu(seguent, euros(pla[0]))}</Boto>
              <Boto disabled={ocupat || !ven} onClick={() => pagaPart('targeta')}>{tx.partAmbTargeta(seguent)}</Boto>
            </Fila>
          ) : null}
        </>
      )}
    </Columna>
  );
}
