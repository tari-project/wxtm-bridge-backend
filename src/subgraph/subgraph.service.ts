import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from '../user/user.entity';

@Injectable()
export class SubgraphService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async onEventReceived(): Promise<UserEntity[]> {
    //TODO delete all implemetation
    console.log('lambda is running', new Date());

    const users = await this.userRepository.find();
    console.log('users', users);

    return users;
  }
}
