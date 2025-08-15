import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * 用户实体
 */
@Entity('users')
export class User {
  /**
   * 用户ID
   */
  @PrimaryGeneratedColumn({
    name: 'user_id',
    comment: '用户ID',
  })
  userId: number;

  /**
   * 授权登录的钱包地址
   */
  @Column({
    name: 'wallet_address',
    unique: true,
    comment: '授权登录的钱包地址',
  })
  walletAddress: string;

  /**
   * 用于身份验证的随机数
   */
  @Column({
    name: 'nonce',
    nullable: true,
    comment: '用于身份验证的随机数',
  })
  nonce: string;

  /**
   * 创建时间
   */
  @CreateDateColumn({
    name: 'created_at',
    comment: '创建时间',
  })
  createdAt: Date;

  /**
   * 更新时间
   */
  @UpdateDateColumn({
    name: 'updated_at',
    comment: '更新时间',
  })
  updatedAt: Date;
}
