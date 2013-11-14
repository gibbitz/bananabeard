( function(){
    var
    // private isSet method ============================================ >>>
        isSet = function isSet( _rest ){
            var i = 0,
                argCount = arguments.length,
                set = true;
            for( i=0; i<argCount; i++ ){
                set = !set ? set : typeof arguments[i] !== 'undefined';
            }
            return set;
        },
        castAsArray = function castAsArray( _list ){
            return Array.prototype.slice.call( _list );
        },
        extend = function extend( _newObject ){
            var prop = '';
            for(prop in _newObject){
                if( _newObject.hasOwnProperty(prop) ){
                    this[prop] = _newObject[prop];
                }
            }
            this.constructor.prototype = _newObject.constructor.prototype;
        },
        // forEach polyfill
        _forEach = function _forEach ( _callback, _scope ){
            var i = 0,
                count = this.length;
            for (i = 0; i < count; i++) {
                _callback.apply(_scope, [ this[i], i, this ]);
            }
        },
    // querySelectorAll wrapper ======================================== >>>
        find = function find(_cssSelector){
            var target = this !== window ? this : document,
                output = [];
            if(typeof _cssSelector !== 'undefined' && _cssSelector !== ''){
                if( isSet( target.querySelectorAll ) ){
                    output = target.querySelectorAll( _cssSelector );
                }else if( isSet( target.length ) ){
                    if( !isSet( target.forEach ) ){
                        target.constructor.prototype.forEach = Array.prototype.forEach;
                    }
                    target.forEach(function(_element){
                        var matchedElement = _element.parentElement.find( _cssSelector );
                        output = output.concat( castAsArray( matchedElement ) );
                    });
                }
            }
            return output;
        },

    // looper for NodeLists and Arrays ================================ >>>
        doToEach = function doToEach( _operation, _rest ){
            var passedArgs = castAsArray( arguments );
            passedArgs.shift();
            if( !isSet( this.forEach ) ){
                this.constructor.prototype.forEach = _forEach;
            }
            this.forEach( function(_value, _key, _array){
                (function(){
                _operation.apply( _value, [_value, _key, _array].concat(passedArgs) );
                }());
            }, this );
        },

    // DOM MANIPULATION ////////////////////////////////////////////////////////
        removeElement = function removeElement( _className, _callback ){
            this.unsubscribeAll();
            this.parentElement.removeChild(this);
            this.publish('removed');
        },
        insertMarkup = function insertMarkup( _markup, _position ){
            var newEl = {};
            this.insertAdjacentHTML( _position, _markup );
            this.publish('inserted', newEl);
            switch( _position ){
                case 'afterend':
                    newEl = this.nextSibling;
                break;
                case 'afterbegin':
                    newEl = this.firstChild;
                break;
                case 'beforeend':
                    newEl = this.lastChild;
                break;
                case 'beforebegin':
                    newEl = this.previousSibling;
                break;
                default:
                    newEl = this;
                break;
            }
            newEl.publish('inserted');
            return newEl;
        },
        insertAfter = function insertAfter( _markup ){
            return insertMarkup.call( this, _markup, 'afterend');
        },
        insertBefore = function insertBefore( _markup ){
            return insertMarkup.call( this, _markup, 'beforebegin');
        },
        append = function append( _markup ){
            return insertMarkup.call( this, _markup, 'beforeend');
        },
        prepend = function prepend( _markup ){
            return insertMarkup.call( this, _markup, 'afterbegin');
        },
        addClass = function addClass( _className ){
            this.classList.add( _className );
        },
        removeClass = function removeClass( _className ){
            this.classList.remove( _className );
        },
        hasClass = function hasClass( _className ){
            return this.classList.contains( _className );
        },
        supportsCSSProp = function supportsCSSProp( _propName ){
            return typeof this.style[_propName] !== 'undefined';
        },
        getNumericValue = function getNumericValue(){
            return parseInt( this.valueOf().replace('px', ''), 10 ) || 0;
        },

    // EVENTS //////////////////////////////////////////////////////////////////

    // Touch Event polyfill vendorEvents.touchend, vendorEvents.touchstart, vendorEvents.tou
    // Event name polyfill
        vendorEvents = (function(){
            var style = document.body.style,
                touchEnabled = isSet( window.ontouchend ),
                pointerEnabled = isSet( window.navigator.msPointerEnabled ),
                propName = '',
                output = new function(){}(),
                animationEvents = {
                    'webkitAnimation':{
                        'animationEnd':'webkitAnimationEnd',
                        'transitionEnd':'webkitTransitionEnd'
                    },
                    'MozTransition':{
                        'animationEnd':'animationend',
                        'transitionEnd':'transitionend'
                    },
                    'MSTransition':{
                        'animationEnd':'msAnimationEnd',
                        'transitionEnd':'msTransitionEnd'
                    },
                    'OTransition':{
                        'animationEnd':'oAnimationEnd',
                        'transitionEnd':'oTransitionEnd'
                    },
                    'animation':{
                        'animationEnd':'animationend',
                        'transitionEnd':'transitionend'
                    }
                },
                uxEvents = {
                    'touch':{
                        'touchstart': 'touchstart',
                        'touchmove' : 'touchmove',
                        'touchend'  : 'touchend'
                    },
                    'pointer':{
                        'touchstart': 'MSPointerDown',
                        'touchmove' : 'MSPointerMove',
                        'touchend'  : 'MSPointerUp'
                    },
                    'mouse':{
                        'touchstart': 'mousedown',
                        'touchmove' : 'mousemove',
                        'touchend'  : 'mouseup'
                    }
                };
            for(propName in animationEvents){
                if( typeof style[propName] !== 'undefined' ){
                    extend.call(output, animationEvents[propName]);
                    break;
                }
            }
            if(touchEnabled){
                extend.call(output, uxEvents['touch']);
            }else if(pointerEnabled){
                extend.call(output, uxEvents['pointer']);
            }else{
                extend.call(output, uxEvents['mouse']);
            }
            return output;
        }()),
    // Event creation/trigger method =================================== >>>
        publish = function publish( _eventName, _payload ){
            var _this = this,
                e = document.createEvent("Event");
            e.initEvent( _eventName, true, true );
            e.data = _payload || {};
            if( isSet( this.addEventListener) ){
                this.dispatchEvent(e);
            }else{
                this.listeners.forEach( function( _listener ){
                    if( _listener.event === _eventName ){
                        _listener.handler.call(_this, e);
                    }
                });
            }
        },
        // Event queueing & removal ==================================== >>>
        subscribe = function subscribe( _eventName, _handler, _useCapture ){
            var events = _eventName.split(' '),
                eventCount = events.length,
                i = 0,
                key = '',
                eventName = '';
            _useCapture = _useCapture || false;
            if( ! isSet( this.listeners ) ){
                this.constructor.prototype.listeners = [];
            }
            for( i=0; i<eventCount; i++ ){
                eventName = events[i];
                for(key in vendorEvents){
                    if(key === eventName){
                        eventName = vendorEvents[key];
                    }
                }
                this.listeners[ this.listeners.length ] =  {
                                        'handler'   : _handler,
                                        'event'     : eventName
                                    };
                if( isSet( this.addEventListener ) ){
                    this.addEventListener(eventName, _handler, _useCapture);
                }
            }
        },
        unsubscribe = function unsubscribe( _eventName, _handler ){
            if( isSet( this.listeners ) ){
                var handler = function(){},
                    getHandler = function getHandler ( _element ){
                        var p = _element.listeners.length - 1,
                            hasHandler = isSet( _handler );
                        for(p; p>=0; p--){
                            handler = _handler || _element.listeners[p].handler;
                            if(
                                _element.listeners[p].event === _eventName &&
                                (
                                    (
                                        hasHandler &&
                                        _element.listeners[p].handler === _handler
                                    ) ||
                                    ! hasHandler
                                )
                            ){
                                return _element.listeners.splice(p, 1)['handler'];
                            }
                        }
                        return _handler;
                    };
                handler = getHandler( this );
                this.removeEventListener( _eventName, _handler || handler );
            }
        },
        unsubscribeAll = function unsubscribeAll( _includeChildren ){
            var removeListeners = function removeListeners ( _element ){
                    if( isSet( _element.listeners ) ){
                        _element.listeners.forEach( function( _listener ){
                            this.unsubscribe( _listener.event, _listener.handler );
                        }, _element );
                    }
                },
                unsubscribeChildren = function unsubscribeChildren( _parent ){
                    var kids = _parent.children;
                    kids.forEach( function( _curChild ){
                        removeListeners( _curChild );
                        if( _curChild.hasChildNodes() ){
                            unsubscribeChildren.call( _curChild );
                        }
                    });
                };
            removeListeners( this );
            if( _includeChildren ){
                unsubscribeChildren( this );
            }
        },

    // PanSelector code ============================================== >>>
        recognizeSwipeGesture = function recognizeSwipeGesture( _threshold, _preventScroll ){
            var isElement = ( /Element/ ).test( this.constructor.toString() ),
                elements = ( function( _self ){
                    var output = [];
                    if( isElement ){
                        output = [ _self ];
                    }else{
                        output = _self;
                    }
                    return output;
                } )( this ),
                addHandlers = function addHandlers(){
                    var orgX = 0,
                        orgY = 0,
                        curX = 0,
                        curY = 0,
                        element = this,
                        threshold = isSet( _threshold ) ? _threshold : 0,
                        startGestureHandler = function startGestureHandler(_e){
                            orgX = _e.pageX || _e.touches[0].screenX;
                            orgY = _e.pageY || _e.touches[0].screenY;
                            element.subscribe( vendorEvents.touchmove, moveGestureHandler );
                            element.subscribe( vendorEvents.touchend, endGestureHandler );
                            
                        },
                        moveGestureHandler = function moveGestureHandler(_e){
                            if(_preventScroll){
                                _e.preventDefault();
                            }
                            curX = _e.pageX || _e.touches[0].screenX;
                            curY = _e.pageY || _e.touches[0].screenY;
                        },
                        endGestureHandler = function endGestureHandler(_e){
                            var L2R = orgX - curX + threshold < 0,
                                R2L = orgX - curX - threshold > 0,
                                T2B = orgY - curY + threshold < 0,
                                B2T = orgY - curY - threshold > 0,
                                touchData = {
                                    'start' : {
                                        'x' : orgX,
                                        'y' : orgY
                                    },
                                    'stop' : {
                                        'x' : curX,
                                        'y' : curY
                                    }
                                };
                            element.unsubscribe( vendorEvents.touchmove, moveGestureHandler );
                            element.unsubscribe( vendorEvents.touchend, endGestureHandler );
                            if(L2R){
                                element.publish( 'swipeL2R', touchData );
                            }
                            if(R2L){
                                element.publish( 'swipeR2L', touchData );
                            }
                            if(T2B){
                                element.publish( 'swipeT2B', touchData );
                            }
                            if(B2T){
                                element.publish( 'swipeB2T', touchData );
                            }
                        };
                    element.subscribe( vendorEvents.touchstart, startGestureHandler );
                };
            if(vendorEvents.touchstart !== 'mousedown'){
                elements.doToEach( addHandlers );
            }
        },

    // XMLHttpRequest wrapper ========================================== >>>
        loadData = function loadData(_dataPath, _success, _failure){
            var self = this,
                req = new XMLHttpRequest(),
                hasSuccessCallback = isSet( _success ),
                hasFalureCallback = isSet( _failure );
            req.open("GET", _dataPath, false);
            req.onreadystatechange = function(){
                switch( req.readyState ){
                    case 4:
                        self.publish('loadSuccess', req.responseText);
                        if ( hasSuccessCallback ){
                            _success( req.responseText );
                        }
                    break;
                    default:
                        self.publish('loadFailure');
                        if(hasFalureCallback){
                            _failure( req );
                        }
                        // if 404 throw jsError!
                        if(req.status === 404 && ! hasFalureCallback ){
                            throw new Error( _dataPath + "can't be found!" );
                        }
                        // else do nothing
                    break;
                }
            };
            req.send(null);
        };
    // Extend prototypes ///////////////////////////////////////////////////////
    HTMLElement.prototype.forEach = NodeList.prototype.forEach = _forEach;
    HTMLElement.prototype.recognizeSwipeGesture = recognizeSwipeGesture;
    HTMLCollection.prototype.recognizeSwipeGesture = recognizeSwipeGesture;
    NodeList.prototype.recognizeSwipeGesture = recognizeSwipeGesture;
    HTMLCollection.prototype.doToEach = doToEach;
    NodeList.prototype.doToEach = doToEach;
    Array.prototype.doToEach = doToEach;
    document.find = find;
    document.vendorEvents = vendorEvents;
    HTMLElement.prototype.find = find;
    HTMLCollection.prototype.find = find;
    NodeList.prototype.find = find;
    HTMLElement.prototype.before = insertBefore;
    HTMLElement.prototype.after = insertAfter;
    HTMLElement.prototype.append = append;
    HTMLElement.prototype.prepend = prepend;
    HTMLElement.prototype.addClass = addClass;
    HTMLElement.prototype.removeClass = removeClass;
    HTMLElement.prototype.hasClass = hasClass;
    HTMLElement.prototype.supportsCSSProp = supportsCSSProp;
    // Object.prototype.extend = extend;
    Object.defineProperty(Object.prototype, 'extend', {
        'enumerable' : false,
        'value' : extend
    });
    Object.defineProperty(Object.prototype, 'publish', {
        'enumerable' : false,
        'value' : publish
    });
    Object.defineProperty(Object.prototype, 'subscribe', {
        'enumerable' : false,
        'value' : subscribe
    });
    Object.defineProperty(Object.prototype, 'unsubscribe', {
        'enumerable' : false,
        'value' : unsubscribe
    });
    Object.defineProperty(Object.prototype, 'unsubscribeAll', {
        'enumerable' : false,
        'value' : unsubscribeAll
    });
    Object.defineProperty(Object.prototype, 'loadData', {
        'enumerable' : false,
        'value' : loadData
    });
    String.prototype.getNumericValue = getNumericValue;

    // create and add properties/methods to window.app /////////////////////////
    window.utils = isSet(window.utils) ? window.utils : {};
    window.utils.loadData = loadData;
})();