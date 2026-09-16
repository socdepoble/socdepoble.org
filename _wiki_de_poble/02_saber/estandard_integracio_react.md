---
estat: "canonic"
tipus: "norma"
description: "Lleis de pas i manual d'integració Plug & Play entre el mòdul Pedra Seca i la SPA React de Sollutia."
tags:
  - "acta"
  - "core"
  - "govern"
---
\n# 📜 LLEIS DE PAS: MANUAL D'INTEGRACIÓ REACT / PEDRA SECA 📜

**Document vinculant per a l'equip de Sollutia sobre la implementació del mòdul "Pedra Seca" al seu motor React.**

Aquest document estableix el contracte d'integració definitiu. Pedra Seca ja no es lliura com a "plantilles HTML/CSS per muntar", sinó com a una **llibreria React** autònoma, empaquetada i aïllada. L'equip de Sollutia actua com a Host i només ha d'importar el mòdul i proveir la configuració.

---

### LLEI 1: Integració Standalone via `<script>` i Injecció

Sollutia NO ha de reconstruir el JSX, ni fer un import ESM del mòdul, ja que l'aplicació s'empaqueta de forma hermètica i aïllada en un format IIFE (Standalone) per protegir les versions de React. 

La integració en qualsevol host es fa incloent l'script compilat i injectant el backend o la configuració a través de l'API global abans de l'arrencada:

* **Ús previst (HTML / PHP Host):**
  ```html
  <!-- 1. Es crea l'etiqueta on es muntarà l'App -->
  <soc-de-poble data-mode="produccio"></soc-de-poble>

  <!-- 2. Es carrega l'script standalone compilat -->
  <script src="/ruta/a/soc-de-poble.standalone.js"></script>

  <!-- 3. S'injecta el backend personalitzat o configuració a través de l'API global -->
  <script>
    if (window.SocDePoble) {
      // Opcional: Aturar l'arrencada automàtica si Sollutia necessita carregar asíncronament
      // window.SocDePoble.deferArrenca();

      window.SocDePoble.configura({
        backend: {
          loadCoreContent: async (...args) => {
            // Lògica de Sollutia ací
          },
          getCurrentUser: () => {
            // Retornar usuari loguejat en Sollutia
          }
          // ... qualsevol mètode del CONTRACTE_BACKEND a substituir
        }
      });
      
      // Si s'havia aturat amb deferArrenca(), s'ha de cridar arrenca() manualment:
      // window.SocDePoble.arrenca();
    }
  </script>
  ```
* **Enrutament:** El mòdul ja encapsula el seu propi Enrutador Natiu a mida. Tota la navegació succeeix dins del component sense envair l'aplicació pare.
* **Configuració (`config`):** Es pot passar de tres maneres: atributs en `<soc-de-poble>`, atribut `config` (JSON) o mitjançant `window.SocDePoble.configura()`.

### LLEI 2: La Frontera del Mas (`.sdp-root`)

Per evitar que els estils antics de Sollutia o llibreries externes xoquin amb la puresa de la "Pedra Seca", tota la UI del mòdul renderitza dins d'un contenidor principal amb la classe `.sdp-root`.

* **Encapsulament CSS:** Tots els tokens, regles de reset i estils dels components de Pedra Seca vénen prefixats per `.sdp-root`. No hi ha cap modificació d'estils globals sobre `html` o `body`.
* **Zero Interferències:** Sollutia té la garantia que carregar l'CSS de Pedra Seca no trencarà la resta de la seva aplicació.
* **Prohibició de Mutació:** Sollutia no pot sobreescriure les classes internes (com `.sdp-card`) amb Tailwind o CSS extern. Qualsevol adaptació s'ha de fer passant paràmetres a la `config` o respectant les variables `--sdp-*`.

### LLEI 3: Dependències i Autonomia

* **Zero Dependències (Standalone):** El mòdul Pedra Seca porta el seu propi React i el seu Enrutador Natiu encapsulats dins del Shadow DOM. Sollutia **NO necessita** instal·lar React ni React Router. Això prevé completament qualsevol conflicte de versions (Dependency Hell).
* **PWA / Service Worker:** Pedra Seca, quan es construeix internament, fa servir `vite-plugin-pwa`. Si Sollutia l'integra, Sollutia serà la responsable del seu propi Service Worker i manifest; Pedra Seca no forçarà la creació de workers globals per no entrar en conflicte amb els de Sollutia.

### LLEI 4: Accessibilitat Innegociable (WCAG AA)

Els tokens de Pedra Seca garanteixen un contrast mínim de 4.5:1 (WCAG AA) tant en mode clar com en mode fosc.
* **Canvi de Tema:** Pedra Seca aplica el mode fosc assignant `data-theme="dark"` a la seva arrel `.sdp-root`, mai al `body` general. Açò vol dir que Sollutia pot tindre un tema diferent a la resta de la pàgina, i Pedra Seca mantindrà l'aïllament del seu tema.

### LLEI 5: Aïllament Estricte de Rutes Absolutes

Dins del mòdul Pedra Seca, no existeixen referències forçades a arrels absolutes (excepte si es configuren). Qualsevol crida a recursos com imatges serà tractada amb imports de Vite (per exemple, `import logo from './assets/img/logo.svg'`) perquè la ruta es resolgui correctament quan Sollutia construeixi el seu paquet.

***Aquesta normativa invalida protocols antics on es requeria que Sollutia convertís HTML a JSX. Avui, la integració és Plug & Play.***

## Sinapsis Entrants (Autogenerat)

- [[00_index|00_INDEX.md]] — [[estandard_integracio_react]]
- [[govern|01_SABER_Cultura_Coneixement/Govern.md]] — [[ESTANDARD_Integracio_React|03_GOVERNAR_Normativa_Regles/ESTANDARD_Integraci...
- [[graf|01_SABER_Cultura_Coneixement/Graf.md]] — [[ESTANDARD_Integracio_React|03_GOVERNAR_Normativa_Regles/ESTANDARD_Integraci...
- [[estandard_integracio_react|03_GOVERNAR_Normativa_Regles/ESTANDARD_Integracio_React.md]] — [[00_index|00_INDEX.md]] — [[estandard_integracio_react]]

<!-- FI SINAPSIS ENTRANTS - NO EDITAR MANUALMENT -->
