"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [globalFilter, setGlobalFilter] = useState(searchParams.get("q") ?? "")
  const [breedFilter, setBreedFilter] = useState(searchParams.get("breed") ?? "")
  const [coatColorFilter, setCoatColorFilter] = useState(searchParams.get("coatColor") ?? "")
  const [genderFilter, setGenderFilter] = useState(searchParams.get("gender") ?? "")

  const isFiltered = Boolean(globalFilter || breedFilter || coatColorFilter || genderFilter)

  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      
      if (globalFilter) params.set("q", globalFilter)
      else params.delete("q")

      if (breedFilter) params.set("breed", breedFilter)
      else params.delete("breed")

      if (coatColorFilter) params.set("coatColor", coatColorFilter)
      else params.delete("coatColor")

      if (genderFilter) params.set("gender", genderFilter)
      else params.delete("gender")

      const newQuery = params.toString()
      if (searchParams.toString() !== newQuery) {
        router.replace(`${pathname}?${newQuery}`, { scroll: false })
      }
    }, 400) // 400ms debounce

    return () => clearTimeout(handler)
  }, [globalFilter, breedFilter, coatColorFilter, genderFilter, pathname, router])

  return (
    <div className="flex flex-wrap items-center gap-2 py-4">
      <Input
        placeholder="全項目から検索..."
        value={globalFilter}
        onChange={(event) => setGlobalFilter(event.target.value)}
        className="h-8 w-[150px] lg:w-[250px]"
      />
      
      {table.getColumn("breed") && (
        <>
          <Input
            list="breed-options"
            placeholder="猫種..."
            value={breedFilter}
            onChange={(e) => setBreedFilter(e.target.value)}
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
            value={coatColorFilter}
            onChange={(e) => setCoatColorFilter(e.target.value)}
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
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
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
            setGlobalFilter("")
            setBreedFilter("")
            setCoatColorFilter("")
            setGenderFilter("")
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
