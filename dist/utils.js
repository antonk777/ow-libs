export function toPrettyJSON(input) {
    return JSON.stringify(input, null, '    ');
}
export async function delay(time) {
    await new Promise(resolve => setTimeout(resolve, time));
}
export function objectCopy(input) {
    return JSON.parse(JSON.stringify(input));
}
export function arrayChunk(arr, len) {
    const n = arr.length, chunks = [];
    let i = 0;
    while (i < n) {
        chunks.push(arr.slice(i, i += len));
    }
    return chunks;
}
export function formatNumber(val) {
    if (val > 9999)
        return val.toLocaleString('en-US');
    return String(val);
}
export function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}
export function L(...args) {
    const len = args.length, out = [];
    for (let i = 0; i < len; i++) {
        const val = args[i];
        if (typeof val === 'object' && !(val instanceof Error)) {
            out.push(val, `${JSON.stringify(val)}`);
        }
        else {
            out.push(val);
        }
    }
    return out;
}
export function beforeClose(fn) {
    window.addEventListener('beforeunload', e => {
        console.log('beforeunload fired', e);
        delete e.returnValue;
        fn();
        console.log('beforeunload complete');
    });
}
//# sourceMappingURL=utils.js.map