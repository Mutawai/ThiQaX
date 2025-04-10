// src/config/helmet.js
const helmet = require('helmet');

// Get Content Security Policy based on environment
const getContentSecurityPolicy = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Base CSP directives
  const directives = {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
    imgSrc: ["'self'", 'data:'],
    connectSrc: ["'self'"],
    fontSrc: ["'self'", 'data:'],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    frameAncestors: ["'none'"],
    formAction: ["'self'"],
    upgradeInsecureRequests: isProduction ? [] : null
  };
  
  // Add additional sources for development environment
  if (!isProduction) {
    // Allow webpack dev server in development
    directives.connectSrc.push('ws://localhost:*');
    directives.scriptSrc.push("'unsafe-eval'"); // Allow eval for development tools
  }
  
  // Allow specified external domains if configured
  const allowedDomains = process.env.CSP_ALLOWED_DOMAINS;
  if (allowedDomains) {
    const domains = allowedDomains.split(',').map(domain => domain.trim());
    domains.forEach(domain => {
      directives.scriptSrc.push(domain);
      directives.connectSrc.push(domain);
      directives.imgSrc.push(domain);
    });
  }
  
  return directives;
};

// Configure the base helmet middleware options
const getHelmetOptions = () => {
  return {
    contentSecurityPolicy: {
      directives: getContentSecurityPolicy()
    },
    crossOriginEmbedderPolicy: false, // Allow embedding of cross-origin resources
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    dnsPrefetchControl: { allow: false },
    expectCt: { 
      maxAge: 86400,
      enforce: process.env.NODE_ENV === 'production'
    },
    frameguard: { action: 'deny' },
    hsts: {
      maxAge: 15552000, // 180 days
      includeSubDomains: true,
      preload: true
    },
    ieNoOpen: true,
    noSniff: true,
    originAgentCluster: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true
  };
};

// Create the helmet middleware
const helmetMiddleware = helmet(getHelmetOptions());

module.exports = {
  helmetMiddleware,
  getHelmetOptions
};
