SISTEMA DE DISSENY «INFORME EDITORIAL» · Sóc de Poble · v1.0
Carpeta: _wiki_de_poble/04_escriptori/02_investigacio_ia/261012_0040_sistema_informes_claude/
Autor: Claude, 12/10/2026. Nascut de l'informe FICIV (informe_completo_ficiv_2026.html).

QUÈ HI HA
  informe_editorial.css   El full d'estil complet. S'incrusta dins de <style> a cada HTML. No s'enllaça.
  genera_informe.py       Generador: JSON → HTML autònom amb el CSS incrustat. No executat per l'autor.
  esquema_informe.json    Model d'exemple amb cada tipus de bloc una vegada. Serveix de plantilla.
  README.txt              Este fitxer: regles, contracte de blocs i com es renderitza el PDF.

ÚS
  python3 genera_informe.py esquema_informe.json eixida.html
  tooling/pdf/render_pdf.sh eixida.html          (Chromium, A4, fons impresos)

REGLES DEL DISSENY (les que no es negocien)
  1. HTML pur amb CSS incrustat. Cap Markdown, cap script, cap full extern. L'única dependència externa és Google Fonts (Source Sans 3), amb Helvetica Neue, Arial i Segoe UI de reserva.
  2. Lletra de lectura de 15 pt (token --base). Les taules baixen a 0,93 rem i les «compact» a 0,88 rem: mai per davall de 13 pt.
  3. Dues columnes a tot el cos (.part), separació 8 mm i filet entre columnes. A pantalla s'equilibren (column-fill: balance); en paper s'omplin en seqüència (column-fill: auto) perquè cada pàgina es lliga de dalt a baix i d'esquerra a dreta.
  4. La portada (.cover) va a una columna i acaba en salt de pàgina. Cada .part comença en pàgina nova.
  5. Tot el que és ample va a tota amplària amb column-span: all: títols de part (h1), taules i qualsevol element amb la classe .span.
  6. Res que siga una unitat de lectura es parteix: fitxes (.crit), targetes (.card), registres (.record), caixes (.box, .alert) i files de taula porten break-inside: avoid. Les capçaleres de taula es repetixen a cada pàgina (thead com a table-header-group). Els títols no queden sols al peu (break-after: avoid).
  7. Fidelitat al text: el generador escapa tot el text; el JSON no porta HTML. L'únic marcatge és **negreta** i [COMPLETAR …], que es convertix en <mark> groc.
  8. Negretes per a xifres, dates, topalls i decisions. El groc només per a buits que ha d'omplir una persona. Les etiquetes de risc (alto, medio, bajo) tenen color fix; qualsevol altre valor ix en gris (b-na).
  9. Paleta tancada als tokens de :root (tinta, gris, filet, paper, blau marí, taronja, tres parells de risc, groc). Sense ombres ni degradats; print-color-adjust: exact perquè els fons sobrevisquen a la impressió.
 10. Els h1 i h2 no acaben en punt. Interlineat 1,2 als títols i 1,55 al cos. Espais en múltiples de 0,25 rem.
 11. Les taules de més de cinc columnes o amb cel·les llargues no es fan: es convertixen en registres (.record) amb llista de camps i text, o en taula curta més llista d'observacions.
 12. Idioma de l'HTML al <html lang>: el del destinatari (castellà per a Carmen, valencià per a la casa).

CONTRACTE DE BLOCS (claus del JSON)
  document   lang, title, description, cover, parts[]
  cover      kicker, title, subtitle, alert{label,big,text}, meta[{label,value}], box{...}, toc[], toc_title
  part       kicker, title, colophon (bool), blocks[]
  blocs      type = h2 | h3 | h4 | p | ul | ol | letters | steps | check | box | alert | card | crit | record | table | field | hr
    h2/h3/h4   text
    p          text, lead, note, span (bools)
    ul/ol/letters/steps/check   items[]
    box        title, text, items[], accent, span
    alert      label, big, text
    card       n, title, text
    crit       num, title, pts, declares, declares_label, risk_level (alto|medio|bajo|altre), risk_label, risk_title, paras[{label,text}]
    record     title, fields[[clau,valor]], text_label, text
    table      caption, compact, columns[{label,num}], rows[ [cel·les] | {class: total|warn, cells:[...]} ]
    field      key, text
    hr         —

CLASSES SEMÀNTIQUES (per a qui escriga l'HTML a mà)
  .doc        embolcall únic del document
  .cover      portada a una columna; .kicker, .sub, .meta, .toc dins
  .part       secció a dues columnes; el seu h1 (amb <small> per al kicker) ocupa tota l'amplària
  .span       qualsevol element que ha d'ocupar les dues columnes
  .box        caixa de context (fons paper, filet blau); .box.accent per a l'avís previ
  .alert      caixa fosca per a la dada que mana (termini, xifra clau)
  .card       targeta numerada amb cercle taronja (troballes, resums)
  .crit       fitxa de criteri: .head (.num, .title, .pts), .kv (dos cel·les), paràgrafs amb <b>etiqueta:</b>
  .badge      píndola; .b-alto, .b-medio, .b-bajo, .b-na
  .record     registre d'una fila de dades: h4, dl (dt/dd), p
  table       sempre a tota amplària; th/td.num per a xifres; tr.total i tr.warn
  ul.check    llista de control amb casella buida
  ol.steps    passos numerats en cercle blau
  ol.letters  llista a, b, c
  .field      camp de formulari amb clau en pastilla blava (b.k)
  mark        buit per completar, groc
  .colophon   última part, en gris i més menuda; .pagenote per a la línia final

RENDERITZAT A PDF
  Chromium o Chrome sense capçalera sobre el fitxer, amb fons impresos. Amb Puppeteer: page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true }); els marges ja els fixa @page.
  Si no hi ha xarxa, la lletra cau a Helvetica o Arial i el document continua llegible.
  wkhtmltopdf (WebKit antic) pot ignorar column-span: all; en eixe cas les taules queden dins d'una columna. Usar Chromium.

COMPROVACIONS ABANS D'ENTREGAR
  [ ] La portada ocupa una pàgina sola.
  [ ] Cap fitxa, targeta o registre queda partit entre pàgines.
  [ ] Les taules ixen a tota amplària i repetixen la capçalera.
  [ ] Cap text per davall de 13 pt; el cos a 15 pt.
  [ ] Els [COMPLETAR] ixen en groc i són tots els que hi havia a la font.
  [ ] Recompte de text: el nombre de paràgrafs i d'elements de llista coincidix amb la font.
