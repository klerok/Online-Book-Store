import 'dotenv/config'
import express, { ErrorRequestHandler } from "express";
import cors from "cors";
// import { pool } from "./db";
import cookieParser from "cookie-parser";
import authRouter from "./api/auth";
import { errorMiddleware } from "middleware/error.middleware";
import { notFoundMiddleware } from "middleware/notFound.middleware";

const app = express();

app.use(express.json());
app.use(cors({ origin: "http://localhost:5173", credentials: true }));

app.use(cookieParser());
app.use("/api/auth", authRouter);

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok!!!!!!" });
});

app.use(notFoundMiddleware)
app.use(errorMiddleware as ErrorRequestHandler);

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
