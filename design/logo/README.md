# Vesper logo source

Five curved chrome blades turning around a small star shaped opening. Vesper is the evening star.

* `blades.js` builds the mark's geometry. The logo uses `blades({n:5, bend:0.7, rLow:110})`.
* `r3d.html` renders it in 3D with three.js (studio lighting, chrome material, blue glow backdrop).

To render again, copy three.js 0.170.0 next to these files:

```
npm pack three@0.170.0 && tar -xzf three-0.170.0.tgz
mkdir three && cp package/build/three.module.js three/ && cp -r package/examples/jsm three/jsm
```

Serve this folder over http and open, for example:

* App icon tile: `r3d.html?w=1024&shape=blades&mat=chrome&view=icon&bloom=0.18&front=0.55&cz=13.2&p={"n":5,"bend":0.7,"rLow":110}`
* Adaptive icon (mark inside the safe zone): same with `cz=18`
* Transparent mark for the app: `r3d.html?w=768&shape=blades&mat=chrome&view=icon&front=0.7&cz=10.4&transparent=1&p={"n":5,"bend":0.7,"rLow":110}`

The app icon tile gets rounded corners (22.5 percent radius) after rendering.
