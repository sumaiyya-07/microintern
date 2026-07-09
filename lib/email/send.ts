import nodemailer from "nodemailer";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string | string[];
  subject: string;
  html: string;
}) {
  const emailUser = process.env.Email_user || process.env.EMAIL_USER;
  const emailPass = process.env.Email_pass || process.env.EMAIL_PASS;

  console.log(`[Email Notification Triggered]`);
  console.log(`To: ${Array.isArray(to) ? to.join(", ") : to}`);
  console.log(`Subject: ${subject}`);

  if (!emailUser || !emailPass) {
    console.warn(
      `[Warning] Email credentials (Email_user / Email_pass) are missing. Email was logged to console instead of being sent.`
    );
    return { success: true, mock: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    const mailOptions = {
      from: `"MicroIntern" <${emailUser}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Sent successfully] MessageId: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`[Error] Failed to send email via nodemailer:`, error);
    // Return success: false, but don't rethrow to avoid breaking the core request transaction
    return { success: false, error };
  }
}
