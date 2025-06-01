import type { Request, Response, NextFunction } from "express";

export const checkForApiKey =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void) => 
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (req.method === "OPTIONS") {
      res.status(200).end();
      return;
    }

    if (req.headers.authorization !== process.env.API_SECRET) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    
    await fn(req, res, next);
  };
