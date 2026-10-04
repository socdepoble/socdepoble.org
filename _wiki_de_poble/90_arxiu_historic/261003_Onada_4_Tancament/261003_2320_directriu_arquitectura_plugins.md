---
type: document
status: actiu
description: Directriu arquitectònica sobre el repositori de plugins i escalabilitat generacional.
---
# Directriu: L'Arquitectura de Plugins (Resiliència Generacional)

##### El mandat del Mestre
La base de **Sóc de Poble** ja està assentada amb el **Core** (l'AppGrid, el Router, l'OAuth i les UniversalCards). Ara, el Mestre exigeix preparar el sistema per a un creixement massiu i modular. El producte ha de poder allotjar **100, 1.000 o 10.000 funcionalitats noves** (Gestoria, TPV, Rebost Domèstic, Bàscula de Cooperativa, etc.) sense rebentar el límit de tokens de les IAs i sense posar en risc els fonaments de l'aplicació.

##### La Visió: Plugins dins de Plugins
No introduirem més codi monolític al Core. Tot el que no siga infraestructura pura ha de viure com un **Plugin independent** o un ecosistema de plugins (com fan Obsidian o WordPress). Cada plugin ha de ser enxufable, desenxufable i auditable de manera aïllada.

##### Ordre directa per a Claude i Codex (L'Eixam)
Teniu l'ordre d'**investigar a fons** la millor arquitectura possible per a implementar este sistema de plugins en el nostre entorn React/Vite. 

**Exigències innegociables:**
**Profunditat:** No us quedeu amb la primera opció òbvia. Dissenyeu la solució més resilient i robusta possible.
**Aïllament:** Els fonaments de l'app no es poden tocar ni trencar quan un plugin falla.
**Durabilitat:** El sistema ha d'estar dissenyat per a durar dècades, de manera que puga ser mantingut per les generacions futures (humans o IAs) sense requerir un coneixement absolut de tot l'ecosistema.
**UX de Productivitat (Hero Image Toggle):** Totes les `UniversalPage` que allotgen una funcionalitat de plugin (Gestoria, Rebost, etc.) mostraran la seua il·lustració (Hero Image) per defecte. Però atés que són eines de treball recurrent, l'usuari ha de poder amagar aquesta imatge per a guanyar espai vertical. Aquest estat de visibilitat s'ha de poder controlar des de les preferències del propi plugin (ex: "Amagar portada").

**Lliurable esperat (en la pròxima Onada):** Una proposta d'arquitectura tècnica detallada per a la injecció, gestió i cicle de vida d'estos plugins dins del client web i natiu de Sóc de Poble, respectant el cànon de Pedra Seca i la UX descrita.
