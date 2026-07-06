'use client'

import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form'
import { Field, FieldLabel, FieldError } from '@/components/ui/field'
import { resolveFieldError } from '@/lib/schemas/field-error'

type Translator = (key: string) => string

type ControlledFieldProps<TFieldValues extends FieldValues> = {
  control: Control<TFieldValues>
  name: FieldPath<TFieldValues>
  label?: React.ReactNode
  t: Translator
  render: (field: {
    value: unknown
    onChange: (...event: unknown[]) => void
    onBlur: () => void
    name: string
    invalid: boolean
  }) => React.ReactNode
}

/**
 * 包裝 Controller + 既有 Field/FieldLabel/FieldError primitive，減少每個
 * react-hook-form 欄位的樣板。純組合，不改 src/components/ui/ 下任何原生檔案。
 *
 * 用法範例：
 * <ControlledField control={control} name="email" label={t('auth.email')} t={t}
 *   render={(field) => <Input {...field} />} />
 */
export function ControlledField<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  t,
  render,
}: ControlledFieldProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={!!fieldState.error}>
          {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
          {render({ ...field, invalid: !!fieldState.error })}
          <FieldError errors={fieldState.error ? [{ message: resolveFieldError(fieldState.error, t) }] : undefined} />
        </Field>
      )}
    />
  )
}
