import { createContext, useContext, useState, type ReactNode } from 'react';

interface HeaderContextType {
  isHeaderFooterVisible: boolean;
  setHeaderFooterVisible: (value: boolean) => void;
}

const HeaderContext = createContext<HeaderContextType | null>(null);

export const HeaderProvider = ({ children }: { children: ReactNode }) => {
  const [isHeaderFooterVisible, setHeaderFooterVisible] = useState(true);

  return (
    <HeaderContext.Provider value={{ isHeaderFooterVisible, setHeaderFooterVisible }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeaderFooter = (): HeaderContextType => {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error('useHeaderFooter must be used within a HeaderProvider');
  }
  return context;
};
