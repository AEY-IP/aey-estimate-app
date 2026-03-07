import { PrismaClient } from '@prisma/client'
import { randomUUID } from 'crypto'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
})

const MODELS_WITH_UPDATED_AT = new Set([
  'act_exports',
  'act_room_parameter_values',
  'act_rooms',
  'acts',
  'client_users',
  'clients',
  'coefficients',
  'design_project_blocks',
  'designer_clients',
  'designer_estimate_blocks',
  'designer_estimate_items',
  'designer_estimates',
  'document_blocks',
  'documents',
  'estimate_exports',
  'estimate_room_parameter_values',
  'estimate_rooms',
  'estimates',
  'lead_requests',
  'photo_blocks',
  'project_news',
  'project_schedule_items',
  'receipt_blocks',
  'room_parameters',
  'schedule_projects',
  'schedule_tasks',
  'template_rooms',
  'template_work_blocks',
  'templates',
  'users',
  'work_blocks',
  'work_items',
  'works',
])

const MODELS_WITH_MANUAL_ID = new Set([
  'act_coefficients',
  'act_exports',
  'act_materials',
  'act_room_parameter_values',
  'act_rooms',
  'act_works',
  'acts',
  'client_users',
  'clients',
  'coefficients',
  'deleted_estimates',
  'design_project_blocks',
  'design_project_files',
  'designer_clients',
  'designer_estimate_blocks',
  'designer_estimate_items',
  'designer_estimates',
  'document_blocks',
  'documents',
  'estimate_coefficients',
  'estimate_exports',
  'estimate_materials',
  'estimate_room_parameter_values',
  'estimate_rooms',
  'estimate_works',
  'estimates',
  'lead_requests',
  'photo_blocks',
  'photos',
  'project_news',
  'project_schedule_items',
  'receipt_blocks',
  'receipts',
  'room_parameters',
  'schedule_projects',
  'schedule_tasks',
  'template_materials',
  'template_rooms',
  'template_work_blocks',
  'template_works',
  'templates',
  'users',
  'work_blocks',
  'work_items',
  'works',
])

const prismaWithMeta = prisma as PrismaClient & { __invariantsMiddlewareAttached?: boolean }

if (!prismaWithMeta.__invariantsMiddlewareAttached) {
  prisma.$use(async (params, next) => {
    const { model, action } = params
    const hasData = params.args && typeof params.args === 'object' && 'data' in params.args

    if (model && hasData && params.args?.data && typeof params.args.data === 'object') {
      const normalizeRecord = (data: Record<string, unknown>) => {
        if (
          (action === 'create' || action === 'upsert' || action === 'createMany' || action === 'createManyAndReturn') &&
          MODELS_WITH_MANUAL_ID.has(model) &&
          (data.id === undefined || data.id === null || data.id === '')
        ) {
          data.id = randomUUID()
        }

        if (
          (
            action === 'create' ||
            action === 'update' ||
            action === 'upsert' ||
            action === 'updateMany' ||
            action === 'createMany' ||
            action === 'createManyAndReturn'
          ) &&
          MODELS_WITH_UPDATED_AT.has(model) &&
          data.updatedAt === undefined
        ) {
          data.updatedAt = new Date()
        }
      }

      if (Array.isArray(params.args.data)) {
        params.args.data.forEach((entry) => {
          if (entry && typeof entry === 'object') {
            normalizeRecord(entry as Record<string, unknown>)
          }
        })
      } else {
        normalizeRecord(params.args.data as Record<string, unknown>)
      }
    }

    return next(params)
  })

  prismaWithMeta.__invariantsMiddlewareAttached = true
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} 