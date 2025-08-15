import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowserContextsService } from './browser-contexts.service';
import { BrowserContextsController } from './browser-contexts.controller';
import { BrowserContext } from './entities/browser-context.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BrowserContext])],
  controllers: [BrowserContextsController],
  providers: [BrowserContextsService],
  exports: [BrowserContextsService],
})
export class BrowserContextsModule {}
