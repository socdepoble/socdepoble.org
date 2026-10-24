import React from 'react';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
const m = vi.hoisted(() => ({
  caps: new Set(), navigate: vi.fn(),
  exporta: vi.fn(), estatBaixa: vi.fn(), demana: vi.fn(), cancela: vi.fn(),
  estatConsentiment: vi.fn(), registra: vi.fn(), revoca: vi.fn(),
  /* T47 · La sessió de React (null: la peça muntada sola, sense proveïdor). */
  sessio: null,
  /* Ordre del Mestre (261007) · Les props de l'última UniversalPage pintada. */
  pagina: null,
}));
vi.mock('../../app/contexts/RouterContext', () => ({ useNavigate: () => m.navigate, Link: ({ to, children }) => <a href={to}>{children}</a> }));
vi.mock('../../app/contexts/SessionContext.jsx', () => ({ useSessioOpcional: () => m.sessio }));
vi.mock('../../components/universal/UniversalPage', () => ({
  UniversalPage: (props) => {
    m.pagina = props;
    const { title, lead, topBarData, children } = props;
    return (
      <main>
        <header className="page-title"><h1>{title}</h1></header>
        <p>{lead}</p><p>{topBarData?.authorName}</p>{children}
      </main>
    );
  },
}));
vi.mock('../../data/backendPort.js', () => ({
  teCapacitat: (cap) => m.caps.has(cap),
  exportaLesMeuesDades: m.exporta, estatBaixa: m.estatBaixa, demanaBaixa: m.demana, cancelaBaixa: m.cancela,
  estatConsentiment: m.estatConsentiment, registraConsentiment: m.registra, revocaConsentiment: m.revoca,
}));
import { DetallPrivacitat, nomFitxerExportacio, dataLlegible, pagina } from './DetallPrivacitat.jsx';

const config = { tenantId: '00000000-0000-4000-8000-000000000000' };
const jo = { id: 'jo', mena: 'persona', nom: 'Pep', dades: { full_name: 'Pep', email: 'pep@poble.test', is_public: false, town_name: 'La Torre' } };
const forn = { id: 'O', mena: 'empresa', nom: 'Forn', dades: { name: 'Forn', slug: 'forn', kind: 'company', role: 'owner' } };
const SENSE_BAIXA = { demanada: false, demanadaAl: null, purgaPrevistaAl: null };
const ACCEPTAT = { versioVigent: 'v1', url: '/legal', textSha256: null, calReconsentir: false,
  consentiments: [{ tipus: 'rgpd_acepta', accio: 'atorga', versio: 'v1', al: '2026-09-15T10:00:00Z' }] };

let props;
function pinta(identitat = jo, extra = {}) {
  props = { identitat, config, onPerfilCanviat: vi.fn(), onSessioTancada: vi.fn(), ...extra };
  return render(<DetallPrivacitat {...props} />);
}
const seccio = (titol) => screen.getByRole('heading', { level: 2, name: titol }).closest('section');

beforeEach(() => {
  m.caps = new Set();
  m.sessio = null;
  for (const f of [m.navigate, m.exporta, m.estatBaixa, m.demana, m.cancela, m.estatConsentiment, m.registra, m.revoca]) f.mockReset();
  m.estatBaixa.mockResolvedValue(SENSE_BAIXA);
  m.estatConsentiment.mockResolvedValue(ACCEPTAT);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

test('amb les dues capacitats, tres blocs en ordre: dades, consentiment i baixa', async () => {
  m.caps = new Set(['compte', 'consentiment']);
  pinta();
  expect(screen.getByRole('heading', { level: 1, name: 'Privacitat i dades' })).toBeTruthy();
  const titols = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
  expect(titols).toEqual(['Les meues dades', 'Consentiment', 'Donar-se de baixa']);
  await within(seccio('Donar-se de baixa')).findByRole('button', { name: 'Donar-me de baixa' });
  expect(screen.getByText('Pep')).toBeTruthy();
});

test('només «consentiment»: ni dades ni baixa, i cap crida a la baixa', async () => {
  m.caps = new Set(['consentiment']);
  pinta();
  await within(seccio('Consentiment')).findByText(/Política de privacitat vigent/);
  expect(screen.queryByRole('heading', { name: 'Les meues dades' })).toBeNull();
  expect(screen.queryByRole('heading', { name: 'Donar-se de baixa' })).toBeNull();
  expect(m.estatBaixa).not.toHaveBeenCalled();
});

test('sense capacitats, cap bloc ni cap crida al servidor, i ho diu', () => {
  pinta();
  expect(screen.queryByRole('heading', { level: 2 })).toBeNull();
  expect(screen.getByText('Este node encara no oferix cap d’estes opcions.')).toBeTruthy();
  expect(m.estatBaixa).not.toHaveBeenCalled();
  expect(m.estatConsentiment).not.toHaveBeenCalled();
});

/* Ordre del Mestre (261007) · «Quan isquen, les barres taronges han de portar
   a la pàgina de l'autor que l'ha creada». La pàgina privada porta a la fitxa
   pública de la persona, per l'id de la seua fila. */
test('261007 · la barra taronja porta a la fitxa pública de la persona amb l’id real, no «jo»', () => {
  pinta({ ...jo, dades: { ...jo.dades, id: 'U' } });
  expect(m.pagina.topBarData).toMatchObject({ authorName: 'Pep', authorHref: '/gent/U' });
  cleanup();
  // Sense la fila, cap ruta inventada.
  pinta();
  expect(m.pagina.topBarData.authorHref).toBeNull();
});

test('una organització no té pàgina de privacitat', () => {
  m.caps = new Set(['compte', 'consentiment']);
  const { container } = pinta(forn);
  expect(container.innerHTML).toBe('');
  expect(m.estatBaixa).not.toHaveBeenCalled();
});

test('«Les meues dades» descarrega el JSON amb el nom del dia', async () => {
  m.caps = new Set(['compte']);
  const dades = { format: 'socdepoble.exportacio.v1', perfil: { full_name: 'Pep' } };
  m.exporta.mockResolvedValue(dades);
  let blob = null, descarregat = null;
  URL.createObjectURL = vi.fn((b) => { blob = b; return 'blob:x'; });
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function clic() { descarregat = { nom: this.download, href: this.getAttribute('href'), penjat: this.isConnected }; });
  pinta();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Descarregar les meues dades' })); });
  expect(m.exporta).toHaveBeenCalledWith(config);
  // Llei 06 (encapsulament): l'enllaç no es penja de document.body.
  expect(descarregat).toEqual({ nom: nomFitxerExportacio(), href: 'blob:x', penjat: false });
  expect(blob.type).toBe('application/json');
  expect(JSON.parse(await blob.text())).toEqual(dades);
  expect(screen.getByText(`Ja tens el fitxer ${nomFitxerExportacio()} a les descàrregues.`)).toBeTruthy();
  expect(nomFitxerExportacio(new Date(2026, 8, 5))).toBe('socdepoble-dades-2026-09-05.json');
});

/* P2-08 (pla 261024_1315, T7; auditoria Codex C-04) · La llista honesta del
   que porta l'exportació (migració 2610241410), i el que no hi diu a posta. */
test('P2-08 · «Les meues dades» diu el que porta el fitxer i que no diu qui t’ha denunciat ni qui t’ha bloquejat', async () => {
  m.caps = new Set(['compte']);
  pinta();
  /* La baixa es comprova en muntar: s'espera que acabe abans de llegir. */
  await within(seccio('Donar-se de baixa')).findByRole('button', { name: 'Donar-me de baixa' });
  const text = within(seccio('Les meues dades')).getByText(/Descarrega una còpia de les dades/).textContent.replace(/\s+/g, ' ');
  for (const que of ['perfil', 'organitzacions', 'publicacions', 'notes', 'converses', 'la llista dels teus fitxers i adjunts',
    'consentiments', 'les denúncies que has fet', 'les persones i entitats que has bloquejat o que seguixes', 'les normes que has acceptat']) {
    expect(text, que).toContain(que);
  }
  /* Actualitzada a posta (261024 correccions): motiu, revisió R3-07 · la llista sencera del que es deixa fora (no_inclou de 2610241410). */
  expect(text).toContain('Per a protegir altres persones, no hi diem qui t’ha denunciat, qui t’ha bloquejat ni qui et seguix: '
    + 'de les denúncies sobre tu només hi ha quantes han acabat amb una mesura (si en vols el detall, demana-nos-el per correu) i, '
    + 'de qui et seguix, quantes persones són. Tampoc no hi posem les empremtes de l’adreça IP ni el permís xifrat d’Apple.');
  expect(text).toContain('És un fitxer JSON que pots obrir amb qualsevol editor de text.');
  /* Ja no promet «tot»: hi ha dades que es deixen fora per a protegir tercers. */
  expect(text).not.toMatch(/còpia de tot/);
  expect(screen.getByRole('button', { name: 'Descarregar les meues dades' })).toBeTruthy();
});

test('si l’exportació falla, ho diu amb el missatge del servidor', async () => {
  m.caps = new Set(['compte']);
  m.exporta.mockRejectedValue(new Error('Supabase 401: {"message":"SDP-EXPORT-000: cal la sessió iniciada."}'));
  pinta();
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Descarregar les meues dades' })); });
  expect(within(seccio('Les meues dades')).getByRole('alert').textContent).toContain('SDP-EXPORT-000: cal la sessió iniciada.');
});

test('demanar la baixa: confirmació, motiu opcional i sessió tancada', async () => {
  m.caps = new Set(['compte']);
  m.demana.mockResolvedValue({ demanada: true, demanadaAl: '2026-09-26T10:00:00Z', purgaPrevistaAl: '2026-10-26T10:00:00Z' });
  pinta();
  const boto = await within(seccio('Donar-se de baixa')).findByRole('button', { name: 'Donar-me de baixa' });
  expect(m.estatBaixa).toHaveBeenCalledWith(config);
  fireEvent.click(boto);
  const dialeg = screen.getByRole('dialog', { name: 'Donar-te de baixa' });
  expect(within(dialeg).getByText(/30 dies pots cancel·lar-la: entra de nou/)).toBeTruthy();
  expect(within(dialeg).getByText(/torna a «Privacitat i dades»/)).toBeTruthy();
  /* Actualitzada a posta (261024 correccions): motiu, revisió R3-03 · s'amaga i es posa un nom genèric, però no és anònim: cancela_baixa ho torna tot (Codex C-06). */
  expect(within(dialeg).getByText(/amaguem el teu perfil: deixa d’aparéixer al padró, hi posem un nom genèric en lloc del teu i li llevem la foto/)).toBeTruthy();
  fireEvent.change(within(dialeg).getByLabelText(/Per què te’n vas/), { target: { value: '  Me’n vaig a ciutat  ' } });
  await act(async () => { fireEvent.click(within(dialeg).getByRole('button', { name: 'Sí, donar-me de baixa' })); });
  expect(m.demana).toHaveBeenCalledWith({ motiu: 'Me’n vaig a ciutat' }, config);
  expect(props.onSessioTancada).toHaveBeenCalledTimes(1);
});

/* P2-08 (T7; auditoria Codex C-06, migracions 2610241420 de T1 i 2610241440 de
   T8) · La baixa diu què passa de veres: què s'esborra, què es queda a
   l'entitat, que el que es guarda no és anònim del tot, i el permís d'Apple. */
test('P2-08 · la baixa és honesta: publicacions i fitxers propis s’esborren, el de l’entitat es queda, i Apple', async () => {
  m.caps = new Set(['compte']);
  pinta();
  const bloc = seccio('Donar-se de baixa');
  const boto = await within(bloc).findByRole('button', { name: 'Donar-me de baixa' });
  /* Actualitzada a posta (261024 correccions): motiu, revisions R3-03, R3-04 i R3-10 · s'amaga (no s'anonimitza), l'excepció dels fitxers i l'espera d'Apple. */
  expect(within(bloc).getByText(/^Si te’n vas,/).textContent).toBe('Si te’n vas, en el moment amaguem el teu perfil: deixa d’aparéixer al padró, '
    + 'hi posem un nom genèric en lloc del teu i li llevem la foto. Tens 30 dies per a penedir-te’n. Passat eixe termini, s’esborren per sempre '
    + 'el compte, les teues publicacions personals i els teus fitxers, llevat dels que encara fa servir una entitat (la seua fitxa o una publicació) '
    + 'o una publicació d’una altra persona; el que vas publicar en nom d’una entitat es queda a l’entitat. Si vas entrar amb Apple i encara no '
    + 'hem pogut retirar el permís, l’esborrat pot esperar fins a 7 dies més.');
  fireEvent.click(boto);
  const dialeg = screen.getByRole('dialog', { name: 'Donar-te de baixa' });
  const punts = within(dialeg).getAllByRole('listitem').map((li) => li.textContent);
  /* Actualitzada a posta (261024 correccions): motiu, revisions R3-01, R1-02 i R3-04 · la revocació d'Apple només s'intenta: la via manual i l'espera de fins a 7 dies més. */
  expect(punts).toContain('Si vas entrar amb Apple, en demanar la baixa intentem retirar el permís que vas donar a Sóc de Poble; '
    + 'si no ho aconseguim, el pots retirar tu a Configuració › el teu nom › Inici de sessió amb Apple, o a account.apple.com. '
    + 'Si quan passen els 30 dies encara no l’hem pogut retirar, l’esborrat definitiu pot esperar fins a 7 dies més. '
    + 'Si l’hem retirat i tornes a entrar amb Apple per a cancel·lar la baixa, Apple et tornarà a demanar permís.');
  /* Actualitzada a posta (261024 correccions): motiu, revisió R3-10 · els fitxers que encara fa servir una entitat o una altra persona es conserven (2610241440). */
  expect(punts).toContain('Passats els 30 dies, s’esborren definitivament el compte, les teues publicacions personals i els teus fitxers, '
    + 'llevat dels que encara fa servir una entitat (la seua fitxa o una publicació) o una publicació d’una altra persona. '
    + 'El que vas publicar en nom d’una entitat es queda a l’entitat.');
  /* Actualitzada a posta (261024 correccions): motiu, revisió R3-10 · com el §10 de la política, també les denúncies sobre tu, amb l'identificador intern. */
  expect(punts).toContain('Es guarden, ja sense el teu compte però no del tot anònimes, la prova del consentiment, que la llei ens obliga '
    + 'a conservar, i, per a l’historial de moderació, les denúncies que vas fer i les que altres persones han fet sobre tu o sobre el teu '
    + 'contingut, amb l’identificador intern que tenia el teu compte.');
  /* Cap promesa d'esborrar «totes les dades», de retirar el permís d'Apple sense condicions ni d'anonimitzar res. */
  const tot = `${bloc.textContent} ${dialeg.textContent}`;
  expect(tot).not.toMatch(/totes les dades|les dades s’esborren|anonimitz|completament anònim|en demanar la baixa retirem/i);
});

/* Correccions 261024 (revisió R3-03; Codex C-06) · La mateixa guarda que
   legal.dsa.test.js posa al text legal, ara sobre el codi d'esta pantalla
   (també els comentaris i els textos que una prova no pinta): la baixa amaga
   el perfil i cancela_baixa el torna tal qual, així que res no s'anonimitza. */
test('261024 · cap «anonimitz» a DetallPrivacitat.jsx', () => {
  const font = readFileSync(path.join(process.cwd(), 'src/sections/profile/DetallPrivacitat.jsx'), 'utf8');
  expect(font).toContain('amaguem el teu perfil: deixa d’aparéixer al padró, hi posem un nom genèric en lloc del teu i li llevem la foto');
  expect(font).not.toMatch(/anonimitz/i);
});

test('T47 · la baixa passa per l’eixida de la sessió (envia el pendent abans i oblida els esborranys després), amb la configuració del perfil', async () => {
  m.caps = new Set(['compte']);
  const ordre = [];
  m.sessio = { eixAmb: vi.fn(async (tanca, configEixida) => { ordre.push(['abans', configEixida]); const r = await tanca(); ordre.push('després'); return r; }) };
  m.demana.mockImplementation(async () => { ordre.push('baixa'); return { demanada: true, demanadaAl: '2026-09-26T10:00:00Z', purgaPrevistaAl: '2026-10-26T10:00:00Z' }; });
  pinta();
  fireEvent.click(await screen.findByRole('button', { name: 'Donar-me de baixa' }));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sí, donar-me de baixa' })); });
  expect(m.sessio.eixAmb).toHaveBeenCalledTimes(1);
  expect(ordre).toEqual([['abans', config], 'baixa', 'després']);
  expect(m.demana).toHaveBeenCalledWith({}, config);
  expect(props.onSessioTancada).toHaveBeenCalledTimes(1);
});

test('si la baixa no es pot demanar, la sessió continua i l’error es veu DINS del diàleg obert', async () => {
  m.caps = new Set(['compte']);
  m.demana.mockRejectedValue(new Error('Sense xarxa'));
  pinta();
  fireEvent.click(await screen.findByRole('button', { name: 'Donar-me de baixa' }));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sí, donar-me de baixa' })); });
  expect(m.demana).toHaveBeenCalledWith({}, config);
  expect(props.onSessioTancada).not.toHaveBeenCalled();
  /* showModal() deixa inert tot el que és fora del diàleg: una alerta fora no arriba. */
  const dialeg = screen.getByRole('dialog', { name: 'Donar-te de baixa' });
  expect(within(dialeg).getByRole('alert').textContent).toBe('Sense xarxa');
  expect(screen.getAllByRole('alert')).toHaveLength(1);
});

test('si retirar el consentiment falla, l’error es veu dins del diàleg', async () => {
  m.caps = new Set(['consentiment']);
  m.revoca.mockRejectedValue(new Error('Sense xarxa'));
  pinta();
  fireEvent.click(await within(seccio('Consentiment')).findByRole('button', { name: 'Retirar el consentiment' }));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Retirar-lo' })); });
  const dialeg = screen.getByRole('dialog', { name: 'Retirar el consentiment' });
  expect(within(dialeg).getByRole('alert').textContent).toBe('Sense xarxa');
  expect(screen.getAllByRole('alert')).toHaveLength(1);
});

test('sense onSessioTancada (com la munta PerfilShell), la baixa porta a /xat i recarrega la pàgina', async () => {
  m.caps = new Set(['compte']);
  m.demana.mockResolvedValue({ demanada: true, demanadaAl: '2026-09-26T10:00:00Z', purgaPrevistaAl: '2026-10-26T10:00:00Z' });
  const recarrega = vi.spyOn(pagina, 'recarrega').mockImplementation(() => {});
  pinta(jo, { onSessioTancada: undefined });
  fireEvent.click(await screen.findByRole('button', { name: 'Donar-me de baixa' }));
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Sí, donar-me de baixa' })); });
  expect(m.navigate).toHaveBeenCalledWith('/xat', { replace: true });
  expect(recarrega).toHaveBeenCalledTimes(1);
  expect(m.navigate.mock.invocationCallOrder[0]).toBeLessThan(recarrega.mock.invocationCallOrder[0]);
});

test('amb una baixa pendent es veu la data i es pot cancel·lar', async () => {
  m.caps = new Set(['compte']);
  const pendent = { demanada: true, demanadaAl: '2026-09-20T10:00:00Z', purgaPrevistaAl: '2026-10-20T10:00:00Z' };
  m.estatBaixa.mockResolvedValue(pendent);
  m.cancela.mockResolvedValue(SENSE_BAIXA);
  pinta();
  const boto = await screen.findByRole('button', { name: 'Cancel·lar la baixa' });
  expect(screen.getByText(new RegExp(dataLlegible(pendent.purgaPrevistaAl)))).toBeTruthy();
  /* P2-08 (T7) · La data de la purga diu què s'esborra, no «les dades». */
  expect(screen.getByText(new RegExp(dataLlegible(pendent.purgaPrevistaAl))).textContent)
    .toContain('El compte, les teues publicacions personals i els teus fitxers s’esborraran definitivament el');
  /* Correccions 261024 (revisions R3-04 i R3-10) · L'avís de la data diu l'excepció dels fitxers i l'espera d'Apple. */
  expect(screen.getByText(new RegExp(dataLlegible(pendent.purgaPrevistaAl))).textContent)
    .toContain(`definitivament el ${dataLlegible(pendent.purgaPrevistaAl)}, llevat dels fitxers que encara fa servir una entitat (la seua fitxa `
      + 'o una publicació) o una publicació d’una altra persona. Si vas entrar amb Apple i encara no hem pogut retirar el permís, '
      + 'l’esborrat pot esperar fins a 7 dies més.');
  expect(screen.queryByRole('button', { name: 'Donar-me de baixa' })).toBeNull();
  await act(async () => { fireEvent.click(boto); });
  expect(m.cancela).toHaveBeenCalledWith(config);
  expect(props.onPerfilCanviat).toHaveBeenCalledTimes(1);
  expect(screen.getByText('Baixa cancel·lada. El teu perfil torna a ser com era.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Donar-me de baixa' })).toBeTruthy();
});

test('consentiment: versió vigent, darrera acció i retirada amb confirmació', async () => {
  m.caps = new Set(['consentiment']);
  m.revoca.mockResolvedValue(undefined);
  pinta();
  const bloc = seccio('Consentiment');
  expect(await within(bloc).findByText(/Política de privacitat vigent: versió v1/)).toBeTruthy();
  expect(within(bloc).getByText(`L’has acceptada (versió v1) el ${dataLlegible('2026-09-15T10:00:00Z')}.`)).toBeTruthy();
  expect(within(bloc).getByRole('link', { name: 'Llegir la política' }).getAttribute('href')).toBe('/legal');
  fireEvent.click(within(bloc).getByRole('button', { name: 'Retirar el consentiment' }));
  m.estatConsentiment.mockResolvedValue({ ...ACCEPTAT, calReconsentir: true,
    consentiments: [{ tipus: 'rgpd_acepta', accio: 'revoca', versio: 'v1', al: '2026-09-26T10:00:00Z' }] });
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Retirar-lo' })); });
  expect(m.revoca).toHaveBeenCalledWith('rgpd_acepta', config);
  expect(m.estatConsentiment).toHaveBeenCalledTimes(2);
  expect(within(bloc).getByText(/La vas retirar el/)).toBeTruthy();
  expect(within(bloc).getByRole('button', { name: 'Acceptar la versió v1' })).toBeTruthy();
});

test('consentiment: si cal reconsentir, s’accepta la versió vigent', async () => {
  m.caps = new Set(['consentiment']);
  m.estatConsentiment.mockResolvedValue({ versioVigent: 'v2', url: 'https://poble.test/privacitat', textSha256: 'a'.repeat(64), calReconsentir: true,
    consentiments: [{ tipus: 'rgpd_acepta', accio: 'atorga', versio: 'v1', al: '2026-09-15T10:00:00Z' }] });
  m.registra.mockResolvedValue(undefined);
  pinta();
  const boto = await screen.findByRole('button', { name: 'Acceptar la versió v2' });
  expect(screen.getByRole('link', { name: 'Llegir la política' }).getAttribute('target')).toBe('_blank');
  await act(async () => { fireEvent.click(boto); });
  expect(m.registra).toHaveBeenCalledWith('rgpd_acepta', 'v2', config);
  expect(m.estatConsentiment).toHaveBeenCalledTimes(2);
});
