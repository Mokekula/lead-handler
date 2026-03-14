import { Test, TestingModule } from '@nestjs/testing';
import { HashingService } from './hashing.service';

describe('HashingService', () => {
  let service: HashingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HashingService],
    }).compile();

    service = module.get<HashingService>(HashingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('hash method should generate EXACTLY the same SHA-256 hash as expected', () => {
    const testCases = [
      ['', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'],
      ['vlasnyk', 'f751724b55552662bc87514ef94514db45fb11efdf50529d1d8a8d05f515bafd'],
      ['test.user@example.com', 'a97d7a4513204a9cc7cb2f11d72d41a59b18d1ba633d22e58d53c625518f5203'],
      ['+380991234567', 'bf36d1c5bb257e399b2d784faa01ac859c13caf44814a65ca99722439495a7f8'],
      [
        'A very long string that is guaranteed to exceed the size of a single 512-bit (64-byte) block for the SHA-256 algorithm in order to verify the correct processing of multiple data chunks.',
        'e0307e8489cf9f0fecf5df35edc3799109749e44422e3c5c9222cd9e246c3094',
      ],
    ];

    for (const [testCase, expectedHash] of testCases) {
      const newHash = service.hash(testCase);

      expect(newHash).toEqual(expectedHash);
    }
  });
});
