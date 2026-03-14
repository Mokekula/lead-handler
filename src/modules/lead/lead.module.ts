import { Module } from '@nestjs/common';
import { LeadService } from './lead.service';
import { IntegrationsModule } from '../integrations/integrations.module';
import { LeadController } from './lead.controller';
import { HashingService } from 'src/common/utils/hashing.service';

@Module({
  imports: [IntegrationsModule],
  controllers: [LeadController],
  providers: [LeadService, HashingService],
  exports: [LeadService],
})
export class LeadModule {}
