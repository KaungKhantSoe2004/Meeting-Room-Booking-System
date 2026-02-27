import { Router } from "express";
import { authorize } from "../controllers/authMiddlewareCongtroller";
import {
  createBooking,
  deleteBooking,
  getAllBookings,
} from "../controllers/bookingController";

const UserRouter = Router();

UserRouter.use(authorize("user"));

UserRouter.post("/bookings", createBooking);

UserRouter.get("/bookings", getAllBookings);

UserRouter.delete("/bookings/:id", deleteBooking);

export default UserRouter;