// Sculpted pinwheel: n curved blades around a star shaped void. Returns blade polygons in a 512 box centered at 256.
export function blades(o){
  const n=o.n||4, R=o.R||210, rLow=o.rLow||120, rIn=o.rIn||40, bend=o.bend||0.6, gap=o.gap||14, rot=o.rot??-Math.PI/2, N=48;
  const P=(a,r)=>[256+r*Math.cos(a),256+r*Math.sin(a)];
  // spike k: quadratic from center to edge, bent
  const spike=k=>{const a=rot+k*2*Math.PI/n; return {p0:[256,256], c:P(a+bend,R*0.5), p1:P(a,R*1.02)};};
  const q=(s,t)=>[(1-t)*(1-t)*s.p0[0]+2*(1-t)*t*s.c[0]+t*t*s.p1[0],(1-t)*(1-t)*s.p0[1]+2*(1-t)*t*s.c[1]+t*t*s.p1[1]];
  const qd=(s,t)=>[2*(1-t)*(s.c[0]-s.p0[0])+2*t*(s.p1[0]-s.c[0]),2*(1-t)*(s.c[1]-s.p0[1])+2*t*(s.p1[1]-s.c[1])];
  const tAt=(s,r)=>{let lo=0,hi=1;for(let i=0;i<40;i++){const m=(lo+hi)/2;const p=q(s,m);Math.hypot(p[0]-256,p[1]-256)<r?lo=m:hi=m;}return (lo+hi)/2;};
  const off=(s,t,side)=>{const p=q(s,t),d=qd(s,t),L=Math.hypot(d[0],d[1])||1;return [p[0]+side*(-d[1]/L)*gap/2,p[1]+side*(d[0]/L)*gap/2];};
  const out=[];
  for(let k=0;k<n;k++){
    const A=spike(k),B=spike((k+1)%n);
    const tA0=tAt(A,rIn), tA1=tAt(A,rLow), tB0=tAt(B,rIn*0.62), tB1=tAt(B,R);
    const pts=[];
    // along spike A outward (blade sits on its +normal side)
    for(let i=0;i<=N;i++){const t=tA0+(tA1-tA0)*i/N; pts.push(off(A,t,+1));}
    // outer edge: from spike A at rLow sweeping to the tip on spike B at R
    const a0=Math.atan2(pts[pts.length-1][1]-256,pts[pts.length-1][0]-256);
    const tip=off(B,tB1,-1); let a1=Math.atan2(tip[1]-256,tip[0]-256); while(a1<a0) a1+=2*Math.PI;
    const r0=Math.hypot(pts[pts.length-1][0]-256,pts[pts.length-1][1]-256), r1=Math.hypot(tip[0]-256,tip[1]-256);
    for(let i=1;i<N;i++){const u=i/N; const e=Math.pow(u, o.ease||1.7); pts.push(P(a0+(a1-a0)*u, r0+(r1-r0)*e + (o.bulge||18)*Math.sin(Math.PI*u)));}
    // back along spike B inward (blade on its -normal side)
    for(let i=N;i>=0;i--){const t=tB0+(tB1-tB0)*i/N; pts.push(off(B,t,-1));}
    out.push(pts);
  }
  return out;
}
export const toPath = polys => polys.map(p=>"M"+p.map(v=>v[0].toFixed(1)+" "+v[1].toFixed(1)).join("L")+"Z").join("");
// Petals: disc split by a concave four point star (the evening star sits in the middle).
export function petals(o){
  const n=o.n||4, R=o.R||196, rTip=300, rIn=o.rIn||26, rot=o.rot??-Math.PI/2, N=60;
  const P=(a,r)=>[256+r*Math.cos(a),256+r*Math.sin(a)];
  const out=[];
  for(let k=0;k<n;k++){
    const a=rot+k*2*Math.PI/n, b=a+Math.PI/n, c=a+2*Math.PI/n;
    const p0=P(a,rTip), cc=P(b,rIn), p1=P(c,rTip);
    const Q=t=>[(1-t)*(1-t)*p0[0]+2*(1-t)*t*cc[0]+t*t*p1[0],(1-t)*(1-t)*p0[1]+2*(1-t)*t*cc[1]+t*t*p1[1]];
    const rad=t=>{const p=Q(t);return Math.hypot(p[0]-256,p[1]-256);};
    const find=(lo,hi,inside)=>{for(let i=0;i<50;i++){const m=(lo+hi)/2;(rad(m)>R)===inside?lo=m:hi=m;}return (lo+hi)/2;};
    const t1=find(0,0.5,true), t2=find(1,0.5,true);
    const pts=[]; for(let i=0;i<=N;i++) pts.push(Q(t1+(t2-t1)*i/N));
    let a2=Math.atan2(pts[N][1]-256,pts[N][0]-256), a1=Math.atan2(pts[0][1]-256,pts[0][0]-256);
    while(a1>a2) a1-=2*Math.PI; while(a2-a1>2*Math.PI) a1+=2*Math.PI;
    for(let i=1;i<N;i++){const u=i/N; pts.push(P(a2+(a1-a2)*u,R));}
    out.push(pts);
  }
  return out;
}
