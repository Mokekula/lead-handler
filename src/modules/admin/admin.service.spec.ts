import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { LogsService } from '../logs/logs.service';

describe('AdminService', () => {
  let service: AdminService;
  let logger: LogsService;

  // Mock implementation for LogsService
  const mockLogsService = {
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminService, { provide: LogsService, useValue: mockLogsService }],
    }).compile();

    service = module.get<AdminService>(AdminService);
    logger = module.get<LogsService>(LogsService);

    jest.clearAllMocks();
  });

  describe('toggleLeadDestination', () => {
    it('should toggle destination to elnopy', async () => {
      const toggleResult = await service.toggleLeadDestination('elnopy');
      expect(toggleResult.currentDestination).toBe('elnopy');
      expect(logger.info).toHaveBeenCalledWith('Lead destination switched to elnopy', 0, 'toggle');

      const current = await service.getCurrentLeadDestination();
      expect(current.currentDestination).toBe('elnopy');
    });

    it('should toggle destination back to robotnik', async () => {
      await service.toggleLeadDestination('elnopy');
      const toggleResult = await service.toggleLeadDestination('robotnik');
      expect(toggleResult.currentDestination).toBe('robotnik');
      expect(logger.info).toHaveBeenCalledWith(
        'Lead destination switched to robotnik',
        0,
        'toggle',
      );

      const current = await service.getCurrentLeadDestination();
      expect(current.currentDestination).toBe('robotnik');
    });
  });

  describe('getCurrentLeadDestination', () => {
    it('should return default destination as robotnik', async () => {
      const result = await service.getCurrentLeadDestination();
      expect(result.currentDestination).toBe('robotnik');
    });
  });
});
