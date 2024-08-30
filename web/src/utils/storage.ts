export const storeAccountInfo = (account: string, address: string, privateKey: string) => {

    localStorage.setItem('account', JSON.stringify({account, address, privateKey}));
}


export const loadAccountInfo = (): any => {

    const accountInfo = localStorage.getItem('account');
    return accountInfo ? JSON.parse(accountInfo) : {};
}