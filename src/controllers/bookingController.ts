import { User } from './../config/types';
import { Request, Response } from "express";
import pool from "../config/db";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { UserDataRequest } from "../config/types";

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}
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
        "Overlapping times are not allowed. Back-to-back bookings (e.g., 10:00–11:00 and 11:00–12:00) are okay",
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
  console.log('we are getting all bookings')
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT b.id, b.user_id, u.name AS user_name, b.start_time, b.end_time, b.created_at
     FROM bookings b
     JOIN users u ON b.user_id = u.id
     ORDER BY b.start_time`
  );
  res.json(rows);
};

// export const deleteBooking = async (req:  Request<{ id: string }>, res: Response): Promise<void> => {
//   const bookingId = Number(req.params.id);
//   console.log(req.user, 'is user')
//   if (isNaN(bookingId)) {
//     res.status(400).json({ error: "Invalid booking id" });
//   }

//   const [rows] = await pool.query<RowDataPacket[]>(
//     "SELECT id FROM bookings WHERE id = ?",
//     [bookingId]
//   );


//   if (rows.length === 0) {
//     res.status(404).json({ error: "Booking not found" });
//     return;
//   }

//   await pool.query("DELETE FROM bookings WHERE id = ?", [bookingId]);
//   res.json({ message: "Booking deleted successfully" });
// };


export const deleteBooking = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const bookingId = Number(req.params.id);
  
  if (isNaN(bookingId)) {
    res.status(400).json({ error: "Invalid booking id" });
    return;
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, user_id FROM bookings WHERE id = ?",
      [bookingId]
    );

    if (rows.length === 0) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }

    const booking = rows[0];

    if (req.user?.role === 'user' && booking.user_id !== req.user.id) {
      res.status(403).json({ error: "Forbidden - You can only delete your own bookings" });
      return;
    }

    await pool.query("DELETE FROM bookings WHERE id = ?", [bookingId]);
    res.json({ message: "Booking deleted successfully" });
    
  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ error: "Internal server error" });
  }
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
     WHERE u.role != 'admin'
     GROUP BY u.id, u.name, u.role
     ORDER BY total_bookings DESC`
  );
  console.log(rows, 'is usage summary rows')
  res.json(rows);
};

export const getBookingsByUser = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const userId = Number(req.params.id);

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
