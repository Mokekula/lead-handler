import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';
import { LogSeverity } from '@prisma/client';

export { LogSeverity };

export class CreateLogDto {
  @IsString()
  @IsOptional()
  message?: string;

  @IsEnum(LogSeverity)
  @IsOptional()
  severity?: LogSeverity;

  @IsInt()
  leadId: number;

  @IsString()
  @IsOptional()
  fBDataId?: string;

  @IsInt()
  @IsOptional()
  conversionEventId?: number;

  @IsString()
  @IsOptional()
  context?: string;
}
