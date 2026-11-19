/* Suport de proves del Lector · IDEA-265 (261118): unes peces inventades de l'observatori i el
   canal RSS que n'escriu el motor (tooling/brain/observatori-rss-mestres.mjs · generaRssObservatori),
   byte a byte (observatori.test.js ho comprova). Cap fitxer de producció l'importa. */
export const PECES = Object.freeze([
  {
    hash: 'a'.repeat(64), veredicte: 'PROPOSAR_IDEA_SISTEMA', titol: 'Memòria cau de fragments & SW', enllac: 'https://web.dev/articles/sw?utm=x#a',
    autor: 'web.dev', dataIso: '2026-11-17T08:00:00Z', resumVal: 'Resum curt.', aplicacioSocDePoble: 'Al Lector.',
    aplicacioWordPressMestre: 'Al connector.'
  },
  {
    hash: 'b'.repeat(64), veredicte: 'GUARDAR_VIGILANT_WP', titol: 'Nova capçalera CSP', enllac: 'https://ayudawp.com/csp/',
    autor: 'Fernando Tellado (AyudaWP)', dataIso: '2026-11-16T08:00:00Z', resumVal: 'Vigilar.', aplicacioSocDePoble: '',
    aplicacioWordPressMestre: 'Mirar Vigilant.'
  },
  { hash: 'c'.repeat(64), veredicte: 'DESCARTAR', titol: 'Soroll', enllac: 'https://emowe.com/x/', autor: 'Max', dataIso: '2026-11-15T08:00:00Z', resumVal: 'Res.' },
  { hash: 'd'.repeat(64), veredicte: 'ALTRE', titol: 'Fals', enllac: 'https://emowe.com/y/', autor: 'Max', dataIso: '2026-11-14T08:00:00Z', resumVal: 'X.' }
]);

/* El canal que escriu el motor per a PECES, el 18-11-2026 a les 00:00 UTC. */
export const RSS_OBSERVATORI = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>Observatori Sobirà de Mestres · Sóc de Poble</title>
    <link>https://socdepoble.org/</link>
    <description> Destil·lat tècnic filtrat pel Sedàs Cognitiu del Node 0 amb Oblit Saludable (zero soroll comercial).</description>
    <language>ca</language>
    <lastBuildDate>Wed, 18 Nov 2026 00:00:00 GMT</lastBuildDate>
    <item>
      <guid isPermaLink="false">sdp-obs-aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa</guid>
      <title>[PROPOSAR_IDEA_SISTEMA] Memòria cau de fragments &amp; SW</title>
      <link>https://web.dev/articles/sw?utm=x#a</link>
      <dc:creator>web.dev</dc:creator>
      <pubDate>Tue, 17 Nov 2026 08:00:00 GMT</pubDate>
      <description>[PROPOSAR_IDEA_SISTEMA] Resum curt. · Sóc de Poble: Al Lector. · WordPress Mestre: Al connector.</description>
    </item>
    <item>
      <guid isPermaLink="false">sdp-obs-bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb</guid>
      <title>[GUARDAR_VIGILANT_WP] Nova capçalera CSP</title>
      <link>https://ayudawp.com/csp/</link>
      <dc:creator>Fernando Tellado (AyudaWP)</dc:creator>
      <pubDate>Mon, 16 Nov 2026 08:00:00 GMT</pubDate>
      <description>[GUARDAR_VIGILANT_WP] Vigilar. · WordPress Mestre: Mirar Vigilant.</description>
    </item>
    <item>
      <guid isPermaLink="false">sdp-obs-cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc</guid>
      <title>[DESCARTAR] Soroll</title>
      <link>https://emowe.com/x/</link>
      <dc:creator>Max</dc:creator>
      <pubDate>Sun, 15 Nov 2026 08:00:00 GMT</pubDate>
      <description>[DESCARTAR] Res.</description>
    </item>
    <item>
      <guid isPermaLink="false">sdp-obs-dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd</guid>
      <title>[ALTRE] Fals</title>
      <link>https://emowe.com/y/</link>
      <dc:creator>Max</dc:creator>
      <pubDate>Sat, 14 Nov 2026 08:00:00 GMT</pubDate>
      <description>[ALTRE] X.</description>
    </item>
  </channel>
</rss>
`;
