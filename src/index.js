import express from 'express';
import cors from 'cors';
import amqp from 'amqplib';
import swaggerUi from 'swagger-ui-express';
import swaggerJsDoc from 'swagger-jsdoc';
import AWS from 'aws-sdk';

// AWS region and Lambda function configuration
const region = "us-east-2";
const lambdaFunctionName = "fetchSecretsFunction_gr8";

// Function to invoke Lambda and fetch secrets
async function getSecretFromLambda() {
  const lambda = new AWS.Lambda({ region: region });
  const params = {
    FunctionName: lambdaFunctionName,
  };

  try {
    const response = await lambda.invoke(params).promise();
    const payload = JSON.parse(response.Payload);
    if (payload.errorMessage) {
      throw new Error(payload.errorMessage);
    }
    const body = JSON.parse(payload.body);
    return JSON.parse(body.secret);
  } catch (error) {
    console.error('Error invoking Lambda function:', error);
    throw error;
  }
}

// Function to start the service
async function startService() {
  let secrets;
  try {
    secrets = await getSecretFromLambda();
  } catch (error) {
    console.error(`Error starting service: ${error}`);
    return;
  }

  AWS.config.update({
    region: region,
    accessKeyId: secrets.AWS_ACCESS_KEY_ID,
    secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
  });

  const dynamoDB = new AWS.DynamoDB.DocumentClient();
  const app = express();
  const port = 8092;

  app.use(cors());
  app.use(express.json());

  // Swagger setup
  const swaggerOptions = {
    swaggerDefinition: {
      openapi: '3.0.0',
      info: {
        title: 'Update Product Service API',
        version: '1.0.0',
        description: 'API for updating products'
      }
    },
    apis: ['./src/index.js']
  };

  const swaggerDocs = swaggerJsDoc(swaggerOptions);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

  // RabbitMQ setup
  let channel;
  async function connectRabbitMQ() {
    try {
      const connection = await amqp.connect('amqp://3.136.72.14:5672/');
      channel = await connection.createChannel();
      await channel.assertQueue('product-events', { durable: true });
      console.log('Connected to RabbitMQ');
    } catch (error) {
      console.error('Error connecting to RabbitMQ:', error);
    }
  }

  // Publish event to RabbitMQ
  const publishEvent = async (eventType, data) => {
    const event = { eventType, data };
    try {
      if (channel) {
        channel.sendToQueue('product-events', Buffer.from(JSON.stringify(event)), { persistent: true });
        console.log('Event published to RabbitMQ:', event);
      } else {
        console.error('Channel is not initialized');
      }
    } catch (error) {
      console.error('Error publishing event to RabbitMQ:', error);
    }
  };

  await connectRabbitMQ();

  /**
   * @swagger
   * /products/{productId}:
   *   put:
   *     summary: Update an existing product
   *     description: Update an existing product by productId
   *     parameters:
   *       - in: path
   *         name: productId
   *         required: true
   *         description: ID of the product to update
   *         schema:
   *           type: string
   *     requestBody:
   *       description: Product object that needs to be updated
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *                 example: "New Smartphone"
   *               category:
   *                 type: string
   *                 example: "Electronics"
   *               quantity:
   *                 type: number
   *                 example: 10
   *     responses:
   *       200:
   *         description: Product updated
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 message:
   *                   type: string
   *       404:
   *         description: Product not found
   *       500:
   *         description: Error updating product
   */
  app.put('/products/:productId', async (req, res) => {
    const { productId } = req.params;
    const { name, category, quantity } = req.body;

    const params = {
      TableName: 'Products_gr8',
      Key: { productId },
      UpdateExpression: 'set #name = :name, #category = :category, #quantity = :quantity',
      ExpressionAttributeNames: {
        '#name': 'name',
        '#category': 'category',
        '#quantity': 'quantity'
      },
      ExpressionAttributeValues: {
        ':name': name,
        ':category': category,
        ':quantity': quantity
      },
      ReturnValues: 'UPDATED_NEW'
    };

    try {
      const result = await dynamoDB.update(params).promise();
      const updatedProduct = {
        productId: productId,
        name: name,
        category: category,
        quantity: quantity
      };
      publishEvent('ProductUpdated', updatedProduct);
      res.send({ message: 'Product updated', result });
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).send({ message: 'Error updating product', error });
    }
  });

  app.get('/', (req, res) => {
    res.send('Update Product Service Running');
  });

  app.listen(port, () => {
    console.log(`Update Product service listening at http://localhost:${port}`);
  });
}

startService();
