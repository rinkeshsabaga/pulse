
// src/components/theme-toggle.tsx
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Laptop, Moon, Sun, Paintbrush } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"

const colorThemes = [
    { name: 'rose', label: 'Rose', color: 'bg-rose-500' },
    { name: 'blue', label: 'Blue', color: 'bg-blue-500' },
    { name: 'green', label: 'Green', color: 'bg-green-500' },
    { name: 'orange', label: 'Orange', color: 'bg-orange-500' },
]

export function ThemeToggle({ inMenu = false }: { inMenu?: boolean}) {
  const { setTheme, theme } = useTheme()

  const handleColorChange = (colorName: string) => {
    const currentThemeParts = theme?.split('-') || ['system'];
    const mode = currentThemeParts[0];
    const newTheme = `${mode}-${colorName}`;
    setTheme(newTheme);
  }

  const handleModeChange = (mode: string) => {
    const currentThemeParts = theme?.split('-') || ['system', 'rose'];
    const color = currentThemeParts[1] || 'rose';
    const newTheme = `${mode}-${color}`;
    setTheme(newTheme);
  }

  const modeContent = (
    <>
      <DropdownMenuItem onClick={() => handleModeChange("light")}>
        <Sun className="mr-2 h-4 w-4" />
        <span>Light</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleModeChange("dark")}>
        <Moon className="mr-2 h-4 w-4" />
        <span>Dark</span>
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => handleModeChange("system")}>
        <Laptop className="mr-2 h-4 w-4" />
        <span>System</span>
      </DropdownMenuItem>
    </>
  );

  const colorContent = (
    <>
      {colorThemes.map((colorTheme) => (
        <DropdownMenuItem key={colorTheme.name} onClick={() => handleColorChange(colorTheme.name)}>
            <div className={cn("w-4 h-4 rounded-full mr-2", colorTheme.color)} />
            <span>{colorTheme.label}</span>
        </DropdownMenuItem>
      ))}
    </>
  )

  if (inMenu) {
    return (
     <>
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
            <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span>Theme</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
            <DropdownMenuSubContent>{modeContent}</DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSub>
            <DropdownMenuSubTrigger>
                <Paintbrush className="h-4 w-4 mr-2" />
                <span>Color</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
            <DropdownMenuSubContent>{colorContent}</DropdownMenuSubContent>
            </DropdownMenuPortal>
        </DropdownMenuSub>
     </>
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
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Mode</DropdownMenuLabel>
        {modeContent}
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Color</DropdownMenuLabel>
        {colorContent}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
