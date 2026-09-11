export type CsvRow = Record<string, string | number | boolean | null | undefined>;

const csvEscape = (value: string | number | boolean | null | undefined) => {
  const text = value == null ? "" : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export function rowsToCsv(headers: string[], rows: CsvRow[]): string {
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
  ].join("\r\n");
}

export function downloadText(filename: string, contents: string, type: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadCsv(filename: string, headers: string[], rows: CsvRow[]) {
  downloadText(filename, rowsToCsv(headers, rows), "text/csv;charset=utf-8");
}

export function downloadJson(filename: string, value: unknown) {
  downloadText(filename, JSON.stringify(value, null, 2), "application/json;charset=utf-8");
}

export function downloadExcelHtml(filename: string, title: string, headers: string[], rows: CsvRow[]) {
  const escapeHtml = (value: unknown) =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  const table = [
    `<table><caption>${escapeHtml(title)}</caption><thead><tr>`,
    ...headers.map((header) => `<th>${escapeHtml(header)}</th>`),
    "</tr></thead><tbody>",
    ...rows.map(
      (row) =>
        `<tr>${headers.map((header) => `<td>${escapeHtml(row[header])}</td>`).join("")}</tr>`,
    ),
    "</tbody></table>",
  ].join("");
  downloadText(
    filename,
    `<!doctype html><html><head><meta charset="utf-8"></head><body>${table}</body></html>`,
    "application/vnd.ms-excel;charset=utf-8",
  );
}

export async function readTextFile(file: File, allowedExtensions: string[]) {
  const lowerName = file.name.toLowerCase();
  if (!allowedExtensions.some((ext) => lowerName.endsWith(ext))) {
    throw new Error(`Choose a ${allowedExtensions.join(" or ")} file.`);
  }
  const text = await file.text();
  if (!text.trim()) throw new Error("The selected file is empty.");
  return text;
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.replace(/\r$/, ""));
  rows.push(row);
  return rows.filter((cells) => cells.some((value) => value.trim()));
}

export function csvToObjects(text: string): Record<string, string>[] {
  const rows = parseCsv(text);
  if (rows.length < 2) throw new Error("The CSV needs a header row and at least one data row.");
  const headers = rows[0].map((header) => header.trim());
  if (headers.some((header) => !header)) throw new Error("The CSV contains an empty column name.");

  return rows.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index]?.trim() ?? ""])),
  );
}
