let canvas = document.querySelector("#ctx");
let gfx = jwf(canvas);
let _canvasRect = {x:0,y:0,w:canvas.clientWidth,h:canvas.clientHeight}
let keyboard = {}
let _particles = PARTY(gfx.gfx, 2)
let mouseClick = undefined
let _score = 0
let _gameRuning = true
let _pointSound = new Audio('./point.wav')
let _wallColision = false
let playerName = prompt("Player name") || "anon"
let roomName = prompt("Room name") || "random"
let highscore = document.querySelector('#highscore')
let roomNameElement = document.querySelector("#roomname")

window.addEventListener('mousemove', (me) => {
	let rect = canvas.getBoundingClientRect ()
	mouseClick =	{ x:me.x - rect.x,y: me.y - rect.y }
})

let _green_background = {
	r:100, g:150,b: 100, a:255
}
let _green = {
	r:0, g:255,b: 0, a:255
}
let _black = {
	r:0, g:0,b: 0, a:255
}
let _red = {
	r:255, g:0,b: 0, a:255
}

let _bloodParticles = PARTY(gfx.gfx,2,_red)
const serverAdress = `${window.location.host}`  
const SOCKET = io(serverAdress, {})

SOCKET.on("connect", () => {
	console.log(`connect ${SOCKET.id}`);
});

class SnakeClient{
	constructor() {
		SOCKET.on("error", (error) => {
			console.log(error)
		});

		SOCKET.emit('player-join', playerName, roomName , (res) => {
			this.egg = res.egg
			/**@type {snk[]} */
			this.snakes = res.snakes
			canvas.width = res.rect.w
			canvas.height = res.rect.h
			_canvasRect.h = res.rect.h
			_canvasRect.w = res.rect.w

			roomNameElement.textContent = `Room name: ${roomName}` 
		})

		SOCKET.on('death', (snake) => {
			
			snake.body.forEach((b) => {
				for (let i = 0; i < 30; i++) {
					_bloodParticles.createParticle(b ,undefined, Math.random() * 1,Math.random() * 200)
				}
			})

			this.updateHud()
		})

		SOCKET.on('point', (position) => {
			_pointSound.play()
			
			for (let i = 0; i < 30; i++) {	
				_particles.createParticle(position ,undefined, Math.random() * 5,Math.random() * 200)
			}

			this.updateHud()
		})

	}

	draw() {
		gfx.drawRect(this.egg, _black)
		gfx.setFont(20, 'Arial')

		this.snakes.forEach((p) => {
			p.body.forEach((b,i,a)=>{
				gfx.gfx.fillStyle = 'green'
				gfx.gfx.fill()

				if (i > 0) {
					let l = {p1:b,p2:a[i-1]}
					gfx.drawLine(l,(b.r *2) * (b.egg ? 2 : 1) ,_green)
				}
				else {
					let d = jwML.AngleToNormalizedVector2(this.angle) 
		
					let l = {p1:b,p2:jwML.vector2Add(b,jwML.vector2Scale(d,5))}
					gfx.drawLine(l,b.r *2 * (b.egg ? 2 : 1) ,_green)
				}
			})

			gfx.gfx.fillStyle = 'black'
			gfx.gfx.fill()
			gfx.drawText(p.body[0],p.name,_red)
		})


	}
	update() {
		SOCKET.emit('update', mouseClick, (res) => {
			this.snakes = res.snakes
			this.egg = res.egg
		})
	}
	updateHud() {
		let sorted = this.snakes.sort((a, b) => {
			return a.body.length < b.body.length
		})
		
		let txt = ""
		sorted.forEach((s, i) => {
			txt += `${i+1} | ${s.name} | size: ${s.body.length}<br>`
		})
		highscore.innerHTML = txt
	}
	
}

let player = new SnakeClient()

let gameUpdate = setInterval(async () => {
	player.update()

	gfx.clearBackground()
	gfx.drawRect(_canvasRect, _green_background)
	
	if (player.snakes) {	
		player.draw()
	}

	_particles.draw()
	_bloodParticles.draw()
},16)
