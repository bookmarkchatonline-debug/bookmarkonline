import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  BackHandler,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { WebView } from 'react-native-webview';

const DEFAULT_PROD_URL = 'https://bookmarkchat.online';
const DEFAULT_LOCAL_URL = 'http://192.168.0.9:5173';

export default function App() {
  const [currentUrl, setCurrentUrl] = useState(DEFAULT_PROD_URL);
  const [customInput, setCustomInput] = useState(DEFAULT_LOCAL_URL);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const webViewRef = useRef(null);

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
      }
    } catch {
      // Non-JSON message
    }
  };

  const handleSelectUrl = (url) => {
    setHasError(false);
    setCurrentUrl(url);
    setSettingsVisible(false);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <StatusBar style="light" backgroundColor="#0b0713" />

        {/* Top Mini Control Strip */}
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            BookmarkChat • <Text style={styles.headerSub}>{currentUrl.replace('https://', '').replace('http://', '')}</Text>
          </Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => webViewRef.current?.reload()}
              accessibilityLabel="Reload page"
            >
              <Text style={styles.headerBtnText}>↻</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerBtn, styles.headerBtnSettings]}
              onPress={() => setSettingsVisible(true)}
              accessibilityLabel="Switch Server"
            >
              <Text style={styles.headerBtnText}>⚙</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main WebView */}
        <View style={styles.webviewWrapper}>
          {hasError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Cannot connect to server</Text>
              <Text style={styles.errorSub}>{currentUrl}</Text>
              <Text style={styles.errorDesc}>
                {errorMessage || 'Make sure your dev server is running with: npm run dev -- --host'}
              </Text>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => webViewRef.current?.reload()}
              >
                <Text style={styles.actionBtnText}>Retry Connection</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.switchProdBtn]}
                onPress={() => handleSelectUrl(DEFAULT_PROD_URL)}
              >
                <Text style={styles.actionBtnText}>Switch to Live Site (bookmarkchat.online)</Text>
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
              allowsBackForwardNavigationGestures={true}
              sharedCookiesEnabled={true}
              mixedContentMode="always"
              originWhitelist={['*']}
              userAgent="Mozilla/5.0 (Linux; Android 10; BookmarkChatMobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Mobile Safari/537.36 BookmarkChatExpo/1.0"
              onNavigationStateChange={(navState) => setCanGoBack(navState.canGoBack)}
              onMessage={handleMessage}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                setHasError(true);
                setErrorMessage(nativeEvent.description || 'Connection failed');
              }}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <Text style={styles.logoText}>
                    BOOKMARK<Text style={{ color: '#a855f7' }}>CHAT</Text>
                  </Text>
                  <ActivityIndicator size="large" color="#a855f7" style={{ marginTop: 16 }} />
                </View>
              )}
              startInLoadingState={true}
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
              <Text style={styles.modalTitle}>Select BookmarkChat Server</Text>
              <Text style={styles.modalSub}>
                Choose between the live production deployment or your local development server.
              </Text>

              <TouchableOpacity
                style={[styles.presetBtn, currentUrl === DEFAULT_PROD_URL && styles.presetBtnActive]}
                onPress={() => handleSelectUrl(DEFAULT_PROD_URL)}
              >
                <Text style={styles.presetTitle}>🌐 Live Production</Text>
                <Text style={styles.presetSub}>https://bookmarkchat.online</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.presetBtn, currentUrl === DEFAULT_LOCAL_URL && styles.presetBtnActive]}
                onPress={() => handleSelectUrl(DEFAULT_LOCAL_URL)}
              >
                <Text style={styles.presetTitle}>💻 Local Dev Server (Default Wi-Fi)</Text>
                <Text style={styles.presetSub}>http://192.168.0.9:5173</Text>
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
    backgroundColor: '#0b0713',
  },
  header: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    backgroundColor: '#120d20',
    borderBottomWidth: 1,
    borderBottomColor: '#1e1633',
  },
  headerTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a855f7',
    flex: 1,
    marginRight: 8,
  },
  headerSub: {
    fontSize: 11,
    fontWeight: '400',
    color: '#8e86a0',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#1c1530',
    borderRadius: 6,
  },
  headerBtnSettings: {
    backgroundColor: '#281a44',
  },
  headerBtnText: {
    color: '#d4cced',
    fontSize: 13,
  },
  webviewWrapper: {
    flex: 1,
    backgroundColor: '#0b0713',
  },
  webview: {
    flex: 1,
    backgroundColor: '#0b0713',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0713',
  },
  logoText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0b0713',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 13,
    color: '#9ca3af',
    marginBottom: 12,
  },
  errorDesc: {
    fontSize: 13,
    color: '#d1d5db',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 18,
  },
  actionBtn: {
    backgroundColor: '#a855f7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  switchProdBtn: {
    backgroundColor: '#3b82f6',
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  editSettingsBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#374151',
    marginTop: 6,
  },
  editSettingsText: {
    color: '#9ca3af',
    fontSize: 13,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#161026',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2e234c',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 6,
  },
  modalSub: {
    fontSize: 12,
    color: '#9a91b2',
    marginBottom: 16,
    lineHeight: 16,
  },
  presetBtn: {
    padding: 12,
    backgroundColor: '#1f1638',
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#2f2355',
  },
  presetBtnActive: {
    borderColor: '#a855f7',
    backgroundColor: '#2b1b52',
  },
  presetTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  presetSub: {
    color: '#9a91b2',
    fontSize: 11,
  },
  customSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  customLabel: {
    color: '#cfc6e8',
    fontSize: 12,
    marginBottom: 6,
  },
  customInput: {
    backgroundColor: '#0e091b',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#34265c',
    paddingHorizontal: 12,
    paddingVertical: 9,
    color: '#ffffff',
    fontSize: 13,
    marginBottom: 8,
  },
  connectBtn: {
    backgroundColor: '#7c3aed',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  connectBtnText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 13,
  },
  closeBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#8c82a5',
    fontSize: 13,
  },
});
