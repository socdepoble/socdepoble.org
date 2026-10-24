// @vitest-environment node
/* T2 (261024; P0-18, auditories Codex 261024_1315 C-02, C-03 i C-06) · El
   text legal i l'aplicació diuen el mateix sobre la moderació (Reglament (UE)
   2022/2065, de Serveis Digitals). Una sola àncora; el punt únic de contacte
   (arts. 11 i 12) amb l'adreça de config/contacte.js; les referències
   creuades d'apartats; la clau de localStorage de les normes, la que escriu
   ModeracioContext.jsx; UNA sola regla de mesures proporcionades (art. 14.4) a
   l'apartat 3, a les normes del legal i a les normes de l'aplicació (ca.js);
   la motivació de l'art. 17.3; la baixa amb Apple; i cap «anonimització» on
   només es desvincula. Guardes: ni el «Si no has iniciat sessió» de G-05 ni
   el paràgraf de l'art. 19 (microempresa), que és decisió del Mestre. */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { legalContent } from './legalContent.js';
import { CORREU_CONTACTE } from '../../config/contacte.js';
import { STORAGE_PREFIX } from '../../config/storage.js';
import { createTranslator } from '../../config/i18n.js';

const HTML = legalContent.html;
const TEXT = HTML.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
const ca = createTranslator('ca');
const TOLERANCIA_APP = ca('section.moderacio.normes.toleranciaZero');

/** Els apartats numerats (h4 «N. Títol»): { número: títol }. */
const APARTATS = Object.fromEntries([...HTML.matchAll(/<h4>(\d+)\. ([^<]+)<\/h4>/g)].map((m) => [m[1], m[2]]));
/** El text pla d'un tros de l'HTML, de `des` fins a `fins` (exclòs). */
const tros = (des, fins) => {
  const inici = HTML.indexOf(des);
  expect(inici, des).toBeGreaterThanOrEqual(0);
  const fi = fins ? HTML.indexOf(fins, inici + des.length) : HTML.length;
  expect(fi, fins).toBeGreaterThan(inici);
  return HTML.slice(inici, fi).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ');
};
/* Les mesures de la regla única: el contingut, sempre fora; la persona,
   segons la gravetat i si es repetix; l'il·legal greu, a la primera. */
const MESURES_APP = ['el retirem sempre', 'gravetat', 'avís', 'suspen', 'expuls', 'greu', 'a la primera'];

describe('/legal · DSA', () => {
  test('una sola àncora (la de la baixa) i cap enllaç a un fragment', () => {
    expect([...HTML.matchAll(/data-sdp-ancora=/g)]).toHaveLength(1);
    expect(HTML).toContain('<h5 id="esborra-compte" data-sdp-ancora="esborra-compte">');
    expect(HTML).not.toMatch(/href="#/);
  });

  test('el punt únic de contacte (arts. 11 i 12) és el correu de contacte, i tot mailto: hi va', () => {
    const punt = tros('<strong>Punt únic de contacte.</strong>', '</p>');
    expect(punt).toMatch(/articles 11 i 12 del Reglament \(UE\) 2022\/2065/);
    expect(punt).toContain(CORREU_CONTACTE);
    expect(punt).toMatch(/en valencià, en castellà o en anglés/);
    const mailtos = [...HTML.matchAll(/href="(mailto:[^"]*)"/g)].map((m) => m[1]);
    expect(mailtos.length).toBeGreaterThanOrEqual(5);
    for (const mailto of mailtos) expect(mailto.startsWith(`mailto:${CORREU_CONTACTE}`), mailto).toBe(true);
  });

  test('les referències creuades: l’apartat 20 és el navegador i el 21 el contingut incrustat', () => {
    expect(APARTATS['20']).toMatch(/^Què guardem al teu navegador/);
    expect(APARTATS['21']).toMatch(/^Contingut incrustat/);
    expect(tros('<h4>2. ', '<h4>3. ')).toContain('a l\'apartat 20');
    expect(tros('<h5>Normes de convivència i moderació</h5>', '<h4>4. ')).toContain('(apartat 21)');
    /* E14 · L'apartat 2 deia «apartat 21» per a la llista del navegador. */
    expect(tros('<h4>2. ', '<h4>3. ')).not.toContain('apartat 21');
  });

  test('la llista de localStorage porta la clau de les normes que escriu ModeracioContext.jsx', () => {
    const font = readFileSync(path.join(process.cwd(), 'src/app/contexts/ModeracioContext.jsx'), 'utf8');
    const prefix = /const clauDeNormes = \(usuariId\) => `([\w-]+:)\$\{usuariId\}`;/.exec(font)?.[1];
    expect(prefix).toBe('normes-convivencia:');
    expect(HTML).toContain(`<code>${STORAGE_PREFIX}${prefix}*</code>`);
    expect(tros(`<code>${STORAGE_PREFIX}${prefix}*</code>`, '</li>')).toMatch(/quan el servidor ja l'ha guardada/);
  });

  test('UNA sola regla de mesures (art. 14.4): l’apartat 3, les normes del legal i les de l’aplicació', () => {
    const condicions = tros('<h4>3. ', '<h5>Normes de convivència i moderació</h5>');
    const normesLegal = tros('<strong>Tolerància zero amb el contingut:</strong>', '</li>');
    for (const mesura of MESURES_APP) expect(TOLERANCIA_APP, `ca.js: ${mesura}`).toContain(mesura);
    for (const mesura of ['retirem sempre', 'gravetat', 'avís', 'suspensió temporal', 'expuls', 'il·legal greu', 'a la primera']) {
      expect(normesLegal, `legal: ${mesura}`).toContain(mesura);
    }
    for (const mesura of ['retirarem sempre', 'gravetat', 'avís', 'suspensió temporal', 'baixa definitiva', 'il·legal greu', 'a la primera']) {
      expect(condicions, `apartat 3: ${mesura}`).toContain(mesura);
    }
    /* Cap expulsió uniforme ni la reserva antiga de suspendre «avisant-lo prèviament». */
    expect(TEXT).not.toMatch(/el retirem i expulsem qui l'ha publicat/);
    expect(TEXT).not.toMatch(/Ens reservem el dret de suspendre/);
    expect(TOLERANCIA_APP).not.toMatch(/retirem el contingut que incomplix estes normes i expulsem/);
    expect(normesLegal).toMatch(/És la mateixa regla que diuen les normes que acceptes a l'aplicació\./);
  });

  test('la motivació (art. 17.3): què, fins quan, on s’aplica, com ho hem sabut i que ho decidix una persona', () => {
    const motivacio = tros('<strong>Si retirem un contingut teu</strong>', '</li>');
    expect(motivacio).toContain("Et direm què hem fet, fins quan i on s'aplica (si no diem res més, a tota l'aplicació)");
    expect(motivacio).toContain('si ho hem sabut per una denúncia o per una revisió nostra');
    expect(motivacio).toContain('que ho ha decidit una persona i no un sistema automàtic');
  });

  /* Actualitzada a posta (261024 correccions): motiu · R1-02/R3-01, R3-04 i
     R3-10. La revocació d'Apple és de millor esforç (compte.js) i no hi ha
     res a revocar sense testimoni custodiat (compte-apple, sense_testimoni):
     el text diu «intentem» i dona el camí manual. La porta d'Apple de la
     purga (2610241440, dies_espera_revocacio_apple = 7) pot passar dels 30
     dies. La purga conserva els fitxers que usa la fitxa d'una entitat
     (logo, capçalera, presentació) i esborra el que hi havia en un grup que
     desapareix amb la persona. */
  test('la baixa: amb Apple ho intentem i hi ha camí manual; fins a 7 dies més; què s’esborra i què es queda', () => {
    const baixa = tros('<h5 id="esborra-compte"', '<h4>17. ');
    expect(baixa).toContain("Si entres amb Apple: quan demanes la baixa, intentem retirar (revocar) el permís que vas donar a Sóc de Poble des del teu compte d'Apple.");
    expect(baixa).toContain('Si l\'hem retirat i durant aquests 30 dies tornes a entrar amb Apple, Apple et tornarà a demanar permís');
    expect(baixa).not.toMatch(/quan demanes la baixa, retirem/);
    expect(baixa).toContain('el pots retirar tu: a l\'iPhone, a Configuració › el teu nom › Inici de sessió amb Apple, o a account.apple.com');
    expect(baixa).toContain('Si vas entrar amb Apple, pot tardar fins a 7 dies més');
    expect(baixa).toContain("Mentre la retirada quede pendent, l'esborrat definitiu pot esperar fins a 7 dies més.");
    expect(baixa).toMatch(/Què s'esborra, passats els 30 dies: el compte i el perfil, les publicacions que vas fer en nom teu/);
    expect(baixa).toContain('el títol de les teues publicacions a les converses que s\'hi havien obert');
    expect(baixa).toContain('els teus seguiments, el permís d\'Apple que guardàvem');
    expect(baixa).toContain("les fotos i els fitxers que havies pujat, llevat dels que encara fa servir una entitat (a la seua fitxa o en una publicació) o una publicació d'una altra persona");
    expect(baixa).toContain("el que vas publicar en nom d'una entitat és de l'entitat i es queda amb ella");
    expect(baixa).toContain('Si eres l\'única persona que quedava en un grup, el grup desapareix amb tu i el que hi vas publicar s\'esborra amb la resta.');
    expect(baixa).toContain('Els missatges que altres persones van escriure a la conversa d\'una publicació teua es queden a la conversa, sense el títol de la publicació.');
    expect(baixa).not.toMatch(/memòria del poble|sense el teu nom ni la teua foto/);
    /* L'apartat 10 diu la mateixa excepció al termini de 30 dies. */
    expect(tros('<li><strong>Després de demanar la baixa:</strong>', '</li>')).toContain('l\'esborrat pot esperar fins a 7 dies més');
  });

  /* R3-06 i R2-05 (261024 correccions) · Els seguiments (2610241430) i la
     custòdia d'Apple (2610241420) són tractaments nous: l'apartat 8 diu què
     guardem, el 10 quant de temps i el 13 qui ho veu. L'exportació
     (2610241410) porta a qui seguixes i, de qui et seguix, només quants. */
  test('seguiments i permís d’Apple: què guardem (8), quant de temps (10) i qui ho veu (13)', () => {
    const dades = tros('<h4>8. ', '<h4>9. ');
    expect(dades).toContain('Seguiments: a qui seguixes i qui et seguix (persones o entitats), i des de quan.');
    expect(dades).toMatch(/Permís d'Apple: si entres amb Apple a l'aplicació de l'iPhone, el permís que dones a Sóc de Poble des del teu compte d'Apple, guardat xifrat/);
    expect(dades).toContain('Només el fem servir per a retirar-lo quan et dones de baixa.');
    expect(dades).toContain('en guardem constància amb una empremta del teu compte, no amb el teu identificador');
    const retencio = tros('<h4>10. ', '<h4>11. ');
    expect(retencio).toContain("Seguiments (a qui seguixes i qui et seguix): s'esborren, com a molt tard, quan s'esborra definitivament el teu compte.");
    expect(retencio).toContain('a qui seguixes és dins de la còpia de les teues dades que pots descarregar; de qui et seguix, només hi ha quantes persones són');
    expect(retencio).toContain("Permís d'Apple: l'esborrem quan l'hem retirat o, com a molt tard, quan s'esborra definitivament el teu compte.");
    /* Sense purga de private.revocacions_apple (2610241420: decisió del Mestre): el text no en promet cap termini. */
    expect(retencio).toContain("ara mateix no té cap termini d'esborrat fixat");
    const qui = tros('<h4>13. ', '<h4>14. ');
    expect(qui).toContain('Si seguixes una persona, ella veu el teu nom i des de quan la seguixes.');
    expect(qui).toContain("Si seguixes una entitat, les persones que l'administren veuen el teu nom i des de quan la seguixes, siga quin siga el teu poble.");
    expect(tros('<h4>9. ', '<h4>10. ')).toContain('seguir persones i entitats');
  });

  /* R2-01 · Bloquejar continua sent només per a qui bloqueja (el bloqueig
     d'ombra dels seguiments): li amaga també el seguiment de l'altra persona,
     i l'altra persona no en sap res. */
  test('bloquejar: també amaga qui et seguix, i continua sent només per a tu', () => {
    const bloqueig = tros('<li><strong>Bloquejar:</strong>', '</li>');
    expect(bloqueig).toContain('si et seguix, tampoc no la veuràs a la teua llista de qui et seguix');
    expect(bloqueig).toContain('Qui bloqueges no en rebrà cap avís.');
    expect(bloqueig).toContain("Bloquejar només t'ho amaga a tu: no li impedeix veure el que publiques ni escriure't.");
  });

  /* R3-08, R3-13 i R3-14 (261024 correccions) · Una persona responsable (el
     titular és una persona física: «Qui és nosaltres»), sense «equip»; el
     termini de 24 hores és decisió del Mestre i no es toca. Els límits
     automàtics, tots: per compte (20/h), per connexió sense compte (10/h),
     el sostre comú de les anònimes (300/h) i la repetida pendent que no
     entra (2610201500), i el de missatges seguits del xat (2609080200). */
  test('com ho revisem: una persona responsable, en 24 hores, i la llista sencera de límits automàtics', () => {
    const revisio = tros('<li><strong>Com ho revisem:</strong>', '</li>');
    expect(revisio).toContain('cada denúncia la revisa una persona responsable de la moderació, en menys de 24 hores.');
    expect(HTML).not.toMatch(/equip de moderació/);
    expect(revisio).toContain('un límit de missatges al xat en pocs segons');
    expect(revisio).toContain('uns límits de denúncies per hora: per a cada compte, per a cada connexió sense compte i, entre totes les denúncies sense compte, un sostre comú.');
    expect(revisio).toContain("si amb el teu compte ja has denunciat un contingut i aquella denúncia encara està pendent, no se'n guarda una altra.");
    expect(revisio).toContain("Qui publica contingut il·legal greu, l'expulsem a la primera.");
    expect(TOLERANCIA_APP).toMatch(/^Tolerància zero[^.]*\. A qui el publica, segons la gravetat i si es repetix, li donem un avís/);
    expect(TOLERANCIA_APP).not.toMatch(/Amb qui el publica/);
    expect(ca('section.moderacio.denuncia.descripcio')).toMatch(/^Ho revisarà una persona responsable de la moderació de Sóc de Poble\./);
  });

  test('cap «anonimització» on només es desvincula (C-06), i les denúncies diuen què en queda', () => {
    expect(HTML).not.toMatch(/anonimitz/i);
    expect(HTML).not.toMatch(/desvinculades/);
    const denuncies = tros('<li><strong>Denúncies:</strong>', '</li>');
    expect(denuncies).toContain('no queden anònimes del tot');
    expect(denuncies).toContain("l'empremta de l'adreça IP");
  });

  /* Actualitzada a posta (261024 correccions): motiu · ordre del Mestre de
     les 15:05, Codex D-05, Gemini G2-05.2 i R3-02. El text ha canviat en
     substància (moderació, Apple, baixa, seguiments): el rètol puja a la 2.2,
     en vigor des del 24 d'octubre de 2026, amb la mateixa forma de frase.
     legalContent.date és la data de la pàgina (capçalera de pageContent.js,
     la mitjanit UTC sense hora d'editorial.test.js) i no el rètol: no es toca. */
  test('guardes: ni el «Si no has iniciat sessió» (G-05) ni l’exempció de l’art. 19, i el rètol és el de la versió 2.2', () => {
    expect(TEXT).not.toMatch(/Si no has iniciat sessió/);
    expect(TEXT).toMatch(/Bloquejar: amb la sessió oberta/);
    expect(TEXT).not.toMatch(/microempresa|article 19 del Reglament \(UE\) 2022\/2065/);
    expect(HTML).toContain("<p><em>Versió 2.2 · En vigor des del 24 d'octubre de 2026. Substitueix qualsevol versió anterior d'aquest text.</em></p>");
    expect(HTML).not.toMatch(/Versió 2\.1/);
    expect([...HTML.matchAll(/Versió \d+\.\d+ · En vigor des del/g)]).toHaveLength(1);
    expect(legalContent.date).toBe('2026-09-09T00:00:00.000Z');
  });
});
