(function(){
  const D = window.ROME_DATA, tl = window.__timelines[D.meta.id];
  if (!tl) return;
  D.maps.forEach(function(m){
    tl.fromTo("#"+m.id, {autoAlpha:0}, {autoAlpha:1, duration:0.4, ease:"power2.out"}, m.start);
    if (m.end < D.meta.duration) tl.to("#"+m.id, {autoAlpha:0, duration:0.3, ease:"power2.in"}, m.end-0.3);
  });
  (D.routes || []).forEach(function(r){
    tl.to("#"+r.id, {autoAlpha:0, duration:0.3}, r.end-0.3);
  });
  D.markers.forEach(function(m){
    tl.fromTo("#"+m.id+" .micon", {y:-120, autoAlpha:0}, {y:0, autoAlpha:1, duration:0.6, ease:"bounce.out"}, m.at);
    tl.fromTo("#"+m.id+" .mlabel", {scale:0, autoAlpha:0}, {scale:1, autoAlpha:1, duration:0.4, ease:"back.out(2)"}, m.at+0.4);
    tl.to("#"+m.id, {autoAlpha:0, duration:0.3}, m.until-0.3);
  });
})();
