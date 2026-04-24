import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { ChatEncryptedMessage, ChatEncryptedText, ChatMessage } from "./chatTypes";

const DH_PRIME_HEX =
  "FFFFFFFFFFFFFFFFC90FDAA22168C234C4C6628B80DC1CD129024E088A67CC74" +
  "020BBEA63B139B22514A08798E3404DDEF9519B3CD3A431B302B0A6DF25F1437" +
  "4FE1356D6D51C245E485B576625E7EC6F44C42E9A637ED6B0BFF5CB6F406B7ED" +
  "EE386BFB5A899FA5AE9F24117C4B1FE649286651ECE45B3DC2007CB8A163BF05" +
  "98DA48361C55D39A69163FA8FD24CF5F83655D23DCA3AD961C62F356208552BB" +
  "9ED529077096966D670C354E4ABC9804F1746C08CA237327FFFFFFFFFFFFFFFF";

const DH_PRIME = BigInt(`0x${DH_PRIME_HEX}`);
const DH_GENERATOR = 2n;
const AES_IV_LENGTH = 12;

function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  let result = 1n;
  let currentBase = base % modulus;
  let currentExponent = exponent;

  while (currentExponent > 0n) {
    if ((currentExponent & 1n) === 1n) {
      result = (result * currentBase) % modulus;
    }
    currentBase = (currentBase * currentBase) % modulus;
    currentExponent >>= 1n;
  }

  return result;
}

function randomPrivateKey(): bigint {
  const min = 2n;
  const max = DH_PRIME - 2n;
  const range = max - min + 1n;
  const random = BigInt(`0x${randomBytes(32).toString("hex")}`);
  return (random % range) + min;
}

function parsePeerPublicKey(peerPublicKey: string): bigint {
  const value = BigInt(peerPublicKey);
  if (value < 2n || value >= DH_PRIME) {
    throw new Error("Invalid public key");
  }
  return value;
}

function sharedSecretToAesKey(sharedSecret: bigint): Buffer {
  return createHash("sha256").update(sharedSecret.toString(16)).digest();
}

export function createDhServerHandshake(clientPublicKey: string): {
  serverPublicKey: string;
  sharedKey: Buffer;
} {
  const peerPublic = parsePeerPublicKey(clientPublicKey);
  const privateKey = randomPrivateKey();
  const serverPublic = modPow(DH_GENERATOR, privateKey, DH_PRIME);
  const sharedSecret = modPow(peerPublic, privateKey, DH_PRIME);

  return {
    serverPublicKey: serverPublic.toString(),
    sharedKey: sharedSecretToAesKey(sharedSecret),
  };
}

export function encryptText(
  plainText: string,
  sharedKey: Buffer
): ChatEncryptedText {
  const iv = randomBytes(AES_IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", sharedKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return {
    iv: iv.toString("base64"),
    ciphertext: Buffer.concat([encrypted, authTag]).toString("base64"),
  };
}

export function decryptText(payload: ChatEncryptedText, sharedKey: Buffer): string {
    const iv = Buffer.from(payload.iv, 'base64')
    const combined = Buffer.from(payload.ciphertext, 'base64')
    if (combined.length < 16)
        throw new Error('Invalid ciphertext format')

    const encrypted = combined.subarray(0, combined.length - 16)
    const authTag = combined.subarray(combined.length - 16)
    const decipher = createDecipheriv('aes-256-gcm', sharedKey, iv)
    decipher.setAuthTag(authTag)

    const plain = Buffer.concat([decipher.update(encrypted), decipher.final()])
    return plain.toString('utf8')
}

export function encryptMessage(message: ChatMessage, sharedKey: Buffer): ChatEncryptedMessage {
    return {
        ...message,
        text: encryptText(message.text, sharedKey)
    }
} 
