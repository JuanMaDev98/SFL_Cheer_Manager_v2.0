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

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto'

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
 * Encrypts plaintext using AES-256-GCM
 * Uses Node.js crypto module (works in Vercel Node.js runtime)
 * Returns: iv (12 bytes) + ciphertext + authTag (16 bytes) all as hex
 * Throws if ENCRYPTION_KEY not configured
 */
export function encrypt(plaintext: string): string {
  const ENCRYPTION_KEY = getEncryptionKey()
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required for API key encryption')
  }
  
  // Create buffer from hex key
  const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex')
  
  // Generate random IV
  const iv = randomBytes(IV_LENGTH)
  
  // Create cipher
  const cipher = createCipheriv(ALGORITHM, keyBuffer, iv)
  
  // Encrypt
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ])
  
  // Get auth tag (AES-GCM appends it)
  const authTag = cipher.getAuthTag()
  
  // Return: iv + encrypted + authTag (all as hex)
  return iv.toString('hex') + encrypted.toString('hex') + authTag.toString('hex')
}

/**
 * Decrypts ciphertext encrypted with encrypt()
 */
export function decrypt(ciphertext: string): string {
  const ENCRYPTION_KEY = getEncryptionKey()
  if (!ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is required for API key decryption')
  }
  
  const keyBuffer = Buffer.from(ENCRYPTION_KEY, 'hex')
  
  // Extract parts
  const iv = Buffer.from(ciphertext.substring(0, IV_LENGTH * 2), 'hex')
  const authTag = Buffer.from(ciphertext.substring(ciphertext.length - AUTH_TAG_LENGTH * 2), 'hex')
  const encrypted = Buffer.from(ciphertext.substring(IV_LENGTH * 2, ciphertext.length - AUTH_TAG_LENGTH * 2), 'hex')
  
  // Create decipher
  const decipher = createDecipheriv(ALGORITHM, keyBuffer, iv)
  decipher.setAuthTag(authTag)
  
  // Decrypt
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
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
