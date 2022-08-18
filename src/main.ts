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

const snkrServer = new SnkrServer();

io.on('connection', (socket) => {
	socket.on('player-join', (playerName,roomName, sendToClient) => {
		socket.data.playername = playerName
		socket.data.room = roomName

		let room = snkrServer.rooms[socket.data.room]

		if (!room) {
			snkrServer.createRoom(roomName)

			room = snkrServer.rooms[socket.data.room]
			
		}

		if (room) {

			let player = room.createPlayer(socket.id)
			player.snake.name = playerName
			snkrServer.joinRoom(player,room)
			socket.join(roomName)

			sendToClient({
				snakes: room.getSnakes(),
				rect: room.rect,
				egg: room.egg
			})
		}
		
	})

	socket.on('update', (mousePos, sendToClient) => {
		let room = snkrServer.rooms[socket.data.room]

		if (room) {
			let p = room.getPlayer(socket.id)

			if (mousePos) {
				let dir = jwML.vector2Angle(p!.snake.body[0],mousePos)
				p!.snake.angle = dir
			}
			
			sendToClient({
				snakes: room.getSnakes(),
				egg: room.egg
			})
		}

		
	})

	socket.on("disconnect", (reason) => {
		let room = snkrServer.rooms[socket.data.room]

		if (room) {
			room.removePlayer(socket.id)
			if (room.players.length === 0) {
				snkrServer.deleteRoom(socket.data.room)
				let idx = snkrServer.roomNames.indexOf(socket.data.room)
				snkrServer.roomNames.splice(idx,1)
			}
		}

  });
})

server.listen(process.env.PORT || 9999, async () => {
	console.log("running at",server.address())
})

setInterval(() => {

	snkrServer.roomNames.forEach((rn) => {
		let room = snkrServer.rooms[rn]

		if (room) {
			room.players.forEach((p) => {
				if (room) {//why the fuck i need this?? 
					if (room.checkCollisionWalls(p)) {
						
						io.to(rn).emit('death', p.snake)
						
						p.snake.body = [{ x: Math.random() * room.rect.w, y: Math.random() * room.rect.h, r: 5 }]
						
					} else if (room.checkCollisionPlayers(p)) {
						io.to(rn).emit('death', p.snake)
						
						p.snake.body = [{ x: Math.random() * room.rect.w, y: Math.random() * room.rect.h, r: 5 }]
					} else if (room.checkCollisionEgg(p)) {
						room.egg = room.newEgg()
						io.to(rn).emit('point', p.snake.body[0])
			
						p.ateEgg = true
			
					} else if (room.checkCollisionSelf(p)) {
						io.to(rn).emit('death', p.snake)
						
						p.snake.body = [{ x: Math.random() * room.rect.w, y: Math.random() * room.rect.h, r: 5 }]
					}
					
					p.update()
				}

			})
		}
		
	})

	

},30)