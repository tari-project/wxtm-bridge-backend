import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { TokensUnwrappedStatus } from '../tokens-unwrapped/tokens-unwrapped.const';
import { TokensUnwrappedEntity } from '../tokens-unwrapped/tokens-unwrapped.entity';

@Entity({
  name: 'tokens_unwrapped_audits',
})
export class TokensUnwrappedAuditEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid' })
  paymentId: string;

  @Column({
    type: 'enum',
    enum: TokensUnwrappedStatus,
    nullable: true,
  })
  fromStatus?: TokensUnwrappedStatus;

  @Column({
    type: 'enum',
    enum: TokensUnwrappedStatus,
    nullable: true,
  })
  toStatus?: TokensUnwrappedStatus;

  @Column({ type: 'jsonb', nullable: true })
  note?: Record<string, string>;

  @ManyToOne(() => TokensUnwrappedEntity, (entity) => entity.audits)
  @JoinColumn()
  transaction: TokensUnwrappedEntity;

  @Column()
  transactionId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
