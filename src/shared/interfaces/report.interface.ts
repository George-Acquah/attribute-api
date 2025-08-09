import { Campaign } from '@prisma/client';

export type ReportStatus = 'success' | 'failed' | 'processing';

export interface IReportLog {
  id: string;
  campaignId: string;
  campaign?: Campaign; // Optional relation
  createdAt: Date;
  filePath: string;
  fileName: string;
  status: ReportStatus;
  error: string | null;
}

// For creating new report logs
export interface ICreateReportLogInput {
  logId?: string;
  campaignId: string;
  filePath: string;
  fileName: string;
  status: ReportStatus;
  error?: string | null;

  retryCount?: number; // Optional, defaults to 0
  userId?: string | null; // Optional, for system-run reports this can be null
}

// For updating report logs
export interface IUpdateReportLogInput {
  status?: ReportStatus;
  error?: string | null;
  filePath?: string;
  fileName?: string;
}

// For querying report logs
export interface IReportLogFilter {
  campaignId?: string;
  status?: ReportStatus;
}
