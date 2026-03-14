import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('signed-jwt-token'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('admin123'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue('admin123');
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should return access_token for correct password', async () => {
      const result = await service.login('admin123');

      expect(result).toEqual({ access_token: 'signed-jwt-token' });
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({ sub: 'admin' });
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      await expect(service.login('wrong-password')).rejects.toThrow(UnauthorizedException);

      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for empty password', async () => {
      await expect(service.login('')).rejects.toThrow(UnauthorizedException);
    });
  });
});
