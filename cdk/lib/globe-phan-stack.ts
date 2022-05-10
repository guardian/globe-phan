import {
  Stack,
  Construct,
  StackProps,
  Duration,
  Tag,
  CfnParameter,
  RemovalPolicy,
} from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as s3 from "@aws-cdk/aws-s3";
import * as iam from "@aws-cdk/aws-iam";
import { BucketEncryption, BlockPublicAccess, Bucket } from "@aws-cdk/aws-s3";

export class GlobephanStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    /**
     * Parameters
     */

    const stackParameter = new CfnParameter(this, "Stack", {
      type: "String",
      description: "Stack",
    });

    const stageParameter = new CfnParameter(this, "Stage", {
      type: "String",
      description: "Stage",
    });

    /**
     * S3 bucket – where our data is persisted
     */
    const globephanDataBucket = new Bucket(this, "globe-phan-data", {
      versioned: false,
      bucketName: "globe-phan-data",
      encryption: BucketEncryption.UNENCRYPTED,
      publicReadAccess: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    /**
     * Lambda
     */
    const deployBucket = s3.Bucket.fromBucketName(
      this,
      "developer-playground-dist",
      "developer-playground-dist"
    );

    const commonLambdaParams = {};

    /**
     * API Lambda
     */
    const globephanFunction = new lambda.Function(this, `globe-phan-lambda`, {
      runtime: lambda.Runtime.NODEJS_12_X,
      memorySize: 128,
      timeout: Duration.seconds(5),
      handler: "index.handler",
      environment: {
        STAGE: stageParameter.valueAsString,
        STACK: stackParameter.valueAsString,
        APP: "globe-phan",
      },
      functionName: `globe-phan-lambda-${stageParameter.valueAsString}`,
      code: lambda.Code.bucket(
        deployBucket,
        `${stackParameter.valueAsString}/${stageParameter.valueAsString}/globe-phan-lambda/globe-phan-lambda.zip`
      ),
    });

    Tag.add(globephanFunction, "App", "globe-phan");
    Tag.add(globephanFunction, "Stage", stageParameter.valueAsString);
    Tag.add(globephanFunction, "Stack", stackParameter.valueAsString);

    const telemetryBackendPolicyStatement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ["s3:GetObject", "s3:PutObject"],
      resources: [
        globephanDataBucket.bucketArn,
        `${globephanDataBucket.bucketArn}/*`,
      ],
    });

    globephanFunction.addToRolePolicy(telemetryBackendPolicyStatement);
  }
}
