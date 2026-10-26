import ImageIO
import UIKit
import UniformTypeIdentifiers

/// Extensió «Compartir» d'iOS. Rep captures, fotos i text del full de
/// compartir del sistema i els deixa a l'App Group perquè l'app els carregue
/// al xat en tornar a primer pla (CompartirNatiuPlugin.swift). L'extensió no
/// envia res: la persona revisa la miniatura i prem «Enviar» dins de l'app.
final class ShareViewController: UIViewController {

    static let grup = "group.org.socdepoble.app"
    private static let maxFitxers = 10
    // El sostre del bucket xat_adjunts i de l'adaptador web (natiu/compartirNatiu.js).
    private static let maxBytesFitxer = 20 * 1024 * 1024
    private static let maxCaracters = 10_000
    private static let costatMaxim: CGFloat = 4096

    private let etiqueta = UILabel()

    /// Revisió 261026 · Els textos en les cinc llengües de l'App, triats per la
    /// llengua preferida del sistema (l'extensió no porta catàlegs propis).
    private enum Text: String { case desant, senseGrup, error, buit, desat }
    private static let textos: [String: [Text: String]] = [
        "ca": [.desant: "Desant per a Sóc de Poble…", .senseGrup: "No s'ha pogut desar: falta l'App Group.", .error: "No s'ha pogut desar.",
               .buit: "No hi ha res que Sóc de Poble puga rebre.", .desat: "Desat. Obri Sóc de Poble per enviar-ho."],
        "es": [.desant: "Guardando para Sóc de Poble…", .senseGrup: "No se ha podido guardar: falta el App Group.", .error: "No se ha podido guardar.",
               .buit: "No hay nada que Sóc de Poble pueda recibir.", .desat: "Guardado. Abre Sóc de Poble para enviarlo."],
        "en": [.desant: "Saving for Sóc de Poble…", .senseGrup: "Couldn't save: the App Group is missing.", .error: "Couldn't save.",
               .buit: "There's nothing Sóc de Poble can receive.", .desat: "Saved. Open Sóc de Poble to send it."],
        "eu": [.desant: "Sóc de Poblerako gordetzen…", .senseGrup: "Ezin izan da gorde: App Group falta da.", .error: "Ezin izan da gorde.",
               .buit: "Ez dago Sóc de Poblek jaso dezakeen ezer.", .desat: "Gordeta. Ireki Sóc de Poble bidaltzeko."],
        "gl": [.desant: "Gardando para Sóc de Poble…", .senseGrup: "Non se puido gardar: falta o App Group.", .error: "Non se puido gardar.",
               .buit: "Non hai nada que Sóc de Poble poida recibir.", .desat: "Gardado. Abre Sóc de Poble para envialo."],
    ]
    private static func text(_ clau: Text) -> String {
        let llengua = Locale.preferredLanguages.lazy.map { String($0.prefix(2)) }.first { textos[$0] != nil } ?? "ca"
        return textos[llengua]?[clau] ?? textos["ca"]![clau]!
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = UIColor.black.withAlphaComponent(0.55)
        let caixa = UIView()
        caixa.backgroundColor = .systemBackground
        caixa.layer.cornerRadius = 16
        caixa.translatesAutoresizingMaskIntoConstraints = false
        etiqueta.text = Self.text(.desant)
        etiqueta.numberOfLines = 0
        etiqueta.textAlignment = .center
        etiqueta.font = .preferredFont(forTextStyle: .headline)
        etiqueta.translatesAutoresizingMaskIntoConstraints = false
        caixa.addSubview(etiqueta)
        view.addSubview(caixa)
        NSLayoutConstraint.activate([
            caixa.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            caixa.centerYAnchor.constraint(equalTo: view.centerYAnchor),
            caixa.widthAnchor.constraint(lessThanOrEqualTo: view.widthAnchor, constant: -48),
            caixa.widthAnchor.constraint(greaterThanOrEqualToConstant: 240),
            etiqueta.topAnchor.constraint(equalTo: caixa.topAnchor, constant: 24),
            etiqueta.bottomAnchor.constraint(equalTo: caixa.bottomAnchor, constant: -24),
            etiqueta.leadingAnchor.constraint(equalTo: caixa.leadingAnchor, constant: 24),
            etiqueta.trailingAnchor.constraint(equalTo: caixa.trailingAnchor, constant: -24),
        ])
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        Task { await desa() }
    }

    private func desa() async {
        guard let contenidor = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: Self.grup) else {
            acaba(Self.text(.senseGrup))
            return
        }
        // El nom del lot porta l'hora: l'App en sap l'edat sense llegir dates de fitxers.
        let marca = Int64(Date().timeIntervalSince1970 * 1000)
        let lot = contenidor.appendingPathComponent("compartits", isDirectory: true)
            .appendingPathComponent("\(marca)-\(UUID().uuidString)", isDirectory: true)
        do {
            try FileManager.default.createDirectory(at: lot, withIntermediateDirectories: true)
        } catch {
            acaba(Self.text(.error))
            return
        }

        var fitxers: [[String: Any]] = []
        var textos: [String] = []
        var rebutjats = 0
        let proveidors = (extensionContext?.inputItems as? [NSExtensionItem] ?? []).flatMap { $0.attachments ?? [] }
        for proveidor in proveidors {
            if proveidor.hasItemConformingToTypeIdentifier(UTType.image.identifier) {
                guard fitxers.count < Self.maxFitxers, let fitxer = await desaImatge(proveidor, a: lot) else {
                    rebutjats += 1
                    continue
                }
                fitxers.append(fitxer)
            } else if proveidor.hasItemConformingToTypeIdentifier(UTType.url.identifier) {
                /* Gauntlet 261026_1615 (Gemini G1615-01) · Un fitxer de Fitxers (un PDF,
                   un vídeo) també és un URL (public.file-url): mai no ha d'arribar com a
                   text amb la ruta del telèfon. Només enllaços web; la resta, rebutjada. */
                let url = try? await proveidor.loadItem(forTypeIdentifier: UTType.url.identifier) as? URL
                if let url, !url.isFileURL, ["http", "https"].contains(url.scheme?.lowercased() ?? "") {
                    textos.append(url.absoluteString)
                } else {
                    rebutjats += 1
                }
            } else if proveidor.hasItemConformingToTypeIdentifier(UTType.plainText.identifier) {
                if let text = try? await proveidor.loadItem(forTypeIdentifier: UTType.plainText.identifier) as? String {
                    textos.append(text)
                }
            } else {
                rebutjats += 1
            }
        }

        var text = textos.map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }.filter { !$0.isEmpty }.joined(separator: "\n\n")
        if text.count > Self.maxCaracters { text = String(text.prefix(Self.maxCaracters)) }

        if fitxers.isEmpty && text.isEmpty {
            try? FileManager.default.removeItem(at: lot)
            acaba(Self.text(.buit))
            return
        }

        let manifest: [String: Any] = ["fitxers": fitxers, "text": text, "rebutjats": rebutjats]
        do {
            let dades = try JSONSerialization.data(withJSONObject: manifest)
            // El manifest s'escriu l'últim i de colp: l'app només llig lots complets.
            try dades.write(to: lot.appendingPathComponent("manifest.json"), options: .atomic)
        } catch {
            try? FileManager.default.removeItem(at: lot)
            acaba(Self.text(.error))
            return
        }
        // Si l'App ja és activa (l'iPad en pantalla dividida), que ho recollisca ara.
        CFNotificationCenterPostNotification(CFNotificationCenterGetDarwinNotifyCenter(),
                                             CFNotificationName("org.socdepoble.app.compartit" as CFString), nil, nil, true)
        acaba(Self.text(.desat))
    }

    /// PNG i JPEG passen tal qual; HEIC i la resta es reescriuen a JPEG, que és
    /// el que sap pujar el xat. Les fotos molt grans es reduïxen a 4096 px.
    private func desaImatge(_ proveidor: NSItemProvider, a lot: URL) async -> [String: Any]? {
        let tipus = [UTType.png, UTType.jpeg].first { proveidor.hasItemConformingToTypeIdentifier($0.identifier) } ?? UTType.image
        guard let origen = await copiaTemporal(proveidor, tipus: tipus) else { return nil }
        defer { try? FileManager.default.removeItem(at: origen) }

        let nom = UUID().uuidString
        var desti: URL
        var mime: String
        if tipus == .png || tipus == .jpeg, let mida = midaDe(origen), mida <= Self.maxBytesFitxer, !esMassaGran(origen) {
            mime = tipus == .png ? "image/png" : "image/jpeg"
            desti = lot.appendingPathComponent(nom + (tipus == .png ? ".png" : ".jpg"))
            guard (try? FileManager.default.copyItem(at: origen, to: desti)) != nil else { return nil }
        } else {
            mime = "image/jpeg"
            desti = lot.appendingPathComponent(nom + ".jpg")
            guard reescriuJpeg(origen, a: desti) else { return nil }
        }
        guard let mida = midaDe(desti), mida > 0, mida <= Self.maxBytesFitxer else {
            try? FileManager.default.removeItem(at: desti)
            return nil
        }
        let nomVisible = (proveidor.suggestedName ?? "captura").replacingOccurrences(of: "/", with: "_")
        return ["fitxer": desti.lastPathComponent, "mime": mime, "mida": mida, "nom": String(nomVisible.prefix(120))]
    }

    private func copiaTemporal(_ proveidor: NSItemProvider, tipus: UTType) async -> URL? {
        await withCheckedContinuation { continuacio in
            _ = proveidor.loadFileRepresentation(forTypeIdentifier: tipus.identifier) { url, _ in
                // L'URL que dona el sistema s'esborra en tornar: la copiem abans.
                guard let url else {
                    continuacio.resume(returning: nil)
                    return
                }
                let temporal = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
                do {
                    try FileManager.default.copyItem(at: url, to: temporal)
                    continuacio.resume(returning: temporal)
                } catch {
                    continuacio.resume(returning: nil)
                }
            }
        }
    }

    private func esMassaGran(_ url: URL) -> Bool {
        guard let font = CGImageSourceCreateWithURL(url as CFURL, nil),
              let props = CGImageSourceCopyPropertiesAtIndex(font, 0, nil) as? [CFString: Any],
              let amplada = props[kCGImagePropertyPixelWidth] as? CGFloat,
              let altura = props[kCGImagePropertyPixelHeight] as? CGFloat else { return true }
        return max(amplada, altura) > Self.costatMaxim
    }

    private func reescriuJpeg(_ origen: URL, a desti: URL) -> Bool {
        guard let font = CGImageSourceCreateWithURL(origen as CFURL, nil) else { return false }
        let opcions: [CFString: Any] = [
            kCGImageSourceCreateThumbnailFromImageAlways: true,
            kCGImageSourceCreateThumbnailWithTransform: true,
            kCGImageSourceThumbnailMaxPixelSize: Self.costatMaxim,
        ]
        guard let imatge = CGImageSourceCreateThumbnailAtIndex(font, 0, opcions as CFDictionary),
              let eixida = CGImageDestinationCreateWithURL(desti as CFURL, UTType.jpeg.identifier as CFString, 1, nil) else { return false }
        // Sense metadades: ni GPS ni dades de l'aparell ixen de l'iPhone.
        CGImageDestinationAddImage(eixida, imatge, [kCGImageDestinationLossyCompressionQuality: 0.88] as CFDictionary)
        return CGImageDestinationFinalize(eixida)
    }

    private func midaDe(_ url: URL) -> Int? {
        (try? url.resourceValues(forKeys: [.fileSizeKey]))?.fileSize
    }

    private func acaba(_ missatge: String) {
        DispatchQueue.main.async {
            self.etiqueta.text = missatge
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.4) {
                self.extensionContext?.completeRequest(returningItems: nil)
            }
        }
    }
}
