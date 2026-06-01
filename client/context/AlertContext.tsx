import Alert from '@/components/PopUps/Alert';
import useNetworkStatus from '@/hooks/useNetworkStatus';
import React, { createContext, useContext, useState, ReactNode, useRef, useEffect } from 'react';

interface AlertItem {
  id: string;
  message: any;
  duration: number;
  type: string;
  position: number;
  closeBtn: boolean;
}

interface AlertContextType {
  addAlert: (message: any, duration: number, type: string, position: number, closeBtn: boolean) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const { isOnline, connectionType, isSlowConnection } = useNetworkStatus();

  const isOnlineRef = useRef(isOnline);
  const isSlowConnectionRef = useRef(isSlowConnection);
  const connectionTypeRef = useRef(connectionType);

  useEffect(() => {
      isOnlineRef.current = isOnline;
      isSlowConnectionRef.current = isSlowConnection;
      connectionTypeRef.current = connectionType;
  }, [isOnline, connectionType, isSlowConnection]);
  
  const addAlert = (message: any, duration: number, type: string, position: number, closeBtn: boolean) => {
    const id = Math.random().toString(36).substr(2, 9);
    setAlerts(prevAlerts => [...prevAlerts, { id, message, duration, type, position, closeBtn }]);
    
    setTimeout(() => {
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
    }, duration);
  };

  const removeAlert = (id: string) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== id));
  };

  useEffect(() => {
    if (isSlowConnection && isOnline) {
        addAlert(`Slow connection`, 3000, "orange", 1, false);
    } else if (!isSlowConnection && !isOnline) {
        addAlert(`Connection lost, check your internet connection`, 3000, "red", 1, false);
    }
  }, [isSlowConnection, isOnline, connectionType]);

  return (
    <AlertContext.Provider value={{ addAlert }}>
      {children}
      <div className="alert-container">
        {alerts.map((alert) => (
          <Alert
            key={alert.id}
            message={alert.message}
            duration={alert.duration}
            type={alert.type}
            position={alert.position}
            closeBtn={alert.closeBtn}
            onClose={() => removeAlert(alert.id)}
          />
        ))}
      </div>
    </AlertContext.Provider>
  );
};
