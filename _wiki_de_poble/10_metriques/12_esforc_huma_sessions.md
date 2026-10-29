---
type: document
status: canonic
description: Registre d'esforç humà i termodinàmic per a l'anàlisi de patrons d'eficiència i càrrega de treball.
---

# Registre d'Esforç Humà i Termodinàmic

Aquesta fulla de càlcul serveix per a traçar el temps real que el Mestre inverteix davant de l'ordinador (sumant totes les sessions fragmentades de nanochats) i creuar-ho amb el consum de crèdits, el volum de peticions i el cost termodinàmic. L'objectiu és descobrir patrons de fatiga, pics de consum ineficient i millorar l'estratègia d'ús de l'Eixam.

## Taula de Seguiment (Setembre 2026)

| Data | Inici (Aprox.) | Fi (Aprox.) | Hores Totals Humà | Sessions (Xats) | Peticions Locals (24h) | Cost Termodinàmic | Notes i Patrons Identificats |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 26-09-2026 | 10:00 | 02:30 (+1) | 16.5 hores | ~5 sessions | 4.599 peticions | $157.26 (Fable) | **Patró de fatiga i ineficiència**: Múltiples sessions fragmentades amb alt consum de context caché (8.3M read). L'esgotament del límit setmanal i els bloquejos per hooks han disparat el cost a la matinada. |
| 11-10-2026 | 01:00 | 03:30 | 2.5 hores | 1 sessió massiva | 2.784 peticions | $360.30 acum. | **Màxima eficiència orquestral**: Claude 3.5 despedeix desenes de subtasques tècniques amb un temps de paret de només 88m vs 595m d'API. L'altíssim consum de memòria memòria (33.9M tokens llegits a caché) demostra un context feixuc, però ben amortitzat evitant 10 hores d'esforç humà. |

## Mètriques de Rendiment Extretes
- **Ràtio de Peticions per Hora**: ~278 peticions/hora en la jornada de 16,5h.
- **Rendiment del Context**: El consum de 8.3M de tokens en lectura de caché (Frontal) indica que el context s'arrastra pesadament de sessió en sessió. 
- **Algorisme proposat d'Optimització**: *Tallafocs Termodinàmic*. Si una sessió supera les 4 hores ininterrompudes i/o els 2M de tokens processats de rebot, s'ha de forçar una *Acta Marmota* de condensació i netejar el context abans d'obrir el següent nanochat, estalviant així arrossegar la memòria a curt termini innecessària.

## Vincles

- [[00_index]]
