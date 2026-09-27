---
type: document
status: esborrany
description: "Pla d'implementació per a la Lògica d'Usuari (Fase Registre, Workspace, Missatgeria i IAIA)"
tags: [govern]
---

# Pla d'Implementació: Lògica d'Usuari, Xat i IAIA MarIA

## Objectiu
Aquesta fase té com a propòsit donar vida a la lògica de sessió i registre, connectant els components creats fins ara (Xat, Mur, Mercat, Connectar) amb el context d'un usuari real. També s'activen les funcions de comunicació entre usuaris, empreses i la mateixa IA.

## Tasques (T1-T3)

- **T1: Context d'Usuari i Workspace (El MAS):**
  Habilitar el registre i inici de sessió. Quan un usuari entra al seu Workspace (Bloc de notes), ha de vore el seu contingut classificat correctament.
  *Exemple d'or:* L'usuari "Sóc de Poble" ha publicat molt al Mur, per tant, la carpeta "Mur" del seu MAS ha de contindre eixes publicacions. Ha publicat la "samarreta" al Mercat, per la qual cosa a la carpeta "Mercat" del MAS només hi ha d'haver eixe element. Cal revisar tota la web per activar allò que pertanya a un usuari registrat.

- **T2: Missatgeria B2C i B2B (Xat de Poble/Empresa):**
  Activar la lògica del Xat perquè un usuari personal (ex: "Javi") puga escriure a una entitat o empresa (ex: "Sóc de Poble"). El compte de "Sóc de Poble" actua com un compte d'empresa (un "WhatsApp d'empresa"). Si l'entitat té múltiples membres, tots han de tindre accés a aquest xat compartit.

- **T3: Activació del Xat de la IAIA MarIA (Mock inicial):**
  Com ja es feia a la web de producció, cal activar el botó de xat amb la IAIA MarIA. De moment, ha de respondre amb frases fetes per fixar expectatives.
  *Resposta base:* "Ara estic en proves, només puc respondre preguntes molt simples i no estic per a tonteries, però poc a poc aniré aprenent."

- **T4: Pàgines de Perfil Públic (Usuari, Entitat i IA):**
  Cal implementar les pàgines públiques de perfil. Quan es cree el perfil del Mestre ("Javi") o el de l'empresa ("Sóc de Poble"), també s'ha de crear el perfil de la "IAIA MarIA" com a agent. Totes tindran una estructura semblant (editables des del mateix Workspace/MAS), però el perfil de la IAIA tindrà un avís visual clar que l'identifique com a Intel·ligència Artificial. S'han de crear enllaços cap a totes aquestes pàgines (p. ex. fent clic a l'avatar als xats o al mur).

- **T5: Connectar i Classificació Dinàmica (El centre de tot):**
  La pàgina "Connectar" és el centre neuràlgic del MAS. Qualsevol element de la web (una casa, una oferta de faena, un poble, un element del mercat, etc.) ha de poder ser "connectat" i guardat al MAS. Claude ha d'estudiar a fons com funciona aquesta pàgina i garantir que la classificació per carpetes siga dinàmica i adaptable:
  - Totes les connexions han d'aparèixer al Workspace en un apartat anomenat "Connectats".
  - Des d'allí, l'usuari les podrà organitzar en carpetes personalitzades (ex. tindre una carpeta de 3 cases que vol comparar).
  - Si l'element connectat és propietat d'un altre usuari, el botó d'acció no pot ser "Publicar", sinó que ha de canviar a "Compartir" per a permetre compartir-ho al propi mur, fomentant la compartició des del gestor (no directament com Instagram).
  - Permetre canviar el nom de les carpetes, afegir/llevar categories, i etiquetes ("assistent de context").

## Riscos previstos
- **Conflicte de models de dades:** Cal assegurar que la base de dades (Supabase) té l'estructura adequada per suportar "membres d'una empresa" en el mòdul de Xat.
- **Rendiment del MAS:** Filtrar i creuar els elements publicats al Mur/Mercat amb l'ID de l'usuari pot alentir el Workspace si no s'indexa bé.

## Vincles
- [[00_index_escriptori]]
