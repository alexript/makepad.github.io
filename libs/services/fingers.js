var service = require('$fingers1')

var Fingers = require('base/class').extend(function Fingers(proto){
	require('base/events')(proto)
})

var fingers = module.exports = new Fingers()

fingers.cursors = {
	'none':1, // no cursor
	'auto':1, // browser determines cursor

	//  *  
	//  *  *
	//  *    *
	//  *      * 
	//  *   * 
	//  *    *
	//        *
	'default':1, 

	//  *  
	//  *  *
	//  *    *
	//  *      * 
	//  *   *   |----|
	//  *    *  |----|
	//        * |----|
	'contextMenu':1,

	//  *  
	//  *  *
	//  *    *
	//  *      * 
	//  *   *   
	//  *    *   ?
	//        *
	'help':1,

	//  *  
	//  *  *
	//  *    *
	//  *      * 
	//  *   *    |  ^ |
	//  *    *   | /  |
	//        *       
	'alias':1,

	//  *  
	//  *  *
	//  *    *
	//  *      * 
	//  *   *    
	//  *    *   |+|
	//        *        
	'copy':1,

	//  *  
	//  *  *
	//  *    *
	//  *      * |****|
	//  *   *     \**/
	//  *    *    /**\
	//        *  |****|
	'progress':1,


	//  |******|
	//   \****/
	//    \**/  
	//    /**\  
	//   /****\ 
	//  |******|
	'wait':1,

	//    _____
	//   / \   \
	//  |   \  |
	//   \___\/
	'not-allowed':1,

	//    *  
	//    *
	//    * * * *
	// *  * * * *  
	// *  *     *
	//  * *     *  
	//  *      *
	'pointer':1,

	//    *  
	//    *
	//    * * * *
	// *  * * * *    _____
	// *  *     *   / \   \
	//  * *     *  |   \  |
	//  *      *    \___\/
	'no-drop':1,

	//      
	//    * * * *
 	//    * * * *
	// *  * * * *  
	// *  *     *
	//  * *     *  
	//  *      *
	'grab':1,

	//       
	//     
 	//    * * * *
	//  * * * * *  
	// *  *     *
	//  * *     *  
	//  *      *
	'grabbing':1,

	//   _____
	//  /  |  \
	//  | -+- | 
	//  \__|__/ 
	//     | 
	//     |
	'zoom-in':1,

	//   _____
	//  /     \
	//  | --- | 
	//  \_____/ 
	//     | 
	//     |
	'zoom-out':1,

	//     ^
	//     |
	//  <--+-->
	//     |
	//     v 
	'move':1,

	//     ^
	//   < * >
	//     v 	
	'all-scroll':1,

	//   --+--
	//     |
	//     |
	//   __|__ 
	'text':1,

	//   |     |
	//   |-----|
	//   |     |
	'vertical-text':1,

	//     | |  
	//     | |
	//  ---+ +---
	//  ---+ +--- 
	//     | |
	//     | |
	'cell':1,

	//     |
	//     |
	//  ---+---
	//     |
	//     | 
	'crosshair':1,

	//     ||
	//   <-||->
	//     ||
	'col-resize':1,

	//     ^
	//     |
	//   =====
	//     |
	//     v 	
	'row-resize':1,

	//     ^
	//     |
	'n-resize':1,

	//    -->
	'e-resize':1,

	//     |
	//     v
	's-resize':1,

	//    <--
	'w-resize':1,

	//     ^
	//    /  
	'ne-resize':1,

	//   ^
	//    \ 
	'nw-resize':1,

	//    \ 
	//     v
	'se-resize':1,

	//    / 
	//   v  
	'sw-resize':1,

	//  <--->
	'ew-resize':1,

	//     ^
	//     |
	//     v 	
	'ns-resize':1,

	//     ^
	//    /  
	//   v
	'nesw-resize':1,

	//   ^
	//    \  
	//     v
	'nwse-resize':1,
}

fingers.setCursor = function(cursor){
	if(!fingers.cursors[cursor]) console.error('Cursor not defined '+cursor)
	service.postMessage({
		fn:'setCursor',
		cursor:cursor
	})
}

fingers.startFingerDrag = function(digit){
	service.postMessage({
		fn:'startFingerDrag',
		digit:digit
	})	
}

var delayTimer= {}
function delayMessage(msg){
	delayTimer[msg.fn] = undefined
	if(fingers[msg.fn]) fingers[msg.fn](msg)
}

service.onMessage = function(msg){
	// message pileup removal
	if(msg.fn === 'onFingerMove' || msg.fn === 'onFingerWheel'){
		if(Date.now() - msg.time > 50){ //
			if(delayTimer[msg.fn]){
				if(msg.fn === 'onFingerWheel'){
					var old = delayTimer[msg.fn].msg
					msg.xWheel += old.xWheel
					msg.yWheel += old.yWheel
				}
				clearTimeout(delayTimer[msg.fn].to)
			}
			var fn = delayMessage.bind(this, msg)
			delayTimer[msg.fn] = {fn:fn, msg:msg, to:setTimeout(fn, 20)}
			return
		}
		if(delayTimer[msg.fn]) clearTimeout(delayTimer[msg.fn].to), delayTimer[msg.fn] = undefined
	}
	// if we have delaytimers running flush them first
	for(var key in delayTimer){
		if(!delayTimer[key]) continue
		delayTimer[key].fn()
		clearTimeout(delayTimer[key].to)
		delayTimer[key] = undefined
	}

	if(fingers[msg.fn]) fingers[msg.fn](msg)
}