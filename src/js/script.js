let theSeed = 10;

function array2d(rows,columns) {
	var x = new Array(rows);
	for (var i = 0; i < rows; i++) {
		x[i] = new Array(columns);
	}
	return x;
 }

function clamp(val, min, max) {
	if (val < min) return min;
	if (val > max) return max;
	return val;
}
  
function rint(min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

let noise = (function(){
	let _noise = { };
	
	function G(x, y, z) {
		this.x = x; this.y = y; this.z = z;
	}
	
	G.prototype.dot2 = function(x, y) {
		return this.x*x + this.y*y;
	};
	
	g3 = [new G(1,1,0),new G(-1,1,0),new G(1,-1,0),new G(-1,-1,0),
				new G(1,0,1),new G(-1,0,1),new G(1,0,-1),new G(-1,0,-1),
				new G(0,1,1),new G(0,-1,1),new G(0,1,-1),new G(0,-1,-1)];
	
	let p = [];
	while (p.length<300) {
		p.push((rint(0, 255) + rint(0, 255)) / 2);
	}
	p = [...new Set(p)];
	// To remove the need for index wrapping, double the permutation table length
	perm = new Array(512);
	gP = new Array(512);
	
	// This isn't a very good seeding function, but it works ok. It supports 2^16
	// different seed values. Write something better if you need more seeds.
	_noise.seed = function(seed) {
		if(seed > 0 && seed < 1) {
		// Scale the seed out
		seed *= 65536;
		}
	
		seed = Math.floor(seed);
		if(seed < 256) {
		seed |= seed << 8;
		}
	
		for( i = 0; i < 256; i++) {
		v=0;
		if (i & 1) {
			v = p[i] ^ (seed & 255);
		} else {
			v = p[i] ^ ((seed>>8) & 255);
		}
	
		perm[i] = perm[i + 256] = v;
		gP[i] = gP[i + 256] = g3[v % 12];
		}
	};
	
	_noise.seed(0);
	
	// ##### Perlin noise stuff
	
	function fade(t) {
		return t*t*t*(t*(t*6-15)+10);
	}
	
	function lerp(a, bs, t) {
		return (1-t)*a + t*bs;
	}
	
	// 2D Perlin Noise
	_noise.perlin2 = function(x, y) {
		// Find unit grid cell containing point
		X = Math.floor(x), Y = Math.floor(y);
		// Get relative xy coordinates of point within that cell
		x = x - X; y = y - Y;
		// Wrap the integer cells at 255 (smaller integer period can be introduced here)
		X = X & 255; Y = Y & 255;
	
		// Calculate noise contributions from each of the four corners
		n00 = gP[X+perm[Y]].dot2(x, y);
		n01 = gP[X+perm[Y+1]].dot2(x, y-1);
		n10 = gP[X+1+perm[Y]].dot2(x-1, y);
		n11 = gP[X+1+perm[Y+1]].dot2(x-1, y-1);
		
		// Compute the fade curve value for x
		u = fade(x);
	
		// Interpolate the four results
		return lerp(
			lerp(n00, n10, u),
			lerp(n01, n11, u),
		fade(y));
	};

	return _noise;
})(this);



class Button {
	constructor(x, y, w, h, img, args) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.img = img;
		this.args = args == undefined ? { } : args;
		this.args.data = { };
		this.isHoveringOver = false;
		this.tooltip = null;
	}

	update(mPos, clicked) {
		if (mPos.x > this.x && mPos.x < this.x + this.w &&
			mPos.y > this.y && mPos.y < this.y + this.h) {

			if (!this.isHoveringOver) {
				if (this.args.hoverCallback) {
					this.args.hoverCallback();
				}

				this.isHoveringOver = true;
			}
			
			if (this.args.clickCallback && clicked) {
				this.args.clickCallback();
			}
		}
		else {
			this.isHoveringOver = false;
		}
	}

	render(c, imgs) {
		if (this.args.showbgRec) {
			c.save();
			c.fillStyle = this.args.bgRecColor;
			c.fillRect(
				this.x - (this.args.bgRecExtraSize),
				this.y - (this.args.bgRecExtraSize),
				this.w + (this.args.bgRecExtraSize * 2),
				this.h + (this.args.bgRecExtraSize * 2)
			);
			c.restore();
		}

		if (this.isHoveringOver && this.args.showhovRec) {
			c.save();
			c.fillStyle = this.args.hovRecColor;
			c.fillRect(
				this.x - (this.args.hovRecExtraSize),
				this.y - (this.args.hovRecExtraSize),
				this.w + (this.args.hovRecExtraSize * 2),
				this.h + (this.args.hovRecExtraSize * 2)
			);
			c.restore();
		}

		c.drawImage(this.img, this.x, this.y, this.w, this.h);

		if (this.tooltip !== null) {
			this.tooltip.render(c, imgs);
		}
	}
}

class TextButton {
	constructor(x, y, w, h, text, args) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.text = text;
		this.args = args;
		this.bgColor = '#fff';
	}

	update(mPos, clicked) {
		if (mPos.x > this.x && mPos.x < this.x + this.w &&
			mPos.y > this.y && mPos.y < this.y + this.h) {

			this.isHoveringOver = true;

			if (this.args.hovBgColor) {
				this.bgColor = this.args.hovBgColor;
			}
			
			if (this.args.clickCallback && clicked) {
				this.args.clickCallback();
			}
		}
		else {
			this.isHoveringOver = false;
			this.bgColor = this.args.bgColor;
		}
	}

	render(c) {
		c.save();
		c.fillStyle = this.bgColor;
		c.fillRect(this.x, this.y, this.w, this.h);
		c.fillStyle = '#fff';
		c.font = this.args.fontSize + 'px monospace';
		c.textAlign = 'center';
		c.fillText(this.text, this.x + (this.w / 2), this.y + (this.args.fontSize * 1.05));
		c.restore();
	}
}

class BuildingSelectionTooltip {
	constructor(x, y, buildingType) {
		this.x = x;
		this.y = y;
		this.w = 256;
		this.h = 128;
		this.buildingType = buildingType;
		this.canDestroy = false;
	}

	render(c, imgs) {
		let printableStats = [];

		if (this.buildingType.cost) {
			printableStats.push({ icon: imgs.i_cost.el, value: this.buildingType.cost });
		}

		if (this.buildingType.opCostWk) {
			printableStats.push({ icon: imgs.i_op_cost.el, value: this.buildingType.opCostWk + '/wk' });
		}

		if (this.buildingType.eDemand) {
			printableStats.push({ icon: imgs.i_power.el, value: '-' + this.buildingType.eDemand });
		}

		if (this.buildingType.eOutput) {
			printableStats.push({ icon: imgs.i_power.el, value: this.buildingType.eOutput });
		}

		if (this.buildingType.o2Output) {
			printableStats.push({ icon: imgs.i_o2.el, value: this.buildingType.o2Output });
		}

		if (this.buildingType.h2oOutput) {
			printableStats.push({ icon: imgs.i_h2o.el, value: this.buildingType.h2oOutput });
		}

		this.h = 64 + (printableStats.length * 48);

		c.save();
		c.fillStyle = '#0000ff';
		c.fillRect(this.x, this.y, this.w, this.h);
		
		c.fillStyle = '#fff';
		c.fillText(this.buildingType.name, this.x + 32, this.y + 32);
		let iconSize = 24;
		for (let i = 0; i < printableStats.length; i++) {
			let stat = printableStats[i];
			c.drawImage(stat.icon, this.x + 22, this.y + 44 + (i * 48), iconSize, iconSize);
			c.fillText(stat.value, this.x + 52, this.y + 64 + (i * 48));
		}

		c.restore();
	}
}

class Explosion {
	constructor(x, y, w, h, img) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.img = img;
		this.destroyDelay = 10;
		this.destroyTick = 0;
		this.canDestroy = false;
	}

	update() {
		if (this.destroyTick < this.destroyDelay) {
			this.destroyTick++;
		}
		else {
			this.canDestroy = true;
		}
	}

	render(c) {
		c.drawImage(this.img, this.x, this.y, this.w, this.h);
	}
}

class Lander {
	constructor(x, y, w, h, img, args) {
		this.x = x;
		this.y = y;
		this.w = w;
		this.h = h;
		this.img = img;
		this.args = args;
		this.state = 0;
		this.vel = { x: 0, y: 0 };
		/*
		0 - approaching
		1 - landing
		2 - landed
		3 - ascending
		4 - leaving
		*/

		this.canDestroy = false;
	}

	update() {

		switch (this.state) {
			case 0: { // approaching
				if (this.args.orientation == 0) { // horizontal
					if (this.x < this.args.target.x) {
						this.vel.x = this.args.speed;
					}
					else if (this.x > this.args.target.x) {
						this.vel.x = -this.args.speed;
					}
					else {
						this.state = 1;
						this.vel.x = 0;
						this.vel.x = 0;
					}
				}
				else { // vertical
					if (this.y < this.args.ascendDecentHeight) {
						this.vel.y = this.args.speed;
					}
					else if (this.y > this.args.ascendDecentHeight) {
						this.vel.y = -this.args.speed;
					}
					else {
						this.state = 1;
						this.vel.x = 0;
						this.vel.y = 0;
					}
				}

				break;
			}

			case 1: { // landing
				if (this.y < this.args.landedY) {
					this.vel.y = 0.5;
				}
				else {
					this.state = 2;
					this.vel.x = 0;
					this.vel.y = 0;
				}
				break;
			}

			// do nothing here for landed

			case 3: { // ascending
				if (this.y > this.args.ascendDecentHeight) {
					this.vel.y = -0.5;
				}
				else {
					this.vel.y = 0;

					if (rint(0, 10) > 5) {
						this.vel.x = rint(0, 10) > 5 ? -this.args.speed : this.args.speed;
					}
					else {
						this.vel.y = rint(0, 10) > 5 ? -this.args.speed : this.args.speed;
					}

					this.state = 4;
				}
				break;
			}

			// do nothing here for leaving
		}

		this.x += this.vel.x;
		this.y += this.vel.y;
	}

	render(c) {
		c.drawImage(this.img, this.x, this.y, this.w, this.h);
	}
}



window.addEventListener('DOMContentLoaded', () => {

	
	let imgs = [
		'btn_ore_insights',
		'btn_buildings',
		'btn_buildings_left',
		'btn_buildings_right',
		'i_power',
		'i_ore',
		'i_o2',
		'i_h2o',
		'i_cost',
		'i_op_cost',
		't_rocket',
		't_dynamite',
		't_headquarters',
		't_tube',
		't_solar',
		't_oxygen_gen',
		't_water_tower',
		't_habitat',
		't_ore_sensor',
		't_mine',
		't_satdish',
		't_landing_pad',
		't_moon',
		'o_explosion',
		'o_lander',
		'o_flare',
		'o_title_lander'
	];

	for (let i = 0; i < imgs.length; i++) {
		let name = imgs[i];
		let el = new Image();
		el.src = 'images/' + name + '.png';
		imgs[name] = {
			key: name,
			el: el
		};
	}


    let canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 640;
	let ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;
    document.body.appendChild(canvas);
	let screen = 0;
	let lastMouseDown = false;
	let isMouseDown = false;
	let mousePos = {
		x: 0,
		y: 0
	};

	
	let btnPlay = null;
	let titleLanderY = -64;
	let titleLanderDir = 0; // 0 up, 1 down


    let tw = 16;
	let th = 16;

	let tileSelector = {
		x: 0,
		y: 0
	};

	let tileSelectorMap = {
		x: 0,
		y: 0
	};

	let stars = [];
	
	function initBackground() {
		for (let i = 0; i < 100; i++) {
			stars.push({ x: rint(0, canvas.width), y: rint(0, canvas.height), size: rint(1, 2) });
		}
	}

	function renderBackground() {
		ctx.save();
		ctx.fillStyle = '#fff';
		for (let i = 0; i < stars.length; i++) {
			let star = stars[i];
			ctx.fillRect(star.x, star.y, star.size, star.size);
		}
		ctx.restore();
	}


	let elapsedTicks = 0;
	let tileIdCounter = 0;

	let tiles = array2d(Math.floor(canvas.width / tw), Math.floor(canvas.height / th));
	let landCoords = [];

	let ore = array2d(Math.floor(canvas.width / tw), Math.floor(canvas.height / th));

	let explosions = [];
	let landers = [];
	let landerSpawnDelayInitial = 1000;
	let landerSpawnDelay = landerSpawnDelayInitial;
	let landerSpawnTick = 0;

	let landingPads = [];
	let oreSensors = [];
	let satelliteDishes = [];

	let seedStructure = rint(0, 2000);
	let seedOre = rint(0, 2000);

	let mapWidth = tiles.length;
	let mapHeight = tiles[0].length;
	let mapCenterX = Math.floor(mapWidth / 2);
	let mapCenterY = Math.floor(mapHeight / 2);

	let funds = 1500;
	let population = rint(2, 3);
	let powerDemand = 0;
	let powerDelivered = 0;
	let powerAvailable = 0;
	let oreStored = 0;
	let o2Demand = 0;
	let o2Delivered = 0;
	let o2Available = 0;
	let h2oDemand = 0;
	let h2oDelivered = 0;
	let h2oAvailable = 0;
	let day = 1;
	let dayTick = 0;
	let dayDelay = 10;
	let daysInWeek = 7;
	let week = 1;

	let hasPlacedHeadquarters = false;
	let naturalDisaster = 0;
	/*
	Natural disasters:
	0 - none
	1 - solar flare
	*/
	let solarFlareAlpha = 0;

	let showOreInsights = false;
	let showBuildingSelection = false;

	let buildingTypes = {
		moon: {
			key: 't_moon',
			isSelectable: false,
			cost: 0
		},
		rocket: {
			key: 't_rocket',
			isSelectable: false,
			cost: 0,
			colonistCapacity: 4,
			eOutput: 5,
			o2Output: 20,
			h2oOutput: 10
		},
		dynamite: {
			name: 'Dynamite',
			key: 't_dynamite',
			cost: 50,
			freePlace: true,
			canOverrideTile: true
		},
		headquarters: {
			name: 'Headquarters',
			key: 't_headquarters',
			cost: 1000,
			opCostWk: 10,
			colonistCapacity: 10,
			eDemand: 50,
			eOutput: 50,
			h2oOutput: 50,
			o2Output: 30
		},
		tube: {
			name: 'Transport Tube',
			key: 't_tube',
			cost: 10,
			opCostWk: 2,
			eDemand: 2,
			freePlace: true
		},
		solar: {
			name: 'Solar Panel',
			key: 't_solar',
			cost: 50,
			opCostWk: 5,
			eOutput: 100 // energy output
		},
		oxygen_gen: {
			name: 'Oxygen Generator',
			key: 't_oxygen_gen',
			cost: 550,
			opCostWk: 100,
			o2Output: 500
		},
		water_tower: {
			name: 'Water Tower',
			key: 't_water_tower',
			cost: 550,
			opCostWk: 75,
			h2oOutput: 500
		},
		habitat: {
			name: 'Habitat',
			key: 't_habitat',
			cost: 350,
			opCostWk: 30,
			colonistCapacity: 50,
			eDemand: 50,
			h2oOutput: 100,
			o2Output: 100,
			timeTriggerWeekly: (tile) => {
				funds += 50;
			}
		},
		ore_sensor: {
			name: 'Ore Sensor',
			key: 't_ore_sensor',
			cost: 350,
			opCostWk: 15,
			eDemand: 10,
			freePlace: true
		},
		mine: {
			name: 'Mine',
			key: 't_mine',
			cost: 1000,
			opCostWk: 150,
			eDemand: 50,
			timeTriggerWeekly: (tile) => {
				let adjacentOre = [];
				let radius = 3;
				for (let x = tile.x - radius; x < tile.x + (radius + 1); x++) {
					for (let y = tile.y - radius; y < tile.y + (radius + 1); y++) {
						let squareDistance = Math.pow(x - tile.x, 2) + Math.pow(y - tile.y, 2);

						if (squareDistance <= Math.pow(radius, 2)) {
							if (ore[x][y]) {
								adjacentOre.push(ore[x][y]);
							}
						}
					}
				}

				adjacentOre.forEach((deposit) => {
					if (deposit.value > 0) {
						oreStored += rint(1, 2);
						if (deposit.value - 0.001 > 0) {
							deposit.value -= 0.001;
						}
						else {
							deposit.value = 0;
						}
						funds += rint(1, 2);
					}
				});
			}
		},
		satdish: {
			name: 'Satellite Dish',
			key: 't_satdish',
			cost: 350,
			eDemand: 20
		},
		landing_pad: {
			name: 'Landing Pad',
			key: 't_landing_pad',
			cost: 500,
			eDemand: 20
		}
	};

	// Side buttons
	let btnOreInsights = null;
	let btnCategoryBuildings = null;


	let btnBuildings = [];
	let btnBuildingSelectionLeft = null;
	let btnBuildingSelectionRight = null;
	let buildingSelectionScrollOffset = 0;
	let buildingSelectedKey = '';
	let buildSelectionFirstClick = false;

	function generateWorld() {

		let radius = rint(10, 20);
		for (let i = mapCenterX - radius; i < mapCenterX + radius; i++) {
			for (let j = mapCenterY - radius; j < mapCenterY + radius; j++) {
				let squareDistance = Math.pow(i - mapCenterX, 2) + Math.pow(j - mapCenterY, 2);

				noise.seed(seedStructure);
				let pVal = noise.perlin2(i / rint(24, 26), j / rint(24, 25));

				noise.seed(seedOre);
				let oVal = noise.perlin2(i / 10, j / 10);
				oVal = clamp(oVal, 0.01, 1);

				if (squareDistance <= Math.pow(radius, 2) + (pVal * 100)) {
					if (pVal > 0.001) {
						tiles[i][j] = {
							id: tileIdCounter,
							x: i,
							y: j,
							type: buildingTypes.moon
						};
						tileIdCounter++;

						ore[i][j] = {
							id: tileIdCounter,
							x: i,
							y: j,
							value: oVal
						};

						if (pVal > 0.05) {
							landCoords.push({ x: i, y: j });
						}
					}
				}
			}
		}

		// Place spaceship
		let spaceshipTilePos = landCoords[rint(0, landCoords.length - 1)];
		tiles[spaceshipTilePos.x][spaceshipTilePos.y].type = buildingTypes.rocket;
	}

	function array2dIterator(array, callback) {
		for (let i = 0; i < array.length; i++) {
			for (let j = 0; j < array[0].length; j++) {
				let obj = array[i][j];

				if (obj) {
					callback(i, j, obj);
				}
			}
		}
	}

	function renderTiles() {
		array2dIterator(tiles, (i, j, tile) => {
			ctx.drawImage(imgs[tile.type.key].el, i * tw, j * th, tw, th);
		});
	}

	initBackground();

	function refreshBuildingSelectionButtons(scrollOffset) {
		let buildingIconSize = 48;
		let buildingTypeKeys = Object.keys(buildingTypes);
		for (let i = 0; i < buildingTypeKeys.length; i++) {
			let buildingType = buildingTypes[buildingTypeKeys[i]];

			let isSelectable = buildingType.isSelectable == undefined ? true : buildingType.isSelectable;

			if (!isSelectable) {
				buildingTypeKeys.splice(i, 1);
			}
		}


		let btnBuildingIndex = 0;
		buildingTypeKeys.forEach((key, index) => {

			let endingIndex = scrollOffset + 10;
			if (index - 1 >= scrollOffset && index <= endingIndex) {
				let buildingType = buildingTypes[key];

				let isSelectable = buildingType.isSelectable == undefined ? true : buildingType.isSelectable;

				if (isSelectable) {
					btnBuilding = new Button((96 + 84) + (btnBuildingIndex * 72), canvas.height - 72, buildingIconSize, buildingIconSize, imgs[buildingType.key].el, {
						clickCallback: () => {
							buildingSelectedKey = key;
							showBuildingSelection = false;
						},
						hoverCallback: () => {
							btnBuilding.tooltip = new BuildingSelectionTooltip(8192, 8192, buildingType);
						},
						showhovRec: true,
						hovRecColor: '#7575ff',
						hovRecExtraSize: 8,
						showbgRec: true,
						bgRecColor: '#d1190d',
						bgRecExtraSize: 8,
						buildingType: buildingType
					});
					btnBuildings.push(btnBuilding);

					btnBuildingIndex++;
				}
			}
		});
	}

	function changeScreen(num) {
		screen = num;

		switch (screen) {
			case 0: {
				btnPlay = new TextButton((canvas.width / 2) - 128, 380, 256, 64, 'PLAY', {
					bgColor: '#4d3d87',
					hovBgColor: '#7c6fab',
					fontSize: 48,
					clickCallback: () => {
						changeScreen(1);
					}
				});
				break;
			}

			case 1: {
				generateWorld();

				btnOreInsights = new Button(0, canvas.height - (96 * 2), 96, 96, imgs.btn_ore_insights.el, {
					clickCallback: () => {
						showOreInsights = !showOreInsights;
					}
				});

				btnCategoryBuildings = new Button(0, canvas.height - 96, 96, 96, imgs.btn_buildings.el, {
					clickCallback: () => {
						buildSelectionFirstClick = true;
						showBuildingSelection = !showBuildingSelection;
					}
				});

				btnBuildingSelectionLeft = new Button(96 + 10, canvas.height - 96, 50, 96, imgs.btn_buildings_left.el, {
					clickCallback: () => {
						if (buildingSelectionScrollOffset > 0) {
							buildingSelectionScrollOffset--;
							btnBuildings.length = 0;
							refreshBuildingSelectionButtons(buildingSelectionScrollOffset);
						}
					}
				});

				btnBuildingSelectionRight = new Button(canvas.width - 50 - 10, canvas.height - 96, 50, 96, imgs.btn_buildings_right.el, {
					clickCallback: () => {
						if (buildingSelectionScrollOffset < Object.keys(buildingTypes).length - 10 - 2) {
							buildingSelectionScrollOffset++;
							btnBuildings.length = 0;
							refreshBuildingSelectionButtons(buildingSelectionScrollOffset);
						}
					}
				});


				refreshBuildingSelectionButtons(0);

				break;
			}
		}
	}

	changeScreen(0);


    setInterval(e=>{
		ctx.clearRect(0, 0, canvas.width, canvas.height);

		if (!lastMouseDown && isMouseDown) {
			hasClicked = true;
		}
		else {
			hasClicked = false;
		}

		switch (screen) {
			case 0: {
				// background
				ctx.save();
				ctx.fillStyle = '#060214';
				ctx.fillRect(0, 0, canvas.width, canvas.height);
				ctx.restore();

				renderBackground();

				for (let i = -10; i < (canvas.width / 64) + 10; i++) {
					for (let row = 0; row < 10; row++) {
						ctx.drawImage(imgs.t_moon.el, (i * 64), (canvas.height - 320) + ((row * (row * 0.05)) * 64), 64, 64);
					}
				}

				if (titleLanderDir == 0) {
					if (titleLanderY > 180) {
						titleLanderY -= 2;
					}
					else {
						titleLanderDir = 1;
					}
				}
				else {
					if (titleLanderY < 220) {
						titleLanderY += 2;
					}
					else {
						titleLanderDir = 0;
					}
				}
				ctx.drawImage(imgs.o_title_lander.el, (canvas.width / 2) - 32, titleLanderY, 64, 64);

				btnPlay.update(mousePos, hasClicked);
				btnPlay.render(ctx);

				ctx.save();
				ctx.fillStyle = '#fff';
				ctx.textAlign = 'center';
				ctx.font = 'bold 64px monospace';
				ctx.fillText('COSMOCOLONIES', canvas.width / 2, 96);
				ctx.font = '24px monospace';
				ctx.fillText('© 2020 JARED YORK', canvas.width / 2, 138);
				ctx.restore();


				break;
			}

			case 1: {
				powerDemand = 0;
				powerDelivered = 0;
				powerAvailable = 0;
				o2Delivered = 0;
				h2oDelivered = 0;
				landingPads.length = 0;
				oreSensors.length = 0;
				satelliteDishes.length = 0;
				array2dIterator(tiles, (i, j, tile) => {
					if (tile.type.key == 't_landing_pad') {
						landingPads.push(tile);
					}
					else if (tile.type.key == 't_ore_sensor') {
						oreSensors.push(tile);
					}
					else if (tile.type.key == 't_satdish') {
						satelliteDishes.push(tile);
					}
					else if (tile.type.key == 't_dynamite') {
						tiles[i][j].type = buildingTypes.moon;
						explosions.push(new Explosion(i * tw, j * th, tw, th, imgs.o_explosion.el));
					}
		
					if (tile.type.eOutput) {
						powerDelivered += tile.type.eOutput;
					}
		
					if (tile.type.eDemand) {
						powerDemand += tile.type.eDemand;
					}
		
					if (tile.type.o2Output) {
						o2Delivered += tile.type.o2Output;
					}
		
					if (tile.type.h2oOutput) {
						h2oDelivered += tile.type.h2oOutput;
					}
				});
				// Calculate energy requirements
				powerAvailable = powerDelivered - powerDemand;
		
				h2oOutput = 0;
				h2oDemand = population * 2;
		
				o2Demand = 0;
				o2Demand = population * 5;
		
				o2Available = o2Delivered - o2Demand;
				h2oAvailable = h2oDelivered - h2oDemand;
		
		
				if (landingPads.length > 0) {
					landers.forEach((lander) => {
						if (lander.state == 2) { // if the lander is landed
							if (lander.args.landedDuration < lander.args.landedMaxDuration) {
								lander.args.landedDuration++;
							}
							else {
								switch (lander.args.visitType) {
									case 1: {
										let amountPerOre = rint(1, 3);
										let amountOreToSell = rint(100, 500);
		
										if (oreStored - amountOreToSell > 0) {
											funds += amountOreToSell * amountPerOre;
											oreStored -= amountOreToSell;
										}
		
										break;
									}
		
									case 2: {
										population += rint(3, 5);
										break;
									}
		
									case 3: {
										let amountPopulationToRemove = rint(3, 5);
										if (population - amountPopulationToRemove > 5) {
											population -= amountPopulationToRemove;
										}
										break;
									}
								}
								lander.state = 3;
								lander.targetPadId = null;
							}
						}
					});

					if (satelliteDishes.length > 0) {
						landerSpawnDelay = landerSpawnDelayInitial * 0.15;
					}
					else {
						landerSpawnDelay = landerSpawnDelayInitial;
					}
		
					if (landerSpawnTick < landerSpawnDelay) {
						landerSpawnTick++;
					}
					else {
						let pickedPad = landingPads[rint(0, landingPads.length - 1)];
		
						let isPadAvailable = true;
						landers.forEach((lander) => {
							if (lander.args.targetPadId == pickedPad.id) {
								isPadAvailable = false;
							}
						});
						
						if (isPadAvailable) {
							let landerX = 0;
							let landerY = 0;
							let landedY = 0;
		
							let orientation = rint(0, 10) >= 5 ? 1 : 1;
							if (orientation == 0) { // horizontal
								landerX = rint(0, 10) >= 5 ? -tw : canvas.width + tw;
								landerY = (pickedPad.y * th);
								landedY = landerY;
								landerY -= th / 2;
							}
							else { // vertical
								landerX = pickedPad.x * tw;
								landerY = rint(0, 10) >= 5 ? -th : canvas.height + th;
								landedY = pickedPad.y * tw;
							}
		
							let visitType = rint(0, 3);
							/*
							visitTypes:
							0 - nothing, just passing by
							1 - buy ore
							2 - add population (like a flight to this colony)
							3 - remove population (like a flight to somewhere else)
							*/
		
							landers.push(new Lander(landerX, landerY, tw, th, imgs['o_lander'].el, {
								targetPadId: pickedPad.id,
								target: {
									x: pickedPad.x * tw,
									y: pickedPad.y * th
								},
								visitType: visitType,
								ascendDecentHeight: (pickedPad.y * th) - (th / 2), 
								landedY: landedY,
								orientation: orientation,
								speed: 1,
								landedMaxDuration: rint(10, 300),
								landedDuration: 0
							}));
						}
		
						landerSpawnTick = 0;
					}
				}
		
				for (let i = 0; i < landers.length; i++) {
					let lander = landers[i];
					lander.update();
		
					if (lander.x < -lander.w || lander.x > canvas.width + lander.w ||
						lander.y < -lander.h || lander.y > canvas.height + lander.h) {
						lander.canDestroy = true;
					}
		
					if (lander.canDestroy) {
						landers.splice(i, 1);
					}
				}
		
		
				if (dayTick < dayDelay) {
					dayTick++;
				}
				else {
					day++;
		
					if (day % daysInWeek == 0) {
						array2dIterator(tiles, (i, j, tile) => {
							if (tile.type.opCostWk) {
								funds -= tile.type.opCostWk;
							}
		
							if (tile.type.timeTriggerWeekly) {
								tile.type.timeTriggerWeekly(tile);
							}
						});
		
						week++;
					}
		
					array2dIterator(tiles, (i, j, tile) => {
						if (tile.timeTriggerDaily) {
							tile.timeTriggerDaily(tile);
						}
					});
		
					// Simulate population
					if (powerAvailable > 0 && o2Available > 0 && h2oAvailable > 0) {
						let maxColonistCapacity = 0;
						array2dIterator(tiles, (i, j, tile) => {
							if (tile.type.colonistCapacity) {
								maxColonistCapacity += tile.type.colonistCapacity;
							}
						});
						let amountPopulationToAdd = rint(0, Math.ceil(population * 0.05));
						if (population + amountPopulationToAdd < maxColonistCapacity) {
							if (rint(0, 100) > 95) {
								population += amountPopulationToAdd;
							}
						}
					}
					else {
						let amountPopulationToRemove = rint(0, Math.ceil(population * 0.1));
						if (population > 0) {
							population -= amountPopulationToRemove;
						}
					}
		
					dayTick = 0;
				}
		
				
		
		
				tileSelector.x = Math.floor(mousePos.x / tw) * tw;
				tileSelector.y = Math.floor(mousePos.y / th) * th;
				tileSelectorMap.x = clamp(tileSelector.x / tw, 0, mapWidth - 1);
				tileSelectorMap.y = clamp(tileSelector.y / th, 0, mapHeight - 1);
				
				if (btnOreInsights) {
					btnOreInsights.update(mousePos, hasClicked);
				}
		
				if (btnCategoryBuildings) {
					btnCategoryBuildings.update(mousePos, hasClicked);
				}
		
				if (showBuildingSelection) {
					btnBuildingSelectionLeft.update(mousePos, hasClicked);
					btnBuildingSelectionRight.update(mousePos, hasClicked);
		
					btnBuildings.forEach(function(btnBuilding) {
						btnBuilding.update(mousePos, hasClicked);
					});
				}
		
		
				
				renderBackground();
		
				renderTiles();

				for (let i = 0; i < explosions.length; i++) {
					explosions[i].update();
					explosions[i].render(ctx);

					if (explosions[i].canDestroy) {
						explosions.splice(i, 1);
					}
				}

				switch (naturalDisaster) {
					case 0: {
						if (solarFlareAlpha > 0) {
							solarFlareAlpha -= 0.1;
						}
						break;
					}
					
					case 1: {
						if (solarFlareAlpha < 0.5) {
							solarFlareAlpha += 0.1;
						}	

						ctx.save();
						ctx.globalAlpha = solarFlareAlpha;
						ctx.drawImage(imgs.o_flare.el, 0, (-canvas.height / 2) + Math.sin(elapsedTicks * 0.04) * 300, canvas.width, canvas.height * 2);
						ctx.restore();

						array2dIterator(tiles, (i, j, tile) => {
							if (tile.type.eOutput) {
								if (elapsedTicks % rint(50, 100) == 0) {
									explosions.push(new Explosion(i * tw, j * th, tw, th, imgs.o_explosion.el));
									tile.type = buildingTypes.moon;
								}
							}
						});

						break;
					}
				}
		
				if (showOreInsights) {
					let sensorInsightTileLocations = [];
					for (let i = 0; i < oreSensors.length; i++) {
						let oreSensor = oreSensors[i];

						let oreSensorRadius = 2;
						for (let x = oreSensor.x - oreSensorRadius; x < oreSensor.x + (oreSensorRadius + 1); x++) {
							for (let y = oreSensor.y - oreSensorRadius; y < oreSensor.y + (oreSensorRadius + 1); y++) {
								let squareDistance = Math.pow(x - oreSensor.x, 2) + Math.pow(y - oreSensor.y, 2);
		
								if (squareDistance <= Math.pow(oreSensorRadius, 2)) {
									if (ore[x][y]) {
										sensorInsightTileLocations.push({ x: oreSensor.x, y: oreSensor.y });
										let deposit = ore[x][y];
										let grayscale = (1 / deposit.value) * 10;
										ctx.save();
										ctx.fillStyle = 'rgba(' + (90+grayscale) + ',' + (40 + grayscale) + ',' + grayscale + ',255)';
										ctx.globalAlpha = 0.75;
										ctx.fillRect(x * tw, y * th, tw, th);
										ctx.restore();
									}
								}
							}
						}
					}
				}
		
		
				if (buildingSelectedKey.length > 0) {
					ctx.save();
		
					let tileUnderSelector = tiles[tileSelectorMap.x][tileSelectorMap.y];
		
					let canPlace = false;
					if (tileUnderSelector) {
						let isAdjacentToStructure = false;

						if (buildingTypes[buildingSelectedKey].freePlace) {
							isAdjacentToStructure = true;
						}
						else {
							let adjacentTiles = [];
							if (tiles[tileUnderSelector.x][tileUnderSelector.y - 1]) {
								adjacentTiles.push(tiles[tileUnderSelector.x][tileUnderSelector.y - 1]);
							}

							if (tiles[tileUnderSelector.x + 1][tileUnderSelector.y]) {
								adjacentTiles.push(tiles[tileUnderSelector.x + 1][tileUnderSelector.y]);
							}

							if (tiles[tileUnderSelector.x][tileUnderSelector.y + 1]) {
								adjacentTiles.push(tiles[tileUnderSelector.x][tileUnderSelector.y + 1]);
							}

							if (tiles[tileUnderSelector.x - 1][tileUnderSelector.y]) {
								adjacentTiles.push(tiles[tileUnderSelector.x - 1][tileUnderSelector.y]);
							}

							adjacentTiles.forEach((tile) => {
								if (tile) {
									if (tile.type.key != 't_moon') {
										isAdjacentToStructure = true;
									}
								}
							});
						}

						if ((tileUnderSelector.type.key == 't_moon' || buildingTypes[buildingSelectedKey].canOverrideTile) && isAdjacentToStructure) {
							canPlace = true;
						}
		
						if (funds < buildingTypes[buildingSelectedKey].cost) {
							canPlace = false;
						}

						if (!hasPlacedHeadquarters && buildingTypes[buildingSelectedKey].key != 't_headquarters') {
							canPlace = false;
						}

						if (buildingSelectedKey == 'dynamite' && tileUnderSelector.type.key == 't_headquarters') {
							canPlace = false;
						}
					}
		
					if (tileUnderSelector && canPlace) {
						ctx.fillStyle = '#34f000';
		
						// for file size reasons, combine the update logic and rendering into the same condition
						if (isMouseDown) {
							tiles[tileSelectorMap.x][tileSelectorMap.y].type = buildingTypes[buildingSelectedKey];
		
							funds -= buildingTypes[buildingSelectedKey].cost;

							if (buildingSelectedKey == 'headquarters') {
								hasPlacedHeadquarters = true;
							}
						}
					}
					else {
						ctx.fillStyle = '#ff0000';
					}
					ctx.globalAlpha = 0.5;
					ctx.fillRect(tileSelector.x, tileSelector.y, tw, th);
					ctx.restore();
				}
		
				landers.forEach((lander) => {
					lander.render(ctx);
				});
		
		
				if (btnOreInsights) {
					btnOreInsights.render(ctx);
				}
		
				if (btnCategoryBuildings) {
					btnCategoryBuildings.render(ctx);
				}
		
		
		
				ctx.save();
				if (funds > 0) {
					ctx.fillStyle = '#fff';
				}
				else {
					ctx.fillStyle = '#ff0000';
				}
				ctx.font = '20px monospace';
				ctx.fillText('FUNDS: ' + funds, 16, 32);
		
				if (population > 0) {
					ctx.fillStyle = '#fff';
				}
				else {
					ctx.fillStyle = '#ff0000';
				}
				ctx.fillText('POPULATION: ' + population, 16, 56);
		
				ctx.fillStyle = '#fff';
				ctx.fillText('DAY: ' + day, 16, 80);
				if (buildingSelectedKey.length > 0) {
					ctx.drawImage(imgs[buildingTypes[buildingSelectedKey].key].el, 112, canvas.height - 72, 32, 32);

					ctx.fillText('Building: ' + buildingTypes[buildingSelectedKey].name, 112, canvas.height - 16);
				}
				else {
					if (!buildSelectionFirstClick) {
						ctx.fillText('<-- Click the build menu to select buildings', 112, canvas.height - 16);
					}
				}
		
		
				// ICONS
				// Power
				ctx.drawImage(imgs.i_power.el, canvas.width - 180, 16, 24, 24);
				if (powerAvailable > 0) {
					ctx.fillStyle = '#34f000';
				}
				else {
					ctx.fillStyle = '#ff0000';
				}
				ctx.fillText(powerAvailable, canvas.width - 180 + 32, 36);
		
				// O2
				ctx.drawImage(imgs.i_o2.el, canvas.width - 180, 48, 24, 24);
				if (o2Available > 0) {
					ctx.fillStyle = '#34f000';
				}
				else {
					ctx.fillStyle = '#ff0000';
				}
				ctx.fillText(o2Available, canvas.width - 180 + 32, 48 + 20);
		
				// H20
				ctx.drawImage(imgs.i_h2o.el, canvas.width - 180, 80, 24, 24);
				if (h2oAvailable > 0) {
					ctx.fillStyle = '#34f000';
				}
				else {
					ctx.fillStyle = '#ff0000';
				}
				ctx.fillText(h2oAvailable, canvas.width - 180 + 32, 80 + 20);
		
				// Ore
				ctx.drawImage(imgs.i_ore.el, canvas.width - 180, 112, 24, 24);
				ctx.fillStyle = '#fff';
				ctx.fillText(oreStored, canvas.width - 180 + 32, 132);
		
		
		
		
				if (showBuildingSelection) {
					ctx.save();
					ctx.fillStyle = '#0000ff';
					ctx.fillRect(96, canvas.height - 96, canvas.width - 96, 96);
					ctx.restore();
		
					btnBuildingSelectionLeft.render(ctx);
					btnBuildingSelectionRight.render(ctx);
		
					btnBuildings.forEach(function(btnBuilding) {
						if (funds >= btnBuilding.args.buildingType.cost) {
							btnBuilding.args.bgRecColor = '#34f000';
						}
						else {
							btnBuilding.args.bgRecColor = '#d1190d';
						}

						if (!hasPlacedHeadquarters && btnBuilding.args.buildingType.key != 't_headquarters') {
							btnBuilding.args.bgRecColor = '#d1190d';
						}
		
						btnBuilding.render(ctx, imgs);

						if (btnBuilding.tooltip) {
							btnBuilding.tooltip.x = mousePos.x;
							btnBuilding.tooltip.y = mousePos.y - btnBuilding.tooltip.h;
							if (btnBuilding.tooltip.x + btnBuilding.tooltip.w > canvas.width) {
								btnBuilding.tooltip.x = canvas.width - btnBuilding.tooltip.w;
							}
							btnBuilding.tooltip.y = canvas.height - 96 - btnBuilding.tooltip.h;
						}
					});
				}

				break;
			}
		}

		lastMouseDown = isMouseDown;

		elapsedTicks++;

	}, 33);


	function getMousePos(canv, evt) {
		let pointerX = evt.clientX == undefined ? evt.changedTouches[0].clientX : evt.clientX;
		let pointerY = evt.clientY == undefined ? evt.changedTouches[0].clientY : evt.clientY;

		var rect = canv.getBoundingClientRect();
		return {
			x: Math.round( (pointerX - rect.left) / (rect.right - rect.left) * canv.width ),
			y: Math.round( (pointerY - rect.top) / (rect.bottom - rect.top) * canv.height )
		};
	}

	function onPointerDown(e) {
		mousePos = getMousePos(canvas, e);
		lastMouseDown = isMouseDown;
		isMouseDown = true;
	}

	function onPointerMove(e) {
		mousePos = getMousePos(canvas, e);
	}
	
	function onPointerUp(e) {
		mousePos = getMousePos(canvas, e);
		isMouseDown = false;
	}

	onmousedown = onPointerDown;
	onmousemove = onPointerMove;
	onmouseup = onPointerUp;

	/*
	ontouchstart = onPointerDown;
	ontouchmove = onPointerMove;
	ontouchend = onPointerUp;
	ontouchcancel = onPointerUp;

    onkeydown = (e) => {
		var code;

		if (e.key != undefined) {
		  code = e.key;
		} else if (e.keyIdentifier != undefined) {
		  code = e.keyIdentifier;
		}

        if (!keys.includes(code)) {
            keys.push(code);
        }
    }

    onkeyup = (e) => {
        let code = e.which || e.keyCode || 0;

        for (let i = 0; i < keys.length; i++) {
            if (keys[i] == code) {
                keys.splice(i, 1);
            }
        }
    }*/
});