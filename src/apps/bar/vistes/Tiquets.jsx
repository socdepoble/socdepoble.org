/**
 * El Bar · vistes/Tiquets.jsx — els tiquets del torn i les devolucions
 * (disseny del Bar §A.6, flux 5), amb l'ESQUELET COMÚ: la llista és la
 * columna de col·leccions; un tiquet, la columna de col·lecció.
 *
 * Un tiquet tancat no s'edita ni s'esborra: «Retorna» fa un tiquet de
 * devolució nou, enllaçat, amb motiu obligatori.
 *
 * La nota del client que ve del TPV (?nota=1&torna=tpv, punt.js): en tancar-la
 * es torna a /app/bar/tpv, i el botó del peu diu «Torna al TPV». Sense el
 * paràmetre, el de sempre (Llei del Píxel). Sense permís d'escriptura, la
 * devolució no es pot fer (ProveidorBar, permis.potEscriure). L'avís de la
 * sessió va dins del marc de cada columna (avis, correcció F3, 261006).
 */
import { useState } from 'react';
import { FileText, Undo2 } from 'lucide-react';
import {
  Boto, Camp, CampText, EstatBuit, LiniesColleccio, PillToggle
} from '../../../components/PedraSeca/index.js';
import { ColumnaColleccio, ColumnaColleccions } from '../../comu/esquelet/index.js';
import { useParametresConsulta } from '../../plataforma/index.js';
import { textNumero } from '../nucli/cobrament.js';
import { retornatPerLinia } from '../nucli/tiquet.js';
import { useBar } from '../estat/ProveidorBar.jsx';
import { AvisDeLaColumna, AvisOperacio, AvisSessio, Columna, NoTrobat, Preparat } from './comu.jsx';
import { esTornaTpv, useVes } from './punt.js';
import { NotaClient, TaulaIva } from './NotaClient.jsx';
import { TEXTOS_LINIES_BAR, euros, horaCurta, liniesVestides, nomOrigen, textLinies } from './vestits.js';

const PARAMETRES_NOTA = Object.freeze({ nota: (valor) => valor === '1', torna: esTornaTpv });

/** Els tiquets del torn com a col·leccions de l'esquelet. */
function tiquetsVestits(tiquets, sala) {
  return [...tiquets].sort((a, b) => b.numero - a.numero).map((t) => ({
    id: t.id,
    nom: `${textNumero(t.numero)}${t.tipus === 'devolucio' ? ' · Devolució' : ` · ${nomOrigen(t.origen, sala)}`}`,
    comptador: t.linies.length,
    secundari: `${euros(t.totals.totalCents)} · ${horaCurta(t.tancatA)}`
  }));
}

export function TiquetsTorn({ params }) {
  return (
    <Preparat titol="Tiquets del torn" ambTorn={false} avis="estret">
      <TiquetsDelTornActual params={params} />
    </Preparat>
  );
}

function TiquetsDelTornActual({ params }) {
  const { tiquets, sala } = useBar();
  const { ruta } = useVes();
  return (
    <ColumnaColleccions titol="Tiquets del torn" colleccions={tiquetsVestits(tiquets, sala)} actiu={params?.tiquet || null}
      hrefDe={(c) => ruta('tiquets', c.id)} textComptador={textLinies}
      textos={{ buit: 'Encara no hi ha cap tiquet', buitText: null }} avis={<AvisDeLaColumna />} />
  );
}

/* Sense Preparat (no cal el bar carregat per a dir «tria»): l'avís de la sessió hi va ell mateix,
   perquè la llista del costat només el porta en estret i, en ample, la pantalla l'ha de dir una vegada. */
export function TriaTiquet() {
  return (
    <Columna titol="Tiquet" avis={<AvisSessio />}>
      <EstatBuit icona={FileText} titol="Tria un tiquet">Els tiquets tancats no s’editen ni s’esborren: una correcció és una devolució.</EstatBuit>
    </Columna>
  );
}

export function TiquetTriat({ params }) {
  return (
    <Preparat titol="Tiquet" ambTorn={false}>
      <Tiquet params={params} />
    </Preparat>
  );
}

function Tiquet({ params }) {
  const { tiquets, establiment } = useBar();
  const { ves } = useVes();
  const [consulta, posaConsulta] = useParametresConsulta(PARAMETRES_NOTA);
  const tiquet = tiquets.find((t) => t.id === params.tiquet) || null;
  if (!tiquet) return <NoTrobat text="Este tiquet no és del torn obert." torna={{ etiqueta: 'Ves als tiquets', trams: ['tiquets'] }} />;
  const venda = tiquet.tipus === 'venda';
  /* Del TPV (?torna=tpv): la nota i el peu tornen al TPV; si no, a la caixa, com sempre. */
  const tornaTpv = consulta.torna === 'tpv';
  const tancaNota = () => (tornaTpv ? ves('tpv') : posaConsulta({ nota: null }));
  const peu = (
    <>
      <TaulaIva tiquet={tiquet} />
      <Boto icona={FileText} onClick={() => posaConsulta({ nota: '1' })}>Mostra la nota al client</Boto>
      <Boto varietat="primari" onClick={() => ves(tornaTpv ? 'tpv' : 'caixa')}>{tornaTpv ? 'Torna al TPV' : 'Torna a la caixa'}</Boto>
    </>
  );
  return (
    <>
      <ColumnaColleccio
        titol={textNumero(tiquet.numero)}
        linies={liniesVestides(tiquet)}
        textosLinies={TEXTOS_LINIES_BAR}
        resum={{
          etiqueta: venda ? 'Venda' : 'Devolució', comptador: tiquet.linies.length, textComptador: textLinies, total: euros(tiquet.totals.totalCents),
          accio: venda ? { text: 'Retorna', onClick: () => ves('tiquets', tiquet.id, 'retorn') } : null
        }}
        peu={peu}
        avis={<AvisDeLaColumna />}
      />
      <NotaClient obert={consulta.nota === '1'} tiquet={tiquet} establiment={establiment} onTanca={tancaNota} />
    </>
  );
}

export function RetornTiquet({ params }) {
  return (
    <Preparat titol="Retorn">
      <Retorn params={params} />
    </Preparat>
  );
}

function Retorn({ params }) {
  const { tiquets, accions, permis } = useBar();
  const { ves } = useVes();
  const [seleccio, setSeleccio] = useState({});
  const [motiu, setMotiu] = useState('');
  const [metode, setMetode] = useState('efectiu');
  const tiquet = tiquets.find((t) => t.id === params.tiquet && t.tipus === 'venda') || null;
  if (!tiquet) return <NoTrobat text="Només es retorna d’un tiquet de venda del torn obert." torna={{ etiqueta: 'Ves als tiquets', trams: ['tiquets'] }} />;
  const retornat = retornatPerLinia(tiquet.id, tiquets);
  const vives = tiquet.linies.filter((l) => l.estat !== 'anullada');
  const queden = (linia) => linia.quantitat - (retornat.get(linia.id)?.quantitat || 0);
  const canvia = (linia, pas) => setSeleccio((actual) => {
    const original = vives.find((l) => l.id === linia.id);
    return { ...actual, [linia.id]: Math.min(queden(original), Math.max(0, (actual[linia.id] || 0) + pas)) };
  });
  const triades = Object.entries(seleccio).filter(([, q]) => q > 0).map(([liniaId, quantitat]) => ({ liniaId, quantitat }));
  const retorna = async () => {
    const r = await accions.retorna(tiquet.id, triades, { motiu, metode });
    if (r.ok) ves('tiquets', r.valor.id);
  };
  return (
    <Columna titol={`Retorn de la ${textNumero(tiquet.numero)}`} torna={{ etiqueta: 'Torna al tiquet', trams: ['tiquets', tiquet.id] }}>
      <AvisOperacio />
      <LiniesColleccio etiqueta="Unitats a retornar"
        linies={vives.map((l) => ({ id: l.id, articleId: l.producteId, quantitat: seleccio[l.id] || 0, nom: l.nomCongelat, detall: `en queden ${queden(l)} de ${l.quantitat}` }))}
        onSuma={(linia) => canvia(linia, 1)} onResta={(linia) => canvia(linia, -1)} />
      <Camp etiqueta="Motiu" ajuda="Queda al tancament del torn i a la nota de traspàs." obligatori>
        <CampText value={motiu} maxLength={80} onChange={(event) => setMotiu(event.target.value)} />
      </Camp>
      <PillToggle etiqueta="Com es torna" valor={metode} onCanvi={setMetode}
        opcions={[{ valor: 'efectiu', text: 'Efectiu' }, { valor: 'targeta', text: 'Targeta' }, { valor: 'altre', text: 'Altre' }]} />
      <Boto varietat="perill" icona={Undo2} ple disabled={!permis.potEscriure || triades.length === 0 || !motiu.trim()} onClick={retorna}>Fes la devolució</Boto>
    </Columna>
  );
}
