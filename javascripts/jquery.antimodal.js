/*

  jQuery AntiModal v0.1.20110903
  Full-page takeover alternative to jQuery UI's Dialog and/or various Lightbox-style plugins

  Licensed under the MIT license
  Copyright 2011 Luis Buenaventura (@helloluis)

  - project started 2011-09-03
  - plugin pattern pilfered from @desandro's Masonry
  - uses the mini-plugin 'smartresize', courtesy of respective author

*/

(function( window, $, undefined ){
  
  /*
   * smartresize: debounced resize event for jQuery
   *
   * latest version and complete README available on Github:
   * https://github.com/louisremi/jquery.smartresize.js
   *
   * Copyright 2011 @louis_remi
   * Licensed under the MIT license.
   */

  var $event = $.event,
      resizeTimeout;

  $event.special.smartresize = {
    setup: function() {
      $(this).bind( "resize", $event.special.smartresize.handler );
    },
    teardown: function() {
      $(this).unbind( "resize", $event.special.smartresize.handler );
    },
    handler: function( event, execAsap ) {
      // Save the context
      var context = this,
          args = arguments;

      // set correct event type
      event.type = "smartresize";

      if ( resizeTimeout ) { clearTimeout( resizeTimeout ); }
      resizeTimeout = setTimeout(function() {
        jQuery.event.handle.apply( context, args );
      }, execAsap === "execAsap"? 0 : 100 );
    }
  };

  $.fn.smartresize = function( fn ) {
    return fn ? this.bind( "smartresize", fn ) : this.trigger( "smartresize", ["execAsap"] );
  };

  
  // our "Widget" object constructor
  $.AntiModal = function( options, element ){
    this.element = $( element );

    this._create( options );
    this._init();
  };
  
  
  $.AntiModal.settings = {
    buttonClass     : "dt",
    contentClass    : "dd",
    takeover        : "body",
    containerID     : "antimodal_container",
    containerClass  : "antimodal",
    slideFrom       : "right",
    cloneBackground : true,
    resizable       : false,
    cover           : 95,
    animate         : true,
    animation_duration : 800
  };
  
  $.AntiModal.prototype = {
    _init : function() {
      
    },
    
    _create : function( options ) {
      
      this.options = $.extend( true, {}, $.AntiModal.settings, options );
      
      this.opened  = false;
      
      var anti     = this;
      // initialize all the necessary vars for building our antimodal container
      var buttons  = anti.options.buttonClass, 
        contents   = anti.options.contentClass, 
        takeover   = anti.options.takeover,
        cont_id    = anti.options.containerID,
        cont_class = anti.options.containerClass,
        slide_from = anti.options.slideFrom,
        cover      = parseInt(anti.options.cover) < 10 ? 10 : parseInt(anti.options.cover),
        width      = $(takeover).outerWidth() * cover/100,
        height     = $(window).height() > $(takeover).outerHeight() ? $(window).height() : $(takeover).outerHeight(),
        clone_bg   = anti.options.cloneBackground,
        maxZ       = Math.max.apply(null,$.map($(takeover + ' > *'), function(e,n){
                       return( $(e).css('position')=='absolute' ? parseInt($(e).css('z-index')) : 1 );
                     })),
        zindex     = maxZ+2;
      
      this.takeover = takeover;
      
      if (clone_bg===true) {
        var background_style = [ $(takeover).css("backgroundColor"), 
                                  $(takeover).css("backgroundImage"), 
                                  $(takeover).css("backgroundRepeat"), 
                                  $(takeover).css("backgroundPosition") ].join(" ");
      } else {
        var background_style = "rgba(0,0,0,0.4)";
      }

      var content_cont = this.content_cont = $("<div class='antidialog_content_container'></div>").
        css({
          "margin" : "10px",
          "padding" : "10px"
        });

      // build the antimodal container, appending it to the takeover target, then hiding it for later use
      var cont = this.cont = $("<div id='" + cont_id + "' class='" + cont_class + "'></div>").
        css({ 
          "position"   : "absolute",
          "zIndex"     : zindex,
          "top"        : "0px",
          "left"       : ($(takeover).outerWidth() + 1) + "px",
          "background" : background_style,
          "width"      : width + "px",
          "height"     : height + "px"
        }).
        html( content_cont ).
        appendTo(takeover).
        hide();
      
      // we position the container differently if we want it to slide in from the left side of the takeover target
      if (slide_from=="left") {
        this.slideOrigin = "-" + width, this.slideTarget = width;
        cont.css({"left" : this.slideOrigin + "px"});
      } else {
        this.slideOrigin = width, this.slideTarget = $(takeover).outerWidth() - width;
      }

      // build the cancellation hotspot
      var cancellor = this.cancellor = $("<div id='antidialog_cancellor'></div>").
        css({
          "position"        : "absolute",
          "zIndex"          : zindex-1,
          "background"      : "rgba(0,0,0,0.5)",
          "top"             : "0px",
          "left"            : "0px",
          "width"           : $(takeover).outerWidth(),
          "height"          : $(window).height() > $(takeover).outerHeight() ? $(window).height() : $(takeover).outerHeight()
        }).
        click(function(){
          anti.hidePage();
        }).
        appendTo(takeover).
        hide();
      
      
      if (anti.options.resizable===true) {
        // add the resizer handle div, if resizable is true
        var resizer = this.resize = $("<div id='antidialog_resizer'></div>").
          addClass("ui-resizable-handle ui-icon ui-icon-triangle-2-e-w").
          css({ "width" : "10px", "height" : "100%" });
          
        if (slide_from=='left') {
          resizer.css({ "float" : "right", "marginLeft" : "10px" }).appendTo(cont);
        } else {
          resizer.css({ "float" : "left", "marginRight" : "10px" }).prependTo(cont);
        }
      }
      
      // add button click behaviours
      $(buttons).css("cursor","pointer").click(function(){
        var content = $(this).clone().html() + $(this).next(contents).html();
        anti.showPage(content);
      })
      
      // hide content items
      $(contents).hide();
      
    },
    showPage : function( content ) {
      if (this.opened===false) {
        // need to reset the container height to 'auto' temporarily then allow jQuery to modify it again
        this.content_cont.html( content );
        this.cont.show().css({"height":"auto"});
        var height = $(window).height() > $(this.cont).outerHeight() ? $(window).height() : $(this.cont).outerHeight();
        this.cont.css({ height : height }); 
        this.cancellor.show().css({ height : height });
        
        if (this.options.animate===true) {
          this.cont.animate({ "opacity" : 1.0, "left" : this.slideTarget + "px" }, this.options.animation_duration); 
          this.cancellor.animate({ "opacity" : "0.5" }, this.options.animation_duration);
          
        } else {
          this.cont.css({ left : this.slideTarget + "px" });
          this.cancellor.css({ "opacity" : "0.5" });
          
        }
        
        this.opened = true;
      } else {
        this.cont.html( content );
      }
    },
    hidePage : function() {
      if (this.opened===true) {
        this.content_cont.empty();
        
        if (this.options.animate===true) {
          this.cont.animate({ "opacity" : 0.0, "left" : this.slideOrigin + "px" }, this.options.animation_duration, function(){ $(this).hide(); });
          this.cancellor.animate({ "opacity" : 0.0 }, this.options.animation_duration, function(){ $(this).hide(); });
          
        } else {
          this.cont.css({ "opacity" : 0.0, "left" : this.slideOrigin + "px" });
          this.cancellor.css({ "opacity" : 0.0 });
          
        }
        this.opened = false;
      }
    },
    _destroy : function() {
      this.cont.remove();
      this.cancellor.remove();
      $(this.buttonClass).unbind("click");
      $(this.contentClass).show();
    },
    option : function(key, value) {
      if ( $.isPlainObject( key ) ){
        this.options = $.extend(true, this.options, key);
      }
    }
  };
  
  
  // =======================  Plugin bridge  ===============================
  // leverages data method to either create or return $.AntiModal constructor
  // pilfered from @desandro's Masonry
  
  $.fn.antimodal = function( options ) {
    if ( typeof options === 'string' ) {
      // call method
      var args = Array.prototype.slice.call( arguments, 1 );

      this.each(function(){
        var instance = $.data( this, 'antimodal' );
        if ( !instance ) {
          logError( "cannot call methods on AntiModal prior to initialization; " +
            "attempted to call method '" + options + "'" );
          return;
        }
        if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
          logError( "no such method '" + options + "' for AntiModal instance" );
          return;
        }
        // apply method
        instance[ options ].apply( instance, args );
      });
    } else {
      this.each(function() {
        var instance = $.data( this, 'antimodal' );
        if ( instance ) {
          // apply options & init
          instance.option( options || {} );
          instance._init();
        } else {
          // initialize new instance
          $.data( this, 'antimodal', new $.AntiModal( options, this ) );
        }
      });
    }
    return this;
  };
  
})( window, jQuery );