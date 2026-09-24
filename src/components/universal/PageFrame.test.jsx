import {render,cleanup} from '@testing-library/react';
import {afterEach,expect,test,vi} from 'vitest';
vi.mock('../../config/assetResolver',()=>({resolveAsset:uri=>uri}));
vi.mock('../PedraSeca/hooks/useAccions.js',()=>({useAccions:()=>({})}));
import {PageFrame} from './PageFrame.jsx';
afterEach(cleanup);
for(const avatar of ['javascript:alert(1)','//tracker.test/avatar',{},null])test(`avatar no segur ${String(avatar)} usa fallback`,()=>{
  const {container}=render(<PageFrame chrome="context" authorAvatar={avatar} title="Perfil"/>);
  expect(container.querySelector('img.sp-card-avatar')).toBeNull();
  expect(container.querySelector('.sp-card-avatar--fallback.sp-card-avatar--amagat')).toBeNull();
});
test('avatar local vàlid conserva la imatge',()=>{
  const {container}=render(<PageFrame chrome="context" authorAvatar="/assets/profile.png" title="Perfil"/>);
  expect(container.querySelector('img.sp-card-avatar').getAttribute('src')).toBe('/assets/profile.png');
});
