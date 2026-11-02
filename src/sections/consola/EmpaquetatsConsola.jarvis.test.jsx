import React from 'react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';

/* IDEA-60 (T1, prompt 261102_1532; ordre del Mestre, Llibre Mestre,
   2026-11-02 14:46) · El Mode Jarvis Omnicanal d'1 Clic a /consola/empaquetats:
   el panell darrere de la Versió Canònica i abans de les plataformes, amb els
   quatre canals i el seu semàfor; el botó desactivat sense notes (i el per
   què, llegible); amb fetch simulat, un servidor sense corredor (404 amb
   l'HTML de l'SPA) → l'avís i l'ordre del terminal; 202 JSON → els passos i,
   amb el progrés 'fet', les insígnies verdes i cap petició més; 403 → l'avís
   d'error; i fora de DEV, el botó desactivat amb l'avís honest. Patró de
   ConsolaSection.empaquetats.test.jsx: PaginaEmpaquetats muntada directament
   amb una font llesta; només es falsegen fetch i el que no té res a vore. */
vi.mock('../../app/contexts/RouterContext', () => ({
  useNavigate: () => vi.fn(),
  Link: ({ to, children, ...props }) => <a href={to} {...props}>{children}</a>
}));
vi.mock('../../app/contexts/UIContext', () => ({
  useUIState: () => ({ locale: 'ca-ES' }),
  useUIActions: () => ({ t: (_clau, perDefecte) => perDefecte })
}));
vi.mock('@/components/universal/NotificationContext.jsx', () => ({ useToast: () => ({ showToast: vi.fn() }) }));
vi.mock('../../hooks/useSEO', () => ({ useSEO: () => {} }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: ({ title, children }) => <main><header className="page-title"><h1>{title}</h1></header>{children}</main>
}));
import { PaginaEmpaquetats, SeccioJarvis } from './EmpaquetatsConsola.jsx';
import { normalitzaEmpaquetats, plataformesEmpaquetades } from './empaquetats.js';
import {
  ERROR_NOTES_BUIDES, ESQUEMA_JARVIS, ETIQUETA_CANALS, ETIQUETA_NOTES, ETIQUETA_PASSOS, MISSATGES_JARVIS, MOTIU_FORA_DE_DEV,
  MOTIU_LLEST, MOTIU_SENSE_FONT, PASSOS_INICIALS, RUTA_PROGRES, RUTA_PUBLICA_TOT, TEXT_BOTO_JARVIS, TITOL_JARVIS
} from './jarvis.js';
import { nomenaPlataformaAliena } from '../text/perAppNativa.js';

const BRUT = {
  schema: 'sdp.empaquetats.v1',
  generat: '2026-10-28T16:30:00.000Z',
  canonica: '1.0.0',
  carpeta: true,
  plataformes: {
    android: { versions: ['1.0.0'], builds: ['1'], font: 'android/app/build.gradle', artefactes: ['261023_socdepoble_1.0.0+1.aab', 'socdepoble-beta.apk'] },
    ios: { versions: ['1.0.0'], builds: ['1'], font: 'ios/App/App.xcodeproj/project.pbxproj', artefactes: ['261024_socdepoble_1.0.0+1.xcarchive'] },
    pwa: { versions: ['1.0.0'], font: 'package.json', artefactes: [] },
    wordpress: { versions: ['1.1.9'], estable: '1.1.9', font: 'wordpress-plugin/socdepoble-enxufe.php', artefactes: ['261021_2015_wordpress_enxufe_v1.1.9.zip'] }
  }
};
const VALOR = normalitzaEmpaquetats(BRUT);
const FONT = Object.freeze({ estat: 'ready', valor: VALOR, error: null });
const ABSENT = Object.freeze({ estat: 'absent', valor: null, error: null });
const NOTES = 'Arreglem el xat.';
const ORDRE = `npm run jarvis:publica-tot -- --notes "${NOTES}"`;
const HTML = '<!doctype html><html><head><title>Sóc de Poble</title></head><body><div id="root"></div></body></html>';
const JSON_TIPUS = 'application/json; charset=utf-8';
const INICIAT = Object.freeze({ schema: ESQUEMA_JARVIS, estat: 'en_curs', passos: PASSOS_INICIALS().map((p, i) => ({ ...p, estat: i === 0 ? 'en_curs' : 'pendent' })) });
const FET = Object.freeze({ schema: ESQUEMA_JARVIS, estat: 'fet', passos: PASSOS_INICIALS().map((p) => ({ ...p, estat: 'fet', detall: `${p.canal} publicat` })) });

/* Una resposta de fetch de mentides: el cos com a text (el que llig el POST) i com a JSON (el progrés). */
const resposta = ({ status = 200, tipus = JSON_TIPUS, cos = '' } = {}) => ({
  status,
  ok: status >= 200 && status < 300,
  statusText: '',
  headers: { get: (nom) => (String(nom).toLowerCase() === 'content-type' ? tipus : '') },
  text: async () => (typeof cos === 'string' ? cos : JSON.stringify(cos)),
  json: async () => (typeof cos === 'string' ? JSON.parse(cos) : cos)
});
const senseCorredor = () => resposta({ status: 404, tipus: 'text/html', cos: HTML });
const urls = (peticio) => peticio.mock.calls.map(([url]) => String(url));
const espera = (ms) => new Promise((resol) => { setTimeout(resol, ms); });

let errors;
let peticio;
beforeEach(() => {
  vi.stubEnv('DEV', true);
  errors = vi.spyOn(console, 'error').mockImplementation(() => {});
  peticio = vi.fn(async () => senseCorredor());
  vi.stubGlobal('fetch', peticio);
});
afterEach(() => {
  cleanup();
  errors.mockRestore();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

const pagina = (font = FONT, privat = false) => render(<PaginaEmpaquetats font={font} privat={privat} peu={null} />);
const seccio = () => screen.getByRole('region', { name: TITOL_JARVIS });
const boto = () => within(seccio()).getByRole('button', { name: TEXT_BOTO_JARVIS });
const motiu = () => document.getElementById(boto().getAttribute('aria-describedby')).textContent;
const escriu = (text) => { fireEvent.change(within(seccio()).getByLabelText(ETIQUETA_NOTES), { target: { value: text } }); };
const publica = async () => { await act(async () => { fireEvent.click(boto()); }); };
const insignies = (arrel) => [...arrel.querySelectorAll('.sdp-insignia')].map((i) => i.textContent);

describe('el panell a /consola/empaquetats', () => {
  test('darrere de la Versió Canònica i abans de les plataformes: H3, entradeta, quatre canals amb semàfor, versió i últim artefacte', () => {
    pagina();
    const panell = seccio();
    const main = document.querySelector('main');
    expect(panell.tagName).toBe('SECTION');
    expect(panell.querySelector('h3').textContent).toBe(TITOL_JARVIS);
    const versio = [...main.querySelectorAll('p')].find((p) => p.textContent.startsWith('Versió Canònica del Sistema: '));
    expect(versio.nextElementSibling).toBe(panell);
    const seccions = [...main.querySelectorAll('section')];
    expect(seccions[0]).toBe(panell);
    expect(seccions.slice(1).map((s) => s.querySelector('h3').textContent)).toEqual(['Android', 'iOS', 'Web (socdepoble.org)', 'Connector de WordPress']);
    expect(panell.querySelector('h3').nextElementSibling.textContent)
      .toBe('Un sol botó actualitza la web, el connector de WordPress, Google Play i l’App Store. Escriu què hem millorat i publica.');
    const llista = within(panell).getByRole('list', { name: ETIQUETA_CANALS });
    expect(llista.className).toBe('sdp-consola__estats');
    const files = [...llista.querySelectorAll(':scope > li')];
    expect(files.map((li) => li.querySelector('.sdp-insignia').textContent)).toEqual([
      'Web socdepoble.org · Font canònica',
      'Connector de WordPress (WordPress.org) · Alineat',
      'Android · Google Play i APK directe · Alineat',
      'Apple · App Store i TestFlight · Alineat'
    ]);
    expect(files.map((li) => li.querySelector('.sdp-insignia').className)).toEqual([
      'sdp-insignia sdp-insignia--neutre', 'sdp-insignia sdp-insignia--exit', 'sdp-insignia sdp-insignia--exit', 'sdp-insignia sdp-insignia--exit'
    ]);
    expect(files.map((li) => [...li.querySelectorAll('code.sdp-consola__mono')].map((c) => c.textContent))).toEqual([
      ['1.0.0'],
      ['1.1.9', '261021_2015_wordpress_enxufe_v1.1.9.zip'],
      ['1.0.0+1', '261023_socdepoble_1.0.0+1.aab'],
      ['1.0.0+1', '261024_socdepoble_1.0.0+1.xcarchive']
    ]);
    // El camp de notes, dins d'un Camp de Pedra Seca; cap estil en línia, cap formulari.
    const area = within(panell).getByLabelText(ETIQUETA_NOTES);
    expect(area.tagName).toBe('TEXTAREA');
    expect(area.getAttribute('maxlength')).toBe('500');
    expect(area.getAttribute('rows')).toBe('2');
    expect(panell.querySelector('form, [style]')).toBeNull();
    expect(peticio).not.toHaveBeenCalled();
    expect(errors).not.toHaveBeenCalled();
  });

  test('sense notes el botó va desactivat i diu per què; amb notes s’activa', () => {
    pagina();
    expect(boto().className).toBe('sdp-boto sdp-boto--primari sdp-boto--gran');
    expect(boto().disabled).toBe(true);
    expect(motiu()).toBe(ERROR_NOTES_BUIDES);
    escriu('   ');
    expect(boto().disabled).toBe(true);
    escriu(NOTES);
    expect(boto().disabled).toBe(false);
    expect(motiu()).toBe(MOTIU_LLEST);
    expect(peticio).not.toHaveBeenCalled();
  });

  test('a DEV sense lectura viva (font absent): «Sense dades» a cada canal i el botó desactivat amb el per què', () => {
    pagina(ABSENT);
    expect(insignies(within(seccio()).getByRole('list', { name: ETIQUETA_CANALS })).every((t) => t.endsWith(' · Sense dades'))).toBe(true);
    expect(seccio().querySelector('code')).toBeNull();
    escriu(NOTES);
    expect(boto().disabled).toBe(true);
    expect(motiu()).toBe(MOTIU_SENSE_FONT);
    expect(seccio().querySelector('.sdp-alerta')).toBeNull();
  });

  test('un servidor sense corredor (404 amb l’HTML de l’SPA): l’avís i l’ordre del terminal, i la petició era la bona', async () => {
    pagina();
    escriu(NOTES);
    await publica();
    const avis = await waitFor(() => {
      const el = seccio().querySelector('.sdp-alerta--avis');
      expect(el).not.toBeNull();
      return el;
    });
    expect(avis.getAttribute('role')).toBe('status');
    expect(avis.textContent).toContain('Este servidor no porta el corredor Jarvis. Executa-ho al terminal:');
    const pre = avis.querySelector('pre');
    expect(pre.className).toBe('sdp-consola__diagnosi-text');
    expect(pre.textContent).toBe(ORDRE);
    expect(seccio().querySelector('ol')).toBeNull();
    expect(urls(peticio)).toEqual([RUTA_PUBLICA_TOT]);
    const [, opcions] = peticio.mock.calls[0];
    expect(opcions.method).toBe('POST');
    expect(opcions.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(opcions.body)).toEqual({ schema: ESQUEMA_JARVIS, notes: NOTES, canals: ['web', 'wordpress', 'android', 'ios'], sec: false });
    expect(boto().disabled).toBe(false);
    expect(errors).not.toHaveBeenCalled();
  });

  test('amb el mode privacitat, ni les versions ni l’ordre del terminal es veuen', async () => {
    pagina(FONT, true);
    const text = seccio().textContent;
    for (const tros of ['1.1.9', '261023_socdepoble_1.0.0+1.aab', '261024_socdepoble_1.0.0+1.xcarchive']) expect(text).not.toContain(tros);
    escriu(NOTES);
    await publica();
    await waitFor(() => expect(seccio().querySelector('pre')).not.toBeNull());
    expect(seccio().querySelector('pre').textContent).not.toContain('npm run');
    expect(seccio().querySelector('pre').textContent).toContain('dada amagada pel mode privacitat');
  });

  test('403: l’avís d’error del corredor només local, sense passos ni ordre', async () => {
    peticio.mockImplementation(async () => resposta({ status: 403, tipus: 'text/plain', cos: 'Forbidden' }));
    pagina();
    escriu(NOTES);
    await publica();
    const alerta = await waitFor(() => {
      const el = seccio().querySelector('.sdp-alerta--error');
      expect(el).not.toBeNull();
      return el;
    });
    expect(alerta.getAttribute('role')).toBe('alert');
    expect(alerta.textContent).toBe(MISSATGES_JARVIS['no-local']);
    expect(seccio().querySelector('pre, ol')).toBeNull();
    expect(urls(peticio)).toEqual([RUTA_PUBLICA_TOT]);
  });

  test('fora de DEV: el botó desactivat amb l’avís honest del webhook pendent, i cap petició', () => {
    vi.stubEnv('DEV', false);
    pagina();
    escriu(NOTES);
    expect(boto().disabled).toBe(true);
    expect(motiu()).toBe(MOTIU_FORA_DE_DEV);
    const info = seccio().querySelector('.sdp-alerta--info');
    expect(info.getAttribute('role')).toBe('status');
    expect(info.querySelector('.sdp-alerta__titol').textContent).toBe('Des de la web pública, encara no');
    expect(info.querySelector('.sdp-alerta__text').textContent).toBe(MOTIU_FORA_DE_DEV);
    expect(MOTIU_FORA_DE_DEV).toContain('webhook pendent');
    fireEvent.click(boto());
    expect(peticio).not.toHaveBeenCalled();
  });
});

describe('el corredor en marxa (SeccioJarvis amb interval curt)', () => {
  const plataformes = plataformesEmpaquetades(VALOR, '1.0.0', { nativa: false });
  const panell = (props = {}) => render(<SeccioJarvis font={FONT} plataformes={plataformes} interval={5} {...props} />);
  const passos = () => within(seccio()).getByRole('list', { name: ETIQUETA_PASSOS });
  const corredor = (progresos) => {
    let lectura = 0;
    peticio.mockImplementation(async (url, opcions) => {
      if (opcions?.method === 'POST') return resposta({ status: 202, cos: INICIAT });
      expect(String(url)).toBe(RUTA_PROGRES);
      const cos = progresos[Math.min(lectura, progresos.length - 1)];
      lectura += 1;
      return cos;
    });
  };

  test('202 JSON → els passos amb la seua insígnia; amb el progrés fet, totes verdes, el detall i cap petició més', async () => {
    corredor([resposta({ cos: INICIAT }), resposta({ cos: FET })]);
    panell();
    escriu(NOTES);
    await publica();
    await waitFor(() => expect(seccio().querySelector('ol')).not.toBeNull());
    // Àrbitre T1a-ARB-03 · La parella de classes de TargetaConsola (list-style: none): els títols ja van numerats.
    expect(passos().tagName).toBe('OL');
    expect(passos().className).toBe('sdp-consola__evidencies sdp-consola__problemes');
    expect([...passos().querySelectorAll('li')].map((li) => li.textContent))
      .toEqual(['En curs 1/4 Web al dia', 'Pendent 2/4 WordPress al dia', 'Pendent 3/4 Google Play i APK enviats', 'Pendent 4/4 Apple enviat']);
    expect(seccio().querySelector('.sdp-alerta--info').textContent).toBe(MISSATGES_JARVIS.iniciat);
    expect(boto().disabled).toBe(true);
    expect(within(seccio()).getByLabelText(ETIQUETA_NOTES).disabled).toBe(true);
    await waitFor(() => expect(insignies(passos())).toEqual(['Fet', 'Fet', 'Fet', 'Fet']));
    expect([...passos().querySelectorAll('.sdp-insignia')].map((i) => i.className)).toEqual(Array(4).fill('sdp-insignia sdp-insignia--exit'));
    expect(passos().querySelectorAll('li')[0].textContent).toBe('Fet 1/4 Web al dia · web publicat');
    expect(seccio().querySelector('.sdp-alerta--exit').textContent).toBe(MISSATGES_JARVIS.fet);
    expect(seccio().querySelector('.sdp-alerta--info')).toBeNull();
    expect(boto().disabled).toBe(false);
    const abans = peticio.mock.calls.length;
    await espera(40);
    expect(peticio.mock.calls.length).toBe(abans);
    expect(urls(peticio)).toEqual([RUTA_PUBLICA_TOT, RUTA_PROGRES, RUTA_PROGRES]);
    expect(peticio.mock.calls[1][1]).toMatchObject({ cache: 'no-store' });
    expect(errors).not.toHaveBeenCalled();
  });

  test('el corredor s’atura amb error: l’avís roig i el pas que ha fallat', async () => {
    const aturat = { ...FET, estat: 'error', passos: FET.passos.map((p, i) => ({ ...p, estat: i < 2 ? 'fet' : i === 2 ? 'error' : 'pendent', detall: i === 2 ? 'Google Play ha dit que no' : undefined })) };
    corredor([resposta({ cos: aturat })]);
    panell();
    escriu(NOTES);
    await publica();
    await waitFor(() => expect(insignies(passos())).toEqual(['Fet', 'Fet', 'Error', 'Pendent']));
    expect(seccio().querySelector('.sdp-alerta--error').textContent).toBe(MISSATGES_JARVIS.aturada);
    expect(passos().querySelectorAll('li')[2].textContent).toBe('Error 3/4 Google Play i APK enviats · Google Play ha dit que no');
    expect(urls(peticio)).toEqual([RUTA_PUBLICA_TOT, RUTA_PROGRES]);
  });

  test('un progrés que no és el de l’esquema (l’HTML de l’SPA) és contacte perdut: avís roig, els passos d’abans i cap petició més', async () => {
    corredor([resposta({ tipus: 'text/html', cos: HTML })]);
    panell();
    escriu(NOTES);
    await publica();
    await waitFor(() => expect(seccio().querySelector('.sdp-alerta--error')).not.toBeNull());
    expect(seccio().querySelector('.sdp-alerta--error').textContent).toBe(MISSATGES_JARVIS.contacte);
    expect(insignies(passos())).toEqual(['En curs', 'Pendent', 'Pendent', 'Pendent']);
    await espera(30);
    expect(urls(peticio)).toEqual([RUTA_PUBLICA_TOT, RUTA_PROGRES]);
  });

  test('el límit de temps: passat maxEspera, deixa de demanar i ho diu', async () => {
    corredor([resposta({ cos: INICIAT })]);
    panell({ maxEspera: 0 });
    escriu(NOTES);
    await publica();
    await waitFor(() => expect(seccio().querySelector('.sdp-alerta--error')).not.toBeNull());
    expect(seccio().querySelector('.sdp-alerta--error').textContent).toBe(MISSATGES_JARVIS.temps);
    expect(urls(peticio)).toEqual([RUTA_PUBLICA_TOT]);
  });

  test('en desmuntar, cap petició de progrés més', async () => {
    corredor([resposta({ cos: INICIAT })]);
    const { unmount } = panell({ interval: 15 });
    escriu(NOTES);
    await publica();
    await waitFor(() => expect(seccio().querySelector('ol')).not.toBeNull());
    unmount();
    await espera(50);
    expect(urls(peticio)).toEqual([RUTA_PUBLICA_TOT]);
    expect(errors).not.toHaveBeenCalled();
  });

  test('dev={false} explícit: el botó desactivat i l’avís honest, encara que l’entorn siga DEV', () => {
    panell({ dev: false });
    escriu(NOTES);
    expect(boto().disabled).toBe(true);
    expect(motiu()).toBe(MOTIU_FORA_DE_DEV);
    expect(seccio().querySelector('.sdp-alerta--info')).not.toBeNull();
  });

  test('dins de l’app nativa: tres canals, tres passos i cap menció d’una altra plataforma mòbil (regla 2.3.10), encara que el corredor els done tots', async () => {
    corredor([resposta({ cos: INICIAT })]);
    panell({ nativa: true });
    expect(insignies(within(seccio()).getByRole('list', { name: ETIQUETA_CANALS })))
      .toEqual(['Web socdepoble.org · Font canònica', 'Connector de WordPress (WordPress.org) · Alineat', 'Apple · App Store i TestFlight · Alineat']);
    expect(nomenaPlataformaAliena(seccio().textContent)).toBe(false);
    escriu(NOTES);
    await publica();
    expect(JSON.parse(peticio.mock.calls[0][1].body).canals).toEqual(['web', 'wordpress', 'ios']);
    await waitFor(() => expect(seccio().querySelector('ol')).not.toBeNull());
    expect([...passos().querySelectorAll('li')].map((li) => li.textContent)).toEqual(['En curs 1/4 Web al dia', 'Pendent 2/4 WordPress al dia', 'Pendent 4/4 Apple enviat']);
    expect(nomenaPlataformaAliena(seccio().textContent)).toBe(false);
  });

  /* Verificador T1a · L'app viu dins de <StrictMode> (App.jsx) i en DEV React 18
     munta, desmunta i torna a muntar els efectes: si el ref de muntatge es
     quedava a false, el primer clic descartava la resposta i el botó es quedava
     carregant per sempre. Ací el 404 ha d'acabar en l'avís i el botó lliure. */
  test('sota <StrictMode>, el primer clic acaba igual: l’avís del corredor absent i el botó lliure', async () => {
    render(<React.StrictMode><SeccioJarvis font={FONT} plataformes={plataformes} interval={5} /></React.StrictMode>);
    escriu(NOTES);
    await publica();
    const avis = await waitFor(() => {
      const el = seccio().querySelector('.sdp-alerta--avis');
      expect(el).not.toBeNull();
      return el;
    });
    expect(avis.querySelector('pre').textContent).toBe(ORDRE);
    expect(boto().disabled).toBe(false);
    expect(urls(peticio)).toEqual([RUTA_PUBLICA_TOT]);
    expect(errors).not.toHaveBeenCalled();
  });
});
