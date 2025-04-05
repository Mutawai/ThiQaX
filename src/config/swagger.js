const swaggerJsDoc = require('swagger-jsdoc');

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ThiQaX API Documentation',
      version: '1.0.0',
      description: 'API documentation for the ThiQaX Trust Recruitment Platform',
      contact: {
        name: 'ThiQaX Support',
        email: 'support@thiqax.com'
      },
      license: {
        name: 'Proprietary',
        url: 'https://thiqax.com/terms'
      }
    },
    servers: [
      {
        url: '/api',
        description: 'API Base URL'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    tags: [
      {
        name: 'Auth',
        description: 'Authentication endpoints'
      },
      {
        name: 'Jobs',
        description: 'Job listings management'
      },
      {
        name: 'Applications',
        description: 'Job application management'
      },
      {
        name: 'Users',
        description: 'User management'
      },
      {
        name: 'Verification',
        description: 'Document and identity verification'
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/models/*.js'
  ]
};

const swaggerSpecs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerSpecs;
