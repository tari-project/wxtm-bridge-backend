import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import config from '../config/config';

const options = config().database;
const dataSource = new DataSource(options);

@Module({
  imports: [TypeOrmModule.forRoot(options)],
})
export class DatabaseModule {}

export default dataSource;
