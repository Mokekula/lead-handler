import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Env } from 'src/common/config/env.validation';

/**
 * Admin authentication service.
 * Validates admin password and issues JWT access tokens.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly config: ConfigService<Env, true>,
    private readonly jwtService: JwtService,
  ) {}

  async login(password: string): Promise<{ access_token: string }> {
    const adminPassword = this.config.get('ADMIN_PASSWORD');

    if (password !== adminPassword) {
      throw new UnauthorizedException('Invalid password');
    }

    const payload = { sub: 'admin' };
    const access_token = await this.jwtService.signAsync(payload);

    return { access_token };
  }
}
