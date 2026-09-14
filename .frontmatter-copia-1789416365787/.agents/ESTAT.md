# Acta Marmota: Visió Universal i Tancament de Sessió

## 📌 Què s'ha fet?
1. **Fix Avatar (Local Seed Mode)**: Afegit bypass per evitar que pete la gravació d'avatars en mode local. S'accepten les Data URL temporalment de forma proactiva (`DetallAjust.jsx`, `PerfilContext.jsx`, `supabaseBackend.js`).
2. **Definició Arquitectònica de Perfils**: Conceptualitzada l'evolució de "El meu perfil" cap a un `UniversalEditorShell` complet. Quan un usuari es busque, el sistema renderitzarà la seua `UniversalCard`. Creat el document `260913_0635_arquitectura_perfil_universal.md`.
3. **Restauració del Disseny de Notes**: Reparada la "destrossa" visual que patia la pàgina de Notes des de la creació del `UniversalEditorShell`. El Hero Image i la Barra Taronja han eixit del contenidor restrictiu `.ues-canvas` i tornen a ser 100% *full-width*, recuperant l'estètica original (Pedra Seca).
4. **Auditoria de Skills**: Afegit un tancament formal de la sessió on es proposa refinar les dependències a la següent iteració.

## 📦 Bundles i Documents
- Creat `260913_0635_arquitectura_perfil_universal.md`.
- Creat `260913_0645_ACTA_MARMOTA_tancament.md`.

## ⏭️ Pròxims passos (Per a la següent sessió)
1. Iniciar la refactorització de `PerfilShell.jsx` perquè adopte l'arquitectura de la Pàgina Universal (3 columnes: Carpetes, Atributs, Editor).
2. Reprendre la Fase 5 (UniversalToolbar) si es requereix un editor 100% abstracte per altres mòduls.

---

# 260913 · Auditoria visual de la Plantilla Enxufable

## Què s'ha fet

1. `UniversalWorkspace` ja no embolica `AppGridShell` amb `UniversalPage`; el crom de pàgina queda fora de les columnes de Carpetes i Notes.
2. El plegat d'escriptori usa classes modificadores React (`has-left-collapsed` i `has-middle-collapsed`) i s'han eliminat els selectors `:has()`.
3. Les amplàries redimensionables s'injecten amb un `<style>` local identificat per instància, sense atribut `style=` al JSX de la graella.
4. Les capçaleres i subbarres recuperen crom Pedra Seca estable, icones blanques i fons transparent.
5. Carpetes mostra `Tot` i Ajustos; Notes mostra la Lupa i Crear, la cerca completa s'obri sota demanda, i Crear desapareix quan Notes està replegada.

## Verificació

- ESLint dels components tocats: correcte.
- `tests/managerItemCard.test.jsx`: 25 proves superades.
- `vite build`: correcte.
- `porta:graella`: continua bloquejada perquè el gate només busca tokens en fitxers antics i no reconeix `src/css/tokens.css`.
- `porta:design-guard`: bloquejada per deute global preexistent/reamarrat fora dels fitxers funcionals d'esta refactorització.

## Poliment visual amb captura de referència

- Validada la vista real de `/notes` contra la captura antiga en amplària d'escriptori.
- Unificada cada capçalera en una sola barra de 58 px: `Tot`/Ajustos en Carpetes i Lupa/Crear en Notes.
- Carpetes usa `--sdp-crom-fons`; Notes superposa `--sdp-crom-hover` sobre el mateix crom per donar profunditat sense introduir colors nous.
- Eliminats fons, vores i ombres dels botons d'icona; el botó Crear usa els tokens blaus `--sdp-accio`/`--sdp-accio-hover`.
- La cerca oberta continua dins de la mateixa barra i no crea una segona franja.

# 260913 · Ajustos de la Graella i Presets

## Què s'ha fet
1. S'ha habilitat la persistència de les amplàries de les columnes de l'`AppGridShell` usant `localStorage`.
2. S'ha creat un `UniversalSettingsPanel` per mostrar les preferències de l'entorn.
3. S'ha connectat el botó de l'engranatge (Ajustos de la Graella) de la barra lateral esquerra cap al nou panell de configuració.
4. S'han incorporat tres modes pre-establerts per canviar la distribució: Compacta, Per defecte i Ampla.
5. S'han assegurat que la `UniversalToolbar` oferisca H2, Negreta, Cursiva, Ratllat i Llista Desordenada segons les especificacions aprovades.

## Verificació
- Les targetes empren proporció SVG 80x80 px i la data respecta la posició desitjada (`top: 8px; right: 8px`).
- La persistència al LocalStorage actua per defecte de manera correcta.
- L'editor alterna fluidament cap al menú d'ajustos amb `viewMode`.
