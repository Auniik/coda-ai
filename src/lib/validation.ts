import { z } from 'zod';

export const CreateRowSchema = z.object({
  docId: z.string().min(1, 'Doc ID is required'),
  tableId: z.string().min(1, 'Table ID is required'),
  cells: z.array(z.object({
    column: z.string(),
    value: z.any(),
  })),
});

export const ListRowsSchema = z.object({
  docId: z.string().min(1, 'Doc ID is required'),
  tableId: z.string().min(1, 'Table ID is required'),
  limit: z.number().int().min(1).max(500).optional(),
  pageToken: z.string().optional(),
  query: z.string().optional(),
});

export const DocContentSchema = z.object({
  docId: z.string().min(1, 'Doc ID is required'),
  format: z.enum(['json', 'markdown']).optional().default('json'),
  rowLimit: z.number().int().min(1).max(100).optional().default(10),
  includeTables: z.boolean().optional().default(true),
  includeFormulas: z.boolean().optional().default(true),
  includeControls: z.boolean().optional().default(true),
});

export const PageContentSchema = z.object({
  docId: z.string().min(1, 'Doc ID is required'),
  pageId: z.string().min(1, 'Page ID is required'),
  format: z.enum(['json', 'markdown']).optional().default('json'),
  rowLimit: z.number().int().min(1).max(100).optional().default(10),
  includeTables: z.boolean().optional().default(true),
  includeFormulas: z.boolean().optional().default(true),
  includeControls: z.boolean().optional().default(true),
});

export const PageExportSchema = z.object({
  docId: z.string().min(1, 'Doc ID is required'),
  pageId: z.string().min(1, 'Page ID is required'),
  format: z.enum(['html', 'markdown']).optional().default('markdown'),
});

export const DocIdSchema = z.string().min(1, 'Doc ID is required');

export const TableIdSchema = z.string().min(1, 'Table ID is required');

export const RowIdSchema = z.string().min(1, 'Row ID is required');

export const ColumnIdSchema = z.string().min(1, 'Column ID is required');

export const PageIdSchema = z.string().min(1, 'Page ID is required');

export const FormulaIdSchema = z.string().min(1, 'Formula ID is required');

export const ControlIdSchema = z.string().min(1, 'Control ID is required');

export const ApiTokenSchema = z.string().min(1, 'API token is required');

export const UrlSchema = z.string().url('Invalid URL format');

