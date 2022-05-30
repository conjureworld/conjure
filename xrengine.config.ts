import type { ProjectConfigInterface } from '@xrengine/projects/ProjectConfigInterface'

const config: ProjectConfigInterface = {
  onEvent: undefined,
  thumbnail: '/static/xrengine_thumbnail.jpg',
  routes: {},
  services: './src/services/services.ts',
  databaseSeed: undefined,
  settings: [
    {
      key: 'GOOGLE_SERVICE_ACCOUNT_EMAIL'
    } as any,
    {
      key: 'GOOGLE_PRIVATE_KEY'
    } as any,
    {
      key: 'GOOGLE_API_KEY'
    } as any
  ]
}

export default config
