import { Module } from '@nestjs/common';
import { LogsService } from './logs.service';
import { PrismaModule } from '../prisma/prisma.module';
import { LogsController } from './logs.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LogsController],
  providers: [LogsService],
  exports: [LogsService],
})
export class LogsModule {}
