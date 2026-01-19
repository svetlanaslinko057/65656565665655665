import { z } from 'zod';

/**
 * Common Types
 */

// Pagination
export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type Pagination = z.infer<typeof PaginationSchema>;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Sorting
export const SortOrderSchema = z.enum(['asc', 'desc']).default('desc');
export type SortOrder = z.infer<typeof SortOrderSchema>;

// MongoDB ObjectId as string
export const ObjectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

// Blockchain address (Ethereum-like)
export const AddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid address');

// Chain identifier
export const ChainSchema = z.enum([
  'ethereum',
  'base',
  'arbitrum',
  'optimism',
  'polygon',
  'bsc',
  'avalanche',
  'solana',
]);
export type Chain = z.infer<typeof ChainSchema>;

// Common timestamp fields
export interface Timestamps {
  createdAt: Date;
  updatedAt: Date;
}

// API Response wrapper
export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  error?: string;
  message?: string;
}
