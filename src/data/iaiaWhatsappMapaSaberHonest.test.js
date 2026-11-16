import { describe, expect, test } from 'vitest';
import {
  IAIA_WHATSAPP_NODE0_ARCHITECTURE,
  IAIA_SABER_DOMAINS_EN_PREPARACIO,
  IAIA_SABER_DOMAINS_IDS,
  IAIA_WHATSAPP_MAPA_SABER_TEXTS,
  simulaRespostaHonestaIaiaWhatsapp,
} from './iaiaWhatsappMapaSaberHonest.js';

const LANGS = ['ca', 'es', 'en', 'eu', 'gl'];
const TOT = JSON.stringify({ IAIA_WHATSAPP_NODE0_ARCHITECTURE, IAIA_WHATSAPP_MAPA_SABER_TEXTS });
/** P0-41 (llei de vocabulari del Mestre, 261107): els adjectius vetats en les 5 llengües, escrits per trossos. */
const VETATS_P041 = new RegExp([['so', 'bir'], ['so', 'beran'], ['sove', 'reign'], ['buru', 'jabe']].map((p) => p.join('')).join('|'), 'i');

describe('IDEA-171 · Mapa Honest del Saber de la IAIA MarIA en WhatsApp (Hermes + Node 0)', () => {
  test('declara l’arquitectura del 2n número exclusiu de WhatsApp amb Hermes Gateway i iaia:latest, sense IP de LAN ni camins del servidor', () => {
    expect(IAIA_WHATSAPP_NODE0_ARCHITECTURE.gateway).toBe('Hermes WhatsApp Gateway');
    expect(IAIA_WHATSAPP_NODE0_ARCHITECTURE.primaryModel).toBe('iaia:latest');
    expect(IAIA_WHATSAPP_NODE0_ARCHITECTURE.reasoningFallbackModel).toBe('hermes3:8b');
    expect(IAIA_WHATSAPP_NODE0_ARCHITECTURE.trajectoryTags).toEqual([
      '[DISCOVERY]',
      '[DEADEND]',
      '[CORRECTION]',
      '[SEQUENCE]',
    ]);
    expect(IAIA_SABER_DOMAINS_IDS).toHaveLength(7);
    expect(IAIA_SABER_DOMAINS_EN_PREPARACIO).toEqual([
      'calendari-agricola-i-receptari-mas',
      'batec-de-vida-i-emergencies-offline',
    ]);
    for (const vetat of ['192.168.', '/Users/', 'socdepoble-node0', 'fediversityIntegration']) {
      expect([vetat, TOT.includes(vetat)]).toEqual([vetat, false]);
    }
  });

  test('cap dels fets rebutjats o sense font (G10-05, Oli-F3, R90, IDEA-164, Tractor Psicopatia) en cap llengua', () => {
    const rebutjats = [
      'Picó', 'Cava Gran', '1919', 'BRL', 'Barrachina', 'Cruz Orozco', 'exactes',
      'Blanqueta', 'Manzanilla', 'polifenol', 'llauna',
      ['Offline', 'First'].join('-'), 'LoRa', 'Meshtastic', 'IDEA-164',
      'Open Social', 'Research & Higher', 'Restack', 'NLnet', 'Nix-Panel', '15 min', 'staged', 'application-options',
      'almohad', 'Almohad', 'Carta Pobla', 'Carta Puebla', 'Carta Pobra', 'GPX', 'KML', 'Inventari Botànic', 'Inventario Botánico',
      'Keik',
    ];
    for (const rebutjat of rebutjats) {
      expect([rebutjat, TOT.includes(rebutjat)]).toEqual([rebutjat, false]);
    }
    const plegat = TOT.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const motVetat = new RegExp(['ma', 's', 'ia'].join(''), 'g');
    expect(plegat.match(motVetat) ?? []).toHaveLength(0);
  });

  test('P0-41 (llei de vocabulari del Mestre, 261107) · cap adjectiu vetat en cap de les 5 llengües: es diu «el WhatsApp de la IAIA»', () => {
    expect(TOT).not.toMatch(VETATS_P041);
    expect(TOT).toContain('WhatsApp de la IAIA');
  });

  test.each(LANGS)(
    '%s: conté els 7 dominis, les cotes del pou de l’anatomia rural amb les discrepàncies i l’oli Alfafarenca i Mançanella',
    (lang) => {
      const copy = IAIA_WHATSAPP_MAPA_SABER_TEXTS[lang];
      expect(copy).toBeDefined();
      expect(copy.domains).toHaveLength(7);
      expect(copy.domains.map((d) => d.id)).toEqual(IAIA_SABER_DOMAINS_IDS);
      expect(copy.simulatorStatusHumility.startsWith(' ')).toBe(false);

      const pou = copy.domains[0];
      expect(pou.sources).toContain('Segura Martí');
      expect(pou.sources).toContain('Rico García (1880)');
      expect(pou.summary).toMatch(/9[.,]80 m/);
      expect(pou.summary).toMatch(/9[.,]75 m/);
      expect(pou.summary).toMatch(/13[.,]75 m/);
      expect(pou.summary).toMatch(/29 m/);
      expect(pou.summary).toContain('1724');
      expect(pou.summary).toContain('1880');

      const oli = copy.domains[1];
      for (const camp of [oli.summary, oli.sampleReply]) {
        expect(camp).toContain('Alfafarenca');
        expect(camp).toContain('Mançanella');
        expect(camp).not.toMatch(/pedra seca|piedra seca|dry-stone|harri lehor/i);
      }

      const fedi = copy.domains[6];
      for (const actor of ['Maintainers', 'Developers', 'Hosting provider', 'Operator', 'User']) {
        expect(fedi.summary).toContain(actor);
      }

      const batec = copy.domains[5];
      expect(batec.sources).toContain('IDEA-123/124');
    },
  );

  /* Onada R30 · R29-D9 (kit Gemini lot_02, arbitrat per Claude) · El nom propi del producte no es traduïx, com a
     l'enllaç d'AparadorFediversity (R29-02-6d) i al títol i subtítol de /page/avisador: «L’Avisador · Batec de
     Vida» en les cinc llengües, i en anglés amb la glossa «(Heartbeat of Life)» darrere, literal. En valencià,
     enmig de frase, l'article va en minúscula com al Panell («Obrir l’Avisador»): la resta de llengües el
     conserven com a part del nom, com els seus diccionaris («Activa L’Avisador»). */
  const NOM_PROPI = 'Avisador · Batec de Vida';
  const AMB_ARTICLE = /(?:^|[^\p{L}])[Ll]’Avisador · Batec de Vida/u;
  const TRADUCCIONS_VELLES = /Latido de Vida|Bizi Taupada|Latexo de Vida/;

  test.each(LANGS)('%s · R29-D9 · el domini 06 diu el nom propi «L’Avisador · Batec de Vida» sense traduir-lo', (lang) => {
    const batec = IAIA_WHATSAPP_MAPA_SABER_TEXTS[lang].domains[5];
    expect(batec.id).toBe('batec-de-vida-i-emergencies-offline');
    for (const [camp, text] of Object.entries({ title: batec.title, sampleQuestion: batec.sampleQuestion, sampleReply: batec.sampleReply })) {
      expect([lang, camp, AMB_ARTICLE.test(text)]).toEqual([lang, camp, true]);
      expect([lang, camp, TRADUCCIONS_VELLES.test(text)]).toEqual([lang, camp, false]);
      /* En anglés, la glossa sempre darrere del nom literal i mai en lloc seu. */
      if (lang === 'en') {
        expect([camp, text.includes('L’Avisador · Batec de Vida (Heartbeat of Life)')]).toEqual([camp, true]);
        expect([camp, text.replaceAll('(Heartbeat of Life)', '').includes('Heartbeat')]).toEqual([camp, false]);
      }
    }
    /* La resposta que torna el simulador porta el mateix nom. */
    const r = simulaRespostaHonestaIaiaWhatsapp({ dominiId: 'batec-de-vida-i-emergencies-offline', idioma: lang });
    expect([lang, r.resposta.includes(NOM_PROPI), r.preguntaEfectiva.includes(NOM_PROPI)]).toEqual([lang, true, true]);
  });

  test('R29-D9 · cap traducció vella del nom en cap camp de cap llengua, i el valencià l’apostrofa en minúscula enmig de frase', () => {
    expect(TOT).not.toMatch(TRADUCCIONS_VELLES);
    expect(IAIA_WHATSAPP_MAPA_SABER_TEXTS.ca.domains[5].sampleQuestion).toContain('de l’Avisador · Batec de Vida');
    for (const lang of ['es', 'en', 'eu', 'gl']) {
      expect([lang, IAIA_WHATSAPP_MAPA_SABER_TEXTS[lang].domains[5].sampleQuestion.includes('L’Avisador · Batec de Vida')]).toEqual([lang, true]);
    }
  });

  test('simulaRespostaHonestaIaiaWhatsapp: verificat només per a la pregunta de mostra d’un domini amb fonts; humilitat [DISCOVERY] per a la resta', () => {
    const ok = simulaRespostaHonestaIaiaWhatsapp({
      dominiId: 'pou-de-neu-rentonar',
      idioma: 'ca',
    });
    expect(ok.verificat).toBe(true);
    expect(ok.trajectoryTag).toBe('[SEQUENCE]');
    expect(ok.resposta).toContain('9,80 m');
    expect(ok.resposta).toContain('no consta');
    expect(ok.resposta).not.toContain('Picó');

    const mostra = IAIA_WHATSAPP_MAPA_SABER_TEXTS.ca.domains[0].sampleQuestion;
    expect(simulaRespostaHonestaIaiaWhatsapp({ dominiId: 'pou-de-neu-rentonar', pregunta: `  ${mostra}  ` }).verificat).toBe(true);

    const propia = simulaRespostaHonestaIaiaWhatsapp({ dominiId: 'pou-de-neu-rentonar', idioma: 'ca', pregunta: 'Quin temps farà demà a Alcoi?' });
    expect(propia.verificat).toBe(false);
    expect(propia.trajectoryTag).toBe('[DISCOVERY]');
    expect(propia.preguntaEfectiva).toBe('Quin temps farà demà a Alcoi?');
    expect(propia.resposta).not.toContain('9,80');

    for (const dominiId of IAIA_SABER_DOMAINS_EN_PREPARACIO) {
      for (const idioma of LANGS) {
        const r = simulaRespostaHonestaIaiaWhatsapp({ dominiId, idioma });
        expect([dominiId, idioma, r.verificat, r.trajectoryTag]).toEqual([dominiId, idioma, false, '[DISCOVERY]']);
      }
    }
    expect(simulaRespostaHonestaIaiaWhatsapp({ dominiId: 'batec-de-vida-i-emergencies-offline' }).resposta).toContain('no avisa ningú');

    expect(() => simulaRespostaHonestaIaiaWhatsapp({ dominiId: 'pou-de-neu-rentonar', pregunta: null })).not.toThrow();

    const honest = simulaRespostaHonestaIaiaWhatsapp({
      dominiId: 'unverified',
      idioma: 'ca',
    });
    expect(honest.verificat).toBe(false);
    expect(honest.trajectoryTag).toBe('[DISCOVERY]');
    expect(honest.resposta).toContain('[DISCOVERY]');
    expect(honest.resposta).toContain('no s’inventa mai cap dada');
    expect(honest.fonts).toBe('Cap font verificada encara.');
  });
});
