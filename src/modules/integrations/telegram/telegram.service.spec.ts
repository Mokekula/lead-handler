import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { TelegramService } from './telegram.service';
import { LogsService } from 'src/logs/logs.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { Lead } from '@prisma/client';

// Mock the entire axios module
jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('TelegramService', () => {
  let service: TelegramService;
  let logsService: LogsService;
  let configService: ConfigService;

  // Mock data for a valid Lead
  const mockLead: Lead = {
    id: 1,
    fb_token: null,
    pixel: null,
    link_id: null,
    api_token: null,
    fullPhone: '+380991234567',
    funnel: 'main',
    offerId: null,
    flowId: null,
    buyerId: null,
    source: 'facebook',
    fname: 'Name',
    lname: 'Lastname',
    email: 'user@example.com',
    ip: null,
    buyer: 'buyer',
    domain: null,
    country: 'US',
    iso: null,
    language: null,
    utm_source: null,
    clickid: null,
    utm_campaign: null,
    utm_content: null,
    adsetName: null,
    adName: null,
    deviceInfoId: null,
  } as Lead;

  const mockCreateLeadDto = {
    fname: 'Name',
    lname: 'Lastname',
    email: 'user@example.com',
    fullPhone: '+380991234567',
    country: 'US',
    buyer: 'buyer',
    funnel: 'main',
    source: 'facebook',
    utmSource: 'utm_source',
    utmCampaign: 'utm_campaign',
  };

  // Mock implementation for PrismaService
  const mockPrisma = {
    telegramSubscriber: {
      upsert: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
    },
  };

  // Mock implementation for LogsService
  const mockLogsService = {
    info: jest.fn(),
    error: jest.fn(),
  };

  // Mock implementation for ConfigService
  const mockConfigService = {
    get: jest.fn(() => 'test-bot-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TelegramService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: LogsService, useValue: mockLogsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TelegramService>(TelegramService);
    logsService = module.get<LogsService>(LogsService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('addTelegramSubscriber', () => {
    it('should upsert subscriber', async () => {
      mockPrisma.telegramSubscriber.upsert.mockResolvedValue({ chatId: '1' });

      const result = await service.addTelegramSubscriber('1', 'Name');

      expect(mockPrisma.telegramSubscriber.upsert).toHaveBeenCalled();
      expect(result).toEqual({ chatId: '1' });
    });
  });

  describe('removeTelegramSubscriber', () => {
    it('should deactivate subscriber', async () => {
      mockPrisma.telegramSubscriber.update.mockResolvedValue({ chatId: '1' });

      const result = await service.removeTelegramSubscriber('1');

      expect(mockPrisma.telegramSubscriber.update).toHaveBeenCalled();
      expect(result).toEqual({ chatId: '1' });
    });
  });

  describe('getActiveTelegramSubscribers', () => {
    it('should return active subscribers', async () => {
      mockPrisma.telegramSubscriber.findMany.mockResolvedValue([{ chatId: '1' }]);

      const result = await service.getActiveTelegramSubscribers();

      expect(mockPrisma.telegramSubscriber.findMany).toHaveBeenCalled();
      expect(result).toEqual([{ chatId: '1' }]);
    });
  });

  describe('sendTelegramNotification', () => {
    it('should skip if token missing', async () => {
      mockConfigService.get.mockReturnValueOnce(null);

      const module = await Test.createTestingModule({
        providers: [
          TelegramService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: LogsService, useValue: mockLogsService },
          { provide: ConfigService, useValue: mockConfigService },
        ],
      }).compile();

      const serviceNoToken = module.get<TelegramService>(TelegramService);

      await serviceNoToken.sendTelegramNotification(mockLead, mockCreateLeadDto as any);

      expect(mockLogsService.info).toHaveBeenCalledWith(
        'Telegram notification skipped: Missing bot token',
        mockLead.id,
        'telegram',
      );
    });

    it('should skip if no subscribers', async () => {
      mockPrisma.telegramSubscriber.findMany.mockResolvedValue([]);

      await service.sendTelegramNotification(mockLead, mockCreateLeadDto as any);

      expect(mockLogsService.info).toHaveBeenCalledWith(
        'Telegram notification skipped: No active subscribers',
        mockLead.id,
        'telegram',
      );

      expect(mockedAxios).not.toHaveBeenCalled();
    });

    it('should send notifications', async () => {
      mockPrisma.telegramSubscriber.findMany.mockResolvedValue([{ chatId: '1' }, { chatId: '2' }]);

      mockedAxios.mockResolvedValue({});

      await service.sendTelegramNotification(mockLead, mockCreateLeadDto as any);

      expect(mockedAxios).toHaveBeenCalledTimes(2);

      expect(mockLogsService.info).toHaveBeenCalledWith(
        expect.stringContaining('Telegram notifications summary'),
        mockLead.id,
        'telegram',
      );
    });

    it('should handle failed subscriber', async () => {
      mockPrisma.telegramSubscriber.findMany.mockResolvedValue([{ chatId: '1' }, { chatId: '2' }]);

      mockedAxios.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('telegram error'));

      await service.sendTelegramNotification(mockLead, mockCreateLeadDto as any);

      expect(mockLogsService.error).toHaveBeenCalled();
    });
  });
});
