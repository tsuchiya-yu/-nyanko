import React, { createContext, useContext, useState } from 'react';

const HeaderContext = createContext(null);

export const HeaderProvider = ({ children }) => {
  const [isHeaderFooterVisible, setHeaderFooterVisible] = useState(true);

  return (
    <HeaderContext.Provider value={{ isHeaderFooterVisible, setHeaderFooterVisible }}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeaderFooter = () => {
  return useContext(HeaderContext);
}; 