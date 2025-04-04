import { DataSource } from 'typeorm';

import config from '../config/config';

export default new DataSource(config().database);
