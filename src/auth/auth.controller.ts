import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Request,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt.guard';

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

interface CookieOptions {
  maxAge?: number;
  expires?: Date;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.register(registerDto);

    // Set cookie for register as well
    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Dynamic based on environment
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    return {
      message: 'Registration successful',
      user: result.user,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.login(loginDto);
    const appscodetoken = await this.authService.appscodeLogin();
    // Set cookie with proper security options
    response.cookie('access_token', result.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'lax', // CSRF protection
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });

    // Parse and set each cookie from appscodetoken.cookies
    appscodetoken?.cookies?.forEach((cookieString) => {
      console.log('Cookie String:', cookieString);
      // Parse the cookie string into its components
      const [cookiePart, ...optionParts] = cookieString
        .split(';')
        .map((part) => part.trim());
      const [name, value] = cookiePart.split('=');

      // Extract options from the cookie string
      const options: CookieOptions = {};
      optionParts.forEach((part) => {
        const [key, val] = part.split('=');
        if (key.toLowerCase() === 'max-age') {
          options.maxAge = parseInt(val, 10) * 1000; // Convert to milliseconds
        } else if (key.toLowerCase() === 'expires') {
          options.expires = new Date(val);
        } else if (key.toLowerCase() === 'domain') {
          // options.domain = val;
        } else if (key.toLowerCase() === 'path') {
          options.path = val;
        } else if (key.toLowerCase() === 'secure') {
          options.secure = true;
        } else if (key.toLowerCase() === 'httponly') {
          options.httpOnly = true;
        }
      });

      // Set the cookie
      console.log('Setting Cookie:', name, value, options);
      response.cookie(name, value, options);
    });

    return {
      message: 'Login successful and cookie set',
      user: result.user,
      appscodetoken: appscodetoken,
      access_token: result.access_token, // Return token for client-side use
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  logout(@Res({ passthrough: true }) response: Response) {
    // Clear the cookie properly
    response.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return {
      message: 'Logged out successfully',
      success: true,
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Request() req: AuthenticatedRequest) {
    return {
      message: 'Profile retrieved successfully',
      user: req.user,
      cookies: req.cookies, // Include cookies if needed
    };
  }

  // Additional useful endpoints
  @Get('check')
  @UseGuards(JwtAuthGuard)
  checkAuth(@Request() req: AuthenticatedRequest) {
    return {
      authenticated: true,
      user: req.user,
    };
  }

  // @Post('refresh')
  // @UseGuards(JwtAuthGuard)
  // async refreshToken(
  //   @Request() req: AuthenticatedRequest,
  //   @Res({ passthrough: true }) response: Response,
  // ) {
  //   // Generate new token for the current user
  //   const result = await this.authService.generateTokenForUser(req.user.id);

  //   // Set new cookie
  //   response.cookie('access_token', result.access_token, {
  //     httpOnly: true,
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: 'lax',
  //     maxAge: 24 * 60 * 60 * 1000, // 24 hours
  //     path: '/',
  //   });

  //   return {
  //     message: 'Token refreshed successfully',
  //     user: req.user,
  //   };
  // }
}
