/**
 * WebView / native bridge helpers for Google Sign-In.
 *
 * Two kinds of native shell are supported:
 *
 *  1. The Capacitor app in `android/` + `ios/` (the shipped iOS/Android build).
 *     Sign-in runs through the native Firebase Authentication plugin.
 *  2. A hand-rolled WebView shell that injects one of the global bridges checked
 *     below (this also covers React Native).
 *
 * Both routes end up at the same web-side entry point,
 * `window.bookmarkchatSignInWithGoogleTokens(idToken)` (registered in
 * `firebase/auth.js`), so profile creation happens in exactly one place.
 */

let pendingGoogleSignIn = null;

/** True when running inside the Capacitor shell generated in `android/` and `ios/`. */
export function isCapacitorNative() {
  if (typeof window === 'undefined') return false;
  return window.Capacitor?.isNativePlatform?.() === true;
}

/** True when running inside an Android/iOS app WebView. */
export function isNativeWebView() {
  if (typeof window === 'undefined') return false;

  // Capacitor injects its runtime before app code runs, so this is the
  // reliable signal; the user-agent checks below cover other WebView shells.
  if (isCapacitorNative()) return true;

  const ua = navigator.userAgent || '';

  // Explicit bridges injected by the native shell
  if (
    window.ReactNativeWebView ||
    window.BookmarkChatNative ||
    window.bookmarkchatNative ||
    window.Android?.requestGoogleSignIn ||
    window.webkit?.messageHandlers?.bookmarkchatGoogleSignIn
  ) {
    return true;
  }

  // Android WebView UA typically includes "; wv)"
  if (/; wv\)/i.test(ua)) return true;

  // iOS WKWebView: AppleWebKit present but Safari token absent
  if (/\b(iPhone|iPod|iPad)\b/i.test(ua) && /AppleWebKit/i.test(ua) && !/Safari/i.test(ua)) {
    return true;
  }

  return false;
}

/** True when a native Google Sign-In entry point is available. */
export function hasNativeGoogleSignInBridge() {
  if (typeof window === 'undefined') return false;

  // The Capacitor shell bundles the native Firebase Authentication plugin.
  if (isCapacitorNative()) return true;

  return Boolean(
    window.BookmarkChatNative?.requestGoogleSignIn ||
      window.bookmarkchatNative?.requestGoogleSignIn ||
      window.Android?.requestGoogleSignIn ||
      window.webkit?.messageHandlers?.bookmarkchatGoogleSignIn ||
      window.ReactNativeWebView?.postMessage
  );
}

/**
 * Ask the native shell to run Google Sign-In.
 * Resolves with the signed-in Firebase user once the shell has produced a Google
 * ID token, or rejects via settleNativeGoogleSignInFailure.
 */
export function requestNativeGoogleSignIn(role = 'artist') {
  if (!hasNativeGoogleSignInBridge()) {
    return Promise.reject(new Error('Native Google Sign-In bridge is not available'));
  }

  if (pendingGoogleSignIn) {
    pendingGoogleSignIn.reject(new Error('Google Sign-In already in progress'));
    pendingGoogleSignIn = null;
  }

  const promise = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (pendingGoogleSignIn) {
        pendingGoogleSignIn.reject(new Error('Native Google Sign-In timed out'));
        pendingGoogleSignIn = null;
      }
    }, 120000);

    pendingGoogleSignIn = { resolve, reject, role, timeout };
  });

  if (isCapacitorNative()) {
    // Reports its own failures through settleNativeGoogleSignInFailure.
    void startCapacitorGoogleSignIn();
  } else {
    try {
      startBridgedGoogleSignIn();
    } catch (err) {
      settleNativeGoogleSignInFailure(err);
    }
  }

  return promise;
}

/**
 * Capacitor route: the plugin returns a Google ID token natively, which we hand
 * to the shared web-side entry point exactly as a hand-rolled shell would.
 */
async function startCapacitorGoogleSignIn() {
  try {
    const { FirebaseAuthentication } = await import(
      '@capacitor-firebase/authentication'
    );
    const result = await FirebaseAuthentication.signInWithGoogle();
    const idToken = result?.credential?.idToken;
    if (!idToken) throw new Error('Google Sign-In did not return an ID token');
    if (!window.bookmarkchatSignInWithGoogleTokens) {
      throw new Error('Google Sign-In entry point is not registered');
    }
    await window.bookmarkchatSignInWithGoogleTokens(idToken);
  } catch (err) {
    settleNativeGoogleSignInFailure(err);
  }
}

/** WebView route: hand the request to whichever global bridge the shell injected. */
function startBridgedGoogleSignIn() {
  if (window.BookmarkChatNative?.requestGoogleSignIn) {
    window.BookmarkChatNative.requestGoogleSignIn();
  } else if (window.bookmarkchatNative?.requestGoogleSignIn) {
    window.bookmarkchatNative.requestGoogleSignIn();
  } else if (window.Android?.requestGoogleSignIn) {
    window.Android.requestGoogleSignIn();
  } else if (window.webkit?.messageHandlers?.bookmarkchatGoogleSignIn) {
    window.webkit.messageHandlers.bookmarkchatGoogleSignIn.postMessage({
      action: 'googleSignIn',
    });
  } else if (window.ReactNativeWebView?.postMessage) {
    window.ReactNativeWebView.postMessage(
      JSON.stringify({ type: 'GOOGLE_SIGN_IN' })
    );
  }
}

export function getPendingGoogleSignInRole() {
  return pendingGoogleSignIn?.role || 'artist';
}

/** Resolve the in-flight native sign-in Promise (after Firebase auth succeeds). */
export function settleNativeGoogleSignInSuccess(user) {
  if (!pendingGoogleSignIn) return;
  clearTimeout(pendingGoogleSignIn.timeout);
  const { resolve } = pendingGoogleSignIn;
  pendingGoogleSignIn = null;
  resolve(user);
}

/** Reject the in-flight native sign-in Promise (cancel / native error). */
export function settleNativeGoogleSignInFailure(error) {
  if (!pendingGoogleSignIn) return;
  clearTimeout(pendingGoogleSignIn.timeout);
  const { reject } = pendingGoogleSignIn;
  pendingGoogleSignIn = null;
  reject(error instanceof Error ? error : new Error(String(error || 'Google Sign-In failed')));
}
