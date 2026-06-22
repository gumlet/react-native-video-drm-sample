# Gumlet DRM Video Playback Example for React Native

This is a React Native project demonstrating how to play DRM-protected video streams using Gumlet on both Android (Widevine) and iOS (FairPlay) platforms. It uses [`react-native-video`](https://github.com/react-native-video/react-native-video) for media playback.

---

## Prerequisites

Before starting, ensure you have set up your local development environment according to the [React Native Environment Setup Guide](https://reactnative.dev/docs/environment-setup).

---

## Configuration

To play your DRM streams, configure the following inputs in the app interface:

### 1. iOS — FairPlay Configuration
*   **HLS URL**: The `.m3u8` stream URL for the video.
*   **FairPlay License URL**: The license server URL for FairPlay.
*   **FairPlay Certificate URL**: The certificate URL used to request the FairPlay license.

### 2. Android — Widevine Configuration
*   **MPD URL**: The MPEG-DASH `.mpd` stream URL (Widevine DRM is not supported on HLS `.m3u8` formats in standard Android environments; you must use DASH `.mpd`).
*   **Widevine License Proxy URL**: The base license server URL.
    *   *Format:* `https://widevine.gumlet.com/licence/<ORG_ID>/<ASSET_ID>`
    *   *Note:* Ensure this URL **does not** contain pre-existing query parameters, as the app will automatically sign and append the required `token` and `expires` query parameters.
*   **Widevine Proxy Secret (Base64)**: Your organization's token signing secret key from the Gumlet DRM Dashboard. This key is used on the client-side to dynamically generate an HMAC-SHA1 signature token.
*   **Token Lifetime (seconds)**: The validity window for the dynamically generated signature token.

---

## Getting Started

### Step 1: Install Dependencies
Run the following command from the root of your project:
```bash
npm install
# or
yarn install
```

### Step 2: iOS CocoaPods Setup (iOS Only)
If you are running the app on iOS, navigate to the `ios` directory and install the pods:
```bash
cd ios
pod install
cd ..
```

### Step 3: Run the Application

#### For iOS:
```bash
npm run ios
# or
yarn ios
```

#### For Android:
```bash
npm run android
# or
yarn android
```

---

## How It Works (Token Signing)

To prevent unauthorized access, Gumlet requires each license request to be signed using an HMAC-SHA1 signature. 

The client automatically generates the signature on playback using the following formula:
1.  **Extract the Path**: The protocol, host, and `/licence` prefix are stripped to get the core identifier path (e.g., `/<ORG_ID>/<ASSET_ID>`).
2.  **Calculate Expiration**: A timestamp in milliseconds representing `now + token_lifetime` is calculated.
3.  **Generate Message**: The message to sign is constructed as:
    `/<ORG_ID>/<ASSET_ID>?expires=<expiration_timestamp>`
4.  **HMAC-SHA1 Signature**: The message is signed using the Base64-decoded `Widevine Proxy Secret` key.
5.  **Append parameters**: The resulting hex signature and the expiration timestamp are appended to the license request URL:
    `?token=<hex_signature>&expires=<expiration_timestamp>`
