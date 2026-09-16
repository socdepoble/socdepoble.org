# BUNDLE D'AUDITORIA PER AL CONSELL DE LA PETORRETA

> **Anclatge**: aquest document pertany a l'[[00_INDEX_ESCRIPTORI]].

## Com verificar aquest bundle

El bloc `MANIFEST` de baix porta ruta, bytes, línies i sha256 de cada
fitxer. No cal creure el capçal: extrau el cos i compara les sumes.
El contracte d'abast (què s'inclou i què no) també hi és declarat, així
que sabeu exactament què **no** esteu veient.

```json
{"esquema":"sdp.bundle.v2","generat":"2026-09-16T20:48:00.247Z","arrel":"socdepoble.org","verificat":true,"contracte":{"directoris":[],"fitxers_obligatoris":["public/auth/callback.html","src/host.js","src/data/oauthRelay.js","supabase/migrations/260916_2300_correccions_mur_i_xat.sql","src/app/App.jsx"],"fitxers_opcionals":[".agents/deute/.design-guard-deute.json",".agents/deute/.estucat-deute.json",".agents/deute/.frontmatter-deute.json",".agents/deute/.nomenclatura-deute.json",".agents/deute/.pedra-seca-deute.json",".agents/deute/.promesa-deute.json",".agents/deute/.rutes-deute.json",".agents/deute/.teixit-deute.json",".agents/deute/.vocabulari-deute.json"],"extensions":[".cjs",".css",".html",".js",".json",".jsx",".md",".mjs",".php",".py",".sh",".sql",".ts",".tsx",".txt",".yaml",".yml"],"dirs_exclosos":[".brain-reports",".gemini",".git",".githooks",".husky",".next",".obsidian",".sdp-paperera",".sdp-reflex","90_arxiu_historic","90_historic","build","cervells","coverage","dist","node_modules","skills_mirror","vendor"],"fitxers_prohibits":["all_ai_responses.md","doc_logos_oficials.md","legalcontent.js","perfil_psiquiatric.md","soci_sollutia.md"]},"totals":{"fitxers":14,"bytes":111136},"absents_no_critics":[],"fitxers":[{"ruta":".agents/deute/.design-guard-deute.json","bytes":2595,"linies":68,"sha256":"a50595f21f293c5e60b58e88c7c1be27a3b209ac4a681942826646f5cc5f408f"},{"ruta":".agents/deute/.estucat-deute.json","bytes":2788,"linies":74,"sha256":"89d3b8321de059b4097091747588d65041163e9ba8646a8a40c51dc3aabcc0ab"},{"ruta":".agents/deute/.frontmatter-deute.json","bytes":359,"linies":17,"sha256":"e865c0ace0d40424ae4a1cfd14ae6f9a727dfa0ee7146d6395ec9308b3ca9dfe"},{"ruta":".agents/deute/.nomenclatura-deute.json","bytes":98,"linies":9,"sha256":"0bebb4582da53aeb52ca187de5ef0656c802f73c1dcb7953938b8b2a30662408"},{"ruta":".agents/deute/.pedra-seca-deute.json","bytes":7381,"linies":151,"sha256":"42f2a7e1c7217e8a9f76bb4322d68be142cef0d6c95d41c7ab817e357c4e2f6f"},{"ruta":".agents/deute/.promesa-deute.json","bytes":405,"linies":13,"sha256":"ddd93695e0ec78a2939b19177e1e836cd6b6e511a5fcf40dce601e7647264456"},{"ruta":".agents/deute/.rutes-deute.json","bytes":3718,"linies":45,"sha256":"bb4e3c48ca1b7ebb7b50f2fe81e3dab88b45b20637445f01a33049b1dad7d622"},{"ruta":".agents/deute/.teixit-deute.json","bytes":137,"linies":10,"sha256":"7ed4460995e906f3023d4e9723b5784ddce3a4246c741ca4af2c87d9a0a266ee"},{"ruta":".agents/deute/.vocabulari-deute.json","bytes":27392,"linies":346,"sha256":"f3764df432004aea5ad1b97a6aeec4f7f98cdd593eff7f2ccd829a283cd892e7"},{"ruta":"public/auth/callback.html","bytes":7536,"linies":185,"sha256":"abb51b4ac5f58df152b455bbf5603ae8640e29856eb58c3d0316febbf3186dcc"},{"ruta":"src/app/App.jsx","bytes":29645,"linies":689,"sha256":"803f99268c72219c269db4c1b33766df3b89fbebb9adaff565a8bafa282b1705"},{"ruta":"src/data/oauthRelay.js","bytes":14181,"linies":344,"sha256":"799de80c5a8c84788ad0cd23eaa46179888c6915de048268e3f72ff8c476dcfe"},{"ruta":"src/host.js","bytes":12169,"linies":288,"sha256":"bf790018bc7dcce22c09072aba2adf9d75a1febcb3d335b06b08a57a41e592fc"},{"ruta":"supabase/migrations/260916_2300_correccions_mur_i_xat.sql","bytes":2732,"linies":54,"sha256":"0e3c857ec2d1c9c8acc44e02a6b2bbd881c6366a84341e94b8885e399fe0efcc"}]}
```

---

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
  "generat": "2026-09-16T20:13:43.770Z",
  "max": {
    "P1": 0,
    "P2": 2,
    "P3": 0
  },
  "ids": [
    "P2|.agents/hooks/preflight_matrix_wrapper.mjs|executa «tooling/brain/reflex_plantilles.mjs» i el catch només registra: la fallada es degrada a avís",
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

## Fitxer: public/auth/callback.html

```
<!doctype html>
<html lang="ca">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; base-uri 'none'; form-action 'none';">
<title>Tornant a Sóc de Poble</title>
<!--
  RELÉ D'AUTENTICACIÓ · SÓC DE POBLE
  ==================================
  Aquest fitxer és l'ÚNICA adreça que ha d'estar a la llista blanca de
  Supabase. Mai canvia. Els `localhost`, els entorns de Sollutia i el
  WordPress de proves no hi apareixen mai: el proveïdor d'identitat no els
  ha de conéixer.

  QUÈ FA:
    1. Rep `?code=` de Supabase (flux PKCE).
    2. Llig `?sdp_origin=` — d'on venia la petició.
    3. VALIDA eixe origen contra la llista d'ací baix, per igualtat exacta.
    4. Torna el codi a eixe origen.

  QUÈ NO FA:
    No veu mai el `code_verifier`. No veu mai un token. Si algú es fa amb el
    codi que passa per ací, no li servix de res: sense el verificador —que no
    ix mai de la pestanya que va iniciar el flux— no es pot bescanviar.

  SEGURETAT — LLIG AÇÒ ABANS DE TOCAR RES:
    ORÍGENS_PERMESOS es compara amb `===`. Mai amb `startsWith`, `includes`
    ni expressions regulars. Un `startsWith('https://socdepoble')` acceptaria
    `https://socdepoble.atacant.com` i convertiria aquest fitxer en un
    redirector obert. Això és robatori de sessions.

  DESPLEGAMENT:
    Servix-lo com a fitxer estàtic a https://auth.socdepoble.org/callback
    (ÚNICA font de veritat: RELAY_PER_DEFECTE de src/data/oauthRelay.js.
     Ho verifica tooling/gates/tractor-frontera-auth.mjs.)
    i registra EIXA adreça (i només eixa) a Supabase › Authentication ›
    URL Configuration › Redirect URLs. A Google Cloud Console no cal tocar
    res: allí ja hi ha el callback de Supabase.
-->
<style>
  :root { --sp-taronja: #FF7300; --sp-blau: #0984E3; --sp-negre: #000000; --sp-blanc: #FFFFFF; }
  * { box-sizing: border-box; }
  body {
    margin: 0; min-height: 100vh; display: grid; place-items: center;
    background: var(--sp-blanc); color: var(--sp-negre);
    font-family: "Noto Sans", system-ui, sans-serif; font-size: 18px; line-height: 1.5;
    padding: 24px;
  }
  main { max-width: 34rem; }
  h1 { font-size: 22px; font-weight: 700; margin: 0 0 12px; }
  p { margin: 0 0 16px; }
  .marca { width: 56px; height: 8px; background: var(--sp-taronja); margin-bottom: 20px; }
  code { background: #000; color: #fff; padding: 2px 6px; font-size: 16px; }
  a.tornar {
    display: inline-flex; align-items: center; min-height: 48px; padding: 0 20px;
    background: var(--sp-blau); color: var(--sp-blanc); text-decoration: none; font-weight: 700;
  }
  a.tornar:focus-visible { outline: 4px solid var(--sp-taronja); outline-offset: 3px; }
  [hidden] { display: none !important; }
  @media (prefers-reduced-motion: no-preference) {
    .esperant { animation: batec 1.4s ease-in-out infinite; }
    @keyframes batec { 0%,100% { opacity: 1 } 50% { opacity: .45 } }
  }
</style>
</head>
<body>
<main>
  <div class="marca" aria-hidden="true"></div>
  <div id="esperant" class="esperant">
    <h1>Tornant al teu poble…</h1>
    <p>Tanca't sola, esta finestra. Si no ho fa en uns segons, tanca-la tu.</p>
  </div>
  <div id="error" hidden role="alert">
    <h1 id="error-titol">No s'ha pogut completar l'entrada</h1>
    <p id="error-cos"></p>
    <a class="tornar" id="error-tornar" href="/" hidden>Tornar a provar</a>
  </div>
</main>

<script>
(function () {
  'use strict';

  /* ─── LLISTA BLANCA D'ORÍGENS ───
     Afegix ací cada entorn nou. Igualtat exacta, sense barra final. */
  var ORIGENS_PERMESOS = [
    /* ── Domini propi ── */
    'https://socdepoble.org',
    'https://www.socdepoble.org',

    /* ── Amfitrions de Sollutia ──────────────────────────────────────────
       CADA WordPress on s'incrusta el component és un origen distint, i cap
       origen absent d'esta llista pot entrar amb Google. Fins que no
       s'òmpliga, l'entrada només funciona als dominis propis i en local.

       Afegix ací l'origen EXACTE de cada desplegament, sense barra final i
       amb el port si en té. Un per línia. Res de comodins.
    ── */
    'https://socdepoble.sollutia.com',
    'https://socdepoble.sollutia.cat',
    'https://auth.socdepoble.org',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://localhost:8000',
    'http://localhost:3340'
  ];

  var params = new URLSearchParams(window.location.search);
  var codi = params.get('code');
  var origen = params.get('sdp_origin');
  /* `sdp_path` és tan controlable per l'atacant com `sdp_origin`, i fins a la
     V7.1 només se li forçava una barra inicial. No pot creuar d'origen (el
     host ja el fixa `origen`), però un `#` dins seu trencava el fragment i
     matava l'entrada en silenci, i un `//` inicial obri camins protocol-relatius.
     Ara: només camí, i qualsevol cosa dubtosa cau a l'arrel. */
  var path = params.get('sdp_path') || '';
  if (path) {
    var camiValid = /^\/([a-zA-Z0-9\-_]+\/?)*$/.test(path);
    if (!camiValid) path = '/';
  }
  var errProveidor = params.get('error_description') || params.get('error');

  function mostraError(titol, cos, urlTornar) {
    document.getElementById('esperant').hidden = true;
    var box = document.getElementById('error');
    document.getElementById('error-titol').textContent = titol;
    document.getElementById('error-cos').textContent = cos;
    if (urlTornar) {
      var a = document.getElementById('error-tornar');
      a.href = urlTornar;
      a.hidden = false;
    }
    box.hidden = false;
  }

  if (!origen || ORIGENS_PERMESOS.indexOf(origen) === -1) {
    mostraError(
      'Origen no reconegut',
      'Esta petició diu vindre de «' + (origen || 'cap lloc') + '», que no és un entorn registrat de Sóc de Poble. ' +
      'Per seguretat no es torna res. Si és un entorn nou, afegix-lo a la llista del relé.'
    );
    return;
  }

  var stateProveidor = params.get('state');

  if (errProveidor) {
    var urlError = origen + path + '#sdp_oauth_error=' + encodeURIComponent(errProveidor);
    if (stateProveidor) urlError += '&state=' + encodeURIComponent(stateProveidor);

    if (window.opener) {
      var payloadErr = { type: 'sdp:oauth', error: errProveidor };
      if (stateProveidor) payloadErr.state = stateProveidor;
      window.opener.postMessage(payloadErr, origen);
      setTimeout(function() { window.close(); }, 100);
    } else {
      window.location.replace(urlError);
    }
    return;
  }

  if (!codi) {
    mostraError('Falta el codi d\u2019entrada', 'El proveïdor no ha tornat cap codi. Torna a provar des de l\u2019aplicació.', origen);
    return;
  }

  /* El codi torna a l'origen validat pel fragment de la URL o via postMessage si és un popup. */
  var urlTornada = origen + path + '#sdp_code=' + encodeURIComponent(codi);
  if (stateProveidor) urlTornada += '&state=' + encodeURIComponent(stateProveidor);

  if (window.opener) {
    var payload = { type: 'sdp:oauth', code: codi };
    if (stateProveidor) payload.state = stateProveidor;
    window.opener.postMessage(payload, origen);
    setTimeout(function() { window.close(); }, 100);
  } else {
    window.location.replace(urlTornada);
  }
})();
</script>
</body>
</html>
```
<<<FI_FITXER>>>

## Fitxer: src/app/App.jsx

```
import React, { lazy, Suspense, useEffect, useRef, memo, StrictMode, useMemo } from 'react';
import { Navigate, NavLink, Route, Routes, useNavigate, useParams, useLocation } from './contexts/RouterContext';
import { Globe, MoonStar, Search, Settings, Sun, UserRound } from '../icons.jsx';
import BrandMark from '../components/BrandMark';
import { APP_NAME } from '../config/app';
import { DEFAULT_SECTION_PATH, SECTIONS, SECTION_ORDER } from '../config/sections';
import { getSectionLabels } from '../config/i18n';
import { recullTornadaOAuth } from '../data/backendPort.js';
import { reclamaContingutDelConvidat } from '../data/identitat.js';
import { showToast } from '../components/universal/AvisadorEfimer';
import { delVal } from '../config/storage';
import { useIdentitat } from './contexts/IdentitatContext';
import { PAGE_COPY } from '../sections/text/pageContent.js';
const XatSection = lazy(() => import('../sections/xat/XatSection'));
const MurSection = lazy(() => import('../sections/mur/MurSection'));
const MercatSection = lazy(() => import('../sections/mercat/MercatSection'));
const PoblesSection = lazy(() => import('../sections/pobles/PoblesSection'));
const PoblacioSection = lazy(() => import('../sections/poblacio/PoblacioSection'));
const MultimediaSection = lazy(() => import('../sections/multimedia/MultimediaSection'));
const NotesSection = lazy(() => import('../sections/notes/NotesSection'));

const DevicesSection = lazy(() => import('../sections/dispositius/DevicesSection'));
const ConnectarSection = lazy(() => import('../sections/connectar/ConnectarSection'));
const ControlSection = lazy(() => import('../sections/control/ControlSection'));
const OnboardingSection = lazy(() => import('../sections/onboarding/OnboardingSection'));
const AdminSection = lazy(() => import('../sections/admin/AdminSection'));

const TranslationsSection = lazy(() => import('../sections/translations/TranslationsSection'));
const TextSection = lazy(() => import('../sections/text/TextSection'));
const DesignSection = lazy(() => import('../sections/disseny/DesignSection'));
const SearchSection = lazy(() => import('../sections/search/SearchSection'));
const ProfileSection = lazy(() => import('../sections/profile/ProfileSection'));
const PerfilShell = lazy(() => import('../sections/profile/PerfilShell'));
const ItemDetailSection = lazy(() => import('../sections/detail/ItemDetailSection'));
const PageDetailSection = lazy(() => import('../sections/detail/PageDetailSection'));
const RealitatSection = lazy(() => import('../sections/realitat/RealitatSection'));
import NotFoundPage from '../pages/NotFoundPage';
import { CoreContentProvider, useCoreContent } from './contexts/CoreContentContext';
import { MurProvider } from '../sections/mur/MurContext';
import { NotesDataProvider } from '../sections/notes/NotesDataContext';
import { XatProvider, useXat } from '../sections/xat/XatContext';
const XatControlSection = lazy(() => import('../sections/xat/XatControlSection'));
import { MultimediaProvider } from '../sections/multimedia/MultimediaContext';
import { useUIActions, useUIState } from './contexts/UIContext';
import { useSession } from './contexts/SessionContext';
import { RequireAuth } from './guards/RequireAuth';

const ALL_NAV_SECTIONS = SECTIONS.filter((section) => SECTION_ORDER.includes(section.id));
const NAV_SECTIONS = ALL_NAV_SECTIONS.filter(s => s.id !== 'versions' && s.id !== 'legal');
const SYSTEM_SECTIONS = ALL_NAV_SECTIONS.filter(s => s.id === 'versions' || s.id === 'legal');

const MOBILE_NAV_LEADING = NAV_SECTIONS.slice(0, 2);
const MOBILE_NAV_TRAILING = NAV_SECTIONS.slice(2, 4);

function RouteFallback() {
  const { t } = useUIActions();
  return (
    <div className="sdp-route-loading-screen" role="status" aria-live="polite" aria-label="Carregant secció">
      <div className="sdp-route-loading-screen__glow sdp-route-loading-screen__glow--left" />
      <div className="sdp-route-loading-screen__glow sdp-route-loading-screen__glow--right" />
      <div className="sdp-route-loading-screen__panel">
        <BrandMark variant="light" className="sdp-route-loading-screen__logo" />
        <strong className="sdp-route-loading-screen__title">{APP_NAME}</strong>
        <span className="sdp-route-loading-screen__subtitle">{t('loading.content', 'Carregant contingut del poble...')}</span>
        <div className="sdp-route-loading-screen__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function AppShell({ children, mobileNav }) {
  const { language, status, themeMode, externalConfig } = useUIState();
  const { t } = useUIActions();
  const navigate = useNavigate();
  const location = useLocation();
  const mainRef = useRef(null);
  const contentRef = useRef(null);
  const { actorType, actorId } = useIdentitat();
  
  const buildPath = (basePath, isGestoriaLink) => {
    if (isGestoriaLink) return `/gestoria${basePath}`;
    if (actorType === 'entitat') {
      return `/e/${actorId}${basePath}`;
    }
    return `/jo${basePath}`;
  };
  
  const isGestoria = location.pathname.startsWith('/gestoria');
  const activeNavSections = NAV_SECTIONS;
  
  // Pull to Refresh logic optimitzat natiu
  const indicatorRef = useRef(null);
  const PULL_THRESHOLD = 100;

  // Restaurar el focus a main en canviar de ruta (A11y)
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.focus({ preventScroll: true });
    }
  }, [location.pathname]);

  useEffect(() => {
    delVal('socdepoble-app-snapshot-v1');
    delVal('socdepoble-section-submissions-v1');
  }, []);

  const tornadaFeta = useRef(false);
  useEffect(() => {
    if (tornadaFeta.current) return;
    tornadaFeta.current = true;
    recullTornadaOAuth(externalConfig)
      .then((sessio) => { if (sessio) showToast(t('section.login.success.login', 'Benvingut de nou!'), 'success'); })
      .catch((e) => showToast(e.message, 'error'));
  }, [externalConfig, t]);

  useEffect(() => {
    const onCanviAuth = (e) => {
      const id = e?.detail?.user?.id;
      if (!id) return;
      reclamaContingutDelConvidat(String(id))
        .then(({ migrat }) => { if (migrat) window.dispatchEvent(new CustomEvent('sdp:refresh-data')); })
        .catch(() => {});
    };
    window.addEventListener('sdp:auth-change', onCanviAuth);

    const onRebuig = (e) => {
      showToast(t('error.rejected', `La publicació ha sigut rebutjada: ${e.detail.error}`), 'error');
    };
    const onXatRebuig = (e) => {
      showToast(t('error.chat.rejected', `El missatge no s'ha pogut enviar: ${e.detail.error}`), 'error');
    };
    window.addEventListener('sdp:submission-rejected', onRebuig);
    window.addEventListener('sdp:chat-rejected', onXatRebuig);

    return () => {
      window.removeEventListener('sdp:auth-change', onCanviAuth);
      window.removeEventListener('sdp:submission-rejected', onRebuig);
      window.removeEventListener('sdp:chat-rejected', onXatRebuig);
    };
  }, [t]);

  useEffect(() => {
    if (mainRef.current) {
      const rootNode = mainRef.current.getRootNode();
      if (rootNode instanceof ShadowRoot) {
        rootNode.host.setAttribute('data-theme', themeMode || 'light');
      } else {
        document.documentElement.setAttribute('data-theme', themeMode || 'light');
      }
    }
  }, [themeMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (mainRef.current) {
        const rootNode = mainRef.current.getRootNode();
        const host = rootNode instanceof ShadowRoot ? rootNode.host : document.documentElement;
        host.setAttribute('lang', language || 'ca');
      }
    }
  }, [language]);

  useEffect(() => {
    const mainEl = mainRef.current;
    const contentEl = contentRef.current;
    const indicatorEl = indicatorRef.current;
    if (!mainEl || !contentEl || !indicatorEl) return;

    let pullStart = null;
    let pullDistance = 0;
    let rafId = null;
    let state = ''; // '', 'pulling', 'ready'

    const updateUI = (distance, newState) => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        const translateY = Math.min(distance, PULL_THRESHOLD + 40);
        contentEl.style.transform = `translateY(${translateY}px)`;
        indicatorEl.style.transform = `translateY(${translateY}px)`;
        
        if (state !== newState) {
          state = newState;
          if (state === 'ready') {
            indicatorEl.innerText = t('pull.release', 'Deixa anar per recarregar...');
          } else if (state === 'pulling') {
            indicatorEl.innerText = t('pull.pull', 'Estira per recarregar...');
          } else {
            indicatorEl.innerText = '';
          }
        }
        rafId = null;
      });
    };

    const onTouchStart = (e) => {
      if (contentEl.scrollTop === 0) {
        pullStart = e.touches[0].clientY;
        pullDistance = 0;
        contentEl.style.transition = 'none';
        indicatorEl.style.transition = 'none';
      } else {
        pullStart = null;
      }
    };

    const onTouchMove = (e) => {
      if (pullStart === null) return;
      const y = e.touches[0].clientY;
      const distance = y - pullStart;
      if (distance > 0) {
        pullDistance = distance;
        updateUI(distance, distance > PULL_THRESHOLD ? 'ready' : 'pulling');
      }
    };

    const onTouchEnd = () => {
      if (pullStart === null) return;
      if (pullDistance > PULL_THRESHOLD) {
        window.location.reload();
      }
      pullStart = null;
      pullDistance = 0;
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      state = '';
      contentEl.style.transition = 'transform 0.3s ease-out';
      contentEl.style.transform = 'translateY(0px)';
      indicatorEl.style.transition = 'transform 0.3s ease-out';
      indicatorEl.style.transform = 'translateY(0px)';
      indicatorEl.innerText = '';
    };

    mainEl.addEventListener('touchstart', onTouchStart, { passive: true });
    mainEl.addEventListener('touchmove', onTouchMove, { passive: false });
    mainEl.addEventListener('touchend', onTouchEnd, { passive: true });

    return () => {
      mainEl.removeEventListener('touchstart', onTouchStart);
      mainEl.removeEventListener('touchmove', onTouchMove);
      mainEl.removeEventListener('touchend', onTouchEnd);
    };
  }, [t]);

  return (
    <>
      <nav id="app-sidebar" className="app-sidebar" aria-label="Navegació principal">
        <button type="button" className="brand sdp-unstyled-btn" aria-label="Obrir o tancar menú Sóc de Poble" onClick={(e) => {
          const root = e.target.getRootNode();
          const sidebar = root.querySelector('.app-sidebar') || document.querySelector('.app-sidebar');
          const host = root instanceof ShadowRoot ? root.host : document.body;
          sidebar?.classList.toggle('sidebar-open');
          host.classList.toggle('sidebar-closed');
        }}>
          <BrandMark className="app-brand__mark" />
        </button>

        <button
          type="button"
          className="sidebar-control-btn"
          onClick={() => navigate('/control')}
        >
          <Settings className="icona-linia" size={24} strokeWidth={2.1} aria-hidden="true" focusable="false" />
          <span className="nav-item__text">PANELL DE CONTROL</span>
        </button>

        <div className="app-sidebar-nav" aria-label="Seccions">
          {activeNavSections.map((section) => {
            const Icon = section.icon;
            const labels = section.kind === 'gestoria' 
              ? { label: section.label, shortLabel: section.shortLabel } 
              : getSectionLabels(section.id, language);
            return (
              <React.Fragment key={section.id}>
                {section.id === 'projecte' && <hr className="app-sidebar-divider" aria-hidden="true" />}
                <NavLink to={buildPath(section.path, isGestoria)} className="nav-item" aria-label={labels.label}>
                  <Icon className="icona-linia" strokeWidth={2.1} size={24} aria-hidden="true" focusable="false" />
                  <span className="nav-item__text">
                    {labels.label}
                  </span>
                </NavLink>
              </React.Fragment>
            );
          })}
          
          <div className="app-sidebar-nav-footer">
            {SYSTEM_SECTIONS.map((section) => {
              const Icon = section.icon;
              const labels = getSectionLabels(section.id, language);
              return (
                <NavLink key={section.id} to={section.path} className="nav-item nav-item--system" aria-label={labels.label}>
                  <Icon className="icona-linia" strokeWidth={2.1} size={24} aria-hidden="true" focusable="false" />
                  <span className="nav-item__text">
                    {labels.label}
                  </span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </nav>

      <main 
        id="main-content"
        ref={mainRef}
        tabIndex="-1"
        className="app-main" 
        aria-busy={status === 'loading' ? 'true' : 'false'}
      >
        <TopBar />
        
        <div 
          ref={indicatorRef}
          className="pull-to-refresh-indicator sdp-ptr-indicator" 
          aria-hidden="true"
        >
        </div>

        <div ref={contentRef} className="app-main__content">
          {children}
        </div>
      </main>

      {mobileNav}
    </>
  );
}

const TopBar = memo(function TopBar() {
  const navigate = useNavigate();
  const { t, toggleTheme } = useUIActions();
  const { themeMode } = useUIState();
  const { currentUser } = useSession();
  const navigateWithTransition = (path) => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.startViewTransition && !prefersReducedMotion) {
      document.startViewTransition(() => navigate(path));
    } else {
      navigate(path);
    }
  };

  return (
    <header className="bar-black">
      <button type="button" className="mobile-logo-wrapper sdp-unstyled-btn" aria-label="Obrir menú" onClick={(e) => {
        const root = e.target.getRootNode();
        const sidebar = root.querySelector('.app-sidebar') || document.querySelector('.app-sidebar');
        const host = root instanceof ShadowRoot ? root.host : document.body;
        sidebar?.classList.toggle('sidebar-open');
        host.classList.toggle('sidebar-closed');
      }}>
        <BrandMark variant="light" className="mobile-logo" />
      </button>

      <div className="right-icons">
        <button type="button" className="icon sdp-top-bar-btn" onClick={() => navigateWithTransition('/traduccions')} aria-label={t('nav.idioma', 'Idioma')} title={t('nav.idioma', 'Idioma')}>
          <Globe aria-hidden="true" focusable="false" />
        </button>
        <button type="button" className="icon sdp-top-bar-btn" onClick={() => navigateWithTransition('/cerca')} aria-label={t('nav.cerca', 'Cerca')} title={t('nav.cerca', 'Cerca')}>
          <Search aria-hidden="true" focusable="false" />
        </button>
        <button type="button" className="icon sdp-top-bar-btn" onClick={toggleTheme} aria-label={t('nav.tema', 'Tema')} title={t('nav.tema', 'Tema')}>
          {themeMode === 'dark' ? <Sun aria-hidden="true" focusable="false" /> : <MoonStar aria-hidden="true" focusable="false" />}
        </button>
        <button 
          type="button" 
          className="icon sdp-top-bar-btn sdp-top-bar-btn--avatar" 
          onClick={() => navigateWithTransition(currentUser ? '/el-meu-perfil' : '/registre')} 
          aria-label={t('nav.perfil', 'Perfil')} 
          title={t('nav.perfil', 'Perfil')}
        >
          {(() => {
            const avatar = currentUser?.avatar_url || currentUser?.user_metadata?.avatar_url || currentUser?.user_metadata?.picture;
            if (currentUser && avatar) {
              return <img src={avatar} alt={currentUser?.user_metadata?.name || currentUser?.full_name || 'El meu perfil'} className="sdp-avatar__imatge" />;
            }
            if (currentUser) {
              return (
                <div className="sdp-avatar-placeholder">
                  <UserRound size={18} aria-hidden="true" focusable="false" />
                </div>
              );
            }
            return <UserRound aria-hidden="true" focusable="false" />;
          })()}
        </button>
      </div>
    </header>
  );
});

function TextRoute({ pageKey }) {
  const { pageCopy, status } = useCoreContent();
  // Fallback a les dades locals (PAGE_COPY) perquè la legalitat carregui de forma segura i ràpida
  // encara que Supabase estiga en fase de càrrega o sense xarxa.
  const page = pageCopy?.[pageKey] || PAGE_COPY?.[pageKey];
  
  if (!page) {
    if (status === 'loading') {
      return <RouteFallback />;
    }
    return <Navigate to={DEFAULT_SECTION_PATH} replace />;
  }
  return (
    <Suspense fallback={<RouteFallback />}>
      <TextSection page={page} pageKey={pageKey} />
    </Suspense>
  );
}





export default function App({ config }) {
  // Stabilize config to avoid re-rendering entire app when host sends new obj reference
  const stableConfig = useMemo(() => config, [JSON.stringify(config)]);

  return (
    <StrictMode>
      <AppShell mobileNav={<MobileNav />}>
        <AppContent config={stableConfig} />
      </AppShell>
    </StrictMode>
  );
}

function AppContent({ config }) {
  const { actorKey } = useIdentitat();

  return (
    <CoreContentProvider key={`core-${actorKey}`} config={config}>
      <MurProvider key={`mur-${actorKey}`} config={config}>
        <NotesDataProvider key={`notes-${actorKey}`} config={config}>
          <XatProvider key={`xat-${actorKey}`} config={config}>
            <MultimediaProvider key={`media-${actorKey}`} config={config}>
              <AppDataLoader />
            </MultimediaProvider>
          </XatProvider>
        </NotesDataProvider>
      </MurProvider>
    </CoreContentProvider>
  );
}

function AppDataLoader() {
  const core = useCoreContent();
  const xat = useXat();

  /* Només el Core pot tombar el portal. El Mur gestiona el seu estat a MurSection. */
  const hasError = core.status === 'error' || xat.status === 'error';
  const isLoading = core.status === 'loading' || xat.status === 'loading';

  if (hasError) {
    return (
      <div className="sdp-app-error">
        <h1>Error Intern</h1>
        <pre>{core.error?.message || xat.error?.message || 'Error desconegut'}</pre>
        <pre>{core.error?.stack}</pre>
      </div>
    );
  }
  if (isLoading) return <RouteFallback />;

  return (
    <RouteErrorBoundary>
      <AppRoutes />
    </RouteErrorBoundary>
  );
}

class RouteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[RouteErrorBoundary] Error capturat a la ruta:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="sdp-route-error">
          <h2 className="sdp-route-error__titol">Hi ha hagut un problema</h2>
          <p>Aquesta secció no ha pogut carregar-se correctament.</p>
          <pre className="sdp-error-pre">
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <button onClick={() => this.setState({ hasError: false, error: null })} className="sdp-boto sdp-boto--secundari sdp-route-error__reintent">
            Intentar de nou
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PostRedirect() {
  const { itemId } = useParams();
  const safeItemId = encodeURIComponent(itemId || '');
  return <Navigate to={`/jo/mur/${safeItemId}`} replace />;
}

function SectionRedirect({ sectionId }) {
  const params = useParams();
  const splat = params['*'];
  return <Navigate to={`/jo/${sectionId}${splat ? `/${splat}` : ''}`} replace />;
}

function AppRoutes() {
  const { agents = [] } = useCoreContent();
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<Navigate to={`/jo${DEFAULT_SECTION_PATH}`} replace />} />
        
        {/* Rutes per a Identitat Activa */}
        <Route path="/jo/*" element={<ActorRoutes agents={agents} />} />
        <Route path="/e/:slug/*" element={<ActorRoutes agents={agents} />} />

        {/* Redirects globals per a suportar links vells */}
        <Route path="/xat/*" element={<SectionRedirect sectionId="xat" />} />
        <Route path="/chat/*" element={<SectionRedirect sectionId="xat" />} />
        <Route path="/chats/*" element={<SectionRedirect sectionId="xat" />} />
        <Route path="/mur/*" element={<SectionRedirect sectionId="mur" />} />
        <Route path="/post/:itemId" element={<PostRedirect />} />
        <Route path="/mercat/*" element={<SectionRedirect sectionId="mercat" />} />
        <Route path="/multimedia/*" element={<SectionRedirect sectionId="multimedia" />} />
        <Route path="/pobles/*" element={<SectionRedirect sectionId="pobles" />} />
        <Route path="/poblacio/*" element={<SectionRedirect sectionId="poblacio" />} />
        <Route path="/events/*" element={<SectionRedirect sectionId="mur" />} />
        <Route path="/calendar/*" element={<SectionRedirect sectionId="mur" />} />
        <Route path="/calendari/*" element={<SectionRedirect sectionId="mur" />} />
        <Route path="/mapa/*" element={<SectionRedirect sectionId="mur" />} />
        <Route path="/notes/*" element={<SectionRedirect sectionId="notes" />} />
        <Route path="/dispositius/*" element={<SectionRedirect sectionId="dispositius" />} />
        <Route path="/connectivitat/*" element={<SectionRedirect sectionId="dispositius" />} />
        <Route path="/el-meu-perfil/*" element={<SectionRedirect sectionId="el-meu-perfil" />} />
        <Route path="/jo" element={<Navigate to="/jo/el-meu-perfil" replace />} />
        <Route path="/perfil/*" element={<SectionRedirect sectionId="perfil" />} />
        <Route path="/gent/*" element={<SectionRedirect sectionId="gent" />} />
        <Route path="/empresa/*" element={<SectionRedirect sectionId="empresa" />} />
        <Route path="/ajuntament/*" element={<SectionRedirect sectionId="ajuntament" />} />
        <Route path="/grup/*" element={<SectionRedirect sectionId="grup" />} />

        {/* Rutes globals i administratives */}
        <Route path="/admin/*" element={<RequireAuth rol="superadmin"><AdminSection /></RequireAuth>} />
        <Route path="/cerca" element={<SearchSection />} />
        <Route path="/login" element={<Navigate to="/registre" replace />} />
        <Route path="/accedir" element={<Navigate to="/registre" replace />} />
        <Route path="/registre" element={<OnboardingSection />} />
        <Route path="/crear-compte" element={<Navigate to="/registre" replace />} />
        
        <Route path="/control" element={<ControlSection />} />
        <Route path="/utilitats" element={<ControlSection />} />
        <Route path="/connectar" element={<ConnectarSection agents={agents} />} />
        <Route path="/projecte" element={<Navigate to="/jo/projecte" replace />} />
        <Route path="/page/:slug" element={<PageDetailSection />} />
        <Route path="/el-projecte" element={<Navigate to="/jo/projecte" replace />} />
        <Route path="/skills" element={<Navigate to="/jo/skills" replace />} />
        <Route path="/constitucio" element={<Navigate to="/jo/constitucio" replace />} />
        <Route path="/disseny" element={<Navigate to="/jo/disseny" replace />} />
        <Route path="/legal" element={<TextRoute pageKey="legal" />} />
        <Route path="/roadmap" element={<Navigate to="/jo/roadmap" replace />} />
        <Route path="/ruta" element={<Navigate to="/jo/roadmap" replace />} />
        <Route path="/versions" element={<TextRoute pageKey="versions" />} />
        <Route path="/traduccions" element={<TranslationsSection />} />
        <Route path="/realitat" element={<RequireAuth rol="superadmin"><RealitatSection /></RequireAuth>} />
        <Route path="/ia" element={<Navigate to="/jo/ia" replace />} />
        <Route path="/anima" element={<Navigate to="/jo/ia" replace />} />
        <Route path="/iaia" element={<Navigate to="/jo/xat/iaia-maria" replace />} />
        <Route path="/el-meu-perfil" element={<Navigate to="/jo/el-meu-perfil" replace />} />
        <Route path="/perfil" element={<Navigate to="/jo/el-meu-perfil" replace />} />
        
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function ActorRoutes({ agents }) {
  // Aquestes rutes són relatives a `/jo` o `/e/:slug`. 
  // No necessiten la / inicial.
  return (
    <Routes>
      <Route path="/" element={<Navigate to={DEFAULT_SECTION_PATH.replace('/', '')} replace />} />
      <Route path="xat" element={<XatSection />} />
      <Route path="control-xat" element={<XatControlSection />} />
      <Route path="xat/:threadId" element={<XatSection />} />
      <Route path="mur" element={<MurSection />} />
      <Route path="mercat" element={<MercatSection />} />
      <Route path="multimedia" element={<MultimediaSection />} />
      <Route path="pobles" element={<PoblesSection />} />
      <Route path="poblacio" element={<PoblacioSection />} />
      <Route path="notes" element={<NotesSection />} />
      <Route path="dispositius" element={<DevicesSection />} />
      {/* Globals: sota /jo queien a NotFoundPage (el botó central del mòbil). */}
      <Route path="control" element={<Navigate to="/control" replace />} />
      <Route path="gestoria" element={<Navigate to="/gestoria" replace />} />
      
      <Route path="el-meu-perfil" element={<PerfilShell />} />
      <Route path="perfil" element={<ProfileSection agents={agents} />} />
      <Route path="perfil/:agentId" element={<ProfileSection agents={agents} />} />
      <Route path="gent/:agentId" element={<ProfileSection agents={agents} />} />
      <Route path="empresa/:agentId" element={<ProfileSection agents={agents} />} />
      <Route path="ajuntament/:agentId" element={<ProfileSection agents={agents} />} />
      <Route path="grup/:agentId" element={<ProfileSection agents={agents} />} />
      
      <Route path="projecte" element={<TextRoute pageKey="projecte" />} />
      <Route path="skills" element={<TextRoute pageKey="skills" />} />
      <Route path="constitucio" element={<TextRoute pageKey="constitucio" />} />
      <Route path="disseny" element={<DesignSection />} />
      <Route path="roadmap" element={<TextRoute pageKey="roadmap" />} />
      <Route path="ia" element={<TextRoute pageKey="anima" />} />
      
      <Route path=":sectionId/:itemId" element={<ItemDetailSection />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

const MobileNav = memo(function MobileNav() {
  const { language } = useUIState();
  const { t } = useUIActions();
  const navigate = useNavigate();
  const { actorType, actorId } = useIdentitat();
  
  const buildPath = (basePath, isGestoriaLink) => {
    if (isGestoriaLink) return `/gestoria${basePath}`;
    if (actorType === 'entitat') {
      return `/e/${actorId}${basePath}`;
    }
    return `/jo${basePath}`;
  };

  const isGestoria = window.location.pathname.startsWith('/gestoria');
  const activeMobileLeading = MOBILE_NAV_LEADING;
  const activeMobileTrailing = MOBILE_NAV_TRAILING;

  return (
      <nav className="mobile-nav" aria-label="Navegació mòbil">
        {activeMobileLeading.map((section) => {
          const Icon = section.icon;
          const labels = section.kind === 'gestoria' 
            ? { label: section.label, shortLabel: section.shortLabel } 
            : getSectionLabels(section.id, language);
          return (
            <NavLink key={section.id} to={buildPath(section.path, isGestoria)} className="nav-item" aria-label={labels.label}>
              <Icon className="nav-item__icon" strokeWidth={2.1} aria-hidden="true" focusable="false" />
              <span className="nav-item__text">
                <strong>{labels.shortLabel}</strong>
              </span>
            </NavLink>
          );
        })}
        <button type="button" className="mobile-nav__cta" onClick={() => {
          const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (document.startViewTransition && !prefersReducedMotion) {
            document.startViewTransition(() => navigate('/control'));
          } else {
            navigate('/control');
          }
        }} aria-label={t('nav.panel', 'Panell de control')}>
          <Settings size={20} strokeWidth={2.8} />
        </button>
        {activeMobileTrailing.map((section) => {
          const Icon = section.icon;
          const labels = section.kind === 'gestoria' 
            ? { label: section.label, shortLabel: section.shortLabel } 
            : getSectionLabels(section.id, language);
          return (
            <NavLink key={section.id} to={buildPath(section.path, isGestoria)} className="nav-item" aria-label={labels.label}>
              <Icon className="nav-item__icon" strokeWidth={2.1} aria-hidden="true" focusable="false" />
              <span className="nav-item__text">
                <strong>{labels.shortLabel}</strong>
              </span>
            </NavLink>
          );
        })}
      </nav>
  );
});
```
<<<FI_FITXER>>>

## Fitxer: src/data/oauthRelay.js

```
/**
 * oauthRelay.js — AUTENTICACIÓ DISTRIBUÏDA SENSE LLISTA BLANCA DINÀMICA
 *
 * PROBLEMA QUE RESOL (auditoria 260829):
 *   `loginWithGoogle()` enviava l'usuari a Google amb
 *   `redirect_to = window.location.origin + pathname`. Com que eixe origen
 *   no estava a la llista blanca de Supabase, GoTrue NO fallava: queia
 *   silenciosament al `SITE_URL` del projecte i l'usuari acabava sempre a
 *   socdepoble.org, fora del seu entorn.
 *   I encara pitjor: no hi havia CAP codi a tot `src/` que llegira la
 *   tornada. Zero `location.hash`, zero `URLSearchParams`, zero bescanvi.
 *   El botó de Google era un bitllet d'anada sense estació de tornada.
 *
 * ESTRATÈGIA:
 *   Una sola adreça a la llista blanca, per sempre: el relé. L'origen que
 *   inicia el flux viatja com a paràmetre del relé, no com a `redirect_to`.
 *   El relé el valida i torna el codi. El proveïdor d'identitat no ha de
 *   conéixer mai cap `localhost`.
 *
 * PER QUÈ PKCE I NO IMPLICIT:
 *   Amb el flux implícit torna un `access_token` al fragment de la URL, que
 *   acaba a l'historial del navegador. Amb PKCE torna un codi d'un sol ús
 *   que no val res sense el verificador, i el verificador no ix mai de la
 *   pestanya que va començar el flux.
 *
 * TRES CAMINS DE TORNADA, per ordre:
 *   1. Emergent + `window.opener.postMessage` — el camí net.
 *   2. Emergent + esdeveniment `storage` — quan Google talla l'`opener` amb
 *      capçaleres COOP. Passa de veres; no és teòric.
 *   3. Redirecció completa — iPads amb emergents bloquejats.
 *   La finestra amfitriona (Sollutia, local) no navega mai fora
 *   en els casos 1 i 2.
 *
 * ⚠ A VERIFICAR CONTRA LA TEUA VERSIÓ DE GOTRUE ABANS DE DESPLEGAR:
 *   el nom del `grant_type` de bescanvi (ací `pkce`) i el nom del camp
 *   (`auth_code`). Estan a `EXCHANGE_GRANT` i `EXCHANGE_FIELD`, aïllats a
 *   propòsit. Comprova-ho amb una crida de prova; si el teu GoTrue espera
 *   noms distints, es canvien en dos llocs i prou.
 */

import { setVal, delVal, getEfimer, setEfimer, delEfimer } from '../config/storage.js';
import { desaSessio } from './identitat.js';

/* ───────────────────────── Configuració ───────────────────────── */

/** L'ÚNICA adreça registrada a Supabase. Sobreescriptible per entorn. */
const RELAY_PER_DEFECTE = 'https://auth.socdepoble.org/callback';

const CLAU_VERIFICADOR = 'sdp:oauth:verificador';
const CLAU_TRASPAS = 'sdp:oauth:traspas';
const EXCHANGE_GRANT = 'pkce';
const EXCHANGE_FIELD = 'auth_code';
const TEMPS_MAXIM_MS = 180000;

const relayUrl = (config) => {
  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    return window.location.origin + '/auth/callback.html';
  }
  return config?.oauthRelayUrl || RELAY_PER_DEFECTE;
};
const relayOrigin = (config) => new URL(relayUrl(config)).origin;

/* ───────────────────────── PKCE ───────────────────────── */

const ALFABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

export function generaVerificador(longitud = 64) {
  const bytes = new Uint8Array(longitud);
  crypto.getRandomValues(bytes);
  let eixida = '';
  for (const b of bytes) eixida += ALFABET[b % ALFABET.length];
  return eixida;
}

function base64url(buffer) {
  let bin = '';
  for (const b of new Uint8Array(buffer)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function generaRepte(verificador) {
  const dades = new TextEncoder().encode(verificador);
  return base64url(await crypto.subtle.digest('SHA-256', dades));
}

/* ───────────────────────── Bescanvi ───────────────────────── */

async function bescanvia(codi, verificador, { supabaseUrl, supabaseAnonKey }) {
  const resposta = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=${EXCHANGE_GRANT}`, {
    method: 'POST',
    headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ [EXCHANGE_FIELD]: codi, code_verifier: verificador })
  });

  if (!resposta.ok) {
    const cos = await resposta.text().catch(() => '');
    throw new Error(`No s'ha pogut completar l'entrada (${resposta.status}). ${cos}`);
  }

  const sessio = await resposta.json();
  if (!sessio?.access_token) throw new Error('El servidor no ha tornat cap sessió.');

  /* CORRECCIÓ P0 (260908). Abans: els dos tokens a sessionStorage i el `user`
     a localStorage amb setVal. Les tres peces han de tindre la mateixa vida o
     l'app es queda amb un usuari sense token (sessió fantasma). Ho fa
     `desaSessio`, que és l'únic lloc del projecte que escriu les tres claus. */
  desaSessio(sessio);
  delEfimer(CLAU_VERIFICADOR);
  delEfimer('sdp:oauth:state');
  window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: sessio.user } }));
  return sessio;
}

/* ───────────────────────── Anada ───────────────────────── */

/**
 * Obri l'entrada amb Google. Resol amb la sessió; rebutja amb un error
 * llegible. La pàgina amfitriona no navega si l'emergent s'obri.
 */
export async function entraAmbGoogle(config = {}, resolConfig) {
  const { supabaseUrl, supabaseAnonKey, hasSupabaseConfig } = resolConfig(config);
  if (!hasSupabaseConfig) throw new Error('L\'entrada amb Google necessita connexió amb Supabase.');

  // Circuit Breaker per evitar bucles de redirecció cap a l'autenticació
  const clauCb = 'sdp:oauth:cb';
  const intentsCb = getEfimer(clauCb, { count: 0, time: Date.now() });
  if (Date.now() - intentsCb.time > 60000) {
    intentsCb.count = 1;
    intentsCb.time = Date.now();
  } else {
    intentsCb.count += 1;
  }
  setEfimer(clauCb, intentsCb);
  
  if (intentsCb.count > 4) {
    throw new Error('Massa intents d\'inici de sessió seguits. Circuit Breaker activat. Espera un minut.');
  }

  // Obertura síncrona per evitar bloqueig a Safari (Safari matarà el popup si ve després d'un await)
  const emergent = window.open('', 'sdp-oauth', 'width=520,height=680');

  const verificador = generaVerificador();
  const repte = await generaRepte(verificador);
  setEfimer(CLAU_VERIFICADOR, verificador);

  const destiRelay = `${relayUrl(config)}?sdp_origin=${encodeURIComponent(window.location.origin)}&sdp_path=${encodeURIComponent(window.location.pathname)}`;
  
  const state = generaVerificador(16);
  setEfimer('sdp:oauth:state', state);

  const url = `${supabaseUrl}/auth/v1/authorize`
    + `?provider=google`
    + `&code_challenge=${encodeURIComponent(repte)}`
    + `&code_challenge_method=S256`
    + `&state=${encodeURIComponent(state)}`
    + `&redirect_to=${encodeURIComponent(destiRelay)}`;

  // Camí 3: emergent bloquejat. Redirecció completa.
  if (!emergent) {
    window.location.href = url;
    return new Promise(() => {}); // Penjarà a propòsit perquè ja naveguem.
  }

  try {
    emergent.location.href = url;
  } catch {
    // Fallback extrem si el navegador bloqueja mutar l'emergent
    window.location.href = url;
    return new Promise(() => {});
  }

  return esperaCodi(emergent, config)
    .then((codi) => bescanvia(codi, verificador, { supabaseUrl, supabaseAnonKey }))
    .catch((err) => {
      try { emergent.close(); } catch { /* ignora */ }
      throw err;
    })
    .finally(() => delEfimer(CLAU_VERIFICADOR));
}

/**
 * Escolta les dues vies de tornada de l'emergent alhora.
 */
function esperaCodi(emergent, config) {
  return new Promise((resol, rebutja) => {
    const origenRelay = relayOrigin(config);
    let acabat = false;

    const neteja = () => {
      window.removeEventListener('message', perMissatge);
      window.removeEventListener('storage', perStorage);
      clearInterval(vigilant);
      clearTimeout(rellotge);
      delVal(CLAU_TRASPAS);
    };
    const acaba = (fn, valor) => { if (acabat) return; acabat = true; neteja(); fn(valor); };

    // Camí 1 — l'emergent ha tornat a l'origen de l'app i ens parla.
    function perMissatge(e) {
      // Només acceptem missatges de l'origen esperat (Sollutia), o del mateix origen en desenvolupament
      if (e.origin !== origenRelay && (!import.meta.env?.DEV || e.origin !== window.location.origin)) return; // Validació estricta
      if (e.source !== emergent) return;
      const d = e.data;
      if (!d || d.type !== 'sdp:oauth') return;
      
      const storedState = getEfimer('sdp:oauth:state', null);
      if (!storedState || !d.state || d.state !== storedState) {
        return acaba(rebutja, new Error('Estat OAuth no vàlid. Possible atac CSRF.'));
      }
      
      if (d.error) return acaba(rebutja, new Error(d.error));
      if (d.code) acaba(resol, d.code);
    }

    // Camí 2 — Google ha tallat l'`opener` amb COOP. L'emergent deixa el
    // codi a l'emmagatzematge del nostre origen i açò el replega.
    function perStorage(e) {
      if (e.key !== CLAU_TRASPAS || !e.newValue) return;
      try {
        const d = JSON.parse(e.newValue);
        if (!d.t || Date.now() - d.t > 120000) return;
        
        const storedState = getEfimer('sdp:oauth:state', null);
        if (!storedState || !d.state || d.state !== storedState) {
          return acaba(rebutja, new Error('Estat OAuth no vàlid al storage. Possible atac CSRF.'));
        }
        
        if (d?.error) return acaba(rebutja, new Error(d.error));
        if (d?.code) acaba(resol, d.code);
      } catch { /* valor malmés: s'ignora */ }
    }

    const vigilant = setInterval(() => {
      try {
        if (emergent.closed) acaba(rebutja, new Error('S\'ha tancat la finestra abans d\'acabar d\'entrar.'));
      } catch {
        // Bloqueig de COOP. No podem accedir a emergent.closed, confiem en storage o timeout.
      }
    }, 700);

    const rellotge = setTimeout(() => {
      try { emergent.close(); } catch { /* ja tancada */ }
      acaba(rebutja, new Error('L\'entrada ha tardat massa. Torna a provar.'));
    }, TEMPS_MAXIM_MS);

    window.addEventListener('message', perMissatge);
    window.addEventListener('storage', perStorage);
  });
}

/* ───────────────────────── Tornada ───────────────────────── */

/**
 * Crida-la UNA vegada quan l'app es munte, abans de pintar res.
 *
 * Resol tres situacions:
 *   a) Som l'emergent que acaba de tornar del relé → passem el codi a la
 *      finestra mare i ens tanquem.
 *   b) Som la finestra principal després d'una redirecció completa → bescanviem.
 *   c) No hi ha res al fragment → no fem res.
 */
export async function gestionaTornada(config = {}, resolConfig) {
  if (typeof window === 'undefined') return null;
  delVal(CLAU_TRASPAS);

  const qSearch = new URLSearchParams(window.location.search);
  const qHash = new URLSearchParams(window.location.hash.substring(1));
  
  // (Suport per a flux implícit suprimit per motius de seguretat - utilitzem PKCE amb auth.js)

  const codi = qSearch.get('sdp_code') || qSearch.get('code') || qHash.get('sdp_code') || qHash.get('code');
  const error = qSearch.get('sdp_oauth_error') || qSearch.get('error') || qSearch.get('error_description') || qHash.get('sdp_oauth_error') || qHash.get('error') || qHash.get('error_description');
  if (!codi && !error) return null;

  const somEmergent = (() => {
    try { return window.opener && window.opener !== window; } catch { return false; }
  })();

  const urlState = qSearch.get('state') || qHash.get('state');

  // (a) Som l'emergent: no bescanviem ací — el verificador viu a la mare.
  if (somEmergent || window.name === 'sdp-oauth') {
    netejaRetorn();
    
    const sdpOrigin = qSearch.get('sdp_origin');
    let targetOrigin = window.location.origin;
    if (sdpOrigin) {
      try { targetOrigin = new URL(sdpOrigin).origin; } catch { /* ignora URL invàlida */ }
    }
    
    const carrega = error ? { type: 'sdp:oauth', error, state: urlState } : { type: 'sdp:oauth', code: codi, state: urlState };
    try {
      window.opener.postMessage(carrega, targetOrigin);
    } catch {
      // COOP ens ha tallat l'`opener`. Via storage.
      setVal(CLAU_TRASPAS, { ...carrega, t: Date.now() });
    }
    if (!window.opener) setVal(CLAU_TRASPAS, { ...carrega, t: Date.now() });
    setTimeout(() => { try { window.close(); } catch { /* ignora */ } }, 60);
    return null;
  }

  // (b) Finestra principal després de redirecció completa.
  if (error) {
    netejaRetorn();
    throw new Error(error);
  }

  const storedState = getEfimer('sdp:oauth:state', null);
  delEfimer('sdp:oauth:state');
  
  // Comprovació estricta (fail-closed) del state per redireccions completes
  if (!storedState || !urlState || urlState !== storedState) {
    netejaRetorn();
    throw new Error('Estat OAuth no vàlid o absent. Possible atac CSRF.');
  }

  const verificador = getEfimer(CLAU_VERIFICADOR, null);
  if (!verificador) {
    netejaRetorn();
    throw new Error('S\'ha perdut el verificador d\'esta entrada. Torna a començar des del botó d\'entrar.');
  }
  const { supabaseUrl, supabaseAnonKey } = resolConfig(config);
  return bescanvia(codi, verificador, { supabaseUrl, supabaseAnonKey }).finally(() => netejaRetorn());
}

function netejaRetorn() {
  const u = new URL(window.location.href);
  u.searchParams.delete('sdp_code');
  u.searchParams.delete('sdp_oauth_error');
  u.searchParams.delete('code');
  u.searchParams.delete('error');
  u.searchParams.delete('error_description');
  
  if (u.hash.includes('code=') || u.hash.includes('sdp_code=') || u.hash.includes('error=') || u.hash.includes('access_token=')) {
    u.hash = '';
  }
  
  window.history.replaceState(null, '', u.pathname + u.search + u.hash);
}

/** Utilitat per a proves i per al tractor. */
export const _intern = { CLAU_VERIFICADOR, CLAU_TRASPAS, relayOrigin, base64url };
```
<<<FI_FITXER>>>

## Fitxer: src/host.js

```
/**
 * host.js — LA PRESA DE CORRENT DE SÓC DE POBLE
 *
 * EL PROBLEMA QUE RESOL (auditoria 260830)
 * ────────────────────────────────────────
 * `backendPort.js` està ben fet: cap mòdul importa `supabaseBackend.js`
 * directament, tot passa pel port, i el pany s'arma. Però la Llei de
 * l'Enxufabilitat (AGENTS.md §8) era **inassolible a la pràctica**, per tres
 * barreres acumulades:
 *
 *   1 · `setBackendImplementation` no s'exposava a cap global. Zero
 *       assignacions `window.*` en tot `src/`.
 *   2 · El build standalone declara explícitament que NO és un mòdul ESM.
 *       Sense ESM i sense global, no hi ha cap superfície de crida.
 *   3 · Encara que n'hi haguera: `freezeImplementation()` es crida dins de
 *       `connectedCallback`, que dispara SÍNCRONAMENT durant
 *       `customElements.define()` quan l'etiqueta ja és al DOM — que és
 *       exactament el cas del plugin. La finestra d'injecció era de zero
 *       mil·lisegons.
 *
 * El port existia, era correcte, i estava soldat per dins.
 *
 * L'ARQUITECTURA NOVA: ARRENCADA EN DUES FASES
 * ────────────────────────────────────────────
 * El pany segueix sent innegociable — un backend injectable després del
 * muntatge seria un vector d'atac. El que canvia és QUAN es tanca:
 *
 *   Fase 1 · CONFIGURACIÓ   El host pot cridar `configura({ backend })`.
 *                           L'element encara no està definit.
 *   Fase 2 · SEGELLAT       `arrenca()` congela el backend i defineix
 *                           l'element. A partir d'ací, res es pot injectar.
 *
 * Per a entorns que necessiten arrencada sense configuració, `arrencaAuto()`
 * fa la fase 2 sola en el següent tick. Un `<script>` del host col·locat
 * després del bundle encara arriba a temps per a la fase 1, perquè el tick
 * no s'ha consumit.
 *
 * COM L'USA SOLLUTIA
 * ──────────────────
 * Si s'empra `type="module"`, el host carrega de forma diferida. Per evitar
 * curses, Sollutia ha d'esperar l'esdeveniment `socdepoble-ready` o
 * comprovar si ja està llest:
 *
 *   function bootSollutia() {
 *     window.SocDePoble.configura({ backend: { ... } });
 *     window.SocDePoble.arrenca();
 *   }
 *
 *   if (window.SocDePoble && window.SocDePoble.isReady) {
 *     bootSollutia();
 *   } else {
 *     window.addEventListener('socdepoble-ready', bootSollutia);
 *   }
 *
 * Per a substituir Supabase del tot (l'objectiu d'integració amb Sollutia), es passa el
 * contracte sencer i `supabaseBackend.js` deixa de tocar-se en temps d'execució.
 *
 * COM S'USA EN ENTORN ESTÀNDARD
 * ─────────────────────────────
 *   El build standalone acaba cridant `arrencaAuto()`. Si ningú ha configurat
 *   res, s'arrenca amb Supabase de forma autònoma.
 *
 * NOTA D'HONESTEDAT
 * ─────────────────
 * El cicle de vida dels Custom Elements no s'ha pogut provar en aquest entorn
 * (no hi ha navegador ni node_modules). L'estructura del mòdul i l'ordre de
 * crides sí que estan raonats contra el codi real de `PedraSecaEmbed.jsx`,
 * però la fase 2 s'ha de verificar en un navegador abans de donar-la per bona.
 * Vegeu `tooling/gates/tractor-enxufe.mjs` per a la comprovació estàtica.
 */

if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', (event) => {
    console.error('[host] Error de xarxa en la càrrega diferida de mòduls Vite:', event);
    // El catch de l'arrenca pintarà això si passa durant l'arrencada, 
    // però això ens cobreix canvis de ruta asíncrons.
  });
}

import { setBackendImplementation, getBackendImplementation, freezeImplementation } from './data/backendPort.js';
import { defineCustomElement } from './PedraSecaEmbed.jsx';
import { CONTRACTE_NUCLI, CONTRACTE_BACKEND } from './data/contracte.js';
import { adoptaSessioExterna, esborraSessio } from './data/identitat.js';

/* ═══════════════════════ Estat de l'arrencada ═══════════════════════ */

const FASE = { CONFIGURABLE: 'configurable', SEGELLAT: 'segellat' };
let fase = FASE.CONFIGURABLE;
let autoProgramada = false;
let arrencada = null;
let arrencaAutoTimer = null;

// Re-exportem CONTRACTE_BACKEND per retrocompatibilitat si algú l'importa des d'ací
export { CONTRACTE_BACKEND };

/* ═══════════════════════ Fase 1 · Configuració ═══════════════════════ */

/**
 * Injecta una implementació de backend abans del segellat.
 *
 * Mode estricte: la injecció ha de proveir el contracte sencer (nucli + capacitats) per a
 * evitar barreges perilloses entre Supabase i el nou backend de Sollutia.
 * O pot proveir només el nucli, però els mètodes declarats han d'estar complets.
 *
 * @param {{backend?: Record<string, Function>}} opcions
 * @returns {{acceptats: string[], desconeguts: string[], pendents: string[]}}
 * @throws {Error} si ja s'ha segellat
 */
export function configura({ backend, force = false } = {}) {
  const isDev = typeof process !== 'undefined' ? process.env.NODE_ENV === 'development' : (typeof import.meta !== 'undefined' && import.meta.env?.DEV);
  
  if (fase === FASE.SEGELLAT) {
    if (!force || !isDev) {
      throw new Error(
        "[host] Ja s'ha cridat arrenca(): el backend està segellat. "
        + 'La injecció forçada només està permesa en mode de desenvolupament per seguretat.'
      );
    }
  }
  if (!backend || typeof backend !== 'object') {
    return { acceptats: [], desconeguts: [], pendents: [...CONTRACTE_NUCLI] };
  }

  const claus = [];
  let obj = backend;
  while (obj && obj !== Object.prototype) {
    claus.push(...Object.getOwnPropertyNames(obj));
    obj = Object.getPrototypeOf(obj);
  }
  const uniqueClaus = [...new Set(claus)].filter(k => k !== 'constructor');

  const desconeguts = uniqueClaus.filter((k) => !CONTRACTE_BACKEND.includes(k));
  const acceptats = uniqueClaus.filter((k) => CONTRACTE_BACKEND.includes(k) && typeof backend[k] === 'function');

  if (desconeguts.length) {
    console.warn(`[host] Mètodes fora del contracte, ignorats: ${desconeguts.join(', ')}.`
      + ` Contracte vàlid: ${CONTRACTE_BACKEND.join(', ')}`);
  }
  const noFuncions = uniqueClaus.filter((k) => CONTRACTE_BACKEND.includes(k) && typeof backend[k] !== 'function');
  if (noFuncions.length) {
    throw new Error(`[host] Aquests membres del contracte no són funcions: ${noFuncions.join(', ')}`);
  }

  // Com que backendPort ja accepta classes i lliga el context amb bind(), només passem l'objecte
  setBackendImplementation(backend);
  return { acceptats, desconeguts, pendents: CONTRACTE_NUCLI.filter((k) => !acceptats.includes(k)) };
}

/* ═══════════════════════ Fase 2 · Segellat ═══════════════════════ */

/**
 * Congela el backend i defineix `<soc-de-poble>`. Idempotent.
 *
 * @returns {Promise<{fase: string, backend: string[]}>}
 */
export function arrenca() {
  if (arrencada) return arrencada;

  fase = FASE.SEGELLAT;

  arrencada = (async () => {
    const injectats = Object.keys(getBackendImplementation());
    const pendentsNucli = CONTRACTE_NUCLI.filter((k) => !injectats.includes(k));

    if (pendentsNucli.length > 0) {
      if (injectats.length > 0) {
        throw new Error(`[host] Injecció parcial. Falla de seguretat. Mètodes coberts: ${injectats.join(', ')}. Falten: ${pendentsNucli.join(', ')}. El fallback híbrid està prohibit per política de seguretat.`);
      } else {
        // Només importem Supabase completament si NO S'HA INJECTAT RES
        const supabaseImpl = await import('./data/supabase/index.js');
        setBackendImplementation(supabaseImpl);
      }
    }

    freezeImplementation();
    defineCustomElement();
    return { fase, backend: Object.keys(getBackendImplementation()) };
  })();

  return arrencada;
}

/**
 * Arrencada automàtica per als entorns que no configuren res.
 *
 * `setTimeout(…, 0)` és una MACROtasca, no una microtasca: la finestra
 * d'injecció és més ampla del que deia el comentari anterior. Tot i així
 * només arriba a temps un `<script>` SÍNCRON del host. Amb `defer`, `async`
 * o `type="module"` el host arriba tard i `configura()` llançarà.
 */
export function arrencaAuto() {
  if (autoProgramada || fase === FASE.SEGELLAT) return;
  autoProgramada = true;
  const fes = () => {
    if (fase === FASE.SEGELLAT) return;
    arrenca().catch((e) => {
      console.error('[host] Arrencada fallida. El component no es muntarà:', e);
      if (typeof document !== 'undefined') {
        const sdpTags = document.querySelectorAll('soc-de-poble');
        sdpTags.forEach(tag => {
          tag.innerHTML = `<div class="sdp-arranc-fallida">
            <h3>Error crític d'arrencada</h3>
            <p>Sóc de Poble no ha pogut connectar amb el backend.</p>
            <pre></pre>
          </div>`;
          tag.querySelector('pre').textContent = e.message || String(e);
        });
      }
    });
  };
  if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      arrencaAutoTimer = setTimeout(fes, 100);
    }, { once: true });
  } else {
    arrencaAutoTimer = setTimeout(fes, 100);
  }
}

/**
 * Cedeix el control del segellat a l'amfitrió, aturant l'arrencada automàtica.
 * S'ha de cridar immediatament després de carregar el bundle.
 */
export function deferArrenca() {
  autoProgramada = true;
  if (arrencaAutoTimer) {
    clearTimeout(arrencaAutoTimer);
    arrencaAutoTimer = null;
  }
}

/** Estat actual, per a diagnòstic des de la consola del host. */
export function estat() {
  return {
    fase,
    configurable: fase === FASE.CONFIGURABLE,
    contracte: CONTRACTE_BACKEND,
    implementat: Object.keys(getBackendImplementation()),
  };
}

/**
 * L'amfitrió entrega una sessió. Vàlid en qualsevol fase: les sessions
 * arriben quan l'usuari entra, no quan arranca el bundle. No confon-lo amb
 * `configura()`, que sí que està sotmés al pany del backend.
 */
export function injectaSessio(sessio, opcions = {}) {
  return adoptaSessioExterna(sessio, opcions);
}

/** L'amfitrió tanca la sessió del seu costat. */
export function expulsaSessio() {
  esborraSessio();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: null } }));
  }
  return true;
}

/* ═══════════════════════ Superfície global ═══════════════════════ */

/**
 * El build standalone no és ESM, així que un host que el carregue amb un
 * `<script>` pla necessita un global. És l'ÚNICA assignació a `window` del
 * projecte i està declarada ací, no escampada.
 *
 * IDEMPOTENT (260903): amb `configurable:false` i `writable:false`, una
 * segona crida —bloc i shortcode alhora en la mateixa pàgina, o dos
 * muntatges del bundle— llançava TypeError i matava el segon muntatge
 * sencer. Ara la segona crida torna l'API ja exposada.
 */
export function exposaGlobal(objectiu = (typeof window !== 'undefined' ? window : undefined)) {
  if (!objectiu) return null;

  const existent = Object.getOwnPropertyDescriptor(objectiu, 'SocDePoble');
  if (existent) return existent.value ?? null;

  const api = Object.freeze({ arrenca, arrencaAuto, estat, CONTRACTE_BACKEND, injectaSessio, expulsaSessio, isReady: true });
  Object.defineProperty(objectiu, 'SocDePoble', { value: api, writable: false, configurable: false });
  
  // Avisar a Sollutia o qualsevol integrador que l'API ja està llesta
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('socdepoble-ready', { detail: api }));
  }
  
  return api;
}
```
<<<FI_FITXER>>>

## Fitxer: supabase/migrations/260916_2300_correccions_mur_i_xat.sql

```
-- MIGRACIÓ: Proteccions C1 i C2 (Auditoria Extrema)
-- ==============================================================================

-- ──────────────────────────────────────────────────────────────────────────────
-- C1: MUR SUPLANTABLE
-- El trigger de publicacions ha de netejar el payload de camps sensibles
-- per evitar que un atacant injecte un `id` o `created_at` maliciós i 
-- sobreescriga una publicació existent en la vista del frontend (`mergeById`).
-- ──────────────────────────────────────────────────────────────────────────────

create or replace function public.trg_force_submission_author() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_author_name text;
begin
  if TG_OP = 'UPDATE' then
    if new.tenant_id != old.tenant_id then
      raise exception 'SDP-SEC-001: tenant_id is immutable';
    end if;
    if new.section_id != old.section_id then
      raise exception 'SDP-SEC-002: section_id is immutable';
    end if;
  end if;

  if new.author_org_id is not null then
    select name into v_author_name from public.organizations where id = new.author_org_id;
  else
    select full_name into v_author_name from public.profiles where id = new.owner_user_id;
  end if;
  
  if v_author_name is not null then
    new.payload = jsonb_set(new.payload, '{author_name}', to_jsonb(v_author_name));
  end if;
  
  -- PROTECCIÓ C1: Purguem qualsevol intent de suplantar les claus d'identitat
  new.payload = new.payload - 'id' - 'created_at' - 'author';
  
  return new;
end;
$$;


-- ──────────────────────────────────────────────────────────────────────────────
-- C2: XAT OBERT
-- Qualsevol participant podia afegir qualsevol altre usuari a un fil,
-- permetent a un tercer llegir tot l'historial (C2). 
-- Ara només el creador del fil pot afegir-hi persones.
-- ──────────────────────────────────────────────────────────────────────────────

drop policy if exists "xat_participants_insercio" on public.xat_participants;
create policy "xat_participants_insercio" on public.xat_participants
for insert to authenticated
with check (false);
```
<<<FI_FITXER>>>

<<<FI_DEL_BUNDLE>>>
