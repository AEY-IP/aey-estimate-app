'use client'

import { useState, useRef, useEffect } from 'react'
import { Search, X, Filter, ChevronDown } from 'lucide-react'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  suggestions?: string[]
  onSuggestionSelect?: (suggestion: string) => void
  filters?: Array<{
    label: string
    value: string
    count?: number
  }>
  selectedFilters?: string[]
  onFilterChange?: (filters: string[]) => void
  className?: string
}

export const SearchBar = ({
  value,
  onChange,
  placeholder = 'Поиск...',
  suggestions = [],
  onSuggestionSelect,
  filters = [],
  selectedFilters = [],
  onFilterChange,
  className = ''
}: SearchBarProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Фильтруем предложения на основе введенного текста
  const filteredSuggestions = suggestions.filter(suggestion =>
    suggestion.toLowerCase().includes(value.toLowerCase()) && suggestion !== value
  ).slice(0, 5)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
        setShowFilters(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    onChange(newValue)
    setShowSuggestions(newValue.length > 0 && filteredSuggestions.length > 0)
  }

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion)
    onSuggestionSelect?.(suggestion)
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const clearSearch = () => {
    onChange('')
    inputRef.current?.focus()
  }

  const toggleFilter = (filterValue: string) => {
    if (!onFilterChange) return
    
    const newFilters = selectedFilters.includes(filterValue)
      ? selectedFilters.filter(f => f !== filterValue)
      : [...selectedFilters, filterValue]
    
    onFilterChange(newFilters)
  }

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (value.length > 0 && filteredSuggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          className="input-field pl-10 pr-20 w-full"
          placeholder={placeholder}
        />
        <div className="absolute inset-y-0 right-0 flex items-center">
          {value && (
            <button
              onClick={clearSearch}
              className="p-1 mr-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {filters.length > 0 && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 mr-1 rounded-lg transition-colors ${
                selectedFilters.length > 0 || showFilters
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Filter className="h-4 w-4" />
              {selectedFilters.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {selectedFilters.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Search Suggestions */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
            >
              <span className="flex items-center">
                <Search className="h-3 w-3 text-gray-400 mr-2" />
                {suggestion}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Filters Panel */}
      {showFilters && filters.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Фильтры</h4>
          <div className="space-y-2">
            {filters.map((filter) => (
              <label
                key={filter.value}
                className="flex items-center cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedFilters.includes(filter.value)}
                  onChange={() => toggleFilter(filter.value)}
                  className="mr-3"
                />
                <span className="text-sm text-gray-700 flex-1">{filter.label}</span>
                {filter.count !== undefined && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {filter.count}
                  </span>
                )}
              </label>
            ))}
          </div>
          {selectedFilters.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <button
                onClick={() => onFilterChange?.([])}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Очистить все фильтры
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 