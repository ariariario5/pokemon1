 document.addEventListener('DOMContentLoaded',
  function() {
      const startBtn =
  document.getElementById('start-btn');

      if (startBtn) {
          startBtn.addEventListener('click', function()
  {
              alert('ボタンが動いてます！');

              const titleScreen =
  document.getElementById('title-screen');
              const introScreen =
  document.getElementById('intro-screen');

              titleScreen.style.display = 'none';
              introScreen.style.display = 'flex';
          });
      }
  });
