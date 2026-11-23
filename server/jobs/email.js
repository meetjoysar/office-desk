import nodemailer from 'nodemailer';

let transporter = null;

export const emailMode = () => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS, EMAIL_TEST } = process.env;
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) return 'smtp';
  return EMAIL_TEST === '1' ? 'test' : 'off';
};

async function getTransporter() {
  if (transporter) return transporter;
  const mode = emailMode();
  if (mode === 'smtp') {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else if (mode === 'test') {
    const test = await nodemailer.createTestAccount(); // free fake inbox
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: { user: test.user, pass: test.pass },
    });
  }
  return transporter;
}

// Never throws: email problems must not break the app
export async function sendEmail({ to, subject, text }) {
  try {
    const t = await getTransporter();
    if (!t) return { ok: false, error: 'Email is not set up' };
    const info = await t.sendMail({
      from:
        process.env.MAIL_FROM ||
        process.env.SMTP_USER ||
        'Office Desk <no-reply@officedesk.test>',
      to,
      subject,
      text,
    });
    const preview = nodemailer.getTestMessageUrl(info) || null; // only for the test inbox
    if (preview) console.log('Email preview:', preview);
    return { ok: true, preview };
  } catch (err) {
    console.error('Email failed:', err.message);
    return { ok: false, error: err.message.slice(0, 250) };
  }
}