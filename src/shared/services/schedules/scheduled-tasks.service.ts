import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ReportService } from 'src/routes/report/report.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ScheduledTasksService {
  private logger = new Logger(ScheduledTasksService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly reports: ReportService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async handleDailyReports() {
    // Get yesterday's date range
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    const startOfDay = new Date(yesterday);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(yesterday);
    endOfDay.setHours(23, 59, 59, 999);

    const campaigns = await this.prisma.campaign.findMany({
      where: {
        startDate: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    for (const campaign of campaigns) {
      try {
        const filePath = await this.reports.generatePDF(campaign.id);

        await this.prisma.reportLog.create({
          data: {
            campaignId: campaign.id,
            filePath,
            fileName: `${campaign.id}.pdf`,
            status: 'success',
          },
        });

        console.log(`[✅] Report for ${campaign.name} at ${filePath}`);
      } catch (err) {
        await this.prisma.reportLog.create({
          data: {
            campaignId: campaign.id,
            status: 'failed',
            error: err.message,
            filePath: '',
            fileName: '',
          },
        });

        console.error(`[❌] Failed for ${campaign.name}: ${err.message}`);
        throw err; // Re-throw to log the error
      }
    }
  }
}
