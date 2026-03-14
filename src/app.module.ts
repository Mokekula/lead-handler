import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LogsModule } from './logs/logs.module';
import { validate } from './common/config/env.validation';
import { HashingService } from './common/utils/hashing.service';
import { IntegrationsModule } from './modules/integrations/integrations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate,
    }),
    PrismaModule,
    LogsModule,
    IntegrationsModule,
  ],
  controllers: [AppController],
  providers: [AppService, HashingService],
})
export class AppModule {}
