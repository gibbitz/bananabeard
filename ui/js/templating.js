// private Renderer class for Templating =========================== >>>
        Renderer = function(){
            var renderer = this,
                fillKeys = function( _dataObj, _template ){
                    var key = "",
                        tmplKey = "",
                        regify = function( _key ){
                            return new RegExp("{{" + _key + "}}", "g");
                        },
                        curSlides = "",
                        output = _template;
                    for( key in _dataObj ){
                        if( key === 'slides' ){
                            curSlides = "#" + _dataObj[key].join('+');
                            curSlides = curSlides.replace(/\./g, '%7C'); // have to mask . in URL -- childbrowser doesn't like this :(
                            output = output.replace(regify("href"), curSlides );
                        }else{
                            output = output.replace(regify(key), _dataObj[key]);
                        }
                    }
                    return output;
                },
                extractSnippet = function( _findor, _template ){
                    var element = document.createElement('div'),
                        target = {}, // HTMLElement
                        output = "";
                    element.innerHTML = _template;
                    target = element.find(_findor)[0];
                    output = typeof target === "undefined" ? "" : target.outerHTML;
                    return output;
                },
                createRepeaterMarkup = function( _dataArray, _repeaterTemplate ){
                    var datapoints = _dataArray.length,
                        i = 0,
                        curTemplate = "",
                        output = "";
                    for(i=0; i<datapoints; i++){
                        curTemplate = _repeaterTemplate;
                        output += fillKeys(_dataArray[i], curTemplate);
                    }
                    return output;
                };
            renderer.constructor.prototype.fillRepeater = function( _repeaterSelector, _dataArray, _fullTemplate ){
                var repeaterTemplate = extractSnippet(_repeaterSelector, _fullTemplate),
                    repeaterMarkup = createRepeaterMarkup(_dataArray, repeaterTemplate);
                return _fullTemplate.replace(repeaterTemplate, repeaterMarkup);
            };
            renderer.constructor.prototype.fillTemplate = function(_data, _template){
                // consider consolidation?
                return fillKeys(_data, _template);
            };
        },



        // Populate Template function ====================================== >>>
        populateTemplate = function populateTemplate( _pageData, _template, _animationInClass ){
            var parentPage = app.navigator.getParent(),
                waypointClass = "",
                markup = _template,
                prepPages = function prepPages( _evt ){
                    var newEl = _evt.data;
                    // show selected item at level-3 -- detection based on waypoint string matching instead of hardcoding in css
                    if(newEl.classList.contains('level-3') ){
                        waypointClass = newEl.find('.placard-links')[0].className.split(' ')[1];
                        newEl.find(  '.placard-links.' +
                                        waypointClass + ' .' +
                                        waypointClass )[0].classList.add('selected');
                    }
                    // level-2 carousel invocation ================================= >>>
                    if( newEl.classList.contains('level-2') ){
                        newEl.find('nav')[0].classList.add('select_1');
                        initCarousel();
                    }
                }; // inserted HTMLElement
            //default animation class value
            _animationInClass = _animationInClass || "slide-in";
            // populate repeaters
            markup = app.renderer.fillRepeater('.level-1 .placard-links>li', _pageData.links, markup);
            markup = app.renderer.fillRepeater('.level-2 .carousel-links>li', _pageData.links, markup);
            markup = app.renderer.fillRepeater('.level-3 .placard-links>li', parentPage.links, markup);
            markup = app.renderer.fillRepeater('.level-3 .asset-links>li', _pageData.links, markup);
            // populate other variables
            if ( typeof _pageData.title === "undefined" ){
                _pageData.title = app.navigator.getParent().title;
            }
            // set count for level-3 pages
            _pageData.total_count = _pageData.links.length;
            markup = app.renderer.fillTemplate( _pageData, markup);
            // add listener for header
            header.subscribe('siblingInserted', function(_e){
                var section = _e.data,
                    configureLinks = function( _evt ){
                        var links = _evt.currentTarget.find('a'),
                            linkCount = links.length;
                            i = 0;
                        for( i=0; i<linkCount; i++ ){
                            links[i].subscribe('touchstart', manageTouchEnd);
                        }
                        section.unsubscribe('ready', configureLinks);
                    };
                header.unsubscribe('siblingInserted');
                section.subscribe('ready', configureLinks);
            });
            // add intro animation class & append to dom =================== >>>
            header.insertAfter(markup, _animationInClass);
            header.subscribe("siblingInserted", prepPages);
        },
        // END Populate Template function ================================== >>>
        populateAssetTemplate = function populateAssetTemplate( _pageData, _template ){
            var markup = app.renderer.fillRepeater('.level-3 .asset-links>li', _pageData.links, _template),
                fragment = document.createElement(),
                curLink = {}, // HTMLElement
                assetContainer = document.find('.asset-links')[0],
                oldLinks = assetContainer.children,
                i = oldLinks.length - 1,
                removeInt = 0,
                increment = 250,
                addNewLinks = function addNewLinks(){
                    var i = 0,
                        newLinks = fragment.find('.asset-links li'),
                        newLinkCount = newLinks.length;
                    for(i=0; i<newLinkCount; i++){
                        curLink = newLinks[ i ];
                        curLink.find('a')[0].subscribe('touchstart', manageTouchEnd);
                        curLink.classList.add('fade-up');
                        assetContainer.appendChild( curLink );
                    }
                    // var newLinks = fragment.find('.asset-links li'),
                    //     newLinkCount = newLinks.length,
                    //     i = 0,
                    //     addInt = 0,
                    //     flipNewLinks = function(){
                    //         // for(i=0; i<newLinkCount; i++){
                    //         if( i !== newLinkCount ){
                    //             curLink = newLinks[ i ];
                    //             curLink.find('a')[0].subscribe('touchstart', manageTouchEnd);
                    //             curLink.classList.add('fade-up');
                    //             assetContainer.appendChild( curLink );
                    //             i ++;
                    //         }else{
                    //             clearInterval(addInt);
                    //         }
                    //         // }
                    //     };
                    // increment = 500;
                    // addInt = setInterval(flipNewLinks, increment );
                    document.find('.result-total b')[0].innerText = newLinkCount;
                },
                removeOldies = function removeOldies(){
                    var i = oldLinks.length - 1;
                    for(i; i>=0; i--){
                        oldLinks[i].retire('fade-down');
                        if( i === 0 ){
                    //     clearInterval(removeInt);
                            addNewLinks();
                        }
                    // i--;
                    }
                };
            window.scrollTo(0);
            fragment.innerHTML = markup;
            removeOldies();
            // removeInt = setInterval(removeOldies, increment);
            //for(i; i>=0; i--){
                //oldLinks[i].style.webkitAnimationDelay = (p/100)+'s';
                //p+=increment;
            //}
        },
        // Level-2 carousel code =========================================== >>>