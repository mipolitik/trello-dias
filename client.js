/* Días en Programación · complemento privado de Trello. No envía datos a ningún servidor. */
(function clientMain() {
  var M = window.MP, V = '?v=2', BASE = 'https://mipolitik.github.io/trello-dias/';
  function leer(t) {
    return Promise.all([
      t.card('id', 'shortLink', 'idList', 'labels', 'dueComplete', 'dateLastActivity'),
      t.list('name'),
      t.get('board', 'shared', 'seed'),
      t.get('card', 'shared', 'd'),
      t.get('board', 'shared', 'cfg')
    ]).then(function (r) {
      var ln = (r[1] && r[1].name) || '';
      var res = M.calc(r[0], ln, r[2] || {}, r[3] || null, M.hoy());
      res.ln = ln; res.c = M.cfg(r[4]);
      if (!res.cambio) return res;
      return t.set('card', 'shared', 'd', res.d).then(function () { return res; }, function () { return res; });
    });
  }
  window.TrelloPowerUp.initialize({
    'card-badges': function (t) {
      return leer(t).then(function (r) { return M.insignias(r, r.ln, r.c); });
    },
    'card-detail-badges': function (t) {
      return leer(t).then(function (r) {
        if (r.sinDato) return [];
        var b = [];
        if (r.fin) {
          if (r.t != null) b.push({ title: 'Resuelta en', text: M.txt(r.t), color: 'green' });
          if (r.ok) b.push({ title: 'Comprobado', text: M.fecha(r.d.ok), color: 'green' });
        } else {
          b.push({ title: 'En Programación', text: M.txt(r.p), color: M.color(r.p, r.c) });
          b.push({ title: 'En esta lista', text: M.txt(r.l) });
          if (M.RE.prod.test(r.ln)) b.push({ title: 'Estado', text: 'Nos toca probar', color: 'blue' });
          if (r.sm >= r.c.sm) b.push({ title: 'Sin movimiento', text: M.txt(r.sm), color: 'orange' });
        }
        if (r.v > 0) b.push({ title: 'Volvió', text: r.v === 1 ? '1 vez' : r.v + ' veces', color: 'red' });
        return b;
      });
    },
    'card-buttons': function (t) {
      return leer(t).then(function (r) {
        if (r.sinDato || !M.RE.prod.test(r.ln)) return [];
        return [{
          icon: BASE + 'icon.svg',
          text: r.ok ? 'Quitar «Comprobado»' : 'Comprobado',
          callback: function (t2) {
            return t2.get('card', 'shared', 'd').then(function (d) {
              d = d || r.d; var h = M.hoy();
              if (d.ok != null) { delete d.ok; delete d.f; delete d.t; }
              else { d.ok = h; if (d.f == null) { d.f = h; d.t = Math.max(0, h - d.a); } }
              return t2.set('card', 'shared', 'd', d);
            });
          }
        }];
      });
    },
    'board-buttons': function () {
      return [{
        icon: { dark: BASE + 'icon.svg', light: BASE + 'icon.svg' },
        text: 'Antigüedad',
        callback: function (t) {
          return t.modal({ url: './antiguedad.html' + V, title: 'Antigüedad · Programación', height: 640 });
        }
      }];
    },
    'show-settings': function (t) {
      return t.popup({ title: 'Días en Programación', url: './settings.html' + V, height: 250 });
    }
  });
})();
