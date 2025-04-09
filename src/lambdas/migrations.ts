import {
  CodeDeployClient,
  LifecycleEventStatus,
  PutLifecycleEventHookExecutionStatusCommand,
  PutLifecycleEventHookExecutionStatusCommandInput,
} from '@aws-sdk/client-codedeploy';
import { DataSource } from 'typeorm';

import config from '../config/config';

interface CodeDeployHookEvent {
  DeploymentId: string;
  LifecycleEventHookExecutionId: string;
}

export const runMigrations = async (event: CodeDeployHookEvent) => {
  const date = new Date().toISOString();
  const codedeploy = new CodeDeployClient({ apiVersion: date });

  let dataSource: DataSource | undefined;
  let status: LifecycleEventStatus | undefined;

  try {
    if (!dataSource) {
      dataSource = new DataSource(config().database);
    }

    if (!dataSource.isInitialized) {
      await dataSource.initialize();
    }

    await dataSource.runMigrations({
      transaction: 'all',
    });

    status = LifecycleEventStatus.SUCCEEDED;
    console.log('Finished running migrations');
  } catch (error) {
    status = LifecycleEventStatus.FAILED;
    console.error({ msg: 'Migrations failed', error });
  } finally {
    console.log('Finally run migrations');
    if (dataSource) {
      await dataSource.destroy();
    }

    if (event.DeploymentId) {
      const params: PutLifecycleEventHookExecutionStatusCommandInput = {
        deploymentId: event.DeploymentId,
        lifecycleEventHookExecutionId: event.LifecycleEventHookExecutionId,
        status,
      };

      const command = new PutLifecycleEventHookExecutionStatusCommand(params);
      const endOfMigration = await codedeploy.send(command);

      console.log({ msg: 'Response!: endOfMigration', endOfMigration });
    }
  }
};
