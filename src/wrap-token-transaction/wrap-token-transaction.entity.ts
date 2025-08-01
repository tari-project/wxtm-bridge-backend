import {
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import {
  WrapTokenTransactionOrigin,
  WrapTokenTransactionStatus,
} from './wrap-token-transaction.const';
import { WrapTokenAuditEntity } from '../wrap-token-audit/wrap-token-audit.entity';

@Entity({
  name: 'wrap_token_transactions',
})
export class WrapTokenTransactionEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Generated('uuid')
  @Column({ unique: true })
  paymentId: string;

  @Column()
  from: string;

  @Column()
  to: string;

  @Column({ type: 'numeric', precision: 38, scale: 0 })
  tokenAmount: string;

  @Column({ type: 'numeric', precision: 38, scale: 0, nullable: true })
  tokenAmountInWallet?: string;

  @Column()
  feePercentageBps: number;

  @Column({ type: 'numeric', precision: 38, scale: 0 })
  feeAmount: string;

  @Column({ type: 'numeric', precision: 38, scale: 0 })
  amountAfterFee: string;

  @Column({
    type: 'enum',
    enum: WrapTokenTransactionStatus,
    default: WrapTokenTransactionStatus.CREATED,
  })
  status: WrapTokenTransactionStatus;

  @Column({
    type: 'enum',
    enum: WrapTokenTransactionOrigin,
    default: WrapTokenTransactionOrigin.BRIDGE,
  })
  origin: WrapTokenTransactionOrigin;

  @ApiProperty({
    type: 'array',
    items: {
      type: 'object',
      additionalProperties: {
        type: 'string',
      },
    },
    default: [],
  })
  @Column({ type: 'jsonb', default: [] })
  error: Record<string, string>[];

  @Column({ default: false })
  isNotificationSent: boolean;

  @ApiProperty({
    type: 'object',
    nullable: true,
    additionalProperties: {
      type: 'object',
      additionalProperties: {
        type: 'string',
      },
    },
  })
  @Column({ type: 'jsonb', nullable: true })
  debug: Record<string, Record<string, string>> | null;

  @Column({ nullable: true })
  safeAddress?: string;

  @Column({ nullable: true })
  safeTxHash?: string;

  @Column({ nullable: true })
  safeNonce?: number;

  @Column({ nullable: true })
  transactionHash?: string;

  @Column({ nullable: true })
  tariTxTimestamp?: number;

  @Column({ nullable: true })
  tariBlockHeight?: number;

  @Column({ nullable: true, unique: true })
  tariPaymentReference?: string;

  @Column({ nullable: true })
  tariUserPaymentId?: string;

  @OneToMany(() => WrapTokenAuditEntity, (entity) => entity.transaction)
  audits: WrapTokenAuditEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
