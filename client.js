/* Días en Programación · complemento privado de Trello. No envía datos a ningún servidor fuera de Trello. */
(function clientMain() {
  var M = window.MP, V = '?v=3', BASE = 'https://mipolitik.github.io/trello-dias/';
  var KEY = '4fd24ab22726e2bcda6691364198bc8a', NOMBRE = 'Días en Programación';
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
  function hoyLargo() {
    var x = new Date(Date.now() - 4 * 3600 * 1000);
    return M.fecha(M.hoy()) + ' ' + x.getUTCFullYear();
  }
  /* Llamada a Trello con la autorización de quien pulsa el botón. La clave y el permiso van en el cuerpo, no en la dirección. */
  function llamar(metodo, ruta, datos, tk) {
    var p = new URLSearchParams(datos); p.set('key', KEY); p.set('token', tk);
    return fetch('https://api.trello.com/1/' + ruta, {
      method: metodo, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString()
    }).then(function (r) { if (!r.ok) throw new Error('Trello ' + r.status); return r; });
  }
  function comprobar(t2, r) {
    return t2.get('card', 'shared', 'd').then(function (d) {
      d = d || r.d; var h = M.hoy();
      if (d.ok != null) { delete d.ok; delete d.f; delete d.t; return t2.set('card', 'shared', 'd', d); }
      var api = t2.getRestApi();
      return api.isAuthorized().then(function (si) {
        if (!si) return t2.popup({ title: 'Autorizar una sola vez', url: './autorizar.html' + V, height: 190 });
        return Promise.all([api.getToken(), t2.lists('id', 'name')]).then(function (x) {
          var tk = x[0], id = t2.getContext().card;
          var comp = (x[1] || []).filter(function (l) { return M.RE.comp.test(l.name || ''); })[0];
          d.ok = h; if (d.f == null) { d.f = h; d.t = Math.max(0, h - d.a); }
          return t2.set('card', 'shared', 'd', d).then(function () {
            return llamar('POST', 'cards/' + id + '/actions/comments', { text: 'Comprobado · ' + hoyLargo() }, tk);
          }).then(function () {
            return comp ? llamar('PUT', 'cards/' + id, { idList: comp.id, pos: 'top' }, tk) : null;
          }).then(function () {
            return t2.alert({ message: comp ? 'Comprobado: comentario puesto y tarjeta en Completado.' : 'Comprobado: comentario puesto. No hay lista «Completado».', duration: 6 });
          }, function () {
            return t2.alert({ message: 'Quedó marcada como comprobada, pero no se pudo comentar o mover la tarjeta.', duration: 10, display: 'error' });
          });
        });
      });
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
          if (M.RE.prod.test(r.ln)) b.push({ title: 'Nos toca probar', text: 'Marcar comprobado', color: 'green', callback: function (t2) { return comprobar(t2, r); } });
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
          callback: function (t2) { return comprobar(t2, r); }
        }];
      });
    },
    'board-buttons': function () {
      return [{
        icon: { dark: BASE + 'icon.svg', light: BASE + 'icon.svg' },
        text: 'Antigüedad',
        callback: function (t) {
          return t.modal({ url: './antiguedad.html?v=4', title: 'Antigüedad · Programación', height: 640 });
        }
      }];
    },
    'show-settings': function (t) {
      return t.popup({ title: NOMBRE, url: './settings.html?v=2', height: 250 });
    }
  }, { appKey: KEY, appName: NOMBRE });
})();
