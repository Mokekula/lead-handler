import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {PrismaModule} from './prisma/prisma.module';
import {LogsModule} from "./logs/logs.module";


@Module({
    imports: [PrismaModule, LogsModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
