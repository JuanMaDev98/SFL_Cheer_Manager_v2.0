/**
 * AES-256-GCM encryption utility for sensitive data (API keys)
 * 
 * Security measures:
 * - Uses AES-256-GCM for authenticated encryption
 * - IV is prepended to ciphertext (12 bytes)
 * - Auth tag is appended to ciphertext (16 bytes)
 * - ENCRYPTION_KEY must be 32 bytes (256 bits), stored server-side only
 * - Never exposed to frontend, never logged
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

/**
 * Get encryption key from environment
 * Returns null if not properly configured
 */
export function getEncryptionKey(): string | null {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length !== 64) {
    console.error('[encryption] ENCRYPTION_KEY not configured or invalid length:', 
      key ? `${key.length} chars (expected 64)` : 'not set')
    return null
  }
  return key
}

/**
 * Get random bytes using globalThis.crypto (works in all JS environments)
 */
function getRandomBytes(length: number): Uint8Array {
  return globalThis.crypto.getRandomValues(new Uint8Array(length))
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16)
  }
  return bytes
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Encrypts plaintext using AES-256-GCM via Web Crypto API
 * Works in Edge runtime, Node.js 18+, and serverless environments
 * Returns: iv (12 bytes) + ciphertext + authTag (16 bytes) all as hex
 * Throws if ENCRYPTION_KEY not configured
 */
export async function encrypt(plaintext: string): Promise<string> {
  const ENCRYPTION_KEY = getEncryptionKey()
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required for API key encryption')
  }
  
  const keyBytes = hexToBytes(ENCRYPTION_KEY)
  const iv = getRandomBytes(IV_LENGTH)
  
  // Import the key for AES-256-GCM
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'aes-256-gcm', length: 256 },
    false,
    ['encrypt']
  )
  
  // Encrypt using Web Crypto API
  const encoded = new TextEncoder().encode(plaintext)
  const encryptedBuffer = await globalThis.crypto.subtle.encrypt(
    { name: 'aes-256-gcm', iv: iv },
    cryptoKey,
    encoded
  )
  
  // Web Crypto appends the auth tag to the ciphertext
  const encrypted = new Uint8Array(encryptedBuffer)
  
  // IV + ciphertext (with auth tag at end)
  return bytesToHex(iv) + bytesToHex(encrypted)
}

/**
 * Decrypts ciphertext encrypted with encrypt()
 */
export async function decrypt(ciphertext: string): Promise<string> {
  const ENCRYPTION_KEY = getEncryptionKey()
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required for API key decryption')
  }
  
  const keyBytes = hexToBytes(ENCRYPTION_KEY)
  
  // Extract IV (first 12 bytes = 24 hex chars)
  const iv = hexToBytes(ciphertext.substring(0, 24))
  // Extract auth tag (last 32 hex chars = 16 bytes)
  const authTag = hexToBytes(ciphertext.substring(ciphertext.length - 32))
  // Extract encrypted data (between IV and auth tag)
  const encrypted = hexToBytes(ciphertext.substring(24, ciphertext.length - 32))
  
  // Import key
  const cryptoKey = await globalThis.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'aes-256-gcm', length: 256 },
    false,
    ['decrypt']
  )
  
  // Decrypt - Web Crypto expects auth tag appended to ciphertext
  const decryptedBuffer = await globalThis.crypto.subtle.decrypt(
    { name: 'aes-256-gcm', iv: iv },
    cryptoKey,
    encrypted
  )
  
  return new TextDecoder().decode(decryptedBuffer)
}

/**
 * Validates that a string looks like a valid SFL API key
 * Format: sfl.{base64}.{base64} (typically 70-100 chars)
 */
export function isValidSflApiKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false
  if (key.length < 50 || key.length > 200) return false
  if (!key.startsWith('sfl.')) return false
  const parts = key.split('.')
  if (parts.length !== 3) return false
  return parts.every(part => part.length > 0)
}
