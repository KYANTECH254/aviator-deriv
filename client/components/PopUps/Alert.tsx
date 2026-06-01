import React, { useEffect } from 'react';

interface AlertProps {
  message: any;
  duration: number;
  type: string;
  closeBtn: boolean;
  position: number;
  onClose: () => void;
}

export default function Alert({ message, duration, type, closeBtn, position, onClose }: AlertProps) {

  useEffect(() => {
    const timer = setTimeout(onClose, duration);  
    return () => clearTimeout(timer); 
  }, [duration, onClose]);

  return (
    <>
      {position === 1 && (
        <div className={`alert-popup ${type}`} id="alertPopup">
          <span className="alert-message"> {message}</span>
          {closeBtn && (
            <button onClick={onClose} id="close-alert" className="close-btn"><i className="fa fa-times" aria-hidden="true"></i></button>
          )}
        </div>
      )}
      {position === 2 && (
        <div className="alert-popup-win">
          <div className="alert-popup-win-left column">
            <div className="left-top-text">
              You have cashed out!
            </div>
            <div className="left-bottom-text">
              {message.cashout || "N/A"}x
            </div>
          </div>
          <div className="alert-popup-win-middle">
            <img className="win-amount-text" src="assets/images/winbutton.png" alt="Win amount" />
            <div className="middle-top-text">
              Win {message.currency || "N/A"}
            </div>
            <div className="middle-bottom-text">
              {message.amount || "N/A"}
            </div>
          </div>
          {closeBtn && (
            <div onClick={onClose} className="alert-popup-win-right display-center">
              <i className="fa fa-times" aria-hidden="true"></i>
            </div>
          )}
        </div>
      )}
    </>
  );
}
