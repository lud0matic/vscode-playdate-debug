import { DebugProtocolMessage } from "vscode";

import { OnProxyClient } from "../../core/OnProxyClient";
import { OnProxyServer } from "../../core/OnProxyServer";

export class FixRestartResponse implements OnProxyClient, OnProxyServer {
  private simulatorSeq!: number;
  private simulatorSeqOffset = 0;

  onProxyClient(message: any): DebugProtocolMessage | null {
    if (message.type !== "request" || message.command !== "restart") {
      return null;
    }

    const response = {
      type: "response",
      command: "restart",
      success: true,
      seq: this.simulatorSeq + 1,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      request_seq: message.seq,
    };
    this.simulatorSeqOffset += 1;
    return response;
  }

  onProxyServer(message: any): void {
    this.simulatorSeq = message.seq;
    message.seq += this.simulatorSeqOffset;
  }
}
