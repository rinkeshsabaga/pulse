
// src/components/theme-toggle.tsx
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Laptop, Moon, Sun } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

export function ThemeToggle({ inMenu = false }: { inMenu?: boolean}) {
  const { setTheme } = useTheme()

  const content = (
    <>
      <DropdownMenuItem onClick={() => setTheme("light")}>
        <Sun className="mr-2 h-4 w-4" />
        <span>Light</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("dark")}>
        <Moon className="mr-2 h-4 w-4" />
        <span>Dark</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => setTheme("system")}>
        <Laptop className="mr-2 h-4 w-4" />
        <span>System</span>
      </DropdownMenuItem>
    </>
  );

  if (inMenu) {
    return (
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span>Theme</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>{content}</DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    )
  }

  return (
     <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{content}</DropdownMenuContent>
    </DropdownMenu>
  )
}
