#!/usr/bin/env node

/**
 * Helper script to validate and convert Google Service Account private key
 * 
 * Usage:
 *   node scripts/validate-key.js
 * 
 * This will read your .env.local and check if the GOOGLE_PRIVATE_KEY is valid
 */

const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env.local not found');
    process.exit(1);
  }

  const content = fs.readFileSync(envPath, 'utf-8');
  const lines = content.split('\n');
  const env = {};

  for (const line of lines) {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      
      // Remove surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      
      env[key] = value;
    }
  }

  return env;
}

function validateKey() {
  console.log('🔍 Validating Google Service Account Private Key...\n');

  const env = loadEnv();

  if (!env.GOOGLE_PRIVATE_KEY) {
    console.error('❌ GOOGLE_PRIVATE_KEY not found in .env.local');
    process.exit(1);
  }

  const rawKey = env.GOOGLE_PRIVATE_KEY;
  console.log('📋 Raw key length:', rawKey.length);
  console.log('📋 Contains "BEGIN PRIVATE KEY":', rawKey.includes('BEGIN PRIVATE KEY'));
  console.log('📋 Contains literal \\n:', rawKey.includes('\\n'));
  console.log('📋 Contains actual newlines:', rawKey.includes('\n'));

  // Try to process the key
  let processedKey = rawKey
    .replace(/\\n/g, '\n')
    .replace(/\r/g, '')
    .trim();

  console.log('\n✅ Processed key:');
  console.log('  - Length:', processedKey.length);
  console.log('  - Lines:', processedKey.split('\n').length);
  console.log('  - Starts with:', processedKey.substring(0, 50));
  console.log('  - Ends with:', processedKey.substring(processedKey.length - 50));

  // Check if it's valid PEM format
  if (processedKey.includes('-----BEGIN PRIVATE KEY-----') && 
      processedKey.includes('-----END PRIVATE KEY-----')) {
    console.log('\n✅ Key appears to be in valid PEM format');
    
    // Try to use it with googleapis
    try {
      const { google } = require('googleapis');
      const auth = new google.auth.JWT({
        email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: processedKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });
      console.log('✅ Key successfully loaded by googleapis');
    } catch (error) {
      console.error('\n❌ Error loading key with googleapis:');
      console.error(error.message);
      console.log('\n💡 Suggested fix:');
      console.log('Your key should be in one of these formats in .env.local:\n');
      console.log('Format 1 (recommended):');
      console.log('GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nMIIE...\\n-----END PRIVATE KEY-----\\n"\n');
      console.log('Format 2 (multiline):');
      console.log('GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----');
      console.log('MIIEvQIBADANBgkqhki...');
      console.log('-----END PRIVATE KEY-----"');
    }
  } else {
    console.error('\n❌ Key does not appear to be in valid PEM format');
    console.log('\n💡 Make sure your key includes:');
    console.log('  - -----BEGIN PRIVATE KEY-----');
    console.log('  - The base64 encoded key content');
    console.log('  - -----END PRIVATE KEY-----');
  }
}

validateKey();
