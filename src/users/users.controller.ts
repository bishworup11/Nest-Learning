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
import axios from 'axios';
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

  @Get('')
  async findAll() {
    const users = await this.usersService.findAll();
    return {
      message: 'Users retrieved successfully',
      users,
    };
  }

  @Get('dummy-token')
  async dummy() {
    try {
      const response = await axios.post(
        'https://dummyjson.com/auth/login',
        {
          username: 'emilys',
          password: 'emilyspass',
          expiresInMins: 30, // optional, defaults to 60
        },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true, // Include cookies (e.g., accessToken) in the request
        },
      );

      const token = response.data;
      console.log('Token:', token);

      return {
        message: 'Users retrieved successfully Ok',
        token: token,
        note: 'This is a dummy endpoint for testing purposes',
      };
    } catch (error) {
      console.error('Error fetching token:', error);
      throw error; // or handle the error as needed
    }
  }

  @Get('appscode')
  async appscodeLogin() {
    // eslint-disable-next-line no-useless-catch
    try {
      const response = await axios.post(
        'http://bb.test:3003/accounts/user/login',
        {
          username: 'appscode',
          password: 'password',
        },
        {
          headers: { 'Content-Type': 'application/json' },
          maxRedirects: 0,
          withCredentials: true,
          validateStatus: (status) => status >= 200 && status < 400,
        },
      );

      console.log('hello');

      // // This should be an array of cookie strings
      const cookies = response.headers['set-cookie'];
      console.log('Cookies:', cookies);

      return {
        cookies,
      };
    } catch (error) {
      console.error('Error logging into Appscode:', error);
      // throw error;
    }
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
