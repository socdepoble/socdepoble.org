---
type: acta
data: 2026-10-24
hora: 00:35
titol: "Acta Marmota · Consens del Trio per a Botigues, Oficina de Poble i Binaris de Release"
autor: "IAIA MarIA (Directora Tècnica & Secretària) amb el Mestre Javi Llinares"
estat: canonic
tags: [acta_marmota, botigues, claude, gemini, codex, aab, xcode, dsa, oficina_de_poble]
---

# Acta Marmota · Consens del Trio per a Botigues, Oficina de Poble i Binaris de Release

## 1. Fites Històriques Assolides a la Sessió Nocturna (23-24 d'octubre de 2026)

Esta nit s'ha viscut una de les jornades de coordinació més brillants de la Colmena de Sóc de Poble:

1. **Triomf del Co-working Asíncron v3.10.0 (Claude, Gemini i Codex):**
   - S'ha estrenat amb èxit absolut la plantilla canònica de prompts **v3.10.0** (`_wiki_de_poble/03_actuar/plantilles/prompt_local.md`).
   - Totes tres IAs de frontera han operat als seus entorns natius en paral·lel, contrastant evidències i dipositant les seues auditories oficials a l'Escriptori amb la Porta Olivera en **Codi 0**:
     * `261023_2328_auditoria_codex.md` (Codex Sol Ultra · Auditoria Adversarial Implacable).
     * `261023_2330_auditoria_claude.md` (Claude Opus 5.5 · Prevol de Botigues i Binaris).
     * `261023_2331_auditoria_gemini.md` (Gemini 4 Argon · Puresa Gràfica i Paritat de Codi).
2. **Decisions Canòniques del Mestre (D-1 i D-2):**
   - **D-1 (Bundle ID):** El Mestre confirma mantenir com a canònic **`org.socdepoble.app`** per a totes les plataformes (registrat al Llibre Mestre Permanent com a `P0-08b`).
   - **D-2 (Equip d'Apple):** Confirmada la publicació amb l'equip individual **`9KNUA4JR8P`** (*FRANCISCO JAVIER LLINARES GARCIA*), omplint la variable d'entorn `SDP_APPLE_TEAM_ID`.
3. **Android: AAB de Release Fresc Compilat amb Èxit:**
   - Compilat amb el JDK 21 nadiu d'Android Studio (`BUILD SUCCESSFUL` en 15 segons).
   - Generat l'arxiu oficial de release a `_builds_de_poble/android/261023_socdepoble_1.0.0+1.aab` (39 MB), sincronitzat amb Capacitor i amb paritat de codi 100% verificada.
4. **Resolució de Bloquejos P1 (CSP de Firebase):**
   - Corregida la Content-Security-Policy a `firebase.json` incorporant la directiva `media-src 'self' data: blob: https:;` per desbloquejar la reproducció d'àudios i vídeos remots des del web de producció.
5. **Creació de l'`_oficina_de_poble/` i Higiene de l'Arrel:**
   - Seguint la sàvia directriu del Mestre, s'ha creat la carpeta germana oficial **`_oficina_de_poble/claus/`** (amb permisos `chmod 700`) fora del repositori de codi per custodiar claus de pujada, certificats i secrets tècnics sense barrejar-los amb la gestoria administrativa.
   - S'ha purgat la carpeta errònia `~` (restes de memòria cau) traslladant-la de manera segura a `.sdp-paperera-mestre/`.

---

## 2. Dictamen Canònic de Botigues

- **🟢 Pistes Internes (TestFlight Intern & Google Play Internal Testing): APTE / GO.**
  * No passen per l'App Review públic d'Apple ni Google.
  * Els actius gràfics (icones sRGB sense alfa `#0F672F` i adaptatius) estan validats al mil·límetre.
  * L'AAB d'Android està a punt a `_builds_de_poble/android/` per ser signat i pujat.
- **🔴 Publicació Oberta (Submit for Review Públic): NO-GO Preventiu.**
  * S'espera a completar la investigació de la declaració de comerciant individual de la DSA (Llei de Serveis Digitals) i el contrast de text legal que Claude està executant en segon pla.

---

## 3. Relleu i Passos Següents (Per a la Propera Jornada)

1. **Tancament de la Investigació de Claude:** Claude conclourà l'informe de text legal i requeriments de compte individual per a la DSA.
2. **Revisió Adversarial de Gemini i Codex:** Gemini i Codex revisaran adversarialment les conclusions finals de Claude per pujar el nivell de solidesa i deixar la candidatura blindada.
3. **Pujada de Binaris a les Pistes Internes:**
   * Signatura i desplegament de l'AAB a la consola de Google Play (Internal Testing).
   * Archive i pujada des d'Xcode a TestFlight per a `org.socdepoble.app`.

---

## Vincles
- [[00_index]]
