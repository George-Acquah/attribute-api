import axios from 'axios';
import { PrismaService } from '../prisma/prisma.service';

export class WebhookService {
  constructor(private readonly prisma: PrismaService) {}

  async notifyWebhook(campaignId: string, filePath: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
    });

    if (campaign?.webhookUrl) {
      try {
        await axios.post(campaign.webhookUrl, {
          campaignId,
          filePath,
          status: 'success',
          generatedAt: new Date(),
        });
      } catch (err) {
        console.error(`Webhook failed for campaign ${campaignId}`, err.message);
        throw err;
      }
    }
  }
}
