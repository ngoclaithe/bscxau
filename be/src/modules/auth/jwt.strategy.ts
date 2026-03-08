import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(configService: ConfigService) {
        super({
            jwtFromRequest: (req) => {
                let token = null;
                if (req && req.cookies) {
                    token = req.cookies['admin_access_token'] || req.cookies['access_token'];
                    console.log('[JwtStrategy] Found token in cookies:', token ? 'YES' : 'NO',
                        req.cookies['admin_access_token'] ? '(admin_access_token)' : '(access_token)');
                }
                if (!token && req && req.headers && req.headers.authorization) {
                    const parts = req.headers.authorization.split(' ');
                    if (parts.length === 2 && parts[0] === 'Bearer') {
                        token = parts[1];
                    }
                }
                return token;
            },
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
        });
    }

    async validate(payload: any) {
        console.log('[JwtStrategy] Validating payload:', payload);
        return {
            userId: payload.sub,
            email: payload.email,
            role: payload.role || (payload.isAdmin ? 'ADMIN' : 'USER'),
            isAdmin: payload.isAdmin || payload.role === 'ADMIN'
        };
    }
}
