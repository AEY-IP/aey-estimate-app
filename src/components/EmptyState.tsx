import { ReactNode } from 'react'
import { FileText, Plus } from 'lucide-react'

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
    variant?: 'primary' | 'secondary'
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export const EmptyState = ({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = ''
}: EmptyStateProps) => {
  const defaultIcon = <FileText className="h-16 w-16 text-gray-300" />

  return (
    <div className={`text-center py-16 ${className}`}>
      <div className="mb-6">
        {icon || defaultIcon}
      </div>
      
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      
      <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {action && (
            <button
              onClick={action.onClick}
              className={`inline-flex items-center ${
                action.variant === 'secondary' ? 'btn-secondary' : 'btn-primary'
              }`}
            >
              <Plus className="h-5 w-5 mr-2" />
              {action.label}
            </button>
          )}
          
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="btn-secondary inline-flex items-center"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
} 