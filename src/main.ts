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

    const globalPrefix = 'api';
    app.setGlobalPrefix(globalPrefix);
    app.useGlobalInterceptors(new ApiResponseInterceptor());
    app.use(cookieParser());

    // Swagger setup
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Firebase Test API')
      .setDescription('API documentation for Firebase Test')
      .setVersion('1.0')
      .addBearerAuth()
      .setContact('Firebase Test', '#', 'support@firebase-test.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .setTermsOfService('#')
      .addServer('http://localhost:' + port, 'Local development server')
      .addTag('Auth', 'Authentication and user management')
      .build();

    const document = () => SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        docExpansion: 'none',
        persistAuthorization: true,
      },
      customSiteTitle: 'Firebase Test API Docs',
    });

    if (process.env.NODE_ENV === 'development') {
      app.enableCors({
        origin: [
          `http://localhost:${port}`,
          'https://attribute-kappa.vercel.app',
        ],
        credentials: true,
      });
    }

    app.useGlobalPipes(new ValidationPipe());

    await app.listen(port, '0.0.0.0', () => {
      console.log(`Listening at http://0.0.0.0:${port}`);
      console.log('Ive really suffered, man');
    });
  } catch (err) {
    console.error('❌ Error during bootstrap:', err);
  }
}
bootstrap();
