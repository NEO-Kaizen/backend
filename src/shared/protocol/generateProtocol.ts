import { randomBytes } from "node:crypto";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 8;

// Placeholder: o protocolo definitivo ainda está sendo acordado

export function generateTempProtocol(): string {
  let code = "";
  for (const byte of randomBytes(CODE_LENGTH)) {
    code += ALPHABET.charAt(byte % 32);
  }
  return `MAAT-${code.slice(0, 4)}-${code.slice(4)}`;
}
