import type { Request, Response } from "express";
import * as RequestService from "./requests.service.ts";
// import { AppError } from "../../shared/errors/AppError.ts";

export const trackPublicRequest = async (req : Request, res: Response)=>{
    const protocol = req.params.protocol as string;
    const email = req.query.email as string;

    if(typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({
          error: 'Email é obrigatório'
        })
    }

    const request = {
        protocol : protocol ,
        email : email,
    }

const foundResquest = await RequestService.findRequest(request);

  return res.status(200).json({
    protocol: foundResquest.protocol,
    title: foundResquest.title,
    status: foundResquest.status,
    created_at: foundResquest.created_at,
    updated_at: foundResquest.updated_at,
  });
};