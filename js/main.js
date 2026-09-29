/* Static layout matches the Figma frame (1366px). The stage is scaled uniformly to the viewport width at every size
   (up and down), so it always fills the window edge to edge; k = 1 at 1366px. */
(function(){var r=document.documentElement,w0;function fit(){var w=r.clientWidth;if(w===w0)return;w0=w;var o=w===1366?0:1;
r.style.setProperty('--o',o);r.style.setProperty('--k',(w+2*o)/1366);}
fit();addEventListener('resize',fit);addEventListener('load',fit);if(window.ResizeObserver)new ResizeObserver(fit).observe(r);})();
