import {cleanup,fireEvent,render,screen} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
import {PanellVisibilitatEnLinia} from './PanellVisibilitatEnLinia.jsx';
vi.mock('../../app/contexts/RouterContext',()=>({useNavigate:()=>()=>{}}));
afterEach(cleanup);
test('MarIA0317: Publicat és estat verd sense pell ni efecte de botó, amb l’enllaç real al costat',()=>{
  const onTria=vi.fn();
  render(<PanellVisibilitatEnLinia notaId="fixture" esPublica estatPublicacio="publicat" rutaPublicada="/mur/fixture" onTria={onTria}/>);
  const status=screen.getByText('Publicat').closest('[role="status"]');
  expect(status.tagName).toBe('SPAN');
  expect(status.classList.contains('sdp-boto')).toBe(false);
  expect(status.classList.contains('sdp-visibilitat-linia__estat-publicat')).toBe(true);
  expect(status.getAttribute('tabindex')).toBeNull();
  expect(status.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
  fireEvent.click(status);expect(onTria).not.toHaveBeenCalled();
  const link=screen.getByRole('link',{name:/Veure al Mur/});
  expect(link.getAttribute('href')).toBe('/mur/fixture');
  expect(link.classList.contains('sdp-boto')).toBe(true);
});
