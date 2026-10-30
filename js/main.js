/* ============================================================
   个人主页 · 交互脚本
   1. 首屏图片：点击放大 / Esc 关闭
   2. 视频播放遮罩、时长回填、倍速、加载失败提示
   3. 滚动入场动画
   ============================================================ */

(function () {
  'use strict';

  /* ---------------- 图片大图预览 ---------------- */

  var showcase = document.getElementById('showcase');
  var lightbox = document.getElementById('lightbox');
  var lightboxClose = document.getElementById('lightbox-close');
  var lastFocus = null;

  function openLightbox() {
    if (!lightbox) return;
    lastFocus = document.activeElement;
    lightbox.hidden = false;
    document.body.classList.add('is-locked');
    if (lightboxClose) lightboxClose.focus();
  }

  function closeLightbox() {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.classList.remove('is-locked');
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  if (showcase && lightbox) {
    showcase.addEventListener('click', openLightbox);
    if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeLightbox();
    });
  }

  /* ---------------- 视频 ---------------- */

  var video = document.getElementById('player-video');
  var poster = document.getElementById('poster');
  var posterLabel = document.getElementById('poster-label');
  var posterHint = document.getElementById('poster-hint');
  var metaLine = document.getElementById('meta-line');
  var speedBtns = Array.prototype.slice.call(document.querySelectorAll('.speeds button'));

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds <= 0) return '--:--';
    var total = Math.round(seconds);
    var m = Math.floor(total / 60);
    var s = String(total % 60).padStart(2, '0');
    return m + ':' + s;
  }

  function showPoster(label) {
    poster.classList.remove('is-hidden');
    if (label) posterLabel.textContent = label;
  }

  function hidePoster() {
    poster.classList.add('is-hidden');
  }

  /**
   * 只在“还没开始播放”或“播放结束”时显示遮罩，
   * 播放中途暂停时不遮挡原生控制条。
   */
  function syncPoster() {
    if (video.ended) {
      showPoster('重新播放');
    } else if (video.paused && video.currentTime === 0) {
      showPoster('点击播放');
    }
  }

  function startPlayback() {
    if (poster.classList.contains('is-error')) return;
    if (video.ended) video.currentTime = 0;
    var p = video.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () { /* 自动播放被拦截时忽略 */ });
    }
  }

  function showVideoError() {
    var code = video.error ? video.error.code : 0;
    var reasons = {
      1: '播放被中止',
      2: '读取文件出错',
      3: '解码失败',
      4: '找不到文件或格式不支持',
    };
    poster.classList.remove('is-hidden');
    poster.classList.add('is-error');
    posterLabel.textContent = '视频无法播放' + (reasons[code] ? '：' + reasons[code] : '');
    posterHint.textContent = '请确认 MP4 在项目根目录，或双击 server\\start.bat 再试';
  }

  if (video && poster) {
    /* 如果 ../ 路径取不到视频，再试一次同目录，兼容复制过的页面 */
    var altSrcTried = false;

    video.addEventListener('error', function () {
      if (!altSrcTried) {
        var alt = video.getAttribute('data-alt-src');
        if (alt) {
          altSrcTried = true;
          video.src = alt;
          video.load();
          return;
        }
      }
      showVideoError();
    });

    poster.addEventListener('click', startPlayback);
    poster.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        startPlayback();
      }
    });

    video.addEventListener('play', hidePoster);
    video.addEventListener('pause', syncPoster);
    video.addEventListener('ended', syncPoster);

    video.addEventListener('loadedmetadata', function () {
      var duration = formatTime(video.duration);
      poster.classList.remove('is-error');
      posterLabel.textContent = '点击播放 · ' + duration;
      posterHint.textContent = video.videoWidth + '×' + video.videoHeight + ' · MP4 / H.264';
      metaLine.textContent = video.videoWidth + '×' + video.videoHeight +
        ' · H.264 · AAC · ' + duration;
    });

    speedBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var rate = Number(btn.getAttribute('data-rate')) || 1;
        video.playbackRate = rate;
        speedBtns.forEach(function (b) {
          b.classList.toggle('is-active', b === btn);
        });
      });
    });
  }

  /* ---------------- 滚动入场 ---------------- */

  var revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------------- 页脚年份 ---------------- */

  var year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
