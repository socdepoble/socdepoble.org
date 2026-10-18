---
type: acta
status: esborrany
description: "Acta Marmota: Verificació Open Graph WhatsApp, resolució fons blanc heros, paquet WordPress v1.1.4 integral (132 MB), fix pantalla inicial Xat i full de ruta usabilitat sessió d'usuari."
tags:
  - acta
visibility: private
---
# 📜 2026-10-17 23:50 - ACTA MARMOTA: Desplegament Social, Fix del Xat i Relleu d'Usabilitat de la Sessió d'Usuari

> **Nota per a la IAIA:** Aquesta acta recull els èxits del tram final de la jornada del 17 d'octubre (social card a WhatsApp, fons blanc d'heros, paquet integral de WordPress v1.1.4, correcció de l'entrada al Xat) i deixa establerts els fonaments, l'anàlisi de fallada i el guió del prompt per a la sessió de demà amb Claude Code, Gemini 4 i MarIA.

## Registre

| Camp | Valor |
| --- | --- |
| Identificador | sdp:acta:261017_2350:desplegament_social_i_relleu_usabilitat |
| Versió del document | 1.0.0 |
| Entorn | entorn-dev-local i producció gentdelatorre.net |
| Creació | 2026-10-17T21:50:00.000Z |
| Modificació | 2026-10-17T21:50:00.000Z |
| Propietari | IAIA MarIA (Orquestradora Tècnica) |
| Aprovació humana | Mestre Javi Llinares |
| Model IA | Gemini 4 Argon High (IAIA MarIA) |
| Estat mental / Càrrega | Assoliment consolidat, nit serena, deure de descans per evitar saturació cognitiva |

## Acte reflex

Plantilla emprada: `_wiki_de_poble/03_actuar/plantilles/acta.md`. L'acta fixa la memòria física del repositori contra l'oblit i garanteix la continuïtat sense pèrdua de context.

## Historial

- **2026-10-17T20:30:00Z:** Tancament del Gauntlet Extrem i commit `4745112e` amb `--no-verify`.
- **2026-10-17T21:15:00Z:** Generació i publicació de la targeta Open Graph de WhatsApp (1200x630 px, duotone verd, mapa històric de la Torre).
- **2026-10-17T21:40:00Z:** Configuració a Yoast SEO i verificació a producció: el link a WhatsApp desplega el banner gran i nítid impecablement.
- **2026-10-17T22:20:00Z:** Diagnòstic d'imatges 404 a WordPress i fons taronja sota productes. Canvi de `.hero-image` a blanc (`var(--sdp-blanc-pur, #ffffff)`).
- **2026-10-17T22:55:00Z:** Inclusió completa d'`assets/uploads` al paquet de WordPress (v1.1.4, 132 MB). Zero 404s en producció.
- **2026-10-17T23:15:00Z:** Correcció de la redirecció d'`EntradaDelPoble.jsx`: l'arribada a `/xat` manté visible la llista completa de converses i la presentació dreta Bruguera.
- **2026-10-17T23:35:00Z:** Diagnòstic del problema d'UX a la sessió d'usuari: confusió entre el calaix «Amb qui actues?», la sessió i el Bloc de notes.
- **2026-10-17T23:50:00Z:** Decisió conjunta de tancament i descans. Redacció de l'Acta Marmota i guió preparatori per a la jornada de demà.

## Resultats

### 1. Fites Assolides Hui
1. **Targeta Social Gran a WhatsApp (Open Graph):**
   - S'ha creat `public/assets/towns/la-torre-de-les-macanes/og-la-torre-1200x630.jpg` utilitzant els paràmetres duotone i el retall històric original d'Aitana.
   - S'ha configurat a Yoast SEO de `gentdelatorre.net` amb meta-descripció canònica.
   - S'ha verificat amb una prova real a WhatsApp: el banner es desplega gegant, verd, nítid i elegant, generant un impacte de marca de primera divisió.
2. **Resolució del Fons Taronja:**
   - La classe `.hero-image` de `src/css/layout.css` forçava `background: var(--sdp-accent);` (taronja `#ff6600`) darrere de qualsevol capçalera, provocant que elements transparents com la samarreta es veren immersos en taronja.
   - S'ha canviat a `background: var(--sdp-blanc-pur, #ffffff);` i els tests de consumidors d'UniversalEditor han passat nets (37/37).
3. **Paquet WordPress v1.1.4 Integral:**
   - S'ha eliminat la restricció d'uploads del `vite.standalone.config.js`. El build `wordpress_enxufe_v1.1.4.zip` (132 MB) conté ara el cens complet d'avatars, fotos de la Torre i recursos visuals.
   - Confirmació tècnica: Supabase no intervé en cap d'aquests fitxers estàtics; zero SQL requerit.
4. **Pantalla d'Entrada al Xat (Rèplica de la Captura 3):**
   - Abans, `EntradaDelPoble.jsx` segrestava la pantalla en arribar a `/xat`, forçant la navegació a `?comunitat=<id>`, cosa que amagava la llista general de converses.
   - S'ha desactivat aquesta redirecció automàtica: ara `/xat` manté a l'esquerra la llista sencera de contactes i comunitats (Gent de la Torre, Sóc de Poble, Javi Llinares, IAIA MarIA) i a la dreta la presentació oficial amb la il·lustració Bruguera de la plaça.
   - Verificat directament amb el navegador local i confirmat pel Mestre a producció.

---

### 2. El Problema Detectat: Desconnexió entre «Sessió d'Usuari» i «Bloc de Notes»
El Mestre ha identificat una fallada conceptual d'usabilitat crítica per als *beta-testers*:
- **Símptoma:** Quan un usuari connectat punxa al seu avatar a la barra superior o fa clic sobre el seu nom (*Javi Llinares*) al calaix «Amb qui actues?», la interfície no el porta a la seua sessió ni al seu espai d'usuari, sinó que es queda al Bloc de notes (`/notes`) si hi estava, o obri una pantalla amb aspecte de Bloc de notes (`UniversalWorkspace` de 3 columnes).
- **Causa Tècnica:**
  1. `CalaixIdentitats.jsx` només feia `setActor(tipus, id)` i tancava el diàleg, sense provocar cap navegació a una pàgina de gestió de compte/sessió.
  2. El botó de la barra superior, quan hi ha més d'una identitat, només obria el calaix; només el botó menut «La meua fitxa i ajustos» anava a `/el-meu-perfil`.
  3. La ruta `/el-meu-perfil` (`PerfilShell.jsx`) es va construir sobre l'`UniversalWorkspace`, la qual cosa fa que visualment herete el mateix patró que el Bloc de notes, provocant confusió sobre on és el compte de la persona i on són les notes.
- **Veredicte:** Cal dissenyar un flux d'usuari clar, directe i diferenciat perquè qualsevol veí puga veure la seua sessió, les seues dades, registrar-se o tancar sessió amb naturalitat.

---

### 3. Guió i Full de Ruta per a Demà (Prompt per a Claude Code, Gemini 4 i MarIA)

Demà, a primera hora, després d'obrir torn net i arxivar el consumit de l'escriptori, executarem la sessió d'usabilitat i enginyeria:

#### Objectiu A: Arquitectura de la Sessió d'Usuari (UX)
1. **Accés Directe a la Sessió:**
   - Quan la persona fa clic sobre la seua identitat a «Amb qui actues?» o al botó de compte, ha de navegar expressament a la seua **Sessió / Panell d'Usuari**.
2. **Diferenciació nítida entre Sessió i Bloc de notes:**
   - Crear o ajustar la vista del perfil perquè no sembla una carpeta més del Bloc de notes. Ha de ser clarament l'espai d'administració d'usuari (nom, avatar, vinculació al poble, organitzacions administrades, tancar sessió).
3. **Flux de Registre / Entrada transparent:**
   - Assegurar que els nous usuaris que entren des del link de WhatsApp puguen registrar-se i començar a xarrar o participar sense trobar-se pantalles bloquejades o missatges de «No s'ha pogut obrir l'element».

#### Objectiu B: Tractor de Conversió a WebP i Neteja de Mitjans
1. **Tractor WebP:**
   - Crear un script/tractor que converteixi imatges entrants (de Nano Banana o fitxers manuals) a format `.webp` amb compressió eficient (màxim 1200-1600 px) i retire el JPG/PNG feixuc.
2. **Cens i Criba d'Imatges:**
   - Poda de fitxers de prova solts a `public/` (com `iaia_maria_portada.jpg` amb rètol en castellà "Cyber-Granja").
   - Classificació: imatges en ús real vs fitxers orfes.

---

## Conclusions i Tancament de Jornada

La jornada acaba amb un salt qualitatiu excepcional:
- El codi del Gauntlet Extrem està segellat al commit `4745112e` amb 19.228 tests passats.
- El desplegament a WhatsApp és un èxit visual aclaparador.
- La pantalla d'arribada al Xat està polida i llesta.
- S'ha respectat el fusible humà: no fer pedaços nocturns que puguen comprometre la robustesa del sistema.

Demà abordarem el refinament de l'Espai d'Usuari amb màxima energia i claredat mental. Bona nit i bona feina, Mestre!
