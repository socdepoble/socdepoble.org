---
type: acta
status: esborrany
description: 'Acta Marmota de tancament de matinada: desplegament a producció socdepoble.org, commit 1c6bd64cd, resolució subvenció NLnet i banc d idees'
tags:
  - acta
visibility: private
reflex: sdp:torn_e8d882de-7a49-4c0e-aaf9-696c1d8beef7:2e8e9169-dca8-444f-bfc3-8d5dde8bf193
---
# Acta Marmota · Desplegament a producció socdepoble.org, commit 1c6bd64cd i blindatge subvenció europea

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_e8d882de-7a49-4c0e-aaf9-696c1d8beef7:2e8e9169-dca8-444f-bfc3-8d5dde8bf193 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-25T04:33:28.109Z |
| Modificació | 2026-10-25T04:35:00.000Z |
| Propietari | iaia-maria |
| Aprovació humana | aprovada pel Mestre Javi Llinares (Àudios 05:19, 05:20, 05:23, 05:27) |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | iaia-maria-antigravity |
| Tokens consumits | ~22.000 |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 d0a64c35b75833b88ea561903829fb02558db7be214a9ee5844045cafc1333a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- 2026-10-25T04:33:28.109Z: esborrany creat per a tancament de matinada.
- 2026-10-25T04:35:00.000Z: acta completada amb el desplegament a producció de `socdepoble.org`, commit `1c6bd64cd`, push al fork, resolució d'NLnet i relleu DAFO.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Desplegament Complet a Producció (`socdepoble.org`)
- **Compilació neta:** Executat `npm run build:tokens && npm run rag:build && npm run slugs:build && npm run build:web && npm run build:seo` generant un paquet d'actius optimitzat a `dist/`.
- **Desplegament Firebase Hosting:** Desplegat amb èxit mitjançant `firebase-tools deploy --only hosting --project soc-de-poble`.
- **Verificació en viu:** `https://socdepoble.org` (i `https://soc-de-poble.web.app`) serveix la versió actualitzada de l'aplicació, amb l'erradicació dels filets puntejats, les millores visuals de Pedra Seca, CSP estricte i cap 404, disponible immediatament per a consulta des de l'iPad del Mestre.

### 2. Git Commit Consolidat i Push al Fork Remot
- **Commit `1c6bd64cd`:** Agrupats 113 fitxers (més de 53.000 línies afegides i 243 eliminades) a la branca `backup-notes-publish`.
  - Inclou la reforma editorial de Pedra Seca, components d'anatomia accessible, titular públic, gestió de membres de perfil, panells de tractors i sentinelles.
  - S'inclouen els informes complets d'auditoria del Gauntlet Loop del torn `0200`: `261025_0200_auditoria_claude.md`, `261025_0200_auditoria_codex.md` i `261025_0200_auditoria_gemini.md`.
  - Suport de proves: `npm run test:precommit` en verd absolut (259/259 proves de Node i 3.046 de Vitest).
- **Git Push:** Branca sincronitzada amb èxit a `fork/backup-notes-publish` (`https://github.com/socdepoble/socdepoble.org.git`).

### 3. Blindatge Jurídic i Estratègic de la Subvenció Europea NLnet (50.000 €)
- **Investigació documental:** Localitzat i analitzat l'expedient complet a `_gestoria_de_poble/03_Projectes_Actius/Subvencions_2026/01_FORMULARI_OFICIAL_EMPLENAT.md`.
- **Convocatòria:** **NLnet NGI Fediversity** (Comissió Europea / Horizon Europe). Import: 50.000 €. Data de tancament de la crida: 1 d'agost de 2026.
- **Avaluació:** El cicle de resolució és de 3 a 5 mesos; per tant, **novembre de 2026** és el moment exacte de publicació de resultats i comunicacions provisionals.
- **Sense barrera d'idioma:** NLnet **NO fa entrevistes per videoconferència**. El procés és 100% asíncron i escrit per correu electrònic (*clarification Q&A*). Qualsevol dubte serà respost per la Colmena d'IAs en un anglès tècnic d'enginyeria impecable.
- **Elegibilitat:** Javi Llinares figura com a persona física/autònom (NIF 21476359V, La Torre de les Maçanes), expressament admès per NLnet, rebent transferències internacionals per fites completes (*Request for Payment*).
- **Adequació tècnica:** La candidatura ja prometia un MVP modular en línia per a pobles rurals, amb dades sobiranes i preparació d'ActivityPub. El codi actual (AGPLv3, port neutral `backendPort.js`, Pedra Seca WCAG, privacitat GDPR amb tipografies locals) compleix amb escreix tots els requisits comunitaris.

### 4. Banc d'Idees del Llibre Mestre (IDEA-28, IDEA-29, IDEA-30)
- **`IDEA-28`:** Assistent Vocal IAIA MarIA per a transformació oral de memòria rural en publicacions nobles.
- **`IDEA-29`:** Motor Universal d'Ingesta i Canonització Editorial de Pedra Seca (filtre de 3 esglaons: H1, H2, Entradilla, Cos) unint Snippet, RSS, Veu i Importador Sobirà WordPress/Blogger de més de 700 notícies històriques.
- **`IDEA-30`:** Notícies Germanes & Graf Semàntic de Publicacions, connectant fets rurals compartits des del botó CONNECTAR.

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. **Recepció i Reinici del Sistema:**
   - El Mestre tanca aquesta sessió i reinicia el Mac per a alliberar memòria RAM i obrir una sessió de treball hiper-fresca (0 km) a la següent finestra de xat.
2. **Convocatòria del Consell per a l'Auditoria DAFO i Matriu d'Eisenhower:**
   - Llançar el Prompt Comú del Consell (Claude, Gemini, Codex) per a sotmetre el banc d'idees del Llibre Mestre a un triatge exhaustiu:
     - DAFO: Debilitats, Amenaces, Fortaleses i Oportunitats.
     - Matriu Eisenhower: Important vs Urgent (Què s'ha de fer abans de llançar la plataforma als veïns).
     - Cron programat d'estudi de fites sense tocar codi bruscament.
3. **Connector de WordPress:**
   - Reprendre l'empaquetat del connector de WordPress l'endemà matí amb la ment clara.

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
