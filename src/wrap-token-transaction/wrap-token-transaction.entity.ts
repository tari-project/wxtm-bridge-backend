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

import { WrapTokenTransactionStatus } from './wrap-token-transaction.const';
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

  //TODO consider deleting this field
  @Column({ type: 'numeric', precision: 38, scale: 0 })
  userProvidedTokenAmount: string;

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

  @Column({ type: 'jsonb', nullable: true })
  error: Record<string, string> | null;

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
  safeTxHash?: string;

  @Column({ nullable: true })
  safeNonce?: number;

  @Column({ nullable: true })
  tariPaymentIdHex?: string;

  @Column({ nullable: true })
  tariTxTimestamp?: number;

  @OneToMany(() => WrapTokenAuditEntity, (entity) => entity.transaction)
  audits: WrapTokenAuditEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
