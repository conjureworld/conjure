import { DataTypes, Model, Sequelize } from 'sequelize'

import { Application } from '@xrengine/server-core/declarations'
import { GraphInterface } from '../../common/GraphInterface'

export default (app: Application) => {
  const sequelizeClient: Sequelize = app.get('sequelizeClient')
  const Graph = sequelizeClient.define<Model<GraphInterface>>(
    'graph',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV1,
        allowNull: false,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING,
        defaultValue: (): string => 'graph' + Math.floor(Math.random() * 900 + 100),
        allowNull: false
      }
    },
    {
      hooks: {
        beforeCount(options: any): void {
          options.raw = true
        }
      }
    }
  )

  ;(Graph as any).associate = (models: any): void => {
    ;(Graph as any).belongsTo(models.user, { foreignKey: 'userId' })
  }
  return Graph
}
