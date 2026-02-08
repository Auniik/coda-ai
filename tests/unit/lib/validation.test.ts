import { describe, it, expect } from 'vitest';
import {
  DocIdSchema,
  TableIdSchema,
  RowIdSchema,
  ColumnIdSchema,
  PageIdSchema,
  FormulaIdSchema,
  ControlIdSchema,
  UrlSchema,
  ListRowsSchema,
} from '../../../src/lib/validation.js';

describe('validation schemas', () => {
  describe('DocIdSchema', () => {
    it('should validate valid doc ID', () => {
      expect(DocIdSchema.parse('doc-123')).toBe('doc-123');
    });

    it('should reject empty string', () => {
      expect(() => DocIdSchema.parse('')).toThrow('Doc ID is required');
    });
  });

  describe('TableIdSchema', () => {
    it('should validate valid table ID', () => {
      expect(TableIdSchema.parse('table-456')).toBe('table-456');
    });

    it('should reject empty string', () => {
      expect(() => TableIdSchema.parse('')).toThrow('Table ID is required');
    });
  });

  describe('RowIdSchema', () => {
    it('should validate valid row ID', () => {
      expect(RowIdSchema.parse('i-row1')).toBe('i-row1');
    });

    it('should reject empty string', () => {
      expect(() => RowIdSchema.parse('')).toThrow('Row ID is required');
    });
  });

  describe('ColumnIdSchema', () => {
    it('should validate valid column ID', () => {
      expect(ColumnIdSchema.parse('c-col1')).toBe('c-col1');
    });

    it('should reject empty string', () => {
      expect(() => ColumnIdSchema.parse('')).toThrow('Column ID is required');
    });
  });

  describe('PageIdSchema', () => {
    it('should validate valid page ID', () => {
      expect(PageIdSchema.parse('canvas-page1')).toBe('canvas-page1');
    });

    it('should reject empty string', () => {
      expect(() => PageIdSchema.parse('')).toThrow('Page ID is required');
    });
  });

  describe('FormulaIdSchema', () => {
    it('should validate valid formula ID', () => {
      expect(FormulaIdSchema.parse('f-formula1')).toBe('f-formula1');
    });

    it('should reject empty string', () => {
      expect(() => FormulaIdSchema.parse('')).toThrow('Formula ID is required');
    });
  });

  describe('ControlIdSchema', () => {
    it('should validate valid control ID', () => {
      expect(ControlIdSchema.parse('ctrl-control1')).toBe('ctrl-control1');
    });

    it('should reject empty string', () => {
      expect(() => ControlIdSchema.parse('')).toThrow('Control ID is required');
    });
  });

  describe('UrlSchema', () => {
    it('should validate valid URL', () => {
      const url = 'https://coda.io/d/doc123';
      expect(UrlSchema.parse(url)).toBe(url);
    });

    it('should reject invalid URL', () => {
      expect(() => UrlSchema.parse('not-a-url')).toThrow('Invalid URL format');
    });

    it('should reject empty string', () => {
      expect(() => UrlSchema.parse('')).toThrow();
    });
  });

  describe('ListRowsSchema', () => {
    it('should validate with required fields only', () => {
      const data = {
        docId: 'doc-123',
        tableId: 'table-456',
      };
      expect(ListRowsSchema.parse(data)).toEqual(data);
    });

    it('should validate with all optional fields', () => {
      const data = {
        docId: 'doc-123',
        tableId: 'table-456',
        limit: 25,
        pageToken: 'token123',
        query: 'Status="Active"',
      };
      expect(ListRowsSchema.parse(data)).toEqual(data);
    });

    it('should reject limit < 1', () => {
      const data = {
        docId: 'doc-123',
        tableId: 'table-456',
        limit: 0,
      };
      expect(() => ListRowsSchema.parse(data)).toThrow();
    });

    it('should reject limit > 500', () => {
      const data = {
        docId: 'doc-123',
        tableId: 'table-456',
        limit: 501,
      };
      expect(() => ListRowsSchema.parse(data)).toThrow();
    });

    it('should reject missing docId', () => {
      const data = {
        tableId: 'table-456',
      };
      expect(() => ListRowsSchema.parse(data)).toThrow();
    });

    it('should reject missing tableId', () => {
      const data = {
        docId: 'doc-123',
      };
      expect(() => ListRowsSchema.parse(data)).toThrow();
    });
  });
});
