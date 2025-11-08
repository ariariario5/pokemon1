 document.addEventListener('DOMContentLoaded',
  function() {
      const startBtn =
  document.getElementById('start-btn');
      const continueBtn =
  document.getElementById('continue-btn');

      if (startBtn) {
          startBtn.addEventListener('click', function()
  {
              // タイトル画面を隠す
              const titleScreen =
  document.getElementById('title-screen');
              const introScreen =
  document.getElementById('intro-screen');

              titleScreen.classList.add('hidden');
              introScreen.classList.remove('hidden');
          });
      }

      if (continueBtn) {
          continueBtn.addEventListener('click',
  function() {
              // 導入画面を隠してバトル画面を表示
              const introScreen =
  document.getElementById('intro-screen');
              const battleScreen =
  document.getElementById('battle-screen');

              introScreen.classList.add('hidden');
              battleScreen.classList.remove('hidden');
          });
      }
  });
