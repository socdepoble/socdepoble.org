---
tipus: document
estat: esborrany
description: Informe d'Auditoria del Bundle 2609080401BUNDLEauditoria
---
# Informe d'Auditoria del Bundle 260908_0401_BUNDLE_auditoria

## Resum executiu

El projecte **Sóc de Poble** presenta una arquitectura híbrida amb una forta inversió en governança documental, automatització d'auditories (tractors/gates) i un sistema de skills per a agents d'IA. El bundle analitzat conté 425 fitxers (3,29 MB) i mostra un projecte en fase de consolidació, amb una cultura de deute tècnic declarat i mecanismes per a controlar-ne l'evolució.

---

## 1. Estructura i Organització

**Punts forts:**
- **Separació clara en 4 pilars operatius** (`00_SER`, `01_SABER`, `02_ACTUAR`, `03_GOVERNAR`) + 2 zones de cicle de vida (`04_ARXIU`, `05_ESCRIPTORI`).
- **Sistema de frontmatter v2** normalitzat amb `estat`, `tipus` i `description` obligatoris.
- **Índexos interconnectats** (`00_INDEX`, `00_INDEX_IDENTITAT`, `00_INDEX_ESCRIPTORI`) que creen un graf navegable.
- **Contracte de bundle explícit** al manifest: directoris inclosos, fitxers obligatoris/opcionals, extensions i exclusions.

**Observacions:**
- L'arquitectura és **Online-First** per decisió (ADR-2026-08), però la documentació conserva referències històriques a "Online-First" i "dispositius moderns" que s'han anat esmenant (vegeu `BASELINE.md` i les purgues de l'A10).
- La wiki i el codi estan clarament separats: la wiki és documental, el codi viu a `src/`, les eines a `tooling/`.

---

## 2. Deute Tècnic Declarat

El projecte manté **baselines de deute** congelats a `.agents/deute/`:

| Fitxer | Descripció | Xifra (max) |
|--------|------------|-------------|
| `.design-guard-deute.json` | Estils en línia, colors crus, focus invisible, Tailwind visual | 125 inline, 33 raw-color |
| `.pedra-seca-deute.json` | Classes òrfenes, tokens fantasma, encapsulament | 116 classes orfes, 10 tokens fantasma |
| `.estucat-deute.json` | Regles CSS buides i classes òrfenes | 0 buides, 50+ orfes |
| `.rutes-deute.json` | Literals de ruta orfes | 103 literals |
| `.vocabulari-deute.json` | Classes forasteres i opaques | 168 forasteres, 13 opaques |
| `.promesa-deute.json` | Promeses incomplertes (eines que fallen obert) | P2:9, P3:5 |

**Valoració:** El fet de tenir aquests baselines és **positiu**: demostra consciència del deute i mecanismes perquè no creixi. No obstant, les xifres són altes i el deute acumulat és considerable (especialment estils en línia i classes òrfenes). Es recomana prioritzar la reducció del deute de Pedra Seca (`--pedra-seca-deute`) atès que impacta directament la mantenibilitat visual.

---

## 3. Sistema d'Auditories i Portes (Gates/Tractors)

El projecte compta amb **més de 30 portes mecàniques** (`tooling/gates/`) que verifiquen:

- Integritat de la wiki (`tractor-frontmatter`, `tractor-esquemes`)
- Coherència del sistema de disseny (`design_guard`, `tractor-pedra-seca`, `tractor-cromatic`, `tractor-tokens`)
- Rutes i navegació (`tractor-rutes`, `tractor-rutes-web`, `tractor-graella`)
- Privacitat i persistència (`tractor-persistencia`, `LLEI_05_Privacitat`)
- Deute i promeses (`tractor-promesa`, `consolidar_baselines`)
- Contracte d'enxufabilitat amb Sollutia (`tractor-enxufe`, `tractor-sollutia`)

**Punts crítics detectats al bundle:**
- La porta `design_guard.mjs` **va estar mesos sense executar-se** per manca de CLI (ja corregit).
- La cadena `npm run porta` **decapitava** les portes posteriors perquè `porta:promesa` exigia un baseline que no existia (corregit al `tractor-cadena`).
- El **manifest de rutes SEO** (`wordpress-plugin/dist/seo-routes.json`) no es generava automàticament; ara `build-seo-manifest.mjs` ho resol.

**Recomanació:** Revisar que totes les portes estiguin integrades a `run-portes.mjs` i que el CI les executi. La porta `tractor-cadena` és especialment valuosa per detectar cadències trencades.

---

## 4. Skills i Agents

El sistema de skills (`.agents/skills/`) està ben organitzat amb:

- **Core skills** (sempre carregades): `identity-iaia-voice`, `pedra-seca`, `core-context-panic`, etc.
- **Skills efímeres** (per gallets): `skill-acte-reflex`, `skill-consell-bundle`, etc.
- **Índex canònic** (`00_INDEX_SKILLS.md`) que és la font única d'autoritat executiva (per `AGENTS.md` §1).

**Observació:** La "Regla Sagrada" d'enumerar les 12 Petorretes (IAs del Consell) es va detectar com a prosa dins de la wiki, però ja hi ha un `tractor-cens` que la fa complir mecànicament a partir de `.agents/consell.json`. Això és una bona pràctica: **les regles executives han de ser dades, no prosa**.

---

## 5. Codificació i Estil (Pedra Seca)

El projecte aplica **Pedra Seca** com a sistema de disseny amb tokens CSS semàntics. El `tractor-tokens` i el `tractor-cromatic` verifiquen que:

- No hi ha `var(--sdp-*)` sense definició.
- No hi ha fallbacks dins de `var()` (s'han d'afegir al tema si calen).
- Les primitives (`--sdp-pedra-*`) no es citen directament des de components.
- Els comentaris de contrast han de reflectir el contrast real calculat.

**Problemes detectats:**
- Encara hi ha **estils en línia** (125 infraccions) i **colors crus** (33) escampats.
- El `design_guard` reporta **Tailwind visual** (classes `bg-*`, `text-*`) en alguns fitxers.
- Classes com `sdp-text-suau` no tenen definició consistent en tots els temes.

**Recomanació:** Fer una passada de migració massiva cap a tokens semàntics, especialment a `src/sections/disseny/DesignSection.jsx` (que actua com a Storybook) i a `src/components/universal/UniversalComponents.jsx`.

---

## 6. Privacitat i Dades

El document `LLEI_05_Privacitat.md` estableix:

- Privacitat per defecte.
- Consentiment en el moment de l'acció (no banners genèrics).
- Dret d'oblit i minimització de dades.
- Anonimització abans d'enviar a IAs externes.

**Observació:** El projecte utilitza Supabase com a backend, però el codi està preparat per a ser injectat per Sollutia (`host.js` + `backendPort.js`). Això permet separar la capa de dades de la lògica de negoci, complint amb la Llei de l'Enxufabilitat.

**Risc:** El fitxer `supabase/seed.sql` conté dades de prova que inclouen noms reals (Javi Llinares) i dades fictícies. Tot i que no són dades sensibles, caldria assegurar que mai es pugen a producció amb dades reals.

---

## 7. Documentació i Wiki

La wiki és extensa i ben interconnectada. Destaca:

- **`CORE_Registre_Automillora.md`** : un registre històric de canvis de comportament, amb mètriques de temps i tokens estalviats. És una pràctica excel·lent per a la traçabilitat de decisions.
- **`perfil_psiquiatric.md`** : defineix el "perfil psicològic" de la IAIA, amb metàfores rurals i normes de comportament.
- **`Soci_Sollutia.md`** : defineix la relació amb el soci tecnològic, establint límits i rols.

**Punts millorables:**
- Alguns enllaços estan trencats (ex: `00_GLOSSARI_CANONIC` a `00_INDEX_IDENTITAT.md`).
- Hi ha referències a `Sollutia (BROKEN LINK: Sollutia)` que caldria arreglar.

---

## 8. Integració amb WordPress

El projecte està pensat per a ser incrustat com a **Web Component** dins de WordPress (vegeu `PedraSecaEmbed.jsx` i el plugin `wordpress-plugin/`). Això permet:

- Integració amb Gutenberg mitjançant un bloc personalitzat.
- Rutatge React dins d'una pàgina PHP.
- Aïllament de CSS amb Shadow DOM.

**Risc detectat:** El component utilitza `adoptedStyleSheets` per compartir estils entre instàncies, però si el navegador no ho suporta, cau a `<style>`. S'ha verificat que el full d'estils es carrega correctament.

---

## 9. Configuració i Dependències

- **Node ≥20** i **npm** com a gestor (no pnpm/yarn).
- Dependències principals: React 18, Vite 7, Supabase, TipTap, Lucide.
- **DevDependencies** inclouen `@babel/parser`, `eslint`, `vitest`, etc.

**Observació:** El `package.json` conté scripts de porta (`npm run porta`) que executen tota la cadena d'auditories. Això és robust i permet CI.

---

## 10. Recomanacions finals

1. **Reduir el deute de Pedra Seca** : Prioritzar la migració d'estils en línia i colors crus cap a tokens semàntics.
2. **Actualitzar els enllaços trencats** de la wiki (especialment els que apunten a `Sollutia` i `00_GLOSSARI_CANONIC`).
3. **Verificar que el CI executi `npm run porta`** i que cap porta estigui en pausa (especialment `design_guard`, `tractor-rutes` i `tractor-promesa`).
4. **Documentar les exempcions** del `doctrina-ignora.txt` perquè no es converteixin en forats de control.
5. **Revisar la generació del seed SQL** per assegurar que no conté dades reals.
6. **Mantenir el LEDGER actualitzat** amb les decisions arquitectòniques importants (ja es fa, però cal continuar).

---

## Conclusió

El projecte **Sóc de Poble** està ben governat, amb una cultura de qualitat i auditories automatitzades. El deute tècnic és conscientment declarat i controlat. Les contradiccions històriques (Offline vs Online, A10 vs Baseline 2022) s'han resolt amb ADRs i portes mecàniques. La integració amb Sollutia està ben encapsulada.

**El bundle és complet i verificable** (el manifest inclou hashes i el contracte d'abast). L'equip ha learned de les auditories anteriors (especialment la del Seient Núm. 5) i ha mecanitzat les regles que abans eren prosa.

**Apte per a passar al Consell de la Petorreta.**
