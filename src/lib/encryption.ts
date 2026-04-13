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

function hexToBuffer(hex: string): Buffer {
  return Buffer.from(hex, 'hex')
}

function bufferToHex(buffer: Buffer): string {
  return buffer.toString('hex')
}

/**
 * Encrypts plaintext using AES-256-GCM
 * Returns: iv (12 bytes) + ciphertext + authTag (16 bytes) all as hex
 * Throws if ENCRYPTION_KEY not configured
 */
export function encrypt(plaintext: string): string {
  const ENCRYPTION_KEY = getEncryptionKey()
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required for API key encryption')
  }
  
  const key = hexToBuffer(ENCRYPTION_KEY)
  const iv = crypto.randomBytes(IV_LENGTH)
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ])
  const authTag = cipher.getAuthTag()
  
  // Prepend IV, append auth tag
  return bufferToHex(iv) + bufferToHex(encrypted) + bufferToHex(authTag)
}

/**
 * Decrypts ciphertext encrypted with encrypt()
 * Throws if ENCRYPTION_KEY not configured
 */
export function decrypt(ciphertext: string): string {
  const ENCRYPTION_KEY = getEncryptionKey()
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required for API key decryption')
  }
  
  const key = hexToBuffer(ENCRYPTION_KEY)
  
  const iv = hexToBuffer(ciphertext.slice(0, IV_LENGTH * 2))
  const authTag = hexToBuffer(ciphertext.slice(-AUTH_TAG_LENGTH * 2))
  const encrypted = hexToBuffer(ciphertext.slice(IV_LENGTH * 2, -AUTH_TAG_LENGTH * 2))
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  return decipher.update(encrypted) + decipher.final('utf8')
}

/**
 * Validates that a string looks like a valid SFL API key
 * Format: sfl.{base64}.{base64} (typically 70-100 chars)
 */
export function isValidSflApiKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false
  if (key.length < 50 || key.length > 200) return false
  if (!key.startsWith('sfl.')) return false
  // Basic format validation - should have 2 base64-like segments
  const parts = key.split('.')
  if (parts.length !== 3) return false
  return parts.every(part => part.length > 0)
}