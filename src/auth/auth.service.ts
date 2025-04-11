import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { UserEntity } from '../user/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async findOrCreateUser(auth0Id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOneBy({ auth0Id });

    if (user) {
      return user;
    }

    return this.userRepository.save({ auth0Id });
  }
}
