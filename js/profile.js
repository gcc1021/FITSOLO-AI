/* FITSOLO 个人中心：会员守卫、D1 打卡日历、统计与历史记录。 */
(function () {
  'use strict';

  var auth = window.FITSOLO_AUTH;
  var store = window.FITSOLO_STORE;
  var identity = auth && auth.getIdentity();

  if (!identity || identity.role !== 'member' || !identity.token) {
    window.location.replace('index.html');
    return;
  }

  var records = [];
  var calendarDate = new Date();
  calendarDate.setDate(1);

  var dialog = document.getElementById('checkInDialog');
  var form = document.getElementById('checkInForm');
  var openButton = document.getElementById('openCheckInButton');
  var submitButton = document.getElementById('submitCheckInButton');
  var status = document.getElementById('checkInStatus');
  var formMessage = document.getElementById('checkInFormMessage');

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function maskPhone(phone) {
    return phone ? phone.slice(0, 3) + ' **** ' + phone.slice(-4) : '—';
  }

  function formatLoginDate(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(date);
  }

  function dateKey(date) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function todayKey() {
    return dateKey(new Date());
  }

  function dateBefore(key, days) {
    var parts = key.split('-').map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setDate(date.getDate() - days);
    return dateKey(date);
  }

  function calculateStreak(items) {
    var checked = new Set(items.map(function (item) { return item.checkInDate; }));
    var cursor = todayKey();
    if (!checked.has(cursor)) cursor = dateBefore(cursor, 1);
    var streak = 0;
    while (checked.has(cursor)) {
      streak += 1;
      cursor = dateBefore(cursor, 1);
    }
    return streak;
  }

  function setStatus(text, type) {
    status.textContent = text;
    status.className = 'checkin-status' + (type ? ' is-' + type : '');
  }

  function apiFetch(options) {
    var config = options || {};
    config.headers = Object.assign({}, auth.getAuthHeaders(), config.headers || {});
    return fetch('/api/check-ins', config).then(async function (response) {
      var data = await response.json().catch(function () { return {}; });
      if (response.status === 401) {
        auth.clearIdentity();
        window.location.replace('index.html');
        throw new Error('登录状态已失效，请重新登录。');
      }
      if (!response.ok) throw new Error(data.message || '打卡服务暂不可用。');
      return data;
    });
  }

  function renderCalendar() {
    var year = calendarDate.getFullYear();
    var month = calendarDate.getMonth();
    var firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var checkedDates = new Set(records.map(function (record) { return record.checkInDate; }));
    var container = document.getElementById('calendarDays');
    setText('calendarMonth', year + ' 年 ' + (month + 1) + ' 月');
    container.replaceChildren();

    for (var blank = 0; blank < firstWeekday; blank += 1) {
      var empty = document.createElement('span');
      empty.className = 'calendar-day is-empty';
      empty.setAttribute('aria-hidden', 'true');
      container.appendChild(empty);
    }

    for (var day = 1; day <= daysInMonth; day += 1) {
      var cellDate = new Date(year, month, day);
      var key = dateKey(cellDate);
      var cell = document.createElement('span');
      cell.className = 'calendar-day';
      cell.textContent = String(day);
      if (key === todayKey()) cell.classList.add('is-today');
      if (checkedDates.has(key)) cell.classList.add('is-checked');
      cell.setAttribute('aria-label', key + (checkedDates.has(key) ? '，已打卡' : '，未打卡'));
      container.appendChild(cell);
    }
  }

  function renderTimeline() {
    var timeline = document.getElementById('checkInTimeline');
    setText('recordCount', records.length + ' 条');
    timeline.replaceChildren();
    if (!records.length) {
      var empty = document.createElement('p');
      empty.className = 'muted small';
      empty.textContent = '还没有打卡记录，完成今天的第一次训练吧。';
      timeline.appendChild(empty);
      return;
    }

    records.slice(0, 10).forEach(function (record) {
      var item = document.createElement('article');
      item.className = 'checkin-record';
      var title = document.createElement('strong');
      title.textContent = record.trainingType;
      var time = document.createElement('time');
      time.dateTime = record.checkInDate;
      time.textContent = record.checkInDate;
      var meta = document.createElement('span');
      meta.className = 'checkin-record-meta';
      meta.textContent = '训练 ' + record.durationMinutes + ' 分钟';
      var note = document.createElement('p');
      note.textContent = record.note || '今天没有填写备注。';
      item.append(title, time, meta, note);
      timeline.appendChild(item);
    });
  }

  function renderCheckInData() {
    setText('checkinValue', records.length + ' 天');
    setText('streakValue', calculateStreak(records) + ' 天');
    openButton.textContent = records.some(function (record) { return record.checkInDate === todayKey(); })
      ? '更新今日打卡' : '今日打卡';
    renderCalendar();
    renderTimeline();
  }

  async function loadRecords(successMessage) {
    setStatus('正在读取打卡记录…');
    try {
      var data = await apiFetch({ method: 'GET' });
      records = Array.isArray(data.records) ? data.records : [];
      renderCheckInData();
      setStatus(successMessage || (records.length ? '打卡数据已同步。' : '还没有打卡记录。'), successMessage ? 'success' : '');
    } catch (error) {
      setStatus(error.message || '读取打卡记录失败，请稍后重试。', 'error');
    }
  }

  function openDialog() {
    formMessage.textContent = '';
    var todayRecord = records.find(function (record) { return record.checkInDate === todayKey(); });
    form.trainingType.value = todayRecord ? todayRecord.trainingType : '';
    form.durationMinutes.value = todayRecord ? todayRecord.durationMinutes : '';
    form.note.value = todayRecord ? todayRecord.note : '';
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    window.setTimeout(function () { form.trainingType.focus(); }, 80);
  }

  function closeDialog() {
    if (typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  var profile = store.profile();
  var plan = store.plan();
  setText('memberGreeting', identity.displayName || 'FITSOLO 会员');
  setText('memberName', identity.displayName || 'FITSOLO 会员');
  setText('memberPhone', '手机号：' + maskPhone(identity.phone));
  setText('memberId', identity.memberId || '—');
  setText('memberLoginTime', formatLoginDate(identity.loggedInAt));
  setText('goalValue', profile && profile.goal ? profile.goal : '未设置');
  setText('planValue', plan && plan.profile ? plan.profile.durationWeeks + ' 周' : '未生成');

  openButton.addEventListener('click', openDialog);
  document.getElementById('closeCheckInButton').addEventListener('click', closeDialog);
  document.getElementById('cancelCheckInButton').addEventListener('click', closeDialog);
  dialog.addEventListener('click', function (event) {
    if (event.target === dialog) closeDialog();
  });
  document.getElementById('calendarPrev').addEventListener('click', function () {
    calendarDate.setMonth(calendarDate.getMonth() - 1);
    renderCalendar();
  });
  document.getElementById('calendarNext').addEventListener('click', function () {
    calendarDate.setMonth(calendarDate.getMonth() + 1);
    renderCalendar();
  });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    formMessage.textContent = '';
    var durationMinutes = Number(form.durationMinutes.value);
    if (!form.trainingType.value) {
      formMessage.textContent = '请选择训练类型。';
      form.trainingType.focus();
      return;
    }
    if (!Number.isInteger(durationMinutes) || durationMinutes < 1 || durationMinutes > 600) {
      formMessage.textContent = '请输入 1–600 分钟的有效训练时长。';
      form.durationMinutes.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = '正在保存…';
    try {
      await apiFetch({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainingType: form.trainingType.value,
          durationMinutes: durationMinutes,
          note: form.note.value.trim()
        })
      });
      closeDialog();
      await loadRecords('今日打卡已保存，日历与统计已更新。');
    } catch (error) {
      formMessage.textContent = error.message || '保存打卡失败，请稍后重试。';
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = '保存打卡';
    }
  });

  document.getElementById('logoutButton').addEventListener('click', function () {
    auth.clearIdentity();
    window.location.replace('index.html');
  });

  renderCalendar();
  loadRecords();
})();
