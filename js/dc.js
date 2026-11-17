/*
 * Tiny runtime for the MOHH pages.
 * Each page keeps its markup in <template id="view"> using {{holes}},
 * <sc-for list as> and <sc-if value>, and its logic in
 * <script type="text/x-dc"> as `class Component extends DCLogic`.
 * Rendering uses Preact (js/preact.min.js).
 */
(function () {
  var h = preact.h, render = preact.render, Fragment = preact.Fragment;

  function DCLogic(props) { this.props = props || {}; this.state = {}; }
  DCLogic.prototype.setState = function (patch) {
    var next = typeof patch === 'function' ? patch(this.state, this.props) : patch;
    this.state = Object.assign({}, this.state, next);
    if (this.__host) this.__host.forceUpdate();
  };
  window.DCLogic = DCLogic;

  var HOLE = /\{\{\s*([^}]+?)\s*\}\}/g;
  var EXACT = /^\{\{\s*([^}]+?)\s*\}\}$/;

  function lookup(expr, scope) {
    expr = expr.trim();
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'null') return null;
    if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr);
    if (/^'.*'$|^".*"$/.test(expr)) return expr.slice(1, -1);
    var parts = expr.split('.');
    var v = scope;
    for (var i = 0; i < parts.length; i++) {
      if (v == null) return undefined;
      v = v[parts[i]];
    }
    return v;
  }
  function interp(str, scope) {
    return str.replace(HOLE, function (_, e) {
      var v = lookup(e, scope);
      return v == null ? '' : String(v);
    });
  }

  // Attribute names lowercased by the HTML parser -> Preact prop names
  var EVENTS = { onclick: 'onClick', onchange: 'onInput', oninput: 'onInput', onsubmit: 'onSubmit',
    onkeydown: 'onKeyDown', onfocus: 'onFocus', onblur: 'onBlur', onmouseenter: 'onMouseEnter', onmouseleave: 'onMouseLeave' };

  function build(node, scope, key) {
    if (node.nodeType === 3) {
      var t = node.nodeValue;
      if (t.indexOf('{{') === -1) return t;
      var m = t.match(EXACT);
      if (m) { var v = lookup(m[1], scope); return v == null || v === false ? null : v; }
      return interp(t, scope);
    }
    if (node.nodeType !== 1) return null;
    var tag = node.localName;

    if (tag === 'sc-for') {
      var list = lookup((node.getAttribute('list') || '').replace(/^\{\{|\}\}$/g, ''), scope) || [];
      var as = node.getAttribute('as') || 'item';
      return list.map(function (item, i) {
        var s = Object.create(scope); s[as] = item;
        return h(Fragment, { key: i }, kids(node, s));
      });
    }
    if (tag === 'sc-if') {
      var cond = lookup((node.getAttribute('value') || '').replace(/^\{\{|\}\}$/g, ''), scope);
      return cond ? kids(node, scope) : null;
    }

    var props = {};
    for (var i = 0; i < node.attributes.length; i++) {
      var a = node.attributes[i], name = a.name, val = a.value;
      if (name.indexOf('hint-') === 0) continue;
      var exact = val.match(EXACT);
      var v = exact ? lookup(exact[1], scope) : (val.indexOf('{{') > -1 ? interp(val, scope) : val);
      if (EVENTS[name]) { if (typeof v === 'function') props[EVENTS[name]] = v; continue; }
      if (name === 'value' && (tag === 'input' || tag === 'textarea')) { props.value = v == null ? '' : v; continue; }
      if (name === 'checked' || name === 'disabled' || name === 'selected') { props[name] = exact ? !!v : true; continue; }
      if (v === false || v == null) continue;
      props[name] = v;
    }
    if (key != null) props.key = key;
    return h(tag, props, tag === 'textarea' ? null : kids(node, scope));
  }
  function kids(node, scope) {
    var out = [];
    var c = node.content ? node.content.childNodes : node.childNodes;
    for (var i = 0; i < c.length; i++) {
      var r = build(c[i], scope);
      if (r == null) continue;
      if (Array.isArray(r)) out.push.apply(out, r); else out.push(r);
    }
    return out;
  }

  function boot() {
    var tpl = document.getElementById('view');
    var src = document.querySelector('script[type="text/x-dc"]').textContent;
    var Component = new Function('DCLogic', src + '\n;return Component;')(DCLogic);

    function Host() { preact.Component.call(this); }
    Host.prototype = Object.create(preact.Component.prototype);
    Host.prototype.constructor = Host;
    Host.prototype.componentWillMount = function () {
      this.logic = new Component({});
      this.logic.__host = this;
    };
    Host.prototype.componentDidMount = function () { if (this.logic.componentDidMount) this.logic.componentDidMount(); };
    Host.prototype.componentWillUnmount = function () { if (this.logic.componentWillUnmount) this.logic.componentWillUnmount(); };
    Host.prototype.render = function () {
      var vals = this.logic.renderVals ? this.logic.renderVals() : {};
      return h(Fragment, null, kids(tpl, vals));
    };

    var root = document.getElementById('app');
    render(h(Host, null), root);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
