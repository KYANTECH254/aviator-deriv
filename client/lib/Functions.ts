import * as cookie from "cookie";

export const sanitizeInput = (input: string | null) => {
    if (!input) return null;
    return input.replace(/[^\w\s.-]/gi, "");
};


export const validateParams = (apiKey: string | null, platformId: string | null) => {
    if (!apiKey || !platformId) {
        //   throw new Error("Missing required parameters");
        return false
    }
    if (apiKey.length !== 64) {
        //   throw new Error("Invalid API key format");
        return false
    }
    if (platformId.length !== 32) {
        //   throw new Error("Invalid Platform ID format");
        return false
    }

    return true;
};

export function generateUsername(num: string) {
    const lastDigit = num.slice(-1);
    return `2***${lastDigit}`;
}

export function SetCookie(token: string) {
    document.cookie = cookie.serialize("token", token, {
        path: "/",
        secure: false,
        httpOnly: false,
        sameSite: "strict",
    });

    return true;
}

export const GetCookie = (token: string) => {
    if (typeof window !== 'undefined' && document) {
      const match = document.cookie.match(new RegExp('(^| )' + token + '=([^;]+)'));
      return match ? match[2] : undefined;
    }
    return undefined;
  };

export function DeleteCookie(name: string) {
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    return true;
}
  