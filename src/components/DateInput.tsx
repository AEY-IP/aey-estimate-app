'use client'

import { ChangeEvent, KeyboardEvent } from 'react'

interface DateInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  id?: string
  required?: boolean
  disabled?: boolean
}

export default function DateInput({
  value,
  onChange,
  placeholder = "ДД.ММ.ГГГГ",
  className = "input-field",
  id,
  required = false,
  disabled = false
}: DateInputProps) {

  const formatDateInput = (input: string): string => {
    // Удаляем все кроме цифр
    const numbersOnly = input.replace(/\D/g, '')
    
    // Применяем маску ДД.ММ.ГГГГ
    if (numbersOnly.length <= 2) {
      return numbersOnly
    } else if (numbersOnly.length <= 4) {
      return `${numbersOnly.slice(0, 2)}.${numbersOnly.slice(2)}`
    } else if (numbersOnly.length <= 8) {
      return `${numbersOnly.slice(0, 2)}.${numbersOnly.slice(2, 4)}.${numbersOnly.slice(4)}`
    }
    
    // Ограничиваем до 8 цифр (ДД.ММ.ГГГГ)
    return `${numbersOnly.slice(0, 2)}.${numbersOnly.slice(2, 4)}.${numbersOnly.slice(4, 8)}`
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatDateInput(e.target.value)
    onChange(formattedValue)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    // Разрешаем backspace, delete, tab, escape, enter
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        // Разрешаем Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
      return
    }
    
    // Разрешаем только цифры
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault()
    }
  }

  return (
    <input
      type="text"
      id={id}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={className}
      maxLength={10} // ДД.ММ.ГГГГ = 10 символов
      required={required}
      disabled={disabled}
    />
  )
} 