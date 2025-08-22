import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

import { TokensUnwrappedStatus } from './tokens-unwrapped.const';

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
  from: string;

  @Column()
  targetTariAddress: string;

  @Column({ type: 'numeric', precision: 38, scale: 0 })
  amount: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
