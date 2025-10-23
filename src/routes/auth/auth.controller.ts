import { AuthService } from './auth.service';
import { Response, Request } from 'express';
import { BearerToken } from 'src/shared/decorators/bearer-token.decorator';
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
  Req,
} from '@nestjs/common/decorators/http/route-params.decorator';
import { HttpStatus } from '@nestjs/common/enums/http-status.enum';
import { Session } from 'src/shared/decorators/session.decorator';

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
    @Req() req: Request, // <-- ADDED: Inject Request object to check headers
    @BearerToken('Bearer') token?: string,
    @Body() body?: Partial<CredentialsLoginDto>,
  ) {
    const hasToken = typeof token === 'string' && token.trim().length > 0;
    const hasBody = !!body && Object.keys(body).length > 0;

    if (!hasToken && !hasBody)
      return new BadRequestResponse('No credentials or token provided');

    const isFirebaseLogin = !!token;

      // --- START OF FIX: Determine if the request is from a local development environment ---
  const requestOrigin = req.headers.origin || req.headers.host || '';
  const isLocalhostRequest = requestOrigin.includes('localhost') || requestOrigin.includes('127.0.0.1');

  // Determine cookie security flags:
  // secure should be TRUE only if it's PROD AND not localhost.
  const isSecure = process.env.NODE_ENV === 'production' && !isLocalhostRequest;
  
  // sameSite should be 'none' only if it's PROD AND secure is TRUE. Otherwise, use 'lax' for local safety.
  const sameSiteMode = isSecure ? 'none' : 'lax';
  // --- END OF FIX ---

    const expiresIn = 60 * 60 * 24 * 14 * 1000;

    function setCookie(
      sessionCookie: string,
      cookieKey: 'custom_session' | 'firebase_session',
    ) {
      return res.cookie(cookieKey, sessionCookie, {
        maxAge: expiresIn,
        httpOnly: true,
      secure: isSecure,       // <-- USING NEW VARIABLE
      sameSite: sameSiteMode, // <-- USING NEW VARIABLE
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

    if (result.data?.sessionCookie) result.data.sessionCookie = undefined;
    res.status(result.statusCode || 200);
    return result;
  }

  @UseGuards(SessionAuthGuard)
  @Session('user', 'auth')
  @Throttle()
  @ApiOkResponseWithModel(LoginResponseDto, 'Get current logged in user info')
  @ApiOperation({ summary: 'Get current logged in user info' })
  @Get('me')
  async getMe() {
    const result = await this.authService.getUserInfo();
    return result;
  }

  @UseGuards(SessionAuthGuard)
  @Throttle()
  @ApiOperation({ summary: 'Logout and clear session' })
  @ApiOkResponseWithModel(ApiResponse, 'User logged out and session cleared')
  @Post('logout')
  async logout(
    @Cookies('session') sessionCookie: _ISessionCookie,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!sessionCookie?.token || !sessionCookie?.type)
      return new UnAuthorizedResponse('No session cookie found');
    const result = await this.authService.revokeTokens(sessionCookie);

    if (sessionCookie.type === 'firebase') {
      res.clearCookie('firebase_session');
    } else {
      res.clearCookie('custom_session');
    }

    res.status(result.statusCode || 200);
    return result;
  }
}
