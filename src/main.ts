import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiResponseInterceptor } from './shared/interceptors/api-response.interceptor';
import { ConsoleLogger } from '@nestjs/common/services/console-logger.service';
import { NestFactory } from '@nestjs/core/nest-factory';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';
async function bootstrap() {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const app = await NestFactory.create(AppModule, {
      logger: new ConsoleLogger('Bootstrap', {
        logLevels: isProduction ? ['error'] : ['log', 'error', 'warn'],
        timestamp: true,
      }),
    });

    //Get the ConfigService
    const configService = app.get(ConfigService);
    const port = parseInt(configService.get('PORT')) || 3300;

    const globalPrefix = 'api/v1';
    app.setGlobalPrefix(globalPrefix);
    app.useGlobalInterceptors(new ApiResponseInterceptor());
    app.use(cookieParser());

    app.enableCors({
      origin: isProduction
        ? [
            'https://attribute-kappa.vercel.app',
            'https://attribute-api1.onrender.com',
            `http://localhost:3000`,
            `https://localhost:${port}`,
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
      .setContact('Attribution', '#', 'attribute-api.com')
      .setLicense('MIT', 'https://opensource.org/licenses/MIT')
      .setTermsOfService('#')
      .addServer(
        isProduction
          ? 'https://attribute-api1.onrender.com'
          : 'http://localhost:' + port,
        isProduction ? 'Production server' : 'Local development server',
      )

      // ✅ Tags (alphabetically sorted and with updated descriptions)
      .addTag('Analytics', 'Reports, KPIs, and insights')
      .addTag('Attribution', 'Attribution logic and credit assignment')
      .addTag('Auth', 'Authentication and user management')
      .addTag('Campaigns', 'Campaign creation, targeting, and management')
      .addTag('Channel', 'Media or marketing channels used in campaigns')
      .addTag('Codes', 'Promo or QR code generation and tracking')
      .addTag(
        'Conversion',
        'Capture conversion events (signups, purchases, etc.)',
      )
      .addTag(
        'Country',
        'Manage country-level data used for geo-targeting or analytics',
      )
      .addTag('Interaction', 'Track user interactions like scans or page views')
      .addTag('Permissions', 'Permission management and access control')
      .addTag('Redis', 'Session, cache, or temporary storage operations')
      .addTag('Region', 'Manage region-level data such as states or provinces')
      .addTag('Report', 'Custom reports and data exports')
      .addTag('Role', 'Role definitions and access levels')
      .addTag('Users', 'User profiles and roles')

      .build();

    const document = () => SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/v1/docs', app, document, {
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
