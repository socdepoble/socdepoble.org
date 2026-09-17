/**
 * tooling/mocks/sollutiaBackend.js
 * 
 * Mock d'exemple per demostrar i validar el contracte de la Llei de l'Enxufabilitat
 * (Fase 1 de configuració + Fase 2 de segellat).
 * Sollutia usarà un patró similar per a injectar el seu backend.
 */

export const mockSollutiaBackend = {
  // CONTRACTE NUCLI
  loadCoreContent: async () => ({ agents: [] }),
  loadMur: async () => ({ posts: [] }),
  loadMultimedia: async () => ({ items: [] }),
  loadNotes: async () => ({ notes: [], noteFolders: [] }),
  appendChatMessages: async (msgs) => msgs,
  appendSectionSubmissionNetworkOnly: async (sub) => sub,
  updateNote: async (n) => n,
  loginWithMagicLink: async () => {},
  registerWithPassword: async () => {},
  loginWithPassword: async () => {},
  loginWithGoogle: async () => {},
  listMyOrganizations: async () => [],
  createOrganization: async () => ({ id: 'org-1', nom: 'Org Mock' }),
  updateOrganization: async (o) => o,
  updateProfile: async (p) => p,
  updateUserPassword: async () => {},
  getProfile: async () => ({ id: 'sollutia-user-1', name: 'Sollutia Admin' }),
  recullTornadaOAuth: async () => {},
  logout: async () => { console.log('[Sollutia Backend] logout'); },
  getCurrentUser: () => ({ id: 'sollutia-user-1', user_metadata: { name: 'Sollutia Admin', role: 'admin' } }),
  getBackendConfigurat: () => true,
  getRuntimeDataMode: () => 'mock',
  getDefaultUserId: () => 'sollutia-user-1',
  createNote: async (n) => n,
  loadFils: async () => [],
  loadMissatges: async () => [],
  enviaMissatge: async (m) => m,
  marcaLlegit: async () => {},
  creaFilDirecte: async () => ({ id: 'fil-1' }),
  carregaMembres: async () => [],
  subscribeToXat: () => (() => {}),
  unsubscribeFromXat: () => {},

  // CAPACITATS ADMIN
  adminListUsers: async () => [],
  adminListOrganizations: async () => [],

  // CAPACITATS SESSIÓ
  refrescaSessio: async () => {},
  elMeuRol: async () => 'admin',

  // CAPACITATS MITJANS
  uploadToStorage: async () => 'https://mock.url/file.jpg',
  getPublicUrl: (path) => `https://mock.url/${path}`,

  // CAPACITATS AGENDA
  loadActesAgenda: async () => []
};

// Validació de l'ordre de càrrega:
// 1. window.SocDePoble hauria d'existir al host abans de fer res (o import { configura } from 'socdepoble')
// 2. Es crida configura()
// 3. Quan l'element es munta, s'activa el segellat

export function simulaInjeccioSollutia() {
  if (typeof window === 'undefined' || !window.SocDePoble) {
    console.error('L\'API global SocDePoble no està exposada!');
    return false;
  }
  
  const { configura, arrenca, estat } = window.SocDePoble;
  
  console.log('Estat abans d\'injectar:', estat());
  
  const resultat = configura({ backend: mockSollutiaBackend });
  console.log('Resultat configuració:', resultat);
  
  console.log('Estat després de configurar (abans del segellat):', estat());
  
  // Forçar el segellat cridant arrenca() com un simulador de host actiu
  arrenca();
  console.log('Estat després de arrenca() (hauria d\'estar segellat):', estat());
  
  return true;
}
