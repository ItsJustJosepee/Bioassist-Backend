import { Request, Response } from 'express';

/******************************************************************************
                                Types
******************************************************************************/

type UrlParams = Record<string, string>;
type PlainObject = Record<string, any>;

export type Req = Request<UrlParams, void, PlainObject>;
export type Res = Response;
