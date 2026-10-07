---
type: document
status: actiu
description: Contingut de la nova publicació "El Xat" i prompt per a Nano Banana
---

# Nova Publicació: El Xat (Substitució de L'Ànima de la IAIA)

Aquest document recull la preparació per a la següent ronda d'implementació, on substituirem la publicació fundacional "L'Ànima de la IAIA" per una nova pàgina universal anomenada "El Xat". 

Aquesta pàgina tindrà un doble objectiu:
1. Eliminar la publicació antiga que descol·locava l'usuari.
2. Explicar què és el Xat de Sóc de Poble (una rèplica exacta de WhatsApp) perquè l'usuari no tinga por de fer-lo servir.

---

## 1. Prompt Visual per a Nano Banana (Imatge de Portada)

*Copia i enganxa aquest prompt a Nano Banana per generar la imatge.*

```text
A vibrant, full-bleed illustration (no white borders, no frames) in the classic 1970s Spanish comic book style of Editorial Bruguera (similar to Francisco Ibáñez's Mortadelo y Filemón). The art style should not be too perfect or polished; it needs that slightly "gamberro", rough, and hand-drawn humorous feel of classic Bruguera.

SCENE: Una escena caòtica i divertida dins d'una casa de poble o un carrer de La Torre de les Maçanes. Una uela (IAIA) moderna amb davantal i monyo blanc està asseguda a la fresca amb un telèfon mòbil, rient a riallades. Al seu voltant, diversos veïns (el carnisser, el llaurador, joves i majors) es comuniquen a crits o amb mòbils vells i moderns connectats per fils invisibles o bafarades de conversa.

CHARACTERS: Personatges d'estil Bruguera (nassos grossos, expressions exagerades però amables). La IAIA com a personatge central. Ningú ha de tindre una expressió grotesca o de terror, tots amables i còmics. 

TEXT: Any text or speech bubbles MUST be written in Valencian (e.g. "Xe, quin xat!", "Com a casa!"). The font used in the speech bubbles must be a hand-drawn comic-book style font.

COMPOSITION: The main action (La IAIA with the phone) MUST be perfectly centered in the middle of the image, allowing for easy cropping on the sides. The background should show classic rural elements: testos, cadires al carrer, algun gosset simpàtic.

STYLE: Humorous, highly detailed cartoon line-art, flat but vibrant colors, expressive and dynamic poses, classic European comic style. Slightly unpolished, "gamberro" vibe. FULL BLEED, NO BORDERS.
```

---

## 2. Contingut de la Publicació (JSON per a `pageContent.js`)

Quan implementem el canvi al codi (idealment en la mateixa ronda que la neteja de la Sidebar i la Galeria), canviarem la clau i actualitzarem les proves que hi apunten. Aquest serà el contingut:

```json
  "xat": {
    "date": "2026-10-07T00:00:00.000Z",
    "title": "El Xat",
    "subtitle": "Parla amb la teua gent amb la tecnologia de casa",
    "lead": "Hem integrat un sistema de missatgeria clavat a WhatsApp. Sense descarregar aplicacions noves, sense configuracions estranyes i amb la garantia que les teues dades es queden a casa.",
    "image": "/assets/uploads/brain/[NOM_DE_LA_IMATGE_DE_NANO_BANANA].png",
    "imageWidth": 1024,
    "imageHeight": 1024,
    "imageFetchPriority": "high",
    "imageAlt": "Il·lustració d'estil Bruguera del Xat de Sóc de Poble",
    "labels": [
      {
        "text": "Comunicació",
        "className": "sdp-badge-system"
      },
      {
        "text": "Eina",
        "className": "sdp-badge-category"
      }
    ],
    "html": "\n      <h3>Com a casa, com a WhatsApp</h3>\n      <p>Sabem que la tecnologia pot ser aclaparadora. Per això, quan vam dissenyar el Xat de Sóc de Poble, vam prendre una decisió molt clara: <strong>no inventarem la roda</strong>.</p>\n      <p>El nostre xat té la mateixa estructura, els mateixos botons i el mateix funcionament que el WhatsApp que ja fas servir cada dia per parlar amb la família. Si saps enviar un missatge per WhatsApp, ja saps fer servir el Xat de Sóc de Poble.</p>\n      \n      <h4>Per què un xat propi?</h4>\n      <ul>\n        <li><strong>Privacitat absoluta:</strong> Les teues converses del poble, avisos i comunicacions amb els negocis locals es queden als servidors del projecte, no en mans de megacorporacions internacionals.</li>\n        <li><strong>Integració total:</strong> Des del xat pots reservar al bar, preguntar si la panaderia té pa, o avisar que s'ha perdut un gosset, tot sense eixir de Sóc de Poble.</li>\n        <li><strong>Evolució constant:</strong> Ara mateix tens allò bàsic per a parlar i compartir, però a poc a poc anirem implementant noves funcionalitats (notes de veu, imatges, etc.) sempre respectant l'estil que ja coneixes.</li>\n      </ul>\n\n      <h4>Entra i saluda!</h4>\n      <p>Pots parlar amb la <strong>IAIA MarIA</strong> per resoldre qualsevol dubte sobre el funcionament de la plataforma, o entrar directament al canal del teu poble per vore què s'està coent hui.</p>\n      <p>No tingues por de tocar botons, l'hem construït perquè siga indestructible. Som-hi!</p>\n    "
  }
```

## 3. Accions necessàries (Per a la següent ronda d'implementació)

1. Enviar el prompt a Nano Banana i guardar la imatge generada.
2. Substituir `"anima"` per `"xat"` a `src/sections/text/pageContent.js`.
3. Actualitzar els fitxers de tests (ex: `paginaDeText.test.js`, `editorial.test.js`, `TextSection.test.jsx`, `ConnectarSection.test.jsx`) perquè busquen les dades de `"xat"` en lloc de `"anima"`.
4. Afegir un botó d'acció "Anar al Xat" a la UniversalPage per tal de saltar directament cap a `/xat`.
