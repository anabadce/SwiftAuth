// generates totp for a given secret, digits, period, algorithm
import { decodeBase32 } from '@std/encoding/base32';

export default async function generateTotp({ algorithm, secret, digits, period }) {
	const unixTimestamp = parseInt(Date.now() / 1000);

	const time = Math.floor(unixTimestamp / period);

	// create an 8byte buffer
	const timeBuffer = new ArrayBuffer(8);
	const timeView = new DataView(timeBuffer);
	timeView.setUint32(4, time, false); // Write the time to the last 4 bytes (big-endian)

	// Convert secret to uppercase for base32 decoding
	secret = secret.toUpperCase();

	// Ensure the secret is a valid base32 length
	if (secret.length % 8 !== 0) {
		// Add '=' character to make it a valid base32 length
		const padding = 8 - (secret.length % 8);
		secret += '='.repeat(padding);
	}

	const key = decodeBase32(secret);

	// Generate HMAC using the secret and the time step
	const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: 'SHA-1' }, false, ['sign']);

	const hmacResult = await crypto.subtle.sign('HMAC', cryptoKey, timeBuffer);

	// Truncate the HMAC result
	const hmacView = new DataView(hmacResult);
	const offset = hmacView.getUint8(hmacView.byteLength - 1) & 0xf;
	const binary = ((hmacView.getUint32(offset) & 0x7fffffff) >>> 0) % 1000000;

	// Pad the OTP to 6 digits
	const otp = ('000000' + binary).slice(-1 * digits);

	return otp;
}
