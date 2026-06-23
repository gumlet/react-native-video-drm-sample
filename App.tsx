import * as React from 'react';
import {
  Text,
  View,
  StyleSheet,
  Platform,
  ScrollView,
  TextInput,
  Alert,
  Button,
  ActivityIndicator,
} from 'react-native';
import Video, { DRMType, ReactVideoSourceProperties } from 'react-native-video';
import { signWidevineLicenseUrl } from './utils/signWidevineLicense';

type SourceType = ReactVideoSourceProperties | null;

const DEFAULT_TOKEN_LIFETIME_SECONDS = 30;

const DRMExample = () => {
  const [loading, setLoading] = React.useState(false);
  const [source, setSource] = React.useState<SourceType>(null);

  // iOS — FairPlay
  const [hls, setHls] = React.useState('<Your m3u8 URL>');
  const [fairplayLicense, setFairplayLicense] = React.useState(
    '<Fairplay license url with expiry and token parameters>',
  );
  const [fairplayCertificate, setFairplayCertificate] = React.useState(
    '<Fairplay certificate url>',
  );

  // Android — Widevine
  const [mpdUrl, setMpdUrl] = React.useState('<Your MPD URL>');
  const [widevineProxyUrl, setWidevineProxyUrl] = React.useState(
    '<Your Widevine proxy license URL>',
  );
  const [widevineProxySecret, setWidevineProxySecret] = React.useState(
    '<Your Widevine proxy secret (Base64)>',
  );
  const [tokenLifetimeSeconds, setTokenLifetimeSeconds] = React.useState(
    String(DEFAULT_TOKEN_LIFETIME_SECONDS),
  );

  const handlePlayStopVideo = () => {
    if (source !== null) {
      setSource(null);
      return;
    }

    setLoading(true);
    const newSource: ReactVideoSourceProperties = {};

    if (Platform.OS === 'ios') {
      if (!fairplayLicense || !fairplayCertificate || !hls) {
        Alert.alert('Error', 'Please enter HLS URL, FairPlay license, and certificate');
        setLoading(false);
        return;
      }

      newSource.uri = hls;
      newSource.drm = {
        type: DRMType.FAIRPLAY,
        licenseServer: fairplayLicense,
        certificateUrl: fairplayCertificate,
        getLicense: (spcString, _contentId, licenseUrl, _loadedLicenseUrl) => {
          const body = JSON.stringify({ spc: spcString });

          return fetch(`${licenseUrl}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body,
          })
            .then(response => response.json())
            .then(response => response.ckc)
            .catch(error => {
              console.error('FairPlay license error', error);
              throw error;
            });
        },
      };
    } else if (Platform.OS === 'android') {
      if (!mpdUrl || !widevineProxyUrl || !widevineProxySecret) {
        Alert.alert(
          'Error',
          'Please enter MPD URL, Widevine proxy URL, and proxy secret',
        );
        setLoading(false);
        return;
      }

      const lifetime = parseInt(tokenLifetimeSeconds, 10) || DEFAULT_TOKEN_LIFETIME_SECONDS;

      try {
        const signedLicenseUrl = signWidevineLicenseUrl(
          widevineProxyUrl,
          widevineProxySecret,
          lifetime,
        );

        newSource.uri = mpdUrl;
        newSource.type = 'mpd';
        newSource.drm = {
          type: DRMType.WIDEVINE,
          licenseServer: signedLicenseUrl,
        };
      } catch (error) {
        console.error('Widevine license signing error', error);
        Alert.alert('Error', 'Failed to sign Widevine licence URL');
        setLoading(false);
        return;
      }
    }

    setSource(newSource);
  };

  if (Platform.OS !== 'ios' && Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <Text>DRM is not supported on this platform</Text>
      </View>
    );
  }

  const drmLabel =
    Platform.OS === 'ios' ? 'FairPlay (iOS)' : 'Widevine (Android)';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>DRM Protected Stream Player</Text>
      <Text style={styles.subtitle}>{drmLabel}</Text>

      {loading && <ActivityIndicator size="large" color="#0000ff" />}
      {source?.uri && (
        <Video
          key={source.uri}
          onLoad={() => {
            setLoading(false);
          }}
          onError={e => {
            console.log('error', e);
            Alert.alert('Error', e.error.localizedDescription);
            setLoading(false);
          }}
          source={source}
          resizeMode="contain"
          style={styles.video}
          controls
          muted={false}
        />
      )}

      {Platform.OS === 'ios' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="HLS URL"
            placeholderTextColor="#888"
            value={hls}
            onChangeText={setHls}
          />

          <TextInput
            style={styles.input}
            placeholder="FairPlay license URL"
            placeholderTextColor="#888"
            value={fairplayLicense}
            onChangeText={setFairplayLicense}
          />

          <TextInput
            style={styles.input}
            placeholder="FairPlay certificate URL"
            placeholderTextColor="#888"
            value={fairplayCertificate}
            onChangeText={setFairplayCertificate}
          />
        </>
      )}

      {Platform.OS === 'android' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="MPD URL"
            placeholderTextColor="#888"
            value={mpdUrl}
            onChangeText={setMpdUrl}
          />

          <TextInput
            style={styles.input}
            placeholder="Widevine licence proxy URL"
            placeholderTextColor="#888"
            value={widevineProxyUrl}
            onChangeText={setWidevineProxyUrl}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Widevine proxy secret (base64)"
            placeholderTextColor="#888"
            value={widevineProxySecret}
            onChangeText={setWidevineProxySecret}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TextInput
            style={styles.input}
            placeholder="Token lifetime (seconds)"
            placeholderTextColor="#888"
            value={tokenLifetimeSeconds}
            onChangeText={setTokenLifetimeSeconds}
            keyboardType="number-pad"
          />
        </>
      )}

      <Button
        title={`${source !== null ? 'Stop' : 'Play'} Video`}
        onPress={handlePlayStopVideo}
      />
    </ScrollView>
  );
};

export default DRMExample;

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'black',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: 'white',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 20,
    color: '#aaa',
  },
  video: {
    width: '100%',
    height: 200,
    marginBottom: 80,
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '100%',
    color: 'white',
  },
});
