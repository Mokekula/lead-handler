import { Injectable } from '@nestjs/common';
import { createHash } from 'crypto';

@Injectable()
export class HashingService {
  /**
   * Computes the SHA-256 hash of a given input message.
   *
   * @param {string} message - The input message to hash.
   * @return {string} The computed SHA-256 hash as a hexadecimal string.
   */
  hash(message: string): string {
    return createHash('sha256').update(message).digest('hex');
  }
}
