import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET;
const SECRET_KEY = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: number;
  email: string;
  role: string;
}

export const generateToken = async (payload: JWTPayload): Promise<string> => {
  console.log("🔑 Génération du token JWT avec payload:", JSON.stringify(payload));
  try {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d') // Expire dans 7 jours
      .sign(SECRET_KEY);
    
    console.log("✅ Token JWT généré avec succès");
    return token;
  } catch (error) {
    console.error("❌ Erreur lors de la génération du token JWT:", error);
    if (error instanceof Error) {
      console.error("Message d'erreur:", error.message);
      console.error("Stack trace:", error.stack);
    }
    throw error;
  }
};

export const verifyToken = async (token: string): Promise<JWTPayload> => {
  console.log("🔍 Vérification du token JWT");
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    console.log("✅ Token JWT vérifié avec succès");
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error("❌ Erreur lors de la vérification du token JWT:", error);
    if (error instanceof Error) {
      console.error("Message d'erreur:", error.message);
      console.error("Stack trace:", error.stack);
    }
    throw error;
  }
}; 