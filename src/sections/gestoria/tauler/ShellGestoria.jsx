/**
 * ShellGestoria.jsx — la closca de la Gestoria de Poble: el rail del mòdul,
 * la boina personal i la pàgina del mòdul triat.
 *
 * Ordre del Mestre, 261004 (onada 2, pas 1 del MAPA; aprovat al xat). Des de
 * l'ordre del Mestre del mateix 261004 («contaminació crítica de
 * rutes/estats entre Gestoria i Wiki») la munta la seua app, /app/gestoria
 * (src/apps/gestoria), només en desenvolupament; mai la Wiki ni /gestoria:
 *  · EL RAIL «Gestoria» (abans «Panell de control», que es confonia amb el
 *    Panell de Control de l'app) · Tauler d'Inici, Facturació, Contactes,
 *    Burocràcia, Bancs, Impostos, Full trimestral, Informes i Escàner Local.
 *    El que encara no existix ho diu: «en obres», amb el perquè.
 *  · LA BOINA PERSONAL (principi 2) · tota pàgina de la closca és una
 *    PaginaApp amb la barra taronja (regla d'or 2), però la boina ja no diu
 *    «Sóc de Poble»: diu la identitat privada del titular, de la
 *    configuració local que tria la persona (només el nom i la població),
 *    enllaçada a la seua pàgina; un sol ull de privacitat (aria-pressed) i
 *    la data i l'hora de la darrera lectura dels extractes. Sense
 *    configuració, «Titular sense configurar», mai una autora fingida.
 *  · EL FULL TRIMESTRAL · ContenidorGestoria, tal qual (és UI signada dels
 *    dos tractors de factures i correu: no es toca).
 *  · LES TARGETES · cada targeta del Tauler obri la seua pàgina pròpia dins
 *    de la closca (PaginaTargeta). Les xifres es mostren amb l'ull: el de la
 *    boina les mostra o les amaga totes; el de cada targeta, la seua.
 * En l'app, la ruta pública tria el mòdul; cap dada ni import va a la URL.
 * La targeta oberta viu en l'estat de la pàgina. L'Índex de la barra blava sí
 * que hi escriu el títol de la secció que tria la persona (?seccio=): per
 * això cap títol ni subtítol de les pàgines i targetes de la closca porta
 * dades (nucli/targetesTauler.js, «Compte 1, 2…»).
 * L'app la munta sense rail interior: BarraApp és tota la Sidebar. La
 * mateixa instància conserva useTauler entre els nou mòduls. El rail local
 * continua disponible per a muntatges aïllats; no es duplica a l'app.
 *
 * Proves: el magatzem, subtle, el catàleg, l'entorn, el rellotge, inflate,
 * avui i descarrega s'injecten i passen també a ContenidorGestoria;
 * `titular` (opcional) és la identitat de la boina, si ja se sap.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2, ChartColumn, Contact, FileSpreadsheet, FileText, Landmark, LayoutDashboard, Percent, ScanLine
} from 'lucide-react';
import { useNavigate } from '../../../app/contexts/RouterContext';
import { DateTimeControl } from '../../../components/PedraSeca/atoms/controls.jsx';
import { Insignia } from '../../../components/PedraSeca/atoms/Insignia.jsx';
import { Alerta } from '../../../components/PedraSeca/molecules/Alerta.jsx';
import { PaginaApp } from '../../../components/PedraSeca/organismes/PaginaApp.jsx';
import ContenidorGestoria, { CONSULTA_TRACTORS } from '../ContenidorGestoria.jsx';
import { dadesDelTauler } from './nucli/targetesTauler.js';
import { ModulEnObres, PaginaTargeta, PortaTauler, VistaBancs, VistaImpostos, VistaTauler } from './Tauler.jsx';
import { UllPrivacitat } from './TargetaTauler.jsx';
import { useTauler } from './useTauler.js';

/** La pàgina del titular: la seua (el perfil de qui fa servir la Gestoria). */
export const RUTA_TITULAR = '/el-meu-perfil';
/** El nom de la boina mentre no hi ha configuració local. */
export const TITULAR_SENSE_CONFIGURAR = 'Titular sense configurar';

/** Els mòduls del rail, en ordre. `enObres`: encara no existix, i `explica` diu per què i quan. */
export const MODULS_GESTORIA = Object.freeze([
  { id: 'tauler', etiqueta: 'Tauler d’Inici', icona: LayoutDashboard, titol: 'Tauler Central', subtitol: 'Gestoria de Poble' },
  {
    id: 'facturacio', etiqueta: 'Facturació', icona: FileText, titol: 'Facturació', subtitol: 'Factures, rectificatives i pressupostos', enObres: true,
    explica: 'L’emissió de factures sobre el llibre Veri*Factu encara no té pantalla: ara només n’hi ha el nucli. És el pas 2 del pla de la Gestoria.'
  },
  {
    id: 'contactes', etiqueta: 'Contactes', icona: Contact, titol: 'Contactes', subtitol: 'Clients i proveïdors', enObres: true,
    explica: 'La llibreta de clients i proveïdors encara no existix. Mentrestant, els proveïdors habituals els aprén el full trimestral.'
  },
  {
    id: 'burocracia', etiqueta: 'Burocràcia', icona: Landmark, titol: 'Burocràcia', subtitol: 'Models, cotitzacions i notificacions', enObres: true,
    explica: 'El calendari d’obligacions i els avisos de terminis tenen el model pur, però encara no tenen pantalla. És el pas 4 del pla de la Gestoria.'
  },
  { id: 'bancs', etiqueta: 'Bancs', icona: Building2, titol: 'Bancs i Tresoreria', subtitol: 'Estat de comptes reals i conciliació' },
  { id: 'impostos', etiqueta: 'Impostos', icona: Percent, titol: 'Impostos', subtitol: 'Estimacions del 303 i del 130' },
  { id: 'full', etiqueta: 'Full trimestral', icona: FileSpreadsheet, titol: 'Full trimestral', subtitol: 'El full de factures del trimestre per a la gestoria' },
  {
    id: 'informes', etiqueta: 'Informes', icona: ChartColumn, titol: 'Informes', subtitol: 'Els models i els fulls ja lliurats', enObres: true,
    explica: 'L’històric dels models presentats i dels fulls lliurats, per a contrastar-hi les estimacions, encara no existix.'
  },
  {
    id: 'escaner', etiqueta: 'Escàner Local', icona: ScanLine, titol: 'Escàner Local', subtitol: 'Què és cada paper i quan es pot llençar', enObres: true,
    explica: 'El classificador local de documents, que proposa i mai esborra, encara no existix. És el pas 7 del pla de la Gestoria.'
  }
]);

/* Les etiquetes de les pàgines de la closca (la capçalera de la captura del Mestre). */
const ETIQUETES_PANELL = Object.freeze([
  Object.freeze({ text: 'GESTORIA', className: 'sdp-badge-system' }),
  Object.freeze({ text: 'PANELL INTERN', className: 'sdp-badge-category' })
]);
const ETIQUETA_EN_OBRES = Object.freeze({ text: 'En obres', className: 'sdp-badge-tag' });
const EN_OBRES = 'Este mòdul de la Gestoria encara no existix: ací es diu què hi haurà i en quin pas del pla arriba.';

const dosXifres = (n) => String(n).padStart(2, '0');

/**
 * La pastilla de la boina: l'instant de la darrera lectura, en hora local,
 * amb el format únic de les barres (hh:mm i dd/mm/aa). null sense lectura.
 * @param {number|null} ms
 * @returns {{ time: string, date: string, dateTime: string }|null}
 */
export function pastillaDeSincronitzacio(ms) {
  if (!Number.isFinite(ms)) return null;
  const d = new Date(ms);
  const dia = `${dosXifres(d.getDate())}/${dosXifres(d.getMonth() + 1)}/${String(d.getFullYear()).slice(-2)}`;
  const hora = `${dosXifres(d.getHours())}:${dosXifres(d.getMinutes())}`;
  return { time: hora, date: dia, dateTime: `${d.getFullYear()}-${dosXifres(d.getMonth() + 1)}-${dosXifres(d.getDate())}T${hora}` };
}

/**
 * La boina personal: la identitat que se sap o, si no, l'estat honest.
 * @param {{ nom?: string, poble?: string, avatar?: string|null, href?: string|null }|null} identitat
 * @returns {{ nom: string, poble: string, avatar: string|null, href: string, configurat: boolean }}
 */
export function titularDe(identitat) {
  const nom = typeof identitat?.nom === 'string' ? identitat.nom.trim() : '';
  return {
    nom: nom || TITULAR_SENSE_CONFIGURAR,
    poble: typeof identitat?.poble === 'string' ? identitat.poble : '',
    avatar: identitat?.avatar ?? null,
    href: identitat?.href || RUTA_TITULAR,
    configurat: Boolean(nom)
  };
}

/* El dia d'avui, { a, m, d }, per al trimestre de les estimacions. */
function diaDe(data) {
  return data instanceof Date && !Number.isNaN(data.getTime())
    ? { a: data.getFullYear(), m: data.getMonth() + 1, d: data.getDate() }
    : null;
}

export default function ShellGestoria({
  magatzem, subtle, tractors, entorn, rellotge, inflate, avui, descarrega, titular: titularPropi = null,
  modulActiu, mostrarRail = true
}) {
  const navigate = useNavigate();
  const tauler = useTauler({ magatzem, subtle, tractors, entorn, rellotge });
  const [modulLocal, setModulLocal] = useState('tauler');
  const modul = modulActiu ?? modulLocal;
  const [oberta, setOberta] = useState(null);
  const [visible, setVisible] = useState(false);
  const [avis, setAvis] = useState(null);
  const [hui] = useState(() => diaDe(typeof avui === 'function' ? avui() : new Date(typeof rellotge === 'function' ? rellotge() : Date.now())));
  const refTitol = useRef(null);
  const navegat = useRef(false);
  const modulAnterior = useRef(modul);

  const titular = titularDe(titularPropi ?? tauler.lectura?.identitat ?? null);
  const pastilla = pastillaDeSincronitzacio(tauler.llegit);
  /* Les xifres es tornen a calcular quan arriba (o s'oblida) una lectura, i no a cada pintada. */
  const dades = useMemo(() => dadesDelTauler({ lectura: tauler.lectura, avui: hui }), [tauler.lectura, hui]);

  /* Després d'una navegació de la persona (un mòdul, una targeta, Tornar), el focus va a l'H1 de la pàgina nova. */
  useEffect(() => {
    if (modulAnterior.current !== modul) {
      modulAnterior.current = modul;
      setOberta(null);
      setAvis(null);
      navegat.current = false;
      refTitol.current?.focus();
      return;
    }
    if (!navegat.current) return;
    navegat.current = false;
    refTitol.current?.focus();
  }, [modul, oberta]);

  const obreTractors = useCallback(() => navigate(CONSULTA_TRACTORS), [navigate]);
  /* «Oblida les dades» buida la lectura i torna a tancar l'ull de la boina: la
     lectura següent no es pinta mai amb les xifres al DOM d'entrada (ordre del
     Mestre, 261004). Els ulls de cada targeta els tanca la `generacio`. */
  const oblida = () => {
    setVisible(false);
    tauler.oblida();
  };
  const triaModul = (id) => {
    navegat.current = true;
    setModulLocal(id);
    setOberta(null);
    setAvis(null);
  };
  const obriTargeta = (id) => {
    navegat.current = true;
    setOberta({ modul, id });
  };
  const tornaAlModul = () => {
    navegat.current = true;
    setOberta(null);
  };

  const accionsBoina = (
    <span className="sdp-gestoria-boina">
      <UllPrivacitat visible={visible} onCommuta={() => setVisible((abans) => !abans)} etiqueta="Mostra les xifres" />
      {pastilla ? <DateTimeControl {...pastilla} label={`Dades llegides a les ${pastilla.time} del ${pastilla.date}`} /> : null}
    </span>
  );
  const comuns = { titular, pastilla, visible, generacio: tauler.generacio, onObri: obriTargeta,
    onAvis: (text) => setAvis({ modul, text }) };
  const actual = MODULS_GESTORIA.find((m) => m.id === modul) ?? MODULS_GESTORIA[0];
  /* No es pinta ni un detall ni un avís del mòdul anterior, tampoc abans
     que l'efecte de navegació els buide. La lectura financera es conserva. */
  const targeta = oberta?.modul === modul ? dades.targetes.find((t) => t.id === oberta.id) ?? null : null;
  const avisActual = avis?.modul === modul ? avis.text : '';
  const porta = <PortaTauler tauler={tauler} onObreTractors={obreTractors} onOblida={oblida} />;

  const contingut = {
    tauler: <>{porta}<VistaTauler dades={dades} comuns={comuns} /></>,
    bancs: <>{porta}<VistaBancs dades={dades} comuns={comuns} /></>,
    impostos: <VistaImpostos dades={dades} comuns={comuns} />,
    full: (
      <ContenidorGestoria magatzem={magatzem} subtle={subtle} tractors={tractors} entorn={entorn} rellotge={rellotge}
        inflate={inflate} avui={avui} descarrega={descarrega} />
    )
  }[actual.id] ?? <ModulEnObres modul={actual} />;

  const salutacio = 'Ací tens la realitat de la teua empresa, calculada en este ordinador amb els extractes que tries.';

  return (
    <div className="sdp-gestoria-closca">
      {mostrarRail && <nav className="sdp-gestoria-closca__rail" aria-label="Panell de control de la Gestoria">
        <p className="sdp-gestoria-closca__rail-titol">Gestoria</p>
        <ul className="sdp-gestoria-closca__moduls">
          {MODULS_GESTORIA.map((m) => {
            const Icona = m.icona;
            return (
              <li key={m.id}>
                <button type="button" className="sdp-gestoria-closca__modul" aria-current={m.id === actual.id ? 'page' : undefined}
                  onClick={() => triaModul(m.id)}>
                  <Icona size={20} aria-hidden="true" focusable="false" />
                  <span className="sdp-gestoria-closca__modul-nom">{m.etiqueta}</span>
                  {m.enObres ? <Insignia to="neutre">en obres</Insignia> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>}
      <div className="sdp-gestoria-closca__pagina">
        {targeta ? (
          <PaginaTargeta targeta={targeta} titular={titular} pastilla={pastilla} visible={visible}
            barActions={accionsBoina} onTorna={tornaAlModul} refTitol={refTitol} />
        ) : (
          <PaginaApp title={actual.titol} subtitle={actual.subtitol}
            lead={actual.id === 'tauler' ? (titular.configurat ? `Hola, ${titular.nom}! ${salutacio}` : salutacio) : actual.enObres ? EN_OBRES : undefined}
            author={titular} {...(pastilla ?? {})} barActions={accionsBoina}
            labels={actual.enObres ? [...ETIQUETES_PANELL, ETIQUETA_EN_OBRES] : ETIQUETES_PANELL}
            refTitol={refTitol} showComment={false} showShare={false} showConnect={false}>
            {avisActual ? <Alerta to="info" onTanca={() => setAvis(null)}>{avisActual}</Alerta> : null}
            {contingut}
          </PaginaApp>
        )}
      </div>
    </div>
  );
}
