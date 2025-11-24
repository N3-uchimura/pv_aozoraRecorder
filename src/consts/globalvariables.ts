/**
 * globalvariables.ts
 **
 * function：global variables
**/

/** const */
// default
export namespace myConst {
  export const DEVMODE: boolean = true;
  export const COMPANY_NAME: string = "nthree";
  export const APP_NAME: string = "aozorastation";
  export const LOG_LEVEL: string = "all";
  export const DEFAULT_ENCODING: string = "utf8";
  export const HOSTNAME: string = '127.0.0.1';
}

// default
export namespace myNums {
  export const WINDOW_WIDTH: number = 600;
  export const WINDOW_HEIGHT: number = 1000;
  export const PORT: number = 5000;
}

// default
export namespace mySynthesis {
  export const params = (txt: string, modelname: string): any => {
    return {
      text: txt,
      encoding: 'utf-8',
      model_name: modelname,
      sdp_ratio: 0.2,
      noise: 0.6,
      noisew: 0.8,
      length: 1.1,
      language: 'JP',
      auto_split: true,
      split_interval: 2,
      assist_text_weight: 1.0,
      style: 'Neutral',
      style_weight: 5.0,
    };
  }
}