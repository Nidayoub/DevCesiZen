import { jwt } from '@elysiajs/jwt';
import { Elysia } from 'elysia';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const jwtPlugin = new Elysia()
  .use(jwt({
    name: 'jwt',
    secret: JWT_SECRET
  }));

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

export const generateToken = async (payload: JWTPayload): Promise<string> => {
  return await jwtPlugin.jwt.sign(payload);
};

export const verifyToken = async (token: string): Promise<JWTPayload | null> => {
  try {
    const payload = await jwtPlugin.jwt.verify(token);
    return payload as JWTPayload;
  } catch (error) {
    return null;
  }
}; 