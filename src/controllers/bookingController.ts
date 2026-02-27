import { Request, Response } from "express";
import pool from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { UserDataRequest } from "../config/types";


export const checkOverlap = async (
  startTime: Date,
  endTime: Date,
  excludeBookingId?: number
): Promise<boolean> => {
  const query = excludeBookingId
    ? `SELECT id FROM bookings
       WHERE id != ?
         AND start_time < ? AND end_time > ?`
    : `SELECT id FROM bookings
       WHERE start_time < ? AND end_time > ?`;

  const params = excludeBookingId
    ? [excludeBookingId, endTime, startTime]
    : [endTime, startTime];

  const [rows] = await pool.query<RowDataPacket[]>(query, params);
  return rows.length > 0;
};
export const createBooking = async (req: UserDataRequest, res: Response): Promise<void> => {
  const { startTime, endTime } = req.body;

  if (!startTime || !endTime) {
    res.status(400).json({ error: "startTime and endTime are required" });
    return;
  }
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    res.status(400).json({ error: "startTime and endTime must be valid ISO 8601 datetime strings" });
    return;
  }

  if (start >= end) {
    res.status(400).json({ error: "startTime must be strictly before endTime" });
    return;
  }

  const overlaps = await checkOverlap(start, end);

  if (overlaps) {
    res.status(409).json({
      error:
        "Booking conflicts with an existing booking. Back-to-back bookings are allowed (e.g. 09:00-10:00 and 10:00-11:00), but overlapping times are not.",
    });
    return;
  }

  await pool.query<ResultSetHeader>(
    "INSERT INTO bookings (user_id, start_time, end_time) VALUES (?, ?, ?)",
    [req.user!.id, start, end]
  );

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT b.id, b.user_id, u.name AS user_name, b.start_time, b.end_time, b.created_at
     FROM bookings b
     JOIN users u ON b.user_id = u.id`
  );

  res.status(200).json(rows);
};

export const getAllBookings = async (req: Request, res: Response): Promise<void> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT b.id, b.user_id, u.name AS user_name, b.start_time, b.end_time, b.created_at
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     ORDER BY b.start_time`
  );
  res.json(rows);
};

export const deleteBooking = async (req:  Request<{ id: string }>, res: Response): Promise<void> => {
  const bookingId = Number(req.params.id);
  if (isNaN(bookingId)) {
    res.status(400).json({ error: "Invalid booking id" });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM bookings WHERE id = ?",
    [bookingId]
  );

  if (rows.length === 0) {
    res.status(404).json({ error: "Booking not found" });
    return;
  }
  await pool.query("DELETE FROM bookings WHERE id = ?", [bookingId]);
  res.json({ message: "Booking deleted successfully" });
};

export const getBookingsGroupedByUser = async (req: Request, res: Response): Promise<void> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       u.id AS user_id,
       u.name AS user_name,
       u.role,
       b.id AS booking_id,
       b.start_time,
       b.end_time,
       b.created_at
     FROM users u
     LEFT JOIN bookings b ON u.id = b.user_id
     ORDER BY u.id, b.start_time`
  );

  const grouped: Record<number, { user_id: number; user_name: string; role: string; bookings: object[] }> = {};

  for (const row of rows) {
    if (!grouped[row.user_id]) {
      grouped[row.user_id] = {
        user_id: row.user_id,
        user_name: row.user_name,
        role: row.role,
        bookings: [],
      };
    }
    if (row.booking_id) {
      grouped[row.user_id].bookings.push({
        id: row.booking_id,
        start_time: row.start_time,
        end_time: row.end_time,
        created_at: row.created_at,
      });
    }
  }

  res.json(Object.values(grouped));
};

export const getUsageSummary = async (req: Request, res: Response): Promise<void> => {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT
       u.id AS user_id,
       u.name AS user_name,
       u.role,
       COUNT(b.id) AS total_bookings,
       COALESCE(SUM(TIMESTAMPDIFF(MINUTE, b.start_time, b.end_time)), 0) AS total_minutes_booked
     FROM users u
     LEFT JOIN bookings b ON u.id = b.user_id
     GROUP BY u.id, u.name, u.role
     ORDER BY total_bookings DESC`
  );
  res.json(rows);
};

export const getBookingsByUser = async (
  req: Request<{ userId: string }>,
  res: Response
) => {
  const userId = Number(req.params.userId);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user id" });
  }

  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT b.id, b.user_id, u.name AS user_name,
            b.start_time, b.end_time, b.created_at
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     WHERE b.user_id = ?
     ORDER BY b.start_time`,
    [userId]
  );

  return res.json(rows);
};
