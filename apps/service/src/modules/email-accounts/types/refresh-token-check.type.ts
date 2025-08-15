export enum EmailServiceType {
  GMAIL = 'gmail',
  OUTLOOK = 'outlook',
  UNKNOWN = 'unknown',
}

export interface RefreshTokenCheckResult {
  emailId: number;
  emailAddress: string;
  serviceType: EmailServiceType;
  valid: boolean;
  errorMessage?: string;
}

export interface RefreshTokenCheckSummary {
  total: number;
  success: number;
  failed: number;
  results: RefreshTokenCheckResult[];
}
