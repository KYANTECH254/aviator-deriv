"use client"

import { useGetQueryParams } from "./useGetQueryParams"

export type AccountsT = {
  code: string
  loginid: string
  token: string
  isLive: boolean
  currency: string
  derivId: string
  authToken: any
}

export const useDerivAccount = (): AccountsT[] => {
  const derivAccounts = useGetQueryParams();
  const myDerivAccounts = [];

  let i = 1;
  while (derivAccounts[`acct${i}`]) {
    const loginid = derivAccounts[`acct${i}`];

    myDerivAccounts.push({
      code: loginid,
      loginid,
      token: derivAccounts[`token${i}`],
      isLive: false, 
      currency: derivAccounts[`cur${i}`],
      derivId: derivAccounts[`derivId`],
      authToken: ''
    });
    i++;
  }

  return myDerivAccounts;
}

