import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const escapeCell = (value) => {
	if (value === null || value === undefined) return '';
	const text = String(value);
	return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/**
 * 行オブジェクトの配列を CSV として書き出す。
 * columns は列の順番を固定するために必須（行が空でもヘッダは残したいため）。
 */
export const writeCsv = (filePath, columns, rows) => {
	const lines = [columns.join(',')];
	for (const row of rows) {
		lines.push(columns.map((column) => escapeCell(row[column])).join(','));
	}
	mkdirSync(dirname(filePath), { recursive: true });
	writeFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
	console.log(`  → ${filePath} (${rows.length} 行)`);
};
