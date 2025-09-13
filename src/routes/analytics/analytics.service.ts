import { Injectable } from '@nestjs/common/decorators/core/injectable.decorator';
import { Logger } from '@nestjs/common/services/logger.service';
import {
  InternalServerErrorResponse,
  OkResponse,
} from 'src/shared/res/responses';
import { PrismaService } from 'src/shared/services/prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  private logger = new Logger(AnalyticsService.name);
  constructor(private readonly prisma: PrismaService) {}

  async getTopCodes(campaignId: string) {
    try {
      const codes = await this.prisma.code.findMany({
        where: {
          campaignId,
          deletedAt: null,
        },
        include: {
          interactions: {
            include: {
              conversionLinks: {
                include: { conversion: true },
              },
            },
          },
        },
      });

      const ranked = codes.map((code) => {
        const interactions = code.interactions?.length ?? 0;
        const conversions = new Set(
          code.interactions?.flatMap(
            (i) => i.conversionLinks?.map((cl) => cl.conversion?.id) ?? [],
          ),
        ).size;

        return {
          code: code.code,
          interactions,
          conversions,
          conversionRate: interactions ? conversions / interactions : 0,
        };
      });

      ranked.sort((a, b) =>
        b.conversions !== a.conversions
          ? b.conversions - a.conversions
          : b.interactions - a.interactions,
      );

      return new OkResponse({ campaignId, topCodes: ranked });
    } catch (err) {
      this.logger.error('Error in getTopCodes', err);
      return new InternalServerErrorResponse();
    }
  }

  async getConversionTimeline(
    campaignId: string,
    interval: 'day' | 'week' | 'month' = 'day',
  ) {
    try {
      // Build the raw SQL query string with embedded DATE_TRUNC directly
      const intervalTrunc = {
        day: 'DATE_TRUNC(\'day\', c."timestamp")',
        week: 'DATE_TRUNC(\'week\', c."timestamp")',
        month: 'DATE_TRUNC(\'month\', c."timestamp")',
      }[interval];

      // Embed the full query as a string
      const query = `
      SELECT ${intervalTrunc} AS date, COUNT(*) AS count
      FROM "conversions" c
      JOIN "conversion_interactions" ci ON ci."conversionId" = c.id
      JOIN "interactions" i ON ci."interactionId" = i.id
      JOIN "codes" co ON i."codeId" = co.id
      WHERE co."campaignId" = $1
      GROUP BY date
      ORDER BY date ASC
    `;

      // Use $queryRawUnsafe with parameter binding to prevent SQL injection
      const timeline = await this.prisma.$queryRawUnsafe<any[]>(
        query,
        campaignId,
      );

      return new OkResponse(
        timeline.map((r) => ({
          date: r.date,
          count: Number(r.count),
        })),
      );
    } catch (err) {
      this.logger.error('Error in getConversionTimeline', err);
      return new InternalServerErrorResponse('Timeline fetch failed');
    }
  }
}
