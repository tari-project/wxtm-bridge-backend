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

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
