import { createHmac, timingSafeEqual } from 'crypto';

export function verifyPulseWebhookSignature(
  secret: string,
  body: string,
  signature: string | null
): boolean {
  if (!signature?.startsWith('sha256=')) return false;

  const expected = `sha256=${createHmac('sha256', secret).update(body).digest('hex')}`;
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}

export function verifyBase64HmacSha256Signature(
  secret: string,
  body: string,
  signature: string | null
): boolean {
  if (!signature) return false;

  const expected = createHmac('sha256', secret).update(body).digest('base64');
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(signature);

  if (expectedBuffer.length !== actualBuffer.length) return false;
  return timingSafeEqual(expectedBuffer, actualBuffer);
}
