const nodemailer = require('nodemailer');
const logger = require('./logger');

// Create email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send email function
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Send alert email
const sendAlertEmail = async (user, alert) => {
  const subject = `[${alert.severity.toUpperCase()}] ${alert.title}`;
  
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2 style="color: ${getSeverityColor(alert.severity)};">${alert.title}</h2>
        <p><strong>Severity:</strong> ${alert.severity.toUpperCase()}</p>
        <p><strong>Type:</strong> ${alert.alertType}</p>
        <p><strong>Time:</strong> ${new Date(alert.createdAt).toLocaleString()}</p>
        <hr/>
        <p>${alert.message}</p>
        ${alert.metadata ? `
          <h3>Details:</h3>
          <pre style="background: #f4f4f4; padding: 10px; border-radius: 5px;">${JSON.stringify(alert.metadata, null, 2)}</pre>
        ` : ''}
        <hr/>
        <p style="color: #666; font-size: 12px;">
          This is an automated alert from Cloud VM Management System.
          <br/>
          Please log in to your dashboard to view more details and take action.
        </p>
      </body>
    </html>
  `;

  const text = `
    ${alert.title}
    Severity: ${alert.severity.toUpperCase()}
    Type: ${alert.alertType}
    Time: ${new Date(alert.createdAt).toLocaleString()}
    
    ${alert.message}
    
    ${alert.metadata ? `Details: ${JSON.stringify(alert.metadata, null, 2)}` : ''}
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html,
    text
  });
};

// Get color based on severity
const getSeverityColor = (severity) => {
  const colors = {
    low: '#3498db',
    medium: '#f39c12',
    high: '#e67e22',
    critical: '#e74c3c'
  };
  return colors[severity] || '#95a5a6';
};

// Send cost report email
const sendCostReportEmail = async (user, reportData) => {
  const subject = `Monthly Cloud Cost Report - ${reportData.month}`;
  
  const html = `
    <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Cloud Cost Report</h2>
        <p><strong>Period:</strong> ${reportData.month}</p>
        <p><strong>Total Cost:</strong> $${reportData.totalCost.toFixed(2)}</p>
        <p><strong>Change from Last Month:</strong> 
          <span style="color: ${reportData.change >= 0 ? '#e74c3c' : '#27ae60'};">
            ${reportData.change >= 0 ? '+' : ''}${reportData.change.toFixed(1)}%
          </span>
        </p>
        <hr/>
        <h3>Cost Breakdown by Provider:</h3>
        <ul>
          ${Object.entries(reportData.byProvider).map(([provider, cost]) => 
            `<li>${provider.toUpperCase()}: $${cost.toFixed(2)}</li>`
          ).join('')}
        </ul>
        <h3>Top 5 Most Expensive Resources:</h3>
        <ul>
          ${reportData.topResources.map(resource => 
            `<li>${resource.name}: $${resource.cost.toFixed(2)}</li>`
          ).join('')}
        </ul>
        ${reportData.recommendations && reportData.recommendations.length > 0 ? `
          <h3>Cost Optimization Recommendations:</h3>
          <ul>
            ${reportData.recommendations.map(rec => `<li>${rec}</li>`).join('')}
          </ul>
        ` : ''}
        <hr/>
        <p style="color: #666; font-size: 12px;">
          This is an automated report from Cloud VM Management System.
        </p>
      </body>
    </html>
  `;

  return await sendEmail({
    to: user.email,
    subject,
    html
  });
};

module.exports = {
  sendEmail,
  sendAlertEmail,
  sendCostReportEmail
};
