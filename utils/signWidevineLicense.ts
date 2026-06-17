import CryptoJS from 'crypto-js';

/**
 * Signs a Gumlet Widevine licence proxy URL (same algorithm as ReactNativeDRMTest2).
 * @param proxyUrl Base licence URL, e.g. https://widevine.gumlet.com/licence/{orgId}
 * @param proxySecretBase64 Base64-encoded HMAC secret from Gumlet dashboard
 * @param tokenLifetimeSeconds Token validity in seconds
 */
export function signWidevineLicenseUrl(
  proxyUrl: string,
  proxySecretBase64: string,
  tokenLifetimeSeconds: number,
): string {
  const secretKey = CryptoJS.enc.Base64.parse(proxySecretBase64);
  const expiration = Math.round(Date.now() + tokenLifetimeSeconds * 1000);

  const pathname = new URL(proxyUrl).pathname;
  const pathForSigning = pathname.startsWith('/licence/')
    ? pathname.slice('/licence/'.length)
    : pathname.replace(/^\//, '');

  const stringForTokenGeneration = `${pathForSigning}${expiration}`;
  const signature = CryptoJS.HmacSHA1(stringForTokenGeneration, secretKey).toString(
    CryptoJS.enc.Hex,
  );

  return `${proxyUrl}?token=${signature}&expires=${expiration}`;
}
