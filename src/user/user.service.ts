import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { UserEntity } from './user.entity';
import { TypeOrmCrudService } from '@dataui/crud-typeorm';
import { GetMeRespDTO } from './user.dto';
import { ExceptionsMessages } from '../consts/exceptions-messages';

@Injectable()
export class UserService extends TypeOrmCrudService<UserEntity> {
  constructor(
    @InjectRepository(UserEntity)
    repo: Repository<UserEntity>,
  ) {
    super(repo);
  }

  private async resolveUser(userId: number): Promise<UserEntity> {
    const user = await this.repo.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(ExceptionsMessages.USER_NOT_FOUND);
    }
    return user;
  }

  async getMe(userId: number): Promise<GetMeRespDTO> {
    const user = await this.resolveUser(userId);

    return {
      isAdmin: user.isAdmin,
    };
  }
}
