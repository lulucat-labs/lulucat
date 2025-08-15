import { Module, Global } from '@nestjs/common';
import { MachineIdService } from './machine-id.service';

@Global()
@Module({
  providers: [MachineIdService],
  exports: [MachineIdService],
})
export class MachineModule {} 