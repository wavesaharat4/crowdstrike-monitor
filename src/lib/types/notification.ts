export type NotificationLogData = {
  alertId: string;

  toEmails?: string[];
  ccEmails?: string[];
  bccEmails?: string[];

  mailSubject?: string| null;
  mailBodyText?: string;
  mailBodyHtml?: string;

  mailStatus?: string;
  mailErrorMsg?: string;

  teamsWebhookUrl?: string;
  teamsPayload?: any;

  teamsStatus?: string;
  teamsErrorMsg?: string;
};

export type EmailResult = {
  success: boolean;
  messageId: string | null;
  error: string | null;
};

export type TeamsResult = {
  success: boolean;
  error: string | null;
  payload?: any;
};