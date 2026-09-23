export const bases = Object.freeze({acquaintance:50000,colleague:100000,close:150000,best:200000});
export function calculate({relation='colleague',attendance='meal',people=1,meal=null}={}) {
 if(!Object.hasOwn(bases,relation))throw new Error('친밀도를 선택해 주세요.');
 if(!['meal','no-meal','absent'].includes(attendance))throw new Error('참석 방식을 선택해 주세요.');
 if(!Number.isInteger(people)||people<1||people>10)throw new Error('식사 인원은 1~10명입니다.');
 if(meal!==null&&(!Number.isFinite(meal)||meal<0||meal>1000000))throw new Error('식대는 0~1,000,000원 사이로 입력해 주세요.');
 const base=bases[relation]; const mealTotal=attendance==='meal'&&meal!==null?meal*people:null;
 const amount=Math.ceil(Math.max(base,mealTotal??0)/50000)*50000;
 return {base,mealTotal,amount,upper:amount+50000};
}
