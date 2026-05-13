import { NotificationLogData } from '@/lib/types/notification';
import { pool } from '@/lib/db';

export async function saveNotificationLog(data: NotificationLogData) {
  try {
    const query = `
      INSERT INTO notification_logs (
        alert_id,
        to_emails,
        cc_emails,
        bcc_emails,
        mail_subject,
        mail_body_text,
        mail_body_html,
        mail_status,
        mail_error_msg,
        teams_webhook_url,
        teams_payload,
        teams_status,
        teams_error_msg,
        sent_at
      )
      VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,NOW()
      )
    `;

    const values = [
      data.alertId,
      data.toEmails || [],
      data.ccEmails || [],
      data.bccEmails || [],
      data.mailSubject || null,
      data.mailBodyText || null,
      data.mailBodyHtml || null,
      data.mailStatus || null,
      data.mailErrorMsg || null,
      data.teamsWebhookUrl || null,
      data.teamsPayload
        ? JSON.stringify(data.teamsPayload)
        : null,
      data.teamsStatus || null,
      data.teamsErrorMsg || null,
    ];

    await pool.query(query, values);

  } catch (error) {
    console.error("❌ saveNotificationLog error:", error);
  }
}