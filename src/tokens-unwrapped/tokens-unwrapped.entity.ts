import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

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

  @Column()
  blockNumber: number;

  @Column()
  blockTimestamp: Date;

  @Column({ unique: true })
  transactionHash: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
