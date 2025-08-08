import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { ServiceStatus } from './settings.const';

@Entity({
  name: 'settings',
})
export class SettingsEntity {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number = 1;

  @Column({
    type: 'enum',
    enum: ServiceStatus,
    default: ServiceStatus.ONLINE,
  })
  wrapTokensServiceStatus: ServiceStatus;

  @Column({
    type: 'int',
    default: 50,
  })
  maxBatchSize: number;

  @Column({
    type: 'int',
    default: 21_600_000, // 6 hours in ms
  })
  maxBatchAgeMs: number;

  @Column({
    type: 'numeric',
    precision: 38,
    scale: 0,
    default: '20000000000000000000000', // 20_000 tokens
  })
  batchAmountThreshold: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
