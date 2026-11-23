
const sendOtpEmail = async (email, otp) => {
  try {
    const apiKey = process.env.RESEND_API_KEY
    const fromEmail = process.env.EMAIL_FROM

    if (!apiKey || !fromEmail) {
      throw new Error('Resend environment variables are missing')
    }

    // Load Resend SDK
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    // Send OTP email
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: 'Your BlogSphere Verification Code',
      html: `
        <div style="
          font-family: Arial, sans-serif;
          max-width: 500px;
          margin: auto;
          padding: 24px;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
        ">
          <h2 style="color: #2563eb;">BlogSphere</h2>

          <p>Your email verification code is:</p>

          <h1 style="
            letter-spacing: 8px;
            color: #2563eb;
          ">${otp}</h1>

          <p>This code expires in 5 minutes.</p>

          <p style="color: #6b7280;">
            If you did not request this code,
            please ignore this email.
          </p>
        </div>
      `
    })

    if (error) {
      throw new Error(error.message)
    }

    return data

  } catch (error) {
    console.error('Resend email error:', error.message)
    throw error
  }
}

module.exports = {
  sendOtpEmail
}
