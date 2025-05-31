import { EventEmitter } from "node:events";
import { Readable } from "node:stream";

// Adapter to convert to Bun Response
export class BunResponseAdapter extends EventEmitter {
  private _statusCode = 200;
  private _headers: Record<string, string> = {};
  private _body: string = "";
  private _ended = false;
  headersSent = false;

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
    this.headersSent = true;

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
    console.log('BunResponseAdapter.end() called');
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

      console.log('Creating response with status:', this._statusCode, 'body length:', this._body.length);
      
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
class BunRequestAdapter extends Readable {
  method: string;
  url: string;
  headers: Record<string, string> = {};
  httpVersion: string = "1.1";
  httpVersionMajor: number = 1;
  httpVersionMinor: number = 1;
  private bodyBuffer: Buffer | null = null;
  private bodyRead: boolean = false;

  // Additional properties expected by Node.js IncomingMessage
  complete: boolean = true;
  socket: any = null;
  connection: any = null;
  aborted: boolean = false;

  constructor(private bunRequest: Request, private body?: string) {
    super();
    // Set basic properties
    this.method = bunRequest.method;
    this.url =
      new URL(bunRequest.url).pathname + new URL(bunRequest.url).search;

    // Convert headers
    bunRequest.headers.forEach((value, key) => {
      this.headers[key.toLowerCase()] = value;
    });

    // If body was provided, convert to buffer
    if (body) {
      this.bodyBuffer = Buffer.from(body);
    }

    // Set readable state
    this.readable = true;
  }

  // Implement the _read method for Readable stream
  _read() {
    if (!this.bodyRead && this.bodyBuffer) {
      this.push(this.bodyBuffer);
      this.bodyRead = true;
    }
    this.push(null); // Signal end of stream
  }

  // Override the readable stream methods to handle body
  async getBody() {
    if (this.body) {
      return this.body;
    }
    if (this.bunRequest.body) {
      const text = await this.bunRequest.text();
      return text;
    }
    return "";
  }

  // Additional methods that might be expected
  setTimeout(msecs: number, callback?: () => void): this {
    // No-op for compatibility
    return this;
  }

  destroy(error?: Error): this {
    this.destroyed = true;
    if (error) {
      this.emit("error", error);
    }
    this.emit("close");
    return this;
  }
}
