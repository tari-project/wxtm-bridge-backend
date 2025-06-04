import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WrapTokenTransactionStatus } from '../wrap-token-transaction/wrap-token-transaction.const';
import { WrapTokenTransactionEntity } from '../wrap-token-transaction/wrap-token-transaction.entity';

@Entity({
  name: 'wrap_token_audits',
})
export class WrapTokenAuditEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  paymentId: string;

  @Column({
    type: 'enum',
    enum: WrapTokenTransactionStatus,
    nullable: true,
  })
  fromStatus?: WrapTokenTransactionStatus;

  @Column({
    type: 'enum',
    enum: WrapTokenTransactionStatus,
    nullable: true,
  })
  toStatus?: WrapTokenTransactionStatus;

  @Column({ type: 'jsonb', nullable: true })
  note?: Record<string, string>;

  @ManyToOne(() => WrapTokenTransactionEntity, (entity) => entity.audits)
  @JoinColumn()
  transaction: WrapTokenTransactionEntity;

  @Column()
  transactionId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
