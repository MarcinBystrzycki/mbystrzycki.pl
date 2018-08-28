$(function() {
	const menuButton = $('#menuButton'),
		navList = $('#navList'),
		body = $('body');

	const browserType = navigator.userAgent.toLowerCase().indexOf('firefox') > -1 ? true : false;
	let documentWidth = document.documentElement.clientWidth,
		documentHeight = document.documentElement.clientHeight,
		windowWidth = $(window).width(),
		executeAnimation = false,
		mouseClick = 2,
		storedNumber = 0,
		resizeId;

	const myCanvas = document.getElementById("canvasAnimation"),
		parentCanvas = $(myCanvas).parent(),
		ctx = myCanvas.getContext('2d'),
		numParticles = window.innerWidth < 700 ? 100 : 200;
	let particles = [];

	const marginArr = [0, (documentWidth * -1), ((documentWidth * -1) * 2)]; 

	const welcomeText = "Hello world! Welcome to my first portfolio page. I'm Marcin and my actual goal is to become a real webdeveloper. Feel free to check my works and do not hesitate to contact me if you find them somehow interesting.";

	(function transtionMenuButton() {
		menuButton.mouseenter(() => {
			menuButton.children().removeClass('unhovered');
		});

		menuButton.mouseleave(() => {
			if (mouseClick % 2 === 0) {
				menuButton.children().addClass('unhovered');
			}
		});
	})();

	(function clickMenuButton() {
		menuButton.click(() => {
			mouseClick++;
			menuButton.children().toggleClass('open');
			navList.fadeToggle(100, 'linear');
			
		});
	})();

	function typeWriterAnimation(text, i) {
		const paragraph = $('#welcomeText');

		if (i <= text.length) {
			paragraph.html(text.substring(0, i + 1) + '<span></span>');
		}

		if (i <= text.length) {
			setTimeout(function() {
				typeWriterAnimation(text, i + 1);
			}, 50);
		}
		
	} 

	(function worksButtonsController() {
		const buttons = $('.WorkInfoIcon');
		const descriptions = $('.WorkDesc');

		buttons.each(function(i) {
			buttons.eq(i).click(function(event) {
				descriptions.eq(i).toggleClass('left');
				event.stopPropagation();
			})
		})

		$(window).click(function() {
			for (let i = 0; i < buttons.length; i++) {
				if (descriptions.eq(i).hasClass('left')) {
					descriptions.eq(i).removeClass('left');
				}
			}
		})
	})();

	(function menuAnchors() {
			navList.on('click', 'a', function(event) {
				event.preventDefault();

				if(!executeAnimation) {
					worksAnimationController();
					executeAnimation = !executeAnimation;
				}

				if (documentWidth < 700) {
					const section = $(this).data('section');
					menuButton.click().mouseleave();

					$('html, body').animate({
						scrollTop: $(section).offset().top
					}, 250);
				} else {
					storedNumber = $(this).data('anchor');

					menuButton.click().mouseleave();

					body.animate({
						marginLeft: marginArr[storedNumber]
					}, 250)
				}
			})
	})();

	function worksAnimationController() {
		setTimeout(function() {
			$('.Work').each(function(index) {
				$(this).addClass('show');
			})
		}, 100)
	};


	function scrollPage(browserType) {

		const animationSpeed = 250;

		function setLeftMargin() {
			body.animate({
				marginLeft: marginArr[storedNumber]
			}, animationSpeed);
		}

		body.on('wheel', function (event) {
			event.preventDefault();

			if (!executeAnimation) {
				worksAnimationController();
				executeAnimation = !executeAnimation;
			}

			if (browserType) {
				if (event.originalEvent.deltaY < 0) {
					if (storedNumber <= 2 && storedNumber !== 0) {
						storedNumber--;
						setLeftMargin();
					}
				} else {	
					if (storedNumber < 2) {
						storedNumber++;
						setLeftMargin();
					}
				}
			} else {
				if (event.originalEvent.wheelDelta < 0) {
					if (storedNumber < 2) {
						storedNumber++;
						setLeftMargin();
					}
				} else {
					if (storedNumber <= 2 && storedNumber !== 0) {
						storedNumber--;
						setLeftMargin();
					}
				}
			}
		});
	}
 	
	class Star {
		constructor() {
			this.opacity = Math.random().toFixed(2);
			this.x = myCanvas.width * Math.random();
			this.y = myCanvas.height * Math.random();
			this.color = `rgba(255, 255, 200, ${this.opacity}`;
			this.falling = Math.random();

			if (this.opacity < 0.5) {
				return this.size = 1;
			} else if (this.opacity >= 0.5 && this.opacity < 0.8) {
				return this.size = 2;
			} else {
				return this.size = 3;
			}

		}
		draw(ctx) { 

			ctx.beginPath();
			ctx.arc(this.x, this.y, this.size, 2 * Math.PI, false);
			ctx.fillStyle = this.color;
			ctx.fill();

		}
		redraw() {
			this.opacity =+ Math.random().toFixed(2);
			this.color = `rgba(255, 255, 200, ${this.opacity}`;

			if (this.falling < 0.02) {
				this.x = this.x + 17;
				this.y = this.y + 17;
				if (this.x > myCanvas.width && this.y > myCanvas.height) {
					this.x = myCanvas.width * Math.random();
					this.y = myCanvas.height * Math.random();
					this.falling = 0;
				}
			}
		}
	};

	function loop() {
		myCanvas.width = myCanvas.width;

		for (let i = 0; i < numParticles; i++) {
			particles[i].redraw();
			particles[i].draw(ctx);
		}
		requestAnimationFrame(loop);
	}


	function controlSectionSize(width, height, callback, callParam) {

		const phoneWidth = 400;
		const mobileWidth = 700;

		$(myCanvas).attr('width', width);
		$(myCanvas).attr('height', height);

		if (width > mobileWidth) {
			$('section').css({
				width: width,
				height: height
			});
		}

		if (width > mobileWidth) {
			if (typeof callback == 'function') {
				callback(callParam);
			}
		}
	};

	$(window).resize(function() {
		const reload = function() {
			this.location.href = this.location.href;
		}

		if ($(window).width() != windowWidth) {
			windowWidth = $(window).width();
			clearTimeout(resizeId);
			resizeId = setTimeout(reload(), 100);
		}
	});

	controlSectionSize(documentWidth, documentHeight, scrollPage, browserType);

	for (let i = 0; i < numParticles; i++) {
		particles.push(new Star());
	}
	loop();

	setTimeout(typeWriterAnimation(welcomeText, 0), 50000);
	
})