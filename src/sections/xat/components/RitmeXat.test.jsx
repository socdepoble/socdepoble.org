import {afterEach,expect,it} from 'vitest';
import {cleanup,render,screen} from '@testing-library/react';
import MarquesEstat from './MarquesEstat.jsx';
import IndicadorEscrivint from './IndicadorEscrivint.jsx';
import CapcaleraConversa from './CapcaleraConversa.jsx';
import {MemoryRouter} from '../../../app/contexts/RouterContext.jsx';
const t=(_,fallback)=>fallback;
afterEach(cleanup);
it.each([['enviat','Enviat'],['lliurat','Lliurat'],['llegit','Llegit'],['pendent','Pendent'],['error','No enviat']])('status%s has distinct accessible text', (estat,label)=>{
 const {container}=render(<MarquesEstat estat={estat} t={t}/>);expect(screen.getByText(label)).toBeTruthy();expect(container.querySelector(`.sdp-xat-marques--${estat}`)).toBeTruthy();expect(container.querySelector('svg').getAttribute('aria-hidden')).toBe('true');
});
it('presence is silent when absent and generic when actually observed, with no names/text',()=>{
 const {rerender}=render(<IndicadorEscrivint quants={0} t={t}/>);expect(screen.queryByRole('status')).toBeNull();rerender(<IndicadorEscrivint quants={2} t={t}/>);expect(screen.getByRole('status').textContent).toBe('2 persones estan escrivint…');
});
it('header preserves identity and menu while displaying observed typing',()=>{
 render(<MemoryRouter><CapcaleraConversa fil={{id:'f',tipus:'directe',name:'Mostra'}} escrivint={1} t={t}/></MemoryRouter>);
 expect(screen.getByText('Mostra')).toBeTruthy();expect(screen.getByRole('status').textContent).toBe('Escrivint…');expect(screen.getByRole('button',{name:/menú|opcions/i})).toBeTruthy();
});
