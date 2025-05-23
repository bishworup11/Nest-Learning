import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
}

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      message: 'Users retrieved successfully',
      users,
    };
  }

  @Get('me')
  async getMyProfile(@Request() req: AuthenticatedRequest) {
    const user = await this.usersService.getProfile(req.user.id);
    return {
      message: 'Profile retrieved successfully',
      user,
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.usersService.findOne(id);
    return {
      message: 'User retrieved successfully',
      user,
    };
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
