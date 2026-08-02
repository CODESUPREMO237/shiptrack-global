import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: true, // ✅ FIXED: false for port 587, true only for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendAdminCommentEmail(to, shipmentCode, comment) {
  const mailOptions = {
    from: `"HipTrack" <${process.env.SMTP_USER}>`,
    to,
    subject: `New Admin Comment for Shipment ${shipmentCode}`,
    html: `
      <p>Hello,</p>
      <p>An important comment has been added to your shipment <strong>${shipmentCode}</strong>:</p>
      <blockquote style="border-left: 3px solid #ff0000; padding-left: 10px; color: #b91c1c;">
        ${comment}
      </blockquote>
      <p>You can check the full shipment details <a href="${process.env.NEXT_PUBLIC_SITE_URL}/track/${shipmentCode}" style="color: #2563eb; text-decoration: underline;">here</a>.</p>
      <p>– HipTrack Team</p>
    `,
  };
  
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}