 document.addEventListener('DOMContentLoaded',
  function() {
      console.log('Script ready!');

      const startBtn =
  document.getElementById('start-btn');
      const continueBtn =
  document.getElementById('continue-btn');

      console.log('Buttons found:', {
          start: !!startBtn,
          continue: !!continueBtn
      });

      // はじめるボタン
      if (startBtn) {
          startBtn.addEventListener('click', function()
  {
              console.log('Start clicked!');
              const titleScreen =
  document.getElementById('title-screen');
              const introScreen =
  document.getElementById('intro-screen');

              titleScreen.classList.add('hidden');
              introScreen.classList.remove('hidden');
          });
      }

      // 続けるボタン
      if (continueBtn) {
          continueBtn.addEventListener('click',
  function() {
              console.log('Continue clicked!');
              const introScreen =
  document.getElementById('intro-screen');
              const battleScreen =
  document.getElementById('battle-screen');

              introScreen.classList.add('hidden');
              battleScreen.classList.remove('hidden');
          });
      } else {
          console.log('Continue button not found!');
      }
  });
