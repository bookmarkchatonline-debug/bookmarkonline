/**
 * WebView / native bridge helpers for Google Sign-In.
 */

let pendingGoogleSignIn = null;

/** True when running inside an Android/iOS app WebView. */
export function isNativeWebView() {
  if (typeof window === 'undefined') return false;

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
 * Resolves when native calls window.bookmarkchatSignInWithGoogleTokens(idToken)
 * (or rejects via settleNativeGoogleSignInFailure).
 */
export function requestNativeGoogleSignIn(role = 'artist') {
  return new Promise((resolve, reject) => {
    if (!hasNativeGoogleSignInBridge()) {
      reject(new Error('Native Google Sign-In bridge is not available'));
      return;
    }

    if (pendingGoogleSignIn) {
      pendingGoogleSignIn.reject(new Error('Google Sign-In already in progress'));
    }

    const timeout = setTimeout(() => {
      if (pendingGoogleSignIn) {
        pendingGoogleSignIn.reject(new Error('Native Google Sign-In timed out'));
        pendingGoogleSignIn = null;
      }
    }, 120000);

    pendingGoogleSignIn = { resolve, reject, role, timeout };

    try {
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
    } catch (err) {
      clearTimeout(timeout);
      pendingGoogleSignIn = null;
      reject(err);
    }
  });
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
