import { CheckCircle, Clock, XCircle, FileText } from 'lucide-react'

type Status = 'draft' | 'in_progress' | 'completed' | 'cancelled' | 'active' | 'inactive'

interface StatusBadgeProps {
  status: Status | string
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
  className?: string
}

export const StatusBadge = ({ 
  status, 
  size = 'md', 
  showIcon = true, 
  className = '' 
}: StatusBadgeProps) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      draft: {
        label: 'Черновик',
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: FileText
      },
      in_progress: {
        label: 'В работе',
        color: 'bg-pink-100 text-pink-700 border-pink-200',
        icon: Clock
      },
      completed: {
        label: 'Завершено',
        color: 'bg-teal-100 text-teal-700 border-teal-200',
        icon: CheckCircle
      },
      cancelled: {
        label: 'Отменено',
        color: 'bg-red-100 text-red-700 border-red-200',
        icon: XCircle
      },
      active: {
        label: 'Активно',
        color: 'bg-teal-100 text-teal-700 border-teal-200',
        icon: CheckCircle
      },
      inactive: {
        label: 'Неактивно',
        color: 'bg-gray-100 text-gray-700 border-gray-200',
        icon: XCircle
      }
    }
    
    return configs[status as keyof typeof configs] || {
      label: status,
      color: 'bg-gray-100 text-gray-700 border-gray-200',
      icon: FileText
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <span
      className={`
        inline-flex items-center font-medium rounded-full border
        ${config.color}
        ${sizeClasses[size]}
        ${className}
      `}
    >
      {showIcon && (
        <Icon className={`${iconSizes[size]} mr-1.5`} />
      )}
      {config.label}
    </span>
  )
} 