import pool from '../config/database';

export interface IPBlacklist {
  id: string;
  ip_address: string;
  reason: string;
  expires_at: Date | null;
  created_at: Date;
}

export interface CreateIPBlacklistDTO {
  ip_address: string;
  reason: string;
  expires_at?: Date;
}

export class IPBlacklistModel {
  static async create(blacklistData: CreateIPBlacklistDTO): Promise<IPBlacklist> {
    const query = `
      INSERT INTO ip_blacklist (ip_address, reason, expires_at)
      VALUES ($1, $2, $3)
      ON CONFLICT (ip_address) 
      DO UPDATE SET
        reason = EXCLUDED.reason,
        expires_at = EXCLUDED.expires_at
      RETURNING *
    `;
    const values = [
      blacklistData.ip_address,
      blacklistData.reason,
      blacklistData.expires_at || null,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByIP(ip_address: string): Promise<IPBlacklist | null> {
    const query = `
      SELECT *
      FROM ip_blacklist
      WHERE ip_address = $1
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
    `;
    const result = await pool.query(query, [ip_address]);
    return result.rows[0] || null;
  }

  static async removeFromBlacklist(ip_address: string): Promise<void> {
    const query = 'DELETE FROM ip_blacklist WHERE ip_address = $1';
    await pool.query(query, [ip_address]);
  }

  static async cleanExpired(): Promise<void> {
    const query = 'DELETE FROM ip_blacklist WHERE expires_at < CURRENT_TIMESTAMP';
    await pool.query(query);
  }

  static async isBlacklisted(ip_address: string): Promise<boolean> {
    const blacklistedIP = await this.findByIP(ip_address);
    return blacklistedIP !== null;
  }

  static async getAll(): Promise<IPBlacklist[]> {
    const query = `
      SELECT *
      FROM ip_blacklist
      WHERE expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP
      ORDER BY created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}
