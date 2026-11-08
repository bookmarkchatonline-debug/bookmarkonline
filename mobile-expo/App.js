import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  BackHandler,
  Platform,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

// Using www directly avoids the 308 redirect from non-www to www on Vercel
const DEFAULT_PROD_URL = 'https://www.bookmarkchat.online';
const DEFAULT_LOCAL_URL = 'http://192.168.0.9:5173';

// Injected JS to catch any unhandled page errors and forward to native
const INJECTED_DEBUG_JS = `
  (function() {
    window.onerror = function(message, source, lineno, colno, error) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'WEB_ERROR',
        message: String(message),
        source: String(source),
        line: lineno
      }));
    };
    var originalError = console.error;
    console.error = function() {
      var args = Array.prototype.slice.call(arguments);
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'CONSOLE_ERROR',
        message: args.map(function(a) { return (typeof a === 'object') ? JSON.stringify(a) : String(a); }).join(' ')
      }));
      originalError.apply(console, arguments);
    };
  })();
  true;
`;

export default function App() {
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_LOCAL_URL);
  const [customInput, setCustomInput] = useState(DEFAULT_LOCAL_URL);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const webViewRef = useRef(null);

  // Safety timer: ensure loading indicator never stays stuck longer than 2.5 seconds
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  // Android hardware back-button handler
  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false; // Exit app
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [canGoBack]);

  // Handle messages sent from React web app via window.ReactNativeWebView.postMessage
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data?.type === 'GOOGLE_SIGN_IN') {
        Alert.alert(
          'Google Sign-In',
          'Native Google Sign-In request received from BookmarkChat webview bridge.'
        );
      } else if (data?.type === 'WEB_ERROR' || data?.type === 'CONSOLE_ERROR') {
        console.warn('WebView Page Error:', data.message);
      }
    } catch {
      // Non-JSON message
    }
  };

  const handleSelectUrl = (url) => {
    setHasError(false);
    setIsLoading(true);
    setLoadProgress(0.2);
    setCurrentUrl(url);
    setSettingsVisible(false);
  };

  const isLocalDev = currentUrl.includes('192.168') || currentUrl.includes('localhost');

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="light" backgroundColor="#0b0713" />

        {/* Top Control Bar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerTitleWrap}
            onPress={() => setSettingsVisible(true)}
          >
            <Text style={styles.headerTitle} numberOfLines={1}>
              Bookmark<Text style={{ color: '#ff3b5c' }}>Chat</Text>
            </Text>
            <View style={[styles.serverPill, isLocalDev ? styles.serverPillDev : styles.serverPillLive]}>
              <Text style={styles.serverPillText}>
                {isLocalDev ? '💻 Local Dev' : '🌐 Live'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => {
                setIsLoading(true);
                setLoadProgress(0.2);
                setHasError(false);
                webViewRef.current?.reload();
              }}
              accessibilityLabel="Reload page"
            >
              <Text style={styles.headerBtnText}>↻</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerBtn, styles.headerBtnToggle]}
              onPress={() => handleSelectUrl(isLocalDev ? DEFAULT_PROD_URL : DEFAULT_LOCAL_URL)}
              accessibilityLabel="Switch Server"
            >
              <Text style={styles.headerBtnText}>
                {isLocalDev ? 'Switch to Live' : 'Switch to Dev'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.headerBtn, styles.headerBtnSettings]}
              onPress={() => setSettingsVisible(true)}
              accessibilityLabel="Server Settings"
            >
              <Text style={styles.headerBtnText}>⚙</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Slim Loading Progress Bar */}
        {isLoading && (
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressBar,
                { width: `${Math.max(15, Math.round(loadProgress * 100))}%` },
              ]}
            />
          </View>
        )}

        {/* Main WebView */}
        <View style={styles.webviewWrapper}>
          {hasError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Cannot connect to server</Text>
              <Text style={styles.errorSub}>{currentUrl}</Text>
              <Text style={styles.errorDesc}>
                {errorMessage || 'Make sure your PC and phone are on the same Wi-Fi and dev server is running.'}
              </Text>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => {
                  setHasError(false);
                  setIsLoading(true);
                  setLoadProgress(0.2);
                  webViewRef.current?.reload();
                }}
              >
                <Text style={styles.actionBtnText}>↻ Retry Connection</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.switchProdBtn]}
                onPress={() => handleSelectUrl(isLocalDev ? DEFAULT_PROD_URL : DEFAULT_LOCAL_URL)}
              >
                <Text style={styles.actionBtnText}>
                  {isLocalDev ? '🌐 Switch to Live Site' : '💻 Switch to Dev Server'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.editSettingsBtn]}
                onPress={() => setSettingsVisible(true)}
              >
                <Text style={styles.editSettingsText}>Change Server IP</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <WebView
              ref={webViewRef}
              source={{ uri: currentUrl }}
              style={styles.webview}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              thirdPartyCookiesEnabled={true}
              sharedCookiesEnabled={true}
              mixedContentMode="always"
              originWhitelist={['*']}
              setSupportMultipleWindows={false}
              javaScriptCanOpenWindowsAutomatically={true}
              injectedJavaScript={INJECTED_DEBUG_JS}
              onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
              onLoadStart={() => {
                setIsLoading(true);
                setLoadProgress(0.2);
              }}
              onLoadProgress={({ nativeEvent }) => {
                setLoadProgress(nativeEvent.progress);
                if (nativeEvent.progress >= 0.6) {
                  setIsLoading(false);
                }
              }}
              onLoadEnd={() => {
                setIsLoading(false);
                setLoadProgress(1);
              }}
              onMessage={handleMessage}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                setHasError(true);
                setIsLoading(false);
                setErrorMessage(nativeEvent.description || 'Connection failed');
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                if (nativeEvent.statusCode >= 400) {
                  setHasError(true);
                  setIsLoading(false);
                  setErrorMessage(`HTTP Error ${nativeEvent.statusCode}: ${nativeEvent.description}`);
                }
              }}
            />
          )}
        </View>

        {/* Server Switcher Modal */}
        <Modal
          visible={settingsVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSettingsVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Server</Text>
              <Text style={styles.modalSub}>
                Switch between your local development machine or the live production deployment.
              </Text>

              <TouchableOpacity
                style={[styles.presetBtn, currentUrl === DEFAULT_LOCAL_URL && styles.presetBtnActive]}
                onPress={() => handleSelectUrl(DEFAULT_LOCAL_URL)}
              >
                <Text style={styles.presetTitle}>💻 Local Dev Server (PC on Wi-Fi)</Text>
                <Text style={styles.presetSub}>{DEFAULT_LOCAL_URL}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.presetBtn, currentUrl === DEFAULT_PROD_URL && styles.presetBtnActive]}
                onPress={() => handleSelectUrl(DEFAULT_PROD_URL)}
              >
                <Text style={styles.presetTitle}>🌐 Live Production</Text>
                <Text style={styles.presetSub}>{DEFAULT_PROD_URL}</Text>
              </TouchableOpacity>

              <View style={styles.customSection}>
                <Text style={styles.customLabel}>Or enter custom local IP & port:</Text>
                <TextInput
                  style={styles.customInput}
                  value={customInput}
                  onChangeText={setCustomInput}
                  placeholder="http://192.168.x.x:5173"
                  placeholderTextColor="#666"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.connectBtn}
                  onPress={() => {
                    let url = customInput.trim();
                    if (!url.startsWith('http://') && !url.startsWith('https://')) {
                      url = `http://${url}`;
                    }
                    handleSelectUrl(url);
                  }}
                >
                  <Text style={styles.connectBtnText}>Connect to Custom URL</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setSettingsVisible(false)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#121216',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.3,
  },
  serverPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 99,
  },
  serverPillDev: {
    backgroundColor: 'rgba(168, 85, 247, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(168, 85, 247, 0.4)',
  },
  serverPillLive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  serverPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBtn: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    backgroundColor: '#18181d',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerBtnToggle: {
    backgroundColor: '#23232a',
  },
  headerBtnSettings: {
    paddingHorizontal: 7,
  },
  headerBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    height: 3,
    backgroundColor: 'transparent',
    width: '100%',
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#ff3b5c',
  },
  webviewWrapper: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0a0a0c',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0a0a0c',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  errorSub: {
    fontSize: 12,
    color: '#a855f7',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorDesc: {
    fontSize: 13,
    color: '#8e86a0',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  actionBtn: {
    width: '100%',
    maxWidth: 280,
    paddingVertical: 12,
    backgroundColor: '#ff3b5c',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  switchProdBtn: {
    backgroundColor: '#23232a',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  editSettingsBtn: {
    backgroundColor: 'transparent',
  },
  editSettingsText: {
    color: '#a1a1aa',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#18181d',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 12,
    color: '#8e86a0',
    marginBottom: 18,
    lineHeight: 16,
  },
  presetBtn: {
    padding: 14,
    backgroundColor: '#23232a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  presetBtnActive: {
    borderColor: '#ff3b5c',
    backgroundColor: 'rgba(255, 59, 92, 0.12)',
  },
  presetTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  presetSub: {
    fontSize: 11,
    color: '#8e86a0',
  },
  customSection: {
    marginTop: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  customLabel: {
    fontSize: 12,
    color: '#8e86a0',
    marginBottom: 8,
  },
  customInput: {
    height: 42,
    backgroundColor: '#121216',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#ffffff',
    fontSize: 13,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 10,
  },
  connectBtn: {
    height: 38,
    backgroundColor: '#ff3b5c',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  closeBtn: {
    marginTop: 14,
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#8e86a0',
    fontSize: 13,
  },
});
