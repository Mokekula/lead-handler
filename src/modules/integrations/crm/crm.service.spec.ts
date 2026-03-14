import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { CrmService } from './crm.service';
import { LogsService } from 'src/logs/logs.service';
import { ConfigService } from '@nestjs/config';
import { CreateLeadDto } from 'src/modules/lead/dto/create-lead.dto';

jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('CrmService', () => {
  let service: CrmService;

  const mockCreateLeadDto: Partial<CreateLeadDto> = {
    fname: 'Name',
    lname: 'Lastname',
    email: 'user@example.com',
    fullPhone: '+123456789',
    country: 'US',
    iso: 'US',
    language: 'en',
    buyer: 'buyer',
    source: 'facebook',
    clickid: 'click123',
    funnel: 'main',
    domain: 'domain.com',
    adsetName: 'adset',
    adName: 'ad',
    utmSource: 'utm_source',
    utmCampaign: 'utm_campaign',
    utmContent: 'utm_content',
    externalId: 'ext123',
    deviceType: 'mobile',
    userAgent: 'ua',
    ip: '127.0.0.1',
  };

  // Mock implementation for LogsService
  const mockLogsService = {
    info: jest.fn(),
    error: jest.fn(),
  };

  // Mock implementation for ConfigService
  const mockConfigService = {
    get: jest.fn(() => 'http://mock-url'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CrmService,
        { provide: LogsService, useValue: mockLogsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CrmService>(CrmService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendDataToRobotnikToggler', () => {
    it('should log sending when send=true', async () => {
      await service.sendDataToRobotnikToggler(true);
      expect(mockLogsService.info).toHaveBeenCalledWith(
        'Sending data to Robotnik',
        0o7,
        'robotnik',
      );
    });

    it('should log not sending when send=false', async () => {
      await service.sendDataToRobotnikToggler(false);
      expect(mockLogsService.info).toHaveBeenCalledWith(
        'Not sending data to Robotnik',
        0o7,
        'robotnik',
      );
    });
  });

  describe('sendToRobotnik', () => {
    it('should return autologin on success', async () => {
      mockedAxios.mockResolvedValue({
        data: { data: { createLeadFromApi: { autologin: 'autologin-url' } } },
      });

      const result = await service.sendToRobotnik(mockCreateLeadDto, 1);
      expect(result).toBe('autologin-url');
      expect(mockLogsService.info).toHaveBeenCalled();
    });

    it('should return google.com if autologin missing', async () => {
      mockedAxios.mockResolvedValue({
        data: { data: { createLeadFromApi: { autologin: null } } },
      });

      const result = await service.sendToRobotnik(mockCreateLeadDto, 1);
      expect(result).toBe('https://google.com');
    });

    it('should log error if API returns errors', async () => {
      mockedAxios.mockResolvedValue({
        data: { errors: [{ message: 'Some error' }] },
      });

      const result = await service.sendToRobotnik(mockCreateLeadDto, 1);
      expect(result).toBe('Some error');
      expect(mockLogsService.error).toHaveBeenCalledWith(
        'Error sending data to Robotnik: Some error',
        1,
        'robotnik',
      );
    });

    it('should catch network errors', async () => {
      mockedAxios.mockRejectedValue(new Error('Network Error'));

      const result = await service.sendToRobotnik(mockCreateLeadDto, 1);
      expect(result).toBe('Something went wrong, please try again later');
      expect(mockLogsService.error).toHaveBeenCalled();
    });
  });

  describe('sendDataToElnopy', () => {
    it('should return autologin on success', async () => {
      mockedAxios.mockResolvedValue({ data: { success: true, autologin: 'elnopy-url' } });

      const result = await service.sendDataToElnopy(mockCreateLeadDto, 'link1', 'token1', 1);
      expect(result).toBe('elnopy-url');
      expect(mockLogsService.info).toHaveBeenCalled();
    });

    it('should return google.com if autologin missing', async () => {
      mockedAxios.mockResolvedValue({ data: { success: true, autologin: null } });

      const result = await service.sendDataToElnopy(mockCreateLeadDto, 'link1', 'token1', 1);
      expect(result).toBe('https://google.com');
    });

    it('should throw error if API says phone not valid', async () => {
      mockedAxios.mockResolvedValue({
        data: { success: false, message: 'Phone number not valid!' },
      });

      await expect(
        service.sendDataToElnopy(mockCreateLeadDto, 'link1', 'token1', 1),
      ).rejects.toThrow('Phone number not valid!');
    });

    it('should throw on axios error', async () => {
      mockedAxios.mockRejectedValue({ message: 'Axios failed' });

      await expect(
        service.sendDataToElnopy(mockCreateLeadDto, 'link1', 'token1', 1),
      ).rejects.toThrow('Axios failed');
      expect(mockLogsService.error).toHaveBeenCalled();
    });
  });

  describe('sendDataToAlter', () => {
    it('should return response url if status ok', async () => {
      mockedAxios.mockResolvedValue({ data: { status: 'ok', url: 'alter-url' } });

      const result = await service.sendDataToAlter(
        mockCreateLeadDto,
        'buyer1',
        'offer1',
        'flow1',
        1,
      );
      expect(result).toBe('alter-url');
      expect(mockLogsService.info).toHaveBeenCalled();
    });

    it('should return google.com if url missing', async () => {
      mockedAxios.mockResolvedValue({ data: { status: 'ok' } });

      const result = await service.sendDataToAlter(
        mockCreateLeadDto,
        'buyer1',
        'offer1',
        'flow1',
        1,
      );
      expect(result).toBe('https://google.com');
    });

    it('should log error and return error string if status not ok', async () => {
      mockedAxios.mockResolvedValue({ data: { status: 'fail', error: 'fail-error' } });

      const result = await service.sendDataToAlter(
        mockCreateLeadDto,
        'buyer1',
        'offer1',
        'flow1',
        1,
      );
      expect(result).toBe('fail-error');
      expect(mockLogsService.error).toHaveBeenCalled();
    });

    it('should throw on axios error', async () => {
      mockedAxios.mockRejectedValue(new Error('Network fail'));

      await expect(
        service.sendDataToAlter(mockCreateLeadDto, 'buyer1', 'offer1', 'flow1', 1),
      ).rejects.toThrow('Network fail');
      expect(mockLogsService.error).toHaveBeenCalled();
    });
  });
});
