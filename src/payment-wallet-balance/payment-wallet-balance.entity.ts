import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  name: 'payment_wallet_balance',
})
export class PaymentWalletBalanceEntity {
  @PrimaryColumn({ default: 1 })
  id: number = 1;

  @Column({ type: 'numeric', precision: 38, scale: 0, default: '0' })
  availableBalance: string;

  @Column({ type: 'numeric', precision: 38, scale: 0, default: '0' })
  pendingOutgoingBalance: string;

  @Column({ type: 'numeric', precision: 38, scale: 0, default: '0' })
  pendingIncomingBalance: string;

  @Column({ type: 'numeric', precision: 38, scale: 0, default: '0' })
  timelockedBalance: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
