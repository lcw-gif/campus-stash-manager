import { z } from 'zod';

// Auth validation schemas
export const loginSchema = z.object({
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
});

export const signupSchema = z.object({
  fullName: z.string()
    .trim()
    .min(1, 'Full name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z.string()
    .trim()
    .email('Invalid email address')
    .max(255, 'Email must be less than 255 characters'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password must be less than 100 characters')
});

// Course validation schemas
export const courseSchema = z.object({
  course_name: z.string()
    .trim()
    .min(1, 'Course name is required')
    .max(100, 'Course name must be less than 100 characters'),
  description: z.string()
    .trim()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  course_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  instructor: z.string()
    .trim()
    .max(100, 'Instructor name must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled'])
});

export const courseItemSchema = z.object({
  item_name: z.string()
    .trim()
    .min(1, 'Item name is required')
    .max(100, 'Item name must be less than 100 characters'),
  quantity_reserved: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(99999, 'Quantity must be less than 100,000'),
  notes: z.string()
    .trim()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal(''))
});

// Stock validation schemas
export const stockItemSchema = z.object({
  itemName: z.string()
    .trim()
    .min(1, 'Item name is required')
    .max(100, 'Item name must be less than 100 characters'),
  totalQuantity: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(999999, 'Quantity must be less than 1,000,000'),
  location: z.string()
    .trim()
    .min(1, 'Location is required')
    .max(100, 'Location must be less than 100 characters'),
  courseTag: z.string()
    .trim()
    .max(50, 'Course tag must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  purchasePrice: z.number()
    .positive('Price must be greater than 0')
    .max(999999.99, 'Price must be less than 1,000,000')
});

export const stockTransactionSchema = z.object({
  quantity: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(999999, 'Quantity must be less than 1,000,000'),
  notes: z.string()
    .trim()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal(''))
});

// Purchase validation schemas
export const purchaseItemSchema = z.object({
  itemName: z.string()
    .trim()
    .min(1, 'Item name is required')
    .max(100, 'Item name must be less than 100 characters'),
  whereToBuy: z.string()
    .trim()
    .max(200, 'Store name must be less than 200 characters')
    .optional()
    .or(z.literal('')),
  price: z.number()
    .positive('Price must be greater than 0')
    .max(999999.99, 'Price must be less than 1,000,000'),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(99999, 'Quantity must be less than 100,000'),
  link: z.string()
    .url('Must be a valid URL')
    .optional()
    .or(z.literal('')),
  status: z.enum(['considering', 'not_consider', 'waiting_delivery', 'arrived', 'stored']),
  courseTag: z.string()
    .trim()
    .max(50, 'Course tag must be less than 50 characters')
    .optional()
    .or(z.literal(''))
});

// Borrow validation schemas
export const borrowRecordSchema = z.object({
  borrowerName: z.string()
    .trim()
    .min(1, 'Borrower name is required')
    .max(100, 'Borrower name must be less than 100 characters'),
  borrowerContact: z.string()
    .trim()
    .max(100, 'Contact must be less than 100 characters')
    .optional()
    .or(z.literal('')),
  quantity: z.number()
    .int('Quantity must be a whole number')
    .positive('Quantity must be greater than 0')
    .max(99999, 'Quantity must be less than 100,000'),
  notes: z.string()
    .trim()
    .max(500, 'Notes must be less than 500 characters')
    .optional()
    .or(z.literal(''))
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;
export type CourseFormData = z.infer<typeof courseSchema>;
export type CourseItemFormData = z.infer<typeof courseItemSchema>;
export type StockItemFormData = z.infer<typeof stockItemSchema>;
export type StockTransactionFormData = z.infer<typeof stockTransactionSchema>;
export type PurchaseItemFormData = z.infer<typeof purchaseItemSchema>;
export type BorrowRecordFormData = z.infer<typeof borrowRecordSchema>;
