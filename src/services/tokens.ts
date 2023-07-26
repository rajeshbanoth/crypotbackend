import jwt from "jsonwebtoken";

// Access token payload
export interface AccessTokenPayload {
  id: string;
  email: string;
  role: string;
}

enum TokenExpiration {
  Access = 1 * 24 * 60 * 60,
}

function signAccessToken(payload: AccessTokenPayload) {
  return jwt.sign(payload, process.env.JWT_KEY!, {
    expiresIn: TokenExpiration.Access,
  });
}

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_KEY!);
  } catch (e) {
    return null;
  }
};

export function buildTokens(user: any) {
  const accessPayload: AccessTokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
  };

  const accessToken = signAccessToken(accessPayload);

  return { accessToken };
}
