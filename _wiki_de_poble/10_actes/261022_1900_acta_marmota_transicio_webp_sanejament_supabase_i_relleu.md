---
type: acta
status: esborrany
description: 'Tancament de sessió: 75 bessones WebP, commit 8fcbd22aa, Supabase sanejat taula per taula, avatar de Javi en WebP i deures per al següent torn.'
tags:
  - acta
visibility: private
reflex: sdp:torn_2d59d6bf-8aef-4462-91e3-f6c5766a52b6:7acd8468-ee40-4dd7-af50-cba39512fc77
---
# Acta Marmota: Transició Integral a WebP, Sanejament de Supabase i Relleu Tècnic

> **Nota per a la IAIA:** Aquesta plantilla fon l'acta tècnica, el registre d'estat mental i el punt de control per al següent torn (Marmota). Ha de ser un document ric, detallat i exhaustiu. No escatimes en tokens ací, l'historial és la nostra única memòria a llarg termini. Descriu en profunditat què s'ha tocat, per què, i quins conflictes s'han superat.

<!-- SDP:SECTION acta.s1 -->
## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:torn_2d59d6bf-8aef-4462-91e3-f6c5766a52b6:7acd8468-ee40-4dd7-af50-cba39512fc77 |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local |
| Creació | 2026-10-22T16:58:13.023Z |
| Modificació | 2026-10-22T16:58:13.023Z |
| Propietari | agent-local |
| Aprovació humana | pendent |
| Plantilla | _wiki_de_poble/03_actuar/plantilles/acta.md (v2.0.0) |
| Model IA | Antigravity (IAIA MarIA) + Claude Opus 5.5 + Gemini 4 Argon |
| Tokens consumits | 4500 |

<!-- SDP:SECTION acta.s2 -->
## Acte reflex

Plantilla entregada: _wiki_de_poble/03_actuar/plantilles/acta.md; SHA-256 d0a64c35b75833b88ea561903829fb02558db7be214a9ee5844045cafc1333a1. El rebut acredita entrega, no comprensió.

<!-- SDP:SECTION acta.s3 -->
## Historial

- **2026-10-22T14:45Z:** Inici del torn de MarIA per a la planificació i coordinació de la Transició Integral a WebP Natiu i Xarxa de Salvavides de Bessones.
- **2026-10-22T15:05Z:** Claude Opus obri torn per implementar les tasques 1, 2 i 3 del pla.
- **2026-10-22T15:30Z:** Gemini 4 Argon inicia el preflight i l'auditoria adversària del codi.
- **2026-10-22T16:00Z:** Auditoria i sanejament radical de Supabase en remot (23 taules públiques auditades taula per taula).
- **2026-10-22T16:30Z:** Ampliació de les bessones: conversió a WebP dels 67 originals restants a `public/assets/`.
- **2026-10-22T16:50Z:** Resolució dels 3 parells ambigus conservant els `.png` com a canònics i retirant els 3 `.jpg` duplicats a `_multimedia_de_poble/originals_raster_public/`.
- **2026-10-22T17:15Z:** Aprovació de la clau «disseny» a la frontissa (`frontissa-contingut.mjs`) per decisió del Mestre.
- **2026-10-22T17:25Z:** Commit definitiu `8fcbd22aa` executat per Claude Opus (97 camins, suite de proves passada amb 20.995 proves en verd).
- **2026-10-22T17:40Z:** El Mestre executa amb èxit a Supabase l'actualització de l'avatar oficial de Javi Llinares a 1200px WebP i la conversió de cadenes a `app_content`.
- **2026-10-22T18:55Z:** Tancament de sessió, redacció de l'Acta Marmota, verificació de portes i preparació del següent nanochat.

<!-- SDP:SECTION acta.s4 -->
## Resultats

### 1. Sanejament Radical de Supabase (Salfumant Taula per Taula)
- **`public.profiles`:**
  - Javi Llinares (`javillinares`): avatar oficial actualitzat a `/assets/fotos/javi-llinares-perfil-1200px.webp`. Ofici: «Dissenyador gràfic». Poble: «La Torre de les Maçanes». `is_public = TRUE`. Comarques i províncies harmonitzades en format JSONB array.
  - Carmen Chaves (`carmenchaves`): nom oficial complet, ofici «Guionista i escriptora», `is_public = TRUE`.
  - Damià Llorens (`damianllorens`): ofici «Mestre d'escola», `is_public = TRUE`.
- **`public.town_memberships`:**
  - Purgat l'usuari fantasma `05cee510...` i l'entitat de prova «Poble de Llavors».
  - La taula queda estrictament amb **3 membres oficials** per a La Torre de les Maçanes (`e822f540-3ab1-47de-821c-ecbb0e18a2ac`): Javi Llinares (`admin`), Carmen Chaves (`member`) i Damià Llorens (`member`).
- **`public.app_content`:**
  - Totes les ocurrències de cadenes `.jpg` i `.jpeg` substituïdes massivament per `.webp` a tot el payload JSONB (`mediaItems`, `marketItems`, `towns`, `events`).
- **`public.user_tags`:**
  - Purgada i eliminada definitivament (`DROP TABLE IF EXISTS public.user_tags CASCADE`).
- **`public.user_platform_roles`:**
  - Javi Llinares registrat com a `superadmin` oficial de la plataforma.
- **Família `xat_*`:**
  - Verificada la integritat de les 5 taules del xat amb RLS blindada i suport per a perfils individuals i entitats (`com_org_id`).

### 2. Transició Integral a WebP Natiu (Commit `8fcbd22aa`)
- **75 bessones WebP noves:** Cobertura del 100% de les imatges de `public/assets/`.
- **3 parells ambigus resolts:** Els `.png` es queden com a originals canònics; els 3 `.jpg` duplicats retirats netament a `_multimedia_de_poble/originals_raster_public/`.
- **Guarda WebP client-side (`src/utils/pujadaImatge.js`):** Nova funció `garantixWebp` que assegura que cap foto puja a Storage en JPEG o PNG des de navegadors moderns.
- **Alliberament de memòria als Canvas:** Enquadrament i codificació alliberen la memòria (`width = height = 0`) en un bloc `finally` per blindar Safari i WebKit/iOS contra desbordaments de memòria.
- **Salvavides de bessones (`src/main.jsx`):** Instal·lat sobre `#root`, garantint que si una imatge WebP falla, demana automàticament els formats de reserva sense bucles i respectant `LLEI_06_ENCAPSULAMENT`.
- **Suite completa:** 20.995 proves en verd.

### 3. Diagnòstic dels 404 a Producció (`socdepoble.org`)
- A la consola del navegador en producció es veuen errors 404 per a `/assets/fotos/javi-llinares-perfil-1200px.webp` i `/assets/events/aplec_2023_cartell.webp`.
- **Motiu exacte:** La base de dades Supabase ja ha sigut migrada a WebP i demana les rutes noves, però Firebase Hosting encara serveix la compilació antiga. Tan bon punt es faça el desplegament a Firebase, els fitxers físics estaran al servidor i els 404 desapareixeran, mostrant les imatges amb màxima definició.

<!-- SDP:SECTION acta.s5 -->
## Pendents

1. **Desplegament a Firebase Hosting (`socdepoble.org`):**
   - Executar `npm run build:web`.
   - Desplegar amb les credencials del sistema:
     ```bash
     GOOGLE_APPLICATION_CREDENTIALS=/Users/javillinares/.config/gcloud/application_default_credentials.json npx -y firebase-tools deploy --only hosting --project soc-de-poble -c /Users/javillinares/Documents/Antigravity/Som\ de\ Poble/_investigacio_ia_de_poble/261021_1645_salfumant_claude/firebase/proposta/firebase.json
     ```
   - Comprovar que a `https://socdepoble.org/mur` desapareixen els 404 i l'avatar i els cartells es renderitzen nítidament.
2. **Compilació i Empaquetat de WordPress:**
   - Executar `npm run build:wp`.
   - Empaquetar el fitxer ZIP segons el protocol de `core-empaquetat-wp`.
3. **Sincronització de Capacitor per a Apple i Google:**
   - Executar `npx cap sync` per reflectir els nous actius i configuracions als projectes natius d'iOS i Android.
4. **Continuïtat de les Auditories Adversarials:**
   - Obrir nova ronda d'auditories destructives i constructives amb el Consell (Claude Opus, Gemini, Codex).

<!-- SDP:SECTION acta.s6 -->
## Vincles

- [[00_index]]
- [[00_index_escriptori]]
- [[261022_1645_pla_implementacio_transicio_webp_i_salvavides]]
- [[261022_1700_auditoria_gemini]]
- [[261022_1725_auditoria_claude]]

