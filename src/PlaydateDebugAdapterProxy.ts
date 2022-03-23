import * as net from "net";

import { PROXY_DEBUG_PORT, SIMULATOR_DEBUG_PORT } from "./constants";

class PlaydateDebugAdapterProxy {
  private server: net.Server;

  private clientSocket!: net.Socket;
  private simulatorSocket!: net.Socket;
  private simulatorSeq!: number;
  private simulatorSeqOffset = 0;

  constructor() {
    this.server = net.createServer((socket) => {
      if (this.clientSocket) {
        return;
      }

      this.clientSocket = socket;
      this.clientSocket.on("data", (data) => this.proxyClientData(data));
    });
  }

  async start(): Promise<void> {
    await this.connect(SIMULATOR_DEBUG_PORT);
    this.server.listen(PROXY_DEBUG_PORT);
  }

  private connect(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.simulatorSocket = net.createConnection({ port }, resolve);
      this.simulatorSocket.once("error", reject);
      this.simulatorSocket.on("data", (data) => this.proxySimulatorData(data));
    });
  }

  private proxyClientData(dataIn: Buffer): void {
    const message = decodeMessage(dataIn);

    if (message.type === "request" && message.command === "launch") {
      // The Playdate Simulator never sends a success response to VS Code when
      // it receives a launch request. This causes VS Code to appear to hang
      // indefinitely. We immediately respond to the client with a success
      // response and increase the sequence count of all future messages by one.
      const response = {
        type: "response",
        command: "launch",
        success: true,
        seq: this.simulatorSeq + 1,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        request_seq: message.seq,
      };
      this.simulatorSeqOffset += 1;

      const dataOut = encodeMessage(response);
      this.clientSocket?.write(dataOut);
    }

    const dataOut = encodeMessage(message);
    this.simulatorSocket?.write(dataOut);
  }

  private proxySimulatorData(dataIn: Buffer): void {
    const message = decodeMessage(dataIn);
    this.simulatorSeq = message.seq;

    if (message.type === "response" && message.command === "initialize") {
      // The Playdate Simulator responds with "supportsTerminateRequest": true.
      // However, when VS Code attempts to send a terminate request, it responds
      // with "Unsupported method: terminate". Disabling the
      // "supportsTerminateRequest" capability causes VS Code to send a
      // disconnect request instead.
      message.body.supportsTerminateRequest = false;
    }

    // Offset messages from the simulator because we may have inserted a missing
    // response.
    message.seq += this.simulatorSeqOffset;

    const dataOut = encodeMessage(message);
    this.clientSocket?.write(dataOut);
  }
}

const SEPARATOR = "\r\n\r\n";

function decodeMessage(data: Buffer): any {
  const payload = data.toString();
  const components = payload.split(SEPARATOR);
  return JSON.parse(components[1]);
}

function encodeMessage(message: any): Buffer {
  const content = JSON.stringify(message);
  const components = [`Content-Length: ${content.length}`, content];
  const payload = components.join(SEPARATOR);
  return Buffer.from(payload);
}

const proxy = new PlaydateDebugAdapterProxy();
proxy.start();
