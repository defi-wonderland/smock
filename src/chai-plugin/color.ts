// import supportsColor from 'supports-color';

function colorize(str: string, color: number) {
  // if (supportsColor.stdout === false) {
  //     return str;
  // }

  return `\x1b[${color}m${str}\x1b[0m`;
}

export const red = (str: string) => {
  return colorize(str, 31);
};

export const green = (str: string) => {
  return colorize(str, 32);
};

export const cyan = (str: string) => {
  return colorize(str, 96);
};

export const white = (str: string) => {
  return colorize(str, 39);
};

export const bold = (str: string) => {
  return colorize(str, 1);
};
