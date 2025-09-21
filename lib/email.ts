// lib/email.ts
import sgMail from '@sendgrid/mail';

// This check ensures we don't crash if the API key is missing.
if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY is not set in the environment variables.");
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

type Schedule = { start_time: string; end_time: string };

export async function sendEmail(to: string, schedules: Schedule[]) {
  // Format the list of schedules for the email body
  const scheduleLines = schedules.map(s => {
    const startTime = new Date(s.start_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const endTime = new Date(s.end_time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `• ${startTime} — ${endTime}`;
  }).join('\n');

  const emailText = `Your upcoming silent-study block(s) start in approximately 10 minutes:\n\n${scheduleLines}\n\nGood luck!`;

  const msg = {
    to: to,
    from: process.env.FROM_EMAIL!, // Your verified sender email
    subject: "Quiet Hours Reminder — starts in ~10 minutes",
    text: emailText
  };

  try {
    await sgMail.send(msg);
    console.log(`Email successfully sent to ${to}`);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}