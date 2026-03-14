import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { validate } from './common/config/env.validation';
import { HashingService } from './common/utils/hashing.service';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { LeadModule } from './modules/lead/lead.module';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { LogsModule } from './modules/logs/logs.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    PrismaModule,
    AuthModule,
    LogsModule,
    IntegrationsModule,
    LeadModule,
    AdminModule,
  ],
})
export class AppModule {}
