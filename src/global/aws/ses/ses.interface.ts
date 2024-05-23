export interface TemplateData {
  name: string;
  subject: string;
  text?: string;
  html?: string;
}

export interface ListTemplateOptions {
  limit?: number;
  offset?: string;
}

export interface Receiver {
  email: string;
  toCC?: string[];
  toBCC?: string[];
  data?: { [key: string]: string | number };
}

export interface EmailInput {
  senderEmail?: string;
  replyTo?: string[];
  configurationName?: string;
}

export interface SendEmailInput extends EmailInput {
  receiver: Receiver;
}

export interface SendBulkEmailInput extends EmailInput {
  receivers: Receiver[];
}

export interface DeleteTemplateResultSet {
  success: string[];
  failed: string[];
}

export interface EmailSendingQuotaRes {
  perDayLimit: number;
  consumedLimit: number;
  sendingRate: number;
}

export interface TemplateItem {
  name: string;
  creationDate: Date;
}

export interface ListTemplateResultSet {
  offset?: string;
  items: TemplateItem[];
}

export interface SendBulkEmailRes {
  messageId: string;
  status: string;
  errorMsg?: string;
}
