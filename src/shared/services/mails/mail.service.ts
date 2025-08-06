import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private readonly mailer: MailerService) {}

  async sendReportSummary(
    email: string,
    campaignName: string,
    reportUrl: string,
  ) {
    await this.mailer.sendMail({
      to: email,
      subject: `Your Report for ${campaignName}`,
      html: `
        <h2>${campaignName} Report is Ready</h2>
        <p>You can <a href="${reportUrl}">download your PDF report</a>.</p>
      `,
    });
  }
}
