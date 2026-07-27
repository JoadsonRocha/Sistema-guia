/// <reference types="vite/client" />

declare interface Window {
  gtag?: (
    command: string,
    action: string,
    params?: Record<string, any>
  ) => void;
  dataLayer?: any[];
}

declare module '*.png' {
  const value: string;
  export default value;
}

declare module '*.jpg' {
  const value: string;
  export default value;
}

declare module '*.svg' {
  const value: string;
  export default value;
}

