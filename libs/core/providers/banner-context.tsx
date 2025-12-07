import React, { createContext, useContext, useState } from 'react';

interface BannerContextType {
  bannerLoaded: boolean;
  setBannerLoaded: (value: boolean) => void;
}

const BannerContext = createContext<BannerContextType>({
  bannerLoaded: false,
  setBannerLoaded: () => {},
});

export const BannerProvider = ({ children }: { children: React.ReactNode }) => {
  const [bannerLoaded, setBannerLoaded] = useState(false);

  return (
    <BannerContext.Provider value={{ bannerLoaded, setBannerLoaded }}>
      {children}
    </BannerContext.Provider>
  );
};

export const useBanner = () => useContext(BannerContext);
