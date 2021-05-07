export function toPrettyJSON<T>(input: T): string {
  return JSON.stringify(input, null, '    ');
}

export async function delay(time: number): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, time));
}

export function objectCopy<T>(input: T): T {
  return JSON.parse(JSON.stringify(input));
}

export function arrayChunk<T extends any[]>(arr: T, len: number): any[] {
  const
    n = arr.length,
    chunks = [];

  let i = 0;

  while (i < n) {
    chunks.push(arr.slice(i, i += len));
  }

  return chunks;
}

export function formatNumber(val: number): string {
  if (val > 9999) return val.toLocaleString('en-US');
  return String(val);
}

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

export function L(...args: any[]): any[] {
  const
    len = args.length,
    out = [];

  for (let i = 0; i < len; i++) {
    const val = args[i];

    if (typeof val === 'object' && !(val instanceof Error)) {
      out.push(val, `${JSON.stringify(val)}`);
    } else {
      out.push(val);
    }
  }

  return out;
}

export function beforeClose(fn: () => void): void {
  window.addEventListener('beforeunload', e => {
    console.log('beforeunload fired', e);
    delete e.returnValue;
    fn();
    console.log('beforeunload complete');
  });
}
