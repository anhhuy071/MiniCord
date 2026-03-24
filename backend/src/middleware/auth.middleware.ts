
import jwt from "jsonwebtoken";
import {  Request, Response , NextFunction} from "express";

export interface AuthRequest extends Request{
  user?:string | jwt.JwtPayload;
};
export const RequireAuth = (req: AuthRequest , res :Response , next:NextFunction ) =>{
  const authHeader = req.headers.authorization;

  if(!authHeader || !authHeader.startsWith('Bearer')){
    return res.status(401).json({error:"Unauthorized: No token Provide"});
  };
  
  const token = authHeader.split(' ')[1];

  try {
    const decode = jwt.verify(token , process.env.JWT_SECRET || 'fallback_secret');
    req.user = decode;
    next();
  } catch (error) {
    return res.status(401).json({error:"Unauthorized: Invalid token"});
  }
};