import { IsNotEmpty, IsString } from 'class-validator';

export class ConditionDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  operator: string;

  @IsNotEmpty()
  value: any;

  @IsString()
  @IsNotEmpty()
  type: string; // 'string' | 'number' | 'boolean'
}
