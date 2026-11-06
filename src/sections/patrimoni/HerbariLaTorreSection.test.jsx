import{act,cleanup,fireEvent,render,screen,within}from'@testing-library/react';
import{afterEach,expect,test,vi}from'vitest';
import HerbariLaTorreSection from'./HerbariLaTorreSection.jsx';
import{ESPECIES_HERBARI_LA_TORRE_117,filtraEspeciesHerbari}from'../../data/patrimoni/herbariLaTorre117.js';
import{TEXTOS_HERBARI}from'./textosHerbari.js';
const m=vi.hoisted(()=>({language:'ca'}));
vi.mock('../../app/contexts/UIContext',async orig=>({...await orig(),useUIActions:()=>({language:m.language,t:(_k,reserva)=>reserva})}));
afterEach(()=>{cleanup();vi.unstubAllGlobals();m.language='ca';});

test('R22 herbari: 117 fitxes accessibles, cerca sense accents i paginació local',()=>{
 const fetch=vi.fn();vi.stubGlobal('fetch',fetch);const{container}=render(<HerbariLaTorreSection/>);
 expect(screen.getByRole('status').textContent).toContain('117 / 117');expect(container.querySelectorAll('ol>li')).toHaveLength(24);
 fireEvent.click(screen.getByRole('button',{name:'Mostra més fitxes'}));expect(container.querySelectorAll('ol>li')).toHaveLength(48);
 fireEvent.change(screen.getByRole('searchbox'),{target:{value:'alber blanc'}});
 expect(container.querySelectorAll('ol>li')).toHaveLength(1);expect(screen.getByRole('button',{name:/Àlber blanc/})).toBeTruthy();
 expect(fetch).not.toHaveBeenCalled();
});

test('R22 filtre d’ús canònic, buit i detall amb procedència sense declarar innocuïtat',()=>{
 const{container}=render(<HerbariLaTorreSection/>);
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'Tòxic'}});
 expect(screen.getByRole('status').textContent).toContain(`${filtraEspeciesHerbari({usActiu:'Tòxic'}).length} / 117`);
 fireEvent.change(screen.getByRole('combobox'),{target:{value:'Tots'}});
 fireEvent.change(screen.getByRole('searchbox'),{target:{value:'no-hi-ha-cap-espècie-així'}});expect(screen.getByText('No hi ha fitxes amb estos filtres.')).toBeTruthy();
 fireEvent.change(screen.getByRole('searchbox'),{target:{value:'acacia robinia'}});
 fireEvent.click(screen.getByRole('button',{name:/Acacia robínia/}));const dialog=screen.getByRole('dialog');
 expect(within(dialog).getByText('Falsa acacia').getAttribute('lang')).toBe('es');
 expect(within(dialog).getByText('Black locust').getAttribute('lang')).toBe('en');
 expect(dialog.textContent).toContain('Pàgina 1');expect(dialog.textContent).toContain(ESPECIES_HERBARI_LA_TORRE_117[0].font.sha256);
 expect(dialog.textContent).toContain('taxonomia pendent de revisió');expect(dialog.textContent).toContain('no acredita innocuïtat');
 expect(within(dialog).getByRole('button',{name:'Escolta amb la veu local del dispositiu'}).disabled).toBe(true);
 expect(container.querySelectorAll('h1')).toHaveLength(0);
 fireEvent.click(within(dialog).getByRole('button',{name:'Tancar'}));expect(screen.queryByRole('dialog')).toBeNull();
});

test('R22 locució injectada rep sempre privat:true; no accepta un connector remot',async()=>{
 const locutor={local:true,disponible:()=>true,parla:vi.fn(async()=>{}),atura:vi.fn()},fetch=vi.fn();vi.stubGlobal('fetch',fetch);
 const{rerender}=render(<HerbariLaTorreSection locutor={locutor}/>);
 fireEvent.click(screen.getByRole('button',{name:/Acacia robínia/}));
 await act(async()=>fireEvent.click(screen.getByRole('button',{name:'Escolta amb la veu local del dispositiu'})));
 expect(locutor.parla).toHaveBeenCalledWith(expect.stringContaining('Acacia robínia'),{privat:true,llengua:'ca'});expect(fetch).not.toHaveBeenCalled();
 rerender(<HerbariLaTorreSection locutor={{...locutor,local:false}}/>);
 expect(screen.getByRole('button',{name:'Escolta amb la veu local del dispositiu'}).disabled).toBe(true);
});

test('R22 textos d’interacció als 5 idiomes; noms documentals no es traduïxen per API',()=>{
 const claus=Object.keys(TEXTOS_HERBARI.ca).sort();
 for(const [lang,textos]of Object.entries(TEXTOS_HERBARI)){
  expect(Object.keys(textos).sort()).toEqual(claus);expect(Object.values(textos).every(v=>typeof v==='string'&&v.length>0)).toBe(true);
  m.language=lang;const{unmount}=render(<HerbariLaTorreSection/>);expect(screen.getByRole('searchbox',{name:textos.cerca})).toBeTruthy();expect(screen.getByRole('combobox',{name:textos.us})).toBeTruthy();unmount();
 }
});
