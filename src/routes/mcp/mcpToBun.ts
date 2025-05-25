import { EventEmitter } from "node:events";

// Adapter to convert to Bun Response
export class BunResponseAdapter extends EventEmitter {
  private _statusCode = 200;
  private _headers: Record<string, string> = {};
  private _body: string = "";
  private _ended = false;

  constructor(private resolve: (response: Response) => void) {
    super();
  }

  writeHead(
    statusCode: number,
    statusMessage?: string,
    headers?: Record<string, string | string[]>
  ): this;
  writeHead(
    statusCode: number,
    headers?: Record<string, string | string[]>
  ): this;
  writeHead(
    statusCode: number,
    statusMessageOrHeaders?: string | Record<string, string | string[]>,
    headers?: Record<string, string | string[]>
  ): this {
    this._statusCode = statusCode;

    let actualHeaders: Record<string, string | string[]> | undefined;
    if (typeof statusMessageOrHeaders === "object") {
      actualHeaders = statusMessageOrHeaders;
    } else {
      actualHeaders = headers;
    }

    if (actualHeaders) {
      Object.entries(actualHeaders).forEach(([key, value]) => {
        this._headers[key] = Array.isArray(value) ? value.join(", ") : value;
      });
    }
    return this;
  }

  setHeader(name: string, value: string | string[]): this {
    this._headers[name] = Array.isArray(value) ? value.join(", ") : value;
    return this;
  }

  getHeader(name: string) {
    return this._headers[name];
  }

  flushHeaders(): void {
    // In Bun, we don't need to explicitly flush headers
    // This is a no-op to satisfy the MCP SDK interface
  }

  write(chunk: any): boolean {
    this._body += chunk;
    return true;
  }

  end(cb?: () => void): this;
  end(chunk: any, cb?: () => void): this;
  end(chunk: any, encoding: BufferEncoding, cb?: () => void): this;
  end(
    chunkOrCb?: any | (() => void),
    encodingOrCb?: BufferEncoding | (() => void),
    cb?: () => void
  ): this {
    let chunk: any;
    let callback: (() => void) | undefined;

    if (typeof chunkOrCb === "function") {
      callback = chunkOrCb;
    } else {
      chunk = chunkOrCb;
      if (typeof encodingOrCb === "function") {
        callback = encodingOrCb;
      } else {
        callback = cb;
      }
    }

    if (chunk) {
      this._body += chunk;
    }

    if (!this._ended) {
      this._ended = true;

      // Create the Bun Response
      const response = new Response(this._body, {
        status: this._statusCode,
        headers: this._headers,
      });

      this.resolve(response);

      if (callback) {
        callback();
      }

      // Emit close event after a short delay to simulate connection close
      setTimeout(() => {
        this.emit("close");
      }, 0);
    }

    return this;
  }
}

export // Adapter to convert Bun Request to Node.js IncomingMessage-like object
class BunRequestAdapter {
  method: string;
  url: string;
  headers: Record<string, string> = {};
  httpVersion: string = "1.1";
  httpVersionMajor: number = 1;
  httpVersionMinor: number = 1;

  constructor(private bunRequest: Request) {
    // Set basic properties
    this.method = bunRequest.method;
    this.url =
      new URL(bunRequest.url).pathname + new URL(bunRequest.url).search;

    // Convert headers
    bunRequest.headers.forEach((value, key) => {
      this.headers[key.toLowerCase()] = value;
    });
  }

  // Override the readable stream methods to handle body
  async getBody() {
    if (this.bunRequest.body) {
      const text = await this.bunRequest.text();
      return text;
    }
    return "";
  }
}
