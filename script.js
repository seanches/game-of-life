// Основные ноды и эвентлистенеры
const $canvas = document.querySelector('#field')
const $play = document.querySelector('#play')
const $step = document.querySelector('#step')
const $scaleplus = document.querySelector('#scaleplus')
const $scaleminus = document.querySelector('#scaleminus')
const $speedplus = document.querySelector('#speedplus')
const $speedminus = document.querySelector('#speedminus')
const $skale = document.querySelector('#skale')
const $cleare = document.querySelector('#cleare')
const $gen = document.querySelector('#gen')
const $speed = document.querySelector('#speed')
const $diesmin = document.querySelector('#diesmin')
const $diesmax = document.querySelector('#diesmax')
const $born = document.querySelector('#born')
const $rules = document.querySelector('#rules')
const $rulesButton = document.querySelector('#rulesbutton')
const $reset = document.querySelector('#reset')
const ctx = $canvas.getContext('2d')
const $randomValue = document.querySelector('#rv')
const $randomInput = document.querySelector('#ri')
const $randomText = document.querySelector('#random-text')
const $create = document.querySelector('#create')

$canvas.addEventListener('mousedown', mousedown)
$canvas.addEventListener('mouseup', mouseup)
$play.addEventListener('click', play)
$step.addEventListener('click', () => lifeCycle())
$scaleplus.addEventListener('click', () => scale('+'))
$scaleminus.addEventListener('click', () => scale('-'))
$speedplus.addEventListener('click', () => speed('+'))
$speedminus.addEventListener('click', () => speed('-'))
$diesmin.addEventListener('input', diesmin)
$diesmax.addEventListener('input', diesmax)
$born.addEventListener('input', born)
$cleare.addEventListener('click', () => game.cleare())
$rulesButton.addEventListener('click', rulesShow)
$rules.addEventListener('click', rulesHide)
$randomInput.addEventListener('input', input)
$create.addEventListener('click', createRandom)

// Изменение масштаба и перемещение
let offsetX = 0
let offsetY = 0
let startPositionX
let endPositionX
let startPositionY
let endPositionY
let timeStart
let timeEnd

function mousedown(event) {
	event.preventDefault()
	document.body.style = '--cursor: grab'
	startPositionX = event.offsetX
	startPositionY = event.offsetY
	timeStart = new Date()
}

function mouseup(event) {
	event.preventDefault()
	document.body.style = '--cursor: default'
	endPositionX = event.offsetX
	endPositionY = event.offsetY
	timeEnd = new Date()

	if (timeEnd - timeStart < 250) {
		const x = startPositionX - offsetX
		const y = startPositionY - offsetY
		const row = Math.floor(y / (20 * field.skale))
		const col = Math.floor(x / (20 * field.skale))

		const check = cells.filter(el => el.row === row && el.col === col && el.isAlive)

		if (check.length > 0) {
			const index = cells.findIndex(el => el.row === row && el.col === col)
			cells[index].isAlive = cells[index].isAlive ? false : true
			cells = cells.filter(el => el.isAlive)
		} else {
			cells.push(new Cell(row, col, true))
		}

		Cell.createField()
		game.render()
	} else {
		const difX = endPositionX - startPositionX
		const difY = endPositionY - startPositionY

		offsetX += Math.round(difX - (difX % (20 * field.skale)))
		offsetY += Math.round(difY - (difY % (20 * field.skale)))
		game.render()
	}
}

// Скалирование и скорость
function scale(type) {
	if (type === '-' && field.skale > 0.3) {
		field.skale -= 0.2
	}
	if (type === '+' && field.skale < 1.9) {
		field.skale += 0.2
	}
	$canvas.style = `--s:${20 * field.skale}px; --x:${offsetX - field.skale * 20}px; --y:${offsetY - field.skale * 20}px`
	$skale.textContent = `Scale: ${Math.round(field.skale * 100)}%`
	game.render()
}

const speeds = [0.1, 0.2, 0.5, 1, 2, 3, 5, 10, 15, 25, 35, 50]
let currentSpeed = 3

function speed(type) {
	if (type === '-' && currentSpeed > 0) {
		currentSpeed--
		game.speed = 1 / speeds[currentSpeed]
		if (game.isStarted) {
			game.stop()
			game.start(game.speed)
		}
	}

	if (type === '+' && currentSpeed < speeds.length - 1) {
		currentSpeed++
		game.speed = 1 / speeds[currentSpeed]
		if (game.isStarted) {
			game.stop()
			game.start(game.speed)
		}
	}

	if (currentSpeed < 3) {
		$speed.textContent = `Speed: ${(1 / game.speed).toFixed(1)}`
	} else {
		$speed.textContent = `Speed: ${Math.round(1 / game.speed)}`
	}
}

// Основная логика ячеек и правила игры
let cells = []
let gen = 0

const field = {
	width() {
		return window.innerWidth * this.x * this.skale
	},
	height() {
		return window.innerHeight * this.y * this.skale
	},
	x: 0.75,
	y: 0.75,
	skale: 1,
}

const rules = {
	dies: {
		min: 1,
		max: 4,
	},
	born: 3,
}

$canvas.width = field.width()
$canvas.height = field.height()

class Cell {
	constructor(row, col, isAlive) {
		;(this.row = row), (this.col = col), (this.neighbours = 0), (this.isAlive = isAlive)
	}

	render() {
		const size = 20 * field.skale
		this.isAlive ? (ctx.fillStyle = '#BBD2C5') : (ctx.fillStyle = 'transparent')
		ctx.fillRect(this.col * size + offsetX, this.row * size + offsetY, size, size)
		if (this.isAlive) {
			ctx.strokeStyle = '#232526'
			ctx.lineWidth = 0.5 * field.skale
			ctx.strokeRect(this.col * size + offsetX, this.row * size + offsetY, size, size)
		}
	}

	static createField() {
		cells = cells.filter(el => el.isAlive)
		cells.forEach(el => {
			for (let r = el.row - 1; r <= el.row + 1; r++) {
				for (let c = el.col - 1; c <= el.col + 1; c++) {
					if (r === el.row && c === el.col) {
						continue
					}
					if (!cells.filter(el => el.row === r && el.col === c).length) {
						cells.push(new Cell(r, c, false))
					}
				}
			}
		})
	}

	setNeighbours() {
		this.neighbours = 0
		cells.forEach(el => {
			if (
				Math.abs(this.row - el.row) <= 1 &&
				Math.abs(this.col - el.col) <= 1 &&
				el.isAlive &&
				!(Math.abs(this.col - el.col) === 0 && Math.abs(this.row - el.row) === 0)
			) {
				this.neighbours++
			}
		})
	}

	cycle() {
		if (this.isAlive) {
			if (this.neighbours <= rules.dies.min || this.neighbours >= rules.dies.max) {
				this.isAlive = false
			}
		} else {
			if (this.neighbours === rules.born) {
				this.isAlive = true
			}
		}
	}
}

function lifeCycle() {
	if (!cells.length) {
		game.stop()
		$play.textContent = 'Play'
		return
	}

	Cell.createField()
	cells.forEach(el => el.setNeighbours())
	cells.forEach(el => el.cycle())
	game.render()
	$gen.textContent = `Generation: ${++gen}`
}

const game = {
	int: undefined,
	isStarted: false,
	speed: 1,
	start(step) {
		if (!this.isStarted) {
			this.isStarted = true
			this.int = setInterval(() => {
				lifeCycle()
			}, step * 1000)
		}
	},
	stop() {
		clearInterval(this.int)
		this.isStarted = false
	},
	render() {
		ctx.clearRect(0, 0, $canvas.width, $canvas.height)
		cells.forEach(el => el.render())
	},
	cleare() {
		ctx.clearRect(0, 0, $canvas.width, $canvas.height)
		cells = []
		$gen.textContent = `Generation: 0`
		gen = 0
	},
}

// Логика меню
function play() {
	const val = $play.textContent.toLowerCase()
	if (val === 'play') {
		game.start(game.speed)
		$play.textContent = 'Stop'
	}
	if (val === 'stop') {
		game.stop()
		$play.textContent = 'Play'
	}
}

// Установка правил
function diesmin(event) {
	const val = event.target.value

	if (Math.abs(val - rules.dies.min) > 1) {
		$diesmin.value = rules.dies.min
		return
	}
	if (val <= 1) {
		$diesmin.value = 1
		rules.dies.min = 1
	} else if (val >= 8) {
		rules.dies.min = 8
	} else if (rules.dies.max - val >= 2) {
		$diesmin.value = val
		rules.dies.min = val
	} else {
		$diesmin.value = +rules.dies.max - 2
		rules.dies.min = +rules.dies.max - 2
	}
}

function diesmax(event) {
	const val = event.target.value

	if (Math.abs(val - rules.dies.max) > 1) {
		$diesmin.value = rules.dies.max
		return
	}

	if (val <= 1) {
		$diesmax.value = 1
		rules.dies.max = 1
	} else if (event.target.value >= 8) {
		$diesmax.value = 8
		event.target.value = 8
		rules.dies.max = 8
	} else if (val - rules.dies.min >= 2) {
		$diesmax.value = val
		rules.dies.max = val
	} else {
		$diesmax.value = +rules.dies.min + 2
		rules.dies.max = +rules.dies.min + 2
	}
}

function born(event) {
	const val = event.target.value

	if (Math.abs(val - rules.born) > 1) {
		$born.value = rules.born
		return
	}

	if (val <= 1) {
		$born.value = 1
		rules.born = 1
	} else if (event.target.value >= 8) {
		$born.value = 8
		rules.born = 8
	} else {
		$born.value = val
		rules.born = val
	}
}

function rulesShow() {
	$diesmin.value = rules.dies.min
	$diesmax.value = rules.dies.max
	$born.value = rules.born
	$rules.style.display = 'flex'
}

function rulesHide(event) {
	if (event.target.dataset.place) {
		$rules.style.display = 'none'
	}
	if (event.target.dataset.reset) {
		$diesmin.value = rules.dies.min = 1
		$diesmax.value = rules.dies.max = 4
		$born.value = rules.born = 3
		$rules.style.display = 'none'
	}
}

// Создание заранее заготовленных структур
function createGlider(startX, startY, type) {
	switch (type) {
		case 'rd':
			cells.push(new Cell(startX, startY, true))
			cells.push(new Cell(startX, startY - 1, true))
			cells.push(new Cell(startX, startY - 2, true))
			cells.push(new Cell(startX - 1, startY, true))
			cells.push(new Cell(startX - 2, startY - 1, true))
			break
		case 'ld':
			cells.push(new Cell(startX, startY, true))
			cells.push(new Cell(startX, startY + 1, true))
			cells.push(new Cell(startX, startY + 2, true))
			cells.push(new Cell(startX - 1, startY, true))
			cells.push(new Cell(startX - 2, startY + 1, true))
			break
		case 'ru':
			cells.push(new Cell(startX, startY, true))
			cells.push(new Cell(startX, startY - 1, true))
			cells.push(new Cell(startX, startY - 2, true))
			cells.push(new Cell(startX + 1, startY, true))
			cells.push(new Cell(startX + 2, startY - 1, true))
			break
		case 'lu':
			cells.push(new Cell(startX, startY, true))
			cells.push(new Cell(startX, startY + 1, true))
			cells.push(new Cell(startX, startY + 2, true))
			cells.push(new Cell(startX + 1, startY, true))
			cells.push(new Cell(startX + 2, startY + 1, true))
			break
	}
}

function privet() {
	const r = [
		2, 3, 4, 5, 6, 7, 7, 5, 5, 5, 2, 2, 2, 7, 6, 5, 4, 3, 2, 3, 4, 5, 6, 7, 5, 7, 6, 5, 4, 3, 2, 3, 5, 4, 2, 3, 4, 5, 6,
		7, 7, 6, 5, 4, 3, 2, 2, 2, 2, 8, 8, 8, 8, 8, 8, 5, 5, 5, 8, 8, 8, 8, 8, 8, 8, 6, 6, 8, 7, 6, 5, 2, 2, 2, 2, 3, 4, 5,
		6, 7, 8, 3, 4, 8, 8, 8, 7, 6, 5, 4, 3, 2, 2, 2, 2, 5, 5, 5, 2, 4, 3, 5, 6, 7, 8, 8, 8, 8, 8, 7, 5, 4, 2, 6, 8, 7, 5,
		6, 4, 3, 2, 2, 2, 2, 5, 5, 5, 2, 3, 4, 5, 6, 7, 8, 8, 8, 8, 5, 5, 5, 2, 2, 2, 2, 2, 5, 5, 2, 7,
	]
	const c = [
		4, 4, 4, 4, 4, 4, 8, 8, 7, 6, 5, 6, 7, 10, 10, 10, 10, 10, 12, 14, 14, 14, 14, 14, 12, 16, 16, 16, 16, 16, 17, 18,
		18, 18, 19, 20, 20, 20, 20, 20, 22, 22, 22, 22, 22, 22, 23, 24, 25, 16, 20, 22, 23, 24, 25, 23, 24, 25, 14, 10, 8,
		7, 6, 5, 4, 8, 6, 29, 29, 29, 29, 29, 30, 31, 32, 32, 32, 32, 32, 32, 32, 29, 29, 31, 30, 34, 34, 34, 34, 34, 34,
		34, 35, 36, 37, 35, 36, 37, 41, 41, 41, 41, 41, 41, 41, 42, 43, 44, 46, 46, 46, 46, 46, 46, 48, 48, 48, 48, 48, 48,
		48, 50, 49, 51, 51, 50, 49, 53, 53, 53, 53, 53, 53, 53, 54, 55, 56, 54, 55, 56, 54, 55, 56, 13, 11, 13, 11, 8, 44,
	]

	for (let i = 0; i < r.length; i++) {
		cells.push(new Cell(r[i] + 13, c[i] + 5, true))
	}
	createGlider(7, 6, 'rd')
	createGlider(7, 64, 'ld')
	createGlider(29, 6, 'ru')
	createGlider(29, 64, 'lu')
	game.render()
}
privet()

// Генерация рандомных ячеек
function setRandom(num = 1000) {
	cells = []
	for (let i = 0; i < num; i++) {
		const x = Math.round(Math.random() * 71)
		const y = Math.round(Math.random() * 34)
		const check = cells.filter(el => el.row === y && el.col === x && el.isAlive)

		if (check.length > 0) {
			i--
		} else {
			cells.push(new Cell(y, x, true))
		}
	}
	game.render()
}

function input(event) {
	$randomText.textContent = event.target.value
}

function createRandom() {
	const num = +$randomText.textContent
	game.cleare()
	setRandom(num)
}
