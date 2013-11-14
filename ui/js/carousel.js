// CAROUSEL JS /////////////////////////////////////////////////////////////////
// Requires utils.js
var mobile = typeof mobile !== 'undefined' ? mobile : {};
mobile.Carousel = function( _config ){
    if( this === window ){
        return new mobile.Carousel( _config );
    }
    var initialize = function initialize(){
        document.ontouchmove = function(_e){_e.preventDefault();};
        var slides = window.location.hash.substr(1).replace(/%7C/g, '.' ).split('+'),
            i = 0,
            slideList = document.find('.slide-list')[0],
            slideMatrix = slideList.find('li')[0],
            slide = {},
            slideStyles = {},
            slideWidth = 0,
            slideMargin = 0,
            bulletList = document.find('.bullet-list')[0],
            bulletMatrix = bulletList.find('li')[0],
            bullet = {},
            bullets = [],
            onBulletTap = function onBulletTap(_e){
                var index = bullets.indexOf(_e.currentTarget);
                gotoSlide(index);
            },
            getStyles = function getStyles( _element ){
                var output = {},
                    slideStyles = getComputedStyle( slides[0] );
                output.marginX = parseInt( slideStyles.marginLeft, 10 ) +
                                 parseInt(slideStyles.marginRight, 10);
                output.width = parseInt( slideStyles.width, 10);
                return ;
            };
        slideMatrix.parentElement.removeChild(slideMatrix);
        bulletMatrix.parentElement.removeChild(bulletMatrix);
        slides.forEach( function( _slide ){
            slide = slideMatrix.cloneNode(true);
            console.log( _slide.sanitizeLink() );
            slide.style.backgroundImage = "url(" + _slide.sanitizeLink() + ")";
            slideList.appendChild(slide);
            bullet = bulletMatrix.cloneNode(true);
            bulletList.appendChild(bullet);
        });
        slideStyles = getComputedStyle(slideList.find('li')[0]);
        slideWidth = parseInt(slideStyles.width, 10);
        slideMargin = parseInt(slideStyles.marginLeft, 10) + parseInt(slideStyles.marginRight, 10);
        slideList.style.width = ( ( slideWidth + slideMargin ) * slides.length ) + 'px';
        bullets = bulletList.find('li');
        bullets[0].classList.add('selected');
        // Assign handlers ================================================= >>>
        slideList.subscribe('touchstart', initDragSlides);
        bullets = bulletList.find('li');
        bullets.forEach( function( _bullet ){
            _bullet.subscribe('touchend', onBulletTap);
        });
    },
    gotoSlide = function gotoSlide( _index ){
        var slideList = document.find('.slide-list')[0],
            slideStyles = getStyles( slideList.find('li')[0] ),
            slideWidth = slideStyles.width,
            slideMargin = slideStyles.marginX,
            slideFootprint = slideWidth + slideMargin,
            pos = 0 - (slideFootprint * _index);
        slideList.classList.add('snap-style');
        slideList.style.left = pos + "px";
        updateBullets( _index );
    },
    updateBullets = function updateBullets( _index ){
        var slides = document.find('.slide-list li'),
            slideCount = slides.length,
            bullets = document.find('.bullet-list li');
        for( i=0; i<slideCount; i++ ){
            bullets[i].classList.remove('selected');
        }
        bullets[_index].classList.add('selected');
    },
    initDragSlides = function initDragSlides( _e ){
        var slideList = _e.currentTarget,
            originX = _e.touches[0].clientX,
            curX = 0,
            offset = parseInt( getComputedStyle(slideList).left, 10 ) || 0,
            bullets = document.find('.bullet-list li'),
            slides = slideList.find('li'),
            slideCount = slides.length,
            slideWidth = slides[0].offsetWidth,
            slideMargin = calculateMarginX( slides[0] ),
            originSlide = Math.round( Math.abs( originX / slideWidth ) ),
            dragSlides = function dragSlides( _evt ){
                var touchX = _evt.touches[0].clientX,
                    listStyles = slideList.style,
                    listWidthLimit = slideList.offsetWidth - slideWidth,
                    moved = offset - (originX - touchX),
                    slideNum = Math.round( Math.abs( moved / slideWidth ) ),
                    i=0;
                curX = touchX;
                if(moved < 0 && Math.abs(moved) < listWidthLimit){
                    listStyles.left = moved + 'px';
                    updateBullets(slideNum);
                }
            },
            endDrag = function endDrag( _evt ){
                var rawPos = parseInt( getComputedStyle(slideList).left, 10 ),
                    slideFootprint = slideWidth + slideMargin,
                    slideNum = Math.round( Math.abs( rawPos / slideFootprint ) ),
                    travel = originX - curX,
                    lastSlideIndex = slideCount - 1;
                if( Math.abs( travel ) < 300 ){
                    if( travel < 0 ){
                        slideNum = slideNum !== 0 ? slideNum - 1 : 0;
                    }else{
                        slideNum = slideNum !== lastSlideIndex ? slideNum + 1 : lastSlideIndex;
                    }
                }
                gotoSlide(slideNum);
                slideList.unsubscribe('touchmove', dragSlides);
                slideList.unsubscribe('touchend', endDrag);
            };
            slideList.classList.remove('snap-style');
            slideList.subscribe('touchmove', dragSlides);
            slideList.subscribe('touchend', endDrag);
    };
};