declare module 'jsbarcode' {
  export interface JsBarcodeOptions {
    background?: string;
    displayValue?: boolean;
    format?: string;
    fontSize?: number;
    height?: number;
    lineColor?: string;
    margin?: number;
    width?: number;
  }

  const JsBarcode: (
    element: SVGElement | HTMLCanvasElement | HTMLImageElement | string,
    text: string,
    options?: JsBarcodeOptions,
  ) => void;

  export default JsBarcode;
}
