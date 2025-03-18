import pool from '../config/database';

export interface LoginAttempt {
  id: string;
  user_id: string;
  ip_address: string;
  device_fingerprint: string;
  user_agent: string;
  success: boolean;
  risk_score: number;
  attempted_at: Date;
  geo_location?: Record<string, any>;
}

export interface CreateLoginAttemptDTO {
  user_id: string;
  ip_address: string;
  device_fingerprint: string;
  user_agent: string;
  success: boolean;
  risk_score: number;
  geo_location?: Record<string, any>;
}

export class LoginAttemptModel {
  static async create(attemptData: CreateLoginAttemptDTO): Promise<LoginAttempt> {
    const query = `
      INSERT INTO login_attempts (
        user_id, ip_address, device_fingerprint,
        user_agent, success, risk_score, geo_location
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      attemptData.user_id,
      attemptData.ip_address,
      attemptData.device_fingerprint,
      attemptData.user_agent,
      attemptData.success,
      attemptData.risk_score,
      attemptData.geo_location,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async getRecentAttempts(
    ip_address: string,
    minutes: number = 15
  ): Promise<LoginAttempt[]> {
    const query = `
      SELECT *
      FROM login_attempts
      WHERE ip_address = $1
        AND attempted_at >= NOW() - interval '1 minute' * $2
      ORDER BY attempted_at DESC
    `;
    const result = await pool.query(query, [ip_address, minutes]);
    return result.rows;
  }

  static async getRecentUserAttempts(
    user_id: string,
    minutes: number = 15
  ): Promise<LoginAttempt[]> {
    const query = `
      SELECT *
      FROM login_attempts
      WHERE user_id = $1
        AND attempted_at >= NOW() - interval '1 minute' * $2
      ORDER BY attempted_at DESC
    `;
    const result = await pool.query(query, [user_id, minutes]);
    return result.rows;
  }

  static async getRecentFailedAttempts(
    ip_address: string,
    minutes: number = 15
  ): Promise<LoginAttempt[]> {
    const query = `
      SELECT *
      FROM login_attempts
      WHERE ip_address = $1
        AND success = false
        AND attempted_at >= NOW() - interval '1 minute' * $2
      ORDER BY attempted_at DESC
    `;
    const result = await pool.query(query, [ip_address, minutes]);
    return result.rows;
  }

  static async calculateRiskScore(
    ip_address: string,
    device_fingerprint: string
  ): Promise<number> {
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE success = false) as failed_attempts,
        COUNT(DISTINCT user_id) as unique_users,
        COUNT(DISTINCT device_fingerprint) as unique_devices
      FROM login_attempts
      WHERE (ip_address = $1 OR device_fingerprint = $2)
        AND attempted_at >= NOW() - interval '24 hours'
    `;
    const result = await pool.query(query, [ip_address, device_fingerprint]);
    const stats = result.rows[0];
    
    // Calculate risk score based on various factors
    let riskScore = 0;
    if (stats.failed_attempts > 10) riskScore += 30;
    if (stats.unique_users > 3) riskScore += 20;
    if (stats.unique_devices > 2) riskScore += 20;
    
    return Math.min(riskScore, 100);
  }
}
