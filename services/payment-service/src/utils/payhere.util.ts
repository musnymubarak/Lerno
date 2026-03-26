import crypto from 'crypto';

/**
 * Generate the MD5 hash required for the PayHere checkout form.
 */
export const generatePayHereHash = (
  merchantId: string,
  orderId: string,
  amount: number,
  currency: string,
  merchantSecret: string
): string => {
  // PayHere expects formatted amount with 2 decimal places
  const formattedAmount = amount.toFixed(2);
  
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const hashString = `${merchantId}${orderId}${formattedAmount}${currency}${hashedSecret}`;
  
  return crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();
};

/**
 * Verify the md5sig received in the PayHere webhook payload.
 */
export const verifyPayHereCallback = (
  merchantId: string,
  orderId: string,
  payhereAmount: string,
  payhereCurrency: string,
  statusCode: string,
  md5sig: string,
  merchantSecret: string
): boolean => {
  const hashedSecret = crypto
    .createHash('md5')
    .update(merchantSecret)
    .digest('hex')
    .toUpperCase();

  const hashString = `${merchantId}${orderId}${payhereAmount}${payhereCurrency}${statusCode}${hashedSecret}`;
  
  const calculatedHash = crypto
    .createHash('md5')
    .update(hashString)
    .digest('hex')
    .toUpperCase();

  return calculatedHash === md5sig;
};
