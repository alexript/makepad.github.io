var audio = require('services/audio')
var wav = require('parsers/wav')
var painter = require('services/painter')

module.exports = class extends require('base/drawapp'){
	
	prototype() {
		
		this.props = {
			zoom: 1000.,
			selStart: 0,
			selEnd: 0,
			zoomRange: [2, 1000],
			zoomScroll: 0,
		}
		this.tools = {
			Slider: require('tools/slider').extend({
				Bg: {moveScroll: 0},
				Knob: {moveScroll: 0}
			}),
			Button: require('tools/button').extend({
				Bg: {moveScroll: 0},
				Text: {moveScroll: 0}
			}),
			Rect: {
				color: '#07c7'
			},
			Quad: {color: 'red'},
			Grid: require('tools/grid')
		}
	}
	
	constructor() {
		super()
		
		//runtime()
		
		audio.reset()
		this.recording = []
		this.samples = 0
		// ok we dont deal in individual nodes we deal in whole flows.
		this.recFlow = new audio.Flow({
			gain1: {
				to: 'output',
				gain: .0,
			},
			recorder1: {
				to: 'gain1',
				chunk: 2048,
				onData: data=>{
					
					this.redraw()
					this.recording.push(data)
					this.samples += data[0].length
					this.scopeData = data
				}
			},
			input1: {
				to: 'recorder1',
				device: 'Microphone'
			}
		})
		//var out=wav.parse(require('./audio.wav'),true)
		//this.recording.push(out.data)
		//this.samples=out.data[0].length
		
		this.playFlow = new audio.Flow({
			buffer1: {
				to: 'output',
				rate: 44100,
				loop: true,
				start: 0
			}
		})
	}
	
	onScroll(e) {
		this.redraw()
	}
	
	xToTime(x) {
		return x * this.zoom
	}
	
	setZoom(z, x) {
		var zoom = clamp(z, this.zoomRange[0], this.zoomRange[1])
		var x1 = x * this.zoom
		var x2 = x * zoom
		this.zoom = zoom
		this.scrollAtDraw((x1 - x2) / zoom, 0, true)
	}
	
	onFingerWheel(e) {
		var z = this.zoom * (1 + e.yWheel / 1500)
		this.setZoom(z, e.x)
	}
	
	onFingerDown(e) {
		if(e.pickId) return 
		this.selEnd = 
		this.selStart = clamp(this.xToTime(e.x), 0, this.samples)
	}
	
	onFingerMove(e) {
		if(e.pickId) return 
		var end = this.selEnd = clamp(this.xToTime(e.x), 0, this.samples)
		if(end < this.selStart) this.selEnd = this.selStart, this.selStart = end
	}
	
	onDraw() {
		this.drawButton({
			text: this.recFlow.running? "Stop": "Rec",
			onClick: e=>{
				if(this.recFlow.running) this.recFlow.stop()
				else {
					this.recording.length = 0
					this.samples = 0
					this.recFlow.start()
				}
				this.redraw()
			}
		})
		this.drawButton({
			text: this.playFlow.running? "Stop": "Play",
			onClick: e=>{
				
				if(this.playFlow.running) {
					this.playFlow.stop()
					this.redraw()
					return 
				}
				// lets combine all the recording buffers
				var out = new Float32Array(this.samples)
				var o = 0
				for(var c = 0; c < this.recording.length; c++) {
					var left = this.recording[c][0]
					for(var i = 0; i < left.length; i++) out[o++] = left[i]
				}
				
				this.playFlow.start({
					buffer1: {
						data: [out, out]
					}
				})
				this.redraw()
			}
		})
		this.drawButton({
			text: "Cut",
			onClick: e=>{
				// lets combine all the recording buffers
				var out = new Float32Array(this.samples - (this.selEnd - this.selStart))
				for(let c = 0, o = 0, w = 0; c < this.recording.length; c++) {
					var left = this.recording[c][0]
					for(var i = 0; i < left.length; i++, o++) {
						if(o < this.selStart || o > this.selEnd) {
							out[w++] = left[i]
						}
					}
				}
				this.samples = out.length
				this.recording = [[out]]
				this.selStart = this.selEnd = 0
				this.redraw()
			}
		})
		this.drawButton({
			text: "Fade",
			onClick: e=>{
				// lets combine all the recording buffers
				var range = (this.selEnd - this.selStart)
				var out = new Float32Array(this.samples - range)
				for(let c = 0, o = 0, w = 0; c < this.recording.length; c++) {
					var left = this.recording[c][0]
					for(let i = 0; i < left.length; i++, o++) {
						if(o > this.selStart && o < this.selEnd) {
							left[i] = left[i] * pow(1 - (w++ / range), 3)
						}
					}
				}
				this.redraw()
			}
		})
		this.drawSlider({
			onValue: e=>{
				this.setZoom(e.value, this.todo.xScroll)
				this.redraw()
			},
			vertical: false,
			handleSize: 30,
			value: this.zoom,
			step: 0,
			range: this.zoomRange,
			w: 100,
			h: 36
		})
		// lets draw the scope 
		if(this.scopeData) {
			this.beginGrid({
				moveScroll: 0,
				zoom: this.zoom,
				w: 100,
				h: 40
			})
			var left = this.scopeData[0]
			this.drawLine({sx: 0, sy: 100})
			for(let i = 0; i < left.length; i++) {
				this.drawLine({
					space: 2,
					x: (i / left.length) * 2 - 1,
					y: left[i]
				})
			}
			this.endGrid()
		}
		this.beginGrid({
			x: 0,
			y: 60,
			zoom: this.zoom,
			w: this.samples / this.zoom,
			h: 200
		})
		//console.log(10000/this.zoom)
		this.drawRect({
			x: (this.selStart) / this.zoom,
			w: (this.selEnd - this.selStart) / this.zoom,
			h: '100%'
		})
		
		// lets draw the recording
		if(this.recording) {
			
			// lets draw time stamps.
			// 
			
			var height = this.turtle.height
			var scale = this.zoom
			var smod = floor(scale)
			var t = 0
			var minv = 0, maxv = 0.
			// we should draw it near the scroll position
			var xmin = this.todo.xScroll - this.$w
			var xmax = xmin + this.$w * 3
			outer:
			for(let c = 0; c < this.recording.length; c++) {
				var left = this.recording[c][0]
				if((t + left.length) / scale < xmin) {
					t += left.length
					continue
				}
				for(let i = 0; i < left.length; i++) {
					var v = left[i]
					if(v < minv) minv = v
					if(v > maxv) maxv = v
					if(!(t++ % smod) && t / scale > xmin) {
						this.drawQuad({
							color: t > this.selStart && t < this.selEnd? '#7cff': '#26cf',
							x: t / scale,
							y: minv * height * .5 + this.turtle.sy + 0.5 * height,
							w: 1,///painter.pixelRatio,//t / scale,
							h: (maxv - minv) * height * .5 + 1.//+300
						})
						minv = 0
						maxv = 0
					}
					if(t / scale > xmax) break outer
				}
			}
			this.scrollSize(this.samples / scale, 0)
		}
		this.endGrid(true)
		
	}
}