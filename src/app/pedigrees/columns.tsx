"use client"

import { ColumnDef } from "@tanstack/react-table"
import { PedigreeWithRelations } from "@/actions/pedigreeActions"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

export const columns: ColumnDef<PedigreeWithRelations>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected()
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "pedigreeId",
    header: "本猫ID",
  },
  {
    accessorKey: "catName",
    header: "名前",
  },
  {
    id: "breed",
    accessorFn: (row) => row.breed ? `${row.breed.code} ${row.breed.name}` : (row.breedCode || "-"),
    header: "猫種",
  },
  {
    id: "gender",
    accessorFn: (row) => row.gender ? `${row.gender.code} ${row.gender.name}` : (row.genderCode || "-"),
    header: "性別",
  },
  {
    id: "coatColor",
    accessorFn: (row) => row.coatColor ? `${row.coatColor.code} ${row.coatColor.name}` : (row.coatColorCode || "-"),
    header: "色柄",
  },
  {
    accessorKey: "birthDate",
    header: "誕生日",
  },
  {
    accessorKey: "ownerName",
    header: "所有者",
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const pedigree = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger className="h-8 w-8 p-0 inline-flex items-center justify-center rounded-md hover:bg-gray-100 focus:outline-none">
            <span className="sr-only">メニューを開く</span>
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>アクション</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <Link href={`/pedigrees/${pedigree.id}`}>
              <DropdownMenuItem className="cursor-pointer">詳細を見る</DropdownMenuItem>
            </Link>
            <Link href={`/pedigrees/${pedigree.id}/edit`}>
              <DropdownMenuItem className="cursor-pointer">編集する</DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
