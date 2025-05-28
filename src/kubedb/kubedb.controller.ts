import {
  Controller,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
} from '@nestjs/common';
import { Response } from 'express';
import axios from 'axios';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';

// Define the authenticated request interface
interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
  };
  cookies: Record<string, string>; // Include cookies if needed
}

@Controller('kubedb')
export class KubedbController {
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: AuthenticatedRequest) {
    try {
      // Convert cookies object to cookie string
      const cookieString = Object.entries(req.cookies || {})
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');

      const response = await axios.get('http://bb.test:3003/api/v1/user', {
        headers: {
          'Content-Type': 'application/json',
          ...(cookieString && { cookie: cookieString }), // Only add cookie header if there are cookies
          'x-csrf-token': req.cookies._csrf || '', // Include CSRF token if available
        },
        maxRedirects: 0,
        withCredentials: true,
        validateStatus: (status) => status >= 200 && status < 400,
      });

      return {
        message: 'Profile retrieved successfully',
        res: response.data,
        cookies: req.cookies, // Include cookies if needed
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      throw error; // Re-throw the error to be handled by global exception filter
    }
  }
}
