import { Injectable, OnModuleInit } from '@nestjs/common';
import { machineIdSync } from 'node-machine-id';

@Injectable()
export class MachineIdService implements OnModuleInit {
  private machineId: string;

  onModuleInit() {
    this.machineId = this.getMachineId();
  }

  /**
   * 获取硬件ID
   * @returns 硬件唯一标识
   */
  getMachineId(): string {
    if (!this.machineId) {
      try {
        this.machineId = machineIdSync(true);
      } catch (error) {
        console.error('获取硬件ID失败:', error);
        // 生成一个随机ID作为备用
        this.machineId = `fallback-${Math.random().toString(36).substring(2, 15)}`;
      }
    }
    return this.machineId;
  }
} 