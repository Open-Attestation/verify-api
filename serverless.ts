import type { AWS } from "@serverless/typescript";
import { getArgumentValuesOrDefault } from "@libs/utils";
import verify from "@functions/verify";

const STAGE = getArgumentValuesOrDefault({ flag: "stage", defaultValue: "dev" });

const serverlessConfiguration = async (): Promise<AWS> => {
  const service = "notarise-verify-api";
  const region = "ap-southeast-1";

  return {
    service,
    configValidationMode: "error",
    plugins: ["serverless-esbuild", "serverless-domain-manager", "serverless-stack-termination-protection", "serverless-associate-waf", "serverless-iamroles", "serverless-offline", "serverless-offline-ssm"],
    provider: {
      name: "aws",
      region,
      runtime: "nodejs18.x",
      memorySize: 256,
      timeout: 30,
      stackName: 'notarise-${self:provider.stage}-verify-api',
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
        NETWORK_NAME: "${ssm:/notarise/${self:provider.stage}/network-name}",
        INFURA_API_KEY: "${ssm:/notarise/${self:provider.stage}/infura-api-key}",
        ALCHEMY_API_KEY: "${ssm:/notarise/${self:provider.stage}/alchemy-api-key}",
        WHITELISTED_ISSUERS: "${ssm:/notarise/${self:provider.stage}/whitelisted-issuers}",
      },
      tracing: {
        lambda: true,
        apiGateway: true,
      },
      logs: {
        restApi: {
          accessLogging: true,
          executionLogging: true,
          level: "INFO",
          roleManagedExternally: true,
          fullExecutionData: true,
          role: '${ssm:/notarise/${self:provider.stage}/cloudwatch-log-role-arn}',
        },
      },
      deploymentBucket: {
        name: '${self:custom.infra.deploymentBucket}',
      },
      endpointType:
        '${ssm:/notarise/${self:provider.stage}/api-gateway-endpoint-type, "REGIONAL"}',
      iam: {
        role: {
          name: "${self:provider.stackName}-lambda",
          statements: [
            {
              Effect: 'Allow',
              Action: 'cloudwatch:putMetricData',
              Resource: '*',
            }
          ],
        },
      },
      versionFunctions: false
    },
    // import the function via paths
    functions: { verify },
    package: { individually: true },
    custom: {
      infra: {
        deploymentBucket:
          '${ssm:/notarise/${self:provider.stage}/deployment-bucket}',
        securityGroupIds:
          '${ssm:/notarise/${self:provider.stage}/security-group-ids}',
        subnetIds: '${ssm:/notarise/${self:provider.stage}/subnet-ids}',
      },
      associateWaf: {
        name: "${ssm:/notarise/${self:provider.stage}/wafv2-name}",
        version: 'V2'
      },
      serverlessTerminationProtection: {
        stages: ["production", "stg"],
      },
      "serverless-offline": {
        allowCache: true,
      },
      "serverless-offline-ssm": {
        stages: ["offline"],
      },
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
      customDomain: {
        domainName: '${ssm:/notarise/${self:provider.stage}/verify-api-domain-name, ""}',
        basePath: "",
        createRoute53Record: false,
        endpointType: "${self:provider.endpointType}",
        securityPolicy: "tls_1_2",
        autoDomain: true,
      },
    },
  };
};

module.exports = serverlessConfiguration();
