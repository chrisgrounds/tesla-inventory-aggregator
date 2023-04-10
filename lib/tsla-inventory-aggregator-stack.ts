import * as cdk from 'aws-cdk-lib';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class TslaInventoryAggregatorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const readerLambda = new nodejs.NodejsFunction(this, 'ReaderLambda', {
      entry: 'lambda/reader.ts',
      handler: 'handler',
      bundling: {
        minify: true,
        target: 'es2018',
      },
      runtime: lambda.Runtime.NODEJS_18_X,
      timeout: cdk.Duration.seconds(30),
    });

    readerLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['ses:SendEmail', 'SES:SendRawEmail'],
      resources: ['*'],
      effect: iam.Effect.ALLOW,
    }));

    // const inventoryTable = new dynamodb.Table(this, 'TslaInventory', {
    //   partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
    //   tableName: 'tsla-inventory',
    // });
  }
}