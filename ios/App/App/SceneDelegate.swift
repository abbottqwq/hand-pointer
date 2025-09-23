import UIKit
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(_ scene: UIScene,
             willConnectTo session: UISceneSession,
             options connectionOptions: UIScene.ConnectionOptions) {
    guard let windowScene = scene as? UIWindowScene else { return }
    let window = UIWindow(windowScene: windowScene)
    let bridgeVC = CAPBridgeViewController()

    // If you made the WebView transparent earlier, keep these:
    bridgeVC.webView?.isOpaque = false
    bridgeVC.webView?.backgroundColor = .clear
    bridgeVC.view.backgroundColor = .clear

    window.rootViewController = bridgeVC
    self.window = window
    window.makeKeyAndVisible()
  }
}
