import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrowserFingerprintsService } from './browser-fingerprints.service';
import { BrowserFingerprintsController } from './browser-fingerprints.controller';
import { BrowserFingerprint } from './entities/browser-fingerprint.entity';
import { AccountGroupsModule } from '../account-groups/account-groups.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([BrowserFingerprint]),
    AccountGroupsModule,
  ],
  controllers: [BrowserFingerprintsController],
  providers: [BrowserFingerprintsService],
  exports: [BrowserFingerprintsService],
})
export class BrowserFingerprintsModule {}
