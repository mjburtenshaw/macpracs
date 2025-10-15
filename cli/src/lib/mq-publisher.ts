/**
 * RabbitMQ event publisher
 *
 * Publishes test events to RabbitMQ exchanges for testing webhook consumer services.
 */

import * as amqp from 'amqplib';
import { readFileSync } from 'fs';
import chalk from 'chalk';
import { Context } from './types';

/**
 * Load custom event payload from JSON file
 */
function loadCustomPayload(filePath: string): Record<string, any> {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      throw new Error(`Custom payload file not found: ${filePath}`);
    }
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in payload file: ${error.message}`);
    }
    throw error;
  }
}

/**
 * Build AMQP URL with password substitution
 */
function buildAmqpUrl(context: Context, environment: string, password?: string): string {
  if (!context.mq) {
    throw new Error(`Context '${context.name}' does not have MQ configuration`);
  }

  const envConfig = context.mq.environments[environment];
  if (!envConfig) {
    const available = Object.keys(context.mq.environments).join(', ');
    throw new Error(`Unknown environment '${environment}'. Available: ${available}`);
  }

  // Check if password is needed (URL template contains {password})
  const needsPassword = envConfig.amqpUrlTemplate.includes('{password}');

  if (needsPassword && !password) {
    throw new Error('Password required for this environment');
  }

  if (needsPassword && password) {
    return envConfig.amqpUrlTemplate.replace('{password}', password);
  }

  return envConfig.amqpUrlTemplate;
}

/**
 * Publish event options
 */
export interface PublishEventOptions {
  context: Context;
  environment: string;
  eventType: string;
  password?: string;
  customPayload?: string;
  verbose?: boolean;
}

/**
 * Publish a test event to RabbitMQ
 */
export async function publishEvent(options: PublishEventOptions): Promise<void> {
  const { context, environment, eventType, password, customPayload, verbose = false } = options;

  // Validate context has MQ config
  if (!context.mq) {
    throw new Error(`Context '${context.name}' does not have MQ configuration`);
  }

  // Validate environment
  const envConfig = context.mq.environments[environment];
  if (!envConfig) {
    const available = Object.keys(context.mq.environments).join(', ');
    throw new Error(`Unknown environment '${environment}'. Available: ${available}`);
  }

  // Validate event type
  const eventTemplate = context.mq.eventTemplates[eventType];
  if (!eventTemplate) {
    const available = Object.keys(context.mq.eventTemplates).join(', ');
    throw new Error(`Unknown event type '${eventType}'. Available: ${available}`);
  }

  // Build AMQP URL
  const amqpUrl = buildAmqpUrl(context, environment, password);

  // Prepare event
  let event: Record<string, any>;
  if (customPayload) {
    event = loadCustomPayload(customPayload);
  } else {
    // Deep copy to avoid modifying template
    event = JSON.parse(JSON.stringify(eventTemplate.event));
  }

  // Set current timestamp
  event.eventTimestamp = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');

  // Display publishing info
  console.log(chalk.blue(`Publishing ${eventType} event to ${environment} (${envConfig.region})...`));
  console.log(chalk.gray(`Exchange: ${eventTemplate.exchange}`));
  console.log(chalk.gray(`Routing Key: ${eventTemplate.routingKey}`));

  if (verbose) {
    console.log(chalk.gray(`Event: ${JSON.stringify(event, null, 2)}\n`));
  }

  // Publish to RabbitMQ
  let connection: amqp.ChannelModel | undefined;
  let channel: amqp.ConfirmChannel | undefined;

  try {
    // Connect to RabbitMQ
    connection = await amqp.connect(amqpUrl);
    channel = await connection.createConfirmChannel();

    // Assert exchange (create if doesn't exist)
    await channel.assertExchange(eventTemplate.exchange, 'topic', {
      durable: true,
    });

    // Assert queue (create if doesn't exist)
    // Use queueNamePattern from template, or default to "webhook.{exchange}"
    const queuePattern = eventTemplate.queueNamePattern || 'webhook.{exchange}';
    const queueName = queuePattern.replace('{exchange}', eventTemplate.exchange);
    await channel.assertQueue(queueName, {
      durable: true,
    });

    // Bind queue to exchange with routing key
    await channel.bindQueue(queueName, eventTemplate.exchange, '#');

    // Publish message
    const message = Buffer.from(JSON.stringify(event));
    channel.publish(eventTemplate.exchange, eventTemplate.routingKey, message, {
      persistent: true,
      contentType: 'application/json',
    });

    // Wait for confirmation (ensures message was sent)
    await channel.waitForConfirms();

    console.log(chalk.green(`✓ Successfully published ${eventType} event to ${environment}`));
  } catch (error: any) {
    throw new Error(`Failed to publish event: ${error.message}`);
  } finally {
    // Clean up connections
    try {
      if (channel) await channel.close();
      if (connection) await connection.close();
    } catch (closeError) {
      // Ignore close errors
    }
  }
}

