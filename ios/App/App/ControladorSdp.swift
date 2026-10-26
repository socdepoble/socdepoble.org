import Capacitor
import UIKit

/// El pont de Capacitor amb els connectors propis de l'App, que no són paquets
/// npm i per això cap `cap sync` no els llista (261026). SceneDelegate el munta
/// en lloc de CAPBridgeViewController.
class ControladorSdp: CAPBridgeViewController {
    override open func capacitorDidLoad() {
        bridge?.registerPluginInstance(CompartirNatiuPlugin())
    }
}
