/**
 * Cloudinary returns pHash as a 16-char hex string (64 bits). Postgres bigint is signed,
 * so values >= 2^63 must be wrapped into the signed range before storing / comparing.
 */
export function phashHexToSignedBigInt(hex: string): string {
  return BigInt.asIntN(64, BigInt("0x" + hex)).toString();
}
