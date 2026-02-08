import Table from 'cli-table3';
import chalk from 'chalk';

export interface TableColumn {
  key: string;
  header: string;
  width?: number;
}

export function formatTable(data: any[], columns: TableColumn[]): string {
  const colWidths = columns.map(col => col.width).filter((w): w is number => w !== undefined);
  
  const table = new Table({
    head: columns.map(col => chalk.cyan(col.header)),
    ...(colWidths.length > 0 ? { colWidths } : {}),
  });

  data.forEach(item => {
    const row = columns.map(col => {
      const value = item[col.key];
      if (value === null || value === undefined) return '';
      return String(value);
    });
    table.push(row);
  });

  return table.toString();
}

export function formatJson(data: any): string {
  return JSON.stringify(data, null, 2);
}

export function formatList(items: string[]): string {
  return items.map(item => `  - ${item}`).join('\n');
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
}

export function formatMarkdownDocContent(docContent: any): string {
  const lines: string[] = [];
  
  lines.push(`# ${docContent.doc.name}\n`);
  lines.push(`**Doc ID**: ${docContent.doc.id}`);
  lines.push(`**Created**: ${formatDate(docContent.doc.createdAt)}`);
  lines.push(`**Updated**: ${formatDate(docContent.doc.updatedAt)}\n`);
  
  if (docContent.structure.pages.length > 0) {
    lines.push(`## Pages (${docContent.structure.pages.length})\n`);
    docContent.structure.pages.forEach((page: any) => {
      lines.push(`- **${page.name}** (${page.id})`);
    });
    lines.push('');
  }

  if (docContent.data.tables && docContent.data.tables.length > 0) {
    lines.push(`## Tables (${docContent.data.tables.length})\n`);
    docContent.data.tables.forEach((table: any) => {
      lines.push(`### ${table.name} (${table.id})\n`);
      
      if (table.columns && table.columns.length > 0) {
        lines.push(`**Columns**: ${table.columns.map((c: any) => c.name).join(', ')}\n`);
      }

      if (table.rows && table.rows.length > 0) {
        const headers = table.columns.map((c: any) => c.name).join(' | ');
        const separator = table.columns.map(() => '---').join(' | ');
        
        lines.push(`| ${headers} |`);
        lines.push(`| ${separator} |`);
        
        table.rows.forEach((row: any) => {
          const values = table.columns.map((col: any) => {
            const val = row.values[col.id];
            return val !== null && val !== undefined ? String(val) : '';
          });
          lines.push(`| ${values.join(' | ')} |`);
        });
        lines.push('');
      }
    });
  }

  if (docContent.data.formulas && docContent.data.formulas.length > 0) {
    lines.push(`## Formulas (${docContent.data.formulas.length})\n`);
    docContent.data.formulas.forEach((formula: any) => {
      const value = formula.value !== null && formula.value !== undefined ? String(formula.value) : 'N/A';
      lines.push(`- **${formula.name}**: ${value}`);
    });
    lines.push('');
  }

  if (docContent.data.controls && docContent.data.controls.length > 0) {
    lines.push(`## Controls (${docContent.data.controls.length})\n`);
    docContent.data.controls.forEach((control: any) => {
      const value = control.value !== null && control.value !== undefined ? String(control.value) : 'N/A';
      lines.push(`- **${control.name}**: ${value}`);
    });
    lines.push('');
  }

  return lines.join('\n');
}

export function formatMarkdownPageContent(pageContent: any): string {
  const lines: string[] = [];
  
  lines.push(`# ${pageContent.page.name}\n`);
  lines.push(`**Page ID**: ${pageContent.page.id}`);
  lines.push(`**Type**: ${pageContent.page.type}`);
  lines.push(`**Doc**: ${pageContent.doc.name} (${pageContent.doc.id})\n`);

  if (pageContent.data.tables && pageContent.data.tables.length > 0) {
    lines.push(`## Tables (${pageContent.data.tables.length})\n`);
    pageContent.data.tables.forEach((table: any) => {
      lines.push(`### ${table.name} (${table.id})\n`);
      
      if (table.columns && table.columns.length > 0) {
        lines.push(`**Columns**: ${table.columns.map((c: any) => c.name).join(', ')}\n`);
      }

      if (table.rows && table.rows.length > 0) {
        const headers = table.columns.map((c: any) => c.name).join(' | ');
        const separator = table.columns.map(() => '---').join(' | ');
        
        lines.push(`| ${headers} |`);
        lines.push(`| ${separator} |`);
        
        table.rows.forEach((row: any) => {
          const values = table.columns.map((col: any) => {
            const val = row.values[col.id];
            return val !== null && val !== undefined ? String(val) : '';
          });
          lines.push(`| ${values.join(' | ')} |`);
        });
        lines.push('');
      }
    });
  }

  if (pageContent.data.formulas && pageContent.data.formulas.length > 0) {
    lines.push(`## Formulas (${pageContent.data.formulas.length})\n`);
    pageContent.data.formulas.forEach((formula: any) => {
      const value = formula.value !== null && formula.value !== undefined ? String(formula.value) : 'N/A';
      lines.push(`- **${formula.name}**: ${value}`);
    });
    lines.push('');
  }

  if (pageContent.data.controls && pageContent.data.controls.length > 0) {
    lines.push(`## Controls (${pageContent.data.controls.length})\n`);
    pageContent.data.controls.forEach((control: any) => {
      const value = control.value !== null && control.value !== undefined ? String(control.value) : 'N/A';
      lines.push(`- **${control.name}**: ${value}`);
    });
    lines.push('');
  }

  if (!pageContent.data.tables.length && 
      !pageContent.data.formulas.length && 
      !pageContent.data.controls.length) {
    lines.push('_This page has no tables, formulas, or controls._\n');
  }

  return lines.join('\n');
}
