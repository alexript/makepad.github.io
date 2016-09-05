module.exports = require('base/stamp').extend(function ButtonStamp(proto){

	proto.props = {
		text:'',
		icon:'',
		index:0,
		debug:0
	}

	proto.inPlace = 1
	
	proto.tools = {
		Bg: require('tools/rect').extend({
			color:'gray',
			padding:[10,10,10,10]
		}),
		Text: require('tools/text').extend({
			font:require('fonts/ubuntu_monospace_256.font')
		}),
		Icon: require('tools/icon').extend({
		})
	}

	proto.styles = {
		default:{},
		defaultOver:{Bg:{color:'#f77'}},
		clicked:{Bg:{color:'#f77'}},
		clickedOver:{Bg:{color:'red'}}
	}
	
	proto.setClicked = function(clk){
		if(clk) this.state = this.styles.clicked
		else this.state = this.styles.default
	}

	proto.isClicked = function(){
		return this.state === this.styles.clicked || this.state === this.styles.clickedOver
	}

	proto.onFingerDown = function(e){
		if(this.click && (this.click.radio !== undefined || this.click.toggle !== undefined)){
			// lets check if there are other stamps in the radio group
			if(this.click.radio !== undefined){ // its a radio group
				this.state = this.styles.clickedOver
				for(var i = 0; this.click[i]; i++){
					var other = this.click[i]
					if(other !== this){
						other.state = other.styles.default
					}
				}
				this.click.radio = this.index
			}
			else if(this.click.toggle !== undefined){ // bitmask group
				if(this.isClicked()){
					this.state = this.styles.defaultOver
					this.click.toggle &= ~(1 << this.index)
				}
				else{
					this.state = this.styles.clickedOver
					this.click.toggle |= 1 << this.index
				}
			}
			if(this.onClick) this.onClick(e)
		}
		else{
			 this.state = this.styles.clickedOver
		}
	}

	proto.onFingerUp = function(e){
		if(this.click&& (this.click.radio !== undefined || this.click.toggle !== undefined)){
			if(this.isClicked()){
				if(e.samePick) this.state = this.styles.clickedOver
				else this.state = this.styles.clicked
			}
			else{
				if(e.samePick) this.state = this.styles.clickedOver
				else this.state = this.styles.clicked				
				this.state = this.styles.defaultOver
			}
		}
		else{
			if(e.samePick){
				if(e.touch){
					this.state = this.styles.default
				}
				else{
					this.state = this.styles.defaultOver
				}
				if(this.onClick) this.onClick(e)
			}
			else{
				this.state = this.styles.default
			}
		}
	}

	proto.onFingerOver = function(){
		this.state = this.isClicked()?this.styles.clickedOver:this.styles.defaultOver
	}

	proto.onFingerOut = function(){
		this.state = this.isClicked()?this.styles.clicked:this.styles.default
	}

	proto.onDraw = function(){
		//console.log(this.turtle.dump())
		this.beginBg(this)
		if(this.icon){
			if(this.marked)console.log(this.icon)

			this.drawIcon({
				text:this.lookupIcon[this.icon]
			})
		}
		if(this.text){
			this.drawText({
				text:this.text
			})
		}
		this.endBg()
	}

	proto.toolMacros = {
		draw:function(overload, click){
			this.$STYLESTAMP(overload)
			// see if we need to set the state to clicked
			if(click){
				if(click.radio !== undefined && click.radio === overload.index ||
				   click.toggle !== undefined && click.toggle&(1<<overload.index)){
					$stamp._state = $stamp.styles.clicked
				}
				else{
					$stamp._state = $stamp.styles.default
				}
				if(click.radio !== undefined){
					click[overload.index] = $stamp
				}
			}
			$stamp.click = click
			if(overload.icon === 'trash') $stamp.marked = 1
			this.$DRAWSTAMP()
			return $stamp
		}
	}
})