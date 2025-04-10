// src/config/email.js
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const handlebars = require('handlebars');
const { logger } = require('./logger');
const { getEnvironment } = require('./environment');

// Cache for compiled templates
const templateCache = {};

// Get nodemailer transport based on environment
const getTransport = () => {
  const { isProduction, isStaging } = getEnvironment();
  
  // Use configured email service in production/staging
  if (isProduction || isStaging) {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      },
      secure: true
    });
  }
  
  // Use ethereal email for development
  return nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER || 'ethereal.user@ethereal.email',
      pass: process.env.EMAIL_PASSWORD || 'ethereal_pass'
    }
  });
};

// Get email templates directory
const getTemplateDir = () => {
  return process.env.EMAIL_TEMPLATE_DIR || path.join(process.cwd(), 'src', 'templates', 'email');
};

// Load and compile email template
const getTemplate = (templateName) => {
  // Return cached template if available
  if (templateCache[templateName]) {
    return templateCache[templateName];
  }
  
  const templatePath = path.join(getTemplateDir(), `${templateName}.html`);
  
  try {
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const compiledTemplate = handlebars.compile(templateSource);
    
    // Cache the compiled template
    templateCache[templateName] = compiledTemplate;
    
    return compiledTemplate;
  } catch (error) {
    logger.error(`Failed to load email template: ${templateName}`, error);
    throw new Error(`Email template ${templateName} not found`);
  }
};

// Render email template with data
const renderTemplate = (templateName, data) => {
  const template = getTemplate(templateName);
  return template(data);
};

// Get default email options
const getDefaultEmailOptions = () => {
  return {
    from: process.env.EMAIL_FROM || 'ThiQaX <noreply@thiqax.com>'
  };
};

// Configure email content options
const getEmailOptions = (templateName, data, recipient, subject) => {
  try {
    const html = renderTemplate(templateName, data);
    
    return {
      ...getDefaultEmailOptions(),
      to: recipient,
      subject: subject,
      html: html
    };
  } catch (error) {
    logger.error('Failed to generate email options', error);
    return null;
  }
};

// Send an email
const sendEmail = async (options) => {
  try {
    const transport = getTransport();
    const result = await transport.sendMail(options);
    
    logger.info(`Email sent to ${options.to}`, {
      messageId: result.messageId,
      subject: options.subject
    });
    
    const { isDevelopment } = getEnvironment();
    if (isDevelopment) {
      logger.info(`Preview URL: ${nodemailer.getTestMessageUrl(result)}`);
    }
    
    return result;
  } catch (error) {
    logger.error(`Failed to send email to ${options.to}`, error);
    throw error;
  }
};

module.exports = {
  getTransport,
  getTemplate,
  renderTemplate,
  getDefaultEmailOptions,
  getEmailOptions,
  sendEmail
};
