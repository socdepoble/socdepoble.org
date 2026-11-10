import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';

/* R94 · IDEA-171 (decisió D-R11-4 del Mestre, 261107) · El WhatsApp de la IAIA es munta només a
   /page/node-zero: davant de l'aparador de Fediversity i abans del botó del final. Ni a
   /page/fediversity ni a cap altra pàgina. */
const m = vi.hoisted(() => ({ slug: 'node-zero' }));
vi.mock('../../app/contexts/RouterContext', () => ({ Navigate: ({ to }) => <p>{to}</p>, useParams: () => ({ slug: m.slug }) }));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({ status: 'ready', pageCopy: { [m.slug]: { title: m.slug, html: '<p>Cos</p>' } } }) }));
vi.mock('../text/TextSection', () => ({ default: ({ children }) => <article>{children}</article> }));
vi.mock('../control/PublicarDeLaPagina.jsx', () => ({ PublicarDeLaPagina: ({ clau }) => <button>Publicar {clau}</button> }));
vi.mock('./InstalaLaPwa.jsx', () => ({ InstalaLaPwa: () => null, useInstalacioDeLaPagina: () => null }));
vi.mock('../text/AparadorFediversity.jsx', () => ({ default: () => <section>Aparador Fediversity lazy</section> }));
vi.mock('../../app/contexts/ProveidorProjeccionsCataleg.jsx', () => ({ default: ({ children }) => <>{children}</> }));
vi.mock('../text/FediversityWorkspaceSection.jsx', async () => {
  const { default: TextSection } = await import('../text/TextSection');
  const { default: Aparador } = await import('../text/AparadorFediversity.jsx');
  return { default: ({ children, ...props }) => <TextSection {...props}><Aparador />{children}</TextSection> };
});
vi.mock('../../components/patrimoni/IaiaWhatsappCard.jsx', () => ({ default: () => <section>El WhatsApp de la IAIA lazy</section> }));
import PageDetailSection from './PageDetailSection.jsx';

afterEach(cleanup);

test('/page/node-zero munta el WhatsApp de la IAIA davant de l’aparador, i el botó del final continua l’últim', async () => {
  m.slug = 'node-zero';
  const { container } = render(<PageDetailSection />);
  const targeta = await screen.findByText('El WhatsApp de la IAIA lazy');
  const aparador = await screen.findByText('Aparador Fediversity lazy');
  expect(targeta.compareDocumentPosition(aparador) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(container.querySelector('article').lastElementChild.tagName).toBe('BUTTON');
});

test('ni /page/fediversity ni una altra pàgina no munten la targeta', async () => {
  for (const slug of ['fediversity', 'guia']) {
    m.slug = slug;
    const { unmount } = render(<PageDetailSection />);
    await waitFor(() => expect(screen.getByRole('button', { name: `Publicar ${slug}` })).toBeTruthy());
    if (slug === 'fediversity') await screen.findByText('Aparador Fediversity lazy');
    expect(screen.queryByText('El WhatsApp de la IAIA lazy')).toBeNull();
    unmount();
  }
});
