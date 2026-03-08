import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>('roles', [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || (!user.role && !user.isAdmin)) {
            console.warn(`[RolesGuard] access denied: no user role for URL ${request.url}`);
            return false;
        }

        const userRole = (user.role || '').toUpperCase();

        // Also allow if token had isAdmin explicitly set (for legacy compatibility)
        if (user.isAdmin && requiredRoles.includes('ADMIN')) {
            return true;
        }

        const hasRole = requiredRoles.some((r) => r.toUpperCase() === userRole);
        if (!hasRole) {
            console.warn(`[RolesGuard] denied Role=${userRole} accessing ${request.url}`);
        }

        return hasRole;
    }
}
