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
{"esquema":"sdp.bundle.v2","generat":"2026-09-15T10:22:23.665Z","arrel":"socdepoble.org","verificat":true,"contracte":{"directoris":["supabase/migrations","src/sections/xat","scripts/immunitari"],"fitxers_obligatoris":["src/host.js"],"fitxers_opcionals":[".agents/deute/.design-guard-deute.json",".agents/deute/.estucat-deute.json",".agents/deute/.frontmatter-deute.json",".agents/deute/.nomenclatura-deute.json",".agents/deute/.pedra-seca-deute.json",".agents/deute/.promesa-deute.json",".agents/deute/.rutes-deute.json",".agents/deute/.teixit-deute.json",".agents/deute/.vocabulari-deute.json"],"extensions":[".cjs",".css",".html",".js",".json",".jsx",".md",".mjs",".php",".py",".sh",".sql",".ts",".tsx",".txt",".yaml",".yml"],"dirs_exclosos":[".brain-reports",".gemini",".git",".githooks",".husky",".next",".obsidian",".sdp-paperera",".sdp-reflex","90_arxiu_historic","90_historic","build","cervells","coverage","dist","node_modules","skills_mirror","vendor"],"fitxers_prohibits":["DOC_Logos_Oficials.md","Soci_Sollutia.md","all_ai_responses.md","legalContent.js","perfil_psiquiatric.md"]},"totals":{"fitxers":30,"bytes":205627},"absents_no_critics":[],"fitxers":[{"ruta":".agents/deute/.design-guard-deute.json","bytes":2595,"linies":68,"sha256":"a50595f21f293c5e60b58e88c7c1be27a3b209ac4a681942826646f5cc5f408f"},{"ruta":".agents/deute/.estucat-deute.json","bytes":2788,"linies":74,"sha256":"89d3b8321de059b4097091747588d65041163e9ba8646a8a40c51dc3aabcc0ab"},{"ruta":".agents/deute/.frontmatter-deute.json","bytes":359,"linies":17,"sha256":"e865c0ace0d40424ae4a1cfd14ae6f9a727dfa0ee7146d6395ec9308b3ca9dfe"},{"ruta":".agents/deute/.nomenclatura-deute.json","bytes":98,"linies":9,"sha256":"0bebb4582da53aeb52ca187de5ef0656c802f73c1dcb7953938b8b2a30662408"},{"ruta":".agents/deute/.pedra-seca-deute.json","bytes":7381,"linies":151,"sha256":"42f2a7e1c7217e8a9f76bb4322d68be142cef0d6c95d41c7ab817e357c4e2f6f"},{"ruta":".agents/deute/.promesa-deute.json","bytes":394,"linies":13,"sha256":"4c75a7c946d50789a81d337fef328e0d48d9258043501b2d6ceb2a595854e7c1"},{"ruta":".agents/deute/.rutes-deute.json","bytes":3718,"linies":45,"sha256":"bb4e3c48ca1b7ebb7b50f2fe81e3dab88b45b20637445f01a33049b1dad7d622"},{"ruta":".agents/deute/.teixit-deute.json","bytes":139,"linies":10,"sha256":"2d2148bda937b5e7ee98c62b83c0feb0bc7283410a768547141507b5fb1fc82a"},{"ruta":".agents/deute/.vocabulari-deute.json","bytes":27392,"linies":346,"sha256":"f3764df432004aea5ad1b97a6aeec4f7f98cdd593eff7f2ccd829a283cd892e7"},{"ruta":"scripts/immunitari/cron/placa_tick.mjs","bytes":2675,"linies":83,"sha256":"fa6aa305a29e4e098d936a93af403fac4cc67b79849da69e4e0771d734534d15"},{"ruta":"scripts/immunitari/cron/pressupost.mjs","bytes":1482,"linies":48,"sha256":"07f188504878b80c23497becfadf19c99abe639c7b054eadb3eaf798c9c0dff7"},{"ruta":"scripts/immunitari/plaquetes.mjs","bytes":14746,"linies":395,"sha256":"19e24ad0ba4e97638e893f8c9edd040c4b46cf4536fb3234bc298e5ac79f2b03"},{"ruta":"src/host.js","bytes":12364,"linies":290,"sha256":"e335a52a8b74508a148a70b9063338761809e3d644ccb1c9f2b0f4c40511dae8"},{"ruta":"src/sections/xat/retall.js","bytes":4037,"linies":92,"sha256":"22741ea97c5a395ca414aa49350ec5e9c3d3b98d59b4c33ee689cda8e4b859e1"},{"ruta":"src/sections/xat/XatContext.jsx","bytes":15555,"linies":453,"sha256":"447a7785cc2a0bd23d231cbbfc78ffc7671676ddd97f311e4278bb134ea8f020"},{"ruta":"src/sections/xat/XatControlSection.jsx","bytes":1881,"linies":58,"sha256":"118bd6f155f758bfea0ce04702ff8faeeb896e8f10fcff80b87aa2ae35d41251"},{"ruta":"src/sections/xat/XatSection.jsx","bytes":20746,"linies":539,"sha256":"98c1993563a78ac5f6fefe265ddc7a146df19c6a522c1d461ed81fa7dfc31136"},{"ruta":"src/sections/xat/XatSection.test.jsx","bytes":3502,"linies":82,"sha256":"6f48d1083a31ce3788706e72fb44ab514327792f2f7d6600bd701e878cafa59b"},{"ruta":"supabase/migrations/260908_0000_initial_schema.sql","bytes":31938,"linies":871,"sha256":"997447ff59ffe7c1fb21867cedbe8939546a787d65d8748461299a3712d99381"},{"ruta":"supabase/migrations/260908_xat_v2_correccions.sql","bytes":17925,"linies":420,"sha256":"f9d27a02023f99d79dc233cfd88bab9a600ef525005e9c265d368d1452a8f8c6"},{"ruta":"supabase/migrations/260908_xat_v2_membres.sql","bytes":6363,"linies":136,"sha256":"5e5a0268668186fadb5a7bf500920c2fcbc2e675b9a9a68b3a25ccdc56dcf475"},{"ruta":"supabase/migrations/260908_xat_v2.sql","bytes":5466,"linies":137,"sha256":"754af9ba015a231a3e4220edf71a2081ce895c8ec32ba30e5e08907a4e2a7c0c"},{"ruta":"supabase/migrations/260911_0600_perfil_avatar_i_permisos.sql","bytes":2116,"linies":35,"sha256":"77a4dbd22c7d526217f5473260091d0c7c00032baa15f360346afd56aab2bd24"},{"ruta":"supabase/migrations/260912_1500_correccio_privacitat_perfils.sql","bytes":1910,"linies":37,"sha256":"41714ef340be38963aa5816a90022f1aa211252341e64ca49a25c2b4dc81bb0a"},{"ruta":"supabase/migrations/260912_admin_panel.sql","bytes":2170,"linies":68,"sha256":"6e725056d3d22e7fc3aa3a862e07d6216c0a95e8a2bc5d82c3a4e054e87f0eb4"},{"ruta":"supabase/migrations/260913_0500_bucket_mitjans.sql","bytes":2060,"linies":37,"sha256":"b38311d9710e75470bf3c4752b8b4dd1b4e7153380233fcaf006a955b5298252"},{"ruta":"supabase/migrations/260914_0000_schema_notes.sql","bytes":3433,"linies":87,"sha256":"db20ef36f4f2b25b72b55eb31f33c49dba2c980de70d810eb106648b2087986f"},{"ruta":"supabase/migrations/260914_0100_auditoria_rls_fixes.sql","bytes":4763,"linies":122,"sha256":"fa8a243f7deaa2b352995f0674ea38b06d3e2ee0a6f18dd9d52428acec2da36a"},{"ruta":"supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql","bytes":4914,"linies":125,"sha256":"4cd50860cbcda7876e10731851a9d95254c6b9e29d9697770038b8d61129dda4"},{"ruta":"supabase/migrations/260915_0130_fix_rls_profiles.sql","bytes":717,"linies":10,"sha256":"e473610c2fa0d155d67d38f2a66ad3542f7c3206102a56144e961ce754b0b91e"}]}
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
  "generat": "2026-09-14T22:03:53.369Z",
  "max": {
    "orfes": 20,
    "penjats": 155,
    "illes": 13,
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

## Fitxer: scripts/immunitari/cron/placa_tick.mjs

```
#!/usr/bin/env node
/**
 * placa_tick.mjs - El motor CRON Oneshot per a Plaquetes v2
 * 
 * Invoca el motor de Plaquetes en mode desatès si:
 * 1. El repositori està net (sense canvis sense commitejar).
 * 2. No hi ha cap altre CRON bloquejant l'execució.
 * 3. El pressupost energètic ho permet.
 */
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { Pressupost } from './pressupost.mjs';

const REPO_ROOT = process.cwd();
const IMMUNITARI_DIR = path.join(REPO_ROOT, '.immunitari');
const LOCK_FILE = path.join(IMMUNITARI_DIR, 'cron.lock');
const PLAQUETES_BIN = path.join(REPO_ROOT, 'scripts', 'immunitari', 'plaquetes.mjs');

// 1. Assegurar directoris base
if (!fs.existsSync(IMMUNITARI_DIR)) {
  fs.mkdirSync(IMMUNITARI_DIR, { recursive: true });
}

// 2. Control de single-flight (Lockfile)
if (fs.existsSync(LOCK_FILE)) {
  const lockData = fs.statSync(LOCK_FILE);
  const now = Date.now();
  // Si el lock té més de 10 minuts, el considerem mort i l'alliberem
  if (now - lockData.mtimeMs > 600000) {
    console.warn("⚠️ Lockfile antic detectat. Alliberant i forçant l'execució.");
    fs.unlinkSync(LOCK_FILE);
  } else {
    console.log("🔒 Trobada execució en curs. El CRON avorta.");
    process.exit(0);
  }
}

// 3. Guàrdia Arbre Net (Gemini)
function arbreNet() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
    return status === '';
  } catch (e) {
    return false;
  }
}

if (!arbreNet()) {
  console.log("🛑 Mestre treballant (Arbre Git brut). El CRON s'atura.");
  process.exit(0);
}

// Establim lock
fs.writeFileSync(LOCK_FILE, JSON.stringify({ pid: process.pid, ts: Date.now() }));

// Creem el pressupost del tick actual
const pressupost = new Pressupost({
  max_ms_per_tick: 60000 // Li donem 1 minut màxim al procés sencer
});

try {
  console.log("🚀 Iniciant Tick CRON (Plaquetes v2)...");
  // Executem Plaquetes delegant el comportament autònom (L0/L1)
  // i usant el mateix procés per compartir la memòria
  const out = execSync(`node "${PLAQUETES_BIN}" diagnostic --autonom`, { encoding: 'utf8' });
  console.log(out);
  
  // Ací recolliríem les mètriques d'execució, però plaquetes.mjs
  // ja s'encarrega d'escriure al seu propi journal.ndjson
  console.log("✅ Tick finalitzat dins del pressupost:", pressupost.report());
} catch (e) {
  console.error("❌ Fallada en el Tick CRON:", e.message);
  if (e.stdout) console.log(e.stdout);
  if (e.stderr) console.error(e.stderr);
  process.exitCode = 1;
} finally {
  // Sempre alliberar el lock
  if (fs.existsSync(LOCK_FILE)) {
    fs.unlinkSync(LOCK_FILE);
  }
}
```
<<<FI_FITXER>>>

## Fitxer: scripts/immunitari/cron/pressupost.mjs

```
/**
 * Gestor de Pressupost Energètic per a Plaquetes v2 (CRON)
 * Controla que l'execució d'un tick no desborde els límits permesos (fail-closed).
 */

export class Pressupost {
  constructor(config = {}) {
    // S'ha eliminat 'max_ops_per_tick' seguint el diagnòstic del Consell (Test d'Estrès).
    // Això permetrà a la L3 esborrar milers de fotos si l'API de Supabase respon ràpidament.
    this.max_bytes_per_tick = config.max_bytes_per_tick || 10485760; // 10MB
    this.max_ms_per_tick = config.max_ms_per_tick || 30000; // 30 segons
    
    this.consum = {
      ops: 0,
      bytes: 0,
      ms_inici: Date.now()
    };
  }

  // Verifica si es pot executar una op de determinat pes
  potExecutar(bytes = 0) {
    const elapsed = Date.now() - this.consum.ms_inici;
    if (elapsed > this.max_ms_per_tick) {
      return { permès: false, rao: `Temps excedit (${elapsed}ms > ${this.max_ms_per_tick}ms)` };
    }
    
    if (this.consum.bytes + bytes > this.max_bytes_per_tick) {
      return { permès: false, rao: `Volum de bytes excedit (${this.consum.bytes + bytes} > ${this.max_bytes_per_tick})` };
    }

    return { permès: true };
  }

  // Registra el cost de l'operació realitzada
  registraOperacio(bytes = 0) {
    this.consum.ops++;
    this.consum.bytes += bytes;
  }

  // Retorna l'estat actual per fer-ne un log al journal
  report() {
    return {
      ...this.consum,
      ms_transcorreguts: Date.now() - this.consum.ms_inici
    };
  }
}
```
<<<FI_FITXER>>>

## Fitxer: scripts/immunitari/plaquetes.mjs

````
#!/usr/bin/env node
/**
 * plaquetes.mjs v1.1 - Sistema Immunitari de Sóc de Poble
 * Diagnòstic, quarantena i curació de fantasmes i orfes.
 */
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import readline from 'readline';

const args = process.argv.slice(2);
const REPO_ROOT = process.cwd();
const IMMUNITARI_DIR = path.join(REPO_ROOT, '.immunitari');
const CONFIG_PATH = path.join(IMMUNITARI_DIR, 'config.json');
const RECEPTES_DIR = path.join(IMMUNITARI_DIR, 'receptes');
const APROVACIONS_DIR = path.join(IMMUNITARI_DIR, 'aprovacions');
const QUARANTENA_DIR = path.join(IMMUNITARI_DIR, 'quarantena');
const JOURNAL_PATH = path.join(IMMUNITARI_DIR, 'journal.ndjson');
const BASELINE_PATH = path.join(IMMUNITARI_DIR, 'baseline.json');
const SCRIPTS_DIR = path.join(REPO_ROOT, 'scripts', 'immunitari');

const IS_AUTONOM = args.includes('--autonom') || process.env.PLAQUETES_AUTONOM;
if (IS_AUTONOM) {
  console.log("🤖 PLAQUETES V2: Mode Autònom Activat. Només s'executaran tasques L0 i L1.");
}

const REGISTRE_TASQUES_PATH = path.join(REPO_ROOT, '.agents', 'cron', 'registre_tasques.json');
let registreTasques = { plaquetes: [] };
if (fs.existsSync(REGISTRE_TASQUES_PATH)) {
  registreTasques = JSON.parse(fs.readFileSync(REGISTRE_TASQUES_PATH, 'utf8'));
}

function getNivell(idTasca) {
  const tasca = registreTasques.plaquetes.find(t => t.id === idTasca);
  return tasca ? tasca.nivell : 'L3'; // Fall-closed: Si no existeix, màxim risc (L3)
}

function assegura(targetPath) {
  const rp = path.resolve(targetPath);
  if (rp.includes(SCRIPTS_DIR) || rp.includes(path.join(REPO_ROOT, '.git'))) {
    console.error(`🩸 LÍNIA ROJA R4: Escriptura vetada a ${targetPath}`);
    process.exit(2);
  }
}

function escriuAtomic(targetPath, content) {
  assegura(targetPath);
  const tmpPath = targetPath + '.plaquetes.tmp';
  fs.writeFileSync(tmpPath, content, 'utf8');
  fs.renameSync(tmpPath, targetPath);
}

function runGit(cmd) {
  try {
    return execSync(`git ${cmd}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  } catch (e) {
    console.error(`Error de git: git ${cmd}`);
    process.exit(1);
  }
}

function arbreNet() {
  try {
    return execSync('git status --porcelain', { encoding: 'utf8' }).trim() === '';
  } catch (e) {
    return false;
  }
}

const cmd = args[0] || 'diagnostic';

if (cmd === 'init') {
  if (!fs.existsSync(IMMUNITARI_DIR)) fs.mkdirSync(IMMUNITARI_DIR, { recursive: true });
  if (!fs.existsSync(RECEPTES_DIR)) fs.mkdirSync(RECEPTES_DIR, { recursive: true });
  if (!fs.existsSync(APROVACIONS_DIR)) fs.mkdirSync(APROVACIONS_DIR, { recursive: true });
  if (!fs.existsSync(QUARANTENA_DIR)) fs.mkdirSync(QUARANTENA_DIR, { recursive: true });

  const defaultConfig = {
    vault: "_wiki_de_poble",
    ignoraObjectius: ["00_AGENTS_I_SKILLS_MIRROR"],
    exclouFonts: ["00_AGENTS_I_SKILLS_MIRROR"],
    hubsTaxonomics: ["Graf", "Maquina", "Identitat", "Coneixement", "Govern", "Sollutia", "07_plantilles", "skills"],
    hubsDelegats: true,
    indexAdopcio: "00_INDEX",
    memorialLapides: "00_MEMORIAL_Lapides"
  };
  
  if (!fs.existsSync(CONFIG_PATH)) {
    escriuAtomic(CONFIG_PATH, JSON.stringify(defaultConfig, null, 2));
  }
  
  const gitignorePath = path.join(IMMUNITARI_DIR, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    escriuAtomic(gitignorePath, "journal.ndjson\n");
  }
  console.log("🩸 Sistema Immunitari inicialitzat a .immunitari/");
  process.exit(0);
}

const config = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
const vaultDir = path.join(REPO_ROOT, config.vault);

function extreuFantasmes(content) {
  const linkRegex = /\[\[(.*?)\]\]/g;
  let matches = [];
  let match;
  const net = content.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
  while ((match = linkRegex.exec(net)) !== null) {
    let raw = match[1];
    if (raw.includes('|')) raw = raw.split('|')[0];
    if (raw.includes('#')) raw = raw.split('#')[0];
    if (raw.trim() && !raw.startsWith('http')) matches.push(raw.trim());
  }
  return matches;
}

function llistaFitxers(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (let file of list) {
    if (file.startsWith('.')) continue;
    const p = path.join(dir, file);
    const stat = fs.statSync(p);
    if (stat && stat.isDirectory()) {
      results = results.concat(llistaFitxers(p));
    } else if (file.endsWith('.md')) {
      results.push(p);
    }
  }
  return results;
}

function llistaBrossa(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (let file of list) {
    if (file.startsWith('.')) continue;
    const p = path.join(dir, file);
    const stat = fs.statSync(p);
    if (stat && stat.isDirectory()) {
      results = results.concat(llistaBrossa(p));
    } else {
      if (file.endsWith('.zip')) {
        results.push(p);
      } else if (file.endsWith('.mjs') && (p.includes('quarantena') || p.includes('Bandeja_d_Entrada'))) {
        results.push(p);
      } else if (file.endsWith('.json') && p.includes('quarantena')) {
        results.push(p);
      } else if (file === 'metadata_schema.json' && p.includes('03_GOVERNAR')) {
        results.push(p);
      }
    }
  }
  return results;
}

if (cmd === 'diagnostic') {
  console.log("🩸 Rastrejant el graf...");
  const isPorta = args.includes('--porta');
  const fitxers = llistaFitxers(vaultDir);
  
  const basenames = new Set();
  fitxers.forEach(f => basenames.add(path.basename(f, '.md').toLowerCase()));
  
  let fantasmes = [];
  let referits = new Set();

  fitxers.forEach(f => {
    if (config.exclouFonts.some(exc => f.includes(exc))) return;
    const links = extreuFantasmes(fs.readFileSync(f, 'utf8'));
    
    links.forEach(l => {
      referits.add(l.toLowerCase());
      if (!basenames.has(l.toLowerCase()) && !fs.existsSync(path.join(REPO_ROOT, l))) {
        fantasmes.push({ font: f, objectiu: l });
      }
    });
  });

  let orfes = [];
  let buits = [];
  fitxers.forEach(f => {
    const cont = fs.readFileSync(f, 'utf8').trim();
    if (cont === '') {
      buits.push(f);
      return;
    }
    const base = path.basename(f, '.md').toLowerCase();

    if (!referits.has(base) && 
        base !== config.indexAdopcio.toLowerCase() && 
        base !== config.memorialLapides.toLowerCase() &&
        !config.ignoraObjectius.some(ign => f.includes(ign))) {
      orfes.push(f);
    }
  });
  
  const brossa = llistaBrossa(vaultDir);
  buits = buits.concat(brossa);

  if (isPorta) {
    if (!fs.existsSync(BASELINE_PATH)) {
      console.error("🩸 Error: no hi ha baseline segellada. Executa 'segella' primer.");
      process.exit(1);
    }
    const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
    const totalFerides = fantasmes.length + orfes.length;
    if (totalFerides > baseline.ferides) {
      console.error(`🩸 PORTA TANCADA: S'han detectat ${totalFerides} ferides noves (baseline: ${baseline.ferides}).`);
      process.exit(1);
    } else {
      console.log(`🩸 PORTA OBERTA: El Mas respira (${totalFerides} ferides totals).`);
      process.exit(0);
    }
  }

  const ops = [];
  let idC = 1;
  const genId = () => `OP-${String(idC++).padStart(3, '0')}`;
  
  const perFont = {};
  fantasmes.forEach(f => {
    if (!perFont[f.font]) perFont[f.font] = [];
    perFont[f.font].push(f.objectiu);
  });
  
  for (const [font, objs] of Object.entries(perFont)) {
    const objectiusUnics = [...new Set(objs)];
    const filtrats = objectiusUnics.filter(o => !(config.hubsDelegats && config.hubsTaxonomics.includes(o)));
    if (filtrats.length > 0) {
      ops.push({
        id: genId(),
        tipus: "LAPIDA",
        fitxer: path.relative(REPO_ROOT, font),
        objectius: filtrats,
        hashFont: crypto.createHash('sha256').update(fs.readFileSync(font)).digest('hex')
      });
    }
  }

  orfes.forEach(o => {
    ops.push({
      id: genId(),
      tipus: "ADOPTA",
      fitxer: path.relative(REPO_ROOT, o)
    });
  });

  buits.forEach(b => {
    ops.push({
      id: genId(),
      tipus: "DESTRUEIX",
      fitxer: path.relative(REPO_ROOT, b)
    });
  });

  if (ops.length === 0) {
    console.log("🩸 El Mas respira. Zero operables.");
    process.exit(0);
  }

  const recepta = { id: `R-${Date.now()}`, data: new Date().toISOString(), operacions: ops };
  const receptaId = `${Date.now()}_RECEPTA`;
  escriuAtomic(path.join(RECEPTES_DIR, `${receptaId}.json`), JSON.stringify(recepta, null, 2));
  console.log(`🩸 Recepta ${receptaId} generada amb ${ops.length} operacions.`);
  process.exit(0);
}

if (cmd === 'aprova') {
  const receptaId = args[1];
  if (!receptaId) { console.error("🩸 Necessites un ID de recepta."); process.exit(1); }
  const rPath = path.join(RECEPTES_DIR, `${receptaId}.json`);
  if (!fs.existsSync(rPath)) { console.error("🩸 Recepta no trobada."); process.exit(1); }
  
  const cont = fs.readFileSync(rPath, 'utf8');
  const fullHash = crypto.createHash('sha256').update(cont).digest('hex');
  const shortHash = fullHash.substring(0, 12);
  
  console.log(`Has de signar mecànicament introduint els primers 12 caràcters del hash: ${shortHash}`);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question('Confirma el hash: ', (resposta) => {
    if (resposta.trim() === shortHash) {
      const aprov = { recepta: receptaId, hash: fullHash, data: new Date().toISOString() };
      escriuAtomic(path.join(APROVACIONS_DIR, `${receptaId}.aprovat.json`), JSON.stringify(aprov, null, 2));
      console.log("🩸 Aprovació segellada mecànicament.");
    } else {
      console.error("🩸 Hash incorrecte. Aprovació denegada.");
    }
    rl.close();
  });
}

if (cmd === 'aplica') {
  const receptaId = args[1];
  if (!arbreNet()) { console.error("🩸 LÍNIA ROJA R2: L'arbre git no està net."); process.exit(2); }
  const aPath = path.join(APROVACIONS_DIR, `${receptaId}.aprovat.json`);
  if (!fs.existsSync(aPath)) { console.error("🩸 Falta aprovació."); process.exit(1); }
  
  const recepta = JSON.parse(fs.readFileSync(path.join(RECEPTES_DIR, `${receptaId}.json`), 'utf8'));
  const memPath = path.join(vaultDir, `${config.memorialLapides}.md`);
  const indexPath = path.join(vaultDir, `${config.indexAdopcio}.md`);

  recepta.operacions.forEach(op => {
    const fPath = path.join(REPO_ROOT, op.fitxer);
    
    if (op.tipus === 'LAPIDA') {
      const currentHash = crypto.createHash('sha256').update(fs.readFileSync(fPath)).digest('hex');
      if (currentHash !== op.hashFont) { console.warn(`🩸 Saltant ${op.id} - mutat.`); return; }
      
      let txt = fs.readFileSync(fPath, 'utf8');
      op.objectius.forEach(obj => {
        if (op.fitxer.includes('INDEX')) {
          const regex = new RegExp(`\\[\\[${obj}(?:\\|[^\\]]+)?\\]\\]`);
          txt = txt.split('\n').filter(line => !regex.test(line) && !line.includes(`[[${config.memorialLapides}#${obj}|`)).join('\n');
        } else {
          txt = txt.split(`[[${obj}]]`).join(`[[${config.memorialLapides}#${obj}|${obj} †]]`);
        }
      });
      escriuAtomic(fPath, txt);
      
      const memPath = path.join(vaultDir, `${config.memorialLapides}.md`);
      let memContent = fs.existsSync(memPath) ? fs.readFileSync(memPath, 'utf8') : '# Memorial de Llàpides\n\n';
      op.objectius.forEach(obj => {
        memContent += `- [${new Date().toISOString()}] Enllaç tancat a ${op.fitxer} (apuntava a: ${obj})\n`;
      });
      escriuAtomic(memPath, memContent);
      runGit(`add "${fPath}" "${memPath}"`);
      const msgFile = path.join(REPO_ROOT, '.git', 'COMMIT_MSG_PLAQUETES');
      fs.writeFileSync(msgFile, `[PLAQUETES ${op.id}] LAPIDA: ${op.objectius.join(', ')}`);
      runGit(`commit --no-verify -F "${msgFile}"`);
      fs.unlinkSync(msgFile);
    }
    
    if (op.tipus === 'ADOPTA') {
      const indexPath = path.join(vaultDir, `${config.indexAdopcio}.md`);
      let idxContent = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : `# ${config.indexAdopcio}\n\n`;
      if (!idxContent.includes("## Adopcions de Les Plaquetes")) idxContent += "\n## Adopcions de Les Plaquetes\n";
      idxContent += `- [[${path.basename(op.fitxer, '.md')}]]\n`;
      escriuAtomic(indexPath, idxContent);
      runGit(`add "${indexPath}"`);
      const msgFile = path.join(REPO_ROOT, '.git', 'COMMIT_MSG_PLAQUETES');
      fs.writeFileSync(msgFile, `[PLAQUETES ${op.id}] ADOPTA: ${op.fitxer}`);
      runGit(`commit --no-verify -F "${msgFile}"`);
      fs.unlinkSync(msgFile);
    }
    
    if (op.tipus === 'DESTRUEIX') {
      const qPath = path.join(QUARANTENA_DIR, path.basename(op.fitxer) + '.' + Date.now() + '.quarantena');
      fs.renameSync(fPath, qPath);
      runGit(`add "${fPath}"`);
      const msgFile = path.join(REPO_ROOT, '.git', 'COMMIT_MSG_PLAQUETES');
      fs.writeFileSync(msgFile, `[PLAQUETES ${op.id}] DESTRUEIX (Quarantena): ${op.fitxer}`);
      runGit(`commit --no-verify -F "${msgFile}"`);
      fs.unlinkSync(msgFile);
    }
    
    const jEntry = JSON.stringify({ op: op.id, tipus: op.tipus, fitxer: op.fitxer, data: new Date().toISOString() }) + "\n";
    fs.appendFileSync(JOURNAL_PATH, jEntry);
  });
  console.log("🩸 Operacions aplicades i versionades.");
}

if (cmd === 'reversa') {
  const opId = args[1];
  try {
    const sha = runGit(`log --grep="\\[PLAQUETES ${opId}\\]" --format="%H" -n 1`);
    if (!sha) throw new Error("No trobat");
    runGit(`revert --no-edit ${sha}`);
    console.log(`🩸 Reversa quirúrgica de ${opId} completada.`);
  } catch (e) {
    console.error(`🩸 Error revertint ${opId}. Arbre net?`);
  }
}

if (cmd === 'segella') {
  const fitxers = llistaFitxers(vaultDir);
  const basenames = new Set();
  fitxers.forEach(f => basenames.add(path.basename(f, '.md').toLowerCase()));
  let ferides = 0; let referits = new Set();
  fitxers.forEach(f => {
    if (config.exclouFonts.some(exc => f.includes(exc))) return;
    const links = extreuFantasmes(fs.readFileSync(f, 'utf8'));
    links.forEach(l => { referits.add(l.toLowerCase()); if (!basenames.has(l.toLowerCase()) && !fs.existsSync(path.join(REPO_ROOT, l))) ferides++; });
  });
  fitxers.forEach(f => {
    const base = path.basename(f, '.md').toLowerCase();
    if (!referits.has(base) && base !== config.indexAdopcio.toLowerCase() && base !== config.memorialLapides.toLowerCase() && !config.ignoraObjectius.some(ign => f.includes(ign))) ferides++;
  });
  escriuAtomic(BASELINE_PATH, JSON.stringify({ ferides, data: new Date().toISOString() }));
  console.log(`🩸 Baseline segellada amb ${ferides} ferides legals.`);
}
````
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
  if (fase === FASE.SEGELLAT && !force) {
    throw new Error(
      "[host] Ja s'ha cridat arrenca(): el backend està segellat. "
      + 'Crida configura() abans d\'arrenca(), o empra { force: true } si estàs segur d\'allò que fas.',
    );
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
    const injectatOriginal = { ...getBackendImplementation() };
    const pendentsNucli = CONTRACTE_NUCLI.filter((k) => !injectats.includes(k));

    if (pendentsNucli.length > 0) {
      if (injectats.length > 0) {
        console.warn(`[host] Injecció parcial detectada. Mètodes coberts: ${injectats.join(', ')}. Es carregaran els absents des de Supabase com a fallback: ${pendentsNucli.join(', ')}.`);
        const supabaseImpl = await import('./data/supabase/index.js');
        const hibrid = { ...supabaseImpl };
        // L'implementació injectada té prioritat sobre Supabase
        for (const k of injectats) hibrid[k] = injectatOriginal[k];
        setBackendImplementation(hibrid);
      } else {
        // Només importem Supabase si falten mètodes del nucli i NO S'HA INJECTAT RES
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

  const api = Object.freeze({ configura, arrenca, arrencaAuto, deferArrenca, estat, CONTRACTE_BACKEND, injectaSessio, expulsaSessio, isReady: true });
  Object.defineProperty(objectiu, 'SocDePoble', { value: api, writable: false, configurable: false });
  
  // Avisar a Sollutia o qualsevol integrador que l'API ja està llesta
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('socdepoble-ready', { detail: api }));
  }
  
  return api;
}
```
<<<FI_FITXER>>>

## Fitxer: src/sections/xat/retall.js

```
/**
 * retall.js — l'objecte de transport entre el Xat i el Bloc de Notes.
 *
 * PER QUÈ VIU FORA DE XatSection.jsx: convertir missatges en una nota és una
 * transformació pura, sense React ni estat. Ací es pot llegir, raonar i provar
 * sense muntar mig arbre de components.
 *
 * SENSE DEPENDÈNCIES NOVES. Només `sanitize.js`, que ja és al projecte.
 */
import { sanitizeHtml, netejaText } from '../../utils/sanitize.js';

const ESCAPADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/**
 * ESCAPAR NO ÉS SANEJAR, I L'ORDRE NO ÉS NEGOCIABLE.
 *
 * El text d'un missatge l'ha escrit una altra persona. Si es concatena cru dins
 * d'HTML, tens XSS emmagatzemat servit per l'editor de notes.
 *
 * I no es pot resoldre passant el text per DOMPurify: `sanitizeHtml` sobre text
 * pla destrossa «l'aigua < 5 litres» (vegeu l'avís de netejaText a sanitize.js).
 * Escapant PRIMER, `&lt;` ja és una entitat vàlida i travessa DOMPurify sencera.
 * Escapa → construïx → saneja. Mai a l'inrevés.
 */
function escapa(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ESCAPADES[c]);
}

/** 'Jo' per als propis; per als altres, el primer nom que el missatge porte. */
function autorDe(missatge) {
  if (missatge.sender === 'me') return 'Jo';
  return missatge.author || missatge.author_name || missatge.sender_name || 'Veí';
}

/**
 * ORDRE DE PREFERÈNCIA CORREGIT (260908). `time_label` ara SÍ que arriba, i val
 * "14:32" per als missatges de hui. Si es llegira primer, el retall guardat al
 * Bloc de Notes perdria el dia: dins d'una nota, «14:32» tot sol no diu res.
 * Primer la data completa; l'etiqueta és l'últim recurs.
 */
function horaDe(missatge, locale) {
  const brut = missatge.creatAl ?? missatge.createdAtTs ?? missatge.time ?? missatge.time_label ?? null;
  if (!brut) return '';
  const data = new Date(brut);
  if (Number.isNaN(data.getTime())) return String(brut);
  return data.toLocaleString(locale, {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit'
  });
}

/**
 * Construïx la nota a partir dels missatges triats.
 *
 * @param {object}   opcions
 * @param {object}   opcions.fil        Fil actiu (per al títol).
 * @param {object[]} opcions.missatges  Missatges triats, JA en ordre cronològic.
 * @param {string}   opcions.locale     'ca-ES' o 'es-ES'.
 * @returns {{title: string, folderId: string, content: string}}
 */
export function construeixRetall({ fil, missatges, locale = 'ca-ES' }) {
  const nomFil = fil?.name || fil?.title || 'Conversa';
  const quants = missatges.length;

  /* El títol acaba a `titleHtml` d'UniversalEditorShell, o siga que viatja com
     a HTML: el nom del fil el pot haver escrit un altre usuari i va escapat. */
  const title = netejaText(`Retall de «${escapa(nomFil)}»`, 160);

  const capcalera =
    `<p><em>${escapa(nomFil)} · ${quants} missatge${quants === 1 ? '' : 's'} · `
    + `retallat el ${escapa(new Date().toLocaleDateString(locale, { day: '2-digit', month: 'long', year: 'numeric' }))}</em></p>`;

  const cos = missatges.map((m) => {
    const hora = horaDe(m, locale);
    const text = escapa(m.text ?? m.content ?? '').replace(/\n/g, '<br />');
    const signatura = hora ? `${escapa(autorDe(m))} · ${escapa(hora)}` : escapa(autorDe(m));
    return `<blockquote><p><strong>${signatura}</strong><br />${text}</p></blockquote>`;
  }).join('\n');

  /* Segona barrera. El contingut ja està escapat; DOMPurify només confirma que
     l'estructura que hem muntat nosaltres és la que dèiem que era.
     `createNote` NO saneja res al backend (P1 anotat): aquesta és l'única
     defensa del camí de creació. */
  return {
    title,
    /* 'f-notes' («Altres notes») existix al catàleg de noteFolders. El
       'general' per defecte de createNote NO existix i faria desaparéixer el
       retall en tocar qualsevol carpeta de la barra lateral (P0-4). */
    folderId: 'f-notes',
    content: sanitizeHtml(`${capcalera}\n${cos}`)
  };
}
```
<<<FI_FITXER>>>

## Fitxer: src/sections/xat/XatContext.jsx

```
/**
 * XatContext.jsx — Fase 4. L'estat del xat contra el backend real.
 *
 * QUÈ HA DESAPAREGUT I PER QUÈ
 * ────────────────────────────
 *   · `loadXat(actorId, config)` → `loadFils` + `loadMissatges` per fil. Abans
 *     es demanaven 500 missatges de tot el poble en cada arrencada.
 *   · `appendChatMessages` → `enviaMissatge`.
 *   · L'`actorId` d'IdentitatContext ja NO és la identitat del xat. A les rutes
 *     /e/:slug/* eixe valor és un SLUG, no un uuid: comparar-lo amb `usuari_id`
 *     marcava TOTS els missatges com a 'other', inclosos els teus.
 *     La identitat del xat és `getCurrentUser().id` i prou.
 *
 * PER QUÈ AÇÒ MAI TORNA status:'error'
 * ────────────────────────────────────
 * AppDataLoader (App.jsx) pinta <LoadError/> per a tot el portal si
 * `xat.status === 'error'`. Amb l'esquema del xat sense aplicar, `loadFils`
 * llança i el Mur, el Mercat i les Notes cauen amb ell. Un mòdul no pot tombar
 * la casa: l'error del xat es queda dins del xat, a `avis`.
 *
 * REALTIME
 * ────────
 * No n'hi ha. Les taules del xat no estan a la publicació `supabase_realtime`,
 * així que una subscripció no donaria error i no rebria res mai. Ací hi ha
 * sondeig adaptatiu: s'atura amb la pestanya amagada i es desperta en tornar.
 * És el que aguanta una connexió de muntanya sense cremar bateria.
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  loadFils,
  loadMissatges,
  enviaMissatge,
  marcaLlegit,
  creaFilDirecte,
  carregaMembres,
  getCurrentUser
} from '../../data/backendPort.js';
import { subscribeToTable, unsubscribe } from '../../data/supabase/realtime.js';

const XatContext = createContext(null);

/* Sondeig. El fil obert va per WebSocket (Realtime); la llista, lenta. */
const MS_LLISTA = 25000;
const LOCALE = 'ca-ES';

const BUIT = {
  status: 'loading',
  error: null,
  avis: null,
  chatThreads: [],
  chatMessages: [],
  filActiu: null,
  getThreadMessages: () => [],
  sendChatMessage: async () => {},
  obriFil: () => {},
  creaFil: async () => { throw new Error('El xat encara no ha carregat.'); },
  cercaMembres: async () => [],
  recarrega: () => {}
};

/* ─────────────────────────── Etiquetes d'hora ─────────────────────────── */

const DIA_MS = 86400000;

function inici(data) {
  const d = new Date(data);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** "14:32" · "Ahir" · "dimarts" · "04/09/26" — el que pinta la barra lateral. */
function etiquetaLlista(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const dies = Math.round((inici(Date.now()) - inici(d)) / DIA_MS);
  if (dies <= 0) return d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
  if (dies === 1) return 'Ahir';
  if (dies < 7) return d.toLocaleDateString(LOCALE, { weekday: 'long' });
  return d.toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/** "14:32" hui; "04/09 · 14:32" abans. Va davall de cada bombolla. */
function etiquetaBombolla(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const hora = d.toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });
  if (inici(d) === inici(Date.now())) return hora;
  return `${d.toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit' })} · ${hora}`;
}

/* ─────────────────────────────── Mapeig ─────────────────────────────── */

/**
 * Del fil del backend a l'objecte que ja llig XatSection.
 * `name`, `lastMessagePreview` i `lastMessageTime` són els noms que la barra
 * lateral esperava des del primer dia i mai rebia.
 */
function mapejaFil(fil) {
  const nom = fil.titol
    || (fil.altresNoms.length ? fil.altresNoms.join(', ') : 'Conversa');
  return {
    id: fil.id,
    title: nom,
    name: nom,
    type: 'directe',
    avatar_url: null,
    lastMessagePreview: fil.ultimText || 'Cap missatge.',
    lastMessageTime: etiquetaLlista(fil.ultimAl || fil.actualitzatAl),
    noLlegits: fil.noLlegits,
    createdAtTs: fil.actualitzatAl ? new Date(fil.actualitzatAl).getTime() : 0
  };
}

/** Del missatge del backend a la bombolla. `joId` decidix el costat. */
function mapejaMissatge(m, joId) {
  const meu = m.usuariId === joId;
  return {
    id: m.id,
    threadId: m.filId,
    usuariId: m.usuariId,
    text: m.text,
    sender: meu ? 'me' : 'other',
    author: meu ? 'Jo' : (m.autorNom || 'Veí'),
    is_ai: Boolean(m.esIA),
    creatAl: m.creatAl,
    createdAtTs: m.creatAl ? new Date(m.creatAl).getTime() : 0,
    time_label: etiquetaBombolla(m.creatAl),
    estatEnviament: 'enviat'
  };
}

/* ─────────────────────────────── Provider ─────────────────────────────── */

export function XatProvider({ children, config }) {
  /* `config` viu a una ref perquè els efectes depenguen només de primitives.
     Si va a l'array de dependències i el pare el recrea, el sondeig es reinicia
     en cada render. */
  const configRef = useRef(config);
  configRef.current = config;

  const usuari = getCurrentUser();
  const joId = usuari?.id || null;

  const [fils, setFils] = useState([]);
  const [estat, setEstat] = useState('loading');
  const [avis, setAvis] = useState(null);
  const [filActiu, setFilActiu] = useState(null);
  const [missatgesPerFil, setMissatgesPerFil] = useState({});

  const genFils = useRef(0);
  const genMissatges = useRef(0);

  /* ── Llista de fils ── */
  const carregaFils = useCallback(async () => {
    const meua = ++genFils.current;
    if (!joId) {
      setFils([]);
      setEstat('ready');
      return;
    }

    try {
      const bruts = await loadFils(configRef.current);
      if (meua !== genFils.current) return;
      setFils(bruts.map(mapejaFil));
      setAvis(null);
      return true;
    } catch (error) {
      if (meua !== genFils.current) return false;
      /* No es propaga a `status`. Vegeu la capçalera del fitxer. */
      setAvis(error?.message || 'No s\'han pogut carregar les converses.');
      setFils([]);
      return false;
    } finally {
      if (meua === genFils.current) setEstat('ready');
    }
  }, [joId]);

  /* ── Missatges d'un fil ── */
  const carregaMissatges = useCallback(async (filId) => {
    if (!filId) return;
    const meua = ++genMissatges.current;
    
    if (!joId) return;

    if (String(filId).startsWith('mock-fil-')) {
      // És un fil de mentira (beta testers) creat en local per a un usuari registrat
      setMissatgesPerFil((previs) => ({ ...previs, [filId]: previs[filId] || [] }));
      return;
    }

    try {
      const bruts = await loadMissatges(filId, configRef.current);
      if (meua !== genMissatges.current) return;
      setMissatgesPerFil((previs) => {
        /* Els optimistes encara pendents no es perden en un refresc: es
           conserven fins que el servidor els torna amb el seu id real. */
        const pendents = (previs[filId] || []).filter((m) => m.estatEnviament !== 'enviat');
        const confirmats = new Set(bruts.map((m) => m.id));
        return {
          ...previs,
          [filId]: [
            ...bruts.map((m) => mapejaMissatge(m, joId)),
            ...pendents.filter((m) => !confirmats.has(m.id))
          ]
        };
      });
      return true;
    } catch (error) {
      if (meua !== genMissatges.current) return false;
      setAvis(error?.message || 'No s\'han pogut carregar els missatges.');
      return false;
    }
  }, [joId]);

  /* ── Càrrega inicial. `jo` a la clau: canviar de sessió recarrega. ── */
  useEffect(() => {
    setEstat('loading');
    carregaFils();
  }, [joId, carregaFils]);

  /* ── Obrir un fil: carregar-lo i marcar-lo llegit ── */
  const obriFil = useCallback((filId) => {
    setFilActiu(filId || null);
  }, []);

  useEffect(() => {
    if (!filActiu) return;
    let viu = true;
    carregaMissatges(filActiu).then(() => {
      if (!viu) return;
      if (joId) marcaLlegit(filActiu, configRef.current);
      setFils((previs) => previs.map((f) => (f.id === filActiu ? { ...f, noLlegits: 0 } : f)));
    });
    return () => { viu = false; };
  }, [filActiu, carregaMissatges]);

  /* ── Sondeig de Fils + Realtime per Missatges ──
     Sondejem només la llista de fils per veure 'no llegits'.
     Per als missatges del fil actiu, usem WebSockets (Realtime). */
  useEffect(() => {
    if (!joId) return undefined;
    let viu = true;
    let temporitzador = null;
    let subscripcioRealtime = null;
    let debounceVisibility = null;

    const amagat = () => typeof document !== 'undefined' && document.hidden;

    const connectaRealtime = () => {
      if (subscripcioRealtime) {
        unsubscribe(subscripcioRealtime);
        subscripcioRealtime = null;
      }
      if (filActiu && !amagat()) {
        const channelName = `xat_${filActiu}`;
        subscribeToTable('xat_missatges', (err, payload) => {
          if (!err && payload?.new) {
            const data = payload.new;
            // Si el missatge és nostre, l'estratègia optimista ja l'ha afegit
            if (data.usuari_id === joId) return;

            setMissatgesPerFil((previs) => {
              const filMessages = previs[filActiu] || [];
              if (filMessages.some(ext => ext.id === data.id)) return previs;
              
              const incoming = mapejaMissatge({
                id: data.id,
                filId: data.fil_id,
                usuariId: data.usuari_id,
                text: data.text,
                esIA: data.es_ia,
                creatAl: data.creat_al,
                autorNom: null
              }, joId);
              
              return {
                ...previs,
                [filActiu]: [...filMessages, incoming]
              };
            });
          }
        }, { filter: `fil_id=eq.${filActiu}`, event: 'INSERT', channelName })
        .then(res => {
          if (viu) subscripcioRealtime = res.subscription;
          else unsubscribe(res.subscription);
        });
      }
    };

    connectaRealtime();

    const tic = async () => {
      if (!viu) return;
      let ok = true;
      if (!amagat()) {
        ok = await carregaFils();
      }
      if (viu) temporitzador = setTimeout(tic, ok ? MS_LLISTA : MS_LLISTA * 10);
    };

    temporitzador = setTimeout(tic, MS_LLISTA);

    const alCanviarVisibilitat = () => {
      if (debounceVisibility) clearTimeout(debounceVisibility);
      debounceVisibility = setTimeout(() => {
        if (!viu) return;
        if (amagat()) {
          if (subscripcioRealtime) {
            unsubscribe(subscripcioRealtime);
            subscripcioRealtime = null;
          }
        } else {
          tic();
          if (filActiu) {
            carregaMissatges(filActiu);
            connectaRealtime();
          }
        }
      }, 300);
    };
    
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', alCanviarVisibilitat);
    }

    return () => {
      viu = false;
      if (temporitzador) clearTimeout(temporitzador);
      if (debounceVisibility) clearTimeout(debounceVisibility);
      if (subscripcioRealtime) unsubscribe(subscripcioRealtime);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', alCanviarVisibilitat);
      }
    };
  }, [joId, filActiu, carregaFils, carregaMissatges]);

  /* ── Enviar ──
     OPTIMISTA AMB REVERSIÓ REAL. La versió anterior feia catch + console.warn i
     deixava la bombolla en pantalla: l'usuari veia enviat un missatge que no
     havia eixit mai del navegador. Ara, si falla, la bombolla desapareix i
     l'error puja perquè ChatConversation restaure el text a l'input. */
  const sendChatMessage = useCallback(async (fil, text) => {
    const filId = fil?.id;
    const cos = String(text ?? '').trim();
    if (!filId || !cos) return [];

    const idProvisional = `pendent::${filId}::${Date.now()}`;
    const ara = new Date().toISOString();
    const optimista = {
      id: idProvisional,
      threadId: filId,
      usuariId: joId,
      text: cos,
      sender: 'me',
      author: 'Jo',
      is_ai: false,
      creatAl: ara,
      createdAtTs: Date.now(),
      time_label: etiquetaBombolla(ara),
      estatEnviament: 'pendent'
    };

    setMissatgesPerFil((previs) => ({
      ...previs,
      [filId]: [...(previs[filId] || []), optimista]
    }));

    if (!joId || String(filId).startsWith('mock-fil-')) {
      // Fake mode per a forasters o converses de mentira amb beta-testers
      setFils((previs) => previs.map((f) => (f.id === filId
        ? { ...f, lastMessagePreview: cos, lastMessageTime: etiquetaLlista(ara) }
        : f)));
      return [optimista];
    }

    try {
      const desat = await enviaMissatge(filId, cos, configRef.current);
      const definitiu = { ...mapejaMissatge(desat, joId), author: 'Jo' };

      setMissatgesPerFil((previs) => ({
        ...previs,
        [filId]: (previs[filId] || []).map((m) => (m.id === idProvisional ? definitiu : m))
      }));
      setFils((previs) => previs.map((f) => (f.id === filId
        ? { ...f, lastMessagePreview: cos, lastMessageTime: etiquetaLlista(desat.creatAl) }
        : f)));

      return [definitiu];
    } catch (error) {
      setMissatgesPerFil((previs) => ({
        ...previs,
        [filId]: (previs[filId] || []).filter((m) => m.id !== idProvisional)
      }));
      throw error;
    }
  }, [joId]);

  /* ── El padró del poble ──
     NO es guarda a l'estat del context a propòsit. La llista només fa falta
     mentre el selector està obert; deixar-la ací obligaria tot l'arbre del xat
     a repintar-se cada volta que es carrega. Qui la demana, la té. */
  const cercaMembres = useCallback(
    async (text = null) => {
      let reals = [];
      if (joId) {
        try {
          reals = await carregaMembres(text, configRef.current);
        } catch {
          reals = [];
        }
      }
      return reals;
    },
    [joId]
  );

  /* ── Obrir conversa amb algú. Idempotent al servidor. ── */
  const creaFil = useCallback(async (altreUsuariId, titol = null) => {
    const filId = await creaFilDirecte(altreUsuariId, titol, configRef.current);
    await carregaFils();
    return filId;
  }, [carregaFils]);

  const getThreadMessages = useCallback(
    (filId) => missatgesPerFil[filId] || [],
    [missatgesPerFil]
  );

  const value = useMemo(() => ({
    status: estat,
    error: null,
    avis,
    chatThreads: fils,
    chatMessages: missatgesPerFil[filActiu] || [],
    filActiu,
    getThreadMessages,
    sendChatMessage,
    obriFil,
    creaFil,
    cercaMembres,
    recarrega: carregaFils
  }), [estat, avis, fils, missatgesPerFil, filActiu, getThreadMessages, sendChatMessage, obriFil, creaFil, cercaMembres, carregaFils]);

  return <XatContext.Provider value={value}>{children}</XatContext.Provider>;
}

export function useXat() {
  return useContext(XatContext) || BUIT;
}
```
<<<FI_FITXER>>>

## Fitxer: src/sections/xat/XatControlSection.jsx

```
import { UniversalPage } from '../../components/universal/UniversalPage';
import { useUIActions } from '../../app/contexts/UIContext';

export default function XatControlSection() {
  const { t } = useUIActions();

  return (
    <UniversalPage
      title={t('section.xatcontrol.title', 'Opcions del Xat')}
      subtitle={t(
        'section.xatcontrol.subtitle',
        'Ajustos, missatges temporals i organització de converses.'
      )}
      chrome="system"
      showLogos
    >
      <div className="content-wrapper">
        <p>
          Aquesta pàgina s&apos;anirà emplenant amb les idees i opcions
          d&apos;organització (Cerca al xat, Missatges temporals, Fons de
          pantalla, etc.) sense necessitat d&apos;embrutar la interfície amb
          menús desplegables sobreposats.
        </p>

        <div className="stack-grid">
          <section className="card card--soft">
            <div className="card__body">
              <h3 className="section-title">
                Multimèdia, enllaços i documents
              </h3>
              <p>Revisa tot el que s&apos;ha enviat al xat.</p>
            </div>
          </section>

          <section className="card card--soft">
            <div className="card__body">
              <h3 className="section-title">Missatges Temporals</h3>
              <p>
                Activa l&apos;autodestrucció de missatges per a converses
                sensibles.
              </p>
            </div>
          </section>

          <section className="card card--soft">
            <div className="card__body">
              <h3 className="section-title">Privacitat i Seguretat</h3>
              <p>
                Silenciar notificacions, bloquejar, xifratge extrem a extrem.
              </p>
            </div>
          </section>
        </div>
      </div>
    </UniversalPage>
  );
}
```
<<<FI_FITXER>>>

## Fitxer: src/sections/xat/XatSection.jsx

```
import React, { useState, useRef, useEffect } from 'react';
import { Users, Search, ArrowLeft, Send, Image as ImageIcon, Settings, X, Plus, Video, Phone, MoreHorizontal, FileText, CheckCircle2, Circle } from 'lucide-react';
import { useNavigate, useParams } from '../../app/contexts/RouterContext';
import NotFoundPage from '../../pages/NotFoundPage';
import { ContentProvider } from '../../components/universal/ContentProvider';
import TextSection from '../text/TextSection';
import { useXat } from './XatContext';
import { useUIActions, useUIState } from '../../app/contexts/UIContext';
import { useCoreContent } from '../../app/contexts/CoreContentContext';
import { useNotesData } from '../notes/NotesDataContext';
import { useIdentitat } from '../../app/contexts/IdentitatContext';
import { showToast } from '../../components/universal/AvisadorEfimer';
import { construeixRetall } from './retall.js';

function Avatar({ src, size = 'md' }) {
  if (src) {
    return <div className={`sdp-avatar sdp-avatar--${size}`}><img src={src} alt="Avatar" className="sdp-avatar__imatge" /></div>;
  }
  return (
    <div className={`sdp-avatar sdp-avatar--${size}`}>
      <Users size={16} color="var(--sdp-text-suau)" />
    </div>
  );
}

export default function XatSection() {
  const {
    chatThreads,
    getThreadMessages,
    sendChatMessage,
    obriFil = () => {},
    status = 'ready',
    avis = null,
    creaFil,
    cercaMembres
  } = useXat();

  const [modeNouXat, setModeNouXat] = useState(false);
  const [membres, setMembres] = useState([]);
  const [carregantMembres, setCarregantMembres] = useState(false);
  const [errorMembres, setErrorMembres] = useState(null);
  const [obrintAmb, setObrintAmb] = useState(null);
  const { t } = useUIActions();
  const { language } = useUIState();
  const { pageCopy } = useCoreContent();
  const { creaNota } = useNotesData();
  const { actorType, actorId } = useIdentitat();
  const { threadId } = useParams();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('totes');

  const threads = chatThreads || [];

  const activeThread = threadId
    ? threads.find(c => String(c.id) === threadId)
    : null;

  const base = actorType === 'entitat' ? `/e/${actorId}` : '/jo';

  useEffect(() => {
    obriFil(threadId || null);
  }, [threadId, obriFil]);

  useEffect(() => {
    if (!modeNouXat) return undefined;
    let viu = true;
    setCarregantMembres(true);
    setErrorMembres(null);
    cercaMembres(null)
      .then((llista) => { if (viu) setMembres(Array.isArray(llista) ? llista : []); })
      .catch((error) => {
        if (viu) setErrorMembres(error?.message || "No s'ha pogut carregar la llista del poble.");
      })
      .finally(() => { if (viu) setCarregantMembres(false); });
    return () => { viu = false; };
  }, [modeNouXat, cercaMembres]);

  if (threadId && !activeThread && status === 'ready') {
    return <NotFoundPage />;
  }

  const messages = activeThread ? getThreadMessages(activeThread.id) : [];

  const filteredThreads = threads.filter((th) => {
    if (!searchTerm) return true;
    const name = th.nom || th.other_user_name || 'Desconegut';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const membresFiltrats = membres.filter((m) => {
    if (!searchTerm) return true;
    return (m.nom || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const obriConversaAmb = async (membre) => {
    if (obrintAmb) return;
    if (membre.filId) {
      setModeNouXat(false);
      setSearchTerm('');
      navigate(`${base}/xat/${encodeURIComponent(membre.filId)}`);
      return;
    }
    setObrintAmb(membre.id);
    try {
      const filId = await creaFil(membre.id, null);
      setModeNouXat(false);
      setSearchTerm('');
      navigate(`${base}/xat/${encodeURIComponent(filId)}`);
    } catch (error) {
      showToast(error?.message || "No s'ha pogut obrir la conversa.", 'error');
    } finally {
      setObrintAmb(null);
    }
  };

  const handleSelectThread = (id) => {
    navigate(`${base}/xat/${encodeURIComponent(String(id))}`);
  };

  const handleBackToList = () => {
    navigate(`${base}/xat`);
  };

  const enviaAlBloc = async (triats) => {
    const retall = construeixRetall({
      fil: activeThread,
      missatges: triats,
      locale: language === 'ca' ? 'ca-ES' : 'es-ES'
    });

    try {
      const nota = await creaNota(retall);
      
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('sdp:note-created', { detail: { note: nota } }));
      }
      
      showToast('Retall guardat al Bloc de Notes.', 'success');
      navigate(`${base}/notes?nota=${encodeURIComponent(nota.id)}`);
    } catch (error) {
      console.error('[xat] no s\'ha pogut crear el retall:', error);
      showToast("No s'ha pogut crear la nota. Comprova la connexió i que tingues la sessió iniciada.", 'error');
      throw error;
    }
  };

  const config = {
    title: t('section.xat.kicker', 'Xat'),
    subtitle: t('section.xat.title', 'Converses'),
    lead: t('section.xat.subtitle', 'Connecta amb els veïns i grups del poble.'),
    chrome: "system",
    showLogos: true
  };

  return (
    <ContentProvider initialConfig={config}>
      <div className="xat-layout">

        <aside className={`xat-sidebar ${threadId ? 'd-desktop-only' : ''}`}>
          <header className="xat-sidebar-header">
            <div className="search-bar-basic">
              <Search size={18} color="currentColor" className="search-icon" />
              <input
                type="text"
                placeholder={modeNouXat ? 'CERCA UNA PERSONA...' : 'CERCA UN XAT...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="xat-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  aria-label="Netejar cerca"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              type="button"
              className="sdp-boto sdp-boto--fantasma"
              aria-label={modeNouXat ? 'Cancel·lar la conversa nova' : 'Nova conversa'}
              aria-pressed={modeNouXat}
              onClick={() => { setModeNouXat((obert) => !obert); setSearchTerm(''); }}
            >
              {modeNouXat
                ? <X size={24} color="var(--sdp-text-invers)" />
                : <Plus size={24} color="var(--sdp-text-invers)" />}
            </button>
            <div className="sdp-alerta__accions">
              <button
                className="sdp-boto sdp-boto--fantasma"
                aria-label="Control General del Xat"
                onClick={() => navigate(`${base}/control-xat`)}
              >
                <Settings size={24} color="var(--sdp-text-invers)" />
              </button>
            </div>
          </header>

          <div className="xat-filters">
            <button className={`btn-taronja-fort ${activeFilter === 'totes' ? 'active' : ''}`} onClick={() => setActiveFilter('totes')}>Tot</button>
            <button className={`btn-taronja-fort ${activeFilter === 'no-llegits' ? 'active' : ''}`} onClick={() => setActiveFilter('no-llegits')}>No llegit</button>
            <button className={`btn-taronja-fort ${activeFilter === 'grups' ? 'active' : ''}`} onClick={() => setActiveFilter('grups')}>Grups</button>
            <button className={`btn-taronja-fort ${activeFilter === 'iaies' ? 'active' : ''}`} onClick={() => setActiveFilter('iaies')}>IAIES</button>
            <button className="btn-taronja-fort btn-taronja-fort--icon" aria-label="Afegir filtre"><Plus size={16} /></button>
          </div>

          <div className="xat-list">
            {modeNouXat ? (
              <>
                {carregantMembres && (
                  <div className="xat-item" role="status">
                    <div className="xat-item-content">
                      <div className="xat-item-preview">Carregant la gent del poble…</div>
                    </div>
                  </div>
                )}
                {errorMembres && (
                  <div className="xat-item" role="status">
                    <div className="xat-item-content">
                      <div className="xat-item-title">No s'ha pogut obrir el padró</div>
                      <div className="xat-item-preview">{errorMembres}</div>
                    </div>
                  </div>
                )}
                {!carregantMembres && !errorMembres && membresFiltrats.length === 0 && (
                  <div className="xat-item" role="status">
                    <div className="xat-item-content">
                      <div className="xat-item-preview">
                        {searchTerm
                          ? 'Cap veí amb eixe nom.'
                          : 'Encara no hi ha ningú més al poble amb qui parlar.'}
                      </div>
                    </div>
                  </div>
                )}
                {membresFiltrats.map((m) => (
                  <div
                    key={m.id}
                    className="xat-item"
                    role="button"
                    tabIndex={0}
                    aria-busy={obrintAmb === m.id}
                    onClick={() => obriConversaAmb(m)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); obriConversaAmb(m); }
                    }}
                  >
                    <Avatar size="md" />
                    <div className="xat-item-content">
                      <div className="xat-item-header">
                        <span className="xat-item-title">{m.nom}</span>
                        <span className="xat-item-time">
                          {obrintAmb === m.id ? 'Obrint…' : (m.filId ? 'Obrir' : 'Nou')}
                        </span>
                      </div>
                      <div className="xat-item-preview">
                        {m.filId ? 'Ja teniu una conversa oberta.' : 'Encara no heu parlat.'}
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <>
            {avis && (
              <div className="xat-item" role="status">
                <div className="xat-item-content">
                  <div className="xat-item-title">No s'ha pogut carregar el xat</div>
                  <div className="xat-item-preview">{avis}</div>
                </div>
              </div>
            )}
            {!avis && filteredThreads.length === 0 && status === 'ready' && (
              <div className="xat-item" role="status">
                <div className="xat-item-content">
                  <div className="xat-item-title">Encara no tens cap conversa</div>
                  <div className="xat-item-preview">
                    Prem el botó + de dalt per a triar amb qui vols parlar.
                  </div>
                </div>
              </div>
            )}
            {filteredThreads.map((th) => (
              <div
                key={th.id}
                className={`xat-item ${threadId === String(th.id) ? 'active' : ''}`}
                onClick={() => handleSelectThread(th.id)}
              >
                <Avatar kind={th.type} src={th.avatar_url} size="md" />
                <div className="xat-item-content">
                  <div className="xat-item-header">
                    <span className="xat-item-title">{th.name || th.title}</span>
                    <span className="xat-item-time">{th.lastMessageTime || 'Ahir'}</span>
                  </div>
                  <div className="xat-item-preview">
                    {th.lastMessagePreview || 'Cap missatge.'}
                  </div>
                </div>
              </div>
            ))}
              </>
            )}
          </div>
        </aside>

        <main className={`xat-main ${!threadId ? 'd-desktop-only' : ''}`}>
          {activeThread ? (
            <ChatConversation
              thread={activeThread}
              messages={messages}
              onSendMessage={sendChatMessage}
              onBack={handleBackToList}
              onEnviaAlBloc={enviaAlBloc}
            />
          ) : (
            <div className="xat-scroll-area">
              {pageCopy?.['anima'] ? (
                <TextSection page={{...pageCopy['anima'], chrome: 'context'}} pageKey="anima" />
              ) : (
                <div className="xat-empty-message">
                  <img src="/assets/system/ui/logo-socdepoble-rect-blanc.svg" alt="Sóc de Poble" />
                  <h2>Sóc de Poble Desktop</h2>
                  <p>Selecciona una conversa per començar a xatejar amb la gent de La Torre.</p>
                </div>
              )}
            </div>
          )}
        </main>

      </div>
    </ContentProvider>
  );
}

function ChatConversation({ thread, messages, onSendMessage, onBack, onEnviaAlBloc }) {
  const [text, setText] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [modeSeleccio, setModeSeleccio] = useState(false);
  const [triats, setTriats] = useState(() => new Set());
  const [creantNota, setCreantNota] = useState(false);
  const chatLogRef = useRef(null);

  useEffect(() => {
    if (chatLogRef.current) {
      chatLogRef.current.scrollTop = chatLogRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    setModeSeleccio(false);
    setTriats(new Set());
  }, [thread?.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;

    setText('');
    try {
      await onSendMessage(thread, value);
    } catch {
      setText(value);
    }
  };

  const clauDe = (msg, i) => String(msg.id ?? `pos-${i}`);

  const alterna = (clau) => {
    setTriats((previs) => {
      const nous = new Set(previs);
      if (nous.has(clau)) nous.delete(clau);
      else nous.add(clau);
      return nous;
    });
  };

  const surtDeSeleccio = () => {
    setModeSeleccio(false);
    setTriats(new Set());
  };

  const enviaAlBloc = async () => {
    if (creantNota) return;
    const tria = messages.filter((m, i) => triats.has(clauDe(m, i)));
    if (tria.length === 0) return;

    setCreantNota(true);
    try {
      await onEnviaAlBloc(tria);
      surtDeSeleccio();
    } catch {
      // Pare ja avisa
    } finally {
      setCreantNota(false);
    }
  };

  return (
    <>
      {modeSeleccio ? (
        <header className="xat-main-header xat-main-header--seleccio">
          <button type="button" className="xat-header-btn" onClick={surtDeSeleccio} aria-label="Eixir de la selecció">
            <X size={24} color="currentColor" />
          </button>
          <strong className="xat-header-info" aria-live="polite">
            {triats.size === 0 ? 'Tria els missatges' : `${triats.size} triat${triats.size === 1 ? '' : 's'}`}
          </strong>
        </header>
      ) : (
        <header className="xat-main-header">
          <button className="sdp-boto sdp-boto--fantasma d-mobile-only" onClick={onBack} aria-label="Tornar">
            <ArrowLeft size={24} color="var(--sdp-text-invers)" />
          </button>
          <Avatar kind={thread?.type} src={thread?.avatar_url} size="sm" />
          <div className="xat-header-info">
            <strong>{thread?.name || thread?.title}</strong>
            <span className="xat-header-subtitle">Prem ací per a més informació</span>
          </div>
          <div className="xat-header-actions">
            <button className="xat-header-btn"><Video size={20} color="currentColor" /></button>
            <button className="xat-header-btn"><Phone size={20} color="currentColor" /></button>
            <div style={{ position: 'relative' }}>
              <button className={`xat-header-btn ${menuOpen ? 'active' : ''}`} onClick={() => setMenuOpen(!menuOpen)}><MoreHorizontal size={20} color="currentColor" /></button>
              {menuOpen && (
                <div className="xat-header-dropdown">
                  <button className="sdp-dropdown-item">Info. del contacte</button>
                  <button className="sdp-dropdown-item">Cercar</button>
                  <hr className="xat-divider" />
                  <button
                    type="button"
                    className="sdp-dropdown-item"
                    onClick={() => { setModeSeleccio(true); setMenuOpen(false); }}
                  >
                    Seleccionar missatges
                  </button>
                  <button className="sdp-dropdown-item">Silenciar</button>
                  <hr className="xat-divider" />
                  <button className="sdp-dropdown-item">Nova telefonada en grup</button>
                  <button className="sdp-dropdown-item">Enviar enllaç de telefonada</button>
                  <button className="sdp-dropdown-item">Programar telefonada</button>
                  <hr className="xat-divider" />
                  <button className="sdp-dropdown-item">Obrir en una finestra nova</button>
                  <button className="sdp-dropdown-item sdp-dropdown-item--danger">Tancar xat</button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      <div className="xat-messages" ref={chatLogRef}>
        {messages.length === 0 && (
          <div className="xat-empty">
            Cap missatge encara. Inicia la conversa!
          </div>
        )}
        {messages.map((msg, i) => {
          const clau = clauDe(msg, i);
          const triat = triats.has(clau);
          const classes = [
            'sdp-chat-bubble',
            msg.sender === 'me' ? 'sdp-chat-bubble--user' : 'sdp-chat-bubble--ai',
            modeSeleccio ? 'sdp-chat-bubble--triable' : '',
            triat ? 'sdp-chat-bubble--triat' : ''
          ].filter(Boolean).join(' ');

          return (
            <div
              key={clau}
              className={`${classes} ${modeSeleccio ? 'xat-bubble-wrapper' : 'xat-bubble-wrapper--block'}`}
              role={modeSeleccio ? 'checkbox' : undefined}
              aria-checked={modeSeleccio ? triat : undefined}
              tabIndex={modeSeleccio ? 0 : undefined}
              onClick={modeSeleccio ? () => alterna(clau) : undefined}
              onKeyDown={modeSeleccio ? (e) => {
                if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); alterna(clau); }
              } : undefined}
            >
              {modeSeleccio && (
                <span className="xat-marca-tria" aria-hidden="true">
                  {triat ? <CheckCircle2 size={18} color="var(--sdp-accio)" /> : <Circle size={18} color="var(--sdp-text-suau)" />}
                </span>
              )}
              <div className="xat-bubble-content">
                {msg.sender !== 'me' && !msg.is_ai && (
                  <div className="xat-sender-name">
                    {msg.author || msg.author_name || 'Usuari'}
                  </div>
                )}
                <div>{msg.text ?? msg.content ?? ''}</div>
                <div className="sdp-chat-bubble-meta">
                  {msg.time_label || ''}{msg.estatEnviament === 'pendent' ? ' · enviant…' : ''}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modeSeleccio ? (
        <div className="xat-composer xat-composer--seleccio">
          <button
            type="button"
            className="xat-accio-bloc"
            onClick={enviaAlBloc}
            disabled={triats.size === 0 || creantNota}
          >
            <FileText size={20} />
            <span>{creantNota ? 'Creant la nota…' : 'Enviar al Bloc de Notes'}</span>
          </button>
        </div>
      ) : (
        <form className="xat-composer" onSubmit={handleSubmit}>
          <button type="button" className="sdp-boto sdp-boto--fantasma" aria-label="Adjuntar">
            <ImageIcon size={24} color="var(--sdp-text-suau)" />
          </button>
          <div className="xat-input-wrap">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escriu un missatge..."
            />
          </div>
          <button type="submit" className="xat-send-btn">
            <Send size={18} />
          </button>
        </form>
      )}
    </>
  );
}
```
<<<FI_FITXER>>>

## Fitxer: src/sections/xat/XatSection.test.jsx

```
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/preact';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import XatSection from './XatSection';
import { construeixRetall } from './retall';

const mocks = vi.hoisted(() => ({ creaNota: vi.fn(), navigate: vi.fn(), threadId: 'a' }));

vi.mock('../../app/contexts/RouterContext', () => ({ 
  useNavigate: () => mocks.navigate,
  useParams: () => ({ threadId: mocks.threadId }),
  useRouter: () => ({ navigate: mocks.navigate, currentPath: '/jo/xat' })
}));

vi.mock('../../pages/NotFoundPage', () => ({ default: () => null }));
vi.mock('../../components/universal/ContentProvider', () => ({ ContentProvider: ({children}) => children }));
vi.mock('../text/TextSection', () => ({ default: () => null }));
vi.mock('../../app/contexts/UIContext', () => ({ 
  useUIActions: () => ({t: (_, fallback) => fallback}),
  useUIState: () => ({ language: 'ca' }) 
}));
vi.mock('../../app/contexts/IdentitatContext', () => ({
  useIdentitat: () => ({ actorType: 'persona', actorId: 'usuari123' })
}));
vi.mock('../../app/contexts/CoreContentContext', () => ({ useCoreContent: () => ({pageCopy: {}}) }));
vi.mock('../notes/NotesDataContext', () => ({ useNotesData: () => ({creaNota: mocks.creaNota}) }));
vi.mock('./XatContext', () => ({ 
  useXat: () => ({
    chatThreads: [{id: 'a', title: 'Conversa'}, {id: 'b', title: 'Altra'}], 
    getThreadMessages: () => [{id: '1', text: 'Primer', sender: 'me'}, {id: '2', text: 'Segon', sender: 'other', author: 'Veí'}], 
    sendChatMessage: vi.fn()
  }) 
}));
vi.mock('../../components/universal/AvisadorEfimer', () => ({ showToast: vi.fn() }));

afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); mocks.threadId = 'a'; });

test('selecció en ordre i navegació després de confirmar', async () => {
  let resolve;
  mocks.creaNota.mockReturnValue(new Promise(r => {resolve = r;}));
  render(<XatSection />); 
  
  // Obrir menú
  const menuButtons = document.querySelectorAll('.xat-header-btn');
  fireEvent.click(menuButtons[2]); // MoreHorizontal
  
  // Seleccionar "Seleccionar missatges"
  fireEvent.click(screen.getByText('Seleccionar missatges'));
  
  const send = screen.getByRole('button', {name: /Enviar al Bloc de Notes/});
  expect(send.disabled).toBe(true);
  
  // Triar missatges
  const bubbles = document.querySelectorAll('.sdp-chat-bubble--triable');
  fireEvent.click(bubbles[1]); // Segon missatge
  fireEvent.click(bubbles[0]); // Primer missatge
  
  fireEvent.click(send); 
  
  expect(mocks.creaNota).toHaveBeenCalledTimes(1);
  const retall = mocks.creaNota.mock.calls[0][0];
  // Ha d'estar en ordre cronològic (el DOMPurify i l'html escapat s'ha provat a banda, ací provem que es passen bé)
  expect(retall.content).toContain('Primer');
  expect(retall.content).toContain('Segon');
  
  expect(mocks.navigate).not.toHaveBeenCalled();
  
  resolve({id: 'new-note'});
  await waitFor(() => expect(mocks.navigate).toHaveBeenCalledWith('/jo/notes?nota=new-note'));
});

test('retall.js saneja i escapa correctament', () => {
  const fil = { title: '<img>' };
  const missatges = [{author: '<b>', text: '<script>alert(1)</script>\n&'}];
  const retall = construeixRetall({ fil, missatges, locale: 'ca-ES' });
  
  expect(retall.title).toBe('Retall de «&lt;img&gt;»');
  expect(retall.content).toContain('&lt;script&gt;alert(1)&lt;/script&gt;<br>&amp;');
  expect(retall.content).not.toContain('<script>');
});
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
  on conflict (id) do update set full_name = excluded.full_name, consentiment_rgpd_at = coalesce(excluded.consentiment_rgpd_at, public.profiles.consentiment_rgpd_at);

  
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
security invoker
set search_path = ''
as $$
declare
  v_count int;
begin
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

## Fitxer: supabase/migrations/260908_xat_v2_membres.sql

```
-- ==============================================================================
-- MIGRACIÓ: Xat v2 · DIRECTORI DEL POBLE (260908)
-- ==============================================================================
-- S'aplica DESPRÉS de 260908_xat_v2_correccions.sql. És idempotent.
--
-- PER QUÈ EXISTIX
-- ───────────────
-- `crea_fil_directe(p_tenant_id, p_altre_usuari, p_titol)` necessita l'uuid de
-- l'altra persona, i no hi havia CAP manera d'obtindre'l des del client:
--   · `profiles read own` només deixa llegir el teu propi perfil.
--   · `town_memberships` no té cap política de lectura per a tercers.
-- El botó «Nova conversa» era, literalment, impossible d'implementar.
--
-- ⚠ DECISIÓ DE GOVERNANÇA, NO TÈCNICA ⚠
-- ─────────────────────────────────────
-- Aquesta funció obri una cosa que fins ara estava tancada: el NOM de la resta
-- de veïns del teu poble. És el mínim imprescindible perquè un xat existisca
-- (no pots escriure a qui no pots trobar), però continua sent una obertura.
--
-- El que NO s'obri, i convé que quede escrit:
--   · correu electrònic          · data d'alta          · rol al poble
--   · `visibility`               · `consentiment_rgpd_at`
--   · qualsevol dada d'un poble del qual TU no eres membre
--
-- Això afecta LLEI_05_Privacitat i el text de la pàgina legal, que ara mateix
-- diu que les dades personals «mai es comparteixen sense consentiment». Un
-- directori de noms visible per als covilatans és una cessió intracomunitària:
-- defensable, però ha d'estar escrita i, idealment, consentida. Decisió del
-- Mestre (Veto Presidencial), no meua.
--
-- Al final del fitxer hi ha, comentat, el filtre per consentiment RGPD.
-- ==============================================================================


create or replace function public.membres_del_poble(
  p_tenant_id uuid,
  p_cerca     text default null,
  p_limit     integer default 100
)
returns table (
  usuari_id uuid,
  nom       text,
  fil_id    uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
use_column
declare
  v_jo uuid := (select auth.uid());
begin
  if v_jo is null then
    raise exception 'SDP-XAT-001: cal la sessió iniciada.' using errcode = '42501';
  end if;

  -- DIVULGACIÓ MÍNIMA, PORTA 1: només si TU eres membre d'aquest poble.
  -- Sense esta comprovació, qualsevol autenticat podria enumerar el padró de
  -- tots els pobles de la instància passant uuids fins encertar-ne un.
  if not exists (
    select 1 from public.town_memberships m
    where m.town_id = p_tenant_id and m.user_id = v_jo
  ) then
    raise exception 'SDP-XAT-003: no eres membre d''aquest poble.' using errcode = '42501';
  end if;

  return query
    select
      pr.id,
      coalesce(pr.full_name, 'Veí')::text,
      -- Si ja teniu conversa oberta, es torna el seu id. Així la interfície
      -- pot navegar-hi directament sense fer cap escriptura: obrir un fil que
      -- ja existix no ha de tocar la base de dades.
      (
        select f.id
        from public.xat_fils f
        where f.tenant_id = p_tenant_id
          and (select count(*) from public.xat_participants xp where xp.fil_id = f.id) = 2
          and exists (select 1 from public.xat_participants xp where xp.fil_id = f.id and xp.usuari_id = v_jo)
          and exists (select 1 from public.xat_participants xp where xp.fil_id = f.id and xp.usuari_id = pr.id)
        order by f.creat_al asc
        limit 1
      )
    from public.town_memberships m
    join public.profiles pr on pr.id = m.user_id
    where m.town_id = p_tenant_id
      -- DIVULGACIÓ MÍNIMA, PORTA 2: mai tu mateix. `crea_fil_directe` ja
      -- rebutja el fil amb un mateix; ací ni tan sols apareixes a la llista.
      and m.user_id <> v_jo
      and (
        p_cerca is null
        or btrim(p_cerca) = ''
        or pr.full_name ilike '%' || btrim(p_cerca) || '%'
      )
      -- ── FILTRE PER CONSENTIMENT (desactivat a propòsit) ──
      -- Descomenta la línia per excloure del directori qui no haja donat el
      -- consentiment RGPD. NO l'actives sense mirar abans quants perfils el
      -- tenen a null, o el directori es quedarà buit i perdràs una hora
      -- buscant l'error a un altre lloc:
      --     select count(*) filter (where consentiment_rgpd_at is null),
      --            count(*) from public.profiles;
      -- and pr.consentiment_rgpd_at is not null
    order by pr.full_name asc
    limit greatest(1, least(coalesce(p_limit, 100), 500));
end;
$$;

revoke execute on function public.membres_del_poble(uuid, text, integer) from public;
revoke execute on function public.membres_del_poble(uuid, text, integer) from anon;
grant  execute on function public.membres_del_poble(uuid, text, integer) to authenticated;


-- Els dos índexs que fan que això no siga un seqüencial quan el poble cresca.
-- `town_memberships(user_id)` ja existix des de l'esquema inicial; falta el
-- camí contrari, que és el que recorre aquesta funció.
create index if not exists idx_town_memberships_town
  on public.town_memberships (town_id);

create index if not exists idx_profiles_full_name
  on public.profiles (full_name);


-- ══════════════════════════════════════════════════════════════════════════
-- COMPROVACIÓ (executa-la amb la sessió d'un tester, no com a postgres:
-- `auth.uid()` és null al SQL Editor i la funció llançarà SDP-XAT-001, que és
-- exactament el comportament correcte).
--
--   select * from public.membres_del_poble('11111111-2222-3333-4444-555555555555');
--
-- Si torna 0 files amb dos testers donats d'alta, mira `town_memberships`:
-- el trigger `handle_new_user` és qui hi inserix la fila, i si l'alta va
-- fallar-hi silenciosament la persona existix a `auth.users` però no és de cap
-- poble. Eixe era el P0 de registre de l'auditoria anterior.
-- ══════════════════════════════════════════════════════════════════════════
```
<<<FI_FITXER>>>

## Fitxer: supabase/migrations/260908_xat_v2.sql

```
-- ==============================================================================
-- MIGRACIÓ: Xat v2 (WhatsApp de Poble)
-- ==============================================================================
-- Aquest esquema substitueix l'antic 'chat_threads' i 'chat_messages' per un
-- model de 4 taules preparat per a converses multiusuari, complint amb la
-- visió "Offline-First" i garantint la privadesa absoluta amb RLS.

create table if not exists public.xat_fils (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.towns(id) on delete cascade,
  titol text,
  creat_per uuid not null references auth.users(id) on delete cascade,
  creat_al timestamptz not null default now(),
  actualitzat_al timestamptz not null default now()
);

create table if not exists public.xat_participants (
  fil_id uuid not null references public.xat_fils(id) on delete cascade,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  creat_al timestamptz not null default now(),
  primary key (fil_id, usuari_id)
);

create table if not exists public.xat_missatges (
  id uuid primary key default gen_random_uuid(),
  fil_id uuid not null references public.xat_fils(id) on delete cascade,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  creat_al timestamptz not null default now()
);

create table if not exists public.xat_lectures (
  fil_id uuid not null references public.xat_fils(id) on delete cascade,
  usuari_id uuid not null references auth.users(id) on delete cascade,
  ultim_llegit_al timestamptz not null default now(),
  primary key (fil_id, usuari_id)
);

-- ==============================================================================
-- FUNCIONS I TRIGGERS
-- ==============================================================================

-- Funció clau de seguretat (RLS): només retorna cert si l'usuari és participant
create or replace function private.es_participant(p_fil_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.xat_participants p
    where p.fil_id = p_fil_id
      and p.usuari_id = (select auth.uid())
  );
$$;

-- Trigger per actualitzar el timestamp del fil en cada nou missatge
create or replace function public.trg_actualitza_xat_fil()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  update public.xat_fils set actualitzat_al = now() where id = new.fil_id;
  return new;
end;
$$;

drop trigger if exists on_nou_missatge on public.xat_missatges;
create trigger on_nou_missatge
after insert on public.xat_missatges
for each row execute function public.trg_actualitza_xat_fil();

-- ==============================================================================
-- POLÍTIQUES DE SEGURETAT (RLS)
-- ==============================================================================

alter table public.xat_fils enable row level security;
alter table public.xat_participants enable row level security;
alter table public.xat_missatges enable row level security;
alter table public.xat_lectures enable row level security;

-- Només els usuaris autenticats poden interactuar amb el xat
revoke all on table public.xat_fils from anon, public;
grant select on table public.xat_fils to authenticated;

revoke all on table public.xat_participants from anon, public;
grant select on table public.xat_participants to authenticated;

revoke all on table public.xat_missatges from anon, public;
grant select on table public.xat_missatges to authenticated;
grant insert (fil_id, usuari_id, text) on table public.xat_missatges to authenticated;

revoke all on table public.xat_lectures from anon, public;
grant select, insert, update on table public.xat_lectures to authenticated;


-- Polítiques per a xat_fils
drop policy if exists "xat_fils_lectura" on public.xat_fils;
create policy "xat_fils_lectura" on public.xat_fils for select to authenticated
using (private.es_participant(id));



-- Polítiques per a xat_participants
drop policy if exists "xat_participants_lectura" on public.xat_participants;
create policy "xat_participants_lectura" on public.xat_participants for select to authenticated
using (private.es_participant(fil_id));




-- Polítiques per a xat_missatges
drop policy if exists "xat_missatges_lectura" on public.xat_missatges;
create policy "xat_missatges_lectura" on public.xat_missatges for select to authenticated
using (private.es_participant(fil_id));

drop policy if exists "xat_missatges_insercio" on public.xat_missatges;
create policy "xat_missatges_insercio" on public.xat_missatges for insert to authenticated
with check (private.es_participant(fil_id) and usuari_id = (select auth.uid()));


-- Polítiques per a xat_lectures
drop policy if exists "xat_lectures_lectura" on public.xat_lectures;
create policy "xat_lectures_lectura" on public.xat_lectures for select to authenticated
using (usuari_id = (select auth.uid()));

drop policy if exists "xat_lectures_insercio" on public.xat_lectures;
create policy "xat_lectures_insercio" on public.xat_lectures for insert to authenticated
with check (usuari_id = (select auth.uid()));

drop policy if exists "xat_lectures_actualitzacio" on public.xat_lectures;
create policy "xat_lectures_actualitzacio" on public.xat_lectures for update to authenticated
using (usuari_id = (select auth.uid()))
with check (usuari_id = (select auth.uid()));
```
<<<FI_FITXER>>>

## Fitxer: supabase/migrations/260911_0600_perfil_avatar_i_permisos.sql

```
-- ═════════════════════════════════════════════════════════════════════
-- MIGRACIÓ CANÒNICA: PERMISOS I CAMPS DE PROFILES (AVATAR I IDENTITAT)
-- Data: 2026-09-11
-- Motiu: Permetre a l'usuari actualitzar el seu avatar, nom i poble
--        des de /jo/el-meu-perfil sense rebre error 403 (42501).
-- ═════════════════════════════════════════════════════════════════════

-- 1. Assegurar columnes necessàries a public.profiles
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists town_name text default 'La Torre de les Maçanes';
alter table public.profiles add column if not exists bio text default '';
alter table public.profiles add column if not exists is_public boolean default false;

-- 2. Concedir permisos DML a authenticated i anon sobre public.profiles
grant select on table public.profiles to authenticated, anon;
grant insert (id, full_name, visibility, avatar_url, town_name, bio, is_public) on table public.profiles to authenticated;
grant update (full_name, visibility, avatar_url, town_name, bio, is_public) on table public.profiles to authenticated;

-- 3. Assegurar política RLS per a update propi
drop policy if exists "profiles update own" on public.profiles;
create policy "profiles update own" on public.profiles for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 4. Assegurar política RLS per a select
drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select to authenticated, anon
  using (true);

-- 5. Trigger d'actualització de timestamps
drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch
before update on public.profiles
for each row execute function public.touch_updated_at();
```
<<<FI_FITXER>>>

## Fitxer: supabase/migrations/260912_1500_correccio_privacitat_perfils.sql

```
-- ═════════════════════════════════════════════════════════════════════
-- MIGRACIÓ CANÒNICA: CORRECCIÓ DE PRIVACITAT DE PERFILS I ORGANITZACIONS
-- Data: 2026-09-12
-- Motiu: Supressió d'accés anon a dades sensibles i habilitació RLS estricte
-- ═════════════════════════════════════════════════════════════════════

-- 1. Habilitar RLS explícitament (Perplexity / Qwen Audit)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Revocar permisos de lectura globals a anon
REVOKE SELECT ON TABLE public.profiles FROM anon;

-- 3. Arreglar política de lectura per a profiles (només el propi usuari)
DROP POLICY IF EXISTS "profiles read own" ON public.profiles;
CREATE POLICY "profiles read own" ON public.profiles FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

-- 4. Polítiques d'escriptura per a organizations
DROP POLICY IF EXISTS "orgs_insert_auth" ON public.organizations;
CREATE POLICY "orgs_insert_auth" ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (created_by = (select auth.uid()));

-- La columna `visibility` existix des de l'esquema inicial. USING (true) la ignorava.
DROP POLICY IF EXISTS "orgs_read_auth" ON public.organizations;
CREATE POLICY "orgs_read_auth" ON public.organizations FOR SELECT TO authenticated
  USING (
    visibility = 'public'
    OR created_by = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.organization_memberships m
      WHERE m.organization_id = organizations.id
        AND m.user_id = (select auth.uid())
    )
    OR (select private.es_superadmin())
  );
```
<<<FI_FITXER>>>

## Fitxer: supabase/migrations/260912_admin_panel.sql

```
-- ==============================================================================
-- MIGRACIÓ: Vistes i accions del Panell d'Administració (Sóc de Poble)
-- ==============================================================================
-- Aquestes funcions usen SECURITY DEFINER per a saltar-se les polítiques RLS 
-- i operar sobre les taules subjacents (auth.users, organization_claims, etc.) 
-- SEMPRE I QUAN l'usuari que fa la crida siga superadmin local.
-- ==============================================================================

-- 1. admin_list_users()
-- Retorna la llista d'usuaris per al gestor d'usuaris.
CREATE OR REPLACE FUNCTION public.admin_list_users()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT COALESCE((SELECT private.es_superadmin()), FALSE) THEN
    RAISE EXCEPTION 'SDP-ADMIN-001: cal rol de superadmin.' USING ERRCODE = '42501';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(
      json_build_object(
        'id', u.id,
        'email', u.email,
        'created_at', u.created_at,
        'last_sign_in_at', u.last_sign_in_at
      )
    ), '[]'::json)
    FROM auth.users u
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_users() TO authenticated;

-- 2. admin_list_organizations()
-- Retorna la llista d'empreses/grups per al gestor.
CREATE OR REPLACE FUNCTION public.admin_list_organizations()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT COALESCE((SELECT private.es_superadmin()), FALSE) THEN
    RAISE EXCEPTION 'SDP-ADMIN-002: cal rol de superadmin.' USING ERRCODE = '42501';
  END IF;

  RETURN (
    SELECT COALESCE(json_agg(
      json_build_object(
        'id', o.id,
        'name', o.name,
        'slug', o.slug,
        'kind', o.kind,
        'description', o.description,
        'created_at', o.created_at
      )
    ), '[]'::json)
    FROM public.organizations o
  );
END;
$$;
REVOKE EXECUTE ON FUNCTION public.admin_list_organizations() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_list_organizations() TO authenticated;
```
<<<FI_FITXER>>>

## Fitxer: supabase/migrations/260913_0500_bucket_mitjans.sql

```
-- ═════════════════════════════════════════════════════════════════════
-- MIGRACIÓ CANÒNICA: BUCKET DE MITJANS
-- Data: 2026-09-13
-- Motiu: Fase 4. Trau les imatges de base64 dins de user_metadata i
--        profiles.avatar_url. Escriptura només a la carpeta pròpia.
-- ═════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mitjans', 'mitjans', true, 5242880,
        array['image/webp','image/jpeg','image/png','image/avif'])
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = excluded.allowed_mime_types;

alter table storage.objects enable row level security;

drop policy if exists "mitjans llegir" on storage.objects;
create policy "mitjans llegir" on storage.objects for select to anon, authenticated
  using (bucket_id = 'mitjans');

drop policy if exists "mitjans pujar propis" on storage.objects;
create policy "mitjans pujar propis" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'mitjans'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "mitjans actualitzar propis" on storage.objects;
create policy "mitjans actualitzar propis" on storage.objects for update to authenticated
  using (bucket_id = 'mitjans' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'mitjans' and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists "mitjans esborrar propis" on storage.objects;
create policy "mitjans esborrar propis" on storage.objects for delete to authenticated
  using (bucket_id = 'mitjans' and (storage.foldername(name))[1] = (select auth.uid())::text);
```
<<<FI_FITXER>>>

## Fitxer: supabase/migrations/260914_0000_schema_notes.sql

```
-- Aquest fitxer conté l'especificació d'infraestructura (taula notes i RLS) 
-- dictaminada per l'auditoria de Codex per resoldre la fugida de privacitat
-- i garantir l'integritat de les dades amb un sistema basat en files individuals.

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.towns(id) on delete cascade,
  owner_user_id uuid not null,
  folder_id text not null default 'general',
  title text not null default 'Nova Nota',
  subtitle text,
  lead text,
  content text,
  categories jsonb not null default '[]'::jsonb,
  tags jsonb not null default '[]'::jsonb,
  hero_image text,
  logo_image text,
  is_published boolean not null default false,
  published_submission_id uuid references public.section_submissions(id) on delete set null,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Índex per agilitzar la càrrega de les notes d'un usuari
create index if not exists idx_notes_tenant_owner
  on public.notes(tenant_id, owner_user_id, updated_at desc);

-- Trigger per auto-incrementar la revisió i actualitzar la data
create or replace function public.touch_notes_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  new.revision = old.revision + 1;
  return new;
end;
$$;

drop trigger if exists trg_notes_touch on public.notes;
create trigger trg_notes_touch
before update on public.notes
for each row execute function public.touch_notes_updated_at();

-- Seguretat a nivell de fila (RLS)
alter table public.notes enable row level security;

revoke all on table public.notes from anon, public;
grant select, insert, update, delete on table public.notes to authenticated;

-- Només el propietari pot llegir les seues notes
drop policy if exists "private read notes" on public.notes;
create policy "private read notes" on public.notes for select to authenticated
using (
  owner_user_id = (select auth.uid()) 
  and exists (select 1 from public.town_memberships where town_id = tenant_id and user_id = (select auth.uid()))
);

-- Només el propietari pot inserir noves notes
drop policy if exists "private insert notes" on public.notes;
create policy "private insert notes" on public.notes for insert to authenticated
with check (
  owner_user_id = (select auth.uid()) 
  and exists (select 1 from public.town_memberships where town_id = tenant_id and user_id = (select auth.uid()))
);

-- Només el propietari pot actualitzar les seues notes
drop policy if exists "private update notes" on public.notes;
create policy "private update notes" on public.notes for update to authenticated
using (
  owner_user_id = (select auth.uid()) 
  and exists (select 1 from public.town_memberships where town_id = tenant_id and user_id = (select auth.uid()))
)
with check (
  owner_user_id = (select auth.uid()) 
  and exists (select 1 from public.town_memberships where town_id = tenant_id and user_id = (select auth.uid()))
);

-- Només el propietari pot esborrar les seues notes
drop policy if exists "private delete notes" on public.notes;
create policy "private delete notes" on public.notes for delete to authenticated
using (
  owner_user_id = (select auth.uid()) 
  and exists (select 1 from public.town_memberships where town_id = tenant_id and user_id = (select auth.uid()))
);
```
<<<FI_FITXER>>>

## Fitxer: supabase/migrations/260914_0100_auditoria_rls_fixes.sql

```
-- ═════════════════════════════════════════════════════════════════════
-- MIGRACIÓ CANÒNICA: AUDITORIA RLS FIXES (EL CONSELL)
-- Data: 2026-09-14
-- Motiu: Correccions d'auditoria (Deepseek, Perplexity, Dola, Claude)
-- ═════════════════════════════════════════════════════════════════════

-- 1. Evitar spoofing de tenant al registre (Deepseek - P0)
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_tenant uuid;
  v_rgpd   boolean;
begin
  -- Assignació segura del poble per defecte ignorant el metadata falsificat del client
  select valor::uuid into v_tenant
    from private.ajustos where clau = 'poble_per_defecte';

  if v_tenant is null then
    raise exception 'SDP-REG-001: Poble no resolt. Impossible crear usuari.' using errcode = '23502';
  end if;

  v_rgpd := coalesce((new.raw_user_meta_data ->> 'accepta_rgpd')::boolean, false);

  insert into public.profiles (
    id, full_name, avatar_url, consentiment_rgpd_at
  )
  values (
    new.id,
    coalesce(nullif(left(btrim(new.raw_user_meta_data ->> 'full_name'), 120), ''), coalesce(nullif(left(btrim(new.raw_user_meta_data ->> 'name'), 120), ''), 'Veí/na')),
    new.raw_user_meta_data ->> 'avatar_url',
    case when v_rgpd then now() else null end
  );

  insert into public.town_memberships (town_id, user_id, role)
  values (v_tenant, new.id, 'member')
  on conflict (town_id, user_id) do nothing;

  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- 2. Eliminar fuita d'agents a app_content i revocar accessos preventivament
revoke all on public.app_content from authenticated;
grant select, insert, update, delete on public.app_content to authenticated;
drop policy if exists "public read app_content" on public.app_content;
create policy "public read app_content" on public.app_content for select using (
  key != 'agents' or (select private.es_superadmin())
);

-- 3. Neteja preventiva a profiles (per si de cas quedava algun permís penjat)
revoke all on public.profiles from anon;

-- 4. Protegir el bucket 'mitjans' de lectura anònima per SQL, delegar a Storage
drop policy if exists "Lectura lliure mitjans" on storage.objects;
update storage.buckets set public = true where id = 'mitjans';

-- 5. Trigger fantasma `tg_touch` corregit
drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch
before update on public.profiles
for each row execute function public.touch_updated_at();

-- 6. Filtre RGPD a membres_del_poble (Dola)
drop function if exists public.membres_del_poble(uuid, text);
create or replace function public.membres_del_poble(
  p_tenant_id uuid,
  p_cerca     text default null,
  p_limit     integer default 100
)
returns table (
  usuari_id uuid,
  nom       text,
  fil_id    uuid
)
language sql stable security definer set search_path = ''
as $$
  select
    pr.id as usuari_id,
    coalesce(pr.full_name, 'Veí')::text as nom,
    (
      select f.id
      from public.xat_fils f
      where f.tenant_id = p_tenant_id
        and (select count(*) from public.xat_participants xp where xp.fil_id = f.id) = 2
        and exists (select 1 from public.xat_participants xp where xp.fil_id = f.id and xp.usuari_id = auth.uid())
        and exists (select 1 from public.xat_participants xp where xp.fil_id = f.id and xp.usuari_id = pr.id)
      order by f.creat_al asc
      limit 1
    ) as fil_id
  from public.town_memberships tm
  join public.profiles pr on pr.id = tm.user_id
  where tm.town_id = p_tenant_id
    and pr.consentiment_rgpd_at is not null
    and tm.user_id <> auth.uid()
    and (select private.is_town_member(p_tenant_id))
    and (
        p_cerca is null
        or btrim(p_cerca) = ''
        or pr.full_name ilike '%' || btrim(p_cerca) || '%'
    )
  order by pr.full_name asc
  limit greatest(1, least(coalesce(p_limit, 100), 500));
$$;
revoke execute on function public.membres_del_poble(uuid, text, integer) from public, anon;
grant execute on function public.membres_del_poble(uuid, text, integer) to authenticated;

-- 7. Signatura security definer a touch_notes_updated_at (Dola)
create or replace function public.touch_notes_updated_at()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  new.updated_at = now();
  new.revision = old.revision + 1;
  return new;
end;
$$;
```
<<<FI_FITXER>>>

## Fitxer: supabase/migrations/260915_0000_seguretat_profunda_deepseek.sql

```
-- ═════════════════════════════════════════════════════════════════════
-- MIGRACIÓ CANÒNICA: SEGURETAT PROFUNDA DEEPSEEK P0
-- Data: 2026-09-15
-- Motiu: Paginació admin, RGPD auditable, XSS RLS, validació town.is_open
-- ═════════════════════════════════════════════════════════════════════

-- 1. Taula de consentiments RGPD auditable i independent del payload inicial
create table if not exists public.consentiments (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  tipus        text not null check (tipus in ('rgpd_acepta','marketing_butlleti','analitica')),
  versio_politica text not null,      -- sha256 o data de la versió del text legal
  ip_hash      text,                  -- hash d'IP, no IP crua (minimització)
  user_agent   text,
  creat_al     timestamptz not null default now()
);
alter table public.consentiments enable row level security;
revoke all on public.consentiments from anon, public;
grant select, insert on public.consentiments to authenticated;
create policy "usuari llig els seus consentiments" on public.consentiments
  for select to authenticated using (user_id = auth.uid());

create or replace function public.registra_consentiment(p_tipus text, p_versio text)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Requereix sessió' using errcode = '42501';
  end if;
  insert into public.consentiments (user_id, tipus, versio_politica)
  values (auth.uid(), p_tipus, p_versio);
  
  if p_tipus = 'rgpd_acepta' then
    update public.profiles set consentiment_rgpd_at = now() where id = auth.uid();
  end if;
end;
$$;
grant execute on function public.registra_consentiment(text, text) to authenticated;

-- 2. `handle_new_user`: Evitar spoofing i exigir que el poble existisca i estiga obert. No llig `accepta_rgpd` de raw_metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_tenant uuid;
begin
  -- Assignació segura del poble per defecte ignorant el metadata falsificat del client
  select valor::uuid into v_tenant
    from private.ajustos where clau = 'poble_per_defecte';

  if v_tenant is null then
    raise exception 'SDP-REG-001: Poble no resolt. Impossible crear usuari.' using errcode = '23502';
  end if;

  if not exists (
    select 1 from public.towns t where t.id = v_tenant and t.is_open = true
  ) then
    raise exception 'SDP-REG-003: el poble per defecte no existix o no està obert.'
      using errcode = '23503';
  end if;

  insert into public.profiles (
    id, full_name, avatar_url, consentiment_rgpd_at
  )
  values (
    new.id,
    coalesce(nullif(left(btrim(new.raw_user_meta_data ->> 'full_name'), 120), ''), coalesce(nullif(left(btrim(new.raw_user_meta_data ->> 'name'), 120), ''), 'Veí/na')),
    new.raw_user_meta_data ->> 'avatar_url',
    null -- S'actualitza després amb registra_consentiment per complir RGPD
  );

  insert into public.town_memberships (town_id, user_id, role)
  values (v_tenant, new.id, 'member')
  on conflict (town_id, user_id) do nothing;

  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.handle_new_user() from anon, authenticated;

-- 3. Protecció extrema de profile contra `anon`
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='profiles'
      and 'anon' = any(roles)
  ) then
    raise exception 'SDP-RLS-001: cap política de profiles pot incloure anon. Revisa les migracions.';
  end if;
end $$;

drop policy if exists "profiles read own" on public.profiles;
create policy "profiles read own" on public.profiles for select to authenticated
  using (true);

-- 4. Paginació d'admin_list_users (P0-5)
create or replace function public.admin_list_users(
  p_limit  integer default 100,
  p_offset integer default 0
)
returns json
language plpgsql security definer set search_path = ''
as $$
begin
  if not coalesce((select private.es_superadmin()), false) then
    raise exception 'SDP-ADMIN-001: cal rol de superadmin.' using errcode = '42501';
  end if;
  return (
    select coalesce(json_agg(t), '[]'::json) from (
      select u.id, u.email, u.created_at, u.last_sign_in_at
      from auth.users u
      order by u.created_at desc
      limit greatest(1, least(coalesce(p_limit, 100), 500))
      offset greatest(0, coalesce(p_offset, 0))
    ) t
  );
end;
$$;

revoke execute on function public.admin_list_users from public, anon;
```
<<<FI_FITXER>>>

## Fitxer: supabase/migrations/260915_0130_fix_rls_profiles.sql

```
-- ═════════════════════════════════════════════════════════════════════
-- MIGRACIÓ CANÒNICA: FIX RLS PROFILES
-- Data: 2026-09-15
-- Motiu: Supressió de using(true) detectada a l'auditoria V3
-- ═════════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "profiles read own" ON public.profiles;
CREATE POLICY "profiles read own" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id);
```
<<<FI_FITXER>>>

<<<FI_DEL_BUNDLE>>>
