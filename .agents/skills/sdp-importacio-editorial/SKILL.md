---
type: skill
status: canonic
description: Tractor cognitiu per a importar, transformar i millorar notícies, esdeveniments, cursos i cròniques des de WordPress, Blogger i webs municipals cap a la maquetació Pedra Seca (UniversalCard + UniversalPage).
tags:
  - identitat
  - skills
name: sdp-importacio-editorial
triggers_on:
  - importar notícia
  - importar wordpress
  - importar blogger
  - socdepoble.net
  - elrentonar.blogspot.com
  - pep cascant
  - coordinadora estudis eolics
  - oli de la torre
  - transformar article
contracte.llig:
  - .agents/skills/sdp-pedra-seca/SKILL.md
  - .agents/skills/sdp-universal-page/SKILL.md
  - .agents/skills/core-llegibilitat-text/SKILL.md
  - .agents/skills/core-maquetacio-markdown/SKILL.md
contracte.escriu:
  - src/sections/mur
  - src/sections/text
  - src/sections/multimedia/censImatges.js
  - public/assets
---
# 📰 Importació i Transformació Editorial · Pedra Seca (`sdp-importacio-editorial`)

Aquest tractor estandarditza la recuperació, neteja i transformació de notícies, cursos, esdeveniments i cròniques procedents de sistemes externs (WordPress, Blogger, webs municipals i associatives) per convertir-los en publicacions **més atractives, més didàctiques i 100% conformes amb l'arquitectura Pedra Seca** (`UniversalCard` + `UniversalPage`).

## 1. Mapa d'Importacions Estratègiques Previstes

1. **`socdepoble.net` (WordPress històric de Sóc de Poble):** Articles tecnològics, memòries del projecte, jornades i tallers. Signatura per defecte: `Sóc de Poble` (`author_entity_id: 'socdepoble'`).
2. **`elrentonar.blogspot.com` (Blogger històric d'El Rentonar):** Cròniques socials, mediambientals, de patrimoni agrari, senderisme i pedra en sec. Signatura: `El Rentonar` (`author_entity_id: 'rentonar'`).
3. **`Oli de La Torre`:** Fitxes de producte d'oli d'oliva verge extra, collites, analítiques i cultura oleícola de La Torre de les Maçanes. Signatura: `Oli de La Torre` (`author_org_id: '3073b933-69fc-4c3e-80dc-b0df9c6b8391'`).
4. **`Coordinadora d'Estudis Eòlics del Comtat`:** Al·legacions, mapes d'impacte paisatgístic, aplecs pel territori i informes científics. Signatura: `El Rentonar` / `Coordinadora d'Estudis Eòlics`.
5. **Blogger de `Pep Cascant`:** Articles i assajos de l'autor dels llibres *L'Èxit de l'Olivera*, *El Blat* i *El Raïm* sobre trilogia mediterrània, història agrària i cultura del camp.
6. **Webs municipals i institucionals (ex. `vilademuro.net`, Portal Agrari GVA, ajuntaments de la comarca):** Cursos, bans, convocatòries i agenda comarcal transformats amb redacció pròpia i citació canònica de la font.

## 2. Regles d'Or de la Transformació («Millorar la Font, Mai Copiar el Desordre»)

Les webs d'origen (WordPress antics, Blogger, portals institucionals) solen portar HTML brut, PDFs incrustats que no es lliguen en mòbil, absència de subtítol (`H2`) o d'entradilla (`lead`), i vídeos pesants sense pòster. En importar qualsevol peça cal aplicar sempre aquests 7 passos:

1. **Preservació Exacta del Temps Històric (`created_at` i `publish_date`):**
   - Extreure de les metadades de la font (`article:published_time`, JSON-LD de WordPress/Blogger o capçalera de l'entrada) el **timestamp ISO 8601 exacte amb fus horari** (ex. `2026-09-18T11:32:23+00:00`).
   - Quan l'element és un acte d'agenda o curs (`type: 'event'`) que es vol ordenar al `/mur` per la data en què es va publicar la notícia mentre conserva les seues dates d'execució al `/calendari`, activar **`boinaDataPublicacio: true`** juntament amb `inici` i `fi`.
2. **Separació Editorial d'Autoria (`El Rentonar` vs `Sóc de Poble` vs Autors):**
   - **El Rentonar** (`author_entity_id: 'rentonar'`) signa les publicacions socials, culturals, ecologistes, de patrimoni i territori.
   - **Sóc de Poble** (`author_entity_id: 'socdepoble'`) signa les publicacions tecnològiques, d'arquitectura digital, versions i programari lliure.
   - Els autors personals o productors locals signen amb la seua identitat corresponent del padró.
3. **Anatomia Obligatòria de `UniversalCard` i `UniversalPage`:**
   - **Títol (`H1` a pàgina / `H3` a card):** Clar, directe i sense punt final.
   - **Subtítol (`H2` taronja a pàgina / `H4` a card):** Context didàctic que explica el valor de la notícia en una línia.
   - **Entradilla (`lead` / `entradilla`):** Resum executiu de 2–3 frases. Si la targeta porta un **vídeo vertical protagonista**, activar `ometEntradillaTargeta: true` a la card perquè al `/mur` es pinte només `Títol + Subtítol + Quadrat Negre` i l'alçada quede compensada amb les targetes veïnes; l'entradilla completa es mostra en entrar a la `UniversalPage`.
   - **Cos estructurat (`<h3>`, `<p>`, `<ul>`, `<figure>`):** Convertir paràgrafs plans o caòtics de WordPress/Blogger en seccions didàctiques amb encapçalaments `<h3>`, llistes clares i escaneig ràpid amb **`<strong>`** en les dades clau (`core-llegibilitat-text`). Tots els botons d'acció (`.sdp-accions`) i files de píndoles (`.badge-row`) han d'anar **sempre centrats**.
4. **Quadrat Negre (`SquareBadge` / `calendar_badge`) per a Esdeveniments d'1 Dia o Multi-dia (Cursos/Jornades):**
   - Acte d'1 sol dia: `date: 'AAAA-MM-DD'` genera automàticament el dia, mes i any al quadrat de `128×128 px`.
   - Curs o esdeveniment de diversos dies: definir `inici: 'AAAA-MM-DD'`, `fi: 'AAAA-MM-DD'`, `date_label` descriptiu per a la píndola de detall, i `calendar_badge: { dia: '23–14', mes: 'OCT–NOV', any: '2026', dateTime: '2026-10-23', label: '...' }`. `SquareBadge` ajusta automàticament la mida tipogràfica (`data-mida`).
5. **Conversió de PDFs i Cartells a `.webp`, Inspecció Visual Obligatòria (`read_file`) i Registre al Cens d'Imatges:**
   - Cap PDF o imatge pesada d'origen s'incrusta en cru. Es renderitza a alta resolució i es converteix a **`.webp`** dins de `public/assets/...`, registrant cada fitxer a `src/sections/multimedia/censImatges.js` i verificant `npx vitest run src/sections/multimedia/censImatges.test.js`.
   - **Inspecció Visual Obligatòria:** Molts PDFs d'ajuntaments i entitats són cartells dissenyats com a imatge (sense capa de text per a `pdftotext`). És **obligatori llegir visualment amb `read_file` cada `.webp` generat** per extreure'n amb exactitud els noms propis (ex. professora **Ivana Ponsoda Revert**), horaris de cada sessió, organisme organitzador real (ex. **EEA Llutxent**, telèfon i correu) i no inventar mai dades.
6. **Elecció Intel·ligent i Temporal d'Imatge SEO (`triaImatgeSeo` + `tooling/seo/tria-imatge-seo.mjs`):**
   - **Prohibit usar una captura genèrica del vídeo per al SEO (`og:image`) quan hi ha cartells o imatges informatives reals:** El fotograma del vídeo (`_poster.webp`) pot servir com a `poster` del reproductor `<video>`, però per a compartir per WhatsApp/Telegram (`og_image`) s'ha de triar un cartell o imatge informativa real del cos.
   - **Regla de Vigència Temporal Multi-data (`tooling/seo/triaImatgeSeo.js`):** Quan una publicació anuncia diverses tandes o edicions amb dates pròpies (ex. primera tanda a Fageca a l'octubre i segona tanda a Alcosser al novembre), el selector `triaImatgeSeo(item, { ara })` compara la data actual amb la data final (`fi`) de cada tanda:
     - Si la primera tanda **ja ha passat** (`fi < ara`), selecciona automàticament **la imatge de la següent tanda vigent o futura** (`fi >= ara`, ex. el cartell d'**Alcosser** del 6, 7 i 14 de novembre).
     - Si totes les tandes són futures, selecciona la primera; si totes ja han passat, conserva la primera com a testimoni històric.
   - **Generació de la Variant Social per a WhatsApp (`-social-1200x630.jpg`):** WhatsApp no renderitza WebP a `og:image` ni imatges de més de 300 KB. Executar `node tooling/seo/tria-imatge-seo.mjs --genera-variants` per retallar automàticament les vores blanques, enfocar l'encapçalament informatiu del cartell i generar `<nom>-social-1200x630.jpg` (JPEG baseline `1200×630`, `≤ 300.000 B`, sense segment `APP1` EXIF/XMP) registrat a `VARIANTS_SOCIALS` (`src/config/imatgeSocial.js`).
7. **Vídeos i Arxius Pesants al Servidor Sobirà del Node 0 (`https://socdepoble.cat/media/`):**
   - Els vídeos divulgatius o arxius pesants (> 5 MB) no engreixen el bundle de Git/Vercel: es publiquen a `/Users/javillinares/socdepoble-node0/media/` (servit per `https://socdepoble.cat/media/` amb suport `HTTP 206 Partial Content` i manifest signat Ed25519 `https://socdepoble.cat/media/manifest.json`), amb un fotograma `.webp` lleuger com a `poster` (`image_url`) i la propietat `video_url` validada per `esFontVideoPropia`.
8. **Citació Canònica de la Font i Llicència de Drets:**
   - Quan es transforma una notícia d'una altra web (ajuntament, institució, blog), és obligatori incloure al final del cos una secció `<h3>Font original i avís de drets</h3>` amb l'**enllaç directe a la URL original** i declarar al camp `copyright` tant la font primària com la llicència de la redacció pròpia (`Font original: [Nom] ([domini]) · Redacció pròpia CC BY-NC-SA 4.0 [Autor] / Sóc de Poble`).
9. **Preservació del Disseny Editorial d'Origen: Imatge Principal a la Hero i Arxius Multimèdia amb Mida i Alineació Pròpia (`Esquerra`, `Dreta`, `Centre`) sense Estirar (`P0-35 / IDEA-152`):**
   - **Imatge Principal sempre a la Hero (`heroImage` / `image_url`), mai ocultada ni relegada al cos:** La imatge o segell principal d'una publicació (ex. el segell circular del *Manifest de Poble*, `/assets/mur/manifest-de-poble/logo-manifest-de-poble-retallat.webp`) ha d'anar **sempre** com a imatge protagonista a la Hero superior de la `UniversalPage` (`getImage(item)` de `detailSectionMeta.jsx` mai ha de retornar `null` per a ometre-la) i no s'ha de duplicar com a primera figura dins del cos.
   - **Identitat 1:1 entre `UniversalPage` i `UniversalCard` (`P0-33 / IDEA-150`) i Zero Botons Inventats (`P0-34 / IDEA-151`):** Tota publicació importada defineix exactament el mateix `title`, `subtitle` (`post_subtitle`) i `entradilla` (`lead` / `description`) tant a la pàgina com a la targeta del `/mur`. Prohibit afegir files `.badge-row` amb `[👤 Autor] [📍 Poble] [💬 0] [0 m'agrada]`: l'acció nuclear de Sóc de Poble és **`Connectar`**.
   - **Respecte per Qualsevol Arxiu Multimèdia (Imatge, Fotografia, Vídeo Menut, Àudio o Gràfic) Alineat a l'Esquerra, a la Dreta o al Centre amb Mida Pròpia (`128px`, `300px`, `400px`, etc.):** Quan a la pàgina original de WordPress o Blogger l'autor ha col·locat **qualsevol arxiu multimèdia** (no sols un logotip, sinó qualsevol imatge, foto, vídeo xicotet o recurs multimèdia que no ocupa tot l'ample de pantalla) alineat a l'**esquerra (`alignleft`)**, a la **dreta (`alignright`)** o al **centre (`aligncenter`)** amb una mida pensada per a pantalla (`128px`, `300px`, `400px`, etc.) perquè en pantalla gran el text córrega pel costat, és **prohibit** deixar-lo nu perquè la regla global de prosa (`inline-size: 100%` de `base.css`) l'estire a tota la columna i trenque el disseny o el pixele. Cal copiar sempre **eixa mida i eixa alineació** embolcallant-lo amb `.sdp-media-esquerra`, `.sdp-media-dreta` (o `.sdp-insignia-dreta` per a `128px`) o `.sdp-media-centre` i la classe `.sdp-media-mida-propia` a l'`<img>`/`<video>` amb els seus atributs `width` i `height` originals.

## 3. Cas d'Ús Canònic de Referència i Scripts

- **Fitxer model:** `CURSOS_PEDRA_EN_SEC_2026_EVENT` a `src/sections/mur/eventsSeed.js`.
- **Selector i generador SEO:** `tooling/seo/triaImatgeSeo.js` i `tooling/seo/tria-imatge-seo.mjs`.
- **Ruta viva:** `/events/cursos-pedra-en-sec-fageca-alcosser-2026`.
- **Proves de contracte:** `src/sections/mur/eventsSeed.test.js`, `src/utils/triaImatgeSeo.test.js` i `src/config/imatgeSocial.pes300.test.js`.

## Vincles
- [[00_INDEX_SKILLS]]
- [[sdp-pedra-seca/SKILL]]
- [[sdp-universal-page/SKILL]]
- [[sdp-casos-us-essencials/SKILL]]
