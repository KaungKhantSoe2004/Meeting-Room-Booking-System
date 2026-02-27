import { Request } from "express";

export type UserRole = 'admin' | 'owner' | 'user';

export interface User {
  id: number;
  name: string;
  role: UserRole;
}
export interface UserDataRequest extends Request {
  user?: User;
}
export interface Booking {
  id: number;
  userId: number;
  startTime: Date | string;
  endTime: Date | string;
  createdAt?: Date | string;
}
export interface CreateBookingRequest {
  userId: number;
  startTime: string;
  endTime: string;
}
export interface CreateUserRequest {
  name: string;
  role: UserRole;
}
export interface UpdateUserRequest {
  name?: string;
  role?: UserRole;
}
export interface UpdateBookingRequest {
  startTime?: string;
  endTime?: string;
}