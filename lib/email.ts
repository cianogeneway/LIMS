// Email notification system
// This is a placeholder - in production, integrate with SendGrid, AWS SES, or similar

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
}

/**
 * Send an email notification
 * TODO: Integrate with actual email service (SendGrid, AWS SES, etc.)
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    // For now, just log the email
    console.log('📧 Email would be sent:', {
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      preview: options.text || options.html.substring(0, 100),
    })

    // In production, replace with actual email service:
    // const sgMail = require('@sendgrid/mail')
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY!)
    // await sgMail.send({
    //   to: options.to,
    //   from: process.env.FROM_EMAIL!,
    //   subject: options.subject,
    //   html: options.html,
    //   text: options.text,
    // })

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

/**
 * Send sample acceptance notification
 */
export async function sendSampleAcceptanceEmail(
  clientEmail: string,
  sampleId: string,
  accepted: boolean,
  rejectionReason?: string
): Promise<boolean> {
  const subject = accepted
    ? `Sample ${sampleId} Accepted`
    : `Sample ${sampleId} Rejected - New Sample Required`

  const html = accepted
    ? `
      <h2>Sample Accepted</h2>
      <p>Your sample <strong>${sampleId}</strong> has been accepted and is now in processing.</p>
      <p>You will receive another notification when results are available.</p>
    `
    : `
      <h2>Sample Rejected</h2>
      <p>Your sample <strong>${sampleId}</strong> has been rejected.</p>
      ${rejectionReason ? `<p><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
      <p>Please submit a new sample.</p>
    `

  return sendEmail({
    to: clientEmail,
    subject,
    html,
  })
}

/**
 * Send QC failure notification
 */
export async function sendQCFailureEmail(
  clientEmail: string,
  sampleId: string,
  qcType: string,
  reason: string
): Promise<boolean> {
  return sendEmail({
    to: clientEmail,
    subject: `QC Failure - Sample ${sampleId}`,
    html: `
      <h2>QC Failure Notification</h2>
      <p>Sample <strong>${sampleId}</strong> has failed ${qcType} quality control.</p>
      <p><strong>Reason:</strong> ${reason}</p>
      <p>A new sample is required to proceed.</p>
    `,
  })
}

/**
 * Send results available notification
 */
export async function sendResultsAvailableEmail(
  clientEmail: string,
  sampleId: string,
  passed: boolean
): Promise<boolean> {
  const subject = passed
    ? `Results Available - Sample ${sampleId}`
    : `Sample ${sampleId} Failed - Repeat Required`

  const html = passed
    ? `
      <h2>Results Available</h2>
      <p>Results for sample <strong>${sampleId}</strong> are now available.</p>
      <p>Please log in to view your results.</p>
    `
    : `
      <h2>Sample Failed</h2>
      <p>Sample <strong>${sampleId}</strong> has failed processing.</p>
      <p>The sample will be moved back to available samples for repeat processing.</p>
    `

  return sendEmail({
    to: clientEmail,
    subject,
    html,
  })
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(
  clientEmail: string,
  invoiceNumber: string,
  totalAmount: number,
  pdfUrl?: string
): Promise<boolean> {
  return sendEmail({
    to: clientEmail,
    subject: `Invoice ${invoiceNumber}`,
    html: `
      <h2>Invoice ${invoiceNumber}</h2>
      <p>Your monthly invoice is ready.</p>
      <p><strong>Total Amount:</strong> R${totalAmount.toFixed(2)}</p>
      ${pdfUrl ? `<p><a href="${pdfUrl}">Download Invoice PDF</a></p>` : ''}
    `,
  })
}

/**
 * Send service reminder email
 */
export async function sendServiceReminderEmail(
  to: string | string[],
  instrumentName: string,
  serviceDate: Date,
  monthsUntil: number
): Promise<boolean> {
  return sendEmail({
    to,
    subject: `Service Reminder: ${instrumentName}`,
    html: `
      <h2>Instrument Service Reminder</h2>
      <p><strong>Instrument:</strong> ${instrumentName}</p>
      <p><strong>Service Due:</strong> ${serviceDate.toLocaleDateString()}</p>
      <p>Service is due in <strong>${monthsUntil} month(s)</strong>.</p>
      <p>Please schedule service before the due date.</p>
    `,
  })
}

