/**
 * comunes.jsx — peces de Salut que fan servir totes les vistes.
 *
 *   MarcSalut      el marc d'una columna (MarcColumna + AppGridColumn); en
 *                  pantalla estreta o mitjana hi afig el peu de la columna
 *   PeuSalut       «Les dades són només en este dispositiu», l'estat i el 112
 *   PanellEstat    la columna de l'esquerra: el dia, la persistència, la
 *                  còpia de seguretat i el 112
 *   Enllac112      un tel:112 normal (no és xarxa de l'app)
 *   ControlCamp    el control de formulari d'un camp del diccionari
 *   iconaDeTipus   la icona de lucide d'un tipus d'apunt
 * Cap classe pròpia: la geometria és de les peces de Pedra Seca.
 */
import { useCallback, useMemo } from 'react';
import { Bed, CircleDot, Droplets, Eye, GlassWater, HandHeart, Layers, Pill, Toilet } from 'lucide-react';
import { Link, useNavigate } from '../../../app/contexts/RouterContext';
import AppGridColumn from '../../../components/layout/AppGridColumn.jsx';
import {
  Alerta, Boto, Camp, CampText, Casella, Fila, GrupCamps, GrupOpcions, MarcColumna, Pila
} from '../../../components/PedraSeca/index.js';
import { esData, useApp, useClosaAplicacio, useInterruptorsApp, useParametresConsulta } from '../../plataforma/index.js';
import { textDecimes, tipusDe } from '../nucli/diccionari.js';
import { dataLocalDe, diesEntre, etiquetaDataLlarga, sumaDies } from '../nucli/hores.js';
import { useSalut } from '../useSalut.jsx';

const ICONES = Object.freeze({ Toilet, GlassWater, Droplets, Layers, CircleDot, HandHeart, Pill, Bed, Eye });
const DIES_RECORDATORI_COPIA = 7;

/** La icona d'un tipus d'apunt (component de lucide). */
export const iconaDeTipus = (tipus) => ICONES[tipusDe(tipus)?.icona] || Eye;

/* El període que es mira (full, resum): ?des=AAAA-MM-DD&dies=N; si no, el diari en marxa o els últims 3 dies. */
const CONSULTA_PERIODE = Object.freeze({ des: esData, dies: (valor) => /^(?:[1-9]|1[0-4])$/.test(valor) });
export const DIES_POSSIBLES = Object.freeze([1, 2, 3, 4, 5, 6, 7, 14]);

/**
 * Les opcions del selector de dies. Un període d'entre 8 i 13 dies (una còpia
 * importada, i «Obri el full» porta ?dies=N) també s'hi veu, perquè el
 * selector diga sempre el que es calcula.
 */
export const diesPossiblesAmb = (dies) => (DIES_POSSIBLES.includes(dies) ? DIES_POSSIBLES : [...DIES_POSSIBLES, dies].sort((a, b) => a - b));

export function usePeriodeTriat() {
  const salut = useSalut();
  const [consulta, posa] = useParametresConsulta(CONSULTA_PERIODE);
  const enCurs = salut.periodes.find((periode) => periode.estat === 'en-curs');
  const dies = consulta.dies ? Number(consulta.dies) : enCurs?.dies || 3;
  const des = consulta.des || enCurs?.inici || sumaDies(salut.avui, -(dies - 1));
  return { des, dies, fins: sumaDies(des, dies - 1), posa };
}

/**
 * Els interruptors de Salut (agitacio, medicacio, deposicions):
 *   actiu(id)          si l'apartat es fa servir
 *   apaga(id, apagat)  la persona l'apaga (true) o el torna a encendre (false)
 * El que la persona apaga viu a la base de Salut (useSalut · apagats), mai a
 * les preferències de la plataforma (config/storage.js): saber que una
 * família no apunta la medicació també és una dada de la persona. De la
 * plataforma només es llig la resta de capes (manifest, dret); una apagada
 * antiga de la persona que hi haja quedat no compta, perquè ja no és la font.
 */
export function useInterruptorsSalut() {
  const salut = useSalut();
  const { avalua } = useInterruptorsApp();
  const { apagats, apagaInterruptor } = salut;
  const actiu = useCallback((id) => {
    const plataforma = avalua(id);
    return (plataforma.actiu || plataforma.motiu === 'persona-apagat') && !apagats.includes(id);
  }, [avalua, apagats]);
  return useMemo(() => ({ actiu, apaga: apagaInterruptor }), [actiu, apagaInterruptor]);
}

/** Navegar dins de l'app (push): navega(['dies', data]). */
export function useNavegaSalut() {
  const navigate = useNavigate();
  const { ruta } = useApp();
  return useCallback((trams, opcions) => navigate(ruta(...[].concat(trams)), opcions), [navigate, ruta]);
}

export function Enllac112() {
  return <a href="tel:112" className="sdp-boto sdp-boto--perill">Truca al 112</a>;
}

export function PeuSalut() {
  const { obriPanell } = useClosaAplicacio();
  return (
    <Fila gap={2}>
      <span>Les dades són només en este dispositiu.</span>
      <Boto varietat="fantasma" data-obri-columna="esquerra" aria-controls="app-grid-sidebar" onClick={() => obriPanell('esquerra')}>
        Estat
      </Boto>
      <Enllac112 />
    </Fila>
  );
}

/**
 * El marc d'una columna de Salut. `columna`: 'esquerra', 'mig' o 'detall'.
 * El peu va on es veu sense el panell de l'esquerra: en estret, a la columna
 * visible; en mitjana, a la del mig. En ample, el panell ja ho diu.
 */
export function MarcSalut({ titol, eines = null, columna = 'detall', children }) {
  const { mida } = useClosaAplicacio();
  const ambPeu = columna !== 'esquerra' && (mida === 'estret' || (mida === 'mitja' && columna === 'mig'));
  return (
    <MarcColumna capcalera={<AppGridColumn titol={titol} />} eines={eines} peu={ambPeu ? <PeuSalut /> : null} etiqueta={titol}>
      {children}
    </MarcColumna>
  );
}

/** Un enllaç de l'app amb forma de botó (secundari). */
export function EnllacBoto({ a, children }) {
  return <Link to={a} className="sdp-boto sdp-boto--secundari">{children}</Link>;
}

/** Si la closca ensenya una sola columna (un mòbil). */
export function useEstret() {
  return useClosaAplicacio().mida === 'estret';
}

/**
 * Des del mig, l'enllaç a la ruta «detall» que ensenya la columna de detall.
 * Només en estret: en ample i en mitja el detall ja es veu al costat i
 * l'enllaç no hi afegiria res (rutesSalut.js). Si les eines de la columna
 * només portarien este enllaç, la vista passa `eines` null fora d'estret:
 * així la columna no guanya cap franja buida.
 */
export function EnllacDetall({ a, children }) {
  return useEstret() ? <EnllacBoto a={a}>{children}</EnllacBoto> : null;
}

/* La columna de l'esquerra: igual en totes les rutes, i per això no es desmunta. */
export function PanellEstat() {
  const salut = useSalut();
  const { ruta } = useApp();
  const { mida, tancaPanells } = useClosaAplicacio();
  if (!salut.carregat) return null;
  const apuntsAvui = salut.apunts.filter((apunt) => apunt.jornada === salut.avui).length;
  const diesCopia = salut.ultimaCopia ? diesEntre(dataLocalDe(salut.ultimaCopia), salut.avui) : null;
  const recordaCopia = salut.apunts.length > 0 && (diesCopia === null || diesCopia > DIES_RECORDATORI_COPIA);
  return (
    <MarcSalut titol="Este dispositiu" columna="esquerra">
      <Pila gap={4}>
        <p>{`Hui és ${etiquetaDataLlarga(salut.avui)}. Portes ${apuntsAvui} ${apuntsAvui === 1 ? 'apunt' : 'apunts'} d’esta jornada.`}</p>
        {salut.persistent ? (
          <Alerta to="info" viva={false} titol="Només en este dispositiu">
            Les dades es guarden en este navegador i no s’envien enlloc.
          </Alerta>
        ) : (
          <Alerta to="avis" titol="Només en la memòria">
            Este navegador no deixa guardar-les: es perdran en tancar la pestanya. Fes una còpia abans d’eixir.
          </Alerta>
        )}
        {salut.nomesLectura ? (
          <Alerta to="avis" titol="Només per a mirar">Una altra pestanya està apuntant. Tanca-la per a apuntar ací.</Alerta>
        ) : null}
        {recordaCopia ? (
          <Alerta to="info" viva={false} titol="Còpia de seguretat" accions={<EnllacBoto a={ruta('copia')}>Fes una còpia</EnllacBoto>}>
            {diesCopia === null ? 'Encara no has fet cap còpia.' : `L’última còpia és de fa ${diesCopia} dies.`}
          </Alerta>
        ) : null}
        <Enllac112 />
        {/* En estret i en mitjana el panell tapa la resta: la tornada és ací. */}
        {mida !== 'ample' ? <Boto varietat="secundari" onClick={tancaPanells}>Torna</Boto> : null}
      </Pila>
    </MarcSalut>
  );
}

/* ── Controls generats a partir del diccionari ─────────────────────────── */

const textDeValor = (definicio, valor) => {
  if (valor === undefined || valor === null) return '';
  return definicio.tipus === 'decimes' && typeof valor === 'number' ? textDecimes(valor) : String(valor);
};

/**
 * El control d'un camp del diccionari. `valor` és el que hi ha al formulari
 * (els nombres, com a text mentre s'escriuen); `onCanvi(nou)`.
 */
export function ControlCamp({ definicio: c, valor, onCanvi, error, desactivat = false }) {
  switch (c.tipus) {
    case 'enter':
    case 'decimes':
    case 'text':
    case 'hora':
      return (
        <Camp etiqueta={c.etiqueta} error={error} obligatori={c.obligatori}>
          <CampText
            tipus={c.tipus === 'hora' ? 'time' : 'text'}
            inputMode={{ enter: 'numeric', decimes: 'decimal' }[c.tipus]}
            maxLength={c.maxLlargada}
            value={textDeValor(c, valor)}
            disabled={desactivat}
            onChange={(event) => onCanvi(event.target.value)}
          />
        </Camp>
      );
    case 'escala':
    case 'opcio': {
      const opcions = [...(c.obligatori ? [] : [{ valor: '', etiqueta: 'Sense dir' }]), ...c.valors];
      return <GrupOpcions llegenda={c.etiqueta} opcions={opcions} valor={valor ?? ''} onCanvi={onCanvi} error={error} disabled={desactivat} />;
    }
    case 'multiopcio': {
      const actius = Array.isArray(valor) ? valor : [];
      const commuta = (opcio) => {
        if (actius.includes(opcio)) onCanvi(actius.filter((v) => v !== opcio));
        else if (opcio === c.exclusiu) onCanvi([opcio]);
        else onCanvi([...actius.filter((v) => v !== c.exclusiu), opcio]);
      };
      const caselles = (opcions) => opcions.map((o) => (
        <Casella key={o.valor} etiqueta={o.etiqueta} checked={actius.includes(o.valor)} disabled={desactivat} onChange={() => commuta(o.valor)} />
      ));
      return (
        <GrupCamps llegenda={c.obligatori ? `${c.etiqueta} (obligatori)` : c.etiqueta}>
          {c.grups ? c.grups.map((grup) => <GrupCamps key={grup.id} llegenda={grup.etiqueta}>{caselles(grup.valors)}</GrupCamps>) : caselles(c.valors)}
          {error ? <Alerta to="error" viva={false}>{error}</Alerta> : null}
        </GrupCamps>
      );
    }
    case 'boolea':
      return <Casella etiqueta={c.etiqueta} checked={valor === true} disabled={desactivat} onChange={(event) => onCanvi(event.target.checked)} />;
    default:
      return null;
  }
}
