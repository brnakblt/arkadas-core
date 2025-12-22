'use client';

/**
 * Report Export Utilities
 * PDF and Excel export for attendance, schedules, etc.
 */

// ============================================================
// Excel Export (CSV-based for simplicity)
// ============================================================

export interface ExcelColumn {
    header: string;
    key: string;
    width?: number;
}

export interface ExcelExportOptions {
    filename: string;
    sheetName?: string;
    columns: ExcelColumn[];
    data: Record<string, unknown>[];
}

/**
 * Export data to CSV/Excel format
 */
export function exportToExcel(options: ExcelExportOptions): void {
    const { filename, columns, data } = options;

    // Create CSV content
    const headers = columns.map((col) => col.header).join(',');
    const rows = data.map((row) =>
        columns
            .map((col) => {
                const value = row[col.key];
                // Escape commas and quotes
                const stringValue = String(value ?? '');
                if (stringValue.includes(',') || stringValue.includes('"')) {
                    return `"${stringValue.replace(/"/g, '""')}"`;
                }
                return stringValue;
            })
            .join(',')
    );

    const csvContent = [headers, ...rows].join('\n');

    // Add BOM for Turkish characters
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Download
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// ============================================================
// PDF Export (HTML to Print)
// ============================================================

export interface PDFExportOptions {
    title: string;
    subtitle?: string;
    date?: string;
    content: string;
    orientation?: 'portrait' | 'landscape';
}

/**
 * Export content to PDF via browser print
 */
export function exportToPDF(options: PDFExportOptions): void {
    const { title, subtitle, date, content, orientation = 'portrait' } = options;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
        alert('Pop-up engellendi. Lütfen pop-up izni verin.');
        return;
    }

    const html = `
    <!DOCTYPE html>
    <html lang="tr">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4 ${orientation};
          margin: 15mm;
        }
        body {
          font-family: 'Segoe UI', Arial, sans-serif;
          font-size: 12pt;
          line-height: 1.5;
          color: #333;
          margin: 0;
          padding: 20px;
        }
        .header {
          text-align: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 2px solid #333;
        }
        .header h1 {
          font-size: 18pt;
          margin: 0 0 5px 0;
        }
        .header .subtitle {
          font-size: 12pt;
          color: #666;
        }
        .header .date {
          font-size: 10pt;
          color: #888;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 15px 0;
        }
        th, td {
          border: 1px solid #333;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f0f0f0;
          font-weight: bold;
        }
        .status-present { background-color: #d4edda; }
        .status-absent { background-color: #f8d7da; }
        .status-late { background-color: #fff3cd; }
        .footer {
          position: fixed;
          bottom: 10mm;
          left: 15mm;
          right: 15mm;
          text-align: center;
          font-size: 9pt;
          color: #888;
          border-top: 1px solid #ccc;
          padding-top: 10px;
        }
        @media print {
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${title}</h1>
        ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
        ${date ? `<div class="date">${date}</div>` : ''}
      </div>
      ${content}
      <div class="footer">
        Arkadaş Özel Eğitim ve Rehabilitasyon Merkezi
      </div>
    </body>
    </html>
  `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    // Wait for content to load then print
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

// ============================================================
// Report Generators
// ============================================================

interface AttendanceRecord {
    studentName: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status: 'present' | 'absent' | 'late' | 'excused';
}

/**
 * Generate attendance report
 */
export function generateAttendanceReport(
    records: AttendanceRecord[],
    reportDate: string,
    format: 'pdf' | 'excel'
): void {
    const title = 'Yoklama Raporu';
    const subtitle = `Tarih: ${reportDate}`;

    if (format === 'excel') {
        exportToExcel({
            filename: `yoklama-${reportDate}`,
            columns: [
                { header: 'Öğrenci', key: 'studentName' },
                { header: 'Tarih', key: 'date' },
                { header: 'Giriş', key: 'checkIn' },
                { header: 'Çıkış', key: 'checkOut' },
                { header: 'Durum', key: 'status' },
            ],
            data: records.map((r) => ({
                ...r,
                status: translateStatus(r.status),
            })),
        });
    } else {
        const tableRows = records
            .map(
                (r) => `
        <tr>
          <td>${r.studentName}</td>
          <td>${r.date}</td>
          <td>${r.checkIn || '-'}</td>
          <td>${r.checkOut || '-'}</td>
          <td class="status-${r.status}">${translateStatus(r.status)}</td>
        </tr>
      `
            )
            .join('');

        const content = `
      <table>
        <thead>
          <tr>
            <th>Öğrenci</th>
            <th>Tarih</th>
            <th>Giriş</th>
            <th>Çıkış</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    `;

        exportToPDF({ title, subtitle, content });
    }
}

function translateStatus(status: string): string {
    const statusMap: Record<string, string> = {
        present: 'Var',
        absent: 'Yok',
        late: 'Geç',
        excused: 'İzinli',
    };
    return statusMap[status] || status;
}

/**
 * Export Button Component
 */
export function ExportButton({
    onExport,
    label = 'Dışa Aktar',
    className = '',
}: {
    onExport: (format: 'pdf' | 'excel') => void;
    label?: string;
    className?: string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
            >
                📥 {label}
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 z-10">
                    <button
                        onClick={() => {
                            onExport('pdf');
                            setIsOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        📄 PDF
                    </button>
                    <button
                        onClick={() => {
                            onExport('excel');
                            setIsOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                        📊 Excel (CSV)
                    </button>
                </div>
            )}
        </div>
    );
}

import { useState } from 'react';
