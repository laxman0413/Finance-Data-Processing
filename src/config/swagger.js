const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Finance Data Processing API',
      version: '1.0.0',
      description: 'Finance Data Processing and Access Control Backend API documentation',
      contact: {
        name: 'Finance Team',
      },
    },
    servers: [
      {
        url: 'https://laxman0413.github.io/Finance-Data-Processing',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for API authentication',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'User ID',
            },
            email: {
              type: 'string',
              description: 'User email',
            },
            name: {
              type: 'string',
              description: 'User full name',
            },
            role: {
              type: 'string',
              enum: ['user', 'admin', 'manager'],
              description: 'User role',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'User creation timestamp',
            },
          },
        },
        Record: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Record ID',
            },
            userId: {
              type: 'string',
              description: 'User ID of record owner',
            },
            type: {
              type: 'string',
              enum: ['income', 'expense', 'transfer'],
              description: 'Record type',
            },
            amount: {
              type: 'number',
              description: 'Transaction amount',
            },
            description: {
              type: 'string',
              description: 'Record description',
            },
            date: {
              type: 'string',
              format: 'date',
              description: 'Transaction date',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Record creation timestamp',
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            message: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './src/routes/*.js',
  ],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
