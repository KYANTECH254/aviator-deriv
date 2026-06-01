import { useState, useEffect, useRef } from 'react';

const safeJSONParse = (value: string | null, fallback: any) => {
    if (!value || value === 'undefined' || value === 'null') return fallback;
    try {
        return JSON.parse(value);
    } catch {
        return fallback;
    }
};

export default function useStoredAccounts() {
    const [activeAccount, setActiveAccount] = useState<any>('');
    const [storedAccounts, setStoredAccounts] = useState<any[]>([]);

    const activeAccountRef = useRef(activeAccount);
    const storedAccountsRef = useRef(storedAccounts);

    useEffect(() => {
        activeAccountRef.current = activeAccount;
        storedAccountsRef.current = storedAccounts;
    }, [activeAccount, storedAccounts]);


    useEffect(() => {
        const activeAccountSetting = sessionStorage.getItem('activeAccount');
        const storedAccountsSetting = sessionStorage.getItem('accounts');

        setActiveAccount(safeJSONParse(activeAccountSetting, ''));
        setStoredAccounts(safeJSONParse(storedAccountsSetting, []));
    }, []);

    const toggleActiveAccount = (account: any) => {
        setActiveAccount(account);
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('activeAccount', JSON.stringify(account));
        }
    };

    const setDerivAccounts = (accountsOrUpdater: any) => {
        setStoredAccounts((currentAccounts) => {
            const nextAccounts =
                typeof accountsOrUpdater === 'function'
                    ? accountsOrUpdater(currentAccounts)
                    : accountsOrUpdater;
            const normalizedAccounts = Array.isArray(nextAccounts) ? nextAccounts : [];

            if (typeof window !== 'undefined') {
                sessionStorage.setItem('accounts', JSON.stringify(normalizedAccounts));
            }

            return normalizedAccounts;
        });
    };

    return {
        activeAccount,
        toggleActiveAccount,
        storedAccounts,
        setDerivAccounts,
        setActiveAccount
    };
}
