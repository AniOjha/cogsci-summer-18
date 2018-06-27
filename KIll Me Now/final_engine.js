function Behavior(eagerness,arousal,focus) {
	this.eagerness = eagerness;
	this.arousal = arousal;
	this.focus = focus;

	this.vibrate = function(basis,mean,count) {
		if (this.arousal > 0 && ((2 * count) % 3)) {
			var	vibrationvec = basis.multiply(Math.cos(mean.length) * this.vibrationAmplitude());
			return vibrationvec;
		} else {
			return new Point(0,0);
		}
	}

	this.vibrationAmplitude = function() {
		return this.arousal/1.5;
	}

	this.wanderSpeed = function(dt) {
		return (2500* dt);
	}

	this.wanderMagnitude = function() {
		return 20;
	}

	this.visionAngle = function() {
		return 100;
	}

	this.minDistance = function() {
		return 30;
	}

	this.threat = function() {
		return false;
	}

	this.pspace = function() {
		return 45;
	}

	this.minTimeUntilCollision = function() {
		return 40;
	}

}
function Locomotion(params) {
	this.behavior = params.behavior;

	this.shape = params.shape;
	this.mass = params.mass;
	this.velocity = params.velocity;
	this.speed = params.velocity.length;
	this.maxForce = params.maxForce;
	this.maxSpeed = params.maxSpeed;
	this.shape.position = new Point(params.point.x,params.point.y);
	this.position = this.shape.position;
	this.mean = new Point(this.position.x,this.position.y);
	this._wander_side = 0;
	this._wander_up = 0;

	this.basisParallel = new Point(1,0); 
	this.basisPerpendicular = new Point(0,-1);

	this._adjustForce = function(force,dt) {
		var maxAdjSpeed = this.maxSpeed * 0.2;
		if (this.velocity.length > maxAdjSpeed || force.length == 0) {
			return force;
		} else {
			var range = this.velocity.length/maxAdjSpeed;
			var cosine = scalar_interpolation(1.0,-1.0,Math.pow(range,20));
			return limit_max_deviation(force,cosine,this.basisParallel);
		}
	}

	this.steer = function(force,dt,count) {
		var acc = force.divide(this.mass);

		this.velocity = clip_length(this.velocity.add(acc.multiply(dt)),this.maxSpeed);
		this.speed = this.velocity.length;
		this.position = this.position.add(this.velocity.multiply(dt));

		this.basisParallel = this.velocity.normalize();
		this.basisPerpendicular = this.basisParallel.rotate(90);

		this.mean.x = this.position.x;
		this.mean.y = this.position.y;
		this.shape.position = this.mean.add(this.behavior.vibrate(this.basisPerpendicular,this.mean,count));
	}

	this.futurePosition = function(time) {
		return this.position.add(this.velocity.multiply(time));
	}

	this.steeringWander = function(dt) {
		var speed = this.behavior.wanderSpeed(dt); 
		this._wander_side = this.behavior.wanderMagnitude() * scalar_random_walk(this._wander_side,speed,-1,+1);
		this._wander_up = this.behavior.wanderMagnitude() * scalar_random_walk(this._wander_up,speed,-1,+1);
		var vx = this.basisParallel;
		var vy = this.basisPerpendicular;
		if (this.basisParallel.length == 0) {
			vx = new Point(1,0);
		} 
		if (this.basisPerpendicular.length == 0) {
			vy = new Point(0,-1);
		}
		var sideDist = vx.multiply(this._wander_side);
		var perpDist = vy.multiply(this._wander_up);
		return sideDist.add(perpDist);
	}

	this.xSteeringWander = function(dt) {
		var wanderRate = this.behavior.wanderSpeed(dt);
		var wanderStrength = this.behavior.wanderMagnitude();
		var displacement = random_vector(wanderRate);
		var wander = this.basisParallel.multiply(wanderStrength);
		wander = wander.add(displacement);
		return wander;
	}

	this.steeringSeek = function(target) {
		var desire = target.subtract(this.position);
		return (desire.subtract(this.velocity)).normalize().multiply(this.maxForce);
	}

	this.steeringFlee = function(target) {
		var desire = position.subtract(this.target);
		return (desire.subtract(this.velocity)).normalize().multiply(this.maxForce);
	}


	this.predictNearestApproachTime = function(other) {		
		var relative = other.velocity.subtract(this.velocity);
		var relativeSpeed = relative.length;
		if(relativeSpeed == 0){
			return 0;
		}
		var tanget = relative.normalize();
		var pos = this.position.subtract(other.position);
		var projection = tanget.dot(pos);
		return projection/relativeSpeed;
	}

	this.predictNearestApproachPosition = function(other,time) {
		var mytravel = this.velocity.multiply(time);
		var othertravel = other.velocity.multiply(time);
		var myfinal = this.position.add(mytravel);
		var otherfinal = other.shape.position.add(othertravel);
		return vector_distance(myfinal, otherfinal);
	}

	this.predictsloworfast = function(other,time) {
		var mytravel = this.velocity.multiply(time);
		var othertravel = other.velocity.multiply(time);
		var myfinal = this.position.add(mytravel);
		var otherfinal = other.shape.position.add(othertravel);
		fast = ((this.velocity.dot(myfinal.subtract(otherfinal)))>=0) ? 1:-1;
		return fast;
	}

	this.checkInCone = function(object) {
		var degToRad = 3.14/180;
		var halfangle = this.behavior.visionAngle() * degToRad; // PARAMETERISE
		var cus = Math.cos(halfangle);
		var line = object.shape.position.subtract(this.position);
		var direction = this.velocity.normalize;
		var ang = line.dot(direction);
		return (ang > cus);
	}

	this.steerToAvoidCollisions = function(parray) {
		if(parray.length) {
			var minSeparation = this.behavior.minSeparation(); //PARAMETERISE
			for(var i=0; i<parray.length; i++) {
				if(parray[i]!=this){
					if(this.checkInCone(parray[i])) {
						var dist = this.position.subtract(parray[i].shape.position);
						if(dist.length < minSeparation) {
							var vy = this.basisPerpendicular;
							var projn = dist.dot(vy);
							projn = (projn >= 0) ? 1:-1;
							return (vy.normalize()).multiply(20*projn*this.maxForce).add(this.velocity.normalize().multiply(-10*this.maxForce));
						}
					}
				}
			}

			var threat = this.behavior.threat();
			var pspace = this.behavior.pspace();
			var mintimeuntilcollision = this.behavior.minTimeUntilCollision();			//tune these

			var time, mintime = mintimeuntilcollision;
			var index = 0;
			for(var i=0; i<parray.length; i++) {
				if(parray[i]!=this){
				if(this.checkInCone(parray[i])) {
				time = this.predictNearestApproachTime(parray[i]);
				if(time >= 0 && time < mintime) {
					var mindist = this.predictNearestApproachPosition(parray[i], time);
					
					if(mindist < pspace) {
						mintime = time;
						threat = true;
						index = i;
					}
				}
				}
			}
			} 
			if(threat) {
				var obstacle = parray[index];
				var mindist = this.predictNearestApproachPosition(obstacle, mintime);
				var dist =(obstacle.position.subtract(this.position)).length
				var obs_future = obstacle.position.add(obstacle.velocity.multiply(mintime));
				var my_future = this.position.add(this.velocity.multiply(mintime));
				var my_unit = this.velocity.normalize();
				var my_side = my_unit.rotate(90);
				var obs_unit = obstacle.velocity.normalize();
				var parallelness = my_unit.dot(obs_unit);
        		var angle = 0.707, steer = 0;
        		if (parallelness < -1*angle)
        		{
            		var offset = obs_future.subtract(this.position);
            		var sideDot = offset.dot(my_side);
            		console.log(this.velocity);
            		console.log(obstacle.velocity);
            		steer = (sideDot >= 0) ? -3:3;
        		}
        		else
        		{
            		if (parallelness > angle)
            		{
                		offset = obstacle.position.subtract(this.position);
            			sideDot = offset.dot(my_side);
            			steer = (sideDot >= 0) ? -1 : 1;
            		}
            		else
            		{
                		if (obstacle.velocity.length <= this.velocity.length)
		                {	
                    		sideDot = my_side.dot(obstacle.velocity);
                    		steer = (sideDot >= 0) ? -1 : 1;
 
                		}
            		}
        		}
        		var fast = this.predictsloworfast(obstacle,mintime);
               	return(((my_side.multiply(steer)).multiply(5*this.maxForce)).add(this.velocity.normalize().multiply(fast*this.maxForce))).normalize().multiply(10*this.maxForce);

			} else {
				return new Point(0,0);
			}
		} else {
			return new Point(0,0);
		}
	}

}

function random_vector(mag) {
	var randomx = Math.random();
	var randomy = Math.random();
	var maxAngle = 2 * Math.PI;
	var dx = Math.cos(randomx * maxAngle);
	var dy = Math.cos(randomy * maxAngle);
	var rand_vec = new Point(dx,dy);
	rand_vec = rand_vec.normalize();
	return rand_vec.multiply(mag);	
}

function vector_distance(vec1,vec2) {
	var res = vec1.subtract(vec2);
	return res.length;
}

function scalar_random_walk(initial,walkspeed,min,max) {
	var next = initial + rand_range(-1*walkspeed,walkspeed);
	if (next < min) {
		return min;
	}
	if (next > max) {
		return max;
	}
	return next;
}

//Utility functions for various math ops
function limit_max_deviation(force,conecos,basis) {
	if (force.length == 0) {
		return force;
	}
	var sourcecos = basis.dot(force.normalize());
	if (sourcecos >= conecos) {
		return force;
	}
	var perp = force.subtract(basis.multiply(basis.dot(force)));
	var unitperp = perp.normalize();
	var perpDist = Math.sqrt(1 - (conecos * conecos));
	var c0 = basis.multiply(conecos);
	var c1 = unitperp.multiply(perpDist);
	return c0.add(c1).multiply(force.length);
}

function scalar_interpolation(x1,x2,t) {
	return x1 + ((x2 - x1) * t);
}

function vector_interpolation(v1,v2,t) {
	var dif = v2.subtract(v1);
	dif = dif.multiply(t);
	return v1.add(dif);
}

function blend_vec(t,newvec,smooth) {
	return vector_interpolation(smooth,newvec,clip_value(t,0,1))
}

function clip_value(val,min,max) {
	if (val < min) {
		return min;
	} else if (val > max) {
		return max;
	} else {
		return val;
	}
}

function  rand_range(min,max) {
	return min + Math.random() * (max - min);
}

function clip_length(vec,len) {
	if (vec.length > len) {
		return vec.normalize().multiply(len);
	} else {
		return vec;
	}
}