/**
 * El Bar · vistes/Cobrament.jsx — cobrar i dividir el compte (disseny del Bar
 * §A.6, fluxos 3 i 4). Columna de detall: el resum és la BarraResum de
 * l'esquelet; el teclat, el TeclatNumeric de Pedra Seca.
 *
 * Cap pagament real: «Targeta» vol dir que algú confirma que el datàfon ha
 * cobrat. En efectiu, el lliurat pot passar del pendent (el canvi es diu en
 * gran); si no hi arriba, és un pagament parcial (mixt). Quan el pendent
 * arriba a 0, la comanda es tanca i es va a la nota del client.
 *
 * Clàusula dels Slugs: el mètode (?metode=targeta|altre) i el mode de divisió
 * (?mode=parts) van a la consulta; els imports i les parts teclejades, no
 * (són valors). Cada pagament és d'un sol gest (useUnaVegada).
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
import { AvisOperacio, Columna, NoTrobat, Preparat } from './comu.jsx';
import { useUnaVegada, usePunt, useVes } from './punt.js';
import { euros, textLinies } from './vestits.js';

const PARAMETRES_COBRAMENT = Object.freeze({ metode: (valor) => valor === 'targeta' || valor === 'altre' });
const PARAMETRES_DIVISIO = Object.freeze({ mode: (valor) => valor === 'parts' });

const METODES = Object.freeze([
  { valor: 'efectiu', text: 'Efectiu', icona: <Banknote size={20} aria-hidden="true" focusable="false" /> },
  { valor: 'targeta', text: 'Targeta', icona: <CreditCard size={20} aria-hidden="true" focusable="false" /> },
  { valor: 'altre', text: 'Altre', icona: <Wallet size={20} aria-hidden="true" focusable="false" /> }
]);

/** Després de cobrar-ho tot: la nota del client, a la URL del tiquet. */
function useEnTancar() {
  const { ves } = useVes();
  return (resultat) => {
    if (resultat.ok && resultat.valor?.tiquet) ves('tiquets', `${resultat.valor.tiquet.id}?nota=1`);
  };
}

export function CobramentCaixa({ params }) {
  return (
    <Preparat titol="Cobra">
      <Cobrament params={params} />
    </Preparat>
  );
}

function Cobrament({ params }) {
  const { accions } = useBar();
  const punt = usePunt(params);
  const enTancar = useEnTancar();
  /* El mètode va a la consulta (?metode=targeta|altre; l'efectiu no s'escriu): BAR-R7. */
  const [consulta, posaConsulta] = useParametresConsulta(PARAMETRES_COBRAMENT);
  const [ocupat, unaVegada] = useUnaVegada();
  const [lliurat, setLliurat] = useState(0);
  const [importTargeta, setImportTargeta] = useState(null);
  const metode = consulta.metode || 'efectiu';
  const { comanda } = punt;
  if (punt.perduda || !comanda) {
    return <NoTrobat titol="Res a cobrar" text="Esta comanda ja està tancada o encara és buida." torna={{ etiqueta: 'Torna a la caixa', trams: punt.trams }} />;
  }
  const t = totals(comanda);
  const pendent = t.pendentCents;
  const torna = { etiqueta: 'Torna a la comanda', trams: punt.trams };
  /* Un pagament per gest: dos tocs seguits no n'anoten dos (BAR-R5). */
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
    <BarraResum etiqueta={t.pagatCents > 0 ? 'Pendent' : 'A cobrar'} comptador={comanda.linies.filter((l) => l.estat !== 'anullada').length}
      textComptador={textLinies} total={euros(pendent)} textTotal="Pendent"
      accio={pendent > 0 && !altre ? { text: `Exacte en efectiu: ${euros(pendent)}`, onClick: () => cobraEfectiu(pendent) } : null} />
  );
  return (
    <Columna titol="Cobra" torna={torna} eines={resum}>
      <AvisOperacio />
      {t.pagatCents > 0 ? <Alerta to="info" viva={false}>{`Ja s’han cobrat ${euros(t.pagatCents)} d’un total de ${euros(t.totalCents)}.`}</Alerta> : null}
      <PillToggle etiqueta="Mètode de pagament" valor={metode} onCanvi={triaMetode} opcions={METODES} />
      {metode === 'efectiu' ? (
        <>
          <Fila gap={2}>
            {suggerimentsEfectiu(pendent).map((cents) => (
              <Boto key={cents} mida="gran" disabled={ocupat} onClick={() => cobraEfectiu(cents)}>{euros(cents)}</Boto>
            ))}
          </Fila>
          <TeclatNumeric mode="import" etiqueta="Lliurat" valor={lliurat} onCanvi={setLliurat}
            onAccepta={(cents) => { if (cents > 0) cobraEfectiu(cents); }}
            textAccepta={lliurat >= pendent ? 'Cobra i torna el canvi' : 'Cobra este import (part)'} desactivat={pendent <= 0} />
          {lliurat > 0 ? (
            lliurat >= pendent
              ? <BarraResum etiqueta="Canvi" comptador={0} textComptador={() => ''} total={euros(lliurat - pendent)} textTotal="Canvi" />
              : <Alerta to="info" viva={false}>{`Pagament parcial: en quedaran ${euros(pendent - lliurat)} per cobrar.`}</Alerta>
          ) : null}
        </>
      ) : (
        <>
          <Alerta to="info" viva={false} titol={metode === 'targeta' ? 'Cobra amb el datàfon' : 'Un altre mètode'}>
            Este TPV no cobra res: només anota el que ja s’ha cobrat fora (el datàfon del bar, una transferència…).
          </Alerta>
          <TeclatNumeric mode="import" etiqueta="Import" valor={importAltre} maxim={pendent} onCanvi={setImportTargeta} />
          <Boto varietat="primari" ple mida="gran" disabled={ocupat || importAltre < 1 || importAltre > pendent}
            onClick={() => paga({ metode, importCents: importAltre }, () => setImportTargeta(null))}>
            {metode === 'targeta' ? `El datàfon ha cobrat ${euros(importAltre)}` : `Anota ${euros(importAltre)} cobrats`}
          </Boto>
        </>
      )}
    </Columna>
  );
}

export function DivisioCaixa({ params }) {
  return (
    <Preparat titol="Dividix el compte">
      <Divisio params={params} />
    </Preparat>
  );
}

function Divisio({ params }) {
  const { accions } = useBar();
  const { ves } = useVes();
  const punt = usePunt(params);
  const enTancar = useEnTancar();
  /* El mode va a la consulta (?mode=parts; per línies no s'escriu): BAR-R7. */
  const [consulta, posaConsulta] = useParametresConsulta(PARAMETRES_DIVISIO);
  const [ocupat, unaVegada] = useUnaVegada();
  const [seleccio, setSeleccio] = useState({});
  /* Les parts es guarden tal com es teclegen (C i 3 són 3): la validesa es mira en fer el pla (BAR-R1). */
  const [parts, setParts] = useState(2);
  const mode = consulta.mode || 'linies';
  const { comanda } = punt;
  if (punt.perduda || !comanda) {
    return <NoTrobat titol="Res a dividir" text="Esta comanda ja està tancada o encara és buida." torna={{ etiqueta: 'Torna a la caixa', trams: punt.trams }} />;
  }
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
    if (r.ok) ves('caixa', r.valor.id, 'cobrar');
  });
  /* Parts iguals del pendent: les ja pagades per part no es tornen a repartir. */
  const pagades = comanda.pagaments.filter((p) => Number.isSafeInteger(p.part)).length;
  const valides = parts >= 2 && parts <= MAX_PARTS && parts > pagades;
  const pla = valides && t.pendentCents > 0 ? partsIguals(t.pendentCents, parts - pagades) : [];
  const seguent = pagades + 1;
  /* Una part per gest: dos tocs seguits no la cobren dues vegades (BAR-R5). */
  const pagaPart = (metode) => unaVegada(async () => {
    enTancar(await accions.paga(comanda.id, { metode, importCents: pla[0], part: seguent }));
  });
  let avisParts = null;
  if (parts < 2 || parts > MAX_PARTS) avisParts = `Tria entre 2 i ${MAX_PARTS} parts.`;
  else if (parts <= pagades) avisParts = `Ja s’han cobrat ${pagades} parts: en calen més de ${pagades}.`;
  return (
    <Columna titol="Dividix el compte" torna={{ etiqueta: 'Torna a la comanda', trams: punt.trams }}>
      <AvisOperacio />
      <PillToggle etiqueta="Com es dividix" valor={mode} onCanvi={(nou) => posaConsulta({ mode: nou === 'parts' ? 'parts' : null })}
        opcions={[{ valor: 'linies', text: 'Per línies' }, { valor: 'parts', text: 'A parts iguals' }]} />
      {mode === 'linies' ? (
        <>
          <p>Tria quantes unitats de cada línia van a la comanda nova: es cobraran a part.</p>
          <LiniesColleccio etiqueta="Unitats a separar"
            linies={vives.map((l) => ({ id: l.id, articleId: l.producteId, quantitat: seleccio[l.id] || 0, nom: l.nomCongelat, detall: `de ${l.quantitat}` }))}
            onSuma={(linia) => canvia(linia, 1)} onResta={(linia) => canvia(linia, -1)} />
          <Boto varietat="primari" ple disabled={ocupat || triades.length === 0 || comanda.pagaments.length > 0} onClick={separa}>Separa i cobra</Boto>
          {comanda.pagaments.length > 0 ? <Alerta to="info" viva={false}>Esta comanda ja té pagaments: dividix-la a parts iguals.</Alerta> : null}
        </>
      ) : (
        <>
          <TeclatNumeric mode="quantitat" etiqueta="Parts" unitat="parts" maxim={MAX_PARTS} valor={parts} onCanvi={setParts} />
          {avisParts ? <Alerta to="info" viva={false}>{avisParts}</Alerta> : null}
          <LiniesColleccio etiqueta="Parts que queden"
            linies={pla.map((importCents, i) => ({ id: `part-${seguent + i}`, articleId: 'part', quantitat: 1, nom: `Part ${seguent + i}`, valor: euros(importCents) }))} />
          {pla.length ? (
            <Fila gap={2}>
              <Boto varietat="primari" disabled={ocupat} onClick={() => pagaPart('efectiu')}>{`Part ${seguent} en efectiu (${euros(pla[0])})`}</Boto>
              <Boto disabled={ocupat} onClick={() => pagaPart('targeta')}>{`Part ${seguent} amb targeta`}</Boto>
            </Fila>
          ) : null}
        </>
      )}
    </Columna>
  );
}
