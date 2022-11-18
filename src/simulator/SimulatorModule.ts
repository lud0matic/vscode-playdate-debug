import { ContainerModule } from "inversify";
import * as vscode from "vscode";

import { ActivateResult, ExtensionModule } from "../ExtensionModule";
import { SIMULATOR_TASK_TYPE } from "../constants";

import { SimulatorExecutionFactory } from "./SimulatorExecutionFactory";
import { SimulatorTaskProvider } from "./SimulatorTaskProvider";

export class SimulatorModule extends ExtensionModule {
  protected get containerModule(): ContainerModule {
    return new ContainerModule((bind) => {
      bind(SimulatorExecutionFactory).toSelf();
      bind(SimulatorTaskProvider).toSelf();
    });
  }

  activate(): ActivateResult {
    const simulatorTaskProvider = this.container.resolve(SimulatorTaskProvider);
    return vscode.tasks.registerTaskProvider(
      SIMULATOR_TASK_TYPE,
      simulatorTaskProvider
    );
  }
}
