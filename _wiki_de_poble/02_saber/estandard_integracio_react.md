---
type: norma
status: canonic
description: "Contracte d'integració Model B: com Sollutia allotja el Web Component de Pedra Seca sense injectar backend ni reescriure el frontend."
tags:
  - core
  - govern
---
# Lleis de pas: integració de Pedra Seca a l'amfitrió

Pedra Seca s'entrega com un Web Component autònom, l'etiqueta soc-de-poble, que porta dins del Shadow DOM el seu React, el seu enrutador i els seus estils. Sollutia l'allotja i li passa configuració i sessió; el backend el tria i el segella Sóc de Poble (Model B).

**Document vinculant per a l'equip de Sollutia sobre com allotjar el mòdul Pedra Seca.**

Aquest document estableix el contracte d'integració definitiu. Pedra Seca ja no es lliura com a "plantilles HTML/CSS per muntar", sinó com un component autònom, empaquetat i aïllat. L'equip de Sollutia actua com a amfitrió: carrega l'script, proveïx la configuració i, si cal, entrega la sessió de la persona usuària. No injecta backend ni reescriu el frontend: la font de veritat és el Supabase de Sóc de Poble, i SdP només llig de Sollutia per GET a través de la Frontissa ([[ADR-2026-09-SOLLUTIA-MODEL-B]]).

---

## LLEI 1: Integració Standalone via `<script>`

Sollutia NO ha de reconstruir el JSX ni fer un import ESM del mòdul: l'aplicació s'empaqueta de forma hermètica en un format IIFE (Standalone) per protegir les versions de React.

La integració en qualsevol amfitrió es fa incloent l'script compilat i fixant, abans de l'arrencada, la política d'autenticació a través de l'API global. `configura({ backend })` està denegat: el backend el selecciona i el congela `src/host.js`.

* **Ús previst (HTML / PHP Host):**
  ```html
  <!-- 1. Es crea l'etiqueta on es muntarà l'App -->
  <soc-de-poble data-mode="produccio"></soc-de-poble>

  <!-- 2. Es carrega l'script standalone compilat -->
  <script src="/ruta/a/soc-de-poble.standalone.js"></script>

  <!-- 3. Política d'autenticació i sessió a través de l'API global -->
  <script>
    if (window.SocDePoble) {
      // Opcional: aturar l'arrencada automàtica si Sollutia ha de preparar la sessió
      // window.SocDePoble.deferArrenca();

      // Només política d'autenticació: configura({ backend }) llança un error (Model B)
      window.SocDePoble.configura({
        auth: {
          issuer: 'https://emissor.exemple', // emissor exacte dels JWT de Sollutia
          audiences: ['socdepoble']
        }
      });

      // Opcional: entregar la sessió de la persona usuària ja autenticada
      // window.SocDePoble.injectaSessio(sessio);

      // Si s'havia aturat amb deferArrenca(), cal arrencar manualment:
      // window.SocDePoble.arrenca();
    }
  </script>
  ```
* **Enrutament:** El mòdul ja encapsula el seu propi Enrutador Natiu a mida. Tota la navegació succeïx dins del component sense envair l'aplicació pare.
* **Configuració (`config`):** Es pot passar per atributs de l'etiqueta (`base-path`, `data-mode`, `fonts-href`…), per l'atribut `config` (JSON), per un script `application/json` referenciat amb `config-id` o per la propietat JS `element.config`. Tot passa per `sanejaConfig()`, que descarta claus desconegudes i orígens fora de la llista permesa. `window.SocDePoble.configura()` només fixa la política d'autenticació.
* **SEO i Etiquetes Head (`manageDocumentHead`):** Pedra Seca pot gestionar el títol, la descripció i les metaetiquetes de la pàgina (`<title>`, `og:image`, etc.).
  - En mode Standalone (`routerType="browser"`) només s'activa per defecte quan l'etiqueta penja directament de `#root`; incrustada dins d'una pàgina de l'amfitrió queda apagada.
  - Sollutia pot decidir-ho explícitament passant `manageDocumentHead: true` o `false` a la configuració.

## LLEI 2: La Frontera del Mas (`.sdp-root`)

Per evitar que els estils antics de Sollutia o llibreries externes xoquen amb la puresa de la "Pedra Seca", tota la UI del mòdul renderitza dins d'un Shadow DOM tancat, penjada d'un contenidor amb la classe `.sdp-root`.

* **Encapsulament CSS:** El full d'estils s'adopta dins del Shadow DOM i els tokens es declaren per a `:host` i `.sdp-root`. No es toquen els estils globals de `html` ni de `body`; l'única excepció és opt-in: l'atribut `pinta-amfitrio` publica el fons del tema actiu a `--sdp-bg` del document.
* **Zero Interferències:** Sollutia té la garantia que carregar el CSS de Pedra Seca no trencarà la resta de la seua aplicació.
* **Prohibició de Mutació:** Sollutia no pot sobreescriure les classes internes (com `.sdp-card`) amb Tailwind o CSS extern. Qualsevol adaptació s'ha de fer passant paràmetres a la `config` o respectant les variables `--sdp-*`.

## LLEI 3: Dependències i Autonomia

* **Zero Dependències (Standalone):** El mòdul Pedra Seca porta el seu propi React i el seu Enrutador Natiu encapsulats dins del Shadow DOM. Sollutia **NO necessita** instal·lar React ni React Router. Això prevé completament qualsevol conflicte de versions (Dependency Hell).
* **Sense Service Worker:** Pedra Seca no registra cap Service Worker ni manifest PWA: l'arquitectura és online-first ([[ADR-2026-08-ONLINE-FIRST]]). Els workers i el manifest de la pàgina, si n'hi ha, són responsabilitat de l'amfitrió.

## LLEI 4: Accessibilitat Innegociable (WCAG AA)

Els tokens de Pedra Seca garantixen un contrast mínim de 4.5:1 (WCAG AA) tant en mode clar com en mode fosc.
* **Canvi de Tema:** Pedra Seca aplica el mode fosc assignant `data-theme="dark"` a l'element amfitrió `soc-de-poble` (els tokens el lligen amb `:host([data-theme="dark"])`), mai al `body` de la pàgina. Açò vol dir que Sollutia pot tindre un tema diferent a la resta de la pàgina, i Pedra Seca mantindrà l'aïllament del seu tema.

## LLEI 5: Aïllament Estricte de Rutes Absolutes

Dins del mòdul Pedra Seca no existixen referències forçades a arrels absolutes (excepte si es configuren). Qualsevol crida a recursos com imatges es tracta amb imports de Vite (per exemple, `import logo from './assets/img/logo.svg'`) perquè la ruta es resolga correctament dins del paquet standalone.

***Aquesta normativa invalida protocols antics on es requeria que Sollutia convertira HTML a JSX. Avui, la integració és Plug & Play.***

## Vincles

- [[00_index]]
- [[ADR-2026-09-SOLLUTIA-MODEL-B]]
- [[ADR-2026-08-ONLINE-FIRST]]
- [[soci_sollutia]]
- [[estandard_ui_universal]]
