import { Application } from '@xrengine/server-core/declarations'
import { Graph } from './graph.class'
import hooks from './graph.hooks'
import createModel from './graph.model'

declare module '@xrengine/common/declarations' {
  interface ServiceTypes {
    'conjure-graph': Graph
  }
}

export default (app: Application): void => {
  const options = {
    Model: createModel(app),
    paginate: app.get('paginate'),
    multi: true
  }

  const graph = new Graph(options, app)
  app.use('conjure-graph', graph)

  const service = app.service('conjure-graph')
  service.hooks(hooks)
}
