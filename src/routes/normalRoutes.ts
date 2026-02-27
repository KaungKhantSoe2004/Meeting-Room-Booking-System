import { Router } from "express";
import { listUsersPublic } from "../controllers/userController";

const NormalRouter = Router();

NormalRouter.get("/users", listUsersPublic);

export default NormalRouter;