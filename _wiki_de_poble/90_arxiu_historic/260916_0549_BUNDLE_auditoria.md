---
tipus: document
estat: esborrany
description: BUNDLE D'AUDITORIA PER AL CONSELL DE LA PETORRETA
---
# BUNDLE D'AUDITORIA PER AL CONSELL DE LA PETORRETA

> **Anclatge**: aquest document pertany a l'[[00_INDEX_ESCRIPTORI]].

## Com verificar aquest bundle

El bloc `MANIFEST` de baix porta ruta, bytes, línies i sha256 de cada
fitxer. No cal creure el capçal: extrau el cos i compara les sumes.
El contracte d'abast (què s'inclou i què no) també hi és declarat, així
que sabeu exactament què **no** esteu veient.

```json
{"esquema":"sdp.bundle.v2","generat":"2026-09-16T03:49:36.765Z","arrel":"socdepoble.org","verificat":true,"contracte":{"directoris":[],"fitxers_obligatoris":["tooling/wiki/tractor-cervell-ia.mjs","tooling/wiki/schema.json","tooling/wiki/esquema_frontmatter.json","tooling/wiki/teixidora_sinapsis.mjs","tooling/wiki/schema-cutover.lock.json",".agents/consell.json"],"fitxers_opcionals":[".agents/deute/.design-guard-deute.json",".agents/deute/.estucat-deute.json",".agents/deute/.frontmatter-deute.json",".agents/deute/.nomenclatura-deute.json",".agents/deute/.pedra-seca-deute.json",".agents/deute/.promesa-deute.json",".agents/deute/.rutes-deute.json",".agents/deute/.teixit-deute.json",".agents/deute/.vocabulari-deute.json"],"extensions":[".cjs",".css",".html",".js",".json",".jsx",".md",".mjs",".php",".py",".sh",".sql",".ts",".tsx",".txt",".yaml",".yml"],"dirs_exclosos":[".brain-reports",".gemini",".git",".githooks",".husky",".next",".obsidian",".sdp-paperera",".sdp-reflex","90_arxiu_historic","90_historic","build","cervells","coverage","dist","node_modules","skills_mirror","vendor"],"fitxers_prohibits":["DOC_Logos_Oficials.md","Soci_Sollutia.md","all_ai_responses.md","legalContent.js","perfil_psiquiatric.md"]},"totals":{"fitxers":15,"bytes":85859},"absents_no_critics":[],"fitxers":[{"ruta":".agents/consell.json","bytes":6310,"linies":145,"sha256":"0f9981487aea7762e90d79d867bd23b0da777afc58c5a26fb1767aa22a167008"},{"ruta":".agents/deute/.design-guard-deute.json","bytes":2595,"linies":68,"sha256":"a50595f21f293c5e60b58e88c7c1be27a3b209ac4a681942826646f5cc5f408f"},{"ruta":".agents/deute/.estucat-deute.json","bytes":2788,"linies":74,"sha256":"89d3b8321de059b4097091747588d65041163e9ba8646a8a40c51dc3aabcc0ab"},{"ruta":".agents/deute/.frontmatter-deute.json","bytes":359,"linies":17,"sha256":"e865c0ace0d40424ae4a1cfd14ae6f9a727dfa0ee7146d6395ec9308b3ca9dfe"},{"ruta":".agents/deute/.nomenclatura-deute.json","bytes":98,"linies":9,"sha256":"0bebb4582da53aeb52ca187de5ef0656c802f73c1dcb7953938b8b2a30662408"},{"ruta":".agents/deute/.pedra-seca-deute.json","bytes":7381,"linies":151,"sha256":"42f2a7e1c7217e8a9f76bb4322d68be142cef0d6c95d41c7ab817e357c4e2f6f"},{"ruta":".agents/deute/.promesa-deute.json","bytes":394,"linies":13,"sha256":"4c75a7c946d50789a81d337fef328e0d48d9258043501b2d6ceb2a595854e7c1"},{"ruta":".agents/deute/.rutes-deute.json","bytes":3718,"linies":45,"sha256":"bb4e3c48ca1b7ebb7b50f2fe81e3dab88b45b20637445f01a33049b1dad7d622"},{"ruta":".agents/deute/.teixit-deute.json","bytes":137,"linies":10,"sha256":"7ed4460995e906f3023d4e9723b5784ddce3a4246c741ca4af2c87d9a0a266ee"},{"ruta":".agents/deute/.vocabulari-deute.json","bytes":27392,"linies":346,"sha256":"f3764df432004aea5ad1b97a6aeec4f7f98cdd593eff7f2ccd829a283cd892e7"},{"ruta":"tooling/wiki/esquema_frontmatter.json","bytes":5825,"linies":174,"sha256":"f2e170d1b40eea16f4c6b4169a52c6ff6da03c253fa71abca4d0ccd8268d8ab5"},{"ruta":"tooling/wiki/schema-cutover.lock.json","bytes":1603,"linies":37,"sha256":"f8fc384d4236c4079c6dae75d3831091e81948388064bf27e67ae2472ec14a6d"},{"ruta":"tooling/wiki/schema.json","bytes":2087,"linies":101,"sha256":"1ee08bd24d7637f0c86906e4487f7a01047c0a78b8189fd8efe2e1f937994590","nl_final":false},{"ruta":"tooling/wiki/teixidora_sinapsis.mjs","bytes":18928,"linies":451,"sha256":"32fee9874f58db0980eb3a771b589aabaa7adad7ecb792bc0ac2f4b0363a2fc6"},{"ruta":"tooling/wiki/tractor-cervell-ia.mjs","bytes":6244,"linies":176,"sha256":"512c8064e19e44f81ec1927d73d21a6f31d1cb865df54fe6c791318a6ccc0bc6"}]}
```

---

## Fitxer: .agents/consell.json

```
{
  "$schema": "sdp.consell.v1",
  "meta": {
    "versio": "1.0.0",
    "actualitzat": "2026-08-31",
    "font_unica_de_veritat": true,
    "porta": "tooling/gates/tractor-cens.mjs",
    "regla": "Cap document del projecte pot enumerar el Consell amb prosa pròpia. Tot cens es genera d'ací. Si el nombre canvia, es canvia ACÍ i es regenera 02_EQUIP_IA.md.",
    "motiu": "Auditoria Seient Núm. 5 (260831). La «Regla Sagrada» d'enumerar-les totes vivia únicament a _wiki_de_poble/01_ser/03_equip_ia.md:54, dins d'una zona que AGENTS.md §1, 00_INDEX_SKILLS.md i BOOTSTRAP.md §2.3 declaren SENSE VALOR EXECUTIU. L'agent que la saltava no fallava: complia. A més el mateix document es contradeia (línia 78: «no obliga a convocar un nombre fix de models»; línia 88: «no fixa una litúrgia d'onze proveïdors» — n'hi ha dotze)."
  },
  "seguretat": {
    "max_tokens": 4096,
    "timeout_ms": 30000,
    "descripcio": "Límits de seguretat per evitar atacs per exhauriment i bucles infinits."
  },
  "regla_enumeracio": {
    "obligatoria": true,
    "text": "Quan un document, prompt o resposta parla del Consell com a conjunt, s'han d'anomenar TOTES les membres actives sense excepció, i respectar la fortalesa i la debilitat de cadascuna per assignar-los el rol adequat.",
    "no_aplica_a": "Convocar el Consell per a una tasca concreta. Enumerar-les totes és una obligació de RESPECTE quan es parla del conjunt; convocar-les totes no és obligatori mai. Una tasca local, reversible i ben coberta per proves no necessita un eixam."
  },
  "membres": [
    {
      "id": "z-ai",
      "nom": "Z.ai",
      "url": "https://z.ai/",
      "origen": "Xina",
      "fortalesa": "Finestra de context immensa; empassa context massiu de colp.",
      "debilitat": "Menys coneguda i provada que els seus germans majors.",
      "rol": "Ingesta massiva",
      "actiu": true
    },
    {
      "id": "qwen",
      "nom": "Qwen",
      "url": "https://chat.qwenlm.ai/",
      "origen": "Xina",
      "fortalesa": "Raonament profund (Deep Think) i eficiència frugal en programació. Pare de l'arquitectura de l'app.",
      "debilitat": "A vegades peca de massa tècnic en les respostes de text.",
      "rol": "Arquitectura i codi",
      "actiu": true
    },
    {
      "id": "deepseek",
      "nom": "Deepseek",
      "url": "https://chat.deepseek.com/",
      "origen": "Xina",
      "fortalesa": "Lògica pura, detecció d'errors ocults i problemes matemàtics complexos.",
      "debilitat": "Menys destresa en l'empatia i el to literari.",
      "rol": "Caça de bugs",
      "actiu": true
    },
    {
      "id": "dola",
      "nom": "Dola",
      "url": "https://dola.com/chat/",
      "origen": "EUA",
      "fortalesa": "Gestió del temps i integració amb calendaris de missatgeria.",
      "debilitat": "Rol molt limitat exclusivament a la gestió d'agendes.",
      "rol": "Calendari",
      "actiu": true
    },
    {
      "id": "kimi",
      "nom": "Kimi",
      "url": "https://kimi.ai",
      "origen": "Xina (Moonshot, Pequín)",
      "fortalesa": "Context de milions de tòkens; devora PDFs de subvencions senceres.",
      "debilitat": "Generació de codi menys precisa que els models especialitzats.",
      "rol": "Documents llargs i subvencions",
      "actiu": true
    },
    {
      "id": "claude",
      "nom": "Claude",
      "url": "https://claude.ai/",
      "origen": "EUA (Anthropic, San Francisco)",
      "fortalesa": "Narrativa, empatia, valencià natural i comprensió del to exacte de Sóc de Poble.",
      "debilitat": "Més estricta amb els filtres de seguretat.",
      "rol": "Seient Núm. 5 · Auditor sènior i estil",
      "actiu": true
    },
    {
      "id": "perplexity",
      "nom": "Perplexity",
      "url": "https://www.perplexity.ai/",
      "origen": "EUA",
      "fortalesa": "Cerca web en temps real amb citacions de fonts reals; contrasta fets.",
      "debilitat": "No serveix per a tasques creatives ni programació complexa.",
      "rol": "Verificació de fets",
      "actiu": true
    },
    {
      "id": "mistral",
      "nom": "Mistral Vibe",
      "url": "https://chat.mistral.ai/",
      "origen": "Europa (França)",
      "fortalesa": "Raonament frugal, privacitat i matisos culturals europeus sense biaixos americans.",
      "debilitat": "Coneixement menys enciclopèdic que els models gegants.",
      "rol": "Contrapunt europeu i codi obert",
      "actiu": true
    },
    {
      "id": "grok",
      "nom": "Grok",
      "url": "https://grok.com/",
      "origen": "EUA (X)",
      "fortalesa": "Accés en temps real a xarxes; idees disruptives sense censura.",
      "debilitat": "Pot ser massa sarcàstic o imprecís en rigor tècnic.",
      "rol": "Pluja d'idees salvatge",
      "actiu": true
    },
    {
      "id": "gemini",
      "nom": "Gemini",
      "url": "https://gemini.google.com/",
      "origen": "EUA (Google)",
      "fortalesa": "Multimodalitat (veu, visió, imatge) i velocitat Flash. Motor sensorial del bot de WhatsApp.",
      "debilitat": "Amb massa context de colp pot al·lucinar.",
      "rol": "Motor sensorial i orquestració",
      "actiu": true
    },
    {
      "id": "copilot",
      "nom": "Copilot",
      "url": "https://copilot.microsoft.com/",
      "origen": "EUA (Microsoft)",
      "fortalesa": "Suggeriment ràpid de codi i integració profunda amb GitHub.",
      "debilitat": "Actua a curt termini; no serveix per a decisions d'arquitectura global.",
      "rol": "Autocompletat a la trinxera",
      "actiu": true
    },
    {
      "id": "chatgpt",
      "nom": "ChatGPT Codex",
      "url": "https://chatgpt.com/",
      "origen": "EUA (OpenAI)",
      "fortalesa": "Versatilitat absoluta i auditories implacables quan se li ajusta el nivell de raonament adequat.",
      "debilitat": "Peca de respostes genèriques («AI slop») si no se li aplica un prompt dur, i falla a meitat de procés si se satura la temperatura/esforç.",
      "rol": "Segona opinió generalista i auditories de codi",
      "estrategia_optima": "Usar sempre la versió 'GPT-5.6 Sol Medio'. El nivell 'Sol Alto' exhaureix els tòkens abans d'acabar la resposta. El 'Sol Medio' equival a la potència d'un Claude donant respostes completes de 3-4 iteracions.",
      "actiu": true
    }
  ]
}
```
<<<FI_FITXER>>>

## Fitxer: .agents/deute/.design-guard-deute.json

```
{
  "h1-outside-header": {
    "max": 2,
    "identitats": [
      "h1-outside-header|app/App.jsx|h1",
      "h1-outside-header|components/universal/workspace/UniversalSettingsPanel.jsx|h1"
    ]
  },
  "touch-too-small": {
    "max": 5,
    "identitats": [
      "touch-too-small|components/layout/AppGridShell.css|height:32px",
      "touch-too-small|components/layout/AppGridShell.css|width:32px",
      "touch-too-small|css/components.css|height:24px",
      "touch-too-small|css/components.css|width:24px",
      "touch-too-small|css/layout.css|width:24px"
    ]
  },
  "focus-invisible": {
    "max": 7,
    "identitats": [
      "focus-invisible|components/layout/AppGridShell.css|outline-none",
      "focus-invisible|css/legat.css|outline-none",
      "focus-invisible|css/modules.css|outline-none"
    ]
  },
  "inline-style": {
    "max": 8,
    "identitats": [
      "inline-style|components/ui/Dropdown.jsx|style=",
      "inline-style|components/ui/UniversalIndicatorCard.jsx|style=",
      "inline-style|components/ui/icones.jsx|style=",
      "inline-style|sections/detail/detailSectionMeta.jsx|style=",
      "inline-style|sections/xat/XatSection.jsx|style="
    ]
  },
  "h1-multiple": {
    "max": 1,
    "identitats": [
      "h1-multiple|components/universal/manager/ManagerItemCard.jsx|h1"
    ]
  },
  "raw-color": {
    "max": 20,
    "identitats": [
      "raw-color|host.js|#b91c1c",
      "raw-color|host.js|#ef4444",
      "raw-color|host.js|#fee2e2",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#00599d",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#016ebf",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#027e38",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#0e0d0c",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#181715",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#22211e",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#302e29",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#3d3b35",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#5b564e",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#8b857b",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#9c6902",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#ad4c03",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#b7b1a5",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#c2181d",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#dcd7cd",
      "raw-color|sections/disseny/DesignSectionContent.jsx|#efece7"
    ]
  }
}
```
<<<FI_FITXER>>>

## Fitxer: .agents/deute/.estucat-deute.json

```
{
  "buides": [],
  "orfes": [
    "src/css/index.css::fab-button",
    "src/css/index.css::app-list",
    "src/css/index.css::has-img",
    "src/css/index.css::cms-preview",
    "src/css/index.css::sw-pedra-75",
    "src/css/index.css::sw-secondary-700",
    "src/css/index.css::cms-badge",
    "src/css/index.css::btn-lg",
    "src/css/index.css::dl-horizontal",
    "src/css/index.css::sdp-badges-container",
    "src/css/index.css::tooltip-container",
    "src/css/index.css::tooltip-text",
    "src/css/index.css::has-only-title",
    "src/css/index.css::sp-card-main-button",
    "src/css/index.css::sp-card-main-link",
    "src/css/index.css::sp-card-content-link",
    "src/css/index.css::has-sidebar-open",
    "src/css/index.css::steps-container",
    "src/css/index.css::sdp-justify-between",
    "src/css/index.css::sdp-gap-8",
    "src/css/index.css::sdp-gap-16",
    "src/css/index.css::sdp-gap-20",
    "src/css/index.css::sdp-gap-28",
    "src/css/index.css::sdp-gap-48",
    "src/css/index.css::sdp-mb-0",
    "src/css/index.css::sdp-mb-3",
    "src/css/index.css::sdp-mt-12",
    "src/css/index.css::sdp-p-0",
    "src/css/index.css::sdp-p-2",
    "src/css/index.css::sdp-scroll-reveal",
    "src/css/index.css::sdp-parallax-bg",
    "src/css/index.css::toc-level-1",
    "src/css/index.css::toc-level-2",
    "src/css/index.css::toc-level-3",
    "src/css/index.css::toc-level-4",
    "src/css/index.css::sp-card-body--with-aside",
    "src/css/index.css::sdp-badge-poble",
    "src/css/index.css::sdp-badge-poble--actiu",
    "src/css/index.css::sdp-filtres__vistes",
    "src/css/index.css::sdp-filtre--vista",
    "src/css/index.css::sdp-filtre--accio",
    "src/css/index.css::sdp-filtre--camp",
    "src/css/index.css::mur-filter",
    "src/css/index.css::mur-map",
    "src/css/index.css::mur-filters",
    "src/css/index.css::label-poble-actiu",
    "src/css/index.css::label-fototeca",
    "src/css/index.css::label-mapa",
    "src/css/index.css::chat-bubble-ia",
    "src/css/index.css::chat-time-ia",
    "src/css/index.css::chat-bubble-jl",
    "src/css/index.css::chat-time-jl",
    "src/css/index.css::label-festes",
    "src/css/index.css::xat-sidebar-search",
    "src/css/index.css::sp-main-content",
    "src/css/index.css::xat-bubble",
    "src/css/index.css::xat-bubble-other",
    "src/css/index.css::xat-bubble-me",
    "src/css/index.css::xat-bubble-meta",
    "src/css/index.css::sdp-quarantena-badge",
    "src/css/index.css::app-main__content",
    "src/css/index.css::topbar__title",
    "src/css/index.css::topbar__actions",
    "src/css/index.css::conversation-button",
    "src/css/index.css::notes-editor",
    "src/css/index.css::sdp-tiptap-menu",
    "src/css/index.css::sdp-tiptap-container",
    "src/css/index.css::ProseMirror"
  ]
}
```
<<<FI_FITXER>>>

## Fitxer: .agents/deute/.frontmatter-deute.json

```
{
  "generat": "2026-09-15T06:09:45.845Z",
  "esquema": "https://socdepoble.org/schemas/wiki-frontmatter-v2.1.json",
  "esquemaSha256": "1ee08bd24d7637f0c86906e4487f7a01047c0a78b8189fd8efe2e1f937994590",
  "metode": "F1-per-clau/v2",
  "max": {
    "F1": 54,
    "F2": 126,
    "F3": 14,
    "F4": 7,
    "F5": 5,
    "F6": 0,
    "F7": 22,
    "F8": 0
  }
}
```
<<<FI_FITXER>>>

## Fitxer: .agents/deute/.nomenclatura-deute.json

```
{
  "generat": "2026-09-10T03:28:51.663Z",
  "max": {
    "N1": 0,
    "N2": 0,
    "N3": 0
  }
}
```
<<<FI_FITXER>>>

## Fitxer: .agents/deute/.pedra-seca-deute.json

```
{
  "LLEI_01_CLASSE_ORFENA": {
    "max": 74,
    "coneguts": [
      ".?  →  src/components/universal/AvisadorEfimer.jsx",
      ".active-text  →  src/components/universal/UniversalToolbar.jsx",
      ".app-brand__mark  →  src/app/App.jsx",
      ".btn-icon--transparent  →  src/components/layout/AppGridColumn.jsx",
      ".card  →  src/sections/detail/PageDetailSection.jsx",
      ".card--accent  →  src/sections/realitat/RealitatSection.jsx",
      ".card--hover  →  src/sections/realitat/RealitatSection.jsx",
      ".card-link--active  →  src/sections/profile/ProfileSection.jsx",
      ".collapsed  →  src/components/universal/manager/ManagerFacets.jsx",
      ".connect-card  →  src/sections/connectar/ConnectarSection.jsx",
      ".connect-card--active  →  src/sections/connectar/ConnectarSection.jsx",
      ".dashboard  →  src/sections/admin/AdminSection.jsx",
      ".design-badges-container  →  src/sections/disseny/DesignSectionContent.jsx",
      ".dsg-btn-round  →  src/sections/disseny/DesignSectionContent.jsx",
      ".dsg-center-600  →  src/sections/disseny/DesignSectionContent.jsx",
      ".dsg-flex-1  →  src/sections/disseny/DesignSectionContent.jsx",
      ".dsg-icon-1em  →  src/sections/disseny/DesignSectionContent.jsx",
      ".dsg-msg-container  →  src/sections/disseny/DesignSectionContent.jsx",
      ".dsg-msg-self  →  src/sections/disseny/DesignSectionContent.jsx",
      ".dsg-pl-1  →  src/sections/disseny/DesignSectionContent.jsx",
      ".dsg-pre-wrap  →  src/sections/disseny/DesignSectionContent.jsx",
      ".editor-content  →  src/components/universal/richText/useUniversalRichText.js",
      ".embed  →  src/components/universal/PageFrame.jsx",
      ".entitats  →  src/sections/admin/AdminSection.jsx",
      ".exit  →  src/sections/profile/DetallAjust.jsx",
      ".left  →  src/components/layout/AppGridShell.jsx",
      ".me  →  src/sections/dispositius/DevicesSection.jsx",
      ".middle  →  src/components/layout/AppGridShell.jsx",
      ".mobile-logo  →  src/app/App.jsx",
      ".page-content  →  src/components/universal/richText/useUniversalRichText.js",
      ".page-title-logo-personalitzat  →  src/components/universal/PageFrame.jsx",
      ".published  →  src/components/universal/UniversalEditorShell.jsx",
      ".pull-to-refresh-indicator  →  src/app/App.jsx",
      ".realitat-btn  →  src/sections/realitat/RealitatSection.jsx",
      ".right  →  src/components/universal/UniversalToolbar.jsx",
      ".sdp-alerta__contingut  →  src/sections/disseny/DesignSectionContent.jsx",
      ".sdp-article-layout  →  src/components/universal/workspace/UniversalSettingsPanel.jsx",
      ".sdp-avatar--  →  src/sections/xat/XatSection.jsx",
      ".sdp-avatar-placeholder  →  src/app/App.jsx",
      ".sdp-camp--error  →  src/components/ui/formulari.jsx",
      ".sdp-camp__check  →  src/sections/profile/DetallAjust.jsx",
      ".sdp-divisor--amb-text  →  src/components/ui/Divisor.jsx",
      ".sdp-divisor__text  →  src/components/ui/Divisor.jsx",
      ".sdp-esquelet  →  src/components/ui/estats.jsx",
      ".sdp-estat  →  src/components/universal/UniversalEditorShell.jsx",
      ".sdp-estat--error  →  src/components/universal/UniversalEditorShell.jsx",
      ".sdp-estat__contenidor  →  src/components/universal/UniversalEditorShell.jsx",
      ".sdp-estat__descripcio  →  src/components/universal/UniversalEditorShell.jsx",
      ".sdp-estat__titol  →  src/components/universal/UniversalEditorShell.jsx",
      ".sdp-imatge-cos  →  src/components/universal/richText/extensions/index.js",
      ".sdp-insignia--  →  src/sections/gestoria/views/GestoriaIngesta.jsx",
      ".sdp-molla  →  src/components/ui/navegacio.jsx",
      ".sdp-pestanyes  →  src/components/ui/Pestanyes.jsx",
      ".sdp-pindola--vertical  →  src/components/ui/Botonera.jsx",
      ".sdp-pre-wrap  →  src/components/universal/workspace/SlotErrorBoundary.jsx",
      ".sdp-prose  →  src/components/universal/richText/useUniversalRichText.js",
      ".sdp-route-loading-screen  →  src/app/App.jsx",
      ".sdp-route-loading-screen__dots  →  src/app/App.jsx",
      ".sdp-route-loading-screen__glow  →  src/app/App.jsx",
      ".sdp-route-loading-screen__glow--left  →  src/app/App.jsx",
      ".sdp-route-loading-screen__glow--right  →  src/app/App.jsx",
      ".sdp-route-loading-screen__logo  →  src/app/App.jsx",
      ".sdp-route-loading-screen__panel  →  src/app/App.jsx",
      ".sdp-route-loading-screen__subtitle  →  src/app/App.jsx",
      ".sdp-route-loading-screen__title  →  src/app/App.jsx",
      ".sdp-slot-error  →  src/components/universal/workspace/SlotErrorBoundary.jsx",
      ".sdp-text-cos  →  src/components/universal/richText/useUniversalRichText.js",
      ".sdp-top-bar-btn--avatar  →  src/app/App.jsx",
      ".sdp-universal-page-container--  →  src/components/universal/PageFrame.jsx",
      ".sw-pedra-50  →  src/sections/disseny/DesignSectionContent.jsx",
      ".toc-level-  →  src/components/universal/PageFrame.jsx",
      ".toggle-button  →  src/sections/connectar/ConnectarSection.jsx",
      ".toggle-button--active  →  src/sections/connectar/ConnectarSection.jsx",
      ".usuaris  →  src/sections/admin/AdminSection.jsx"
    ]
  },
  "LLEI_02_TOKEN_FANTASMA": {
    "max": 2,
    "coneguts": [
      "--mida  →  src/css/base.css",
      "--sdp-bg  →  src/PedraSecaEmbed.jsx"
    ]
  },
  "LLEI_03_ESTIL_EN_LINIA": {
    "max": 7,
    "coneguts": [
      "src/components/ui/Dropdown.jsx",
      "src/components/ui/icones.jsx",
      "src/sections/detail/detailSectionMeta.jsx",
      "src/sections/xat/XatSection.jsx"
    ]
  },
  "LLEI_03_COLOR_EN_LINIA": {
    "max": 0,
    "coneguts": []
  },
  "LLEI_04_VIDA": {
    "max": 0,
    "coneguts": []
  },
  "LLEI_05_PORTA_UNICA": {
    "max": 0,
    "coneguts": []
  },
  "LLEI_06_ENCAPSULAMENT": {
    "max": 15,
    "coneguts": [
      "src/app/App.jsx  →  document.body",
      "src/app/App.jsx  →  document.documentElement",
      "src/app/contexts/UIContext.jsx  →  document.documentElement",
      "src/components/universal/AvisadorEfimer.jsx  →  document.body",
      "src/components/universal/richText/extensions/index.js  →  document.body",
      "src/components/universal/richText/extensions/slash.js  →  document.body",
      "src/hooks/useSEO.js  →  document.head"
    ]
  },
  "LLEI_07_PARITAT_I18N": {
    "max": 0,
    "coneguts": []
  },
  "LLEI_08_SUBARBRE_ORFE": {
    "max": 20,
    "coneguts": [
      "src/components/ui/Avatar.jsx",
      "src/components/ui/Botonera.jsx",
      "src/components/ui/Taula.jsx",
      "src/components/universal/manager/UniversalManager.jsx",
      "src/components/universal/workspace/UniversalSettingsPanel.jsx",
      "src/css/base.css",
      "src/css/components.css",
      "src/css/design-tokens.css",
      "src/css/layout.css",
      "src/css/legat.css",
      "src/css/modules.css",
      "src/css/sdp.css",
      "src/css/tokens.css",
      "src/css/utilities.css",
      "src/data/frontissa/dto.js",
      "src/data/frontissa/esquema.js",
      "src/data/frontissa/sollutia/client.js",
      "src/data/frontissa/sollutia/recursos.js",
      "src/data/frontissa/supabase/notes.js",
      "src/data/frontissa/traductor.js"
    ]
  }
}
```
<<<FI_FITXER>>>

## Fitxer: .agents/deute/.promesa-deute.json

```
{
  "generat": "2026-09-14T22:03:53.319Z",
  "max": {
    "P1": 0,
    "P2": 2,
    "P3": 0
  },
  "ids": [
    "P2|.agents/hooks/preflight_matrix_wrapper.mjs|executa «tooling/brain/matrix.mjs» i el catch només registra: la fallada es degrada a avís",
    "P2|tooling/brain/despertar.mjs|executa «tooling/brain/ancora.mjs» i el catch només registra: la fallada es degrada a avís"
  ]
}
```
<<<FI_FITXER>>>

## Fitxer: .agents/deute/.rutes-deute.json

```
{
  "literal-orfe": {
    "max": 89,
    "identitats": [
      "literal-orfe|tooling/brain/260830_neteja_deute.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/brain/260830_pedacos_arrel.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/brain/260830_purga_maquinari.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/brain/somiador.mjs|Literal «04_escriptori» sense importar l",
      "literal-orfe|tooling/brain/somiador.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/gates/obrir_torn.mjs|Literal «04_escriptori» sense importar l",
      "literal-orfe|tooling/gates/obrir_torn.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/gates/tractor-cens.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/gates/tractor-doctrina.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/gates/tractor-graella.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/gates/tractor-promesa.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/gates/tractor-rutes.mjs|Literal «04_escriptori» sense importar l",
      "literal-orfe|tooling/gates/tractor-rutes.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/gates/verificador-scc.mjs|Literal «04_escriptori» sense importar l",
      "literal-orfe|tooling/gates/verificador-scc.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/lib/arrel.mjs|Literal «04_escriptori» sense importar l",
      "literal-orfe|tooling/lib/arrel.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/session/check-close.mjs|Literal «04_escriptori» sense importar l",
      "literal-orfe|tooling/session/check-close.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/wiki/codemod_frontmatter.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/wiki/compile-wiki-to-system-prompt.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/wiki/core/audit.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/wiki/core/safety.mjs|Literal «04_escriptori» sense importar l",
      "literal-orfe|tooling/wiki/entropia_zero_router.mjs|Literal «04_escriptori» sense importar l",
      "literal-orfe|tooling/wiki/generar_genoma_v2.mjs|Literal «04_escriptori» sense importar l",
      "literal-orfe|tooling/wiki/generar_genoma_v2.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/wiki/generar_petorreta_inversa.mjs|Literal «04_escriptori» sense importar l",
      "literal-orfe|tooling/wiki/generar_petorreta_inversa.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/wiki/lib/prompt_iso.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/wiki/llaurador_indexs.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/wiki/neteja_brain.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/wiki/sincronitzar_skills.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/wiki/teixidor.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/wiki/tractor-cognitiu.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/wiki/tractor-frontmatter.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/wiki/validate-wiki-compliance.mjs|Literal «_wiki_de_poble» sense importar ",
      "literal-orfe|tooling/wiki/validate_trellat.cjs|Literal «_wiki_de_poble» sense importar "
    ]
  }
}
```
<<<FI_FITXER>>>

## Fitxer: .agents/deute/.teixit-deute.json

```
{
  "generat": "2026-09-15T11:37:08.581Z",
  "max": {
    "orfes": 4,
    "penjats": 167,
    "illes": 3,
    "etiquetesFalses": 0
  }
}
```
<<<FI_FITXER>>>

## Fitxer: .agents/deute/.vocabulari-deute.json

```
{
  "css-de-seccio": {
    "max": 2,
    "identitats": [
      "css-de-seccio|src/components/layout/AppGridShell.css|src/components/layout/AppGridShell.css",
      "css-de-seccio|src/sections/profile/PerfilShell.css|src/sections/profile/PerfilShell.css"
    ]
  },
  "classe-forastera": {
    "max": 567,
    "identitats": [
      "classe-forastera|src/app/App.jsx|app-brand__mark",
      "classe-forastera|src/app/App.jsx|icona-linia",
      "classe-forastera|src/app/App.jsx|mobile-logo",
      "classe-forastera|src/app/App.jsx|pull-to-refresh-indicator",
      "classe-forastera|src/app/App.jsx|sdp-avatar-placeholder",
      "classe-forastera|src/app/App.jsx|sdp-boto--secundari",
      "classe-forastera|src/app/App.jsx|sdp-route-loading-screen",
      "classe-forastera|src/app/App.jsx|sdp-route-loading-screen__dots",
      "classe-forastera|src/app/App.jsx|sdp-route-loading-screen__glow",
      "classe-forastera|src/app/App.jsx|sdp-route-loading-screen__glow--left",
      "classe-forastera|src/app/App.jsx|sdp-route-loading-screen__glow--right",
      "classe-forastera|src/app/App.jsx|sdp-route-loading-screen__logo",
      "classe-forastera|src/app/App.jsx|sdp-route-loading-screen__panel",
      "classe-forastera|src/app/App.jsx|sdp-route-loading-screen__subtitle",
      "classe-forastera|src/app/App.jsx|sdp-route-loading-screen__title",
      "classe-forastera|src/app/App.jsx|sdp-top-bar-btn",
      "classe-forastera|src/app/App.jsx|sdp-top-bar-btn--avatar",
      "classe-forastera|src/app/guards/RequireAuth.jsx|sdp-alerta",
      "classe-forastera|src/app/guards/RequireAuth.jsx|sdp-alerta--error",
      "classe-forastera|src/app/guards/RequireAuth.jsx|sdp-buit",
      "classe-forastera|src/app/guards/RequireAuth.jsx|sdp-route-loading-screen",
      "classe-forastera|src/app/guards/RequireAuth.jsx|sr-only",
      "classe-forastera|src/components/layout/AppGridColumn.jsx|btn-icon--transparent",
      "classe-forastera|src/components/ui/Alerta.jsx|sdp-alerta__accions",
      "classe-forastera|src/components/ui/Alerta.jsx|sdp-alerta__cos",
      "classe-forastera|src/components/ui/Alerta.jsx|sdp-alerta__icona",
      "classe-forastera|src/components/ui/Alerta.jsx|sdp-alerta__tanca",
      "classe-forastera|src/components/ui/Alerta.jsx|sdp-alerta__text",
      "classe-forastera|src/components/ui/Alerta.jsx|sdp-alerta__titol",
      "classe-forastera|src/components/ui/Avatar.jsx|sdp-nomes-lector",
      "classe-forastera|src/components/ui/Boto.jsx|sdp-boto__gir",
      "classe-forastera|src/components/ui/Dialeg.jsx|sdp-dialeg__cap",
      "classe-forastera|src/components/ui/Dialeg.jsx|sdp-dialeg__cos",
      "classe-forastera|src/components/ui/Dialeg.jsx|sdp-dialeg__descripcio",
      "classe-forastera|src/components/ui/Dialeg.jsx|sdp-dialeg__marc",
      "classe-forastera|src/components/ui/Dialeg.jsx|sdp-dialeg__peu",
      "classe-forastera|src/components/ui/Dialeg.jsx|sdp-dialeg__tanca",
      "classe-forastera|src/components/ui/Dialeg.jsx|sdp-dialeg__titol",
      "classe-forastera|src/components/ui/Divisor.jsx|sdp-divisor--amb-text",
      "classe-forastera|src/components/ui/Divisor.jsx|sdp-divisor__text",
      "classe-forastera|src/components/ui/Pestanyes.jsx|sdp-pestanyes__llista",
      "classe-forastera|src/components/ui/Pestanyes.jsx|sdp-pestanyes__panell",
      "classe-forastera|src/components/ui/Pestanyes.jsx|sdp-pestanyes__pestanya",
      "classe-forastera|src/components/ui/Pista.jsx|sdp-pista__bafarada",
      "classe-forastera|src/components/ui/Pista.jsx|sdp-pista__boto",
      "classe-forastera|src/components/ui/estats.jsx|sdp-buit",
      "classe-forastera|src/components/ui/estats.jsx|sdp-buit__text",
      "classe-forastera|src/components/ui/estats.jsx|sdp-buit__titol",
      "classe-forastera|src/components/ui/estats.jsx|sdp-carregant__gir",
      "classe-forastera|src/components/ui/estats.jsx|sdp-esquelet__forma",
      "classe-forastera|src/components/ui/estats.jsx|sdp-esquelet__linia",
      "classe-forastera|src/components/ui/estats.jsx|sdp-esquelet__linia--titol",
      "classe-forastera|src/components/ui/estats.jsx|sdp-esquelet__media",
      "classe-forastera|src/components/ui/estats.jsx|sdp-nomes-lector",
      "classe-forastera|src/components/ui/estats.jsx|sdp-progres__barra",
      "classe-forastera|src/components/ui/estats.jsx|sdp-progres__cap",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-camp",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-camp--error",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-camp__ajuda",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-camp__error",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-camp__etiqueta",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-camp__obligatori",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-casella",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-casella__ajuda",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-casella__control",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-casella__etiqueta",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-control",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-control--area",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-control--selector",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-grup",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-grup--error",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-grup__cos",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-grup__llegenda",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-interruptor",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-interruptor__botonet",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-interruptor__carril",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-interruptor__control",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-interruptor__estat",
      "classe-forastera|src/components/ui/formulari.jsx|sdp-interruptor__etiqueta",
      "classe-forastera|src/components/ui/navegacio.jsx|sdp-molla__enllac",
      "classe-forastera|src/components/ui/navegacio.jsx|sdp-molla__llista",
      "classe-forastera|src/components/ui/navegacio.jsx|sdp-molla__pas",
      "classe-forastera|src/components/ui/navegacio.jsx|sdp-paginacio__llista",
      "classe-forastera|src/components/ui/navegacio.jsx|sdp-paginacio__num",
      "classe-forastera|src/components/ui/navegacio.jsx|sdp-paginacio__pas",
      "classe-forastera|src/components/ui/navegacio.jsx|sdp-paginacio__salt",
      "classe-forastera|src/components/universal/PageFrame.jsx|page-intro",
      "classe-forastera|src/components/universal/PageFrame.jsx|page-title-logo-personalitzat",
      "classe-forastera|src/components/universal/UniversalEditorShell.jsx|published",
      "classe-forastera|src/components/universal/UniversalEditorShell.jsx|sdp-alerta__accions",
      "classe-forastera|src/components/universal/UniversalEditorShell.jsx|sdp-alerta__titol",
      "classe-forastera|src/components/universal/UniversalEditorShell.jsx|sdp-boto--fantasma",
      "classe-forastera|src/components/universal/UniversalEditorShell.jsx|sdp-boto--perill",
      "classe-forastera|src/components/universal/UniversalEditorShell.jsx|sdp-boto--secundari",
      "classe-forastera|src/components/universal/UniversalEditorShell.jsx|sdp-camp",
      "classe-forastera|src/components/universal/UniversalEditorShell.jsx|sdp-camp__ajuda",
      "classe-forastera|src/components/universal/UniversalEditorShell.jsx|sdp-estat",
      "classe-forastera|src/components/universal/UniversalEditorShell.jsx|sdp-estat--error",
      "classe-forastera|src/components/universal/UniversalEditorShell.jsx|sdp-estat__contenidor",
      "classe-forastera|src/components/universal/UniversalEditorShell.jsx|sdp-estat__descripcio",
      "classe-forastera|src/components/universal/UniversalEditorShell.jsx|sdp-estat__titol",
      "classe-forastera|src/components/universal/UniversalEditorShell.jsx|sdp-nomes-lector",
      "classe-forastera|src/components/universal/UniversalToolbar.jsx|active-text",
      "classe-forastera|src/components/universal/UniversalToolbar.jsx|right",
      "classe-forastera|src/components/universal/manager/ManagerFacets.jsx|collapsed",
      "classe-forastera|src/components/universal/manager/ManagerList.jsx|collapsed",
      "classe-forastera|src/components/universal/workspace/SlotErrorBoundary.jsx|sdp-buit",
      "classe-forastera|src/components/universal/workspace/SlotErrorBoundary.jsx|sdp-camp__ajuda",
      "classe-forastera|src/components/universal/workspace/SlotErrorBoundary.jsx|sdp-pre-wrap",
      "classe-forastera|src/components/universal/workspace/SlotErrorBoundary.jsx|sdp-slot-error",
      "classe-forastera|src/components/universal/workspace/UniversalSettingsPanel.jsx|sdp-article-layout",
      "classe-forastera|src/components/universal/workspace/UniversalSettingsPanel.jsx|sdp-boto--secundari",
      "classe-forastera|src/sections/admin/AdminSection.jsx|sdp-alerta",
      "classe-forastera|src/sections/admin/AdminSection.jsx|sdp-alerta--error",
      "classe-forastera|src/sections/admin/AdminSection.jsx|sdp-alerta--info",
      "classe-forastera|src/sections/admin/AdminSection.jsx|sdp-alerta__titol",
      "classe-forastera|src/sections/admin/AdminSection.jsx|sdp-buit",
      "classe-forastera|src/sections/admin/AdminSection.jsx|sdp-buit__text",
      "classe-forastera|src/sections/admin/AdminSection.jsx|sdp-camp__ajuda",
      "classe-forastera|src/sections/connectar/ConnectarSection.jsx|connect-card",
      "classe-forastera|src/sections/connectar/ConnectarSection.jsx|connect-card--active",
      "classe-forastera|src/sections/connectar/ConnectarSection.jsx|sdp-alerta__tanca",
      "classe-forastera|src/sections/connectar/ConnectarSection.jsx|sdp-camp",
      "classe-forastera|src/sections/connectar/ConnectarSection.jsx|sdp-control",
      "classe-forastera|src/sections/connectar/ConnectarSection.jsx|sr-only",
      "classe-forastera|src/sections/connectar/ConnectarSection.jsx|toggle-button",
      "classe-forastera|src/sections/connectar/ConnectarSection.jsx|toggle-button--active",
      "classe-forastera|src/sections/detail/ItemDetailSection.jsx|sdp-boto--primari",
      "classe-forastera|src/sections/detail/PageDetailSection.jsx|card",
      "classe-forastera|src/sections/detail/detailSectionMeta.jsx|sdp-boto--ple",
      "classe-forastera|src/sections/dispositius/DevicesSection.jsx|card",
      "classe-forastera|src/sections/dispositius/DevicesSection.jsx|sdp-boto--accent",
      "classe-forastera|src/sections/dispositius/DevicesSection.jsx|sdp-boto--perill",
      "classe-forastera|src/sections/dispositius/DevicesSection.jsx|sdp-boto--primari",
      "classe-forastera|src/sections/dispositius/DevicesSection.jsx|sdp-boto--secundari",
      "classe-forastera|src/sections/dispositius/DevicesSection.jsx|sdp-camp__ajuda",
      "classe-forastera|src/sections/dispositius/DevicesSection.jsx|sdp-control",
      "classe-forastera|src/sections/dispositius/DevicesSection.jsx|sdp-insignia",
      "classe-forastera|src/sections/dispositius/DevicesSection.jsx|sdp-insignia--info",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|card",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|design-badges-container",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|dsg-btn-round",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|dsg-center-600",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|dsg-flex-1",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|dsg-icon-1em",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|dsg-msg-container",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|dsg-msg-self",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|dsg-pl-1",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|dsg-pre-wrap",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|grid-col",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|icona-linia",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-alerta",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-alerta--avis",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-alerta--error",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-alerta--info",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-alerta--ok",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-alerta__contingut",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-avatar",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-avatar--lg",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-avatar--md",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-avatar--sm",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-avatar--xl",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-avatar--xs",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-avatar-grup",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-escala",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-escala__barra",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-escala__barra--1",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-escala__barra--10",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-escala__barra--12",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-escala__barra--16",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-escala__barra--2",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-escala__barra--20",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-escala__barra--3",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-escala__barra--4",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-escala__barra--6",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-escala__barra--8",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-escala__fila",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-escala__token",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-llista",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-taula",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sdp-taula--densa",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|sw-pedra-50",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|swatch",
      "classe-forastera|src/sections/disseny/DesignSectionContent.jsx|swatch-info",
      "classe-forastera|src/sections/disseny/cataleg/Especimen.jsx|sdp-especimen",
      "classe-forastera|src/sections/disseny/cataleg/Especimen.jsx|sdp-especimen__cap",
      "classe-forastera|src/sections/disseny/cataleg/Especimen.jsx|sdp-especimen__fes",
      "classe-forastera|src/sections/disseny/cataleg/Especimen.jsx|sdp-especimen__fitxer",
      "classe-forastera|src/sections/disseny/cataleg/Especimen.jsx|sdp-especimen__no",
      "classe-forastera|src/sections/disseny/cataleg/Especimen.jsx|sdp-especimen__nom",
      "classe-forastera|src/sections/disseny/cataleg/Especimen.jsx|sdp-especimen__regles",
      "classe-forastera|src/sections/disseny/cataleg/Especimen.jsx|sdp-especimen__viu",
      "classe-forastera|src/sections/disseny/cataleg/PaginaEstructura.jsx|sdp-anatomia",
      "classe-forastera|src/sections/disseny/cataleg/PaginaEstructura.jsx|sdp-anatomia__fin",
      "classe-forastera|src/sections/disseny/cataleg/PaginaEstructura.jsx|sdp-anatomia__lat",
      "classe-forastera|src/sections/disseny/cataleg/PaginaEstructura.jsx|sdp-anatomia__sup",
      "classe-forastera|src/sections/disseny/cataleg/PaginaFormularis.jsx|sdp-camp__error",
      "classe-forastera|src/sections/disseny/cataleg/PaginaFormularis.jsx|sdp-especimen__fila",
      "classe-forastera|src/sections/disseny/cataleg/PaginaRetroalimentacio.jsx|sdp-especimen__fila",
      "classe-forastera|src/sections/disseny/cataleg/PaginaRetroalimentacio.jsx|sdp-especimen__regles",
      "classe-forastera|src/sections/disseny/cataleg/PaginaSuperposicions.jsx|sdp-boto--secundari",
      "classe-forastera|src/sections/gestoria/GestoriaSection.jsx|sdp-alerta",
      "classe-forastera|src/sections/gestoria/GestoriaSection.jsx|sdp-alerta--info",
      "classe-forastera|src/sections/gestoria/GestoriaSection.jsx|sdp-buit",
      "classe-forastera|src/sections/gestoria/views/GestoriaBurocracia.jsx|sdp-camp",
      "classe-forastera|src/sections/gestoria/views/GestoriaBurocracia.jsx|sdp-camp__ajuda",
      "classe-forastera|src/sections/gestoria/views/GestoriaContactes.jsx|sdp-camp",
      "classe-forastera|src/sections/gestoria/views/GestoriaContactes.jsx|sdp-carregant",
      "classe-forastera|src/sections/gestoria/views/GestoriaContactes.jsx|sdp-insignia",
      "classe-forastera|src/sections/gestoria/views/GestoriaContactes.jsx|sdp-insignia--exit",
      "classe-forastera|src/sections/gestoria/views/GestoriaContactes.jsx|sdp-insignia--info",
      "classe-forastera|src/sections/gestoria/views/GestoriaContactes.jsx|sdp-taula",
      "classe-forastera|src/sections/gestoria/views/GestoriaContactes.jsx|sdp-taula--densa",
      "classe-forastera|src/sections/gestoria/views/GestoriaContactes.jsx|sdp-taula--interactiva",
      "classe-forastera|src/sections/gestoria/views/GestoriaFacturacio.jsx|sdp-accions--final",
      "classe-forastera|src/sections/gestoria/views/GestoriaFacturacio.jsx|sdp-alerta__accions",
      "classe-forastera|src/sections/gestoria/views/GestoriaFacturacio.jsx|sdp-boto--accent",
      "classe-forastera|src/sections/gestoria/views/GestoriaFacturacio.jsx|sdp-camp",
      "classe-forastera|src/sections/gestoria/views/GestoriaFacturacio.jsx|sdp-carregant",
      "classe-forastera|src/sections/gestoria/views/GestoriaFacturacio.jsx|sdp-control",
      "classe-forastera|src/sections/gestoria/views/GestoriaFacturacio.jsx|sdp-insignia",
      "classe-forastera|src/sections/gestoria/views/GestoriaFacturacio.jsx|sdp-insignia--avis",
      "classe-forastera|src/sections/gestoria/views/GestoriaFacturacio.jsx|sdp-insignia--exit",
      "classe-forastera|src/sections/gestoria/views/GestoriaFacturacio.jsx|sdp-insignia--info",
      "classe-forastera|src/sections/gestoria/views/GestoriaFacturacio.jsx|sdp-num",
      "classe-forastera|src/sections/gestoria/views/GestoriaFacturacio.jsx|sdp-taula",
      "classe-forastera|src/sections/gestoria/views/GestoriaFacturacio.jsx|sdp-taula--ampla",
      "classe-forastera|src/sections/gestoria/views/GestoriaFacturacio.jsx|sdp-taula--densa",
      "classe-forastera|src/sections/gestoria/views/GestoriaFacturacio.jsx|sdp-taula--interactiva",
      "classe-forastera|src/sections/gestoria/views/GestoriaHome.jsx|icona-linia",
      "classe-forastera|src/sections/gestoria/views/GestoriaHome.jsx|sdp-camp",
      "classe-forastera|src/sections/gestoria/views/GestoriaHome.jsx|sdp-camp__ajuda",
      "classe-forastera|src/sections/gestoria/views/GestoriaHome.jsx|sdp-num",
      "classe-forastera|src/sections/gestoria/views/GestoriaHome.jsx|sdp-taula",
      "classe-forastera|src/sections/gestoria/views/GestoriaHome.jsx|sdp-taula--densa",
      "classe-forastera|src/sections/gestoria/views/GestoriaImpostos.jsx|sdp-alerta__accions",
      "classe-forastera|src/sections/gestoria/views/GestoriaImpostos.jsx|sdp-especimen__fila",
      "classe-forastera|src/sections/gestoria/views/GestoriaImpostos.jsx|sdp-insignia",
      "classe-forastera|src/sections/gestoria/views/GestoriaImpostos.jsx|sdp-insignia--avis",
      "classe-forastera|src/sections/gestoria/views/GestoriaImpostos.jsx|sdp-insignia--exit",
      "classe-forastera|src/sections/gestoria/views/GestoriaImpostos.jsx|sdp-insignia--info",
      "classe-forastera|src/sections/gestoria/views/GestoriaImpostos.jsx|sdp-num",
      "classe-forastera|src/sections/gestoria/views/GestoriaImpostos.jsx|sdp-taula",
      "classe-forastera|src/sections/gestoria/views/GestoriaIngesta.jsx|sdp-alerta__accions",
      "classe-forastera|src/sections/gestoria/views/GestoriaIngesta.jsx|sdp-boto--accent",
      "classe-forastera|src/sections/gestoria/views/GestoriaIngesta.jsx|sdp-boto--primari",
      "classe-forastera|src/sections/gestoria/views/GestoriaIngesta.jsx|sdp-control",
      "classe-forastera|src/sections/gestoria/views/GestoriaIngesta.jsx|sdp-insignia",
      "classe-forastera|src/sections/gestoria/views/GestoriaIngesta.jsx|sdp-insignia--exit",
      "classe-forastera|src/sections/gestoria/views/GestoriaIngesta.jsx|sdp-num",
      "classe-forastera|src/sections/gestoria/views/GestoriaIngesta.jsx|sdp-taula",
      "classe-forastera|src/sections/multimedia/MultimediaSection.jsx|card",
      "classe-forastera|src/sections/multimedia/MultimediaSection.jsx|sdp-sr-only",
      "classe-forastera|src/sections/mur/MurSection.jsx|sdp-camp",
      "classe-forastera|src/sections/onboarding/OnboardingSection.jsx|sdp-alerta",
      "classe-forastera|src/sections/onboarding/OnboardingSection.jsx|sdp-alerta--error",
      "classe-forastera|src/sections/onboarding/OnboardingSection.jsx|sdp-boto--ple",
      "classe-forastera|src/sections/onboarding/OnboardingSection.jsx|sdp-boto--secundari",
      "classe-forastera|src/sections/onboarding/OnboardingSection.jsx|sdp-carregant",
      "classe-forastera|src/sections/onboarding/OnboardingSection.jsx|sdp-carregant__gir",
      "classe-forastera|src/sections/onboarding/OnboardingSteps.jsx|sdp-alerta",
      "classe-forastera|src/sections/onboarding/OnboardingSteps.jsx|sdp-alerta--error",
      "classe-forastera|src/sections/onboarding/OnboardingSteps.jsx|sdp-boto--ple",
      "classe-forastera|src/sections/onboarding/OnboardingSteps.jsx|sdp-boto--secundari",
      "classe-forastera|src/sections/onboarding/OnboardingSteps.jsx|sdp-boto__gir",
      "classe-forastera|src/sections/onboarding/OnboardingSteps.jsx|sdp-camp",
      "classe-forastera|src/sections/onboarding/OnboardingSteps.jsx|sdp-camp__ajuda",
      "classe-forastera|src/sections/onboarding/OnboardingSteps.jsx|sdp-camp__error",
      "classe-forastera|src/sections/onboarding/OnboardingSteps.jsx|sdp-camp__etiqueta",
      "classe-forastera|src/sections/onboarding/OnboardingSteps.jsx|sdp-casella",
      "classe-forastera|src/sections/onboarding/OnboardingSteps.jsx|sdp-casella__control",
      "classe-forastera|src/sections/onboarding/OnboardingSteps.jsx|sdp-casella__etiqueta",
      "classe-forastera|src/sections/onboarding/OnboardingSteps.jsx|sdp-control",
      "classe-forastera|src/sections/poblacio/PoblacioSection.jsx|sdp-molla__enllac",
      "classe-forastera|src/sections/poblacio/PoblacioSection.jsx|sdp-num",
      "classe-forastera|src/sections/poblacio/PoblacioSection.jsx|sdp-taula",
      "classe-forastera|src/sections/profile/DetallAjust.jsx|sdp-alerta__accions",
      "classe-forastera|src/sections/profile/DetallAjust.jsx|sdp-avatar",
      "classe-forastera|src/sections/profile/DetallAjust.jsx|sdp-avatar--xl",
      "classe-forastera|src/sections/profile/DetallAjust.jsx|sdp-boto--perill",
      "classe-forastera|src/sections/profile/DetallAjust.jsx|sdp-boto--primari",
      "classe-forastera|src/sections/profile/DetallAjust.jsx|sdp-buit",
      "classe-forastera|src/sections/profile/DetallAjust.jsx|sdp-camp",
      "classe-forastera|src/sections/profile/DetallAjust.jsx|sdp-camp__ajuda",
      "classe-forastera|src/sections/profile/DetallAjust.jsx|sdp-camp__check",
      "classe-forastera|src/sections/profile/DetallAjust.jsx|sdp-camp__error",
      "classe-forastera|src/sections/profile/DetallAjust.jsx|sdp-camp__etiqueta",
      "classe-forastera|src/sections/profile/DetallAjust.jsx|sdp-control",
      "classe-forastera|src/sections/profile/DetallAjust.jsx|sdp-control--area",
      "classe-forastera|src/sections/profile/PerfilShell.jsx|sdp-buit",
      "classe-forastera|src/sections/profile/ProfileSection.jsx|card",
      "classe-forastera|src/sections/profile/ProfileSection.jsx|card-link--active",
      "classe-forastera|src/sections/realitat/RealitatSection.jsx|card",
      "classe-forastera|src/sections/realitat/RealitatSection.jsx|card--accent",
      "classe-forastera|src/sections/realitat/RealitatSection.jsx|card--hover",
      "classe-forastera|src/sections/realitat/RealitatSection.jsx|realitat-btn",
      "classe-forastera|src/sections/realitat/RealitatSection.jsx|sdp-avatar",
      "classe-forastera|src/sections/realitat/RealitatSection.jsx|sdp-casella",
      "classe-forastera|src/sections/realitat/RealitatSection.jsx|sdp-casella__ajuda",
      "classe-forastera|src/sections/realitat/RealitatSection.jsx|sdp-casella__control",
      "classe-forastera|src/sections/realitat/RealitatSection.jsx|sdp-casella__etiqueta",
      "classe-forastera|src/sections/search/SearchSection.jsx|sdp-buit",
      "classe-forastera|src/sections/search/SearchSection.jsx|sdp-camp",
      "classe-forastera|src/sections/text/TextSection.jsx|cms-preview",
      "classe-forastera|src/sections/translations/TranslationsSection.jsx|card",
      "classe-forastera|src/sections/translations/TranslationsSection.jsx|card--accent",
      "classe-forastera|src/sections/translations/TranslationsSection.jsx|card--hover",
      "classe-forastera|src/sections/translations/TranslationsSection.jsx|sdp-llista",
      "classe-forastera|src/sections/xat/XatControlSection.jsx|card",
      "classe-forastera|src/sections/xat/XatSection.jsx|sdp-alerta__accions",
      "classe-forastera|src/sections/xat/XatSection.jsx|sdp-avatar",
      "classe-forastera|src/sections/xat/XatSection.jsx|sdp-boto--fantasma",
      "classe-forastera|src/sections/xat/XatSection.jsx|xat-bubble-content",
      "classe-forastera|src/sections/xat/XatSection.jsx|xat-bubble-wrapper",
      "classe-forastera|src/sections/xat/XatSection.jsx|xat-bubble-wrapper--block",
      "classe-forastera|src/sections/xat/XatSection.jsx|xat-divider",
      "classe-forastera|src/sections/xat/XatSection.jsx|xat-header-info",
      "classe-forastera|src/sections/xat/XatSection.jsx|xat-header-subtitle",
      "classe-forastera|src/sections/xat/XatSection.jsx|xat-scroll-area",
      "classe-forastera|src/sections/xat/XatSection.jsx|xat-sender-name"
    ]
  },
  "classe-opaca": {
    "max": 7,
    "identitats": [
      "classe-opaca|src/components/layout/AppGridColumn.jsx|app-grid-col-header${…}",
      "classe-opaca|src/components/ui/Accordion.jsx|accordion-item__fletxa${…}",
      "classe-opaca|src/components/universal/AvisadorEfimer.jsx|sdp-avisador--${…}",
      "classe-opaca|src/components/universal/PageFrame.jsx|toc-level-${…}",
      "classe-opaca|src/sections/gestoria/views/GestoriaIngesta.jsx|sdp-insignia--${…}",
      "classe-opaca|src/sections/xat/XatSection.jsx|sdp-avatar--${…}"
    ]
  }
}
```
<<<FI_FITXER>>>

## Fitxer: tooling/wiki/esquema_frontmatter.json

```
{
  "esquema": "sdp.frontmatter.v1",
  "generat": "2026-09-01",
  "origen": "Cens empíric de 96 documents (_wiki_de_poble + .agents), auditoria 260901.",
  "principi": [
    "Les CLAUS són interfície. Van en anglés només quan una eina externa ho exigix (Obsidian: tags, aliases). La resta, en valencià.",
    "Els VALORS són la llengua del projecte: valencià sempre.",
    "Una clau amb entropia 0 (un únic valor en tot el corpus) no prediu res. Fora.",
    "El que ja guarda git (data, autor, versió) no es duplica a mà. Duplicar-ho només garantix deriva."
  ],
  "universal": {
    "obligatories": {
      "tipus": {
        "enum": [
          "acta",
          "briefing",
          "document",
          "hub",
          "index",
          "informe",
          "norma",
          "plantilla",
          "prompt",
          "protocol",
          "registre",
          "skill",
          "petorreta"
        ],
        "nota": "Enum derivat de tooling/wiki/schema.json (v2), que és la font única. `petorreta` hi és perquè validatePetorreta() del Reflex l'exigix: sense ell, cap Petorreta pot ser alhora vàlida per al Reflex i per a esta porta. Ho verifica tractor-esquemes.mjs."
      },
      "estat": {
        "enum": [
          "canonic",
          "actiu",
          "esborrany",
          "arxivat",
          "quarantena",
          "generat",
          "futur"
        ],
        "nota": "Enum derivat de tooling/wiki/schema.json (v2). Absorbix `status`. `active` → `actiu`."
      },
      "description": {
        "tipus": "text",
        "max": 200,
        "nota": "Una línia. Absorbix `purpose` i `title`. El títol ja és l'H1 del cos."
      }
    },
    "opcionals": {
      "tags": {
        "tipus": "llista",
        "vocabulari_tancat": [
          "acta",
          "arquitectura",
          "core",
          "disseny",
          "escriptori",
          "genoma",
          "govern",
          "graf",
          "identitat",
          "legal",
          "maquina",
          "saber",
          "seguretat",
          "skills",
          "sollutia",
          "temporal"
        ],
        "nota": "Clau nativa d'Obsidian: et regala el panell d'etiquetes i la cerca sense cap dependència. Absorbix `temes`, que portava 51 bits contra els 220 de `tags` i coincidia amb ell en 0 de 51 fitxers. 30 termes reals → 14. Fora `socdepoble` (58 de 96 documents) i `sistema` (53): una etiqueta que porta quasi tot el corpus no distingix res. V7.1: s'afigen `seguretat` i `arquitectura`; discriminen (2-3 documents cadascun) i cap terme existent els cobria. La resta d'etiquetes fora de vocabulari es fusionen via migracio.valors.tags, no s'admeten."
      },
      "aliases": {
        "tipus": "llista",
        "nota": "Clau nativa d'Obsidian per a resolució d'enllaços. Hui no l'usa cap enllaç, però si la lleves i algú n'escriu un, es trencarà en silenci. Es queda."
      }
    }
  },
  "extensio_agent": {
    "abast": [
      ".agents/skills/*/SKILL.md",
      "_wiki_de_poble/02_saber/skills_mirror/AGENTS_*.md"
    ],
    "obligatories": {
      "name": {
        "tipus": "text",
        "nota": "Identificador de la skill. Ha de coincidir amb el nom de la carpeta."
      },
      "triggers_on": {
        "tipus": "llista",
        "nota": "Clau canònica. `triggers_ca` NO existix: una skill amb eixa clau està morta en silenci."
      },
      "core": {
        "tipus": "booleà"
      }
    },
    "nota_abast": "El mirall és una còpia byte a byte de les skills, generada per sincronitzar_skills.mjs. Porta les mateixes claus i per tant ha de viure sota les mateixes lleis. Deixar-lo fora d'abast produïa 38 falses infraccions F2 i amagava les reals.",
    "opcionals": {
      "prioritat": {
        "tipus": "enter",
        "nota": "Desempata gallets compartits. Menor = es carrega abans. Sense ell, dues skills amb el mateix gallet es resolen a l'atzar (tractor-registre R3)."
      }
    }
  },
  "migracio": {
    "renomena": {
      "status": "estat",
      "temes": "tags",
      "purpose": "description"
    },
    "valors": {
      "estat": {
        "active": "actiu",
        "futur": "esborrany",
        "auditat": "canonic"
      },
      "tipus": {
        "normativa": "norma",
        "estat": "registre"
      },
      "tags": {
        "skill": "skills",
        "ui": "disseny",
        "consell": "govern",
        "higiene": "core",
        "context": "core",
        "pensament": "saber",
        "qualitat": "core",
        "sistema": null,
        "flux": "maquina"
      }
    },
    "esborra_entropia_zero": [
      "lang",
      "owner",
      "authority_level",
      "authority",
      "requires",
      "conflicts_with",
      "related",
      "use_when",
      "skip_when",
      "scope",
      "effects",
      "tests",
      "author",
      "published",
      "created",
      "actualitzat",
      "revisat",
      "updated_at"
    ],
    "esborra_ho_guarda_git": [
      "version",
      "supersedes",
      "substitueix",
      "source"
    ],
    "esborra_redundant_amb_el_cos": [
      "title",
      "cssclasses"
    ],
    "conserva_fora_d_esquema": [
      "eines_obligatories"
    ],
    "nota_eines_obligatories": "2 usos, entropia 2.32, i les 5 rutes que declara existixen totes al disc. No és cerimònia: és un contracte viu de la skill. Es queda com a clau opcional de l'extensió d'agent fins que un tractor verifique eixes rutes; llavors passa a obligatòria.",
    "nota_tags": "`null` vol dir esborrar l'etiqueta, no reanomenar-la. `sistema` es va excloure del vocabulari perquè el portava més de la meitat del corpus."
  },
  "recompte": {
    "abans": 34,
    "despres": 10,
    "detall": "5 universals + 4 de l'extensio d'agent (name, triggers_on, core, prioritat) + eines_obligatories opcional."
  }
}
```
<<<FI_FITXER>>>

## Fitxer: tooling/wiki/schema-cutover.lock.json

```
{
  "schema": "socdepoble.schema-cutover.v1",
  "ready": true,
  "schemaSha256": "1ee08bd24d7637f0c86906e4487f7a01047c0a78b8189fd8efe2e1f937994590",
  "adapted": [
    "lib/frontmatter.mjs",
    "lib/wiki_walker.mjs",
    "autoneteja_wiki.mjs",
    "entropia_zero_router.mjs:deriva enums i límits de schema.json",
    "validate_taxonomia.mjs",
    "pre-commit.mjs",
    "compiler/build.cjs:arrel canònica + receipt",
    "compiler/01_build_index.cjs:v2 + receipt",
    "compiler/02_build_ontology.cjs:v2 + schema derivat + receipt",
    "contradiction_engine.mjs",
    "core/edge_rag.mjs",
    "core/pattern_extractor.mjs:sol lectura",
    "core/self_repair.mjs:tombstoned",
    "semantic_auditor.mjs",
    "teixidora_sinapsis.mjs:escriptura tombstonada (fail-closed amb throw verificat)",
    "consolidar_etiquetes.mjs:tombstoned",
    "scripts/enllacat-intelligent-wiki.mjs:parser v2 + sol lectura",
    "reflex_petorreta.mjs:Petorreta validada contra v2",
    "07_plantilles/plantilla_acta_unica.md",
    "plantilles/PLANTILLA_ISO_SDP.md",
    "00_SER_Brain_Identitat/DOC_Taula_Mestra.md"
  ],
  "blockers": [],
  "acceptance": [
    "Tots els lectors i escriptors vius de frontmatter usen lib/frontmatter.mjs i schema.json v2.",
    "Cap consumidor viu exigix tags, categoria, autor, version o dates legacy.",
    "wiki:test passa 26/26, inclòs el canari temporal apply-restore byte a byte i els dry-runs sense temporals.",
    "wiki:audit:strict, precommit:sdp i reflex:doctor són verds sobre la línia base de 92 notes.",
    "schemaSha256 coincidix amb el SHA-256 real de schema.json."
  ]
}
```
<<<FI_FITXER>>>

## Fitxer: tooling/wiki/schema.json

```
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://socdepoble.org/schemas/wiki-frontmatter-v2.1.json",
  "title": "Frontmatter can\u00f2nic de la Wiki de S\u00f3c de Poble",
  "description": "\u00danica font mec\u00e0nica de veritat per a les metadades Markdown de la Wiki.",
  "$comment": "S'aplica a contingut propi; mirrors i vendors conserven el seu contracte i s\u00f3n immutables.",
  "type": "object",
  "additionalProperties": false,
  "required": [
    "estat",
    "tipus",
    "description"
  ],
  "properties": {
    "estat": {
      "type": "string",
      "enum": [
        "canonic",
        "actiu",
        "esborrany",
        "arxivat",
        "quarantena",
        "generat",
        "futur"
      ]
    },
    "tipus": {
      "type": "string",
      "enum": [
        "acta",
        "briefing",
        "document",
        "hub",
        "index",
        "informe",
        "norma",
        "plantilla",
        "prompt",
        "protocol",
        "registre",
        "skill",
        "petorreta"
      ]
    },
    "description": {
      "type": "string",
      "minLength": 12,
      "maxLength": 140
    },
    "aliases": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 80
      },
      "maxItems": 5,
      "uniqueItems": true
    },
    "tags": {
      "type": "array",
      "items": {
        "type": "string",
        "enum": [
          "acta",
          "arquitectura",
          "core",
          "disseny",
          "escriptori",
          "genoma",
          "govern",
          "graf",
          "identitat",
          "legal",
          "maquina",
          "saber",
          "seguretat",
          "skills",
          "sollutia",
          "temporal"
        ]
      },
      "uniqueItems": true
    },
    "name": {
      "type": "string"
    },
    "triggers_on": {
      "type": "array",
      "items": {
        "type": "string"
      }
    },
    "core": {
      "type": "boolean"
    },
    "prioritat": {
      "type": "integer"
    }
  }
}
```
<<<FI_FITXER>>>

## Fitxer: tooling/wiki/teixidora_sinapsis.mjs

````
#!/usr/bin/env node
/**
 * teixidora_sinapsis.mjs — La Teixidora de Sinapsis (Enllaçat Intel·ligent del Cos)
 * Destí: 02_ACTUAR_Maquina_Tecnica/scripts/teixidora_sinapsis.mjs
 *
 * SUBSTITUEIX I DEROGA orphan_linker.mjs (la "Llei Zero Enllaços").
 * Aquell script ARRANCAVA els [[enllaços]] del cos i els soterrava al frontmatter:
 * és el que va deixar la 00_BIOS muda. Esta fa exactament el contrari, complint
 * la Regla 10 d'AUDITORIA_CANONICA (Integritat Neuronal): els conceptes clau
 * s'enllacen [[...]] la primera volta que apareixen AL COS DEL TEXT.
 *
 * PRINCIPIS (heretats de purge_ghost_links.mjs v2, el millor gos pastor viu):
 *  1. NO DESTRUCTIVA: dry-run real per defecte, sense crear Actes.
 *     El --DISABLED-procedeix legacy està tombstonat fins integrar pla+Reflex+rollback.
 *  2. Mai enllaços a #capçaleres ni a ^blocs: sempre a arxius complets.
 *  3. El codi és sagrat: frontmatter, blocs ``` i codi inline `..` es protegixen
 *     abans de tocar res (prohibit lobotomitzar exemples, cas Robotomia).
 *  4. Jerarquia del Mas: els Troncals (BIOS, GENOTIP, Governança...) guanyen
 *     tota col·lisió de noms; després mana el pilar (SER > GOVERNAR > SABER >
 *     ACTUAR); els docs `arxivat`/`deprecated` NO reben enllaços nous.
 *  5. Jurisdiccions excloses: Sollutia i els miralls d'agents no es toquen.
 *  6. Primera menció i prou: un concepte s'enllaça UNA volta per document,
 *     amb pressupost màxim per no fer sopa blava (defecte: 12).
 *  7. Passada estructural: les sinapsis nues («## Sinapsis» amb llistes sense
 *     corxetes, peus «**Tornar a:** X», punters «👉 X») es curen sempre,
 *     fora de pressupost. És el cas exacte de la 00_BIOS.
 *
 * ÚS:
 *   node teixidora_sinapsis.mjs                    # dry-run per stdout
 *   node teixidora_sinapsis.mjs --DISABLED-procedeix        # bloquejat fail-closed
 *   node teixidora_sinapsis.mjs --json             # resum JSON (Consola Term.)
 *   node teixidora_sinapsis.mjs --max=8            # pressupost per document
 *   node teixidora_sinapsis.mjs --fitxer=00_SER_Brain_Identitat/00_BIOS.md
 *
 * Zero dependències externes (Pedra Seca). Node >= 20 (fa servir lookbehind).
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { buildWikiIndex } from './lib/wiki_walker.mjs';
import { parseFrontmatter } from './lib/frontmatter.mjs';
import { getTimestamp } from './lib/termodinamic.mjs';
// Reflex_petorreta imports are currently disabled / mocked bypassed
import { WIKI_DIR } from './lib/project_paths.mjs';

const ESCRIPTORI = '04_escriptori';

/* ------------------------------------------------------------------ *
 * 0. CONFIGURACIÓ DE JERARQUIA (el mapa topogràfic del Mas)           *
 * ------------------------------------------------------------------ */

/** Jurisdiccions on la Teixidora NO cus per defecte (ni com a font ni destí). */
const JURISDICCIONS_EXCLOSES = [
  '00_SER_Brain_Identitat/Sollutia',
];

/** Pilars que mai es MODIFIQUEN (memòria morta o treball efímer). */
const PILARS_NO_MODIFICAR = ['90_historic', ESCRIPTORI];

/** Pilars que mai són DESTÍ d'enllaç automàtic (noms efímers). */
const PILARS_NO_DESTI = ['90_historic', ESCRIPTORI];

/** Documents Troncals (Tier 0): guanyen tota col·lisió. Font: 00_INDEX. */
const TRONCALS = new Set([
  '00_BIOS', '00_INDEX', '02_GENOTIP', '01_IDENTITAT', '02_FAMILIA',
  'Soci_Sollutia', '01_trellat', 'DOC_Governanca', 'ESTANDARD_Pedra_Seca',
  'FORJA_TO_CORE', '00_GLOSSARI_CANONIC', '00_visio_i_pilars',
  'LLEI_05_Privacitat', 'DOC_Taula_Mestra',
]);

/** Pes per pilar: qui mana quan dos fitxers es diuen quasi igual. */
const PES_PILAR = {
  '00_SER_Brain_Identitat': 90,
  '03_GOVERNAR_Normativa_Regles': 80,
  '01_SABER_Cultura_Coneixement': 70,
  '02_ACTUAR_Maquina_Tecnica': 60,
};

/** Paraules soles massa comunes: mai són candidat per si soles. */
const STOPLIST = new Set([
  'readme', 'index', 'skill', 'skills', 'agents', 'scripts', 'plantilles',
  'arquitectura', 'identitat', 'governanca', 'seguretat', 'disseny',
  'trellat', 'projecte', 'antigravity', 'wiki', 'core', 'doc',
]);

const MIN_LLARG_CANDIDAT = 5;
const MIN_COS_VIU = 80; // docs quasi buits: no es toquen

/* ------------------------------------------------------------------ *
 * 1. CLI                                                              *
 * ------------------------------------------------------------------ */
const args = process.argv.slice(2);
const PROCEDEIX = args.includes('--procedeix');
const JSON_OUT = args.includes('--json');
const MAX_PER_DOC = Number((args.find(a => a.startsWith('--max=')) || '--max=12').split('=')[1]) || 12;
const NOMES_FITXER = (args.find(a => a.startsWith('--fitxer=')) || '').split('=')[1] || null;

const aPosix = (p) => p.split(path.sep).join('/');
const dinsDe = (rel, llista) => llista.some(j => aPosix(rel).startsWith(j + '/') || aPosix(rel) === j);
const escapaRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/* ------------------------------------------------------------------ *
 * 2. SEGMENTADOR: frontmatter i blocs de codi queden fora de perill.  *
 *    (Mateixa doctrina que purge_ghost_links v2.)                     *
 * ------------------------------------------------------------------ */
function segmentaMarkdown(content) {
  const segments = [];
  let resta = content;

  if (/^---\r?\n/.test(resta)) {
    const m = resta.slice(4).match(/\r?\n---(\r?\n|$)/);
    if (m) {
      const tall = 4 + m.index + m[0].length;
      segments.push({ codi: true, text: resta.slice(0, tall) });
      resta = resta.slice(tall);
    }
  }

  const linies = resta.split(/(\r?\n)/);
  let buf = '';
  let enFence = false;
  let marca = '';
  let llargariaMarca = 0;
  const buida = (codi) => { if (buf) segments.push({ codi, text: buf }); buf = ''; };

  for (const tros of linies) {
    const obri = tros.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (!enFence && obri) {
      buida(false); enFence = true; marca = obri[1][0]; llargariaMarca = obri[1].length; buf += tros;
    } else if (enFence) {
      buf += tros;
      const tanca = tros.match(/^\s{0,3}(`{3,}|~{3,})\s*$/);
      if (tanca && tanca[1][0] === marca && tanca[1].length >= llargariaMarca) { buida(true); enFence = false; }
    } else {
      buf += tros;
    }
  }
  buida(enFence);
  return segments;
}

/** Emmascara dins d'un segment viu tot allò intocable. */
function emmascara(text) {
  const rebost = [];
  const guarda = (m) => { rebost.push(m); return `\u0001${rebost.length - 1}\u0001`; };
  let t = text
    .replace(/<!--[\s\S]*?-->/g, guarda)           // HTML comments
    .replace(/<[^>]+>/g, guarda)                   // HTML tags
    .replace(/\$\$[\s\S]*?\$\$/g, guarda)          // Math blocks
    .replace(/\$[^$\n]+\$/g, guarda)               // Inline math
    .replace(/\[\^[^\]]+\]/g, guarda)              // Footnotes
    .replace(/!?\[\[[^\]]*\]\]/g, guarda)          // wikilinks i embeds existents
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, guarda)     // enllaços markdown [x](y)
    .replace(/(`+)([\s\S]*?)\1/g, guarda)          // codi inline
    .replace(/https?:\/\/\S+/g, guarda)            // URLs nues
    .replace(/^#{1,6} .*$/gm, guarda);             // capçaleres: no s'hi cus
  return { t, rebost };
}
const restaura = (text, rebost) => {
  let actual = text;
  for (let volta = 0; volta <= rebost.length; volta++) {
    const seguent = actual.replace(/\x01(\d+)\x01/g, (_, i) => rebost[Number(i)]);
    if (seguent === actual) return actual;
    actual = seguent;
  }
  if (/\x01\d+\x01/.test(actual)) throw new Error('Emmascarament niat no restaurable; es cancel·la sense escriure.');
  return actual;
};

/* ------------------------------------------------------------------ *
 * 3. ÍNDEX DE DESTINS amb jerarquia i àlies.                          *
 * ------------------------------------------------------------------ */
function pesDe(relPath, base, estat) {
  if (TRONCALS.has(base)) return 100;
  const pilar = aPosix(relPath).split('/')[0];
  let pes = PES_PILAR[pilar] ?? 10;
  if (estat === 'canonic') pes += 15;
  return pes;
}

function candidatsDe(base, fmData, cosViu) {
  const c = new Set();
  const afig = (s) => {
    if (!s) return;
    const net = String(s).trim();
    if (net.length < MIN_LLARG_CANDIDAT && !TRONCALS.has(base)) return;
    if (STOPLIST.has(net.toLowerCase())) return;
    if (/^[a-zàèéíòóúç]+$/i.test(net) && !net.includes('_') && net.length < 10) return; // paraula sola curta
    c.add(net);
  };
  afig(base);
  const sensePrefix = base.replace(/^\d+_\d+_/, '').replace(/^\d+_/, '');
  afig(sensePrefix);
  afig(sensePrefix.replace(/_/g, ' '));
  const aliases = Array.isArray(fmData.aliases) ? fmData.aliases : [];
  for (const a of aliases) afig(a);
  const h1 = (cosViu.match(/^# (.+)$/m) || [])[1];
  if (h1) {
    const net = h1.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '').replace(/^[\s:—-]+|[\s:—-]+$/g, '');
    if (net.length >= 8 && net.length <= 60 && !/[:|]/.test(net)) afig(net);
  }
  return [...c];
}

async function construixIndexDestins(mdDocs) {
  const perCandidat = new Map(); // candidatMinuscula -> { base, pes, candidat }
  const colisions = [];
  const targetables = new Map(); // base -> true

  for (const doc of mdDocs) {
    const rel = aPosix(doc.relPath);
    if (dinsDe(rel, JURISDICCIONS_EXCLOSES)) continue;
    if (PILARS_NO_DESTI.some(p => rel.startsWith(p + '/'))) continue;
    const base = doc.name.replace(/\.md$/, '');
    if (base.includes('_BUNDLE_') || base.includes('BUNDLE_') || base.includes('_PETORRETA_') || base.includes('PETORRETA_')) continue;
    const { data } = parseFrontmatter(doc.content);
    const estat = (data.estat || '').toLowerCase();
    if (estat === 'arxivat' || estat === 'deprecated') continue; // no enllacem cap a morts
    targetables.set(base, true);
    const pes = pesDe(doc.relPath, base, estat);
    const cos = doc.content;
    for (const cand of candidatsDe(base, data, cos)) {
      const clau = cand.toLowerCase();
      const previ = perCandidat.get(clau);
      if (!previ) {
        perCandidat.set(clau, { base, pes, candidat: cand });
      } else if (previ.base !== base) {
        if (pes > previ.pes) {
          colisions.push({ candidat: cand, guanya: base, perd: previ.base });
          perCandidat.set(clau, { base, pes, candidat: cand });
        } else {
          colisions.push({ candidat: cand, guanya: previ.base, perd: base });
        }
      }
    }
  }
  // Ordenats de llarg a curt: el match llarg mana.
  const ordenats = [...perCandidat.values()].sort((a, b) => b.candidat.length - a.candidat.length);
  return { ordenats, perCandidat, targetables, colisions };
}

/** Resol un nom nu (sinapsis, Tornar a:, 👉) cap a un base real. */
function resolNom(nomBrut, perCandidat, targetables) {
  let n = nomBrut.trim().replace(/[.,;:!]+$/, '').trim();
  if (!n || n.length > 80) return null;
  const proves = [n, n.replace(/ /g, '_'), n.replace(/_/g, ' ')];
  for (const p of proves) {
    if (targetables.has(p)) return p;
    const hit = perCandidat.get(p.toLowerCase());
    if (hit) return hit.base;
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * 4. LA COSTURA: primera menció + passada estructural.                *
 * ------------------------------------------------------------------ */
function cusDocument(doc, index) {
  const base = doc.name.replace(/\.md$/, '');
  const segments = segmentaMarkdown(doc.content);
  const jaEnllacats = new Set(
    [...doc.content.matchAll(/\[\[([^\]|#]+)/g)].map(m => m[1].trim())
  );
  let afegits = 0;
  const detall = [];

  const nous = segments.map(seg => {
    if (seg.codi) return seg.text;
    let { t, rebost } = emmascara(seg.text);

    /* 4a. PASSADA ESTRUCTURAL (sinapsis nues, Tornar a:, 👉) — sense pressupost */
    const estructural = (nomBrut) => {
      const desti = resolNom(nomBrut, index.perCandidat, index.targetables);
      if (!desti || desti === base) return null;
      jaEnllacats.add(desti);
      afegits++;
      detall.push({ tipus: 'estructural', desti, text: nomBrut.trim() });
      const net = nomBrut.trim();
      return net === desti ? `[[${desti}]]` : `[[${desti}|${net}]]`;
    };

    // 👉 Punter  /  → Punter
    t = t.replace(/(^|\n)(\s*(?:👉|→)\s*)([^\n\x01]+)/g, (m, pre, fletxa, resta) => {
      const peces = resta.split(/,\s*/).map(p => estructural(p) || p.trim());
      return `${pre}${fletxa}${peces.join(', ')}`;
    });

    // **Tornar a:** X, Y
    t = t.replace(/(\*\*Tornar a:\*\*\s*)([^\n\x01]+)/g, (m, pre, resta) => {
      const peces = resta.split(/,\s*/).map(p => estructural(p) || p.trim());
      return `${pre}${peces.join(', ')}`;
    });

    // Llistes sota capçaleres de Sinapsis / Veure també (les capçaleres estan
    // emmascarades, així que detectem el bloc per la línia original del segment).
    const teSinapsis = /#{2,3} .*(Sinapsi|Sinapsis|Veure també|Enllaços de Tornada)/i.test(seg.text);
    if (teSinapsis) {
      t = t.replace(/(^|\n)(\s*[-*]\s+)([^\n\x01[]+)$/gm, (m, pre, guio, nom) => {
        const cusit = estructural(nom);
        return cusit ? `${pre}${guio}${cusit}` : m;
      });
    }

    /* 4b. PRIMERA MENCIÓ AL COS — amb pressupost */
    for (const { base: desti, candidat } of index.ordenats) {
      if (afegits >= MAX_PER_DOC + detall.filter(d => d.tipus === 'estructural').length) break;
      if (desti === base || jaEnllacats.has(desti)) continue;
      const re = new RegExp(`(?<![\\w\\[\\]|/#\\-.])${escapaRegex(candidat)}(?![\\w\\]|/#\\-])`);
      const m = re.exec(t);
      if (!m) continue;
      const trobat = m[0];
      const enllac = trobat === desti ? `[[${desti}]]` : `[[${desti}|${trobat}]]`;
      t = t.slice(0, m.index) + enllac + t.slice(m.index + trobat.length);
      jaEnllacats.add(desti);
      afegits++;
      detall.push({ tipus: 'concepte', desti, text: trobat });
    }

    return restaura(t, rebost);
  });

  let nouContingut = nous.join('');
  
  const pilar = doc.relPath.split(/[/\\]/)[0];
  let categoriaStr = 'General';
  if (pilar.includes('SER')) categoriaStr = 'Identitat';
  else if (pilar.includes('SABER')) categoriaStr = 'Coneixement';
  else if (pilar.includes('ACTUAR')) categoriaStr = 'Maquina';
  else if (pilar.includes('GOVERNAR')) categoriaStr = 'Govern';
  else if (pilar.includes('ARXIU')) categoriaStr = 'Arxiu';

  // La taxonomia es gestiona exclusivament al Frontmatter.
  // Ja no s'injecten blocs '## Taxonomia' al cos del text per evitar pol·luir el Graf visual d'Obsidian.

  return { nouContingut, afegits, detall };
}

/* ------------------------------------------------------------------ *
 * 5. MOTOR PRINCIPAL                                                  *
 * ------------------------------------------------------------------ */
export async function teixeix(wikiDir = WIKI_DIR) {


  if (PROCEDEIX) {
    console.log('🤖 Operant la Teixidora en mode escriptura.');
  }
  const { mdDocs } = await buildWikiIndex(wikiDir);
  const index = await construixIndexDestins(mdDocs);

  const resum = {
    ok: true,
    mode: PROCEDEIX ? 'ESCRIPTURA' : 'DRY-RUN',
    fitxers_revisats: 0,
    fitxers_modificats: 0,
    enllacos_afegits: 0,
    colisions: index.colisions.length,
    canvis: [],
  };

  const docsToUpdate = [];

  for (const doc of mdDocs) {
    const rel = aPosix(doc.relPath);
    if (NOMES_FITXER && rel !== aPosix(NOMES_FITXER)) continue;
    if (doc.name.includes('_BUNDLE_') || doc.name.includes('BUNDLE_') || doc.name.includes('_PETORRETA_') || doc.name.includes('PETORRETA_')) continue;
    if (dinsDe(rel, JURISDICCIONS_EXCLOSES)) continue;
    if (PILARS_NO_MODIFICAR.some(p => rel.startsWith(p + '/'))) continue;

    const { body } = parseFrontmatter(doc.content);
    if ((body || '').trim().length < MIN_COS_VIU) continue;

    resum.fitxers_revisats++;
    const { nouContingut, afegits, detall } = cusDocument(doc, index);
    if (afegits === 0 || nouContingut === doc.content) continue;

    resum.fitxers_modificats++;
    resum.enllacos_afegits += afegits;
    resum.canvis.push({ fitxer: rel, afegits, detall });

    if (PROCEDEIX) {
      docsToUpdate.push({ doc, nouContingut });
    }
  }

  if (PROCEDEIX && docsToUpdate.length > 0) {
    for (const { doc, nouContingut } of docsToUpdate) {
      await fs.writeFile(path.join(wikiDir, doc.relPath), nouContingut, 'utf8');
    }
  }

  /* Acta a l'Escriptori (sempre en dry-run; en escriptura, com a registre). */
  const ts = getTimestamp();
  const nomActa = `${ts}_ACTA_Teixidora_Proposta_Insercio_Enllacos_Interns_Cos_Documents_Canonics.md`;
  const dirActa = path.join(wikiDir, ESCRIPTORI);
  const linies = [
    `# Acta de la Teixidora de Sinapsis (${resum.mode})`,
    '',
    `- Fitxers revisats: ${resum.fitxers_revisats}`,
    `- Fitxers ${PROCEDEIX ? 'modificats' : 'amb proposta'}: ${resum.fitxers_modificats}`,
    `- Enllaços ${PROCEDEIX ? 'cosits' : 'proposats'}: ${resum.enllacos_afegits}`,
    `- Col·lisions de nom resoltes per jerarquia: ${resum.colisions}`,
    '',
    ...resum.canvis.map(c =>
      `## ${c.fitxer} (+${c.afegits})\n` +
      c.detall.map(d => `- [${d.tipus}] «${d.text}» → [[${d.desti}]]`).join('\n')
    ),
    '',
    ...(index.colisions.length
      ? ['## Col·lisions (guanya el pes de jerarquia)',
         ...index.colisions.map(k => `- «${k.candidat}»: ${k.guanya} guanya a ${k.perd}`)]
      : []),
    '',
    '> (Escriptura reactivada)',
  ];
  try {
    if (PROCEDEIX) {
      await fs.mkdir(dirActa, { recursive: true });
      await fs.writeFile(path.join(dirActa, nomActa), linies.join('\n'), 'utf8');
      resum.acta = `${ESCRIPTORI}/${nomActa}`;
    } else {
      resum.acta = 'No generada (Dry-Run forçós)';
    }
    if (!PROCEDEIX) return resum;
  } catch {
    resum.acta = null; // Escriptori bloquejat: el resum ix igualment per consola.
  }

  return resum;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  teixeix()
    .then(r => {
      if (JSON_OUT) {
        console.log(JSON.stringify(r, null, 2));
      } else {
        console.log(`\n🧵 [TEIXIDORA] ${r.mode}`);
        console.log(`   Fitxers revisats: ${r.fitxers_revisats}`);
        console.log(`   Fitxers ${r.mode === 'ESCRIPTURA' ? 'modificats' : 'amb proposta'}: ${r.fitxers_modificats}`);
        console.log(`   Enllaços: ${r.enllacos_afegits} | Col·lisions: ${r.colisions}`);
        if (r.acta) console.log(`   Acta: ${r.acta}`);
        if (r.mode !== 'ESCRIPTURA') console.log('   → No s’ha escrit res; qualsevol cosit futur necessita un pla canònic.');
      }
      process.exit(0);
    })
    .catch(err => {
      console.error('❌ [TEIXIDORA] Error crític:', err);
      process.exit(1);
    });
}
````
<<<FI_FITXER>>>

## Fitxer: tooling/wiki/tractor-cervell-ia.mjs

```
#!/usr/bin/env node
/**
 * tractor-cervell-ia.mjs — Tractor d'Auto-Categorització (Radar Mode)
 *
 * Principi: Llig el cos de cada document, n'extrau el significat i detecta
 * anomalies de frontmatter basant-se en l'esquema v2.1.
 *
 * Regles (Pedra Seca):
 * 1. Zero LLM extern en temps d'execució.
 * 2. 100% LECTURA. Només imprimeix un dictamen per consola. "Una sola arada per solc".
 * 3. La reescriptura del frontmatter depèn de les portes mecàniques oficials, no d'aquest tractor.
 */

import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { buildWikiIndex, parseFrontmatter } from './lib/wiki_walker.mjs';
import { parseFrontmatter as readSharedFm } from './lib/frontmatter.mjs';
import { WIKI_DIR, SKILLS_DIR, TOOLING_WIKI_DIR } from './lib/project_paths.mjs';

const ESQUEMA_PATH = path.join(TOOLING_WIKI_DIR, 'schema.json');

// --- 1. LECTURA DE L'ESQUEMA CANÒNIC ---
let schema;
try {
  schema = JSON.parse(readFileSync(ESQUEMA_PATH, 'utf8'));
} catch (err) {
  console.error("❌ Error crític: No s'ha pogut llegir schema.json");
  process.exit(1);
}

const TIPUS_PERMESOS = schema.properties.tipus.enum;
const TAGS_PERMESOS = schema.properties.tags.items.enum;

// --- 2. MOTOR D'INFERÈNCIA TF-IDF LÈXIC ---
function deduiexTipus(title, desc, body) {
  const fullText = `${title} ${title} ${title} ${desc} ${desc} ${body}`.toLowerCase();
  
  if (/\b(acta|sessio|marmota)\b/i.test(fullText)) return 'acta';
  if (/\b(prompt|petorreta)\b/i.test(fullText)) return 'petorreta';
  if (/\b(auditoria|informe)\b/i.test(fullText)) return 'informe';
  if (/\bskill\b/i.test(fullText)) return 'skill';
  
  return 'document'; // Fallback per defecte
}

function dedueixTags(title, desc, body) {
  const fullText = `${title} ${title} ${title} ${desc} ${desc} ${body}`.toLowerCase();
  const foundTags = [];

  for (const tag of TAGS_PERMESOS) {
    const regex = new RegExp(`\\b${tag.toLowerCase()}\\b`, 'i');
    if (regex.test(fullText)) {
      foundTags.push(tag);
    }
  }
  
  return foundTags.slice(0, 3);
}

// --- 3. FUNCIÓ PRINCIPAL ---
async function principal() {
  console.log(`🚜 Iniciant Tractor d'Auto-Categorització (Mode: RADAR / LECTURA PURA)`);

  // Caminem Wiki i Skills
  const wikiIndex = await buildWikiIndex(WIKI_DIR);
  const skillsIndex = await buildWikiIndex(SKILLS_DIR);
  
  const allDocs = [...wikiIndex.mdDocs, ...skillsIndex.mdDocs];
  let processedCount = 0;
  
  const dictamen = {
    data: new Date().toISOString(),
    anomalies: []
  };

  for (const doc of allDocs) {
    // Ignorem directoris prohibits i els propis dictàmens històrics
    if (doc.relPath.includes('01_Produccio') || doc.relPath.includes('90_arxiu_historic') || doc.name.includes('_DICTAMEN_') || doc.name.includes('_BUNDLE_')) {
      continue;
    }

    const fm = readSharedFm(doc.content);
    const fmData = fm.data;
    
    // Purgar entropia zero heretada (Només detectem per a l'informe)
    let teEntropiaZero = false;
    let teTagsForasters = false;
    let faltaTipus = false;
    let faltenTags = false;
    
    const allowedKeys = Object.keys(schema.properties);
    
    // Purga inversa: busquem qualsevol clau que no estiga a l'esquema
    Object.keys(fmData).forEach(key => {
      if (!allowedKeys.includes(key)) {
        teEntropiaZero = true;
        if (!dictamen.anomalies.clausFalses) dictamen.anomalies.clausFalses = [];
      }
    });
    
    if (fmData.tags && Array.isArray(fmData.tags)) {
      const validTags = fmData.tags.filter(t => TAGS_PERMESOS.includes(t));
      if (validTags.length !== fmData.tags.length) teTagsForasters = true;
    }
    
    if (!fmData.tipus || !TIPUS_PERMESOS.includes(fmData.tipus)) {
      faltaTipus = true;
    }
    
    if (!fmData.tags || fmData.tags.length === 0) {
      faltenTags = true;
    }

    if (teEntropiaZero || teTagsForasters || faltaTipus || faltenTags) {
      processedCount++;
      const proposta = { ...fmData };
      
      // Construïm la proposta neta per l'informe
      Object.keys(proposta).forEach(key => {
        if (!allowedKeys.includes(key)) delete proposta[key];
      });
      
      if (teTagsForasters && proposta.tags) {
        proposta.tags = proposta.tags.filter(t => TAGS_PERMESOS.includes(t));
      }
      
      if (faltaTipus) {
        proposta.tipus = deduiexTipus(doc.name, proposta.description || '', fm.body);
      }
      
      if (faltenTags) {
        const sugg = dedueixTags(doc.name, proposta.description || '', fm.body);
        if (sugg.length > 0) proposta.tags = sugg;
      }

      dictamen.anomalies.push({
        fitxer: doc.relPath,
        motius: {
          entropiaZero: teEntropiaZero,
          tagsForasters: teTagsForasters,
          mancaTipus: faltaTipus,
          mancaTags: faltenTags
        },
        propostaFrontmatter: proposta
      });
    }
  }

  // Generar dictamen a stdout
  console.log(`\n======================================================`);
  console.log(`# 🚜 Dictamen Radar Tractor Auto-Categorització`);
  console.log(`======================================================`);
  console.log(`Fitxers escanejats totals: ${allDocs.length}`);
  console.log(`Fitxers amb anomalies semàntiques: ${processedCount}`);
  console.log(`======================================================\n`);
  
  for (const anomalia of dictamen.anomalies) {
    console.log(`### ${anomalia.fitxer}`);
    let problemes = [];
    if (anomalia.motius.entropiaZero) problemes.push("Claus fòssils");
    if (anomalia.motius.tagsForasters) problemes.push("Tags fora d'esquema");
    if (anomalia.motius.mancaTipus) problemes.push("Manca Tipus (Inferit)");
    if (anomalia.motius.mancaTags) problemes.push("Manca Tags (Inferits)");
    console.log(`- **Detectat:** ${problemes.join(', ')}`);
    console.log(`- **Proposta neta:**\n\`\`\`json\n${JSON.stringify(anomalia.propostaFrontmatter, null, 2)}\n\`\`\`\n`);
  }
  
  if (processedCount === 0) {
    console.log(`✅ Cap anomalia semàntica detectada. Tot net.`);
  } else {
    console.log(`\n⚠️ ${processedCount} documents requereixen atenció. Feu servir els codemods o el Reflex per escriure les solucions.`);
  }
}

principal().catch(console.error);
```
<<<FI_FITXER>>>

<<<FI_DEL_BUNDLE>>>
