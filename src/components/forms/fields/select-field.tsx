'use client';

import { useStore } from '@tanstack/react-form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField
} from '@/components/ui/form-context';

type Option = { value: string; label: string };

/**
 * An option meaning "none" ("Không hiện trên mobile", "— Chọn nhà cung cấp —")
 * has the value ''. Radix refuses an item with an empty value and threw as the
 * form opened, so "Thêm điểm đến", "Thêm khu vực" and "Cập nhật" crashed
 * (vande-2011 #018). Inside the select that option carries this stand-in; the
 * form still reads and stores ''.
 */
const EMPTY = '__none__';
const toItem = (v: string | null | undefined) => (v === '' || v == null ? EMPTY : v);
const fromItem = (v: string) => (v === EMPTY ? '' : v);

interface SelectFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  options: Option[];
  placeholder?: string;
}

export function SelectField({
  label,
  description,
  required,
  options,
  placeholder = 'Select an option'
}: SelectFieldProps) {
  const field = useFieldContext();
  const isTouched = useStore(field.store, (s) => s.meta.isTouched);
  const isValid = useStore(field.store, (s) => s.meta.isValid);
  const value = useStore(field.store, (s) => s.value) as string;
  const hasEmptyOption = options.some((opt) => opt.value === '');
  // With no "none" option, an empty value shows the placeholder as before.
  const shown = hasEmptyOption ? toItem(value) : value;

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && ' *'}
        </FieldLabel>
        <Select
          value={shown}
          onValueChange={(next) => field.handleChange(fromItem(next))}
          onOpenChange={(open) => {
            if (!open) field.handleBlur();
          }}
        >
          {/* Fill the column: the trigger is `w-fit` by default, so a long option
              ("Cuối <body> (không chặn hiển thị)") ran over the next field
              (#049, test round 4). */}
          <SelectTrigger
            id={field.name}
            aria-invalid={isTouched && !isValid}
            className='w-full min-w-0'
          >
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={toItem(opt.value)} value={toItem(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

export const FormSelectField = createFormField(SelectField);
