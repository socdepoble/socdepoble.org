# BUNDLE D'AUDITORIA PER AL CONSELL DE LA PETORRETA

> **Anclatge**: aquest document pertany a l'[[00_INDEX_ESCRIPTORI]].

## Com verificar aquest bundle

El bloc `MANIFEST` de baix porta ruta, bytes, línies i sha256 de cada
fitxer. No cal creure el capçal: extrau el cos i compara les sumes.
El contracte d'abast (què s'inclou i què no) també hi és declarat, així
que sabeu exactament què **no** esteu veient.

```json
{"esquema":"sdp.bundle.v2","generat":"2026-09-16T20:12:44.592Z","arrel":"socdepoble.org","verificat":true,"contracte":{"directoris":[],"fitxers_obligatoris":["src/host.js","src/PedraSecaEmbed.jsx","src/data/oauthRelay.js","public/auth/callback.html","src/data/identitat.js","src/data/adaptadors/sollutia/recursos.js","tooling/gates/tractor-sollutia.mjs","tooling/gates/run-portes.mjs","package.json","src/data/contracte.js","src/data/backendPort.js","src/data/supabase/notes.js","src/data/supabase/auth.js","supabase/migrations/260908_xat_v2_correccions.sql","supabase/migrations/260908_0000_initial_schema.sql","src/css/tokens.css","src/data/mapejadorSeccions.js","src/data/supabase/content.js"],"fitxers_opcionals":[".agents/deute/.design-guard-deute.json",".agents/deute/.estucat-deute.json",".agents/deute/.frontmatter-deute.json",".agents/deute/.nomenclatura-deute.json",".agents/deute/.pedra-seca-deute.json",".agents/deute/.promesa-deute.json",".agents/deute/.rutes-deute.json",".agents/deute/.teixit-deute.json",".agents/deute/.vocabulari-deute.json"],"extensions":[".cjs",".css",".html",".js",".json",".jsx",".md",".mjs",".php",".py",".sh",".sql",".ts",".tsx",".txt",".yaml",".yml"],"dirs_exclosos":[".brain-reports",".gemini",".git",".githooks",".husky",".next",".obsidian",".sdp-paperera",".sdp-reflex","90_arxiu_historic","90_historic","build","cervells","coverage","dist","node_modules","skills_mirror","vendor"],"fitxers_prohibits":["all_ai_responses.md","doc_logos_oficials.md","legalcontent.js","perfil_psiquiatric.md","soci_sollutia.md"]},"totals":{"fitxers":27,"bytes":232457},"absents_no_critics":[],"fitxers":[{"ruta":".agents/deute/.design-guard-deute.json","bytes":2595,"linies":68,"sha256":"a50595f21f293c5e60b58e88c7c1be27a3b209ac4a681942826646f5cc5f408f"},{"ruta":".agents/deute/.estucat-deute.json","bytes":2788,"linies":74,"sha256":"89d3b8321de059b4097091747588d65041163e9ba8646a8a40c51dc3aabcc0ab"},{"ruta":".agents/deute/.frontmatter-deute.json","bytes":359,"linies":17,"sha256":"e865c0ace0d40424ae4a1cfd14ae6f9a727dfa0ee7146d6395ec9308b3ca9dfe"},{"ruta":".agents/deute/.nomenclatura-deute.json","bytes":98,"linies":9,"sha256":"0bebb4582da53aeb52ca187de5ef0656c802f73c1dcb7953938b8b2a30662408"},{"ruta":".agents/deute/.pedra-seca-deute.json","bytes":7381,"linies":151,"sha256":"42f2a7e1c7217e8a9f76bb4322d68be142cef0d6c95d41c7ab817e357c4e2f6f"},{"ruta":".agents/deute/.promesa-deute.json","bytes":394,"linies":13,"sha256":"4c75a7c946d50789a81d337fef328e0d48d9258043501b2d6ceb2a595854e7c1"},{"ruta":".agents/deute/.rutes-deute.json","bytes":3718,"linies":45,"sha256":"bb4e3c48ca1b7ebb7b50f2fe81e3dab88b45b20637445f01a33049b1dad7d622"},{"ruta":".agents/deute/.teixit-deute.json","bytes":137,"linies":10,"sha256":"7ed4460995e906f3023d4e9723b5784ddce3a4246c741ca4af2c87d9a0a266ee"},{"ruta":".agents/deute/.vocabulari-deute.json","bytes":27392,"linies":346,"sha256":"f3764df432004aea5ad1b97a6aeec4f7f98cdd593eff7f2ccd829a283cd892e7"},{"ruta":"package.json","bytes":5966,"linies":120,"sha256":"6fb0420559f25bd12c86978ea74ddc7077eb3f811dc86360e992e9b15b24333e"},{"ruta":"public/auth/callback.html","bytes":7535,"linies":185,"sha256":"0a03dd0844c7d35f8515cc0a80a474f016d6d6713c4e9f35807ccd930a5cc82a"},{"ruta":"src/css/tokens.css","bytes":17658,"linies":375,"sha256":"6475ef86b26f355c0bc3f03efac7e2b0e13c34dbe80152febfe031175eef7e08"},{"ruta":"src/data/adaptadors/sollutia/recursos.js","bytes":720,"linies":15,"sha256":"3112f0c24887275cf65dd1eb91f573e556fe363b9e3b2f4cfa15ca79170a2bb0"},{"ruta":"src/data/backendPort.js","bytes":4540,"linies":108,"sha256":"f02867f97d84c986b4d33b7b1fdff4f23e3ee24b82dbd8c96871329f2a638a2c"},{"ruta":"src/data/contracte.js","bytes":1324,"linies":60,"sha256":"e193b1be8df3539e192f8a9a7c86f3335e8b2a150a2fb24bdc1b9a861f5d3cef"},{"ruta":"src/data/identitat.js","bytes":11353,"linies":273,"sha256":"330af19e2833359c51cc8d93b66a7903db3ee7123706bd1db10afa668517a97b"},{"ruta":"src/data/mapejadorSeccions.js","bytes":6991,"linies":155,"sha256":"e53ffec3998aceb4f54e45f3dfcd156b418e38a4e66e22f68cde6f24b6d21c02"},{"ruta":"src/data/oauthRelay.js","bytes":14181,"linies":344,"sha256":"799de80c5a8c84788ad0cd23eaa46179888c6915de048268e3f72ff8c476dcfe"},{"ruta":"src/data/supabase/auth.js","bytes":6518,"linies":150,"sha256":"694c4481b04809ff43a6f16244a59c2e7fc6e7b3e0b41e8982bbbff90993b75e"},{"ruta":"src/data/supabase/content.js","bytes":6125,"linies":74,"sha256":"d4d1c4ea40bb17b976fbb3603eca1de365ebe16d66b13c0c1b5abba488434888"},{"ruta":"src/data/supabase/notes.js","bytes":4145,"linies":61,"sha256":"834a461beddcac70d2adf02fcec76316aba7774ee81ff9971c7bc8f6b90bb500"},{"ruta":"src/host.js","bytes":12423,"linies":293,"sha256":"42b2ff18f72d443aa2b7933e04f8aafd317c17b6fdc542e497562cb182c9b5c2"},{"ruta":"src/PedraSecaEmbed.jsx","bytes":22237,"linies":603,"sha256":"c71a69672b01607aea0d6417acb6db1ae07d9891efff2fb1189558e51f988668"},{"ruta":"supabase/migrations/260908_0000_initial_schema.sql","bytes":31802,"linies":871,"sha256":"878989cf94fd1054c5f5b8480fb072837daa26e595ecd00c8a2492d09946f68d"},{"ruta":"supabase/migrations/260908_xat_v2_correccions.sql","bytes":18078,"linies":425,"sha256":"877b56c0d328963826d2d27f2070ac8b0c34a37637a95bb13d8ab625353bfaf5"},{"ruta":"tooling/gates/run-portes.mjs","bytes":7622,"linies":100,"sha256":"62f22c60858d293c579741c105b4f25966ea177fe717e47b5b6256fa93f30bc1"},{"ruta":"tooling/gates/tractor-sollutia.mjs","bytes":8377,"linies":191,"sha256":"22a3dec087be0b1d2db8994c6aaa53cd016f79a3b0e8ca4694f4528886742ab0"}]}
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

## Fitxer: package.json

```
{
  "name": "socdepoble-react",
  "version": "1.0.0",
  "type": "module",
  "sideEffects": [
    "*.css",
    "src/PedraSecaEmbed.jsx",
    "src/main.jsx"
  ],
  "scripts": {
    "despertar": "node tooling/brain/despertar.mjs",
    "porta:psicopatia": "node tooling/gates/tractor-psicopatia.mjs",
    "test:porta:psicopatia": "node --test tooling/gates/tractor-psicopatia.test.mjs",
    "porta:arrel": "node tooling/gates/tractor-arrel.mjs",
    "porta:importacions": "node tooling/gates/tractor-importacions.mjs",
    "porta:graella": "node tooling/gates/tractor-graella.mjs",
    "porta:enxufe": "node tooling/gates/tractor-enxufe.mjs",
    "porta:maquinari": "node tooling/gates/tractor-doctrina-maquinari.mjs",
    "porta:build": "node tooling/gates/tractor-build-previ.mjs",
    "porta:segella": "node tooling/gates/segella.mjs",
    "deute:revisa": "node tooling/brain/consolidar_baselines.mjs --revisa",
    "tancar": "node tooling/gates/tancament.mjs",
    "porta:shim": "node tooling/gates/tractor-shim.mjs",
    "porta:consell": "node tooling/gates/tractor-consell.mjs",
    "porta:cens": "node tooling/gates/tractor-cens.mjs",
    "porta:rutes": "node tooling/gates/tractor-rutes.mjs",
    "porta:rutes-web": "node tooling/gates/tractor-rutes-web.mjs",
    "porta:vocabulari": "node tooling/gates/tractor-vocabulari.mjs",
    "porta:tdz": "node tooling/gates/tractor-tdz.mjs",
    "porta:cromatic": "node tooling/gates/tractor-cromatic.mjs",
    "porta:crom": "node tooling/gates/tractor-crom.mjs",
    "porta:tokens": "node tooling/gates/tractor-tokens.mjs",
    "porta:fitxa": "node tooling/gates/tractor-fitxa-gestor.mjs",
    "porta:baseline": "node tooling/brain/tractor-pedra-seca.mjs --baseline && node tooling/gates/design_guard.mjs --baseline && node tooling/gates/tractor-vocabulari.mjs --baseline && node tooling/gates/tractor-promesa.mjs --baseline && node tooling/wiki/teixidor.mjs --baseline",
    "porta:promesa": "node tooling/gates/tractor-promesa.mjs",
    "porta:frontera": "node tooling/gates/tractor-sollutia.mjs",
    "porta:estucat": "node tooling/gates/tractor-estucat.mjs --arrel=.",
    "porta:teixit": "node tooling/wiki/teixidor.mjs",
    "porta:doctrina": "node tooling/gates/tractor-doctrina.mjs",
    "porta:innerhtml": "node tooling/gates/tractor-innerhtml.mjs",
    "porta:manifest": "node tooling/gates/tractor-manifest.mjs",
    "porta:persistencia": "node tooling/gates/tractor-persistencia.mjs",
    "porta:registre": "node tooling/gates/tractor-registre.mjs",
    "porta:cadena": "node tooling/gates/tractor-cadena.mjs",
    "porta:scc": "node tooling/gates/verificador-scc.mjs",
    "porta:reflex": "node tooling/wiki/reflex_petorreta.mjs doctor --ci",
    "torn:obrir": "node tooling/gates/obrir_torn.mjs",
    "porta:cognitiu": "node tooling/wiki/tractor-cognitiu.mjs --arrel=.",
    "porta:pedra-seca": "node tooling/brain/tractor-pedra-seca.mjs",
    "porta:design-guard": "node tooling/gates/design_guard.mjs --arrel=src",
    "porta:llaurador": "node tooling/wiki/llaurador_indexs.mjs --check",
    "porta:frontmatter": "node tooling/wiki/tractor-frontmatter.mjs",
    "porta:esquemes": "node tooling/wiki/tractor-esquemes.mjs",
    "porta:nomenclatura": "node tooling/wiki/tractor-nomenclatura.mjs --arrel=.",
    "porta:seo": "node tooling/gates/build-seo-manifest.mjs --verifica",
    "porta:frontera-auth": "node tooling/wiki/tractor-frontera-auth.mjs",
    "porta:matrix": "node tooling/brain/matrix.mjs \"crear un prompt\"",
    "porta:inlinestyles": "node tooling/gates/tractor-inline-styles.mjs",
    "porta:classes": "node tooling/gates/tractor-classes.mjs",
    "porta:rls": "node tooling/gates/tractor-rls.mjs",
    "porta": "node tooling/gates/run-portes.mjs",
    "gate": "npm run porta",
    "dev": "vite --host 0.0.0.0 --port 3340 --strictPort",
    "rag:build": "node -e \"import('./tooling/wiki/core/build_rag_index.mjs').then(m => m.run({root: '.'}))\"",
    "slugs:build": "node tooling/wiki/core/build_slug_index.mjs",
    "bundle": "node tooling/brain/crear_bundle.mjs",
    "build": "npm run build:tokens && npm run build:seo && npm run gate && npm run rag:build && npm run slugs:build && npm run build:web && npm run build:wp",
    "build:tokens": "node tooling/scripts/build-tokens.mjs",
    "build:seo": "node tooling/gates/build-seo-manifest.mjs --escriu",
    "build:web": "vite build",
    "build:wp": "vite build -c vite.standalone.config.js",
    "prepare": "husky",
    "preview": "vite preview --host 0.0.0.0",
    "db:seed:generate": "sh scripts/generate-supabase-seed.sh",
    "brain:maintain": "sh tooling/brain/maintain.sh .",
    "brain:distill": "python3 tooling/brain/brain_distill.py",
    "pdf:render": "sh tooling/pdf/render_pdf.sh",
    "test": "vitest",
    "lint": "eslint src tooling scripts tests",
    "porta:llavor": "node tooling/gates/tractor-llavor.mjs",
    "porta:58px": "node tooling/gates/01_porta_pedra_seca_58px.mjs",
    "porta:cataleg": "node tooling/gates/tractor-cataleg.mjs",
    "porta:adaptadors": "node tooling/gates/tractor-adaptadors.mjs"
  },
  "dependencies": {
    "@supabase/supabase-js": "^2.112.4",
    "@tiptap/core": "^3.31.3",
    "@tiptap/extension-image": "^3.31.3",
    "@tiptap/react": "^3.31.0",
    "@tiptap/starter-kit": "^3.31.0",
    "@tiptap/suggestion": "^3.31.3",
    "date-fns": "^4.4.0",
    "dompurify": "^3.4.14",
    "lucide-react": "^1.35.0",
    "preact": "^10.29.8",
    "react": ">=18.0.0",
    "react-day-picker": "^8.10.2",
    "react-dom": ">=18.0.0"
  },
  "devDependencies": {
    "@babel/parser": "^8.0.4",
    "@eslint/js": "^9.39.5",
    "@preact/preset-vite": "^2.10.6",
    "@testing-library/preact": "^3.2.4",
    "acorn": "^8.18.0",
    "css": "^3.0.0",
    "eslint": "^9.39.5",
    "eslint-plugin-react": "^7.37.5",
    "globals": "^17.9.0",
    "husky": "^9.1.7",
    "jsdom": "^29.1.1",
    "vite": "^7.1.0",
    "vitest": "^4.1.10"
  },
  "engines": {
    "node": ">=20"
  },
  "private": true
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
    var camiValid = /^(\/[a-zA-Z0-9\-_\/]*)?$/.test(path);
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

## Fitxer: src/css/tokens.css

```
/* ====================================================================
   PEDRA SECA · TOKENS
   Capa 1 primitius · Capa 2 semantics · Capa 2b crom. Sense capa: no hi ha cascada a disputar, nomes custom properties.
   ==================================================================== */

/* ── 0. TOKENS ─────────────────────────────────────────────────────
   DOS CAPES. Esta separació és la llei del sistema.

   CAPA 1 · PRIMITIUS  — la paleta física. Generada en OKLCH amb to i
            croma de marca constants; només varia la lluminositat.
            NO s'usen mai directament als components.
   CAPA 2 · SEMÀNTICS  — el significat. És l'ÚNICA capa que toquen els
            components, l'única que canvia el tema fosc i l'única
            superfície que exposarà el tauler de control.

   Regla mecànica: si un component escriu var(--sdp-pedra-*),
   var(--sdp-primary-*) o var(--sdp-secondary-*), és un error.
   ───────────────────────────────────────────────────────────────── */

:host {
  all: initial;
}

/* El <body class="sdp-root"> NO porta `all: initial`: (0,1,0) guanyaria
   la regla `body` (0,0,1) i li llevaria font, color i fons. Ací només
   neutralitzem el que fa mal, sense tocar l'herència. */
.sdp-root {
  margin: 0;
  padding: 0;
  border: 0;
}

:root, :host, .sdp-root {
  /* ═══ CAPA 1 · PRIMITIUS ═══════════════════════════════════════ */

  /* Pedra · neutre càlid — OKLCH H 84°, croma baix */
  /* Baseline 2022 (Chrome 100 / FF 100): oklch() no existeix fins a
     Chrome 111 i FF 113. Amb oklch() estos dos primitius eren
     IACVT i --sdp-fons-targeta queia a `transparent`. Hex, doncs.
     --sdp-blanc i --sdp-negre eren primitius morts: fora. */
  --sdp-blanc-pur: #ffffff;
  --sdp-negre-pur: #000000;
  --sdp-pedra-50:  #ffffff;
  --sdp-pedra-100: #f8f6f4;
  --sdp-fons-lectura: #f7f6f3;
  --sdp-pedra-150: #f3f0ec; /* Intermig per si fa falta */
  --sdp-pedra-200: #efece7;
  --sdp-pedra-300: #dcd7cd;
  --sdp-pedra-400: #b7b1a5;
  --sdp-pedra-500: #8b857b;
  --sdp-pedra-600: #5b564e;
  --sdp-pedra-700: #3d3b35;
  --sdp-pedra-750: #302e29;
  --sdp-pedra-800: #22211e;
  --sdp-pedra-850: #181715;
  --sdp-pedra-900: #0e0d0c;

  /* Primari · taronja de terra — OKLCH H 47.9° (to exacte del cànon #FF7300) */
  --sdp-primary-50:  #fff6f0;
  --sdp-primary-100: #ffe7dc;
  --sdp-primary-200: #ffd1bb;
  --sdp-primary-300: #ffb38c;
  --sdp-primary-400: #ff955b;
  --sdp-primary-500: var(--sdp-canon-taronja);   /* el cànon. Només com a FONS. */
  --sdp-primary-600: #dd6302;
  --sdp-primary-700: #ad4c03;   /* Taronja fort · text i fons massís d'accent */
  --sdp-primary-800: #873a01;   /* text accent · 7,97:1 · AAA */
  --sdp-primary-900: #602701;

  /* Secundari · blau de mar — OKLCH H 250.6° (to exacte del cànon #0984E3) */
  --sdp-secondary-50:  #f1f8ff;
  --sdp-secondary-100: #e0efff;
  --sdp-secondary-200: #c3e0ff;
  --sdp-secondary-300: #96c9ff;
  --sdp-secondary-400: #49a3fa;
  --sdp-secondary-500: var(--sdp-canon-blau);   /* fons · text blanc 5,23:1 · AA */
  --sdp-secondary-600: #00599d; /* Blau fort · text i fons massís d'acció */
  --sdp-secondary-700: #004983;
  --sdp-secondary-800: #003663;
  --sdp-secondary-900: #002546;

  /* Estat */
  --sdp-error-500: #c2181d;  --sdp-error-50: #ffedeb;  --sdp-error-700: #92000c;
  --sdp-avis-500:  #9c6902;  --sdp-avis-50:  #fff1df;  --sdp-avis-700:  #6e4901;
  --sdp-exit-500:  #027e38;  --sdp-exit-50:  #e4f8e7;  --sdp-exit-700:  #005c27;

  /* ═══ CAPA 2 · SEMÀNTICS · TEMA CLAR ═══════════════════════════
     Cada línia porta el contrast mesurat i el nivell que compleix.  */

  /* Fons */
  --sdp-fons-app:        var(--sdp-pedra-150);
  --sdp-fons-targeta:    var(--sdp-blanc-pur);
  --sdp-fons-elevat:     var(--sdp-blanc-pur);
  --sdp-fons-superficie: var(--sdp-blanc-pur);

  /* Estructura de marca: no canvia amb el tema */
  --sdp-fons-roca:       var(--sdp-pedra-900);
  --sdp-sobre-roca:      var(--sdp-pedra-50);
  --sdp-fons-subtil:     var(--sdp-pedra-200);
  --sdp-fons-invers:     var(--sdp-pedra-900);
  --sdp-fons-vel:        rgba(14, 13, 12, 0.55);
  --sdp-color-focus:     var(--sdp-secondary-500);

  /* Text — TOT compleix AAA (≥7:1) sobre la seua superfície */
  --sdp-text-titol:  var(--sdp-pedra-900);   /* 19,42:1 */
  --sdp-text-cos:    var(--sdp-pedra-700);   /* 11,20:1 */
  --sdp-text-suau:   var(--sdp-pedra-600);   /*  7,24:1 */
  --sdp-text-invers: var(--sdp-pedra-50);
  --sdp-text-desactivat: var(--sdp-pedra-500);  /* Afegeix ací overrides temporals o experiments en viu */

  /* Vores */
  --sdp-vora:         var(--sdp-pedra-300);   /* decorativa */
  --sdp-vora-control: var(--sdp-pedra-500);   /* 3,66:1 · WCAG 1.4.11 */
  --sdp-vora-forta:   var(--sdp-pedra-600);

  /* Accent · taronja — identitat de marca */
  --sdp-accent:            var(--sdp-primary-500);
  --sdp-accent-hover:      var(--sdp-primary-600);
  --sdp-accent-subtil:     var(--sdp-primary-50);
  --sdp-sobre-accent:      var(--sdp-pedra-900);    /*  7,12:1 · AAA */
  --sdp-accent-text:       var(--sdp-primary-700);  /*  5,51:1 · AA  (interacció) */
  --sdp-accent-text-hover: var(--sdp-primary-800);  /*  7,97:1 · AAA */
  --sdp-accent-titol:      var(--sdp-primary-700);  /*  5,51:1 · AA (h2, h4) */

  /* Acció · blau */
  --sdp-accio:         var(--sdp-secondary-500);
  --sdp-accio-hover:   var(--sdp-secondary-700);
  --sdp-accio-forta:   var(--sdp-secondary-700);
  --sdp-accio-subtil:  var(--sdp-secondary-50);
  --sdp-sobre-accio:   #ffffff;                  /*  5,23:1 · AA */
  --sdp-accio-text:    var(--sdp-secondary-700); /*  9,21:1 · AAA (h1, h3, h5) */
  --sdp-focus:         var(--sdp-secondary-700);
  --sdp-focus-invers:  var(--sdp-primary-400);

  /* Estat semàntic */
  --sdp-error: var(--sdp-error-500);  --sdp-error-fons: var(--sdp-error-50);  --sdp-error-text: var(--sdp-error-700);
  --sdp-avis:  var(--sdp-avis-500);   --sdp-avis-fons:  var(--sdp-avis-50);   --sdp-avis-text:  var(--sdp-avis-700);
  --sdp-exit:  var(--sdp-exit-500);   --sdp-exit-fons:  var(--sdp-exit-50);   --sdp-exit-text:  var(--sdp-exit-700);
  --sdp-info:  var(--sdp-secondary-500); --sdp-info-fons: var(--sdp-secondary-50); --sdp-info-text: var(--sdp-secondary-700);

  /* ═══ MÈTRIQUES, MOVIMENT, TIPOGRAFIA ═════════════════════════ */

  /* Radis */
  --sdp-radi-s: 8px;
  --sdp-radi-m: 12px;
  --sdp-radi-g: 16px;
  --sdp-radi-xl: 24px;
  --sdp-radi-pastilla: 999px;

  /* Ombres · to pedra, mai negre pur */
  --sdp-ombra-1: 0 1px 3px rgba(14, 13, 12, 0.05);
  --sdp-ombra-2: 0 3px 10px rgba(14, 13, 12, 0.07);
  --sdp-ombra-3: 0 10px 28px rgba(14, 13, 12, 0.10);
  --sdp-ombra-4: 0 18px 44px rgba(14, 13, 12, 0.16);

  /* Moviment */
  --sdp-t: 0.18s ease;
  --sdp-t-lenta: 0.3s cubic-bezier(0.2, 0.7, 0.3, 1);

  /* Mètriques del layout */
  --sdp-ctrl-vw: clamp(320px, 100vw, 1024px);
  --sdp-ctrl-scale: calc((var(--sdp-ctrl-vw) - 320px) / (1024px - 320px));
  --sdp-step-0: calc(14px + (16 - 14) * var(--sdp-ctrl-scale));
  --sdp-space-base: var(--sdp-step-0);

  --sdp-col-sidebar: 260px;
  --sdp-col-llista: 380px;
  --sdp-alt-negra: 64px;
  --sdp-alt-accio: 58px;
  --sdp-alt-barres: calc(var(--sdp-alt-negra) + var(--sdp-alt-accio) * 2);  /* 180px · pila sticky */
  --sdp-alt-nav-mobil: 96px;                 /* nav inferior + separació */
  --sdp-pad-contenidor: clamp(16px, 4vw, 40px);
  --sdp-fitxa-mida: 96px;                    /* LLEI DE LA FITXA · costat de la media = alçada mínima */

  /* LLEI DE VIDA · objectiu tàctil mínim. Cap control per davall. */
  --sdp-touch-min: 44px;
  --sdp-touch: var(--sdp-touch-min);
  --sdp-touch-comode: 48px;

  /* Escala z-index · única font de veritat */
  --z-barra-taronja: 99080;
  --z-barra-blava: 99090;
  --z-barra-negra: 99100;
  --z-sidebar: 99200;
  --z-fab: 99500;
  --z-nav-mobil: 99950;
  --z-vel: 99960;
  --z-calaix: 99990;

  /* Tipografia */
  --sdp-font: 'Noto Sans', system-ui, -apple-system, 'Segoe UI', sans-serif;
  --sdp-font-mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;

  --sdp-text-h1: 2.5rem;
  --sdp-text-h2: 2rem;
  --sdp-text-h3: 1.75rem;
  --sdp-text-h4: 1.5rem;
  --sdp-text-h5: 1.25rem;
  --sdp-text-h6: 1.125rem;
  --sdp-text-lead: 1.25rem;
  --sdp-text-base: 1.125rem;
  --sdp-text-small: 1rem;
  --sdp-text-meta: 0.875rem;   /* 14px · sòl absolut de mida de lletra */

  --sdp-leading-tight: 1.15;
  --sdp-leading-snug: 1.21;
  --sdp-leading-body: 1.65;

  /* Escala d'espaiat modular · base 4/8 */
  --sdp-space-0: 0px;   --sdp-space-1: 4px;   --sdp-space-2: 8px;
  --sdp-space-3: 12px;  --sdp-space-4: 16px;  --sdp-space-5: 20px;
  --sdp-space-6: 24px;  --sdp-space-8: 32px;  --sdp-space-10: 40px;
  --sdp-space-12: 48px; --sdp-space-16: 64px; --sdp-space-20: 80px;

  /* ── RITME VERTICAL EDITORIAL ── */
  --sdp-measure: 68ch;                 /* mesura de columna · APLICADA */
  --sdp-leading-editorial: 1.65;
  --sdp-leading-display: 1.15;
  --sdp-mt-h1: 0;    --sdp-mb-h1: 16px;
  --sdp-mt-h2: 48px; --sdp-mb-h2: 12px;   /* corregit: h2 domina h3 */
  --sdp-mt-h3: 40px; --sdp-mb-h3: 12px;
  --sdp-mt-h4: 32px; --sdp-mb-h4: 8px;
  --sdp-mt-h5: 24px; --sdp-mb-h5: 6px;
  --sdp-mt-h6: 20px; --sdp-mb-h6: 6px;
  --sdp-mb-lead: 24px;
  --sdp-mb-p: 20px;
  --sdp-mb-ul: 20px;
  --sdp-li-gap: 8px;
  --sdp-bq-indent: 24px;

  /* ═══ CAPA 2b · CROM · LA CLOSCA IMMUTABLE (260911) ═══════════════
     TopBar (header.bar-black) i SideBar (nav.app-sidebar) no canvien
     MAI entre clar i fosc. Llei:
       · Els --sdp-crom-* es declaren NOMÉS ací. Prohibit redefinir-los
         al bloc fosc (ho vigila tooling/gates/tractor-crom.mjs).
       · Les regles de la closca només pinten amb --sdp-crom-* o literals.
       · Són l'única porta legítima a les rampes des de la closca: així
         ni els components toquen primitius ni la closca toca semàntics
         que s'inverteixen. Resol la contradicció de pedra-seca/SKILL.md.
     Tots els parells text/fons són AAA (mesurats al dictamen 260911). */
  --sdp-crom-fons:              var(--sdp-pedra-900);
  --sdp-crom-text:              var(--sdp-pedra-50);
  --sdp-crom-text-suau:         rgba(255, 255, 255, 0.78);
  --sdp-crom-vora:              rgba(255, 255, 255, 0.06);
  --sdp-crom-hover:             rgba(255, 255, 255, 0.09);
  --sdp-crom-actiu-fons:        var(--sdp-primary-500);
  --sdp-crom-actiu-fons-hover:  var(--sdp-primary-400);
  --sdp-crom-actiu-text:        var(--sdp-pedra-900);
  --sdp-crom-control-fons:      var(--sdp-secondary-700);
  --sdp-crom-control-hover:     var(--sdp-secondary-600);
  --sdp-crom-control-text:      var(--sdp-pedra-50);
  --sdp-crom-sistema:           rgba(255, 230, 100, 0.9);
  --sdp-crom-sistema-viu:       rgba(255, 230, 100, 1);
  --sdp-crom-sistema-actiu:     rgba(255, 230, 100, 0.1);
  --sdp-crom-focus:             var(--sdp-primary-400);
  --sdp-crom-scroll:            var(--sdp-pedra-600);
  --sdp-crom-vora-forta:        rgba(255, 255, 255, 0.15);
  --sdp-crom-realc:             rgba(255, 255, 255, 0.07);
  --sdp-crom-scroll-pista:      rgba(0, 0, 0, 0.15);
  --sdp-crom-scroll-puny:       rgba(0, 0, 0, 0.21);
  --sdp-crom-scroll-puny-viu:   rgba(0, 0, 0, 0.35);
  --sdp-crom-ombra:             0 18px 44px rgba(14, 13, 12, 0.16);


  /* === ANELLS DE FOCUS I VALIDACIO ==============================
     Abans eren rgba() literals repartits pel monolit: el canon blau
     escrit a ma (1,110,191), el roig d'error (194,20,25) i el taronja
     (254,116,6). Ara la tinta viu aci i prou. */
  --sdp-anell-accio:  rgba(1, 110, 191, 0.16);
  --sdp-anell-error:  rgba(194, 20, 25, 0.16);
  --sdp-anell-accent: rgba(254, 116, 6, 0.15);
  --sdp-accent-vel:   rgba(254, 116, 6, 0.18);
  --sdp-ombra-accio:  0 8px 20px rgba(0, 73, 131, 0.45);

  /* Tinta de les ombres pedra: els box-shadow ad hoc del legat. */
  --sdp-ombra-hover:   0 6px 16px rgba(14, 13, 12, 0.16);
  --sdp-ombra-premut:  0 2px 6px rgba(14, 13, 12, 0.14);
  --sdp-ombra-flotant: 0 12px 32px rgba(14, 13, 12, 0.28);
  --sdp-fons-hover-subtil: rgba(14, 13, 12, 0.06);

  /* Blanc que NO s'inverteix. --sdp-text-invers SI que s'inverteix
     (pedra-50 en clar, pedra-900 en fosc): posar-lo damunt d'un fons
     saturat com --sdp-error deixaria text negre sobre roig en fosc.
     Per a text damunt de color massis, este es el token. */
  --sdp-sobre-color: #ffffff;

  accent-color: var(--sdp-accio);
  color-scheme: light;
}

/* ═══ CAPA 2 · SEMÀNTICS · TEMA FOSC ═══════════════════════════════
   Un sol bloc. Redefinix NOMÉS semàntics: els primitius no es toquen
   mai, per això l'escala pedra continua sent monòtona i res no es
   torna invisible.

   La resolució de la preferència del sistema la fa el script mínim
   del <head>, que escriu data-theme a l'<html> abans del primer
   pintat. Per això ACÍ NO hi ha cap @media (prefers-color-scheme):
   duplicar-lo seria dos fonts de veritat per al mateix fet.

   IDENTITAT ESTABLE: el taronja continua sent el taronja i el blau
   continua sent el blau. Vegeu la nota D-4 de l'informe.
   ───────────────────────────────────────────────────────────────── */

:root[data-theme="dark"], :host([data-theme="dark"]),
:root[data-theme="dark"] .sdp-root, :host([data-theme="dark"]) .sdp-root {
  color-scheme: dark;

  --sdp-fons-app:        var(--sdp-pedra-900);
  --sdp-fons-targeta:    var(--sdp-pedra-850);
  --sdp-fons-elevat:     var(--sdp-pedra-800);
  --sdp-fons-superficie: var(--sdp-pedra-850);
  --sdp-fons-subtil:     var(--sdp-pedra-750);
  --sdp-fons-invers:     var(--sdp-pedra-100);
  --sdp-fons-vel:        rgba(14, 13, 12, 0.72);

  --sdp-text-titol:  var(--sdp-pedra-50);    /* 17,48:1 */
  --sdp-text-cos:    var(--sdp-pedra-200);   /* 15,20:1 */
  --sdp-text-suau:   var(--sdp-pedra-300);   /* 12,44:1 */
  --sdp-text-invers: var(--sdp-pedra-900);
  --sdp-text-desactivat: var(--sdp-pedra-500);

  --sdp-vora:         var(--sdp-pedra-750);
  --sdp-vora-control: var(--sdp-pedra-500);  /*  4,90:1 */
  --sdp-vora-forta:   var(--sdp-pedra-400);

  --sdp-accent:            var(--sdp-primary-500);
  --sdp-accent-hover:      var(--sdp-primary-400);
  --sdp-accent-subtil:     var(--sdp-primary-900);
  --sdp-sobre-accent:      var(--sdp-pedra-900);   /*  7,13:1 */
  --sdp-accent-text:       var(--sdp-primary-400); /*  8,24:1 */
  --sdp-accent-text-hover: var(--sdp-primary-300); /* 10,26:1 */
  --sdp-accent-titol:      var(--sdp-primary-300); /* 10,26:1 */

  --sdp-accio:         var(--sdp-secondary-500);
  --sdp-accio-hover:   var(--sdp-secondary-400);
  --sdp-accio-forta:   var(--sdp-accio-text);
  --sdp-accio-subtil:  var(--sdp-secondary-900);
  --sdp-sobre-accio:   #ffffff;
  --sdp-accio-text:    var(--sdp-secondary-300);   /* 10,28:1 */
  --sdp-focus:         var(--sdp-focus-invers);
  --sdp-focus-invers:  var(--sdp-primary-400);

  --sdp-error-fons: #2a0f11; --sdp-error-text: #ffb3b0;
  --sdp-avis-fons:  #2a1e05; --sdp-avis-text:  #f5c96b;
  --sdp-exit-fons:  #052213; --sdp-exit-text:  #86dfa4;
  --sdp-info-fons:  #041f33; --sdp-info-text:  var(--sdp-secondary-300);

  --sdp-ombra-1: 0 1px 3px rgba(0, 0, 0, 0.45);
  --sdp-ombra-2: 0 3px 10px rgba(0, 0, 0, 0.55);
  --sdp-ombra-3: 0 10px 28px rgba(0, 0, 0, 0.62);
  --sdp-ombra-4: 0 18px 44px rgba(0, 0, 0, 0.72);
}

/* Mostres de paleta · sense cap estil inline */
.sw-pedra-100 { background: var(--sdp-pedra-100); color: var(--sdp-pedra-900); }
.sw-pedra-200 { background: var(--sdp-pedra-200); color: var(--sdp-pedra-900); }
.sw-pedra-300 { background: var(--sdp-pedra-300); color: var(--sdp-pedra-900); }
.sw-pedra-400 { background: var(--sdp-pedra-400); color: var(--sdp-pedra-900); }
.sw-pedra-500 { background: var(--sdp-pedra-500); color: var(--sdp-pedra-50); }
.sw-pedra-600 { background: var(--sdp-pedra-600); color: var(--sdp-pedra-50); }
.sw-pedra-700 { background: var(--sdp-pedra-700); color: var(--sdp-pedra-50); }
.sw-pedra-750 { background: var(--sdp-pedra-750); color: var(--sdp-pedra-50); }
.sw-pedra-800 { background: var(--sdp-pedra-800); color: var(--sdp-pedra-50); }
.sw-pedra-850 { background: var(--sdp-pedra-850); color: var(--sdp-pedra-50); }
.sw-pedra-900 { background: var(--sdp-pedra-900); color: var(--sdp-pedra-50); }
.sw-blanc-pur { background: var(--sdp-sobre-color); color: var(--sdp-pedra-900); box-shadow: inset 0 0 0 1px var(--sdp-fons-hover-subtil); }
.sw-negre-pur { background: var(--sdp-pedra-900); color: var(--sdp-sobre-color); }
.sw-primary-500 { background: var(--sdp-primary-500); color: var(--sdp-pedra-900); }
.sw-secondary-500 { background: var(--sdp-secondary-500); color: var(--sdp-sobre-color); }
.sw-secondary-600 { background: var(--sdp-accio-text); color: var(--sdp-sobre-color); }
.sw-error-500 { background: var(--sdp-error-500); color: var(--sdp-sobre-color); }
.sw-avis-500 { background: var(--sdp-avis-500); color: var(--sdp-sobre-color); }
.sw-exit-500 { background: var(--sdp-exit-500); color: var(--sdp-sobre-color); }
```
<<<FI_FITXER>>>

## Fitxer: src/data/adaptadors/sollutia/recursos.js

```
/**
 * recursos.js — Registre dels recursos de Sollutia que consumim.
 *
 * HONESTEDAT DE CONTRACTE: el bundle 260911 no conté cap resposta real de
 * Sollutia. No inventem rutes ni camps. Cada recurs arriba ací en tres passes:
 *   1. Captura: tooling/sollutia/captura-contracte.mjs desa la FORMA
 *      anonimitzada a tests/frontissa/fixtures/sollutia/<recurs>.json.
 *   2. Traductor: forma d'entrada literal + mapa cap a un DTO de dto.js.
 *   3. Porta: tractor-frontissa valida cada fixture contra el seu traductor.
 * Mentre `ruta` o `traductor` siguen null, `llig()` falla tancat.
 */
export const RECURSOS = {
  // exemple: perfil: { ruta: null, llista: false, traductor: null, fixture: 'perfil.json' },
};
```
<<<FI_FITXER>>>

## Fitxer: src/data/backendPort.js

```
// src/data/backendPort.js

import { CONTRACTE_BACKEND, CAPACITATS } from './contracte.js';

let currentImpl = null;
let isLocked = false;

export function setBackendImplementation(impl, force = false) {
  const isDev = typeof process !== 'undefined' ? process.env.NODE_ENV === 'development' : (typeof import.meta !== 'undefined' && import.meta.env?.DEV);
  if (isLocked && (!force || !isDev)) {
    throw new Error('[backendPort] 🔒 Backend bloquejat. Injecció tardana detectada. El salt forçós (force) només s\'admet en desenvolupament.');
  }
  if (!currentImpl) currentImpl = {};
  
  let obj = impl;
  while (obj && obj !== Object.prototype) {
    for (const key of Object.getOwnPropertyNames(obj)) {
      if (CONTRACTE_BACKEND.includes(key) && typeof obj[key] === 'function') {
        // Enllaçar al 'impl' original per preservar el 'this' de la classe
        currentImpl[key] = obj[key].bind(impl);
      } else if (CONTRACTE_BACKEND.includes(key)) {
        currentImpl[key] = obj[key];
      }
    }
    obj = Object.getPrototypeOf(obj);
  }
}

export function getBackendImplementation() {
  return currentImpl || {};
}

export function freezeImplementation() {
  isLocked = true;
  if (currentImpl) Object.freeze(currentImpl);
}

export function destroy() {
  if (currentImpl && typeof currentImpl.destroy === 'function') {
    currentImpl.destroy();
  }
}

export function teCapacitat(cap) {
  if (!CAPACITATS[cap] || !currentImpl) return false;
  return CAPACITATS[cap].every(m => typeof currentImpl[m] === 'function');
}



const asseguraMetode = (nom) => (...args) => {
  if (!currentImpl || typeof currentImpl[nom] !== 'function') {
    throw new Error(`[backendPort] El mètode "${nom}" no està implementat al backend actual.`);
  }
  return currentImpl[nom](...args);
};

export const getDefaultUserId = asseguraMetode('getDefaultUserId');
export const refrescaSessio = asseguraMetode('refrescaSessio');
export const elMeuRol = asseguraMetode('elMeuRol');

export const loadCoreContent = asseguraMetode('loadCoreContent');
export const loadMur = asseguraMetode('loadMur');
export const loadMultimedia = asseguraMetode('loadMultimedia');
export const loadNotes = asseguraMetode('loadNotes');
export const appendChatMessages = asseguraMetode('appendChatMessages');

export const appendSectionSubmissionNetworkOnly = asseguraMetode('appendSectionSubmissionNetworkOnly');
export const updateNote = asseguraMetode('updateNote');
export const loginWithMagicLink = asseguraMetode('loginWithMagicLink');
export const registerWithPassword = asseguraMetode('registerWithPassword');
export const loginWithPassword = asseguraMetode('loginWithPassword');
export const loginWithGoogle = asseguraMetode('loginWithGoogle');
export const listMyOrganizations = asseguraMetode('listMyOrganizations');
export const createOrganization = asseguraMetode('createOrganization');
export const updateOrganization = asseguraMetode('updateOrganization');
export const updateProfile = asseguraMetode('updateProfile');
export const updateUserPassword = asseguraMetode('updateUserPassword');
export const getProfile = asseguraMetode('getProfile');
export const recullTornadaOAuth = asseguraMetode('recullTornadaOAuth');
export const logout = asseguraMetode('logout');
export const getCurrentUser = asseguraMetode('getCurrentUser');
export const getBackendConfigurat = asseguraMetode('getBackendConfigurat');
export const getRuntimeDataMode = asseguraMetode('getRuntimeDataMode');


// Nous mètodes per al Xat v2 i el pont amb Notes
export const createNote = asseguraMetode('createNote');
export const loadFils = asseguraMetode('loadFils');
export const loadMissatges = asseguraMetode('loadMissatges');
export const enviaMissatge = asseguraMetode('enviaMissatge');
export const marcaLlegit = asseguraMetode('marcaLlegit');
export const creaFilDirecte = asseguraMetode('creaFilDirecte');
export const carregaMembres = asseguraMetode('carregaMembres');
export const subscribeToXat = asseguraMetode('subscribeToXat');
export const unsubscribeFromXat = asseguraMetode('unsubscribeFromXat');

// Mode Administrador
export const adminListUsers = asseguraMetode('adminListUsers');
export const adminListOrganizations = asseguraMetode('adminListOrganizations');


/* Fase 4 · Mitjans (capacitat 'mitjans').
   Cap component importa Supabase: demanen la capacitat i, si no hi és,
   es queden amb el comportament d'abans. */
export const uploadToStorage = asseguraMetode('uploadToStorage');
export const getPublicUrl = asseguraMetode('getPublicUrl');
```
<<<FI_FITXER>>>

## Fitxer: src/data/contracte.js

```
/* SDP-LOCK */
export const CONTRACTE_NUCLI = Object.freeze([
  'loadCoreContent',
  'loadMur',
  'loadMultimedia',
  'loadNotes',
  'appendChatMessages',
  'appendSectionSubmissionNetworkOnly',
  'updateNote',
  'loginWithMagicLink',
  'registerWithPassword',
  'loginWithPassword',
  'loginWithGoogle',
  'listMyOrganizations',
  'createOrganization',
  'updateOrganization',
  'updateProfile',
  'updateUserPassword',
  'getProfile',
  'recullTornadaOAuth',
  'logout',
  'getCurrentUser',
  'getBackendConfigurat',
  'getRuntimeDataMode',
  'getDefaultUserId',
  'createNote',
  'loadFils',
  'loadMissatges',
  'enviaMissatge',
  'marcaLlegit',
  'creaFilDirecte',
  'carregaMembres',
  'subscribeToXat',
  'unsubscribeFromXat'
]);

export const CAPACITATS = Object.freeze({
  admin: Object.freeze([
    'adminListUsers',
    'adminListOrganizations'
  ]),

  sessio: Object.freeze([
    'refrescaSessio',
    'elMeuRol'
  ]),
  /* Fase 4. No és nucli a posta: un backend sense Storage segueix sent
     vàlid i la interfície cau cap a data URL. teCapacitat('mitjans')
     és l'única manera legítima de preguntar-ho. */
  mitjans: Object.freeze([
    'uploadToStorage',
    'getPublicUrl'
  ])
});

export const CONTRACTE_BACKEND = Object.freeze([
  ...CONTRACTE_NUCLI,
  ...Object.values(CAPACITATS).flat()
]);
```
<<<FI_FITXER>>>

## Fitxer: src/data/identitat.js

```
/**
 * identitat.js — Font única de la identitat.
 *
 * REGLA: si hi ha sessió, la identitat és la de la sessió. El convidat només
 * existix mentre no s'ha entrat, i mai substituix un usuari real.
 *
 * ══════════════════════════════════════════════════════════════════════════
 * CORRECCIÓ P0 (260908) · EL CISMA DE LA SESSIÓ
 *
 * Hi havia dues meitats d'un mateix sistema d'autenticació que no es parlaven.
 * La capa efímera es va afegir a l'auditoria 260829 per al verificador PKCE;
 * després algú hi va moure també els tokens, però ni el `user`, ni la lectura
 * d'`identitat()`, ni el `logout()` van fer el mateix viatge:
 *
 *   ESCRIPTURA   _renova() i bescanvia()
 *                  jwt           → setEfimer  (sessionStorage)
 *                  refresh-token → setEfimer  (sessionStorage)
 *                  user          → setVal     (emmagatzematge local)   ← desaparellat
 *
 *   LECTURA      buildHeaders()  → getEfimer  ✓
 *                identitat()     → getVal     ✗  no el trobava MAI
 *
 *   ESBORRAT     logout()        → delVal × 3 ✗  no esborrava cap token
 *
 * Tres conseqüències reals, no teòriques:
 *
 *   1 · `getDefaultUserId()` tornava SEMPRE l'uuid de convidat, encara que la
 *       sessió estiguera oberta. `identitat()` buscava el jwt a emmagatzematge local,
 *       on no ha estat mai.
 *
 *   2 · `logout()` no tancava res. Esborrava tres claus de emmagatzematge local; el jwt
 *       i el refresh-token es quedaven vius a sessionStorage i la petició
 *       següent els tornava a usar. El botó d'eixir era decoratiu.
 *
 *   3 · SESSIÓ FANTASMA, la pitjor de les tres. En tancar la pestanya moria el
 *       sessionStorage però el `user` de emmagatzematge local sobrevivia. En tornar:
 *       `getCurrentUser()` tornava una persona, la interfície es pintava com si
 *       hagueres entrat, `buildHeaders()` enviava la clau anònima i CADA
 *       escriptura moria amb un 42501 de RLS. L'usuari veu que està dins i no
 *       pot fer res, sense cap missatge que explique per què.
 *
 * DECISIÓ: les tres peces de la sessió viuen a la MATEIXA capa, l'efímera.
 * Un token que mor amb la pestanya i un usuari que sobreviu no són una sessió:
 * són dues sessions distintes fingint que són una. El preu és tornar a entrar
 * en obrir el navegador; l'alternativa era baixar els tokens a emmagatzematge local, i
 * a un origen de WordPress compartit amb Sollutia i qualsevol altre connector
 * això és regalar la sessió a qui vullga llegir-la.
 * ══════════════════════════════════════════════════════════════════════════
 */
import { getVal, setVal, delVal, getEfimer, setEfimer, delEfimer } from '../config/storage.js';

/**
 * LES CLAUS VIUEN ACÍ I NOMÉS ACÍ.
 *
 * Estaven escrites a mà en quatre fitxers. Per això va ser possible moure'n
 * dues de capa i deixar-se'n una: no hi havia cap lloc on es veren juntes.
 */
export const CLAU_JWT = 'socdepoble-jwt';
export const CLAU_REFRESC = 'socdepoble-refresh-token';
export const CLAU_USUARI = 'socdepoble-user';

const CLAU_CONVIDAT = 'socdepoble-guest-session-id';
const UUID_NUL = '00000000-0000-0000-0000-000000000000';
const RE_UUID = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

export function idConvidat() {
  if (typeof window === 'undefined') return UUID_NUL;
  try {
    let id = getVal(CLAU_CONVIDAT);
    if (!id || !RE_UUID.test(String(id).replace('guest-', ''))) {
      id = crypto?.randomUUID?.() || UUID_NUL;
      setVal(CLAU_CONVIDAT, id);
    } else if (String(id).startsWith('guest-')) {
      id = String(id).replace('guest-', '');
      setVal(CLAU_CONVIDAT, id);
    }
    return id;
  } catch {
    return UUID_NUL;
  }
}

/**
 * Purga el `user` que va quedar a emmagatzematge local abans d'aquesta correcció.
 *
 * SIDE EFFECT DINS D'UNA LECTURA, I ÉS INTENCIONAT. Els testers que ja tenen
 * la Beta instal·lada porten el blob del GoTrue (amb el seu correu) a
 * emmagatzematge local. Si només canviàrem la capa de lectura, eixe blob es quedaria
 * allí per sempre, perquè només `logout()` el tocava i `logout()` ja no mira
 * emmagatzematge local. S'esborra la primera volta que algú òbriga l'app.
 */
function purgaLlegat() {
  if (typeof document !== 'undefined' && /(?:^|; )(?:socdepoble-|sdp:oauth:)/.test(document.cookie)) {
    for (const k of ['socdepoble-jwt','socdepoble-refresh-token','socdepoble-user', 'sdp:oauth:verificador','sdp:oauth:state','sdp:oauth:cb'])
      document.cookie = `${k}=; path=/; max-age=0; SameSite=Lax`;
  }
  if (typeof window === 'undefined') return;
  try {
    if (getVal(CLAU_USUARI, null)) {
      delVal(CLAU_USUARI);
      delVal(CLAU_JWT);
      delVal(CLAU_REFRESC);
    }
  } catch {
    /* Un navegador que no deixa escriure tampoc deixarà llegir res perillós. */
  }
}

/**
 * L'usuari de la sessió, o null.
 *
 * FAIL-CLOSED: sense jwt no hi ha usuari, encara que el blob hi siga. És el que
 * impedix la sessió fantasma. `getCurrentUser()` de supabaseBackend delega ací
 * perquè hi haja un sol lector i no es torne a obrir el cisma.
 */
export function usuariDeSessio() {
  purgaLlegat();
  const jwt = getEfimer(CLAU_JWT, null);
  if (!jwt) return null;
  /* Un token caducat és un token que no val. Sense açò, la interfície pinta
     l'usuari i cada escriptura mor amb 401: la sessió fantasma, versió 2. */
  const exp = caducitatJwt(jwt);
  if (exp !== null && exp <= Date.now()) return null;
  const usuari = getEfimer(CLAU_USUARI, null);
  return usuari && usuari.id ? usuari : null;
}

/** Guarda la sessió sencera d'una sola volta. Les tres peces o cap. */
export function desaSessio(sessio) {
  if (!sessio?.access_token) return false;
  setEfimer(CLAU_JWT, sessio.access_token);
  setEfimer(CLAU_REFRESC, sessio.refresh_token);
  setEfimer(CLAU_USUARI, sessio.user);
  return true;
}

/** Actualitza camps de l'usuari a la sessió efímera i avisa la UI via sdp:auth-change. */
export function actualitzaUsuariSessio(novesDades = {}) {
  const usuari = getEfimer(CLAU_USUARI, null);
  if (!usuari) return null;

  const actualitzat = {
    ...usuari,
    ...novesDades,
    user_metadata: {
      ...(usuari.user_metadata || {}),
      ...(novesDades.user_metadata || {}),
      ...(novesDades.avatar_url ? { avatar_url: novesDades.avatar_url } : {}),
      ...(novesDades.full_name ? { full_name: novesDades.full_name, name: novesDades.full_name } : {}),
      ...(novesDades.town_name ? { town_name: novesDades.town_name } : {})
    },
    ...(novesDades.avatar_url ? { avatar_url: novesDades.avatar_url } : {})
  };

  setEfimer(CLAU_USUARI, actualitzat);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: actualitzat } }));
  }

  return actualitzat;
}

/** Esborra la sessió sencera. Les dues capes: la nova i el llegat. */
export function esborraSessio() {
  delEfimer(CLAU_JWT);
  delEfimer(CLAU_REFRESC);
  delEfimer(CLAU_USUARI);
  /* El llegat també, perquè qui tanque sessió no s'emporte el fantasma. */
  delVal(CLAU_JWT);
  delVal(CLAU_REFRESC);
  delVal(CLAU_USUARI);
}

/** Torna { id, autenticat, usuari }. Mai llança. */
export function identitat() {
  const usuari = usuariDeSessio();
  if (usuari) return { id: String(usuari.id), autenticat: true, usuari };
  return { id: idConvidat(), autenticat: false, usuari: null };
}

export const getDefaultUserId = () => identitat().id;

/** Oblida el convidat quan ja no fa falta (part del protocol d'Apoptosi). */
export function oblidaConvidat() {
  delVal(CLAU_CONVIDAT);
}

export async function reclamaContingutDelConvidat() {
  // Mode Online-First: la persistència recau completament en el backend.
  return { migrat: 0 };
}

/** Marge abans de la caducitat real. 60 s cobrix la deriva de rellotge del client. */
export const MARGE_RENOVACIO_MS = 60_000;

/**
 * `exp` del JWT en ms, o null.
 *
 * NO VERIFICA LA SIGNATURA I NO HO HA DE FER. Un client no pot validar res:
 * no té la clau. Açò només servix per a saber QUAN demanar la renovació i no
 * esperar el 401. Qui decidix si el token val és Sollutia, sempre.
 * Un `exp` mentit per l'usuari només el perjudica a ell: renovarà abans.
 */
export function caducitatJwt(jwt = getEfimer(CLAU_JWT, null)) {
  if (!jwt || typeof jwt !== 'string') return null;
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const carrega = JSON.parse(decodeURIComponent(
      atob(b64 + '='.repeat((4 - b64.length % 4) % 4))
        .split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join('')
    ));
    return typeof carrega.exp === 'number' ? carrega.exp * 1000 : null;
  } catch {
    return null;   // token opac o corromput: que decidisca el servidor
  }
}

/** true si el token ja no val. Sense token → true. */
export function sessioCaducada() {
  const exp = caducitatJwt();
  return exp === null ? !getEfimer(CLAU_JWT, null) : exp <= Date.now();
}

/**
 * Accepta una sessió emesa per l'amfitrió (Sollutia).
 *
 * FAIL-CLOSED. Es rebutja i es torna `false` si:
 *   · no hi ha access_token, o no té forma de JWT
 *   · ja està caducat
 *   · `sub` no és un uuid
 *   · l'emissor no és el que esperem (si se'n declara un)
 *
 * El que NO comprova: la signatura. Ací no es pot. Si Sollutia envia un token
 * fals, la primera crida a PostgREST tornarà 401 i el `logout()` del reintent
 * el traurà. Esta funció evita pintar una sessió òbviament morta, no suplix
 * la verificació del servidor.
 */
export function adoptaSessioExterna(sessio, { emissorEsperat = null } = {}) {
  if (!sessio || typeof sessio !== 'object') return false;
  const { access_token: jwt, refresh_token: refresc, user } = sessio;
  if (typeof jwt !== 'string' || jwt.split('.').length !== 3) return false;

  const exp = caducitatJwt(jwt);
  if (exp !== null && exp <= Date.now()) return false;

  let carrega = null;
  try {
    const b64 = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    carrega = JSON.parse(atob(b64 + '='.repeat((4 - b64.length % 4) % 4)));
  } catch { return false; }

  if (!carrega?.sub || !RE_UUID.test(String(carrega.sub))) return false;
  if (emissorEsperat && carrega.iss !== emissorEsperat) return false;

  /* L'usuari que val és el del token, no el que ens passen al costat.
     Si l'amfitrió envia `user` amb una altra id, mana el `sub`. */
  const usuariFinal = (user && user.id === carrega.sub)
    ? user
    : { id: carrega.sub, email: carrega.email ?? null, user_metadata: user?.user_metadata ?? {} };

  const desada = desaSessio({ access_token: jwt, refresh_token: refresc ?? null, user: usuariFinal });
  if (!desada) return false;

  oblidaConvidat();   // ja no és convidat: el protocol d'Apoptosi tanca ací
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user: usuariFinal } }));
  }
  return true;
}
```
<<<FI_FITXER>>>

## Fitxer: src/data/mapejadorSeccions.js

```
import { sanitizeHtml, netejaText } from '../utils/sanitize.js';

function generateUUID() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const normalizeText = (value) =>
  String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim();

const firstAsset = (value) => (Array.isArray(value) ? value[0] || null : value || null);
const buildSearchText = (parts) => normalizeText(parts.filter(Boolean).join(' '));

function validaUrl(url) {
  if (!url) return null;
  const s = String(url).trim();
  if (s.startsWith('data:image/')) return s;
  if (s.startsWith('//')) return null; // Bloquejar protocol-relative (Z audit)
  if (s.startsWith('/') || s.startsWith('./')) return s;
  try {
    const p = new URL(s);
    return (p.protocol === 'http:' || p.protocol === 'https:') ? p.href : null;
  } catch {
    return null;
  }
}

export function mapSectionSubmissionToItem(submission) {
  const payload = submission?.payload && typeof submission.payload === 'object' ? submission.payload : {};
  const sectionId = netejaText(submission?.sectionId || payload.sectionId || '');
  const createdAt = netejaText(submission?.createdAt || payload.created_at || new Date().toISOString());

  const baseItem = {
    ...payload,
    id: netejaText(payload.id || submission.id || generateUUID()),
    sectionId,
    created_at: payload.created_at || createdAt
  };

  if (sectionId === 'mur') {
    return {
      ...baseItem,
      type: netejaText(baseItem.type || 'post'),
      title: netejaText(baseItem.title || 'Publicació'),
      summary: netejaText(baseItem.summary || baseItem.post_subtitle || baseItem.description || ''),
      content: sanitizeHtml(baseItem.content || baseItem.description || baseItem.post_subtitle || ''),
      post_subtitle: netejaText(baseItem.post_subtitle || baseItem.description || ''),
      author: netejaText(baseItem.author || baseItem.author_name || 'Foraster'),
      author_name: netejaText(baseItem.author_name || baseItem.author || 'Foraster'),
      author_avatar: validaUrl(baseItem.author_avatar || baseItem.avatar_url),
      town_name: netejaText(baseItem.town_name || 'La Torre de les Maçanes'),
      imageSrc: validaUrl(baseItem.imageSrc || firstAsset(baseItem.image_url || baseItem.image || baseItem.avatar_url)),
      image_url: validaUrl(baseItem.image_url || baseItem.image || baseItem.imageSrc),
      searchText: netejaText(baseItem.searchText || buildSearchText([
        baseItem.title, baseItem.post_subtitle, baseItem.description, baseItem.content,
        baseItem.author, baseItem.town_name, baseItem.tag, baseItem.sectionId
      ]))
    };
  }

  if (sectionId === 'mercat') {
    const imageSrc = validaUrl(baseItem.imageSrc || firstAsset(baseItem.image_url || baseItem.image || baseItem.avatar_url));
    return {
      ...baseItem,
      type: netejaText(baseItem.type || 'product'),
      title: netejaText(baseItem.title || 'Producte'),
      description: sanitizeHtml(baseItem.description || baseItem.summary || ''),
      summary: netejaText(baseItem.summary || baseItem.description || ''),
      seller: netejaText(baseItem.seller || baseItem.author_name || 'Foraster'),
      avatar_url: validaUrl(baseItem.avatar_url),
      imageSrc,
      image_url: validaUrl(baseItem.image_url || baseItem.image || imageSrc),
      image: validaUrl(baseItem.image || imageSrc),
      category_slug: netejaText(baseItem.category_slug || 'connectat'),
      tag: netejaText(baseItem.tag || 'Connectat'),
      variations: Array.isArray(baseItem.variations) ? baseItem.variations.map(netejaText) : [],
      searchText: netejaText(baseItem.searchText || buildSearchText([
        baseItem.title, baseItem.description, baseItem.seller, baseItem.tag, baseItem.sectionId
      ]))
    };
  }

  if (sectionId === 'events') {
    return {
      ...baseItem,
      type: netejaText(baseItem.type || 'event'),
      title: netejaText(baseItem.title || 'Esdeveniment'),
      description: sanitizeHtml(baseItem.description || baseItem.summary || ''),
      summary: netejaText(baseItem.summary || baseItem.description || ''),
      author_name: netejaText(baseItem.author_name || baseItem.author || 'Foraster'),
      date: netejaText(baseItem.date || createdAt.slice(0, 10)),
      image_url: validaUrl(baseItem.image_url),
      searchText: netejaText(baseItem.searchText || buildSearchText([
        baseItem.title, baseItem.description, baseItem.author_name, baseItem.type
      ]))
    };
  }

  if (sectionId === 'multimedia') {
    const imageSrc = validaUrl(baseItem.imageSrc || firstAsset(baseItem.image_url || baseItem.image || baseItem.avatar_url));
    return {
      ...baseItem,
      type: netejaText(baseItem.type || 'media'),
      title: netejaText(baseItem.title || 'Arxiu Multimèdia'),
      description: sanitizeHtml(baseItem.description || baseItem.summary || ''),
      tag: netejaText(baseItem.tag || 'Multimèdia'),
      source: netejaText(baseItem.source || baseItem.author_name || 'Usuari'),
      src: validaUrl(baseItem.src || imageSrc),
      created_at: netejaText(baseItem.created_at || createdAt),
      searchText: netejaText(baseItem.searchText || buildSearchText([
        baseItem.title, baseItem.description, baseItem.tag, baseItem.source
      ]))
    };
  }

  if (sectionId === 'notes') {
    return {
      ...baseItem,
      type: netejaText(baseItem.type || 'note'),
      title: netejaText(baseItem.title || 'Nota Nova'),
      content: sanitizeHtml(baseItem.content || baseItem.description || baseItem.summary || ''),
      plainText: netejaText(baseItem.plainText || baseItem.description || baseItem.summary || ''),
      category: netejaText(baseItem.category || 'General'),
      tags: Array.isArray(baseItem.tags) ? baseItem.tags.map(netejaText) : [],
      folderId: netejaText(baseItem.folderId || 'f-root'),
      updatedAt: netejaText(baseItem.updatedAt || baseItem.created_at || createdAt),
      searchText: netejaText(baseItem.searchText || buildSearchText([
        baseItem.title, baseItem.content, baseItem.category
      ]))
    };
  }

  return baseItem;
}

export function mergeById(primary = [], secondary = []) {
  const map = new Map();
  // El més vell primer, el més nou (per updated_at o created_at) esclafa.
  [...primary, ...secondary].forEach((item) => {
    if (!item) return;
    const existing = map.get(String(item.id));
    if (existing) {
      const t1 = new Date(existing.updated_at || existing.updatedAt || existing.created_at || 0).getTime();
      const t2 = new Date(item.updated_at || item.updatedAt || item.created_at || 0).getTime();
      if (t2 >= t1) map.set(String(item.id), item);
    } else {
      map.set(String(item.id), item);
    }
  });
  return Array.from(map.values());
}
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

## Fitxer: src/data/supabase/auth.js

```
import { getEfimer } from '../../config/storage.js';
import { CLAU_REFRESC, desaSessio, esborraSessio, usuariDeSessio, actualitzaUsuariSessio } from '../identitat.js';
import { entraAmbGoogle, gestionaTornada } from '../oauthRelay.js';
import { configuraRefrescSessio, getCurrentUser, getResolvedConfig, request, rpc } from './runtime.js';
import { tancaRealtime } from './realtime.js';
import { resetClient } from './config.js';

let renovacioEnCurs = null;
const emetCanvi = (user) => globalThis.window?.dispatchEvent(new CustomEvent('sdp:auth-change', { detail: { user } }));

async function renova(config = {}) {
  const refreshToken = getEfimer(CLAU_REFRESC);
  if (!refreshToken) return false;
  const { supabaseUrl, supabaseAnonKey } = getResolvedConfig(config);
  if (!supabaseUrl) return false;
  let response;
  try {
    response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST', headers: { apikey: supabaseAnonKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });
  } catch (error) {
    console.warn('Error de xarxa renovant sessió', error);
    return false;
  }
  if (response.ok) {
    const result = await response.json();
    if (result?.access_token) {
      desaSessio(result); resetClient(); emetCanvi(result.user); return true;
    }
  }
  if ([400, 401].includes(response.status)) await logout();
  return false;
}

export function refreshSession(config = {}) {
  if (renovacioEnCurs) return renovacioEnCurs;
  renovacioEnCurs = renova(config).finally(() => { renovacioEnCurs = null; });
  return renovacioEnCurs;
}
export const refrescaSessio = refreshSession;
configuraRefrescSessio(refreshSession);

export async function asseguraUsuari(config = {}) {
  return getCurrentUser() || (await refreshSession(config).catch(() => false) ? getCurrentUser() : null);
}

export async function elMeuRol(config = {}) {
  const user = usuariDeSessio();
  if (!user?.id) return null;
  try {
    const rows = await request(`/rest/v1/user_platform_roles?select=role&user_id=eq.${encodeURIComponent(user.id)}&limit=1`, config);
    return rows?.[0]?.role || 'usuari';
  } catch { return 'usuari'; }
}

export async function getProfile(config = {}) {
  const user = getCurrentUser();
  if (!user) return null;
  try {
    const rows = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, config);
    if (rows?.[0]) return rows[0];
  } catch (error) { console.warn('[supabase] Avís consultant profiles:', error?.message); }
  return { id: user.id, full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    avatar_url: user.user_metadata?.avatar_url || user.avatar_url || '',
    visibility: user.user_metadata?.visibility || 'private',
    town_name: user.user_metadata?.town_name || 'La Torre de les Maçanes' };
}

export async function updateProfile(updates, config = {}) {
  const user = await asseguraUsuari(config);
  if (!user) throw new Error('La sessió ha caducat. Torna a entrar.');
  const urls = [updates?.avatar_url, updates?.logo_url];
  if (getResolvedConfig(config).runtimeDataMode !== 'seed'
    && urls.some((url) => typeof url === 'string' && url.startsWith('data:'))) {
    throw new Error('Les imatges no es desen incrustades. Puja-les amb uploadToStorage.');
  }

  // Filtrar camps segurs per a RLS (evita l'error 42501 amb camps com logo_url)
  const allowedFields = ['full_name', 'avatar_url', 'visibility', 'town_name', 'bio', 'is_public'];
  const safeUpdates = {};
  for (const k of allowedFields) {
    if (updates[k] !== undefined) safeUpdates[k] = updates[k];
  }

  const authUser = await request('/auth/v1/user', config, { method: 'PUT', body: { data: safeUpdates } });
  const rows = await request(`/rest/v1/profiles?id=eq.${encodeURIComponent(user.id)}`, config,
    { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: safeUpdates });
  actualitzaUsuariSessio({ ...safeUpdates, ...(authUser || {}) });
  return rows?.[0] || { id: user.id, ...user.user_metadata, ...safeUpdates };
}

export async function updateUserPassword(password, config = {}) {
  const result = await request('/auth/v1/user', config, { method: 'PUT', body: { password } });
  if (!result || result.error) throw new Error(result?.error_description || 'Error en canviar contrasenya.');
  return true;
}

export async function registerWithPassword(email, password, metadata = {}, config = {}) {
  const result = await request('/auth/v1/signup', config, {
    method: 'POST', body: { email: String(email || '').trim().toLowerCase(), password, data: metadata }
  });
  
  if (result.session) { 
    desaSessio(result.session);
    resetClient();
    emetCanvi(result.user); 
  }
  return result;
}

export const registraConsentiment = (tipus, versio, config = {}) =>
  rpc('registra_consentiment', { p_tipus: tipus, p_versio: versio }, config);

export async function loginWithPassword(email, password, config = {}) {
  const result = await request('/auth/v1/token?grant_type=password', config, {
    method: 'POST', body: { email: String(email || '').trim().toLowerCase(), password }
  });
  if (result.access_token) { 
    desaSessio(result);
    resetClient();
    emetCanvi(result.user); 
  }
  return result;
}

export function loginWithMagicLink(email, config = {}) {
  if (!getResolvedConfig(config).hasSupabaseConfig) throw new Error('No hi ha connexió configurada amb el servidor Supabase.');
  
  let redirectUrl = '';
  if (typeof window !== 'undefined') {
    const relayOriginUrl = config?.oauthRelayUrl || (import.meta.env.DEV ? window.location.origin + '/auth/callback.html' : 'https://auth.socdepoble.org/callback');
    redirectUrl = `${relayOriginUrl}?sdp_origin=${encodeURIComponent(window.location.origin)}&sdp_path=${encodeURIComponent(window.location.pathname)}`;
  }
  
  return request(`/auth/v1/magiclink${redirectUrl ? `?redirect_to=${encodeURIComponent(redirectUrl)}` : ''}`, config, {
    method: 'POST', body: { email: String(email || '').trim().toLowerCase(), gotrue_meta_security: { captcha_token: null } }
  });
}

export const loginWithGoogle = async (config = {}) => {
  const result = await entraAmbGoogle(config, getResolvedConfig);
  return result;
};
export const recullTornadaOAuth = async (config = {}) => {
  const result = await gestionaTornada(config, getResolvedConfig);
  return result;
};
export async function logout() { await tancaRealtime(); resetClient(); esborraSessio(); emetCanvi(null); }
```
<<<FI_FITXER>>>

## Fitxer: src/data/supabase/content.js

```
import { getDefaultUserId } from '../appSeed.js';
import { mapSectionSubmissionToItem, mergeById } from '../mapejadorSeccions.js';
import { APP_SEED_VERSION, buildSeedAppData, generateUUID, getCurrentUser, getResolvedConfig, mapContentRowsToData, request } from './runtime.js';
import { enviaMissatge } from './xat.js';

const SECCIONS = new Set(['mur', 'mercat', 'events', 'multimedia', 'notes']);
export async function loadAppData(ownerUserId = getDefaultUserId(), config = {}) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (runtimeDataMode === 'seed') return buildSeedAppData(ownerUserId);
  if (!hasSupabaseConfig) throw new Error('Falten credencials de Supabase per carregar la AppData.');
  if (!tenantId) throw new Error('Poble no configurat: falta tenantId (VITE_TENANT_ID).');
  /* Les notes són privades: només amb sessió i sempre amb l'uuid de la sessió.
     `ownerUserId` pot ser un slug (/e/:slug) i PostgREST el rebutja amb 400. */
  const sessio = getCurrentUser();
  const opcional = (promesa, que) => promesa.catch((error) => {
    console.warn(`[supabase] ${que} no disponible:`, error?.message);
    return [];
  });
  const [contentRows, submissions, noteRows] = await Promise.all([
    request(`/rest/v1/app_content?select=key,payload,version&tenant_id=eq.${encodeURIComponent(tenantId)}`, config, { signal: config.signal }),
    opcional(request(`/rest/v1/section_submissions?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=50`, config, { signal: config.signal }), 'section_submissions'),
    sessio?.id
      ? opcional(request(`/rest/v1/notes?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&owner_user_id=eq.${encodeURIComponent(sessio.id)}&order=updated_at.desc&limit=50`, config, { signal: config.signal }), 'notes')
      : Promise.resolve([])]);
  if (!contentRows?.length) throw new Error('La BD remota està buida. Executa les migracions i la llavor.');
  const base = mapContentRowsToData(contentRows); const subs = Array.isArray(submissions) ? submissions : [];
  const notes = (noteRows || []).map((n) => ({ id: n.id, folderId: n.folder_id, title: n.title, subtitle: n.subtitle,
    lead: n.lead, content: n.content, categories: n.categories, tags: n.tags, heroImage: n.hero_image,
    logoImage: n.logo_image, isPublished: n.is_published, publishedSubmissionId: n.published_submission_id,
    revision: n.revision, createdAt: n.created_at, updatedAt: n.updated_at }));
  const combina = (clau, seccio) => mergeById(base[clau] || [], subs.filter((s) => s.section_id === seccio).map((s) => s.payload));
  return { ...base, ownerUserId, feedPosts: combina('feedPosts', 'mur'), marketItems: combina('marketItems', 'mercat'),
    events: combina('events', 'events'), mediaItems: combina('mediaItems', 'multimedia'),
    notes: mergeById(mergeById(base.notes || [], notes), subs.filter((s) => s.section_id === 'notes').map((s) => s.payload)),
    chatMessages: [], sectionSubmissions: submissions, seedVersion: APP_SEED_VERSION };
}
export async function appendChatMessages(messages, config = {}) {
  const result = [];
  for (const message of Array.isArray(messages) ? messages : []) {
    result.push(await enviaMissatge(message.threadId ?? message.filId, message.text, config));
  }
  return result;
}
export async function appendSectionSubmissionNetworkOnly(submission, config = {}) {
  const { hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('No es pot escriure publicació sense connexió al servidor.');
  const ownerUserId = submission?.ownerUserId || getDefaultUserId();
  const sectionId = String(submission?.sectionId || '').trim(); if (!SECCIONS.has(sectionId)) throw new Error('Secció no suportada per a connectar.');
  const id = String(submission?.id || generateUUID()); const createdAt = submission?.createdAt || new Date().toISOString();
  const basePayload = submission?.payload && typeof submission.payload === 'object' ? submission.payload : {};
  const payload = mapSectionSubmissionToItem({ ...submission, id, ownerUserId, sectionId, createdAt,
    payload: { ...basePayload, id, ownerUserId, sectionId, created_at: basePayload.created_at || createdAt } });
  const stored = { id, ownerUserId, sectionId, title: submission?.title || payload.title || '',
    description: submission?.description || payload.description || payload.summary || '', createdAt, payload };
  await request('/rest/v1/section_submissions?on_conflict=id', config, { method: 'POST',
    headers: { Prefer: 'return=representation,resolution=merge-duplicates' }, body: [{ id, tenant_id: tenantId,
      owner_user_id: ownerUserId, section_id: sectionId, title: stored.title, description: stored.description, payload, created_at: createdAt }] });
  return stored;
}
export async function loadCoreContent(ownerUserId = getDefaultUserId(), config = {}) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config); const seed = await buildSeedAppData(ownerUserId);
  if (runtimeDataMode === 'seed') return { towns: seed.towns, pages: seed.pages, pageCopy: {}, agents: seed.agents, ownerUserId };
  if (!hasSupabaseConfig) throw new Error('Falten credencials de Supabase per carregar el contingut Core.');
  if (!tenantId) throw new Error('Poble no configurat: falta tenantId (VITE_TENANT_ID).');
  const rows = await request(`/rest/v1/app_content?select=key,payload,version&key=in.(towns,agents)&tenant_id=eq.${encodeURIComponent(tenantId)}`, config, { signal: config.signal });
  const base = mapContentRowsToData(rows || []); return { towns: base.towns, pages: seed.pages, pageCopy: {}, agents: base.agents, ownerUserId };
}
export async function loadMur(ownerUserId = getDefaultUserId(), config = {}) {
  const data = await loadAppData(ownerUserId, config); return { feedPosts: data.feedPosts, events: data.events, marketItems: data.marketItems };
}
export async function loadMultimedia(ownerUserId = getDefaultUserId(), config = {}) {
  const data = await loadAppData(ownerUserId, config); return { mediaItems: data.mediaItems };
}
```
<<<FI_FITXER>>>

## Fitxer: src/data/supabase/notes.js

```
import { getDefaultUserId } from '../appSeed.js';
import { mergeById } from '../mapejadorSeccions.js';
import { ErrorSupabase, buildSeedAppData, generateUUID, getCurrentUser, getResolvedConfig, mapContentRowsToData, request } from './runtime.js';

const nota = (row) => ({ id: row.id, folderId: row.folder_id, title: row.title, subtitle: row.subtitle,
  lead: row.lead, content: row.content, categories: row.categories, tags: row.tags,
  heroImage: row.hero_image, logoImage: row.logo_image, isPublished: row.is_published,
  publishedSubmissionId: row.published_submission_id, revision: row.revision,
  createdAt: row.created_at, updatedAt: row.updated_at });

export async function loadNotes(ownerUserId = getDefaultUserId(), config = {}) {
  const { runtimeDataMode, hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (runtimeDataMode === 'seed') {
    const seed = await buildSeedAppData(ownerUserId);
    return { notes: seed.notes, noteFolders: seed.noteFolders };
  }
  if (!hasSupabaseConfig) throw new Error('Falten credencials de Supabase per carregar les Notes.');
  const safeOwnerId = ownerUserId || getDefaultUserId();
  const [contentRows, submissions, rows] = await Promise.all([
    request(`/rest/v1/app_content?select=key,payload,version&key=in.(notes,noteFolders)&tenant_id=eq.${encodeURIComponent(tenantId)}`, config, { signal: config.signal }),
    request(`/rest/v1/section_submissions?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&order=created_at.desc&limit=50`, config, { signal: config.signal }),
    request(`/rest/v1/notes?select=*&tenant_id=eq.${encodeURIComponent(tenantId)}&owner_user_id=eq.${encodeURIComponent(safeOwnerId)}&order=updated_at.desc&limit=50`, config, { signal: config.signal })
  ]);
  const base = mapContentRowsToData(contentRows || []);
  const merged = mergeById(base.notes || [], Array.isArray(rows) ? rows.map(nota) : []);
  return {
    notes: mergeById(merged, (submissions || []).filter((s) => s.section_id === 'notes').map((s) => s.payload)),
    noteFolders: base.noteFolders || []
  };
}

export async function createNote(input, config = {}) {
  const { tenantId, hasSupabaseConfig } = getResolvedConfig(config);
  const user = getCurrentUser();
  if (!hasSupabaseConfig) throw new Error('No es pot crear la nota sense connexió.');
  if (!user) throw new Error('Cal iniciar sessió per crear una nota.');
  const rows = await request('/rest/v1/notes', config, {
    method: 'POST', headers: { Prefer: 'return=representation' },
    body: { id: input.id || generateUUID(), tenant_id: tenantId, owner_user_id: user.id,
      folder_id: input.folderId || 'f-notes', title: input.title || '', content: input.content || '' }
  });
  if (!rows?.[0]) throw new ErrorSupabase('Error al crear la nota.', 500);
  return nota(rows[0]);
}

export async function updateNote(id, updates, expectedRevision, config = {}) {
  const { hasSupabaseConfig, tenantId } = getResolvedConfig(config);
  if (!hasSupabaseConfig) throw new Error('ATURADOR CRÍTIC: No es pot actualitzar una nota sense connexió al servidor.');
  if (expectedRevision === undefined || expectedRevision === null) throw new Error('ATURADOR CRÍTIC: expectedRevision és obligatori.');
  const payload = { folder_id: updates.folderId, title: updates.title, subtitle: updates.subtitle,
    lead: updates.lead, content: updates.content, categories: updates.categories, tags: updates.tags,
    hero_image: updates.heroImage, logo_image: updates.logoImage, is_published: updates.isPublished,
    published_submission_id: updates.publishedSubmissionId };
  for (const key of Object.keys(payload)) if (payload[key] === undefined) delete payload[key];
  const revision = expectedRevision ? `&revision=eq.${expectedRevision}` : '';
  const rows = await request(`/rest/v1/notes?id=eq.${encodeURIComponent(id)}&tenant_id=eq.${encodeURIComponent(tenantId)}${revision}`, config,
    { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: payload });
  if (!rows?.[0]) throw new ErrorSupabase("No s'ha pogut actualitzar la nota. Conflicte de concurrència o nota no trobada.", 409);
  return nota(rows[0]);
}
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
        console.warn(`[host] Injecció parcial detectada. Mètodes coberts: ${injectats.join(', ')}. Falten: ${pendentsNucli.join(', ')}. S'usaran fallbacks a Supabase per als mètodes no coberts pel host.`);
        const supabaseImpl = await import('./data/supabase/index.js');
        const hibrid = { ...supabaseImpl };
        const base = getBackendImplementation();
        for (const k of injectats) hibrid[k] = base[k];
        setBackendImplementation(hibrid);
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

## Fitxer: src/PedraSecaEmbed.jsx

```
/**
 * PedraSecaEmbed.jsx — <soc-de-poble>
 * ---------------------------------------------------------------------------
 * Correccions respecte de la versió auditada:
 *
 *  P0-1 MORT PER MOVIMENT DE DOM. `connectedCallback` es protegia amb
 *       `if (!this._closedRoot)`. shadow root SOBREVIU a un moviment de node, així que en tornar a
 *       connectar la guarda impedia tornar a muntar: el component quedava mort
 *       per sempre. Si el host (entorn de l'usuari) mou nodes constantment.
 *       Ara la guarda és sobre l'arrel de React i el shadow root es reaprofita.
 *
 *  P0-2 CURSA DEL setTimeout. El desmuntatge diferit s'executava encara que el
 *       node es reconnectara dins del mateix tick, matant l'arrel nova. Ara es
 *       cancel·la a `connectedCallback`.
 *
 *       declarat dins d'un shadow root NO es registra: només compta l'arbre del
 *       document. A més, les URL relatives de `noto-sans.css` es resoldrien
 *       malament. Les fonts es carreguen
 *       ara al document, una sola vegada, via `fonts-href`.
 *
 *  P0-4 CSS DUPLICAT PER INSTÀNCIA. Cada instància injectava una còpia sencera
 *       del full (~150 kB). Ara es comparteix un únic `CSSStyleSheet` mitjançant
 *       `adoptedStyleSheets`.
 *
 *  P0-5 CONFIG MUTADA EN LLOC. `this.config` es mutava conservant la identitat
 *       de l'objecte, així que qualsevol `useMemo`/comparació per referència
 *       aigües avall veia el valor vell. Ara cada canvi crea un objecte nou.
 *       Llevar un atribut tampoc no netejava mai el valor: ara sí.
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, MemoryRouter } from './app/contexts/RouterContext';
import App from './app/App';
import { SessionProvider } from './app/contexts/SessionContext';
import { UIProvider } from './app/contexts/UIContext';
import { IdentitatProvider } from './app/contexts/IdentitatContext';
import { destroyToastSystem } from './components/universal/AvisadorEfimer.jsx';
import styles from './css/index.css?inline';
import { readThemePreference, resolveTheme } from './config/theme';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

/* ───────────────────────────── Error boundary ──────────────────────────── */
export default function PedraSecaEmbed({ config, themeMode, language }) {
  const RouterComponent = config.routerType === 'memory' ? MemoryRouter : BrowserRouter;
  const routerProps = config.basename ? { basename: config.basename } : {};

  const uiConfig = React.useMemo(() => {
    return {
      ...config,
      ...(themeMode ? { themeMode } : {}),
      ...(language ? { language } : {})
    };
  }, [config, themeMode, language]);

  return (
    <ErrorBoundary>
      <RouterComponent {...routerProps}>
        <UIProvider externalConfig={uiConfig}>
          <SessionProvider>
            <IdentitatProvider>
              <App config={config} />
            </IdentitatProvider>
          </SessionProvider>
        </UIProvider>
      </RouterComponent>
    </ErrorBoundary>
  );
}

/* ──────────────────── Full d'estils compartit (P0-4) ───────────────────── */

let fullCompartit = null;

function obtenirFull() {
  if (fullCompartit) return fullCompartit;
  if (typeof CSSStyleSheet === 'undefined') return null;
  try {
    const full = new CSSStyleSheet();
    full.replaceSync(styles);
    fullCompartit = [full];
    return fullCompartit;
  } catch {
    return null; /* navegador sense adoptedStyleSheets → recurs de <style> */
  }
}

/* ─────────────────────── Fonts al document (P0-3) ──────────────────────── */

const fontRefCount = new Map();

function carregarFonts(href) {
  if (!href || typeof document === 'undefined') return;
  const key = encodeURIComponent(href);
  const current = fontRefCount.get(key) || 0;
  fontRefCount.set(key, current + 1);

  if (current === 0 && !document.querySelector(`link[data-sdp-fonts="${key}"]`)) {
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'style';
    preload.href = href;
    preload.setAttribute('data-sdp-fonts-preload', key);
    document.head.appendChild(preload);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.setAttribute('data-sdp-fonts', key);
    document.head.appendChild(link);
  }
}

function descarregarFonts(href) {
  if (!href || typeof document === 'undefined') return;
  const key = encodeURIComponent(href);
  const current = fontRefCount.get(key) || 0;
  fontRefCount.set(key, Math.max(0, current - 1));

  if (fontRefCount.get(key) === 0) {
    const link = document.querySelector(`link[data-sdp-fonts="${key}"]`);
    if (link) link.remove();
    const preload = document.querySelector(`link[data-sdp-fonts-preload="${key}"]`);
    if (preload) preload.remove();
  }
}

/* ───────────────────────────── Element custom ──────────────────────────── */

const BaseElement = typeof HTMLElement !== 'undefined' ? HTMLElement : class {};

export const activeElements = new Set();

/**
 * ADVERTIMENT DE SEGURETAT (SOLLUTIA):
 * Els atributs `supabase-url` i `supabase-anon-key` no haurien de ser configurables
 * per editors de contingut o rols no administradors de WordPress. Un atacant amb capacitat
 * d'alterar l'HTML de la pàgina podria canviar `supabase-url` cap a un servidor propi i
 * segrestar les credencials dels usuaris quan facen login. Aquests atributs s'han
 * d'injectar des del backend o mitjançant `window.SocDePoble.configura()`.
 */
const ATRIBUTS = Object.freeze({
  'base-path': 'basePath',
  'supabase-url': 'supabaseUrl',
  'supabase-anon-key': 'supabaseAnonKey',
  'data-mode': 'dataMode',
  'bot-api-url': 'botApiUrl',
  'fonts-href': 'fontsHref',
  'plugin-url': 'pluginUrl',
  'oauth-relay-url': 'oauthRelayUrl'
});

const CLAUS_PERMESES = Object.freeze(new Set([
  'basePath','supabaseUrl','supabaseAnonKey','dataMode','botApiUrl',
  'fontsHref','pluginUrl','routerType','basename','tenantId','language','themeMode',
  'manageDocumentHead', 'version', 'oauthRelayUrl'
]));

function sanejaConfig(cru) {
  const net = {};
  for (const clau of CLAUS_PERMESES) {
    if (clau in cru) net[clau] = cru[clau];
  }
  const CAMPOS_URL = Object.freeze(['supabaseUrl', 'botApiUrl', 'basePath', 'pluginUrl', 'fontsHref', 'oauthRelayUrl']);
  for (const field of CAMPOS_URL) {
    if (net[field]) {
      try {
        const cruUrl = net[field];
        if (cruUrl.startsWith('//')) { delete net[field]; continue; } // Z: bloqueig de protocol-relative
        const u = new URL(cruUrl, window.location.origin);
        if (u.protocol !== 'https:' && u.protocol !== 'http:' && !cruUrl.startsWith('/')) {
          delete net[field];
          continue;
        }
        if (field === 'oauthRelayUrl') {
          const origensPermesos = ['https://auth.socdepoble.org', 'http://localhost:5173', 'http://localhost:4173', 'http://localhost:8000', 'http://localhost:3340', 'https://socdepoble.sollutia.com', 'https://socdepoble.sollutia.cat'];
          if (!origensPermesos.some((o) => u.origin === new URL(o).origin)) {
            delete net[field];
          }
        }
      } catch { delete net[field]; }
    }
  }
  return Object.freeze(net);
}

class SocDePobleElement extends BaseElement {
  static get observedAttributes() {
    return [...Object.keys(ATRIBUTS), 'config', 'config-id', 'pinta-amfitrio'];
  }

  constructor() {
    super();
    let preConfig = {};
    if (Object.prototype.hasOwnProperty.call(this, 'config')) {
      preConfig = this.config;
      delete this.config;
    }
    this._config = {};
    this._configProp = preConfig && typeof preConfig === 'object' ? preConfig : {};
    this._root = null;
    this._punt = null;
    this._pendingUnmount = false;
    this._graceTimer = null;
    this._hasMountedReact = false;
    this._manualLanguage = null;
  }

  /** Propietat JS: permet passar objectes rics (Sollutia, React host, Vue…). */
  set config(valor) {
    this._configProp = valor && typeof valor === 'object' ? valor : {};
    this._recalcularConfig();
    this._render();
  }
  get config() {
    return this._config;
  }

  connectedCallback() {
    this._pendingUnmount = false;
    if (this._unmountListener) {
      document.removeEventListener('visibilitychange', this._unmountListener);
      this._unmountListener = null;
    }

    /*
     * P0-6 GERMÀ ASSASSINAT (260831, Seient Núm. 5).
     *
     * Ací hi havia dues branques. La segona neteja zombis —nodes que ja no són
     * al document i el `disconnectedCallback` dels quals no ha arribat a
     * desmuntar-los— i és correcta. La primera desmuntava germans amb
     * `old.isConnected` CERT: és a dir, instàncies vives i sanes.
     *
     * El comentari deia «Últim que arriba guanya», que era una política
     * d'instància única mai declarada enlloc. En un host complex no s'aguanta:
     * es pot posar dos blocs a la mateixa pàgina. Muntar el segon deixava
     * el primer en blanc, sense error a la consola.
     *
     * Ara només es netegen zombis. Dues instàncies vives conviuen.
     */
    const elementsActuals = Array.from(activeElements);
    for (const old of elementsActuals) {
      if (old === this) continue;
      if (old.isConnected) continue; // germà viu: no es toca
      if (typeof old._desmuntaAra === 'function') old._desmuntaAra();
    }

    activeElements.add(this);
    this._hasMountedReact = true;

    /* El shadow root sobreviu als moviments: es reaprofita, no es recrea. */
    if (!this._closedRoot) this._closedRoot = this.attachShadow({ mode: 'closed' });

    const arrel = this._closedRoot;
    const full = obtenirFull();
    if (full && 'adoptedStyleSheets' in arrel) {
      try {
        let currentSheets = Array.from(arrel.adoptedStyleSheets);
        full.forEach(sheet => {
          if (!currentSheets.includes(sheet)) currentSheets.push(sheet);
        });
        arrel.adoptedStyleSheets = currentSheets;
      } catch {
        // Fallback robust per a certs entorns amfitrions que trenquen adoptedStyleSheets
      }
    } 
    
    if (!full || !('adoptedStyleSheets' in arrel) || arrel.adoptedStyleSheets.length === 0) {
      if (!arrel.querySelector('style[data-sdp-fallback]')) {
        const style = document.createElement('style');
        style.setAttribute('data-sdp-fallback', '');
        style.textContent = styles;
        arrel.prepend(style);
      }
    }

    if (!this._punt || !this._punt.isConnected) {
      this._punt = document.createElement('div');
      this._punt.className = 'sdp-root';
      arrel.appendChild(this._punt);
    }

    this._recalcularConfig();
    this.dataset.theme = resolveTheme(this._config.themeMode ?? readThemePreference());
    this._escoltaTemaDelSistema();
    this._pintaAmfitrio();

    /* P0-1: la guarda va sobre l'arrel de React, no sobre el shadow root. */
    if (!this._root) {
      /* Auditoria 260830: ací hi havia freezeImplementation(). Segellar el
         backend dins del cicle de vida deixava una finestra d'injecció de zero
         mil·lisegons, perquè customElements.define() dispara connectedCallback
         síncronament quan l'etiqueta ja és al DOM.
         El segellat viu ara a src/host.js:arrenca(). Vegeu tractor-enxufe.mjs. */
      this._root = createRoot(this._punt);
    }
    this._render();
  }

  attributeChangedCallback(nom) {
    if (!this.isConnected) return;

    /* `pinta-amfitrio` no viu a ATRIBUTS (no és configuració de l'app, és
       un permís sobre el document). `_recalcularConfig()` tornaria fals i el
       canvi en calent no faria res, així que s'atén a banda. */
    if (nom === 'pinta-amfitrio') {
      if (this.hasAttribute('pinta-amfitrio')) this._pintaAmfitrio();
      else SocDePobleElement._despintaAmfitrio();
      return;
    }

    if (this._recalcularConfig()) {
      this._render();
    }
  }

  /** P0-5: objecte nou cada vegada; llevar un atribut esborra el valor. */
  _recalcularConfig() {
    const desDAtributs = {};
    for (const [attr, clau] of Object.entries(ATRIBUTS)) {
      const v = this.getAttribute(attr);
      if (v !== null) desDAtributs[clau] = v;
    }

    let desDeJson = {};
    const configId = this.getAttribute('config-id');
    if (configId) {
      try {
        const scriptEl = document.getElementById(configId);
        if (scriptEl && scriptEl.type === 'application/json') {
          const parsed = JSON.parse(scriptEl.textContent);
          if (parsed && typeof parsed === 'object') desDeJson = parsed;
        }
      } catch {
        console.warn('[soc-de-poble] L\'atribut "config-id" no s\'ha pogut llegir.');
      }
    }

    const cru = this.getAttribute('config');
    if (cru) {
      try {
        const parsed = JSON.parse(cru);
        if (parsed && typeof parsed === 'object') desDeJson = { ...desDeJson, ...parsed };
      } catch {
        console.warn('[soc-de-poble] L\'atribut "config" no és JSON vàlid; s\'ignora.');
      }
    }

    const configObject = { ...desDeJson, ...desDAtributs, ...this._configProp };
    if (!configObject.pluginUrl && this.getAttribute('plugin-url')) {
      configObject.pluginUrl = this.getAttribute('plugin-url');
    }
    
    if (!configObject.basename && configObject.basePath && configObject.basePath !== '/') {
      configObject.basename = configObject.basePath;
    }
    
    const rawConfig = sanejaConfig(configObject);
    
    let canviat = false;
    if (!this._config || Object.keys(rawConfig).length !== Object.keys(this._config).length) {
      canviat = true;
    } else {
      for (const key in rawConfig) {
        if (rawConfig[key] !== this._config[key]) {
          canviat = true;
          break;
        }
      }
    }

    if (canviat) {
      const oldFontsHref = this._config?.fontsHref;
      this._config = { ...rawConfig };
      if (oldFontsHref && oldFontsHref !== this._config.fontsHref) {
        descarregarFonts(oldFontsHref);
      }
      if (this._config.fontsHref) {
        carregarFonts(this._config.fontsHref);
      }
    }
    return canviat;
  }

  _render() {
    if (!this._root) return;
    this._root.render(
      <PedraSecaEmbed 
        config={this._config} 
        themeMode={this._manualTheme} 
        language={this._manualLanguage}
      />
    );
  }

  // API Pública per a Sollutia
  refreshData() {
    if (this._punt) {
      this._punt.dispatchEvent(new CustomEvent('sdp:refresh-data', { bubbles: true, composed: true }));
    }
  }
  
  getCurrentUser() {
    return import('./data/backendPort.js').then(m => m.getCurrentUser());
  }

  on(event, callback) {
    this.addEventListener(event, callback);
  }

  setTheme(theme) {
    this._manualTheme = theme;
    this.dataset.theme = resolveTheme(theme);
    this._pintaAmfitrio();
    this._render();
  }

  /* ══════════════════ P0-8 · MARC BRILLANT (260831) ══════════════════
   *
   * `blank.php` pinta `html, body` amb `background-color: var(--sdp-bg,…)`.
   * `--sdp-bg` viu ara als blocs de tema del sistema de disseny, dins del
   * shadow root. Però les propietats personalitzades hereten CAP AVALL: un
   * token declarat a `:host` mai arriba a `html`, que és son pare. Per tant
   * `blank.php` pintava sempre el fallback beix i, en mode fosc, l'app negra
   * quedava emmarcada en clar. De nit, per a gent gran, això enlluerna.
   *
   * L'única via que travessa la frontera cap amunt és JavaScript. Es llig el
   * valor JA CALCULAT pel tema actiu i es publica al document. Cap color viu
   * al PHP ni al JS: la font de veritat continua sent el CSS.
   *
   * És OPT-IN (`pinta-amfitrio`). Sense la guarda, incrustar el component com
   * un bloc més dins d'un article repintaria el fons del lloc sencer. Només
   * la plantilla de pàgina completa demana este comportament.
   */
  _pintaAmfitrio() {
    if (typeof document === 'undefined') return;
    if (!this.hasAttribute('pinta-amfitrio')) return;
    const punt = this._punt;
    if (!punt || !punt.isConnected) return;

    let valor = '';
    try {
      valor = getComputedStyle(punt).getPropertyValue('--sdp-fons-app').trim();
    } catch {
      return; // entorns sense layout (jsdom parcial): millor no tocar res
    }
    if (!valor) return;

    const arrel = document.documentElement;
    /* Es guarda el valor previ una sola vegada per a poder-lo restituir:
       la pàgina amfitriona pot tindre el seu i no és nostre. */
    if (SocDePobleElement._fonsPrevi === undefined) {
      SocDePobleElement._fonsPrevi = arrel.style.getPropertyValue('--sdp-bg');
    }
    arrel.style.setProperty('--sdp-bg', valor);
    arrel.dataset.sdpTheme = this.dataset.theme || '';
  }

  /** Deixa el document com estava. La crida l'última instància que se'n va. */
  static _despintaAmfitrio() {
    if (typeof document === 'undefined') return;
    const arrel = document.documentElement;
    const previ = SocDePobleElement._fonsPrevi;
    if (previ) arrel.style.setProperty('--sdp-bg', previ);
    else arrel.style.removeProperty('--sdp-bg');
    delete arrel.dataset.sdpTheme;
    SocDePobleElement._fonsPrevi = undefined;
  }

  /* El tema «system» llegia `prefers-color-scheme` una sola vegada i es
   * quedava congelat. Si l'usuària canvia el mode del telèfon amb la pàgina
   * oberta, el component ha de seguir-la. */
  _escoltaTemaDelSistema() {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    if (this._mqTema) return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const alCanviar = () => {
      const mode = this._config.themeMode ?? readThemePreference();
      if (mode !== 'system') return;
      this.dataset.theme = resolveTheme('system');
      this._pintaAmfitrio();
      this._render();
    };
    /* Safari < 14 no té addEventListener a MediaQueryList. */
    if (mq.addEventListener) mq.addEventListener('change', alCanviar);
    else if (mq.addListener) mq.addListener(alCanviar);
    this._mqTema = { mq, alCanviar };
  }

  _paraDEscoltarTema() {
    if (!this._mqTema) return;
    const { mq, alCanviar } = this._mqTema;
    if (mq.removeEventListener) mq.removeEventListener('change', alCanviar);
    else if (mq.removeListener) mq.removeListener(alCanviar);
    this._mqTema = null;
  }
  

  setLanguage(lang) {
    this._manualLanguage = lang;
    this._render();
  }

  _forcaDesmuntatge() {
    this._desmuntaAra();
  }
  
  _desmuntaAra() {
    this._pendingUnmount = false;
    
    if (this._config && this._config.fontsHref) {
      descarregarFonts(this._config.fontsHref);
    }
    
    if (this._unmountListener) {
      document.removeEventListener('visibilitychange', this._unmountListener);
      this._unmountListener = null;
    }
    
    try { this._root?.unmount(); } catch { /* WebKit legacy pot plorar */ }
    this._root = null;
    this._punt?.remove();
    this._punt = null;
    this._hasMountedReact = false;
    
    activeElements.delete(this);

    /*
     * P0-7 AVISOS APAGATS ALS GERMANS (260831, Seient Núm. 5).
     *
     * `destroyToastSystem()` és global: hi ha un sol `sharedRoot` per document.
     * Cridar-lo en desmuntar UNA instància apagava els avisos de totes les
     * altres que encara estaven vives. La usuària de l'altre bloc deixava de
     * rebre confirmacions i errors sense cap senyal.
     *
     * El sistema d'avisos és compartit, així que només es destruïx quan se'n va
     * l'última instància.
     */
    this._paraDEscoltarTema();

    if (activeElements.size === 0) {
      destroyToastSystem();
      SocDePobleElement._despintaAmfitrio();
    }
  }

  disconnectedCallback() {
    if (!this._root || this._pendingUnmount) return;
    
    this._pendingUnmount = true;
    queueMicrotask(() => {
      if (!this._pendingUnmount) return;
      this._pendingUnmount = false;
      if (this.isConnected) return;
      
      if (document.visibilityState === 'visible') {
        this._desmuntaAra();
      } else {
        const unmountOnVisible = () => {
          if (document.visibilityState === 'visible') {
            document.removeEventListener('visibilitychange', unmountOnVisible);
            this._unmountListener = null;
            if (!this.isConnected) this._desmuntaAra();
          }
        };
        // Netejar listener vell si n'hi ha abans d'assignar el nou
        if (this._unmountListener) {
          document.removeEventListener('visibilitychange', this._unmountListener);
        }
        this._unmountListener = unmountOnVisible;
        document.addEventListener('visibilitychange', unmountOnVisible);
      }
    });
  }
}

export function defineCustomElement() {
  if (typeof window === 'undefined') return;

  if (!window.__SDP_GLOBAL_ERRORS_BOUND__) {
    window.addEventListener('unhandledrejection', (event) => {
      const err = event.reason;
      const strErr = String(err);
      
      // Kimi: Només engolir si té a veure amb Sóc de Poble i no som en dev
      if (strErr.includes('sdp') || strErr.includes('soc-de-poble') || err?.stack?.includes('soc-de-poble')) {
        if (err?.name === 'QuotaExceededError' || strErr.includes('QuotaExceeded')) {
          console.warn('[PedraSeca] QuotaExceeded global capturat. Confiem en fallbacks.');
          event.preventDefault(); // Evitem que embrute la consola del host
        } else {
          // Si no som a Vite env (process env no existeix fàcilment ací a no ser que ho fiquem), ens callem l'error 
          console.warn('[PedraSeca] Promesa rebutjada globalment:', err);
        }
      }
    });
    window.__SDP_GLOBAL_ERRORS_BOUND__ = true;
  }

  if (!customElements.get('soc-de-poble')) {
    customElements.define('soc-de-poble', SocDePobleElement);
  }
}
```
<<<FI_FITXER>>>

## Fitxer: supabase/migrations/260908_0000_initial_schema.sql

```
create extension if not exists pgcrypto;
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

-- 1. TABLES
create table if not exists public.towns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.towns add column if not exists is_open boolean not null default true;


create table if not exists private.ajustos (
  clau text primary key,
  valor text not null
);
revoke all on table private.ajustos from public, anon, authenticated;

create table if not exists public.town_memberships (
  town_id uuid not null references public.towns(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (town_id, user_id)
);

create index if not exists idx_town_memberships_user_id
  on public.town_memberships(user_id);

create table if not exists public.app_content (
  tenant_id uuid not null references public.towns(id) on delete cascade,
  key text not null,
  payload jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (tenant_id, key)
);



create table if not exists public.section_submissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.towns(id) on delete cascade,
  owner_user_id uuid not null,
  section_id text not null,
  title text not null,
  description text,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_section_submissions_tenant_section_created
  on public.section_submissions(tenant_id, section_id, created_at desc);

create index if not exists idx_app_content_tenant on public.app_content(tenant_id, key);


create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  visibility text not null default 'private' check (visibility = 'private'),
  consentiment_rgpd_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles add column if not exists visibility text not null default 'private' check (visibility = 'private');
alter table public.profiles add column if not exists consentiment_rgpd_at timestamptz;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.towns(id) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 2 and 120),
  kind text not null check (kind in ('company', 'group', 'entity', 'city_hall')),
  parent_organization_id uuid,
  lema text not null default '' check (char_length(lema) <= 120),
  description text not null default '' check (char_length(description) <= 500),
  visibility text not null default 'public' check (visibility in ('public', 'members')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, slug),
  unique (tenant_id, id),
  foreign key (tenant_id, parent_organization_id)
    references public.organizations(tenant_id, id) on delete restrict,
  check (
    kind = 'group' or parent_organization_id is null
  )
);
alter table public.organizations add column if not exists parent_organization_id uuid references public.organizations(id) on delete restrict;
alter table public.organizations add column if not exists lema text not null default '' check (char_length(lema) <= 120);
alter table public.organizations add column if not exists visibility text not null default 'public' check (visibility in ('public', 'members'));
alter table public.organizations add column if not exists created_by uuid references public.profiles(id) on delete set null;

alter table public.section_submissions add column if not exists author_org_id uuid references public.organizations(id) on delete cascade;

create table if not exists public.organization_memberships (
  organization_id uuid not null,
  tenant_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id),
  foreign key (tenant_id, organization_id)
    references public.organizations(tenant_id, id) on delete cascade
);




create table if not exists public.user_platform_roles (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'usuari'
             check (role in ('usuari','moderador','superadmin')),
  granted_by uuid references auth.users(id),
  granted_at timestamptz not null default now()
);

create table if not exists public.organization_claims (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  tenant_id       uuid not null,
  user_id         uuid not null references auth.users(id) on delete cascade,
  estat           text not null default 'pendent'
                  check (estat in ('pendent','aprovada','rebutjada')),
  justificacio    text not null default '' check (char_length(justificacio) <= 1000),
  resolta_per     uuid references auth.users(id),
  resolta_at      timestamptz,
  created_at      timestamptz not null default now(),
  foreign key (tenant_id, organization_id)
    references public.organizations(tenant_id, id) on delete cascade
);
create unique index if not exists idx_claims_una_pendent
  on public.organization_claims(organization_id, user_id) where estat = 'pendent';


create index if not exists idx_organizations_tenant_kind
  on public.organizations(tenant_id, kind, created_at desc);

create index if not exists idx_organization_memberships_user
  on public.organization_memberships(user_id, tenant_id, organization_id);

create index if not exists idx_organizations_created_by
  on public.organizations(created_by);

create index if not exists idx_organizations_parent
  on public.organizations(parent_organization_id);

create index if not exists idx_section_submissions_author_org
  on public.section_submissions(author_org_id);

-- 2. FUNCTIONS
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

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
  
  return new;
end;
$$;

create or replace function private.comprova_una_propietaria() returns trigger
language plpgsql security definer set search_path = ''
as $$
declare v_org uuid; v_n int;
begin
  v_org := coalesce(new.organization_id, old.organization_id);
  if not exists (select 1 from public.organizations o where o.id = v_org) then
    return null;
  end if;
  select count(*) into v_n from public.organization_memberships m
   where m.organization_id = v_org and m.role = 'owner';
   
  if exists (select 1 from public.organizations o where o.id = v_org and o.kind in ('company', 'entity', 'city_hall')) then
    if v_n > 1 then
      raise exception 'SDP-LOCK: l''organització % ha de tindre 0 o 1 propietària (en té %).',
        v_org, v_n using errcode = '23514';
    end if;
  else
    if v_n <> 1 then
      raise exception 'SDP-LOCK: l''organització % ha de tindre exactament 1 propietària (en té %).',
        v_org, v_n using errcode = '23514';
    end if;
  end if;
  return null;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_tenant uuid;
  v_rgpd   boolean;
begin
  begin -- Bloc de seguretat afegit per evitar errors 500 (Qwen)
    begin
      v_tenant := nullif(new.raw_user_meta_data ->> 'tenant_id', '')::uuid;
    exception when invalid_text_representation then
      raise exception 'SDP-REG-002: tenant_id no és un UUID.' using errcode = '22023';
    end;

    if v_tenant is null then
      select valor::uuid into v_tenant
        from private.ajustos where clau = 'poble_per_defecte';
    end if;

    if v_tenant is null then
      raise exception 'SDP-REG-001: alta sense poble i sense poble per defecte.'
        using errcode = '23502';
    end if;

    if not exists (select 1 from public.towns t where t.id = v_tenant and t.is_open = true) then
      raise exception 'SDP-REG-003: el poble % no existix o no està obert.', v_tenant
        using errcode = '23503';
    end if;

    v_rgpd := coalesce((new.raw_user_meta_data ->> 'rgpd')::boolean, false);

    insert into public.profiles (id, full_name, consentiment_rgpd_at)
    values (
      new.id,
      coalesce(nullif(left(btrim(new.raw_user_meta_data ->> 'name'), 120), ''), 'Persona'),
      case when v_rgpd then now() else null end
    )
    on conflict (id) do update set full_name = excluded.full_name, consentiment_rgpd_at = coalesce(excluded.consentiment_rgpd_at, public.profiles.consentiment_rgpd_at);

    insert into public.town_memberships (town_id, user_id, role)
    values (v_tenant, new.id, 'member')
    on conflict (town_id, user_id) do nothing;
    
  exception when others then
    -- Re-llancem l'error perquè Supabase avorte l'alta i ho comunique al client
    raise;
  end;

  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;


create or replace function private.es_superadmin() returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.user_platform_roles r
    where r.user_id = (select auth.uid()) and r.role = 'superadmin'
  );
$$;
revoke execute on function private.es_superadmin() from public, anon;
grant execute on function private.es_superadmin() to authenticated;

create or replace function public.sollicita_reclamacio(
  p_organization_id uuid,
  p_justificacio    text default ''
)
returns public.organization_claims
language plpgsql security definer set search_path = ''
as $$
declare v_tenant uuid; v_fila public.organization_claims;
begin
  if (select auth.uid()) is null then
    raise exception 'SDP-CLAIM-000: cal sessió.' using errcode = '42501';
  end if;

  select o.tenant_id into v_tenant
    from public.organizations o where o.id = p_organization_id;
  if v_tenant is null then
    raise exception 'SDP-CLAIM-001: l''entitat no existix.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.town_memberships tm
    where tm.user_id = (select auth.uid()) and tm.town_id = v_tenant
  ) then
    raise exception 'SDP-CLAIM-002: no eres del poble d''esta entitat.' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.organization_memberships m
    where m.organization_id = p_organization_id and m.role = 'owner'
  ) then
    raise exception 'SDP-CLAIM-003: l''entitat ja té propietària.' using errcode = '23505';
  end if;

  insert into public.organization_claims (organization_id, tenant_id, user_id, justificacio)
  values (p_organization_id, v_tenant, (select auth.uid()),
          left(btrim(coalesce(p_justificacio, '')), 1000))
  returning * into v_fila;

  return v_fila;
end;
$$;
revoke execute on function public.sollicita_reclamacio(uuid, text) from public, anon;
grant execute on function public.sollicita_reclamacio(uuid, text) to authenticated;

create or replace function public.resol_reclamacio(p_claim uuid, p_aprova boolean)
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_claim public.organization_claims;
begin
  if not (select private.es_superadmin()) then
    raise exception 'SDP-CLAIM-010: cal rol de superadmin.' using errcode = '42501';
  end if;

  select * into v_claim from public.organization_claims
   where id = p_claim and estat = 'pendent' for update;
  if v_claim.id is null then
    raise exception 'SDP-CLAIM-011: reclamació inexistent o ja resolta.' using errcode = '22023';
  end if;

  if v_claim.user_id = (select auth.uid()) then
    raise exception 'SDP-CLAIM-012: no pots revisar la teua pròpia reclamació.' using errcode = '42501';
  end if;

  if p_aprova then
    insert into public.organization_memberships (organization_id, tenant_id, user_id, role)
    values (v_claim.organization_id, v_claim.tenant_id, v_claim.user_id, 'owner')
    on conflict (organization_id, user_id) do update set role = 'owner';
  end if;

  update public.organization_claims
     set estat = case when p_aprova then 'aprovada' else 'rebutjada' end,
         resolta_per = (select auth.uid()),
         resolta_at  = now()
   where id = p_claim;
end;
$$;
revoke execute on function public.resol_reclamacio(uuid, boolean) from public, anon;
grant execute on function public.resol_reclamacio(uuid, boolean) to authenticated;

create or replace function private.is_organization_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = p_organization_id
      and membership.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_manage_organization(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = p_organization_id
      and membership.user_id = (select auth.uid())
      and membership.role in ('owner', 'admin')
  );
$$;

create or replace function private.is_town_member(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and exists (
    select 1
    from public.town_memberships membership
    where membership.town_id = p_tenant_id
      and membership.user_id = (select auth.uid())
  );
$$;

create or replace function private.can_create_group(
  p_parent_organization_id uuid,
  p_tenant_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select auth.uid()) is not null and (
    p_parent_organization_id is null or exists (
      select 1
      from public.organizations parent
      join public.organization_memberships membership
        on membership.organization_id = parent.id
       and membership.tenant_id = parent.tenant_id
      where parent.id = p_parent_organization_id
        and parent.tenant_id = p_tenant_id
        and parent.kind in ('company', 'entity', 'city_hall')
        and membership.user_id = (select auth.uid())
        and membership.role in ('owner', 'admin')
    )
  );
$$;

revoke execute on function private.is_organization_member(uuid) from public;
revoke execute on function private.is_organization_member(uuid) from anon;
revoke execute on function private.can_manage_organization(uuid) from public;
revoke execute on function private.can_manage_organization(uuid) from anon;
grant execute on function private.is_town_member(uuid) to public;
grant execute on function private.is_town_member(uuid) to anon;
revoke execute on function private.can_create_group(uuid, uuid) from public;
revoke execute on function private.can_create_group(uuid, uuid) from anon;
grant execute on function private.is_organization_member(uuid) to authenticated;
grant execute on function private.can_manage_organization(uuid) to authenticated;
grant execute on function private.is_town_member(uuid) to authenticated;
grant execute on function private.can_create_group(uuid, uuid) to authenticated;

create or replace function private.add_organization_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.organization_memberships (
    organization_id,
    tenant_id,
    user_id,
    role
  ) values (
    new.id,
    new.tenant_id,
    new.created_by,
    'owner'
  );
  return new;
end;
$$;

revoke execute on function private.add_organization_owner() from public;
revoke execute on function private.add_organization_owner() from anon, authenticated;

create or replace function public.create_organization(
  p_tenant_id uuid,
  p_kind text,
  p_name text,
  p_slug text,
  p_lema text default '',
  p_description text default '',
  p_parent_organization_id uuid default null
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_name text := left(btrim(coalesce(p_name, '')), 120);
  v_slug text := lower(btrim(coalesce(p_slug, '')));
  v_lema text := left(btrim(coalesce(p_lema, '')), 120);
  v_description text := left(btrim(coalesce(p_description, '')), 500);
  v_organization record;
begin
  if p_kind in ('entity', 'city_hall') then
    raise exception 'Les entitats i els ajuntaments no es creen: es reclamen.' using errcode = '42501';
  end if;

  if v_user_id is null then
    raise exception 'Cal iniciar sessió per crear una organització.' using errcode = '42501';
  end if;

  if p_kind is null or p_kind not in ('company', 'group', 'entity', 'city_hall') then
    raise exception 'El tipus d’organització no és vàlid.' using errcode = '22023';
  end if;

  if char_length(v_name) < 2 or v_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then
    raise exception 'El nom o l’identificador de l’organització no és vàlid.' using errcode = '22023';
  end if;

  if not exists (select 1 from public.towns town where town.id = p_tenant_id) then
    raise exception 'El poble indicat no existeix.' using errcode = '22023';
  end if;

  if p_kind in ('company', 'entity', 'city_hall') and p_parent_organization_id is not null then
    raise exception 'Aquesta organització no pot tindre una organització mare.' using errcode = '22023';
  end if;

  if p_kind = 'group'
    and not (select private.can_create_group(p_parent_organization_id, p_tenant_id))
  then
    raise exception 'El grup necessita una empresa mare que pugues administrar.' using errcode = '42501';
  end if;

  insert into public.profiles (id, full_name, visibility)
  values (
    v_user_id,
    coalesce(
      nullif(left(btrim((select auth.jwt()) -> 'user_metadata' ->> 'name'), 120), ''),
      'Persona'
    ),
    'private'
  )
  on conflict (id) do nothing;

  
  select
    organization.id,
    organization.tenant_id,
    organization.slug,
    organization.name,
    organization.kind,
    organization.parent_organization_id,
    organization.lema,
    organization.description,
    organization.visibility,
    organization.created_at,
    organization.updated_at
  into v_organization
  from public.organizations organization
  where organization.tenant_id = p_tenant_id
    and organization.slug = v_slug;

  if found then
    if v_organization.kind <> p_kind
      or v_organization.parent_organization_id is distinct from p_parent_organization_id
      or not (select private.can_manage_organization(v_organization.id))
    then
      raise exception 'L’identificador ja pertany a una altra organització.' using errcode = '23505';
    end if;
    return to_jsonb(v_organization);
  end if;

  insert into public.organizations (
    tenant_id,
    slug,
    name,
    kind,
    parent_organization_id,
    lema,
    description,
    visibility,
    created_by
  ) values (
    p_tenant_id,
    v_slug,
    v_name,
    p_kind,
    p_parent_organization_id,
    v_lema,
    v_description,
    'public',
    v_user_id
  )
  returning
    id,
    tenant_id,
    slug,
    name,
    kind,
    parent_organization_id,
    lema,
    description,
    visibility,
    created_at,
    updated_at
  into v_organization;

  return to_jsonb(v_organization);
end;
$$;

revoke execute on function public.create_organization(uuid, text, text, text, text, text, uuid) from public;
revoke execute on function public.create_organization(uuid, text, text, text, text, text, uuid) from anon;
grant execute on function public.create_organization(uuid, text, text, text, text, text, uuid) to authenticated;

create or replace function public.list_my_organizations(p_tenant_id uuid)
returns table (
  id uuid,
  tenant_id uuid,
  slug text,
  name text,
  kind text,
  parent_organization_id uuid,
  lema text,
  description text,
  visibility text,
  role text,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    organization.id,
    organization.tenant_id,
    organization.slug,
    organization.name,
    organization.kind,
    organization.parent_organization_id,
    organization.lema,
    organization.description,
    organization.visibility,
    membership.role,
    organization.created_at,
    organization.updated_at
  from public.organization_memberships membership
  join public.organizations organization
    on organization.id = membership.organization_id
   and organization.tenant_id = membership.tenant_id
  where membership.user_id = (select auth.uid())
    and membership.tenant_id = p_tenant_id
  order by organization.created_at asc;
$$;

revoke execute on function public.list_my_organizations(uuid) from public;
revoke execute on function public.list_my_organizations(uuid) from anon;
grant execute on function public.list_my_organizations(uuid) to authenticated;

-- 3. TRIGGERS
drop trigger if exists trg_app_content_touch on public.app_content;
create trigger trg_app_content_touch
before update on public.app_content
for each row execute function public.touch_updated_at();



drop trigger if exists sdp_force_author on public.section_submissions;
create trigger sdp_force_author
  before insert or update on public.section_submissions
  for each row execute function public.trg_force_submission_author();

drop trigger if exists sdp_una_propietaria on public.organization_memberships;
create constraint trigger sdp_una_propietaria
  after insert or update or delete on public.organization_memberships
  deferrable initially deferred
  for each row execute function private.comprova_una_propietaria();

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists trg_organizations_touch on public.organizations;
create trigger trg_organizations_touch
before update on public.organizations
for each row execute function public.touch_updated_at();

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

drop trigger if exists trg_organization_add_owner on public.organizations;
create trigger trg_organization_add_owner
after insert on public.organizations
for each row execute function private.add_organization_owner();

-- 4. VIEWS
create or replace view public.organization_directory with (security_invoker = true, security_barrier = true)
as
select
  id,
  tenant_id,
  slug,
  name,
  kind,
  parent_organization_id,
  lema,
  description,
  created_at,
  updated_at
from public.organizations
where visibility = 'public';

revoke all on table public.organization_directory from public, anon, authenticated;
grant select on table public.organization_directory to anon, authenticated;


-- 5. RLS POLICIES
alter table public.towns enable row level security;
alter table public.town_memberships enable row level security;
alter table public.app_content enable row level security;

alter table public.section_submissions enable row level security;
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_memberships enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.organizations from anon, authenticated;
revoke all on table public.organization_memberships from anon, authenticated;
revoke all on table public.town_memberships from anon, authenticated;

grant select on table public.profiles to authenticated;
grant insert (id, full_name, visibility) on table public.profiles to authenticated;
grant update (full_name) on table public.profiles to authenticated;
grant select (
  id, tenant_id, slug, name, kind, parent_organization_id,
  lema, description, visibility, created_at, updated_at
) on table public.organizations to authenticated;
grant insert (
  tenant_id, slug, name, kind, parent_organization_id,
  lema, description, visibility, created_by
) on table public.organizations to authenticated;
grant select on table public.organization_memberships to authenticated;
grant select on table public.town_memberships to authenticated;

drop policy if exists "public read towns" on public.towns;
create policy "public read towns" on public.towns for select using (true);

drop policy if exists "user read own memberships" on public.town_memberships;
create policy "user read own memberships" on public.town_memberships for select
to authenticated using (user_id = (select auth.uid()));


drop policy if exists "public read app_content" on public.app_content;
create policy "public read app_content" on public.app_content for select using (true);




drop policy if exists "public read section_submissions" on public.section_submissions;
create policy "public read section_submissions" on public.section_submissions for select
using (
  (section_id != 'notes' or owner_user_id = (select auth.uid()))
  and (select private.is_town_member(tenant_id))
);

drop policy if exists "private write section_submissions" on public.section_submissions;
create policy "private write section_submissions" on public.section_submissions for insert to authenticated
with check (
  owner_user_id = (select auth.uid())
  and section_id in ('mur', 'mercat', 'events', 'multimedia', 'notes') 
  and payload is not null
  and exists (select 1 from public.town_memberships where town_id = tenant_id and user_id = (select auth.uid()))
  and (author_org_id is null or (select private.can_manage_organization(author_org_id)))
);

drop policy if exists "private update section_submissions" on public.section_submissions;
create policy "private update section_submissions" on public.section_submissions for update to authenticated
using (owner_user_id = (select auth.uid()) and exists (select 1 from public.town_memberships where town_id = tenant_id and user_id = (select auth.uid())))
with check (
  owner_user_id = (select auth.uid()) 
  and section_id in ('mur', 'mercat', 'events', 'multimedia', 'notes') 
  and exists (select 1 from public.town_memberships where town_id = tenant_id and user_id = (select auth.uid()))
  and (author_org_id is null or (select private.can_manage_organization(author_org_id)))
);

drop policy if exists "private delete section_submissions" on public.section_submissions;
create policy "private delete section_submissions" on public.section_submissions for delete to authenticated
using (owner_user_id = (select auth.uid()) and exists (select 1 from public.town_memberships where town_id = tenant_id and user_id = (select auth.uid())));


drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()));

drop policy if exists "profiles insert own private" on public.profiles;
create policy "profiles insert own private" on public.profiles for insert to authenticated
with check (
  (select auth.uid()) is not null
  and id = (select auth.uid())
  and visibility = 'private'
);

drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated
using ((select auth.uid()) is not null and id = (select auth.uid()))
with check ((select auth.uid()) is not null and id = (select auth.uid()) and visibility = 'private');

drop policy if exists "authenticated read public organizations" on public.organizations;
create policy "public read public organizations" on public.organizations for select
using (visibility = 'public');

drop policy if exists "members read own organizations" on public.organizations;
create policy "members read own organizations" on public.organizations for select to authenticated
using ((select private.is_organization_member(id)));

drop policy if exists "members create organizations" on public.organizations;
create policy "members create organizations" on public.organizations for insert to authenticated
with check (
  (select auth.uid()) is not null
  and created_by = (select auth.uid())
  and visibility = 'public'
  and (select private.is_town_member(tenant_id))
  and (
    (kind = 'company' and parent_organization_id is null)
    or (
      kind = 'group'
      and parent_organization_id is not null
      and (select private.can_create_group(parent_organization_id, tenant_id))
    )
  )
);

drop policy if exists "members read own memberships" on public.organization_memberships;
create policy "members read own memberships" on public.organization_memberships for select to authenticated
using (
  user_id = (select auth.uid())
  or (select private.can_manage_organization(organization_id))
);



alter table public.user_platform_roles enable row level security;
revoke all on table public.user_platform_roles from anon, authenticated;
grant select on table public.user_platform_roles to authenticated;

drop policy if exists "llig el propi rol" on public.user_platform_roles;
create policy "llig el propi rol" on public.user_platform_roles for select to authenticated
using (user_id = (select auth.uid()));

alter table public.organization_claims enable row level security;
revoke all on table public.organization_claims from anon, authenticated;
grant select on table public.organization_claims to authenticated;

drop policy if exists "llig les propies reclamacions" on public.organization_claims;
create policy "llig les propies reclamacions" on public.organization_claims
for select to authenticated
using (user_id = (select auth.uid()) or (select private.es_superadmin()));

grant update (name, lema, description, visibility) on table public.organizations to authenticated;

drop policy if exists "gestores actualitzen l'organització" on public.organizations;
create policy "gestores actualitzen l'organització" on public.organizations
for update to authenticated
using       ((select private.can_manage_organization(id)))
with check  ((select private.can_manage_organization(id)));

```
<<<FI_FITXER>>>

## Fitxer: supabase/migrations/260908_xat_v2_correccions.sql

```
-- ==============================================================================
-- MIGRACIÓ: Xat v2 · PEGAT CORRECTIU (260908)
-- ==============================================================================
-- S'aplica DESPRÉS de 260908_xat_v2.sql. És idempotent: es pot executar les
-- voltes que faça falta.
--
-- PER QUÈ EXISTIX AQUEST FITXER
-- ─────────────────────────────
-- 260908_xat_v2.sql crea les quatre taules correctament, però el xat no pot
-- funcionar tal com està. Tres defectes estructurals:
--
--   P0-A · La política "xat_participants_insercio" és un peix que es mossega
--          la cua. La subconsulta `(select creat_per from public.xat_fils
--          where id = fil_id)` s'avalua AMB RLS. Per a llegir eixa fila cal
--          passar "xat_fils_lectura", que exigix ser participant. Qui acaba de
--          crear el fil encara no ho és → la subconsulta torna 0 files → NULL
--          → `false OR NULL` = NULL → INSERT rebutjat. Ningú pot afegir mai el
--          primer participant. Cap fil arriba a ser utilitzable.
--
--   P0-B · "profiles read own" (esquema inicial, línia 858) només deixa llegir
--          el teu propi perfil. No hi ha cap camí per a saber com es diu l'altra
--          persona de la conversa. El xat mostraria "Usuari" per sempre.
--          No s'obri profiles: s'obri NOMÉS el nom de qui comparteix fil amb tu,
--          i a través d'una funció, no d'una política.
--
--   P0-C · Amb el seed actual, `xat_fils` queda BUIDA (seed.sql només omple
--          l'antiga `chat_threads`) i no hi ha cap manera de crear un fil.
--          `crea_fil_directe` és eixa manera.
--
-- Tot allò que travessa RLS ho fa per SECURITY DEFINER amb `search_path = ''`
-- i noms qualificats, com la resta de l'esquema.
-- ==============================================================================


-- ══════════════════════════════════════════════════════════════════════════
-- 1 · ÍNDEXS
-- Sense estos, cada obertura de conversa és un seqüencial sobre xat_missatges.
-- ══════════════════════════════════════════════════════════════════════════

create index if not exists idx_xat_missatges_fil_creat
  on public.xat_missatges (fil_id, creat_al desc);

create index if not exists idx_xat_participants_usuari
  on public.xat_participants (usuari_id);

create index if not exists idx_xat_fils_tenant_actualitzat
  on public.xat_fils (tenant_id, actualitzat_al desc);

create index if not exists idx_xat_lectures_usuari
  on public.xat_lectures (usuari_id);


-- ══════════════════════════════════════════════════════════════════════════
-- 2 · COLUMNA `es_ia`
-- XatSection.jsx llig `msg.is_ai` des de fa temps. Eixe camp no existix ni a la
-- taula ni al mapeig: és un camp fantasma que sempre val undefined. O s'esborra
-- del frontend o es fa real. Es fa real, perquè el fil de la IAIA MarIA el
-- necessitarà, i costa una columna amb default.
-- ══════════════════════════════════════════════════════════════════════════

alter table public.xat_missatges
  add column if not exists es_ia boolean not null default false;


-- ══════════════════════════════════════════════════════════════════════════
-- 3 · PERMISOS DE `private.es_participant`
-- La migració original la va crear sense revoke/grant explícits, a diferència
-- de TOTES les altres funcions de `private` a l'esquema inicial (línies 470-481).
-- Per defecte, EXECUTE és de PUBLIC. Ara mateix no és explotable perquè `anon`
-- no té USAGE sobre l'esquema `private`, però la defensa no pot dependre d'un
-- detall que està escrit en un altre fitxer.
-- ══════════════════════════════════════════════════════════════════════════

revoke execute on function private.es_participant(uuid) from public;
revoke execute on function private.es_participant(uuid) from anon;
grant  execute on function private.es_participant(uuid) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
-- 4 · CORRECCIÓ P0-A · el peix que es mossega la cua
-- ══════════════════════════════════════════════════════════════════════════

-- Mateix patró que `es_participant`: llig `xat_fils` per damunt de RLS, així que
-- el creador es reconeix a si mateix abans de ser participant.
create or replace function private.es_creador_del_fil(p_fil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.xat_fils f
    where f.id = p_fil_id
      and f.creat_per = (select auth.uid())
  );
$$;

revoke execute on function private.es_creador_del_fil(uuid) from public;
revoke execute on function private.es_creador_del_fil(uuid) from anon;
grant  execute on function private.es_creador_del_fil(uuid) to authenticated;

drop policy if exists "xat_participants_insercio" on public.xat_participants;
create policy "xat_participants_insercio" on public.xat_participants
for insert to authenticated
with check (
  private.es_participant(fil_id)
  or private.es_creador_del_fil(fil_id)
);

-- Un participant ha de poder eixir-se'n. Sense esta política, el GRANT DELETE
-- de la migració original no servix per a res (cap política = denegat).
drop policy if exists "xat_participants_eixida" on public.xat_participants;
create policy "xat_participants_eixida" on public.xat_participants
for delete to authenticated
using (usuari_id = (select auth.uid()));


-- ══════════════════════════════════════════════════════════════════════════
-- 5 · RPC · crear un fil directe (idempotent)
--
-- IDEMPOTÈNCIA: si ja existix un fil d'exactament dos participants amb estes
-- dos persones, es torna eixe. La lliçó de `create_organization` és que crear
-- dues voltes no és una funcionalitat, és un error de disseny.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function public.crea_fil_directe(
  p_tenant_id     uuid,
  p_altre_usuari  uuid,
  p_titol         text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_jo  uuid := (select auth.uid());
  v_fil uuid;
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;

  if p_altre_usuari is null or p_altre_usuari = v_jo then
    raise exception 'SDP-XAT-002: cal una altra persona, distinta de tu.' using errcode = '22023';
  end if;

  if not exists (
    select 1 from public.town_memberships m
    where m.town_id = p_tenant_id and m.user_id = v_jo
  ) then
    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.town_memberships m
    where m.town_id = p_tenant_id and m.user_id = p_altre_usuari
  ) then
    raise exception 'SDP-XAT-004: l''altra persona no és membre d''aquest poble.' using errcode = '42501';
  end if;

  select f.id into v_fil
  from public.xat_fils f
  where f.tenant_id = p_tenant_id
    and (select count(*) from public.xat_participants p where p.fil_id = f.id) = 2
    and exists (select 1 from public.xat_participants p where p.fil_id = f.id and p.usuari_id = v_jo)
    and exists (select 1 from public.xat_participants p where p.fil_id = f.id and p.usuari_id = p_altre_usuari)
  order by f.creat_al asc
  limit 1;

  if v_fil is not null then
    return v_fil;
  end if;

  insert into public.xat_fils (tenant_id, titol, creat_per)
  values (p_tenant_id, nullif(btrim(coalesce(p_titol, '')), ''), v_jo)
  returning id into v_fil;

  insert into public.xat_participants (fil_id, usuari_id)
  values (v_fil, v_jo), (v_fil, p_altre_usuari)
  on conflict do nothing;

  return v_fil;
end;
$$;

revoke execute on function public.crea_fil_directe(uuid, uuid, text) from public;
revoke execute on function public.crea_fil_directe(uuid, uuid, text) from anon;
grant  execute on function public.crea_fil_directe(uuid, uuid, text) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
-- 6 · RPC · els meus fils
--
-- Una crida, no N+1. Torna el que la barra lateral ja pinta: nom, avanç de
-- l'últim missatge, hora i no llegits. CORRECCIÓ P0-B: `altres_noms` és
-- l'única escletxa cap a `profiles`, i només per a qui comparteix fil amb tu.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function public.xat_fils_meus(p_tenant_id uuid)
returns table (
  id              uuid,
  titol           text,
  actualitzat_al  timestamptz,
  altres_noms     text[],
  ultim_text      text,
  ultim_al        timestamptz,
  no_llegits      integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    f.id,
    f.titol,
    f.actualitzat_al,
    coalesce((
      select array_agg(coalesce(pr.full_name, 'Veí') order by pr.full_name)
      from public.xat_participants p
      left join public.profiles pr on pr.id = p.usuari_id
      where p.fil_id = f.id
        and p.usuari_id <> (select auth.uid())
    ), array[]::text[]) as altres_noms,
    u.text     as ultim_text,
    u.creat_al as ultim_al,
    (
      select count(*)::integer
      from public.xat_missatges m
      where m.fil_id = f.id
        and m.usuari_id <> (select auth.uid())
        and m.creat_al > coalesce(
          (select l.ultim_llegit_al
             from public.xat_lectures l
            where l.fil_id = f.id and l.usuari_id = (select auth.uid())),
          '-infinity'::timestamptz
        )
    ) as no_llegits
  from public.xat_fils f
  join public.xat_participants jo
    on jo.fil_id = f.id
   and jo.usuari_id = (select auth.uid())
  left join lateral (
    select m.text, m.creat_al
    from public.xat_missatges m
    where m.fil_id = f.id
    order by m.creat_al desc
    limit 1
  ) u on true
  where f.tenant_id = p_tenant_id
  order by coalesce(u.creat_al, f.actualitzat_al) desc;
$$;

revoke execute on function public.xat_fils_meus(uuid) from public;
revoke execute on function public.xat_fils_meus(uuid) from anon;
grant  execute on function public.xat_fils_meus(uuid) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
-- 7 · RPC · missatges d'un fil, amb el nom de qui els ha escrit
--
-- La columna de text s'anomena `cos` i no `text` a propòsit: dins de plpgsql,
-- una variable de retorn dita `text` col·lisiona amb el nom del tipus.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function public.xat_missatges_del_fil(
  p_fil_id uuid,
  p_limit  integer default 200
)
returns table (
  id         uuid,
  usuari_id  uuid,
  autor_nom  text,
  cos        text,
  es_ia      boolean,
  creat_al   timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.es_participant(p_fil_id) then
    raise exception 'SDP-XAT-005: no eres participant d''aquest fil.' using errcode = '42501';
  end if;

  return query
    select
      m.id,
      m.usuari_id,
      coalesce(pr.full_name, 'Veí')::text,
      m.text,
      m.es_ia,
      m.creat_al
    from public.xat_missatges m
    left join public.profiles pr on pr.id = m.usuari_id
    where m.fil_id = p_fil_id
    order by m.creat_al asc
    limit greatest(1, least(coalesce(p_limit, 200), 500));
end;
$$;

revoke execute on function public.xat_missatges_del_fil(uuid, integer) from public;
revoke execute on function public.xat_missatges_del_fil(uuid, integer) from anon;
grant  execute on function public.xat_missatges_del_fil(uuid, integer) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
-- 8 · RPC · marcar llegit
--
-- L'`upsert` que feia el frontend contra /rest/v1/xat_lectures NO avançava mai
-- la marca: `ultim_llegit_al` no anava al cos de la petició, i PostgREST només
-- actualitza les columnes que rep. La primera lectura entrava i la resta es
-- perdien en silenci. Ací el rellotge el posa el servidor.
-- ══════════════════════════════════════════════════════════════════════════

create or replace function public.xat_marca_llegit(p_fil_id uuid)
returns timestamptz
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_ara timestamptz := now();
begin
  if not private.es_participant(p_fil_id) then
    raise exception 'SDP-XAT-005: no eres participant d''aquest fil.' using errcode = '42501';
  end if;

  insert into public.xat_lectures (fil_id, usuari_id, ultim_llegit_al)
  values (p_fil_id, (select auth.uid()), v_ara)
  on conflict (fil_id, usuari_id)
  do update set ultim_llegit_al = excluded.ultim_llegit_al;

  return v_ara;
end;
$$;

revoke execute on function public.xat_marca_llegit(uuid) from public;
revoke execute on function public.xat_marca_llegit(uuid) from anon;
grant  execute on function public.xat_marca_llegit(uuid) to authenticated;


-- ══════════════════════════════════════════════════════════════════════════
-- 9 · REALTIME (DESACTIVAT A PROPÒSIT)
--
-- Les taules del xat NO estan a la publicació `supabase_realtime`. Mentre no
-- hi estiguen, qualsevol subscripció Realtime es connecta, no dóna cap error i
-- no rep res mai: el pitjor mode de fallada que hi ha.
--
-- El frontend d'aquesta entrega fa sondeig adaptatiu (vegeu XatContext.jsx),
-- que NO necessita això. Si algun dia s'obri el WebSocket, descomenta el bloc
-- i comprova que Realtime RLS està actiu al panell de Supabase; si no, els
-- missatges es difonen a qui no toca.
--
/*
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'xat_missatges'
  ) then
    alter publication supabase_realtime add table public.xat_missatges;
  end if;
end
$$;
*/
-- ══════════════════════════════════════════════════════════════════════════

-- 10 · Restauració de Política d'Inserció i RATE LIMITING
-- Substituït el Rate Limit via RLS per un TRIGGER BEFORE INSERT atòmic
-- per a evitar condicions de cursa i asfíxia per COUNT.

create index if not exists idx_xat_missatges_usuari_creat
  on public.xat_missatges (usuari_id, creat_al desc);

drop function if exists private.passa_rate_limit_xat(uuid) cascade;

create or replace function private.trigger_rate_limit_xat()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count int;
begin
  -- Bloqueig consultiu transaccional per evitar condicions de cursa en ràfegues
  perform pg_advisory_xact_lock(hashtext(new.usuari_id::text));

  select count(*) into v_count
  from public.xat_missatges
  where usuari_id = new.usuari_id
    and creat_al > now() - interval '5 seconds';

  if v_count >= 15 then
    raise exception 'SDP-XAT-429: Has superat el límit de missatges permesos (15/5s).' using errcode = '42900';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_rate_limit_xat on public.xat_missatges;
create trigger trg_rate_limit_xat
  before insert on public.xat_missatges
  for each row
  execute function private.trigger_rate_limit_xat();

drop policy if exists "xat_missatges_insercio" on public.xat_missatges;
create policy "xat_missatges_insercio" on public.xat_missatges for insert to authenticated
with check (
  private.es_participant(fil_id) 
  and usuari_id = (select auth.uid()) 
  and es_ia = false
);
```
<<<FI_FITXER>>>

## Fitxer: tooling/gates/run-portes.mjs

```
#!/usr/bin/env node
import { spawnSync } from 'node:child_process';

import { fileURLToPath } from 'node:url';

export const passos = [
  { nom: 'Tractor Psicopatia', cmd: 'node', args: ['tooling/gates/tractor-psicopatia.mjs'], script: 'porta:psicopatia' },
  { nom: 'Porta 58px', cmd: 'node', args: ['tooling/gates/01_porta_pedra_seca_58px.mjs'], script: 'porta:58px' },
  { nom: 'Linter', cmd: 'npm', args: ['run', 'lint'] },
  { nom: 'Porta Importacions', cmd: 'npm', args: ['run', 'porta:importacions'], script: 'porta:importacions' },
  { nom: 'Porta Build', cmd: 'node', args: ['tooling/gates/tractor-build-previ.mjs'], script: 'porta:build' },
  { nom: 'Porta Promesa', cmd: 'node', args: ['tooling/gates/tractor-promesa.mjs'], script: 'porta:promesa' },
  { nom: 'Porta TDZ', cmd: 'node', args: ['tooling/gates/tractor-tdz.mjs'], script: 'porta:tdz' },
  { nom: 'Porta Arrel', cmd: 'node', args: ['tooling/gates/tractor-arrel.mjs'], script: 'porta:arrel' },
  { nom: 'Porta Enxufe', cmd: 'node', args: ['tooling/gates/tractor-enxufe.mjs'], script: 'porta:enxufe' },
  { nom: 'Porta Maquinari', cmd: 'node', args: ['tooling/gates/tractor-doctrina-maquinari.mjs'], script: 'porta:maquinari' },
  { nom: 'Porta Graella', cmd: 'node', args: ['tooling/gates/tractor-graella.mjs'], script: 'porta:graella' },
  { nom: 'Porta InnerHTML', cmd: 'node', args: ['tooling/gates/tractor-innerhtml.mjs'], script: 'porta:innerhtml' },
  { nom: 'Porta Rutes', cmd: 'node', args: ['tooling/gates/tractor-rutes.mjs'], script: 'porta:rutes' },
  { nom: 'Porta Rutes Web', cmd: 'node', args: ['tooling/gates/tractor-rutes-web.mjs'], script: 'porta:rutes-web' },
  { nom: 'Porta Frontera', cmd: 'node', args: ['tooling/gates/tractor-sollutia.mjs'], script: 'porta:frontera' },
  { nom: 'Porta Frontissa', cmd: 'node', args: ['tooling/gates/tractor-adaptadors.mjs'], script: 'porta:frontissa' },
  { nom: 'Porta Frontera Auth', cmd: 'node', args: ['tooling/wiki/tractor-frontera-auth.mjs'], script: 'porta:frontera-auth' },
  { nom: 'Tractor Cognitiu', cmd: 'node', args: ['tooling/wiki/tractor-cognitiu.mjs', '--arrel=.'], script: 'porta:cognitiu' },
  { nom: 'Porta Cens', cmd: 'node', args: ['tooling/gates/tractor-cens.mjs'], script: 'porta:cens' },
  { nom: 'Porta Consell', cmd: 'node', args: ['tooling/gates/tractor-consell.mjs'], script: 'porta:consell' },
  { nom: 'Porta Registre', cmd: 'node', args: ['tooling/gates/tractor-registre.mjs'], script: 'porta:registre' },

  { nom: 'Porta Manifest', cmd: 'node', args: ['tooling/gates/tractor-manifest.mjs'], script: 'porta:manifest' },
  { nom: 'Porta Doctrina', cmd: 'node', args: ['tooling/gates/tractor-doctrina.mjs'], script: 'porta:doctrina' },
  { nom: 'Porta Reflex', cmd: 'node', args: ['tooling/wiki/reflex_petorreta.mjs', 'doctor', '--ci'], script: 'porta:reflex' },
  { nom: 'Tractor Pedra Seca', cmd: 'node', args: ['tooling/brain/tractor-pedra-seca.mjs'], script: 'porta:pedra-seca' },
  { nom: 'Design Guard', cmd: 'node', args: ['tooling/gates/design_guard.mjs', '--arrel=src'], script: 'porta:design-guard' },
  { nom: 'Porta Tokens', cmd: 'node', args: ['tooling/gates/tractor-tokens.mjs'], script: 'porta:tokens' },
  { nom: 'Porta Fitxa Gestor', cmd: 'node', args: ['tooling/gates/tractor-fitxa-gestor.mjs'], script: 'porta:fitxa' },
  { nom: 'Porta Cromàtic', cmd: 'node', args: ['tooling/gates/tractor-cromatic.mjs'], script: 'porta:cromatic' },
  { nom: 'Porta Crom (closca immutable)', cmd: 'node', args: ['tooling/gates/tractor-crom.mjs'], script: 'porta:crom' },
  { nom: 'Porta Vocabulari', cmd: 'node', args: ['tooling/gates/tractor-vocabulari.mjs'], script: 'porta:vocabulari' },
  { nom: 'Porta Estucat', cmd: 'node', args: ['tooling/gates/tractor-estucat.mjs', '--arrel=.'], script: 'porta:estucat' },
  { nom: 'Llaurador Índexs', cmd: 'node', args: ['tooling/wiki/llaurador_indexs.mjs', '--check', '--lock-token'], script: 'porta:llaurador' },
  { nom: 'Porta Frontmatter', cmd: 'node', args: ['tooling/wiki/tractor-frontmatter.mjs'], script: 'porta:frontmatter' },
  { nom: 'Porta Esquemes', cmd: 'node', args: ['tooling/wiki/tractor-esquemes.mjs'], script: 'porta:esquemes' },
  { nom: 'Porta Nomenclatura', cmd: 'node', args: ['tooling/wiki/tractor-nomenclatura.mjs', '--arrel=.'], script: 'porta:nomenclatura' },
  { nom: 'Porta Teixit', cmd: 'node', args: ['tooling/wiki/teixidor.mjs', '--lock-token'], script: 'porta:teixit' },
  { nom: 'Porta SCC', cmd: 'node', args: ['tooling/gates/verificador-scc.mjs'], script: 'porta:scc' },
  { nom: 'SEO Manifest', cmd: 'node', args: ['tooling/gates/build-seo-manifest.mjs', '--verifica', '--lock-token'], script: 'porta:seo' },
  { nom: 'Porta Persistència', cmd: 'node', args: ['tooling/gates/tractor-persistencia.mjs'], script: 'porta:persistencia' },
  { nom: 'Porta Shim', cmd: 'node', args: ['tooling/gates/tractor-shim.mjs'], script: 'porta:shim' },
  { nom: 'Porta Cadena', cmd: 'node', args: ['tooling/gates/tractor-cadena.mjs'], script: 'porta:cadena' }
,
  { nom: 'Tractor Llavor', cmd: 'node', args: ['tooling/gates/tractor-llavor.mjs'], script: 'porta:llavor' }
,
  { nom: 'Porta Matrix', cmd: 'node', args: ['tooling/brain/matrix.mjs', 'crear un prompt'], script: 'porta:matrix' },
  { nom: 'Porta Utilitats SDP', cmd: 'node', args: ['tooling/gates/tractor-utilitats-sdp.mjs'], script: 'porta:utilitatssdp' },
  { nom: 'Porta Inline-Styles (Salfumà)', cmd: 'node', args: ['tooling/gates/tractor-inline-styles.mjs'], script: 'porta:inlinestyles' },
  { nom: 'Porta Classes (Salfumà)', cmd: 'node', args: ['tooling/gates/tractor-classes.mjs'], script: 'porta:classes' },
  { nom: 'Porta RLS', cmd: 'node', args: ['tooling/gates/tractor-rls.mjs'], script: 'porta:rls' },
  { nom: 'Porta Catàleg', cmd: 'node', args: ['tooling/gates/tractor-cataleg.mjs'], script: 'porta:cataleg' },

  { nom: 'Proves', cmd: 'npm', args: ['run', 'test', '--', '--run'] },
  { nom: 'Porta Segella', cmd: 'node', args: ['tooling/gates/segella.mjs'], script: 'porta:segella' }
];

const isMain = process.argv[1] === fileURLToPath(import.meta.url);

if (isMain) {
  let failed = false;
  let errors = [];

  console.log("\n🚀 INICIANT CADENA AGREGATIVA DE PORTES...\n");

  for (const pas of passos) {
    console.log(`\n────────────────────────────────────────────────────────────────────────`);
    console.log(`⏳ Executant ${pas.nom}...`);
    console.log(`────────────────────────────────────────────────────────────────────────\n`);
    const result = spawnSync(pas.cmd, pas.args, { stdio: 'inherit', encoding: 'utf-8' });
    if (result.error || result.status !== 0) {
      console.log(`\n❌ [FRACÀS] ${pas.nom}`);
      failed = true;
      errors.push(pas.nom);
    } else {
      console.log(`\n✅ [OK] ${pas.nom}`);
    }
  }

  console.log(`\n========================================================================`);
  if (failed) {
    console.error(`💥 RESUM DE FALLIDES (${errors.length} tractor/s):`);
    for (const err of errors) {
      console.error(`   - ❌ ${err}`);
    }
    console.error(`\n🔒 Resol els deutes abans de fer commit.\n`);
    process.exit(1);
  } else {
    console.log(`🎉 TOTES LES PORTES HAN PASSAT AMB ÈXIT. MUR DE PEDRA SECA INTACTE.`);
  }
  console.log(`========================================================================\n`);
  process.exit(0);
}
```
<<<FI_FITXER>>>

## Fitxer: tooling/gates/tractor-sollutia.mjs

```
#!/usr/bin/env node
/**
 * tractor-sollutia.mjs — LA PORTA DE LA FRONTERA
 *
 * PER QUÈ EXISTIX
 * ───────────────
 *   Totes les portes actuals miren cap endins (src/, .agents/, wiki). Cap mira
 *   la costura: què passa quan el Web Component cau dins d'una pàgina que no
 *   controlem. L'auditoria 260831 va trobar quatre defectes que només es veuen
 *   des d'eixe costat i que cap `npm run porta` detecta.
 *
 * LLEIS
 *   S1 VAR-ORFE-AMFITRIO
 *       `var(--x, fallback)` a una superfície d'amfitrió (index.html,
 *       wordpress-plugin/**) on `--x` no es definix enlloc. El fallback pinta
 *       sempre i el token real no mana mai.
 *       Cas real: index.html usa `--sdp-fons-app`, blank.php usa `--sdp-bg`.
 *       Cap de les dos existix. Les dos cauen a #f4eee6, que no és cap token
 *       (el token de fons càlid és #fff4ef). Dos noms, cap definició, un color
 *       que no és el del sistema.
 *
 *   S2 INSTANCIA-UNICA
 *       `connectedCallback` desmunta les altres instàncies connectades. Dos
 *       blocs Gutenberg a la mateixa pàgina, o l'editor i la previsualització,
 *       i la primera mor. Un custom element que no admet dos instàncies és un
 *       singleton disfressat, i Sollutia no ho sabrà fins que ho trenque.
 *
 *   S3 ORDRE-CIRCULAR
 *       Una porta encadenada a `build` exigix un artefacte que només produïx
 *       una passa posterior de la mateixa cadena. En clon net, `npm run build`
 *       no pot passar mai.
 *       Cas real: `porta` crida `build-seo-manifest --verifica`, que exigix
 *       `wordpress-plugin/dist/seo-routes.json`; qui l'escriu és `build:seo`,
 *       que va després.
 *
 *   S4 TOKEN-MUT
 *       Token declarat a `design-tokens.json` (que es proclama «font única de
 *       veritat», status TANCAT) que cap fitxer consumix. Un contracte que
 *       ningú llig no és un contracte.
 *
 * Pedra Seca: zero dependències, ESM, fail-closed.
 *
 *   node tooling/gates/tractor-sollutia.mjs
 *   node tooling/gates/tractor-sollutia.mjs --json
 */

import fs from 'node:fs';
import path from 'node:path';

const ARG = (n) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? null;
const ARREL = path.resolve(ARG('arrel') ?? process.cwd());
const JSON_OUT = process.argv.includes('--json');

const EXCLOU = /(^|\/)(node_modules|\.git|dist|build|coverage)(\/|$)/;
const EXT = new Set(['.css', '.js', '.jsx', '.mjs', '.ts', '.tsx', '.html', '.php']);

function fitxers(dir, acc = []) {
  const abs = path.join(ARREL, dir);
  if (!fs.existsSync(abs)) return acc;
  const st = fs.statSync(abs);
  if (st.isFile()) { acc.push(dir); return acc; }
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.posix.join(dir, e.name);
    if (EXCLOU.test(rel)) continue;
    if (e.isDirectory()) fitxers(rel, acc);
    else if (EXT.has(path.extname(e.name))) acc.push(rel);
  }
  return acc;
}

const TOTS = ['src', 'wordpress-plugin', 'index.html', 'public'].flatMap((d) => fitxers(d));
/* Superfícies d'amfitrió: el que pinta abans que React estiga viu. */
const AMFITRIO = TOTS.filter((f) => f === 'index.html' || f.startsWith('wordpress-plugin/'));

const llegeix = (f) => fs.readFileSync(path.join(ARREL, f), 'utf8');
const infr = [];
const afig = (llei, on, detall) => infr.push({ llei, on, detall });

/* ─────────────────────── S1 · variables òrfenes ─────────────────────── */

const definides = new Set();
for (const f of TOTS) {
  for (const m of llegeix(f).matchAll(/(--[\w-]+)\s*:/g)) definides.add(m[1]);
}
const fallbackPerVar = new Map();
for (const f of AMFITRIO) {
  const t = llegeix(f);
  for (const m of t.matchAll(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)/g)) {
    const [, nom, fb] = m;
    if (nom.endsWith('-')) continue; /* concatenació dinàmica, no una variable */
    if (definides.has(nom)) continue;
    const linia = t.slice(0, m.index).split('\n').length;
    afig('S1', `${f}:${linia}`, `«${nom}» no es definix enlloc; pinta sempre el recurs ${fb ? `«${fb.trim()}»` : '(cap!)'}`);
    if (fb) {
      const k = fb.trim().toLowerCase();
      if (!fallbackPerVar.has(k)) fallbackPerVar.set(k, []);
      fallbackPerVar.get(k).push(nom);
    }
  }
}
for (const [valor, noms] of fallbackPerVar) {
  if (new Set(noms).size > 1) {
    afig('S1', 'amfitrió', `${new Set(noms).size} noms distints (${[...new Set(noms)].join(', ')}) per al mateix valor ${valor}: trieu-ne un`);
  }
}

/* ─────────────────────── S2 · instància única (Retirat: Ara es permeten múltiples) ─────────────────────── */

/* ─────────────────────── S3 · ordre circular ─────────────────────── */

const pkg = JSON.parse(llegeix('package.json'));
const S = pkg.scripts ?? {};
const desplega = (s, d = 0) => (d > 8 ? s : desplega(s.replace(/npm run ([\w:-]+)/g, (_, n) => S[n] ?? ''), d + 1));
const cadena = desplega(S.build ?? '');
const passes = cadena.split('&&').map((x) => x.trim());
/* Artefactes que una passa escriu (--escriu) i una altra exigix (--verifica). */
const escriu = new Map();
const verifica = [];
passes.forEach((p, i) => {
  const eina = /(?:node|sh)\s+([\w./-]+)/.exec(p)?.[1];
  if (!eina) return;
  if (/--escriu|--write|--baseline/.test(p)) escriu.set(eina, i);
  if (/--verifica|--verify|--check/.test(p)) verifica.push([eina, i, p]);
});
for (const [eina, i] of verifica) {
  const j = escriu.get(eina);
  if (j !== undefined && j > i) {
    afig('S3', 'package.json:build',
      `passa ${i + 1} executa «${eina} --verifica» però qui escriu l'artefacte és la passa ${j + 1}: en clon net no passa mai`);
  }
}

/* ─────────────────────── S4 · tokens muts ─────────────────────── */

const TOK = 'src/config/design-tokens.json';
if (fs.existsSync(path.join(ARREL, TOK))) {
  const tokens = JSON.parse(llegeix(TOK));
  const declarats = [];
  (function rec(o) {
    if (o && typeof o === 'object') {
      if (typeof o.css_var === 'string') declarats.push(o.css_var);
      for (const v of Object.values(o)) rec(v);
    }
  })(tokens);
  const consumits = new Set();
  for (const f of TOTS) {
    if (f === TOK) continue;
    for (const m of llegeix(f).matchAll(/var\(\s*(--[\w-]+)/g)) consumits.add(m[1]);
  }
  const muts = declarats.filter((v) => !consumits.has(v));
  const font = tokens?.meta?.font_unica_de_veritat === true;
  for (const v of muts) {
    afig('S4', TOK, `«${v}» declarat${font ? ' a la «font única de veritat»' : ''} i consumit 0 vegades`);
  }
  if (declarats.length && muts.length / declarats.length > 0.3) {
    afig('S4', TOK,
      `${muts.length}/${declarats.length} tokens muts (${Math.round(100 * muts.length / declarats.length)}%): `
      + 'la «font única de veritat» no governa el sistema real');
  }
}

/* ──────────────────────────────── Eixida ──────────────────────────────── */

const per = (l) => infr.filter((x) => x.llei === l);
const ETIQ = {
  S1: 'VAR-ORFE-AMFITRIÓ · el fallback pinta i el token no mana',
  S3: 'ORDRE-CIRCULAR · la porta exigix el que la porta encara no ha fet',
  S4: 'TOKEN-MUT · declarat i mai consumit',
};

if (JSON_OUT) {
  console.log(JSON.stringify({ ok: infr.length === 0, infraccions: infr }, null, 2));
  process.exit(infr.length ? 1 : 0);
}

console.log('\n🧱 TRACTOR DE LA FRONTERA (Sollutia)');
console.log('─'.repeat(72));
for (const l of ['S1', 'S3', 'S4']) {
  const x = per(l);
  console.log(`\n${x.length === 0 ? '✅' : '❌'} ${l} · ${ETIQ[l]} — ${x.length}`);
  for (const i of x.slice(0, 10)) console.log(`      ${i.on}\n        ↳ ${i.detall}`);
  if (x.length > 10) console.log(`      … i ${x.length - 10} més`);
}
console.log(`\n${'─'.repeat(72)}`);
if (infr.length) {
  console.error(`PARAT. ${infr.length} defecte(s) que Sollutia veurà abans que nosaltres.`);
  process.exit(1);
}
console.log('PASSA. La frontera aguanta.');
process.exit(0);
```
<<<FI_FITXER>>>

<<<FI_DEL_BUNDLE>>>
