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

function modPow(base, exponent, modulus) {
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

function bytesToBase64(bytes) {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toArrayBuffer(bytes) {
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  );
}

function randomPrivateKey() {
  const randomBytes = new Uint8Array(32);
  crypto.getRandomValues(randomBytes);

  let random = 0n;
  for (const byte of randomBytes) {
    random = (random << 8n) | BigInt(byte);
  }

  const min = 2n;
  const max = DH_PRIME - 2n;
  const range = max - min + 1n;
  return (random % range) + min;
}

function sharedSecretToBytes(sharedSecret) {
  const sharedHex = sharedSecret.toString(16);
  const normalizedHex =
    sharedHex.length % 2 === 0 ? sharedHex : `0${sharedHex}`;
  const secretBytes = new Uint8Array(normalizedHex.length / 2);

  for (let i = 0; i < normalizedHex.length; i += 2) {
    secretBytes[i / 2] = Number.parseInt(normalizedHex.slice(i, i + 2), 16);
  }

  return secretBytes;
}

export function createDhClientHandshake() {
  const privateKey = randomPrivateKey();
  const publicKey = modPow(DH_GENERATOR, privateKey, DH_PRIME);
  return { privateKey, publicKey: publicKey.toString() };
}

export async function createSharedKeyFromServerPublicKey(
  serverPublicKey,
  privateKey
) {
  const serverPublic = BigInt(serverPublicKey);
  if (serverPublic < 2n || serverPublic > DH_PRIME - 2n) {
    throw new Error("Сервер вернул некорректный публичный ключ");
  }

  const sharedSecret = modPow(serverPublic, privateKey, DH_PRIME);
  const sharedSecretHex = sharedSecret.toString(16);
  const hashed = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(sharedSecretHex)
  );
  return new Uint8Array(hashed);
}

async function importAesKey(sharedKey) {
  return crypto.subtle.importKey(
    "raw",
    toArrayBuffer(sharedKey),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"]
  );
}

export async function encryptText(plainText, sharedKey) {
  const iv = crypto.getRandomValues(new Uint8Array(AES_IV_LENGTH));
  const key = await importAesKey(sharedKey);
  const encoded = new TextEncoder().encode(plainText);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(encoded)
  );

  return {
    iv: bytesToBase64(iv),
    ciphertext: bytesToBase64(new Uint8Array(encrypted)),
  };
}

export async function decryptText(encryptedPayload, sharedKey) {
  const iv = base64ToBytes(encryptedPayload.iv);
  const ciphertext = base64ToBytes(encryptedPayload.ciphertext);
  const key = await importAesKey(sharedKey);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toArrayBuffer(iv) },
    key,
    toArrayBuffer(ciphertext)
  );
  return new TextDecoder().decode(decrypted);
}
