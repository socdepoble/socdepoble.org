---
type: document
status: esborrany
description: Visió arquitectònica i full de ruta per a l'expansió de Sóc de Poble (Rebost, Salut, Hostaleria, Reserves i Productors Locals).
tags:
  - visio
  - arquitectura
  - roadmap
visibility: private
---

# Visió Arquitectònica d'Expansió (Sóc de Poble 2027)

Aquest document recull la visió estratègica i arquitectònica derivada de la sessió de la nit del 1 al 2 d'octubre de 2026. Mentre el bucle adversarial tancava el mòdul de Gestoria i l'Arbre Genealògic, el Mestre ha aportat cinc pilars basats en la seua experiència i recursos previs que transformaran Sóc de Poble en el vertader sistema operatiu del món rural.

## 1. Mòdul "El Rebost" i Llista de la Compra
**Base de coneixement:** Exportació CSV de Mercadona (619 productes categoritzats, amb imatges CDN).
**Concepte:** 
- Una interfície tàctil (UI Pedra Seca) on el veí pot fer la seua llista de la compra seleccionant imatges reals de productes.
- Quan la compra es marca com a "Feta", els productes passen al "Rebost" (inventari local de la llar).
- **El Tractor (FridgeFlow):** La IAIA MarIA llig l'estat del Rebost i, davant la pregunta "Què puc sopar hui?", genera una recepta aprofitable només amb els ingredients disponibles, estalviant viatges al supermercat i reduint el malbaratament.

## 2. Mòdul "Cuidant dels Nostres" (Salut i Dependència)
**Base de coneixement:** Excels i PDFs de 9 anys d'experiència del Mestre com a cuidador (Diari Miccional, Valoració d'Agitació, Control de Medicació per hores).
**Concepte:**
- Substituir el paper per formularis digitals tàctils i ràpids per a cuidadors.
- **Tractor de Medicació:** Integrat amb el Calendari. La IAIA MarIA no només recorda l'hora de la pastilla, sinó que llig el prospecte/fàrmac i genera instruccions en llenguatge planer (ex. "Açò és Quetiapina, servix per a relaxar. Vigila marejos").
- **Privacitat Fail-Closed:** Execució 100% local. Les dades de salut no xafen mai cap servidor extern.

## 3. Mòdul "Hostaleria Local" i TPV
**Base de coneixement:** Exportacions de Loyverse i Excels de proveïdors de "La Parròquia" i "El Café de la Plaça". Inspiració en Restaurania.
**Concepte:**
- **Cara al Client ("Menjar i Beure"):** Els bars locals poden publicar el seu menú del dia o "Puchero". Els veïns ho veuen al Mur i poden demanar-ho per a consumir al local o portar a casa. També s'hi integra una carta visual amb les imatges de tapes i begudes.
- **Cara al Negoci (TPV intern):** Un sistema de gestió basat en l'Excel de La Parròquia per a triar proveïdors, calcular escandalls i reduir costos.

## 4. Motor de Reserves de Taules
**Base de coneixement:** Google Workspace Appointment Scheduling.
**Concepte:**
- Aprofitar el motor robust de cites de Google que el Mestre ja té amb el pla Business Standard.
- **La Màgia:** Amagar la complexitat de Google sota una UI nativa de Sóc de Poble (Pedra Seca). Els veïns reserven la seua taula per a Festes amb un botó senzill a la fitxa del bar, sense eixir de l'App, mentre que per davall estem alimentant el calendari de Google del propietari.

## 5. Integració de Productors Locals Premium
**Base de coneixement:** "Nutxes" (Torrons de Xixona) i "Oli de la Torre" (Oli d'Oliva Verge Extra).
**Concepte:**
- Permetre que productors artesans puguen vendre a través de Sóc de Poble. 
- Més enllà de la venda, oferir-los la nostra plataforma (incloent el mòdul de Gestoria i ERP) per a gestionar el seu negoci de manera omnicanal.
- Model de negoci per a Sóc de Poble: Cobrar un xicotet manteniment anual per proporcionar tota la infraestructura tecnològica al xicotet productor, garantint-li sobirania tecnològica.

---

### Encàrrec Tècnic Pendent per a IAs (Prioritat Migratòria)
**Millora de l'Exportador de WordPress:** Cal refinar l' *snippet* extractor de WordPress (el que utilitzem per extraure dades dels WP antics cap a l'arquitectura Sóc de Poble). Quan l' *snippet* introduïsca pàgines o productes (com els d'Oli de la Torre), ha de respectar i formatar semànticament el contingut: incloure els **H1, H2, entradetes i jerarquia completa** perquè el *markdown* resultant a la Wiki estiga perfectament estructurat.

---
*Estat de la nit: L'orquestradora (MarIA) deixa aquest document a l'Escriptori preparat per a futures fases de desenvolupament, mentre Codex i Claude executen les últimes accions en segon pla per tancar la iteració vigent.*
