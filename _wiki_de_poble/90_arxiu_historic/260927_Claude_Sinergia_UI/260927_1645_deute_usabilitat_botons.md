---
tipus: deute-tecnic
títol: "Usabilitat Botons Replegar (Hit Area)"
data: 2026-09-27T16:45:00+02:00
---

# Deute Tècnic: Àrea de clic als botons de replegar panells

**Problema:**
A la interfície d'escriptori, als panells laterals (ex: Configuració del Xat), només la icona de replegar (`[<]`) és clicable per amagar el panell. Això genera mala usabilitat (fricció).

**Solució esperada:**
Tota la pastilla horitzontal (Icona esquerra + Text "Configuració" + Icona dreta) ha d'actuar com un sol botó interactiu (`onClick`). 

**Abast:**
S'ha d'estandarditzar aquest comportament per a tots els panells principals:
- Xat (Configuració / Control)
- Wiki de Poble
- Disseny

**Excepcions:**
- *Carpetes*: No s'aplica perquè el seu comportament és d'acordió vertical (s'esconden cap amunt).
- *Bloc de Notes*: Excepció confirmada pel Mestre.
