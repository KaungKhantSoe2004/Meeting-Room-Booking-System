import { Router } from "express";
import { authorize } from "../controllers/authMiddlewareCongtroller";
import {
  createUser,
  deleteUser,
  changeUserRole,
  getAllUsers,
} from "../controllers/userController";
import { deleteBooking, getAllBookings, getBookingsByUser } from "../controllers/bookingController";

const AdminRouter = Router();

AdminRouter.use(authorize("admin"));

AdminRouter.get("/users", getAllUsers);
AdminRouter.post("/users", createUser);
AdminRouter.delete("/users/:id", deleteUser);
AdminRouter.patch("/users/:id/role", changeUserRole);
AdminRouter.get("/bookings", getAllBookings);
AdminRouter.delete('/deleteBookings/:id', deleteBooking);
AdminRouter.get("/bookingsByUser/:id", getBookingsByUser);
export default AdminRouter;

