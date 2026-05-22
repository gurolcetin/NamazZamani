import React, { createContext, useContext, useState } from 'react';

interface BannerContextType {
  bannerLoaded: boolean;
  setBannerLoaded: (value: boolean) => void;
  bottomOverlayHeight: number;
  setBottomOverlayHeight: (value: number) => void;
}

const BannerContext = createContext<BannerContextType>({
  bannerLoaded: false,
  setBannerLoaded: () => {},
  bottomOverlayHeight: 0,
  setBottomOverlayHeight: () => {},
});

export const BannerProvider = ({ children }: { children: React.ReactNode }) => {
  const [bannerLoaded, setBannerLoaded] = useState(false);
  const [bottomOverlayHeight, setBottomOverlayHeight] = useState(0);

  return (
    <BannerContext.Provider
      value={{
        bannerLoaded,
        setBannerLoaded,
        bottomOverlayHeight,
        setBottomOverlayHeight,
      }}
    >
      {children}
    </BannerContext.Provider>
  );
};

export const useBanner = () => useContext(BannerContext);
