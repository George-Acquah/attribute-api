import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { BearerToken } from 'src/shared/decorators/bearer-token.decorator';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { Cookies } from 'src/shared/decorators/cookies.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiGlobalResponses } from 'src/shared/decorators/swagger.decorator';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Auth')
@Controller('auth')
@ApiGlobalResponses()
export class AuthController {
  private logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @ApiBearerAuth()
  @Post('login')
  async login(
    @BearerToken('Bearer') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Logic for handling user login
    const expiresIn = 60 * 60 * 24 * 14 * 1000;
    const result = await this.authService.authenticateUser(token, expiresIn);

    if (result.statusCode === HttpStatus.OK) {
      res.cookie('session', result.data.sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
    }

    res.status(result.statusCode || 200);
    return result;
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  async getMe(@CurrentUser('email') email: string) {
    const result = await this.authService.getUserInfo(email);
    this.logger.log(result);
    return result;
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('logout')
  async logout(
    @Cookies('session') token: string,
    @CurrentUser('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.revokeTokens(token, id);
    res.clearCookie('session');

    res.status(result.statusCode || 200);
    return result;
  }
}
