import { Socket } from "socket.io"
import { jwCL } from "./jwCL"
import { IRect } from "./jwf"
import { jwML } from "./jwML"

export class SnkrServer{
	players: Player[] = []
	rect: IRect
	egg: IRect
	constructor(w?:number,h?:number) {
		this.rect = jwML.rect(0, 0, w || 640, h || 480)
		this.egg = this.newEgg()
	}
	addPlayer(player:Player) {
		this.players.push(player)
	}
	update() {
		
	}
	killPlayer() {
		
	}
	sendMessage() {
		
	}
	newEgg():IRect {

		return {
			h:30,
			w:30,
			x: Math.random() * (this.rect.w-30)   ,
			y: Math.random() * (this.rect.h-30) 
		}
		
	}
	createPlayer(id:string) {
		let p = new Player(id)
		return p
	}
	getPlayer(id:string) {
		return this.players.find((p) => {
			return p.id === id
		})
	}
	getSnakes() {
		let players = this.players.map((p) => {
			return p.snake
		})

		return players
	}
	removePlayer(id: string) {
		let p = this.getPlayer(id)
		if (p) {
			this.players.splice(
				this.players.indexOf(p), 1
			)
		}
	}
	checkCollisionSelf(player: Player) {
		let collided = false
		player.snake.body.forEach((b, i, a) => {
			if (i > 3) {
				
				if (jwCL.checkCollisionCircles(player.snake.body[0], b)) {
					collided = true
					return 
				}
			}
		})
		return collided
	}
	checkCollisionWalls(player:Player) {
		return (!jwCL.checkCollisionCircleRec(player.snake.body[0],this.rect))
	}
	checkCollisionEgg(player: Player) {
		return jwCL.checkCollisionCircleRec(player.snake.body[0],this.egg)
	}
	checkCollisionPlayers(player: Player) {
		let collided = false

		this.players.forEach((p) => {
			if (p.id !== player.id) {
				p.snake.body.forEach((b) => {
					let c = jwCL.checkCollisionCircles(player.snake.body[0], b)
					if (c) {
						collided = true
						return
					}
				})
			} else if (collided) {
				return
			}
		})

		return collided
	}
}

// class Egg{
// 	/**@param {IRect} shape  */
// 	constructor(shape){
// 		this.shape = shape
// 	}
// }

// interface IEgg extends IRect{}

class Player{
	snake:ISnake
	ateEgg:boolean
	id: string
	// name:string
	constructor(id:string) {
		// this.snake.body = [{ x: 0, y: 0, r: 5 }]
		// this.snake.angle = 0
		// this.snake.speed = 10
		this.snake = {
			body: [{ x: Math.random() * 640, y: Math.random() * 480, r: 5 }],
			angle: 0,
			speed: 10,
			name : "anon"
		}
		// this.name = name
		this.ateEgg = false
		this.id = id
	}
	update() {
		let d = jwML.AngleToNormalizedVector2(this.snake.angle)

		let lastHead = {
			x:this.snake.body[0].x,
			y:this.snake.body[0].y,
			r:this.snake.body[0].r
		} 

		lastHead.x += d.x * this.snake.speed
		lastHead.y += d.y * this.snake.speed

		if(!this.ateEgg){

			this.snake.body.pop()
		} else {
			this.ateEgg = false
		}

		let newHead = lastHead

		this.snake.body.unshift( newHead )
	}
	collided() {
		//TODO checar se colidiu com jogadores e parede
		return false
	}
	collidedEgg() {
		//TODO checar se colidiu com oovo
		return false
	}
	
}

export interface ISnake{
	body: { x: number, y: number, r: 5 }[]
	angle: number
	speed: 10
	name:string
}