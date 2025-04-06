const swaggerJsDoc = require('swagger-jsdoc');
const config = require('./index');

// Get API version path
const apiPath = `/api/${config.api.version}`;

// Dynamic server URL based on environment
const getServerUrl = () => {
  if (config.server.isProduction) {
    return 'https://api.thiqax.com';
  } else if (config.server.isTest) {
    return 'http://localhost:5000';
  } else {
    return `http://localhost:${config.server.port}`;
  }
};

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
        email: 'support@thiqax.com',
        url: 'https://thiqax.com/contact'
      },
      license: {
        name: 'Proprietary',
        url: 'https://thiqax.com/terms'
      }
    },
    servers: [
      {
        url: getServerUrl() + apiPath,
        description: `${config.server.nodeEnv.charAt(0).toUpperCase() + config.server.nodeEnv.slice(1)} Server`
      },
      {
        url: apiPath,
        description: 'Relative API Base URL'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT Bearer token **_only_**'
        },
        refreshToken: {
          type: 'apiKey',
          in: 'header',
          name: 'x-refresh-token',
          description: 'Refresh token for generating new access tokens'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Access token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  error: {
                    type: 'string',
                    example: 'Not authorized to access this route'
                  }
                }
              }
            }
          }
        },
        BadRequestError: {
          description: 'Invalid request parameters',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: {
                    type: 'boolean',
                    example: false
                  },
                  error: {
                    type: 'string',
                    example: 'Validation failed'
                  }
                }
              }
            }
          }
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
        name: 'Profiles',
        description: 'User profile management'
      },
      {
        name: 'Documents',
        description: 'Document upload and verification'
      },
      {
        name: 'Notifications',
        description: 'User notification management'
      },
      {
        name: 'Integration',
        description: 'Integration endpoints for system components'
      }
    ],
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/models/*.js',
    './src/integration/routes/*.js'
  ]
};

// Add extra development documentation if in dev mode
if (config.server.isDevelopment) {
  swaggerOptions.apis.push('./src/docs/*.js');
}

const swaggerSpecs = swaggerJsDoc(swaggerOptions);

module.exports = swaggerSpecs;
