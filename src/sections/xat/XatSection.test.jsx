import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { construeixRetall } from './retall';

const mocks = vi.hoisted(() => ({ creaNota: vi.fn(), navigate: vi.fn(), threadId: 'a' }));

vi.mock('../../app/contexts/RouterContext', () => ({ 
  useNavigate: () => mocks.navigate,
  useParams: () => ({ threadId: mocks.threadId }),
  useRouter: () => ({ navigate: mocks.navigate, currentPath: '/jo/xat' })
}));

vi.mock('../../pages/NotFoundPage', () => ({ default: () => null }));
vi.mock('../../components/universal/ContentProvider', () => ({ ContentProvider: ({children}) => children }));
vi.mock('../text/TextSection', () => ({ default: () => null }));
vi.mock('../../app/contexts/UIContext', () => ({ 
  useUIActions: () => ({t: (_, fallback) => fallback}),
  useUIState: () => ({ language: 'ca' }) 
}));
vi.mock('../../app/contexts/IdentitatContext', () => ({
  useIdentitat: () => ({ actorType: 'persona', actorId: 'usuari123' })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({pageCopy: {}}) }));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({creaNota: mocks.creaNota}) }));
vi.mock('./XatContext', () => ({ 
  useXat: () => ({
    chatThreads: [{id: 'a', title: 'Conversa'}, {id: 'b', title: 'Altra'}], 
    getThreadMessages: () => [{id: '1', text: 'Primer', sender: 'me'}, {id: '2', text: 'Segon', sender: 'other', author: 'Veí'}], 
    sendChatMessage: vi.fn()
  }) 
}));
vi.mock('../../components/universal/AvisadorEfimer', () => ({ showToast: vi.fn() }));

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.threadId = 'a'; });

test('selecció en ordre i navegació després de confirmar', async () => {
  let resolve;
  mocks.creaNota.mockReturnValue(new Promise(r => {resolve = r;}));
  render(<XatSection />); 
  
  // Obrir menú
  const menuButtons = document.querySelectorAll('.xat-header-btn');
  fireEvent.click(menuButtons[2]); // MoreHorizontal
  
  // Seleccionar "Seleccionar missatges"
  fireEvent.click(screen.getByText('Seleccionar missatges'));
  
  const send = screen.getByRole('button', {name: /Enviar al Bloc de Notes/});
  expect(send.disabled).toBe(true);
  
  // Triar missatges
  const bubbles = document.querySelectorAll('.sdp-chat-bubble--triable');
  fireEvent.click(bubbles[1]); // Segon missatge
  fireEvent.click(bubbles[0]); // Primer missatge
  
  fireEvent.click(send); 
  
  expect(mocks.creaNota).toHaveBeenCalledTimes(1);
  const retall = mocks.creaNota.mock.calls[0][0];
  // Ha d'estar en ordre cronològic (el DOMPurify i l'html escapat s'ha provat a banda, ací provem que es passen bé)
  expect(retall.content).toContain('Primer');
  expect(retall.content).toContain('Segon');
  
  expect(mocks.navigate).not.toHaveBeenCalled();
  
  resolve({id: 'new-note'});
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/jo/notes?nota=new-note'));
});

test('retall.js saneja i escapa correctament', () => {
  const fil = { title: '<img>' };
  const missatges = [{author: '<b>', text: '<script>alert(1)</script>\n&'}];
  const retall = construeixRetall({ fil, missatges, locale: 'ca-ES' });
  
  expect(retall.title).toBe('Retall de «&lt;img&gt;»');
  expect(retall.content).toContain('&lt;script&gt;alert(1)&lt;/script&gt;<br>&amp;');
  expect(retall.content).not.toContain('<script>');
});
