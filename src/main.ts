import { Server, ServerOptions } from "socket.io";
import express from "express"
import {createServer} from "http"
import path from "path";
import { ISnake, SnkrServer } from "./SnkrServer";
import { jwML } from "./jwML";

const app = express();

const server = createServer(app);

const io = new Server(server,{});
app.use(express.static(path.join(__dirname, '..', 'dist')))

const snkrServer = new SnkrServer(800,600);

io.on('connection', (socket) => {
	socket.on('player-join', (playerName , sendToClient) => {
		let player = snkrServer.createPlayer(socket.id)
		player.snake.name = playerName

		sendToClient({
			snakes: snkrServer.getSnakes(),
			rect: snkrServer.rect,
			egg: snkrServer.egg
		})

		snkrServer.addPlayer(player)
	})

	socket.on('update', (mousePos, sendToClient) => {
		let p = snkrServer.getPlayer(socket.id)

		if (mousePos) {
			let dir = jwML.vector2Angle(p!.snake.body[0],mousePos)
			p!.snake.angle = dir
		}

		let snakes = snkrServer.getSnakes()
		
		sendToClient({
			snakes: snakes,
			egg: snkrServer.egg
		})
	})

	socket.on("disconnect", (reason) => {
		snkrServer.removePlayer(socket.id)
  });
})

server.listen(9999, async () => {
	console.log("running at",server.address())
})

setInterval(() => {
	snkrServer.players.forEach((p) => {

		if (snkrServer.checkCollisionWalls(p)) {
			io.sockets.emit('death', p.snake)
			
			p.snake.body = [{ x: Math.random() * snkrServer.rect.w, y: Math.random() * snkrServer.rect.h, r: 5 }]
			
		} else if (snkrServer.checkCollisionPlayers(p)) {
			io.sockets.emit('death', p.snake)
			
			p.snake.body = [{ x: Math.random() * snkrServer.rect.w, y: Math.random() * snkrServer.rect.h, r: 5 }]
		} else if (snkrServer.checkCollisionEgg(p)) {
			snkrServer.egg = snkrServer.newEgg()
			io.sockets.emit('point', p.snake.body[0])

			p.ateEgg = true

		} else if (snkrServer.checkCollisionSelf(p)) {
			io.sockets.emit('death', p.snake)
			
			p.snake.body = [{ x: Math.random() * snkrServer.rect.w, y: Math.random() * snkrServer.rect.h, r: 5 }]
		}
		
		p.update()
	})
},30)