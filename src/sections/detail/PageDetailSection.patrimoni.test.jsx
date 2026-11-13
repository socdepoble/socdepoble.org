import{cleanup,render,screen,waitFor}from'@testing-library/react';import{afterEach,expect,test,vi}from'vitest';
const m=vi.hoisted(()=>({slug:'herbari'}));
vi.mock('../../app/contexts/RouterContext',()=>({Navigate:({to})=><p>{to}</p>,useParams:()=>({slug:m.slug})}));
vi.mock('../../app/contexts/CoreContentContext',()=>({useCoreContent:()=>({status:'ready',pageCopy:{[m.slug]:{title:m.slug,html:'<p>Cos</p>'}}})}));
vi.mock('../text/TextSection',()=>({default:({children})=><article>{children}</article>}));
vi.mock('../control/PublicarDeLaPagina.jsx',()=>({PublicarDeLaPagina:({clau})=><button>Publicar {clau}</button>}));
vi.mock('./InstalaLaPwa.jsx',()=>({InstalaLaPwa:()=>null,useInstalacioDeLaPagina:()=>null}));
vi.mock('../patrimoni/HerbariWorkspaceSection.jsx',()=>({default:({children})=><section>Visor herbari lazy<article>{children}</article></section>}));
vi.mock('../text/AparadorFediversity.jsx',()=>({default:()=><section>Demostrador real Karpathy lazy</section>}));
vi.mock('../../app/contexts/ProveidorProjeccionsCataleg.jsx',()=>({default:({children})=><>{children}</>}));
import PageDetailSection from'./PageDetailSection.jsx';
afterEach(cleanup);
test('P0-69 Herbari com arrel Workspace i Publicar continua al final',async()=>{
 m.slug='herbari';const{container}=render(<PageDetailSection/>);await screen.findByText('Visor herbari lazy');
 expect(screen.getByRole('button',{name:'Publicar herbari'})).toBeTruthy();expect(container.querySelector('article').lastElementChild.tagName).toBe('BUTTON');
 expect(screen.queryByText('Demostrador real Karpathy lazy')).toBeNull();
});
// T1b (ordre del Mestre, 12-11-2026 21:26): /page/fediversity va pel flux comú de TextSection, sense Workspace.
test('R20 aparador només FEDiversity/NodeZero; fedivers conserva la redirecció canònica',async()=>{
 for(const slug of['fediversity','node-zero']){m.slug=slug;const{container,unmount}=render(<PageDetailSection/>);await screen.findByText('Demostrador real Karpathy lazy');expect(container.querySelectorAll('article')).toHaveLength(1);expect(container.firstElementChild.tagName).toBe('ARTICLE');expect(container.querySelector('article').lastElementChild.textContent).toBe(`Publicar ${slug}`);expect(screen.queryByText('Visor herbari lazy')).toBeNull();unmount();}
 m.slug='fedivers';const{unmount}=render(<PageDetailSection/>);expect(screen.getByText('/fedivers')).toBeTruthy();expect(screen.queryByText('Demostrador real Karpathy lazy')).toBeNull();unmount();
 m.slug='guia';render(<PageDetailSection/>);await waitFor(()=>expect(screen.getByRole('button',{name:'Publicar guia'})).toBeTruthy());expect(screen.queryByText('Demostrador real Karpathy lazy')).toBeNull();expect(screen.queryByText('Visor herbari lazy')).toBeNull();
});
