import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { WrapTokenTransactionStatus } from './wrap-token-transaction.const';

@Entity({
  name: 'wrap_token_transactions',
})
export class WrapTokenTransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Generated('uuid')
  paymentId: string;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column({ type: 'numeric', precision: 38, scale: 0 })
  tokenAmount: string;

  @Column({
    type: 'enum',
    enum: WrapTokenTransactionStatus,
    default: WrapTokenTransactionStatus.CREATED,
  })
  status: WrapTokenTransactionStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
