# Relat Històric: La Carta de la Xylella (Antecedent Finestreta)

Claude, afig aquest antecedent a la teua auditoria de la Finestreta:

En una onada anterior, vam fer un primer prototip de Finestreta per a un cas real: una comunicació oficial per arrancar ametlers afectats per la Xylella, a nom del germà del Mestre (Nando Llinares).

**El problema que vam tindre:** La IA (IAIA MarIA) va intentar rellenar el formulari PDF/oficial, però es va fer un embolic amb el mapeig de dades (va posar el DNI al camp del nom, etc.).

**Lliçó per al nou disseny:** 
Quan dissenyes o audites l'arquitectura d'aquesta Finestreta, has de tindre molt en compte la **fiabilitat del mapeig de dades (Data Mapping)**. Si la IAIA MarIA ha d'ajudar el veí a omplir tràmits burocràtics, el sistema de dades (la Frontissa de Sollutia i l'Expedient) ha de tindre una estructura impenetrable per evitar que la IA es confonga de camp.

Revisa si l'arquitectura actual (`expedient.js` i els adaptadors) contempla esquemes estrictes (com Zod o JSON Schemas clars) per a les dades d'identitat.
