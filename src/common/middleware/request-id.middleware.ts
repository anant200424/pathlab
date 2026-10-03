import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

export function requestIdMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const existingId = req.headers["x-request-id"] as string;
  const requestId = existingId || crypto.randomUUID();

  // Attach to request and response
  (req as unknown as { id: string }).id = requestId;
  res.setHeader("x-request-id", requestId);

  next();
}
