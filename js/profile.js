/* FITSOLO 个人中心：会员身份守卫与本地训练数据概览 */
(function () {
  'use strict';

  var auth = window.FITSOLO_AUTH;
  var store = window.FITSOLO_STORE;
  var identity = auth && auth.getIdentity();

  if (!identity || identity.role !== 'member') {
    window.location.replace('index.html');
    return;
  }

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function maskPhone(phone) {
    return phone ? phone.slice(0, 3) + ' **** ' + phone.slice(-4) : '—';
  }

  function formatDate(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(date);
  }

  var profile = store.profile();
  var plan = store.plan();
  var checkins = store.checkins();

  setText('memberGreeting', identity.displayName || 'FITSOLO 会员');
  setText('memberName', identity.displayName || 'FITSOLO 会员');
  setText('memberPhone', '手机号：' + maskPhone(identity.phone));
  setText('memberId', identity.memberId || '—');
  setText('memberLoginTime', formatDate(identity.loggedInAt));
  setText('goalValue', profile && profile.goal ? profile.goal : '未设置');
  setText('planValue', plan && plan.profile ? plan.profile.durationWeeks + ' 周' : '未生成');
  setText('checkinValue', checkins.length + ' 天');

  if (plan && plan.profile) {
    setText('nextStepTitle', checkins.length ? '保持今日打卡' : '完成第一次打卡');
    setText('nextStepDescription', checkins.length
      ? '继续记录训练与恢复状态，让智能指导更懂你的节奏。'
      : '方案已经准备好，记录训练、饮食、睡眠和体重，开始积累进度。');
  }

  document.getElementById('logoutButton').addEventListener('click', function () {
    auth.clearIdentity();
    window.location.replace('index.html');
  });
})();
