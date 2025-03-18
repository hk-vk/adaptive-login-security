import * as argon2 from 'argon2';

export class PasswordService {
  private static readonly MEMORY_COST = 65536; // 64MB
  private static readonly TIME_COST = 3;
  private static readonly PARALLELISM = 4;

  /**
   * Hash a password using Argon2id
   * @param password Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return await argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: PasswordService.MEMORY_COST,
      timeCost: PasswordService.TIME_COST,
      parallelism: PasswordService.PARALLELISM,
    });
  }

  /**
   * Verify a password against its hash
   * @param hash Stored password hash
   * @param password Plain text password to verify
   * @returns Boolean indicating if password matches
   */
  async verifyPassword(hash: string, password: string): Promise<boolean> {
    return await argon2.verify(hash, password);
  }
}
