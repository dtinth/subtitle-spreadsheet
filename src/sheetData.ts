import { atom } from "nanostores";

export interface SheetData {
  row: number;
  column: number;
  values: (string | number)[][];
}

export const $sheetData = atom<SheetData | undefined>();
export const $sheetDataLoading = atom(true);
