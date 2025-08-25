import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { TokensUnwrappedStatus } from './tokens-unwrapped.const';
import { TokensUnwrappedAuditEntity } from '../tokens-unwrapped-audit/tokens-unwrapped-audit.entity';

@Entity('tokens_unwrapped')
export class TokensUnwrappedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Generated('uuid')
  @Column({ unique: true })
  paymentId: string;

  @Column({ unique: true })
  subgraphId: string;

  @Column({ unique: true })
  nonce: number;

  @Column()
  signature: string;

  @Column()
  contractAddress: string;

  @Column()
  from: string;

  @Column()
  targetTariAddress: string;

  @Column({ type: 'numeric', precision: 38, scale: 0 })
  amount: string;

  @Column()
  feePercentageBps: number;

  @Column({ type: 'numeric', precision: 38, scale: 0 })
  feeAmount: string;

  @Column({ type: 'numeric', precision: 38, scale: 0 })
  amountAfterFee: string;

  @Column({ unique: true })
  blockHash: string;

  @Column()
  blockNumber: number;

  @Column()
  blockTimestamp: Date;

  @Column({ unique: true })
  transactionHash: string;

  @Column({
    type: 'enum',
    enum: TokensUnwrappedStatus,
    default: TokensUnwrappedStatus.CREATED,
  })
  status: TokensUnwrappedStatus;

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
  isErrorNotificationSent: boolean;

  @OneToMany(() => TokensUnwrappedAuditEntity, (entity) => entity.transaction)
  audits: TokensUnwrappedAuditEntity[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
