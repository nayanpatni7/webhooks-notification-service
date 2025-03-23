import type { AWS } from "@serverless/typescript";

const serverlessConfiguration: AWS = {
  service: "webhook-service",
  frameworkVersion: "3",
  plugins: ["serverless-esbuild"],
  provider: {
    name: "aws",
    runtime: "nodejs18.x",
    region: "us-east-1",
    memorySize: 128,
    timeout: 10,
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
      MONOOVA_PUBLIC_KEY: "some-public-key-here", // Currently verification is returing true due to absence of monoova key
    },
  },
  functions: {
    webhookHandler: {
      handler: "src/handler.webhook",
      timeout: 10, // Ensures function does not timeout unexpectedly
      memorySize: 128,
      events: [
        // HTTP API Gateway Trigger
        {
          http: {
            path: "webhook",
            method: "post",
            cors: true,
          },
        },
        // EventBridge Trigger with Retry & DLQ
        {
          eventBridge: {
            eventBus: "default",
            pattern: {
              source: ["webhook.service"],
            },
            retryPolicy: {
              maximumRetryAttempts: 3,
              maximumEventAgeInSeconds: 900,
            },
            deadLetterConfig: {
              arn: { "Fn::GetAtt": ["WebhookDLQ", "Arn"] },
            },
          },
        },
      ],
    },
  },
  resources: {
    Resources: {
      WebhookDLQ: {
        Type: "AWS::SQS::Queue",
        Properties: {
          QueueName: "webhook-dlq",
        },
      },
      WebhookDLQPolicy: {
        Type: "AWS::SQS::QueuePolicy",
        Properties: {
          Queues: [{ Ref: "WebhookDLQ" }],
          PolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: { Service: "events.amazonaws.com" },
                Action: "sqs:SendMessage",
                Resource: { "Fn::GetAtt": ["WebhookDLQ", "Arn"] },
              },
            ],
          },
        },
      },
    },
  },
  package: { individually: true },
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node18",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
  },
};

module.exports = serverlessConfiguration;
