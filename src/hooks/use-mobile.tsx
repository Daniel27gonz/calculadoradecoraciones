import * as React from "react";

const MOBILE_BREAKPOINT = 768;

const getIsMobileViewport = () => {
  if (typeof window === "undefined") return false;
  return window.innerWidth < MOBILE_BREAKPOINT;
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(getIsMobileViewport);

  React.useEffect(() => {
    const onViewportChange = () => {
      setIsMobile(getIsMobileViewport());
    };

    onViewportChange();
    window.addEventListener("resize", onViewportChange);
    window.addEventListener("orientationchange", onViewportChange);

    return () => {
      window.removeEventListener("resize", onViewportChange);
      window.removeEventListener("orientationchange", onViewportChange);
    };
  }, []);

  return isMobile;
}

