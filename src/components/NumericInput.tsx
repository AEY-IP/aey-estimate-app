'use client'

import { useState, useEffect, useRef } from 'react'

interface NumericInputProps {
  value: number | string
  onChange: (value: number) => void
  className?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number | string
  disabled?: boolean
  allowDecimals?: boolean
}

export default function NumericInput({
  value,
  onChange,
  className = '',
  placeholder = '0',
  min = 0,
  max,
  step = 1,
  disabled = false,
  allowDecimals = true
}: NumericInputProps) {
  const [displayValue, setDisplayValue] = useState<string>('')
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Синхронизация с внешним значением
  useEffect(() => {
    if (!isFocused) {
      const numValue = typeof value === 'number' ? value : parseFloat(value as string) || 0
      setDisplayValue(numValue === 0 ? '0' : numValue.toString())
    }
  }, [value, isFocused])

  const handleFocus = () => {
    setIsFocused(true)
    // Если значение равно 0, очищаем поле для удобного ввода
    if (displayValue === '0') {
      setDisplayValue('')
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    
    // Если поле пустое, возвращаем 0
    if (displayValue === '' || displayValue === '.') {
      setDisplayValue('0')
      onChange(0)
      return
    }

    // Парсим значение
    let numValue = allowDecimals ? parseFloat(displayValue) : parseInt(displayValue)
    
    // Проверяем на валидность
    if (isNaN(numValue)) {
      numValue = 0
    }

    // Применяем ограничения
    if (min !== undefined && numValue < min) {
      numValue = min
    }
    if (max !== undefined && numValue > max) {
      numValue = max
    }

    // Обновляем отображение и вызываем onChange
    const finalValue = allowDecimals ? numValue : Math.floor(numValue)
    setDisplayValue(finalValue === 0 ? '0' : finalValue.toString())
    onChange(finalValue)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value

    // Разрешаем пустое значение при вводе
    if (newValue === '') {
      setDisplayValue('')
      return
    }

    // Валидация ввода
    if (allowDecimals) {
      // Разрешаем цифры, точку и минус (если min < 0)
      const allowMinus = min !== undefined && min < 0
      const regex = allowMinus ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/
      if (!regex.test(newValue)) return
      
      // Ограничиваем количество точек
      if ((newValue.match(/\./g) || []).length > 1) return
    } else {
      // Только целые числа
      const allowMinus = min !== undefined && min < 0
      const regex = allowMinus ? /^-?\d*$/ : /^\d*$/
      if (!regex.test(newValue)) return
    }

    setDisplayValue(newValue)

    // Если значение валидное, вызываем onChange
    const numValue = allowDecimals ? parseFloat(newValue) : parseInt(newValue)
    if (!isNaN(numValue)) {
      onChange(numValue)
    }
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={displayValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`${className} no-number-arrows`}
      placeholder={placeholder}
      disabled={disabled}
      inputMode="decimal"
      autoComplete="off"
    />
  )
}
