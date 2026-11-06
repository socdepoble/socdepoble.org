import {act,cleanup,fireEvent,render,screen,waitFor} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
import CerimoniesXat from './CerimoniesXat.jsx';
import {paraulesDeFrase} from '../../../data/xifratXatAlta.js';

afterEach(cleanup);
const controlDe = extres => ({alta:vi.fn(),restauraFrase:vi.fn(),recuperaAmbAmics:vi.fn(),activaFil:vi.fn(),revocaFil:vi.fn(),potRecuperarSocial:false,...extres});

test('R20 F2a mostra les sis paraules i no confirma abans de comprovar 1, 3 i 6',async()=>{
 const indexs=Uint16Array.of(12,24,36,48,60,72),esperades=await paraulesDeFrase(indexs);
 const publicada=vi.fn();
 const control=controlDe({alta:vi.fn(async cerimonia=>{if(await cerimonia(indexs))publicada();})});
 const {container}=render(<CerimoniesXat control={control}/>);
 fireEvent.click(screen.getByRole('button',{name:'Crea les claus i guarda la frase'}));
 await waitFor(()=>expect(container.querySelectorAll('ol li')).toHaveLength(6));
 expect(Array.from(container.querySelectorAll('ol li'),n=>n.textContent)).toEqual(esperades);
 const confirma=screen.getByRole('button',{name:'Confirmar'});
 expect(confirma.disabled).toBe(true);expect(publicada).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText('Paraula 1'),{target:{value:esperades[0]}});
 fireEvent.change(screen.getByLabelText('Paraula 3'),{target:{value:esperades[2]}});
 fireEvent.change(screen.getByLabelText('Paraula 6'),{target:{value:'errònia'}});
 expect(confirma.disabled).toBe(true);expect(publicada).not.toHaveBeenCalled();
 fireEvent.change(screen.getByLabelText('Paraula 6'),{target:{value:esperades[5]}});
 await act(async()=>fireEvent.click(confirma));
 expect(publicada).toHaveBeenCalledOnce();expect(container.querySelector('ol')).toBeNull();
 expect(container.textContent).not.toContain(esperades.join(' '));
});

test('R20 tancar la cerimònia resol false sense publicar ni persistir frase',async()=>{
 let resposta;
 const control=controlDe({alta:vi.fn(async cerimonia=>{resposta=await cerimonia(Uint16Array.of(1,2,3,4,5,6));})});
 const {container,unmount}=render(<CerimoniesXat control={control}/>);
 fireEvent.click(screen.getByRole('button',{name:'Crea les claus i guarda la frase'}));
 await waitFor(()=>expect(container.querySelector('ol')).toBeTruthy());
 await act(async()=>unmount());expect(resposta).toBe(false);
});

test('R20 restauració per frase passa índexs al controlador i els posa a zero',async()=>{
 const esperats=Uint16Array.of(21,22,23,24,25,26),paraules=await paraulesDeFrase(esperats);let rebuts,copia;
 const control=controlDe({restauraFrase:vi.fn(async indexs=>{rebuts=indexs;copia=Array.from(indexs);})});
 render(<CerimoniesXat control={control}/>);
 fireEvent.change(screen.getByLabelText('Les 6 paraules de recuperació'),{target:{value:paraules.join(' ')}});
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Recupera amb la frase'})));
 expect(copia).toEqual(Array.from(esperats));expect(Array.from(rebuts)).toEqual([0,0,0,0,0,0]);
 expect(screen.getByLabelText('Les 6 paraules de recuperació').value).toBe('');
});

test('R20 F7 inhabilitat sense material intern; amb proveïdor no rep booleans del formulari',async()=>{
 const control=controlDe();const {rerender}=render(<CerimoniesXat control={control} filId="fil-1"/>);
 const boto=screen.getByRole('button',{name:'Recupera amb 3 persones'});
 expect(boto.disabled).toBe(true);fireEvent.click(boto);expect(control.recuperaAmbAmics).not.toHaveBeenCalled();
 rerender(<CerimoniesXat control={{...control,potRecuperarSocial:true}} filId="fil-1"/>);
 await act(async()=>fireEvent.click(boto));expect(control.recuperaAmbAmics).toHaveBeenCalledWith();
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Activa la preferència local d’este xat'})));
 expect(control.activaFil).toHaveBeenCalledWith('fil-1');
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Revoca la preferència local d’este xat'})));
 expect(control.revocaFil).toHaveBeenCalledWith('fil-1');
});
