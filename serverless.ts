import type { AWS } from "@serverless/typescript";

import verify from "@functions/verify";

const serverlessConfiguration: AWS = {
  service: "api-verify-gov-sg",
  frameworkVersion: "2",
  plugins: ["serverless-esbuild", "serverless-offline"],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      NODE_OPTIONS: "--enable-source-maps --stack-trace-limit=1000",
    },
    lambdaHashingVersion: "20201221",
    httpApi: {
      metrics: true,
    },
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
  },
  useDotenv: true,
};

module.exports = serverlessConfiguration;
