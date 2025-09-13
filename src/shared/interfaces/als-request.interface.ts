export interface RequestContext {
  userId?: string;
  adminId?: string;
  requestId?: string;
  roles?: string[];
  // Extend as needed
}
