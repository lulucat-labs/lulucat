import { PartialType } from '@nestjs/swagger';
import { CreateTaskResultDto } from './create-task-result.dto';

/**
 * 更新任务结果的DTO
 */
export class UpdateTaskResultDto extends PartialType(CreateTaskResultDto) {}
