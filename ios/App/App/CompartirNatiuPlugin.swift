import Capacitor
import Foundation
import UIKit

/// Receptor del menú «Compartir» d'iOS (ordre del Mestre, 261026). L'extensió
/// (Compartir/ShareViewController.swift) deixa cada lot a l'App Group amb el
/// manifest escrit l'últim; ací, cada vegada que l'App torna a primer pla, els
/// lots complets passen a la memòria cau privada i arriben al web amb
/// l'esdeveniment «compartit», retingut fins que el web s'hi subscriu (en fred
/// el JS encara no ha carregat). Mateix contracte que CompartirNatiuPlugin.java.
/// Gauntlet 261026_1615 (Codex C1615-03) · Les còpies locals només s'esborren
/// quan el web les allibera (enviades o descartades). En arrencar, les que hi
/// queden tornen a «Envia a…»: un tancament de l'App no perd cap compartició.
@objc(CompartirNatiuPlugin)
public class CompartirNatiuPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CompartirNatiuPlugin"
    public let jsName = "CompartirNatiu"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "allibera", returnType: CAPPluginReturnPromise),
    ]

    static let grup = "group.org.socdepoble.app"
    static let esdeveniment = "compartit"
    /// L'extensió l'envia en acabar un lot: amb l'App ja activa (l'iPad en
    /// pantalla dividida) no hi ha cap didBecomeActive que el recollisca.
    static let avisDarwin = "org.socdepoble.app.compartit"
    private static let mimes: [String: String] = ["image/png": "png", "image/jpeg": "jpg"]
    /// Un lot sense manifest més vell que açò és d'una extensió que no va acabar.
    private static let caducitatLotMs: Int64 = 10 * 60 * 1000
    /// Una còpia local sense enviar es conserva una setmana, com a Android.
    private static let caducitatRestaMs: Int64 = 7 * 24 * 60 * 60 * 1000
    private static let maxCaracters = 10_000
    private static let maxFitxers = 10

    private let cua = DispatchQueue(label: "org.socdepoble.app.compartir")

    override public func load() {
        // La primera passada també porta les còpies que encara no s'han enviat.
        cua.async { [weak self] in self?.recull(intent: 0, ambRestes: true) }
        NotificationCenter.default.addObserver(self, selector: #selector(revisa), name: UIApplication.didBecomeActiveNotification, object: nil)
        CFNotificationCenterAddObserver(
            CFNotificationCenterGetDarwinNotifyCenter(),
            Unmanaged.passUnretained(self).toOpaque(),
            { _, observador, _, _, _ in
                guard let observador else { return }
                Unmanaged<CompartirNatiuPlugin>.fromOpaque(observador).takeUnretainedValue().revisa()
            },
            Self.avisDarwin as CFString,
            nil,
            .deliverImmediately
        )
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
        CFNotificationCenterRemoveObserver(CFNotificationCenterGetDarwinNotifyCenter(), Unmanaged.passUnretained(self).toOpaque(), nil, nil)
    }

    @objc func allibera(_ call: CAPPluginCall) {
        let rutes = call.getArray("rutes", String.self) ?? []
        cua.async {
            let base = Self.carpetaLocal().standardizedFileURL.path + "/"
            var esborrats = 0
            for ruta in rutes {
                let fitxer = URL(fileURLWithPath: ruta).standardizedFileURL
                // Només els fitxers de la nostra carpeta: res fora de compartits/.
                guard fitxer.path.hasPrefix(base) else { continue }
                if (try? FileManager.default.removeItem(at: fitxer)) != nil { esborrats += 1 }
            }
            call.resolve(["esborrats": esborrats])
        }
    }

    @objc private func revisa() {
        cua.async { [weak self] in self?.recull(intent: 0) }
    }

    /// L'extensió pot estar acabant d'escriure quan l'App torna: un lot incomplet
    /// i recent es torna a mirar tres vegades, cada segon i mig. Revisió 261026 ·
    /// Tots els lots complets d'una passada (diverses comparticions abans d'obrir
    /// l'App) van junts en un sol lliurament: el web en guarda un de pendent.
    private func recull(intent: Int, ambRestes: Bool = false) {
        let fm = FileManager.default
        let ara = Int64(Date().timeIntervalSince1970 * 1000)
        var junts = Lliurament()
        if ambRestes { afigRestes(a: &junts, ara: ara) }
        guard let contenidor = fm.containerURL(forSecurityApplicationGroupIdentifier: Self.grup) else { lliura(junts); return }
        let arrel = contenidor.appendingPathComponent("compartits", isDirectory: true)
        let lots = (try? fm.contentsOfDirectory(at: arrel, includingPropertiesForKeys: nil, options: [.skipsHiddenFiles])) ?? []
        var hiHaRecent = false
        for lot in lots.sorted(by: { $0.lastPathComponent < $1.lastPathComponent }) {
            let manifest = lot.appendingPathComponent("manifest.json")
            guard let dades = try? Data(contentsOf: manifest),
                  let contingut = try? JSONSerialization.jsonObject(with: dades) as? [String: Any] else {
                let marca = Int64(lot.lastPathComponent.split(separator: "-").first ?? "") ?? 0
                if ara - marca > Self.caducitatLotMs { try? fm.removeItem(at: lot) } else { hiHaRecent = true }
                continue
            }
            afig(contingut, de: lot, a: &junts)
            try? fm.removeItem(at: lot)
        }
        lliura(junts)
        if hiHaRecent && intent < 3 {
            cua.asyncAfter(deadline: .now() + 1.5) { [weak self] in self?.recull(intent: intent + 1) }
        }
    }

    private struct Lliurament {
        var fitxers: [[String: Any]] = []
        var textos: [String] = []
        var rebutjats = 0
    }

    private func afig(_ manifest: [String: Any], de lot: URL, a junts: inout Lliurament) {
        let fm = FileManager.default
        let desti = Self.carpetaLocal()
        try? fm.createDirectory(at: desti, withIntermediateDirectories: true)
        junts.rebutjats += (manifest["rebutjats"] as? Int) ?? 0
        for item in (manifest["fitxers"] as? [[String: Any]]) ?? [] {
            // El manifest ve d'un altre procés: només noms plans i formats coneguts.
            guard junts.fitxers.count < Self.maxFitxers,
                  let nom = item["fitxer"] as? String, !nom.contains("/"), !nom.hasPrefix("."),
                  let mime = item["mime"] as? String, let extensio = Self.mimes[mime] else {
                junts.rebutjats += 1
                continue
            }
            // L'hora al nom: l'edat d'una resta es llig sense dates de fitxers.
            let marca = Int64(Date().timeIntervalSince1970 * 1000)
            let final = desti.appendingPathComponent("\(marca)-\(UUID().uuidString).\(extensio)")
            do {
                try fm.moveItem(at: lot.appendingPathComponent(nom), to: final)
            } catch {
                junts.rebutjats += 1
                continue
            }
            let mida = (try? final.resourceValues(forKeys: [.fileSizeKey]))?.fileSize ?? 0
            let nomVisible = String(((item["nom"] as? String) ?? "captura").prefix(120))
            junts.fitxers.append(["ruta": final.path, "mime": mime, "mida": mida, "nom": nomVisible])
        }
        if let text = manifest["text"] as? String, !text.isEmpty { junts.textos.append(text) }
    }

    /// Les còpies locals que cap enviament ni descart no ha alliberat. Les massa
    /// velles (o sense hora al nom, d'abans) se'n van.
    private func afigRestes(a junts: inout Lliurament, ara: Int64) {
        let fm = FileManager.default
        let restes = (try? fm.contentsOfDirectory(at: Self.carpetaLocal(), includingPropertiesForKeys: nil, options: [.skipsHiddenFiles])) ?? []
        for resta in restes.sorted(by: { $0.lastPathComponent < $1.lastPathComponent }) {
            let marca = Int64(resta.lastPathComponent.split(separator: "-").first ?? "") ?? 0
            let extensio = resta.pathExtension.lowercased()
            guard ara - marca <= Self.caducitatRestaMs, junts.fitxers.count < Self.maxFitxers,
                  let mime = Self.mimes.first(where: { $0.value == extensio })?.key else {
                try? fm.removeItem(at: resta)
                continue
            }
            let mida = (try? resta.resourceValues(forKeys: [.fileSizeKey]))?.fileSize ?? 0
            junts.fitxers.append(["ruta": resta.path, "mime": mime, "mida": mida, "nom": "captura.\(extensio)"])
        }
    }

    private func lliura(_ junts: Lliurament) {
        let text = String(junts.textos.joined(separator: "\n\n").prefix(Self.maxCaracters))
        if junts.fitxers.isEmpty && text.isEmpty && junts.rebutjats == 0 { return }
        let dades: [String: Any] = ["fitxers": junts.fitxers, "text": text, "assumpte": "", "rebutjats": junts.rebutjats]
        DispatchQueue.main.async { [weak self] in
            self?.notifyListeners(Self.esdeveniment, data: dades, retainUntilConsumed: true)
        }
    }

    private static func carpetaLocal() -> URL {
        let caus = FileManager.default.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        return caus.appendingPathComponent("compartits", isDirectory: true)
    }
}
