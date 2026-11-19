/**
 * El Bar · vistes/Tiquets.jsx — els tiquets del torn i les devolucions
 * (disseny del Bar §A.6, flux 5).
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
import { textosUiBar } from '../i18nBar.js';
import { AvisDeLaColumna, AvisOperacio, AvisSessio, Columna, NoTrobat, Preparat } from './comu.jsx';
import { esTornaTpv, useIdiomaBar, useUnaVegada, useVes } from './punt.js';
import { NotaClient, TaulaIva } from './NotaClient.jsx';
import { euros, horaCurta, liniesVestides, nomOrigen, textLiniesPerIdioma, textosLiniesBar } from './vestits.js';

const PARAMETRES_NOTA = Object.freeze({ nota: (valor) => valor === '1', torna: esTornaTpv });

function tiquetsVestits(tiquets, sala, idioma = 'ca') {
  const tx = textosUiBar(idioma);
  return [...tiquets].sort((a, b) => b.numero - a.numero).map((t) => ({
    id: t.id,
    nom: `${textNumero(t.numero)}${t.tipus === 'devolucio' ? tx.devolucioSufix : ` · ${nomOrigen(t.origen, sala, idioma)}`}`,
    comptador: t.linies.length,
    secundari: `${euros(t.totals.totalCents)} · ${horaCurta(t.tancatA)}`
  }));
}

export function TiquetsTorn({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.tiquetsDelTorn} ambTorn={false} avis="estret">
      <TiquetsDelTornActual params={params} idioma={idioma} />
    </Preparat>
  );
}

function TiquetsDelTornActual({ params, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { tiquets, sala } = useBar();
  const { ruta } = useVes();
  return (
    <ColumnaColleccions titol={tx.tiquetsDelTorn} colleccions={tiquetsVestits(tiquets, sala, idioma)} actiu={params?.tiquet || null}
      hrefDe={(c) => ruta('tiquets', c.id)} textComptador={textLiniesPerIdioma(idioma)}
      textos={{ buit: tx.capTiquetEncara, buitText: null }} avis={<AvisDeLaColumna />} />
  );
}

export function TriaTiquet() {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Columna titol={tx.tiquet} avis={<AvisSessio />}>
      <EstatBuit icona={FileText} titol={tx.triaUnTiquet}>{tx.tiquetsTancatsText}</EstatBuit>
    </Columna>
  );
}

export function TiquetTriat({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.tiquet} ambTorn={false}>
      <Tiquet params={params} idioma={idioma} />
    </Preparat>
  );
}

function Tiquet({ params, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { tiquets, establiment } = useBar();
  const { ves } = useVes();
  const [consulta, posaConsulta] = useParametresConsulta(PARAMETRES_NOTA);
  const tiquet = tiquets.find((t) => t.id === params.tiquet) || null;
  if (!tiquet) return <NoTrobat text={tx.tiquetNoDelTorn} torna={{ etiqueta: tx.vesAlsTiquets, trams: ['tiquets'] }} />;
  const venda = tiquet.tipus === 'venda';
  const tornaTpv = consulta.torna === 'tpv';
  const tancaNota = () => (tornaTpv ? ves('tpv') : posaConsulta({ nota: null }));
  const peu = (
    <>
      <TaulaIva tiquet={tiquet} />
      <Boto icona={FileText} onClick={() => posaConsulta({ nota: '1' })}>{tx.mostraNotaClient}</Boto>
      <Boto varietat="primari" onClick={() => ves(tornaTpv ? 'tpv' : 'caixa')}>{tornaTpv ? tx.tornaAlTpv : tx.tornaALaCaixa}</Boto>
    </>
  );
  return (
    <>
      <ColumnaColleccio
        titol={textNumero(tiquet.numero)}
        linies={liniesVestides(tiquet, idioma)}
        textosLinies={textosLiniesBar(idioma)}
        resum={{
          etiqueta: venda ? tx.vendaEtiqueta : tx.devolucioEtiqueta,
          comptador: tiquet.linies.length,
          textComptador: textLiniesPerIdioma(idioma),
          total: euros(tiquet.totals.totalCents),
          accio: venda ? { text: tx.retorna, onClick: () => ves('tiquets', tiquet.id, 'retorn') } : null
        }}
        peu={peu}
        avis={<AvisDeLaColumna />}
      />
      <NotaClient obert={consulta.nota === '1'} tiquet={tiquet} establiment={establiment} onTanca={tancaNota} />
    </>
  );
}

export function RetornTiquet({ params }) {
  const idioma = useIdiomaBar();
  const tx = textosUiBar(idioma);
  return (
    <Preparat titol={tx.retornTitol}>
      <Retorn params={params} idioma={idioma} />
    </Preparat>
  );
}

function Retorn({ params, idioma = 'ca' }) {
  const tx = textosUiBar(idioma);
  const { tiquets, accions, permis } = useBar();
  const { ves } = useVes();
  const [seleccio, setSeleccio] = useState({});
  const [motiu, setMotiu] = useState('');
  const [metode, setMetode] = useState('efectiu');
  const [, unaVegada] = useUnaVegada();
  const tiquet = tiquets.find((t) => t.id === params.tiquet && t.tipus === 'venda') || null;
  if (!tiquet) return <NoTrobat text={tx.nomesRetornaVenda} torna={{ etiqueta: tx.vesAlsTiquets, trams: ['tiquets'] }} />;
  const retornat = retornatPerLinia(tiquet.id, tiquets);
  const vives = tiquet.linies.filter((l) => l.estat !== 'anullada');
  const queden = (linia) => linia.quantitat - (retornat.get(linia.id)?.quantitat || 0);
  const canvia = (linia, pas) => setSeleccio((actual) => {
    const original = vives.find((l) => l.id === linia.id);
    return { ...actual, [linia.id]: Math.min(queden(original), Math.max(0, (actual[linia.id] || 0) + pas)) };
  });
  const triades = Object.entries(seleccio).filter(([, q]) => q > 0).map(([liniaId, quantitat]) => ({ liniaId, quantitat }));
  const retorna = () => unaVegada(async () => {
    const r = await accions.retorna(tiquet.id, triades, { motiu, metode });
    if (r.ok) ves('tiquets', r.valor.id);
  });
  return (
    <Columna titol={tx.retornDeLa(textNumero(tiquet.numero))} torna={{ etiqueta: tx.tornaAlTiquet, trams: ['tiquets', tiquet.id] }}>
      <AvisOperacio />
      <LiniesColleccio etiqueta={tx.unitatsARetornar}
        linies={vives.map((l) => ({ id: l.id, articleId: l.producteId, quantitat: seleccio[l.id] || 0, nom: l.nomCongelat, detall: tx.enQuedenDe(queden(l), l.quantitat) }))}
        onSuma={(linia) => canvia(linia, 1)} onResta={(linia) => canvia(linia, -1)} />
      <Camp etiqueta={tx.motiuEtiqueta} ajuda={tx.motiuAjudaNotaTraspas} obligatori>
        <CampText value={motiu} maxLength={80} onChange={(event) => setMotiu(event.target.value)} />
      </Camp>
      <PillToggle etiqueta={tx.comEsTorna} valor={metode} onCanvi={setMetode}
        opcions={[
          { valor: 'efectiu', text: tx.metodeEfectiu },
          { valor: 'targeta', text: tx.metodeTargeta },
          { valor: 'altre', text: tx.metodeAltre }
        ]} />
      <Boto varietat="perill" icona={Undo2} ple disabled={!permis.potEscriure || triades.length === 0 || !motiu.trim()} onClick={retorna}>{tx.fesDevolucio}</Boto>
    </Columna>
  );
}
