var MP = (function MPcore() {
  /* Días en Programación · núcleo común. Todo se calcula y se guarda dentro de Trello. */
  var RD = 4 * 3600 * 1000, DIA = 86400000;            // República Dominicana, UTC-4
  function dia(ms) { return Math.floor((ms - RD) / DIA); }
  function hoy() { return dia(Date.now()); }
  function creada(id) { return dia(parseInt(String(id).substring(0, 8), 16) * 1000); }
  function txt(n) { return n + (n === 1 ? ' día' : ' días'); }
  function fecha(d) {
    var x = new Date(d * DIA + RD + DIA / 2);
    var m = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    return x.getUTCDate() + ' ' + m[x.getUTCMonth()];
  }
  function cfg(c) {
    c = c || {};
    return { am: +c.am > 0 ? +c.am : 7, ro: +c.ro > 0 ? +c.ro : 14, sm: +c.sm > 0 ? +c.sm : 7 };
  }
  function color(n, c) { return n >= c.ro ? 'red' : (n >= c.am ? 'yellow' : 'light-gray'); }
  function tiene(card, re) { return (card.labels || []).some(function (l) { return re.test(l.name || ''); }); }
  var RE = { comp: /^completad/i, prod: /^en producci[oó]n/i, curso: /^(en progreso|testing|en producci[oó]n)/i };
  function cerrada(card, ln, d) {
    if (card.dueComplete || RE.comp.test(ln || '') || tiene(card, /^listo$/i)) return true;
    return !!(d && d.ok != null && RE.prod.test(ln || ''));
  }
  /* d = {a: día de llegada, i: día de entrada a la lista, l: lista, f: día de cierre, t: días que tardó, v: veces que volvió, ok: día comprobado} */
  function calc(card, ln, seed, d, h) {
    var cambio = false, nd = d ? JSON.parse(JSON.stringify(d)) : null;
    var fin = cerrada(card, ln, nd);
    if (!nd) {
      if (fin) return { d: null, cambio: false, fin: true, sinDato: true, v: 0, ok: false };
      var s = (seed || {})[card.shortLink];
      if (s) nd = { a: s[0], i: s[1], l: card.idList };
      else { var c = creada(card.id); var a = (h - c) <= 1 ? c : h; nd = { a: a, i: a, l: card.idList }; }
      cambio = true;
    }
    if (fin) {
      if (nd.f == null) { nd.f = h; nd.t = Math.max(0, h - nd.a); cambio = true; }
      if (nd.l !== card.idList) { nd.l = card.idList; cambio = true; }
    } else if (nd.f != null) {
      nd.v = (nd.v || 0) + 1; delete nd.f; delete nd.t; delete nd.ok;
      nd.a = h; nd.i = h; nd.l = card.idList; cambio = true;
    } else {
      if (nd.ok != null) { delete nd.ok; cambio = true; }
      if (nd.l !== card.idList) { nd.i = h; nd.l = card.idList; cambio = true; }
    }
    var v = nd.v || 0; if (!v && tiene(card, /^volvi/i)) v = 1;
    var act = card.dateLastActivity ? dia(new Date(card.dateLastActivity).getTime()) : null;
    return {
      d: nd, cambio: cambio, fin: fin, sinDato: false,
      p: Math.max(0, h - nd.a), l: Math.max(0, h - nd.i), t: nd.t, v: v, ok: nd.ok != null,
      sm: act == null ? 0 : Math.max(0, h - act)
    };
  }
  function insignias(r, ln, c) {
    if (r.sinDato) return [];
    if (r.fin) return r.t != null ? [{ text: 'Resuelta en ' + txt(r.t), color: 'green' }] : [];
    var b = [{ text: txt(r.p), color: color(r.p, c) }];
    if (RE.prod.test(ln)) b.push({ text: 'Nos toca probar', color: 'blue' });
    if (RE.curso.test(ln) && r.l < r.p) b.push({ text: txt(r.l) + ' en esta lista', color: 'sky' });
    if (r.sm >= c.sm) b.push({ text: 'Sin movimiento ' + txt(r.sm), color: 'orange' });
    if (r.v > 0) b.push({ text: r.v > 1 ? 'Volvió ' + r.v + ' veces' : 'Volvió', color: 'red' });
    return b;
  }
  return { dia: dia, hoy: hoy, creada: creada, txt: txt, fecha: fecha, cfg: cfg, color: color, tiene: tiene, RE: RE, cerrada: cerrada, calc: calc, insignias: insignias };
})();
