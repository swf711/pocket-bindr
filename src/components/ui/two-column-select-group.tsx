'use client'

import * as React from 'react'
import { SelectGroup, SelectLabel } from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface TwoColumnSelectGroupProps {
  label?: string
  children: React.ReactNode
  className?: string
}

export function TwoColumnSelectGroup({ label, children, className }: TwoColumnSelectGroupProps) {
  return (
    <SelectGroup className={cn('grid grid-cols-2', className)}>
      {label && <SelectLabel className="col-span-2">{label}</SelectLabel>}
      {children}
    </SelectGroup>
  )
}
