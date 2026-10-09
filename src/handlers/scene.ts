import type { Scene } from '../types/database/scene'
import { createCrudHandler } from './crud'

export const sceneHandler = createCrudHandler<Scene, 'id_scene'>('Scene', 'id_scene')
