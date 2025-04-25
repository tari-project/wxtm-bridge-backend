import {
  Column,
  Entity,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('tokens_unwrapped')
export class TokensUnwrappedEntity {
  @PrimaryColumn({ type: 'integer' })
  id: number;

  @Column()
  from: string;

  @Column()
  targetTariAddress: string;

  @Column({ type: 'numeric', precision: 38, scale: 0 })
  amount: string;

  @Column({ unique: true })
  blockNumber: number;

  @Column()
  blockTimestamp: Date;

  @Column()
  transactionHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
