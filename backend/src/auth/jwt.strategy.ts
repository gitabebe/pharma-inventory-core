import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      // 1. Look for the token in the "Authorization: Bearer <token>" header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 2. Use the same secret key we used to sign it
      secretOrKey: process.env.JWT_SECRET || 'MySuperSecretKey123!',
    });
  }

  // 3. If valid, this function runs and gives us the user info
  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}