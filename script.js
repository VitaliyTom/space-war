const canvas = document.getElementById('canvas');
ctx = canvas.getContext('2d');

const spinnerWrapper = document.querySelector('.spinner_wrapper');
const menu = document.querySelector('.menu');
const gameOverSt = document.querySelector('.game_over_wrapper');
const restart = document.querySelector('.restart');
const play = document.querySelector('.play');
const scoreSt = document.querySelector('.score');
const button = document.querySelector('.button');

// menu

let width = 900;
let height = 700;
let xOld = width / 2;
let yOld = width - 150;
let offsetBgX = 0;
let offsetBgY = 0;
let totalScore = 0;

// audio

const implos = new Audio();
implos.src = './audio/implos.mp3';
implos.volume = 1;

const scoreAudio = new Audio();
scoreAudio.src = './audio/coin.mp3';

const stageTheme = new Audio();
stageTheme.src = './audio/stage/Stage_Theme_1.wav';
stageTheme.currentTime = 0;
stageTheme.loop = true;
stageTheme.volume = 0.1;

const gameOverAudio = new Audio();
gameOverAudio.src = './audio/game_over.mp3';
gameOverAudio.volume = 1;

const startAudio = new Audio();
startAudio.src = './audio/start.mp3';
startAudio.volume = 0.4;

const shotAudio = new Audio();
shotAudio.src = './audio/shot.mp3';

// image

const heartStrokeImg = new Image();
heartStrokeImg.src = './assets/heartStroke.png';

const heartFillImg = new Image();
heartFillImg.src = './assets/heartFill.png';

const explosionShipImg = new Image();
explosionShipImg.src = './assets/08.png';

const explosionImg = new Image();
explosionImg.src = './assets/09.png';

const shotImg = new Image();
shotImg.src = './assets/shot2.png';

const spaceShipImg = new Image();
spaceShipImg.src = './assets/spaceShip4.png';

const asteroidImg = new Image();
asteroidImg.src = './assets/asteroid.png';

const bg = new Image();
bg.src = './assets/space.jpg';

// stageTheme
explosionShipImg.onload = () => {
	show(menu, play);
	menuGame();
};

// 	hide menu
function hide(menu) {
	menu.style.display = 'none';
}

// 	show menu
function show(menu, buttonTarget) {
	menu.style.display = 'block';
	buttonTarget.style.display = 'block';
	spinnerWrapper.style.display = 'none';
}

// 	menu game
function menuGame() {
	button.addEventListener('click', (el) => {
		startAudio.play();
		setTimeout(() => {
			game();
			hide(menu);
		}, 3500);
	});
}

//  restart game
restart.addEventListener('click', (el) => {
	xOld = width / 2;
	yOld = width - 150;

	startAudio.play();
	setTimeout(() => {
		game();
		hide(menu);
		hide(gameOverSt);
	}, 3500);
});

function game() {
	let score = 0;
	let requestId;
	let timer = 0;
	let countLife = 3;

	const life = [];
	const explosion = [];
	const explosionShip = [];
	const shot = [];
	const asteroid = [];
	const spaceShip = {
		x: width / 2,
		y: height - 70,
		delete: false
	};

	const asteroidOpt = {
		velocityX: 10,
		velocityY: 5,
		delete: false
	};

	for (let index = 0; index < countLife; index++) {
		life.push({ lifeStatus: 1, lifeImg: heartFillImg });
	}

	start();

	// ship and background offset (parallax)
	canvas.addEventListener('mousemove', (e) => {
		spaceShip.x = e.offsetX - 32;
		spaceShip.y = e.offsetY - 35;

		// offsetBgX background
		if (xOld < e.offsetX && offsetBgX > -40 && offsetBgX <= 40) {
			offsetBgX -= 0.09;
		}

		if (xOld > e.offsetX && offsetBgX < 40 && offsetBgX > -40) {
			offsetBgX += 0.09;
		}

		if (yOld < e.offsetY && offsetBgY > -40 && offsetBgY <= 40) {
			offsetBgY -= 0.09;
		}

		if (yOld > e.offsetY && offsetBgY < 40 && offsetBgY > -40) {
			offsetBgY += 0.09;
		}

		if (offsetBgX < -40 || offsetBgX > 40 || (offsetBgY < -40 || offsetBgY > 40)) {
			offsetBgX = 0;
			offsetBgY = 0;
		}

		xOld = e.offsetX;
		yOld = e.offsetY;
	});

	// т.к. mousedown - не зациклен и в нем не отслеживается mousemove.
	// внутри создал свой лисенер mousemove и mouseup
	canvas.addEventListener('mousedown', (e) => {
		let shotX = e.offsetX;
		let shotY = e.offsetY;
		if (e.button === 0) {
			canvas.addEventListener('mousemove', (eMove) => {
				shotX = eMove.offsetX;
				shotY = eMove.offsetY;
			});
			const interval = setInterval(() => {
				// shotAudio.play();
				shot.push({ x: shotX - 12, y: shotY - 40, velocityY: 7 });
			}, 200);
			canvas.addEventListener('mouseup', (eUp) => {
				if (eUp.button === 0) clearInterval(interval);
			});
			// shotAudio.play();
			shot.push({ x: shotX - 12, y: shotY - 40, velocityY: 7 });
		}
		return;
	});

	// stop game
	function stop() {
		if (requestId) {
			cancelAnimationFrame(requestId);
			requestId = undefined;
		}
	}

	// start game
	function start() {
		requestId = undefined;
		requestId = requestAnimationFrame(runGame);
		stageTheme.play();
	}

	function runGame() {
		update();
		render();
	}

	// UPDATE
	function update() {
		requestId = requestAnimationFrame(runGame);

		// asteroid generation
		timer++;
		if (timer % 20 === 0) {
			asteroidGeneration(asteroid, asteroidOpt);
		}

		// asteroid Offset
		for (const i in asteroid) {
			asteroidOffset(asteroid[i]);

			// reflection off the edges of an asteroid
			reflectionAsteroid(asteroid[i]);

			//  removing an asteroid if below the screen
			removeAsteroid(asteroid, asteroid[i], i);

			// check for collision of a bullet with asteroid
			score += collisionBulletAsteroid(shot, asteroid[i], explosion);

			// check for a ship collision with a steroid
			if (Math.abs(asteroid[i].x + 25 - spaceShip.x - 32) < 40 && Math.abs(asteroid[i].y - spaceShip.y) < 40) {
				implos.play();
				asteroid[i].delete = true;
				spaceShip.delete = true;
				explosionShip.push({ x: spaceShip.x - 35, y: spaceShip.y - 43, animationX: 0, animationY: 0 });

				if (countLife > 0) {
					life[countLife - 1].lifeImg = heartStrokeImg;
					countLife--;
					if (countLife <= 0) {
						totalScore = score;
						setTimeout(() => {
							stop();
							gameOver();
						}, 500);
					}
				}
			}

			// removal of the downed asteroid
			removalDownedAsteroid(asteroid[i], asteroid, i);
		}

		// shot offset
		shotOffset(shot);

		// animation explosion
		// animationExplosion(explosion);
		for (const i in explosion) {
			explosion[i].animationX += 0.8;
			if (explosion[i].animationX > 7) {
				explosion[i].animationY++;
				explosion[i].animationX = 0;
			}
			if (explosion[i].animationY > 4) {
				explosion.splice(i, 1);
			}
		}

		// animation explosionShip
		animationExplosion(explosionShip);
	}

	// RENDER
	function render() {
		backgroundDraw();
		shotDraw(shot);
		spaceShipDraw(spaceShip);
		asteroidDraw(asteroid);
		asteroidExplosionDraw(explosion);
		shipExplosionDraw(explosionShip);
		scoreDraw(score);
		heartDraw(life);
	}
}

function gameOver() {
	stageTheme.pause();
	// shotAudio.pause();
	scoreSt.innerText = `SCORE : ${totalScore}`;
	show(gameOverSt, restart);
	gameOverAudio.play();
}

// update block

function asteroidGeneration(asteroid, asteroidOpt) {
	asteroid.push({
		x: Math.floor(Math.random() * (width - 50 - 1)) + 1,
		y: -50,
		velocityX: Math.random() * 2 - 1,
		velocityY: Math.random() * 2 + 1,
		delete: asteroidOpt.delete,
		angle: 0,
		velocityAngle: Math.random() * 0.1 - 0.001 //0.2-0.1
	});
}

function asteroidOffset(asteroidElement) {
	asteroidElement.x += asteroidElement.velocityX;
	asteroidElement.y += asteroidElement.velocityY;
	asteroidElement.angle += asteroidElement.velocityAngle;
}

function reflectionAsteroid(asteroid) {
	if (asteroid.x >= width - 50 || asteroid.x <= 0) {
		asteroid.velocityX = -asteroid.velocityX;
	}
}

function removeAsteroid(asteroid, asteroidElement, i) {
	if (asteroidElement.y > height) {
		asteroid.splice(i, 1);
	}
}

function collisionBulletAsteroid(shot, asteroidElement, explosion) {
	let currentScore = 0;
	for (const j in shot) {
		if (Math.abs(asteroidElement.x + 25 - shot[j].x - 15) < 25 && Math.abs(asteroidElement.y - shot[j].y) < 25) {
			currentScore++;
			explosion.push({ x: asteroidElement.x - 50, y: asteroidElement.y - 50, animationX: 0, animationY: 0 });
			asteroidElement.delete = true;
			shot.splice(j, 1);
			scoreAudio.play();
			break;
		}
	}
	return currentScore;
}

function removalDownedAsteroid(asteroidElement, asteroid, i) {
	if (asteroidElement.delete) {
		asteroid.splice(i, 1);
	}
}

function shotOffset(shot) {
	for (const i in shot) {
		if (shot[i].y <= 0) {
			shot.splice(i, 1);
		} else {
			shot[i].y += -shot[i].velocityY;
		}
	}
}

function animationExplosion(explosion) {
	for (const i in explosion) {
		explosion[i].animationX += 0.8;
		if (explosion[i].animationX > 7) {
			explosion[i].animationY++;
			explosion[i].animationX = 0;
		}
		if (explosion[i].animationY > 4) {
			explosion.splice(i, 1);
		}
	}
}

function animationExplosion(explosionShip) {
	for (const i in explosionShip) {
		explosionShip[i].animationX += 0.9;
		if (explosionShip[i].animationX > 8) {
			explosionShip[i].animationY++;
			explosionShip[i].animationX = 0;
		}
		if (explosionShip[i].animationY > 4) {
			explosionShip.splice(i, 1);
		}
	}
}

//	render block

function backgroundDraw() {
	ctx.drawImage(bg, -45 + offsetBgX, -45 + offsetBgY, width + 140, height + 140);
}

function shotDraw(shot) {
	for (const i in shot) {
		ctx.drawImage(shotImg, shot[i].x, shot[i].y, 30, 30);
	}
}

function spaceShipDraw(spaceShip) {
	ctx.drawImage(spaceShipImg, spaceShip.x, spaceShip.y, 70, 80);
}

function asteroidDraw(asteroid) {
	for (const i in asteroid) {
		ctx.save();
		ctx.shadowColor = 'rgba(0, 0, 1,0.5)';
		ctx.shadowBlur = 40;
		ctx.translate(asteroid[i].x + 25, asteroid[i].y + 25);
		ctx.rotate(asteroid[i].angle);
		ctx.drawImage(asteroidImg, -25, -25, 50, 50);
		ctx.restore();
	}
}

function asteroidExplosionDraw(explosion) {
	for (const i in explosion) {
		ctx.drawImage(
			explosionImg,
			128 * Math.floor(explosion[i].animationX),
			128 * Math.floor(explosion[i].animationY),
			128,
			128,
			explosion[i].x,
			explosion[i].y,
			150,
			150
		);
	}
}

function shipExplosionDraw(explosionShip) {
	for (const i in explosionShip) {
		ctx.drawImage(
			explosionShipImg,
			256 * Math.floor(explosionShip[i].animationX),
			256 * Math.floor(explosionShip[i].animationY),
			256,
			256,
			explosionShip[i].x,
			explosionShip[i].y,
			150,
			150
		);
	}
}

function scoreDraw(score) {
	ctx.fillStyle = '#fdfe82';
	ctx.font = '30px Verdana';
	ctx.shadowColor = 'rgba(0, 0, 1,0.9)';
	ctx.shadowBlur = 70;
	ctx.fillText('score: ' + score, width - 200, 50);
}

function heartDraw(life) {
	let x = -50;
	for (const i in life) {
		ctx.drawImage(life[i].lifeImg, width - 100 - x, height - 40, 25, 25);
		x -= -50;
	}
}
