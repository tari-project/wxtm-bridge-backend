import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventBridgeEvent } from 'aws-lambda';

import { UserEntity } from '../user/user.entity';

@Injectable()
export class SubgraphService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async onEventReceived(
    event: EventBridgeEvent<any, any>,
  ): Promise<UserEntity[]> {
    //TODO delete all implemetation
    console.log('SubgraphService.onEventReceived', { event });

    const users = await this.userRepository.find();
    console.log('users', users);

    return users;
  }
}
