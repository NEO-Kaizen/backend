import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { authRoutes } from './modules/auth/routes'
import { userRoutes } from './modules/users/routes'
import { requestsRoutes } from './modules/requests/routes'
import { queueRoutes } from './modules/queue/routes'
import { triageRoutes } from './modules/triage/routes'
import { prioritizationRoutes } from './modules/prioritization/routes'
import { assigneesRoutes } from './modules/assignees/routes'
import { mappingRoutes } from './modules/mapping/routes'
import { auditRoutes } from './modules/audit/routes'
import { reportsRoutes } from './modules/reports/routes'
import { settingsRoutes } from './modules/settings/routes'
import { errorHandler } from './shared/middleware/errorHandler'

const app = express()

app.use(cors())
app.use(express.json())

app.use('/auth', authRoutes)
app.use('/users', userRoutes)
app.use('/requests', requestsRoutes);
app.use('/queue', queueRoutes);
app.use('/triage', triageRoutes);
app.use('/prioritization', prioritizationRoutes);
app.use('/assignees', assigneesRoutes);
app.use('/mapping', mappingRoutes);
app.use('/audit', auditRoutes);
app.use('/reports', reportsRoutes);
app.use('/settings', settingsRoutes)

app.use(errorHandler)

export { app }
