import { useState, useEffect, createContext, useContext, ReactNode } from "react";

interface MobileContextType {
  isMobile: boolean;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const MobileContext = createContext<MobileContextType | undefined>(undefined);

export function MobileProvider({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Initial check
    checkMobile();

    // Listen for window resize
    window.addEventListener("resize", checkMobile);

    // Clean up event listener
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  return (
    <MobileContext.Provider value={{ isMobile, isSidebarOpen, setIsSidebarOpen }}>
      {children}
    </MobileContext.Provider>
  );
}

export function useMobile() {
  const context = useContext(MobileContext);
  if (context === undefined) {
    throw new Error("useMobile must be used within a MobileProvider");
  }
  return context;
}
