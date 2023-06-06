console.clear();
// TODO:
//   [/] - Sidebar object/init
//   [/] - Sidebar open/close events
//   [/] - Sidebar toggle events
//   [/] - Menu toggle events
//   [/] - Fix parent menu falsely closing (look again at jQuery code then re-translate)
//   [/] - Prevent toggle from scrolling page to top
//   [ ] - Add auto open on submenus for the first found active item.
//   [ ] - Add custom event listeners



(function(global, factory) {

   typeof(exports) === "object" && typeof(module) !== "undefined" ? module.exports = factory() :
   typeof(define) === "function" && define.amd ? define(factory) : (
      global = typeof(globalThis) !== "undefined" ? globalThis :
      global || self, global.Sidebar = factory()
   );

}(this, (function() {
   "use strict";
   
   var meta = {
      "version": "1.4.1",
      "bootstrap-version": "5.1.0", // Minimum tested version
      "bootstrap-version": "5.2.2" // Latest tested version
   }

   var defaultClasses = {
      "sidebar": "be-left-sidebar",
      "active": "active",
      "animate": "be-animate",
      "offcanvas": "be-offcanvas-menu",
      "open": "open",
      "toggle": "be-toggle-left-sidebar",
      "component": "",
      "elements": "sidebar-elements",
      "wrapper": "be-wrapper",
      "collapsed": "be-collapsible-sidebar-collapsed"
   };

   var defaultSelectors = {
      "item": "a",
      "parent": "li",
      "submenu": "ul"
   };

   // While Math.random() may have a high chance of producing 
   // duplicates, we are not using it for databases.
   // For our usage, it's unlikely to cause any conflicts.
   function uid(seperator) {
      return [
         "s",
         Date.now().toString(36),
         Math.random().toString(36).substring(2)
      ].join(seperator ? seperator : "");
   }

   // Our main function for creating the Sidebar
   function _Sidebar(selector, classes, selectors) {
      classes = (typeof(classes) === "object") ? classes : {};
      selectors = (typeof(selectors) === "object") ? selectors : {};
      this.sidebar = document.querySelector(selector);
      this.classes = {};
      this.isOpen = false;

      if(!this.sidebar) {
         throw new Error("No sidebar found");
         return;
      }

      // Here, default classes can be overridden
      this.classes = Object.assign({}, defaultClasses, classes);
      this.selectors = Object.assign({}, defaultSelectors, selectors);

      // The sidebar and buttons need a parent class
      // to prevent sidebar from closing but also prevent
      // toggles from responing twice (i.e: immediate open/close)
      if(this.classes.component == "") {
         this.classes.component = "skk-sidebar-" + uid();         
      }

      this.sidebar.classList.add(this.classes.component);
      this.isOpen = this.sidebar.classList.contains(this.classes.open);

      // make sure our classes are available
      document.body.classList.add(
         this.classes.animate,
         this.classes.offcanvas
      );

      return this.init();
   }

   // ----- functions

   // start by creating the relevent event listeners
   // and other options
   function init() {
      var activeItem = this.sidebar.querySelector("." + this.classes.active),
          activeMenu = (
             activeItem &&
             activeItem.parentElement.closest(
                "." + this.classes.elements + " " + this.selectors.parent
             )
          );
      
      // bind $this to events
      this.events.open = this.open.bind(this);
      this.events.close = this.close.bind(this);
      this.events.toggle = this.toggle.bind(this);
      this.events.menuToggle = this.menuToggle.bind(this);

      // Add event listeners
      this.sidebar.addEventListener("click", this.events.menuToggle, false);
      document.addEventListener("mousedown", this.events.close, false);
      document.addEventListener("touchstart", this.events.close, false);
      
      // Auto open any active submenus
      //activeMenu && this.menuOpen(activeMenu, true);
      //this.menuOpen(activeMenu, true)
      
      return this;
   }

   // START: sidebar events
   function close(event) {
      if(
         typeof(event) == "undefined" ||
         !event.target.closest("." + this.classes.component)
      ) {
         this.sidebar.classList.remove(this.classes.open);
         this.isOpen = false;
         document.querySelector('#left-sidebar-toggle').classList.remove("is-active")
      }
   }

   function open() {
      this.sidebar.classList.add(this.classes.open);
      this.isOpen = true;
      document.querySelector('#left-sidebar-toggle').classList.add("is-active")
   }

   function toggle(event) {
      this.isOpen = this.sidebar.classList.toggle(this.classes.open);
      // document.querySelector('#left-sidebar-toggle').toggle("is-active");
      $('#left-sidebar-toggle').toggleClass("is-active");
      
      // Prevent toggle from scrolling page to top
      event.stopPropagation();
      event.preventDefault();
   }
   // END: sidebar events


   // START: sidebar menu events
   function menuToggle(event) {
      var $el = event.target.closest(
             "." + this.classes.elements + " " + this.selectors.item
          ),
          $li = $el && $el.parentElement || null,
          $subMenu = (
             $li &&
             $li.querySelector(
                ":scope > " + this.selectors.submenu
             ) || null
          );

      if(!$li) { return; }

      // Prevent submenu toggle from navigating or scrolling page to top
      if($subMenu) {
         event.stopPropagation();
         event.preventDefault();
      }

      !$li.classList.contains(this.classes.open) ? 
         this.menuOpen($li, $subMenu) : this.menuClose($li);
   }

   // Open selected item and close all other opened items
   function menuOpen($li, $subMenu) {
      var parent = $li.parentElement,
          itemsOpen = (
             parent &&
             parent.querySelectorAll(
                this.selectors.parent + "." + this.classes.open
             ) || []
          );

      itemsOpen.forEach(this.menuClose, this);
      $subMenu && $li.classList.add(this.classes.open);      
   }

   function menuClose($li) {
      $li.classList.remove(this.classes.open);
   }
   // END: sidebar menu events

   // A way of capturing events for interacting with the sidebar
   function createToggle(selector) {
      var element = document.querySelector(selector);

      if(element) {
         // prevent propagation issues with our $document events
         element.classList.add(this.classes.component);
         element.addEventListener("click", this.events.toggle, false);
         this.userToggles.push(element);
      }

      return {
         element: element,
         sidebar: this
      };
   }

   // Clear all events and references associated with
   // our sidebar component. Any created objects will need to be
   // cleared seperately.
   function destroy() {
      var $this = this,
          userToggles = this.userToggles;


      this.sidebar.removeEventListener("click", this.events.menuToggle, false);
      document.removeEventListener("mousedown", this.events.close, false);
      document.removeEventListener("touchstart", this.events.close, false);

      this.userToggles.forEach(function(element) {
         if(element) {
            element.removeEventListener("click", $this.events.toggle, false);
         }
      });

      this.sidebar = null;
      this.userToggles = [];
      this.events = {};

      return;
   }

   // prototypes
   _Sidebar.prototype.userToggles = [];
   _Sidebar.prototype.events = {};

   _Sidebar.prototype.init = init;
   _Sidebar.prototype.open = open;
   _Sidebar.prototype.close = close;
   _Sidebar.prototype.toggle = toggle;
   _Sidebar.prototype.menuOpen = menuOpen;
   _Sidebar.prototype.menuClose = menuClose;
   _Sidebar.prototype.menuToggle = menuToggle;
   _Sidebar.prototype.createToggle = createToggle;

   _Sidebar.prototype.destroy = destroy;

   return _Sidebar;

})));


// CURSOR
var cursor = {
   delay: 5,
   _x: 0,
   _y: 0,
   endX: (window.innerWidth / 2),
   endY: (window.innerHeight / 2),
   cursorVisible: true,
   cursorEnlarged: false,
   $dot: document.querySelector('.cursor-dot'),
   $outline: document.querySelector('.cursor-dot-outline'),

   init: function() {
       // Set up element sizes
       this.dotSize = this.$dot.offsetWidth;
       this.outlineSize = this.$outline.offsetWidth;
       
       this.setupEventListeners();
       this.animateDotOutline();
   },
   
       updateCursor: function(e) {
           var self = this;
       
           console.log(e)
       
           // Show the cursor
           self.cursorVisible = true;
           self.toggleCursorVisibility();

           // Position the dot
           self.endX = e.pageX;
           self.endY = e.pageY;
           self.$dot.style.top = self.endY + 'px';
           self.$dot.style.left = self.endX + 'px';
       },
   
   setupEventListeners: function() {
       var self = this;
       
       // Anchor hovering
       document.querySelectorAll('a,i,button,.cursor,input').forEach(function(el) {
           el.addEventListener('mouseover', function() {
               self.cursorEnlarged = true;
               self.toggleCursorSize();
           });
           el.addEventListener('mouseout', function() {
               self.cursorEnlarged = false;
               self.toggleCursorSize();
           });
       });
       
       // Click events
       document.addEventListener('mousedown', function() {
           self.cursorEnlarged = true;
           self.toggleCursorSize();
       });
       document.addEventListener('mouseup', function() {
           self.cursorEnlarged = false;
           self.toggleCursorSize();
       });
   
   
       document.addEventListener('mousemove', function(e) {
           // Show the cursor
           self.cursorVisible = true;
           self.toggleCursorVisibility();

           // Position the dot
           self.endX = e.pageX;
           self.endY = e.pageY;
           self.$dot.style.top = self.endY + 'px';
           self.$dot.style.left = self.endX + 'px';
       });
       
       // Hide/show cursor
       document.addEventListener('mouseenter', function(e) {
           self.cursorVisible = true;
           self.toggleCursorVisibility();
           self.$dot.style.opacity = 1;
           self.$outline.style.opacity = 1;
       });
       
       document.addEventListener('mouseleave', function(e) {
           self.cursorVisible = true;
           self.toggleCursorVisibility();
           self.$dot.style.opacity = 0;
           self.$outline.style.opacity = 0;
       });
   },

   animateDotOutline: function() {
       var self = this;
       
       self._x += (self.endX - self._x) / self.delay;
       self._y += (self.endY - self._y) / self.delay;
       self.$outline.style.top = self._y + 'px';
       self.$outline.style.left = self._x + 'px';
       
       requestAnimationFrame(this.animateDotOutline.bind(self));
   },
   
   toggleCursorSize: function() {
       var self = this;
       
       if (self.cursorEnlarged) {
           self.$dot.style.transform = 'translate(-50%, -50%) scale(0.75)';
           self.$outline.style.transform = 'translate(-50%, -50%) scale(1.5)';
       } else {
           self.$dot.style.transform = 'translate(-50%, -50%) scale(1)';
           self.$outline.style.transform = 'translate(-50%, -50%) scale(1)';
       }
   },
   
   toggleCursorVisibility: function() {
       var self = this;
       
       if (self.cursorVisible) {
           self.$dot.style.opacity = 1;
           self.$outline.style.opacity = 1;
       } else {
           self.$dot.style.opacity = 0;
           self.$outline.style.opacity = 0;
       }
   }
}
cursor.init();
// CURSOR

// PAGE TIMELOAD
  //calculate the time before calling the function in window.onload
  var beforeload = (new Date()).getTime();

  function getPageLoadTime() {
    //calculate the current time in afterload
    var afterload = (new Date()).getTime();
    // now use the beforeload and afterload to calculate the seconds
    seconds = (afterload - beforeload) / 1000;

    a=document.getElementsByTagName('HTML')[0].outerHTML;b=a.length/1024;c=Math.round(b);
    // Place the seconds in the innerHTML to show the results
    $("#load_time").text(' ' + seconds + 's (' + c + 'kb)');
  }
  window.onload = getPageLoadTime;

// ----- Testing our code #1
// $(".mobile-toggle-nav").click(function() {
//    $(".mobile-toggle-nav").toggleClass("is-active")
// });

var mySidebar = new Sidebar("#left-sidebar");
    mySidebar.createToggle("#left-sidebar-toggle");

// mySidebar.open();

//console.log(mySidebar);

$(document).ready(function() {
   $('.selectize').selectize({
       sortField: '',
   });
});