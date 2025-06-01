import type { Request, Response, NextFunction } from "express";

export const createMockRequest = (data: Partial<Request> = {}): Request => {
  return {
    body: {},
    params: {},
    query: {},
    headers: {},
    method: 'POST',
    ...data,
  } as Request;
};

export const createMockResponse = (): Response => {
  const res = {
    _status: 200,
    _json: undefined,
    headersSent: false,
    status: function(code: number) {
      this._status = code;
      return this;
    },
    json: function(data: any) {
      this._json = data;
      return this;
    },
    end: function() {
      return this;
    },
    sendStatus: function(code: number) {
      this._status = code;
      return this;
    },
    send: function(data: any) {
      this._json = data;
      return this;
    },
  } as any;
  
  return res as Response;
};

export const createMockNext = (): NextFunction => {
  return (() => {}) as NextFunction;
};