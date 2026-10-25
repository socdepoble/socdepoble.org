---
type: acta
status: esborrany
description: 'Acta Marmota de tancament del Gauntlet Loop: 8 passades completades, 3.391 proves verdes, xat fluid WhatsApp, taules contingudes i consens favorable del Trio (amb condicions de govern i segell)'
tags:
  - acta
visibility: private
reflex: sdp:torn_bbf668c4-5c94-4975-9f24-bd30e4900bb6:1e183628-5717-4065-90bd-300734e570ed
---
# Acta Marmota · Triomf del Gauntlet Loop de 4 Hores, Xat Fluid i Blindatge WordPress

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_bbf668c4-5c94-4975-9f24-bd30e4900bb6:1e183628-5717-4065-90bd-300734e570ed |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T15:03:47.843Z |
| Modificació | 2026-10-25T15:05:00.000Z |
| Propietari | iaia-maria |
| Aprovació humana | aprovada pel Mestre Javi Llinares (Àudios 05:27, 06:01, 15:52, 16:01) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | iaia-maria-antigravity |
| Tokens consumits | ~35.000 (Colmena: ~15M tokens) |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 d0a64c35b75833b88ea561903829fb02558db7be214a9ee5844045cafc1333a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- 2026-10-25T15:03:47.843Z: esborrany creat.
- 2026-10-25T15:05:00.000Z: acta completada amb el balanç del Gauntlet Loop de 4 hores (8 passades), 3.391 proves verdes, xat fluid estil WhatsApp, taules adaptatives en 385px, blindatge WordPress i consens favorable del Trio (amb dictamen condicionat de Codex per a govern i segell).

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Triomf del Gauntlet Loop de 4 Hores (8 Passades Completades)
- **Codex Sol Ultra:** Va executar les 8 de les 8 passades programades del Gauntlet Loop. Va analitzar la concurrència, timeouts i fanout, va cancel·lar el cron de fons automàticament i va lliurar l'informe `261025_0607_auditoria_codex.md` (82 KB). Emet un dictamen tècnic **favorable al codi i condicionat per al commit** (preservant amb prudència les reserves sobre WM1/WM2 de la funció d'Apple com a peça protegida, el deute previ del segell de govern i la necessitat d'acreditar la producció real sense fabricar falsos verds).
- **Claude Opus 5.5:** Va mobilitzar 49 subagents en 5 workflows (més de 12 milions de tokens) i va analitzar 10 dimensions d'auditoria adversarial amb enginyeria inversa REA, tancant 48 elements al codi en l'informe `261025_0610_auditoria_claude.md` (35 KB).
- **Gemini 4 Argon:** Va auditar la integració total, va certificar la convivència del diff combinat (+3.417 / −545 línies en 74 fitxers), va validar les portes i va emetre el vistiplau per al commit a `261025_0545_auditoria_gemini.md` (25 KB).
- **Bateria de Proves Verificada:** `npm run test:precommit` assoleix **3.132 proves de Vitest + 259 proves de Node (3.391 proves en total), amb ZERO fallades**.

### 2. El Xat WhatsApp Rural Impecable (`src/sections/xat/`)
- **Ordre monotònic (`C0545-X1`):** A `missatges.js:376`, una confirmació amb `seq` inferior ja no corromp l'últim `seq` ni les metadades del missatge.
- **Protecció d'esborranys (`C0545-X2`):** A `Conversa.jsx`, si l'enviament del missatge A falla mentre l'usuari escriu el missatge B, B es conserva netament sense ser trepitjat.
- **Fusió d'snapshot inicial (`C0545-X3`):** A `XatContext.jsx`, les confirmacions ràpides que arriben abans de la resolució de l'historial inicial es fusionen sobre l'estat previ i no sobre una llista buida.
- **Termini de seguretat RPC de 30s (`CUR-02`):** A `xat.js`, incorporat `ambSenyal` amb límit de 30.000 ms per evitar que una crida bloquejada congele la cua FIFO d'enviaments.
- **Recuperació Realtime (`CUR-03` / `CUR-06`):** Gestió resilient de subscripcions amb fanout únic, handles opacs i reobertura neta després de fallades de xarxa o canvis de pestanya (`pageshow` des de bfcache).
- **UX Noble:** Manteniment del focus al camp de text després d'enviar (`XU-01`) i ancoratge suau de l'scroll a baix amb `ResizeObserver` (`XU-05`) sense atrapar l'usuari que llig cap amunt.

### 3. Taules Adaptatives i Fi dels Desbordaments
- Les taules d'`EspecimenGestor.jsx`, `EspecimenInventariGlobal.jsx` i `EspecimenUniversalWorkspace.jsx` incorporen contenidors accessibles amb `role="region"`, `tabIndex={0}` i scroll horitzontal contingut, evitant que cap graella trenque la columna de 385px a les vistes de 3 columnes de Pedra Seca.

### 4. Connector de WordPress Fortificat
- **Alineació d'identitat (`WP-01`):** L'empaquetador `wordpress-plugin/eines/empaqueta.mjs` i el fitxer `includes/actualitzador.php` s'alineen sota el mateix slug canònic (`socdepoble`), recolzat per proves unitàries automàtiques.
- **Aïllament i puresa:** Shadow DOM tancat, zero importacions de backend privatiu (únicament `src/host.js:172`), guardes PHP per grandària de cos (32 KB) i signatura criptogràfica Ed25519 intacta sobre els bytes exactes.

### 5. Blindatge contra ReDoS i Proves Adversarials
- Substituïts els patrons de cerca vulnerables per escàners estrictament lineals $O(n)$ a `gestor.js`, `html.js`, `xml.js`, `extractorIdentitat.js`, `enllacos.js` i `lector.js`.
- Afegits 21 fitxers nous de proves adversarials de seguretat i regressió (`*.seguretat.test.js` / `*.gauntlet.test.jsx`).

### 6. Sobirania i Aprovació dels 7 Sentinelles
- El Mestre Javi Llinares ha aprovat en bloc des del panell de desenvolupament els 7 Sentinelles d'autonomia: *Sentinella Estructural*, *Sentinella Triturador Financer*, *Sentinella Policia del Disseny*, *Sentinella Cònsol de Vendes*, *Sentinella Enllaç del Torn*, *Sentinella Auditoria d'Aparador* i *Sentinella Detectiu del Poble*. Cap bloqueig de permisos actiu.

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. **Commit Consolidat del Gauntlet Loop:**
   - Fer `git commit` dels 74 fitxers a la branca `backup-notes-publish` agrupant el xat fluid, les taules adaptatives, el blindatge de WordPress i les 21 proves adversarials noves (excloent `.immunitari/cron.out`).
2. **Push Remot:**
   - Sincronitzar la branca a `fork/backup-notes-publish`.
3. **Decisions de Producció del Mestre:**
   - Definir el proveïdor de notificacions push mòbils.
   - Decisió sobre la versió pont del canal propi de WordPress per a instal·lacions antigues.
4. **Higiene Final:**
   - Executar `node tooling/gates/tancament.mjs` per segellar la sessió sense brossa.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
