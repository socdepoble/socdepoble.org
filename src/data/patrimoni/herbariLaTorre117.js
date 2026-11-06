/** IDEA-110. Derivat del kit Gemini r62, amb procedència literal del PDF.
 * Les 117 són fitxes de la font: no equivalen a una revisió taxonòmica.
 * Toxicitat desconeguda = null; absència d'advertiment no acredita innocuïtat.
 * SHA-256 PDF: 5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673
 */
export const VERSIO_HERBARI_LA_TORRE = '1.2.0';
export const USOS_HERBARI_CANONICS = Object.freeze(["Tots","Aliment","Aromàtica","Medicinal","Ornamental","Artesanal","Tòxic"]);
/** R25: retols i pertinences múltiples contrastats amb el text primari; no es corregeix la taxonomia. */
export const FONT_ZONES_HERBARI = Object.freeze({"document":"cartells_la_canaleta.txt","sha256":"de1abe6491009c730845fdf5c8dcac01e1d25e0bb8c340c5593a1c0bf0c9985c","pagina":null,"estat":"retols-literals-del-text","notaPagina":"El text no inclou numeració de pàgina; les localitzacions citen línies."});
export const ESPECIES_HERBARI_LA_TORRE_117 = Object.freeze([
  {
    "id": "herbari-001-acacia-robinia",
    "ordre": 1,
    "slug": "acacia-robinia",
    "nomValencia": "Acacia robínia",
    "nomCastella": "Falsa acacia",
    "nomAngles": "Black locust",
    "nomCientific": "Robinia pseudoacacia “Casque Rouge”",
    "usos": [
      "Ornamental",
      "Artesanal"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 177
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Artesanal"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 1,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-002-alber-blanc",
    "ordre": 2,
    "slug": "alber-blanc",
    "nomValencia": "Àlber blanc",
    "nomCastella": "Chopo o Álamo blanco",
    "nomAngles": "Abele",
    "nomCientific": "Populus alba",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 5
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 2,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-003-albercoquer",
    "ordre": 3,
    "slug": "albercoquer",
    "nomValencia": "Albercoquer",
    "nomCastella": "Albaricoquero",
    "nomAngles": "Apricot",
    "nomCientific": "Prunus armeniaca",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 384
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 3,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-004-alfabega",
    "ordre": 4,
    "slug": "alfabega",
    "nomValencia": "Alfàbega",
    "nomCastella": "Albahaca",
    "nomAngles": "Basil",
    "nomCientific": "Ocimum basilicum",
    "usos": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PLANTES ERA",
    "zonesCanaleta": [
      "PLANTES ERA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PLANTES ERA",
        "liniaTitol": 210,
        "liniaCientific": 300
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 4,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-005-ametler",
    "ordre": 5,
    "slug": "ametler",
    "nomValencia": "Ametler",
    "nomCastella": "Almendro",
    "nomAngles": "Almond",
    "nomCientific": "Prunus dulcis",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS · ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS",
      "ARBRES I PLANTES ZONA ALMASSERA I DARRERE"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 487
      },
      {
        "zona": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
        "liniaTitol": 523,
        "liniaCientific": 540
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 5,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-006-amor-de-fadri",
    "ordre": 6,
    "slug": "amor-de-fadri",
    "nomValencia": "Amor de fadrí",
    "nomCastella": "Mastranzo",
    "nomAngles": "Red sage",
    "nomCientific": "Salvia microphylla",
    "usos": [
      "Medicinal",
      "Aromàtica"
    ],
    "esToxica": null,
    "zonaCanaleta": "PLANTES ERA",
    "zonesCanaleta": [
      "PLANTES ERA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PLANTES ERA",
        "liniaTitol": 210,
        "liniaCientific": 270
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 6,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-007-anouer",
    "ordre": 7,
    "slug": "anouer",
    "nomValencia": "Anouer",
    "nomCastella": "Nogal",
    "nomAngles": "Walnut",
    "nomCientific": "Juglans regia",
    "usos": [
      "Ornamental",
      "Medicinal",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 451
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Medicinal",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 7,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-008-anouer-del-japo",
    "ordre": 8,
    "slug": "anouer-del-japo",
    "nomValencia": "Anouer del Japó",
    "nomCastella": "Árbol de los 40 escudos",
    "nomAngles": "Maidenhair tree",
    "nomCientific": "Ginkgo biloba",
    "usos": [
      "Ornamental",
      "Medicinal"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES DAVANT CASA",
    "zonesCanaleta": [
      "ARBRES DAVANT CASA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES DAVANT CASA",
        "liniaTitol": 314,
        "liniaCientific": 343
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Medicinal"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 8,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-009-aranyoner",
    "ordre": 9,
    "slug": "aranyoner",
    "nomValencia": "Aranyoner",
    "nomCastella": "Endrino",
    "nomAngles": "Blackthorn",
    "nomCientific": "Prunus spinosa",
    "usos": [
      "Medicinal",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 3 (FRUITES DE LA SERRA)",
    "zonesCanaleta": [
      "PARTERRE 3 (FRUITES DE LA SERRA)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 3 (FRUITES DE LA SERRA)",
        "liniaTitol": 835,
        "liniaCientific": 912
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 9,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-010-arbocer-madronyer",
    "ordre": 10,
    "slug": "arbocer-madronyer",
    "nomValencia": "Arbocer (Madronyer)",
    "nomCastella": "Madroño",
    "nomAngles": "Arbutus",
    "nomCientific": "Arbutus unedo",
    "usos": [
      "Ornamental",
      "Medicinal",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA · BANCAL DE FRUITALS · PARTERRE 3 (FRUITES DE LA SERRA)",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA",
      "BANCAL DE FRUITALS",
      "PARTERRE 3 (FRUITES DE LA SERRA)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 151
      },
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 481
      },
      {
        "zona": "PARTERRE 3 (FRUITES DE LA SERRA)",
        "liniaTitol": 835,
        "liniaCientific": 840
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Medicinal",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 10,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-011-arbre-de-judes",
    "ordre": 11,
    "slug": "arbre-de-judes",
    "nomValencia": "Arbre de Judes",
    "nomCastella": "Árbol del amor",
    "nomAngles": "Judas tree",
    "nomCientific": "Cercis siliquastrum",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES DAVANT CASA",
    "zonesCanaleta": [
      "ARBRES DAVANT CASA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES DAVANT CASA",
        "liniaTitol": 314,
        "liniaCientific": 337
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 11,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-012-arbre-del-paradis",
    "ordre": 12,
    "slug": "arbre-del-paradis",
    "nomValencia": "Arbre del paradis",
    "nomCastella": "Árbol del paraíso",
    "nomAngles": "Silver berry",
    "nomCientific": "Elaeagnus angustifolia",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 18
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 12,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-013-arnet-roig-cirerer-de-pastor",
    "ordre": 13,
    "slug": "arnet-roig-cirerer-de-pastor",
    "nomValencia": "Arnet roig / Cirerer de pastor",
    "nomCastella": "Espino rosa",
    "nomAngles": "Midland hawthorn",
    "nomCientific": "Crataegus laevigata “Paul’s Scarlet”",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 3 (FRUITES DE LA SERRA)",
    "zonesCanaleta": [
      "PARTERRE 3 (FRUITES DE LA SERRA)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 3 (FRUITES DE LA SERRA)",
        "liniaTitol": 835,
        "liniaCientific": 882
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 13,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-014-atzerolera",
    "ordre": 14,
    "slug": "atzerolera",
    "nomValencia": "Atzerolera",
    "nomCastella": "Acerolo",
    "nomAngles": "Azarole",
    "nomCientific": "Crataegus azarolus",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 445
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 14,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-015-auro",
    "ordre": 15,
    "slug": "auro",
    "nomValencia": "Auró",
    "nomCastella": "Arce",
    "nomAngles": "Maple",
    "nomCientific": "Acer opalus",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 30
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 15,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-016-auro-del-sucre",
    "ordre": 16,
    "slug": "auro-del-sucre",
    "nomValencia": "Auró del sucre",
    "nomCastella": "Arce plateado",
    "nomAngles": "Silver maple",
    "nomCientific": "Acer saccharinum",
    "usos": [
      "Ornamental",
      "Artesanal"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 48
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Artesanal"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 16,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-017-auro-vermell",
    "ordre": 17,
    "slug": "auro-vermell",
    "nomValencia": "Auró vermell",
    "nomCastella": "Arce de Freeman",
    "nomAngles": "Freeman maple",
    "nomCientific": "Acer x Freemanii “Autumn Blaze”",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES DAVANT CASA",
    "zonesCanaleta": [
      "ARBRES DAVANT CASA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES DAVANT CASA",
        "liniaTitol": 314,
        "liniaCientific": 349
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 17,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-018-avellaner",
    "ordre": 18,
    "slug": "avellaner",
    "nomValencia": "Avellaner",
    "nomCastella": "Avellanero",
    "nomAngles": "Hazel",
    "nomCientific": "Corylus avellana",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 3 (FRUITES DE LA SERRA)",
    "zonesCanaleta": [
      "PARTERRE 3 (FRUITES DE LA SERRA)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 3 (FRUITES DE LA SERRA)",
        "liniaTitol": 835,
        "liniaCientific": 846
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 18,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-019-avena",
    "ordre": 19,
    "slug": "avena",
    "nomValencia": "Avena",
    "nomCastella": "Avena",
    "nomAngles": "Oats",
    "nomCientific": "Avena sativa",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA ALMASSERA I DARRERE"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
        "liniaTitol": 523,
        "liniaCientific": 564
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 19,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-020-bacorera",
    "ordre": 20,
    "slug": "bacorera",
    "nomValencia": "Bacorera",
    "nomCastella": "Higuera",
    "nomAngles": "Fig tree",
    "nomCientific": "Ficus carica",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 493
      },
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 505
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 20,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-021-baladre",
    "ordre": 21,
    "slug": "baladre",
    "nomValencia": "Baladre",
    "nomCastella": "Adelfa",
    "nomAngles": "Oleander",
    "nomCientific": "Nerium oleander",
    "usos": [
      "Ornamental",
      "Medicinal",
      "Tòxic"
    ],
    "esToxica": true,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 109
      }
    ],
    "alertaSeguretat": "La font documental marca esta fitxa com a tòxica.",
    "usosTranscrits": [
      "Ornamental",
      "Medicinal",
      "Tòxic"
    ],
    "usosNoContrastats": [],
    "toxicitat": "advertida-a-la-font",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 21,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-022-bedoll",
    "ordre": 22,
    "slug": "bedoll",
    "nomValencia": "Bedoll",
    "nomCastella": "Abedul",
    "nomAngles": "Himalayan birch",
    "nomCientific": "Betula utilis 'Doorenbos'",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 11
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 22,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-023-blat-forment",
    "ordre": 23,
    "slug": "blat-forment",
    "nomValencia": "Blat / Forment",
    "nomCastella": "Trigo",
    "nomAngles": "Wheat",
    "nomCientific": "Triticum durum",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA ALMASSERA I DARRERE"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
        "liniaTitol": 523,
        "liniaCientific": 552
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 23,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-024-bresquillera",
    "ordre": 24,
    "slug": "bresquillera",
    "nomValencia": "Bresquillera",
    "nomCastella": "Melocotonero",
    "nomAngles": "Peach tree",
    "nomCientific": "Prunus persica",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 414
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 24,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-025-camamirla-revisar",
    "ordre": 25,
    "slug": "camamirla-revisar",
    "nomValencia": "Camamirla (Revisar)",
    "nomCastella": "Manzanilla",
    "nomAngles": "Chamomile",
    "nomCientific": "A chamaemelum nobile / Anthemis nobilis",
    "usos": [
      "Medicinal",
      "Aromàtica"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 2 (MIG)",
    "zonesCanaleta": [
      "PARTERRE 2 (MIG)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 2 (MIG)",
        "liniaTitol": 732,
        "liniaCientific": 766
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 25,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-026-camamirla-borda-revisar",
    "ordre": 26,
    "slug": "camamirla-borda-revisar",
    "nomValencia": "Camamirla Borda (Revisar)",
    "nomCastella": "Santolina (Manzanilla amarga?)",
    "nomAngles": "Chamomile",
    "nomCientific": "Santolina chamaecyparissus",
    "usos": [
      "Medicinal",
      "Aromàtica"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 2 (MIG)",
    "zonesCanaleta": [
      "PARTERRE 2 (MIG)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 2 (MIG)",
        "liniaTitol": 732,
        "liniaCientific": 772
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 26,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-027-camelia",
    "ordre": 27,
    "slug": "camelia",
    "nomValencia": "Camèlia",
    "nomCastella": "Camelia",
    "nomAngles": "Camellia",
    "nomCientific": "Camellia japónica",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE ABELLES I BANCAL SUPERIOR",
    "zonesCanaleta": [
      "PARTERRE ABELLES I BANCAL SUPERIOR"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE ABELLES I BANCAL SUPERIOR",
        "liniaTitol": 991,
        "liniaCientific": 1019
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 27,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-028-cantueso",
    "ordre": 28,
    "slug": "cantueso",
    "nomValencia": "Cantueso",
    "nomCastella": "Cantahueso",
    "nomAngles": "Spanish lavender",
    "nomCientific": "Lavandula stoechas",
    "usos": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 2 (MIG)",
    "zonesCanaleta": [
      "PARTERRE 2 (MIG)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 2 (MIG)",
        "liniaTitol": 732,
        "liniaCientific": 736
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 28,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-029-caquier",
    "ordre": 29,
    "slug": "caquier",
    "nomValencia": "Caquier",
    "nomCastella": "Caqui",
    "nomAngles": "Khaki",
    "nomCientific": "Diospyros kaki",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 402
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 29,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-030-carrasca",
    "ordre": 30,
    "slug": "carrasca",
    "nomValencia": "Carrasca",
    "nomCastella": "Encina",
    "nomAngles": "Holm oak",
    "nomCientific": "Quercus ilex",
    "usos": [
      "Ornamental",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA · ARBRES I PLANTES ZONA ALMASSERA I DARRERE · PARTERRE ABELLES I BANCAL SUPERIOR",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA",
      "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
      "PARTERRE ABELLES I BANCAL SUPERIOR"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 159
      },
      {
        "zona": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
        "liniaTitol": 523,
        "liniaCientific": 595
      },
      {
        "zona": "PARTERRE ABELLES I BANCAL SUPERIOR",
        "liniaTitol": 991,
        "liniaCientific": 998
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 30,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-031-castanyer",
    "ordre": 31,
    "slug": "castanyer",
    "nomValencia": "Castanyer",
    "nomCastella": "Castaño",
    "nomAngles": "Sweet chestnut",
    "nomCientific": "Castanea sativa",
    "usos": [
      "Ornamental",
      "Artesanal",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE ABELLES I BANCAL SUPERIOR",
    "zonesCanaleta": [
      "PARTERRE ABELLES I BANCAL SUPERIOR"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE ABELLES I BANCAL SUPERIOR",
        "liniaTitol": 991,
        "liniaCientific": 1057
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Artesanal",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 31,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-032-castanyer-bord",
    "ordre": 32,
    "slug": "castanyer-bord",
    "nomValencia": "Castanyer bord",
    "nomCastella": "Castaño de Indias",
    "nomAngles": "Horse-chestnut",
    "nomCientific": "Aesculus hippocastanum",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES DAVANT CASA",
    "zonesCanaleta": [
      "ARBRES DAVANT CASA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES DAVANT CASA",
        "liniaTitol": 314,
        "liniaCientific": 325
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 32,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-033-ceba-mora",
    "ordre": 33,
    "slug": "ceba-mora",
    "nomValencia": "Ceba mora",
    "nomCastella": "Cebollino",
    "nomAngles": "Chives",
    "nomCientific": "Allium schoenoprasum",
    "usos": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PLANTES ERA",
    "zonesCanaleta": [
      "PLANTES ERA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PLANTES ERA",
        "liniaTitol": 210,
        "liniaCientific": 232
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 33,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-034-ciprer",
    "ordre": 34,
    "slug": "ciprer",
    "nomValencia": "Ciprer",
    "nomCastella": "Ciprés",
    "nomAngles": "Cypress",
    "nomCientific": "Cupressus sempervirens",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES DAVANT CASA · PARTERRE ABELLES I BANCAL SUPERIOR",
    "zonesCanaleta": [
      "ARBRES DAVANT CASA",
      "PARTERRE ABELLES I BANCAL SUPERIOR"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES DAVANT CASA",
        "liniaTitol": 314,
        "liniaCientific": 319
      },
      {
        "zona": "PARTERRE ABELLES I BANCAL SUPERIOR",
        "liniaTitol": 991,
        "liniaCientific": 1038
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 34,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-035-ciprer-blau",
    "ordre": 35,
    "slug": "ciprer-blau",
    "nomValencia": "Ciprer blau",
    "nomCastella": "Ciprés de Arizona",
    "nomAngles": "Arizona cypress",
    "nomCientific": "Cupressus arizonica",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE ABELLES I BANCAL SUPERIOR",
    "zonesCanaleta": [
      "PARTERRE ABELLES I BANCAL SUPERIOR"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE ABELLES I BANCAL SUPERIOR",
        "liniaTitol": 991,
        "liniaCientific": 1051
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 35,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-036-ciprer-de-plata",
    "ordre": 36,
    "slug": "ciprer-de-plata",
    "nomValencia": "Ciprer de plata",
    "nomCastella": "Ciprés de Leyland",
    "nomAngles": "Leyland ciprus",
    "nomCientific": "Leylandii variegata",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 1 (BAIX)",
    "zonesCanaleta": [
      "PARTERRE 1 (BAIX)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 1 (BAIX)",
        "liniaTitol": 628,
        "liniaCientific": 661
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 36,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-037-ciprer-lambert",
    "ordre": 37,
    "slug": "ciprer-lambert",
    "nomValencia": "Ciprer lambert",
    "nomCastella": "Cirprés de Monterrey",
    "nomAngles": "Monterey cipress",
    "nomCientific": "Cupressus macrocarpa",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE ABELLES I BANCAL SUPERIOR",
    "zonesCanaleta": [
      "PARTERRE ABELLES I BANCAL SUPERIOR"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE ABELLES I BANCAL SUPERIOR",
        "liniaTitol": 991,
        "liniaCientific": 1045
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 37,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-038-cirer",
    "ordre": 38,
    "slug": "cirer",
    "nomValencia": "Cirer",
    "nomCastella": "Cerezo",
    "nomAngles": "Cherry tree",
    "nomCientific": "Cerasus",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 408
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 38,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-039-codonyer",
    "ordre": 39,
    "slug": "codonyer",
    "nomValencia": "Codonyer",
    "nomCastella": "Membrillero",
    "nomAngles": "Quince",
    "nomCientific": "Cydonia oblonga",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 421
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 39,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-040-cornera",
    "ordre": 40,
    "slug": "cornera",
    "nomValencia": "Cornera",
    "nomCastella": "Cotonastro",
    "nomAngles": "Acuminate cotoneaster",
    "nomCientific": "Cotoneaster acuminatus",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA · PARTERRE 4 (FONT D’HERBES)",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA",
      "PARTERRE 4 (FONT D’HERBES)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 91
      },
      {
        "zona": "PARTERRE 4 (FONT D’HERBES)",
        "liniaTitol": 939,
        "liniaCientific": 962
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 40,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-041-cornera-blanca",
    "ordre": 41,
    "slug": "cornera-blanca",
    "nomValencia": "Cornera blanca",
    "nomCastella": "Cotonastro de flor blanca",
    "nomAngles": "Late cotoneaster",
    "nomCientific": "Cotoneaster lactea",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 1 (BAIX) · PARTERRE 2 (MIG)",
    "zonesCanaleta": [
      "PARTERRE 1 (BAIX)",
      "PARTERRE 2 (MIG)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 1 (BAIX)",
        "liniaTitol": 628,
        "liniaCientific": 693
      },
      {
        "zona": "PARTERRE 2 (MIG)",
        "liniaTitol": 732,
        "liniaCientific": 778
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 41,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-042-cornera-rastrera",
    "ordre": 42,
    "slug": "cornera-rastrera",
    "nomValencia": "Cornera rastrera",
    "nomCastella": "Cotonastro rastrero",
    "nomAngles": "Rock cotoneaster",
    "nomCientific": "Cotoneaster horizontalis",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 1 (BAIX)",
    "zonesCanaleta": [
      "PARTERRE 1 (BAIX)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 1 (BAIX)",
        "liniaTitol": 628,
        "liniaCientific": 687
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 42,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-043-coscolla",
    "ordre": 43,
    "slug": "coscolla",
    "nomValencia": "Coscolla",
    "nomCastella": "Coscoja",
    "nomAngles": "Kermes oak",
    "nomCientific": "Quercus coccifera",
    "usos": [
      "Ornamental",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 165
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 43,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-044-curri",
    "ordre": 44,
    "slug": "curri",
    "nomValencia": "Curri",
    "nomCastella": "Curry",
    "nomAngles": "Curry",
    "nomCientific": "Helichrysum italicum",
    "usos": [
      "Aromàtica",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PLANTES ERA",
    "zonesCanaleta": [
      "PLANTES ERA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PLANTES ERA",
        "liniaTitol": 210,
        "liniaCientific": 282
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aromàtica",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 44,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-045-encens",
    "ordre": 45,
    "slug": "encens",
    "nomValencia": "Encens",
    "nomCastella": "Incienso",
    "nomAngles": "Incense",
    "nomCientific": "Plectranthus coleoides",
    "usos": [
      "Aromàtica"
    ],
    "esToxica": null,
    "zonaCanaleta": "PLANTES ERA",
    "zonesCanaleta": [
      "PLANTES ERA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PLANTES ERA",
        "liniaTitol": 210,
        "liniaCientific": 238
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aromàtica"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 45,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-046-espigol",
    "ordre": 46,
    "slug": "espigol",
    "nomValencia": "Espigol",
    "nomCastella": "Lavanda",
    "nomAngles": "Lavender",
    "nomCientific": "Lavandula angustifolia",
    "usos": [
      "Medicinal",
      "Aromàtica"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA · PARTERRE 1 (BAIX) · PARTERRE 4 (FONT D’HERBES)",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA",
      "PARTERRE 1 (BAIX)",
      "PARTERRE 4 (FONT D’HERBES)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 67
      },
      {
        "zona": "PARTERRE 1 (BAIX)",
        "liniaTitol": 628,
        "liniaCientific": 644
      },
      {
        "zona": "PARTERRE 4 (FONT D’HERBES)",
        "liniaTitol": 939,
        "liniaCientific": 974
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 46,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-047-espigol-femella",
    "ordre": 47,
    "slug": "espigol-femella",
    "nomValencia": "Espigol femella",
    "nomCastella": "Lavanda hembra",
    "nomAngles": "Lavender female",
    "nomCientific": "Lavandula oficinalis",
    "usos": [
      "Medicinal",
      "Aromàtica"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 1 (BAIX)",
    "zonesCanaleta": [
      "PARTERRE 1 (BAIX)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 1 (BAIX)",
        "liniaTitol": 628,
        "liniaCientific": 638
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 47,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-048-figuera",
    "ordre": 48,
    "slug": "figuera",
    "nomValencia": "Figuera",
    "nomCastella": "Higuera",
    "nomAngles": "Fig tree",
    "nomCientific": "Ficus carica",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 493
      },
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 505
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 48,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-049-fleix",
    "ordre": 49,
    "slug": "fleix",
    "nomValencia": "Fleix",
    "nomCastella": "Fresno",
    "nomAngles": "Ash tree",
    "nomCientific": "Fraxinus Ornus",
    "usos": [
      "Ornamental",
      "Artesanal"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 42
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Artesanal"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 49,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-050-fotinia-roja",
    "ordre": 50,
    "slug": "fotinia-roja",
    "nomValencia": "Fotínia roja",
    "nomCastella": "Fotinia roja",
    "nomAngles": "Photinia “Red Robin”",
    "nomCientific": "Photinia fraserired robin",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 1 (BAIX)",
    "zonesCanaleta": [
      "PARTERRE 1 (BAIX)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 1 (BAIX)",
        "liniaTitol": 628,
        "liniaCientific": 681
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 50,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-051-garrofer",
    "ordre": 51,
    "slug": "garrofer",
    "nomValencia": "Garrofer",
    "nomCastella": "Algarrobo",
    "nomAngles": "Carob tree",
    "nomCientific": "Ceratonia siliqua",
    "usos": [
      "Medicinal",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 469
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 51,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-052-gerdera-groga",
    "ordre": 52,
    "slug": "gerdera-groga",
    "nomValencia": "Gerdera groga",
    "nomCastella": "Frambueso amarillo",
    "nomAngles": "Yellow raspberry",
    "nomCientific": "Rubus idaeus “Fallgold”",
    "usos": [
      "Medicinal",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 3 (FRUITES DE LA SERRA)",
    "zonesCanaleta": [
      "PARTERRE 3 (FRUITES DE LA SERRA)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 3 (FRUITES DE LA SERRA)",
        "liniaTitol": 835,
        "liniaCientific": 852
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 52,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-053-ginebre",
    "ordre": 53,
    "slug": "ginebre",
    "nomValencia": "Ginebre",
    "nomCastella": "Enebro",
    "nomAngles": "Savin",
    "nomCientific": "Juniperus communis",
    "usos": [
      "Ornamental",
      "Medicinal",
      "Artesanal",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA · PARTERRE 1 (BAIX)",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA",
      "PARTERRE 1 (BAIX)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 85
      },
      {
        "zona": "PARTERRE 1 (BAIX)",
        "liniaTitol": 628,
        "liniaCientific": 667
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Medicinal",
      "Artesanal",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 53,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-054-ginjoler",
    "ordre": 54,
    "slug": "ginjoler",
    "nomValencia": "Ginjoler",
    "nomCastella": "Azufaifo",
    "nomAngles": "Jujube",
    "nomCientific": "Ziziphus jujuba",
    "usos": [
      "Artesanal",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 396
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Artesanal",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 54,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-055-grevol",
    "ordre": 55,
    "slug": "grevol",
    "nomValencia": "Grèvol",
    "nomCastella": "Acebo",
    "nomAngles": "Holly",
    "nomCientific": "Ilex aquifolium",
    "usos": [
      "Ornamental",
      "Medicinal",
      "Tòxic"
    ],
    "esToxica": true,
    "zonaCanaleta": "PARTERRE ABELLES I BANCAL SUPERIOR",
    "zonesCanaleta": [
      "PARTERRE ABELLES I BANCAL SUPERIOR"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE ABELLES I BANCAL SUPERIOR",
        "liniaTitol": 991,
        "liniaCientific": 1013
      }
    ],
    "alertaSeguretat": "La font documental marca esta fitxa com a tòxica.",
    "usosTranscrits": [
      "Ornamental",
      "Medicinal",
      "Tòxic"
    ],
    "usosNoContrastats": [],
    "toxicitat": "advertida-a-la-font",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 55,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-056-groseller-negre",
    "ordre": 56,
    "slug": "groseller-negre",
    "nomValencia": "Groseller negre",
    "nomCastella": "Zarzaparrilla negra",
    "nomAngles": "Black sarsaparilla",
    "nomCientific": "Ribes nigrum",
    "usos": [
      "Ornamental",
      "Medicinal",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 3 (FRUITES DE LA SERRA)",
    "zonesCanaleta": [
      "PARTERRE 3 (FRUITES DE LA SERRA)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 3 (FRUITES DE LA SERRA)",
        "liniaTitol": 835,
        "liniaCientific": 870
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Medicinal",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 56,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-057-groseller-roig",
    "ordre": 57,
    "slug": "groseller-roig",
    "nomValencia": "Groseller roig",
    "nomCastella": "Zarzaparrilla roja",
    "nomAngles": "Red sarsaparilla",
    "nomCientific": "Ribes rubrum",
    "usos": [
      "Ornamental",
      "Medicinal",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 3 (FRUITES DE LA SERRA)",
    "zonesCanaleta": [
      "PARTERRE 3 (FRUITES DE LA SERRA)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 3 (FRUITES DE LA SERRA)",
        "liniaTitol": 835,
        "liniaCientific": 876
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Medicinal",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 57,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-058-hedrera",
    "ordre": 58,
    "slug": "hedrera",
    "nomValencia": "Hedrera",
    "nomCastella": "Hiedra",
    "nomAngles": "Ivy",
    "nomCientific": "Hedera hélix",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 183
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 58,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-059-herba-sana",
    "ordre": 59,
    "slug": "herba-sana",
    "nomValencia": "Herba-sana",
    "nomCastella": "Hierbabuena",
    "nomAngles": "Peppermint",
    "nomCientific": "Mentha spicata",
    "usos": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PLANTES ERA",
    "zonesCanaleta": [
      "PLANTES ERA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PLANTES ERA",
        "liniaTitol": 210,
        "liniaCientific": 244
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 59,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-060-julivert",
    "ordre": 60,
    "slug": "julivert",
    "nomValencia": "Julivert",
    "nomCastella": "Perejil",
    "nomAngles": "Parsley",
    "nomCientific": "Petroselinum crispum",
    "usos": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PLANTES ERA",
    "zonesCanaleta": [
      "PLANTES ERA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PLANTES ERA",
        "liniaTitol": 210,
        "liniaCientific": 220
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 60,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-061-lavanda",
    "ordre": 61,
    "slug": "lavanda",
    "nomValencia": "Lavanda",
    "nomCastella": "Espliego de jardín",
    "nomAngles": "Fringed lavender",
    "nomCientific": "Lavandula dentata",
    "usos": [
      "Medicinal",
      "Aromàtica"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 1 (BAIX)",
    "zonesCanaleta": [
      "PARTERRE 1 (BAIX)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 1 (BAIX)",
        "liniaTitol": 628,
        "liniaCientific": 632
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 61,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-062-lillera",
    "ordre": 62,
    "slug": "lillera",
    "nomValencia": "Lil·lera",
    "nomCastella": "Lila",
    "nomAngles": "Lilac",
    "nomCientific": "Syringa vulgaris",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 103
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 62,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-063-llentiscle",
    "ordre": 63,
    "slug": "llentiscle",
    "nomValencia": "Llentiscle",
    "nomCastella": "Lentisco",
    "nomAngles": "Mastic",
    "nomCientific": "Pistacea lenticus",
    "usos": [
      "Medicinal",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 3 (FRUITES DE LA SERRA)",
    "zonesCanaleta": [
      "PARTERRE 3 (FRUITES DE LA SERRA)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 3 (FRUITES DE LA SERRA)",
        "liniaTitol": 835,
        "liniaCientific": 889
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 63,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-064-llidoner",
    "ordre": 64,
    "slug": "llidoner",
    "nomValencia": "Llidoner",
    "nomCastella": "Almez",
    "nomAngles": "European nettle tree",
    "nomCientific": "Celtis australis",
    "usos": [
      "Ornamental",
      "Medicinal",
      "Artesanal"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 139
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Medicinal",
      "Artesanal"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 64,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-065-lliri-blau-girablau",
    "ordre": 65,
    "slug": "lliri-blau-girablau",
    "nomValencia": "Lliri blau (Girablau)",
    "nomCastella": "Lirio común",
    "nomAngles": "Iris",
    "nomCientific": "Iris germánica",
    "usos": [
      "Medicinal",
      "Aromàtica"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA · ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA",
      "ARBRES I PLANTES ZONA ALMASSERA I DARRERE"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 127
      },
      {
        "zona": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
        "liniaTitol": 523,
        "liniaCientific": 589
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 65,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-066-llorer",
    "ordre": 66,
    "slug": "llorer",
    "nomValencia": "Llorer",
    "nomCastella": "Laurel",
    "nomAngles": "Sweet bay",
    "nomCientific": "Laurus nobilis",
    "usos": [
      "Ornamental",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 24
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 66,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-067-loropetal",
    "ordre": 67,
    "slug": "loropetal",
    "nomValencia": "Loropétal",
    "nomCastella": "Loropétalo",
    "nomAngles": "Chinese fringe flower",
    "nomCientific": "Loropetalum chinense",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 1 (BAIX)",
    "zonesCanaleta": [
      "PARTERRE 1 (BAIX)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 1 (BAIX)",
        "liniaTitol": 628,
        "liniaCientific": 673
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 67,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-068-magraner",
    "ordre": 68,
    "slug": "magraner",
    "nomValencia": "Magraner",
    "nomCastella": "Granado -",
    "nomAngles": "Pomegranate",
    "nomCientific": "Punica granatum",
    "usos": [
      "Medicinal",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 427
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 68,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-069-magraner-nano",
    "ordre": 69,
    "slug": "magraner-nano",
    "nomValencia": "Magraner nano",
    "nomCastella": "Granado enano",
    "nomAngles": "Dwarf pomegranate",
    "nomCientific": "Punica granatum nana",
    "usos": [
      "Medicinal",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 4 (FONT D’HERBES)",
    "zonesCanaleta": [
      "PARTERRE 4 (FONT D’HERBES)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 4 (FONT D’HERBES)",
        "liniaTitol": 939,
        "liniaCientific": 986
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 69,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-070-marfull",
    "ordre": 70,
    "slug": "marfull",
    "nomValencia": "Marfull",
    "nomCastella": "Durillo",
    "nomAngles": "Laurestine",
    "nomCientific": "Viburnum tinus",
    "usos": [
      "Ornamental",
      "Medicinal"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA · PARTERRE 2 (MIG)",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA",
      "PARTERRE 2 (MIG)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 79
      },
      {
        "zona": "PARTERRE 2 (MIG)",
        "liniaTitol": 732,
        "liniaCientific": 816
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Medicinal"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 70,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-071-margarida-groga",
    "ordre": 71,
    "slug": "margarida-groga",
    "nomValencia": "Margarida groga",
    "nomCastella": "Margarita amarilla",
    "nomAngles": "Grey-leaved euryops",
    "nomCientific": "Euryops pectinatus",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE ABELLES I BANCAL SUPERIOR",
    "zonesCanaleta": [
      "PARTERRE ABELLES I BANCAL SUPERIOR"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE ABELLES I BANCAL SUPERIOR",
        "liniaTitol": 991,
        "liniaCientific": 1026
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 71,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-072-marialluisa-herballuisa",
    "ordre": 72,
    "slug": "marialluisa-herballuisa",
    "nomValencia": "Marialluïsa / Herballuïsa",
    "nomCastella": "Hierba luisa",
    "nomAngles": "Lemon verbena",
    "nomCientific": "Aloysia citriodora",
    "usos": [
      "Medicinal",
      "Aromàtica"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 2 (MIG)",
    "zonesCanaleta": [
      "PARTERRE 2 (MIG)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 2 (MIG)",
        "liniaTitol": 732,
        "liniaCientific": 792
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 72,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-073-menta",
    "ordre": 73,
    "slug": "menta",
    "nomValencia": "Menta",
    "nomCastella": "Menta",
    "nomAngles": "Mint",
    "nomCientific": "Mentha piperita",
    "usos": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PLANTES ERA",
    "zonesCanaleta": [
      "PLANTES ERA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PLANTES ERA",
        "liniaTitol": 210,
        "liniaCientific": 288
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 73,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-074-morera-blanca-revisar",
    "ordre": 74,
    "slug": "morera-blanca-revisar",
    "nomValencia": "Morera blanca (Revisar)",
    "nomCastella": "Morera",
    "nomAngles": "Mulberry",
    "nomCientific": "Morus alba",
    "usos": [
      "Ornamental",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 55
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 74,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-075-morera-negra-revisar",
    "ordre": 75,
    "slug": "morera-negra-revisar",
    "nomValencia": "Morera negra (Revisar)",
    "nomCastella": "Morera",
    "nomAngles": "Mulberry",
    "nomCientific": "Morus nigra",
    "usos": [
      "Ornamental",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 457
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 75,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-076-murta",
    "ordre": 76,
    "slug": "murta",
    "nomValencia": "Murta",
    "nomCastella": "Mirto",
    "nomAngles": "Myrtle",
    "nomCientific": "Myrtus communis",
    "usos": [
      "Ornamental",
      "Medicinal",
      "Aromàtica"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA · ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA",
      "ARBRES I PLANTES ZONA ALMASSERA I DARRERE"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 97
      },
      {
        "zona": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
        "liniaTitol": 523,
        "liniaCientific": 546
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Medicinal",
      "Aromàtica"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 76,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-077-nabiu-blau",
    "ordre": 77,
    "slug": "nabiu-blau",
    "nomValencia": "Nabiu blau",
    "nomCastella": "Arándano azul",
    "nomAngles": "Blueberry",
    "nomCientific": "Vaccinium corymbosum",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 3 (FRUITES DE LA SERRA)",
    "zonesCanaleta": [
      "PARTERRE 3 (FRUITES DE LA SERRA)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 3 (FRUITES DE LA SERRA)",
        "liniaTitol": 835,
        "liniaCientific": 864
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 77,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-078-nabiu-roig",
    "ordre": 78,
    "slug": "nabiu-roig",
    "nomValencia": "Nabiu roig",
    "nomCastella": "Arándano rojo",
    "nomAngles": "Cranberry",
    "nomCientific": "Vaccinium macrocarpon",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 3 (FRUITES DE LA SERRA)",
    "zonesCanaleta": [
      "PARTERRE 3 (FRUITES DE LA SERRA)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 3 (FRUITES DE LA SERRA)",
        "liniaTitol": 835,
        "liniaCientific": 858
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 78,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-079-nesprer",
    "ordre": 79,
    "slug": "nesprer",
    "nomValencia": "Nesprer",
    "nomCastella": "Nísperero europeo",
    "nomAngles": "Common medlar",
    "nomCientific": "Mespilus germanica",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 390
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 79,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-080-nesprer-del-japo",
    "ordre": 80,
    "slug": "nesprer-del-japo",
    "nomValencia": "Nesprer del Japó",
    "nomCastella": "Nísperero",
    "nomAngles": "Japanese medlar",
    "nomCientific": "Eriobotrya japonica",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 475
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 80,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-081-nesto-nyestro",
    "ordre": 81,
    "slug": "nesto-nyestro",
    "nomValencia": "Nesto (Nyestro)",
    "nomCastella": "Aladierna",
    "nomAngles": "Mediterranean buckthorn",
    "nomCientific": "Rhamnus Alaternus",
    "usos": [
      "Medicinal"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 3 (FRUITES DE LA SERRA) · PARTERRE 4 (FONT D’HERBES)",
    "zonesCanaleta": [
      "PARTERRE 3 (FRUITES DE LA SERRA)",
      "PARTERRE 4 (FONT D’HERBES)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 3 (FRUITES DE LA SERRA)",
        "liniaTitol": 835,
        "liniaCientific": 906
      },
      {
        "zona": "PARTERRE 4 (FONT D’HERBES)",
        "liniaTitol": 939,
        "liniaCientific": 956
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 81,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-082-olivaro",
    "ordre": 82,
    "slug": "olivaro",
    "nomValencia": "Olivaró",
    "nomCastella": "Acebuche",
    "nomAngles": "Wild olive",
    "nomCientific": "Olea europea sylvestris",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA ALMASSERA I DARRERE"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
        "liniaTitol": 523,
        "liniaCientific": 528
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 82,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-083-olivera",
    "ordre": 83,
    "slug": "olivera",
    "nomValencia": "Olivera",
    "nomCastella": "Olivo",
    "nomAngles": "Olive",
    "nomCientific": "Olea europea",
    "usos": [
      "Ornamental",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA ALMASSERA I DARRERE"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
        "liniaTitol": 523,
        "liniaCientific": 534
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 83,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-084-ordi-civada",
    "ordre": 84,
    "slug": "ordi-civada",
    "nomValencia": "Ordi (Civada)",
    "nomCastella": "Cebada",
    "nomAngles": "Barley",
    "nomCientific": "Hordeum vulgare",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA ALMASSERA I DARRERE"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
        "liniaTitol": 523,
        "liniaCientific": 570
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 84,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-085-orenga",
    "ordre": 85,
    "slug": "orenga",
    "nomValencia": "Orenga",
    "nomCastella": "Orégano",
    "nomAngles": "Oregano",
    "nomCientific": "Origanum vulgare",
    "usos": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PLANTES ERA · PARTERRE 4 (FONT D’HERBES)",
    "zonesCanaleta": [
      "PLANTES ERA",
      "PARTERRE 4 (FONT D’HERBES)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PLANTES ERA",
        "liniaTitol": 210,
        "liniaCientific": 256
      },
      {
        "zona": "PARTERRE 4 (FONT D’HERBES)",
        "liniaTitol": 939,
        "liniaCientific": 950
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 85,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-086-panis-blat-de-moro",
    "ordre": 86,
    "slug": "panis-blat-de-moro",
    "nomValencia": "Panís / Blat de moro",
    "nomCastella": "Maíz",
    "nomAngles": "Maize",
    "nomCientific": "Zea mays",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA ALMASSERA I DARRERE"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
        "liniaTitol": 523,
        "liniaCientific": 558
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 86,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-087-parra",
    "ordre": 87,
    "slug": "parra",
    "nomValencia": "Parra",
    "nomCastella": "Vid",
    "nomAngles": "Vine",
    "nomCientific": "Vitis vinifera",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 499
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 87,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-088-pebrella",
    "ordre": 88,
    "slug": "pebrella",
    "nomValencia": "Pebrella",
    "nomCastella": "Pebrella",
    "nomAngles": "Piperela",
    "nomCientific": "Thymus Piperella",
    "usos": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PLANTES ERA · PARTERRE 2 (MIG)",
    "zonesCanaleta": [
      "PLANTES ERA",
      "PARTERRE 2 (MIG)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PLANTES ERA",
        "liniaTitol": 210,
        "liniaCientific": 214
      },
      {
        "zona": "PARTERRE 2 (MIG)",
        "liniaTitol": 732,
        "liniaCientific": 748
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 88,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-089-perera",
    "ordre": 89,
    "slug": "perera",
    "nomValencia": "Perera",
    "nomCastella": "Peral",
    "nomAngles": "Pear tree",
    "nomCientific": "Pyrus communis",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 433
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 89,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-090-perera-de-flor",
    "ordre": 90,
    "slug": "perera-de-flor",
    "nomValencia": "Perera de flor",
    "nomCastella": "Peral de Callery",
    "nomAngles": "Callery pear (“The Survivor Tree”)",
    "nomCientific": "Pyrus calleryana “Chanticleer”",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES DAVANT CASA",
    "zonesCanaleta": [
      "ARBRES DAVANT CASA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES DAVANT CASA",
        "liniaTitol": 314,
        "liniaCientific": 331
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 90,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-091-perico",
    "ordre": 91,
    "slug": "perico",
    "nomValencia": "Perico",
    "nomCastella": "Hipérico",
    "nomAngles": "Saint John’s Wort",
    "nomCientific": "Hypericum perforatum",
    "usos": [
      "Medicinal",
      "Aromàtica"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 2 (MIG)",
    "zonesCanaleta": [
      "PARTERRE 2 (MIG)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 2 (MIG)",
        "liniaTitol": 732,
        "liniaCientific": 760
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 91,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-092-pi-revisar",
    "ordre": 92,
    "slug": "pi-revisar",
    "nomValencia": "Pi (Revisar)",
    "nomCastella": "Pino",
    "nomAngles": "Aleppo pine",
    "nomCientific": "Pinus halepensis",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE ABELLES I BANCAL SUPERIOR",
    "zonesCanaleta": [
      "PARTERRE ABELLES I BANCAL SUPERIOR"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE ABELLES I BANCAL SUPERIOR",
        "liniaTitol": 991,
        "liniaCientific": 1004
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 92,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-093-pi-pinyer-revisar",
    "ordre": 93,
    "slug": "pi-pinyer-revisar",
    "nomValencia": "Pi pinyer (Revisar)",
    "nomCastella": "Pino piñonero",
    "nomAngles": "Stone pine",
    "nomCientific": "Pinus pinea",
    "usos": [
      "Ornamental",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 145
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 93,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-094-piracanta",
    "ordre": 94,
    "slug": "piracanta",
    "nomValencia": "Piracanta",
    "nomCastella": "Espino de fuego",
    "nomAngles": "Red firethorn",
    "nomCientific": "Pyracantha coccinea",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 73
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 94,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-095-pistatxer",
    "ordre": 95,
    "slug": "pistatxer",
    "nomValencia": "Pistatxer",
    "nomCastella": "Alfóncigo",
    "nomAngles": "Pistacia",
    "nomCientific": "Pistacea vera",
    "usos": [
      "Medicinal",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 3 (FRUITES DE LA SERRA)",
    "zonesCanaleta": [
      "PARTERRE 3 (FRUITES DE LA SERRA)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 3 (FRUITES DE LA SERRA)",
        "liniaTitol": 835,
        "liniaCientific": 918
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 95,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-096-pomera",
    "ordre": 96,
    "slug": "pomera",
    "nomValencia": "Pomera",
    "nomCastella": "Manzano",
    "nomAngles": "Apple tree",
    "nomCientific": "Malus domesticus",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 439
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 96,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-097-pomera-borda-blanca",
    "ordre": 97,
    "slug": "pomera-borda-blanca",
    "nomValencia": "Pomera borda blanca",
    "nomCastella": "Manzano de jardín",
    "nomAngles": "Evereste",
    "nomCientific": "Malus Perpetu",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 3 (FRUITES DE LA SERRA)",
    "zonesCanaleta": [
      "PARTERRE 3 (FRUITES DE LA SERRA)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 3 (FRUITES DE LA SERRA)",
        "liniaTitol": 835,
        "liniaCientific": 894
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 97,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-098-pomera-borda-roja",
    "ordre": 98,
    "slug": "pomera-borda-roja",
    "nomValencia": "Pomera borda roja",
    "nomCastella": "Manzano silvestre",
    "nomAngles": "Crab apple “Profusion”",
    "nomCientific": "Malus floribunda",
    "usos": [
      "Ornamental",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 3 (FRUITES DE LA SERRA)",
    "zonesCanaleta": [
      "PARTERRE 3 (FRUITES DE LA SERRA)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 3 (FRUITES DE LA SERRA)",
        "liniaTitol": 835,
        "liniaCientific": 900
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 98,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-099-prunera",
    "ordre": 99,
    "slug": "prunera",
    "nomValencia": "Prunera",
    "nomCastella": "Ciruelo",
    "nomAngles": "Circle",
    "nomCientific": "Prunus domestica",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 372
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 99,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-100-prunera-de-fulla-vermella",
    "ordre": 100,
    "slug": "prunera-de-fulla-vermella",
    "nomValencia": "Prunera de fulla vermella",
    "nomCastella": "Ciruelo rojo",
    "nomAngles": "Red plum",
    "nomCientific": "Prunus cerasifera",
    "usos": [
      "Ornamental",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 463
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 100,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-101-rabet-de-gat",
    "ordre": 101,
    "slug": "rabet-de-gat",
    "nomValencia": "Rabet de gat",
    "nomCastella": "Rabo de gato",
    "nomAngles": "Ironwort",
    "nomCientific": "Sideritis angustifolia",
    "usos": [
      "Medicinal",
      "Aromàtica"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 2 (MIG)",
    "zonesCanaleta": [
      "PARTERRE 2 (MIG)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 2 (MIG)",
        "liniaTitol": 732,
        "liniaCientific": 742
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 101,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-102-romer",
    "ordre": 102,
    "slug": "romer",
    "nomValencia": "Romer",
    "nomCastella": "Romero",
    "nomAngles": "Rosemary",
    "nomCientific": "Rosmarinus officinalis",
    "usos": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 2 (MIG)",
    "zonesCanaleta": [
      "PARTERRE 2 (MIG)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 2 (MIG)",
        "liniaTitol": 732,
        "liniaCientific": 822
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 102,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-103-romer-reptant",
    "ordre": 103,
    "slug": "romer-reptant",
    "nomValencia": "Romer reptant",
    "nomCastella": "Romero rastrero",
    "nomAngles": "Rosemary Prostratus",
    "nomCientific": "Rosmarinus officinalis prostratus",
    "usos": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA · PLANTES ERA · PARTERRE 1 (BAIX) · PARTERRE 2 (MIG) · PARTERRE 4 (FONT D’HERBES) · PARTERRE ABELLES I BANCAL SUPERIOR",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA",
      "PLANTES ERA",
      "PARTERRE 1 (BAIX)",
      "PARTERRE 2 (MIG)",
      "PARTERRE 4 (FONT D’HERBES)",
      "PARTERRE ABELLES I BANCAL SUPERIOR"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 171
      },
      {
        "zona": "PLANTES ERA",
        "liniaTitol": 210,
        "liniaCientific": 294
      },
      {
        "zona": "PARTERRE 1 (BAIX)",
        "liniaTitol": 628,
        "liniaCientific": 655
      },
      {
        "zona": "PARTERRE 2 (MIG)",
        "liniaTitol": 732,
        "liniaCientific": 754
      },
      {
        "zona": "PARTERRE 4 (FONT D’HERBES)",
        "liniaTitol": 939,
        "liniaCientific": 980
      },
      {
        "zona": "PARTERRE ABELLES I BANCAL SUPERIOR",
        "liniaTitol": 991,
        "liniaCientific": 1032
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 103,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-104-roser",
    "ordre": 104,
    "slug": "roser",
    "nomValencia": "Roser",
    "nomCastella": "Rosal",
    "nomAngles": "Rosebush",
    "nomCientific": "Rosa",
    "usos": [
      "Ornamental",
      "Aromàtica"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA ALMASSERA I DARRERE"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
        "liniaTitol": 523,
        "liniaCientific": 583
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Aromàtica"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 104,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-105-roser-sense-punxes",
    "ordre": 105,
    "slug": "roser-sense-punxes",
    "nomValencia": "Roser sense punxes",
    "nomCastella": "Rosal trepador sin espinas",
    "nomAngles": "Lady Banks' Rose",
    "nomCientific": "Rosa SPP",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 61
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 105,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-106-ruda",
    "ordre": 106,
    "slug": "ruda",
    "nomValencia": "Ruda",
    "nomCastella": "Ruta",
    "nomAngles": "Ruta",
    "nomCientific": "Ruta graveolens",
    "usos": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PLANTES ERA",
    "zonesCanaleta": [
      "PLANTES ERA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PLANTES ERA",
        "liniaTitol": 210,
        "liniaCientific": 226
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 106,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-107-salvia",
    "ordre": 107,
    "slug": "salvia",
    "nomValencia": "Sàlvia",
    "nomCastella": "Salvia",
    "nomAngles": "Sage",
    "nomCientific": "Salvia officinalis",
    "usos": [
      "Medicinal",
      "Aromàtica"
    ],
    "esToxica": null,
    "zonaCanaleta": "PLANTES ERA · PARTERRE 1 (BAIX) · PARTERRE 2 (MIG)",
    "zonesCanaleta": [
      "PLANTES ERA",
      "PARTERRE 1 (BAIX)",
      "PARTERRE 2 (MIG)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PLANTES ERA",
        "liniaTitol": 210,
        "liniaCientific": 250
      },
      {
        "zona": "PARTERRE 1 (BAIX)",
        "liniaTitol": 628,
        "liniaCientific": 649
      },
      {
        "zona": "PARTERRE 2 (MIG)",
        "liniaTitol": 732,
        "liniaCientific": 786
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 107,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-108-salvia-de-mariola",
    "ordre": 108,
    "slug": "salvia-de-mariola",
    "nomValencia": "Sàlvia de Mariola",
    "nomCastella": "Salvia de Mariola",
    "nomAngles": "Mariola sage",
    "nomCientific": "Salvia Blancoana Mariolensis",
    "usos": [
      "Aromàtica"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 2 (MIG)",
    "zonesCanaleta": [
      "PARTERRE 2 (MIG)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 2 (MIG)",
        "liniaTitol": 732,
        "liniaCientific": 810
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aromàtica"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 108,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-109-segol",
    "ordre": 109,
    "slug": "segol",
    "nomValencia": "Sègol",
    "nomCastella": "Centeno",
    "nomAngles": "Rye",
    "nomCientific": "Secale cereale",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA ALMASSERA I DARRERE"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA ALMASSERA I DARRERE",
        "liniaTitol": 523,
        "liniaCientific": 577
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 109,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-110-servera",
    "ordre": 110,
    "slug": "servera",
    "nomValencia": "Servera",
    "nomCastella": "Serbal",
    "nomAngles": "Rowan",
    "nomCientific": "Sorbus domestica",
    "usos": [
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "BANCAL DE FRUITALS",
    "zonesCanaleta": [
      "BANCAL DE FRUITALS"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "BANCAL DE FRUITALS",
        "liniaTitol": 367,
        "liniaCientific": 378
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 110,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-111-teix",
    "ordre": 111,
    "slug": "teix",
    "nomValencia": "Teix",
    "nomCastella": "Tejo",
    "nomAngles": "Yew",
    "nomCientific": "Taxus baccata",
    "usos": [
      "Ornamental",
      "Medicinal",
      "Artesanal",
      "Tòxic"
    ],
    "esToxica": true,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 133
      }
    ],
    "alertaSeguretat": "La font documental marca esta fitxa com a tòxica.",
    "usosTranscrits": [
      "Ornamental",
      "Medicinal",
      "Artesanal",
      "Tòxic"
    ],
    "usosNoContrastats": [],
    "toxicitat": "advertida-a-la-font",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 111,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-112-tillera",
    "ordre": 112,
    "slug": "tillera",
    "nomValencia": "Til·lera",
    "nomCastella": "Tilo",
    "nomAngles": "Largeleaf linden",
    "nomCientific": "Tilia platyphyllos",
    "usos": [
      "Ornamental",
      "Medicinal"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 36
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Medicinal"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 112,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-113-timo",
    "ordre": 113,
    "slug": "timo",
    "nomValencia": "Timó",
    "nomCastella": "Tomillo",
    "nomAngles": "Thyme",
    "nomCientific": "Thymus vulgaris",
    "usos": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PLANTES ERA · PARTERRE 2 (MIG) · PARTERRE 4 (FONT D’HERBES)",
    "zonesCanaleta": [
      "PLANTES ERA",
      "PARTERRE 2 (MIG)",
      "PARTERRE 4 (FONT D’HERBES)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PLANTES ERA",
        "liniaTitol": 210,
        "liniaCientific": 276
      },
      {
        "zona": "PARTERRE 2 (MIG)",
        "liniaTitol": 732,
        "liniaCientific": 798
      },
      {
        "zona": "PARTERRE 4 (FONT D’HERBES)",
        "liniaTitol": 939,
        "liniaCientific": 968
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 113,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-114-timo-allimonat",
    "ordre": 114,
    "slug": "timo-allimonat",
    "nomValencia": "Timó allimonat",
    "nomCastella": "Tomillo limonero",
    "nomAngles": "Citrus thyme",
    "nomCientific": "Thymus x citriodorus",
    "usos": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 2 (MIG)",
    "zonesCanaleta": [
      "PARTERRE 2 (MIG)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 2 (MIG)",
        "liniaTitol": 732,
        "liniaCientific": 804
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 114,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-115-timo-reptant",
    "ordre": 115,
    "slug": "timo-reptant",
    "nomValencia": "Timò reptant",
    "nomCastella": "Tomillo rastrero",
    "nomAngles": "Red Creeping Thyme",
    "nomCientific": "Thymus Praecox “Coccineus”",
    "usos": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "esToxica": null,
    "zonaCanaleta": "PARTERRE 4 (FONT D’HERBES)",
    "zonesCanaleta": [
      "PARTERRE 4 (FONT D’HERBES)"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "PARTERRE 4 (FONT D’HERBES)",
        "liniaTitol": 939,
        "liniaCientific": 944
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Medicinal",
      "Aromàtica",
      "Aliment"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 115,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-116-vareta-de-sant-josep",
    "ordre": 116,
    "slug": "vareta-de-sant-josep",
    "nomValencia": "Vareta de Sant Josep",
    "nomCastella": "Celindo",
    "nomAngles": "Cornus",
    "nomCientific": "Philadelphus coronarius",
    "usos": [
      "Ornamental"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 115
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 116,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  },
  {
    "id": "herbari-117-vincapervinca",
    "ordre": 117,
    "slug": "vincapervinca",
    "nomValencia": "Vincapervinca",
    "nomCastella": "Hierba doncella",
    "nomAngles": "Bigleaf periwinkle",
    "nomCientific": "Vinca major",
    "usos": [
      "Ornamental",
      "Medicinal"
    ],
    "esToxica": null,
    "zonaCanaleta": "ARBRES I PLANTES ZONA BASSA",
    "zonesCanaleta": [
      "ARBRES I PLANTES ZONA BASSA"
    ],
    "localitzacionsCanaleta": [
      {
        "zona": "ARBRES I PLANTES ZONA BASSA",
        "liniaTitol": 1,
        "liniaCientific": 121
      }
    ],
    "alertaSeguretat": null,
    "usosTranscrits": [
      "Ornamental",
      "Medicinal"
    ],
    "usosNoContrastats": [],
    "toxicitat": "no-avaluada",
    "font": {
      "document": "Herbari de La Torre de les Maçanes",
      "pagina": 117,
      "sha256": "5243f9d07d937548778246d4893821c507ae74c4bd8b34f07b16dacd4c3e6673",
      "estat": "transcripcio-documental",
      "taxonomiaRevisada": false
    }
  }
].map(f=>Object.freeze({...f,zonesCanaleta:Object.freeze(f.zonesCanaleta),localitzacionsCanaleta:Object.freeze(f.localitzacionsCanaleta.map(x=>Object.freeze(x))),fontZones:FONT_ZONES_HERBARI,usos:Object.freeze(f.usos),usosTranscrits:Object.freeze(f.usosTranscrits),usosNoContrastats:Object.freeze(f.usosNoContrastats),font:Object.freeze(f.font)})));

const normalitzaCercaHerbari = value => String(value || '')
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[·.]/g, '')
  .toLowerCase()
  .trim();

export function filtraEspeciesHerbari({
  cerca = '',
  usActiu = 'Tots',
  nomesToxiques = false
} = {}) {
  const q = normalitzaCercaHerbari(cerca);
  return ESPECIES_HERBARI_LA_TORRE_117.filter((esp) => {
    if (nomesToxiques && !esp.esToxica) return false;
    if (usActiu && usActiu !== 'Tots' && !esp.usos.includes(usActiu)) return false;
    if (!q) return true;
    const camp = normalitzaCercaHerbari(`${esp.nomValencia} ${esp.nomCastella} ${esp.nomAngles} ${esp.nomCientific} ${esp.zonaCanaleta}`);
    return camp.includes(q);
  });
}

export function construeixLocucioEspecieHerbari(especie) {
  if (!especie) return '';
  const usosTxt = especie.usos.length ? `Usos tradicionals: ${especie.usos.join(', ')}.` : '';
  const alertaTxt = especie.esToxica
    ? ' Atenció: la font documental advertix toxicitat. No en mengeu cap part ni la deixeu a l’abast de xiquets o animals.'
    : ' La font no avalua la toxicitat; això no acredita innocuïtat: no mengeu cap planta sense consell expert.';
  return `${especie.nomValencia}, de nom científic ${especie.nomCientific}. En castellà s'anomena ${especie.nomCastella}, i en anglès ${especie.nomAngles}. ${usosTxt}${alertaTxt}`;
}
