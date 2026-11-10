import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UserDto, UserMessageDto } from './dto/user-response.dto';
import { RegisterUserDto } from './dto/register-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async register(dto: RegisterUserDto): Promise<UserDto> {
    const exists = await this.users.existsBy({ displayName: dto.displayName });

    if (exists) {
      throw new ConflictException('Пользователь с таким именем уже зарегистрирован');
    }

    const user = await this.users.save(
      this.users.create({
        displayName: dto.displayName,
        password: dto.password,
      }),
    );

    return { id: user.id, displayName: user.displayName };
  }

  authenticate(): UserMessageDto {
    return { message: 'Заглушка: аутентификация появится в лабораторной работе 4' };
  }

  deauthorize(): UserMessageDto {
    return { message: 'Заглушка: деавторизация появится в лабораторной работе 4' };
  }
}
