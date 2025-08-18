import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TokensUnwrappedStatus } from './tokens-unwrapped.const';

@Entity('tokens_unwrapped')
export class TokensUnwrappedEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'integer' })
  subgraphId: number;

  @Column()
  from: string;

  @Column()
  targetTariAddress: string;

  @Column({ type: 'numeric', precision: 38, scale: 0 })
  amount: string;

  @Column({ type: 'numeric', precision: 38, scale: 0 })
  nonce: string;

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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
