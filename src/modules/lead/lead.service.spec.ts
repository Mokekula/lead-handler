import { Test, TestingModule } from '@nestjs/testing';
import { LeadService } from './lead.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { HashingService } from 'src/common/utils/hashing.service';
import { CrmService } from '../integrations/crm/crm.service';
import { TelegramService } from '../integrations/telegram/telegram.service';
import { FacebookService } from '../integrations/facebook/facebook.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LogsService } from '../logs/logs.service';

describe('LeadService', () => {
  let service: LeadService;
  let prisma: PrismaService;
  let hashingService: HashingService;
  let fbService: FacebookService;
  let telegramService: TelegramService;
  let crmService: CrmService;
  let logger: LogsService;

  const leadDto: Partial<CreateLeadDto> = {
    fname: 'Name',
    lname: 'Lastname',
    email: 'user@example.com',
    fullPhone: '+380991234567',
    country: 'US',
    buyer: 'buyer',
    source: 'facebook',
    funnel: 'main',
    fbToken: 'fb-token',
    pixel: 'pixel-id',
    offerId: 'offer1',
    flowId: 'flow1',
    buyerId: 'buyer1',
  };

  // Mock implementation for PrismaService
  const mockPrisma = {
    lead: {
      create: jest.fn(),
    },
  };

  // Mock implementation for LogsService
  const mockLogsService = {
    info: jest.fn(),
    error: jest.fn(),
  };

  // Mock implementation for HashingService
  const mockHashingService = {
    hash: jest.fn((s) => `hashed-${s}`),
  };

  // Mock implementation for FacebookService
  const mockFacebookService = {
    sendDataToFacebook: jest.fn(),
  };

  // Mock implementation for TelegramService
  const mockTelegramService = {
    sendTelegramNotification: jest.fn(),
  };

  // Mock implementation for CrmService
  const mockCrmService = {
    sendDataToAlter: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeadService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: LogsService, useValue: mockLogsService },
        { provide: HashingService, useValue: mockHashingService },
        { provide: FacebookService, useValue: mockFacebookService },
        { provide: TelegramService, useValue: mockTelegramService },
        { provide: CrmService, useValue: mockCrmService },
      ],
    }).compile();

    service = module.get<LeadService>(LeadService);
    prisma = module.get(PrismaService);
    hashingService = module.get(HashingService);
    fbService = module.get(FacebookService);
    telegramService = module.get(TelegramService);
    crmService = module.get(CrmService);
    logger = module.get(LogsService);

    jest.clearAllMocks();
  });

  describe('createLead', () => {
    it('should create a lead and call services', async () => {
      const createdLead = { id: 1, FBData: {}, ConversionEvent: {}, DeviceInfo: {} };
      (prisma.lead.create as jest.Mock).mockResolvedValue(createdLead);
      (crmService.sendDataToAlter as jest.Mock).mockResolvedValue('alter-url');

      const result = await service.createLead(leadDto as CreateLeadDto);

      expect(prisma.lead.create).toHaveBeenCalled();
      expect(hashingService.hash).toHaveBeenCalledWith('user@example.com');
      expect(fbService.sendDataToFacebook).toHaveBeenCalledWith(
        'Lead',
        createdLead,
        'fb-token',
        'pixel-id',
      );
      expect(telegramService.sendTelegramNotification).toHaveBeenCalledWith(createdLead, leadDto);
      expect(crmService.sendDataToAlter).toHaveBeenCalledWith(
        leadDto,
        'buyer1',
        'offer1',
        'flow1',
        1,
      );
      expect(result).toBe('alter-url');
    });

    it('should skip Telegram for test leads', async () => {
      (prisma.lead.create as jest.Mock).mockResolvedValue({
        id: 1,
        FBData: {},
        ConversionEvent: {},
        DeviceInfo: {},
      });
      (crmService.sendDataToAlter as jest.Mock).mockResolvedValue('alter-url');

      await service.createLead({ ...leadDto, fname: 'test' } as CreateLeadDto);
      expect(logger.info).toHaveBeenCalledWith(
        'Telegram notification skipped: Lead is a test lead',
        1,
        'telegram',
      );
      expect(telegramService.sendTelegramNotification).not.toHaveBeenCalled();
    });

    it('should skip Facebook when fbToken is empty', async () => {
      (prisma.lead.create as jest.Mock).mockResolvedValue({
        id: 1,
        FBData: {},
        ConversionEvent: {},
        DeviceInfo: {},
      });
      (crmService.sendDataToAlter as jest.Mock).mockResolvedValue('alter-url');

      await service.createLead({ ...leadDto, fbToken: undefined } as CreateLeadDto);

      expect(fbService.sendDataToFacebook).not.toHaveBeenCalled();
    });

    it('should skip Facebook when pixel is empty', async () => {
      (prisma.lead.create as jest.Mock).mockResolvedValue({
        id: 1,
        FBData: {},
        ConversionEvent: {},
        DeviceInfo: {},
      });
      (crmService.sendDataToAlter as jest.Mock).mockResolvedValue('alter-url');

      await service.createLead({ ...leadDto, pixel: undefined } as CreateLeadDto);

      expect(fbService.sendDataToFacebook).not.toHaveBeenCalled();
    });

    it('should catch Facebook errors', async () => {
      (prisma.lead.create as jest.Mock).mockResolvedValue({
        id: 1,
        FBData: {},
        ConversionEvent: {},
        DeviceInfo: {},
      });
      (fbService.sendDataToFacebook as jest.Mock).mockRejectedValue(new Error('FB Error'));
      (crmService.sendDataToAlter as jest.Mock).mockResolvedValue('alter-url');

      await service.createLead(leadDto as CreateLeadDto);
      expect(logger.error).toHaveBeenCalledWith(
        'Error sending data to Facebook: FB Error',
        1,
        'facebook',
      );
    });

    it('should catch Telegram errors', async () => {
      (prisma.lead.create as jest.Mock).mockResolvedValue({
        id: 1,
        FBData: {},
        ConversionEvent: {},
        DeviceInfo: {},
      });
      (telegramService.sendTelegramNotification as jest.Mock).mockRejectedValue(
        new Error('Telegram Error'),
      );
      (crmService.sendDataToAlter as jest.Mock).mockResolvedValue('alter-url');

      await service.createLead(leadDto as CreateLeadDto);
      expect(logger.error).toHaveBeenCalledWith(
        'Error sending Telegram notification: Telegram Error',
        1,
        'telegram',
      );
    });
  });
});
