---
tipus: petorreta
estat: esborrany
description: Auditoria tècnica del paquet auditoria
---
# 🛡️ PETORRETA AL CONSELL: AUDITORIA

## Font de Logos

Els logos oficials no s’incrusten ací.

Consulta sempre: [[doc_logos_oficials]]

---

## Objectiu

Auditar el paquet auditoria amb evidències verificables

`OBJECTIU: Auditar el paquet auditoria amb evidències verificables`

## Context Necessari

Bundle aparellat: 260912_2147_BUNDLE_auditoria.md.

La integració actual és purament online i centrada en crear una connexió perfecta per al sistema de la nostra empresa sòcia, Sollutia; la sobirania local és una meta de llarg termini.

## Instrucció Principal

Analitza el codi i la Wiki adjunts, identifica causes i proposa correccions mínimes verificables

`EXECUTA: Analitza el codi i la Wiki adjunts, identifica causes i proposa correccions mínimes verificables`

## Output Esperat

`FORMAT: markdown`

## Bloc Fixe d’Identitat

**Qui Som (La Nostra Història):** Som l'Associació ecologista El Rentonar i Sóc de Poble. Aquest projecte és l'hereu de més de 30 anys d'activisme rural i lluita pel nostre entorn natural i patrimonial. El nostre llegat i identitat digital resideixen històricament en `rentonar.blogspot.com`, van evolucionar a l'antiga plataforma fundacional `socdepoble.net`, i avui es materialitzen construint `socdepoble.org` (el Mas).

**Filosofia:** [[el_projecte|Sóc de Poble]] és actualment una aplicació web connectada (Online-First / React SPA + Supabase BaaS). Tot i que l'aspiració a llarg termini és la sobirania tecnològica rural (amb arquitectures descentralitzades), avui dia depenem d'un backend centralitzat (Supabase PostgreSQL + GoTrue Auth + RLS) i requereix connexió constant. NO utilitzes patrons 'Local-First' ni 'Offline-First' que enfosquisquen aquesta realitat, ja que confonen el Consell d'IAs. La IAIA MarIA actua amb Trellat, mínima intervenció, el Baseline 2022 com a jutge i respecte absolut per la llengua, la memòria i la gent major.

---

## Tancament Obligatori

- No yapping.
- No dependències supèrflues.
- No Tailwind al Core.
- No tocar dades personals sense base legal.
- Si hi ha risc de destrucció, activa SDP-LOCK.
- PROHIBICIÓ ESTRICTA DE CERCA WEB: Ets en un entorn aïllat (air-gapped). Tens prohibit malbaratar tokens cercant termes a internet (ex: noms de fitxers, 'oauthRelay.js', conceptes propis o 'Pedra Seca'). Tota la informació està en el bundle adjunt. Llig-lo i no el busques fora.

## Sinapsis

- [[00_bios]]
- [[02_genotip]]
- [[doc_governanca]]
- [[doc_logos_oficials]]
- enginyeria_inversa_mit

## Taxonomia

- **Categoria:** [[maquina]]
- **Etiquetes:** [[graf]]


**Ancoratge de Seguretat:** [[00_index]]

<!-- SDP-ISO-CONTEXT: {"_wiki_de_poble/02_saber/plantilles/plantilla_iso_sdp.md":"978fc4f0f6141a05786c3a4ad7ea319a58170c0f51078ef235649d1bd24c2835","_wiki_de_poble/01_ser/00_bios.md":"5dbace813b4a86af2002b3ca45a12f11055dd6d664ac6e22585a9af9a1c8de34","_wiki_de_poble/01_ser/02_genotip.md":"980417e92c4c5b305f65db70cfc67108f30608910d97774e2d9d0174fb7f84f1","_wiki_de_poble/02_saber/doc_governanca.md":"5a37a96783fecf1029d95c5735e6bb93d63399195783064e632e53789de04693","_wiki_de_poble/02_saber/doc_logos_oficials.md":"70d4ea7c1a14a5c75a00aaaf2439c3b1910b7f921e1207346f5df5dee81e0861","_wiki_de_poble/02_saber/architecture/ADR-2026-08-ONLINE-FIRST.md":"294ee25a85573276c93ed009ae02c0e9ef508fd4d622b3a3af906f28adf0c32f"} -->


## Petorreta per a Claude (Mestre d'Obres)
Salut, Claude. MarIA a l'aparell. T'informe que l'arxiu `MurSection.jsx` ja va ser refactoritzat i podat satisfactòriament pel company Gemini Flash en l'últim relleu de l'Eixam. Està completament integrat i net. 
La teva Parcel·la A ara mateix consta només dels components d'onboarding (`onboarding-*`). Tens tot el codi font en el Bundle adjunt (`260912_2147_BUNDLE_auditoria.md`) que acompanya aquest document.

Per accelerar el teu anàlisi, ací tens l'informe d'orfes actualitzat obtingut després del darrer `scan`:

```markdown
# Informe d'orfenes JSX — Pedra Seca Fase 2

- Generat: 2026-09-12T19:46:51.944Z
- Classes úniques orfes: **344** (referència del Consell: 71)
- Classes definides a src/css: 659
- Dinàmiques/expressions (revisió manual): 112

## Per família
- altres: 344

## Per component

### src/app/App.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-route-loading-screen__glow` | altres | 2 | 61, 62 |
| `sdp-route-loading-screen` | altres | 1 | 60 |
| `sdp-route-loading-screen__glow--left` | altres | 1 | 61 |
| `sdp-route-loading-screen__glow--right` | altres | 1 | 62 |
| `sdp-route-loading-screen__panel` | altres | 1 | 63 |
| `sdp-route-loading-screen__logo` | altres | 1 | 64 |
| `sdp-route-loading-screen__title` | altres | 1 | 65 |
| `sdp-route-loading-screen__subtitle` | altres | 1 | 66 |
| `sdp-route-loading-screen__dots` | altres | 1 | 67 |
| `app-brand__mark` | altres | 1 | 260 |
| `pull-to-refresh-indicator` | altres | 1 | 319 |
| `mobile-logo` | altres | 1 | 357 |
| `sdp-top-bar-btn--avatar` | altres | 1 | 375 |
| `sdp-avatar-placeholder` | altres | 1 | 387 |

### src/components/layout/AppGridColumn.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `app-grid-col-header__plec` | altres | 2 | 71, 81 |
| `app-grid-col-header__titol` | altres | 2 | 78, 83 |
| `app-grid-col-header__accio` | altres | 1 | 36 |
| `app-grid-col-header` | altres | 1 | 49 |
| `app-grid-col-header--collapsed` | altres | 1 | 49 |
| `hover-bg` | altres | 1 | 52 |
| `?` | altres | 1 | 65 |
| `'` | altres | 1 | 65 |
| `app-grid-col-header--accordion'` | altres | 1 | 65 |
| `:` | altres | 1 | 65 |
| `''}` | altres | 1 | 65 |
| `app-grid-col-header__plec--fix` | altres | 1 | 81 |
| `app-grid-col-header__accions` | altres | 1 | 87 |
| `btn-icon--transparent` | altres | 1 | 94 |
| `d-desktop-only` | altres | 1 | 94 |

### src/components/layout/AppGridShell.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `app-grid-column` | altres | 3 | 136, 154, 172 |
| `app-grid-header-btn` | altres | 2 | 107, 117 |
| `===` | altres | 2 | 107, 117 |
| `?` | altres | 2 | 107, 117 |
| `'active'` | altres | 2 | 107, 117 |
| `:` | altres | 2 | 107, 117 |
| `''}` | altres | 2 | 107, 117 |
| `app-grid-page` | altres | 1 | 93 |
| `app-grid-shell` | altres | 1 | 98 |
| `app-grid-headers` | altres | 1 | 104 |
| `'left'` | altres | 1 | 107 |
| `'middle'` | altres | 1 | 117 |
| `app-grid-content` | altres | 1 | 129 |
| `app-grid-column--left` | altres | 1 | 136 |
| `app-grid-resizer--left` | altres | 1 | 145 |
| `app-grid-column--middle` | altres | 1 | 154 |
| `app-grid-resizer--middle` | altres | 1 | 163 |
| `app-grid-column--right` | altres | 1 | 172 |

### src/components/ui/Accordion.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `?` | altres | 2 | 17, 23 |
| `:` | altres | 2 | 17, 23 |
| `''}` | altres | 2 | 17, 23 |
| `'active'` | altres | 1 | 17 |
| `'` | altres | 1 | 23 |
| `accordion-item__fletxa--obert'` | altres | 1 | 23 |

### src/components/ui/Divisor.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-divisor--amb-text` | altres | 1 | 15 |
| `sdp-divisor__text` | altres | 1 | 16 |

### src/components/ui/Dropdown.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `?` | altres | 1 | 39 |
| `'xat-header-dropdown--right'` | altres | 1 | 39 |
| `:` | altres | 1 | 39 |
| `'xat-header-dropdown--left'}` | altres | 1 | 39 |

### src/components/ui/UniversalCard.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-link-inherit` | altres | 2 | 131, 133 |

### src/components/ui/UniversalIndicatorCard.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `?` | altres | 1 | 20 |
| `'active'` | altres | 1 | 20 |
| `:` | altres | 1 | 20 |
| `''}` | altres | 1 | 20 |

### src/components/ui/controls.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sp-card-time` | altres | 2 | 44, 56 |

### src/components/ui/estats.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-buit__icona` | altres | 1 | 13 |
| `sdp-buit__accio` | altres | 1 | 16 |

### src/components/ui/formulari.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-casella__control--radi` | altres | 1 | 110 |

### src/components/universal/UniversalEditorShell.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-accions` | altres | 4 | 53, 59, 79, 85 |
| `hero-editable` | altres | 2 | 48, 74 |
| `?` | altres | 1 | 102 |
| `'published'` | altres | 1 | 102 |
| `:` | altres | 1 | 102 |
| `''}` | altres | 1 | 102 |
| `sdp-text-titol` | altres | 1 | 108 |
| `sdp-text-suau` | altres | 1 | 109 |

### src/components/universal/UniversalPage.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-link-inherit` | altres | 2 | 333, 335 |
| `page-title-logo-wrapper` | altres | 1 | 292 |
| `?` | altres | 1 | 351 |
| `'` | altres | 1 | 351 |
| `content-wrapper--sense-marge'` | altres | 1 | 351 |
| `:` | altres | 1 | 351 |
| `''}` | altres | 1 | 351 |

### src/components/universal/UniversalToolbar.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `?` | altres | 5 | 41, 49, 57, 65, 73 |
| `'active-text'` | altres | 5 | 41, 49, 57, 65, 73 |
| `:` | altres | 5 | 41, 49, 57, 65, 73 |
| `''}` | altres | 5 | 41, 49, 57, 65, 73 |
| `d-mobile-only` | altres | 1 | 32 |

### src/components/universal/manager/ManagerFacets.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `?` | altres | 2 | 44, 123 |
| `'univ-manager-facet-item--active'` | altres | 2 | 44, 123 |
| `:` | altres | 2 | 44, 123 |
| `''}` | altres | 2 | 44, 123 |
| `collapsed` | altres | 1 | 61 |
| `sdp-boto--settings` | altres | 1 | 97 |
| `univ-manager-facet-content` | altres | 1 | 113 |
| `===` | altres | 1 | 123 |
| `opt.id` | altres | 1 | 123 |

### src/components/universal/manager/ManagerList.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `collapsed` | altres | 1 | 49 |
| `d-desktop-only` | altres | 1 | 87 |

### src/sections/admin/AdminSection.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `===` | altres | 3 | 21, 28, 35 |
| `?` | altres | 3 | 21, 28, 35 |
| `'univ-manager-facet-item--active'` | altres | 3 | 21, 28, 35 |
| `:` | altres | 3 | 21, 28, 35 |
| `''}` | altres | 3 | 21, 28, 35 |
| `perfil-detall` | altres | 2 | 85, 124 |
| `perfil-detall-buit` | altres | 2 | 87, 126 |
| `sdp-text-suau` | altres | 2 | 89, 128 |
| `sdp-text-titol` | altres | 1 | 16 |
| `'dashboard'` | altres | 1 | 21 |
| `'usuaris'` | altres | 1 | 28 |
| `'entitats'` | altres | 1 | 35 |

### src/sections/connectar/ConnectarSection.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `connect-panel` | altres | 5 | 197, 216, 240, 288, 328 |
| `connect-panel__body` | altres | 5 | 203, 223, 246, 295, 329 |
| `connect-panel__head` | altres | 4 | 198, 217, 241, 289 |
| `?` | altres | 3 | 205, 208, 229 |
| `:` | altres | 3 | 205, 208, 229 |
| `''}` | altres | 3 | 205, 208, 229 |
| `section-search` | altres | 3 | 264, 307, 320 |
| `toggle-button` | altres | 2 | 205, 208 |
| `'toggle-button--active'` | altres | 2 | 205, 208 |
| `connect-panel--wide` | altres | 2 | 288, 328 |
| `connect-layout` | altres | 1 | 196 |
| `toggle-row` | altres | 1 | 204 |
| `connect-grid` | altres | 1 | 224 |
| `connect-card` | altres | 1 | 229 |
| `===` | altres | 1 | 229 |
| `area.id` | altres | 1 | 229 |
| `'connect-card--active'` | altres | 1 | 229 |
| `tag-input-row` | altres | 1 | 255 |
| `badge-remove` | altres | 1 | 277 |
| `connect-final` | altres | 1 | 330 |

### src/sections/control/ControlSection.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-accions` | altres | 1 | 117 |

### src/sections/detail/PageDetailSection.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `card` | altres | 1 | 38 |

### src/sections/detail/detailRichText.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `detail-content--plain` | altres | 1 | 17 |
| `detail-content__paragraph--plain` | altres | 1 | 23 |

### src/sections/detail/detailSectionMeta.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `detail-grid` | altres | 5 | 70, 91, 112, 142, 170 |
| `-col` | altres | 1 | 26 |
| `detail-section-meta-card` | altres | 1 | 26 |
| `btn-full` | altres | 1 | 47 |
| `detail-section-btn` | altres | 1 | 47 |

### src/sections/dispositius/DevicesSection.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-accions` | altres | 5 | 260, 311, 332, 387, 408 |
| `devices-panel` | altres | 3 | 254, 305, 363 |
| `?` | altres | 3 | 264, 413, 427 |
| `:` | altres | 3 | 264, 413, 427 |
| `card` | altres | 3 | 280, 323, 378 |
| `'sdp-boto--primari'` | altres | 2 | 264, 413 |
| `'sdp-boto--secundari'}` | altres | 2 | 264, 413 |
| `devices-status` | altres | 2 | 330, 385 |
| `===` | altres | 2 | 413, 427 |
| `sdp-stat-info` | altres | 1 | 245 |
| `sdp-marge-bottom` | altres | 1 | 260 |
| `sdp-text-suau` | altres | 1 | 297 |
| `sdp-marge-bottom-petit` | altres | 1 | 325 |
| `devices-panel--wide` | altres | 1 | 363 |
| `||` | altres | 1 | 385 |
| `'idle'}` | altres | 1 | 385 |
| `peer.id` | altres | 1 | 413 |
| `devices-bubble` | altres | 1 | 427 |
| `'me'` | altres | 1 | 427 |
| `'devices-bubble--me'` | altres | 1 | 427 |
| `'devices-bubble--other'}` | altres | 1 | 427 |

### src/sections/disseny/DesignSection.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `universal-content` | altres | 1 | 53 |
| `sdp-design-system` | altres | 1 | 53 |
| `sdp-manual-disseny` | altres | 1 | 53 |

### src/sections/disseny/DesignSectionContent.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-design-block` | altres | 34 | 34, 102, 256, 383, 409, 442, 491, 530, 563, 614, 684, 706, 721, 748, 760, 789, 803, 816, 825, 845, 870, 1003, 1066, 1098, 1125, 1171, 1216, 1315, 1347, 1356, 1377, 1421, 1460, 1491 |
| `sdp-swatch` | altres | 21 | 115, 119, 123, 127, 131, 135, 187, 191, 195, 204, 208, 212, 216, 220, 224, 228, 232, 236, 240, 244, 248 |
| `sdp-swatch-color` | altres | 21 | 116, 120, 124, 128, 132, 136, 188, 192, 196, 205, 209, 213, 217, 221, 225, 229, 233, 237, 241, 245, 249 |
| `sdp-swatch-info` | altres | 21 | 117, 121, 125, 129, 133, 137, 189, 193, 197, 206, 210, 214, 218, 222, 226, 230, 234, 238, 242, 246, 250 |
| `sdp-btn` | altres | 17 | 418, 419, 420, 421, 422, 423, 429, 430, 431, 713, 714, 778, 819, 1411, 1483, 1484, 1485 |
| `sdp-badge` | altres | 14 | 566, 567, 568, 569, 570, 571, 575, 581, 587, 596, 603, 632, 639, 646 |
| `sdp-icon` | altres | 14 | 576, 582, 588, 597, 604, 1008, 1024, 1038, 1132, 1185, 1194, 1207, 1233, 1334 |
| `sdp-page-btn` | altres | 13 | 695, 696, 697, 698, 700, 701, 1102, 1103, 1104, 1105, 1106, 1108, 1109 |
| `sdp-alert-content` | altres | 11 | 40, 89, 106, 261, 445, 461, 474, 534, 541, 548, 555 |
| `sdp-card` | altres | 10 | 1359, 1427, 1437, 1448, 1467, 1499, 1515, 1521, 1527, 1533 |
| `sdp-btn--primary` | altres | 7 | 418, 429, 430, 431, 819, 1411, 1483 |
| `sdp-form-group` | altres | 7 | 494, 498, 506, 518, 523, 1362, 1366 |
| `sdp-checklist-item` | altres | 7 | 1129, 1138, 1142, 1146, 1150, 1157, 1162 |
| `sdp-pl-1` | altres | 6 | 42, 464, 1429, 1469, 1504, 1537 |
| `sdp-badge--outline` | altres | 5 | 575, 581, 587, 596, 603 |
| `sdp-divider-preview` | altres | 5 | 847, 851, 855, 859, 863 |
| `sdp-divider-label` | altres | 5 | 848, 852, 856, 860, 864 |
| `sdp-stat-icon` | altres | 5 | 1007, 1023, 1037, 1049, 1056 |
| `sdp-stat-info` | altres | 5 | 1015, 1031, 1043, 1050, 1057 |
| `sdp-spinner` | altres | 4 | 432, 725, 730, 735 |
| `sdp-skeleton` | altres | 4 | 741, 742, 743, 744 |
| `sdp-tab` | altres | 4 | 792, 793, 794, 795 |
| `sdp-palette` | altres | 3 | 114, 186, 203 |
| `sdp-grid-col` | altres | 3 | 402, 403, 404 |
| `sdp-btn-group` | altres | 3 | 417, 428, 1482 |
| `sdp-btn--outline-dark` | altres | 3 | 420, 713, 778 |
| `sdp-btn--danger` | altres | 3 | 422, 714, 1484 |
| `sdp-table-action` | altres | 3 | 633, 640, 647 |
| `sdp-btn--sm` | altres | 3 | 713, 714, 1411 |
| `sdp-skeleton--text` | altres | 3 | 742, 743, 744 |
| `sdp-embed-caption` | altres | 3 | 1230, 1298, 1311 |
| `sdp-btn--base` | altres | 2 | 421, 1485 |
| `sdp-spinner--sm` | altres | 2 | 432, 725 |
| `sdp-checkbox-group` | altres | 2 | 510, 514 |
| `sdp-badge--success` | altres | 2 | 568, 632 |
| `sdp-badge--warning` | altres | 2 | 569, 639 |
| `sdp-badge--info` | altres | 2 | 571, 646 |
| `sdp-pagination` | altres | 2 | 694, 1101 |
| `sdp-progress` | altres | 2 | 805, 809 |
| `sdp-progress-header` | altres | 2 | 806, 810 |
| `sdp-progress-bar` | altres | 2 | 807, 811 |
| `sdp-progress-fill` | altres | 2 | 807, 811 |
| `sdp-search-result` | altres | 2 | 1085, 1090 |
| `sdp-search-result-title` | altres | 2 | 1086, 1091 |
| `sdp-search-result-meta` | altres | 2 | 1087, 1092 |
| `sdp-search-result-excerpt` | altres | 2 | 1088, 1093 |
| `sdp-pagination-label` | altres | 2 | 1114, 1118 |
| `sdp-pagination-title` | altres | 2 | 1115, 1119 |
| `sdp-checklist` | altres | 2 | 1128, 1156 |
| `sdp-date-tag` | altres | 2 | 1160, 1165 |
| `sdp-utils-box` | altres | 2 | 1319, 1328 |
| `sdp-utils-list` | altres | 2 | 1321, 1330 |
| `sdp-msg-container` | altres | 2 | 1385, 1393 |
| `sdp-component-doc` | altres | 1 | 13 |
| `sdp-component-doc-header` | altres | 1 | 14 |
| `sdp-component-doc-preview` | altres | 1 | 23 |
| `app-layout` | altres | 1 | 56 |
| `page-container` | altres | 1 | 61 |
| `universal-page` | altres | 1 | 63 |
| `page-header-card` | altres | 1 | 69 |
| `meta-footer` | altres | 1 | 71 |
| `page-content-wrapper` | altres | 1 | 75 |
| `page-content` | altres | 1 | 77 |
| `sdp-swatch-color--primary-500` | altres | 1 | 116 |
| `sdp-swatch-color--primary-700` | altres | 1 | 120 |
| `sdp-swatch-color--secondary-500` | altres | 1 | 124 |
| `sdp-swatch-color--secondary-600` | altres | 1 | 128 |
| `sdp-swatch-color--blanc-pur` | altres | 1 | 132 |
| `sdp-swatch-color--negre-pur` | altres | 1 | 136 |
| `sdp-swatch-color--error-500` | altres | 1 | 188 |
| `sdp-swatch-color--avis-500` | altres | 1 | 192 |
| `sdp-swatch-color--exit-500` | altres | 1 | 196 |
| `sdp-swatch-color--pedra-50` | altres | 1 | 205 |
| `sdp-swatch-color--pedra-100` | altres | 1 | 209 |
| `sdp-swatch-color--pedra-200` | altres | 1 | 213 |
| `sdp-swatch-color--pedra-300` | altres | 1 | 217 |
| `sdp-swatch-color--pedra-400` | altres | 1 | 221 |
| `sdp-swatch-color--pedra-500` | altres | 1 | 225 |
| `sdp-swatch-color--pedra-600` | altres | 1 | 229 |
| `sdp-swatch-color--pedra-700` | altres | 1 | 233 |
| `sdp-swatch-color--pedra-750` | altres | 1 | 237 |
| `sdp-swatch-color--pedra-800` | altres | 1 | 241 |
| `sdp-swatch-color--pedra-850` | altres | 1 | 245 |
| `sdp-swatch-color--pedra-900` | altres | 1 | 249 |
| `sdp-grid-preview` | altres | 1 | 401 |
| `sdp-btn--secondary` | altres | 1 | 419 |
| `sdp-btn--ghost` | altres | 1 | 423 |
| `sdp-form-group--error` | altres | 1 | 518 |
| `sdp-error-text` | altres | 1 | 521 |
| `sdp-form-group--disabled` | altres | 1 | 523 |
| `sdp-design-badges` | altres | 1 | 565 |
| `sdp-badge--default` | altres | 1 | 566 |
| `sdp-badge--primary` | altres | 1 | 567 |
| `sdp-badge--danger` | altres | 1 | 570 |
| `sdp-nav-bar` | altres | 1 | 687 |
| `sdp-modal-preview` | altres | 1 | 708 |
| `sdp-modal` | altres | 1 | 709 |
| `sdp-modal-actions` | altres | 1 | 712 |
| `sdp-spinner-group` | altres | 1 | 723 |
| `sdp-spinner--md` | altres | 1 | 730 |
| `sdp-spinner--lg` | altres | 1 | 735 |
| `sdp-skeleton--title` | altres | 1 | 741 |
| `sdp-avatar-group` | altres | 1 | 750 |
| `sdp-tabs` | altres | 1 | 791 |
| `sdp-tab-content` | altres | 1 | 797 |
| `sdp-tooltip-preview` | altres | 1 | 818 |
| `sdp-tooltip-term` | altres | 1 | 820 |
| `sdp-lists-preview` | altres | 1 | 827 |
| `sdp-divider` | altres | 1 | 849 |
| `sdp-divider--text` | altres | 1 | 853 |
| `sdp-divider--major` | altres | 1 | 857 |
| `sdp-divider--dashed` | altres | 1 | 861 |
| `sdp-divider--dotted` | altres | 1 | 865 |
| `sdp-col` | altres | 1 | 952 |
| `sdp-search-bar` | altres | 1 | 1069 |
| `sdp-search-filters` | altres | 1 | 1074 |
| `sdp-pagination--simple` | altres | 1 | 1112 |
| `sdp-date-tag--done` | altres | 1 | 1160 |
| `sdp-upload-zone` | altres | 1 | 1174 |
| `sdp-upload-zone-text` | altres | 1 | 1175 |
| `sdp-upload-zone-sub` | altres | 1 | 1176 |
| `sdp-file-item` | altres | 1 | 1179 |
| `sdp-file-item-info` | altres | 1 | 1180 |
| `sdp-file-item-name` | altres | 1 | 1181 |
| `sdp-file-item-meta` | altres | 1 | 1182 |
| `sdp-file-item-action` | altres | 1 | 1184 |
| `sdp-download-card` | altres | 1 | 1192 |
| `sdp-download-card-icon` | altres | 1 | 1193 |
| `sdp-download-card-info` | altres | 1 | 1202 |
| `sdp-download-card-title` | altres | 1 | 1203 |
| `sdp-download-card-meta` | altres | 1 | 1204 |
| `sdp-download-card-btn` | altres | 1 | 1206 |
| `sdp-embed` | altres | 1 | 1219 |
| `sdp-accordion` | altres | 1 | 1231 |
| `sdp-accordion-header` | altres | 1 | 1232 |
| `sdp-pre-wrap` | altres | 1 | 1244 |
| `sdp-audio-player` | altres | 1 | 1300 |
| `sdp-audio-btn` | altres | 1 | 1301 |
| `sdp-audio-progress` | altres | 1 | 1306 |
| `sdp-audio-progress-fill` | altres | 1 | 1307 |
| `sdp-audio-time` | altres | 1 | 1309 |
| `sdp-utils-grid` | altres | 1 | 1318 |
| `sdp-center-600` | altres | 1 | 1359 |
| `sdp-login-form` | altres | 1 | 1370 |
| `sdp-pill` | altres | 1 | 1371 |
| `sdp-pill--primary` | altres | 1 | 1371 |
| `sdp-login-action` | altres | 1 | 1371 |
| `sdp-chat` | altres | 1 | 1384 |
| `sdp-chat-avatar--ai` | altres | 1 | 1386 |
| `sdp-msg--self` | altres | 1 | 1393 |
| `sdp-chat-avatar--user` | altres | 1 | 1394 |
| `sdp-chat-input-wrapper` | altres | 1 | 1403 |
| `sdp-flex-1` | altres | 1 | 1404 |
| `sdp-chat-input` | altres | 1 | 1406 |
| `sdp-form-control` | altres | 1 | 1406 |
| `sdp-btn--round` | altres | 1 | 1411 |

### src/sections/gestoria/views/GestoriaBancs.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `up-document` | altres | 1 | 11 |

### src/sections/gestoria/views/GestoriaBurocracia.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-text-mut` | altres | 3 | 25, 28, 37 |
| `sdp-marge-top` | altres | 2 | 20, 37 |
| `up-document` | altres | 1 | 14 |
| `universal-grid` | altres | 1 | 14 |
| `sdp-text-centrat` | altres | 1 | 16 |
| `sdp-text-accent` | altres | 1 | 16 |
| `sdp-text-maj` | altres | 1 | 16 |
| `sdp-dropzone` | altres | 1 | 20 |
| `sdp-dropzone-icona` | altres | 1 | 21 |
| `sdp-dropzone-titol` | altres | 1 | 22 |
| `sdp-marge-bottom-petit` | altres | 1 | 25 |
| `sdp-text-menut` | altres | 1 | 28 |
| `sdp-marge-top-gran` | altres | 1 | 33 |
| `sdp-borde-inferior` | altres | 1 | 34 |

### src/sections/gestoria/views/GestoriaContactes.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `?` | altres | 2 | 48, 75 |
| `:` | altres | 2 | 48, 75 |
| `sdp-taula__accions` | altres | 2 | 55, 80 |
| `sdp-estat` | altres | 1 | 13 |
| `sdp-estat__text` | altres | 1 | 14 |
| `up-document` | altres | 1 | 28 |
| `sdp-marge-bottom` | altres | 1 | 31 |
| `sdp-taula-scroll` | altres | 1 | 44 |
| `sdp-taula--interactiva` | altres | 1 | 48 |
| `'sdp-taula--densa'` | altres | 1 | 48 |
| `''}` | altres | 1 | 48 |
| `sdp-taula__buit` | altres | 1 | 61 |
| `'sdp-insignia--exit'` | altres | 1 | 75 |
| `'sdp-insignia--info'}` | altres | 1 | 75 |

### src/sections/gestoria/views/GestoriaFacturacio.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `?` | altres | 3 | 104, 133, 145 |
| `:` | altres | 3 | 104, 133, 145 |
| `sdp-marge-bottom` | altres | 2 | 50, 63 |
| `sdp-taula__nombre` | altres | 2 | 113, 142 |
| `'sdp-insignia--exit'` | altres | 2 | 133, 145 |
| `sdp-estat` | altres | 1 | 15 |
| `sdp-estat__text` | altres | 1 | 16 |
| `up-document` | altres | 1 | 45 |
| `sdp-formulari` | altres | 1 | 76 |
| `sdp-accions` | altres | 1 | 93 |
| `sdp-accions--final` | altres | 1 | 93 |
| `sdp-taula-scroll` | altres | 1 | 100 |
| `sdp-taula--interactiva` | altres | 1 | 104 |
| `sdp-taula--ampla` | altres | 1 | 104 |
| `'sdp-taula--densa'` | altres | 1 | 104 |
| `''}` | altres | 1 | 104 |
| `sdp-taula__buit` | altres | 1 | 120 |
| `'sdp-insignia--info'}` | altres | 1 | 133 |
| `'sdp-insignia--avis'}` | altres | 1 | 145 |

### src/sections/gestoria/views/GestoriaHome.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-text-mut` | altres | 2 | 62, 76 |
| `sdp-marge-top` | altres | 2 | 62, 64 |
| `0` | altres | 1 | 82 |
| `up-document` | altres | 1 | 31 |
| `universal-grid` | altres | 1 | 31 |
| `text-accent` | altres | 1 | 50 |
| `sdp-taula-wrapper` | altres | 1 | 64 |
| `sdp-taula--zebra` | altres | 1 | 65 |
| `sdp-text-nowrap` | altres | 1 | 76 |
| `sdp-text-dreta` | altres | 1 | 82 |
| `sdp-text-negreta` | altres | 1 | 82 |
| `>` | altres | 1 | 82 |
| `?` | altres | 1 | 82 |
| `'sdp-text-exit'` | altres | 1 | 82 |
| `:` | altres | 1 | 82 |
| `''}` | altres | 1 | 82 |

### src/sections/gestoria/views/GestoriaImpostos.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-taula__nombre` | altres | 9 | 50, 51, 52, 60, 61, 62, 74, 75, 76 |
| `up-document` | altres | 1 | 13 |
| `sdp-llista-accions` | altres | 1 | 18 |
| `sdp-accions` | altres | 1 | 35 |
| `sdp-taula-scroll` | altres | 1 | 41 |
| `sdp-taula--interactiva` | altres | 1 | 45 |

### src/sections/gestoria/views/GestoriaInformes.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `up-document` | altres | 1 | 11 |

### src/sections/gestoria/views/GestoriaIngesta.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-taula__nombre` | altres | 6 | 102, 103, 104, 114, 115, 116 |
| `sdp-accions` | altres | 2 | 68, 81 |
| `up-document` | altres | 1 | 47 |
| `sdp-pujada` | altres | 1 | 52 |
| `sdp-taula-scroll` | altres | 1 | 91 |
| `sdp-taula--interactiva` | altres | 1 | 95 |
| `sdp-taula--ampla` | altres | 1 | 95 |

### src/sections/multimedia/MultimediaSection.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `multimedia-header` | altres | 1 | 24 |
| `multimedia-header__title` | altres | 1 | 25 |
| `section-actions` | altres | 1 | 26 |
| `multimedia-header__actions` | altres | 1 | 26 |
| `card` | altres | 1 | 64 |
| `panel-head` | altres | 1 | 66 |

### src/sections/mur/articles/Aplec2023Article.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `detail-content--plain` | altres | 1 | 3 |

### src/sections/notes/NotesEditor.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `editor-tiptap-container` | altres | 1 | 103 |

### src/sections/onboarding/OnboardingSection.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-text-suau` | altres | 1 | 124 |
| `sdp-accions` | altres | 1 | 128 |

### src/sections/onboarding/OnboardingSteps.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `?` | altres | 4 | 95, 114, 132, 158 |
| `:` | altres | 4 | 95, 114, 132, 158 |
| `''}` | altres | 4 | 95, 114, 132, 158 |
| `'sdp-camp--error'` | altres | 3 | 95, 114, 132 |
| `sdp-accions` | altres | 2 | 53, 177 |
| `sdp-text-suau` | altres | 2 | 70, 74 |
| `sdp-formulari` | altres | 1 | 93 |
| `'has-error'` | altres | 1 | 158 |

### src/sections/poblacio/PoblacioSection.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-text-right` | altres | 2 | 42, 56 |
| `sdp-table-container` | altres | 1 | 36 |
| `sdp-table` | altres | 1 | 37 |
| `sdp-table--poblacio` | altres | 1 | 37 |
| `sdp-table-link` | altres | 1 | 49 |

### src/sections/profile/DetallAjust.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `perfil-detall-buit` | altres | 2 | 59, 183 |
| `sdp-accions` | altres | 2 | 87, 130 |
| `sdp-formulari` | altres | 1 | 80 |
| `perfil-detall` | altres | 1 | 179 |

### src/sections/profile/ProfileSection.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `card` | altres | 1 | 19 |

### src/sections/realitat/RealitatSection.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `-col` | altres | 2 | 73, 115 |
| `card` | altres | 2 | 77, 90 |
| `realitat-container` | altres | 1 | 71 |
| `level` | altres | 1 | 77 |
| `===` | altres | 1 | 77 |
| `currentLevel.id` | altres | 1 | 77 |
| `?` | altres | 1 | 77 |
| `'card--accent'` | altres | 1 | 77 |
| `:` | altres | 1 | 77 |
| `'card--hover'` | altres | 1 | 77 |
| `}` | altres | 1 | 77 |
| `realitat-btn` | altres | 1 | 77 |
| `realitat-agent-label` | altres | 1 | 101 |
| `realitat-agent-checkbox` | altres | 1 | 106 |
| `realitat-agent-avatar` | altres | 1 | 112 |
| `realitat-agent-name` | altres | 1 | 116 |
| `realitat-agent-role` | altres | 1 | 119 |

### src/sections/search/SearchSection.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `sdp-resultats` | altres | 1 | 77 |

### src/sections/translations/TranslationsSection.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `?` | altres | 2 | 39, 48 |
| `:` | altres | 2 | 39, 48 |
| `card` | altres | 1 | 39 |
| `isActive` | altres | 1 | 39 |
| `'card--accent'` | altres | 1 | 39 |
| `'card--hover'` | altres | 1 | 39 |
| `}` | altres | 1 | 39 |
| `'pill--accent'` | altres | 1 | 48 |
| `''}` | altres | 1 | 48 |

### src/sections/xat/XatControlSection.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `card` | altres | 3 | 26, 35, 45 |

### src/sections/xat/XatSection.jsx
| classe | família | ocurr. | línies |
|---|---|---|---|
| `?` | altres | 9 | 161, 205, 206, 207, 208, 291, 311, 429, 476 |
| `:` | altres | 9 | 161, 205, 206, 207, 208, 291, 311, 429, 476 |
| `''}` | altres | 8 | 161, 205, 206, 207, 208, 291, 311, 429 |
| `'active'` | altres | 6 | 205, 206, 207, 208, 291, 429 |
| `===` | altres | 5 | 205, 206, 207, 208, 291 |
| `'d-desktop-only'` | altres | 2 | 161, 311 |
| `sdp-accions` | altres | 1 | 193 |
| `'totes'` | altres | 1 | 205 |
| `'no-llegits'` | altres | 1 | 206 |
| `'grups'` | altres | 1 | 207 |
| `'iaies'` | altres | 1 | 208 |
| `String(th.id)` | altres | 1 | 291 |
| `d-mobile-only` | altres | 1 | 417 |
| `'xat-bubble-wrapper'` | altres | 1 | 476 |
| `'xat-bubble-wrapper--block'}` | altres | 1 | 476 |

## Dinàmiques (prefix amb ${...}: no automatitzables)
- src/app/contexts/RouterContext.jsx:147 — `className`
- src/app/contexts/RouterContext.jsx:163 — `combinedClassName`
- src/components/BrandMark.jsx:7 — `className`
- src/components/layout/AppGridColumn.jsx:65 — `app-grid-col-header${esAcordio`
- src/components/layout/AppGridShell.jsx:93 — `${className}`
- src/components/layout/AppGridShell.jsx:107 — `${panellObert`
- src/components/layout/AppGridShell.jsx:117 — `${panellObert`
- src/components/ui/Accordion.jsx:8 — `${className}`
- src/components/ui/Accordion.jsx:14 — `${className}`
- src/components/ui/Accordion.jsx:17 — `${isOpen`
- src/components/ui/Accordion.jsx:23 — `accordion-item__fletxa${isOpen`
- src/components/ui/Alerta.jsx:17 — `['sdp-alerta', `sdp-alerta--${to`
- src/components/ui/Avatar.jsx:19 — `['sdp-avatar', `sdp-avatar--${m`
- src/components/ui/Avatar.jsx:32 — `['sdp-avatar-grup', className].filter(Boolean).join(' ')`
- src/components/ui/Boto.jsx:20 — `classes`
- src/components/ui/Botonera.jsx:21 — `['sdp-pindola', vertical ? 'sdp-pindola--vertical' : '', cla`
- src/components/ui/Dialeg.jsx:63 — `classes`
- src/components/ui/Divisor.jsx:15 — `${classes}`
- src/components/ui/Divisor.jsx:12 — `classes`
- src/components/ui/Dropdown.jsx:20 — `${className}`
- src/components/ui/Dropdown.jsx:39 — `${right`
- src/components/ui/Dropdown.jsx:53 — `${className}`
- src/components/ui/Insignia.jsx:15 — `[base, className].filter(Boolean).join(' ')`
- src/components/ui/Pestanyes.jsx:34 — `['sdp-pestanyes', className].filter(Boolean).join(' ')`
- src/components/ui/PillToggle.jsx:31 — `['sdp-pindola', className].filter(Boolean).join(' ')`
- src/components/ui/Pista.jsx:26 — `['sdp-pista', className].filter(Boolean).join(' ')`
- src/components/ui/Taula.jsx:12 — `['sdp-taula', densa && 'sdp-taula--densa', className]
      `
- src/components/ui/UniversalCard.jsx:129 — `${classe}`
- src/components/ui/UniversalCard.jsx:148 — `[
          'sp-card-body',
          price && 'has-price',
`
- src/components/ui/UniversalCard.jsx:322 — `cardClasses`
- src/components/ui/UniversalIndicatorCard.jsx:20 — `${active`
- src/components/ui/UniversalIndicatorCard.jsx:20 — `${className}`
- src/components/ui/controls.jsx:18 — `className`
- src/components/ui/controls.jsx:77 — `['sp-card-action', className].filter(Boolean).join(' ')`
- src/components/ui/controls.jsx:103 — `['btn', variantClass, sizeClass, className].filter(Boolean).`
- src/components/ui/estats.jsx:12 — `['sdp-buit', className].filter(Boolean).join(' ')`
- src/components/ui/estats.jsx:23 — `['sdp-carregant', className].filter(Boolean).join(' ')`
- src/components/ui/estats.jsx:32 — `['sdp-esquelet', className].filter(Boolean).join(' ')`
- src/components/ui/estats.jsx:47 — `['sdp-progres', className].filter(Boolean).join(' ')`
- src/components/ui/formulari.jsx:33 — `uneix('sdp-camp', error && 'sdp-camp--error', className)`
- src/components/ui/formulari.jsx:64 — `uneix('sdp-control', className)`
- src/components/ui/formulari.jsx:68 — `uneix('sdp-control', 'sdp-control--area', className)`
- src/components/ui/formulari.jsx:74 — `uneix('sdp-control', 'sdp-control--selector', className)`
- src/components/ui/formulari.jsx:86 — `uneix('sdp-casella', className)`
- src/components/ui/formulari.jsx:102 — `uneix('sdp-grup', error && 'sdp-grup--error', className)`
- src/components/ui/formulari.jsx:132 — `uneix('sdp-grup', className)`
- src/components/ui/formulari.jsx:146 — `uneix('sdp-interruptor', className)`
- src/components/ui/icones.jsx:8 — `className`
- src/components/ui/icones.jsx:28 — `className`
- src/components/ui/icones.jsx:47 — `className`
- src/components/ui/icones.jsx:66 — `className`
- src/components/ui/icones.jsx:82 — `className`
- src/components/ui/icones.jsx:105 — `className`
- src/components/ui/icones.jsx:123 — `className`
- src/components/ui/icones.jsx:145 — `className`
- src/components/ui/navegacio.jsx:14 — `['sdp-molla', className].filter(Boolean).join(' ')`
- src/components/ui/navegacio.jsx:45 — `['sdp-paginacio', className].filter(Boolean).join(' ')`
- src/components/universal/UniversalEditorShell.jsx:32 — `${className}`
- src/components/universal/UniversalEditorShell.jsx:102 — `${isPublished`
- src/components/universal/UniversalPage.jsx:74 — `toc-level-${h.level}`
- src/components/universal/UniversalPage.jsx:200 — `sdp-universal-page-container--${layout}`
- src/components/universal/UniversalPage.jsx:351 — `content-wrapper${noPadding`
- src/components/universal/UniversalPage.jsx:289 — `['page-title', tone && `is-${tone`
- src/components/universal/UniversalPage.jsx:325 — `['sp-card-label', className].filter(Boolean).join(' ')`
- src/components/universal/UniversalToolbar.jsx:41 — `${isHeading`
- src/components/universal/UniversalToolbar.jsx:49 — `${isList`
- src/components/universal/UniversalToolbar.jsx:57 — `${isBold`
- src/components/universal/UniversalToolbar.jsx:65 — `${isItalic`
- src/components/universal/UniversalToolbar.jsx:73 — `${isStrike`
- src/components/universal/manager/ManagerFacets.jsx:44 — `${isActive`
- src/components/universal/manager/ManagerFacets.jsx:123 — `${activeFacets[facet.id]`
- src/icons.jsx:14 — `className`
- src/sections/admin/AdminSection.jsx:21 — `${activeTab`
- src/sections/admin/AdminSection.jsx:28 — `${activeTab`
- src/sections/admin/AdminSection.jsx:35 — `${activeTab`
- src/sections/connectar/ConnectarSection.jsx:205 — `${isPrivate`
- src/sections/connectar/ConnectarSection.jsx:208 — `${!isPrivate`
- src/sections/connectar/ConnectarSection.jsx:229 — `${selectedArea`
- src/sections/dispositius/DevicesSection.jsx:264 — `${profile.isVisible`
- src/sections/dispositius/DevicesSection.jsx:330 — `devices-status--${state}`
- src/sections/dispositius/DevicesSection.jsx:385 — `devices-status--${activeChatConnection?.state`
- src/sections/dispositius/DevicesSection.jsx:413 — `${selectedPeerId`
- src/sections/dispositius/DevicesSection.jsx:427 — `${message.sender`
- src/sections/gestoria/views/GestoriaContactes.jsx:48 — `${vistaComprimida`
- src/sections/gestoria/views/GestoriaContactes.jsx:75 — `${esClient`
- src/sections/gestoria/views/GestoriaFacturacio.jsx:104 — `${vistaComprimida`
- src/sections/gestoria/views/GestoriaFacturacio.jsx:133 — `${esVenda`
- src/sections/gestoria/views/GestoriaFacturacio.jsx:145 — `${conciliada`
- src/sections/gestoria/views/GestoriaHome.jsx:82 — `${ev.amount`
- src/sections/gestoria/views/GestoriaIngesta.jsx:118 — `sdp-insignia--${document.variant}`
- src/sections/onboarding/OnboardingSteps.jsx:95 — `${errors.name`
- src/sections/onboarding/OnboardingSteps.jsx:114 — `${errors.email`
- src/sections/onboarding/OnboardingSteps.jsx:132 — `${errors.password`
- src/sections/onboarding/OnboardingSteps.jsx:158 — `${errors.rgpd`
- src/sections/onboarding/OnboardingSteps.jsx:148 — `errors.password ? 'sdp-camp__error' : 'sdp-camp__ajuda'`
- src/sections/profile/DetallAjust.jsx:125 — `missatge.tipus === 'exit' ? 'sdp-text-exit' : 'sdp-camp__err`
- src/sections/profile/ProfileSection.jsx:51 — `String(agent.id) === String(selectedAgent?.id) ? 'card-link-`
- src/sections/realitat/RealitatSection.jsx:77 — `${`
- src/sections/translations/TranslationsSection.jsx:39 — `${`
- src/sections/translations/TranslationsSection.jsx:48 — `${isActive`
- src/sections/xat/XatSection.jsx:17 — `sdp-avatar--${size}`
- src/sections/xat/XatSection.jsx:20 — `sdp-avatar--${size}`
- src/sections/xat/XatSection.jsx:161 — `${threadId`
- src/sections/xat/XatSection.jsx:205 — `${activeFilter`
- src/sections/xat/XatSection.jsx:206 — `${activeFilter`
- src/sections/xat/XatSection.jsx:207 — `${activeFilter`
- src/sections/xat/XatSection.jsx:208 — `${activeFilter`
- src/sections/xat/XatSection.jsx:291 — `${threadId`
- src/sections/xat/XatSection.jsx:311 — `${!threadId`
- src/sections/xat/XatSection.jsx:429 — `${menuOpen`
- src/sections/xat/XatSection.jsx:476 — `${classes}`
- src/sections/xat/XatSection.jsx:476 — `${modeSeleccio`
```

**Atenció Consell:**
1. **Per a Claude:** Hem verificat la termodinàmica i encara tens una bona finestra de context (queda ~75%). Ets el mestre d'obres més fiable en aquests moments. Volem aprofitar aquest cicle estratègicament: retorna els blocs de codi JSX complets i refactoritzats exclusivament per a la teua parcel·la (`Onboarding`) i, a més, elabora i retorna el fitxer `mapa.json` canònic amb les equivalències (de Tailwind a Pedra Seca) basant-te en l'informe_orfenes.md per tal d'automatitzar la resta.
2. **Per a la resta de l'Eixam (Qwen, Deepseek, Dola, etc.):** El company Codex està inactiu. Necessitem voluntaris per assumir les seues tasques pendents:
   - **Parcel·la B:** `DevicesSection.jsx` i classes `univ-manager-*` / `admin-*`
   - **Parcel·la C:** Les vistes de `Gestoria` (veure l'informe d'orfes amunt).
Escolliu una parcel·la, apliqueu la metodologia *Pedra Seca* de substitució estricta (sense alterar el DOM) i retorneu els blocs JSX complets.
