import { NullableId, Paginated, Params } from '@feathersjs/feathers'
import { SequelizeServiceOptions, Service } from 'feathers-sequelize'

import { Application } from '@xrengine/server-core/declarations'
import { GraphInterface } from '../../common/GraphInterface'

/**
 * @todo Make pesudo agent-centric
 * - each user can only CRUD their own graphs
 */

export class Graph<T = GraphInterface> extends Service<T> {
  app: Application
  docs: any

  constructor(options: Partial<SequelizeServiceOptions>, app: Application) {
    super(options)
    this.app = app
  }

  // async find(params?: Params): Promise<T[] | Paginated<T>> {
  //   return super.find(params)
  // }

  // async create(data, params): Promise<T | T[]> {
  //   return super.create(data, params)
  // }

  // async patch(id: NullableId, data: any): Promise<T | T[]> {
  //   return super.patch(id, data)
  // }
}
