import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/** Project root (parent of server/). */
export const projectRoot = path.join(__dirname, '..')

dotenv.config({ path: path.join(projectRoot, '.env') })
