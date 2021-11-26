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
    frameworkVersion: "2",
    plugins: ["serverless-esbuild", "serverless-offline", "serverless-domain-manager"],
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
      },
      lambdaHashingVersion: "20201221",
      tracing: {
        lambda: true,
        apiGateway: true,
      },
      rolePermissionsBoundary: `arn:aws:iam::${ACCOUNT_ID}:policy/GCCIAccountBoundary`,
      deploymentBucket: "notarise-serverless-deployment",
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
      customDomain : {
        domainName: process.env.DOMAIN_NAME,
        certificateName: process.env.DOMAIN_NAME,
        basePath: '',
        stage: STAGE,
        createRoute53Record: false,
        endpointType: 'regional',
        autoDomain: true
      }
    },
    useDotenv: true,
  };
};

module.exports = serverlessConfiguration();
