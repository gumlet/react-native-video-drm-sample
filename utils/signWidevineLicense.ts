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

  const withoutProtocol = proxyUrl.replace(/^(https?:\/\/)?/, '');
  const slashIndex = withoutProtocol.indexOf('/');
  let pathname = slashIndex !== -1 ? withoutProtocol.substring(slashIndex) : '';
  pathname = pathname.split('?')[0];

  const pathForSigning = pathname.startsWith('/licence/')
    ? pathname.slice('/licence/'.length)
    : pathname.replace(/^\//, '');

  const stringForTokenGeneration = `/${pathForSigning}?expires=${expiration}`;
  const signature = CryptoJS.HmacSHA1(stringForTokenGeneration, secretKey).toString(
    CryptoJS.enc.Hex,
  );
  const baseUrl = proxyUrl.split('?')[0];
  return `${baseUrl}?token=${signature}&expires=${expiration}`;
}
