
import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import pool from "./config/db";
import UserRouter from "./routes/userRoutes";
import AdminRouter from "./routes/adminRoutes";
import OwnerRouter from "./routes/ownerRoutes";
import NormalRouter from "./routes/normalRoutes";


dotenv.config();

const app: Application = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use("/api/public", NormalRouter);
app.use("/api/user", UserRouter);
app.use("/api/owner", OwnerRouter);
app.use("/api/admin", AdminRouter);

app.get("/", (req: Request, res: Response) => {
  res.json({ message: "Api is running " });
});

(async () => {
  try {
    await pool.getConnection();
    console.log("MySQL connected");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error(`Failed to connect to MySQL: ${err}`);
    process.exit(1);
  }
})();