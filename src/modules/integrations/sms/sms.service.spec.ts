import axios from 'axios';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { SmsService } from './sms.service';
import { Lead } from '@prisma/client';
import { LogsService } from 'src/logs/logs.service';

// Mock the entire axios module
jest.mock('axios');
const mockedAxios = axios as jest.MockedFunction<typeof axios>;

describe('SmsService', () => {
  let service: SmsService;

  // Mock data for a valid Lead
  const mockLead: Partial<Lead> = {
    id: 1,
    email: 'user@example.com',
    fullPhone: '+380991234567',
  };

  // Mock implementation for LogsService
  const mockLogsService = {
    info: jest.fn(),
    error: jest.fn(),
  };

  // Mock implementation for ConfigService
  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'SMSCLUB_API_KEY') {
        return 'test-api-key';
      }
      return null;
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmsService,
        { provide: LogsService, useValue: mockLogsService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SmsService>(SmsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('sendSmsNotification', () => {
    it('should successfully send SMS and log info for a valid lead', async () => {
      mockedAxios.mockResolvedValueOnce({ status: 200 });

      await service.sendSmsNotification(mockLead as Lead);

      expect(mockedAxios).toHaveBeenCalledTimes(1);
      expect(mockedAxios).toHaveBeenCalledWith({
        method: 'POST',
        url: 'https://im.smsclub.mobi/sms/send',
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer test-api-key',
        },
        data: {
          src_addr: 'Vebinar',
          phone: [mockLead.fullPhone],
          message:
            'Ihre Anmeldung wurde erfolgreich bestätigt! Wir werden Sie in Kürze kontaktieren, um alle Details zu besprechen und Ihre Fragen zu beantworten.',
        },
      });
      expect(mockLogsService.info).toHaveBeenCalledWith(
        'SMS sent successfully',
        mockLead.id,
        'sms',
      );
      expect(mockLogsService.error).not.toHaveBeenCalled();
    });

    it('should not send SMS if the lead email contains "test"', async () => {
      const testLead = { ...mockLead, email: 'test.user@example.com' };

      await service.sendSmsNotification(testLead as Lead);

      expect(mockedAxios).not.toHaveBeenCalled();
      expect(mockLogsService.info).not.toHaveBeenCalled();
      expect(mockLogsService.error).not.toHaveBeenCalled();
    });

    it('should not send SMS if the lead does not have a fullPhone', async () => {
      const testLead = { ...mockLead, fullPhone: null };

      await service.sendSmsNotification(testLead as Lead);

      expect(mockedAxios).not.toHaveBeenCalled();
      expect(mockLogsService.info).not.toHaveBeenCalled();
      expect(mockLogsService.error).not.toHaveBeenCalled();
    });

    it('should log an error if the SMS API responds with a status other than 200', async () => {
      mockedAxios.mockResolvedValueOnce({
        status: 400,
        statusText: 'Bad Request',
      });

      await service.sendSmsNotification(mockLead as Lead);

      expect(mockedAxios).toHaveBeenCalledTimes(1);
      expect(mockLogsService.error).toHaveBeenCalledWith(
        'SMS sending failed: Bad Request',
        mockLead.id,
        'sms',
      );
      expect(mockLogsService.info).not.toHaveBeenCalled();
    });

    it('should log an error if an exception is thrown during the request', async () => {
      mockedAxios.mockRejectedValueOnce(new Error('Network Error'));

      await service.sendSmsNotification(mockLead as Lead);

      expect(mockedAxios).toHaveBeenCalledTimes(1);
      expect(mockLogsService.error).toHaveBeenCalledWith(
        'SMS sending error: Network Error',
        mockLead.id,
        'sms',
      );
      expect(mockLogsService.info).not.toHaveBeenCalled();
    });
  });
});
