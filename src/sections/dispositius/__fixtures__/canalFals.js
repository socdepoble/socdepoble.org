/** Doble de BroadcastChannel per a les proves de Dispositius (P5, 261003).
 *
 *  Es comporta com el del navegador en el que el pont necessita: cada canal
 *  rep el que publiquen els altres canals del mateix nom (mai el que publica
 *  ell), més tard que la crida i amb una còpia pròpia del missatge; un canal
 *  tancat ja no rep res i publicar-hi llança InvalidStateError. Guarda tot el
 *  que s'ha publicat per a poder comptar-ho. */
export class CanalFals {
  static oberts = new Map();
  static publicats = [];

  static reinicia() {
    CanalFals.oberts = new Map();
    CanalFals.publicats = [];
  }

  constructor(name) {
    this.name = name;
    this.tancat = false;
    this.oients = new Set();
    if (!CanalFals.oberts.has(name)) CanalFals.oberts.set(name, new Set());
    CanalFals.oberts.get(name).add(this);
  }

  addEventListener(tipus, oient) {
    if (tipus === 'message') this.oients.add(oient);
  }

  removeEventListener(tipus, oient) {
    if (tipus === 'message') this.oients.delete(oient);
  }

  postMessage(data) {
    if (this.tancat) throw new DOMException('El canal està tancat', 'InvalidStateError');
    const text = JSON.stringify(data);
    CanalFals.publicats.push({ canal: this.name, data: JSON.parse(text) });
    for (const altre of CanalFals.oberts.get(this.name) || []) {
      if (altre === this) continue;
      const copia = JSON.parse(text);
      queueMicrotask(() => {
        if (altre.tancat) return;
        for (const oient of [...altre.oients]) oient({ data: copia });
      });
    }
  }

  close() {
    this.tancat = true;
    CanalFals.oberts.get(this.name)?.delete(this);
  }
}

/** Deixa córrer els lliuraments pendents i les respostes que provoquen. */
export async function buida(voltes = 20) {
  for (let i = 0; i < voltes; i += 1) await Promise.resolve();
}
