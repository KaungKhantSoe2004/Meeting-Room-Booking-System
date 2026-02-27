import { Request, Response } from "express";
import pool from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { User, UserDataRequest } from "../config/types";

const VALID_ROLES= ["admin", "owner", "user"];

export const listUsersPublic = async (req: Request, res: Response): Promise<void> => {
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

export const createUser = async (req: Request, res: Response): Promise<void> => {
  const { name, role } = req.body;

  if (!name || typeof name !== "string" || name.trim() === "") {
    res.status(400).json({ error: "name is required and must be a non-empty string" });
    return;
  }

  if (!role || !VALID_ROLES.includes(role)) {
    res.status(400).json({ error: `role is required and must be one of: ${VALID_ROLES.join(", ")}` });
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

  res.status(200).json(rows[0]);
};

export const deleteUser = async (req:  UserDataRequest, res: Response): Promise<void> => {
  const userId = Number(req.params.id);

  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  if (req.user?.id === userId) {
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

  await pool.query("DELETE FROM users WHERE id = ?", [userId]);

  res.json({ message: "User deleted. All their bookings have been removed (CASCADE)." });
};

export const changeUserRole = async (req: Request, res: Response): Promise<void> => {
  const userId = Number(req.params.id);
  const { role } = req.body;

  if (isNaN(userId)) {
    res.status(400).json({ error: "Invalid user id" });
    return;
  }

  if (!role || !VALID_ROLES.includes(role)) {
    res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(", ")}` });
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

  await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, userId]);

  const [updated] = await pool.query<RowDataPacket[]>(
    "SELECT id, name, role, created_at FROM users WHERE id = ?",
    [userId]
  );

  res.json(updated[0]);
};