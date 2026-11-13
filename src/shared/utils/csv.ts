/**
 * Arma un CSV que Excel abre bien en español: BOM UTF-8, comillas escapadas y saltos CRLF.
 * Los números van tal cual (sin separador de miles) para que Excel los reconozca como números.
 */
export function toCsv(head: string[], rows: unknown[][]): string {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return '﻿' + [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
}
