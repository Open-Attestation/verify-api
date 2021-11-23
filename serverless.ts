import type { AWS } from '@serverless/typescript';
import { getArgumentValuesOrDefault, getAWSAccountId, getValueOrDefault } from "./src/libs/utils";

import hello from '@functions/hello';

const STAGE = getArgumentValuesOrDefault({ flag: "stage", defaultValue: "dev" });

const serverlessConfiguration = async (): Promise<AWS> => {
    const service = 'api.verify.gov.sg';
    const apiKeys: string[] = [`api-spm-${STAGE}-spmKey`];
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
            runtime: 'nodejs14.x',
            stackName: "${STAGE}",
            apiGateway: {
                minimumCompressionSize: 1024,
                shouldStartNameWithService: true,
                apiKeys
            },
            environment: {
            AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
            NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
            },
            lambdaHashingVersion: '20201221',
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
