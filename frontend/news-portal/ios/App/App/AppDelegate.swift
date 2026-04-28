import UIKit
import Capacitor

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?
    private var privacyShieldView: UIView?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(screenCaptureChanged),
            name: UIScreen.capturedDidChangeNotification,
            object: nil
        )
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        showPrivacyShield()
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        showPrivacyShield()
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        if !UIScreen.main.isCaptured {
            hidePrivacyShield()
        }
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        if UIScreen.main.isCaptured {
            showPrivacyShield()
        } else {
            hidePrivacyShield()
        }
    }

    func applicationWillTerminate(_ application: UIApplication) {
        NotificationCenter.default.removeObserver(self)
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

    @objc private func screenCaptureChanged() {
        if UIScreen.main.isCaptured {
            showPrivacyShield()
        } else {
            hidePrivacyShield()
        }
    }

    private func showPrivacyShield() {
        guard let targetWindow = window ?? UIApplication.shared.connectedScenes
            .compactMap({ $0 as? UIWindowScene })
            .flatMap({ $0.windows })
            .first(where: { $0.isKeyWindow }) else {
            return
        }

        if privacyShieldView == nil {
            let shield = UIView(frame: targetWindow.bounds)
            shield.autoresizingMask = [.flexibleWidth, .flexibleHeight]
            shield.backgroundColor = UIColor(red: 0.07, green: 0.07, blue: 0.07, alpha: 1.0)

            let title = UILabel()
            title.translatesAutoresizingMaskIntoConstraints = false
            title.text = "Protected Content"
            title.textColor = UIColor(red: 0.95, green: 0.70, blue: 0.20, alpha: 1.0)
            title.font = UIFont.boldSystemFont(ofSize: 28)
            title.textAlignment = .center

            let subtitle = UILabel()
            subtitle.translatesAutoresizingMaskIntoConstraints = false
            subtitle.text = "Screen capture and app previews are restricted in the secure app."
            subtitle.textColor = .white
            subtitle.font = UIFont.systemFont(ofSize: 15, weight: .semibold)
            subtitle.textAlignment = .center
            subtitle.numberOfLines = 0

            shield.addSubview(title)
            shield.addSubview(subtitle)

            NSLayoutConstraint.activate([
                title.centerXAnchor.constraint(equalTo: shield.centerXAnchor),
                title.centerYAnchor.constraint(equalTo: shield.centerYAnchor, constant: -18),
                subtitle.topAnchor.constraint(equalTo: title.bottomAnchor, constant: 12),
                subtitle.centerXAnchor.constraint(equalTo: shield.centerXAnchor),
                subtitle.leadingAnchor.constraint(greaterThanOrEqualTo: shield.leadingAnchor, constant: 24),
                subtitle.trailingAnchor.constraint(lessThanOrEqualTo: shield.trailingAnchor, constant: -24)
            ])

            privacyShieldView = shield
        }

        if let shield = privacyShieldView, shield.superview == nil {
            shield.frame = targetWindow.bounds
            targetWindow.addSubview(shield)
        }
    }

    private func hidePrivacyShield() {
        privacyShieldView?.removeFromSuperview()
    }
}
