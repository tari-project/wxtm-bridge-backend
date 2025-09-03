import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { TokensUnwrappedStatus } from './tokens-unwrapped.const';
import { TokensUnwrappedAuditEntity } from '../tokens-unwrapped-audit/tokens-unwrapped-audit.entity';
import { UserEntity } from '../user/user.entity';

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

  @Column({ nullable: true })
  temporaryTransactionId?: string;

  @Column({ nullable: true })
  tariTxTimestamp?: number;

  @Column({ nullable: true })
  tariBlockHeight?: number;

  @Column({ nullable: true, unique: true })
  tariPaymentReference?: string;

  @OneToMany(() => TokensUnwrappedAuditEntity, (entity) => entity.transaction)
  audits: TokensUnwrappedAuditEntity[];

  @ManyToOne(() => UserEntity, (entity) => entity.id, { nullable: true })
  @JoinColumn()
  approvingUser?: UserEntity;

  @Column({ nullable: true })
  approvingUserId?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
