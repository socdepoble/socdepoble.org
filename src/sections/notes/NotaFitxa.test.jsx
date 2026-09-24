import {render,fireEvent,screen,cleanup} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
const mocks=vi.hoisted(()=>({navigate:vi.fn()}));
vi.mock('../../app/contexts/IdentitatContext.jsx',()=>({useIdentitat:()=>({actorId:null})}));
vi.mock('../../app/contexts/CoreContentContext.jsx',()=>({useCoreContent:()=>({agents:[]})}));
vi.mock('../../app/contexts/SessionContext.jsx',()=>({useSession:()=>({currentUser:null})}));
vi.mock('../../app/contexts/RouterContext',()=>({useNavigate:()=>mocks.navigate}));
vi.mock('../../components/universal/NotificationContext.jsx',()=>({useToast:()=>({showToast:vi.fn()})}));
import {NotaFitxa} from './NotaFitxa.jsx';
afterEach(()=>{cleanup();vi.clearAllMocks();});
for(const label of [/Data i hora:/,/Informació de previsualització/,/Traduir Prova/,/Comentar Prova/,/Compartir Prova/,/CONNECTAR amb Prova/])test(`previsualització ${label} obri avís sense navegar`,()=>{
  const alert=vi.spyOn(window,'alert');
  render(<NotaFitxa active item={{id:'n1',title:'Prova',subtitle:'02/01/26',updatedAt:'2026-01-02T08:37:00Z',data:{formattedTime:'09:37'}}} onSelect={vi.fn()}/>);
  fireEvent.click(screen.getByRole('button',{name:label}));
  expect(screen.getByRole('dialog').open).toBe(true);
  expect(screen.getByRole('heading',{name:'Això és una previsualització'})).toBeTruthy();
  expect(mocks.navigate).not.toHaveBeenCalled();expect(alert).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button',{name:'Tancar'}));
  expect(document.querySelector('dialog').open).toBe(false);
  alert.mockRestore();
});


test('la preview usa labels i data/hora del mateix model sense hardcodes de n1', () => {
  const item = { id: 'n1', title: 'Prova', subtitle: '02/01/26', updatedAt: '2026-01-02T08:37:00Z', data: { formattedTime: '09:37' }, labels: [{ text: 'Sistema', className: 'sdp-badge-category' }, { text: 'Etiqueta nova', className: 'sdp-badge-tag' }] };
  render(<NotaFitxa active item={item} onSelect={vi.fn()} />);
  expect(screen.getByRole('button', { name: 'Data i hora: 09:37: 02/01/26' })).toBeTruthy();
  expect(screen.getByText('Sistema')).toBeTruthy();
  expect(screen.getByText('Etiqueta nova')).toBeTruthy();
  expect(screen.queryByText('Tutorial')).toBeNull();
});
