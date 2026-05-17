const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BoxBox Fantasy API',
      version: '1.0.0',
      description: 'F1 Fantasy Tahmin Ligi REST API dokümantasyonu',
      contact: { name: 'Sinem Karaaslan' }
    },
    servers: [
      { url: 'http://localhost:3000/api', description: 'Development' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Login endpoint ile aldığın token'
        }
      }
    }
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

module.exports = swaggerJSDoc(options);