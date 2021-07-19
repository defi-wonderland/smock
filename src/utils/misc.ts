const timeWords = [null, 'once', 'twice', 'thrice'];
export function humanizeTimes(count: number) {
  return timeWords[count] || `${count || 0} times`;
}
