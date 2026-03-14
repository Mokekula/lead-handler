import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { FacebookService } from './facebook.service';
import { LogsService } from 'src/logs/logs.service';

// Mock the entire axios module
jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('FacebookService', () => {
  let service: FacebookService;
  let logsService: LogsService;

  // Mock implementation for LogsService
  const mockLogsService = {
    info: jest.fn(),
    error: jest.fn(),
  };

  // Mock data for a valid Lead
  const mockLead = {
    id: 1,
    FBData: {
      id: 'fbdata_1',
      em: 'hash_email',
      ph: 'hash_phone',
      external_id: '1',
      client_ip_address: '127.0.0.1',
      client_user_agent: 'Mozilla',
    },
    ConversionEvent: {
      id: 10,
      currency: 'USD',
      value: 100,
      content_name: 'lead',
      content_category: 'form',
      content_type: 'lead',
      createdAt: new Date(),
    },
  };

  const fbToken = 'test_token';
  const fbPixel = '123456';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FacebookService, { provide: LogsService, useValue: mockLogsService }],
    }).compile();

    service = module.get<FacebookService>(FacebookService);
    logsService = module.get<LogsService>(LogsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendDataToFacebook', () => {
    it('should send event successfully', async () => {
      mockedAxios.mockResolvedValueOnce({
        data: { events_received: 1 },
      });

      const result = await service.sendDataToFacebook('Lead', mockLead, fbToken, fbPixel);

      expect(mockedAxios).toHaveBeenCalledTimes(1);

      expect(result).toEqual({ events_received: 1 });

      expect(mockLogsService.info).toHaveBeenCalled();
    });

    it('should return null if token or pixel missing', async () => {
      const result = await service.sendDataToFacebook('Lead', mockLead, '', '');

      expect(result).toBeNull();
      expect(mockedAxios).not.toHaveBeenCalled();
    });

    it('should retry on server error', async () => {
      mockedAxios
        .mockRejectedValueOnce({
          response: { status: 500, data: { error: 'server error' } },
        })
        .mockResolvedValueOnce({
          data: { success: true },
        });

      const result = await service.sendDataToFacebook('Lead', mockLead, fbToken, fbPixel);

      expect(mockedAxios).toHaveBeenCalledTimes(2);
      expect(result).toEqual({ success: true });

      expect(mockLogsService.error).toHaveBeenCalled();
    });

    it('should stop retrying on 4xx error', async () => {
      mockedAxios.mockRejectedValueOnce({
        response: { status: 400, data: { error: 'bad request' } },
      });

      await expect(
        service.sendDataToFacebook('Lead', mockLead, fbToken, fbPixel),
      ).rejects.toBeDefined();

      expect(mockedAxios).toHaveBeenCalledTimes(1);
    });

    it('should throw after max retry attempts', async () => {
      mockedAxios.mockRejectedValue({
        response: { status: 500, data: { error: 'server error' } },
      });

      await expect(
        service.sendDataToFacebook('Lead', mockLead, fbToken, fbPixel),
      ).rejects.toBeDefined();

      expect(mockedAxios).toHaveBeenCalledTimes(3);
    });
  });
});
