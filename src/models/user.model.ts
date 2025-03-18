import pool from '../config/database';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  mfa_enabled: boolean;
  mfa_secret?: string;
  failed_attempts: number;
  last_failed_attempt?: Date;
  account_locked: boolean;
  lockout_until?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserDTO {
  email: string;
  password_hash: string;
}

export class UserModel {
  static async create(userData: CreateUserDTO): Promise<User> {
    const query = `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING *
    `;
    const values = [userData.email, userData.password_hash];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  }

  static async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async updateFailedAttempts(id: string, attempts: number): Promise<void> {
    const query = `
      UPDATE users
      SET failed_attempts = $2,
          last_failed_attempt = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    await pool.query(query, [id, attempts]);
  }

  static async lockAccount(id: string, duration: number): Promise<void> {
    const query = `
      UPDATE users
      SET account_locked = true,
          lockout_until = CURRENT_TIMESTAMP + interval '1 second' * $2
      WHERE id = $1
    `;
    await pool.query(query, [id, duration]);
  }

  static async unlockAccount(id: string): Promise<void> {
    const query = `
      UPDATE users
      SET account_locked = false,
          lockout_until = null,
          failed_attempts = 0
      WHERE id = $1
    `;
    await pool.query(query, [id]);
  }

  static async updateMfaStatus(id: string, enabled: boolean, secret?: string): Promise<void> {
    const query = `
      UPDATE users
      SET mfa_enabled = $2,
          mfa_secret = $3
      WHERE id = $1
    `;
    await pool.query(query, [id, enabled, secret]);
  }
}
