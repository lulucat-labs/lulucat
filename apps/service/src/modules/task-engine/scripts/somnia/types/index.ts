export interface Wallet {
  readonly privateKey: string;
  readonly address: string;
}

export interface TaskStatus {
  register: boolean;
  authX: boolean;
  authDiscord: boolean;
  setUsername: boolean;
}

export interface Invitation {
  link: string;
  frequency: number;
}

export interface DBItem {
  readonly id: string;
  readonly wallet: Wallet;
  readonly tasks: TaskStatus;
  readonly invitation: Invitation;
}

export interface SomniaTaskResult {
  id: string;
  wallet: Wallet;
  invitation: Invitation;
  tasks: TaskStatus;
}
