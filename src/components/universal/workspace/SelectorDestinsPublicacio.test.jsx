import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import SelectorDestinsPublicacio from './SelectorDestinsPublicacio.jsx';
afterEach(cleanup);
const font={font:'herbari',id:'romer',title:'Romer'};
test('public selection is explicit, keyboard operable and saved only with consent',async()=>{
 const desa=vi.fn().mockResolvedValue(undefined);
 render(<SelectorDestinsPublicacio font={font} desa={desa} autoritzat />);
 const box=screen.getByRole('checkbox',{name:'Mur'});box.focus();expect(document.activeElement).toBe(box);
 fireEvent.click(box);expect(desa).not.toHaveBeenCalled();
 const save=screen.getByRole('button',{name:'Desa els destins'});expect(save.disabled).toBe(true);
 fireEvent.click(screen.getByRole('checkbox',{name:'Confirmació pública'}));fireEvent.click(save);
 await waitFor(()=>expect(desa).toHaveBeenCalledWith(font,['mur']));
});
test('private destinations do not imply a public post, clearing all revokes destinations',async()=>{
 const desa=vi.fn().mockResolvedValue(undefined);
 const {unmount}=render(<SelectorDestinsPublicacio font={font} desa={desa} autoritzat />);
 fireEvent.click(screen.getByRole('checkbox',{name:'Rebost privat'}));
 expect(screen.queryByRole('checkbox',{name:'Confirmació pública'})).toBeNull();
 fireEvent.click(screen.getByRole('button',{name:'Desa els destins'}));
 await waitFor(()=>expect(desa).toHaveBeenLastCalledWith(font,['rebost']));unmount();
 render(<SelectorDestinsPublicacio font={font} desa={desa} autoritzat inicials={['mur']} />);
 fireEvent.click(screen.getByRole('checkbox',{name:'Mur'}));fireEvent.click(screen.getByRole('button',{name:'Desa els destins'}));
 await waitFor(()=>expect(desa).toHaveBeenLastCalledWith(font,[]));
});
test('anonymous controls cannot send, and failed synchronization is never confirmed',async()=>{
 const desa=vi.fn().mockRejectedValue(Object.assign(new Error('offline'), {desatLocal:true}));
 const first=render(<SelectorDestinsPublicacio font={font} desa={desa} autoritzat={false} />);
 expect(screen.getByRole('checkbox',{name:'Mur'}).matches(':disabled')).toBe(true);
 expect(screen.queryByRole('button',{name:'Desa els destins'})).toBeNull();expect(desa).not.toHaveBeenCalled();first.unmount();
 render(<SelectorDestinsPublicacio font={font} desa={desa} autoritzat inicials={['bar']} />);
 fireEvent.click(screen.getByRole('button',{name:'Desa els destins'}));
 await waitFor(()=>expect(screen.getByRole('status').textContent).toMatch(/continua pendent/));
 expect(screen.queryByText('Destins confirmats pel servidor.')).toBeNull();
});

test('a failed local write never claims that an unsaved choice is queued', async()=>{
 const desa=vi.fn().mockRejectedValue(new Error('quota'));
 render(<SelectorDestinsPublicacio font={font} desa={desa} autoritzat inicials={['bar']} />);
 fireEvent.click(screen.getByRole('button',{name:'Desa els destins'}));
 await waitFor(()=>expect(screen.getByRole('status').textContent).toMatch(/No s’ha pogut desar la tria/));
 expect(screen.getByRole('status').textContent).not.toMatch(/continua pendent/);
});

test('a changed unsaved destination is never labelled as confirmed by a previous server ACK', () => {
 const desa=vi.fn();
 render(<SelectorDestinsPublicacio font={font} desa={desa} autoritzat inicials={['bar']} estat="confirmat" />);
 expect(screen.getByRole('status').textContent).toBe('Destins confirmats pel servidor.');
 fireEvent.click(screen.getByRole('checkbox',{name:'Rebost privat'}));
 expect(desa).not.toHaveBeenCalled();
 expect(screen.getByRole('status').textContent).not.toBe('Destins confirmats pel servidor.');
 expect(screen.getByRole('status').textContent).toMatch(/encara no s’ha desat/);
});

test('R18 · una referència WP tria una de les cinc destinacions i conserva la revocació', async () => {
  const desa = vi.fn().mockResolvedValue(undefined);
  const wp = { font: 'importacio-wp', id: '619', title: 'Catàleg d’arbres' };
  render(<SelectorDestinsPublicacio font={wp} desa={desa} autoritzat />);
  expect(screen.queryByRole('checkbox', { name: 'Mercat públic' })).toBeNull();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Herbari' }));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Arbres emblemàtics i monumentals' }));
  expect(screen.getByRole('checkbox', { name: 'Herbari' }).checked).toBe(false);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Confirmació pública' }));
  fireEvent.click(screen.getByRole('button', { name: 'Desa els destins' }));
  await waitFor(() => expect(desa).toHaveBeenLastCalledWith(wp, ['arbres-monumentals']));
  fireEvent.click(screen.getByRole('checkbox', { name: 'Arbres emblemàtics i monumentals' }));
  fireEvent.click(screen.getByRole('button', { name: 'Desa els destins' }));
  await waitFor(() => expect(desa).toHaveBeenLastCalledWith(wp, []));
});

test.each([
  ['ca', 'Arbres emblemàtics i monumentals', 'Pàgines del fons documental'],
  ['es', 'Árboles emblemáticos y monumentales', 'Páginas del fondo documental'],
  ['en', 'Emblematic and monumental trees', 'Documentary collection pages'],
  ['eu', 'Zuhaitz enblematiko eta monumentalak', 'Dokumentu bildumako orrialdeak'],
  ['gl', 'Árbores emblemáticas e monumentais', 'Páxinas do fondo documental']
])('R18 · les noves destinacions tenen etiqueta en %s', (language, arbres, pagina) => {
  render(<SelectorDestinsPublicacio font={font} desa={vi.fn()} autoritzat language={language} />);
  expect(screen.getByRole('checkbox', { name: arbres })).toBeTruthy();
  expect(screen.getByRole('checkbox', { name: pagina })).toBeTruthy();
});

/* PRODUCCIO-01 (R15b) · Una altra pestanya del Mas té el magatzem: el desament no es fa (NOMES_LECTURA de
   utils/magatzemLocal.js) i el selector diu per què i què cal fer, en les cinc llengües; mai «revisa-la». */
test.each([
 ['ca','El Mas és obert en una altra pestanya: tanca-la per a desar els destins.','Desa els destins','Rebost privat'],
 ['es','El Mas está abierto en otra pestaña: ciérrala para guardar los destinos.','Guarda los destinos','Despensa privada'],
 ['en','The Mas is open in another tab: close it to save the destinations.','Save destinations','Private pantry'],
 ['eu','Mas beste fitxa batean dago irekita: itxi ezazu helmugak gordetzeko.','Gorde helmugak','Jakitegi pribatua'],
 ['gl','O Mas está aberto noutra lapela: péchaa para gardar os destinos.','Garda os destinos','Despensa privada']
])('%s · una altra pestanya del Mas té el magatzem: ho diu i la tria continua sense desar', async(language,missatge,desa_,rebost)=>{
 const desa=vi.fn().mockRejectedValue(Object.assign(new Error('Una altra pestanya està escrivint: esta només pot llegir.'),{codi:'NOMES_LECTURA'}));
 render(<SelectorDestinsPublicacio font={font} desa={desa} autoritzat language={language} />);
 fireEvent.click(screen.getByRole('checkbox',{name:rebost}));fireEvent.click(screen.getByRole('button',{name:desa_}));
 await waitFor(()=>expect(screen.getByRole('status').textContent).toBe(missatge));
 expect(desa).toHaveBeenCalledTimes(1);
 fireEvent.click(screen.getByRole('checkbox',{name:rebost}));
 expect(screen.getByRole('status').textContent).not.toBe(missatge);
});
