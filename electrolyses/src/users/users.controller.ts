import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { UserDto, UserMessageDto } from './dto/user-response.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('registration')
  register(@Body() dto: RegisterUserDto): Promise<UserDto> {
    return this.usersService.register(dto);
  }

  @Post('authentication')
  @HttpCode(200)
  authenticate(): UserMessageDto {
    return this.usersService.authenticate();
  }

  @Post('deauthorization')
  @HttpCode(200)
  deauthorize(): UserMessageDto {
    return this.usersService.deauthorize();
  }
}
