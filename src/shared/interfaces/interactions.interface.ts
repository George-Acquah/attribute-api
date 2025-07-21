export interface _IFingerprintWithMeta {
  metadata: {
    ip: string;
    userAgent: string;
    acceptLanguage: string;
    referer: string;
    timestamp: string;
  };
  fingerprint: string;
}
