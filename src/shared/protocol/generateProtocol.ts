import { createHmac } from "node:crypto";
import Config from "../../configs.ts";

const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_LENGTH = 8;
const CODE_BITS = CODE_LENGTH * 5;
const HALF_BITS = CODE_BITS / 2;
const HALF_MASK = (1n << BigInt(HALF_BITS)) - 1n;
const DOMAIN = 1n << BigInt(CODE_BITS);
const ROUNDS = 8;

// Round function do Feistel: deriva HALF_BITS bits determinísticos da metade
// e do número da rodada, usando HMAC com a chave secreta (FPE).
function roundFunction(right: bigint, round: number): bigint {
  const digest = createHmac("sha256", Config.PROTOCOL_FPE_KEY)
    .update(`${round}:${right.toString()}`)
    .digest();
  const chunk = digest.readUInt32BE(0);
  return BigInt(chunk) & HALF_MASK;
}

function feistel(value: bigint): bigint {
  let left = value >> BigInt(HALF_BITS);
  let right = value & HALF_MASK;

  for (let round = 0; round < ROUNDS; round += 1) {
    const nextLeft = right;
    const nextRight = left ^ roundFunction(right, round);
    left = nextLeft;
    right = nextRight;
  }

  return (left << BigInt(HALF_BITS)) | right;
}

function encode(value: bigint): string {
  let code = "";
  for (let index = CODE_LENGTH - 1; index >= 0; index -= 1) {
    const shift = BigInt(index * 5);
    const charIndex = Number((value >> shift) & 31n);
    code += ALPHABET.charAt(charIndex);
  }
  return code;
}

// Gera o protocolo público não enumerável a partir do request_id interno.
// O FPE/Feistel é uma bijeção sobre [0, 32^8), então IDs consecutivos geram
// códigos sem relação aparente e sem colisão dentro do domínio.
export function generateProtocol(requestId: number | bigint | string): string {
  const value = BigInt(requestId);

  if (value <= 0n || value >= DOMAIN) {
    throw new RangeError("requestId fora do domínio do protocolo.");
  }

  const code = encode(feistel(value));
  return `MAAT-${code.slice(0, 4)}-${code.slice(4)}`;
}
