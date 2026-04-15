import jwt, { SignOptions } from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET;

if (!SECRET_KEY) {
  console.error(
    "[FATAL] JWT_SECRET is not set in the environment. " +
    "Copy backend/.env.example to backend/.env and set a strong JWT_SECRET before starting the server."
  );
  process.exit(1);
}

export const signToken = (payload: object, expiresIn: string = "7d"): string => {
  const options: SignOptions = { expiresIn: expiresIn as any };
  return jwt.sign(payload, SECRET_KEY!, options);
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, SECRET_KEY!);
};
