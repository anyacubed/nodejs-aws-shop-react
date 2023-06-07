import * as cdk from 'aws-cdk-lib';
import { BlockPublicAccess, Bucket } from 'aws-cdk-lib/aws-s3';
import { CanonicalUserPrincipal, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { BucketDeployment, Source } from 'aws-cdk-lib/aws-s3-deployment';
import { CloudFrontWebDistribution, OriginAccessIdentity } from 'aws-cdk-lib/aws-cloudfront';
import { Construct } from 'constructs';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const cloudfrontOAI: cdk.aws_cloudfront.OriginAccessIdentity = new OriginAccessIdentity(this, 'CdkOAI');

    const bucket: cdk.aws_s3.Bucket = new Bucket(this, 'CdkBucket', {
      bucketName: 'nodejs-aws-shop-react-automated',
      websiteIndexDocument: 'index.html',
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL
    });

    bucket.addToResourcePolicy(new PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [bucket.arnForObjects('*')],
      principals: [new CanonicalUserPrincipal(cloudfrontOAI.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    }));

    const distribution: cdk.aws_cloudfront.CloudFrontWebDistribution = new CloudFrontWebDistribution(this, 'CdkDistribution', {
      originConfigs: [{
        s3OriginSource: {
          s3BucketSource: bucket,
          originAccessIdentity: cloudfrontOAI
        },
        behaviors: [{
          isDefaultBehavior: true
        }]
      }]
    });

    new BucketDeployment(this, 'CdkBucketDeployment', {
      sources: [Source.asset('../dist')],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*']
    });
  }
}
