import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('tokens_unwrapped')
export class TokensUnwrappedEntity {
  @PrimaryColumn()
  id: string;

  @Column()
  from: string;

  @Column()
  targetTariAddress: string;

  @Column()
  amount: string;

  @Column()
  blockNumber: string;

  @Column()
  blockTimestamp: string;

  @Column()
  transactionHash: string;
}
