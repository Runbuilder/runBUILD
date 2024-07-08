<!DOCTYPE html>
<html lang=""ko"">

<head>
  <meta charset=""UTF-8"">
  <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
  <title>강아지 점프 어드벤처 2.0</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;700&display=swap');

    body {
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #87CEEB, #4CA1AF);
      font-family: 'Noto Sans KR', sans-serif;
    }

    #gameContainer {
      position: relative;
      width: 800px;
      height: 400px;
      overflow: hidden;
      border-radius: 10px;
      box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
    }

    #gameCanvas {
      background-color: #F0F8FF;
    }

    #startScreen,
    #gameOverScreen {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
    }

    #gameOverScreen {
      display: none;
    }

    h1 {
      font-size: 36px;
      margin-bottom: 20px;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    }

    button {
      padding: 10px 20px;
      font-size: 18px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      transition: background-color 0.3s;
    }

    button:hover {
      background-color: #45a049;
    }

    #score,
    #time {
      position: absolute;
      top: 10px;
      font-size: 20px;
      color: #333;
      background-color: rgba(255, 255, 255, 0.7);
      padding: 5px 10px;
      border-radius: 5px;
    }

    #score {
      left: 10px;
    }

    #time {
      right: 10px;
    }
    /* 캐릭터 미리보기를 위한 새로운 스타일 */
    #characterPreview {
      display: flex;
      justify-content: space-around;
      align-items: center;
      margin-top: 20px;
    }

    .character {
      width: 80px;
      height: 80px;
      margin: 0 10px;
    }
    #energy {
      position: absolute;
      top: 10px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 5px;
    }

    .energy-icon {
      width: 30px;
      height: 30px;
    }
  </style>
</head>

<body>
  <div id=""gameContainer"">
    <canvas id=""gameCanvas"" width=""800"" height=""400""></canvas>
    <div id=""startScreen"">
      <h1>강아지 점프 어드벤처 2.0</h1>
      <div id=""characterPreview"">
        <!-- 캐릭터 미리보기를 위한 공간 -->
      </div>
      <button id=""startButton"">게임 시작</button>
    </div>
    <div id=""gameOverScreen"">
      <h1>게임 오버!</h1>
      <p id=""finalScore""></p>
      <p id=""finalTime""></p>
      <button id=""restartButton"">다시 시작</button>
    </div>
    <div id=""score"">점수: 0</div>
    <div id=""time"">시간: 0초</div>

    <div id=""energy""></div>
  </div>

  <script>
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const startButton = document.getElementById('startButton');
    const restartButton = document.getElementById('restartButton');
    const scoreText = document.getElementById('score');
    const timeText = document.getElementById('time');
    const finalScoreText = document.getElementById('finalScore');
    const finalTimeText = document.getElementById('finalTime');
    let energy = 3;

    let gameLoop;
    let dog = {x: 50, y: 300, width: 40, height: 40, jumping: false, yVelocity: 0};
    let monsters = [];
    let score = 0;
    let gameSpeed = 0.4;
    let isGameRunning = false;
    let gameTime = 0;
    let lastMonsterSpawn = 0;
    let backgroundX = 0;

    // 음향 효과 추가
    const jumpSound = new Audio('https://res.cloudinary.com/djzf2mipa/video/upload/v1719202146/AiClass/jump_jdbzdd.mp3');
    const startSound = new Audio('https://res.cloudinary.com/djzf2mipa/video/upload/v1707639098/AiClass/gamestart_aczexa.mp3');
    const gameOverSound = new Audio('https://res.cloudinary.com/djzf2mipa/video/upload/v1707638140/AiClass/uk_dmmxme.mp3');
    const backgroundMusic = new Audio('https://res.cloudinary.com/djzf2mipa/video/upload/v1707635834/AiClass/bg_z1hnss.mp3');
    backgroundMusic.loop = true;

    const dogSvg = new Image();
    dogSvg.src = 'data:image/svg+xml,' + encodeURIComponent(`
            <svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 200 200"">
                <circle cx=""100"" cy=""100"" r=""70"" fill=""#F4C430""/>
                <circle cx=""75"" cy=""80"" r=""10"" fill=""#000000""/>
                <circle cx=""125"" cy=""80"" r=""10"" fill=""#000000""/>
                <circle cx=""100"" cy=""110"" r=""10"" fill=""#000000""/>
                <path d=""M 85 125 Q 100 140 115 125"" fill=""none"" stroke=""#000000"" stroke-width=""3""/>
                <path d=""M 60 40 Q 50 20 70 35"" fill=""#F4C430"" stroke=""#000000"" stroke-width=""3""/>
                <path d=""M 140 40 Q 150 20 130 35"" fill=""#F4C430"" stroke=""#000000"" stroke-width=""3""/>
            </svg>
        `);

    const monsterSvgs = [
      `<svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 200 200"">
                <circle cx=""100"" cy=""100"" r=""80"" fill=""#FF9999""/>
                <circle cx=""70"" cy=""80"" r=""20"" fill=""white""/>
                <circle cx=""70"" cy=""80"" r=""10"" fill=""black""/>
                <circle cx=""130"" cy=""80"" r=""20"" fill=""white""/>
                <circle cx=""130"" cy=""80"" r=""10"" fill=""black""/>
                <path d=""M 70 130 Q 100 150 130 130"" fill=""none"" stroke=""black"" stroke-width=""5""/>
                <path d=""M 70 30 L 50 10 L 90 20 Z"" fill=""#FF6666""/>
                <path d=""M 130 30 L 150 10 L 110 20 Z"" fill=""#FF6666""/>
            </svg>`,
      `<svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 200 200"">
                <rect x=""20"" y=""20"" width=""160"" height=""160"" rx=""20"" fill=""#99FF99""/>
                <circle cx=""70"" cy=""80"" r=""25"" fill=""white""/>
                <circle cx=""70"" cy=""80"" r=""15"" fill=""black""/>
                <circle cx=""130"" cy=""80"" r=""25"" fill=""white""/>
                <circle cx=""130"" cy=""80"" r=""15"" fill=""black""/>
                <rect x=""60"" y=""130"" width=""80"" height=""20"" rx=""10"" fill=""#66CC66""/>
                <line x1=""60"" y1=""20"" x2=""40"" y2=""0"" stroke=""black"" stroke-width=""4""/>
                <line x1=""140"" y1=""20"" x2=""160"" y2=""0"" stroke=""black"" stroke-width=""4""/>
            </svg>`,
      `<svg xmlns=""http://www.w3.org/2000/svg"" viewBox=""0 0 200 200"">
                <polygon points=""100,10 180,180 20,180"" fill=""#9999FF""/>
                <circle cx=""80"" cy=""100"" r=""20"" fill=""white""/>
                <circle cx=""80"" cy=""100"" r=""10"" fill=""black""/>
                <circle cx=""120"" cy=""100"" r=""20"" fill=""white""/>
                <circle cx=""120"" cy=""100"" r=""10"" fill=""black""/>
                <path d=""M 70 140 Q 100 160 130 140"" fill=""#6666FF""/>
                <line x1=""40"" y1=""120"" x2=""10"" y2=""100"" stroke=""black"" stroke-width=""4""/>
                <line x1=""160"" y1=""120"" x2=""190"" y2=""100"" stroke=""black"" stroke-width=""4""/>
            </svg>`
    ];

    const monsterImages = monsterSvgs.map(svg => {
      const img = new Image();
      img.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
      return img;
    });

    const backgroundImage = new Image();
    backgroundImage.src = 'data:image/svg+xml,' + encodeURIComponent(`
        <svg xmlns=""http://www.w3.org/2000/svg"" width=""800"" height=""400"" viewBox=""0 0 800 400"">
            <rect width=""100%"" height=""100%"" fill=""#87CEEB""/>
            <circle cx=""100"" cy=""80"" r=""40"" fill=""#FFFFFF"" opacity=""0.8""/>
            <circle cx=""300"" cy=""60"" r=""30"" fill=""#FFFFFF"" opacity=""0.6""/>
            <circle cx=""500"" cy=""100"" r=""50"" fill=""#FFFFFF"" opacity=""0.7""/>
            <circle cx=""700"" cy=""70"" r=""35"" fill=""#FFFFFF"" opacity=""0.75""/>
            <rect x=""0"" y=""300"" width=""800"" height=""100"" fill=""#8B4513""/> <!-- 바닥 색상 갈색으로 변경 -->
        </svg>
    `);

    function init() {
      dog = {x: 50, y: 300, width: 40, height: 40, jumping: false, yVelocity: 0};
      monsters = [];
      score = 0;
      gameSpeed = 0.4;
      gameTime = 0;
      lastMonsterSpawn = 0;
      backgroundX = 0;
      energy = 3;
      updateEnergy();
      updateScore();
      updateTime();
    }

    function startGameLoop() {
      isGameRunning = true;
      let lastTime = 0;
      backgroundMusic.play();
      function loop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;

        if (isGameRunning) {
          gameTime += deltaTime / 1000;
          update(deltaTime);
          draw();
          updateTime();
          gameLoop = requestAnimationFrame(loop);
        }
      }
      gameLoop = requestAnimationFrame(loop);
    }
    function updateEnergy() {
      const energyContainer = document.getElementById('energy');
      energyContainer.innerHTML = '';
      for (let i = 0; i < energy; i++) {
        const energyIcon = document.createElement('img');
        energyIcon.src = dogSvg.src;
        energyIcon.className = 'energy-icon';
        energyContainer.appendChild(energyIcon);
      }
    }
    function update(deltaTime) {
      // 강아지 점프 로직
      if (dog.jumping) {
        dog.yVelocity += 0.6;
        dog.y += dog.yVelocity;
        if (dog.y >= 300) {
          dog.y = 300;
          dog.jumping = false;
        }
      }

      // 몬스터 생성 로직
      if (gameTime - lastMonsterSpawn > 2 - Math.min(gameTime / 60, 1.5)) {
        const monsterType = Math.floor(Math.random() * 3);
        monsters.push({
          x: canvas.width,
          y: 310,
          width: 40,
          height: 40,
          type: monsterType,
          speed: gameSpeed + Math.min(gameTime / 0, 3)
        });
        lastMonsterSpawn = gameTime;
      }

      // 몬스터 이동 및 제거
      for (let i = monsters.length - 1; i >= 0; i--) {
        monsters[i].x -= monsters[i].speed;
        if (monsters[i].x + monsters[i].width < 0) {
          monsters.splice(i, 1);
          score++;
          updateScore();
        }
      }

      // 충돌 체크
      for (let monster of monsters) {
        if (checkCollision(dog, monster)) {
          gameOverSound.play();  // 충돌 시 gameOverSound 재생
          energy--;
          updateEnergy();
          if (energy <= 0) {
            gameOver();
            return;
        }
            // 충돌 후 잠시 무적 상태
            dog.invincible = true;
            setTimeout(() => {
              dog.invincible = false;
            }, 2000);
            // 몬스터 제거
            monsters = monsters.filter(m => m !== monster);
            break;
          }
      }

      // 배경 이동
      backgroundX -= gameSpeed / 2;
      if (backgroundX <= -800) {
        backgroundX = 0;
      }

      // 게임 속도 증가
      gameSpeed = 1 + Math.min(gameTime / 60, 3);
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 배경 그리기
      ctx.drawImage(backgroundImage, backgroundX, 0);
      ctx.drawImage(backgroundImage, backgroundX + 800, 0);

      // 강아지 그리기
      ctx.drawImage(dogSvg, dog.x, dog.y, dog.width, dog.height);

      // 몬스터 그리기
      for (let monster of monsters) {
        ctx.drawImage(monsterImages[monster.type], monster.x, monster.y, monster.width, monster.height);
      }
    }

    function checkCollision(rect1, rect2) {
      if (rect1.invincible) return false;
      const collisionMargin = 10;
      return rect1.x < rect2.x + rect2.width - collisionMargin &&
        rect1.x + rect1.width > rect2.x + collisionMargin &&
        rect1.y < rect2.y + rect2.height - collisionMargin &&
        rect1.y + rect1.height > rect2.y + collisionMargin;
    }

    function gameOver() {
      isGameRunning = false;
      backgroundMusic.pause();
      backgroundMusic.currentTime = 0;
      gameOverSound.play();
      cancelAnimationFrame(gameLoop);
      finalScoreText.textContent = `최종 점수: ${score}`;
      finalTimeText.textContent = `생존 시간: ${Math.floor(gameTime)}초`;
      gameOverScreen.style.display = 'flex';
    }

    function updateScore() {
      scoreText.textContent = `점수: ${score}`;
    }

    function updateTime() {
      timeText.textContent = `시간: ${Math.floor(gameTime)}초`;
    }

    document.addEventListener('keydown', (event) => {
      if (event.code === 'Space' && !dog.jumping && isGameRunning) {
        dog.jumping = true;
        dog.yVelocity = -12;
        jumpSound.play();
      }
    });

    startButton.addEventListener('click', () => {
      startSound.play();
      startScreen.style.display = 'none';
      init();
      startGameLoop();
    });

    restartButton.addEventListener('click', () => {
      startSound.play();
      gameOverScreen.style.display = 'none';
      init();
      startGameLoop();
    });
    // 터치 이벤트 추가
    document.addEventListener('touchstart', () => {
      if (!dog.jumping && isGameRunning) {
        dog.jumping = true;
        dog.yVelocity = -12;
        jumpSound.play();
      }
    });

    startButton.addEventListener('click', () => {
      startSound.play();
      startScreen.style.display = 'none';
      init();
      startGameLoop();
    });

    restartButton.addEventListener('click', () => {
      startSound.play();
      gameOverScreen.style.display = 'none';
      init();
      startGameLoop();
    });


    // 캐릭터 미리보기를 위한 새로운 코드
    function createCharacterPreview() {
      const characterPreview = document.getElementById('characterPreview');

      // 강아지 캐릭터 추가
      const dogPreview = document.createElement('img');
      dogPreview.src = dogSvg.src;  // dogSvg.src를 직접 사용
      dogPreview.className = 'character';
      characterPreview.appendChild(dogPreview);

      // 몬스터 캐릭터 추가
      monsterSvgs.forEach(svg => {
        const monsterPreview = document.createElement('img');
        monsterPreview.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
        monsterPreview.className = 'character';
        characterPreview.appendChild(monsterPreview);
      });
    }

    // 페이지 로드 시 캐릭터 미리보기 생성
    window.addEventListener('load', createCharacterPreview);

    init();
  </script>
</body>

</html>