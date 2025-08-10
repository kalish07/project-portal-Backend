const nodemailer = require('nodemailer');

// Create a transporter object using your email service
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, // Use the SMTP host from the .env file
  port: process.env.SMTP_PORT, // Use the SMTP port from the .env file
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, // Use the email from the .env file
    pass: process.env.SMTP_PASS // Use the password from the .env file
  }
});

// Function to send an email
const sendEmail = async (to, subject, message) => {
  const mailOptions = {
    from: process.env.SMTP_USER, // Sender address
    to, // List of recipients
    subject, // Subject line
    html: generateEmailTemplate(subject, message), // HTML body
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
    throw error; // Rethrow the error for further handling
  }
};

// Function to generate the HTML email template
const generateEmailTemplate = (subject, message) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${subject}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
    </style>
  </head>
  <body style="margin: 0; padding: 0; font-family: 'Inter', sans-serif; background-color: #f9fafb;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; margin: 30px auto; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
            <tr>
              <td style="background-color: #003366; padding: 30px 20px; text-align: center; color: #ffffff;">
                <h1 style="margin: 0; font-size: 28px;">Sathyabama Project Portal</h1>
                <p style="margin: 8px 0 0; font-size: 18px; color: #aad4ff;">${subject}</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px 20px; color: #333333;">
                <p style="font-size: 16px; line-height: 1.6;">${message}</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="#" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: 600; display: inline-block;">View Project</a>
                </div>
              </td>
            </tr>
            <tr>
              <td style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #777;">
                <p style="margin: 4px 0;">Have questions? <a href="mailto:support@sathyabama.ac.in" style="color: #003366; text-decoration: underline;">Contact support</a></p>
                <p style="margin: 4px 0;">Visit <a href="https://www.sathyabama.ac.in" style="color: #003366; text-decoration: underline;">www.sathyabama.ac.in</a></p>
                <p style="margin: 10px 0 0; font-style: italic;">This is an automated message. Please do not reply.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
  `;
};


module.exports = { sendEmail }; // Export the sendEmail function
