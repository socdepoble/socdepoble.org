import Capacitor
import UIKit

/// El pont de Capacitor amb els connectors propis de l'App, que no són paquets
/// npm i per això cap `cap sync` no els llista (261026). SceneDelegate el munta
/// en lloc de CAPBridgeViewController.
class ControladorSdp: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(CompartirNatiuPlugin())
        bridge?.registerPluginInstance(OrigenInstallacioPlugin())
    }
}

/// Onada v1.2.7 · P0-123 (ordre directa del Mestre, 17-11-2026: actualització
/// automàtica real als mòbils de prova) · D'on ve l'App instal·lada: el nom
/// del rebut de la botiga. «sandboxReceipt» és TestFlight (o un build d'Xcode)
/// i «receipt», l'App Store. La classificació la fa la pàgina
/// (src/natiu/origenInstallacio.js); ací només es llig, sense xarxa, sense
/// StoreKit i sense obrir el fitxer (que pot no existir encara: el nom basta).
/// Viu en este fitxer, que ja és del target App, per no tocar el projecte.
@objc(OrigenInstallacioPlugin)
public class OrigenInstallacioPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "OrigenInstallacioPlugin"
    public let jsName = "OrigenInstallacio"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "consulta", returnType: CAPPluginReturnPromise),
    ]

    @objc func consulta(_ call: CAPPluginCall) {
        let rebut = Bundle.main.appStoreReceiptURL?.lastPathComponent ?? ""
        call.resolve(["llegit": true, "rebut": rebut])
    }
}
