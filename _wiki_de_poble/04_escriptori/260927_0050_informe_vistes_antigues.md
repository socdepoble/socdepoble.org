# Inventari de Seccions i Vistes del Projecte

A continuació es detallen totes les seccions actuals del codi (`src/sections/`). Moltes d'elles són antigues, no fan servir el nou `AppGridShell` (Grid Modern) o han quedat desconnectades.

Açò ens servirà per a auditar-les, decidir quines actualitzem i quines esborrem sense pietat al "Sagramental dels Morts".

## 🔍 Seccions d'Exploració i Cerca (Potencialment Antigues)
- **`search`** (`/cerca`): El cercador global que m'has ensenyat al vídeo.
- **`pobles`** (`/pobles`): Llistat o directori de pobles.
- **`poblacio`** (`/poblacio`): Possiblement el cens o llistat de gent.
- **`profile`** (`/perfil`, `/gent`, `/empresa`...): On viu el directori de persones i els perfils individuals que m'has ensenyat al vídeo. S'haurà de migrar al nou disseny offline-first.

## 💬 Seccions Socials i Core (En refactorització o pendents)
- **`xat`** (`/xat`): El clon de WhatsApp (on està treballant ara mateix l'Arquitecte).
- **`mur`** (`/mur`): El tauler d'anuncis o feed de notícies.
- **`mercat`** (`/mercat`): El mercat de segona mà o comerços.
- **`notes`** (`/notes`): El bloc de notes personal (ja iniciat cap al format local/offline).
- **`multimedia`** (`/multimedia`): Galeria de fotos/vídeos.

## ⚙️ Seccions de Sistema i Utilitats
- **`admin`**: Panell d'administració antic.
- **`consola`**: El nou Dashboard (Consola Termodinàmica i Tauler).
- **`control`** (`/control`): Panell de control de l'usuari (Ajustos).
- **`onboarding`** (`/registre`): El flux d'entrada al Mas Electrònic.
- **`connectar`** (`/connectar`): Emparellament de dispositius o connexió P2P.
- **`dispositius`**: Gestió dels aparells connectats.
- **`disseny`** (`/disseny`): El laboratori del Design System i Pedra Seca.

## 📖 Seccions de Contingut i Wiki
- **`text`**: El motor per a carregar pàgines legals, la constitució, etc.
- **`wiki-de-poble`**: El visualitzador de la Wiki integrada.
- **`translations`**: Gestor de traduccions.
- **`detail`**: Vistes genèriques per a detalls d'elements.
- **`realitat`** (`/realitat`): El Selector de Realitat que acabem de desbloquejar.
- **`agenda`**: Possiblement un calendari antic o no finalitzat.

---
**Recomanació de MarIA:** Ara mateix no cal que faces res amb elles. Quan l'Arquitecte acabe amb el Xat i ho tinguem tancat, podrem fer una sessió de "poda" (Sagramental dels Morts) per a netejar tot aquest codi heretat que no fa servir la nova filosofia.
