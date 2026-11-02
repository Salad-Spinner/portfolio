/********************************************************************

STORY ENGINE v4.2

Scroll cinematic storytelling engine.

FEATURES

TEXT
----
✓ word animation
✓ blur
✓ glow
✓ shimmer
✓ scale


MEDIA
-----
✓ image scenes
✓ looping video scenes
✓ mixed timelines
✓ autoplay video support


SYSTEM
------
✓ sticky scrolling
✓ progress bar
✓ mobile support


********************************************************************/


class StoryEngine {

	constructor(section){

		this.section = section;

		this.text =
			section.querySelector(".reading-text");

		this.media =
			section.querySelector(".reading-media");


		this.scenes = [
			...section.querySelectorAll(
				".scene-image, .scene-video, video"
			)
		];


		this.words = [];

		this.progress = 0;

		this.currentScene = -1;


		this.setup();

	}





	setup(){

		if(!this.text) return;


		this.createWords();

		this.setupVideos();

		this.setupHeight();

	}





	createWords(){

		const content =
			this.text.textContent.trim();


		this.text.innerHTML = content
			.split(/\s+/)
			.map(word =>
				`<span class="word">${word}</span>`
			)
			.join(" ");


		this.words = [
			...this.text.querySelectorAll(".word")
		];

	}





	setupVideos(){

		this.scenes.forEach(scene=>{

			if(scene.tagName === "VIDEO"){

				scene.muted = true;

				scene.setAttribute(
					"muted",
					""
				);

				scene.playsInline = true;

				scene.loop = true;

				scene.preload = "auto";

			}

		});

	}





	setupHeight(){

		const speed =
			Number(
				this.section.dataset.speed
			)
			|| 8;


		this.section.style.height =
			(speed * 100) + "vh";

	}





	update(){

		const rect =
			this.section.getBoundingClientRect();


		const distance =
			this.section.offsetHeight -
			window.innerHeight;


		let progress = 0;


		if(distance > 0){

			progress =
				-rect.top / distance;

		}


		this.progress =
			Math.max(
				0,
				Math.min(
					progress,
					1
				)
			);


		this.animateWords();

		this.animateScenes();

		this.updateProgress();

	}





	animateWords(){

		const total =
			this.words.length;


		if(!total) return;


		this.words.forEach((word,index)=>{


			const start =
				index / total;


			let amount =
				(this.progress - start)
				* total;


			amount =
				Math.max(
					0,
					Math.min(
						amount,
						1
					)
				);



			word.classList.toggle(
				"active",
				amount > 0
			);



			if(
				this.section.dataset.scale === "true"
			){

				word.style.transform =
					`translateY(${(1 - amount) * 8}px)
					 scale(${0.98 + amount * 0.02})`;

			}



			if(
				this.section.dataset.shimmer === "true"
			){

				word.style.backgroundPosition =
					`${100 - amount * 100}% 0`;

			}


		});

	}





	animateScenes(){

		if(!this.scenes.length)
			return;


		const step =
			1 / this.scenes.length;


		let active = 0;


		this.scenes.forEach((scene,index)=>{


			if(
				this.progress >= index * step
			){

				active = index;

			}


		});



		if(active !== this.currentScene){

			this.activateScene(active);

		}

	}





	activateScene(index){

		this.scenes.forEach((scene,i)=>{


			const active =
				i === index;



			if(scene.tagName === "IMG"){

				scene.classList.toggle(
					"active-image",
					active
				);

			}



			if(scene.tagName === "VIDEO"){

				scene.classList.toggle(
					"active-video",
					active
				);


				if(active){

					/*
					Do not reset.
					Browser autoplay handles playback.
					*/

				}

			}


		});


		this.currentScene = index;

	}





	updateProgress(){

		const bar =
			document.querySelector(
				"#story-progress"
			);


		if(!bar)
			return;


		bar.style.width =
			(this.progress * 100) + "%";

	}

}





const stories = [];





function initStoryEngine(){


	document
		.querySelectorAll(
			".reading-section"
		)
		.forEach(section=>{


			stories.push(
				new StoryEngine(section)
			);


		});


	render();

}





if(
	document.readyState === "loading"
){

	document.addEventListener(
		"DOMContentLoaded",
		initStoryEngine
	);

}
else{

	initStoryEngine();

}





let ticking = false;





function render(){


	stories.forEach(story=>{

		story.update();

	});


	ticking = false;

}





window.addEventListener(
	"scroll",
	()=>{


		if(!ticking){

			requestAnimationFrame(
				render
			);

			ticking = true;

		}


	},
	{
		passive:true
	}
);





window.addEventListener(
	"resize",
	()=>{

		render();

	}
);

const myMedia = document.getElementsByClassName('scene-video')[0];
const startButton = document.getElementById('start-button');

if(startButton && myMedia){

    startButton.addEventListener('click', () => {
        myMedia.play()
        .then(() => {
            console.log("Playback started successfully!");
        })
        .catch(error => {
            console.error("Playback failed:", error);
        });
    });

}