import type { AWS } from '@serverless/typescript';
import { getArgumentValuesOrDefault, getAWSAccountId, getValueOrDefault } from "./src/libs/utils";

import hello from '@functions/hello';

const STAGE = getArgumentValuesOrDefault({ flag: "stage", defaultValue: "dev" });

const serverlessConfiguration = async (): Promise<AWS> => {
    const service = 'api-verify';
    const region  = 'ap-southeast-1';
    const ACCOUNT_ID = await getAWSAccountId();
    
    return {
        service,
        frameworkVersion: '2',
        plugins: [
            'serverless-esbuild'
        ],
        provider: {
            name: 'aws',
            region,
            runtime: 'nodejs14.x',
            memorySize: 256,
            timeout: 30,
            stackName: `${service}-${STAGE}`,
            stage: STAGE,
            apiGateway: {
                minimumCompressionSize: 1024,
                shouldStartNameWithService: true,
                metrics: true
            },
            environment: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
            },
            lambdaHashingVersion: '20201221',
            tracing: {
                lambda: true,
                apiGateway: true
            },
            rolePermissionsBoundary: `arn:aws:iam::${ACCOUNT_ID}:policy/GCCIAccountBoundary`,
            deploymentBucket: 'notarise-serverless-deployment'
        },
        // import the function via paths
        functions: { hello },
        package: { individually: true },
        custom: {
            esbuild: {
            bundle: true,
            minify: false,
            sourcemap: true,
            exclude: ['aws-sdk'],
            target: 'node14',
            define: { 'require.resolve': undefined },
            platform: 'node',
            concurrency: 10,
            },
        },
    };
}



// const serverlessConfiguration: AWS = {
//   service: 'api.verify.gov.sg',
//   frameworkVersion: '2',
//   plugins: ['serverless-esbuild'],
//   provider: {
//     name: 'aws',
//     runtime: 'nodejs14.x',
//     stackName: this.service
//     apiGateway: {
//       minimumCompressionSize: 1024,
//       shouldStartNameWithService: true,
//     },
//     environment: {
//       AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
//       NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
//     },
//     lambdaHashingVersion: '20201221',
//   },
//   // import the function via paths
//   functions: { hello },
//   package: { individually: true },
//   custom: {
//     esbuild: {
//       bundle: true,
//       minify: false,
//       sourcemap: true,
//       exclude: ['aws-sdk'],
//       target: 'node14',
//       define: { 'require.resolve': undefined },
//       platform: 'node',
//       concurrency: 10,
//     },
//   },
// };

module.exports = serverlessConfiguration;
