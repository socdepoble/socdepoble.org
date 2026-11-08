/**
 * portaretalls.js — NOMÉS per a les proves. P0-58 (IDEA-189) · Porta-retalls
 * de prova per a l'enganxat net (cos i camps de la capçalera). El codi de
 * producció no l'importa. Viu a tests/helpers (com jpegProva.js) i no a src/:
 * les classes del seu HTML (Apple-interchange-newline, MsoHyperlink…) no són
 * nostres i la porta tractor-pedra-seca les comptaria com a classes òrfenes
 * (LLEI_01) i el fitxer com a subarbre orfe (LLEI_08).
 *
 * ATENCIÓ: TOTS SÓN SINTÈTICS. Escrits a mà el 261108 imitant l'estructura
 * que sol portar cada origen (etiquetes, atributs data-*, embolcalls, estils
 * en línia); NO són captures d'un navegador. Cap no s'ha de citar com a
 * prova de com copia de veres ChatGPT, WhatsApp, Google Docs o Word. Quan
 * algú registre clipboardData.types i getData() de cada origen en Chrome,
 * Safari i Firefox, el porta-retalls real substituïx el sintètic i en porta
 * la font i la data (`origen: 'captura'`).
 *
 * El cas `captura` reconstruïx a mà el text de la captura del Mestre (la
 * píndola de codi amb l'adreça de la prova tancada de Google Play): també és
 * sintètic.
 *
 * Cada entrada: { origen, font, data, tipus (els tipus MIME que porta), html,
 * text }. Un tipus que no hi és val ''.
 *
 * Design Guard compta tota etiqueta d'obertura de títol de nivell 1 escrita
 * literalment en un fitxer de src (Regla de les Capçaleres): l'etiqueta va
 * interpolada (H1), i la porta no la veu.
 */
const H1 = 'h1';

export const ORIGEN_SINTETIC = 'sintètic';
export const URL_PROVA_TANCADA = 'https://play.google.com/apps/testing/org.socdepoble.app';

const sintetic = (font, tipus, { html = '', text = '' }) => Object.freeze({
  origen: ORIGEN_SINTETIC, font, data: '261108', tipus: Object.freeze(tipus), html, text,
});

export const PORTARETALLS = Object.freeze({
  captura: sintetic(
    'Reconstrucció a mà del paràgraf de la captura del Mestre (una selecció de ChatGPT amb l’adreça dins d’un codi).',
    ['text/html', 'text/plain'],
    {
      html: '<meta charset="utf-8"><p data-start="0" data-end="133">Per a provar l’app d’Android, apunta’t ací: '
        + `<code data-start="44" data-end="101">${URL_PROVA_TANCADA}</code> i descarrega-la des de Google Play.</p>`,
      text: `Per a provar l’app d’Android, apunta’t ací: ${URL_PROVA_TANCADA} i descarrega-la des de Google Play.`,
    },
  ),

  chatgptSeleccio: sintetic(
    'Selecció de la resposta pintada de ChatGPT (HTML amb data-start/data-end, codis en línia i un bloc de codi amb la barra de l’idioma).',
    ['text/html', 'text/plain'],
    {
      html: '<meta charset="utf-8"><h3 data-start="0" data-end="22">Com instal·lar l’app</h3>'
        + '<p data-start="24" data-end="140">Primer, <strong data-start="32" data-end="44">apunta’t</strong> a la prova tancada: '
        + `<code data-start="70" data-end="127">${URL_PROVA_TANCADA}</code>.</p>`
        + '<ul data-start="142" data-end="260"><li data-start="142" data-end="200"><p data-start="144" data-end="200">Obri '
        + '<em data-start="149" data-end="160">Google Play</em> amb el mateix compte.</p></li>'
        + '<li data-start="201" data-end="260"><p data-start="203" data-end="260">Busca <strong>Sóc de Poble</strong>.</p></li></ul>'
        + '<ol data-start="262" data-end="330"><li><p>Instal·la l’app.</p></li><li><p>Obri-la i entra.</p></li></ol>'
        + '<p data-start="332" data-end="370">Per a desenvolupar, executa <code data-start="360" data-end="371">npm run dev</code>.</p>'
        + '<pre class="overflow-visible!" data-start="372" data-end="400"><div class="contain-inline-size"><div class="sticky">bash</div>'
        + '<div class="overflow-y-auto"><code class="whitespace-pre! language-bash"><span>npm install</span></code></div></div></pre>',
      text: 'Com instal·lar l’app\n'
        + `Primer, apunta’t a la prova tancada: ${URL_PROVA_TANCADA}.\n\n`
        + 'Obri Google Play amb el mateix compte.\n\nBusca Sóc de Poble.\n\n'
        + 'Instal·la l’app.\n\nObri-la i entra.\n\n'
        + 'Per a desenvolupar, executa npm run dev.\n\nbash\nnpm install\n',
    },
  ),

  chatgptBotoCopiar: sintetic(
    'El botó «Copia» de ChatGPT: només text/plain, amb el Markdown de la resposta.',
    ['text/plain'],
    {
      text: [
        '# Com instal·lar l’app',
        '',
        '## Abans de començar',
        '',
        `Primer, **apunta’t** a la prova tancada: \`${URL_PROVA_TANCADA}\`.`,
        '',
        '### Passos',
        '',
        '- Obri *Google Play* amb el mateix compte.',
        '* Busca _Sóc de Poble_.',
        '',
        '1. Instal·la l’app.',
        '1) Obri-la i entra.',
        '',
        '> Si no la trobes, espera uns minuts.',
        '',
        '---',
        '',
        'Més informació a [la web](https://socdepoble.org) o a https://socdepoble.org/ajuda.',
        '',
        '```bash',
        'npm run dev',
        '```',
        '',
        '~~Ja no cal registrar-se.~~',
      ].join('\n'),
    },
  ),

  whatsappWeb: sintetic(
    'Text d’un missatge seleccionat a WhatsApp Web (només text/plain, amb les marques de WhatsApp i cap marca de bloc).',
    ['text/plain'],
    { text: '*Fira de Sant Martí* dissabte a les 10\n_Porteu_ cadires i ~taules~\nhttps://socdepoble.org/agenda' },
  ),

  whatsappWebLlista: sintetic(
    'Missatge de WhatsApp Web amb una llista de «- » (WhatsApp la pinta com a llista).',
    ['text/plain'],
    { text: 'Per a la fira:\n- pa\n- vi\n- oli' },
  ),

  googleDocs: sintetic(
    'Còpia de Google Docs: embolcall <b id="docs-internal-guid-…" style="font-weight:normal"> i spans amb font-weight i font-style.',
    ['text/html', 'text/plain'],
    {
      html: '<meta charset="utf-8"><b style="font-weight:normal;" id="docs-internal-guid-5f1c2a3b-7fff-4d2e-9a10-0b1c2d3e4f50">'
        + '<p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Arial,sans-serif;'
        + 'color:#000000;background-color:transparent;font-weight:700;font-style:normal;font-variant:normal;text-decoration:none;'
        + 'vertical-align:baseline;white-space:pre-wrap;">Fira de tardor</span></p><br>'
        + '<p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Arial,sans-serif;'
        + 'color:#000000;background-color:transparent;font-weight:400;font-style:italic;font-variant:normal;text-decoration:none;'
        + 'vertical-align:baseline;white-space:pre-wrap;">Dissabte a la plaça</span></p><br>'
        + '<p dir="ltr" style="line-height:1.38;margin-top:0pt;margin-bottom:0pt;"><span style="font-size:11pt;font-family:Arial,sans-serif;'
        + 'color:#000000;background-color:transparent;font-weight:400;font-style:normal;white-space:pre-wrap;">Hi haurà parades de </span>'
        + '<span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;font-weight:700;font-style:normal;white-space:pre-wrap;">verdura</span>'
        + '<span style="font-size:11pt;font-family:Arial,sans-serif;color:#000000;font-weight:400;font-style:normal;white-space:pre-wrap;">'
        + ', música i berenar per a tothom.</span></p></b><br class="Apple-interchange-newline">',
      text: 'Fira de tardor\n\nDissabte a la plaça\n\nHi haurà parades de verdura, música i berenar per a tothom.',
    },
  ),

  word: sintetic(
    'Còpia de Microsoft Word: document sencer amb espais de noms d’Office, <style> en comentari, classes Mso, <o:p> i una llista feta amb «·».',
    ['text/html', 'text/plain'],
    {
      html: '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" '
        + 'xmlns="http://www.w3.org/TR/REC-html40"><head><meta http-equiv=Content-Type content="text/html; charset=utf-8">'
        + '<meta name=Generator content="Microsoft Word 15"><style><!-- p.MsoNormal {margin:0cm; font-size:12.0pt; '
        + 'font-family:"Calibri",sans-serif;} --></style></head><body lang=CA style=\'tab-interval:35.4pt\'><!--StartFragment-->'
        + `<${H1} style='mso-outline-level:1'>Assemblea de veïns<o:p></o:p></${H1}>`
        + '<p class=MsoNormal><b><span lang=CA>Dijous</span></b><span lang=CA> a les 19 h, a la <i>sala gran</i>.<o:p></o:p></span></p>'
        + '<p class=MsoListParagraphCxSpFirst style=\'text-indent:-18.0pt;mso-list:l0 level1 lfo1\'><![if !supportLists]>'
        + '<span style=\'font-family:Symbol\'>·<span style=\'font:7.0pt "Times New Roman"\'>&nbsp;&nbsp;&nbsp;&nbsp; </span></span>'
        + '<![endif]><span lang=CA>Pressupost<o:p></o:p></span></p>'
        + '<p class=MsoNormal><a href="https://socdepoble.org/assemblea" class="MsoHyperlink" style="color:blue">Ordre del dia</a>'
        + '<o:p></o:p></p><!--EndFragment--></body></html>',
      text: 'Assemblea de veïns\nDijous a les 19 h, a la sala gran.\n·     Pressupost\nOrdre del dia',
    },
  ),
});
