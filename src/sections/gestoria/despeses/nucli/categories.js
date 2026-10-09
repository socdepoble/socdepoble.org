/**
 * categories.js — les categories de despesa i ingrés de l'empresa i el
 * reconeixement dels proveïdors als moviments del banc.
 *
 * Onada 6, ordre del Mestre (261009): «calcular les despeses massives en IA».
 * El catàleg és TANCAT i CONGELAT: la persona no hi crea categories; només
 * pot posar regles seues (per un tros de text) i reclassificar un moviment.
 *
 * classificaMoviment({ comerc, sepa, text, centims, conceptComu, regles })
 * torna { categoria, proveidor, confianca, motiu }. Mai torna el text que ha
 * llegit: `motiu` és un codi (MOTIUS). L'ordre de decisió:
 *   1. les regles de la persona (REGLA_MANUAL, confiança alta);
 *   2. el NIF del creditor d'un rebut SEPA, si és d'un proveïdor del catàleg
 *      de factures (nucli/cataleg.js) que coneixem ací (NIF_SEPA, alta);
 *   3. les comissions del banc (també les de compra en divisa, que porten el
 *      proveïdor si se sap), abans que el proveïdor: legalment són del banc;
 *      però si el comerç de la targeta és un proveïdor, el moviment és la
 *      compra, encara que el concepte diga «comisión»;
 *   4. els proveïdors (PROVEIDORS): al comerç de la targeta o al creditor SEPA
 *      la confiança és alta; només al text, mitjana; un patró feble (una
 *      paraula que també és un nom comú, «Kimi», «Mistral»), un punt menys;
 *   5. un proveïdor ambigu (Google o Microsoft sense dir quin producte) va a
 *      «revisa»: Gemini no és Workspace, i l'IVA i la categoria canvien;
 *   6. les categories genèriques (impostos, RETA, traspassos, nòmines...);
 *   7. el concepte comú de la Norma 43 (17: comissions; 11: caixer);
 *   8. pel signe: una entrada sense patró és d'un client (baixa) i una
 *      eixida sense patró, «altres» (baixa).
 *
 * El país de cada proveïdor és el de la societat que factura a Espanya, per
 * a l'IVA (tractamentIva): ES interior, la resta de la UE inversió del
 * subjecte passiu intracomunitària, fora de la UE extracomunitària. [NO
 * VERIFICAT] Els països i els patrons són una estimació: la factura mana.
 *
 * JS pur: sense DOM, React ni xarxa. Cap dada personal: només noms públics
 * d'empreses i paraules dels extractes.
 */
import { proveidorPerNif } from '../../nucli/cataleg.js';

/** L'etiqueta de tot el que és una suposició d'este catàleg. */
export const NO_VERIFICAT = '[NO VERIFICAT]';

function categoria(id, nom, tipus, explica) {
  return Object.freeze({ id, nom, tipus, explica });
}

/**
 * Les categories, en l'ordre en què es pinten. `tipus`: 'despesa', 'ingres',
 * 'fiscal' (impostos pagats o tornats), 'neutre' (traspassos entre comptes
 * propis, que no són ni ingrés ni despesa) i 'revisa'.
 */
export const CATEGORIES = Object.freeze([
  categoria('ia', 'Intel·ligència artificial', 'despesa', 'Models, assistents i API d’IA: Anthropic, OpenAI, Gemini, Mistral, DeepSeek…'),
  categoria('allotjament', 'Allotjament i dominis', 'despesa', 'Servidors, hosting, dominis i bases de dades al núvol.'),
  categoria('programari', 'Programari i subscripcions', 'despesa', 'Programes i serveis de pagament que no són d’IA.'),
  categoria('telefonia', 'Telefonia i internet', 'despesa', 'Línies de mòbil, fibra i dades.'),
  categoria('energia', 'Energia', 'despesa', 'Llum i gas.'),
  categoria('comissions', 'Comissions bancàries', 'despesa', 'Comissions, manteniment i canvi de divisa del banc.'),
  categoria('impostos', 'Impostos', 'fiscal', 'Pagaments i devolucions de l’Agència Tributària i dels tributs locals.'),
  categoria('reta', 'Quota d’autònoms (RETA)', 'despesa', 'La quota de la Seguretat Social del titular.'),
  categoria('nomines', 'Transferències i nòmines', 'despesa', 'Transferències emeses i nòmines: cal revisar quines són despesa.'),
  categoria('traspas', 'Traspàs entre comptes propis', 'neutre', 'Diners que passen d’un compte teu a un altre: ni ingrés ni despesa.'),
  categoria('clients', 'Ingressos de clients', 'ingres', 'Cobraments de factures i entrades sense un altre origen conegut.'),
  categoria('altres', 'Altres', 'despesa', 'Eixides sense cap patró conegut.'),
  categoria('revisa', 'Per revisar', 'revisa', 'Proveïdors ambigus: cal triar la categoria a mà.')
]);

/** Els identificadors de les categories, en ordre. */
export const IDS_CATEGORIES = Object.freeze(CATEGORIES.map((c) => c.id));
const PER_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

/** La categoria d'un identificador, o null. */
export const categoriaDe = (id) => PER_ID.get(id) ?? null;

/** Les confiances, de més a menys. */
export const CONFIANCES = Object.freeze(['alta', 'mitjana', 'baixa']);

/**
 * Els codis de `motiu` de classificaMoviment, de reclassifica i de la sèrie
 * (TRASPAS_PROBABLE: serieHistorica.js en marca les parelles entre comptes propis).
 */
export const MOTIUS = Object.freeze([
  'REGLA_MANUAL', 'NIF_SEPA', 'COMISSIO', 'COMISSIO_DIVISA', 'COMERC', 'CREDITOR_SEPA', 'TEXT', 'PATRO_FEBLE',
  'PROVEIDOR_AMBIGU', 'CATEGORIA_GENERICA', 'CONCEPTE_COMU', 'ENTRADA_SENSE_PATRO', 'EIXIDA_SENSE_PATRO', 'SENSE_IMPORT',
  'RECLASSIFICAT', 'TRASPAS_PROBABLE'
]);

/** Cada motiu en paraules, per al llibre de la gestora i la pantalla. */
export const TEXT_MOTIUS = Object.freeze({
  REGLA_MANUAL: 'Una regla teua',
  NIF_SEPA: 'El NIF del creditor del rebut',
  COMISSIO: 'Comissió del banc',
  COMISSIO_DIVISA: 'Comissió de canvi de divisa',
  COMERC: 'El comerç de la targeta',
  CREDITOR_SEPA: 'El creditor del rebut',
  TEXT: 'El text del moviment',
  PATRO_FEBLE: 'Una paraula del text que també és un nom comú (a revisar)',
  PROVEIDOR_AMBIGU: 'Proveïdor sense producte (a revisar)',
  CATEGORIA_GENERICA: 'Una paraula genèrica del text',
  CONCEPTE_COMU: 'El concepte comú de la Norma 43',
  ENTRADA_SENSE_PATRO: 'Entrada sense origen conegut (compta com a client)',
  EIXIDA_SENSE_PATRO: 'Eixida sense cap patró',
  SENSE_IMPORT: 'Sense import llegit',
  RECLASSIFICAT: 'Reclassificat a mà',
  TRASPAS_PROBABLE: 'Traspàs probable entre comptes propis (a revisar)'
});

/** Els estats membres de la Unió Europea (codis ISO; Grècia, també EL). */
export const PAISOS_UE = Object.freeze([
  'AT', 'BE', 'BG', 'CY', 'CZ', 'DE', 'DK', 'EE', 'EL', 'ES', 'FI', 'FR', 'GR', 'HR', 'HU', 'IE', 'IT', 'LT', 'LU', 'LV',
  'MT', 'NL', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK'
]);

/** Els tractaments de l'IVA d'una compra, segons el país del proveïdor. */
export const TRACTAMENTS_IVA = Object.freeze(['interior', 'isp-intracomunitari', 'isp-extracomunitari', 'desconegut']);

/**
 * El tractament de l'IVA d'una compra a un proveïdor d'un país. [NO VERIFICAT]
 * La inversió del subjecte passiu exigix comprar amb el NIF-IVA (ROI): sense,
 * el proveïdor pot cobrar el seu IVA, que no es deduïx.
 * @param {string|null} pais codi ISO
 * @returns {'interior'|'isp-intracomunitari'|'isp-extracomunitari'|'desconegut'}
 */
export function tractamentIva(pais) {
  if (typeof pais !== 'string' || !/^[A-Z]{2}$/.test(pais)) return 'desconegut';
  if (pais === 'ES') return 'interior';
  return PAISOS_UE.includes(pais) ? 'isp-intracomunitari' : 'isp-extracomunitari';
}

/*
 * Un proveïdor: clau, nom, categoria, país, patrons forts i febles (sobre el
 * text normalitzat: majúscules i sense accents), si és ambigu i, si el
 * catàleg de factures (nucli/cataleg.js) el coneix, la seua clau d'allà.
 */
function proveidor({ clau, nom, categoria: cat, pais = null, patrons = [], febles = [], ambigu = false, cataleg = null, nota = '' }) {
  if (!PER_ID.has(cat)) throw new TypeError(`Categoria desconeguda per a ${clau}: ${cat}`);
  return Object.freeze({
    clau, nom, categoria: cat, pais, ambigu, cataleg, nota,
    patrons: Object.freeze([...patrons]), febles: Object.freeze([...febles])
  });
}

/*
 * L'ordre importa: el primer que casa guanya. Per això els productes
 * concrets (Gemini, Workspace, Google Cloud, Copilot) van abans del nom
 * general de l'empresa (Google, Microsoft), que és ambigu.
 */
export const PROVEIDORS = Object.freeze([
  // ── Intel·ligència artificial ──
  proveidor({ clau: 'anthropic', nom: 'Anthropic (Claude)', categoria: 'ia', pais: 'IE', cataleg: 'anthropic',
    patrons: [/\bANTHROPIC\b/, /\bCLAUDE\.AI\b/, /\bCLAUDE\s+(?:PRO|MAX|TEAM|AI|CODE)\b/], febles: [/\bCLAUDE\b/],
    nota: 'A la UE factura Anthropic Ireland.' }),
  /* Azure OpenAI abans que OpenAI: el seu nom porta «OPENAI» i factura Microsoft. */
  proveidor({ clau: 'azure-openai', nom: 'Azure OpenAI', categoria: 'ia', pais: 'IE', patrons: [/\bAZURE\s+OPENAI\b/] }),
  proveidor({ clau: 'openai', nom: 'OpenAI (ChatGPT)', categoria: 'ia', pais: 'IE', cataleg: 'openai',
    patrons: [/\bOPENAI\b/, /\bOPEN\s+AI\b/, /\bCHATGPT\b/, /\bDALL-?E\b/], febles: [/\bSORA\b/],
    nota: 'A la UE pot facturar OpenAI Ireland o OpenAI LLC: revisa la factura.' }),
  proveidor({ clau: 'google-gemini', nom: 'Google Gemini', categoria: 'ia', pais: 'IE',
    patrons: [/\bGEMINI\b/, /\bAI\s+STUDIO\b/, /\bVERTEX\s*AI\b/, /\bNOTEBOOKLM\b/] }),
  proveidor({ clau: 'github-copilot', nom: 'GitHub Copilot', categoria: 'ia', pais: 'US',
    patrons: [/(?=.*\bGITHUB\b)(?=.*\bCOPILOT\b)/] }),
  proveidor({ clau: 'microsoft-copilot', nom: 'Microsoft Copilot', categoria: 'ia', pais: 'IE', patrons: [/\bCOPILOT\b/] }),
  proveidor({ clau: 'perplexity', nom: 'Perplexity', categoria: 'ia', pais: 'US', patrons: [/\bPERPLEXITY\b/] }),
  proveidor({ clau: 'mistral', nom: 'Mistral AI', categoria: 'ia', pais: 'FR', patrons: [/\bMISTRAL\s*AI\b/], febles: [/\bMISTRAL\b/] }),
  proveidor({ clau: 'xai', nom: 'xAI (Grok)', categoria: 'ia', pais: 'US', patrons: [/\bX\.AI\b/, /\bXAI\b/, /\bGROK\b/] }),
  proveidor({ clau: 'moonshot', nom: 'Moonshot AI (Kimi)', categoria: 'ia', pais: 'CN', patrons: [/\bMOONSHOT\b/], febles: [/\bKIMI\b/] }),
  proveidor({ clau: 'deepseek', nom: 'DeepSeek', categoria: 'ia', pais: 'CN', patrons: [/\bDEEP\s*SEEK\b/] }),
  proveidor({ clau: 'zhipu', nom: 'Zhipu AI (Z.ai)', categoria: 'ia', pais: 'CN', patrons: [/\bZHIPU\b/, /\bZ\.AI\b/, /\bBIGMODEL\b/, /\bCHATGLM\b/] }),
  proveidor({ clau: 'alibaba-qwen', nom: 'Alibaba Cloud (Qwen)', categoria: 'ia', pais: 'SG',
    patrons: [/\bQWEN\b/, /\bDASHSCOPE\b/, /\bALIBABA\s*CLOUD\b/, /\bALIYUN\b/] }),
  proveidor({ clau: 'fal-ai', nom: 'fal.ai', categoria: 'ia', pais: 'US', cataleg: 'fal-ai', patrons: [/\bFAL\.AI\b/, /\bFAL\s+AI\b/] }),
  proveidor({ clau: 'elevenlabs', nom: 'ElevenLabs', categoria: 'ia', pais: 'US', patrons: [/\bELEVEN\s*LABS\b/] }),
  proveidor({ clau: 'replicate', nom: 'Replicate', categoria: 'ia', pais: 'US', patrons: [/\bREPLICATE\b/] }),
  proveidor({ clau: 'openrouter', nom: 'OpenRouter', categoria: 'ia', pais: 'US', patrons: [/\bOPEN\s*ROUTER\b/] }),
  proveidor({ clau: 'midjourney', nom: 'Midjourney', categoria: 'ia', pais: 'US', patrons: [/\bMIDJOURNEY\b/] }),
  proveidor({ clau: 'cursor', nom: 'Cursor (Anysphere)', categoria: 'ia', pais: 'US', patrons: [/\bANYSPHERE\b/, /\bCURSOR\s*(?:,\s*)?AI\b/], febles: [/\bCURSOR\b/] }),
  proveidor({ clau: 'huggingface', nom: 'Hugging Face', categoria: 'ia', pais: 'US', patrons: [/\bHUGGING\s*FACE\b/] }),
  proveidor({ clau: 'runway', nom: 'Runway', categoria: 'ia', pais: 'US', patrons: [/\bRUNWAY\s*(?:ML|AI)\b/] }),
  proveidor({ clau: 'suno', nom: 'Suno', categoria: 'ia', pais: 'US', patrons: [/\bSUNO\s*(?:AI|INC)\b/], febles: [/\bSUNO\b/] }),
  proveidor({ clau: 'groq', nom: 'Groq', categoria: 'ia', pais: 'US', patrons: [/\bGROQ\b/] }),
  proveidor({ clau: 'together-ai', nom: 'Together AI', categoria: 'ia', pais: 'US', patrons: [/\bTOGETHER\s*(?:\.|\s)?AI\b/] }),
  proveidor({ clau: 'cohere', nom: 'Cohere', categoria: 'ia', pais: 'CA', patrons: [/\bCOHERE\b/] }),
  proveidor({ clau: 'stability', nom: 'Stability AI', categoria: 'ia', pais: 'GB', patrons: [/\bSTABILITY\s*AI\b/] }),

  // ── Allotjament i dominis (els productes de Google i Microsoft, abans que el nom ambigu) ──
  proveidor({ clau: 'google-cloud', nom: 'Google Cloud', categoria: 'allotjament', pais: 'IE',
    patrons: [/\bGOOGLE\s*CLOUD\b/, /\bGCP\b/, /\bFIREBASE\b/] }),
  proveidor({ clau: 'azure', nom: 'Microsoft Azure', categoria: 'allotjament', pais: 'IE', patrons: [/\bAZURE\b/] }),
  proveidor({ clau: 'aws', nom: 'Amazon Web Services', categoria: 'allotjament', pais: 'LU', patrons: [/\bAWS\b/, /\bAMAZON\s+WEB\s+SERVICES\b/] }),
  proveidor({ clau: 'vercel', nom: 'Vercel', categoria: 'allotjament', pais: 'US', patrons: [/\bVERCEL\b/] }),
  proveidor({ clau: 'supabase', nom: 'Supabase', categoria: 'allotjament', pais: 'US', patrons: [/\bSUPABASE\b/] }),
  proveidor({ clau: 'netlify', nom: 'Netlify', categoria: 'allotjament', pais: 'US', patrons: [/\bNETLIFY\b/] }),
  proveidor({ clau: 'cloudflare', nom: 'Cloudflare', categoria: 'allotjament', pais: 'US', cataleg: 'cloudflare', patrons: [/\bCLOUDFLARE\b/] }),
  proveidor({ clau: 'digitalocean', nom: 'DigitalOcean', categoria: 'allotjament', pais: 'US', cataleg: 'digitalocean', patrons: [/\bDIGITAL\s*OCEAN\b/] }),
  proveidor({ clau: 'hetzner', nom: 'Hetzner', categoria: 'allotjament', pais: 'DE', patrons: [/\bHETZNER\b/] }),
  proveidor({ clau: 'siteground', nom: 'SiteGround', categoria: 'allotjament', pais: 'ES', cataleg: 'siteground', patrons: [/\bSITEGROUND\b/] }),
  proveidor({ clau: 'dondominio', nom: 'DonDominio', categoria: 'allotjament', pais: 'ES', cataleg: 'dondominio', patrons: [/\bDON\s*DOMINIO\b/] }),
  proveidor({ clau: 'ionos', nom: 'IONOS', categoria: 'allotjament', pais: 'ES', cataleg: 'ionos', patrons: [/\bIONOS\b/, /\b1&1\b/] }),
  proveidor({ clau: 'hostinger', nom: 'Hostinger', categoria: 'allotjament', pais: 'CY', cataleg: 'hostinger', patrons: [/\bHOSTINGER\b/] }),
  proveidor({ clau: 'ovhcloud', nom: 'OVHcloud', categoria: 'allotjament', pais: 'ES', cataleg: 'ovhcloud', patrons: [/\bOVH(?:CLOUD)?\b/] }),
  proveidor({ clau: 'namecheap', nom: 'Namecheap', categoria: 'allotjament', pais: 'US', patrons: [/\bNAMECHEAP\b/] }),
  proveidor({ clau: 'godaddy', nom: 'GoDaddy', categoria: 'allotjament', pais: 'US', patrons: [/\bGO\s*DADDY\b/] }),
  proveidor({ clau: 'sollutia', nom: 'Sollutia', categoria: 'allotjament', pais: 'ES', cataleg: 'sollutia', patrons: [/\bSOLLUTIA\b/] }),

  // ── Programari i subscripcions ──
  proveidor({ clau: 'google-workspace', nom: 'Google Workspace', categoria: 'programari', pais: 'IE',
    patrons: [/(?=.*\bGOOGLE\b)(?=.*\bWORKSPACE\b)/, /\bG\s*SUITE\b/] }),
  proveidor({ clau: 'microsoft-365', nom: 'Microsoft 365', categoria: 'programari', pais: 'IE',
    patrons: [/\bMICROSOFT\s*365\b/, /\bOFFICE\s*365\b/, /\bM365\b/] }),
  proveidor({ clau: 'github', nom: 'GitHub', categoria: 'programari', pais: 'US', cataleg: 'github', patrons: [/\bGITHUB\b/] }),
  proveidor({ clau: 'adobe', nom: 'Adobe', categoria: 'programari', pais: 'IE', cataleg: 'adobe', patrons: [/\bADOBE\b/] }),
  proveidor({ clau: 'apple', nom: 'Apple', categoria: 'programari', pais: 'IE', cataleg: 'apple', patrons: [/\bAPPLE\.COM\b/, /\bAPPLE\s+(?:SERVICES|ONE|ICLOUD)\b/, /\bICLOUD\b/],
    febles: [/\bAPPLE\b/] }),
  proveidor({ clau: 'notion', nom: 'Notion', categoria: 'programari', pais: 'US', patrons: [/\bNOTION\s*(?:LABS|\.SO)?\b/] }),
  proveidor({ clau: 'figma', nom: 'Figma', categoria: 'programari', pais: 'US', patrons: [/\bFIGMA\b/] }),
  proveidor({ clau: 'canva', nom: 'Canva', categoria: 'programari', pais: 'AU', patrons: [/\bCANVA\b/] }),
  proveidor({ clau: 'zoom', nom: 'Zoom', categoria: 'programari', pais: 'US', patrons: [/\bZOOM\.US\b/, /\bZOOM\s+VIDEO\b/] }),
  proveidor({ clau: 'dropbox', nom: 'Dropbox', categoria: 'programari', pais: 'IE', patrons: [/\bDROPBOX\b/] }),
  proveidor({ clau: '1password', nom: '1Password', categoria: 'programari', pais: 'CA', patrons: [/\b1PASSWORD\b/] }),
  proveidor({ clau: 'atlassian', nom: 'Atlassian', categoria: 'programari', pais: 'AU', patrons: [/\bATLASSIAN\b/] }),
  proveidor({ clau: 'jetbrains', nom: 'JetBrains', categoria: 'programari', pais: 'CZ', patrons: [/\bJETBRAINS\b/] }),
  proveidor({ clau: 'obsidian', nom: 'Obsidian', categoria: 'programari', pais: 'CA', patrons: [/\bOBSIDIAN\.MD\b/, /\bDYNALIST\b/] }),

  // ── Telefonia i internet ──
  proveidor({ clau: 'movistar', nom: 'Movistar (Telefónica)', categoria: 'telefonia', pais: 'ES', cataleg: 'movistar', patrons: [/\bMOVISTAR\b/, /\bTELEFONICA\b/] }),
  proveidor({ clau: 'lowi', nom: 'Lowi', categoria: 'telefonia', pais: 'ES', cataleg: 'lowi', patrons: [/\bLOWI\b/] }),
  proveidor({ clau: 'vodafone', nom: 'Vodafone', categoria: 'telefonia', pais: 'ES', patrons: [/\bVODAFONE\b/] }),
  proveidor({ clau: 'orange', nom: 'Orange', categoria: 'telefonia', pais: 'ES', cataleg: 'orange', patrons: [/\bORANGE\s+(?:ESPAGNE|ESPANA)\b/], febles: [/\bORANGE\b/] }),
  proveidor({ clau: 'jazztel', nom: 'Jazztel', categoria: 'telefonia', pais: 'ES', patrons: [/\bJAZZTEL\b/] }),
  proveidor({ clau: 'masmovil', nom: 'MásMóvil', categoria: 'telefonia', pais: 'ES', patrons: [/\bMAS\s*MOVIL\b/] }),
  proveidor({ clau: 'yoigo', nom: 'Yoigo', categoria: 'telefonia', pais: 'ES', patrons: [/\bYOIGO\b/] }),
  proveidor({ clau: 'pepephone', nom: 'Pepephone', categoria: 'telefonia', pais: 'ES', patrons: [/\bPEPEPHONE\b/] }),
  proveidor({ clau: 'digi', nom: 'Digi', categoria: 'telefonia', pais: 'ES', patrons: [/\bDIGI\s+(?:SPAIN|MOBIL)\b/] }),
  proveidor({ clau: 'simyo', nom: 'Simyo', categoria: 'telefonia', pais: 'ES', patrons: [/\bSIMYO\b/] }),
  proveidor({ clau: 'finetwork', nom: 'Finetwork', categoria: 'telefonia', pais: 'ES', patrons: [/\bFINETWORK\b/] }),

  // ── Energia ──
  proveidor({ clau: 'iberdrola', nom: 'Iberdrola', categoria: 'energia', pais: 'ES', cataleg: 'iberdrola', patrons: [/\bIBERDROLA\b/, /\bCURENERGIA\b/] }),
  proveidor({ clau: 'endesa', nom: 'Endesa', categoria: 'energia', pais: 'ES', cataleg: 'endesa', patrons: [/\bENDESA\b/] }),
  proveidor({ clau: 'naturgy', nom: 'Naturgy', categoria: 'energia', pais: 'ES', patrons: [/\bNATURGY\b/] }),
  proveidor({ clau: 'som-energia', nom: 'Som Energia', categoria: 'energia', pais: 'ES', cataleg: 'som-energia', patrons: [/\bSOM\s+ENERGIA\b/] }),
  proveidor({ clau: 'holaluz', nom: 'Holaluz', categoria: 'energia', pais: 'ES', patrons: [/\bHOLALUZ\b/] }),
  proveidor({ clau: 'totalenergies', nom: 'TotalEnergies', categoria: 'energia', pais: 'ES', patrons: [/\bTOTAL\s*ENERGIES\b/] }),

  // ── Els noms ambigus: sense el producte no se sap si és IA, programari o núvol ──
  /* El NIF de Google Cloud EMEA (catàleg de factures) també cobra Workspace i Gemini: per NIF, ambigu. */
  proveidor({ clau: 'google', nom: 'Google (sense producte)', categoria: 'revisa', pais: 'IE', ambigu: true, cataleg: 'google-cloud',
    patrons: [/\bGOOGLE\b/],
    nota: 'Pot ser Gemini (IA), Workspace (programari), Google Cloud o Google One: tria-ho a mà.' }),
  proveidor({ clau: 'microsoft', nom: 'Microsoft (sense producte)', categoria: 'revisa', pais: 'IE', ambigu: true, patrons: [/\bMICROSOFT\b/, /\bMSFT\b/],
    nota: 'Pot ser Copilot (IA), Microsoft 365 o Azure: tria-ho a mà.' }),
  proveidor({ clau: 'amazon', nom: 'Amazon (sense producte)', categoria: 'revisa', pais: 'LU', ambigu: true, cataleg: 'amazon', patrons: [/\bAMAZON\b/, /\bAMZN\b/],
    nota: 'Pot ser una compra, Prime o AWS: tria-ho a mà.' })
]);

const PROVEIDOR_PER_CLAU = new Map(PROVEIDORS.map((p) => [p.clau, p]));
const PER_CLAU_CATALEG = new Map(PROVEIDORS.filter((p) => p.cataleg).map((p) => [p.cataleg, p]));

/** El proveïdor d'una clau, o null. */
export const proveidorDe = (clau) => PROVEIDOR_PER_CLAU.get(clau) ?? null;

/* Les categories genèriques: sense proveïdor. L'ordre importa. */
const GENERIQUES = Object.freeze([
  { categoria: 'impostos', patrons: [/\bAEAT\b/, /\bAGENCIA\s+(?:ESTATAL\s+DE\s+ADMINISTRACION\s+)?TRIBUTARIA\b/, /\bHACIENDA\b/, /\bIMPUESTOS?\b/, /\bTRIBUTOS?\b/,
    /\bATV\b/, /\bSUMA\s+GESTIO\b/, /\bIBI\b/, /\bIVTM\b/, /\bMOD(?:ELO)?\.?\s*(?:303|130|111|115|349|390|100)\b/] },
  { categoria: 'reta', patrons: [/\bSEGURIDAD\s+SOCIAL\b/, /\bSEG\.?\s*SOCIAL\b/, /\bTGSS\b/, /\bTESORERIA\s+GENERAL\b/, /\bRETA\b/, /\bAUTONOMOS?\b/] },
  { categoria: 'traspas', patrons: [/\bTRASPASOS?\b/, /\bTRASPAS\b/, /\bENTRE\s+CUENTAS\b/, /\bCUENTA\s+PROPIA\b/] },
  { categoria: 'nomines', patrons: [/\bNOMINAS?\b/, /\bSALARIO\b/] }
]);
/* Les comissions del banc, que manen sobre el proveïdor de la compra. */
const COMISSIO = [/\bCOMISION(?:ES)?\b/, /\bCOMISSIO\b/, /\bCOMIS\.?\s/, /\bMANTENIMIENTO\b/, /\bCUOTA\s+(?:TARJETA|ANUAL|MANTENIMIENTO)\b/,
  /\bGASTOS\s+(?:DE\s+)?(?:GESTION|CORRESPONDENCIA)\b/];
const DIVISA = [/\bDIVISAS?\b/, /\bCAMBIO\b/, /\bMONEDA\s+EXTRANJERA\b/, /\bEXCHANGE\b/];
/* Les transferències: l'entrada és d'un client (baixa) i l'eixida, una transferència emesa. */
const TRANSFERENCIA = [/\bTRANSFERENCIAS?\b/, /\bTRANSF\b/, /\bBIZUM\b/];

/**
 * El text normalitzat per als patrons: majúscules, sense accents i amb els
 * espais en un.
 * @param {unknown} text
 * @returns {string}
 */
export function normalitzaText(text) {
  return String(text ?? '').normalize('NFD').replace(/\p{M}/gu, '').toUpperCase().replace(/\s+/g, ' ').trim();
}

const casa = (patrons, text) => Boolean(text) && patrons.some((patro) => patro.test(text));
const resultat = (categoria, proveidor, confianca, motiu) => Object.freeze({ categoria, proveidor, confianca, motiu });
const BAIXA_UN = Object.freeze({ alta: 'mitjana', mitjana: 'baixa', baixa: 'baixa' });

/** Els problemes d'una regla de la persona ([] si és vàlida). */
export function validaRegla(regla) {
  const errors = [];
  if (!regla || typeof regla !== 'object') return ['Cal una regla { patro, categoria }.'];
  const patro = normalitzaText(regla.patro);
  if (patro.length < 3) errors.push('El text de la regla ha de tindre almenys 3 lletres.');
  if (patro.length > 60) errors.push('El text de la regla no pot passar de 60 caràcters.');
  if (!PER_ID.has(regla.categoria)) errors.push('Tria una categoria del catàleg.');
  if (regla.proveidor != null && !PROVEIDOR_PER_CLAU.has(regla.proveidor)) errors.push('El proveïdor no és del catàleg.');
  return errors;
}

/* El proveïdor del creditor d'un rebut SEPA pel seu NIF, si el catàleg de factures el coneix i ací també. */
function perNifSepa(sepa) {
  const cif = typeof sepa?.cif === 'string' ? sepa.cif : '';
  if (!cif) return null;
  const delCataleg = proveidorPerNif(cif);
  return delCataleg ? PER_CLAU_CATALEG.get(delCataleg.clau) ?? null : null;
}

/* El primer proveïdor que casa en un text: { proveidor, feble }. */
function proveidorEn(text) {
  if (!text) return null;
  for (const p of PROVEIDORS) {
    if (casa(p.patrons, text)) return { proveidor: p, feble: false };
  }
  for (const p of PROVEIDORS) {
    if (casa(p.febles, text)) return { proveidor: p, feble: true };
  }
  return null;
}

/* Un proveïdor trobat, amb la confiança del lloc on s'ha trobat. */
function deProveidor({ proveidor: p, feble }, confianca, motiu) {
  const real = feble ? BAIXA_UN[confianca] : confianca;
  if (p.ambigu) return resultat('revisa', p.clau, real === 'alta' ? 'mitjana' : real, 'PROVEIDOR_AMBIGU');
  return resultat(p.categoria, p.clau, real, feble ? 'PATRO_FEBLE' : motiu);
}

/**
 * La categoria i el proveïdor d'un moviment del banc (vegeu la capçalera).
 * @param {object} p
 * @param {string} [p.comerc] el comerç d'una compra amb targeta
 * @param {{ creditor?: string, cif?: string }} [p.sepa] el rebut SEPA
 * @param {string} [p.text] el text dels conceptes del banc
 * @param {number|null} [p.centims] l'import amb signe (entrada positiva)
 * @param {string} [p.conceptComu] el concepte comú de dues xifres de la Norma 43
 * @param {Array<{ patro: string, categoria: string, proveidor?: string|null }>} [p.regles] les de la persona
 * @returns {{ categoria: string, proveidor: string|null, confianca: 'alta'|'mitjana'|'baixa', motiu: string }}
 */
export function classificaMoviment({ comerc, sepa, text, centims = null, conceptComu = '', regles = [] } = {}) {
  const deComerc = normalitzaText(comerc);
  const deCreditor = normalitzaText(sepa?.creditor);
  const deText = normalitzaText(text);
  const tot = [deComerc, deCreditor, deText].filter(Boolean).join(' ');

  for (const regla of Array.isArray(regles) ? regles : []) {
    if (validaRegla(regla).length) continue;
    if (tot.includes(normalitzaText(regla.patro))) return resultat(regla.categoria, regla.proveidor ?? null, 'alta', 'REGLA_MANUAL');
  }

  const perNif = perNifSepa(sepa);
  if (perNif && !perNif.ambigu) return resultat(perNif.categoria, perNif.clau, 'alta', 'NIF_SEPA');

  /* Un proveïdor al comerç de la targeta vol dir que el moviment és la compra: una «comissió» al concepte no la fa del banc. */
  const alComerc = proveidorEn(deComerc);
  if (!alComerc && casa(COMISSIO, tot)) {
    const trobat = proveidorEn(tot);
    const divisa = casa(DIVISA, tot);
    return resultat('comissions', trobat && !trobat.proveidor.ambigu ? trobat.proveidor.clau : null, 'mitjana', divisa ? 'COMISSIO_DIVISA' : 'COMISSIO');
  }

  if (alComerc) return deProveidor(alComerc, 'alta', 'COMERC');
  const alCreditor = proveidorEn(deCreditor);
  if (alCreditor) return deProveidor(alCreditor, 'alta', 'CREDITOR_SEPA');
  const alText = proveidorEn(deText);
  if (alText) return deProveidor(alText, 'mitjana', 'TEXT');

  const entrada = Number.isSafeInteger(centims) && centims > 0;
  for (const { categoria: cat, patrons } of GENERIQUES) {
    if (casa(patrons, tot)) return resultat(cat, null, 'mitjana', 'CATEGORIA_GENERICA');
  }
  if (casa(TRANSFERENCIA, tot)) return resultat(entrada ? 'clients' : 'nomines', null, 'baixa', 'CATEGORIA_GENERICA');
  if (conceptComu === '17') return resultat('comissions', null, 'mitjana', 'CONCEPTE_COMU');
  if (conceptComu === '11') return resultat('altres', null, 'mitjana', 'CONCEPTE_COMU');

  if (!Number.isSafeInteger(centims)) return resultat('revisa', null, 'baixa', 'SENSE_IMPORT');
  return entrada ? resultat('clients', null, 'baixa', 'ENTRADA_SENSE_PATRO') : resultat('altres', null, 'baixa', 'EIXIDA_SENSE_PATRO');
}

/**
 * Una reclassificació de la persona sobre la classificació d'un moviment.
 * @param {{ categoria: string, proveidor: string|null, confianca: string, motiu: string }} classificacio
 * @param {{ categoria: string, proveidor?: string|null }|null|undefined} canvi
 * @returns {{ categoria: string, proveidor: string|null, confianca: string, motiu: string }}
 */
export function reclassifica(classificacio, canvi) {
  if (!canvi || !PER_ID.has(canvi.categoria)) return classificacio;
  const proveidorNou = canvi.proveidor === undefined ? classificacio.proveidor : canvi.proveidor;
  const valid = proveidorNou == null || PROVEIDOR_PER_CLAU.has(proveidorNou);
  return resultat(canvi.categoria, valid ? proveidorNou ?? null : null, 'alta', 'RECLASSIFICAT');
}
