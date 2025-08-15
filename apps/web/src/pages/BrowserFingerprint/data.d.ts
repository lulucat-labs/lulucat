export interface BrowserFingerprint {
  id: number;
  userAgent: string;
  webglVendor: string;
  webglRenderer: string;
  deviceName: string;
  macAddress: string;
  cpuCores: number;
  deviceMemory: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrowserFingerprintFormData {
  userAgent: string;
  webglVendor: string;
  webglRenderer: string;
  deviceName: string;
  macAddress: string;
  cpuCores: number;
  deviceMemory: number;
}
