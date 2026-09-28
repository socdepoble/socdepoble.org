/* ═══════════════════════════════════════════════════════════════════
   T47 (ordre del Mestre, 260928) · ESCRIPTORS DE LA FITXA DEL PERFIL

   La cua d'autodesament (src/data/autodesament/cua.js) envia la fitxa de
   la persona, d'una organització o d'un agent IA sense que cap component
   React haja de continuar muntat: estos escriptors viuen a nivell de
   mòdul i només parlen amb el port (Model B).

   · prepara = valorPerDesar: de camp de l'editor a columna, amb la
     validació de llargària (ErrorValidacio, amb el comptador).
   · granularitat 'camp': un PATCH per columna, com abans. Dos camps
     diferents poden viatjar alhora; dos desats del MATEIX camp van en sèrie.
   S'importen des d'App (autodesamentEscriptors.js) perquè la cua puga
   reprendre un esborrany pendent en arrencar, abans d'obrir el Perfil.
   ═══════════════════════════════════════════════════════════════════ */
import { updateAgent, updateOrganization, updateProfile } from '../../data/backendPort.js';
import { cuaDesament } from '../../data/autodesament/cua.js';
import { valorPerDesar } from './perfilCamps.js';

/** La clau de la cua per a cada mena de fitxa (menaDeFitxa → entitat). */
export const ENTITATS_FITXA = Object.freeze({ persona: 'perfil', organitzacio: 'organitzacio', agent: 'agent' });

const escriptor = (mena, escriu) => Object.freeze({
  granularitat: 'camp',
  prepara: (camp, valor) => valorPerDesar(mena, camp, valor),
  escriu,
});

cuaDesament.registraEscriptor(ENTITATS_FITXA.persona, escriptor('persona',
  async ({ canvis, context }) => ({ fila: await updateProfile(canvis, context) })));

cuaDesament.registraEscriptor(ENTITATS_FITXA.organitzacio, escriptor('organitzacio',
  async ({ id, canvis, context }) => ({ fila: await updateOrganization(id, canvis, context) })));

cuaDesament.registraEscriptor(ENTITATS_FITXA.agent, escriptor('agent',
  async ({ id, canvis, context }) => ({ fila: await updateAgent(id, canvis, context) })));
