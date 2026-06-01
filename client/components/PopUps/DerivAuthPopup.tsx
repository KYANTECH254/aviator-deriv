"use client"

import { useEffect, useRef, useState, MouseEvent } from "react";
import { myPref } from "@/lib/Setting";

interface DerivAuthPopupProps {
    onClose: () => void;
    onManualToken: (token: string) => void;
}

const CODE_VERIFIER_KEY = "deriv_oauth_code_verifier";
const OAUTH_STATE_KEY = "deriv_oauth_state";
const REDIRECT_URI_KEY = "deriv_oauth_redirect_uri";

const base64UrlEncode = (bytes: Uint8Array) => {
    let binary = "";
    bytes.forEach((byte) => {
        binary += String.fromCharCode(byte);
    });

    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};

const generateCodeVerifier = () => {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    return base64UrlEncode(bytes);
};

const generateCodeChallenge = async (verifier: string) => {
    const encodedVerifier = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", encodedVerifier);
    return base64UrlEncode(new Uint8Array(digest));
};

export default function DerivAuthPopup({ onClose, onManualToken }: DerivAuthPopupProps) {
    const popupRef = useRef<HTMLDivElement>(null);
    const [manualToken, setManualToken] = useState("");

    const handleOutsideClick = (event: MouseEvent | Event) => {
        if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
            onClose();
        }
    };

    useEffect(() => {
        document.addEventListener("mousedown", handleOutsideClick);
        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
        };
    }, []);

    const handleManualTokenSubmit = () => {
        const token = manualToken.trim();
        if (!token) return;
        onManualToken(token);
    };

    const handleOAuthLogin = async () => {
        const clientId = String(myPref.appId);
        const redirectUri =
            process.env.NEXT_PUBLIC_DERIV_OAUTH_REDIRECT_URI ||
            `${window.location.origin}${window.location.pathname}`;
        const state = crypto.randomUUID();
        const codeVerifier = generateCodeVerifier();
        const codeChallenge = await generateCodeChallenge(codeVerifier);
        const authUrl = new URL(myPref.oauthUrl);

        sessionStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
        sessionStorage.setItem(OAUTH_STATE_KEY, state);
        sessionStorage.setItem(REDIRECT_URI_KEY, redirectUri);

        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("client_id", clientId);
        authUrl.searchParams.set("redirect_uri", redirectUri);
        authUrl.searchParams.set("scope", myPref.oauthScope);
        authUrl.searchParams.set("state", state);
        authUrl.searchParams.set("code_challenge", codeChallenge);
        authUrl.searchParams.set("code_challenge_method", "S256");

        window.location.assign(authUrl.toString());
    };

    return (
        <div id="deriv-auth-tab" className="aviator-popup-container">
            <div ref={popupRef} className="aviator-rules-popup aviator-auth-popup">
                <div className="aviator-popup-header">
                    <div className="aviator-popup-header-left">DERIV AUTHENTICATION</div>
                    <div onClick={onClose} id="aviator-auth-popup-close" className="aviator-popup-header-right">
                        <i className="fa fa-times" aria-hidden="true"></i>
                    </div>
                </div>
                <div className="aviator-rules-popup-body column">
                    <div className="aviator-rules-text" style={{ marginBottom: '16px' }}>
                        Securely connect your Deriv account to start trading and access the game.
                    </div>
                    <div className="aviator-rules-text" style={{ marginBottom: '24px', fontSize: '0.95rem', color: '#d8d8d8' }}>
                        You will be redirected to Deriv to sign in. After authorization, you will return to the game automatically.
                    </div>
                    <button
                        className="aviator-popup-button"
                        style={{ padding: '14px 16px', borderRadius: '8px', border: 'none', background: '#e91b1b', color: '#fff', fontWeight: 600 }}
                        onClick={handleOAuthLogin}
                    >
                        LOG IN WITH DERIV
                    </button>
                    <div className="aviator-popup-divider" style={{ margin: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.08)' }} />
                    <div className="aviator-rules-heading" style={{ marginBottom: '12px' }}>
                        Enter your Deriv token manually
                    </div>
                    <input
                        value={manualToken}
                        onChange={(event) => setManualToken(event.target.value)}
                        placeholder="Paste your Deriv token here"
                        className="aviator-input"
                        style={{ marginBottom: '12px' }}
                    />
                    <button
                        className="aviator-popup-button"
                        style={{ padding: '14px 16px', borderRadius: '8px', border: 'none', background: '#333', color: '#fff', fontWeight: 600 }}
                        onClick={handleManualTokenSubmit}
                    >
                        USE MANUAL TOKEN
                    </button>
                    <div className="aviator-rules-heading" style={{ marginTop: '24px' }}>
                        Why this is required
                    </div>
                    <div className="aviator-rules-text" style={{ marginTop: '12px', color: '#d8d8d8' }}>
                        We need your Deriv login to authenticate the session, create a secure game token, and allow the
                        server to authorize socket connections.
                    </div>
                </div>
            </div>
        </div>
    );
}
