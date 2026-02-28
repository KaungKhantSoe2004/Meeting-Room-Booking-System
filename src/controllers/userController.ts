import { Request, Response } from "express";
import pool from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { User, UserDataRequest } from "../config/types";

const VALID_ROLES= ["admin", "owner", "user"];
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
export const listUsersPublic = async (req: Request, res: Response): Promise<void> => {
  console.log("users api is called")
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, role FROM users ORDER BY id"
  );
  res.json(rows);
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, role, created_at FROM users ORDER BY id"
  );
  res.json(rows);
};
export const createUser = async (
  req: UserDataRequest,
  res: Response
): Promise<void> => {
  try {
  
    if (!req.user || req.user.role !== "admin") {
      res.status(403).json({ error: "Only admins can create users" });
      return;
    }

    const { name, role } = req.body;

    if (!name || typeof name !== "string" || name.trim() === "") {
      res.status(400).json({
        error: "name is required and must be a non-empty string",
      });
      return;
    }

    if (!role || !VALID_ROLES.includes(role)) {
      res.status(400).json({
        error: `role must be one of: ${VALID_ROLES.join(", ")}`,
      });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO users (name, role) VALUES (?, ?)",
      [name.trim(), role]
    );

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, role, created_at FROM users WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const deleteUser = async (
  req: Request<{ id: string }>,
  res: Response
): Promise<void> => {

    if (!req.user || req.user.role !== "admin") {
      res.status(403).json({ error: "Only admins can delete users" });
      return;
    }

    const userId = Number(req.params.id);
    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }

    if (req.user.id === userId) {
      res.status(400).json({ error: "Admins cannot delete their own account" });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE id = ?",
      [userId]
    );
    if (rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await pool.query("DELETE FROM bookings WHERE user_id = ?", [userId]);
    await pool.query("DELETE FROM users WHERE id = ?", [userId]);

    res.json({ message: "User and all their bookings have been deleted." });
 
};


export const changeUserRole = async (
  req: Request<{ id: string }, any, { role: string }>,
  res: Response
): Promise<void> => {
  try {

    if (!req.user || req.user.role !== "admin") {
      res.status(403).json({ error: "Only admins can change user roles" });
      return;
    }

    const userId = Number(req.params.id);
    const { role } = req.body;

    if (isNaN(userId)) {
      res.status(400).json({ error: "Invalid user id" });
      return;
    }

    if (!role || !VALID_ROLES.includes(role)) {
      res.status(400).json({
        error: `role must be one of: ${VALID_ROLES.join(", ")}`,
      });
      return;
    }

    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await pool.query(
      "UPDATE users SET role = ? WHERE id = ?",
      [role, userId]
    );

    const [updated] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, role, created_at FROM users WHERE id = ?",
      [userId]
    );

    res.json(updated[0]);
  } catch (error) {
    console.error("Change role error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

