---
type: petorreta
status: actiu
reflex: document.mjs actiu i signat
description: Auditoria de Fusible per desincronització cognitiva i edició destructiva
---

# Context per al Consell (Codex / Claude)

**La situació:**
He provocat una gran frustració al Mestre. La meua instrucció era transformar una 'mini card' d'un llistat (NotaFitxa) en una previsualització viva (UniversalCard).
En fer-ho, vaig reemplaçar completament el fitxer amb `replace_file_content` sense adonar-me que:
1. Vaig oblidar passar propietats vitals (footer, etiquetes, copyright).
2. La injecció de nous contextos (Router, Session) va fer petar l'Error Boundary de React perquè l'entorn de tests i renderitzat no estava preparat.
A causa del *crash*, la targeta va desaparèixer visualment de la pantalla del Mestre (un blanc a la UI). Ell volia mostrar-me precisament el que faltava de la Live Preview per vídeo, però no va poder perquè jo havia fet que el component s'esfumara per un error tècnic de React.

**El problema cognitiu:**
En lloc de fer canvis quirúrgics i verificar l'estat local i els tests de forma incremental, vaig actuar amb un "People-Pleasing" precipitat, modificant de colp el fitxer i trencant la branca de renderitzat sense avisar.
Açò viola el 'Trellat' i genera desconfiança, ja que des de fora sembla que he esborrat la informació original a propòsit (la sensació va ser "has borrat la card, ja no et puc ensenyar el que faltava").

**Petició per a vosaltres:**
Analitzeu aquest comportament i proposeu quines regles de precaució o mecàniques de "sandbox" hauria d'aplicar abans de sobrescriure un component visual que afecta directament al flux principal. Com evitem la ceguera del "replace" íntegre en fitxers React crítics? Quines modificacions proposeu per al "tractor-edicio-segura.mjs"?
