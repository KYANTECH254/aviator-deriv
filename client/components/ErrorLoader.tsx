import Link from "next/link";

export default function ErrorLoader() {
    return (
        <div className="loader-1" >
            <img src="/assets/images/error.png" alt="Error" className="mb2" />
            <div className="error-container column display-center rowg1">
                <div className="error-middle-text">You have been disconnected. Check connection and refresh your browser, or go back to landing page</div>
                <Link href="/">
                    <button type="button" className="home-btn">Home</button>
                </Link>
            </div>
        </div>
    )
}