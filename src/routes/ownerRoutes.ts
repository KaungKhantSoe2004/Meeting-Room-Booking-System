import { Router } from "express";
import { authorize } from "../controllers/authMiddlewareCongtroller";
import {   getAllUsers } from "../controllers/userController";
import { createBooking, deleteBooking, getAllBookings, getBookingsByUser, getUsageSummary } from "../controllers/bookingController";


const OwnerRouter = Router();

OwnerRouter.use(authorize("owner"));
OwnerRouter.get("/users", getAllUsers);
OwnerRouter.post("/createBookings", createBooking);
OwnerRouter.delete('/deleteBookings/:id', deleteBooking);
OwnerRouter.get('/bookings', getAllBookings);
OwnerRouter.get("/bookingsByUser/:id", getBookingsByUser);
OwnerRouter.get("/usage-summary", getUsageSummary);
export default OwnerRouter;