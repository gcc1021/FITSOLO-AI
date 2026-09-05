/* FITSOLO 共享导航 + 页脚 + 移动端菜单 */
(function (root) {
  'use strict';

  var LINKS = [
    ['home.html', '首页'],
    ['planner.html', '做方案'],
    ['checker.html', '打卡监督'],
    ['coach.html', '智能指导'],
    ['replay.html', '案例回放']
  ];

  function getIdentity() {
    if (root.FITSOLO_AUTH) return root.FITSOLO_AUTH.getIdentity();
    return null;
  }

  function navLinksFor(identity) {
    var links = LINKS.slice();
    if (identity && identity.role === 'member') {
      links.push(['profile.html', '个人中心']);
    }
    return links;
  }

  function buildNav(links) {
    return '<nav class="nav"><div class="container nav-inner">'
      + '<a class="logo" href="home.html"><span class="logo-mark">F</span> FITSOLO<span class="logo-sub">AI × OPC</span></a>'
      + '<button class="nav-toggle" id="navToggle" aria-label="菜单" aria-expanded="false" aria-controls="navLinks"><span></span><span></span><span></span></button>'
      + '<div class="nav-links" id="navLinks">'
      + links.map(function (link) {
        return '<a href="' + link[0] + '" data-page="' + link[0] + '">' + link[1] + '</a>';
      }).join('')
      + '<a class="btn btn-primary btn-sm" href="planner.html">免费体测</a>'
      + '</div></div></nav>';
  }

  function buildFooter() {
    return '<footer class="footer"><div class="container">'
      + '<div class="footer-grid">'
      + '<div><div class="logo"><span class="logo-mark">F</span> FITSOLO</div>'
      + '<p class="muted">AI × OPC 智能私教平台 —— 做方案 · 打卡监督 · 智能指导</p></div>'
      + '<div class="footer-links">'
      + LINKS.map(function (link) { return '<a href="' + link[0] + '">' + link[1] + '</a>'; }).join('')
      + '</div></div>'
      + '<p class="disclaimer">免责声明：本平台 AI 方案仅供参考，不构成医疗诊断或治疗建议，结果因人而异；如有疾病请遵医嘱。'
      + '演示数据为模拟脱敏样例，非真实学员。</p>'
      + '<p class="muted small">© 2026 FITSOLO · v0.8 Demo</p>'
      + '</div></footer>';
  }

  function init() {
    var identity = getIdentity();
    var navHost = document.getElementById('site-nav');
    var footHost = document.getElementById('site-footer');
    if (navHost) navHost.innerHTML = buildNav(navLinksFor(identity));
    if (footHost) footHost.innerHTML = buildFooter();

    var page = location.pathname.split('/').pop() || 'home.html';
    document.querySelectorAll('.nav-links a[data-page]').forEach(function (link) {
      if (link.getAttribute('data-page') === page) link.classList.add('active');
    });

    var toggle = document.getElementById('navToggle');
    var links = document.getElementById('navLinks');
    if (toggle && links) {
      toggle.addEventListener('click', function () {
        var isOpen = links.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(isOpen));
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})(window);
