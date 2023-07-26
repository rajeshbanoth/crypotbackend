import express, { Request, Response } from "express";

import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// ----------------- create order ----------------------- //
router.post("/order/create", (req: Request, res: Response) => {
  res.json({ order: "ok" });
});

export { router as ordersRouter };
