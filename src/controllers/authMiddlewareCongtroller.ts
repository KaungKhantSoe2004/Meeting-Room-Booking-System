import { Response, NextFunction } from "express";
import pool from "../config/db";
import {   User, UserDataRequest, UserRole } from "../config/types";
import { RowDataPacket } from "mysql2";

export const authorize = (allowedRole: UserRole) => {
  return async (req: UserDataRequest, res: Response, next: NextFunction): Promise<void> => {
    const userIdHeader = req.headers["user-id"];

    if (!userIdHeader) {
      res.status(401).json({ error: "Missing user-id" });
      return;
    }

    const userId = Number(userIdHeader);

    if (isNaN(userId)) {
      res.status(400).json({ error: "user-id must be number" });
      return;
    }

    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        "SELECT id, name, role, created_at FROM users WHERE id = ?",
        [userId]
      );

      if (rows.length === 0) {
        res.status(401).json({ error: "User not found" });
        return;
      }

      const user = rows[0] as User;

      if (allowedRole != user.role) {
        res.status(403).json({
          error: `Forbidden.Requires ${allowedRole} role, but user's role is '${user.role}'`,
        });
        return;
      }

      req.user = user;
      next();
    } catch (err) {
      res.status(500).json({ error: "Internal server error during authorization" });
    }
  };
};