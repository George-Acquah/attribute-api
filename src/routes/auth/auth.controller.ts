import { AuthService } from './auth.service';
import { Response } from 'express';
import { BearerToken } from 'src/shared/decorators/bearer-token.decorator';
import { CurrentUser } from 'src/shared/decorators/current-user.decorator';
import { Cookies } from 'src/shared/decorators/cookies.decorator';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CredentialsRegisterDto } from './dtos/credentials-register.dto';
import { CredentialsLoginDto } from './dtos/credentials-login.dto';
import { SessionAuthGuard } from 'src/shared/guards/session-auth.guard';
import { UnAuthorizedResponse } from 'src/shared/res/responses/unauthorized.response';
import { BadRequestResponse } from 'src/shared/res/responses/bad-request.response';
import { ApiResponse } from 'src/shared/res/api.response';
import { Throttle } from '@nestjs/throttler/dist/throttler.decorator';
import { LoginResponseDto } from './dtos/login-response.dto';
import {
  ApiCreatedResponseWithModel,
  ApiGlobalResponses,
  ApiOkResponseWithModel,
} from 'src/shared/decorators/swagger.decorator';
import { _ILoginUser } from 'src/shared/interfaces/users.interface';
import { Controller } from '@nestjs/common/decorators/core/controller.decorator';
import { UseGuards } from '@nestjs/common/decorators/core/use-guards.decorator';
import {
  Get,
  Post,
} from '@nestjs/common/decorators/http/request-mapping.decorator';
import {
  Body,
  Res,
} from '@nestjs/common/decorators/http/route-params.decorator';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';

@ApiTags('Auth')
@Controller('auth')
@ApiGlobalResponses()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle(5, 60)
  @Post('register')
  @ApiOperation({ summary: 'Register using email + password' })
  @ApiCreatedResponseWithModel(
    LoginResponseDto,
    'User registered and session created',
  )
  async register(
    @Res({ passthrough: true }) res: Response,
    @Body() body: CredentialsRegisterDto,
  ) {
    const { email, name, password } = body;
    const result = await this.authService.registerWithCredentials(
      email,
      name,
      password,
    );

    res.status(result.statusCode || 200);
    return result;
  }

  @Throttle()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Login using Firebase token or credentials' })
  @ApiOkResponseWithModel(
    LoginResponseDto,
    'User logged in and session created',
  )
  @ApiBody({ type: CredentialsLoginDto, required: false })
  @Post('login')
  async login(
    @Res({ passthrough: true }) res: Response,
    @BearerToken('Bearer') token?: string,
    @Body() body?: Partial<CredentialsLoginDto>,
  ) {
    const hasToken = typeof token === 'string' && token.trim().length > 0;
    const hasBody = !!body && Object.keys(body).length > 0;

    if (!hasToken && !hasBody)
      return new BadRequestResponse('No credentials or token provided');

    const isFirebaseLogin = !!token;

    const expiresIn = 60 * 60 * 24 * 14 * 1000;

    function setCookie(
      sessionCookie: string,
      cookieKey: 'custom_session' | 'firebase_session',
    ) {
      return res.cookie(cookieKey, sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      });
    }

    let result: ApiResponse<{ sessionCookie: string; user: _ILoginUser }>;
    if (isFirebaseLogin) {
      result = await this.authService.authenticateUser(token, expiresIn);

      if (result.statusCode === HttpStatus.OK) {
        setCookie(result.data.sessionCookie, 'firebase_session');
      }
    } else {
      if (!body?.email || !body?.password)
        return new BadRequestResponse('Email and password are required');

      result = await this.authService.loginWithCredentials(
        body.email,
        body.password,
      );

      if (result.statusCode === HttpStatus.OK && result.data?.sessionCookie) {
        setCookie(result.data.sessionCookie, 'custom_session');
      }
    }

    result.data.sessionCookie = undefined;
    res.status(result.statusCode || 200);
    return result;
  }

  @UseGuards(SessionAuthGuard)
  @Throttle()
  @ApiOkResponseWithModel(LoginResponseDto, 'Get current logged in user info')
  @ApiOperation({ summary: 'Get current logged in user info' })
  @Get('me')
  async getMe(@CurrentUser('email') email: string) {
    const result = await this.authService.getUserInfo(email);
    return result;
  }

  @UseGuards(SessionAuthGuard)
  @Throttle()
  @ApiOperation({ summary: 'Logout and clear session' })
  @ApiOkResponseWithModel(ApiResponse, 'User logged out and session cleared')
  @Post('logout')
  async logout(
    @Cookies('session') sessionCookie: _ISessionCookie,
    @CurrentUser('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!sessionCookie?.token || !sessionCookie?.type)
      return new UnAuthorizedResponse('No session cookie found');
    const result = await this.authService.revokeTokens(sessionCookie, id);

    if (sessionCookie.type === 'firebase') {
      res.clearCookie('firebase_session');
    } else {
      res.clearCookie('custom_session');
    }

    res.status(result.statusCode || 200);
    return result;
  }
}
