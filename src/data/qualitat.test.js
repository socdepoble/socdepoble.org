// @vitest-environment node
/* Dades · qualitat: ESLint amb la configuració del projecte i zero missatges
   (l'equivalent de --max-warnings=0) sobre els fitxers que s'han tocat per a
   alinear les fixtures amb el contracte de tenant (backendConfig.js exigix
   tenant_id UUID). El cens és explícit: qui toque un altre fitxer d'esta
   capa l'afig a la llista, mai el silencia. */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { ESLint } from 'eslint';
import { describe, expect, test } from 'vitest';

const ARREL = process.cwd();
const CENS = Object.freeze([
  'src/data/qualitat.test.js',
  'src/data/oauthRelay.js',
  'src/data/oauthRelay.test.js',
  'src/data/oauthRelay.amfitrio.test.js',
  'src/data/supabase/auth.js',
  'src/data/supabase/auth.test.js',
  'src/data/supabase/auth.amfitrio.test.js',
  /* R (Onada 3, 261003) · Recuperació de contrasenya. */
  'src/data/contracte.js',
  'src/data/contracte.test.js',
  'src/data/backendPort.js',
  'src/data/errorsBackend.js',
  'src/data/tornadaRecuperacio.js',
  'src/data/tornadaRecuperacio.test.js',
  'src/data/supabase/auth.recuperacio.test.js',
  'src/data/supabase/index.test.js',
  /* Correcció de la revisió · la marca de recuperació pendent. */
  'src/data/recuperacioPendent.js',
  'src/data/recuperacioPendent.test.js',
  'src/data/sessionService.test.js',
  'src/data/supabase/organizations.test.js',
  'src/app/contexts/scopedProviders.test.jsx',
  /* F2 (Marató 2230) · La traducció del rebuig d'una pujada al vocabulari del port. */
  'src/data/supabase/storage.js',
  'src/data/supabase/storage.pujada.test.js',
  /* F2 · La privacitat de la consola de resolveAsset i promoteToPublic. */
  'src/data/supabase/storage.privacitat.test.js',
  /* Auditoria 261007 (B) · Els xats d'ajuda per defecte i l'adaptador del xat. */
  'src/data/xatsPerDefecte.js',
  'src/data/xatsPerDefecte.test.js',
  'src/data/supabase/xat.js',
  /* Relleu 261007 (peça «netes») · Fitxers de la capa que cap porta qualitat
     no vigilava: el mapejador de les seccions (netejaVariacio i
     imatgeDeVariacio) i la seua prova, i les proves noves de l'Auditoria
     261007 (B). mapejadorSeccions.js també el lint tests/lint-sessio.test.mjs,
     que no corre amb vitest. */
  'src/data/mapejadorSeccions.js',
  'src/data/mapejadorSeccions.test.js',
  'src/data/appSeed.onboarding.test.js',
  'src/data/supabase/utils.test.js',
  /* Front 3 (261013; pla 261013_1930) · Rentonar al padró de la llavor: la
     taula d'identitats, els consumidors que la lligen i les seues proves. */
  'src/data/identitatsSeed.js',
  'src/data/appSeed.js',
  'src/data/xatSeed.js',
  /* Correcció del Front 3 · creaFilDirecte obri una entitat del padró d'entitats. */
  'src/data/localXat.js',
  'src/data/localXat.test.js',
  'src/data/localPerfils.test.js',
  'src/data/supabase/perfils.fundacionals.test.js',
  /* Gauntlet 261016 (Bloc 3) · El catàleg d'agents (tipusDAgent, la font
     única del tipus de perfil: un personatge ANIMAL és IA; i l'estil de Nano
     Banana sense personatges de tercers, amb la seua prova), el perfil local
     que el llig i l'adaptador de perfils (la dignitat de persona). */
  'src/data/agentsSeed.js',
  'src/data/agentsSeed.drets.test.js',
  'src/data/localPerfils.js',
  'src/data/supabase/perfils.js',
  /* Gauntlet 261016 · La resta de fitxers d'esta capa tocats esta nit, que la
     regla de la capçalera fa entrar al cens: l'autoria de la llavor (Bloc -1,
     la persona pilot amb el seu retrat), el poble innegociable de les
     organitzacions (Bloc 3.5.2), la prova de la migració del 403 de profiles
     (Bloc 3.5.3, que ja es lint a ella mateixa) i les proves de l'adaptador
     del xat (Bloc 3.6 i la baixa del canal de l'auditoria de Codex). */
  'src/data/identitatsSeed.autoria.test.js',
  'src/data/pobleOrganitzacio.js',
  'src/data/organizations.js',
  'src/data/supabase/organizations.js',
  'src/data/supabase/perfilUpdatePropi.migracio.test.js',
  'src/data/supabase/xat.test.js',
  'src/data/supabase/xat.iaia.test.js',
  'src/data/supabase/xat.baixa.realtimejs.test.js',
  /* Gauntlet 261016 (Bloc -1; diürn 1530) · La guarda anti-regressió de la
     identitat dual (el fantasma antic, l'única publicació de la persona pilot
     i la seua foto). */
  'src/data/identitatDual.guarda.test.js',
  /* Gauntlet 261016_1530 (Bloc 3.6.6; relleu F25) · La IAIA local respon
     amb la Wiki pública del paquet: el mòdul pur, la resposta asíncrona i
     ordenada del magatzem local i les seues proves. */
  'src/data/iaiaLocal.js',
  'src/data/iaiaLocal.test.js',
  'src/data/localXat.iaia.test.js',
  'src/data/localXat.iaiaOrdre.test.js'
]);

describe('el cens', () => {
  test('tots els fitxers del cens existixen', () => {
    for (const fitxer of CENS) expect(existsSync(path.join(ARREL, fitxer)), fitxer).toBe(true);
  });
});

describe('ESLint', () => {
  test('zero missatges, avisos inclosos, a tots els fitxers del cens', async () => {
    const eslint = new ESLint({ cwd: ARREL });
    const resultats = await eslint.lintFiles(CENS.map((f) => path.join(ARREL, f)));
    const missatges = resultats.flatMap((r) => r.messages.map((m) => `${path.relative(ARREL, r.filePath)}:${m.line} [${m.ruleId}] ${m.message}`));
    expect(resultats).toHaveLength(CENS.length);
    expect(missatges).toEqual([]);
    // Sonda: la configuració del projecte és activa (un avís és un error amb --max-warnings=0).
    const [sonda] = await eslint.lintText('const sobrant = 1;', { filePath: path.join(ARREL, 'src/data/sonda.js') });
    expect(sonda.messages.map((m) => m.ruleId)).toEqual(['no-unused-vars', 'eol-last']);
  }, 120000);
});
