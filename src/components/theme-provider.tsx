// src/components/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes"
import { type ThemeProviderProps } from "next-themes/dist/types"

function ApplyTheme({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  const [mode, color] = theme?.split("-") || ["system", "rose"];

  React.useEffect(() => {
    const body = window.document.body;
    body.classList.remove('theme-rose', 'theme-green', 'theme-blue', 'theme-orange');
    body.classList.add(`theme-${color}`);
  }, [color]);
  
  return <>{children}</>
}


export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      <ApplyTheme>{children}</ApplyTheme>
    </NextThemesProvider>
  )
}
