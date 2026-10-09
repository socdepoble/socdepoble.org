// @vitest-environment node
/* Despeses · el catàleg tancat de categories i el reconeixement dels
   proveïdors als moviments del banc (Onada 6, ordre del Mestre, 261009).
   Textos sintètics, com els escriuen els bancs: cap dada real. */
import { describe, expect, test } from 'vitest';
import {
  CATEGORIES, CONFIANCES, IDS_CATEGORIES, MOTIUS, PAISOS_UE, PROVEIDORS, TEXT_MOTIUS, TRACTAMENTS_IVA, categoriaDe, classificaMoviment,
  normalitzaText, proveidorDe, reclassifica, tractamentIva, validaRegla
} from './categories.js';

const compra = (comerc, centims = -2000) => classificaMoviment({ comerc, text: `OP.TARJ.COMPRA COMERCIO 999999******1234 ${comerc}`, centims });
const ambText = (text, centims = -2000, extra = {}) => classificaMoviment({ text, centims, ...extra });

describe('el catàleg', () => {
  test('tancat, congelat i amb les categories de l’ordre, en ordre', () => {
    expect(IDS_CATEGORIES).toEqual([
      'ia', 'allotjament', 'programari', 'telefonia', 'energia', 'comissions', 'impostos', 'reta', 'nomines', 'traspas', 'clients',
      'altres', 'revisa'
    ]);
    expect(Object.isFrozen(CATEGORIES)).toBe(true);
    expect(CATEGORIES.every(Object.isFrozen)).toBe(true);
    expect(Object.isFrozen(PROVEIDORS)).toBe(true);
    expect(() => { CATEGORIES.push({ id: 'nova' }); }).toThrow(TypeError);
    expect(categoriaDe('ia').nom).toBe('Intel·ligència artificial');
    expect(categoriaDe('inventada')).toBeNull();
    expect(CONFIANCES).toEqual(['alta', 'mitjana', 'baixa']);
  });

  test('cada proveïdor: clau única, categoria del catàleg, país ISO o null, patrons sense bandera g ni y', () => {
    /* El cens exacte (l'informe del 261009 deia «uns 85»): 77 proveïdors i 118 expressions (fortes i febles). */
    expect(PROVEIDORS).toHaveLength(77);
    expect(PROVEIDORS.reduce((t, p) => t + p.patrons.length + p.febles.length, 0)).toBe(118);
    const claus = PROVEIDORS.map((p) => p.clau);
    expect(new Set(claus).size).toBe(claus.length);
    for (const p of PROVEIDORS) {
      expect(IDS_CATEGORIES, p.clau).toContain(p.categoria);
      expect(p.pais === null || /^[A-Z]{2}$/.test(p.pais), p.clau).toBe(true);
      expect(p.patrons.length + p.febles.length, p.clau).toBeGreaterThan(0);
      for (const patro of [...p.patrons, ...p.febles]) expect(patro.flags, p.clau).not.toMatch(/[gy]/);
      if (p.ambigu) expect(p.categoria, p.clau).toBe('revisa');
    }
  });

  test('hi són els proveïdors d’IA de l’ordre i del Consell', () => {
    const ia = PROVEIDORS.filter((p) => p.categoria === 'ia').map((p) => p.clau);
    for (const clau of [
      'anthropic', 'openai', 'google-gemini', 'github-copilot', 'microsoft-copilot', 'perplexity', 'mistral', 'xai', 'moonshot', 'deepseek',
      'zhipu', 'alibaba-qwen', 'fal-ai', 'elevenlabs', 'replicate', 'openrouter', 'midjourney', 'cursor'
    ]) expect(ia, clau).toContain(clau);
    for (const clau of ['vercel', 'supabase', 'siteground', 'hostinger', 'ionos']) expect(proveidorDe(clau)?.categoria, clau).toBe('allotjament');
  });

  test('tractamentIva: ES interior, UE intracomunitari, la resta extracomunitari, sense país desconegut', () => {
    expect(TRACTAMENTS_IVA).toEqual(['interior', 'isp-intracomunitari', 'isp-extracomunitari', 'desconegut']);
    expect(PAISOS_UE).toHaveLength(28);
    expect(tractamentIva('ES')).toBe('interior');
    expect(tractamentIva('IE')).toBe('isp-intracomunitari');
    expect(tractamentIva('FR')).toBe('isp-intracomunitari');
    expect(tractamentIva('US')).toBe('isp-extracomunitari');
    expect(tractamentIva('CN')).toBe('isp-extracomunitari');
    expect(tractamentIva('GB')).toBe('isp-extracomunitari');
    for (const res of [null, undefined, '', 'es', 'ESP', 3]) expect(tractamentIva(res)).toBe('desconegut');
    expect(proveidorDe('anthropic').pais).toBe('IE');
    expect(proveidorDe('openai').pais).toBe('IE');
    expect(proveidorDe('mistral').pais).toBe('FR');
  });
});

describe('classificaMoviment: els proveïdors d’IA', () => {
  test('una compra amb targeta d’Anthropic: ia/anthropic, confiança alta pel comerç', () => {
    expect(compra('ANTHROPIC')).toEqual({ categoria: 'ia', proveidor: 'anthropic', confianca: 'alta', motiu: 'COMERC' });
    expect(compra('CLAUDE.AI SUBSCRIPTION')).toMatchObject({ categoria: 'ia', proveidor: 'anthropic', confianca: 'alta' });
  });

  test.each([
    ['OPENAI *CHATGPT SUBSCR', 'openai'],
    ['PERPLEXITY AI', 'perplexity'],
    ['MISTRAL AI', 'mistral'],
    ['X.AI GROK', 'xai'],
    ['MOONSHOT AI KIMI', 'moonshot'],
    ['DEEPSEEK PLATFORM', 'deepseek'],
    ['Z.AI CHATGLM', 'zhipu'],
    ['ALIBABA CLOUD DASHSCOPE', 'alibaba-qwen'],
    ['FAL.AI', 'fal-ai'],
    ['ELEVENLABS.IO', 'elevenlabs'],
    ['REPLICATE', 'replicate'],
    ['OPENROUTER INC', 'openrouter'],
    ['MIDJOURNEY INC.', 'midjourney'],
    ['CURSOR, AI POWERED IDE', 'cursor'],
    ['GITHUB COPILOT', 'github-copilot'],
    ['MICROSOFT COPILOT PRO', 'microsoft-copilot'],
    ['AZURE OPENAI SERVICE', 'azure-openai'],
    ['GOOGLE *GEMINI ADVANCED', 'google-gemini']
  ])('«%s» és IA de %s', (comerc, clau) => {
    expect(compra(comerc)).toMatchObject({ categoria: 'ia', proveidor: clau, confianca: 'alta' });
  });

  test('Google sense producte va a revisar (Gemini o Workspace?); amb el producte, a la seua categoria', () => {
    expect(compra('GOOGLE *SERVICES')).toEqual({ categoria: 'revisa', proveidor: 'google', confianca: 'mitjana', motiu: 'PROVEIDOR_AMBIGU' });
    expect(compra('GOOGLE WORKSPACE')).toMatchObject({ categoria: 'programari', proveidor: 'google-workspace' });
    expect(compra('GOOGLE CLOUD EMEA')).toMatchObject({ categoria: 'allotjament', proveidor: 'google-cloud' });
    expect(compra('MICROSOFT*STORE')).toMatchObject({ categoria: 'revisa', proveidor: 'microsoft', motiu: 'PROVEIDOR_AMBIGU' });
    expect(compra('MICROSOFT 365 BUSINESS')).toMatchObject({ categoria: 'programari', proveidor: 'microsoft-365' });
  });

  test('al text, i no al comerç ni al creditor, la confiança és mitjana; un patró feble, un punt menys', () => {
    expect(ambText('RECIBO ANTHROPIC IRELAND')).toEqual({ categoria: 'ia', proveidor: 'anthropic', confianca: 'mitjana', motiu: 'TEXT' });
    expect(ambText('PAGO CLAUDE')).toEqual({ categoria: 'ia', proveidor: 'anthropic', confianca: 'baixa', motiu: 'PATRO_FEBLE' });
    expect(compra('KIMI')).toMatchObject({ proveidor: 'moonshot', confianca: 'mitjana', motiu: 'PATRO_FEBLE' });
  });

  test('el creditor d’un rebut SEPA: alta; el NIF del creditor, si el catàleg de factures el coneix, també', () => {
    expect(classificaMoviment({ sepa: { creditor: 'HOSTINGER INTERNATIONAL' }, centims: -500 }))
      .toEqual({ categoria: 'allotjament', proveidor: 'hostinger', confianca: 'alta', motiu: 'CREDITOR_SEPA' });
    const nif = ['B', '8719', '4171'].join('');
    expect(classificaMoviment({ sepa: { creditor: 'UN NOM QUE NO DIU RES', cif: nif }, centims: -500 }))
      .toEqual({ categoria: 'allotjament', proveidor: 'siteground', confianca: 'alta', motiu: 'NIF_SEPA' });
  });

  test('el NIF de Google Cloud EMEA també cobra Workspace i Gemini: per NIF no decidix, decidix el producte', () => {
    const nif = ['IE', '3668997', 'OH'].join('');
    expect(classificaMoviment({ sepa: { creditor: 'GOOGLE CLOUD EMEA LIMITED', cif: nif }, text: 'GEMINI API', centims: -500 }))
      .toMatchObject({ categoria: 'allotjament', proveidor: 'google-cloud', motiu: 'CREDITOR_SEPA' });
    expect(classificaMoviment({ sepa: { creditor: 'GOOGLE', cif: nif }, centims: -500 })).toMatchObject({ categoria: 'revisa', proveidor: 'google' });
  });
});

describe('classificaMoviment: les categories genèriques i el signe', () => {
  test('la comissió del banc mana sobre el proveïdor, i la de divisa en conserva el proveïdor', () => {
    expect(ambText('COMISION MANTENIMIENTO CUENTA')).toEqual({ categoria: 'comissions', proveidor: null, confianca: 'mitjana', motiu: 'COMISSIO' });
    expect(ambText('COMISION COMPRA DIVISA ANTHROPIC')).toEqual({ categoria: 'comissions', proveidor: 'anthropic', confianca: 'mitjana', motiu: 'COMISSIO_DIVISA' });
  });

  test('però si el comerç de la targeta és un proveïdor, el moviment és la compra, encara que el concepte diga «comisión»', () => {
    expect(classificaMoviment({ comerc: 'ANTHROPIC', text: 'COMPRA TARJ DIVISA USD COMISION 0,45', centims: -2195 }))
      .toEqual({ categoria: 'ia', proveidor: 'anthropic', confianca: 'alta', motiu: 'COMERC' });
    /* Sense proveïdor al comerç, mana la comissió (també si el comerç és un forn). */
    expect(classificaMoviment({ comerc: 'FORN DE PROVA', text: 'COMISION', centims: -50 })).toMatchObject({ categoria: 'comissions', motiu: 'COMISSIO' });
  });

  test('cada motiu té el seu text per a la gestora', () => {
    expect(Object.keys(TEXT_MOTIUS).sort()).toEqual([...MOTIUS].sort());
    for (const text of Object.values(TEXT_MOTIUS)) expect(text.length).toBeGreaterThan(5);
    expect(MOTIUS).toContain('TRASPAS_PROBABLE');
  });

  test.each([
    ['AEAT MODELO 303 2T', 'impostos'],
    ['IMPUESTO SOCIEDADES', 'impostos'],
    ['TGSS COTIZACION 0521', 'reta'],
    ['SEGURIDAD SOCIAL REGIMEN AUTONOMOS', 'reta'],
    ['TRASPASO A CUENTA PROPIA', 'traspas'],
    ['NOMINA SEPTIEMBRE', 'nomines']
  ])('«%s» és %s', (text, categoria) => {
    expect(ambText(text)).toMatchObject({ categoria, proveidor: null, motiu: 'CATEGORIA_GENERICA' });
  });

  test('una transferència: d’un client si entra (baixa), emesa si ix (baixa)', () => {
    expect(ambText('TRANSFERENCIA DE EMPRESA SINTETICA SL', 150000)).toEqual({ categoria: 'clients', proveidor: null, confianca: 'baixa', motiu: 'CATEGORIA_GENERICA' });
    expect(ambText('TRANSFERENCIA A PERSONA SINTETICA', -5000)).toMatchObject({ categoria: 'nomines', confianca: 'baixa' });
  });

  test('el concepte comú de la Norma 43 i el signe, a falta de patró', () => {
    expect(ambText('', -300, { conceptComu: '17' })).toMatchObject({ categoria: 'comissions', motiu: 'CONCEPTE_COMU' });
    expect(ambText('', -300, { conceptComu: '11' })).toMatchObject({ categoria: 'altres', motiu: 'CONCEPTE_COMU' });
    expect(ambText('ALGO RARO', 1000)).toEqual({ categoria: 'clients', proveidor: null, confianca: 'baixa', motiu: 'ENTRADA_SENSE_PATRO' });
    expect(ambText('ALGO RARO', -1000)).toEqual({ categoria: 'altres', proveidor: null, confianca: 'baixa', motiu: 'EIXIDA_SENSE_PATRO' });
    expect(ambText('ALGO RARO', null)).toMatchObject({ categoria: 'revisa', motiu: 'SENSE_IMPORT' });
    expect(classificaMoviment()).toMatchObject({ categoria: 'revisa', motiu: 'SENSE_IMPORT' });
  });

  test('cap paraula comuna confon: un forn o una farmàcia no són d’IA', () => {
    for (const comerc of ['FORN DE PROVA', 'FARMACIA SINTETICA', 'GASOLINERA DEL POBLE', 'SUPERMERCAT']) {
      expect(compra(comerc)).toMatchObject({ categoria: 'altres', proveidor: null, confianca: 'baixa' });
    }
  });

  test('els motius són del catàleg de codis; mai el text llegit', () => {
    const casos = [compra('ANTHROPIC'), ambText('TGSS'), ambText('ALGO RARO', 1), compra('GOOGLE')];
    for (const c of casos) {
      expect(MOTIUS).toContain(c.motiu);
      expect(Object.keys(c).sort()).toEqual(['categoria', 'confianca', 'motiu', 'proveidor']);
      expect(Object.isFrozen(c)).toBe(true);
    }
  });
});

describe('les regles de la persona', () => {
  test('manen sobre tot, amb confiança alta, i casen sense accents ni majúscules', () => {
    const regles = [{ patro: 'forn de prova', categoria: 'altres' }, { patro: 'Google', categoria: 'ia', proveidor: 'google-gemini' }];
    expect(compra('FORN DE PROVA', -500)).toMatchObject({ motiu: 'EIXIDA_SENSE_PATRO' });
    expect(classificaMoviment({ comerc: 'GOOGLE *SERVICES', centims: -100, regles }))
      .toEqual({ categoria: 'ia', proveidor: 'google-gemini', confianca: 'alta', motiu: 'REGLA_MANUAL' });
    expect(classificaMoviment({ text: 'TRANSFERÈNCIA A L’AJUNTAMENT', centims: -100, regles: [{ patro: 'ajuntament', categoria: 'impostos' }] }))
      .toMatchObject({ categoria: 'impostos', motiu: 'REGLA_MANUAL' });
  });

  test('validaRegla: un text de 3 a 60 caràcters, una categoria i un proveïdor del catàleg; les invàlides no s’apliquen', () => {
    expect(validaRegla({ patro: 'abc', categoria: 'ia' })).toEqual([]);
    expect(validaRegla({ patro: 'ab', categoria: 'ia' })).toHaveLength(1);
    expect(validaRegla({ patro: 'x'.repeat(61), categoria: 'ia' })).toHaveLength(1);
    expect(validaRegla({ patro: 'abc', categoria: 'inventada' })).toHaveLength(1);
    expect(validaRegla({ patro: 'abc', categoria: 'ia', proveidor: 'inventat' })).toHaveLength(1);
    expect(validaRegla(null)).toHaveLength(1);
    expect(classificaMoviment({ text: 'ALGO RARO', centims: -1, regles: [{ patro: 'al', categoria: 'ia' }] })).toMatchObject({ motiu: 'EIXIDA_SENSE_PATRO' });
  });

  test('reclassifica: la tria de la persona, amb confiança alta; un canvi invàlid no fa res', () => {
    const base = compra('GOOGLE');
    expect(reclassifica(base, { categoria: 'ia', proveidor: 'google-gemini' }))
      .toEqual({ categoria: 'ia', proveidor: 'google-gemini', confianca: 'alta', motiu: 'RECLASSIFICAT' });
    expect(reclassifica(base, { categoria: 'programari' })).toMatchObject({ categoria: 'programari', proveidor: 'google' });
    expect(reclassifica(base, { categoria: 'ia', proveidor: null })).toMatchObject({ proveidor: null });
    expect(reclassifica(base, { categoria: 'inventada' })).toBe(base);
    expect(reclassifica(base, null)).toBe(base);
  });

  test('normalitzaText: majúscules, sense accents i espais en un', () => {
    expect(normalitzaText('  Intel·ligència   artificial ')).toBe('INTEL·LIGENCIA ARTIFICIAL');
    expect(normalitzaText(null)).toBe('');
  });
});
