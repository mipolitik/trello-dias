/* Días en Programación · complemento privado de Trello.
   Muestra en cada tarjeta cuántos días lleva en el tablero y en su lista.
   No escribe en nombres, descripciones ni historial: solo guarda, dentro de Trello,
   la fecha de llegada de cada tarjeta. No envía datos a ningún servidor. */
(function () {
  var RD = 4 * 3600 * 1000, DIA = 86400000;            // República Dominicana, UTC-4
  function dia(ms) { return Math.floor((ms - RD) / DIA); }
  function hoy() { return dia(Date.now()); }
  function creada(id) { return dia(parseInt(String(id).substring(0, 8), 16) * 1000); }
  function txt(n) { return n + (n === 1 ? ' día' : ' días'); }
  function color(n) { return n >= 14 ? 'red' : (n >= 7 ? 'yellow' : 'light-gray'); }

  function lista(card, list) {
    if (card.dueComplete) return true;
    if (list && /^completad/i.test(list.name || '')) return true;
    return (card.labels || []).some(function (l) { return /^listo$/i.test(l.name || ''); });
  }

  // Devuelve {p: días en el tablero, l: días en la lista} o null si la tarjeta ya está lista.
  function cuenta(t) {
    return Promise.all([
      t.card('id', 'shortLink', 'idList', 'labels', 'dueComplete'),
      t.list('name'),
      t.get('board', 'shared', 'seed'),
      t.get('card', 'shared', 'd')
    ]).then(function (r) {
      var card = r[0], list = r[1], seed = r[2] || {}, d = r[3];
      if (lista(card, list)) return null;
      var h = hoy(), cambio = false;
      if (!d) {
        var s = seed[card.shortLink];
        if (s) d = { a: s[0], i: s[1], l: card.idList };
        else {
          var c = creada(card.id);
          var a = (h - c) <= 1 ? c : h;                 // creada antes en otro tablero: llega hoy
          d = { a: a, i: a, l: card.idList };
        }
        cambio = true;
      } else if (d.l !== card.idList) {                 // cambió de lista
        d = { a: d.a, i: h, l: card.idList };
        cambio = true;
      }
      var res = { p: Math.max(0, h - d.a), l: Math.max(0, h - d.i) };
      if (!cambio) return res;
      return t.set('card', 'shared', 'd', d).then(function () { return res; }, function () { return res; });
    });
  }

  window.TrelloPowerUp.initialize({
    'card-badges': function (t) {
      return cuenta(t).then(function (r) {
        if (!r) return [];
        return [{ text: txt(r.p), color: color(r.p), refresh: 3600 }];
      });
    },
    'card-detail-badges': function (t) {
      return cuenta(t).then(function (r) {
        if (!r) return [];
        return [
          { title: 'En Programación', text: txt(r.p), color: color(r.p) },
          { title: 'En esta lista', text: txt(r.l) }
        ];
      });
    },
    'show-settings': function (t) {
      return t.popup({ title: 'Días en Programación', url: './settings.html', height: 260 });
    }
  });
})();
