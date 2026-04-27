"use client"

import { Table } from "@tanstack/react-table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

export interface FilterOption {
  label: string
  value: string
}

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  breeds: FilterOption[]
  coatColors: FilterOption[]
  genders: FilterOption[]
}

export function DataTableToolbar<TData>({
  table,
  breeds,
  coatColors,
  genders,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0 || !!table.getState().globalFilter

  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      <Input
        placeholder="全項目から検索..."
        value={table.getState().globalFilter ?? ""}
        onChange={(event) => table.setGlobalFilter(String(event.target.value))}
        className="h-8 w-[150px] lg:w-[250px]"
      />
      
      {table.getColumn("breed") && (
        <>
          <Input
            list="breed-options"
            placeholder="猫種..."
            value={(table.getColumn("breed")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("breed")?.setFilterValue(e.target.value)}
            className="h-8 w-[120px] lg:w-[150px]"
          />
          <datalist id="breed-options">
            {breeds.map((breed) => (
              <option key={breed.value} value={breed.value}>{breed.label}</option>
            ))}
          </datalist>
        </>
      )}
      
      {table.getColumn("coatColor") && (
        <>
          <Input
            list="coatColor-options"
            placeholder="色柄..."
            value={(table.getColumn("coatColor")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("coatColor")?.setFilterValue(e.target.value)}
            className="h-8 w-[120px] lg:w-[150px]"
          />
          <datalist id="coatColor-options">
            {coatColors.map((color) => (
              <option key={color.value} value={color.value}>{color.label}</option>
            ))}
          </datalist>
        </>
      )}

      {table.getColumn("gender") && (
        <>
          <Input
            list="gender-options"
            placeholder="性別..."
            value={(table.getColumn("gender")?.getFilterValue() as string) ?? ""}
            onChange={(e) => table.getColumn("gender")?.setFilterValue(e.target.value)}
            className="h-8 w-[100px] lg:w-[120px]"
          />
          <datalist id="gender-options">
            {genders.map((gender) => (
              <option key={gender.value} value={gender.value}>{gender.label}</option>
            ))}
          </datalist>
        </>
      )}

      {isFiltered && (
        <Button
          variant="ghost"
          onClick={() => {
            table.resetColumnFilters()
            table.setGlobalFilter("")
          }}
          className="h-8 px-2 lg:px-3"
        >
          リセット
          <X className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
