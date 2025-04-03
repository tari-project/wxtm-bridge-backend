/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck
import { DataSource } from 'typeorm';

export class CustomTypeORMAdapter {
  connection: DataSource;

  constructor(connection: DataSource) {
    this.connection = connection;
  }

  build(Model, props) {
    const model = new Model();
    for (const [key, value] of Object.entries(props)) {
      model[key] = value;
    }
    return model;
  }

  async save(model, _Model) {
    return this.connection.manager.save(model);
  }

  async destroy(model, Model) {
    const manager = this.connection.manager;
    const modelRepo = manager.getRepository(Model);
    const theModel = await modelRepo.findOne(model.id);
    if (theModel) {
      return manager.transaction(async (tm) => {
        await tm.query('SET FOREIGN_KEY_CHECKS=0;');
        await tm.delete(Model, model.id);
        return tm.query('SET FOREIGN_KEY_CHECKS=1;');
      });
    } else {
      return;
    }
  }

  get(model, attr, _Model) {
    return model[attr];
  }

  set(props, model, _Model) {
    Object.keys(props).forEach((key) => {
      model[key] = props[key];
    });
    return model;
  }
}
