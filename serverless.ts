import type { AWS } from "@serverless/typescript";
import { getArgumentValuesOrDefault, getAWSAccountId } from "@libs/utils";
import verify from "@functions/verify";

const STAGE = getArgumentValuesOrDefault({ flag: "stage", defaultValue: "dev" });

const serverlessConfiguration = async (): Promise<AWS> => {
  const service = "api-verify-gov-sg";
  const region = "ap-southeast-1";
  const ACCOUNT_ID = await getAWSAccountId();

  return {
    service,
    configValidationMode: "error",
    plugins: ["serverless-esbuild", "serverless-offline-ssm", "serverless-offline", "serverless-domain-manager"],
    provider: {
      name: "aws",
      region,
      runtime: "nodejs14.x",
      memorySize: 256,
      timeout: 30,
      stackName: `${service}-${STAGE}`,
      stage: STAGE,
      apiGateway: {
        minimumCompressionSize: 1024,
        shouldStartNameWithService: true,
        metrics: true,
      },
      httpApi: {
        metrics: true,
      },
      environment: {
        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
        NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
        STAGE,
        NETWORK_NAME: "${ssm:/serverless/api-verify-gov-sg/NETWORK_NAME}",
        INFURA_API_KEY: "${ssm:/serverless/api-verify-gov-sg/INFURA_API_KEY}",
        ALCHEMY_API_KEY: "${ssm:/serverless/api-verify-gov-sg/ALCHEMY_API_KEY}",
        WHITELISTED_ISSUERS: "${ssm:/serverless/api-verify-gov-sg/WHITELISTED_ISSUERS}",
      },
      tracing: {
        lambda: true,
        apiGateway: true,
      },
      deploymentBucket: "notarise-serverless-deployment",
      iam: {
        role: {
          name: `api-verify-gov-sg-${STAGE}-lambda`,
          permissionsBoundary: `arn:aws:iam::${ACCOUNT_ID}:policy/GCCIAccountBoundary`,
          statements: [
            {
              // https://docs.aws.amazon.com/systems-manager/latest/userguide/sysman-paramstore-access.html
              Effect: "Allow",
              Action: ["ssm:GetParameter", "ssm:GetParameters"],
              Resource: [`arn:aws:ssm:ap-southeast-1:${ACCOUNT_ID}:parameter/serverless/api-verify-gov-sg/*`],
            },
          ],
        },
      },
      versionFunctions: false
    },
    // import the function via paths
    functions: { verify },
    package: { individually: true },
    custom: {
      esbuild: {
        bundle: true,
        minify: false,
        sourcemap: true,
        exclude: ["aws-sdk"],
        target: "node14",
        define: { "require.resolve": undefined },
        platform: "node",
        concurrency: 10,
      },
      "serverless-offline": {
        allowCache: true,
      },
      "serverless-offline-ssm": {
        stages: ["dev", "offline"],
        ssm: {
          '/serverless/api-verify-gov-sg/NETWORK_NAME': 'homestead',
          '/serverless/api-verify-gov-sg/INFURA_API_KEY': 'infura123',
          '/serverless/api-verify-gov-sg/ALCHEMY_API_KEY': 'alchemy123',
          '/serverless/api-verify-gov-sg/WHITELISTED_ISSUERS': 'S1234567A'
        }
      },
      "slicWatchEnable": {
        "production": true,
        "stg": false,
        "other": false
      },
      "slicWatch": {
        "topicArn": "arn:aws:sns:${self:provider.region}:${ACCOUNT_ID}:sns-slack-notifier",
        "enabled": "${self:custom.slicWatchEnable.${self:provider.stage}, self:custom.slicWatchEnable.other}",
        "alarms": {
          "enabled": true,
          "Period": 60,
          "EvaluationPeriods": 5,
          "ComparisonOperator": "GreaterThanThreshold",
          "Lambda": {
            "enabled": false
          },
          "ApiGateway": {
            "5XXError": {
              "Statistic": "Average",
              "Threshold": 0.15
            },
            "4XXError": {
              "Statistic": "Average",
              "Threshold": 0.15
            },
            "Latency": {
              "EvaluationPeriods": 10,
              "Statistic": "Average",
              "ExtendedStatistic": null
            }
          }
        }
      },
      customDomain: {
        domainName: process.env.DOMAIN_NAME,
        certificateName: process.env.DOMAIN_NAME,
        basePath: "",
        stage: STAGE,
        createRoute53Record: false,
        endpointType: "edge",
        autoDomain: false,
      },
    },
  };
};

module.exports = serverlessConfiguration();
