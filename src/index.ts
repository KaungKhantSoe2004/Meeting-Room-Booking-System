import express, { Application, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";

dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Meeting Room Booking API running" });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});