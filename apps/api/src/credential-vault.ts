import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { ServiceUnavailableException } from '@nestjs/common';

/** AAD prevents moving an encrypted credential to a different user or provider. */
export class CredentialVault {
  private key(): Buffer {
    const raw = process.env['CONNECTION_ENCRYPTION_KEY'];
    if (!raw || !/^[a-f\d]{64}$/i.test(raw)) {
      throw new ServiceUnavailableException({ error: 'connection_encryption_not_configured' });
    }
    return Buffer.from(raw, 'hex');
  }

  available(): boolean {
    try {
      this.key();
      return true;
    } catch {
      return false;
    }
  }

  seal(secret: string, owner: string): string {
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.key(), nonce);
    cipher.setAAD(Buffer.from(owner));
    const ciphertext = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return [
      'v1',
      nonce.toString('base64url'),
      cipher.getAuthTag().toString('base64url'),
      ciphertext.toString('base64url'),
    ].join('.');
  }

  open(envelope: string, owner: string): string {
    const [version, nonce, tag, data] = envelope.split('.');
    if (version !== 'v1' || !nonce || !tag || !data) throw new Error('invalid credential envelope');
    const decipher = createDecipheriv('aes-256-gcm', this.key(), Buffer.from(nonce, 'base64url'));
    decipher.setAAD(Buffer.from(owner));
    decipher.setAuthTag(Buffer.from(tag, 'base64url'));
    return Buffer.concat([
      decipher.update(Buffer.from(data, 'base64url')),
      decipher.final(),
    ]).toString('utf8');
  }
}
