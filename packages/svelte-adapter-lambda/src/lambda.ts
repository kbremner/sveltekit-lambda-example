import { URLSearchParams } from 'url';
import * as kit from '@sveltejs/kit/types';
import * as Lambda from 'aws-lambda';
// @ts-expect-error app.cjs is a generated file, so expect it to not be found right now
import * as app from './app.cjs';

// Implementation based on the begin adapter and this implementation:
// https://github.com/juranki/diy-sveltekit-cdk-adapter/blob/442ee7c/adapter/lambda/index.js
export async function handler(
  event: Lambda.APIGatewayProxyEventV2
): Promise<Lambda.APIGatewayProxyResultV2> {
  const { rawPath, rawQueryString, headers } = event;
  console.log('event:', event);

  const query = new URLSearchParams(rawQueryString);
  const body = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  const rendered: kit.Response = await app.render({
    host: event.requestContext.domainName,
    method: event.requestContext.http.method,
    body,
    rawBody: body,
    headers,
    query,
    path: rawPath,
  });
  console.log('rendered:', rendered);

  if (!rendered) {
    return {
      statusCode: 404,
      body: 'Not found.',
    };
  }

  return {
    headers: rendered.headers,
    body: rendered.body,
    statusCode: rendered.status,
  } as Lambda.APIGatewayProxyResultV2;
}
