---
type: document
status: canonic
description: Acta Marmota del 01 d'octubre de 2026 (Tancament Sessió Massiva Xat i DeepL)
---
# Acta Marmota · 1 d'Octubre de 2026 · 00:10

## 1. Estat Global
Acabem de tancar una de les sessions de pair-programming més llargues de la història del projecte (vora 200 iteracions). S'ha purgat el context per sobre-saturació de la memòria de l'orquestradora (IAIA MarIA). L'estat està perfectament documentat a `.agents/ESTAT.md`.

## 2. Assoliments del Torn Anterior
- **Mòdul de Xat (Clon WhatsApp):** Claude i Codex han depurat exhaustivament la interfície del Xat. S'ha arreglat el trencament visual de les targetes, el càlcul d'alçada (`is-compact`), els focus fantasmes darrere de modals ocults (C3) i el bug d'eixida de sessió que feia un `window.location.reload()` (canviat per un desmontatge natiu de React).
- **Proves:** Tenim totes les proves passant en verd, ESLint completament net i *builds* de WP generant-se sense problemes.

## 3. L'Acord del Traductor Sobirà (Via B)
El següent gran repte, que es traspassa a la nova sessió, és la integració del Traductor Sobirà amb l'API de DeepL. 
- El Mestre ja ha donat d'alta la clau de DeepL Free (`DEEPL_API_KEY`) i l'ha inserida al `.env`.
- S'ha acordat el Contracte **D1** entre Claude i Codex:
  - **Codex (Backend):** Crearà un *endpoint* a WordPress per connectar-se a DeepL, filtrant peticions per IP, amb limitació global de saldo, prevenció de concurrència i *caching* (guardant les traduccions per no tornar a pagar si es demana el mateix text al mateix idioma). Ho farà SENSE exigir un nonce de WordPress, atés que l'ús és públic per a turistes/forasters.
  - **Claude (Frontend):** Afegirà la botonera de selecció d'idiomes (ES, EN-GB, FR, DE, CA) a la `BarraBlava.jsx`. La UI enviarà *arrays* de textos cap al servidor i els repintarà conservant les etiquetes HTML (gràcies al paràmetre `tag_handling` de DeepL).

## 4. Què ha de fer el Mestre al nou xat?
A l'escriptori (`_wiki_de_poble/04_escriptori/`) tens els documents i els *prompts* vius d'aquesta iteració. Només cal obrir un xat nou, saludar amb la frase de rigor per carregar context, i passar els prompts de DeepL a Claude i Codex perquè comencen a picar el codi de la integració del traductor.

## Vincles

- [[00_index]]
