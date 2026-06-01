"use client"

import { useGetQueryParams } from "./useGetQueryParams";

export type AviatorAccountsT = {
    apiKey: string;
    platform: string;
    platformId: String;
    derivId: string;
    origin:String;
};

export const useAviatorAccount = (): AviatorAccountsT => {
    const aviatorAccount = useGetQueryParams();

    return {
        apiKey: aviatorAccount.apiKey || "",  
        platform: aviatorAccount.platform || "", 
        platformId: aviatorAccount.platformId || '',  
        derivId: aviatorAccount.derivId || "", 
        origin: "",
    };
};


