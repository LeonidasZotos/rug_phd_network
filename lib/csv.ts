const MAX_CSV_COLUMNS = 100;
const MAX_CSV_ROWS = 10_000;

/** Parse RFC 4180-style CSV, including escaped quotes and newlines in cells. */
export function parseCsv(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;

  const finishField = () => {
    row.push(field);
    field = "";
    if (row.length > MAX_CSV_COLUMNS) throw new Error("public_sheet_too_many_columns");
  };
  const finishRow = () => {
    finishField();
    rows.push(row);
    row = [];
    if (rows.length > MAX_CSV_ROWS) throw new Error("public_sheet_too_many_rows");
  };

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    if (quoted) {
      if (character === '"') {
        if (input[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += character;
      }
      continue;
    }

    if (character === '"' && field.length === 0) quoted = true;
    else if (character === ",") finishField();
    else if (character === "\n") finishRow();
    else if (character === "\r" && input[index + 1] === "\n") {
      finishRow();
      index += 1;
    } else if (character === "\r") finishRow();
    else field += character;
  }

  if (quoted) throw new Error("public_sheet_csv_unclosed_quote");
  if (field.length > 0 || row.length > 0) finishRow();
  return rows;
}
