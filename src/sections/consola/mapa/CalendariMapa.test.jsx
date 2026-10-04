/* T6-T8 (ordre del Mestre, 260930) · El Calendari de la Consola, de veres,
   sobre CalendariEsdeveniments: el mes pinta el DOM d'abans del trasllat de
   T40 amb només el que demana T7 (la variant gran a la graella i la classe de
   la píndola a cada Insignia). La resta de la pàgina no canvia. */
import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';

vi.mock('../../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
import { CalendariMapa } from './CalendariMapa.jsx';
import { Boto } from '../../../components/PedraSeca/atoms/Boto.jsx';
import { Insignia } from '../../../components/PedraSeca/atoms/Insignia.jsx';
import { Taula } from '../../../components/PedraSeca/organismes/Taula.jsx';
import { DIES_CURTS, DIES_LLARGS, graellaMes } from '../../../utils/calendari.js';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
beforeEach(() => vi.useFakeTimers({ toFake: ['Date'] }));

/* Una tasca cada hora (viva, tots els dies), una setmanal de cron (morta, els
   dijous) i les que no es poden situar en dies. Correcció 261004 (verificador
   de la segona passada) · el Calendari pinta també «Coses que corren soles»,
   que compta sobre el Mapa sencer: la prova porta la forma completa d'un Mapa
   (normalitzaMapa no en deixa passar cap sense nodes, arestes, avisos ni salut). */
const MAPA = Object.freeze({
  nodes: [], arestes: [], avisos: [], salut: [],
  tasques: [
    { id: 'plaquetes-diagnostic', estat: 'viu', llancador: { tipus: 'launchd', etiqueta: 'org.socdepoble.plaquetes' }, cadencia: { cada_segons: 3600, en_arrencar: true }, script: 'scripts/immunitari/plaquetes.mjs', font: null },
    { id: 'copia', estat: 'mort', llancador: { tipus: 'launchd', etiqueta: 'org.x.copia' }, cadencia: { cron: '30 2 * * 4' }, script: null, font: null },
    { id: 'reflex-daemon', estat: 'mort', llancador: { tipus: 'launchd', etiqueta: 'com.socdepoble.reflex_daemon' }, cadencia: { permanent: true }, script: null, font: null },
    { id: 'frontissa-contingut', estat: 'desconegut', llancador: { tipus: 'git-hook', esdeveniment: 'pre-commit' }, cadencia: null, script: null, font: null }
  ]
});

/* El mes de CalendariMapa.jsx abans de T40, literal, amb els xips de veres i
   les dos classes de T7. */
function MesAntic({ avui, locale }) {
  const [any, mes] = [avui.getFullYear(), avui.getMonth()];
  const titolMes = new Date(any, mes, 1).toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const esAvui = (dia) => dia === avui.getDate();
  const xip = (id, to, estat) => <div key={id}><Insignia to={to} className="sdp-calendari__pindola">{id} · {estat}</Insignia></div>;
  return (
    <>
      <div className="sdp-consola__capcal">
        <Boto varietat="secundari" onClick={() => {}} aria-label="Mes anterior">‹</Boto>
        <Boto varietat="secundari" onClick={() => {}}>Hui</Boto>
        <Boto varietat="secundari" onClick={() => {}} aria-label="Mes següent">›</Boto>
      </div>
      <Taula titol={`Calendari de ${titolMes}`} className="sdp-calendari--gran">
        <caption>{titolMes}</caption>
        <thead>
          <tr>{DIES_CURTS.map((d, i) => <th key={d} scope="col"><abbr title={DIES_LLARGS[i]}>{d}</abbr></th>)}</tr>
        </thead>
        <tbody>
          {graellaMes(any, mes).map((setmana) => (
            <tr key={setmana.find(Boolean)}>
              {setmana.map((dia, i) => (
                <td key={dia ?? `buit-${i}`}>
                  {dia ? <>
                    {esAvui(dia) ? <><strong>{dia}</strong><span className="sdp-nomes-lector"> (hui)</span></> : dia}
                    {[
                      xip('plaquetes-diagnostic', 'exit', 'viu'),
                      new Date(any, mes, dia).getDay() === 4 ? xip('copia', 'error', 'mort') : null
                    ].filter(Boolean)}
                  </> : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </Taula>
    </>
  );
}

/* La barra «‹ Hui ›» i la graella, en HTML. */
function elMes(container) {
  const barra = container.querySelector('.sdp-consola__capcal');
  const graella = container.querySelector('[role="region"][aria-label^="Calendari de "]');
  return `${barra.outerHTML}${graella.outerHTML}`;
}

test('Llei del Píxel · el mes de la Consola és el de T40 amb només les classes de T7', () => {
  for (const ara of [new Date(2026, 8, 28, 10), new Date(2026, 1, 10, 10), new Date(2027, 0, 15, 10)]) {
    vi.setSystemTime(ara);
    const consola = render(<CalendariMapa mapa={MAPA} locale="ca-ES" />);
    const nou = elMes(consola.container);
    expect(consola.container.textContent).not.toContain('el mes queda buit a posta');
    cleanup();
    const antic = elMes(render(<MesAntic avui={ara} locale="ca-ES" />).container);
    cleanup();
    expect(nou).toBe(antic);
  }
});

test('T7 · la taula de la pàgina porta la classe de les vores fines; la resta, com abans', () => {
  vi.setSystemTime(new Date(2026, 8, 28, 10));
  const { container, getByRole } = render(<CalendariMapa mapa={MAPA} locale="ca-ES" />);
  expect(getByRole('region', { name: 'Tasques per cadència' }).className).toBe('sdp-taula sdp-taula--densa sdp-calendari__taula');
  // Les quatre caixes de cadència amb tasques, darrere de «Coses que corren soles» (correcció 261004).
  expect([...container.querySelectorAll('.sdp-card-grid article.sp-card h3')].map((h) => h.textContent))
    .toEqual(['3 coses que corren soles', '1 tasca diària', '1 tasca setmanal', '1 tasca resident', '1 tasca per esdeveniment']);
});

test('sense cap tasca situable en dies, l’avís continua entre la barra i la graella', () => {
  vi.setSystemTime(new Date(2026, 8, 28, 10));
  const { container } = render(<CalendariMapa mapa={{ ...MAPA, tasques: MAPA.tasques.slice(2) }} locale="ca-ES" />);
  const avis = [...container.querySelectorAll('p')].find((p) => p.textContent.includes('el mes queda buit a posta'));
  expect(avis.previousElementSibling.className).toBe('sdp-consola__capcal');
  expect(avis.nextElementSibling.className).toBe('sdp-taula sdp-calendari--gran');
  expect(container.querySelector('.sdp-calendari__pindola')).toBeNull();
});
