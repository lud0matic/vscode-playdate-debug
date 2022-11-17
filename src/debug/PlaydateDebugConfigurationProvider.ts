import { inject, injectable } from "inversify";
import * as vscode from "vscode";

import { ConfigurationResolver } from "../core";

/**
 * PlaydateDebugConfigurationProvider injects the configuration necessary to
 * debug a Playdate game into the launch configuration for the playdate
 * debugger.
 */
@injectable()
export class PlaydateDebugConfigurationProvider
  implements vscode.DebugConfigurationProvider
{
  constructor(
    @inject(ConfigurationResolver) private config: ConfigurationResolver
  ) {}

  async resolveDebugConfiguration(
    folder: vscode.WorkspaceFolder | undefined,
    config: vscode.DebugConfiguration
  ): Promise<vscode.DebugConfiguration | undefined | null> {
    const workspaceRoot = folder?.uri.fsPath;
    if (!workspaceRoot) {
      // Folder-less setups are not supported
      return null;
    }

    const { sdkPath, sourcePath, gamePath } = await this.config.resolve();

    return {
      ...config,
      sdkPath,
      sourcePath,
      gamePath,
    };
  }
}
