export interface _ICreateChannel {
  name: string;
  description?: string;
}
export interface _IChannel extends _ICreateChannel {
  id: string;
  // createdAt: Date;
  // updatedAt: Date;
}
