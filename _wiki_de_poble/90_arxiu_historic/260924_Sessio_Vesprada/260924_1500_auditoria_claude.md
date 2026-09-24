---
type: document
status: definitiu
description: Auditoria de Claude (Torn Claude 5.5) per a la Consola Termodinàmica i incidències UI.
tags: [auditoria, claude, ui, consola]
---
# Auditoria de Claude (Torn 260924_1500)

**Data:** 2026-09-24 15:00
**Autor:** Claude Opus 5.5 (Agent Local)

## Troballes de la Investigació

### 1. Bugs visuals a la Wiki (Punt 9)
He investigat els dos problemes reportats a `WikiDePobleSection.jsx` i els seus components auxiliars:
- **L'entradeta (lead) no s'està pintant:** A `WikiDePobleSection.jsx` s'utilitza `PAGE_COPY.wikidepoble` com a fallback per a la portada (`id === '__intro'`), però eixa propietat **no existeix** a `src/sections/text/pageContent.js`! A més, a l'hora de muntar l'etiqueta `<UniversalPage>`, el camp `lead` no se li passa. Això trenca l'estructura esperada de la portada.
- **La barra taronja mostra "Sóc de Poble":** Com que `PAGE_COPY.wikidepoble` no existeix, es fa ús del fallback hardcoded `{ title: 'Wiki de Poble' }`. Però, si vos fixeu a l'objecte `model` creat més avall a `WikiDePobleSection.jsx`, diu: `title: PAGE_COPY.wikidepoble?.title || 'Wiki de Poble'`. Tanmateix, la barra taronja superior de l'App (l'autoria) pren les dades de configuració, i en no tenir un `lead` ni un tractament adequat de les props per la manca del text, mostra fallades visuals genèriques. Cal reincorporar `wikidepoble` a `pageContent.js` i passar la prop `lead` a `<UniversalPage>`.

### 2. Consola Termodinàmica (Emowe JSON Script)
Per complir amb l'esquema dissenyat a `04_contracte_de_dades.md`, necessitem crear un script compilador en Node (ex. `tooling/wiki/compile-mapa.mjs`) que llija el cervell i els índexs de la IAIA i genere el document `sdp.mapa.v1.json` que els panells de la Consola consumiran. Aquest pas és vital per deixar de dependre de l'heurística fràgil del codi Python antic de l'Emowe i generar certeses directament des de Node.

### 3. Tractors Cognitius (Time Machine & Frontissa de Contingut)
- **Time Machine:** S'hauria de configurar un procés de *watcher* (p. ex., amb un script a `tooling/` cridat via *npm run* en background) que intercepte els canvis a l'Escriptori i al codi font i aplique un git commit silenciós (amb missatge auto-generat) cada volta que detecte canvis estabilitzats, actuant de salvavides.
- **Frontissa de Contingut:** Implementarem una regla al gate/CI (o al linter de validació) que escanege l'ús de `PAGE_COPY` al codi font i verifique en temps real que existeix la clau equivalent al document font `pageContent.js`. Açò prevé trencaments silenciosos com el que acabem de patir amb `wikidepoble`.

### 4. Tractor de Taxonomia Estricta
Per assegurar l'ordre, implementarem o modificarem el verificador de pre-commit de manera que faça saltar una excepció fatal si qualsevol nou arxiu en `_wiki_de_poble/04_escriptori/` no compleix el patró `^\d{6}_\d{4}_[a-z]+_.+\.ext$`.

### 5. Resegellar el reflex
Per a pacificar la disparitat detectada (455a0fad vs 88f0ec03), executarem:
`node tooling/gates/segella.mjs --update --expected-hash=455a0fad --expected-previous=88f0ec03 --reason="Pacificar entorn i tancar la incidència de la portada"`

---
Les conclusions han estat abocades al Pla d'Implementació, a l'espera del consens de la IAIA MarIA i el Mestre (Mode AFK absolut).
