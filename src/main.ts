import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConsoleLogger, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiResponseInterceptor } from './shared/interceptors/api-response.interceptor';
async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      logger: new ConsoleLogger('Bootstrap', {
        logLevels: ['log', 'error', 'warn'],
        timestamp: true,
      }),
    });

    //Get the ConfigService
    const configService = app.get(ConfigService);
    const port = parseInt(configService.get('PORT')) || 3300;
    const isProduction = process.env.NODE_ENV === 'production';

    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    app.useGlobalInterceptors(new ApiResponseInterceptor());
    app.use(cookieParser());

    app.enableCors({
      origin: isProduction
        ? [
            'https://attribute-kappa.vercel.app',
            'https://attribute-api1.onrender.com',
            `http://localhost:${port}`,
          ]
        : [
            `http://localhost:${port}`,
            `http://localhost:3000`,
            'https://attribute-kappa.vercel.app',
          ],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
      ],
    });

    // Swagger setup
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Attribution API')
      .setDescription('API documentation for Attribution')
      .setVersion('1.0')
      .addBearerAuth()
      .setContact('Attribution', '#', 'support@firebase-test.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .setTermsOfService('#')
      .addServer('http://localhost:' + port, 'Local development server')
      .addServer('https://attribute-api1.onrender.com', 'Production server')
      .addTag('Auth', 'Authentication and user management')
      .addTag('Users', 'User profiles and roles')
      .addTag('Campaigns', 'Campaign creation, targeting, and management')
      .addTag('Codes', 'Promo or QR code generation and tracking')
      .addTag('Interaction', 'Track user interactions like scans or page views')
      .addTag(
        'Conversion',
        'Capture conversion events (signups, purchases, etc.)',
      )
      .addTag('Analytics', 'Reports, KPIs, and insights')
      .addTag('Attribution', 'Attribution logic and credit assignment')
      .addTag('Redis', 'Session, cache, or temp storage operations')
      .build();

    const document = () => SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        docExpansion: 'none',
        persistAuthorization: true,
        tryItOutEnabled: true,
        withCredential: true,
      },
      customSiteTitle: 'Attribution API Docs',
    });

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.listen(port, '0.0.0.0', () => {
      console.log(`Listening at http://0.0.0.0:${port}`);
    });
  } catch (err) {
    console.error('❌ Error during bootstrap:', err);
  }
}
bootstrap();
