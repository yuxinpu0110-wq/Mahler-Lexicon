export type ReplayRange=[number,number];
export function replayWindow(time:number,duration:number,length=5):ReplayRange{const start=Math.max(0,Math.min(Math.round(time*10)/10,duration));return[start,Math.min(duration,start+length)]}
export function validReplay(range:ReplayRange,duration:number){return range.every(Number.isFinite)&&range[0]>=0&&range[1]>range[0]&&range[1]<=duration}
