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
import { InternalServerErrorResponse } from 'src/shared/res/api.response';
import { BearerToken } from 'src/shared/decorators/bearer-token.decorator';
import { FirebaseAuthGuard } from 'src/shared/guards/firebase-auth.guard';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { Cookies } from 'src/shared/decorators/cookies.decorator';

@Controller('auth')
export class AuthController {
  private logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @BearerToken('Bearer') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    // Logic for handling user login
    try {
      const result = await this.authService.verifyUser(token);

      const { sessionCookie, expiresIn } =
        await this.authService.createSessionCookie(token);

      res.cookie('session', sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });

      return res.status(result.statusCode).json(result);
    } catch (error) {
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json(new InternalServerErrorResponse());
    }
  }

  @UseGuards(FirebaseAuthGuard)
  @Get('me')
  async getMe(@CurrentUser('email') email: string, @Res() res: Response) {
    const result = await this.authService.getUserInfo(email);
    return res.status(result.statusCode).json(result);
  }

  @UseGuards(FirebaseAuthGuard)
  @Post('logout')
  async logout(
    @Cookies('session') token: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.revokeTokens(token);
    res.clearCookie('session');

    return res.status(result.statusCode).json(result);
  }
}
