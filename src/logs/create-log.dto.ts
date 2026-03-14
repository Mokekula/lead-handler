import { IsString, IsOptional, IsEnum, IsInt } from 'class-validator';

export enum LogSeverity {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

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
