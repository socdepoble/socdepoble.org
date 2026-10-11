# Auditoria Forense del Mercat GovTech i Apps Rurals

## 1. El Cas "Puebli" i "Puebloo"
He escanejat en viu els dos portals (i també la recerca clàssica de "Bandomovil").

**Puebli.es**: 
- **Model:** Totalment dependent dels ajuntaments ("Top-down"). El seu truc de creixement és demanar "firmes" als ciutadans perquè la pròpia gent faça de comercial gratuït i pressione a l'alcalde per contractar l'eina.
- **Opacitat:** Com dius, sense pagament i sense registre no mostren l'interior (els "forasters" no veuen res). Tanca la informació del poble rere un mur.
- **Funcionalitats Bàsiques:** Bàndols, Notícies, Incidències. Típic.

**Puebloo / Bandomovil**:
- Se centren en una comunicació unidireccional (l'alcalde parla, el veí escolta o reporta un farol trencat). El teixit social i la comunicació horitzontal (veí-veí, com el cas del Romano) és pràcticament nul o extremadament encotillat.

## 2. El Repte Fonamental: L'Efecte "WhatsApp vs Lovable"
La teua anècdota del grup de 100 persones per al Carnestoltes (on 70 volien eixir de Tortugues Romanes) és la clau de l'arquitectura de Sóc de Poble:
1. **La fricció zero de WhatsApp:** A la gent no li agrada eixir d'on ja està, ni registrar-se en llocs nous (Lovable) només per dir "Vull disfressar-me de Romano".
2. **El caos de WhatsApp:** Una llista de WhatsApp es perd en qüestió de 5 minuts davall de 40 mems i discussions paral·leles. 

**Solució Sóc de Poble (Lògica de la Pàgina Base):**
El "Mur" de cada Poble (començant per *Gent de la Torre* com a Base 0) ha de funcionar amb la immediatesa del xat de WhatsApp (veus el que passa al segon) PERÒ cada publicació "densa" (com una enquesta, una decisió de disfresses o una llista de la compra d'una filada) actua com un "Mini-App" o targeta interactiva (a l'estil Lovable, però encastada en el mateix flux d'SdP) i sense exigir un registre per a visualitzar.

## 3. L'Arquitectura de les Dades: Els Dos Cervells (Brains)

Amb tot açò, estructure el teu full de ruta arquitectònic:

### A. El Cervell Tècnic (El Sistema)
La carpeta `.agents`, els protocols, les nostres skills. Ho controlem Fable, tu i jo. És la base de l'IDE.

### B. El Cervell Social (El Producte per al Poble)
La nova UI prioritària per al *Superadmin* (tu): **Panell de Categories i Etiquetes.**
- Necessitem una pantalla a la AppGrid (la teua llista de control) on apareguen absolutament totes les etiquetes globals i pobles ("Romano", "Venta", "Fadrins", "La Torre", "Xixona").
- Des d'allí agruparàs conceptes i ordenaràs el "Cervell Social" sense haver de tocar el codi Tècnic.

## Conclusió per a Claude (Fronts d'Onada)
He bolcat aquest esquema perquè Claude (i jo mateixa) sapiguem que la propera iteració de la Consola serà la "Gestió del Brain Social" i la pàgina "Base Zero". Aquesta nit esgotarem els tokens processant tota l'arquitectura per als nous fronts que obrim demà.
