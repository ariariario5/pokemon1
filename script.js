console.log('Script loaded successfully!');

  document.addEventListener('DOMContentLoaded',
  function() {
      console.log('DOM ready!');

      const startBtn =
  document.getElementById('start-btn');
      console.log('Start button found:', startBtn);

      if (startBtn) {
          startBtn.addEventListener('click', function()
  {
              console.log('Button clicked!');
              alert('ボタンが動いてます！');

              const titleScreen =
  document.getElementById('title-screen');
              const introScreen =
  document.getElementById('intro-screen');

              titleScreen.style.display = 'none';
              introScreen.style.display = 'flex';
          });
      } else {
          console.error('Start button NOT found!');
      }
  });
