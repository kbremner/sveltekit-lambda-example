import * as cdk from '@aws-cdk/core';
import * as s3 from '@aws-cdk/aws-s3';
import * as lambda from '@aws-cdk/aws-lambda';
import * as apiGateway from '@aws-cdk/aws-apigatewayv2';
import * as apiGatewayIntegrations from '@aws-cdk/aws-apigatewayv2-integrations';
import * as cloudFront from '@aws-cdk/aws-cloudfront';
import * as cloudFrontOrigins from '@aws-cdk/aws-cloudfront-origins';
import * as s3Deployment from '@aws-cdk/aws-s3-deployment';

export default class AppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props);

    const appStaticBucket = new s3.Bucket(this, 'AppStaticFiles', {
      accessControl: s3.BucketAccessControl.PUBLIC_READ,
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
    });
    const staticBucketOrigin = new cloudFrontOrigins.S3Origin(appStaticBucket);

    const appHandler = new lambda.Function(this, 'AppServerHandler', {
      code: new lambda.AssetCode('../app/build/server'),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_14_X,
    });

    const gateway = new apiGateway.HttpApi(this, 'ApiGateway');
    gateway.addRoutes({
      path: '/{proxy+}',
      methods: [apiGateway.HttpMethod.ANY],
      integration: new apiGatewayIntegrations.LambdaProxyIntegration({
        handler: appHandler,
        payloadFormatVersion: apiGateway.PayloadFormatVersion.VERSION_2_0,
      }),
    });
    const gatewayDomain = cdk.Fn.select(
      1,
      cdk.Fn.split('://', gateway.apiEndpoint)
    );

    new cloudFront.Distribution(this, 'AppDistribution', {
      priceClass: cloudFront.PriceClass.PRICE_CLASS_100,
      defaultBehavior: {
        origin: new cloudFrontOrigins.OriginGroup({
          primaryOrigin: staticBucketOrigin,
          fallbackOrigin: new cloudFrontOrigins.HttpOrigin(gatewayDomain),
          fallbackStatusCodes: [403, 404],
        }),
        viewerProtocolPolicy: cloudFront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      defaultRootObject: 'index.html',
    });

    new s3Deployment.BucketDeployment(this, 'AppStaticDeploy', {
      destinationBucket: appStaticBucket,
      sources: [s3Deployment.Source.asset('../app/build/static')],
      retainOnDelete: false,
    });
  }
}
