import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AccountGroupItem } from '../../account-groups/entities/account-group-item.entity';

@Entity('browser_contexts')
export class BrowserContext {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'account_group_item_id', nullable: true })
  accountGroupItemId: number;

  @ManyToOne(() => AccountGroupItem, { nullable: true })
  @JoinColumn({ name: 'account_group_item_id' })
  accountGroupItem: AccountGroupItem;

  @Column({ type: 'json', nullable: true })
  state: Record<string, any>;

  @Column({ name: 'last_used_at', type: 'datetime', nullable: true })
  lastUsedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
