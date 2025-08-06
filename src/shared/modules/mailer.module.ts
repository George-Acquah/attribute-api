import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST,
        port: parseInt(process.env.MAIL_PORT, 10),
        // secure: process.env.MAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASSWORD,
        },
      },
      defaults: {
        from: '"Attribution Bot" <noreply@yourdomain.com>',
      },
    }),
  ],
  providers: [],
  exports: [],
})
export class AppMailerModule {}
