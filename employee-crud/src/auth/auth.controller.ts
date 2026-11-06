import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { UserSession } from './auth.service';
import { LoginDto } from './dtos/login.dto';
import { AuthGuard } from './auth.guard';
import type { RequestWithUser } from './auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    const identifier = loginDto.email || loginDto.username || '';
    return this.authService.login(identifier, loginDto.password);
  }

  @Post('logout')
  logout(@Req() req: RequestWithUser) {
    const authHeader = req.headers['authorization'];
    const token =
      typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
        ? authHeader.slice(7)
        : (req.headers['x-session-id'] as string | undefined) ||
          (req.headers['token'] as string | undefined) ||
          req.user?.sessionId;

    return this.authService.logout(token ?? '');
  }

  @Get('me')
  @UseGuards(AuthGuard)
  getProfile(@Req() req: RequestWithUser) {
    return req.user;
  }
}
