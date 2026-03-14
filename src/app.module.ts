import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { LogsModule } from './logs/logs.module';
import { validate } from './common/config/env.validation';
import { HashingService } from './common/utils/hashing.service';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { LeadModule } from './modules/lead/lead.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    PrismaModule,
    LogsModule,
    IntegrationsModule,
    LeadModule,
    AdminModule,
  ],
})
export class AppModule {}
