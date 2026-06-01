import { useState } from 'react';


export const useDerivAccountData = () => {
  const [user_account, setAccount] = useState<any>();

  const setDerivAccountData = (data: any) => {
    setAccount(data);
  };

  return {
    user_account,
    setDerivAccountData,
  };
};
